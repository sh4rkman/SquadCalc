import {imageOverlay, tileLayer, Map, CRS, svg, Util, LayerGroup, Popup } from "leaflet";
import squadGrid from "./squadGrid.js";
import squadHeightmap from "./squadHeightmaps.js";
import { App } from "../app.js";
import { squadWeaponMarker, squadTargetMarker } from "./squadMarker.js";
import { mortarIcon, mortarIcon1, mortarIcon2 } from "./squadIcon.js";
import { explode } from "./animations.js";
import { fetchMarkersByMap } from "./squadCalcAPI.js";
import webGLHeatmap from "./libs/leaflet-webgl-heatmap.js";
import "leaflet-edgebuffer";
import "leaflet-spin";
import "./libs/webgl-heatmap.js";
import "./libs/leaflet-smoothWheelZoom.js";

/**
 * Squad Minimap
 * Custom Leaflet Map for Squad, managing basemaps, mouse behaviours, and more
 * @extends {Map} - Leaflet Map
 * @class squadMinimap
 */
export var squadMinimap = Map.extend({

    /**
     * Initialize Map
     * @param {HTMLElement} [id] - id of the map in the HTML
     * @param {Number} [pixelSize] - Size in pixel of the tiles
     * @param {Object} [defaultMap] - squad map to initialize
     * @param {Array} [options]
     */
    initialize: function (id, pixelSize, defaultMap, options) {

        options = {
            attributionControl: false,
            boxZoom: true,
            center: [-pixelSize/2, pixelSize/2],
            closePopupOnClick: false,
            crs: CRS.Simple,
            doubleClickZoom: false,
            maxZoom: 8,
            minZoom: 1,
            renderer: svg({padding: 3}),
            zoom: 2,
            zoomControl: false,
            zoomSnap: 0,
            smoothSensitivity: 2,
            scrollWheelZoom: App.userSettings.smoothMap,
            smoothWheelZoom: !App.userSettings.smoothMap,
            inertia: App.userSettings.smoothMap,
            zoomAnimation: App.userSettings.smoothMap,
        };

        Util.setOptions(this, options);
        Map.prototype.initialize.call(this, id, options);
        this.activeMap = defaultMap;
        this.pixelSize = pixelSize;
        this.imageBounds = [{lat: 0, lng:0}, {lat: -this.pixelSize, lng: this.pixelSize}];
        this.spinOptions = {color: "white", scale: 1.5, width: 5, shadow: "5px 5px 5px transparent"};
        this.layerGroup = new LayerGroup().addTo(this);
        this.markersGroup = new LayerGroup().addTo(this);
        this.targets = [];
        this.activeTargetsMarkers = new LayerGroup().addTo(this);
        this.activeWeaponsMarkers = new LayerGroup().addTo(this);
        this.grid = "";
        this.gameToMapScale = "";
        this.mapToGameScale = "";
        this.detailedZoomThreshold = "";
        this.mousePos = "";
        this.mouseLocationPopup = new Popup({
            closeButton: false,
            className: "kpPopup",
            autoClose: false,
            closeOnEscapeKey: false,
            offset: [0, 75],
            autoPan: false,
            closeOnClick: false,
            interactive: false,
        });

        // Custom events handlers
        this.on("dblclick", this._handleDoubleClick, this);
        this.on("contextmenu", this._handleContextMenu, this);
        
        if (App.userSettings.keypadUnderCursor && App.hasMouse){
            this.on("mousemove", this._handleMouseMove, this);
            this.on("mouseout", this._handleMouseOut, this);
        }

        this.on("zoomend", this._handleZoom, this);

    },

    /**
     * Initiate Heightmap & Grid then load layer
     */
    draw: function(){

        this.gameToMapScale = this.pixelSize / this.activeMap.size;
        this.mapToGameScale = this.activeMap.size / this.pixelSize;
        this.detailedZoomThreshold = ( 3 + (this.activeMap.size/7000) ) * 0.8;
       
        // Load Heightmap
        this.heightmap = new squadHeightmap(this);

        // remove existing grid and replace it
        if (this.grid) this.grid.remove();
        if (this.layer) this.layer = "";

        this.grid = new squadGrid(this);
        this.grid.setBounds([[0,0], [-this.pixelSize, this.pixelSize]]);

        // load map
        this.changeLayer();
    },


    /**
     * remove existing layer and replace it
     */
    changeLayer: function(){
        const LAYERMODE = $("#mapLayerMenu .active").attr("value");
        const OLDLAYER = this.activeLayer;

        // Image URL
        const baseUrl = `maps${this.activeMap.mapURL}${LAYERMODE}`;
        const suffix = App.userSettings.highQualityImages ? "_hq" : "";
        const newImageUrl = `${baseUrl}${suffix}.webp`;
        
        // Show spinner
        this.spin(true, this.spinOptions);

        // Add the new layer but keep it hidden initially
        this.activeLayer = new imageOverlay(newImageUrl, this.imageBounds);
        this.activeLayer.addTo(this.layerGroup);
        $(this.activeLayer.getElement()).css("opacity", 0);
        this.decode();

        // When the new image is loaded, fade it in & remove spinner
        this.activeLayer.on("load", () => {
            this.spin(false);
            $(this.activeLayer.getElement()).animate({opacity: 1}, 500, () => {
                // Remove the old layer after the fade-in is complete
                if (OLDLAYER) OLDLAYER.remove();
                // Show grid and heatmap
                if (App.userSettings.grid) this.showGrid();
                this.toggleHeatmap();
            });
        });

    },


    /**
     * Show/Hide heatmap of commonly used
     */
    toggleHeatmap: function(){

        if ($(".btn-helpmap").hasClass("active")){
            this.spin(true, this.spinOptions);
            if (this.heatmap) this.heatmap.remove();
            fetchMarkersByMap(App.minimap.activeMap.name, App.activeWeapon.name)
                .then(markers => {
                    this.heatmap = new webGLHeatmap({
                        size: 2 + 20 * this.gameToMapScale,
                        units: "m",
                        opacity: 0.5,
                        alphaRange: 0.3,
                    });
                    this.heatmap.setData(markers);
                    this.addLayer(this.heatmap);
                    this.spin(false);
                })
                .catch(error => {
                    this.spin(false);
                    $(".btn-helpmap").removeClass("active");
                    App.openToast("error", "error", "apiError");
                    console.debug("Error fetching markers:", error);
                });
        }
        else {
            if (this.heatmap) {
                this.removeLayer(this.heatmap);
                this.heatmap = null;
            }
        }
    },

    /**
     * Force the Browser to decode of the current map image
     * Hack for Chrome lag when first zooming inside a 4k image
     */
    decode: function(){
        const IMG = new Image();
        IMG.src = this.activeLayer._url;
        IMG.decode();
    },

    /**
     * Reset map by clearing every Markers/Layers
     */
    clear: function(){

        // Clear Every existing Makers
        this.markersGroup.clearLayers();
        this.activeWeaponsMarkers.clearLayers();
        this.activeTargetsMarkers.clearLayers();
        if (this.layer) this.layer.clear();
    
        $(".btn-delete").hide();

        // Reset map
        this.setView([-this.pixelSize/2, this.pixelSize/2], 2);

    },

    /**
     * Recalc and update every target marker on the minimap
     */
    updateTargets: function(){
        // Update existent targets
        this.activeTargetsMarkers.eachLayer(function (target) {
            target.updateCalc(true);
            target.updateIcon();
        });
    },

    /**
    * Recalc and update every target spread circle
    */
    updateTargetsSpreads: function(){
        // Update existent targets
        this.activeTargetsMarkers.eachLayer(function (target) {
            target.updateSpread();
            target.updateDamageRadius();
        });
    },

    /**
     * Delete every target markers on the map
     */
    deleteTargets: function(){
        this.activeTargetsMarkers.eachLayer(function (target) {
            target.delete();
        });
    },

    /**
     * Recalc and update every target marker on the minimap
     */
    updateWeapons: function(){
        // Update existent targets
        this.activeWeaponsMarkers.eachLayer(function (weapon) {
            weapon.updateWeapon();
        });
    },

    /**
     * add Grid to minimap layers
     */
    showGrid: function(){
        this.grid.addTo(this.layerGroup);
    },

    /**
     * Hide Grid from minimap layers
     */
    hideGrid: function(){
        this.grid.removeFrom(this.layerGroup);
    },

    /**
     * Calculates the keypad coordinates for a given latlng coordinate
     * @param lat - latitude coordinate
     * @param lng - longitude coordinate
     * @param precision - Optionnal, current map zoom by default
     * @returns {string} keypad coordinates as string, e.g. "A5-3-7"
     */
    getKP: function(lat, lng, precision = Math.round(this.getZoom())) {
        // to minimize confusion
        const x = lng * this.mapToGameScale;
        const y = lat * this.mapToGameScale;
        const kp = 300 / 3 ** 0; // interval of main keypad, e.g "A5"
        const kpNumber = `0000${Math.floor(y / kp) + 1}`.slice(-2);
        const s1 = 300 / 3 ** 1; // interval of first sub keypad
        const s2 = 300 / 3 ** 2; // interval of second sub keypad
        const s3 = 300 / 3 ** 3; // interval of third sub keypad
        const s4 = 300 / 3 ** 4; // interval of third sub keypad
        
        // basic grid, e.g. B5
        const kpCharCode = 65 + Math.floor(x / kp);
        let kpLetter = String.fromCharCode(kpCharCode);

        // sub keypad 1, e.g. B5 - 5
        // ok when we go down, we have 3x3 pads and start with the left most column, i.e. 7,4,1
        // so we check which index y is in, either 1st (7), 2nd (4), or 3rd (1)
        const subY = Math.floor(y / s1) % 3;

        // now we substract the index times 3 from 10
        // 1st = 10 - 1*3 = 7
        // 1st = 10 - 2*3 = 4
        // 1st = 10 - 3*3 = 1
        let subNumber = 10 - (subY + 1) * 3;

        // now all we need to do is add the index for of x, but starting from 0
        subNumber += Math.floor(x / s1) % 3;

        // sub keypad 2, e.g. B5 - 5 - 3;
        const sub2Y = Math.floor(y / s2) % 3;
        let sub2Number = 10 - (sub2Y + 1) * 3;
        sub2Number += Math.floor(x / s2) % 3;

        // sub keypad 3, e.g. B5 - 5 - 3 - 2;
        const sub3Y = Math.floor(y / s3) % 3;
        let sub3Number = 10 - (sub3Y + 1) * 3;
        sub3Number += Math.floor(x / s3) % 3;

        // sub keypad 4, e.g. B5 - 5 - 3 - 2 - 8;
        const sub4Y = Math.floor(y / s4) % 3;
        let sub4Number = 10 - (sub4Y + 1) * 3;
        sub4Number += Math.floor(x / s4) % 3;

        // The more the user zoom in, the more precise we display coords under mouse
        switch (precision){
        case 0:
            return `${kpLetter}${kpNumber}`;
        case 1:
            return `${kpLetter}${kpNumber}`;
        case 2:
            return `${kpLetter}${kpNumber}`;
        case 3:
            return `${kpLetter}${kpNumber}-${subNumber}`;
        case 4:
            return `${kpLetter}${kpNumber}-${subNumber}-${sub2Number}`;
        case 5:
            return `${kpLetter}${kpNumber}-${subNumber}-${sub2Number}-${sub3Number}`;
        default:
            return `${kpLetter}${kpNumber}-${subNumber}-${sub2Number}-${sub3Number}-${sub4Number}`;
        }
    },

    /**
     * Right-Click
     * Place a new WeaponMarker on the minimap
     */
    _handleContextMenu: function(e) {

        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -this.pixelSize || e.latlng.lng < 0 || e.latlng.lng > this.pixelSize) {
            return 1;
        }

        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            new squadWeaponMarker(e.latlng, {icon: mortarIcon}, this).addTo(this.markersGroup).addTo(this.activeWeaponsMarkers);
            return 0;
        } else {
            if (this.activeWeaponsMarkers.getLayers().length === 1) {
                new squadWeaponMarker(e.latlng, {icon: mortarIcon2}, this).addTo(this.markersGroup).addTo(this.activeWeaponsMarkers);
                this.activeWeaponsMarkers.getLayers()[0].setIcon(mortarIcon1);
                this.updateTargets();
            }
        }
    },

    /**
     * Double-Click
     * Create a new target, or weapon is none exists
     */
    _handleDoubleClick: function (e) {
        var target;

        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -this.pixelSize || e.latlng.lng < 0 || e.latlng.lng > this.pixelSize) {
            return 1;
        }

        // No weapon yet ? Create one
        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            new squadWeaponMarker(e.latlng, {icon: mortarIcon}, this).addTo(this.markersGroup, this).addTo(this.activeWeaponsMarkers);
            return 0;
        }

        target = new squadTargetMarker(e.latlng, {animate: App.userSettings.targetAnimation}, this).addTo(this.markersGroup);
        this.targets.push(target);
        $(".btn-delete").show();

        if (App.userSettings.targetAnimation){
            if (this.activeWeaponsMarkers.getLayers().length === 1) {
                if (isNaN(target.firingSolution1.elevation.high.rad)){ return; }
            } else {
                if (isNaN(target.firingSolution1.elevation.high.rad) && isNaN(target.firingSolution2.elevation.high.rad)){ return; }
            }

            setTimeout(function() {
                explode(e.containerPoint.x, e.containerPoint.y, -190, 10);
                target.updateIcon(); // Update icon to remove the animation class, it was causing painfull DOM bug otherwise
            }, 250);
        }
    },

    /**
     * Mouse-Out of minimap
     * Hide mouse keypad popup when leaving map
     */
    _handleMouseOut: function() {
        this.mouseLocationPopup.close();
    },


    /**
     * Display and update hovered keypad under cursor
     */
    _handleMouseMove: function (e) {

        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -this.pixelSize || e.latlng.lng < 0 || e.latlng.lng > this.pixelSize) {
            this.mouseLocationPopup.close();
            return;
        }

        this.mouseLocationPopup.setLatLng(e.latlng).openOn(this);
        this.mouseLocationPopup.setContent(`<p>${this.getKP(-e.latlng.lat, e.latlng.lng)}</p>`);
    },


    /**
     * After each zoom, update keypadUnderMouse precision
     */
    _handleZoom: function() {

        if (App.userSettings.keypadUnderCursor && App.hasMouse){
            if (this.mouseLocationPopup._latlng){
                this.mouseLocationPopup.setContent(`<p>${this.getKP(-this.mouseLocationPopup._latlng.lat, this.mouseLocationPopup._latlng.lng)}</p>`);
            }
        }

        // If there is a layer selected, reveal main/capzone when enough zoomed in
        if (!this.layer) return;

        if (this.getZoom() > this.detailedZoomThreshold){
            this.layer.revealAllCapzones();
            //this.layer.setMainZoneOpacity(true);
        } else {
            this.layer.hideAllCapzones();
            //this.layer.setMainZoneOpacity(false);
        }

    },

});

