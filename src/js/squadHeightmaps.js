import { decode } from "fast-png";

/**
 * Squad Heightmap
 * Load an heightmap in memory and calculate heights for given LatLng Points
 * @class squadHeightmap
 */
export default class SquadHeightmap {

    /**
     * Load the heightmap for the given map
     * @param {L.map} [map]
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
     */
    async loadHeightmapJson(url) {
        
        // If no heightmap is provided, don't look for a .json file
        if (!this.map.activeMap.SDK_data.heightmap) return;

        try {
            const response = await fetch(url); // Fetch the JSON file
            let data = await response.json();
            this.json = data;
        } catch (error) {
            console.error("Failed to load heightmap:", url);
            console.error("  -> ", error);
        }
        
        $(document).trigger("heightmap:loaded");
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
     * Calculate a path of heights between two points
     * @param {LatLng} [mortarLatlng] - LatLng Point
     * @param {LatLng} [targetLatlng] - LatLng Point
     * @returns {Array} - Array containing all the Heights between weapon and Target in meters
     */
    getHeightPath(mortarLatlng, targetLatlng, STEP = 100) {
        const END = {lat: targetLatlng.lat, lng: targetLatlng.lng};
        const START = {lat: mortarLatlng.lat, lng: mortarLatlng.lng};
        const heightPath = [];
        const latDiff =  END.lat - START.lat;
        const lngDiff =  END.lng - START.lng;
        
        for (let i=0; i < STEP; i++){
            heightPath.push(this.getHeightPNG(START));
            START.lat += latDiff/STEP;
            START.lng += lngDiff/STEP;
        }
    
        return heightPath;
    }

}