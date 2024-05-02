import L from "leaflet";
import "./ellipse";

import { globalData } from "./conf";
import { MAPS } from  "./maps";
import SquadSimulation from "./squadSimulation";
//import SquadFiringSolution from "./squadFiringSolution";

import { 
    getDist,
    getElevation,
    radToMil,
    radToDeg,
    getBearing,
    getSpreadParameter
} from "./utils";

import { mortarIcon, targetIcon1, targetIconAnimated1 } from "./squadIcon";


/*
 * Global Squad Marker Class 
*/
export var squadMarker = L.Marker.extend({
    options: {
        draggable: true,
        riseOnHover: true,
        keyboard: false,
        animate: true,
    },

    // Initialize method
    initialize: function (latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.on("dragstart", this._handleDragStart, this);
        this.on("dragend", this._handleDragEnd, this);
    },

    /**
     * Force a given event to stay inside the map bounds
     * @param {e} [event] - event
     * @returns {e} - same event with corrected Latlng 
     */
    keepOnMap: function(e){
        if (e.latlng.lng > globalData.mapSize) {e.latlng.lng = globalData.mapSize;}
        if (e.latlng.lat < -globalData.mapSize ) {e.latlng.lat = -globalData.mapSize;}
        if (e.latlng.lng < 0) {e.latlng.lng = 0;}
        if (e.latlng.lat > 0) {e.latlng.lat = 0;}
        return e;
    },

});

export var squadWeaponMarker = squadMarker.extend({
    options: {
        autoPan: false,
    },

    initialize: function (latlng, options) {
        
        var cursorClass;

        if (globalData.userSettings.cursor) {
            cursorClass = "crosshair";
        }
        else {
            cursorClass = "default";
        }

        this.maxDistCircleOn = {
            radius: globalData.activeWeapon.getMaxDistance() * (globalData.mapSize / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 0.7,
            color: "#00137f",
            fillOpacity: 0,
            weight: 2,
            autoPan: false,
            className: cursorClass,
        };

        this.minDistCircleOn = {
            radius: globalData.activeWeapon.minDistance * (globalData.mapSize / MAPS.find((elem, index) => index == globalData.activeMap).size),
            opacity: 0.7,
            color: "#00137f",
            fillOpacity: 0.2,
            weight: 1,
            autoPan: false,
            className: cursorClass,
        };

        this.minMaxDistCircleOff = {
            radius: 0,
            opacity: 0,
            fillOpacity: 0,
        };

        squadMarker.prototype.initialize.call(this, latlng, options);

        // Create the min/max range markers
        this.minRangeMarker = L.circle(latlng, this.minDistCircleOn).addTo(globalData.minimap.markersGroup);
        this.rangeMarker = L.circle(latlng, this.maxDistCircleOn).addTo(globalData.minimap.markersGroup);
        
        if (!globalData.userSettings.weaponMinMaxRange) {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
            this.rangeMarker.setStyle(this.minMaxDistCircleOff);
        }
        // Hide minRangeMarker if weapon doesn't have minimum range
        if (this.minRangeMarker.getRadius() == 0) {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
        }

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("dblclick", this._handleDblclick, this);
        this.on("contextmenu", this._handleContextMenu, this);
    },

    /**
     * Remove the Weapon marker and every object tied
     * @param {this}
     */
    delete: function(){

        this.removeFrom(globalData.minimap.activeWeaponsMarkers);

        if (globalData.minimap.activeWeaponsMarkers.getLayers().length === 0) { 
            globalData.minimap.deleteTargets();
        }
        else {
            // Set default icon on remaining weapon
            globalData.minimap.activeWeaponsMarkers.getLayers()[0].setIcon(mortarIcon);
        }

        // Delete the weapon marker and everthing tied to it
        this.remove();
        this.removeFrom(globalData.minimap.activeWeaponsMarkers);
        this.minRangeMarker.remove();
        this.rangeMarker.remove();

        // Update remaining targets if they exists
        globalData.minimap.updateTargets();
    },


    /**
     * update calcs, spread markers
     */
    updateWeapon: function(){

        var radiusMax = globalData.activeWeapon.getMaxDistance() * (globalData.mapSize / MAPS.find((elem, index) => index == globalData.activeMap).size);
        var radiusMin = globalData.activeWeapon.minDistance * (globalData.mapSize / MAPS.find((elem, index) => index == globalData.activeMap).size);
        
        this.minRangeMarker.setRadius(radiusMin);
        this.rangeMarker.setRadius(radiusMax);

        if (!globalData.userSettings.weaponMinMaxRange) {
            this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
            this.rangeMarker.setStyle(this.minMaxDistCircleOff);
        }
        else {
            // Update MinRange circle opacity
            if (this.minRangeMarker.getRadius() != 0) {
                this.minRangeMarker.setStyle(this.minDistCircleOn);
            }
            else {
                this.minRangeMarker.setStyle(this.minMaxDistCircleOff);
            }
            this.rangeMarker.setStyle(this.maxDistCircleOn);
        }
    },

    _handleClick: function(e) {
        this.delete(e);
    },

    _handleDrag: function (e) {
        e = this.keepOnMap(e);
        this.setLatLng(e.latlng);
        this.rangeMarker.setLatLng(e.latlng);
        this.minRangeMarker.setLatLng(e.latlng);
    },

    // Catch this events so user can't place a target by mistake while trying to delete weapon
    _handleContextMenu: function(){},
    _handleDblclick: function(){},

    _handleDragStart: function () {

        $(".leaflet-marker-icon").css("cursor", "grabbing");
        globalData.minimap.mouseLocationPopup.close();
        globalData.minimap.off("mousemove", globalData.minimap._handleMouseMove);

        globalData.minimap.activeTargetsMarkers.eachLayer(function (layer) {
            layer.calcMarker1.setContent("  ");
            layer.calcMarker2.setContent("  ");
            layer.spreadMarker1.setStyle({opacity: 0, fillOpacity: 0});
            layer.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
        }); 
    
    },

    _handleDragEnd: function () {

        if (globalData.userSettings.keypadUnderCursor){
            globalData.minimap.on("mousemove", globalData.minimap._handleMouseMove);
        }
        $(".leaflet-marker-icon").css("cursor", "grab");

        globalData.minimap.updateTargets();
    },
});


export var squadTargetMarker = squadMarker.extend({
    options: {
        calcMarker1: null,
        calcMarker2: null,
        spreadMarker1: null,
        spreadMarker2: null,
        results: {

        }
    },

    initialize: function (latlng, options) {
        const mapScale = MAPS.find((elem, index) => index == globalData.activeMap).size / globalData.mapSize;
        var radiiElipse;
        var angleElipse;
        var cursorClass;
        var popUpOptions_weapon1;
        var popUpOptions_weapon2;
        var weaponPos;
        var a;
        var b;
        var weaponHeight;
        var targetHeight;
        var dist;
        var velocity;
        var elevation;

        L.setOptions(this, options);

        if (globalData.userSettings.cursor) {
            cursorClass = "crosshair";
        }
        else {
            cursorClass = "default";
        }

        
        popUpOptions_weapon1 = {
            autoPan: false,
            autoClose: false,
            closeButton: false,
            closeOnEscapeKey: false,
            bubblingMouseEvents: false,
            interactive: false,
            className: "calcPopup",
            minWidth: 100,
            offset: [-65, 0],
        };

        popUpOptions_weapon2 = {
            closeButton: false,
            className: "calcPopup2",
            autoClose: false,
            closeOnEscapeKey: false,
            autoPan: false,
            bubblingMouseEvents: false,
            interactive: false,
            minWidth: 100,
            offset: [65, 0],
        };


        this.spreadOptionsOn = {
            opacity: 1,
            fillOpacity: 0.1,
            color: "#b22222",
            weight: 1,
            className: cursorClass,
        };

        this.spreadOptionsOff = {
            opacity: 0,
            fillOpacity: 0,
            className: cursorClass,
        };

        // Create marker
        squadMarker.prototype.initialize.call(this, latlng, options);
        this.addTo(globalData.minimap.activeTargetsMarkers);

        if (this.options.animate){
            this.setIcon(targetIconAnimated1);
        }
        else {
            this.setIcon(targetIcon1);
        }


        weaponPos = globalData.minimap.activeWeaponsMarkers.getLayers()[0].getLatLng();
        a = L.latLng([weaponPos.lng * mapScale, weaponPos.lat * -mapScale]);
        b = L.latLng([latlng.lng * mapScale, latlng.lat * -mapScale]);
        weaponHeight = this._map.heightmap.getHeight(weaponPos);
        targetHeight = this._map.heightmap.getHeight(latlng);
        dist = getDist(a, b);
        velocity = globalData.activeWeapon.getVelocity(dist);
        elevation = getElevation(dist, targetHeight - weaponHeight, velocity);


        this.options.results = {
            distance: dist,
            elevation: getElevation(dist, targetHeight - weaponHeight, velocity),
            bearing: getBearing(a, b),
            velocity: velocity,
            gravityScale: globalData.activeWeapon.gravityScale,
            weaponHeight: weaponHeight,
            targetHeight: targetHeight,
            diffHeight: targetHeight - weaponHeight,
            spreadParameters: getSpreadParameter(elevation, velocity)
        };


        radiiElipse = [(this.options.results.spreadParameters.semiMajorAxis * globalData.mapScale)/2, (this.options.results.spreadParameters.semiMinorAxis * globalData.mapScale)/2];
        angleElipse = this.options.results.spreadParameters.elevation;

        // Calc PopUp for weapon 1
        this.calcMarker1 = L.popup(popUpOptions_weapon1).setLatLng(latlng).openOn(globalData.minimap).addTo(globalData.minimap.markersGroup);

        // Calc PopUp for weapon 2 (not displayed yet)
        this.calcMarker2 = L.popup(popUpOptions_weapon2).setLatLng(latlng).addTo(globalData.minimap.markersGroup);

        this.spreadMarker1 = L.ellipse(latlng, radiiElipse, this.options.results.bearing, this.spreadOptionsOn).addTo(globalData.minimap.markersGroup);
        this.spreadMarker2 = L.ellipse(latlng, radiiElipse, angleElipse, this.spreadOptionsOff).addTo(globalData.minimap.markersGroup);

        if (globalData.userSettings.spreadRadius) {
            this.spreadMarker1.setStyle(this.spreadOptionsOff);
        }

        // If two weapons already on the map
        if (globalData.minimap.activeWeaponsMarkers.getLayers().length === 2) {

            weaponPos = globalData.minimap.activeWeaponsMarkers.getLayers()[1].getLatLng();
            a = L.latLng([weaponPos.lng * mapScale, weaponPos.lat * -mapScale]);        
            weaponHeight = this._map.heightmap.getHeight(weaponPos);
            targetHeight = this._map.heightmap.getHeight(latlng);
            dist = getDist(a, b);
            velocity = globalData.activeWeapon.getVelocity(dist);
            elevation = getElevation(dist, targetHeight - weaponHeight, velocity);
    
            this.options.results2 = {
                elevation: elevation,
                bearing: getBearing(a, b),
                distance: dist,
                velocity: velocity,
                gravityScale: globalData.activeWeapon.gravityScale,
                weaponHeight: weaponHeight,
                targetHeight: targetHeight,
                diffHeight: targetHeight - weaponHeight,
                spreadParameters: getSpreadParameter(elevation, velocity)
            };

        
            // Initiate Spread Ellipse Marker
            if (this.options.results2.elevation === "---" || this.options.results2.spreadParameters.semiMajorAxis === 0) {
                this.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
            }
            else {
                this.spreadMarker2.setRadius([(this.options.results2.spreadParameters.semiMajorAxis * globalData.mapScale)/2, (this.options.results2.spreadParameters.semiMinorAxis * globalData.mapScale)/2]);
                this.spreadMarker2.setTilt(this.options.results2.bearing);
                if (globalData.userSettings.spreadRadius) {
                    this.spreadMarker2.setStyle(this.spreadOptionsOn);
                }
                else {
                    this.spreadMarker2.setStyle(this.spreadOptionsOff);
                }
            }
            this.calcMarker2.setContent(this.getContent(this.options.results2)).openOn(globalData.minimap);
        }

        
        
        // Initiate Spread Ellipse Marker
       
        if (this.options.results.elevation === "---" || this.options.results.spreadParameters.semiMajorAxis === 0) {
            this.spreadMarker1.setStyle(this.spreadOptionsOff);
        }
        else {
            this.spreadMarker1.setRadius([(this.options.results.spreadParameters.semiMajorAxis * globalData.mapScale)/2, (this.options.results.spreadParameters.semiMinorAxis * globalData.mapScale)/2]);
            if (globalData.userSettings.spreadRadius) {
                this.spreadMarker1.setStyle(this.spreadOptionsOn); 
            }
            else {
                this.spreadMarker1.setStyle(this.spreadOptionsOff); 
            }
        }

        this.calcMarker1.setContent(this.getContent(this.options.results));

        // Custom events handlers
        this.on("click", this._handleClick, this);
        this.on("drag", this._handleDrag, this);
        this.on("dragStart", this._handleDragStart, this);
        this.on("dragEnd", this._handleDragEnd, this);
        this.on("contextmenu", this._handleContextMenu, this);
    },



    /**
     * Remove the target marker and every object tied
     * @param {this}
     */
    delete: function(){
        this.spreadMarker1.removeFrom(globalData.minimap.markersGroup);
        this.spreadMarker2.removeFrom(globalData.minimap.markersGroup);

        this.calcMarker1.removeFrom(globalData.minimap.markersGroup);
        this.calcMarker2.removeFrom(globalData.minimap.markersGroup);

        this.removeFrom(globalData.minimap.activeTargetsMarkers);
        this.removeFrom(globalData.minimap.markersGroup);

        this.remove();

        if (globalData.minimap.activeTargetsMarkers.getLayers().length === 0) {
            $(".btn-delete").hide();
        }
    },

    getContent: function(results){
        const DIST = results.distance;
        const BEARING = results.bearing;
        var text = results.elevation;
        var content;

        if (isNaN(text)) {
            text = "---";
        } else {
            if (globalData.activeWeapon.unit === "mil"){
                text = radToMil(text).toFixed(0);
            } else {
                text = radToDeg(text).toFixed(1);
            }
        }
        content = "<span class='calcNumber'></span></br><span>" + text + "</span>";

        if (globalData.userSettings.bearingOverDistance) {
            return content + "<br><span class='bearingUiCalc'>" +  DIST.toFixed(0) + "m</s    pan>";
        }
        else {
            return content + "<br><span class='bearingUiCalc'>" +  BEARING.toFixed(0) + "°</span>";
        }  
    },


    updateCalc: function(){
        const mapScale = MAPS.find((elem, index) => index == globalData.activeMap).size / globalData.mapSize;
        var weaponPos = globalData.minimap.activeWeaponsMarkers.getLayers()[0].getLatLng();
        var a = L.latLng([weaponPos.lng * mapScale, weaponPos.lat * -mapScale]);
        var b = L.latLng([this.getLatLng().lng * mapScale, this.getLatLng().lat * -mapScale]);
        var weaponHeight = globalData.minimap.heightmap.getHeight(weaponPos);
        var targetHeight = globalData.minimap.heightmap.getHeight(this.getLatLng());
        var dist = getDist(a, b);
        var elevation = getElevation(dist, targetHeight - weaponHeight, globalData.activeWeapon.getVelocity(dist));
        var velocity = globalData.activeWeapon.getVelocity(dist);

        this.options.results = {
            elevation: elevation,
            bearing: getBearing(a, b),
            distance: dist,
            velocity: velocity,
            gravityScale: globalData.activeWeapon.gravityScale,
            weaponHeight: weaponHeight,
            targetHeight: targetHeight,
            diffHeight: targetHeight - weaponHeight,
            spreadParameters: getSpreadParameter(elevation, velocity),
        };
              
        if (this.options.results.elevation === "---" || this.options.results.spreadParameters.semiMajorAxis === 0) {
            this.spreadMarker1.setStyle({opacity: 0, fillOpacity: 0});

        }
        else {

            this.spreadMarker1.setRadius([(this.options.results.spreadParameters.semiMajorAxis * globalData.mapScale)/2, (this.options.results.spreadParameters.semiMinorAxis * globalData.mapScale)/2]);
            if (globalData.userSettings.spreadRadius) {
                this.spreadMarker1.setStyle(this.spreadOptionsOn);
            }
            else {
                this.spreadMarker1.setStyle(this.spreadOptionsOff);
            }
            this.spreadMarker1.setTilt(this.options.results.bearing);
        }

        
        this.spreadMarker2.setStyle(this.spreadOptionsOff);

        if (globalData.minimap.activeWeaponsMarkers.getLayers().length === 2) {

            weaponPos = globalData.minimap.activeWeaponsMarkers.getLayers()[1].getLatLng();
            a = L.latLng([weaponPos.lng * mapScale, weaponPos.lat * -mapScale]);    
            weaponHeight = this._map.heightmap.getHeight(weaponPos);
            targetHeight = this._map.heightmap.getHeight(this.getLatLng());
            dist = getDist(a, b);
            velocity = globalData.activeWeapon.getVelocity(dist);
    
            this.options.results2 = {
                elevation: getElevation(dist, targetHeight - weaponHeight, velocity),
                bearing: getBearing(a, b),
                distance: dist,
                velocity: velocity,
                gravityScale: globalData.activeWeapon.gravityScale,
                weaponHeight: weaponHeight,
                targetHeight: targetHeight,
                diffHeight: targetHeight - weaponHeight,
                spreadParameters: getSpreadParameter(elevation, velocity)
            };


            if (this.options.results2.elevation === "---" || this.options.results2.spreadParameters.semiMajorAxis === 0) {
                this.spreadMarker2.setStyle({opacity: 0, fillOpacity: 0});
            }
            else {
                this.spreadMarker2.setRadius([(this.options.results2.spreadParameters.semiMajorAxis * globalData.mapScale)/2, (this.options.results2.spreadParameters.semiMinorAxis * globalData.mapScale)/2]);
                this.spreadMarker2.setTilt(this.options.results2.bearing);

                if (globalData.userSettings.spreadRadius) {
                    this.spreadMarker2.setStyle(this.spreadOptionsOn);
                }
                else {
                    this.spreadMarker2.setStyle(this.spreadOptionsOff);
                }
            }
            this.calcMarker2.setContent(this.getContent(this.options.results2)).openOn(globalData.minimap);
        }
        else {
            this.calcMarker2.close();
        }
        this.calcMarker1.setContent(this.getContent(this.options.results));
    },

    /**
     * TODO
     * @param {TODO} [TODO] - TODO
     * @returns {TODO} - TODO
     */
    drawTrajectory: function(canvas, heightPath, ground, groundOffset, distance, angle, vel, gScale){
        const ctx = canvas.getContext("2d");
        const maxGround = Math.max(...heightPath);
        const PADDING = 0.1;
        //const xScaling = (canvas.width) / distance
        const xScaling = ( canvas.width - (2 * PADDING * canvas.width) ) / ( distance );
        const yScaling = canvas.height/(maxGround * 4);
        const G = 9.8 * gScale * yScaling;
        const FREQ = 20;
        
        var x = canvas.width * PADDING;
        var oldX = canvas.width * PADDING;
        var y = heightPath[0] * yScaling;
        var oldY = heightPath[0] * yScaling;
    
        var xVel = Math.cos(angle) * vel * xScaling;
        var yVel = Math.sin(angle) * vel * yScaling;



        var myInterval = setInterval(function () {
            x += xVel / FREQ;
            y += yVel / FREQ;
            yVel -= G / FREQ;
    
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(oldX,oldY);
            ctx.strokeStyle = "green";
            ctx.lineTo(x,y);
            ctx.stroke();
            oldX = x;
            oldY = y;
    
            if (y < 0 || x - ( PADDING * canvas.width ) > (canvas.width - (PADDING*2*canvas.width))) {
                clearInterval(myInterval);
                ctx.closePath();
                //thisRef.drawCanvasIcons(canvas, heightPath, PADDING); // redraw to overide path
            }
    
        });        

   
    },

    _handleClick: function() {
        const dialog = document.getElementById("calcInformation");
        const canvas = document.getElementById("heightGraph");
        var weapon1Pos;
        var heightPath;

        dialog.showModal();

        $("#infBearing").text(this.options.results.bearing.toFixed(1)+"°");
        $("#infDistance").text(this.options.results.distance.toFixed(1)+"m");
        $("#infVelocity").text(this.options.results.velocity.toFixed(2)+" m/s");
        $("#infWHeight").text(this.options.results.weaponHeight.toFixed(1)+"m");
        $("#infTHeight").text(this.options.results.targetHeight.toFixed(1)+"m");
        $("#infDHeight").text(this.options.results.diffHeight.toFixed(1)+"m");
        $("#infGravity").text(9.8 + " (x" + this.options.results.gravityScale + ")");

        if (isNaN(this.options.results.elevation)) {
            $("#infElevation").text("---");
        } else {
            if (globalData.activeWeapon.unit === "mil"){
                $("#infElevation").text(radToMil(this.options.results.elevation).toFixed(1)+"mil");
            } else {
                $("#infElevation").text(radToDeg(this.options.results.elevation).toFixed(1)+"°");
            }
        }

        weapon1Pos = globalData.minimap.activeWeaponsMarkers.getLayers()[0].getLatLng();
        heightPath = this._map.heightmap.getHeightPath(weapon1Pos, this.getLatLng());
        new SquadSimulation(canvas, this.options.results, heightPath);

    },

    // Keep the marker on map & update calc while dragging
    _handleDrag: function (e) {
        
        // When dragging marker out of bounds, block it at the edge
        e = this.keepOnMap(e);

        // Update Position
        this.setLatLng(e.latlng);
        this.calcMarker1.setLatLng(e.latlng);
        this.spreadMarker1.setLatLng(e.latlng);
        this.calcMarker2.setLatLng(e.latlng);
        this.spreadMarker2.setLatLng(e.latlng);

        // Update bearing/elevation/spread marker
        this.updateCalc();
    },

    // set "grabbing" cursor on grab start
    _handleDragStart: function () {
        $(".leaflet-marker-icon").css("cursor", "grabbing");
        globalData.minimap.mouseLocationPopup.close();
        globalData.minimap.off("mousemove", globalData.minimap._handleMouseMove);
    },

    // Reset cursor on drag end
    _handleDragEnd: function () {
        if (globalData.userSettings.keypadUnderCursor){
            globalData.minimap.on("mousemove", globalData.minimap._handleMouseMove);
        }
        $(".leaflet-marker-icon").css("cursor", "grab");
    },

    // Delete targetMarker on right clic
    _handleContextMenu: function(){
        this.delete();
    },

});


