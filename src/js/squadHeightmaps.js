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
        let heightmapPath = `${this.map.activeMap.mapURL}heightmap.json`;
        this.json = [];
        this.loadHeightmapJson(heightmapPath);
    }


    /**
     * Load the heightmap from a JSON file
     * @param {string} [url] - URL to the JSON file
     */
    async loadHeightmapJson(url) {
        
        console.log("Loading heightmap:", url);

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
            heightPath.push(this.getHeight(START));
            START.lat += latDiff/STEP;
            START.lng += lngDiff/STEP;
        }
    
        return heightPath;
    }

}