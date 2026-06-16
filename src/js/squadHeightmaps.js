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
        const heightmapPng = this.map.activeMap.SDK_data?.heightmapPNG ?? this.map.activeMap.SDK_data?.heightmapPng;
        const legacyHeightmap = this.map.activeMap.SDK_data?.heightmap;

        try {
            let pngLoaded = false;

            if (heightmapPng) {
                pngLoaded = await this.loadHeightmapPng(`${this.map.activeMap.mapURL}${heightmapPng.file ?? "heightmap.png"}`);
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

        const metadata = this.map.activeMap.SDK_data.heightmapPNG;
        const heightScale = metadata?.scale?.[2];

        try {
            if (!Number.isFinite(heightScale) || heightScale <= 0) {
                console.error("Heightmap PNG metadata requires scale[2] greater than 0");
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
            const depth = image.depth ?? image.data.BYTES_PER_ELEMENT * 8;

            if (channels !== 1 || ![8, 16].includes(depth)) {
                console.error(`Heightmap PNG must be 8-bit or 16-bit grayscale, got channels=${channels}, depth=${depth}`);
                return false;
            }

            this.png = {
                data: image.data,
                width: image.width,
                height: image.height,
                heightScale,
            };

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
        return this.png.data[pixelIndex] * this.png.heightScale;
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
