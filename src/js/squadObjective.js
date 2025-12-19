import { DivIcon, Marker, Circle, LayerGroup, Rectangle } from "leaflet";
import { App } from "../app.js";
import i18next from "i18next";
import "tippy.js/dist/tippy.css";
import { FactionCtxMenu } from "./squadFactionCtxMenu.js";

export class SquadObjective {

    constructor(latlng, layer, objCluster, isMain, cluster) {
        this.name = objCluster.name;
        this.objectName = objCluster.objectName;
        this.objCluster = objCluster;
        this.cluster = cluster;
        this.layerGroup = layer.activeLayerMarkers;
        this.layer = layer;
        this.latlng = latlng;
        this.clusters = [];
        this.capZones = new LayerGroup();
        this.isMain = isMain;
        this.isHidden = false;
        this.position = cluster.pointPosition;
        this.isNext = false;
        this.percentage = "";

        console.debug("creating flag", this.name, "at position", this.position);
        let html = "";
        if (!this.isMain){ 
            html = this.name;
        } else {
            if (this.objectName === "00-Team1 Main") {
                html = `<span><span data-i18n="common:team1">${i18next.t("team1", { ns: "common" })}</span></span>`;
            } else {
                html = `<span><span data-i18n="common:team2">${i18next.t("team2", { ns: "common" })}</span></span>`;
            }
        }

        this.nameText = new Marker(latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: "objText",
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, 38] : [150, 32],
                shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);

        // Temporary icon to avoid 404s on leaflet shadow marker
        let tempIcon = new DivIcon({
            shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
            shadowSize: [0, 0],
        });

        this.flag = new Marker(latlng, {icon : tempIcon}).addTo(this.layerGroup);
        this.addCluster(cluster);
        this.updateMainIcon();

        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("pointerover", this._handleMouseOver, this);
        this.flag.on("pointerout", this._handleMouseOut, this);
    }


    showPercentage() {
        this.percentageText = new Marker(this.latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: "objText",
                keyboard: false,
                html: Math.round(this.percentage) + "%",
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, -18] : [150, -12],
                shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);
    }

    update(){
        if (this.isSelected){
            this.select();
        } else {
            if (!this.isHidden) this.unselect();
        }
    }


    updateMainIcon() {
        if (!this.isMain) return;

        let dropdownSelector, fileName;

        if (this.objectName === "00-Team1 Main") {
            dropdownSelector = ".dropbtn8";
        } else {
            dropdownSelector = ".dropbtn10";
        }

        fileName = $(dropdownSelector).val();
        if (!fileName || !App.userSettings.enableFactions) fileName = "main";
        if (App.userSettings.circlesFlags) fileName = `circles/${fileName}`;
        this.flag.getElement().style.backgroundImage = `url('/api/v2/img/flags/${fileName}.webp')`;
    }


    select(){
        let position = null;
        let html = "";
        let className = "flag selected";
        this.isNext = false;
        this.flag.removeFrom(this.layerGroup).remove();

        if (App.userSettings.circlesFlags) className += " circleFlag";
    
        if (this.isMain) {
            className += " main";
        } else {
            position = Math.abs(this.layer.startPosition - this.position);
            html = position;
        }

        this.updateMarker(className, html);

        this.isSelected = true;
        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("pointerover", this._handleMouseOver, this);
        this.flag.on("pointerout", this._handleMouseOut, this);
    }


    updateMarker(className, html){
        let nameTextClassName = "objText";

        this.flag = new Marker(this.latlng, {
            interactive: true,
            keyboard: false,
            icon: new DivIcon({
                className: className,
                html: html,
                iconSize: [44, 22],
                iconAnchor: [22, 11]
            })
        }).addTo(this.layerGroup);

        if (!this.isMain){ 
            html = this.name;
        } else {

            nameTextClassName += " main";

            if (process.env.DISABLE_FACTIONS != "true" && App.userSettings.enableFactions) {

                if (this.objectName === "00-Team1 Main") {
                    html = `<span><span data-i18n="common:team1">${i18next.t("team1", { ns: "common" })}</span>`;
                    if ($(".dropbtn8").val() != null) html += ` : <span data-i18n="factions:${$(".dropbtn8").val()}">${i18next.t($(".dropbtn8").val(), { ns: "factions" })}</span>`;
                } else {
                    html = `<span><span data-i18n="common:team2">${i18next.t("team2", { ns: "common" })}</span>`;
                    if ($(".dropbtn10").val() != null) html += ` : <span data-i18n="factions:${$(".dropbtn10").val()}">${i18next.t($(".dropbtn10").val(), { ns: "factions" })}</span>`;
                }
                html += "</span>";

            } else {
                if (this.objectName === "00-Team1 Main") html = `<span data-i18n="common:team1">${i18next.t("team1", { ns: "common" })}</span>`;
                else html = `<span data-i18n="common:team2">${i18next.t("team2", { ns: "common" })}</span>`;
            }
        }

        this.nameText.removeFrom(this.layerGroup).remove();
        if (this.percentageText) this.percentageText.removeFrom(this.layerGroup).remove();
        this.nameText = new Marker(this.latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: nameTextClassName,
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, 38] : [150, 32],
                shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);

        this.updateMainIcon();

    }


    createCapZone(cap){
        const CZOPACITY = 0;
        const CZFILLOPACITY = 0;
        const CZCOLOR = "rgb(255, 255, 255)";
        const CZWEIGHT = 2;

        const CZOPTIONS = {
            color: CZCOLOR,
            opacity: CZOPACITY,
            fillColor: CZCOLOR,
            fillOpacity: CZFILLOPACITY,
            weight: CZWEIGHT,
            className: "capZone"
        };


        // Capzone location whatever shape it has
        let location_x = -(cap.location_x - this.layer.offset_x) / 100 * -this.layer.map.gameToMapScale;
        let location_y = (cap.location_y - this.layer.offset_y) / 100 * -this.layer.map.gameToMapScale;

        // Capzone is a Sphere
        if (cap.isSphere) {
            let latlng = [location_y , location_x];
            let radius = cap.sphereRadius / 100 * this.layer.map.gameToMapScale;
            let capZone = new Circle(latlng, {
                radius: radius,
                ...CZOPTIONS,
            }).addTo(this.layer.activeLayerMarkers);
            this.capZones.addLayer(capZone);
            return;
        }

        // Capzone is a Rectangle/Capsule
        if (cap.isBox || cap.isCapsule) {
            let rectangleRadiusX;
            let rectangleRadiusY;
            let totalRotation = cap.boxExtent.rotation_z;

            // If object is on his side (often the case for capsules) take x/y/z in account 
            // Sometime it can be -89.98 or 90.04 so we need to take a range
            if (Math.abs(cap.boxExtent.rotation_y) > 89 && Math.abs(cap.boxExtent.rotation_y) < 91) {
                if (cap.boxExtent.rotation_y > 0) {
                    totalRotation -= cap.boxExtent.rotation_x + cap.boxExtent.rotation_y;
                } else {
                    totalRotation += cap.boxExtent.rotation_x + cap.boxExtent.rotation_y;
                }
            }

            // Cap radiis
            if (cap.isBox) {
                rectangleRadiusX = (cap.boxExtent.extent_x / 100) * cap.boxExtent.scaling_x * -this.layer.map.gameToMapScale;
                rectangleRadiusY = (cap.boxExtent.extent_y / 100) * cap.boxExtent.scaling_y * -this.layer.map.gameToMapScale;
            }
            else if (cap.isCapsule) {
                rectangleRadiusX = cap.capsuleRadius / 100 * -this.layer.map.gameToMapScale;
                rectangleRadiusY = (cap.capsuleLength - cap.capsuleRadius) / 100 * -this.layer.map.gameToMapScale;
            }

            // Cap Zone bounds
            let capNWCorner = [(location_y + rectangleRadiusY) , (location_x + rectangleRadiusX)];
            let capSECorner = [(location_y - rectangleRadiusY), (location_x - rectangleRadiusX)];
            let capBounds = [capNWCorner, capSECorner];

            let capZone = new Rectangle(capBounds, {...CZOPTIONS}).addTo(this.layer.activeLayerMarkers);
            this.capZones.addLayer(capZone);
        
            // For capsules we'll need to create 2 circles aswell
            if (cap.isCapsule) {
                let latSphere1 = (capZone.getBounds().getNorthEast().lat + capZone.getBounds().getNorthWest().lat ) / 2;
                let lngSphere1 = (capZone.getBounds().getNorthEast().lng + capZone.getBounds().getNorthWest().lng ) / 2;
                let latlng1 = { lat: latSphere1, lng: lngSphere1 };

                let latSphere2 = (capZone.getBounds().getSouthEast().lat + capZone.getBounds().getSouthWest().lat ) / 2;
                let lngSphere2 = (capZone.getBounds().getSouthEast().lng + capZone.getBounds().getSouthWest().lng ) / 2;
                let latlng2 = { lat: latSphere2, lng: lngSphere2 };

                let circle1 = new Circle(latlng1, {
                    radius: cap.capsuleRadius / 100 * this.layer.map.gameToMapScale,
                    ...CZOPTIONS,
                }).addTo(this.layer.activeLayerMarkers);
                this.capZones.addLayer(circle1);

                let circle2 = new Circle(latlng2, {
                    radius: cap.capsuleRadius / 100 * this.layer.map.gameToMapScale,
                    ...CZOPTIONS,
                }).addTo(this.layer.activeLayerMarkers);
                this.capZones.addLayer(circle2);

                // Only rotate the circles if the capsule is not vertical
                if (cap.capsuleLength != cap.capsuleRadius) {
                    this.layer.rotateCircle(circle1, totalRotation, capZone.getCenter());
                    this.layer.rotateCircle(circle2, totalRotation, capZone.getCenter());
                }
            }

            this.layer.rotateRectangle(capZone, totalRotation);
            this.capZones.addLayer(capZone);
        }

    }


    unselect(){
        let html = "";
        let position = Math.abs(this.layer.startPosition - this.position); 
        let className = "flag";

        if (App.userSettings.circlesFlags) className += " circleFlag";

        if (this.isMain) { 
            if (this.layer.gamemode === "RAAS"){
                className += " main selectable";
            } else {
                className += " main unselectable";
            }
        } else {
            if (this.layer.isRandomized){
                html = position;
                className += " flag" + position;
            }
        } 

        if (Math.abs(this.layer.startPosition - this.position) === this.layer.currentPosition){
            if (this.layer.isRandomized){
                className += " next"; 
            }
        } else this.isNext = false;

        this.flag.removeFrom(this.layerGroup).remove();
        this.updateMarker(className, html);

        this.isSelected = false;

        if (this.layer.isRandomized){
            this.flag.on("click", this._handleClick, this);
            this.flag.on("contextmenu", this._handleContextMenu, this);
            this.flag.on("dblclick", this._handleDoubleClick, this);
            this.flag.on("pointerover", this._handleMouseOver, this);
            this.flag.on("pointerout", this._handleMouseOut, this);
        }
    }

    
    addCluster(cluster){
        this.clusters.push(cluster);
        this.updatePosition();
    }


    updatePosition() {

        let lowestPossiblePosition;
        let className = "flag";
        let html = "";

        if (this.layer.reversed) {
            lowestPossiblePosition = this.clusters.reduce((max, item) => {
                return item.pointPosition - 1 > max ? item.pointPosition : max;
            }, this.clusters[0].pointPosition);
        } else {
            lowestPossiblePosition = this.clusters.reduce((min, item) => {
                return item.pointPosition < min ? item.pointPosition : min;
            }, this.clusters[0].pointPosition);
        }
        
        this.position = lowestPossiblePosition;
    
        if (App.userSettings.circlesFlags){
            className += " circleFlag";
        }

        if (this.isMain) { 
            if (this.layer.gamemode === "RAAS") className += " main selectable";
            else className += " main unselectable";
        } else {
            // if RAAS/Invasion, add the flag number and a colored icon
            if (this.layer.isRandomized) {
                className += " flag" + this.position;
                html = this.position;
            }
        }

        // Refresh the flag icon
        this.flag.setIcon(new DivIcon({
            className: className,
            html: html,
            iconSize: [44, 22],
            iconAnchor: [22, 11]
        }));
    }

    _handleClick(){
        clearTimeout(this.mouseOverTimeout);
        if (!this.layer.isRandomized) return;
        this.layer._handleFlagClick(this);
    }

    
    _handleDoubleClick(){
        return false;
    }

    
    _handleContextMenu(e){
        
        if (this.isMain && App.userSettings.enableFactions && process.env.DISABLE_FACTIONS != "true") {
            this.ctxMenu = new FactionCtxMenu(this.layer, this.objCluster.objectDisplayName).open(e);
            return;
        }

        if (this.layer.isRandomized && this.isSelected) this.layer._handleFlagClick(this);
    }

    _handleMouseOver() {

        // On RAAS/Invasion, preview the lane on hover
        if (this.layer.isRandomized) {
            if (this.isNext && App.userSettings.revealLayerOnHover) {
                this.mouseOverTimeout = setTimeout(() => {
                    this.layer.render(this, true);
                }, 250);
            }
        }

        // If the user has the capzones on hover setting enabled, show them
        if (App.userSettings.capZoneOnHover) {
            if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
                this.revealCapZones();
            }
        }

    }

    _handleMouseOut(){
        // Cancel the timeout if the user moves the mouse out before 1 second
        clearTimeout(this.mouseOverTimeout);

        if (App.userSettings.capZoneOnHover) this.hideCapZones();

        this.layer.flags.forEach((flag) => {
            if (flag.isHidden) return;
            flag._fadeIn();
            flag.isFadeOut = false;
            if (!App.userSettings.capZoneOnHover) {
                if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
                    flag.revealCapZones();
                }
            }
        });

    }


    revealCapZones(){
        this.capZones.eachLayer((cap) => {
            cap.setStyle({ opacity: 1, fillOpacity: 0.3 });
        });
    }


    hideCapZones(){
        this.capZones.eachLayer((cap) => {
            cap.setStyle({ opacity: 0, fillOpacity: 0 });
        });
    }


    hide(){
        //console.debug("      -> Hiding flag: ", this.name);
        this.nameText.removeFrom(this.layerGroup);
        this.percentageText?.removeFrom(this.layerGroup).remove();
        this.flag.removeFrom(this.layerGroup);
        this.flag.options.interactive = false;
        this.flag.off();
        this.hideCapZones();
        this.isHidden = true;
    }

    _setOpacity(value){
        this.flag.setOpacity(value);
        this.nameText.setOpacity(value);
        this.percentageText?.setOpacity(value);

        // if opacity = 0, this.flag can't be clicked
        // css cursor is set to default on hover
        if (value === 0){
            $(".flag").css("pointer-events", "none");
        } else {
            $(".flag").css("pointer-events", "all");
        }
    }


    _fadeIn(){
        this.flag.setOpacity(1);
        this.nameText.setOpacity(1);
        this.percentageText?.setOpacity(1);
        this.isFadeOut = false;
    }

    _fadeOut(){
        this.flag.setOpacity(0.15);
        this.nameText.setOpacity(0.15);
        this.percentageText?.setOpacity(0.15);
        this.isFadeOut = true;
    }

    delete(){
        this.nameText.removeFrom(this.layerGroup).remove();
        this.percentageText?.removeFrom(this.layerGroup).remove();
        this.flag.removeFrom(this.layerGroup).remove();
    }

    show(){
        this.nameText.setOpacity(1).addTo(this.layerGroup);
        this.flag.setOpacity(1).addTo(this.layerGroup);
        this.unselect();
        this.isHidden = false;

        if (App.userSettings.capZoneOnHover) return;
        
        if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
            this.revealCapZones();
        }
        
    }
}