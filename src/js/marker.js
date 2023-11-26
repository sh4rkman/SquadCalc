import L from "leaflet";
import  "./ellipse";

import shadowIconImg from "../img/icons/marker_shadow.png";
import mortarIconImg from "../img/icons/marker_mortar.png";
import ub32IconImg from "../img/icons/marker_ub32.png";
import targetIconImg from "../img/icons/marker_target.png";


import { globalData } from "./conf";
import { MAPS } from  "./maps";
import { getCalcFromUI } from "./utils";

// Define your custom marker class
export var squadMarker = L.Marker.extend({
    options: {},

    // Initialize method
    initialize: function (latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.on("dragstart", this._handleDragStart, this);
        this.on("dragend", this._handleDragEnd, this);
    },

    _handleDragStart: function () { $(".leaflet-marker-icon").css("cursor", "grabbing");},
    _handleDragEnd: function () {$(".leaflet-marker-icon").css("cursor", "grab");},

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
            opacity: 0.7,
            color: "#01d401",
            fillOpacity: 0,
            weight: 2,
            autoPan: false,
        };
        var circleOptions2 = {
            radius: globalData.activeWeapon.minDistance * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 0.5,
            color: "#b22222",
            fillOpacity: 0.1,
            weight: 1,
            autoPan: false,
        };

        squadMarker.prototype.initialize.call(this, latlng, options);

        // create the range marker
        this.options.minRangeMarker = L.circle(latlng, circleOptions2).addTo(globalData.markersGroup);
        this.options.rangeMarker = L.circle(latlng, circleOptions).addTo(globalData.markersGroup);
        
        if (this.options.minRangeMarker.getRadius() == 0) {
            this.options.minRangeMarker.setStyle({opacity: 0, fillOpacity: 0});
        }

        // custom events handlers
        this.on("drag", this._handleDrag, this);
        this.on("dblclick", this._handleDblclick, this);

    },

    updateWeapon: function(){

        // Update MinRange circle opacity
        if (this.options.minRangeMarker.getRadius() != 0) {
            this.options.minRangeMarker.setStyle({opacity: 0.5, fillOpacity: 0.1});
        }
        else {
            this.options.minRangeMarker.setStyle({opacity: 0, fillOpacity: 0});
        }

        //this.setIcon(ub32Icon);

    },


    _handleDrag: function (e) {
        // When dragging marker out of bounds, block it at the edge
        if (e.latlng.lng > 256) {e.latlng.lng = 257;}
        if (e.latlng.lat < -256 ) {e.latlng.lat = -257;}
        if (e.latlng.lng < 0) {e.latlng.lng = -1;}
        if (e.latlng.lat > 0) {e.latlng.lat = 1;}


        this.setLatLng(e.latlng);
        this.options.rangeMarker.setLatLng(e.latlng);
        this.options.minRangeMarker.setLatLng(e.latlng);
        globalData.activeTargetsMarkers.eachLayer(function (layer) {
            layer.updateCalc(layer.latlng);
        });
    },

    // Handle double click event to prevent placing target marker underneath weapon marker
    _handleDblclick: function () {},

});


export var squadTargetMarker = squadMarker.extend({
    options: {
        draggable: true,
        calcMarker: null,
        spreadMarker: null,
    },

    initialize: function (latlng, options) {
        var radiiElipse;
        var angleElipse;
        var results;
        var content;
        const mapScale = 256 / MAPS.find((elem, index) => index == globalData.activeMap).size;

        var popUpOptions = {
            closeButton: false,
            className: "calcPopup",
            autoClose: false,
            closeOnClick: false,
            closeOnEscapeKey: false,
            autoPan: false,
            minWidth: 0,
            offset: [32, 10],
        };

        var spreadOptions = {
            opacity: 0.5,
            color: "#b22222",
            weight: 1
        };

        squadMarker.prototype.initialize.call(this, latlng, options);

        results = getCalcFromUI(globalData.weaponGroup.getLatLng(), latlng);
        radiiElipse = [(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2];
        angleElipse = results.bearing;

        content = "<span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";

        this.addTo(globalData.activeTargetsMarkers);


        // Initiate calcPopup holding calcs
        this.options.calcMarker = L.popup(popUpOptions).setLatLng(latlng).openOn(globalData.map).addTo(globalData.markersGroup);
        this.options.calcMarker.setContent(content);
        
        // Initiate Spread Ellipse Marker
        this.options.spreadMarker = L.ellipse(latlng, radiiElipse, angleElipse, spreadOptions).addTo(globalData.markersGroup);
        if (results.elevation === "---" || results.ellipseParams.semiMajorAxis === 0) {
            this.options.spreadMarker.setStyle({opacity: 0, fillOpacity: 0});
        }
        else {
            this.options.spreadMarker.setRadius([(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2]);
            this.options.spreadMarker.setStyle({opacity: 0.2, fillOpacity: 0.2});
        }

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
    },

    updateCalc: function(){
        const mapScale = 256 / MAPS.find((elem, index) => index == globalData.activeMap).size;
        var results = getCalcFromUI(globalData.weaponGroup.getLatLng(), this.getLatLng());
        var content = "<span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
        
        // Update calcs and spread marker
        this.options.calcMarker.setContent(content);
        this.options.spreadMarker.setTilt(results.bearing);
        if (results.elevation === "---" || results.ellipseParams.semiMajorAxis === 0) {
            this.options.spreadMarker.setStyle({opacity: 0, fillOpacity: 0});
        }
        else {
            this.options.spreadMarker.setRadius([(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2]);
            this.options.spreadMarker.setStyle({opacity: 0.2, fillOpacity: 0.2});
        }
    },

    _handleClick: function() {
        this.remove();
        this.options.calcMarker.remove();
        this.options.spreadMarker.remove();
    },

    _handleDrag: function (e) {
        const mapScale = 256 / MAPS.find((elem, index) => index == globalData.activeMap).size;
        var content;
        var results = getCalcFromUI(globalData.weaponGroup.getLatLng(), this.getLatLng());

        // When dragging marker out of bounds, block it at the edge
        if (e.latlng.lng > 256) {e.latlng.lng = 257;}
        if (e.latlng.lat < -256 ) {e.latlng.lat = -257;}
        if (e.latlng.lng < 0) {e.latlng.lng = -1;}
        if (e.latlng.lat > 0) {e.latlng.lat = 1;}


        // Update marker, calc marker, spread marker
        this.setLatLng(e.latlng);
        this.options.calcMarker.setLatLng(e.latlng);
        this.options.spreadMarker.setLatLng(e.latlng);
        this.options.spreadMarker.setTilt(results.bearing);

        if (results.elevation === "---" || results.ellipseParams.semiMajorAxis === 0) {
            this.options.spreadMarker.setStyle({opacity: 0, fillOpacity: 0});
        }
        else {
            this.options.spreadMarker.setRadius([(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2]);
            this.options.spreadMarker.setStyle({opacity: 0.2, fillOpacity: 0.2});
        }
        
        content = "<span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
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


export var ub32Icon = L.icon({
    iconUrl: ub32IconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],  
});

export var targetIcon = L.icon({
    iconUrl: targetIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 35], 
    shadowSize:   [28, 35],
    iconAnchor:   [14, 35],
    shadowAnchor: [7.5, 35], 
});

