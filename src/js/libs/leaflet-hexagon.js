/*
 * Leaflet-Hexagon
 * A Leaflet plugin that extends Polygon to draw a regular hexagon given a center point and radius.
 * Works fine with CRS.Simple or other linear, non-geographic coordinate systems.
 * 
 * Usage:
 * const hex = new Hexagon({ lat: 50, lng: 34 }, 100, { color: 'red' }).addTo(map);
 *
 * Parameters:
 *    center: Array[lat, lng] or Object{ lat: number, lng: number }
 *    radius: Number - Distance from the center to any vertex
 *    options: Standard Leaflet Polygon options (color, weight, fillColor, etc.)
 *        + rotation: Number in degrees to rotate the hexagon around its center
 * 
 * Author: Maxime "sharkman" Boussard for https://github.com/sh4rkman/SquadCalc
 * License: MIT
 */

import { Polygon } from "leaflet";

export class Hexagon extends Polygon {
    constructor(center, radius, options = {}) {
        const lat = Array.isArray(center) ? center[0] : center.lat;
        const lng = Array.isArray(center) ? center[1] : center.lng;

        const rotation = (options.rotation || 0) * Math.PI / 180;

        const coords = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i + rotation;
            coords.push([
                lat + radius * Math.sin(angle),
                lng + radius * Math.cos(angle)
            ]);
        }
        coords.push(coords[0]);

        super(coords, options);
    }
}

// Factory function for consistency
export const hexagon = (center, radius, options) => new Hexagon(center, radius, options);