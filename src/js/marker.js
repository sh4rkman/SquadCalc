import L from "leaflet";
import mortarIconImg from "../img/icons/marker_mortar.png";
import targetIconImg from "../img/icons/marker_target.png";
import shadowIconImg from "../img/icons/marker_shadow.png";

import { globalData } from "./conf";
import { MAPS } from  "./maps";
import { getCalcFromUI } from "./utils";

// Define your custom marker class
export var squadMarker = L.Marker.extend({
    options: {

    },

    // Initialize method
    initialize: function (latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.on("dragstart", this._handleDragStart, this);
        this.on("dragend", this._handleDragEnd, this);
    },

    _handleDragStart: function () {
        $(".leaflet-marker-icon").css("cursor", "grabbing");
    },
    
    _handleDragEnd: function () {
        $(".leaflet-marker-icon").css("cursor", "grab");
    },


});



export var squadWeaponMarker = squadMarker.extend({
    options: {
        rangeMarker: null,
        minRangeMarker: null,
        autoPan: false,
    },

    initialize: function (latlng, options) {
        var circleOptions = {
            radius: globalData.activeWeapon.getMaxDistance() * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 1,
            color: "#01d401",
            fillOpacity: 0,
            weight: 2,
            autoPan: false,
        };
        var circleOptions2 = {
            radius: globalData.activeWeapon.minDistance * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 0.5,
            color: "red",
            fillOpacity: 0.1,
            weight: 1,
            autoPan: false,
        };

        squadMarker.prototype.initialize.call(this, latlng, options);

        // create the range marker
        this.options.minRangeMarker = L.circle(latlng, circleOptions2).addTo(globalData.markersGroup);
        this.options.rangeMarker = L.circle(latlng, circleOptions).addTo(globalData.markersGroup);
        
        // custom events handlers
        this.on("drag", this._handleDrag, this);
        this.on("dblclick", this._handleDblclick, this);

    },

    _handleDrag: function (e) {
        this.options.rangeMarker.setLatLng(e.latlng);
        this.options.minRangeMarker.setLatLng(e.latlng);
        globalData.activeWeaponMarkers.eachLayer(function (layer) {
            layer.updateCalc(layer.latlng);
        });
    },

    // Handle double click event to prevent placing target marker underneath weapon marker
    _handleDblclick: function () {
    },

});


export var squadTargetMarker = squadMarker.extend({
    options: {
        draggable: true,
        calcMarker: null,
    },

    initialize: function (latlng, options) {
        var calc;
        var content;
        var popUpOptions = {
            closeButton: false,
            className: "calcPopup",
            autoClose: false,
            closeOnClick: false,
            closeOnEscapeKey: false,
            autoPan: false,
            interactive: false,
            offset: [45, 0],
        };

        squadMarker.prototype.initialize.call(this, latlng, options);

        this.addTo(globalData.activeWeaponMarkers);
        this.options.calcMarker = L.popup(popUpOptions).setLatLng(latlng).openOn(globalData.map).addTo(globalData.markersGroup);
        calc = getCalcFromUI(globalData.activeWeaponMarker.getLatLng(), latlng);
        content = "<span>" + calc[1] + "</span></br><span class='bearingUiCalc'>" +  calc[0] + "°</span>";
        this.options.calcMarker.setContent(content);

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
    },

    updateCalc: function(){
        var calc = getCalcFromUI(globalData.activeWeaponMarker.getLatLng(), this.getLatLng());
        var content = "<span>" + calc[1] + "</span></br><span class='bearingUiCalc'>" +  calc[0] + "°</span>";
        this.options.calcMarker.setContent(content);
    },

    _handleClick: function() {
        this.remove();
        this.options.calcMarker.remove();

    },

    _handleDrag: function (e) {
        var calc;
        var content;

        this.options.calcMarker.setLatLng(e.latlng);
        calc = getCalcFromUI(globalData.activeWeaponMarker.getLatLng(), e.target.getLatLng());
        content = "<span>" + calc[1] + "</span></br><span class='bearingUiCalc'>" +  calc[0] + "°</span>";
        this.options.calcMarker.setContent(content);
    },
});


export var mortarIcon = L.icon({
    iconUrl: mortarIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],  
});

export var targetIcon = L.icon({
    iconUrl: targetIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47], 
});

