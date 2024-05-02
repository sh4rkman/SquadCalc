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
    initialize: function (url, options) {
        //L.setOptions(this, options); uncomment if custom options are needed
        L.ImageOverlay.prototype.initialize.call(this, url, options);
    },

    /**
     * Calculate heights for a given LatLng Point
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    getHeight: function(latlng){
        const ZSCALING = MAPS.find((elem, index) => index == globalData.activeMap).scaling;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var color;
        canvas.width = 1;
        canvas.height = 1;
        context.drawImage(this._image, -latlng.lng, latlng.lat, globalData.mapSize+1, globalData.mapSize+1);
        color = context.getImageData(0, 0, 1, 1).data;
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
            heightPath.push(globalData.minimap.heightmap.getHeight(start));
            start.lat += latDiff/STEP;
            start.lng += lngDiff/STEP;
        }
    
        return heightPath;
    },

});