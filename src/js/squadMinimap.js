import L from "leaflet";
import squadGrid from "./squadGrid";
import squadHeightmap from "./squadHeightmaps";
import { App } from "./conf";
import { MAPS } from "./maps";
import { squadWeaponMarker, squadTargetMarker } from "./squadMarker";
import { mortarIcon, mortarIcon1, mortarIcon2 } from "./squadIcon";
import { getKP } from "./utils";
import { explode } from "./animations";
import "leaflet-edgebuffer";
import "leaflet.gridlayer.fadeout";


export var squadMinimap = L.Map.extend({

    initialize: function (id, tilesSize, options) {

        options = {
            center: [-tilesSize/2, tilesSize/2],
            attributionControl: false,
            crs: L.CRS.Simple,
            minZoom: 1,
            maxZoom: 8,
            zoomControl: false,
            doubleClickZoom: false,
            edgeBufferTiles: 5,
            renderer: L.svg({padding: 3}),
            closePopupOnClick: false,
            wheelPxPerZoomLevel: 75,
            boxZoom: true,
            fadeAnimation: true,
            zoom: 2,
        };


        L.setOptions(this, options);
        L.Map.prototype.initialize.call(this, id, options);

        // Default map to Kohat
        this.activeMap = MAPS.find((elem, index) => index == 11);



        this.tilesSize = tilesSize;
        this.imageBounds = L.latLngBounds(L.latLng(0, 0), L.latLng(-this.tilesSize, this.tilesSize));
        this.tileLayerOption = {
            maxNativeZoom: this.activeMap.maxZoomLevel,
            noWrap: true,
            bounds: this.imageBounds,
            tileSize: this.tilesSize,
        };

        this.layerGroup = L.layerGroup().addTo(this);
        this.markersGroup = L.layerGroup().addTo(this);
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
        if (App.userSettings.keypadUnderCursor){
            this.on("mousemove", this._handleMouseMove, this);
        }

    },

    /**
     * Draw the map+grid inside the map container
     */
    draw: function(){
        // everything is a mess, rewrite this shit asap
        const layerMode = $("#mapLayerMenu .active").attr("value");

        this.gameToMapScale = this.tilesSize / this.activeMap.size;
        this.mapToGameScale = this.activeMap.size / this.tilesSize;

        // Load Heightmap in canvas
        this.heightmap = new squadHeightmap(this.imageBounds, this);

        if (this.activeLayer) this.activeLayer.remove();
        this.activeLayer = L.tileLayer("", this.tileLayerOption);
        this.activeLayer.setUrl("maps" + this.activeMap.mapURL + layerMode + "/{z}_{x}_{y}.webp");
        this.activeLayer.addTo(this.layerGroup);

        if (this.grid){this.grid.remove();}
        this.grid = new squadGrid(this);
        this.grid.setBounds(L.latLngBounds(L.latLng(0, 0), L.latLng(-this.tilesSize, this.tilesSize)));

        if (App.userSettings.grid) {
            this.showGrid();
        }

    },



    reDraw: function(val){
     
        $("#mapLayerMenu").find("button").removeClass("active");
        $(".btn-"+val).addClass("active");

        App.userSettings.layerMode = val;
        localStorage.setItem("settings-map-mode", val);
       
        this.draw(false);
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
        });
    },

    /**
    * TODO
    */
    updateTargetsSpreads: function(){
        // Update existent targets
        this.activeTargetsMarkers.eachLayer(function (target) {
            target.updateSpread();
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
        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -this.tilesSize || e.latlng.lng < 0 || e.latlng.lng > this.tilesSize) {
            return 1;
        }

        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            new squadWeaponMarker(e.latlng, {icon: mortarIcon}, this).addTo(this.markersGroup, this).addTo(this.activeWeaponsMarkers);
            return 0;
        }
        
        new squadTargetMarker(L.latLng(e.latlng), {animate: App.userSettings.targetAnimation}, this).addTo(this.markersGroup);
        $(".btn-delete").show();

        if (App.userSettings.targetAnimation){
            setTimeout(function() {
                explode(e.containerPoint.x, e.containerPoint.y, -190, 10);
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

