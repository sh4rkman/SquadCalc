import { decode } from "fast-png";

/**
 * Squad Heightmap
 * Load an heightmap in memory and calculate heights for given LatLng Points
 * @class squadHeightmap
 */
export default class SquadHeightmap {

    /**
     * Load the heightmap for the given map
     * @param {LeafletMap} [map]
     */
    constructor(map) {
        this.map = map;
        this.width = 500;
        this.heightmapScaling = this.width / this.map.pixelSize;
        let heightmapPath = `${process.env.API_URL}${this.map.activeMap.mapURL}heightmap.json`;
        let heightmapPathPNG = `${process.env.API_URL}${this.map.activeMap.mapURL}heightmap.png`;
        this.json = [];
        this.jsonPng = [];
        this.scalingPNG = 0;
        this.loadHeightmapJson(heightmapPath);
        this.loadHeightmapPNG(heightmapPathPNG);
    }


    /**
     * Load the heightmap from a JSON file
     * @param {string} [url] - URL to the JSON file
     * @returns {Promise<boolean>} - Whether the JSON heightmap loaded successfully
     */
    async loadHeightmapJson(url) {

        try {
            const response = await fetch(url); // Fetch the JSON file
            if (!response.ok) {
                console.error(`Failed to load heightmap: ${url}`);
                console.error("  -> ", `HTTP ${response.status}`);
                return false;
            }
            this.json = await response.json();
            return true;
        } catch (error) {
            console.error("Failed to load heightmap:", url);
            console.error("  -> ", error);
            this.json = [];
            return false;
        }
    }


    /**
     * Load the heightmap from a PNG file
     * Decodes raw bytes with fast-png (no canvas, no fingerprinting issues)
     * Expects 8-bit greyscale (channels=1, depth=8): height = pixel * scale[2]
     * @param {string} [url] - URL to the PNG file
     */
    async loadHeightmapPNG(url) {

        if (!this.map.activeMap.SDK_data.heightmapPNG) return;

        const { scale } = this.map.activeMap.SDK_data.heightmapPNG;
        const heightScale = scale[2];

        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const img = decode(new Uint8Array(buffer));
            const { width, height, data } = img;
            console.log(`[PNG] depth:${img.depth} channels:${img.channels} size:${width}x${height} midPixel:${data[Math.floor(height / 2) * width + Math.floor(width / 2)]}`);
            this.scalingPNG = width / this.map.pixelSize;

            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) row.push(data[y * width + x] * heightScale);
                this.jsonPng.push(row);
            }
        } catch (error) {
            console.error("Failed to load PNG heightmap:", url);
            console.error("  -> ", error);
        }
    }


    /**
     * Calculate heights for a given LatLng Point
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Altitude
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    getHeight(latlng){

        if (this.png) return this.getPngHeight(latlng);

        // Fallback in case heightmap isn't supplied or didn't load
        if (!this.json || !Array.isArray(this.json)) return 0;

        const height = this.json.length;
        const width = Array.isArray(this.json[0]) ? this.json[0].length : 0;
        const row = Math.round(latlng.lat * -height / this.map.pixelSize);
        const col = Math.round(latlng.lng * width / this.map.pixelSize);
        let terrainHeight = 0; // Todo: Implement a better way to handle this, like returning infinity

        if (this.json[row] && typeof this.json[row][col] !== "undefined") {
            terrainHeight = this.json[row][col];
        }

        return terrainHeight;
    }


    /**
     * Calculate heights from a decoded PNG heightmap.
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    getPngHeight(latlng) {

        const row = Math.round(latlng.lat * -this.png.height / this.map.pixelSize);
        const col = Math.round(latlng.lng * this.png.width / this.map.pixelSize);
        let height = 0; // Todo: Implement a better way to handle this, like returning infinity

        if (row < 0 || col < 0 || row >= this.png.height || col >= this.png.width) return height;

        const pixelIndex = row * this.png.width + col;
        return this.png.data[pixelIndex] * this.png.heightScale;
    }

    
    getHeightPNG(latlng) {
        if (!this.jsonPng.length || !this.scalingPNG) return 0;

        const row = Math.round(latlng.lat * -this.scalingPNG);
        const col = Math.round(latlng.lng * this.scalingPNG);

        if (this.jsonPng[row] && typeof this.jsonPng[row][col] !== "undefined") {
            return this.jsonPng[row][col];
        }
        return 0;
    }


    /**
     * Calculate a path of heights between two points, with optional terrain margins
     * @param {LatLng} mortarLatlng
     * @param {LatLng} targetLatlng
     * @param {number} STEP - samples between weapon and target
     * @param {number} extraBefore - fraction of path to extend before weapon
     * @param {number} extraAfter  - fraction of path to extend after target
     * @returns {{ path: number[], weaponIndex: number, targetIndex: number }}
     */
    getHeightPath(mortarLatlng, targetLatlng, STEP = 100, extraBefore = 0.15, extraAfter = 0.15) {
        const latDiff = targetLatlng.lat - mortarLatlng.lat;
        const lngDiff = targetLatlng.lng - mortarLatlng.lng;

        const extraBeforeSteps = Math.round(STEP * extraBefore);
        const extraAfterSteps  = Math.round(STEP * extraAfter);
        const totalSteps = STEP + extraBeforeSteps + extraAfterSteps;

        const START = {
            lat: mortarLatlng.lat - latDiff * extraBefore,
            lng: mortarLatlng.lng - lngDiff * extraBefore,
        };
        const totalLatDiff = latDiff * (1 + extraBefore + extraAfter);
        const totalLngDiff = lngDiff * (1 + extraBefore + extraAfter);

        const path = [];
        for (let i = 0; i < totalSteps; i++) {
            path.push(this.getHeightPNG(START));
            START.lat += totalLatDiff / totalSteps;
            START.lng += totalLngDiff / totalSteps;
        }

        return {
            path,
            weaponIndex: extraBeforeSteps,
            targetIndex: extraBeforeSteps + STEP - 1,
        };
    }

}
