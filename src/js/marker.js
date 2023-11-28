import L from "leaflet";
import "./ellipse";


import shadowIconImg from "../img/icons/marker_shadow.png";
import mortarIconImg from "../img/icons/marker_mortar_0.png";
import mortarIconImg1 from "../img/icons/marker_mortar_1.png";
import mortarIconImg2 from "../img/icons/marker_mortar_2.png";
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

        // Create the min/max range markers
        this.options.minRangeMarker = L.circle(latlng, circleOptions2).addTo(globalData.markersGroup);
        this.options.rangeMarker = L.circle(latlng, circleOptions).addTo(globalData.markersGroup);
        
        // Hide minRangeMarker if weapon doesn't have minimum range
        if (this.options.minRangeMarker.getRadius() == 0) {
            this.options.minRangeMarker.setStyle({opacity: 0, fillOpacity: 0});
        }

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dblclick", this._handleDblclick, this);

    },

    updateWeapon: function(){
        var radiusMax = globalData.activeWeapon.getMaxDistance() * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size);
        var radiusMin = globalData.activeWeapon.minDistance * (256 / MAPS.find((elem, index) => index == globalData.activeMap).size);
        
        this.options.minRangeMarker.setRadius(radiusMin);
        this.options.rangeMarker.setRadius(radiusMax);

        // Update MinRange circle opacity
        if (this.options.minRangeMarker.getRadius() != 0) {
            this.options.minRangeMarker.setStyle({opacity: 0.5, fillOpacity: 0.1});
        }
        else {
            this.options.minRangeMarker.setStyle({opacity: 0, fillOpacity: 0});
        }
    },


    _handleClick: function() {

        // Only allow weapon suppression if at least two weapons are on the map
        if (globalData.activeWeaponMarker.getLayers().length === 1) { return 0;}

        this.remove();
        this.removeFrom(globalData.activeWeaponMarker);
        this.options.minRangeMarker.remove();
        this.options.rangeMarker.remove();

        // Set default icon on remaining weapon
        globalData.activeWeaponMarker.getLayers()[0].setIcon(mortarIcon);

        // Update every targets
        globalData.activeTargetsMarkers.eachLayer(function (layer) {
            layer.updateCalc(layer.latlng);
        });
    },

    _handleDrag: function (e) {
        // When dragging marker out of bounds, block it at the edge
        e = this.keepOnMap(e);

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

        var spreadOptions = {
            opacity: 0.5,
            color: "#b22222",
            weight: 1
        };

        // Create marker
        squadMarker.prototype.initialize.call(this, latlng, options);
        this.addTo(globalData.activeTargetsMarkers);

        // Create Calc&Spread radius for 1st weapon
        results = getCalcFromUI(globalData.activeWeaponMarker.getLayers()[0].getLatLng(), latlng);
        radiiElipse = [(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2];
        angleElipse = results.bearing;
        content = "<span class='calcNumber'></span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
        
        // Calc PopUp for weapon 1
        this.options.calcMarker1 = L.popup(popUpOptions_weapon1).setLatLng(latlng).openOn(globalData.map).addTo(globalData.markersGroup);
        this.options.calcMarker1.setContent(content);

        // Calc PopUp for weapon 2 (not displayed yet)
        this.options.calcMarker2 = L.popup(popUpOptions_weapon2).setLatLng(latlng).addTo(globalData.markersGroup);

        this.options.spreadMarker1 = L.ellipse(latlng, radiiElipse, angleElipse, spreadOptions).addTo(globalData.markersGroup);
        this.options.spreadMarker2 = L.ellipse(latlng, radiiElipse, angleElipse, spreadOptions).addTo(globalData.markersGroup);
        
        this.options.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});

        // If two weapons already on the map
        if (globalData.activeWeaponMarker.getLayers().length === 2) {
            // Calcs for second weapon
            results2 = getCalcFromUI(globalData.activeWeaponMarker.getLayers()[1].getLatLng(), latlng);

            // Show calcs
            content = "<span class='calcNumber'>(1)</span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
            content2 = "<span class='calcNumber'>(2)</span></br><span>" + results2.elevation + "</span></br><span class='bearingUiCalc'>" +  results2.bearing + "°</span></br>";
            this.options.calcMarker2.setContent(content2).openOn(globalData.map);

            // Initiate Spread Ellipse Marker
            if (results2.elevation === "---" || results2.ellipseParams.semiMajorAxis === 0) {
                this.options.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
            }
            else {
                this.options.spreadMarker2.setRadius([(results2.ellipseParams.semiMajorAxis * mapScale)/2, (results2.ellipseParams.semiMinorAxis * mapScale)/2]);
                this.options.spreadMarker2.setStyle({opacity: 0.2, fillOpacity: 0.1});
                this.options.spreadMarker2.setTilt(results2.bearing);
            }
        }

        this.options.calcMarker1.setContent(content);
        
        // Initiate Spread Ellipse Marker
       
        if (results.elevation === "---" || results.ellipseParams.semiMajorAxis === 0) {
            this.options.spreadMarker1.setStyle({opacity: 0, fillOpacity: 0});
        }
        else {
            this.options.spreadMarker1.setRadius([(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2]);
            this.options.spreadMarker1.setStyle({opacity: 0.2, fillOpacity: 0.1}); 
        }

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
    },

    updateCalc: function(){
        const mapScale = 256 / MAPS.find((elem, index) => index == globalData.activeMap).size;

        var results = getCalcFromUI(globalData.activeWeaponMarker.getLayers()[0].getLatLng(), this.getLatLng());
        var content = "<span class='calcNumber'></span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";

        if (results.elevation === "---" || results.ellipseParams.semiMajorAxis === 0) {
            this.options.spreadMarker1.setStyle({opacity: 0, fillOpacity: 0});
        }
        else {
            this.options.spreadMarker1.setRadius([(results.ellipseParams.semiMajorAxis * mapScale)/2, (results.ellipseParams.semiMinorAxis * mapScale)/2]);
            this.options.spreadMarker1.setStyle({opacity: 0.2, fillOpacity: 0.1});
            this.options.spreadMarker1.setTilt(results.bearing);
        }

        this.options.calcMarker2.close();
        this.options.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});

        if (globalData.activeWeaponMarker.getLayers().length === 2) {
            var results2 = getCalcFromUI(globalData.activeWeaponMarker.getLayers()[1].getLatLng(), this.getLatLng());
            content = "<span class='calcNumber'>(1)</span></br><span>" + results.elevation + "</span></br><span class='bearingUiCalc'>" +  results.bearing + "°</span>";
            var content2 = "<span class='calcNumber'>(2)</span></br><span>" + results2.elevation + "</span></br><span class='bearingUiCalc'>" +  results2.bearing + "°</span>";

            if (results2.elevation === "---" || results2.ellipseParams.semiMajorAxis === 0) {
                this.options.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
            }
            else {
                this.options.spreadMarker2.setRadius([(results2.ellipseParams.semiMajorAxis * mapScale)/2, (results2.ellipseParams.semiMinorAxis * mapScale)/2]);
                this.options.spreadMarker2.setStyle({opacity: 0.2, fillOpacity: 0.1});
                this.options.spreadMarker2.setTilt(results2.bearing);
            }
            this.options.calcMarker2.openOn(globalData.map);
            this.options.calcMarker2.setContent(content2);
        }
        this.options.calcMarker1.setContent(content);
    },

    _handleClick: function() {
        this.options.spreadMarker1.removeFrom(globalData.markersGroup);
        this.options.spreadMarker2.removeFrom(globalData.markersGroup);

        this.options.calcMarker1.removeFrom(globalData.markersGroup);
        this.options.calcMarker2.openOn(globalData.map);
        this.options.calcMarker2.removeFrom(globalData.markersGroup);
        this.options.calcMarker2.removeFrom(globalData.map); // fix for a curious behaviour

        this.removeFrom(globalData.activeTargetsMarkers);
        this.removeFrom(globalData.markersGroup);
        this.remove();
    },

    _handleDrag: function (e) {
        // When dragging marker out of bounds, block it at the edge
        e = this.keepOnMap(e);

        // Update Position
        this.setLatLng(e.latlng);
        this.options.calcMarker1.setLatLng(e.latlng);
        this.options.spreadMarker1.setLatLng(e.latlng);
        this.options.calcMarker2.setLatLng(e.latlng);
        this.options.spreadMarker2.setLatLng(e.latlng);

        // Update bearing/elevation/spread marker
        this.updateCalc();
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

export var mortarIcon1 = L.icon({
    iconUrl: mortarIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],  
});

export var mortarIcon2 = L.icon({
    iconUrl: mortarIconImg2,
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

