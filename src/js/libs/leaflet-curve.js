/*
 * Leaflet.curve - SVG path (M/L/C/Q/Z) rendering for Leaflet 2.x
 * Ported from elfalem/Leaflet.curve (MIT) to ESM / Leaflet 2 class API.
 *
 * Usage:
 * new Curve(["M", [lat,lng], "C", [lat,lng], [lat,lng], [lat,lng], "Z"], options).addTo(map);
 *
 * path is an array mixing SVG command strings ("M","L","C","Q","Z") with
 * [lat,lng] coordinate pairs consumed by the preceding command.
 */

import { Path, LatLngBounds, LatLng, Util } from "leaflet";

export class Curve extends Path {

    // Leaflet 2 layers init via initialize(), not a real ES constructor
    // (Class.constructor calls Util.setOptions(this) with no args, so
    // options passed to a plain `constructor()` override here are dropped).
    initialize(path, options) {
        Util.setOptions(this, options);
        this._setPath(path);
    }

    getPath() {
        return this._coords;
    }

    setPath(path) {
        this._setPath(path);
        return this.redraw();
    }

    getBounds() {
        return this._bounds;
    }

    getCenter() {
        return this._bounds.getCenter();
    }

    _setPath(path) {
        this._coords = path;
        this._bounds = this._computeBounds();
    }

    _computeBounds() {
        const bounds = new LatLngBounds();
        this._coords.forEach((coord) => {
            if (typeof coord !== "string") bounds.extend(new LatLng(coord[0], coord[1]));
        });
        return bounds;
    }

    _project() {
        this._points = [];
        for (const coord of this._coords) {
            this._points.push(typeof coord === "string" ? coord : this._map.latLngToLayerPoint(coord));
        }
    }

    _update() {
        if (!this._map) return;
        this._renderer._setPath(this, this._pointsToPath());
    }

    _pointsToPath() {
        let str = "";
        for (const point of this._points) {
            str += typeof point === "string" ? point : `${point.x},${point.y} `;
        }
        return str || "M0 0";
    }
}

export function curve(path, options) {
    return new Curve(path, options);
}
