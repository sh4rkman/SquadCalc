import { App } from "../app";

export default class SquadHeightmap {

    /**
     * Initialize heightmap Canvas
     * @param {string} [url] - heightmap URL
     * @param {Array} [options]
     * @param {L.map} [map]
     */
    constructor(map) {
        var img = new Image();
        this.map = map;
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d", {willReadFrequently: true});
        this.canvas.height = 1000;
        this.canvas.width = 1000;
        this.heightmapScaling = this.canvas.height / this.map.tilesSize;

        img.src = `maps${this.map.activeMap.mapURL}heightmap.webp`;
        img.onload = (function(heightmap){
            return function() {
                heightmap.ctx.drawImage(img, 0, 0, heightmap.canvas.width, heightmap.canvas.height);
                App.shoot();
            };
        })(this);
    }

    /**
     * Calculate heights for a given LatLng Point
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Altitude
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    getHeight(latlng){
        var color = this.ctx.getImageData(Math.round(latlng.lng * this.heightmapScaling), Math.round(latlng.lat * -this.heightmapScaling), 1, 1).data;
        if (color[0] + color[2] === 0) return 0; // out of map
        else return ( (255 + color[0] - color[2]) * this.map.activeMap.scaling );
    }

    /**
     * Calculate a path of heights between two points
     * @param {LatLng} [mortarLatlng] - LatLng Point
     * @param {LatLng} [targetLatlng] - LatLng Point
     * @returns {Array} - Array containing all the Heights between weapon and Target in meters
     */
    getHeightPath(mortarLatlng, targetLatlng, STEP = 100) {
        var heightPath = [];
        var start = {lat: mortarLatlng.lat, lng: mortarLatlng.lng};
        var end = {lat:targetLatlng.lat, lng:targetLatlng.lng};
        var latDiff =  end.lat - start.lat;
        var lngDiff =  end.lng - start.lng;
        
        for (let i=0; i < STEP; i++){
            heightPath.push(this.getHeight(start));
            start.lat += latDiff/STEP;
            start.lng += lngDiff/STEP;
        }
    
        return heightPath;
    }

}