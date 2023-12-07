import L from "leaflet";
import "./ellipse";


import shadowIconImg from "../img/icons/marker_shadow.png";
import mortarIconImg from "../img/icons/marker_mortar_0.png";
import mortarIconImg1 from "../img/icons/marker_mortar_1.png";
import mortarIconImg2 from "../img/icons/marker_mortar_2.png";
import targetIconImg from "../img/icons/marker_target.png";

import { globalData } from "./conf";
import { MAPS } from  "./maps";
import { getCalcFromUI } from "./utils";

/*
 * Global Squad Marker Class 
*/
export var squadMarker = L.Marker.extend({
    options: {
        draggable: true,
        riseOnHover: true,
        animate: true,
    },

    // Initialize method
    initialize: function (latlng, options) {

        L.Marker.prototype.initialize.call(this, latlng, options);
        this.on("dragstart", this._handleDragStart, this);
        this.on("dragend", this._handleDragEnd, this);
    },

    /**
     * Force a given event to stay inside the map bounds
     * @param {e} [event] - event
     * @returns {e} - same event with latlng corrected
     */
    keepOnMap: function(e){
        if (e.latlng.lng > 256) {e.latlng.lng = 257;}
        if (e.latlng.lat < -256 ) {e.latlng.lat = -257;}
        if (e.latlng.lng < 0) {e.latlng.lng = -1;}
        if (e.latlng.lat > 0) {e.latlng.lat = 1;}
        return e;
    },

    _handleDragStart: function () { $(".leaflet-marker-icon").css("cursor", "grabbing");},
    _handleDragEnd: function () {$(".leaflet-marker-icon").css("cursor", "grab");},

});

export var squadWeaponMarker = squadMarker.extend({
    options: {
        autoPan: false,
    },

    initialize: function (latlng, options) {

        this.maxDistCircleOn = {
            radius: globalData.activeWeapon.getMaxDistance() * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 0.7,
            color: "#00137f",
            fillOpacity: 0,
            weight: 2,
            autoPan: false,
            renderer: L.svg({padding: 3}),
        };

        this.minDistCircleOn = {
            radius: globalData.activeWeapon.minDistance * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 0.7,
            color: "#00137f",
            fillOpacity: 0.2,
            weight: 1,
            autoPan: false,
            renderer: L.svg({padding: 3}),
        };

        this.minMaxDistCircleOff = {
            opacity: 0,
            fillOpacity: 0,
        };

        squadMarker.prototype.initialize.call(this, latlng, options);

        // Create the min/max range markers
        this.minRangeMarker = L.circle(latlng, this.minDistCircleOn).addTo(globalData.minimap.markersGroup);
        this.rangeMarker = L.circle(latlng, this.maxDistCircleOn).addTo(globalData.minimap.markersGroup);
        
        if (!globalData.userSettings.weaponMinMaxRange) {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
            this.rangeMarker.setStyle(this.minMaxDistCircleOff);
        }
        // Hide minRangeMarker if weapon doesn't have minimum range
        if (this.minRangeMarker.getRadius() == 0) {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
        }

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("dblclick", this._handleDblclick, this);
        this.on("contextmenu", this._handleContextMenu, this);
        

    },

    /**
     * Remove the Weapon marker and every object tied
     * @param {this}
     */
    delete: function(){

        if (globalData.minimap.activeWeaponsMarkers.getLayers().length === 1) { 
            globalData.minimap.deleteTargets();
        }
        else {
            // Set default icon on remaining weapon
            globalData.minimap.activeWeaponsMarkers.getLayers()[0].setIcon(mortarIcon);
        }

        // Delete everthing tied to the marker
        this.remove();
        this.removeFrom(globalData.minimap.activeWeaponsMarkers);
        this.minRangeMarker.remove();
        this.rangeMarker.remove();

        // Update remaining targets if they exists
        globalData.minimap.updateTargets();
    },


    /**
     * update calcs, spread markers
     */
    updateWeapon: function(){

        var radiusMax = globalData.activeWeapon.getMaxDistance() * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size);
        var radiusMin = globalData.activeWeapon.minDistance * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size);
        
        this.minRangeMarker.setRadius(radiusMin);
        this.rangeMarker.setRadius(radiusMax);

        if (!globalData.userSettings.weaponMinMaxRange) {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
            this.rangeMarker.setStyle(this.minMaxDistCircleOff);
        }
        else {
            // Update MinRange circle opacity
            if (this.minRangeMarker.getRadius() != 0) {
                this.minRangeMarker.setStyle(this.minDistCircleOn);
            }
            else {
                this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
            }
            this.rangeMarker.setStyle(this.maxDistCircleOn);
        }
    },

    _handleClick: function(e) {
        this.delete(e);
    },

    _handleDrag: function (e) {
        // When dragging marker out of bounds, block it at the edge
        e = this.keepOnMap(e);
        this.setLatLng(e.latlng);
        this.rangeMarker.setLatLng(e.latlng);
        this.minRangeMarker.setLatLng(e.latlng);

        if (globalData.userSettings.LowSpecMode) {
            globalData.minimap.updateTargets();
        }
    },

    // Catch this events so user can't place a target by mistake while trying to delete weapon
    _handleContextMenu: function(){},
    _handleDblclick: function(){},

    _handleDragStart: function () {
        if (!globalData.userSettings.LowSpecMode) {
            globalData.minimap.activeTargetsMarkers.eachLayer(function (layer) {
                layer.calcMarker1.setContent(" ");
                layer.calcMarker2.setContent(" ");
                layer.spreadMarker1.setStyle({opacity: 0, fillOpacity: 0});
                layer.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
            }); 
        }
    },

    _handleDragEnd: function () {
        if (!globalData.userSettings.LowSpecMode) {
            globalData.minimap.updateTargets();
        }
    },



});


export var squadTargetMarker = squadMarker.extend({
    options: {
        calcMarker1: null,
        calcMarker2: null,
        spreadMarker1: null,
        spreadMarker2: null,
    },

    initialize: function (latlng, options) {

        var radiiElipse;
        var angleElipse;
        var results;
        var results2;
        var content;
        var content2;
        const mapScale = 256 / MAPS.find((elem, index) => index == globalData.activeMap).size;




        var popUpOptions_weapon1 = {
            closeButton: false,
            className: "calcPopup",
            autoClose: false,
            closeOnClick: false,
            closeOnEscapeKey: false,
            autoPan: false,
            minWidth: 0,
            bubblingMouseEvents: false,
            interactive: false,
            offset: [-32, -20],
        };

        var popUpOptions_weapon2 = {
            closeButton: false,
            className: "calcPopup2",
            autoClose: false,
            closeOnClick: false,
            closeOnEscapeKey: false,
            autoPan: false,
            minWidth: 0,
            bubblingMouseEvents: false,
            interactive: false,
            offset: [32, -20],
        };


        this.spreadOptionsOn = {
            opacity: 1,
            fillOpacity: 0.1,
            color: "#b22222",
            weight: 1,
        };

        this.spreadOptionsOff = {
            opacity: 0,
            fillOpacity: 0,
        };

        // Create marker
        squadMarker.prototype.initialize.call(this, latlng, options);

        if (this.options.animate){
            this.setIcon(targetIconAnimated);
        }
        else {
            this.setIcon(targetIcon);
        }

        this.addTo(globalData.minimap.activeTargetsMarkers);

        // Create Calc&Spread radius for 1st weapon
        results = getCalcFromUI(globalData.minimap.activeWeaponsMarkers.getLayers()[0].getLatLng(), latlng);
        radiiElipse = [(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2];
        angleElipse = results.bearing;

        if (globalData.userSettings.bearingOverDistance == 1) {
            content = "<span class='calcNumber'></span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.distance + "m</span>";
        } 
        else {
            content = "<span class='calcNumber'></span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
        }

        // Calc PopUp for weapon 1
        this.calcMarker1 = L.popup(popUpOptions_weapon1).setLatLng(latlng).openOn(globalData.minimap).addTo(globalData.minimap.markersGroup);

        // Calc PopUp for weapon 2 (not displayed yet)
        this.calcMarker2 = L.popup(popUpOptions_weapon2).setLatLng(latlng).addTo(globalData.minimap.markersGroup);

        this.spreadMarker1 = L.ellipse(latlng, radiiElipse, angleElipse, this.spreadOptionsOn).addTo(globalData.minimap.markersGroup);
        this.spreadMarker2 = L.ellipse(latlng, radiiElipse, angleElipse, this.spreadOptionsOff).addTo(globalData.minimap.markersGroup);

        if (globalData.userSettings.spreadRadius) {
            this.spreadMarker1.setStyle(this.spreadOptionsOff);
        }

        // If two weapons already on the map
        if (globalData.minimap.activeWeaponsMarkers.getLayers().length === 2) {
            // Calcs for second weapon
            results2 = getCalcFromUI(globalData.minimap.activeWeaponsMarkers.getLayers()[1].getLatLng(), latlng);

            // Show calcs
            if (globalData.userSettings.bearingOverDistance == 1) {
                content = "<span class='calcNumber'>(1)</span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.distance + "m</span>";
                content2 = "<span class='calcNumber'>(2)</span></br><span>" + results2.elevation + "</span></br><span class='bearingUiCalc'>" +  results2.distance + "m</span></br>";
            }
            else {
                content = "<span class='calcNumber'>(1)</span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
                content2 = "<span class='calcNumber'>(2)</span></br><span>" + results2.elevation + "</span></br><span class='bearingUiCalc'>" +  results2.bearing + "°</span></br>";
            }

            this.calcMarker2.setContent(content2).openOn(globalData.minimap);

            // Initiate Spread Ellipse Marker
            if (results2.elevation === "---" || results2.ellipseParams.semiMajorAxis === 0) {
                this.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
            }
            else {
                this.spreadMarker2.setRadius([(results2.ellipseParams.semiMajorAxis * mapScale)/2, (results2.ellipseParams.semiMinorAxis * mapScale)/2]);
                this.spreadMarker2.setTilt(results2.bearing);
                if (globalData.userSettings.spreadRadius) {
                    this.spreadMarker2.setStyle(this.spreadOptionsOn);
                }
                else {
                    this.spreadMarker2.setStyle(this.spreadOptionsOff);
                }
            }
        }

        this.calcMarker1.setContent(content);
        
        // Initiate Spread Ellipse Marker
       
        if (results.elevation === "---" || results.ellipseParams.semiMajorAxis === 0) {
            this.spreadMarker1.setStyle(this.spreadOptionsOff);
        }
        else {
            this.spreadMarker1.setRadius([(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2]);
            if (globalData.userSettings.spreadRadius) {
                this.spreadMarker1.setStyle(this.spreadOptionsOn); 
            }
            else {
                this.spreadMarker1.setStyle(this.spreadOptionsOff); 
            }
        }

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("contextmenu", this._handleContextMenu, this);
    },


    _handleContextMenu: function(){
        this.delete();
    },

    /**
     * Remove the target marker and every object tied
     * @param {this}
     */
    delete: function(){
        this.spreadMarker1.removeFrom(globalData.minimap.markersGroup);
        this.spreadMarker2.removeFrom(globalData.minimap.markersGroup);

        this.calcMarker1.removeFrom(globalData.minimap.markersGroup);
        this.calcMarker2.removeFrom(globalData.minimap.markersGroup);

        this.removeFrom(globalData.minimap.activeTargetsMarkers);
        this.removeFrom(globalData.minimap.markersGroup);
        this.remove();
    },


    updateCalc: function(){
        const mapScale = 256 / MAPS.find((elem, index) => index == globalData.activeMap).size;

        var results = getCalcFromUI(globalData.minimap.activeWeaponsMarkers.getLayers()[0].getLatLng(), this.getLatLng());
        var content;
        var results2;
        var content2;

        if (globalData.userSettings.bearingOverDistance == 1) {
            content = "<span class='calcNumber'></span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.distance + "m</span>";
        }
        else {
            content = "<span class='calcNumber'></span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
        }

        if (results.elevation === "---" || results.ellipseParams.semiMajorAxis === 0) {
            this.spreadMarker1.setStyle({opacity: 0, fillOpacity: 0});
        }
        else {
            this.spreadMarker1.setRadius([(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2]);
            if (globalData.userSettings.spreadRadius) {
                this.spreadMarker1.setStyle(this.spreadOptionsOn);
            }
            else {
                this.spreadMarker1.setStyle(this.spreadOptionsOff);
            }
            this.spreadMarker1.setTilt(results.bearing);
        }

        
        this.spreadMarker2.setStyle(this.spreadOptionsOff);

        if (globalData.minimap.activeWeaponsMarkers.getLayers().length === 2) {
            results2 = getCalcFromUI(globalData.minimap.activeWeaponsMarkers.getLayers()[1].getLatLng(), this.getLatLng());

            if (globalData.userSettings.bearingOverDistance) {
                content = "<span class='calcNumber'>(1)</span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.distance + "m</span>";
                content2 = "<span class='calcNumber'>(2)</span></br><span>" + results2.elevation + "</span></br><span class='bearingUiCalc'>" +  results2.distance + "m</span>";
            }
            else {
                content = "<span class='calcNumber'>(1)</span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
                content2 = "<span class='calcNumber'>(2)</span></br><span>" + results2.elevation + "</span></br><span class='bearingUiCalc'>" +  results2.bearing + "°</span>";
            }

            if (results2.elevation === "---" || results2.ellipseParams.semiMajorAxis === 0) {
                this.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
            }
            else {
                this.spreadMarker2.setRadius([(results2.ellipseParams.semiMajorAxis * mapScale)/2, (results2.ellipseParams.semiMinorAxis * mapScale)/2]);
                this.spreadMarker2.setTilt(results2.bearing);
                if (globalData.userSettings.spreadRadius) {
                    this.spreadMarker2.setStyle(this.spreadOptionsOn);
                }
                else {
                    this.spreadMarker2.setStyle(this.spreadOptionsOff);
                }
            }
            this.calcMarker2.openOn(globalData.minimap);
            this.calcMarker2.setContent(content2);
        }
        else {
            this.calcMarker2.close();
        }
        this.calcMarker1.setContent(content);
    },

    _handleClick: function() {
        this.delete();
    },

    _handleDrag: function (e) {
        // When dragging marker out of bounds, block it at the edge
        e = this.keepOnMap(e);

        // Update Position
        this.setLatLng(e.latlng);
        this.calcMarker1.setLatLng(e.latlng);
        this.spreadMarker1.setLatLng(e.latlng);
        this.calcMarker2.setLatLng(e.latlng);
        this.spreadMarker2.setLatLng(e.latlng);

        // Update bearing/elevation/spread marker
        if (globalData.userSettings.LowSpecMode) {
            this.updateCalc();
        }
    },

    // When in low spec mode, hide calcs/spread at drag start
    _handleDragStart: function () {
        if (!globalData.userSettings.LowSpecMode) {
            this.calcMarker1.setContent(" ");
            this.calcMarker2.setContent(" ");
            this.spreadMarker1.setStyle(this.spreadOptionsOff);
            this.spreadMarker2.setStyle(this.spreadOptionsOff);
        }
    },

    _handleDragEnd: function () {
        if (!globalData.userSettings.LowSpecMode) {
            this.updateCalc();
        }
    },
});


export var mortarIcon = L.icon({
    iconUrl: mortarIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export var mortarIcon1 = L.icon({
    iconUrl: mortarIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export var mortarIcon2 = L.icon({
    iconUrl: mortarIconImg2,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker" 
});

export var targetIconAnimated = L.icon({
    iconUrl: targetIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
    className: "animatedTargetMarker"
});

export var targetIcon = L.icon({
    iconUrl: targetIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

