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
        
        // If no heightmap is provided, don't look for a .json file
        if (!this.map.activeMap.SDK_data.heightmap) return;

        try {
            const response = await fetch(url); // Fetch the JSON file
            let data = await response.json();
            this.json = data;
        } catch (error) {
            console.error("[HEIGHTMAP] Failed to load heightmap:", url);
            console.error("[HEIGHTMAP]   -> ", error);
        }
        
        $(document).trigger("heightmap:loaded");
    }


    /**
     * Load the heightmap from a PNG file
     * Decodes raw bytes with fast-png (no canvas, no fingerprinting issues)
     * Expects 8-bit-per-channel R/B images: height = (255 + r - b) * scale[2]
     * @param {string} [url] - URL to the PNG file
     * @returns {Promise<boolean>} - Whether the heightmap loaded successfully
     */
    async loadHeightmapPNG(url) {

        if (!this.map.activeMap.SDK_data.heightmapPNG) return;

        const { scale } = this.map.activeMap.SDK_data.heightmapPNG;
        const heightScale = scale[2];

        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const img = decode(new Uint8Array(buffer));
            const { width, height, data, channels } = img;

            console.debug (`[HEIGHTMAP] Loaded ${url}`)
            console.debug(`[HEIGHTMAP] depth:${img.depth} channels:${channels} size:${width}x${height} precision: ${Math.round(heightScale * 100)}cm`);

            this.scalingPNG = width / this.map.pixelSize;

            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * channels;
                    const r = data[idx];
                    const b = data[idx + 2];
                    const raw = 255 + r - b;
                    row.push(raw * heightScale);
                }
                this.jsonPng.push(row);
            }
        } catch (error) {
            console.error("[HEIGHTMAP] Failed to load PNG heightmap:", url);
            console.error("[HEIGHTMAP]   -> ", error);
        }
    }


    /**
     * Calculate heights for a given LatLng Point
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Altitude
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    getHeightOLD(latlng){

        // Fallback in case heightmap isn't supplied or didn't load
        if (!this.json || !Array.isArray(this.json)) return 0;

        const row = Math.round(latlng.lat * -this.heightmapScaling);
        const col = Math.round(latlng.lng * this.heightmapScaling);
        let height = 0; // Todo: Implement a better way to handle this, like returning infinity

        if (this.json[row] && typeof this.json[row][col] !== "undefined") {
            height = this.json[row][col];
        }
        
        return height;
    }

    
    getHeight(latlng) {
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
            path.push(this.getHeight(START));
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