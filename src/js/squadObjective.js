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
            icon: new DivIcon({
                className: "objText",
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

    // Catch double
    _handleDoubleClick(){
        return false;
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

        var location_x = -(cap.location_x - this.layer.offset_x) / 100;
        var location_y = (cap.location_y - this.layer.offset_y) / 100;
        var boxExtentX = cap.boxExtent.location_x / 100;
        var boxExtentY = cap.boxExtent.location_y / 100;
        var latlngSphereRadius = [location_y * -this.layer.map.gameToMapScale, location_x * -this.layer.map.gameToMapScale];
        var radiusTest = cap.sphereRadius / 100 * this.layer.map.gameToMapScale;

        // define rectangle geographical bounds
        var bound1 = [(location_y + boxExtentY) * -this.layer.map.gameToMapScale , (location_x + boxExtentX) * -this.layer.map.gameToMapScale];
        var bound2 = [(location_y - boxExtentY) * -this.layer.map.gameToMapScale , (location_x - boxExtentX) * -this.layer.map.gameToMapScale];
        var bounds = [bound1, bound2];

        var distanceToCorner = Math.sqrt(Math.pow(bound1[0] - (location_y * -this.layer.map.gameToMapScale), 2) + Math.pow(bound1[1] - (location_x * -this.layer.map.gameToMapScale), 2));

        var capzone;

        if (radiusTest > distanceToCorner){
            capzone = new Rectangle(bounds, {
                color: "rgb(230, 230, 230)",
                fillColor: "rgb(199, 199, 199)",
                opacity: 0,
                weight: 2,
                fillOpacity: 0,
            }).addTo(this.layer.activeLayerMarkers);
            this.capZones.addLayer(capzone);

            //Debug rectangle
            // this.capZones.addLayer(
            //     new L.Circle(latlngSphereRadius, {
            //     opacity: 0.5,
            //     color: "green",
            //     radius: radiusTest,
            // }).addTo(this.layer.activeLayerMarkers));
        } 
        else {

            capzone = new Circle(latlngSphereRadius, {
                color: "rgb(230, 230, 230)",
                fillColor: "rgb(199, 199, 199)",
                opacity: 0,
                weight: 2,
                fillOpacity: 0,
                radius: radiusTest,
            }).addTo(this.layer.activeLayerMarkers);
            this.capZones.addLayer(capzone);
    
            // //debug
            // capzone = new Rectangle(bounds, {
            //     color: "green",
            //     fillColor: "rgb(199, 199, 199)",
            //     opacity: 1,
            //     weight: 2,
            //     fillOpacity: 0,
            // }).addTo(this.layer.activeLayerMarkers)
            // this.capZones.addLayer(capzone);
    
        }

       

    }



    unselect(){
        var html = "";
        var position = Math.abs(this.layer.startPosition - this.position); 
        var className = "flag";

        //var position = this.position;

        this.flag.removeFrom(this.layerGroup).remove();

        if (this.isMain) { 
            html= "";
            if (this.layer.layerData.gamemode === "AAS" || this.layer.layerData.gamemode === "Destruction"){
                className = "flag main unselectable";
            } else {
                className = "flag main selectable";
            }
        } else {
            html = position;
            className = className + " flag" + position;
        }

        this.flag = new Marker(this.latlng, {
            interactive: true,
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
                item.pointPosition > max ? item.pointPosition : max,
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

    _handleContextMenu(){
        if (this.layer.layerData.gamemode === "Destruction" || this.layer.layerData.gamemode === "AAS") return;
        this.layer._handleFlagClick(this);
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