import { decode } from "fast-png";

/**
 * @typedef {import("leaflet").LatLng} LatLng
 * @typedef {import("leaflet").Map} LeafletMap
 */

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
        this.png = null;
        this.json = [];
        this.loadHeightmap();
    }


    /**
     * Load the heightmap from the best available source.
     */
    async loadHeightmap() {
        const heightmapPng = this.map.activeMap.SDK_data?.heightmapPng;
        const legacyHeightmap = this.map.activeMap.SDK_data?.heightmap;

        try {
            let pngLoaded = false;

            if (heightmapPng) {
                pngLoaded = await this.loadHeightmapPng(`${this.map.activeMap.mapURL}${heightmapPng.file}`);
            }

            if (!pngLoaded && legacyHeightmap) {
                await this.loadHeightmapJson(`${process.env.API_URL}${this.map.activeMap.mapURL}heightmap.json`);
            }
        } finally {
            $(document).trigger("heightmap:loaded");
        }
    }


    /**
     * Load the heightmap from a PNG file.
     * @param {string} [url] - URL to the PNG file
     * @returns {Promise<boolean>} - Whether the PNG heightmap loaded successfully
     */
    async loadHeightmapPng(url) {

        const metadata = this.map.activeMap.SDK_data.heightmapPng;

        try {
            if (!["gray8", "rgb16"].includes(metadata.encoding)) {
                console.error(`Unsupported heightmap PNG encoding: ${metadata.encoding}`);
                return false;
            }
            if (!Number.isFinite(metadata.minHeightM) || !Number.isFinite(metadata.precisionM)) {
                console.error("Heightmap PNG metadata requires finite minHeightM and precisionM");
                return false;
            }

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to load heightmap: ${url}`);
                console.error("  -> ", `HTTP ${response.status}`);
                return false;
            }

            const bytes = new Uint8Array(await response.arrayBuffer());
            const image = decode(bytes);
            const channels = image.channels ?? image.data.length / (image.width * image.height);

            if (metadata.encoding === "rgb16" && channels < 2) {
                console.error(`rgb16 heightmap PNG requires at least 2 channels, got ${channels}`);
                return false;
            }

            this.png = {
                data: image.data,
                width: image.width,
                height: image.height,
                channels,
                encoding: metadata.encoding,
                minHeightM: metadata.minHeightM,
                precisionM: metadata.precisionM,
            };

            if (metadata.cols && metadata.cols !== image.width) {
                console.warn(`Heightmap PNG width mismatch for ${this.map.activeMap.name}: expected ${metadata.cols}, got ${image.width}`);
            }
            if (metadata.rows && metadata.rows !== image.height) {
                console.warn(`Heightmap PNG height mismatch for ${this.map.activeMap.name}: expected ${metadata.rows}, got ${image.height}`);
            }

            return true;
        } catch (error) {
            console.error("Failed to load heightmap:", url);
            console.error("  -> ", error);
            this.png = null;
            return false;
        }
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
        let encodedHeight;

        if (this.png.encoding === "gray8") {
            encodedHeight = this.png.data[pixelIndex];
        } else if (this.png.encoding === "rgb16") {
            const offset = pixelIndex * this.png.channels;
            encodedHeight = (this.png.data[offset] << 8) | this.png.data[offset + 1];
        } else {
            return height;
        }

        return this.png.minHeightM + encodedHeight * this.png.precisionM;
    }

    
    /**
     * Calculate a path of heights between two points
     * @param {LatLng} [mortarLatlng] - LatLng Point
     * @param {LatLng} [targetLatlng] - LatLng Point
     * @param {number} [STEP=100] - Number of samples between weapon and target
     * @returns {Array} - Array containing all the Heights between weapon and Target in meters
     */
    getHeightPath(mortarLatlng, targetLatlng, STEP = 100) {
        const END = {lat: targetLatlng.lat, lng: targetLatlng.lng};
        const START = {lat: mortarLatlng.lat, lng: mortarLatlng.lng};
        const heightPath = [];
        const latDiff =  END.lat - START.lat;
        const lngDiff =  END.lng - START.lng;
        
        for (let i=0; i < STEP; i++){
            heightPath.push(this.getHeight(START));
            START.lat += latDiff/STEP;
            START.lng += lngDiff/STEP;
        }
    
        return heightPath;
    }

}
