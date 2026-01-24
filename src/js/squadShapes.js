import { v4 as uuidv4 } from "uuid";
import { App } from "../app.js";
import { Polyline, DomEvent, Circle, Rectangle } from "leaflet";
import { PolylineDecorator, PolylineSymbol } from "./libs/leaflet-polylinedecorator.js";

export class MapDrawing {
    
    constructor(map, color, latlngs, uid = null) {
        this.map = map;
        this.color = color;
        this.markersGroup = map.markersGroup;
        this.latlngs = latlngs;
        this.uid = uid || uuidv4();
        this.polyline = null;
        this.createDraw();
        this.polyline.addTo(this.map.activeDrawingGroup);
        this.map.activePolylines.push(this);

        console.debug("Creating new draw with uid", this.uid);
    }

    // Creates the draw on the map
    createDraw() {
        const arrowOptions = {
            color: this.color,
            weight: 3,
            className: "mapArrow",
        };

        this.polyline = new Polyline(this.latlngs, arrowOptions).addTo(this.map.activeDrawingGroup);
        this.polyline.uid = this.uid;

        // Add a contextmenu event listener for deletion
        this.polyline.on("contextmenu", (event) => {
            this.delete();
            DomEvent.preventDefault(event);
            DomEvent.stopPropagation(event);
        });
    }

    finalize(broadcast = true) {

        // Add Item to history
        this.map.history.push(this);
        $(".btn-delete, .btn-undo").show();

        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("Sending new draw with uid", this.uid);
            App.session.ws.send(
                JSON.stringify({
                    type: "ADDING_DRAW",
                    uid: this.uid,
                    latlngs: this.latlngs,
                    color: this.color,
                })
            );
        }
    }

    // Removes the arrow from the map
    delete(broadcast = true) {

        // Broadcast deletion to other clients
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("Deleting new draw with uid", this.uid);
            App.session.ws.send(
                JSON.stringify({
                    type: "DELETE_DRAW",
                    uid: this.uid,
                })
            );
        }

        this.map.activePolylines = this.map.activePolylines.filter(activePolyline => activePolyline !== this);
        this.map.removeLayer(this.polyline);

        // remove from map & history
        this.polyline.removeFrom(this.map.activeDrawingGroup).remove();
        this.map.history = this.map.history.filter(object => object !== this);

        // If that was the last Marker on the map, hide "delete all" buttons
        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo").hide();
    }
}


export class MapArrow {
    
    constructor(map, color, startLatLng, endLatLng, uid = null) {
        this.map = map;
        this.color = color;
        this.markersGroup = map.markersGroup;
        this.startLatLng = startLatLng;
        this.endLatLng = endLatLng;
        this.uid = uid || uuidv4();
        this.polyline = null;
        this.polylineDecorator = null;
        this.arrowPattern = {
            patterns: [{
                offset: "100%",
                repeat: 0,
                symbol: PolylineSymbol.arrowHead({
                    pixelSize: 15,
                    polygon: false,
                    fill: true,
                    yawn: 70,
                    pathOptions: {
                        stroke: true,
                        color: color,
                        weight: 3,
                        fillColor: color,
                        fillOpacity: 1,
                    }
                })
            }]
        };
        this.createArrow();
        this.map.activeArrows.push(this);
        console.debug("Creating new arrow with uid", this.uid);
    }

    // Creates the arrow on the map
    createArrow() {
        const arrowOptions = {
            color: this.color,
            weight: 3,
            className: "mapArrow",
        };

        const latlngs = [this.startLatLng, this.endLatLng];
        this.polyline = new Polyline(latlngs, arrowOptions).addTo(this.map.activeArrowsGroup);
        this.polylineDecorator = new PolylineDecorator(this.polyline, this.arrowPattern).addTo(App.minimap.activeArrowsGroup);
        this.polyline.uid = this.uid;

        // Add a contextmenu event listener for deletion
        this.polyline.on("contextmenu", (event) => {
            this.delete();
            DomEvent.preventDefault(event);
            DomEvent.stopPropagation(event);
        });

        // Add Item to history
        this.map.history.push(this);

        $(".btn-delete, .btn-undo, .btn-download").show();
    }


    // Removes the arrow from the map
    delete(broadcast = true) {

        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("Deleting new arrow with uid", this.uid);
            App.session.ws.send(
                JSON.stringify({
                    type: "DELETE_ARROW",
                    uid: this.uid,
                })
            );
        }

        this.map.activeArrows = this.map.activeArrows.filter(activeArrow => activeArrow !== this);
        this.map.removeLayer(this.polyline);
        this.map.removeLayer(this.polylineDecorator);

        // remove from this.map.activeArrowsGroup
        
        this.polyline.removeFrom(this.map.activeArrowsGroup).remove();
        this.polylineDecorator.removeFrom(this.map.activeArrowsGroup).remove();

        // Remove the marker from targets array history
        this.map.history = this.map.history.filter(object => object !== this);

        // If that was the last Marker on the map, hide "delete all" buttons
        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo, .btn-download").hide();
    }
}


export class MapRectangle {
    
    constructor(map, color, startLatLng, endLatLng, uid = null) {
        this.map = map;
        this.color = color;
        this.markersGroup = map.markersGroup;
        this.startLatLng = startLatLng;
        this.endLatLng = endLatLng;
        this.uid = uid || uuidv4();
        this.rectangle = null;
        this.createRectangle();
        this.map.activeRectangles.push(this);
        console.debug("Creating new rectangle with uid", this.uid);
    }

    // Creates the rectangle on the map
    createRectangle() {
        const bounds = [this.startLatLng, this.endLatLng];
        const rectangleOptions = {
            color: this.color,
            fillOpacity: 0.15,
            weight: 2,
            className: "mapRectangle",
        };

        this.rectangle = new Rectangle(bounds, rectangleOptions).addTo(this.map.activeRectanglesGroup);
        this.rectangle.uid = this.uid;

        // Add a contextmenu event listener for deletion
        this.rectangle.on("contextmenu", (event) => {
            this.delete();
            DomEvent.preventDefault(event);
            DomEvent.stopPropagation(event);
        });

        // Add Item to history
        this.map.history.push(this);

        $(".btn-delete, .btn-undo, .btn-download").show();
    }

    // Removes the rectangle from the map
    delete(broadcast = true) {
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("Deleting rectangle with uid", this.uid);
            App.session.ws.send(
                JSON.stringify({
                    type: "DELETE_RECTANGLE",
                    uid: this.uid,
                })
            );
        }

        this.map.activeRectangles = this.map.activeRectangles.filter(activeRect => activeRect !== this);
        this.map.removeLayer(this.rectangle);
        this.rectangle.removeFrom(this.map.activeRectanglesGroup).remove();

        // Remove from history
        this.map.history = this.map.history.filter(object => object !== this);

        // If no more markers, hide "delete all" buttons
        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo, .btn-download").hide();
    }
}

export class MapCircle {
    constructor(map, color, latLng, radius, uid = null) {
        console.log("MapCircle constructor called with", {map, color, latLng, radius, uid});
        this.map = map;
        this.color = color;
        this.latLng = latLng;
        this.radius = radius;
        this.uid = uid || uuidv4();  // Generate a unique ID if not provided
        this.circle = null;
        this.createCircle();
        this.map.activeCircles.push(this);
        console.debug("Creating new circle with uid", this.uid);
    }

    // Creates the circle on the map
    createCircle() {
        const circleOptions = {
            radius: this.radius,
            color: this.color,
            weight: 2,
            fillColor: this.color,
            fillOpacity: 0.15,
            className: "mapCircle"
        };

        // Create the circle and add it to the map
        this.circle = new Circle(this.latLng, circleOptions).addTo(this.map.activeCirclesGroup);
        this.circle.uid = this.uid;

        // Add a contextmenu event listener for deletion
        this.circle.on("contextmenu", (event) => {
            this.delete();
            DomEvent.preventDefault(event);
            DomEvent.stopPropagation(event);
        });

        // Add Item to history
        this.map.history.push(this);

        $(".btn-delete, .btn-undo").show();
    }

    // Removes the circle from the map
    delete(broadcast = true) {
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            console.debug("Deleting circle with uid", this.uid);
            App.session.ws.send(
                JSON.stringify({
                    type: "DELETE_CIRCLE",
                    uid: this.uid,
                })
            );
        }

        this.map.activeCircles = this.map.activeCircles.filter(activeCircle => activeCircle !== this);
        this.map.removeLayer(this.circle);

        // Remove from this.map.activeCirclesGroup
        this.circle.removeFrom(this.map.activeCirclesGroup).remove();

        // Remove the circle from history
        this.map.history = this.map.history.filter(object => object !== this);

        // If that was the last Circle on the map, hide "delete all" buttons
        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo").hide();
    }
}
