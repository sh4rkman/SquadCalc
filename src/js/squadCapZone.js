import { Circle, LayerGroup, Polygon } from "leaflet";
import polygonClipping from "polygon-clipping";

// Number of points used to draw a round capzone edge
const CAPZONE_ARC_SEGMENTS = 128;

const CZOPACITY = 0;
const CZFILLOPACITY = 0;
const CZCOLOR = "rgb(255, 255, 255)";
const CZWEIGHT = 2;

/**
 * Draws and owns the capture-zone outline(s) for one SquadObjective.
 * A flag can call add() more than once - the randomizer can offer the same
 * flag through several lane candidates, each with its own objects array -
 * every call merges its own shapes into one polygon and adds it to the
 * shared layer group.
 */
export class SquadCapZone {

    constructor(layer) {
        this.layer = layer;
        this.layerGroup = new LayerGroup();
    }


    /**
     * Rotate a point around a center
     * @param {Array} point - [lat, lng] to rotate
     * @param {number} angle - The angle in degrees
     * @param {Array} center - [lat, lng] center of rotation
     * @returns {Array} The rotated [lat, lng]
     */
    _rotatePoint([lat, lng], angle, [centerLat, centerLng]) {
        const radians = (Math.PI / 180) * angle;
        const latDiff = lat - centerLat;
        const lngDiff = lng - centerLng;
        return [
            centerLat + (latDiff * Math.cos(radians) - lngDiff * Math.sin(radians)),
            centerLng + (latDiff * Math.sin(radians) + lngDiff * Math.cos(radians))
        ];
    }


    /**
     * Turn a circle into a polygon so it can be merged with the other shapes
     * @param {Array} center - [lat, lng] center of the circle
     * @param {number} radius - Radius in map units
     * @returns {Array} A ring of [lat, lng]
     */
    _circleRing([lat, lng], radius) {
        const r = Math.abs(radius);
        const ring = [];
        for (let i = 0; i < CAPZONE_ARC_SEGMENTS; i++) {
            const angle = (i / CAPZONE_ARC_SEGMENTS) * 2 * Math.PI;
            ring.push([lat + r * Math.sin(angle), lng + r * Math.cos(angle)]);
        }
        return ring;
    }


    /**
     * Center and radius of a sphere capzone, in map units
     * @param {object} cap - One entry of objective.objects, with isSphere true
     * @returns {{center: Array, radius: number}} center as [lat, lng]
     */
    _sphereGeometry(cap) {
        const SCALE = this.layer.map.gameToMapScale;
        const location_x = -(cap.location_x - this.layer.offset_x) / 100 * -SCALE;
        const location_y = (cap.location_y - this.layer.offset_y) / 100 * -SCALE;
        return { center: [location_y, location_x], radius: cap.sphereRadius / 100 * SCALE };
    }


    /**
     * Build the outlines of one capzone shape
     * @param {object} cap - One entry of objective.objects
     * @returns {Array} Array of rings, each an array of [lat, lng]
     */
    _shapeRings(cap) {
        const SCALE = this.layer.map.gameToMapScale;

        // Capzone is a Sphere
        if (cap.isSphere) {
            const { center, radius } = this._sphereGeometry(cap);
            return [this._circleRing(center, radius)];
        }

        // Capzone location whatever shape it has
        const location_x = -(cap.location_x - this.layer.offset_x) / 100 * -SCALE;
        const location_y = (cap.location_y - this.layer.offset_y) / 100 * -SCALE;

        // Capzone is a Rectangle/Capsule
        if (!cap.isBox && !cap.isCapsule) return [];

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
            rectangleRadiusX = (cap.boxExtent.extent_x / 100) * cap.boxExtent.scaling_x * -SCALE;
            rectangleRadiusY = (cap.boxExtent.extent_y / 100) * cap.boxExtent.scaling_y * -SCALE;
        }
        else {
            rectangleRadiusX = cap.capsuleRadius / 100 * -SCALE;
            rectangleRadiusY = (cap.capsuleLength - cap.capsuleRadius) / 100 * -SCALE;
        }

        const center = [location_y, location_x];
        const lat1 = location_y + rectangleRadiusY;
        const lat2 = location_y - rectangleRadiusY;
        const lng1 = location_x + rectangleRadiusX;
        const lng2 = location_x - rectangleRadiusX;
        const rings = [];

        // A capsule as long as it is wide has no rectangle, only the two circles
        if (rectangleRadiusX !== 0 && rectangleRadiusY !== 0) {
            rings.push(
                [[lat1, lng1], [lat1, lng2], [lat2, lng2], [lat2, lng1]]
                    .map(corner => this._rotatePoint(corner, totalRotation, center))
            );
        }

        // Capsules also get a circle on each end of the rectangle
        if (cap.isCapsule) {
            const capsuleRadius = cap.capsuleRadius / 100 * SCALE;
            // Only rotate the circles if the capsule is not vertical
            const rotation = cap.capsuleLength != cap.capsuleRadius ? totalRotation : 0;

            [lat1, lat2].forEach(lat => {
                const [rotatedLat, rotatedLng] = this._rotatePoint([lat, location_x], rotation, center);
                rings.push(this._circleRing([rotatedLat, rotatedLng], capsuleRadius));
            });
        }

        return rings;
    }


    /**
     * Merge every capzone shape of one objects array into a single outline and draw it
     * @param {Array} caps - The objective.objects array
     */
    add(caps) {
        const CZOPTIONS = {
            color: CZCOLOR,
            opacity: CZOPACITY,
            fillColor: CZCOLOR,
            fillOpacity: CZFILLOPACITY,
            weight: CZWEIGHT,
            // Keep every point, Leaflet's default simplification makes the curves jagged
            smoothFactor: 0,
            className: "capZone"
        };

        // A lone sphere doesn't need tessellating into a polygon and unioning -
        // Leaflet's own Circle draws a true, infinitely smooth arc at any zoom.
        if (caps.length === 1 && caps[0].isSphere) {
            const { center, radius } = this._sphereGeometry(caps[0]);
            const circle = new Circle(center, { radius, ...CZOPTIONS }).addTo(this.layer.activeLayerMarkers);
            this.layerGroup.addLayer(circle);
            return;
        }

        const rings = caps.flatMap(cap => this._shapeRings(cap));
        if (rings.length === 0) return;

        let geometry;

        if (rings.length === 1) {
            geometry = [rings[0]];
        } else {
            try {
                // polygon-clipping repeats the first point at the end, Leaflet does not want it
                geometry = polygonClipping.union(...rings.map(ring => [ring]))
                    .map(polygon => polygon.map(ring => ring.slice(0, -1)));
                if (geometry.length === 0) throw new Error("empty union");
            } catch (error) {
                // If the merge fails, draw the shapes separately like before
                console.warn("[LAYER] capzone union failed, drawing shapes separately", error);
                geometry = rings.map(ring => [ring]);
            }
        }

        const polygon = new Polygon(geometry, {...CZOPTIONS}).addTo(this.layer.activeLayerMarkers);
        this.layerGroup.addLayer(polygon);
    }


    reveal(){
        this.layerGroup.eachLayer((cap) => {
            cap.setStyle({ opacity: 1, fillOpacity: 0.3 });
        });
    }


    hide(){
        this.layerGroup.eachLayer((cap) => {
            cap.setStyle({ opacity: 0, fillOpacity: 0 });
        });
    }
}
