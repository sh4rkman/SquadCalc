import { App } from "../app.js";
import { ellipse } from "./libs/leaflet.ellipse.js";
import { Marker, Circle, CircleMarker, Popup, Polygon } from "leaflet";
import { targetIcon1, targetIconAnimated, targetIconDisabled, targetIconMinimal, targetIconMinimalDisabled } from "./squadIcon.js";
import SquadSimulation from "./squadSimulation.js";
import SquadFiringSolution from "./squadFiringSolution.js";
import i18next from "i18next";
import { sendMarkerData, sendTargetData } from "./squadCalcAPI.js";
import { animateCSS } from "./animations.js";



/*
 * Global Squad Marker Class 
*/
export var squadMarker = Marker.extend({
    options: {
        draggable: true,
        riseOnHover: true,
        keyboard: false,
        animate: true,
    },

    // Constructor
    initialize: function (latlng, options, map) {
        Marker.prototype.initialize.call(this, latlng, options);
        this.map = map;
        this.on("dragstart", this._handleDragStart, this);
        this.on("dragend", this._handleDragEnd, this);
    },

    /**
     * Force a given event to stay inside the map bounds
     * @param {e} [event] - event
     * @returns {e} - same event with corrected Latlng 
     */
    keepOnMap: function(e){
        if (e.latlng.lng > this.map.pixelSize) {e.latlng.lng = this.map.pixelSize;}
        if (e.latlng.lat < -this.map.pixelSize ) {e.latlng.lat = -this.map.pixelSize;}
        if (e.latlng.lng < 0) {e.latlng.lng = 0;}
        if (e.latlng.lat > 0) {e.latlng.lat = 0;}
        return e;
    },

});

export var squadWeaponMarker = squadMarker.extend({

    initialize: function (latlng, options, map) {
        const CIRCLESCOLOR = "#00137f";
        const FOBRANGECOLOR = "white";

        squadMarker.prototype.initialize.call(this, latlng, options, map);
        
        this.posPopUpOptions = {
            autoPan: false,
            autoClose: false,
            closeButton: false,
            closeOnEscapeKey: false,
            bubblingMouseEvents: false,
            interactive: false,
            className: "posPopUpWeapon",
            minWidth: 100,
            offset: [0, -20],
        };

        this.maxDistCircleOn = {
            radius: App.activeWeapon.getMaxDistance() * this.map.gameToMapScale,
            opacity: 0.7,
            color: CIRCLESCOLOR,
            fillOpacity: 0,
            weight: 2,
            autoPan: false,
        };

        this.minDistCircleOn = {
            radius: App.activeWeapon.minDistance * this.map.gameToMapScale,
            opacity: 0.7,
            color: CIRCLESCOLOR,
            fillOpacity: 0.2,
            weight: 1,
            autoPan: false,
        };

        this.minMaxDistCircleOff = {
            radius: 0,
            opacity: 0,
            fillOpacity: 0,
        };

        this.miniCircleOptions = {
            radius: 4,
            opacity: 0,
            color: CIRCLESCOLOR,
            fillOpacity: 0,
            weight: 1,
            autoPan: false,
        };

        this.fobCircleOptions = {
            radius: 150 * this.map.gameToMapScale,
            opacity: 0,
            dashArray: "5,5",
            fillOpacity: 0,
            color: FOBRANGECOLOR,
            weight: 2,
            autoPan: false,
        };


        this.angleType = App.activeWeapon.angleType;
        this.heightPadding = 0;

        // Create the min/max range markers
        this.minRangeMarker = new Circle(latlng, this.minDistCircleOn).addTo(this.map.markersGroup);
        this.rangeMarker = new Circle(latlng, this.maxDistCircleOn).addTo(this.map.markersGroup);
        this.miniCircle = new CircleMarker(latlng, this.miniCircleOptions).addTo(this.map.markersGroup);
        this.fobCircle = new Circle(latlng, this.fobCircleOptions).addTo(this.map.markersGroup);
        
        // Initiate Position PopUp
        this.posPopUp = new Popup(this.posPopUpOptions).setLatLng(latlng).addTo(this.map.markersGroup).close();

        // Hide minRangeMarker if weapon doesn't have minimum range
        if (this.minRangeMarker.getRadius() == 0) {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
        }

        this.getIcon();

        // Report marker to squadcalc API
        sendMarkerData({
            lat: this._latlng.lat,
            lng: this._latlng.lng,
            weapon: App.activeWeapon.name,
            map: App.minimap.activeMap.name,
        });

        if (App.userSettings.realMaxRange) {
            this.updateWeaponMaxRange(true);
            this.rangeMarker.setStyle({opacity: 0});
        } 

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("dblclick", this._handleDblclick, this);
        this.on("contextmenu", this._handleContextMenu, this);
        if (App.hasMouse){
            this.on("mouseover", this._handleMouseOver, this);
            this.on("mouseout", this._handleMouseOut, this);
        }
    },


    getIcon: function(){
        if (this.map.activeWeaponsMarkers.getLayers().length === 0) {
            this.setIcon(App.activeWeapon.marker);
        }
    },

    updateIcon: function(){
        if (this.map.activeWeaponsMarkers.getLayers().length === 1) {
            this.setIcon(App.activeWeapon.marker);
        }
    },

    


    /**
     * update calcs, spread markers
     */
    updateWeapon: function(){

        var radiusMax = App.activeWeapon.getMaxDistance() * this.map.gameToMapScale;
        var radiusMin = App.activeWeapon.minDistance * this.map.gameToMapScale;

        this.angleType = App.activeWeapon.angleType;
        this.minRangeMarker.setRadius(radiusMin);
        this.rangeMarker.setRadius(radiusMax);

        // Update MinRange circle opacity
        if (this.minRangeMarker.getRadius() != 0) {
            this.minRangeMarker.setStyle(this.minDistCircleOn);
        } else {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
        }

        if (App.userSettings.realMaxRange) { 
            this.rangeMarker.setStyle(this.minMaxDistCircleOff);
            this.updateWeaponMaxRange();
        } else {
            this.rangeMarker.setStyle(this.maxDistCircleOn);
            if (this.precisionRangeMarker) { this.precisionRangeMarker.remove(); }
        }
        
        this.updateIcon();
    },

    updateWeaponMaxRange: function (options = {}) {

        // Default options if not provided
        const {
            turnDirectionAngle = 1,
            turnLaunchAngle = 0.2,
            maxRangeTreshold = 1
        } = options;

        const weaponPos = this.getLatLng();
        const G = App.gravity * App.activeWeapon.gravityScale;
        const estimatedMaxDistance = App.activeWeapon.getMaxDistance();
        const degreesPerMeter = this.map.gameToMapScale;
        const weaponHeight = this.map.heightmap.getHeight(weaponPos) + this.heightPadding;
        const points = [];

        // We'll work with radians from now on
        const maxAngle = (360 * Math.PI) / 180;
        const turnAngleStep = (turnDirectionAngle * Math.PI) / 180;

        // By default, we'll try to find the max range between 40° and 50° elevation
        var launchElevation = 30;
        var maxElevation = 60;

        if (this.precisionRangeMarker) { this.precisionRangeMarker.remove(); }

        if (App.activeWeapon.angleType === "high") {
            // The weapon is capped above 40°
            // ex: for regular mortars we set the range to 45-55°
            if (App.activeWeapon.minElevation[0] > launchElevation) {
                launchElevation = App.activeWeapon.minElevation[0]; 
                maxElevation = launchElevation + 10;
            }
        } else {
            // The weapon is capped below 40°
            // ex: for Emplacement UB-32 we set the range to 25-35°
            if (App.activeWeapon.minElevation[1] < 45) { 
                maxElevation = App.activeWeapon.minElevation[1];
                launchElevation = maxElevation -10;
            }
        }

        // Start iterating at 360° for every turnDirectionAngle
        for (let angle = 0; angle < maxAngle; angle += turnAngleStep) {
            let left = estimatedMaxDistance - 500;
            let right = estimatedMaxDistance + 500;
            let foundMaxDistance = false;
    
            while (right - left > maxRangeTreshold) {
                const mid = Math.floor((left + right) / 2);
                const currentVelocity = App.activeWeapon.getVelocity(mid);
                const deltaLat = mid * Math.cos(angle) * degreesPerMeter;
                const deltaLng = mid * Math.sin(angle) * degreesPerMeter;
                let landingX = weaponPos.lat + deltaLat;
                let landingY = weaponPos.lng + deltaLng;
                const landingHeight = this.map.heightmap.getHeight({ lat: landingX, lng: landingY });
                let hitObstacle = false;
                let noHit = false;
                
                for (let launchAngle = launchElevation; launchAngle <= maxElevation; launchAngle += turnLaunchAngle) {
                    const launchAngleRadians = ((launchAngle) * Math.PI) / 180;
                    const time = mid / (currentVelocity * Math.cos(launchAngleRadians));
                    const yVel = currentVelocity * Math.sin(launchAngleRadians);
                    const currentHeight = weaponHeight + yVel * time - 0.5 * G * time * time;
    
                    if (currentHeight <= landingHeight) {
                        hitObstacle = true;
                    } else {
                        noHit = true;
                    }
    
                    if (hitObstacle && noHit) break;
                }
    
                if (hitObstacle && !noHit) {
                    right = mid;
                } else {
                    left = mid;
                }
    
                if (right - left <= maxRangeTreshold) {
                    if (landingX < -this.map.pixelSize ) landingX = -this.map.pixelSize;
                    if (landingY > this.map.pixelSize) landingY = this.map.pixelSize;
                    if (landingX > 0) landingX = 0;
                    if (landingY < 0) landingY = 0;
                    points.push([landingX, landingY]);
                    foundMaxDistance = true;
                }
            }
            if (!foundMaxDistance) {
                let finalLat = weaponPos.lat + right * Math.cos(angle) * degreesPerMeter;
                let finalLng = weaponPos.lng + right * Math.sin(angle) * degreesPerMeter;
                if (finalLat < -this.map.pixelSize ) {finalLat = -this.map.pixelSize;}
                if (finalLat > 0) {finalLat = 0;}
                if (finalLng > this.map.pixelSize) {finalLng = this.map.pixelSize;}
                if (finalLng < 0) {finalLng = 0;}
                points.push([finalLat, finalLng]);
            }
        }

        // Final Polygon
        this.precisionRangeMarker = new Polygon(points).addTo(this.map.markersGroup);
        this.precisionRangeMarker.setStyle(this.maxDistCircleOn);
    },


    _handleContextMenu: function(e){
        this.delete(e);
    },

    _handleDrag: function (e) {
        e = this.keepOnMap(e);
        this.setLatLng(e.latlng);
        this.rangeMarker.setLatLng(e.latlng);
        this.minRangeMarker.setLatLng(e.latlng);
        this.miniCircle.setLatLng(e.latlng);
        this.fobCircle.setLatLng(e.latlng);

        if (App.userSettings.realMaxRange) { 
            this.updateWeaponMaxRange({ 
                turnLaunchAngle: 1, maxRangeTreshold: 50,  turnDirectionAngle : 20 
            });
        }

        // Update Position PopUp Content
        if (App.userSettings.weaponDrag) { 
            this.posPopUp.setLatLng(e.latlng);
            this.posPopUp.setContent(this.map.getKP(-e.latlng.lat, e.latlng.lng, 4)); 
        }
    },


    _handleClick: function(weapon) {
        const DIALOG = document.getElementById("weaponInformation");
        var name = App.activeWeapon.name;

        // Logo
        $(".weaponIcon").first().attr("src", App.activeWeapon.logo);

        // Informations
        if (App.activeWeapon.name === "M1064M121") {
            name = `${i18next.t("weapons:"+name)} (${$(".dropbtn3 option:selected" ).text()})`;
        }  else {
            name = `${i18next.t("weapons:"+name)}`;
        }
        
        $(".infName").first().text(name);
        $(".infRange").first().text(`${App.activeWeapon.minDistance + i18next.t("common:m")} - ${App.activeWeapon.maxDistance.toFixed(0) + i18next.t("common:m")}`);
        $(".infMOA").first().text(`${App.activeWeapon.moa} (${(App.activeWeapon.moa / 60).toFixed(1) + i18next.t("common:°")})`);
        $(".infMinDistance").first().text(App.activeWeapon.minDistance + i18next.t("common:m"));
        $(".infMaxDistance").first().text(App.activeWeapon.maxDistance.toFixed(1) + i18next.t("common:m"));
        $(".inf100damage").first().text(App.activeWeapon.hundredDamageRadius.toFixed(1) + i18next.t("common:m"));
        $(".inf25damage").first().text(App.activeWeapon.twentyFiveDamageRadius.toFixed(1) + i18next.t("common:m"));
        $(".infVelocity").first().text(`${App.activeWeapon.velocity + i18next.t("common:m")}/${i18next.t("common:s")}`);

        if (["Mortar", "UB-32"].includes(App.activeWeapon.name)) {
            $("#angleChoice").hide();
        } else {
            $("#angleChoice").show();
        }
        

        // Angle
        if (this.angleType ==="high"){
            $("#angleChoiceHigh").prop("checked", true);
            $("#angleChoiceLow").prop("checked", false);
        } else {
            $("#angleChoiceHigh").prop("checked", false);
            $("#angleChoiceLow").prop("checked", true);
        }

        // Additional height
        $(".heightPadding input").val(this.heightPadding);
        


        // Add listener that update angle/height & refresh targets
        weapon = weapon.sourceTarget;
        $("input[type=radio][name=angleChoice]").on("change", weapon, function() {
            weapon.angleType = this.value;
            App.minimap.updateTargets();
        });

        $(".heightPadding input").on("change", weapon, function() {
            this.value = Math.max(0, Math.min(this.value, 100)); // ensure 0 < value < 100
            weapon.heightPadding = parseFloat(this.value);
            App.minimap.updateTargets();
        });

        DIALOG.showModal();
    },

    // Catch this events so user can't place a target by mistake while trying to delete weapon
    _handleDblclick: function(){},

    _handleDragStart: function () {

        this.map.mouseLocationPopup.close();
        this.map.off("mousemove", this.map._handleMouseMove);

        this.map.activeTargetsMarkers.eachLayer(function (layer) {
            layer.calcMarker1.setContent("  ");
            layer.calcMarker2.setContent("  ");
            layer.disableSpreadRadii();
            layer.disableDamageRadii();
        }); 
        
        if (App.activeWeapon.type === "deployables") {
            this.fobCircle.setStyle({opacity: 0.5});
        }
        
        // Mini-circle and position appears on dragstart
        this.miniCircle.setStyle({opacity: 1});
        if (App.userSettings.weaponDrag) { this.posPopUp.openOn(this.map); }
    },

    _handleDragEnd: function () {

        if (App.userSettings.keypadUnderCursor){
            this.map.on("mousemove", this.map._handleMouseMove);
        }

        if (App.userSettings.realMaxRange) {
            this.updateWeaponMaxRange();
        }

        // FOB range / mini-circle and position disapear on dragend
        this.fobCircle.setStyle({opacity: 0});
        this.miniCircle.setStyle({opacity: 0});
        
        this.posPopUp.close();

        this.map.updateTargets();

        // Report marker to squadcalc API
        sendMarkerData({
            lat: this._latlng.lat,
            lng: this._latlng.lng,
            weapon: App.activeWeapon.name,
            map: App.minimap.activeMap.name,
        });
        
    },

    _handleMouseOver: function(){
        if (App.activeWeapon.type === "deployables") {
            this.fobCircle.setStyle({opacity: 0.5});
        }
    },

    _handleMouseOut: function(){
        this.fobCircle.setStyle({opacity: 0});
    },


    /**
     * Remove the Weapon marker and every object tied
     * @param {this}
     */
    delete: function(){

        // Unbind all custom event handlers
        this.off();

        this.removeFrom(this.map.activeWeaponsMarkers);

        if (this.map.activeWeaponsMarkers.getLayers().length === 0) { 
            this.map.deleteTargets();
        } else {
            // Set default icon on remaining weapon
            this.map.activeWeaponsMarkers.getLayers()[0].setIcon(App.activeWeapon.marker);
        }

        // Delete the weapon marker and everything tied to it
        this.minRangeMarker.removeFrom(this.map.markersGroup).remove();
        this.rangeMarker.removeFrom(this.map.markersGroup).remove();
        this.miniCircle.removeFrom(this.map.markersGroup).remove();
        this.fobCircle.removeFrom(this.map.markersGroup).remove();
        this.posPopUp.removeFrom(this.map.markersGroup).remove();
        if (this.precisionRangeMarker) { this.precisionRangeMarker.remove(); }
        this.removeFrom(this.map.markersGroup).removeFrom(this.map.activeWeaponsMarkers);
        this.remove();

        // Update remaining targets if they exists
        this.map.updateTargets();
    }
});


export var squadTargetMarker = squadMarker.extend({

    initialize: function (latlng, options, map) {
        var popUpOptions_weapon1;
        var popUpOptions_weapon2;
        var weaponPos;

        //Util.setOptions(this, options);
        squadMarker.prototype.initialize.call(this, latlng, options, map);
        
        popUpOptions_weapon1 = {
            autoPan: false,
            autoClose: false,
            closeButton: false,
            closeOnEscapeKey: false,
            bubblingMouseEvents: false,
            interactive: false,
            minWidth: 100,
            className: "calcPopup",
        };

        popUpOptions_weapon2 = {
            ...popUpOptions_weapon1,
            className: "calcPopup2"
        };

        this.posPopUpOptions = {
            ...popUpOptions_weapon1,
            offset: [0, -10],
            className: "posPopUpTarget"
        };

        this.spreadOptionsOn = {
            opacity: 1,
            fillOpacity: 0.2,
            color: App.mainColor,
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
            color: App.mainColor,
            weight: 1.3,
        };

        this.twentyFiveDamageCircleOn = {
            radius: 0,
            opacity: 1,
            fillOpacity: 0,
            dashArray: "5,6",
            color: App.mainColor,
            weight: 1.3,
        };

        this.miniCircleOptions = {
            radius: 4,
            opacity: 0,
            color: App.mainColor,
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
        sendTargetData({
            lat: latlng.lat,
            lng: latlng.lng,
            weapon: App.activeWeapon.name,
            map: App.minimap.activeMap.name,
        });
        

        // Calc PopUps
        this.calcMarker1 = new Popup(popUpOptions_weapon1).setLatLng(latlng).addTo(this.map.markersGroup);
        this.calcMarker2 = new Popup(popUpOptions_weapon2).setLatLng(latlng).addTo(this.map.markersGroup);
        // posPopUp
        this.posPopUp = new Popup(this.posPopUpOptions).setLatLng(latlng).addTo(this.map.markersGroup).close();
        this.updateCalcPopUps();

        const [html1, clipboard1] = this.getContent(this.firingSolution1, this.map.activeWeaponsMarkers.getLayers()[0].angleType);
        this.calcMarker1.setContent(html1).openOn(this.map);
        if (App.userSettings.copyTarget) App.copy(clipboard1);
        

        // If two weapons already on the map
        if (this.map.activeWeaponsMarkers.getLayers().length === 2) {
            weaponPos = this.map.activeWeaponsMarkers.getLayers()[1].getLatLng();
            this.firingSolution2 = new SquadFiringSolution(weaponPos, this.getLatLng(), this.map, this.map.activeWeaponsMarkers.getLayers()[1].heightPadding);
            this.calcMarker1.setContent(`1. ${html1}`);
            const [html2, clipboard2] = this.getContent(this.firingSolution2, this.map.activeWeaponsMarkers.getLayers()[1].angleType);
            this.calcMarker2.setContent(`2. ${html2}`).openOn(this.map);
            if (App.userSettings.copyTarget) App.copy(`${clipboard1} / ${clipboard2}`);
        }

        // Initiate Spread Ellipse
        this.spreadMarker1 = new ellipse(latlng, [0, 0], 0, this.spreadOptionsOff).addTo(this.map.markersGroup);
        this.spreadMarker11 = new ellipse(latlng, [0, 0], 0, this.spreadOptionsOff).addTo(this.map.markersGroup);
        this.spreadMarker2 = new ellipse(latlng, [0, 0], 0, this.spreadOptionsOff).addTo(this.map.markersGroup);
        this.updateSpread();

        // Initiate Damage Ellipse
        this.hundredDamageRadius = new ellipse(latlng, [0, 0], 0, this.hundredDamageCircleOn).addTo(this.map.markersGroup);
        this.twentyFiveDamageRadius = new ellipse(latlng, [0, 0], 0, this.twentyFiveDamageCircleOn).addTo(this.map.markersGroup);
        this.updateDamageRadius();

        this.updateIcon(true);

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("contextmenu", this._handleContextMenu, this);

        if (App.hasMouse){
            this.on("mouseover", this._handleMouseOver, this);
            this.on("mouseout", this._handleMouseOut, this);
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
    delete: function(){

        // Unbind all custom event handlers
        this.off();

        // Remove the marker from targets array history
        this.map.targets = this.map.targets.filter(target => target !== this);

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
        
        // Remove the marker itself
        this.removeFrom(this.map.markersGroup).removeFrom(this.map.activeTargetsMarkers).remove();
    
        // If that was the last Marker on the map, hide "delete all" buttons
        if (this.map.activeTargetsMarkers.getLayers().length === 0) {
            animateCSS($(".btn-delete"), "fadeOutRight").then(() => {
                $(".btn-delete").hide();
            });
        }

    },


    /**
     * Return the HTML content for the calculation popups
     * @param {SquadFiringSolution} firingSolution 
     * @param {String} angleType 
     * @returns {String} - HTML content for the calculation popups
     */
    getContent: function(firingSolution, angleType){
        const DIST = firingSolution.distance;
        const BEARING = firingSolution.bearing;
        var heightDiff = firingSolution.heightDiff.toFixed(0);
        var content;
        var elevation;
        var timeOfFlight;

        // Avoid "-0"
        if (Math.sign(heightDiff) === 1 || heightDiff == -0) {
            heightDiff = `+${Math.abs(heightDiff)}`;
        }

        if (App.userSettings.lowAndHigh &&
             App.activeWeapon.name != "Mortar" &&
              App.activeWeapon.name != "UB-32" &&
               App.activeWeapon.name != "M1064M121" &&
                App.activeWeapon.name != "Mk19") {  
           
            
            let elevationlow = firingSolution.elevation.low;
            let elevationhigh = firingSolution.elevation.high;
            let timeOfFlightlow = firingSolution.timeOfFlight.low.toFixed(0);
            let timeOfFlighthigh = firingSolution.timeOfFlight.high.toFixed(0);

            if (isNaN(elevationlow.rad)) {
                elevationlow = "---";
                timeOfFlightlow = "---";
            } else {
                if (App.activeWeapon.unit === "mil"){
                    elevationlow = elevationlow.mil.toFixed(0);
                } else {
                    elevationlow = elevationlow.deg.toFixed(1);
                }
                timeOfFlightlow = `${timeOfFlightlow}<span data-i18n="common:s">${i18next.t("common:s")}</span>`;
            }

            if (isNaN(elevationhigh.rad)) {
                elevationhigh = "---";
                timeOfFlighthigh = "---";
            } else {
                if (App.activeWeapon.unit === "mil"){
                    elevationhigh = elevationhigh.mil.toFixed(0);
                } else {
                    elevationhigh = elevationhigh.deg.toFixed(1);
                }
                timeOfFlighthigh = `${timeOfFlighthigh}<span data-i18n="common:s">${i18next.t("common:s")}</span>`;
            }

            elevation = elevationlow + " / " + elevationhigh;
            timeOfFlight = timeOfFlightlow + " / " + timeOfFlighthigh;
        } 
        else {
            if (angleType === "high"){
                elevation = firingSolution.elevation.high;
                timeOfFlight = firingSolution.timeOfFlight.high;
            } else {
                elevation = firingSolution.elevation.low;
                timeOfFlight = firingSolution.timeOfFlight.low;
            }
    
            if (isNaN(elevation.rad)) {
                elevation = "---";
                timeOfFlight = "---";
            } else {
                if (App.activeWeapon.unit === "mil"){
                    elevation = elevation.mil.toFixed(0);
                } else {
                    elevation = elevation.deg.toFixed(1);
                }
                timeOfFlight = `${timeOfFlight.toFixed(0)}<span data-i18n="common:s">${i18next.t("common:s")}</span>`;
            }
        }


        content = `<span class=calcNumber></span></br><span>${elevation}</span>`;

        if (App.userSettings.showBearing) {
            content += `<br><span class=bearingUiCalc>${BEARING.toFixed(1)}<span data-i18n="common:°">${i18next.t("common:°")}</span></span>`;
        }

        if (App.userSettings.showTimeOfFlight) {
            content += `<br><span class=bearingUiCalc>${timeOfFlight}</span>`;
        } 

        if (App.userSettings.showDistance) {
            content += `<br><span class=bearingUiCalc>${DIST.toFixed(0)}<span data-i18n="common:m">${i18next.t("common:m")}</span></span>`;
        }
        
        if (App.userSettings.showHeight) {
            content += `<br><span class=bearingUiCalc>${heightDiff}<span data-i18n="common:m">${i18next.t("common:m")}</span></span>`;
        }

        return [content, `${i18next.t("common:elevation")}: ${elevation} - ${i18next.t("common:bearing")}: ${BEARING.toFixed(1)}°`];

    },


    /*
    * Update target spread ellipses according to it's firing solutions
    */
    updateSpread: function(){
        var spreadParameters;
        var weapons = this.map.activeWeaponsMarkers.getLayers();
        var gameToMapScale = this.map.gameToMapScale;
    
        // No spread wanted, return
        if (!App.userSettings.spreadRadius) {
            this.disableSpreadRadii();
            return;
        }
    
        const setSpreadMarker = (marker, firingSolution, layerIndex, reverse = false) => {
            const angleType = weapons[layerIndex].angleType;
            var elevation;
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
        var clipboard;

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
        this.updateSpread();
        this.updateDamageRadius();
        if (copy && App.userSettings.copyTarget) { App.copy(clipboard); }
    },


    /**
     * Set/Update the target icon according to it's firing solutions and user settings
     * @param {Boolean} animated - If the icon should be animated when set
     */
    updateIcon: function (animated = false) {
        const layers = this.map.activeWeaponsMarkers.getLayers();
        const angleType = layers[0].angleType;
        const elevationKey = angleType === "high" ? "high" : "low";
    
        const elevation = this.firingSolution1.elevation[elevationKey]?.rad;
        const elevation2 =
            layers.length === 2 ? this.firingSolution2.elevation[elevationKey]?.rad : null;
    
        const isSingleLayer = layers.length === 1;
        const bothElevationsInvalid = isNaN(elevation) && isNaN(elevation2);
        const targetAnimation = App.userSettings.targetAnimation;
        let icon;

        // Determine the base icon type
        if (isSingleLayer && isNaN(elevation)) {
            icon = targetAnimation ? targetIconDisabled : targetIconMinimalDisabled;
        } else if (!isSingleLayer && bothElevationsInvalid) {
            icon = targetAnimation ? targetIconDisabled : targetIconMinimalDisabled;
        } else {
            if (targetAnimation) {
                icon = animated ? targetIconAnimated : targetIcon1;
            } else {
                icon = targetIconMinimal;
            }
        }
     
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
        var simulation1;
        var simulation2;
        var weaponPos1;
        var weaponPos2;
        var heightPath1;
        var heightPath2;
              
        $("#sim1").addClass("active");
        $("#sim2").removeClass("active");
        $("#canvasControls > .active").first().removeClass("active");
        $("#canvasControls > button").first().addClass("active");

        weaponPos1 = this.map.activeWeaponsMarkers.getLayers()[0].getLatLng();
        heightPath1 = this._map.heightmap.getHeightPath(weaponPos1, this.getLatLng());
        simulation1 = new SquadSimulation("#sim1", this.firingSolution1, heightPath1, this.map.activeWeaponsMarkers.getLayers()[0].angleType, App.activeWeapon.unit);
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
    _handleDrag: function (e) {

        // When dragging marker out of bounds, block it at the edge
        e = this.keepOnMap(e);

        // Update Positions
        this.setLatLng(e.latlng);
        this.calcMarker1.setLatLng(e.latlng);
        this.spreadMarker1.setLatLng(e.latlng);
        this.spreadMarker11.setLatLng(e.latlng);
        this.calcMarker2.setLatLng(e.latlng);
        this.spreadMarker2.setLatLng(e.latlng);
        this.miniCircle.setLatLng(e.latlng);
        this.hundredDamageRadius.setLatLng(e.latlng);
        this.twentyFiveDamageRadius.setLatLng(e.latlng);

        // Update Position PopUp Content
        if (App.userSettings.targetDrag) {
            this.posPopUp.setLatLng(e.latlng).setContent(this.map.getKP(-e.latlng.lat, e.latlng.lng, 4));
        }

        // On mobile save performance
        if (!App.hasMouse) return;

        // Update bearing/elevation/spread marker
        this.updateCalc(); 
        
    },

    
    _handleDragStart: function () {
        this.isDragging = true;
        this.map.mouseLocationPopup.close();
        this.map.off("mousemove", this.map._handleMouseMove);

        if (!App.hasMouse) {
            this.calcMarker1.setContent("  ");
            this.calcMarker2.setContent("  ");
            this.disableSpreadRadii();
            this.disableDamageRadii();
        }

        if (App.userSettings.targetDrag){ this.posPopUp.openOn(this.map); }
        
        this.miniCircle.setStyle({opacity: 1});
    },

    // Hide stuff, do a final update and send data to API
    _handleDragEnd: function (e) {

        if (App.userSettings.keypadUnderCursor) this.map.on("mousemove", this.map._handleMouseMove);

        // Hide PositionPopUp & MiniCircle
        this.isDragging = false;
        this.posPopUp.close();
        this.miniCircle.setStyle({opacity: 0});
        
        // update one last time when drag end
        this.updateCalc(true);
        this.updateIcon();

        // Report target to squadcalc API
        sendTargetData({
            lat: e.target.getLatLng().lat,
            lng: e.target.getLatLng().lng,
            weapon: App.activeWeapon.name,
            map: App.minimap.activeMap.name,
        });
    },

    // Delete targetMarker on right clic
    _handleContextMenu: function(){

        // Avoid other target keeping fading
        clearTimeout(this.mouseOverTimeout);

        // If they already faded, switch them back
        this.map.activeTargetsMarkers.eachLayer((target) => {
            target.on("mouseover", target._handleMouseOver, target);
            target.on("mouseout", target._handleMouseOut, target);
            target.setOpacity(1);
            target.calcMarker1.openOn(this.map);
            if (this.map.activeWeaponsMarkers.getLayers()[1]) target.calcMarker2.openOn(this.map);
            target.updateSpread();
            target.updateDamageRadius();
        });

        // Reset layer opacity
        if (this.map.layer) this.map.layer._setOpacity(1); 

        // We can now safely start deleting
        this.delete();
    },

    // On Hovering for more than 500ms, show a trajectory path and hide other targets
    _handleMouseOver: function() {

        this.mouseOverTimeout = setTimeout(() => {

            // Hide the layer
            if (this.map.layer) this.map.layer._setOpacity(0.5); 

            // Hide other targets
            if (!this.isDragging){
                this.map.activeTargetsMarkers.eachLayer((target) => {
                    if (target != this) {
                        target.off("mouseover");
                        target.off("mouseout");
                        target.setOpacity(0.65);
                        target.calcMarker1.close();
                        target.calcMarker2.close();
                        target.disableSpreadRadii();
                        target.disableDamageRadii();
                        target.twentyFiveDamageRadius.setStyle({ opacity: 0 });
                    }
                });
            }
        }, 500);
    },

    _handleMouseOut: function() {

        // Cancel the timeout if the user moves the mouse out before 1 second
        clearTimeout(this.mouseOverTimeout);

        this.calcMarker1.getElement().style.zIndex  = "";
        this.calcMarker2.getElement().style.zIndex  = "";

        // Show the layer
        if (this.map.layer) this.map.layer._setOpacity(1); 

        if (!this.isDragging){
            this.map.activeTargetsMarkers.eachLayer((target) => {
                target.on("mouseover", target._handleMouseOver, target);
                target.on("mouseout", target._handleMouseOut, target);
                target.setOpacity(1);
                target.calcMarker1.openOn(this.map);
                if (this.map.activeWeaponsMarkers.getLayers()[1]) target.calcMarker2.openOn(this.map);
                target.updateSpread();
                target.updateDamageRadius();
            });
        }
    },

});


export var squadStratMarker = squadMarker.extend({

    initialize: function (latlng, options, map) {
        const CONSTRUCTIONCOLOR = "#00E8FF";
        const EXCLUSIONCOLOR = "white";   

        squadMarker.prototype.initialize.call(this, latlng, options, map);
        
        this.posPopUpOptions = {
            autoPan: false,
            autoClose: false,
            closeButton: false,
            closeOnEscapeKey: false,
            bubblingMouseEvents: false,
            interactive: false,
            className: "posPopUpWeapon",
            minWidth: 100,
            offset: [0, 0],
        };

        if (options.color) {
            this.maxDistCircleOn = {
                radius: 300 * this.map.gameToMapScale,
                opacity: 0.5,
                color: options.color,
                fillOpacity: 0,
                weight: 5,
                autoPan: false,
            };
            this.minDistCircleOn = {
                radius: 0,
                opacity: 0,
                fillOpacity: 0,
                weight: 0,
            };
        } else {
            this.maxDistCircleOn = {
                radius: App.minimap.activeMap.radiusExclusion * this.map.gameToMapScale,
                opacity: 0.5,
                color: EXCLUSIONCOLOR,
                fillOpacity: 0,
                weight: 3,
                autoPan: false,
            };
            this.minDistCircleOn = {
                radius: 150 * this.map.gameToMapScale,
                opacity: 0.5,
                color: CONSTRUCTIONCOLOR,
                fillOpacity: 0,
                weight: 4,
                autoPan: false,
            };
        }



        // Create the min/max range markers
        if (this.options.circles) {
            this.constructionRange = new Circle(latlng, this.minDistCircleOn);
            this.exclusionRange = new Circle(latlng, this.maxDistCircleOn);
        }

        if (this.options.circles && !this.options.circlesOnHover) {
            this.constructionRange.addTo(this.map.markersGroup);
            this.exclusionRange.addTo(this.map.markersGroup);
        }

        // Initiate Position PopUp
        this.posPopUp = new Popup(this.posPopUpOptions).setLatLng(latlng).addTo(this.map.markersGroup).close();


        // Report marker to squadcalc API
        // sendFOBData({
        //     lat: this._latlng.lat,
        //     lng: this._latlng.lng,
        //     weapon: "FOB",
        //     map: App.minimap.activeMap.name,
        // });

        // Custom events handlers
        //this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        //this.on("dblclick", this._handleDblclick, this);
        this.on("mouseover", this._handleMouseOver, this);
        this.on("mouseout", this._handleMouseOut, this);
        this.on("contextmenu", this._handleContextMenu, this);
    },

    /**
     * Remove the Weapon marker and every object tied
     * @param {this}
     */
    delete: function(){

        // Unbind all custom event handlers
        this.off();

        // Delete the weapon marker and everything tied to it
        if (this.options.circles) {
            this.constructionRange.removeFrom(this.map.markersGroup).remove();
            this.exclusionRange.removeFrom(this.map.markersGroup).remove();
        }
        this.posPopUp.removeFrom(this.map.markersGroup).remove();
        this.removeFrom(this.map.markersGroup);
        this.remove();
    },

    _handleContextMenu: function(e){

        // Avoid other target keeping fading
        clearTimeout(this.mouseOverTimeout);

        // If they already faded, switch them back
        this.map.activeTargetsMarkers.eachLayer((target) => {
            target.on("mouseover", target._handleMouseOver, target);
            target.on("mouseout", target._handleMouseOut, target);
            target.setOpacity(1);
            target.calcMarker1.openOn(this.map);
            if (this.map.activeWeaponsMarkers.getLayers()[1]) target.calcMarker2.openOn(this.map);
            target.updateSpread();
            target.updateDamageRadius();
        });

        // Reset layer opacity
        if (this.map.layer) this.map.layer._setOpacity(1); 

        this.delete(e);
    },

    _handleDrag: function (e) {
        e = this.keepOnMap(e);
        this.setLatLng(e.latlng);

        if (this.options.circles) {
            this.constructionRange.setLatLng(e.latlng);
            this.exclusionRange.setLatLng(e.latlng);
        }

        this.posPopUp.setLatLng(e.latlng);
        this.posPopUp.setContent(this.map.getKP(-e.latlng.lat, e.latlng.lng, 4)); 
    },

    _handleDragStart: function () {

        this.map.mouseLocationPopup.close();
        this.map.off("mousemove", this.map._handleMouseMove);

        this.map.activeTargetsMarkers.eachLayer(function (layer) {
            layer.calcMarker1.setContent("  ");
            layer.calcMarker2.setContent("  ");
            layer.disableSpreadRadii();
            layer.disableDamageRadii();
        }); 
        
        this.posPopUp.openOn(this.map);
    },

    _handleDragEnd: function () {

        if (App.userSettings.keypadUnderCursor){
            this.map.on("mousemove", this.map._handleMouseMove);
        }

        this.isDragging = false;
        this.posPopUp.close();

        //this.map.updateTargets();

        // Report marker to squadcalc API
        // sendFOBData({
        //     lat: this._latlng.lat,
        //     lng: this._latlng.lng,
        //     weapon: "FOB",
        //     map: App.minimap.activeMap.name,
        // });
        
    },

    _handleMouseOver: function(){
        if (this.options.circlesOnHover){
            this.constructionRange.addTo(this.map.markersGroup);
            this.exclusionRange.addTo(this.map.markersGroup);
        }

        this.mouseOverTimeout = setTimeout(() => {

            // Hide the layer
            if (this.map.layer) this.map.layer._setOpacity(0.5); 

            // Hide other targets
            if (!this.isDragging){
                this.map.activeTargetsMarkers.eachLayer((target) => {
                    if (target != this) {
                        target.off("mouseover");
                        target.off("mouseout");
                        target.setOpacity(0.65);
                        target.calcMarker1.close();
                        target.calcMarker2.close();
                        target.disableSpreadRadii();
                        target.disableDamageRadii();
                        target.twentyFiveDamageRadius.setStyle({ opacity: 0 });
                    }
                });
            }
        }, 500);
    },

    _handleMouseOut: function(){
        if (this.options.circlesOnHover){
            this.constructionRange.removeFrom(this.map.markersGroup);
            this.exclusionRange.removeFrom(this.map.markersGroup);
        }

        // Cancel the timeout if the user moves the mouse out before 1 second
        clearTimeout(this.mouseOverTimeout);

        // Show the layer
        if (this.map.layer) this.map.layer._setOpacity(1); 
    }

});