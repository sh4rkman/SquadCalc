import { v4 as uuidv4 } from "uuid";
import { App } from "../app.js";
import { Polyline, DomEvent, Circle, Rectangle } from "leaflet";
import { PolylineDecorator, Symbol } from "./libs/leaflet-polylinedecorator.js";

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
                symbol: Symbol.arrowHead({
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
    }

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

        this.polyline.on("contextmenu", (event) => {
            this.delete();
            DomEvent.preventDefault(event);
            DomEvent.stopPropagation(event);
        });

        this.map.history.push(this);
        $(".btn-delete, .btn-undo, .btn-download").show();
    }

    delete(broadcast = true) {
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(JSON.stringify({ type: "DELETE_ARROW", uid: this.uid }));
        }

        this.map.activeArrows = this.map.activeArrows.filter(activeArrow => activeArrow !== this);
        this.map.removeLayer(this.polyline);
        this.map.removeLayer(this.polylineDecorator);
        this.polyline.removeFrom(this.map.activeArrowsGroup).remove();
        this.polylineDecorator.removeFrom(this.map.activeArrowsGroup).remove();
        this.map.history = this.map.history.filter(object => object !== this);

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
    }

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

        this.rectangle.on("contextmenu", (event) => {
            this.delete();
            DomEvent.preventDefault(event);
            DomEvent.stopPropagation(event);
        });

        this.map.history.push(this);
        $(".btn-delete, .btn-undo, .btn-download").show();
    }

    delete(broadcast = true) {
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(JSON.stringify({ type: "DELETE_RECTANGLE", uid: this.uid }));
        }

        this.map.activeRectangles = this.map.activeRectangles.filter(activeRect => activeRect !== this);
        this.map.removeLayer(this.rectangle);
        this.rectangle.removeFrom(this.map.activeRectanglesGroup).remove();
        this.map.history = this.map.history.filter(object => object !== this);

        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo, .btn-download").hide();
    }
}


export class MapCircle {
    constructor(map, color, latLng, radius, uid = null) {
        this.map = map;
        this.color = color;
        this.latLng = latLng;
        this.radius = radius;
        this.uid = uid || uuidv4();
        this.circle = null;
        this.createCircle();
        this.map.activeCircles.push(this);
    }

    createCircle() {
        const circleOptions = {
            radius: this.radius,
            color: this.color,
            weight: 2,
            fillColor: this.color,
            fillOpacity: 0.15,
            className: "mapCircle"
        };

        this.circle = new Circle(this.latLng, circleOptions).addTo(this.map.activeCirclesGroup);
        this.circle.uid = this.uid;

        this.circle.on("contextmenu", (event) => {
            this.delete();
            DomEvent.preventDefault(event);
            DomEvent.stopPropagation(event);
        });

        this.map.history.push(this);
        $(".btn-delete, .btn-undo, .btn-download").show();
    }

    delete(broadcast = true) {
        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(JSON.stringify({ type: "DELETE_CIRCLE", uid: this.uid }));
        }

        this.map.activeCircles = this.map.activeCircles.filter(activeCircle => activeCircle !== this);
        this.map.removeLayer(this.circle);
        this.circle.removeFrom(this.map.activeCirclesGroup).remove();
        this.map.history = this.map.history.filter(object => object !== this);

        if (!this.map.hasMarkers()) $(".btn-delete, .btn-undo, .btn-download").hide();
    }
}
