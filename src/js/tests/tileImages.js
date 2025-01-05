import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { mkdirp } from 'mkdirp';
import console from 'console';

const ZOOMLEVEL = 5;
const TILESIZE = 256;
const WEBPQUALITY = 90;

// Function to generate tiles
const generateTiles = async (imagePath, outputDir, baseImageName, maxZoom = 5) => {
    try {
        // Create the base folder for the image (e.g., basemap_hq)
        const baseFolderPath = path.join(outputDir, baseImageName);
        await mkdirp(baseFolderPath);

        const image = sharp(imagePath);
        const metadata = await image.metadata();

        // Loop through each zoom level (from 0 to maxZoom)
        for (let zoom = 0; zoom <= maxZoom; zoom++) {
            // Number of tiles in the X and Y directions for the current zoom level
            const numTilesX = Math.pow(2, zoom);
            const numTilesY = Math.pow(2, zoom);

            // Size of each tile at this zoom level
            const tileWidth = metadata.width / numTilesX;
            const tileHeight = metadata.height / numTilesY;

            // Stop creating tiles if the zoom level exceeds the maxZoom
            if (zoom > maxZoom) {
                break; // No need to continue beyond the maxZoom level
            }

            // Loop through each row (Y) and column (X) of tiles for this zoom level
            for (let y = 0; y < numTilesY; y++) {
                for (let x = 0; x < numTilesX; x++) {
                    // Calculate the left and top coordinates for the tile
                    const left = x * tileWidth;
                    const top = y * tileHeight;

                    // Tile naming convention: z_x_y.webp
                    const tilePath = path.join(baseFolderPath, `${zoom}_${x}_${y}.webp`);

                    // Create subdirectories for the tile (if necessary)
                    await mkdirp(path.dirname(tilePath));

                    // Extract the tile and resize it to 256x256
                    await image
                        .clone()
                        .extract({
                            left: left,
                            top: top,
                            width: tileWidth,
                            height: tileHeight,
                        })
                        .resize(TILESIZE, TILESIZE)
                        .webp({ quality: WEBPQUALITY })
                        .toFile(tilePath);

                    //console.log(`Tile saved at: ${tilePath}`);
                }
            }
        }

        console.log(`  -> ${imagePath} have been tiled successfully.`);
    } catch (error) {
        console.error(`Error generating tiles for ${imagePath}:`, error);
    }
};

// Function to process the images in a folder
const processImagesInFolder = async (folderPath, maxZoom = 5) => {
    try {
        const files = await fs.readdir(folderPath);

        // Loop through all files in the folder
        for (const file of files) {
            const filePath = path.join(folderPath, file);

            // If the file is a directory, process it recursively
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                await processImagesInFolder(filePath, maxZoom); // Pass maxZoom here as well
            } else if (stats.isFile() && file.match(/(basemap_hq|topomap_hq|terrainmap_hq)\.webp$/)) {
                // If the file matches one of the target image names, process it
                const baseImageName = file.replace('.webp', ''); // Remove the .webp extension
                await generateTiles(filePath, folderPath, baseImageName, maxZoom); // Save tiles in the same folder as base image
            }
        }
    } catch (error) {
        console.error('Error processing images:', error);
    }
};

const processAllMaps = async (mapsRootDir, maxZoom) => {
    try {
        console.log("Starting to tile all high quality maps images");
        console.log("It will take some hours to complete...");
        const startTime = Date.now(); // Record the start time

        const mapFolders = await fs.readdir(mapsRootDir);

        for (const folder of mapFolders) {
            const folderPath = path.join(mapsRootDir, folder);
            const stats = await fs.stat(folderPath);

            // Process only directories
            if (stats.isDirectory()) {
                console.log(`Processing map folder: ${folder}`);
                await processImagesInFolder(folderPath, maxZoom);
            } else {
                console.log(`Skipping non-folder: ${folder}`);
            }
        }

        const endTime = Date.now(); // Record the end time
        const elapsedTime = ((endTime - startTime) / 1000).toFixed(2); // Convert to seconds
        console.log(`All maps processed in ${elapsedTime} seconds.`);
    } catch (error) {
        console.error("Error processing map folders:", error);
    }
};

// Call this function for /maps/
const mapsDir = path.resolve('./public/maps');
processAllMaps(mapsDir, ZOOMLEVEL);

//const mapsDir = path.resolve('./public/maps/albasrah');
//processImagesInFolder(mapsDir, ZOOMLEVEL);