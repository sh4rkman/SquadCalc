import L from "leaflet";
import squadGrid from "./squadGrid";
import { globalData } from "./conf";
import { MAPS } from "./maps";
import { squadWeaponMarker, squadTargetMarker } from "./squadMarker";
import { mortarIcon, mortarIcon1, mortarIcon2 } from "./squadIcon";
import { getKP, shoot } from "./utils";

export var squadMinimap = L.Map.extend({
    options: {
        center: [700, 700],
        attributionControl: false,
        crs: L.CRS.Simple,
        minZoom: 0,
        maxZoom: 8,
        zoomControl: false,
        doubleClickZoom: false,
        edgeBufferTiles: 3,
        renderer: L.svg({padding: 3}),
        closePopupOnClick: false,
        wheelPxPerZoomLevel: 100,
        boxZoom: true,
        // maxBounds:[[500, -500], [-800, 800]],
    },


    initialize: function (latlng, options) {
        L.Map.prototype.initialize.call(this, latlng, options);
        this.markersGroup = L.layerGroup().addTo(this);
        this.layerGroup = L.layerGroup().addTo(this);
        this.activeTargetsMarkers = L.layerGroup().addTo(this);
        this.activeWeaponsMarkers = L.layerGroup().addTo(this);
        this.grid = "";
        this.mouseLocationPopup = L.popup({
            closeButton: false,
            className: "kpPopup",
            autoClose: false,
            closeOnEscapeKey: false,
            offset: [0, 75],
            autoPan: false,
            interactive: false,
        });

       
        // Custom events handlers
        this.on("dblclick", this._handleDoubleCkick, this);
        this.on("contextmenu", this._handleContextMenu, this);
        this.on("mouseout", this._handleMouseOut, this);
        if (globalData.userSettings.keypadUnderCursor){
            this.on("mousemove", this._handleMouseMove, this);
        }
    },

    /**
     * Draw the map+grid inside the map container
     */
    draw: function(){

        var mapVal = $(".dropbtn").val();
        var map = MAPS.find((elem, index) => index == mapVal);
        var imageBounds = L.latLngBounds(L.latLng(0, 0), L.latLng(-255, 255));
        
        this.mapScale = map.size / 256;
        globalData.activeMap = mapVal;
        globalData.mapScale = 256 / map.size;
        globalData.minimap.setView([-128, 128], 2);
    

        // Remove any layers already drawn
        this.layerGroup.eachLayer(function(layer){
            this.layerGroup.removeLayer(layer);
        });
    
        // Draw the current layer
        L.tileLayer("src/img/maps" + map.mapURL, {
            maxNativeZoom: map.maxZoomLevel,
            noWrap: true,
            bounds: imageBounds,
        }).addTo(this.layerGroup);
    
        this.grid = new squadGrid();
        this.grid.setBounds(imageBounds);

        if (globalData.userSettings.grid) {
            this.grid.addTo(this.layerGroup);
        }

        this.drawHeatmap();
    },

    /**
     * Reset map by clearing every Markers/Layers
     */
    clear: function(){
        this.markersGroup.clearLayers();
        this.layerGroup.clearLayers();
        this.activeWeaponsMarkers.clearLayers();
        this.activeTargetsMarkers.clearLayers();
    },

    /**
     * Recalc and update every target marker on the minimap
     */
    updateTargets: function(){
        // Update existent targets
        this.activeTargetsMarkers.eachLayer(function (layer) {
            layer.updateCalc(layer.latlng);
        });
    },

    /**
     * Recalc and update every target marker on the minimap
     */
    deleteTargets: function(){
        this.activeTargetsMarkers.eachLayer(function (layer) {
            layer.delete();
        });
    },

    /**
     * Recalc and update every target marker on the minimap
     */
    updateWeapons: function(){
        // Update existent targets
        this.activeWeaponsMarkers.eachLayer(function (layer) {
            layer.updateWeapon();
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
     * Draw the selected Heatmaps in a hidden canvas
     */
    drawHeatmap: function() {
        const IMG = new Image(); // Create new img element
        IMG.src = MAPS.find((elem, index) => index == globalData.activeMap).heightmapURL;

        IMG.addEventListener("load", function() { // wait for the image to load or it does crazy stuff
            globalData.canvas.obj.drawImage(IMG, 0, 0, globalData.canvas.size, globalData.canvas.size);
            shoot();
        }, false);
    },

    /**
     * Load the heatmap to the canvas
     */
    loadHeatmap: function() {
        const IMG = new Image();
        globalData.canvas.obj = document.getElementById("canvas").getContext("2d", {willReadFrequently: true});

        IMG.addEventListener("load", function() {
            globalData.canvas.obj.drawImage(IMG, 0, 0, globalData.canvas.size, globalData.canvas.size); // Draw img at good scale
        }, false);

        if (globalData.debug.active) {
            // when in debug mode, display the heightmap and prepare keypads
            $("#canvas").css("display", "flex");
            $("#mortar-location").val(globalData.debug.DEBUG_MORTAR_COORD);
            $("#target-location").val(globalData.debug.DEBUG_TARGET_COORD);
            shoot();
        }
    },


    /**
     * Right-Click
     * Place a new WeaponMarker on the minimap
     */
    _handleContextMenu: function(e) {

        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -256 || e.latlng.lng < 0 || e.latlng.lng > 256) {
            return 1;
        }

        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            new squadWeaponMarker(e.latlng, {icon: mortarIcon}).addTo(this.markersGroup).addTo(this.activeWeaponsMarkers);
            return 0;
        } else {
            if (this.activeWeaponsMarkers.getLayers().length === 1) {
                new squadWeaponMarker(e.latlng, {icon: mortarIcon2}).addTo(this.markersGroup).addTo(this.activeWeaponsMarkers);
                this.activeWeaponsMarkers.getLayers()[0].setIcon(mortarIcon1);
                this.updateTargets();
            }
        }
    },

    /**
     * Mouse-Over
     * Display and update hovered keypad under cursor
     */
    _handleMouseMove: function (e) { 

        // if no mouse support
        if (!matchMedia("(pointer:fine)").matches) { return 1; }

        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -256 || e.latlng.lng < 0 || e.latlng.lng > 256) {
            this.mouseLocationPopup.close();
            return;
        }

        this.mouseLocationPopup.setLatLng(e.latlng).openOn(globalData.minimap);
        this.mouseLocationPopup.setContent("<p>"+ getKP(-e.latlng.lat * this.mapScale, e.latlng.lng * this.mapScale) + "</p>");
    },


    /**
     * Double-Click
     * Create a new target, or weapon is no weapon exists
     */
    _handleDoubleCkick: function (e) {
        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -256 || e.latlng.lng < 0 || e.latlng.lng > 256) {
            return 1;
        }

        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            new squadWeaponMarker(e.latlng, {icon: mortarIcon}).addTo(globalData.minimap.markersGroup).addTo(this.activeWeaponsMarkers);
            return 0;
        }
        
        new squadTargetMarker(L.latLng(e.latlng), {animate: globalData.userSettings.targetAnimation}).addTo(this.markersGroup);
    },

    /**
     * Mouse-Out of minimap
     * Hide mouse keypad popup when leaving map
     */
    _handleMouseOut: function() {
        this.mouseLocationPopup.close();
    }

});