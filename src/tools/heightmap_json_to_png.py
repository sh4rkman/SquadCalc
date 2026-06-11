#!/usr/bin/env python3
"""
Convert a SquadCalc heightmap JSON into a compact PNG for client-side lookup.

The browser runtime does not need meta.json. Use --emit-js to print the
heightmapPng block that should be copied into src/data/maps.js.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image


def load_heightmap(path: Path) -> np.ndarray:
    print(f"Reading height JSON: {path}")
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    heights = np.asarray(data, dtype=np.float32)
    if heights.ndim != 2:
        raise ValueError(f"Expected a 2D array, got shape {heights.shape}")
    if heights.size == 0:
        raise ValueError("Heightmap is empty")
    if not np.isfinite(heights).all():
        raise ValueError("Heightmap contains NaN or Infinity")

    print(f"Loaded: cols={heights.shape[1]}, rows={heights.shape[0]}")
    return heights


def load_meta(path: Path | None) -> dict[str, Any]:
    if path is None:
        return {}

    print(f"Reading meta: {path}")
    with path.open("r", encoding="utf-8") as file:
        meta = json.load(file)

    if not isinstance(meta, dict):
        raise ValueError("meta.json must contain a JSON object")

    return meta


def check_declared_grid(meta: dict[str, Any], heights: np.ndarray) -> None:
    declared_cols = meta.get("grid_cols")
    declared_rows = meta.get("grid_rows")

    if declared_cols is None or declared_rows is None:
        return

    rows, cols = heights.shape
    if int(declared_cols) != cols or int(declared_rows) != rows:
        print(
            "WARNING: JSON shape does not match meta grid size: "
            f"json={cols}x{rows}, meta={declared_cols}x{declared_rows}"
        )


def downsample_mean(heights: np.ndarray, factor: int) -> np.ndarray:
    if factor <= 1:
        return heights

    rows, cols = heights.shape
    new_rows = rows // factor
    new_cols = cols // factor

    if new_rows <= 0 or new_cols <= 0:
        raise ValueError("--downsample is too large for this heightmap")

    cropped = heights[: new_rows * factor, : new_cols * factor]
    downsampled = cropped.reshape(new_rows, factor, new_cols, factor).mean(axis=(1, 3))

    print(f"Downsampled: {cols}x{rows} -> {new_cols}x{new_rows}, factor={factor}")
    return downsampled.astype(np.float32, copy=False)


def encode_heights(heights: np.ndarray, min_height_m: float, precision_m: float) -> np.ndarray:
    if precision_m <= 0:
        raise ValueError("--precision-m must be greater than 0")

    encoded = np.rint((heights - min_height_m) / precision_m).astype(np.int64)
    min_encoded = int(encoded.min())
    max_encoded = int(encoded.max())

    if min_encoded < 0:
        raise ValueError(
            f"Encoded values start below zero: {min_encoded}. "
            "Use a lower --min-height-m."
        )

    print(f"Encoded range: {min_encoded}..{max_encoded}")
    return encoded


def choose_format(encoded: np.ndarray, requested_format: str) -> str:
    if requested_format != "auto":
        return requested_format
    return "gray8" if int(encoded.max()) <= 255 else "rgb16"


def write_png(encoded: np.ndarray, output_path: Path, output_format: str) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_format == "gray8":
        if int(encoded.max()) > 255:
            raise ValueError(
                "gray8 supports only 0..255 encoded values. "
                "Use --format rgb16 or increase --precision-m."
            )

        image = Image.fromarray(encoded.astype(np.uint8), mode="L")
        image.save(output_path, format="PNG", optimize=True, compress_level=9)
        return

    if output_format == "rgb16":
        if int(encoded.max()) > 65535:
            raise ValueError("rgb16 supports only 0..65535 encoded values. Increase --precision-m.")

        encoded16 = encoded.astype(np.uint16)
        rgb = np.zeros((encoded.shape[0], encoded.shape[1], 3), dtype=np.uint8)
        rgb[..., 0] = (encoded16 >> 8).astype(np.uint8)
        rgb[..., 1] = (encoded16 & 255).astype(np.uint8)

        image = Image.fromarray(rgb, mode="RGB")
        image.save(output_path, format="PNG", optimize=True, compress_level=9)
        return

    raise ValueError(f"Unsupported format: {output_format}")


def update_meta(
    meta_path: Path,
    meta: dict[str, Any],
    *,
    output_path: Path,
    output_format: str,
    source_cols: int,
    source_rows: int,
    cols: int,
    rows: int,
    min_height_m: float,
    precision_m: float,
    downsample: int,
) -> None:
    meta["heightmap_png"] = {
        "file": output_path.name,
        "encoding": output_format,
        "cols": cols,
        "rows": rows,
        "source_cols": source_cols,
        "source_rows": source_rows,
        "downsample": downsample,
        "min_height_m": min_height_m,
        "precision_m": precision_m,
    }

    backup_path = meta_path.with_suffix(meta_path.suffix + ".bak")
    if not backup_path.exists():
        backup_path.write_text(meta_path.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"Backup written: {backup_path}")

    with meta_path.open("w", encoding="utf-8") as file:
        json.dump(meta, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(f"Updated meta: {meta_path}")


def emit_js_block(
    *,
    output_path: Path,
    output_format: str,
    cols: int,
    rows: int,
    min_height_m: float,
    precision_m: float,
    downsample: int,
) -> None:
    print()
    print("heightmapPng: {")
    print(f'    file: "{output_path.name}",')
    print(f'    encoding: "{output_format}",')
    print(f"    cols: {cols},")
    print(f"    rows: {rows},")
    print(f"    minHeightM: {min_height_m:.6g},")
    print(f"    precisionM: {precision_m:.6g},")
    print(f"    downsample: {downsample},")
    print("}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert a SquadCalc heightmap JSON to a compact quantized PNG."
    )
    parser.add_argument("input_json", type=Path)
    parser.add_argument("output_png", type=Path)
    parser.add_argument(
        "--meta-json",
        type=Path,
        default=None,
        help="Optional meta.json for validation or --update-meta.",
    )
    parser.add_argument(
        "--precision-m",
        type=float,
        default=1.0,
        help="Height precision in meters. Default: 1.0",
    )
    parser.add_argument(
        "--min-height-m",
        type=float,
        default=None,
        help="Encoding base height. Default: meta.height_min_m or data min.",
    )
    parser.add_argument(
        "--format",
        choices=["auto", "gray8", "rgb16"],
        default="auto",
        help="PNG encoding. Default: auto",
    )
    parser.add_argument(
        "--downsample",
        type=int,
        default=1,
        help="Spatial downsample factor using block mean. Default: 1",
    )
    parser.add_argument(
        "--emit-js",
        action="store_true",
        help="Print the heightmapPng block for src/data/maps.js.",
    )
    parser.add_argument(
        "--update-meta",
        action="store_true",
        help="Add a heightmap_png section to --meta-json.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    heights = load_heightmap(args.input_json)
    meta = load_meta(args.meta_json)
    check_declared_grid(meta, heights)

    source_rows, source_cols = heights.shape
    heights = downsample_mean(heights, args.downsample)

    min_height_m = (
        float(args.min_height_m)
        if args.min_height_m is not None
        else float(meta.get("height_min_m", np.min(heights)))
    )

    print(f"Height range: {float(np.min(heights)):.6f}..{float(np.max(heights)):.6f} m")
    print(f"Encoding base minHeightM={min_height_m}, precisionM={args.precision_m}")

    encoded = encode_heights(heights, min_height_m, args.precision_m)
    output_format = choose_format(encoded, args.format)
    write_png(encoded, args.output_png, output_format)

    rows, cols = heights.shape

    print(f"Wrote: {args.output_png}")
    print(f"PNG encoding: {output_format}")
    print(f"PNG dimensions: {cols}x{rows}")
    print(f"PNG size: {args.output_png.stat().st_size / 1024:.1f} KiB")

    if args.emit_js:
        emit_js_block(
            output_path=args.output_png,
            output_format=output_format,
            cols=cols,
            rows=rows,
            min_height_m=min_height_m,
            precision_m=args.precision_m,
            downsample=args.downsample,
        )

    if args.update_meta:
        if args.meta_json is None:
            raise ValueError("--update-meta requires --meta-json")
        update_meta(
            args.meta_json,
            meta,
            output_path=args.output_png,
            output_format=output_format,
            source_cols=source_cols,
            source_rows=source_rows,
            cols=cols,
            rows=rows,
            min_height_m=min_height_m,
            precision_m=args.precision_m,
            downsample=args.downsample,
        )


if __name__ == "__main__":
    main()
