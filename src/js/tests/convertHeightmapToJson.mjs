// Script by sharkman to convert heightmaps from .webp to .json
// Each pixel are converted to a height value based on the color of the pixel
// using json allow to avoid browser/extension blocking canvas data extraction
// usage : node ./src/js/tests/convertHeightmapToJson.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const fs = require("fs");
import path from "path";
import { MAPS } from "../data/maps.js";


async function convertHeightmapToJSON(inputPath, outputPath, scalingFactor) {
    try {
        // Load the image and extract raw pixel data
        const { data, info } = await sharp(inputPath)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const width = info.width;
        const height = info.height;
        const heights = [];

        // Process each pixel to calculate the height
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const b = data[idx + 2];
                const heightValue = (255 + r - b) * scalingFactor;
                row.push(heightValue);
            }
            heights.push(row);
        }

        // Save the heights to a JSON file
        fs.writeFileSync(outputPath, JSON.stringify(heights));
        console.log(`  -> Heightmap converted to ${outputPath}`);
    } catch (err) {
        console.error("Error processing heightmap:", err);
    }
}

// Usage

const heightmapPath = path.resolve("./public/maps/");
console.log(`Scanning ${heightmapPath}`);

MAPS.forEach((map) => {
    const inputPath = path.resolve(`${heightmapPath}${map.mapURL}heightmap.webp`);
    const outputPath = path.resolve(`${heightmapPath}${map.mapURL}heightmap.json`);
    convertHeightmapToJSON(inputPath, outputPath, map.scaling);
});
