import { TileLayer, Map, CRS, svg, Util, LayerGroup, LatLngBounds, Popup } from "leaflet";
import squadGrid from "./squadGrid";
import squadHeightmap from "./squadHeightmaps";
import { App } from "./conf";
import { squadWeaponMarker, squadTargetMarker } from "./squadMarker";
import { mortarIcon, mortarIcon1, mortarIcon2 } from "./squadIcon";
import { getKP } from "./utils";
import { explode } from "./animations";
import "leaflet-edgebuffer";
import "leaflet.gridlayer.fadeout";



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
        this.imageBounds = new LatLngBounds([0, 0], [-this.tilesSize, this.tilesSize]);
        this.layerGroup = new LayerGroup().addTo(this);
        this.markersGroup = new LayerGroup().addTo(this);
        this.activeTargetsMarkers = new LayerGroup().addTo(this);
        this.activeWeaponsMarkers = new LayerGroup().addTo(this);
        this.grid = "";
        this.mouseLocationPopup = new Popup({
            closeButton: false,
            className: "kpPopup",
            autoClose: false,
            closeOnEscapeKey: false,
            offset: [0, 75],
            autoPan: false,
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
        }

    },

    /**
     * Initiate Heightmap & Grid then load layer
     */
    draw: function(){

        this.gameToMapScale = this.tilesSize / this.activeMap.size;
        this.mapToGameScale = this.activeMap.size / this.tilesSize;

        // Load Heightmap in canvas
        this.heightmap = new squadHeightmap(this.imageBounds, this);

        // remove existing grid and replace it
        //if (this.grid) this.grid.remove();
        this.grid = new squadGrid(this);
        this.grid.setBounds(new LatLngBounds([0, 0], [-this.tilesSize, this.tilesSize]));
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
        this.activeLayer = new TileLayer("", this.tileLayerOption);
        this.activeLayer.setUrl("maps" + this.activeMap.mapURL + LAYERMODE + "/{z}_{x}_{y}.webp");
        this.activeLayer.addTo(this.layerGroup);
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
        this.mouseLocationPopup.setContent("<p>"+ getKP(-e.latlng.lat * this.mapToGameScale, e.latlng.lng * this.mapToGameScale) + "</p>");
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

});

