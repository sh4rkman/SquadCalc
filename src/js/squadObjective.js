import { DivIcon, Marker, Circle, LayerGroup, Rectangle } from "leaflet";
import { App } from "../app.js";
import i18next from "i18next";

export class SquadObjective {

    constructor(latlng, layer, objCluster, isMain, cluster) {
        this.name = objCluster.name;
        this.objectName = objCluster.objectName.replaceAll(" ", "");
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

        console.debug("creating flag", this.name, "at position", this.position);
        let html = "";
        if (!this.isMain){ html = this.name;}

        this.nameText = new Marker(latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: "objText",
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, 38] : [150, 32],
                shadowUrl: "../img/icons/markers/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);


        // Temporary icon to avoid 404s on leaflet shadow marker
        let tempIcon = new DivIcon({
            shadowUrl: "../img/icons/markers/marker_shadow.webp",
            shadowSize: [0, 0],
        });

        this.flag = new Marker(latlng, {icon : tempIcon}).addTo(this.layerGroup);
        this.addCluster(cluster);

        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("mouseover", this._handleMouseOver, this);
        this.flag.on("mouseout", this._handleMouseOut, this);
    }


    updateIcon(){
        if (this.isSelected){
            this.select();
        } else {
            if (!this.isHidden) this.unselect();
        }
    }


    select(){
        let position = null;
        let html = "";
        let className = "flag selected";

        this.isNext = false;
        this.flag.removeFrom(this.layerGroup).remove();
        console.debug("Selecting flag: ", this.name);

        if (App.userSettings.circlesFlags) className += " circleFlag";
    
        if (this.isMain) {
            className += " main";
            if (process.env.DISABLE_FACTIONS != "true" && App.userSettings.enableFactions) {
                if (this.objectName.replaceAll(" ", "") === "00-Team1Main") {
                    if ($(".dropbtn8").val() != null) className += ` country_${$(".dropbtn8").val()}`;
                }
                else {
                    if ($(".dropbtn10").val() != null) className += ` country_${$(".dropbtn10").val()}`;
                }
            }
        } else {
            position = Math.abs(this.layer.startPosition - this.position);
            html = position;
        }

        this.updateMarker(className, html);

        this.isSelected = true;
        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("mouseover", this._handleMouseOver, this);
        this.flag.on("mouseout", this._handleMouseOut, this);
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
                if (this.objectName === "00-Team1Main") {
                    if ($(".dropbtn8").val() != null) {
                        html = $(".dropbtn8").val();
                    } else {
                        html = i18next.t("common:team1");
                    }
                } else {
                    if ($(".dropbtn10").val() != null) {
                        html = $(".dropbtn10").val();
                    } else {
                        html = i18next.t("common:team2");
                    }
                }
            } else {
                if (this.objectName === "00-Team1Main") html = i18next.t("common:team1");
                else html = i18next.t("common:team2");
            }
        }

        this.nameText.removeFrom(this.layerGroup).remove();
        this.nameText = new Marker(this.latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: nameTextClassName,
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, 38] : [150, 32],
                shadowUrl: "../img/icons/markers/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);

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
                rectangleRadiusX = cap.boxExtent.extent_x / 100 * -this.layer.map.gameToMapScale;
                rectangleRadiusY = cap.boxExtent.extent_y / 100 * -this.layer.map.gameToMapScale;
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
            if (this.layer.layerData.gamemode === "RAAS"){
                className += " main selectable";
            } else {
                className += " main unselectable";
            }
            if (process.env.DISABLE_FACTIONS != "true" && App.userSettings.enableFactions) {
                if (this.objectName === "00-Team1Main") className += ` country_${$(".dropbtn8").val()}`;
                else className += ` country_${$(".dropbtn10").val()}`;
            }
        } else {
            if (this.layer.layerData.gamemode != "AAS" && this.layer.layerData.gamemode != "Destruction" && this.layer.layerData.gamemode != "Skirmish"){
                html = position;
                className += " flag" + position;
            }
        } 

        if (Math.abs(this.layer.startPosition - this.position) === this.layer.currentPosition){
            if (this.layer.layerData.gamemode != "AAS" && this.layer.layerData.gamemode != "Destruction" && this.layer.layerData.gamemode != "Skirmish"){
                className += " next"; 
            }
        } else this.isNext = false;

        this.flag.removeFrom(this.layerGroup).remove();
        this.updateMarker(className, html);

        this.isSelected = false;

        if (this.layer.layerData.gamemode != "AAS" && this.layer.layerData.gamemode != "Destruction" && this.layer.layerData.gamemode != "Skirmish"){
            this.flag.on("click", this._handleClick, this);
            this.flag.on("contextmenu", this._handleContextMenu, this);
            this.flag.on("dblclick", this._handleDoubleClick, this);
            this.flag.on("mouseover", this._handleMouseOver, this);
            this.flag.on("mouseout", this._handleMouseOut, this);
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
            if (this.layer.layerData.gamemode === "AAS" || this.layer.layerData.gamemode === "Destruction" || this.layer.layerData.gamemode === "Invasion" || this.layer.layerData.gamemode === "Skirmish"){
                className += " main unselectable";
            } else {
                className += " main selectable";
            }
        } else {
            // if RAAS/Invasion, add the flag number and a colored icon
            if (this.layer.layerData.gamemode != "AAS" && this.layer.layerData.gamemode != "Destruction" && this.layer.layerData.gamemode != "Skirmish") {
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
        if (this.layer.layerData.gamemode === "Destruction" || this.layer.layerData.gamemode === "AAS") return;
        this.layer._handleFlagClick(this);
    }

    
    _handleDoubleClick(){
        // Catch double clicks to prevent placing markers
        return false;
    }

    _handleContextMenu(){
        if (this.layer.layerData.gamemode === "Destruction" || this.layer.layerData.gamemode === "AAS") return;
        if (this.isSelected){
            this.layer._handleFlagClick(this);
        }
    }

    _handleMouseOver() {

        // On RAAS/Invasion, preview the lane on hover
        if (this.layer.layerData.gamemode != "Destruction" && this.layer.layerData.gamemode != "AAS") {
            if (this.isNext && App.userSettings.revealLayerOnHover) {
                this.mouseOverTimeout = setTimeout(() => {
                    this.layer.preview(this);
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
        console.debug("      -> Hiding flag: ", this.name);
        this.nameText.removeFrom(this.layerGroup);
        this.flag.removeFrom(this.layerGroup);
        this.flag.options.interactive = false;
        this.flag.off();
        this.hideCapZones();
        this.isHidden = true;
    }

    _setOpacity(value){
        this.flag.setOpacity(value);
        this.nameText.setOpacity(value);

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
        this.isFadeOut = false;
    }

    _fadeOut(){
        this.flag.setOpacity(0.15);
        this.nameText.setOpacity(0.15);
        this.isFadeOut = true;
    }

    delete(){
        this.nameText.removeFrom(this.layerGroup).remove();
        this.flag.removeFrom(this.layerGroup).remove();
    }

    show(){
        console.debug("      -> Showing flag: ", this.name);
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