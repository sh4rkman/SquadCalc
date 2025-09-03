/**
 * Copyright 2014 JD Fergason
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Slightly patched by Maxime "sharkman" Boussard : Leaflet 2.0 compatibility
 * 
 */

import { Path, Canvas, SVG, Util, Point, Bounds } from "leaflet";

const Ellipse = Path.extend({
    options: {
        fill: true,
        startAngle: 0,
        endAngle: 359.9
    },

    initialize(latlng, radii, tilt, options) {
        Util.setOptions(this, options);
        this._latlng = latlng;

        if (tilt) {
            this._tiltDeg = tilt;
        } else {
            this._tiltDeg = 0;
        }

        if (radii) {
            this._mRadiusX = radii[0];
            this._mRadiusY = radii[1];
        }
    },

    setRadius(radii) {
        this._mRadiusX = radii[0];
        this._mRadiusY = radii[1];
        return this.redraw();
    },

    getRadius() {
        return new Point(this._mRadiusX, this._mRadiusY);
    },

    setTilt(tilt) {
        this._tiltDeg = tilt;
        return this.redraw();
    },

    getBounds() {
        const lngRadius = this._getLngRadius();
        const latRadius = this._getLatRadius();
        const latlng = this._latlng;

        return [
            [latlng.lat - latRadius, latlng.lng - lngRadius],
            [latlng.lat + latRadius, latlng.lng + lngRadius]
        ];
    },

    // @method setLatLng(latLng: LatLng): this
    // Sets the position of a circle marker to a new location.
    setLatLng(latlng) {
        this._latlng = latlng;
        this.redraw();
        return this.fire("move", {latlng: this._latlng});
    },

    // @method getLatLng(): LatLng
    // Returns the current geographical position of the circle marker
    getLatLng() {
        return this._latlng;
    },

    setStyle: Path.prototype.setStyle,

    _project() {
        const lngRadius = this._getLngRadius();
        const latRadius = this._getLatRadius();
        const latlng = this._latlng;
        const pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);
        const pointBelow = this._map.latLngToLayerPoint([latlng.lat - latRadius, latlng.lng]);

        this._point = this._map.latLngToLayerPoint(latlng);
        this._radiusX = Math.max(this._point.x - pointLeft.x, 1);
        this._radiusY = Math.max(pointBelow.y - this._point.y, 1);
        this._tilt = Math.PI * this._tiltDeg / 180;
        this._endPointParams = this._centerPointToEndPoint();
        this._updateBounds();
    },

    _updateBounds() {
        // http://math.stackexchange.com/questions/91132/how-to-get-the-limits-of-rotated-ellipse
        const sin = Math.sin(this._tilt);
        const cos = Math.cos(this._tilt);
        const sinSquare = sin * sin;
        const cosSquare = cos * cos;
        const aSquare = this._radiusX * this._radiusX;
        const bSquare = this._radiusY * this._radiusY;
        const halfWidth = Math.sqrt(aSquare*cosSquare+bSquare*sinSquare);
        const halfHeight = Math.sqrt(aSquare*sinSquare+bSquare*cosSquare);
        const w = this._clickTolerance();
        const p = [halfWidth + w, halfHeight + w];
        this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
    },

    _update() {
        if (this._map) {
            this._updatePath();
        }
    },

    _updatePath() {
        this._renderer._updateEllipse(this);
    },

    _getLatRadius() {
        return this._mRadiusY;
    },

    _getLngRadius() {
        return this._mRadiusX;
    },

    _centerPointToEndPoint() {
        // Convert between center point parameterization of an ellipse
        // too SVG's end-point and sweep parameters.  This is an
        // adaptation of the perl code found here:
        // http://commons.oreilly.com/wiki/index.php/SVG_Essentials/Paths
        const c = this._point;
        const rx = this._radiusX;
        const ry = this._radiusY;
        const theta2 = (this.options.startAngle + this.options.endAngle) * (Math.PI / 180);
        const theta1 = this.options.startAngle * (Math.PI / 180);
        const delta = this.options.endAngle;
        const phi = this._tiltDeg * (Math.PI / 180);

        // Determine start and end-point coordinates
        const x0 = c.x + Math.cos(phi) * rx * Math.cos(theta1) +
            Math.sin(-phi) * ry * Math.sin(theta1);
        const y0 = c.y + Math.sin(phi) * rx * Math.cos(theta1) +
            Math.cos(phi) * ry * Math.sin(theta1);

        const x1 = c.x + Math.cos(phi) * rx * Math.cos(theta2) +
            Math.sin(-phi) * ry * Math.sin(theta2);
        const y1 = c.y + Math.sin(phi) * rx * Math.cos(theta2) +
            Math.cos(phi) * ry * Math.sin(theta2);

        const largeArc = (delta > 180) ? 1 : 0;
        const sweep = (delta > 0) ? 1 : 0;

        return {x0, y0, tilt: phi, largeArc, sweep, x1, y1};
    },

    _empty() {
        return this._radiusX && this._radiusY && !this._renderer._bounds.intersects(this._pxBounds);
    },

    _containsPoint(p) {
        // http://stackoverflow.com/questions/7946187/point-and-ellipse-rotated-position-test-algorithm
        const sin = Math.sin(this._tilt);
        const cos = Math.cos(this._tilt);
        const dx = p.x - this._point.x;
        const dy = p.y - this._point.y;
        const sumA = cos * dx + sin * dy;
        const sumB = sin * dx - cos * dy;
        return sumA * sumA / (this._radiusX * this._radiusX)  + sumB * sumB / (this._radiusY * this._radiusY) <= 1;
    }
});

// Extend SVG renderer
SVG.include({
    _updateEllipse(layer) {
        const rx = layer._radiusX;
        const ry = layer._radiusY;
        const phi = layer._tiltDeg;
        const endPoint = layer._endPointParams;

        const d = `M${endPoint.x0},${endPoint.y0}A${rx},${ry},${phi},${endPoint.largeArc},${endPoint.sweep},${endPoint.x1},${endPoint.y1} z`;
        this._setPath(layer, d);
    }
});

// Extend Canvas renderer
Canvas.include({
    _updateEllipse(layer) {
        if (layer._empty()) { return; }

        const p = layer._point;
        const ctx = this._ctx;
        const r = layer._radiusX;
        const s = (layer._radiusY || r) / r;

        this._drawnLayers[layer._leaflet_id] = layer;

        ctx.save();

        ctx.translate(p.x, p.y);
        if (layer._tilt !== 0) {
            ctx.rotate(layer._tilt);
        }
        if (s !== 1) {
            ctx.scale(1, s);
        }

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.restore();

        this._fillStroke(ctx, layer);
    }
});

// Export the Ellipse class
export { Ellipse };

// Default export
export default Ellipse;