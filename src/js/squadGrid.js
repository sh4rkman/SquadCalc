/**
 *  OrigineFile: L.SimpleGraticule.js
 *  Desc: A graticule for Leaflet maps in the L.CRS.Simple coordinate system.
 *  Auth: Andrew Blakey (ablakey@gmail.com)
 * 
 *  Adapted to Squad by Robert "Endebert" Ende (https://github.com/Endebert/squadmc)
 *  slighty edited by Maxime "sharkman" Boussard for squadcalc
 */

import {
    LayerGroup, Util, Polyline, Marker, DivIcon, LatLngBounds
} from "leaflet";


/**
 * This Layergroup displays the grid in the same way it is displayed in-game.
 * SquadGrid was originally based on SimpleGraticule, but underwent massive changes.
 * See https://github.com/ablakey/Leaflet.SimpleGraticule for more information.
 *
 * @type {LayerGroup} - squadGrid layer object
 */
export default LayerGroup.extend({
    // grid line arrays for each (sub-)keypad
    kpLines: [],
    s1Lines: [],
    s2Lines: [],

    // Polyline styles & options
    lineStyleKP: {
        stroke: true,
        color: "#000",
        opacity: 1,
        weight: 1,
        interactive: false,
        clickable: false,
        zIndex: 202,
    },

    lineStyleSUB1: {
        stroke: true,
        color: "#000",
        opacity: 0.5,
        weight: 2,
        interactive: false,
        clickable: false,
        zIndex: 201,
    },

    lineStyleSUB2: {
        stroke: true,
        color: "#fff",
        opacity: 0,
        weight: 0.8,
        interactive: false,
        clickable: false,
        zIndex: 200,
    },

    initialize(map, options) {
        LayerGroup.prototype.initialize.call(this);
        Util.setOptions(this, options);
        this.map = map;
        this.opacity = options?.opacity ?? 0.8;
    },

    clearLines() {
        this.eachLayer(this.removeLayer, this);
    },

    /**
   * Set bounds for grid, to limit it on the map
   * @param {LatLngBounds} bounds
   */
    setBounds(bounds) {
        this.bounds = new LatLngBounds(bounds[0], bounds[1]);
        if (this.map) {
            this.redraw();
            this.updateLineOpacity();
        }
    },

    onAdd(map) {
        this.map = map;
        map.on("zoomend", this.updateLineOpacity, this);
        this.redraw();
        this.updateLineOpacity();
    },

    onRemove(map) {
        // remove listener for view change
        map.off("zoomend", this.updateLineOpacity, this);
        this.clearLines();
    },


    setOpacity(opacity) {
        this.opacity = opacity;
        this.updateLineOpacity();
    },


    /**
   * Sets opacity of subgrid lines based on zoom level.
   */
    updateLineOpacity() {

        if (!this.map) return;

        const currentZoom = Math.round(this.map.getZoom());
        const mapZoomPadding = this.map.activeMap.size / 4000;

        if (currentZoom >= 3.7 + mapZoomPadding) {
            this.setLinesWeight(this.kpLines, 3.5 * this.opacity);
            this.setLinesOpacity(this.s1Lines, 1 * this.opacity);
            this.setLinesWeight(this.s1Lines, 1.7 * this.opacity);
            this.setLinesOpacity(this.s2Lines, 1 * this.opacity);
            this.setLinesWeight(this.s2Lines, 1 * this.opacity);
        }
        else if (currentZoom >= 2 + mapZoomPadding) {
            this.setLinesWeight(this.kpLines, 2.5 * this.opacity);
            this.setLinesOpacity(this.kpLines, 1 * this.opacity);
            this.setLinesOpacity(this.s1Lines, 0.6 * this.opacity);
            this.setLinesOpacity(this.s2Lines, 0);
        } 
        else {
            this.setLinesWeight(this.kpLines, 1.5 * this.opacity);
            this.setLinesOpacity(this.kpLines, 1 * this.opacity);
            this.setLinesOpacity(this.s1Lines, 0);
            this.setLinesOpacity(this.s2Lines, 0);
        }
    },

    /**
    * Updates the opacity for all lines in the lines array to the desired opacity value.
    * @param {Array} lines - array of lines to update
    * @param {Number} opacity - desired opacity value
    */
    setLinesOpacity(lines, opacity = 0.5) {
        // we check only the first object as we are updating all at the same time
        if (lines.length === 0 || lines[0].options.opacity === opacity) return;

        lines.forEach((line) => {
            line.setStyle({ opacity });
        });
    },


    /**
    * Updates the weight for all lines in the lines array to the desired weight value.
    * @param {Array} lines - array of lines to update
    * @param {Number} weight - desired weight value
    */
    setLinesWeight(lines, weight = 1) {
        // we check only the first object as we are updating all at the same time
        if (lines.length === 0 || lines[0].options.weight === weight) return;

        lines.forEach((line) => {
            line.setStyle({ weight });
        });
    },

    /**
    * Redraws the grid inside the current view bounds.
    */
    redraw() {
        
        if (!this.bounds) return;
        
        // clear old grid lines
        this.clearLines();

        // Define and scale line's intervals
        // This handle rectangle map stretched into a rectangle
        const kpX = (300 / 3 ** 0) * this.map.gameToMapScale;
        const s1X = (300 / 3 ** 1) * this.map.gameToMapScale;
        const s2X = (300 / 3 ** 2) * this.map.gameToMapScale;

        const kpY = (300 / 3 ** 0) * this.map.gameToMapScaleY;
        const s1Y = (300 / 3 ** 1) * this.map.gameToMapScaleY;
        const s2Y = (300 / 3 ** 2) * this.map.gameToMapScaleY;

        // for complete grid drawing we take lowest interval, as we want to draw all lines
        // whether or not they will be seen is dependant on another function setting
        // opacity based on zoom level
        const intervalX = s2X;
        const intervalY = s2Y;

        // clearing arrays
        this.kpLines = [];
        this.s1Lines = [];
        this.s2Lines = [];
        this.labels = [];
        
        // vertical keypad lines
        // Going east +1 to make it through floating point imprecision
        const startX = this.bounds.getWest();
        const endX = this.bounds.getEast();

        for (let x = startX, z = 0; x <= endX; x += intervalX) {
            const bot = {lat: this.bounds.getSouth(), lng: x};
            const top = {lat: this.bounds.getNorth(), lng: x};

            // checking which style to use for the current line
            // style is decided by whether or not current line is multiple of which (sub-) keypad interval
            // basically, main style if multiple of 300, sub1 style if multiple of 100,
            // sub2 if multiple of 33
            // we use if-else so that we don't draw lines over each other
            if (this.isMultiple(kpX, x)) {
                this.kpLines.push(new Polyline([bot, top], this.lineStyleKP));

                // Create
                let top2 = {lat: this.bounds.getNorth(), lng: x-(kpX/2)};

                if (x != 0) {
                    this.labels.push(new Marker(top2, {
                        interactive: false,
                        icon: new DivIcon({
                            className: "gridText",
                            html: (z + 9).toString(36).toUpperCase(),
                            iconSize: [20, 20],
                            iconAnchor: [10, 20]
                        })
                    }));
                }

                z += 1;

            } else if (this.isMultiple(s1X, x)) {
                this.s1Lines.push(new Polyline([bot, top], this.lineStyleSUB1));
            } else if (this.isMultiple(s2X, x)) {
                this.s2Lines.push(new Polyline([bot, top], this.lineStyleSUB2));
            } else {
                console.warn(`no match! x = ${x}; x%:`, [x % kpX, x % s1X, x % s2X]); // this should never happen
            }
        }

        // horizontal keypad lines, almost the same as for vertical lines
        // Going South +1 to make it through floating point imprecision
        const startY = this.bounds.getNorth();
        const endY = this.bounds.getSouth();

        for (let y = startY, z = 0; y >= endY; y -= intervalY) {
            const left = {lat: y, lng: this.bounds.getWest()};
            const right = {lat: y, lng: this.bounds.getEast()};


            if (this.isMultiple(kpY, y)) {
                let textPos = {lat: y+(kpY/2), lng: this.bounds.getWest()};
                this.kpLines.push(new Polyline([left, right], this.lineStyleKP));

                if (y!=0){ // skip first label
                    this.labels.push(new Marker(textPos, {
                        interactive: false,
                        icon: new DivIcon({
                            className: "gridText",
                            html: z,
                            iconSize: [20, 20],
                            iconAnchor: [20, 10]
                        })
                    }));
                }
                z+=1;

            } else if (this.isMultiple(s1Y, y)) {
                this.s1Lines.push(new Polyline([left, right], this.lineStyleSUB1));
            } else if (this.isMultiple(s2Y, y)) {
                this.s2Lines.push(new Polyline([left, right], this.lineStyleSUB2));
            } else {
                console.warn(`no match! y = ${y}; y%:`, [y % kpX, y % s1X, y % s2X]);
            }
        }


        // Draw lines from smallest to largest so bigger lines are drawn over smaller ones
        this.s2Lines.forEach(this.addLayer, this);
        this.s1Lines.forEach(this.addLayer, this);
        this.kpLines.forEach(this.addLayer, this);
        this.labels.forEach(this.addLayer, this);

        // Make label unfocusable with tab to avoid users panning the map while alt-tabbing
        for (const element of document.querySelectorAll(".gridText")) element.setAttribute("tabindex", "-1");
    },
    
    /**
     * Returns true if 'a' is a multiple of 'b' with a precision up to 4 decimals
     * @param a
     * @param b
     * @returns {boolean} true if 'a' is a multiple of 'b', false otherwise              
     */
    isMultiple(a, b) {
        const t = b / a;
        const r = Math.round(t);
        const d = t >= r ? t - r : r - t;
        return d < 0.0001;
    }
});
