import L from "leaflet";
import { MAPS } from "./maps";
import { globalData } from "./conf";

export default L.ImageOverlay.extend({
    options: {

    },

    /**
     * Calculate heights for a given LatLng Point
     * @param {url} [url] - image URL to display
     * @param {options} [options]
     */
    initialize: function (url, bounds) {
        //L.setOptions(this, options); uncomment if custom options are needed
        L.ImageOverlay.prototype.initialize.call(this, url, bounds);
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d", {willReadFrequently: true});
        this.canvas.height = 1000;
        this.canvas.width = 1000;

        this.on("load", function(){
            this.heightmapScaling = this.canvas.height / globalData.mapSize;
            this.ctx.drawImage(this._image, 0, 0, this.canvas.width, this.canvas.height);
        });

    },

    /**
     * Calculate heights for a given LatLng Point
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    getHeight: function(latlng){
        const ZSCALING = MAPS.find((elem, index) => index == globalData.activeMap).scaling;
        var color;
        color = this.ctx.getImageData(latlng.lng * this.heightmapScaling, latlng.lat * -this.heightmapScaling, 1, 1).data;
        return (255 + color[0] - color[2]) * ZSCALING;
    },

    /**
     * Calculate a path of heights between two points
     * @param {LatLng} [mortarLatlng] - LatLng Point
     * @param {LatLng} [targetLatlng] - LatLng Point
     * @returns {Array} - containing all the heights between mortarLatlng and targetLatlng in meters
     */
    getHeightPath: function(mortarLatlng, targetLatlng, STEP = 100) {
        var heightPath = [];
        var start = new L.latLng(mortarLatlng.lat, mortarLatlng.lng);
        var end = new L.latLng(targetLatlng.lat, targetLatlng.lng);
        var latDiff =  end.lat - start.lat;
        var lngDiff =  end.lng - start.lng;
        
        for (let i=0; i < STEP; i++){
            heightPath.push(this.getHeight(start));
            start.lat += latDiff/STEP;
            start.lng += lngDiff/STEP;
        }
    
        return heightPath;
    },

});