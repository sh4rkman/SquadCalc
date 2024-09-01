import { TileLayer, Map, CRS, svg, Util, LayerGroup, Popup } from "leaflet";
import squadGrid from "./squadGrid";
import squadHeightmap from "./squadHeightmaps";
import { App } from "../app";
import { squadWeaponMarker, squadTargetMarker } from "./squadMarker";
import { mortarIcon, mortarIcon1, mortarIcon2 } from "./squadIcon";
import { explode } from "./animations";
//import { fetchMarkersByMap } from "./squadCalcAPI";
import "leaflet-edgebuffer";
import "leaflet.gridlayer.fadeout";
//import "./webgl-heatmap.js"
//import "./heatmap.js";


export var squadMinimap = Map.extend({

    /**
     * Initialize Map
     * @param {HTMLElement} [id] - id of the map in the HTML
     * @param {Number} [tilesSize] - Size in pixel of the tiles
     * @param {Object} [defaultMap] - squad map to initialize
     * @param {Array} [options]
     */
    initialize: function (id, tilesSize, defaultMap, options) {

        options = {
            attributionControl: false,
            boxZoom: true,
            center: [-tilesSize/2, tilesSize/2],
            closePopupOnClick: false,
            crs: CRS.Simple,
            doubleClickZoom: false,
            edgeBufferTiles: 5,
            fadeAnimation: true,
            maxZoom: 8,
            minZoom: 1,
            renderer: svg({padding: 3}),
            wheelPxPerZoomLevel: 75,
            zoom: 2,
            zoomControl: false,
        };

        Util.setOptions(this, options);
        Map.prototype.initialize.call(this, id, options);
        this.activeMap = defaultMap;
        this.tilesSize = tilesSize;
        this.imageBounds = [{lat: 0, lng:0}, {lat: -this.tilesSize, lng: this.tilesSize}];
        this.layerGroup = new LayerGroup().addTo(this);
        this.markersGroup = new LayerGroup().addTo(this);
        this.activeTargetsMarkers = new LayerGroup().addTo(this);
        this.activeWeaponsMarkers = new LayerGroup().addTo(this);
        this.grid = "";
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
        this.tileLayerOption = {
            maxNativeZoom: this.activeMap.maxZoomLevel,
            noWrap: true,
            bounds: this.imageBounds,
            tileSize: this.tilesSize,
        };
        // Custom events handlers
        this.on("dblclick", this._handleDoubleCkick, this);
        this.on("contextmenu", this._handleContextMenu, this);
        this.on("mouseout", this._handleMouseOut, this);

        if (App.userSettings.keypadUnderCursor){
            this.on("mousemove", this._handleMouseMove, this);
            this.on("zoomend", this._handleZoom, this);
        }

    },

    /**
     * Initiate Heightmap & Grid then load layer
     */
    draw: function(){

        this.gameToMapScale = this.tilesSize / this.activeMap.size;
        this.mapToGameScale = this.activeMap.size / this.tilesSize;

        // Load Heightmap in canvas
        this.heightmap = new squadHeightmap(this);

        // remove existing grid and replace it
        if (this.grid) this.grid.remove();
        this.grid = new squadGrid(this);
        this.grid.setBounds([[0,0], [-this.tilesSize, this.tilesSize]]);

        if (App.userSettings.grid) this.showGrid();

        // load map
        this.changeLayer();
    },


    /**
     * remove existing layer and replace it
     */
    changeLayer: function(){
        const LAYERMODE = $("#mapLayerMenu .active").attr("value");
        if (this.activeLayer) this.activeLayer.remove();
        //if (this.heatmap) this.heatmap.remove();
        this.activeLayer = new TileLayer("", this.tileLayerOption);
        this.activeLayer.setUrl(`maps${this.activeMap.mapURL}${LAYERMODE}/{z}_{x}_{y}.webp`);
        this.activeLayer.addTo(this.layerGroup);

        // // Fetch squadCalcAPI if alive
        // fetchMarkersByMap(App.minimap.activeMap.name)
        //     .then(markers => {          
        //         this.heatmap = new L.webGLHeatmap({
        //             size: 10,
        //             units: 'px',
        //             opacity: 0.5,
        //             alphaRange: 0.5,
        //         });

        //         this.heatmap.setData(markers);
        //         this.addLayer(this.heatmap);
        //     })
        //     .catch(error => {
        //         console.debug('Error fetching markers:', error);
        //     });
    },


    /**
     * Reset map by clearing every Markers/Layers
     */
    clear: function(){
        this.markersGroup.clearLayers();
        this.activeWeaponsMarkers.clearLayers();
        this.activeTargetsMarkers.clearLayers();
        this.layerGroup.clearLayers();

        this.setView([-this.tilesSize/2, this.tilesSize/2], 2);
        $(".btn-delete").hide();
    },

    /**
     * Recalc and update every target marker on the minimap
     */
    updateTargets: function(){
        // Update existent targets
        this.activeTargetsMarkers.eachLayer(function (target) {
            target.updateCalc(target.latlng);
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
     * Calculates the keypad coordinates for a given latlng coordinate, e.g. "A5-3-7"
     * @param lat - latitude coordinate
     * @param lng - longitude coordinate
     * @returns {string} keypad coordinates as string
     */
    getKP: function(lat, lng) {
        // to minimize confusion
        const x = lng;
        const y = lat;
        const kp = 300 / 3 ** 0; // interval of main keypad, e.g "A5"
        const kpNumber = `0000${Math.floor(y / kp) + 1}`.slice(-2);
        const s1 = 300 / 3 ** 1; // interval of first sub keypad
        const s2 = 300 / 3 ** 2; // interval of second sub keypad
        const s3 = 300 / 3 ** 3; // interval of third sub keypad
        const s4 = 300 / 3 ** 4; // interval of third sub keypad
        var precision = this.getZoom();

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
        if (e.latlng.lat > 0 ||  e.latlng.lat < -this.tilesSize || e.latlng.lng < 0 || e.latlng.lng > this.tilesSize) {
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
     * Mouse-Over
     * Display and update hovered keypad under cursor
     */
    _handleMouseMove: function (e) {

        // if no mouse support
        if (!matchMedia("(pointer:fine)").matches) { return 1; }

        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -this.tilesSize || e.latlng.lng < 0 || e.latlng.lng > this.tilesSize) {
            this.mouseLocationPopup.close();
            return;
        }

        this.mouseLocationPopup.setLatLng(e.latlng).openOn(this);
        this.mouseLocationPopup.setContent(`<p>${this.getKP(-e.latlng.lat * this.mapToGameScale, e.latlng.lng * this.mapToGameScale)}</p>`);
    },


    /**
     * Double-Click
     * Create a new target, or weapon is no weapon exists
     */
    _handleDoubleCkick: function (e) {
        var target;

        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -this.tilesSize || e.latlng.lng < 0 || e.latlng.lng > this.tilesSize) {
            return 1;
        }

        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            new squadWeaponMarker(e.latlng, {icon: mortarIcon}, this).addTo(this.markersGroup, this).addTo(this.activeWeaponsMarkers);
            return 0;
        }

        target = new squadTargetMarker(e.latlng, {animate: App.userSettings.targetAnimation}, this).addTo(this.markersGroup);
        $(".btn-delete").show();

        if (App.userSettings.targetAnimation){
            if (this.activeWeaponsMarkers.getLayers().length === 1) {
                if (isNaN(target.firingSolution1.elevation.high.rad)){ return; }
            } else {
                if (isNaN(target.firingSolution1.elevation.high.rad) && isNaN(target.firingSolution2.elevation.high.rad)){ return; }
            }

            setTimeout(function() {
                explode(e.containerPoint.x, e.containerPoint.y, -190, 10);
                target.options.animate = false;
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
     * After each zoom, update keypadUnderMouse precision
     */
    _handleZoom: function() {
        this.mouseLocationPopup.setContent(`<p>${this.getKP(-this.mouseLocationPopup._latlng.lat * this.mapToGameScale, this.mouseLocationPopup._latlng.lng * this.mapToGameScale)}</p>`);
    },

});

