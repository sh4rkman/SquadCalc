/**
 *  OrigineFile: L.SimpleGraticule.js
 *  Desc: A graticule for Leaflet maps in the L.CRS.Simple coordinate system.
 *  Auth: Andrew Blakey (ablakey@gmail.com)
 * 
 *  Adapted to Squad by Robert "Endebert" Ende (https://github.com/Endebert/squadmc)
 *  slighty edited by Maxime "sharkman" Boussard for squadcalc
 */

import {
    LayerGroup, Util, LatLng, Polyline, Marker, DivIcon
} from "leaflet";

import { isMultiple } from "./utils";

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
    },

    lineStyleSUB1: {
        stroke: true,
        color: "#000",
        opacity: 0.5,
        weight: 2,
        interactive: false,
        clickable: false,
    },

    lineStyleSUB2: {
        stroke: true,
        color: "#fff",
        opacity: 0,
        weight: 0.8,
        interactive: false,
        clickable: false,
    },

    initialize(map, options) {
        LayerGroup.prototype.initialize.call(this);
        Util.setOptions(this, options);
        this.map = map;
    },

    clearLines() {
        this.eachLayer(this.removeLayer, this);
    },

    /**
   * Set bounds for grid, to limit it on the map
   * @param {LatLngBounds} bounds
   */
    setBounds(bounds) {
        this.bounds = bounds;
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

    /**
   * Sets opacity of subgrid lines based on zoom level.
   */
    updateLineOpacity() {
        if (!this.map) {
            return;
        }
        const currentZoom = Math.round(this.map.getZoom());

        if (currentZoom >= 6) {
            this.setLinesOpacity(this.s2Lines, 0.6);
        } else if (currentZoom >= 5) {
            this.setLinesOpacity(this.s1Lines, 0.3);
            this.setLinesOpacity(this.s2Lines, 0.6);
        }
        else if (currentZoom >= 4) {
            this.setLinesWeight(this.kpLines, 2);
            this.setLinesOpacity(this.kpLines, 1);
            this.setLinesOpacity(this.s1Lines, 0.3);
            this.setLinesOpacity(this.s2Lines, 0);
        } 
        else if (currentZoom >= 2){
            this.setLinesWeight(this.kpLines, 0.7);
            this.setLinesOpacity(this.kpLines, 1);
            this.setLinesOpacity(this.s1Lines, 0);
            this.setLinesOpacity(this.s2Lines, 0);
        }
        else {
            this.setLinesWeight(this.kpLines, 0.5);
            this.setLinesOpacity(this.kpLines, 1);
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
    // and this one check might save us iterating through the whole array
        if (lines.length === 0 || lines[0].options.opacity === opacity) {
            return;
        } 
        else {
            lines.forEach((l) => {
                l.setStyle({
                    opacity,
                });
            });
        }
    },


    /**
   * Updates the weight for all lines in the lines array to the desired weight value.
   * @param {Array} lines - array of lines to update
   * @param {Number} weight - desired weight value
   */
    setLinesWeight(lines, weight = 1) {
        // we check only the first object as we are updating all at the same time
        // and this one check might save us iterating through the whole array
        if (lines.length === 0) {
            return;
        } 
        else {
            lines.forEach((l) => {
                l.setStyle({
                    weight,
                });
            });
        }
    },

    /**
   * Redraws the grid inside the current view bounds.
   */
    redraw() {
        
        if (!this.bounds) {
            console.debug("no viewbounds, skipping draw");
            return;
        }
        // clear old grid lines
        this.clearLines();

        // Define and scale line's intervals
        const kp = (300 / 3 ** 0) * this.map.gameToMapScale;
        const s1 = (300 / 3 ** 1) * this.map.gameToMapScale;
        const s2 = (300 / 3 ** 2) * this.map.gameToMapScale;

        // for complete grid drawing we take lowest interval, as we want to draw all lines
        // whether or not they will be seen is dependant on another function setting
        // opacity based on zoom level
        const interval = s2;

        // clearing arrays
        this.kpLines = [];
        this.s1Lines = [];
        this.s2Lines = [];
        this.labels = [];
        

        // vertical keypad lines
        // doing some magic against floating point imprecision
        const startX = this.bounds.getWest();
        const endX = this.bounds.getEast();

        for (let x = startX, z = 0; x <= endX; x += interval) {
            const bot = new LatLng(this.bounds.getSouth(), x);
            const top = new LatLng(this.bounds.getNorth(), x);

            // checking which style to use for the current line
            // style is decided by whether or not current line is multiple of which (sub-) keypad interval
            // basically, main style if multiple of 300, sub1 style if multiple of 100,
            // sub2 if multiple of 33
            // we use if-else so that we don't draw lines over each other
            if (isMultiple(kp, x)) {
                this.kpLines.push(new Polyline([bot, top], this.lineStyleKP));

                // Create
                let top2 = new LatLng(this.bounds.getNorth(), x-(kp/2));

                if (x!=0) {
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

            } else if (isMultiple(s1, x)) {
                this.s1Lines.push(new Polyline([bot, top], this.lineStyleSUB1));
            } else if (isMultiple(s2, x)) {
                this.s2Lines.push(new Polyline([bot, top], this.lineStyleSUB2));
            } else {
                console.warn(`no match! x = ${x}; x%:`, [x % kp, x % s1, x % s2]); // this should never happen
            }
        }

        // horizontal keypad lines, almost the same as for vertical lines
        const startY = Math.ceil(this.bounds.getNorth() / interval) * interval;
        const endY = Math.floor(this.bounds.getSouth() / interval) * interval;

        for (let y = startY, z = 0; y >= endY; y -= interval) {
            const left = new LatLng(y, this.bounds.getWest());
            const right = new LatLng(y, this.bounds.getEast());


            if (isMultiple(kp, y)) {
                let textPos = new LatLng(y+(kp/2), this.bounds.getWest());
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

            } else if (isMultiple(s1, y)) {
                this.s1Lines.push(new Polyline([left, right], this.lineStyleSUB1));
            } else if (isMultiple(s2, y)) {
                this.s2Lines.push(new Polyline([left, right], this.lineStyleSUB2));
            } else {
                console.warn(`no match! y = ${y}; y%:`, [y % kp, y % s1, y % s2]);
            }
        }



        // Add line and labels
        this.kpLines.forEach(this.addLayer, this);
        this.s1Lines.forEach(this.addLayer, this);
        this.s2Lines.forEach(this.addLayer, this);
        this.labels.forEach(this.addLayer, this);

        // Make label unfocusable with tab to avoid users panning the map while alt-tabbing
        for (let i = 0; i < document.querySelectorAll(".gridText").length; ++i) {
            document.querySelectorAll(".gridText")[i].setAttribute("tabindex", "-1");
        }
    },
});
