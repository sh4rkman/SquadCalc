/*
 * Leaflet-Hexagon
 * A Leaflet plugin that extends Polygon to draw a regular hexagon given a center point and radius.
 * Works fine with CRS.Simple or other linear, non-geographic coordinate systems.
 * 
 * Usage:
 * const hex = new Hexagon({ lat: 50, lng: 34 }, 100, { color: 'red', rotation: 30 }).addTo(map);
 *
 * Parameters:
 *    center: Array[lat, lng] or Object{ lat: number, lng: number }
 *    radius: Number - Distance from the center to any vertex
 *    options: Standard Leaflet Polygon options + rotation in degree
 * 
 * Author: Maxime "sharkman" Boussard
 * License: MIT
 */

import { Polygon, DomEvent, Marker, DivIcon } from "leaflet";
import { App } from "../../app.js";


export class Hexagon extends Polygon {

    static get COLORS() {
        return ["MediumBlue", "firebrick", "white"];
    }

    constructor(center, radius, layer, hexNumber = null, options = {}) {
        const centerArr = Hexagon._validateCenter(center);
        const rot = Hexagon._validateRotation(options.rotation || 0);
        super(Hexagon._buildCoords(centerArr[0], centerArr[1], radius, rot),   {
            ...options,
            className: (options.className || "") + " hexagon-shape"
        });
        this._center = centerArr;
        this._radius = radius;
        this._rotation = rot;
        this._hexNumber = hexNumber;
        this.layer = layer;

        if (this._hexNumber !== null) this._createNumberMarker();

        // determine starting index
        const color = options.color || Hexagon.COLORS[0];
        const idx = Hexagon.COLORS.findIndex(c => c.toLowerCase() === color.toLowerCase());
        this._colorIndex = idx !== -1 ? idx : 0;

        // After setting initial style in constructor
        this.setStyle({
            color: Hexagon.COLORS[this._colorIndex],
            fillColor: Hexagon.COLORS[this._colorIndex],
            fillOpacity: options.fillOpacity ?? 0.2,
            weight: options.weight ?? 1
        });

        // Capture actual applied style for later
        const s = this.options;
        this._originalStyle = {
            color: s.color,
            fillColor: s.fillColor,
            fillOpacity: s.fillOpacity,
            opacity: s.opacity,
            weight: s.weight
        };


        // add click handler
        this.on("contextmenu", (e) => this._cycleColor(e));
        this.on("pointerover", () => { this.setStyle({ fillOpacity: 0.5 }); });
        this.on("pointerout", () => { this.setStyle({ fillOpacity: 0.2 }); });
    }

    static _buildCoords(lat, lng, radius, rotation) {
        const coords = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i + rotation;
            coords.push([
                lat + radius * Math.sin(angle),
                lng + radius * Math.cos(angle)
            ]);
        }
        coords.push(coords[0]);
        return coords;
    }

    static _validateCenter(center) {
        if (!center) {
            throw new Error("Hexagon: center is required — expected [lat, lng] or { lat, lng }");
        }

        const lat = Array.isArray(center) ? center[0] : center.lat;
        const lng = Array.isArray(center) ? center[1] : center.lng;

        if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
            throw new Error("Hexagon: Invalid center — expected numbers in [lat, lng] or { lat, lng }");
        }

        return [lat, lng];
    }

    static _validateRotation(rotation) {
        if (typeof rotation !== "number" || isNaN(rotation)) {
            throw new Error("Hexagon: rotation must be a valid number (degrees)");
        }
        return rotation * Math.PI / 180;
    }

    get COLORS() {
        return Hexagon.COLORS;
    }

    setLatLng(center) {
        this._center = Array.isArray(center) ? center : [center.lat, center.lng];
        const [lat, lng] = this._center;
        const coords = Hexagon._buildCoords(lat, lng, this._radius, this._rotation);
        return this.setLatLngs(coords);
    }

    setRadius(radius) {
        this._radius = radius;
        const [lat, lng] = this._center;
        const coords = Hexagon._buildCoords(lat, lng, radius, this._rotation);
        return this.setLatLngs(coords);
    }

    setRotation(rotationDeg) {
        this._rotation = (rotationDeg || 0) * Math.PI / 180;
        const [lat, lng] = this._center;
        const coords = Hexagon._buildCoords(lat, lng, this._radius, this._rotation);
        return this.setLatLngs(coords);
    }

    getCenter() {
        return { lat: this._center[0], lng: this._center[1] };
    }

    getRadius() {
        return this._radius;
    }

    getRotation() {
        return this._rotation * 180 / Math.PI;
    }

    _cycleColor(e, broadcast = true) {
        if (e) {
            DomEvent.preventDefault(e);
            DomEvent.stopPropagation(e);
        }
        this._colorIndex = (this._colorIndex + 1) % Hexagon.COLORS.length;
        const color = Hexagon.COLORS[this._colorIndex];
        this.setStyle({ color, fillColor: color });

        if (!broadcast) return;
        
        // Update the marker in the session
        if (App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(
                JSON.stringify({
                    type: "UPDATE_HEXAGON",
                    color: this._colorIndex,
                    number: this._hexNumber,
                })
            );
        }
    }

    _createNumberMarker() {
        this._marker = new Marker(this._center, {
            interactive: false,
            icon: new DivIcon({
                className: "hexNumber",
                html: this._hexNumber,
                iconSize: [50, 50],
                iconAnchor: [25, 8]
            })
        }).addTo(this.layer.activeLayerMarkers);
    }

    show() {
        if (this._marker) this._marker.getElement()?.style.setProperty("opacity", "1");
        this.setStyle(this._originalStyle);
        this._visible = true;
    }

    hide() {
        if (this._marker) this._marker.getElement()?.style.setProperty("opacity", "0");
        this.setStyle({ opacity: 0, fillOpacity: 0 });
        this._visible = false;
    }
}