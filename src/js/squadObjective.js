import { DivIcon, Marker, Circle, LayerGroup, Rectangle } from "leaflet";
import { App } from "../app.js";

export class SquadObjective {

    constructor(latlng, layer, objCluster, isMain, cluster) {
        var html = "";
        this.name = objCluster.name;
        this.objectName = objCluster.objectName;
        this.objCluster = objCluster;
        this.cluster = cluster;
        this.layerGroup = layer.activeLayerMarkers;
        this.layer = layer;
        this.latlng = latlng;
        this.clusters = [];
        this.capZones = new LayerGroup().addTo(this.layerGroup);
        this.isMain = isMain;
        this.isHidden = false;
        this.position = cluster.pointPosition;


        console.debug("creating flag", this.name, "at position", this.position);

        if (!this.isMain){ html = this.name;}

        this.nameText = new Marker(latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: "objText",
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: [150, 32]
            })
        }).addTo(this.layerGroup);

        // Initiate marker, no icon needed yet
        this.flag = new Marker(latlng).addTo(this.layerGroup);
        this.addCluster(cluster);

        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("mouseover", this._handleMouseOver, this);
        this.flag.on("mouseout", this._handleMouseOut, this);
    }

    select(){
        var position;
        var html;
        var className;

        this.flag.removeFrom(this.layerGroup).remove();
        console.debug("Selecting flag: ", this.name);

        if (this.isMain) { 
            html= "";
            className = "flag selected main";
        } 
        else {
            position = Math.abs(this.layer.startPosition - this.position); 
            position = Math.abs(this.layer.startPosition - this.position); 
        }

        if (!this.isMain) { 
            position = Math.abs(this.layer.startPosition - this.position); 
        }

        if (!this.isMain) { 
            html = position; 
            className = "flag selected";
        }

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

        this.isSelected = true;
        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("mouseover", this._handleMouseOver, this);
        this.flag.on("mouseout", this._handleMouseOut, this);
    }


    createCapZone(cap){
        const CZOPACITY = 0;
        const CZFILLOPACITY = 0;
        const CZCOLOR = "rgb(255, 255, 255)";
        const CZWEIGHT = 2;

        // Capzone location whatever shape it has
        let location_x = -(cap.location_x - this.layer.offset_x) / 100 * -this.layer.map.gameToMapScale;
        let location_y = (cap.location_y - this.layer.offset_y) / 100 * -this.layer.map.gameToMapScale;

        // Capzone is a Sphere
        if (cap.isSphere) {
            let latlng = [location_y , location_x];
            let radius = cap.sphereRadius / 100 * this.layer.map.gameToMapScale;
            let capZone = new Circle(latlng, {
                radius: radius,
                color: CZCOLOR,
                opacity: CZOPACITY,
                fillColor: CZCOLOR,
                fillOpacity: CZFILLOPACITY,
                weight: CZWEIGHT,
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
            // Sometime it can be -89.98..
            if (cap.boxExtent.rotation_y > -91 && cap.boxExtent.rotation_y < -89){
                totalRotation = totalRotation + cap.boxExtent.rotation_x + cap.boxExtent.rotation_y;
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

            let capZone = new Rectangle(capBounds, {
                color: CZCOLOR,
                fillColor: CZCOLOR,
                opacity: CZOPACITY,
                weight: CZWEIGHT,
                fillOpacity: CZFILLOPACITY,
            }).addTo(this.layer.activeLayerMarkers);
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
                    color: CZCOLOR,
                    opacity: CZOPACITY,
                    fillColor: CZCOLOR,
                    fillOpacity: CZFILLOPACITY,
                    weight: CZWEIGHT,
                }).addTo(this.layer.activeLayerMarkers);
                this.capZones.addLayer(circle1);

                let circle2 = new Circle(latlng2, {
                    radius: cap.capsuleRadius / 100 * this.layer.map.gameToMapScale,
                    color: CZCOLOR,
                    opacity: CZOPACITY,
                    fillColor: CZCOLOR,
                    fillOpacity: CZFILLOPACITY,
                    weight: CZWEIGHT,
                }).addTo(this.layer.activeLayerMarkers);
                this.capZones.addLayer(circle2);


                // Only rotate the circles if the capsule is not vertical
                if (cap.capsuleLength != cap.capsuleRadius) {
                    this.layer.rotateCircle(circle1, totalRotation, capZone.getCenter());
                    this.layer.rotateCircle(circle2, totalRotation, capZone.getCenter());
                }
            }

            this.layer.rotateRectangle(capZone, totalRotation);
            //this.layer.rotateRectangle(capZone, cap.boxExtent.rotation_z);
            this.capZones.addLayer(capZone);
        }

    }



    unselect(){
        var html = "";
        var position = Math.abs(this.layer.startPosition - this.position); 
        var className = "flag";

        if (this.isMain) { 
            if (this.layer.layerData.gamemode === "AAS" || this.layer.layerData.gamemode === "Destruction"){
                className = "flag main unselectable";
            } else {
                className = "flag main selectable";
            }
        } else {
            html = position;
            className = className + " flag" + position;
        }

        this.flag.removeFrom(this.layerGroup).remove();
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


        this.isSelected = false;
        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("mouseover", this._handleMouseOver, this);
        this.flag.on("mouseout", this._handleMouseOut, this);
    }

    addCluster(cluster){
        this.clusters.push(cluster);
        this.updatePosition();
    }


    updatePosition() {

        let lowestPossiblePosition;

        lowestPossiblePosition = this.clusters.reduce((min, item) =>
            item.pointPosition < min ? item.pointPosition : min,
        this.clusters[0].pointPosition
        );

        if (this.layer.reversed) {
            lowestPossiblePosition = this.clusters.reduce((max, item) =>
                item.pointPosition-1 > max ? item.pointPosition : max,
            this.clusters[0].pointPosition
            );
        }

        this.position = lowestPossiblePosition;

        // default parameters for AAS
        let className = "flag";
        let html = "";

        // if RAAS/Invasion, add the flag number and a colored icon
        if (this.layer.layerData.gamemode != "AAS") {
            className += " flag" + this.position;
            html = this.position;
        }

        if (this.isMain) { 
            html = "";
            if (this.layer.layerData.gamemode === "AAS" || this.layer.layerData.gamemode === "Destruction"){
                className = "flag main unselectable";
            } else {
                className = "flag main selectable";
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
        if (!App.userSettings.capZoneOnHover) return;
        
        if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
            this.revealCapZones();
        }
    }

    _handleMouseOut(){
        if (!App.userSettings.capZoneOnHover) return;
        this.hideCapZones();
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
        this.hideCapZones();
        this.flag.off();
        this.isHidden = true;
    }

    _setOpacity(value){
        this.flag.setOpacity(value);
        this.nameText.setOpacity(value);
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