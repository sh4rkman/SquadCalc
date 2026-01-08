import { App } from "../app.js";
import "./libs/leaflet-visual-click.js";
import { Marker, Circle, CircleMarker, Popup, Polygon, Icon } from "leaflet";
import i18next from "i18next";
import { sendMarkerData } from "./squadCalcAPI.js";
import { v4 as uuidv4 } from "uuid";


/*
 * Global Squad Marker Class 
*/
export const squadMarker = Marker.extend({

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

        if (options.uid) {
            this.uid = options.uid;
        } else {
            this.uid = uuidv4();
        }

        this.on("dragstart", this._handleDragStart, this);
        this.on("dragend", this._handleDragEnd, this);
    },

    /**
     * Force a given event to stay inside the map bounds
     * @param {event} [event] - event
     * @returns {event} - same event with corrected Latlng 
     */
    keepOnMap: function(event){
        if (event.latlng.lng > this.map.pixelSize) {event.latlng.lng = this.map.pixelSize;}
        if (event.latlng.lat < -this.map.pixelSize) {event.latlng.lat = -this.map.pixelSize;}
        if (event.latlng.lng < 0) {event.latlng.lng = 0;}
        if (event.latlng.lat > 0) {event.latlng.lat = 0;}
        return event;
    },

});

export const squadWeaponMarker = squadMarker.extend({

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
            className: "circles",
        };

        this.minDistCircleOn = {
            radius: App.activeWeapon.minDistance * this.map.gameToMapScale,
            opacity: 0.7,
            color: CIRCLESCOLOR,
            fillOpacity: 0.2,
            weight: 1,
            autoPan: false,
            className: "circles",
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
            className: "circles",
        };


        this.angleType = App.activeWeapon.angleType;
        this.heightPadding = options.heightPadding || 0;

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

        if (!options.uid) {
            sendMarkerData({
                lat: this._latlng.lat,
                lng: this._latlng.lng,
                weapon: App.activeWeapon.name,
                map: App.minimap.activeMap.name,
            });
        }

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
            this.on("pointerover", this._handleMouseOver, this);
            this.on("pointerout", this._handleMouseOut, this);
        }
    },


    /**
     * Update the weapon icon based on user settings and number of weapons
    */
    updateIcon: function(){

        const ICON_SIZE_X = 28 + (App.userSettings.markerSize - 1) * 5;
        const ICON_SIZE_Y = ICON_SIZE_X * (47 / 38);
        const ICON_PROPERTIES = {
            shadowUrl: "/img/markers/weapons/marker_shadow.webp",
            iconSize:     [ICON_SIZE_X, ICON_SIZE_Y],
            shadowSize:   [ICON_SIZE_X, ICON_SIZE_Y],
            iconAnchor:   [ICON_SIZE_X / 2, ICON_SIZE_Y],
            shadowAnchor: [ICON_SIZE_X / 4, ICON_SIZE_Y],
            className: "animatedWeaponMarker"
        };
        
        const layers = this.map.activeWeaponsMarkers.getLayers();
        let iconUrl;

        if (layers.length === 1) {
            iconUrl = `/img/markers/weapons/${App.activeWeapon.name}.webp`;
        }

        if (layers.length === 2) {
            if (layers[0] === this) {
                iconUrl = "/img/markers/weapons/marker_mortar_1.webp";
            } else {
                iconUrl = "/img/markers/weapons/marker_mortar_2.webp";
            }
        }

        this.setIcon(new Icon({ iconUrl, ...ICON_PROPERTIES }));

    },

    


    /**
     * update calcs, spread markers
     */
    updateWeapon: function(){

        const MAXRADIUS = App.activeWeapon.getMaxDistance() * this.map.gameToMapScale;
        const MINRADIUS = App.activeWeapon.minDistance * this.map.gameToMapScale;

        console.log("App.activeWeapon.minDistance ", App.activeWeapon.minDistance);

        this.angleType = App.activeWeapon.angleType;
        this.minRangeMarker.setRadius(MINRADIUS);
        this.rangeMarker.setRadius(MAXRADIUS);

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
            if (this.precisionRangeMarker) this.precisionRangeMarker.remove();
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
        let launchElevation = 30;
        let maxElevation = 60;

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
                    if (landingX < -this.map.pixelSize) landingX = -this.map.pixelSize;
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
                if (finalLat < -this.map.pixelSize) {finalLat = -this.map.pixelSize;}
                if (finalLat > 0) {finalLat = 0;}
                if (finalLng > this.map.pixelSize) {finalLng = this.map.pixelSize;}
                if (finalLng < 0) {finalLng = 0;}
                points.push([finalLat, finalLng]);
            }
        }

        // Final Polygon
        this.precisionRangeMarker = new Polygon(points, this.maxDistCircleOn).addTo(this.map.markersGroup);
    },


    _handleContextMenu: function(e){
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        this.delete();
    },


    _handleDrag: function (event) {
        event = this.keepOnMap(event);
        this.setLatLng(event.latlng);
        this.rangeMarker.setLatLng(event.latlng);
        this.minRangeMarker.setLatLng(event.latlng);
        this.miniCircle.setLatLng(event.latlng);
        this.fobCircle.setLatLng(event.latlng);

        if (App.userSettings.realMaxRange) {
            if (event.session) {
                this.updateWeaponMaxRange();
            }
            else {
                this.updateWeaponMaxRange({ 
                    turnLaunchAngle: 1, maxRangeTreshold: 50,  turnDirectionAngle : 20 
                });
            }
        }

        // Update Position PopUp Content
        if (App.userSettings.weaponDrag) { 
            this.posPopUp.setLatLng(event.latlng);
            this.posPopUp.setContent(this.map.getKP(-event.latlng.lat, event.latlng.lng, 4)); 
        }
    },


    _handleClick: function(weapon) {
        const DIALOG = document.getElementById("weaponInformation");

        let name = i18next.t("weapons:" + App.activeWeapon.name);
        if (App.activeWeapon.shells.length > 1) name += ` (${$(".dropbtn3 option:selected").text().trim()})`;

        // Logo
        $(".weaponIcon").first().attr("src", `/img/weapons/${App.activeWeapon.name}.webp`);
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
        $("input[type=radio][name=angleChoice]").on("change", weapon, (e) => {
            weapon.angleType = e.target.value;
            this.map.updateTargets();
        });

        $(".heightPadding input").on("change", weapon, (e) => {
            const input = e.currentTarget;
            const MAXHEIGHTPADDING = 300;
            input.value = Math.max(0, Math.min(input.value, MAXHEIGHTPADDING));
            weapon.heightPadding = parseFloat(input.value);
            this.map.updateTargets();
        
            // Update the marker in the session
            if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                App.session.ws.send(
                    JSON.stringify({
                        type: "MOVING_WEAPON",
                        uid: this.uid,
                        lat: this._latlng.lat,
                        lng: this._latlng.lng,
                        heightPadding: input.value,
                    })
                );
            }
        });

        DIALOG.showModal();
    },

    // Catch this events so user can't place a target by mistake while trying to delete weapon
    _handleDblclick: function(){},

    _handleDragStart: function () {

        this.map.mouseLocationPopup.close();
        this.map.off("pointermove", this.map._handleMouseMove);

        this.map.activeTargetsMarkers.eachLayer(function (target) {
            target.calcMarker1.setContent("  ");
            target.calcMarker2.setContent("  ");
            target.disableSpreadRadii();
            target.disableDamageRadii();
            target.removeLineToTarget();
            target.grid.hide();
        }); 
        
        if (App.activeWeapon.type === "deployables") {
            this.fobCircle.setStyle({opacity: 0.5});
        }
        
        // Mini-circle and position appears on dragstart
        this.miniCircle.setStyle({opacity: 1});
        if (App.userSettings.weaponDrag) { this.posPopUp.openOn(this.map); }
    },

    _handleDragEnd: function (broadcast = true) {

        if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {

            // Get the updated position of the dragged marker
            const newLatLng = this.getLatLng();

            // Send the MOVING_WEAPON event to the server
            if (broadcast) {
                App.session.ws.send(
                    JSON.stringify({
                        type: "MOVING_WEAPON",
                        uid: this.uid,
                        lat: newLatLng.lat,
                        lng: newLatLng.lng,
                        heightPadding: this.heightPadding,
                    })
                );
            }

            console.debug(`Sent move request for weapon ${this.uid}, new position: (${newLatLng.lat}, ${newLatLng.lng})`);
        }
        

        if (App.userSettings.keypadUnderCursor){
            this.map.on("pointermove", this.map._handleMouseMove);
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
     * @param {Boolean} [broadcast] - if true, broadcast the deletion to the session
     */
    delete: function(broadcast = true){

        // Broadcast the deletion to the session
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(JSON.stringify({ type: "DELETE_WEAPON", uid: this.uid }));
            console.debug(`Sent delete request for weapon ${this.uid}`);
        }

        this.off();

        // Delete the weapon marker and everything tied to it
        this.minRangeMarker.removeFrom(this.map.markersGroup).remove();
        this.rangeMarker.removeFrom(this.map.markersGroup).remove();
        this.miniCircle.removeFrom(this.map.markersGroup).remove();
        this.fobCircle.removeFrom(this.map.markersGroup).remove();
        this.posPopUp.removeFrom(this.map.markersGroup).remove();
        if (this.precisionRangeMarker) { this.precisionRangeMarker.remove(); }
        this.removeFrom(this.map.markersGroup).removeFrom(this.map.activeWeaponsMarkers);
        this.remove();

        if (this.map.activeWeaponsMarkers.getLayers().length === 0) { 
            this.map.deleteTargets();
        } else {
            // Set default icon on remaining weapon
            this.map.activeWeaponsMarkers.getLayers()[0].updateIcon();
        }

        // Update remaining targets if they exists
        this.map.updateTargets();
    }
});

export const squadStratMarker = squadMarker.extend({

    initialize: function (latlng, options, map) {

        squadMarker.prototype.initialize.call(this, latlng, options, map);

        this.team = options.team;
        this.category = options.category;
        this.icontype = options.icontype;
        this.options2 = options;

      
        this.posPopUpOptions = {
            autoPan: false,
            autoClose: false,
            closeButton: false,
            closeOnEscapeKey: false,
            bubblingMouseEvents: false,
            interactive: false,
            className: "posPopUpWeapon",
            minWidth: 100,
            offset: [0, 10],
        };
        this.maxDistCircleOn = {
            radius: options.circles2Size || 0,
            opacity: 0.5,
            color: options.circles2Color || "white",
            fillOpacity: 0,
            weight: options.circles2Weight || 3,
            autoPan: false,
        };
        this.minDistCircleOn = {
            radius: options.circles1Size || 0,
            opacity: 0.5,
            color: options.circles1Color || "white",
            fillOpacity: 0,
            weight: options.circles1Weight || 4,
            autoPan: false,
        };
        

        // Create the min/max range markers
        if (options.circles1Size) {
            this.constructionRange = new Circle(latlng, this.minDistCircleOn);
            if (!options.circlesOnHover) this.constructionRange.addTo(this.map.markersGroup);
        }

        if (options.circles2Size) {
            this.exclusionRange = new Circle(latlng, this.maxDistCircleOn);
            if (!options.circlesOnHover) this.exclusionRange.addTo(this.map.markersGroup);
        }


        // Initiate Position PopUp
        this.posPopUp = new Popup(this.posPopUpOptions).setLatLng(latlng).addTo(this.map.markersGroup).close();


        // Custom events handlers
        //this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("mouseover", this._handleMouseOver, this);
        this.on("mouseout", this._handleMouseOut, this);
        this.on("contextmenu", this._handleContextMenu, this);
    },

    updateIconSize: function () {
        const markerSizeSetting = App.userSettings.markerSize;
        const iconSizeValue = 20 + (markerSizeSetting - 1) * 5;
        const newIcon = new Icon({
            iconUrl: this.options2.icon.options.iconUrl,
            iconSize: [iconSizeValue, iconSizeValue],
            iconAnchor: [iconSizeValue / 2, iconSizeValue / 2],
            className: this.options2.iconClassName || "",
        });
        this.setIcon(newIcon);
    },

    /**
     * Remove the contextmenu marker and every object tied
     * @param {this}
     */
    delete: function(broadcast = true){

        // Broadcast to the session
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(JSON.stringify({ type: "DELETE_MARKER", uid: this.uid }));
            console.debug(`Sent delete request for marker with UID: ${this.uid}`);
        }

        // Remove the marker from targets array history
        this.map.history = this.map.history.filter(object => object !== this);

        // Delete the weapon marker and everything tied to it
        if (this.options.circles1Size) this.constructionRange.removeFrom(this.map.markersGroup).remove();
        if (this.options.circles2Size) this.exclusionRange.removeFrom(this.map.markersGroup).remove();           
        this.posPopUp.removeFrom(this.map.markersGroup).remove();
        this.off();
        this.removeFrom(this.map.markersGroup).removeFrom(this.map.activeMarkers);

        // If that was the last Marker on the map, hide "delete all" buttons
        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo").hide();

        this.remove();
    },

    _handleContextMenu: function() {
        // Avoid other target keeping fading
        clearTimeout(this.mouseOverTimeout);    
        this.delete();
    },

    _handleDrag: function (event) {
        event = this.keepOnMap(event);
        this.setLatLng(event.latlng);
        if (this.options.circles1Size) this.constructionRange.setLatLng(event.latlng); 
        if (this.options.circles2Size) this.exclusionRange.setLatLng(event.latlng);
        this.posPopUp.setLatLng(event.latlng);
        this.posPopUp.setContent(this.map.getKP(-event.latlng.lat, event.latlng.lng, 4)); 
    },

    _handleDragStart: function () {

        this.map.mouseLocationPopup.close();
        this.map.off("mousemove", this.map._handleMouseMove);
        this.posPopUp.openOn(this.map);
    },

    _handleDragEnd: function () {

        if (App.userSettings.keypadUnderCursor) this.map.on("mousemove", this.map._handleMouseMove);

        this.isDragging = false;
        this.posPopUp.close();

        if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {

            // Find the UID of the marker in activeMarkers
            let uid = null;

            App.minimap.activeMarkers.eachLayer((marker) => {
                if (marker === this) uid = marker.uid; // Use uid to identify the marker
            });

            if (uid !== null) {
                // Get the updated position of the dragged marker
                const newLatLng = this.getLatLng();

                // Send the MOVING_MARKER event to the server
                App.session.ws.send(
                    JSON.stringify({
                        type: "MOVING_MARKER",
                        uid: uid,
                        lat: newLatLng.lat,
                        lng: newLatLng.lng,
                    })
                );

                console.debug(`Sent move request for marker with UID: ${uid}, new position: (${newLatLng.lat}, ${newLatLng.lng})`);
            }
        }
        
    },

    _handleMouseOver: function(){
        if (this.options.circlesOnHover){
            if (this.constructionRange) this.constructionRange.addTo(this.map.markersGroup);
            if (this.exclusionRange) this.exclusionRange.addTo(this.map.markersGroup);
        }
    },

    _handleMouseOut: function(){
        if (this.options.circlesOnHover){
            if (this.constructionRange) this.constructionRange.removeFrom(this.map.markersGroup);
            if (this.exclusionRange) this.exclusionRange.removeFrom(this.map.markersGroup);
        }

        // Cancel the timeout if the user moves the mouse out before 1 second
        clearTimeout(this.mouseOverTimeout);
    }

});