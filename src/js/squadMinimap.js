import {Icon, ImageOverlay, TileLayer, Map, CRS, SVG, Util, LayerGroup, Popup, LatLngBounds, LatLng, Browser } from "leaflet";
import squadGrid from "./squadGrid.js";
import squadHeightmap from "./squadHeightmaps.js";
import { App } from "../app.js";
import { squadWeaponMarker } from "./squadMarker.js";
import { squadTargetMarker } from "./squadTargetMarker.js";
import { MapDrawing, MapCircle, MapArrow, MapRectangle } from "./squadShapes.js";
import { mortarIcon, mortarIcon1, mortarIcon2 } from "./squadIcon.js";
import { explode } from "./animations.js";
import { fetchMarkersByMap } from "./squadCalcAPI.js";
import webGLHeatmap from "./libs/leaflet-webgl-heatmap.js";
import squadContextMenu from "./squadContextMenu.js";
import { squadStratMarker } from "./squadMarker.js";
//import "leaflet-polylinedecorator";
import "./libs/webgl-heatmap.js";
import "./libs/leaflet-smoothWheelZoom.js";
import "tippy.js/dist/tippy.css";
import "./libs/leaflet-edgebuffer.js";
import "./libs/leaflet-spin.js";
import "./libs/leaflet-imageoverlay-rotated.js";


/**
 * Squad Minimap
 * Custom Leaflet Map for Squad, managing basemaps, mouse behaviours, and more
 * @extends {Map} - Leaflet Map
 * @class squadMinimap
 */
export const squadMinimap = Map.extend({

    /**
     * Initialize Map
     * @param {HTMLElement} [id] - id of the map in the HTML
     * @param {Number} [pixelSize] - Size in pixel of the tiles
     * @param {Object} [defaultMap] - squad map to initialize
     * @param {Array} [options]
     */
    initialize: function (id, pixelSize, defaultMap, options) {

        let customOptions = {
            attributionControl: false,
            boxZoom: true,
            center: [-pixelSize/2, pixelSize/2],
            closePopupOnClick: false,
            crs: CRS.Simple,
            doubleClickZoom: false,
            maxZoom: 8,
            minZoom: 1,
            renderer: new SVG({ padding: 3}),
            zoom: 2,
            zoomControl: false,
            zoomSnap: 0,
            smoothSensitivity: App.userSettings.zoomSensitivity,
            scrollWheelZoom: App.userSettings.smoothMap,
            smoothWheelZoom: !App.userSettings.smoothMap,
            wheelPxPerZoomLevel: 120 / App.userSettings.zoomSensitivity,
            inertia: App.userSettings.smoothMap,
            zoomAnimation: App.userSettings.smoothMap,
        };

        Util.setOptions(this, customOptions);
        Map.prototype.initialize.call(this, id, options);
        this.activeMap = defaultMap;
        this.pixelSize = pixelSize;
        this.imageBounds = new LatLngBounds({lat: 0, lng:0}, {lat: -this.pixelSize, lng: this.pixelSize});
        this.spinOptions = {color: "white", scale: 1.5, width: 5, shadow: "5px 5px 5px transparent"};
        this.activeTargetsMarkers = new LayerGroup().addTo(this);
        this.activeWeaponsMarkers = new LayerGroup().addTo(this);
        this.targetGrids = new LayerGroup().addTo(this);
        this.activeMarkers = new LayerGroup().addTo(this);
        this.activeArrowsGroup = new LayerGroup().addTo(this);
        this.activeRectanglesGroup = new LayerGroup().addTo(this);
        this.activeCirclesGroup = new LayerGroup().addTo(this);
        this.activeDrawingGroup = new LayerGroup().addTo(this);
        this.activeArrows = [];
        this.activeRectangles = [];
        this.activeCircles = [];
        this.activePolylines = [];
        this.layerGroup = new LayerGroup().addTo(this);
        this.markersGroup = new LayerGroup().addTo(this);
        this.history = [];
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
        this.contextMenu = new squadContextMenu();

        
        if (!Browser.mobile) {
            // On desktop create markers with a double click
            this.on("click", function(e) { this._handleclick(e); });
            this.on("dblclick", function(e) { this._handleDoubleClick(e); });
        } else {
            // On mobile just use single click
            this.on("click", function(e) { this._handleDoubleClick(e);});
            this.on("dblclick", function() { return false; });
        }

        this.on("contextmenu", this._handleContextMenu, this);
        this.on("zoomend", this._handleZoom, this);

        if (App.userSettings.keypadUnderCursor && App.hasMouse){
            this.on("pointermove", this._handleMouseMove, this);
            this.on("pointerout", this._handleMouseOut, this);
        }


        this.drawing = false;
        this.drawingMode = false;
        this.currentLine = null;
        this.points = [];

    },


    /**
     * Initiate Heightmap & Grid then load layer
     */
    draw: function(){

        this.gameToMapScale = this.pixelSize / this.activeMap.size;
        this.gameToMapScaleY = this.pixelSize / this.activeMap.sizeY;
        this.mapToGameScale = this.activeMap.size / this.pixelSize;
        this.detailedZoomThreshold = ( 3 + (this.activeMap.size / 7000) ) * 0.8;
       
        // Load Heightmap
        this.heightmap = new squadHeightmap(this);

        // remove existing grid and replace it
        if (this.grid) this.grid.remove();
        if (this.layer) this.layer = "";

        this.grid = new squadGrid(this, {opacity: App.userSettings.gridOpacity}).addTo(this.layerGroup);
        this.grid.setBounds([[0,0], [-this.pixelSize, this.pixelSize]]);

        // load map
        this.changeLayer(true);
    },


    /**
     * remove existing layer and replace it
     */
    changeLayer: function(changemap = false) {
        const LAYERMODE = $("#mapLayerMenu .active").attr("value");
        const OLDLAYER = this.activeLayer;

        // Show spinner
        this.spin(true, this.spinOptions);

        let imagePath = `${this.activeMap.mapURL}${LAYERMODE}`;

        if (App.userSettings.highQualityImages) {
            // Use TileLayer for high-quality images
            let tilePath = `${imagePath}_hq/{z}_{x}_{y}.webp`;
            this.activeLayer = new TileLayer(tilePath, {
                bounds: this.imageBounds,
                minNativeZoom: 0,
                maxNativeZoom : 5,
                edgeBufferTiles: 4,
                tileSize: 256,
            });
            this.activeLayer.addTo(this.layerGroup);
        } else {
            // Use ImageOverlay for standard images
            imagePath = `${imagePath}.webp`;
            this.activeLayer = new ImageOverlay(imagePath, this.imageBounds);
            this.activeLayer.addTo(this.layerGroup);
            $(this.activeLayer.getElement()).css("opacity", 0);
        }
    

        this.activeLayer.once("load", () => {
            if (App.userSettings.highQualityImages) {
                if (OLDLAYER) OLDLAYER.remove();
                this.spin(false);
            }
            else {
                // Animate the opacity of the new layer
                $(this.activeLayer.getElement()).fadeTo(700, 1, () => {
                    if (OLDLAYER) OLDLAYER.remove();
                    this.spin(false);
                });
            }
        });

        this.activeLayer.once("error", (e) => {
            console.error("Error loading", e.sourceTarget._url);
            if (OLDLAYER) OLDLAYER.remove();
            this.spin(false);
        });


        // Show grid and heatmap
        if (changemap) {
            if (App.userSettings.grid) this.showGrid();
            this.toggleHeatmap();
        }

    },


    /**
     * Show/Hide heatmap of commonly used
     */
    toggleHeatmap: function(){

        if ($(".btn-helpmap").hasClass("active")){
            this.spin(true, this.spinOptions);
            if (this.heatmap) this.heatmap.remove();
            fetchMarkersByMap(this.activeMap.name, App.activeWeapon.name)
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
        else if (this.heatmap) {
            this.removeLayer(this.heatmap);
            this.heatmap = null;
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

        // Clear Every existing Markers
        this.markersGroup.clearLayers();
        this.activeMarkers.clearLayers();
        this.activeWeaponsMarkers.clearLayers();
        this.activeTargetsMarkers.clearLayers();
        this.targetGrids.clearLayers();
        this.activeArrowsGroup.clearLayers();
        this.activeRectanglesGroup.clearLayers();
        this.activeCirclesGroup.clearLayers();
        this.activeArrows = [];
        this.activeRectangles = [];
        this.activeCircles = [];

        if (this.layer) this.layer.clear();

        // Empty and clear buttons of DOM elements
        $(".dropbtn8, .dropbtn9, .dropbtn10, .dropbtn11").empty();
        $("#factionsTab, .btn-delete, .btn-undo").hide();

        // Reset map view
        this.setView([-this.pixelSize/2, this.pixelSize/2], 2);
    },

    
    /**
     * Recalc and update every target marker on the minimap
     */
    updateTargets: function(copy = false){
        // Update existent targets
        this.activeTargetsMarkers.eachLayer(function (target) {
            target.updateCalc(copy);
            target.updateIcon();
        });
    },


    /**
     * Fade Out existing targets except the hovered one
     * @param {squadTargetMarker} hoveredTarget - Target that is hovered
     */
    fadeOtherTargets: function(hoveredTarget){
        this.activeTargetsMarkers.eachLayer((target) => {
            if (target != hoveredTarget) {
                target.off("pointerover");
                target.off("pointerout");
                target.setOpacity(0.65);
                target.calcMarker1.close();
                target.calcMarker2.close();
                target.disableSpreadRadii();
                target.disableDamageRadii();
                target.twentyFiveDamageRadius.setStyle({ opacity: 0 });
                target.removeLineToTarget();
                target.grid.hide();
            }
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
     * Delete every target markers on the map
     */
    deletePolylines: function(){
        this.activePolylines.forEach(function (poly) {
            poly.delete();
        });
    },


    /**
     * Delete every Contextmenu markers on the map
     */
    deleteMarkers: function(){
        this.activeMarkers.eachLayer(function (marker) {
            marker.delete();
        });
    },


    /**
     * Delete every Contextmenu Circle on the map
     */
    deleteCircles: function(){
        this.activeCircles.forEach(function (circle) {
            circle.delete();
        });
    },


    /**
     * Delete every Contextmenu Arrows on the map
     */
    deleteArrows: function(){
        this.activeArrows.forEach(arrow => {
            arrow.delete();
        });
    },


    /**
     * Delete every Contextmenu markers on the map
     */
    deleteRectangles: function(){
        this.activeRectangles.forEach(rectangle => {
            rectangle.delete();
        });
    },


    /**
     * Return true if there is at least one marker on the map
     * @returns {Boolean}
     */
    hasMarkers: function(){
        return (
            this.activeArrows.length > 0 ||
            this.activeMarkers.getLayers().length > 0 ||
            this.activeTargetsMarkers.getLayers().length > 0 ||
            this.activeRectangles.length > 0 ||
            this.activeCircles.length > 0 ||
            this.activePolylines.length > 0
        );
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
     * Add a new weapon marker to the minimap
     * @param {LatLng} latlng - coordinates of the new weapon
     * @param {String} uid - Optional - unique identifier of the weapon if created by the session
     **/
    createWeapon(latlng, uid = false, heightPadding = 0){
        let newMarker;
        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            newMarker = new squadWeaponMarker(latlng, {icon: mortarIcon, uid: uid, heightPadding: heightPadding}, this).addTo(this.markersGroup).addTo(this.activeWeaponsMarkers);
        } else if (this.activeWeaponsMarkers.getLayers().length === 1) {
            newMarker = new squadWeaponMarker(latlng, {icon: mortarIcon2, uid: uid, heightPadding: heightPadding}, this).addTo(this.markersGroup).addTo(this.activeWeaponsMarkers);
            this.activeWeaponsMarkers.getLayers()[0].setIcon(mortarIcon1);
            this.updateTargets();
        } else {
            return;
        }

        // If in a session, broadcast the new weapon with a unique identifier
        if (!uid && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("Creating new weapon with uid", newMarker.uid);
            App.session.ws.send(
                JSON.stringify({
                    type: "ADDING_WEAPON",
                    lat: latlng.lat,
                    lng: latlng.lng,
                    uid: newMarker.uid,
                    heightPadding: heightPadding,
                })
            );
        }

    },

    /**
     * Add a new target marker to the minimap
     * @param {LatLng} latlng - coordinates of the new target
     * @param {Event} e - event that triggered the creation
     * @param {String} uid - Optional - unique identifier of the target if created by the session
     */
    createTarget(latlng, event, uid = false){

        let target = new squadTargetMarker(latlng, {animate: App.userSettings.targetAnimation, uid: uid}, this).addTo(this.markersGroup);
        
        console.debug("Creating new target with uid", target.uid);
        if (!uid && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("sending new target with uid", target.uid);
            App.session.ws.send(
                JSON.stringify({
                    type: "ADDING_TARGET",
                    lat: latlng.lat,
                    lng: latlng.lng,
                    uid: target.uid,
                })
            );
        }

        // Add Item to history
        this.history.push(target);

        $(".btn-delete, .btn-undo").show();

        if (App.userSettings.targetAnimation){
            if (this.activeWeaponsMarkers.getLayers().length === 1) {
                if (isNaN(target.firingSolution1.elevation.high.rad)) return;
            } else if (isNaN(target.firingSolution1.elevation.high.rad) && isNaN(target.firingSolution2.elevation.high.rad)) {
                return;
            } 
            setTimeout(() => {
                if (event) explode(event.containerPoint.x, event.containerPoint.y, -190, 10);
                target.updateIcon(); // Update icon to remove the animation class, it was causing painfull DOM bug otherwise
            }, 250);
        }
    },

    /**
     * Update Mouse Location Content
     * @param {LatLng} latlng - coordinates of the mouse
     */
    updateMouseLocationPopup(latlng){
        const KP = this.getKP(-latlng.lat, latlng.lng);
        this.mouseLocationPopup.setLatLng(latlng).openOn(this);
        this.mouseLocationPopup.setContent(`<span>${KP.substring(0, 7)}</span><span class="subkp">${KP.substring(7, 11)}</span>`);
    },


    /**
     * Map onClick event handler
     * If in Session, create a visual ping and send it to the session
     * @param {event} event
     */
    _handleclick: function(event) {

        // If in drawing mode, ignore context menu
        if (this.drawingMode) return;
        
        if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            if (this.imageBounds.contains(event.latlng)){
                this.visualClick.triggerVisualClick(event.latlng);
                App.session.ws.send(
                    JSON.stringify({
                        type: "PING",
                        latlng: event.latlng,
                    })
                );
            }
        }
    },

    
    /**
     * Right-Click
     * Place a new WeaponMarker / Open ContextMenu
     */
    _handleContextMenu: function(event) {
        // If out of bounds
        if (!this.imageBounds.contains(event.latlng)) return 1;

        // If in drawing mode, ignore
        if (this.drawingMode) return;

        if (App.userSettings.contextMenu) {
            this.contextMenu.open(event);
        } else {
            this.createWeapon(event.latlng);
        }

    },


    /**
     * Double-Click
     * Create a new target, or weapon is none exists
     */
    _handleDoubleClick: function (event) {

        // If out of bounds
        if (!this.imageBounds.contains(event.latlng)) return 1;

        // If in drawing mode, ignore
        if (this.drawingMode) return;

        // No weapon yet ? Create one
        if (this.activeWeaponsMarkers.getLayers().length === 0) {
            this.createWeapon(event.latlng);
            return 0;
        }

        this.createTarget(event.latlng, event);
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
    _handleMouseMove: function (event) {

        // If out of bounds
        if (!this.imageBounds.contains(event.latlng)) {
            this.mouseLocationPopup.close();
            return 1;
        } 

        this.updateMouseLocationPopup(event.latlng);
    },


    /**
     * map zoomend event handler
     */
    _handleZoom: function() {

        // Update keypadUnderMouse precision
        if (App.userSettings.keypadUnderCursor && App.hasMouse){
            if (this.mouseLocationPopup._latlng){
                this.updateMouseLocationPopup(new LatLng(this.mouseLocationPopup._latlng.lat, this.mouseLocationPopup._latlng.lng));
            }
        }

        // If there is a layer selected, reveal capzone when enough zoomed in
        if (!this.layer) return;

        // Toggle capzones and main assets visibility according the zoom level
        if (this.getZoom() > this.detailedZoomThreshold && this.layer.isVisible){
            this.layer.revealAllCapzones();
            if (App.userSettings.showMainAssets) {
                this.layer.mainZones.assets.forEach(asset => { asset.setOpacity(1); });
                this.layer.revealSpawns();
                this.layer.vehicleSpawners.forEach(spawn => { spawn.show(); });
            }
        } else {
            this.layer.hideAllCapzones();
            App.minimap.layer.mainZones.assets.forEach(asset => { asset.setOpacity(0); });
            this.layer.hideSpawns();
            this.layer.vehicleSpawners.forEach(spawn => { spawn.hide(); });
        }

    },

    createMarker(latlng, team, category, icon, uid = false) {
        let markerOptions = { icon: "", circlesOnHover: false, team: team, category: category, icontype: icon, uid: uid };
        let markerSizeSetting = App.userSettings.markerSize;
        let iconSizeValue = 20 + (markerSizeSetting - 1) * 5;
        let iconSize = [iconSizeValue, iconSizeValue];

        if (icon === "deployable_mortars" || icon === "deployable_hellcannon") {
            let range = 0;
            if (icon === "deployable_mortars") range = 1237;
            if (icon === "deployable_hellcannon") range = 923;

            markerOptions.circles1Size = range * this.gameToMapScale;
            markerOptions.circlesOnHover = true;
            markerOptions.circles1Weight = 2;
            markerOptions.circles1Color = team === "ally" ? "white" : "#f23534";
        }

        if (icon === "deployable_fob_blue") {
            markerOptions.circlesOnHover = false;
            markerOptions.circles1Color = "#00E8FF";
            markerOptions.circles1Size = 150 * this.gameToMapScale;
            markerOptions.circles2Color = "white";
            markerOptions.circles2Size = this.activeMap.radiusExclusion * this.gameToMapScale;
        }
        if (icon === "deployable_fob") { 
            markerOptions.circlesOnHover = false;
            markerOptions.circles1Color = "#f23534";
            markerOptions.circles1Size = 150 * this.gameToMapScale;
            markerOptions.circles2Color = "white";
            markerOptions.circles2Size = this.activeMap.radiusExclusion * this.gameToMapScale;
        }
        if (icon === "deployable_hab_activated") { iconSize = [38, 38]; }
        if (icon === "T_strategic_uav") { 
            markerOptions.circles1Size = 300 * this.gameToMapScale;
            markerOptions.circles1Color = team === "ally" ? "#ffc400" : "#f23534";
        }
        markerOptions.icon = new Icon({
            iconUrl: `/api/v2/img/icons/${team}/${category}/${icon}.webp`,
            iconSize: iconSize,
            iconAnchor: [iconSize[0]/2, iconSize[1]/2],
            className: "squadMarker",
        });
        
        // Create marker and close context menu
        let newMarker = new squadStratMarker(latlng, markerOptions, this).addTo(this.activeMarkers);

        // Add Item to history
        this.history.push(newMarker);

        $(".btn-delete, .btn-undo").show();

        if (!uid && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("Creating a marker with uid", newMarker.uid);
        
            // Send the MOVING_WEAPON event to the server
            App.session.ws.send(
                JSON.stringify({
                    type: "ADDING_MARKER",
                    uid: newMarker.uid,
                    lat: latlng.lat,
                    lng: latlng.lng,
                    team: team,
                    category: category,
                    icon: icon
                })
            );
        }
        
    },


    disableDrawingMode() {
        this.dragging.enable();
        this.drawingMode = false;
        $("#map").css("cursor", App.userSettings.cursor ? "default" : "crosshair");
        $(".btn-drawingMode").hide();
    },


    enableDrawingMode() {
        this.dragging.disable();
        this.drawingMode = true;
        $("#map").css("cursor", "pointer");
        $(".btn-drawingMode").show();
    },


    createCircle: function (color, uid = false) {
        let isDrawing = true;
        let circle = null;
        const startLatLng = this.contextMenu.mainContextMenu.e.latlng;
        
        console.log("Starting circle drawing at", startLatLng, color);

        const handleMouseMove = (event) => {

            if (!isDrawing) return;
        
            // Calculate the lat/lng difference
            const latDelta = (event.latlng.lat - startLatLng.lat);
            const lngDelta = (event.latlng.lng - startLatLng.lng);
            const radius = Math.hypot(latDelta, lngDelta);

            if (circle) circle.circle.setRadius(radius);
            else circle = new MapCircle(this, color, startLatLng, radius, uid);
        };
    
        const handleClick = () => {
            if (isDrawing && circle) {
                isDrawing = false;
                this.off("mousemove", handleMouseMove);
    
                if (!circle.uid) circle.uid = uuidv4();
    
                // Send circle data via WebSocket
                if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                    console.debug("Sending new circle with uid", circle.uid);
                    App.session.ws.send(
                        JSON.stringify({
                            type: "ADDING_CIRCLE",
                            uid: circle.uid,
                            color: color,
                            latlng: circle.circle.getLatLng(),
                            radius: circle.circle.getRadius(),
                        })
                    );
                }
            }
        };
    
        const handleRightClick = () => {
            if (isDrawing && circle) {
                // Cancel the drawing process and remove the circle
                circle.delete();
                circle = null;
                isDrawing = false;
                this.off("pointermove", handleMouseMove);
            }
        };
    
        // Start tracking mouse movement immediately
        this.on("pointermove", handleMouseMove);
        this.once("click", handleClick);
        this.on("contextmenu", handleRightClick);
    },

    createArrow: function (color, uid = false) {
        let isDrawing = false;
        let arrow = null;
    
        const handleMouseMove = (event) => {
            if (!isDrawing) return;
    
            const endLatLng = event.latlng;
    
            if (arrow) {
                // Update the arrow's polyline positions
                arrow.polyline.setLatLngs([arrow.startLatLng, endLatLng]);
                arrow.polylineDecorator.setPaths([arrow.polyline.getLatLngs()]);
            } else {
                // Create a new arrow on first movement
                const startLatLng = this.contextMenu.mainContextMenu.e.latlng;
                arrow = new MapArrow(this, color, startLatLng, endLatLng, uid);
            }
        };
    
        const handleClick = () => {
            if (isDrawing && arrow) {
                isDrawing = false; // Stop the drawing process
                this.off("pointermove", handleMouseMove); // Remove the mousemove listener
    
                if (!arrow.uid) arrow.uid = uuidv4();
                
                // Send the arrow to the WebSocket server
                if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                    console.debug("sending new arrow with uid", arrow.uid);
                    App.session.ws.send(
                        JSON.stringify({
                            type: "ADDING_ARROW",
                            uid: arrow.uid,
                            color: color,
                            latlngs: arrow.polyline.getLatLngs(),
                        })
                    );
                }
            }
        };
    
        const handleRightClick = () => {
            if (isDrawing && arrow) {
                // Cancel drawing and remove the arrow
                arrow.delete(); // Custom method to clean up the arrow
                arrow = null; // Reset the arrow reference
                isDrawing = false;
                this.off("pointermove", handleMouseMove);
            }
        };
    
        // Initialize the arrow drawing process
        if (!isDrawing) {
            isDrawing = true;
            this.on("pointermove", handleMouseMove); // Start tracking mouse movement
            this.once("click", handleClick); // Finalize the arrow on click
            this.on("contextmenu", handleRightClick); // Cancel on right-click
        }
    },


    createRectangle: function (color, uid = false) {
        let isDrawing = true;
        let rectangle = null;
        const startLatLng = this.contextMenu.mainContextMenu.e.latlng;
    
        const handleMouseMove = (event) => {
            if (!isDrawing) return;
    
            const endLatLng = event.latlng;
    
            if (rectangle) {
                rectangle.rectangle.setBounds([startLatLng, endLatLng]);
            } else {
                rectangle = new MapRectangle(this, color, startLatLng, endLatLng, uid);
            }
        };
    
        const handleClick = () => {
            if (isDrawing && rectangle) {
                isDrawing = false;
                this.off("pointermove", handleMouseMove);
    
                if (!rectangle.uid) rectangle.uid = uuidv4();

                // Send rectangle data via WebSocket
                if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                    console.debug("Sending new rectangle with uid", rectangle.uid);
                    App.session.ws.send(
                        JSON.stringify({
                            type: "ADDING_RECTANGLE",
                            uid: rectangle.uid,
                            color: color,
                            bounds: rectangle.rectangle.getBounds(),
                        })
                    );
                }
            }
        };
    
        const handleRightClick = () => {
            if (isDrawing && rectangle) {
                // Cancel the drawing process and remove the rectangle
                rectangle.delete();
                rectangle = null;
                isDrawing = false;
                this.off("pointermove", handleMouseMove);
            }
        };
    
        // Start tracking mouse movement immediately
        this.on("pointermove", handleMouseMove);
        this.once("click", handleClick);
        this.on("contextmenu", handleRightClick);
    },

});