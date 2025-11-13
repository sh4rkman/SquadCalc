
import { App } from "../app.js";
import { CircleMarker, Polyline, Popup } from "leaflet";
import SquadSimulation from "./squadSimulation.js";
import SquadFiringSolution from "./squadFiringSolution.js";
import TargetGrid from "./squadTargetGrid.js";
import { sendTargetData } from "./squadCalcAPI.js";
import { targetIcon1, targetIconAnimated, targetIconDisabled, targetIconMinimal, targetSessionIcon1, targetIconSessionMinimal, targetIconMinimalDisabled } from "./squadIcon.js";
import { Ellipse } from "./libs/leaflet-ellipse.js";
import { squadMarker } from "./squadMarker.js";
import i18next from "i18next";

export const squadTargetMarker = squadMarker.extend({

    initialize: function (latlng, options, map) {

        squadMarker.prototype.initialize.call(this, latlng, options, map);

        if (options.uid) this.fromSession = true;
        
        let popUpOptions_weapon1 = {
            autoPan: false,
            autoClose: false,
            closeButton: false,
            closeOnEscapeKey: false,
            bubblingMouseEvents: false,
            interactive: false,
            minWidth: 100,
            className: "calcPopup",
        };

        let popUpOptions_weapon2 = {
            ...popUpOptions_weapon1,
            className: "calcPopup2"
        };

        this.posPopUpOptions = {
            ...popUpOptions_weapon1,
            className: "posPopUpTarget"
        };

        this.spreadOptionsOn = {
            opacity: 1,
            fillOpacity: 0.2,
            color: this.fromSession ? "#008abd" : App.mainColor,
            weight: 1.3,
        };

        this.spreadOptionsOff = {
            opacity: 0,
            fillOpacity: 0,
        };

        this.hundredDamageCircleOn = {
            radius: 0,
            opacity: 1,
            fillOpacity: 0,
            dashArray: "5,3",
            color: this.fromSession ? "#008abd" : App.mainColor,
            weight: 1.3,
        };

        this.twentyFiveDamageCircleOn = {
            radius: 0,
            opacity: 1,
            fillOpacity: 0,
            dashArray: "5,6",
            color: this.fromSession ? "#008abd" : App.mainColor,
            weight: 1.3,
        };

        this.miniCircleOptions = {
            radius: 4,
            opacity: 0,
            color: this.fromSession ? "#008abd" : App.mainColor,
            fillOpacity: 0,
            weight: 1,
            autoPan: false,
        };

        this.isDragging = false;

        // Create marker
        this.addTo(this.map.activeTargetsMarkers);
        this.miniCircle = new CircleMarker(latlng, this.miniCircleOptions).addTo(this.map.markersGroup);
        this.firingSolution1 = new SquadFiringSolution(this.map.activeWeaponsMarkers.getLayers()[0].getLatLng(), this.getLatLng(), this.map, this.map.activeWeaponsMarkers.getLayers()[0].heightPadding);

        // Report target to squadcalc API
        if (!options.uid) {
            sendTargetData({
                lat: latlng.lat,
                lng: latlng.lng,
                weapon: App.activeWeapon.name,
                map: App.minimap.activeMap.name,
            });
        }

        // Calc PopUps
        this.calcMarker1 = new Popup(popUpOptions_weapon1).setLatLng(latlng).addTo(this.map.markersGroup);
        this.calcMarker2 = new Popup(popUpOptions_weapon2).setLatLng(latlng).addTo(this.map.markersGroup);
        
        // posPopUp
        this.posPopUp = new Popup(this.posPopUpOptions).setLatLng(latlng).addTo(this.map.markersGroup).close();
        this.updateCalcPopUps();

        const [html1, clipboard1] = this.getContent(this.firingSolution1, this.map.activeWeaponsMarkers.getLayers()[0].angleType);
        this.calcMarker1.setContent(html1).openOn(this.map);
        if (App.userSettings.copyTarget && !options.uid) navigator.clipboard.writeText(clipboard1);
        

        // If two weapons already on the map
        if (this.map.activeWeaponsMarkers.getLayers().length === 2) {
            this.firingSolution2 = new SquadFiringSolution(this.map.activeWeaponsMarkers.getLayers()[1].getLatLng(), this.getLatLng(), this.map, this.map.activeWeaponsMarkers.getLayers()[1].heightPadding);
            this.calcMarker1.setContent(`1. ${html1}`);
            const [html2, clipboard2] = this.getContent(this.firingSolution2, this.map.activeWeaponsMarkers.getLayers()[1].angleType);
            this.calcMarker2.setContent(`2. ${html2}`).openOn(this.map);
            if (App.userSettings.copyTarget && !options.uid) navigator.clipboard.writeText(`${clipboard1} / ${clipboard2}`);  
        }

        // Initialise the target Grid
        this.grid = new TargetGrid(this.map, ...this.getFirstAvailableWeapon());
        this.linesBetweenTargets = [];
        this.drawLineToTarget();

        // Initiate Spread Ellipse
        this.spreadMarker1 = new Ellipse(latlng, [0, 0], 0, this.spreadOptionsOff).addTo(this.map.markersGroup);
        this.spreadMarker11 = new Ellipse(latlng, [0, 0], 0, this.spreadOptionsOff).addTo(this.map.markersGroup);
        this.spreadMarker2 = new Ellipse(latlng, [0, 0], 0, this.spreadOptionsOff).addTo(this.map.markersGroup);
        
        this.updateSpread();

        // Initiate Damage Ellipse
        this.hundredDamageRadius = new Ellipse(latlng, [0, 0], 0, this.hundredDamageCircleOn).addTo(this.map.markersGroup);
        this.twentyFiveDamageRadius = new Ellipse(latlng, [0, 0], 0, this.twentyFiveDamageCircleOn).addTo(this.map.markersGroup);
        this.updateDamageRadius();

        this.updateIcon(true);

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("contextmenu", this._handleContextMenu, this);

        if (App.hasMouse) {
            this.on("pointerover", this._handleMouseOver, this);
            this.on("pointerout", this._handleMouseOut, this);
        }

    },

    
    /**
     * Update the Calculation PopUps position
     * according to marker type selected in user settings (Large/Minimal)
     */
    updateCalcPopUps: function(){
        if (!App.userSettings.targetAnimation) {
            this.calcMarker1.options.offset = [-60, 15];
            this.calcMarker2.options.offset = [63, 15];
        }
        else {
            this.calcMarker1.options.offset = [-65, 0];
            this.calcMarker2.options.offset = [68, 0];
        }
        this.calcMarker1.update();
        this.calcMarker2.update();
    },


    /**
     * Remove the target marker and every object tied
     */
    delete: function(broadcast = true){

        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(JSON.stringify({ type: "DELETE_TARGET", uid: this.uid}));
            console.debug(`Sent delete request for target with UID: ${this.uid}`);
        }

        // Unbind all custom event handlers
        this.off();

        // Remove the marker from targets array history
        this.map.history = this.map.history.filter(object => object !== this);

        // Remove everything attached from the map
        this.spreadMarker1.removeFrom(this.map.markersGroup).remove();
        this.spreadMarker11.removeFrom(this.map.markersGroup).remove();
        this.spreadMarker2.removeFrom(this.map.markersGroup).remove();
        this.calcMarker1.removeFrom(this.map.markersGroup).remove();
        this.calcMarker2.removeFrom(this.map.markersGroup).remove();
        this.miniCircle.removeFrom(this.map.markersGroup).remove();
        this.hundredDamageRadius.removeFrom(this.map.markersGroup).remove();
        this.twentyFiveDamageRadius.removeFrom(this.map.markersGroup).remove();
        this.posPopUp.removeFrom(this.map.markersGroup).remove();

        this.grid.clear();
        this.removeLineToTarget();
        
        // Remove the marker itself
        this.removeFrom(this.map.markersGroup).removeFrom(this.map.activeTargetsMarkers).remove();
    
        // If that was the last Marker on the map, hide "delete/undo" buttons
        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo, .btn-download").hide();
    },


    /**
     * Returns the HTML content for the calculation popups
     * @param {SquadFiringSolution} firingSolution 
     * @param {String} angleType 
     * @returns {String[]} - [HTML content, summary text]
     */
    getContent: function (firingSolution, angleType) {
        const DIST = firingSolution.distance;
        const BEARING = firingSolution.bearing;
        let heightDiff = firingSolution.heightDiff.toFixed(0);

        // Avoid "-0"
        if (heightDiff == -0 || Math.sign(heightDiff) === 1) {
            heightDiff = `+${Math.abs(heightDiff)}`;
        }

        /**
         * Formats elevation and time of flight values
         * @param {Object} elevationData 
         * @param {Number} timeOfFlight 
         * @returns {[string, string]} - [elevation, timeOfFlight]
         */
        const formatElevationData = (elevationData, timeOfFlight) => {
            if (isNaN(elevationData?.rad)) return ["---", "---"];
            const elevation = App.activeWeapon.unit === "mil" ? elevationData.mil.toFixed(0) : elevationData.deg.toFixed(1);

            if(App.activeWeapon.name === "BTR4-AGS"){
                elevationData.deg = elevationData.deg - 0.82;
                let degrees = Math.floor(elevationData.deg);
                let minutes = Math.round((elevationData.deg - degrees) * 60);
                if (minutes === 60) {
                    degrees += 1;
                    minutes = 0;
                }
                return [`${degrees}°${minutes.toString().padStart(2, '0')}'`, `${timeOfFlight.toFixed(0)}<span data-i18n="common:s">${i18next.t("common:s")}</span>`];
            }

            const formattedTime = `${timeOfFlight.toFixed(0)}<span data-i18n="common:s">${i18next.t("common:s")}</span>`;
            return [elevation, formattedTime];
        };

        let elevation, timeOfFlight;

        if (App.userSettings.lowAndHigh && !["Mortar", "UB-32", "M1064M121", "Mk19"].includes(App.activeWeapon.name)) {
            const [elevationLow, timeLow] = formatElevationData(firingSolution.elevation.low, firingSolution.timeOfFlight.low);
            const [elevationHigh, timeHigh] = formatElevationData(firingSolution.elevation.high, firingSolution.timeOfFlight.high);
            elevation = `${elevationLow} / ${elevationHigh}`;
            timeOfFlight = `${timeLow} / ${timeHigh}`;
        } else {
            const selectedElevation = angleType === "high" ? firingSolution.elevation.high : firingSolution.elevation.low;
            const selectedTimeOfFlight = angleType === "high" ? firingSolution.timeOfFlight.high : firingSolution.timeOfFlight.low;
            [elevation, timeOfFlight] = formatElevationData(selectedElevation, selectedTimeOfFlight);
        }

        let content;
        


        // Checks if last three elevation digits option is enabled and if selected weapon is "Mortar"
        // TODO move this in the previous if statement when other weapons are supported
        if (App.userSettings.lastDigits && ["Mortar"].includes(App.activeWeapon.name)){
            content = `<span class=calcNumber></span></br><span>${elevation.toString().slice(-3)}</span>`;
        } else {
            content = `<span class="calcNumber"></span><br><span>${elevation}</span>`;
        }

        if (App.userSettings.showBearing) content += `<br><span class=bearingUiCalc>${BEARING.toFixed(1)}<span data-i18n="common:°">${i18next.t("common:°")}</span></span>`;
        if (App.userSettings.showTimeOfFlight) content += `<br><span class=bearingUiCalc>${timeOfFlight}</span>`;
        if (App.userSettings.showDistance) content += `<br><span class=bearingUiCalc>${DIST.toFixed(0)}<span data-i18n="common:m">${i18next.t("common:m")}</span></span>`;
        if (App.userSettings.showHeight) content += `<br><span class=bearingUiCalc>${heightDiff}<span data-i18n="common:m">${i18next.t("common:m")}</span></span>`;
        return [content, `${i18next.t("common:elevation")}: ${elevation} - ${i18next.t("common:bearing")}: ${BEARING.toFixed(1)}°`];
    },



    /*
    * Update target spread ellipses according to it's firing solutions
    */
    updateSpread: function(){
        let spreadParameters;
        const weapons = this.map.activeWeaponsMarkers.getLayers();
        const gameToMapScale = this.map.gameToMapScale;
    
        // No spread wanted, return
        if (!App.userSettings.spreadRadius) {
            this.disableSpreadRadii();
            return;
        }
    
        const setSpreadMarker = (marker, firingSolution, layerIndex, reverse = false) => {
            const angleType = weapons[layerIndex].angleType;
            let elevation;
            if (reverse) {
                elevation = angleType === "high" ? firingSolution.elevation.low.rad : firingSolution.elevation.high.rad;
            } else {
                elevation = angleType === "high" ? firingSolution.elevation.high.rad : firingSolution.elevation.low.rad;
            }
            
            if (!isNaN(elevation)) {
                if (reverse) {
                    spreadParameters = angleType === "high" ? firingSolution.spreadParameters.low : firingSolution.spreadParameters.high;
                } else {
                    spreadParameters = angleType === "high" ? firingSolution.spreadParameters.high : firingSolution.spreadParameters.low;
                }
                marker.setRadius([(spreadParameters.semiMajorAxis * gameToMapScale) / 2, (spreadParameters.semiMinorAxis * gameToMapScale) / 2]);
                marker.setTilt(firingSolution.bearing);
                marker.setStyle(this.spreadOptionsOn);
            } else {
                marker.setStyle(this.spreadOptionsOff);
            }
        };
    
        // Spread for Weapon1
        setSpreadMarker(this.spreadMarker1, this.firingSolution1, 0);
    
        if (App.userSettings.lowAndHigh &&
            App.activeWeapon.name != "Mortar" &&
             App.activeWeapon.name != "UB-32" &&
              App.activeWeapon.name != "M1064M121" &&
               App.activeWeapon.name != "Mk19") {  
            setSpreadMarker(this.spreadMarker11, this.firingSolution1, 0, true);
        } else {
            this.spreadMarker11.setStyle(this.spreadOptionsOff);
        }

        // Spread for Weapon2
        if (weapons.length === 2) {
            setSpreadMarker(this.spreadMarker2, this.firingSolution2, 1);
        } else {
            this.spreadMarker2.setStyle(this.spreadOptionsOff);
        }
    },


    disableDamageRadii: function() {
        this.hundredDamageRadius.setStyle(this.spreadOptionsOff);
        this.twentyFiveDamageRadius.setStyle(this.spreadOptionsOff);
    },

    disableSpreadRadii: function() {
        this.spreadMarker1.setStyle(this.spreadOptionsOff);
        this.spreadMarker11.setStyle(this.spreadOptionsOff);
        this.spreadMarker2.setStyle(this.spreadOptionsOff);
    },

    /*
    * Update target damage radius ellipses according to it's firing solutions
    */
    updateDamageRadius: function() {
        // If damage radius is disabled, turn off the circles and exit
        if (!App.userSettings.damageRadius) {
            this.disableDamageRadii();
            return;
        }
    
        // Calculate damage radii based on map scale
        const RADIUS100 = App.activeWeapon.hundredDamageRadius * this.map.gameToMapScale;
        const RADIUS25 = App.activeWeapon.twentyFiveDamageRadius * this.map.gameToMapScale;
    
        // Check if first firing solution is valid
        const hasFiringSolution1 = !isNaN(this.firingSolution1.elevation.high.rad) || !isNaN(this.firingSolution1.elevation.low.rad);
    
        // Default to first marker and bearing
        let baseRadiiX = this.spreadMarker1.getRadius().x;
        let baseRadiiY = this.spreadMarker1.getRadius().y;
        let baseBearing = this.firingSolution1.bearing;
    
        // If two markers exist, do some additional checks
        if (this.map.activeWeaponsMarkers.getLayers().length == 2) {
            const hasFiringSolution2 = !isNaN(this.firingSolution2.elevation.high.rad) || !isNaN(this.firingSolution2.elevation.low.rad);
                                        
            // If no valid solutions, turn off circles
            if (!hasFiringSolution1 && !hasFiringSolution2) {
                this.disableDamageRadii();
                return;
            }
    
            // Adjust radii and bearing based on which solutions are valid
            if (!hasFiringSolution1) {
                baseRadiiX = this.spreadMarker2.getRadius().x;
                baseRadiiY = this.spreadMarker2.getRadius().y;
                baseBearing = this.firingSolution2.bearing;
            } else if (!hasFiringSolution2) {
                baseRadiiX = this.spreadMarker1.getRadius().x;
                baseRadiiY = this.spreadMarker1.getRadius().y;
                baseBearing = this.firingSolution1.bearing;
            } else {
                // If there are two firing solutions, draw a circle with the biggest radius found in the spreads
                baseRadiiX = Math.max(
                    this.spreadMarker1.getRadius().x, 
                    this.spreadMarker2.getRadius().x, 
                    this.spreadMarker1.getRadius().y,
                    this.spreadMarker2.getRadius().y
                );
                baseRadiiY = baseRadiiX;
            }
        } else if (!hasFiringSolution1) {
            // If only one marker but no valid solution, turn off circles
            this.disableDamageRadii();
            return;
        } else if (App.userSettings.lowAndHigh &&
            App.activeWeapon.name != "Mortar" &&
             App.activeWeapon.name != "UB-32" &&
              App.activeWeapon.name != "M1064M121" &&
               App.activeWeapon.name != "Mk19") {
            baseRadiiX = Math.max(this.spreadMarker1.getRadius().x, this.spreadMarker11.getRadius().x);  
            baseRadiiY = Math.max(this.spreadMarker1.getRadius().y, this.spreadMarker11.getRadius().y);
        }
    
        // Determine radii based on spread radius setting
        const hundredRadii = App.userSettings.spreadRadius ? [baseRadiiX + RADIUS100, baseRadiiY + RADIUS100] : [RADIUS100, RADIUS100];
        const twentyFiveRadii = App.userSettings.spreadRadius ? [baseRadiiX + RADIUS25, baseRadiiY + RADIUS25] : [RADIUS25, RADIUS25];
    
        // Set radii, styles, and tilt
        this.hundredDamageRadius.setRadius(hundredRadii);
        this.twentyFiveDamageRadius.setRadius(twentyFiveRadii);
        this.hundredDamageRadius.setStyle(this.hundredDamageCircleOn);
        this.twentyFiveDamageRadius.setStyle(this.twentyFiveDamageCircleOn);
        this.hundredDamageRadius.setTilt(baseBearing);
        this.twentyFiveDamageRadius.setTilt(baseBearing);
    },

    /*
    * Update target calculationPopups according to it's firing solutions
    */
    updateCalc: function(copy = false){
        let clipboard;
        this.firingSolution1 = new SquadFiringSolution(this.map.activeWeaponsMarkers.getLayers()[0].getLatLng(), this.getLatLng(), this.map, this.map.activeWeaponsMarkers.getLayers()[0].heightPadding);
        const [html1, clipboard1] = this.getContent(this.firingSolution1, this.map.activeWeaponsMarkers.getLayers()[0].angleType);
        this.calcMarker1.setContent(html1);
        clipboard = clipboard1;

        if (this.map.activeWeaponsMarkers.getLayers().length === 2) {
            this.firingSolution2 = new SquadFiringSolution(this.map.activeWeaponsMarkers.getLayers()[1].getLatLng(), this.getLatLng(), this.map, this.map.activeWeaponsMarkers.getLayers()[1].heightPadding);
            const [html2, clipboard2] = this.getContent(this.firingSolution2, this.map.activeWeaponsMarkers.getLayers()[1].angleType);
            this.calcMarker1.setContent(`1. ${html1}`);
            this.calcMarker2.setContent(`2. ${html2}`).openOn(this.map);
            clipboard = `1. ${clipboard} / 2. ${clipboard2}`;
        } else {
            this.calcMarker2.close();
        }

        // Refresh targetGrids
        this.grid.clear();
        this.grid = new TargetGrid(this.map, ...this.getFirstAvailableWeapon());

        this.removeLineToTarget();
        this.drawLineToTarget();

        this.updateSpread();
        this.updateDamageRadius();
        if (copy && App.userSettings.copyTarget) navigator.clipboard.writeText(clipboard);
    },


    /**
     * Set/Update the target icon according to it's firing solutions and user settings
     * @param {Boolean} animated - If the icon should be animated when set
     */
    updateIcon: function (animated = false) {
        const weapons = this.map.activeWeaponsMarkers.getLayers();
        const angleType = weapons[0].angleType;
        const elevationKey = angleType === "high" ? "high" : "low";
    
        const elevation = this.firingSolution1.elevation[elevationKey]?.rad;
        const elevation2 = weapons.length === 2 ? this.firingSolution2.elevation[elevationKey]?.rad : null;
    
        const isSingleWeapon = weapons.length === 1;
        const bothElevationsInvalid = isNaN(elevation) && isNaN(elevation2);
        const targetAnimation = App.userSettings.targetAnimation;
        let icon;

        // Determine the base icon type
        if (isSingleWeapon && isNaN(elevation)) {
            icon = targetAnimation ? targetIconDisabled : targetIconMinimalDisabled;
        } else if (!isSingleWeapon && bothElevationsInvalid) {
            icon = targetAnimation ? targetIconDisabled : targetIconMinimalDisabled;
        } else if (this.fromSession){
            if (targetAnimation) icon = targetSessionIcon1;
            else icon = targetIconSessionMinimal;
        }
        else if (targetAnimation) icon = animated ? targetIconAnimated : targetIcon1;
        else icon = targetIconMinimal;
        
        // hack leaflet to avoid unwanted click event
        // https://github.com/Leaflet/Leaflet/issues/5067
        setTimeout((function (this2) {
            return function () {
                this2.setIcon(icon);
            };
        })(this));

    },

    _handleClick: function() {
        const DIALOG = document.getElementById("calcInformation");
        let simulation2;
        let weaponPos2;
        let heightPath2;

        $("#sim1").addClass("active");
        $("#sim2").removeClass("active");
        $("#canvasControls > .active").first().removeClass("active");
        $("#canvasControls > button").first().addClass("active");

        const weaponPos1 = this.map.activeWeaponsMarkers.getLayers()[0].getLatLng();
        const heightPath1 = this._map.heightmap.getHeightPath(weaponPos1, this.getLatLng());
        const simulation1 = new SquadSimulation("#sim1", this.firingSolution1, heightPath1, this.map.activeWeaponsMarkers.getLayers()[0].angleType, App.activeWeapon.unit);
        $("#canvasControls").css("display", "none");

        if (this.map.activeWeaponsMarkers.getLayers().length === 2){
            $("#canvasControls").css("display", "block");
            weaponPos2 = this.map.activeWeaponsMarkers.getLayers()[1].getLatLng();
            heightPath2 = this._map.heightmap.getHeightPath(weaponPos2, this.getLatLng());
            simulation2 = new SquadSimulation("#sim2", this.firingSolution2, heightPath2, this.map.activeWeaponsMarkers.getLayers()[1].angleType, App.activeWeapon.unit);
        }

        // If the user close the modal, stop the animation
        // ...or it does crazy stuff if he reopen it before the animation runs out
        DIALOG.addEventListener("close", function(){
            cancelAnimationFrame(simulation1.animationFrame);
            if (simulation2){ cancelAnimationFrame(simulation2.animationFrame);}
        });

        DIALOG.showModal();
    },

    // Keep the marker on map & update calc while dragging
    _handleDrag: function (event) {

        // When dragging marker out of bounds, block it at the edge
        event = this.keepOnMap(event);

        // Update Positions
        this.setLatLng(event.latlng);
        this.calcMarker1.setLatLng(event.latlng);
        this.spreadMarker1.setLatLng(event.latlng);
        this.spreadMarker11.setLatLng(event.latlng);
        this.calcMarker2.setLatLng(event.latlng);
        this.spreadMarker2.setLatLng(event.latlng);
        this.miniCircle.setLatLng(event.latlng);
        this.hundredDamageRadius.setLatLng(event.latlng);
        this.twentyFiveDamageRadius.setLatLng(event.latlng);
        this.grid.clear();

        // Update Position PopUp Content
        if (App.userSettings.targetDrag) {
            this.posPopUp.setLatLng(event.latlng).setContent(this.map.getKP(-event.latlng.lat, event.latlng.lng, 4));
        }

        // On mobile save performance
        if (!App.hasMouse) return;

        // Update bearing/elevation/spread marker
        this.updateCalc();  
    },

    
    _handleDragStart: function () {
        this.isDragging = true;
        this.map.mouseLocationPopup.close();
        this.map.off("pointermove", this.map._handleMouseMove);

        if (!App.hasMouse) {
            this.calcMarker1.setContent("  ");
            this.calcMarker2.setContent("  ");
            this.disableSpreadRadii();
            this.disableDamageRadii();
            this.removeLineToTarget();
        }

        if (App.userSettings.targetDrag) {
            // Set a different offset when several weapons are on the map
            let offset = this.map.activeWeaponsMarkers.getLayers()[1] ? [0, -20] : [0, -10];
            this.posPopUp.options.offset = offset;
            this.posPopUp.openOn(this.map); 
        }
        
        this.miniCircle.setStyle({opacity: 1});
    },

    // Hide stuff, do a final update and send data to API
    _handleDragEnd: function (event) {

        // Send the MOVING_WEAPON event to the server
        if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(
                JSON.stringify({
                    type: "MOVING_TARGET",
                    lat: this.getLatLng().lat,
                    lng: this.getLatLng().lng,
                    uid: this.uid,
                })
            );
        }

        if (App.userSettings.keypadUnderCursor) this.map.on("pointermove", this.map._handleMouseMove);

        // Hide PositionPopUp & MiniCircle
        this.isDragging = false;
        this.posPopUp.close();
        this.miniCircle.setStyle({opacity: 0});
        
        // update one last time when drag end
        this.updateCalc(true);
        this.updateIcon();

        // Report target to squadcalc API
        sendTargetData({
            lat: event.target.getLatLng().lat,
            lng: event.target.getLatLng().lng,
            weapon: App.activeWeapon.name,
            map: App.minimap.activeMap.name,
        });
    },

    // Delete targetMarker on right clic
    _handleContextMenu: function(e){

        // Avoid other target keeping fading
        clearTimeout(this.mouseOverTimeout);

        // If it's too late, Fade every other targets back in
        this.map.activeTargetsMarkers.eachLayer((target) => {
            target.on("pointerover", target._handleMouseOver, target);
            target.on("pointerout", target._handleMouseOut, target);
            target.setOpacity(1);
            target.calcMarker1.openOn(this.map);
            if (this.map.activeWeaponsMarkers.getLayers()[1]) target.calcMarker2.openOn(this.map);
            target.updateSpread();
            target.updateDamageRadius();
            target.drawLineToTarget();
            target.grid.show();
        });

        // Prevent right click to happen on elements behind
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();

        // We can now safely start deleting
        this.delete();
    },

    // On Hovering for more than 500ms hide other targets
    _handleMouseOver: function() {
        this.mouseOverTimeout = setTimeout(() => {
            if (!this.isDragging) this.map.fadeOtherTargets(this); // Hide other targets
        }, 500);
    },

    _handleMouseOut: function() {

        // Cancel the timeout if the user moves the mouse out before 1 second
        clearTimeout(this.mouseOverTimeout);

        this.calcMarker1.getElement().style.zIndex  = "";
        this.calcMarker2.getElement().style.zIndex  = "";

        if (!this.isDragging) {
            this.map.activeTargetsMarkers.eachLayer((target) => {
                target.on("pointerover", target._handleMouseOver, target);
                target.on("pointerout", target._handleMouseOut, target);
                target.setOpacity(1);
                target.calcMarker1.openOn(this.map);
                if (this.map.activeWeaponsMarkers.getLayers()[1]) target.calcMarker2.openOn(this.map);
                target.updateSpread();
                target.updateDamageRadius();
                target.drawLineToTarget();
                target.grid.show();
            });
        }
    },

    getFirstAvailableWeapon: function () {
        if (
            this.map.activeWeaponsMarkers.getLayers().length === 2 &&
            isNaN(this.firingSolution1.elevation.high.rad) && isNaN(this.firingSolution1.elevation.low.rad) &&
            (!isNaN(this.firingSolution2.elevation.high.rad) || !isNaN(this.firingSolution2.elevation.low.rad))
        ) {
            return [this.firingSolution2, this.map.activeWeaponsMarkers.getLayers()[1]];
        }

        return [this.firingSolution1, this.map.activeWeaponsMarkers.getLayers()[0]];
    },

    drawLineToTarget: function () {
        
        if (!App.userSettings.lineToTarget) return;

        // Remove existing lines
        this.removeLineToTarget();
        
        let lines = [];

        if (!isNaN(this.firingSolution1.elevation.high.rad) || !isNaN(this.firingSolution1.elevation.low.rad)) {
            lines.push([this.firingSolution1.weaponLatLng, this.getLatLng()]);
        }
        if (this.map.activeWeaponsMarkers.getLayers().length === 2 && (!isNaN(this.firingSolution2.elevation.high.rad) || !isNaN(this.firingSolution2.elevation.low.rad))) {
            lines.push([this.firingSolution2.weaponLatLng, this.getLatLng()]);
        }

        for (const line of lines) {
            this.linesBetweenTargets.push(new Polyline(line, {
                color: "white",
                opacity: 0.65,
                weight: 2,
                showMeasurements: false,
            }).addTo(this.map.markersGroup));
        }
    },

    removeLineToTarget: function () {
        if (this.linesBetweenTargets.length > 0) {
            for (const linesBetweenTarget of this.linesBetweenTargets) {
                linesBetweenTarget.removeFrom(this.map.markersGroup).remove();
            }
        }
    }
});