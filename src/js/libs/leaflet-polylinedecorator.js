/**
 * Leaflet PolylineDecorator - Patched for Leaflet 2.0 compatibility
 * Original: https://github.com/bbecquet/Leaflet.PolylineDecorator
 * 
 * This patched version uses Leaflet 2.0 PascalCase constructors
 * and creates standalone classes instead of extending L namespace
 */

import { DomUtil, FeatureGroup, LatLng, LatLngBounds, Marker, Point, Polyline, Polygon, Util } from "leaflet";

// Helper functions
function pointDistance(ptA, ptB) {
    const x = ptB.x - ptA.x;
    const y = ptB.y - ptA.y;
    return Math.sqrt(x * x + y * y);
}

const computeSegmentHeading = (a, b) => {
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90 + 360) % 360;
};

const asRatioToPathLength = ({ value, isInPixels }, totalPathLength) => {
    return isInPixels ? value / totalPathLength : value;
};

function parseRelativeOrAbsoluteValue(value) {
    if (typeof value === "string" && value.indexOf("%") !== -1) {
        return { value: parseFloat(value) / 100, isInPixels: false };
    }
    const parsedValue = value ? parseFloat(value) : 0;
    return { value: parsedValue, isInPixels: parsedValue > 0 };
}

const pointsEqual = (a, b) => a.x === b.x && a.y === b.y;

function pointsToSegments(pts) {
    return pts.reduce((segments, b, idx, points) => {
        if (idx > 0 && !pointsEqual(b, points[idx - 1])) {
            const a = points[idx - 1];
            const distA = segments.length > 0 ? segments[segments.length - 1].distB : 0;
            const distAB = pointDistance(a, b);
            segments.push({
                a, b, distA, distB: distA + distAB,
                heading: computeSegmentHeading(a, b)
            });
        }
        return segments;
    }, []);
}

function interpolateBetweenPoints(ptA, ptB, ratio) {
    if (ptB.x !== ptA.x) {
        return {
            x: ptA.x + ratio * (ptB.x - ptA.x),
            y: ptA.y + ratio * (ptB.y - ptA.y)
        };
    }
    return { x: ptA.x, y: ptA.y + (ptB.y - ptA.y) * ratio };
}

function projectPatternOnPointPath(pts, pattern) {
    const segments = pointsToSegments(pts);
    const nbSegments = segments.length;
    if (nbSegments === 0) return [];

    const totalPathLength = segments[nbSegments - 1].distB;
    const offset = asRatioToPathLength(pattern.offset, totalPathLength);
    const endOffset = asRatioToPathLength(pattern.endOffset, totalPathLength);
    const repeat = asRatioToPathLength(pattern.repeat, totalPathLength);

    const repeatIntervalPixels = totalPathLength * repeat;
    const startOffsetPixels = offset > 0 ? totalPathLength * offset : 0;
    const endOffsetPixels = endOffset > 0 ? totalPathLength * endOffset : 0;

    const positionOffsets = [];
    let positionOffset = startOffsetPixels;
    do {
        positionOffsets.push(positionOffset);
        positionOffset += repeatIntervalPixels;
    } while (repeatIntervalPixels > 0 && positionOffset < totalPathLength - endOffsetPixels);

    let segmentIndex = 0;
    let segment = segments[0];
    return positionOffsets.map(positionOffset => {
        while (positionOffset > segment.distB && segmentIndex < nbSegments - 1) {
            segmentIndex++;
            segment = segments[segmentIndex];
        }
        const segmentRatio = (positionOffset - segment.distA) / (segment.distB - segment.distA);
        return {
            pt: interpolateBetweenPoints(segment.a, segment.b, segmentRatio),
            heading: segment.heading
        };
    });
}


// Rotated Marker support
(function() {
    const proto_initIcon = Marker.prototype._initIcon;
    const proto_setPos = Marker.prototype._setPos;
    const oldIE = (DomUtil.TRANSFORM === "msTransform");

    Marker.addInitHook(function() {
        const iconOptions = this.options.icon && this.options.icon.options;
        const iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
        const anchorStr = iconAnchor ? (iconAnchor[0] + "px " + iconAnchor[1] + "px") : null;
        this.options.rotationOrigin = this.options.rotationOrigin || anchorStr || "center bottom";
        this.options.rotationAngle = this.options.rotationAngle || 0;
        this.on("drag", (e) => e.target._applyRotation());
    });

    Marker.include({
        _initIcon: function() { proto_initIcon.call(this); },
        _setPos: function(pos) {
            proto_setPos.call(this, pos);
            this._applyRotation();
        },
        _applyRotation: function() {
            if (this.options.rotationAngle) {
                this._icon.style[DomUtil.TRANSFORM + "Origin"] = this.options.rotationOrigin;
                if (oldIE) {
                    this._icon.style[DomUtil.TRANSFORM] = "rotate(" + this.options.rotationAngle + "deg)";
                } else {
                    this._icon.style[DomUtil.TRANSFORM] += " rotateZ(" + this.options.rotationAngle + "deg)";
                }
            }
        },
        setRotationAngle: function(angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },
        setRotationOrigin: function(origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
})();


// Symbol namespace - standalone object (not attached to L)
const PolylineSymbol = {};

// ------------------------
// Dash Symbol
// ------------------------
class DashSymbol {
    constructor(options = {}) {
        this.options = {
            pixelSize: 10,
            pathOptions: {},
            ...options
        };
        this.options.pathOptions.clickable = false;
    }

    buildSymbol(dirPoint, latLngs, map) {
        const opts = this.options;
        const d2r = Math.PI / 180;

        if (opts.pixelSize <= 1) {
            return new Polyline([dirPoint.latLng, dirPoint.latLng], opts.pathOptions);
        }

        const midPoint = map.project(dirPoint.latLng);
        const angle = -(dirPoint.heading - 90) * d2r;

        const a = new Point(
            midPoint.x + (opts.pixelSize * Math.cos(angle + Math.PI)) / 2,
            midPoint.y + (opts.pixelSize * Math.sin(angle)) / 2
        );
        const b = midPoint.add(midPoint.subtract(a));

        return new Polyline([map.unproject(a), map.unproject(b)], opts.pathOptions);
    }
}
PolylineSymbol.dash = (options) => new DashSymbol(options);

// ------------------------
// ArrowHead Symbol
// ------------------------
class ArrowHeadSymbol {
    constructor(options = {}) {
        this.options = {
            polygon: true,
            pixelSize: 10,
            headAngle: 60,
            pathOptions: { stroke: false, weight: 2 },
            ...options
        };
        this.options.pathOptions.clickable = false;
    }

    buildSymbol(dirPoint, latLngs, map) {
        const path = this._buildArrowPath(dirPoint, map);
        return this.options.polygon ? new Polygon(path, this.options.pathOptions) : new Polyline(path, this.options.pathOptions);
    }

    _buildArrowPath(dirPoint, map) {
        const d2r = Math.PI / 180;
        const tipPoint = map.project(dirPoint.latLng);
        const direction = -(dirPoint.heading - 90) * d2r;
        const radianArrowAngle = this.options.headAngle / 2 * d2r;
        const headAngle1 = direction + radianArrowAngle;
        const headAngle2 = direction - radianArrowAngle;

        const arrowHead1 = new Point(
            tipPoint.x - this.options.pixelSize * Math.cos(headAngle1),
            tipPoint.y + this.options.pixelSize * Math.sin(headAngle1)
        );
        const arrowHead2 = new Point(
            tipPoint.x - this.options.pixelSize * Math.cos(headAngle2),
            tipPoint.y + this.options.pixelSize * Math.sin(headAngle2)
        );

        return [map.unproject(arrowHead1), dirPoint.latLng, map.unproject(arrowHead2)];
    }
}
PolylineSymbol.arrowHead = (options) => new ArrowHeadSymbol(options);

// ------------------------
// Marker Symbol
// ------------------------
class MarkerSymbol {
    constructor(options = {}) {
        this.options = {
            markerOptions: {},
            rotate: false,
            ...options
        };
        this.options.markerOptions.clickable = false;
        this.options.markerOptions.draggable = false;
    }

    buildSymbol(directionPoint) {
        if (this.options.rotate) {
            this.options.markerOptions.rotationAngle =
                directionPoint.heading + (this.options.angleCorrection || 0);
        }
        return new Marker(directionPoint.latLng, this.options.markerOptions);
    }
}
PolylineSymbol.marker = (options) => new MarkerSymbol(options);


// Coordinate helpers
const isCoord = (c) => c instanceof LatLng || 
    (Array.isArray(c) && c.length === 2 && typeof c[0] === "number");
const isCoordArray = (ll) => Array.isArray(ll) && isCoord(ll[0]);


// PolylineDecorator - standalone class (not attached to L)
const PolylineDecorator = FeatureGroup.extend({
    options: { patterns: [] },

    initialize: function(paths, options) {
        FeatureGroup.prototype.initialize.call(this);
        Util.setOptions(this, options);
        this._map = null;
        this._paths = this._initPaths(paths);
        this._bounds = this._initBounds();
        this._patterns = this._initPatterns(this.options.patterns);
    },

    _initPaths: function(input, isPolygon) {
        if (isCoordArray(input)) {
            const coords = isPolygon ? input.concat([input[0]]) : input;
            return [coords];
        }
        if (input instanceof Polyline) {
            return this._initPaths(input.getLatLngs(), input instanceof Polygon);
        }
        if (Array.isArray(input)) {
            return input.reduce((flatArray, p) => 
                flatArray.concat(this._initPaths(p, isPolygon)), []);
        }
        return [];
    },

    _initPatterns: function(patternDefs) {
        return patternDefs.map(this._parsePatternDef);
    },

    setPatterns: function(patterns) {
        this.options.patterns = patterns;
        this._patterns = this._initPatterns(this.options.patterns);
        this.redraw();
    },

    setPaths: function(paths) {
        this._paths = this._initPaths(paths);
        this._bounds = this._initBounds();
        this.redraw();
    },

    _parsePatternDef: function(patternDef) {
        return {
            symbolFactory: patternDef.symbol,
            offset: parseRelativeOrAbsoluteValue(patternDef.offset),
            endOffset: parseRelativeOrAbsoluteValue(patternDef.endOffset),
            repeat: parseRelativeOrAbsoluteValue(patternDef.repeat)
        };
    },

    onAdd: function(map) {
        this._map = map;
        this._draw();
        this._map.on("moveend", this.redraw, this);
    },

    onRemove: function(map) {
        this._map.off("moveend", this.redraw, this);
        this._map = null;
        FeatureGroup.prototype.onRemove.call(this, map);
    },

    _initBounds: function() {
        const allPathCoords = this._paths.reduce((acc, path) => acc.concat(path), []);
        return new LatLngBounds(allPathCoords);
    },

    getBounds: function() { return this._bounds; },

    _buildSymbols: function(latLngs, symbolFactory, directionPoints) {
        return directionPoints.map((directionPoint, i) => {
            return symbolFactory.buildSymbol(
                directionPoint, latLngs, this._map, i, directionPoints.length
            );
        });
    },

    _getDirectionPoints: function(latLngs, pattern) {
        if (latLngs.length < 2) return [];
        const pathAsPoints = latLngs.map(latLng => this._map.project(latLng));
        return projectPatternOnPointPath(pathAsPoints, pattern).map(point => ({
            latLng: this._map.unproject(new Point(point.pt.x, point.pt.y)),
            heading: point.heading
        }));
    },

    redraw: function() {
        if (!this._map) return;
        this.clearLayers();
        this._draw();
    },

    _getPatternLayers: function(pattern) {
        const mapBounds = this._map.getBounds().pad(0.1);
        return this._paths.map(path => {
            const directionPoints = this._getDirectionPoints(path, pattern)
                .filter(point => mapBounds.contains(point.latLng));
            return new FeatureGroup(
                this._buildSymbols(path, pattern.symbolFactory, directionPoints)
            );
        });
    },

    _draw: function() {
        this._patterns.map(pattern => this._getPatternLayers(pattern))
            .forEach(layers => this.addLayer(new FeatureGroup(layers)));
    }
});

// Factory function
const polylineDecorator = (paths, options) => new PolylineDecorator(paths, options);

// Export for ES modules
export { PolylineDecorator, polylineDecorator, PolylineSymbol };
export default { PolylineDecorator, polylineDecorator, PolylineSymbol };