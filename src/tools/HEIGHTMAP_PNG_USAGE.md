# Heightmap JSON to PNG usage

This project can load PNG heightmaps without HTML canvas. The browser reads the
PNG as bytes, decodes it with `fast-png`, and uses the metadata from `maps.js` to
restore terrain height in meters.

## 1. Convert one map

Example for Yehorivka:

```powershell
python tools\heightmap_json_to_png.py `
  D:\DownLoads\Yehorivka\heightmap.json `
  public\img\maps\yehorivka\heightmap.png `
  --precision-m 1 `
  --format auto `
  --emit-js
```

If you want to keep/update your external `meta.json` as an archive artifact:

```powershell
python tools\heightmap_json_to_png.py `
  D:\DownLoads\Yehorivka\heightmap.json `
  public\img\maps\yehorivka\heightmap.png `
  --meta-json D:\DownLoads\Yehorivka\meta.json `
  --precision-m 1 `
  --format auto `
  --emit-js `
  --update-meta
```

`meta.json` is optional for the app. The app only needs `heightmap.png` and the
`heightmapPng` block in `src\data\maps.js`.

## 2. Add metadata to maps.js

The converter prints a block like this:

```js
heightmapPng: {
    file: "heightmap.png",
    encoding: "gray8",
    cols: 500,
    rows: 500,
    minHeightM: -12,
    precisionM: 1,
    downsample: 1,
}
```

Paste it into the target map object under `SDK_data`, next to the existing
`heightmap` block:

```js
SDK_data: {
    minimap: { ... },
    heightmap: { ... },
    heightmapPng: {
        file: "heightmap.png",
        encoding: "gray8",
        cols: 500,
        rows: 500,
        minHeightM: -12,
        precisionM: 1,
        downsample: 1,
    }
}
```

## 3. Where the app loads PNG from right now

Temporarily, PNG heightmaps are loaded from the project static path, not from
`API_URL`.

For a map with:

```js
mapURL: "/img/maps/yehorivka/"
```

the app requests:

```text
/img/maps/yehorivka/heightmap.png
```

So during local development, put the file here:

```text
public/img/maps/yehorivka/heightmap.png
```

The old JSON fallback still uses `API_URL`. If PNG metadata exists but the local
PNG is missing or invalid, the app will try the old `heightmap.json` fallback.

## 4. Format choices

Recommended default:

```powershell
--precision-m 1 --format auto
```

Use `gray8` when the encoded height range fits into `0..255`. Use `rgb16` when
the range is larger or you want smaller precision, for example:

```powershell
python tools\heightmap_json_to_png.py `
  D:\DownLoads\Yehorivka\heightmap.json `
  public\img\maps\yehorivka\heightmap.png `
  --precision-m 0.5 `
  --format rgb16 `
  --emit-js
```

Expected height error is roughly half the precision:

- `--precision-m 1`: about 0.5 m max quantization error.
- `--precision-m 0.5`: about 0.25 m max quantization error.

## 5. Quick check

After adding the PNG and `heightmapPng` metadata:

1. Start the dev server.
2. Open DevTools Network.
3. Select the converted map.
4. Confirm the browser requests `/img/maps/<map>/heightmap.png`.
5. Confirm it does not need canvas and does not call `getImageData`.
