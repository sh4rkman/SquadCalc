import L from "leaflet";
import squadGrid from "./squadGrid";
import squadHeightmap from "./squadHeightmaps";
import { App } from "./conf";
import { MAPS } from "./maps";
import { squadWeaponMarker, squadTargetMarker } from "./squadMarker";
import { mortarIcon, mortarIcon1, mortarIcon2 } from "./squadIcon";
import { getKP } from "./utils";
import { explode } from "./animations";

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
            renderer: L.svg({padding: 3}), // https://leafletjs.com/reference.html#path-clip_padding
            closePopupOnClick: false,
            wheelPxPerZoomLevel: 75,
            boxZoom: true,
            fadeAnimation: true,
            zoom: 2,
        };

        L.setOptions(this, options);
        L.Map.prototype.initialize.call(this, id, options);


        this.tilesSize = tilesSize;
        this.heightmapGroup = L.layerGroup().addTo(this);
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
    draw: function(reset){
        // everything is a mess, rewrite this shit asap
        const layerMode = $("#mapLayerMenu .active").attr("value");
        var mapVal;
        var map;
        var imageBounds;
        var previousLayers;

        // what map are we using
        mapVal = $(".dropbtn").val();
        if (mapVal == "") {mapVal = 11;} // default map is Kohat
        map = MAPS.find((elem, index) => index == mapVal);
        App.activeMap = mapVal;


        imageBounds = L.latLngBounds(L.latLng(0, 0), L.latLng(-this.tilesSize, this.tilesSize));
        this.gameToMapScale = this.tilesSize / map.size;
        this.mapToGameScale = map.size / this.tilesSize;

        previousLayers = this.layerGroup.getLayers();


        // Always add the heightmap
        if (reset){
            if (this.heightmap) {
                this.heightmapGroup.removeLayer(this.heightmap);
            }

            this.heightmap = new squadHeightmap("maps"+ map.mapURL + map.name.toLowerCase() + ".webp", imageBounds, this).addTo(this.heightmapGroup);
            this.heightmap.bringToBack();
        }

        if (layerMode == "basemap") {
            this.basemap = L.tileLayer("maps" + map.mapURL + "minimap/{z}_{x}_{y}.webp", {
                maxNativeZoom: map.maxZoomLevel,
                noWrap: true,
                bounds: imageBounds,
                tileSize: this.tilesSize,
            }).addTo(this.layerGroup);
            this.basemap.bringToFront();
            this.heightmap.setOpacity(0);
        }
        else if ( layerMode == "terrainmap") {
            this.terrainmap = L.tileLayer("maps" + map.mapURL + "terrainmap/{z}_{x}_{y}.webp", {
                maxNativeZoom: map.maxZoomLevel,
                noWrap: true,
                bounds: imageBounds,
                tileSize: this.tilesSize,
            }).addTo(this.layerGroup);
            this.terrainmap.bringToFront();
            this.heightmap.setOpacity(0);
        }
        

        if (layerMode === "heightmap"){
            this.heightmap.setOpacity(1);
            this.heightmap.bringToFront();
        }

        if (this.grid){this.grid.remove();}
        this.grid = new squadGrid(this);
        this.grid.setBounds(L.latLngBounds(L.latLng(0, 0), L.latLng(-this.tilesSize+1, this.tilesSize-1)));

        if (App.userSettings.grid) {
            this.showGrid();
        }

        // wait for the load animation to finish before removing previous tiles
        // Ugly hack to avoid logo flashing when switching map
        setTimeout(() => {
            this.layerGroup.eachLayer((layer) => {
                for (let index = 0; index < previousLayers.length; index++) {
                    if (previousLayers[index] === layer) {
                        this.layerGroup.removeLayer(layer);
                    }
                }
            });
        }, 1000);

        if (reset){
            this.setView([-this.tilesSize/2, this.tilesSize/2], 2);
            $(".btn-delete").hide();
        }

        //this.drawHeightmap(imageBounds);

    },



    reDraw: function(val){
     
        $("#mapLayerMenu").find("button").removeClass("active");
        $(".btn-"+val).addClass("active");

        App.userSettings.layerMode = val;
        localStorage.setItem("settings-terrain-mode", val);
       
        this.draw(false);
    },


    /**
     * Reset map by clearing every Markers/Layers
     */
    clear: function(){
        this.markersGroup.clearLayers();
        this.activeWeaponsMarkers.clearLayers();
        this.activeTargetsMarkers.clearLayers();
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

