
import L from "leaflet";
import mortarIconImg from "../img/icons/marker_mortar.png"
import targetIconImg from "../img/icons/marker_target.png"
import shadowIconImg from "../img/icons/marker_shadow.png"
import { globalData } from "./conf";
import { MAPS } from  "./maps"
import { getCalcFromUI } from "./utils"

// Define your custom marker class
export var squadMarker = L.Marker.extend({
    options: {

    },

    // Initialize method
    initialize: function (latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
    },
});



export var squadWeaponMarker = squadMarker.extend({
    options: {
        rangeMarker: null,
        autoPan: false,
    },

    initialize: function (latlng, options) {
        squadMarker.prototype.initialize.call(this, latlng, options);

        var circleOptions = {
            radius: globalData.activeWeapon.getMaxDistance() * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 1,
            color: "#01d401",
            fillOpacity: 0.05,
            weight: 2,
            autoPan: false,
        }

        // create the range marker
        this.options.rangeMarker = L.circle(latlng, circleOptions).addTo(globalData.markersGroup);
        this.on('drag', this._handleDrag, this);
    },

    _handleDrag: function (e) {
        this.options.rangeMarker.setLatLng(e.latlng)
        globalData.activeWeaponMarkers.eachLayer(function (layer) {
            layer.updateCalc(layer.latlng);
        });
    }
});


export var squadTargetMarker = squadMarker.extend({
    options: {
        draggable: true,
        calcMarker: null,
    },

    initialize: function (latlng, options) {
        squadMarker.prototype.initialize.call(this, latlng, options);
        var popUpOptions = {
            closeButton: false,
            className: 'calcPopup',
            autoClose: false,
            closeOnClick: false,
            closeOnEscapeKey: false,
            autoPan: false,
            interactive: false,
            offset: [0, 45],
        };

        this.addTo(globalData.activeWeaponMarkers)
        this.options.calcMarker = L.popup(popUpOptions).setLatLng(latlng).openOn(globalData.map).addTo(globalData.markersGroup);
        var calc = getCalcFromUI(globalData.activeWeaponMarker.getLatLng(), latlng);
        var content = "<p>" + calc[0].toFixed(1) + " - " +  calc[1].toFixed(globalData.activeWeapon.elevationPrecision) + "</p>";
        this.options.calcMarker.setContent(content);

        this.on('click', this._handleClick, this);
        this.on('drag', this._handleDrag, this);
        this.on('dragstart', this._handleDragStart, this);
        this.on('dragend', this._handleDragEnd, this);
    },

    updateCalc: function(e){
        var calc = getCalcFromUI(globalData.activeWeaponMarker.getLatLng(), this.getLatLng());
        var content = "<p>" + calc[0].toFixed(1) + " - " +  calc[1].toFixed(globalData.activeWeapon.elevationPrecision) + "</p>";
        this.options.calcMarker.setContent(content);
    },

    _handleClick: function (e) {
        this.remove()
        this.options.calcMarker.remove()
    },

    _handleDrag: function (e) {
        this.options.calcMarker.setLatLng(e.latlng)
        var calc = getCalcFromUI(globalData.activeWeaponMarker.getLatLng(), e.target.getLatLng());
        var content = "<p>" + calc[0].toFixed(1) + " - " +  calc[1].toFixed(globalData.activeWeapon.elevationPrecision) + "</p>";
        this.options.calcMarker.setContent(content);
    },

    _handleDragStart: function (e) {
        //this.options.calcMarker.close();
    },

    _handleDragEnd: function (e) {
        //this.options.calcMarker.openOn(globalData.map);
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

