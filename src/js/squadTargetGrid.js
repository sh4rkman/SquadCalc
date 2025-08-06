import { App } from "../app.js";
import { Polyline, LayerGroup } from "leaflet";

export default class TargetGrid {
    
    static get ANGLE_DEV() { return 12; }
    static get ANGLE_STEP() { return 2; }
    static get lineOptions() { return { color: "Lime", weight: 2, opacity: 0.7 }; }

    constructor(map, firingSolution) {
        this.map = map;
        this.firingSolution = firingSolution;
        this.elevation = App.minimap.activeWeaponsMarkers.getLayers()[0].angleType === "high" ? firingSolution.elevation.high.mil : firingSolution.elevation.low.mil;
        this.linesGroup = new LayerGroup();

        // Weapon in degree have 6*1 deg elevation lines, others hav 5*10 miliradians
        if (this.firingSolution.activeWeapon.unit === "deg") {
            this.ELEVATION_DEVIATION = this.firingSolution.degToMil(1) * 6;
            this.ELEVATION_STEP = this.firingSolution.degToMil(1);
        } else {
            this.ELEVATION_DEVIATION = 60;
            this.ELEVATION_STEP = 10;
        }

        if (App.userSettings.targetGrid) {
            this.build();
            this.show();
        }
    }


    /**
     * Builds the arc and segment grid around the mortar based on current elevation.
     * 
     * This function corrects for the known imprecision in range inversion (used for grid spacing),
     * especially when elevation or height differences skew the result. It does so by:
     * 
     * 1. Computing the actual distance using full quadratic projectile motion (with heightDiff).
     * 2. Comparing it with the distance returned from a simpler inverse method.
     * 3. Averaging the difference and applying it to all arc radii to maintain consistency.
     * 
     * @return {number|undefined} Minimum ground distance, or nothing if computation failed.
     */
    build() {

        // Fix the reverse distance methode by finding an average delta value to apply
        const REVERSEDIST = this.firingSolution.getProjectileDistance(this.firingSolution.milToDeg(this.elevation));
        const QUADRATICDIST = this.firingSolution.distance;
        const AVGDELTA = QUADRATICDIST - REVERSEDIST;
        const BASEANGLE = this.firingSolution.bearing - 90; // face north
        const weaponLatLng = this.map.activeWeaponsMarkers.getLayers()[0].getLatLng();

        const startRadius = (this.firingSolution.getProjectileDistance(this.firingSolution.milToDeg(this.elevation - this.ELEVATION_DEVIATION/2)) + AVGDELTA) * this.map.gameToMapScale;
        const endRadius = (this.firingSolution.getProjectileDistance(this.firingSolution.milToDeg(this.elevation + this.ELEVATION_DEVIATION/2)) + AVGDELTA) * this.map.gameToMapScale;
        if (isNaN(startRadius) || isNaN(endRadius)) return;

        // Start drawing the horizontal arcs
        for (let i = this.elevation - this.ELEVATION_DEVIATION/2; i <= this.elevation + this.ELEVATION_DEVIATION/2 + 1; i = i+ this.ELEVATION_STEP) {
            let aproxDist = this.firingSolution.getProjectileDistance(this.firingSolution.milToDeg(i));
            let finalDist = (aproxDist + AVGDELTA) * this.map.gameToMapScale;
            this.linesGroup.addLayer(this.drawArc(weaponLatLng, BASEANGLE, -TargetGrid.ANGLE_DEV/2, TargetGrid.ANGLE_DEV/2, finalDist));
        }

        // Start drawing vertical segment
        for (let i= -TargetGrid.ANGLE_DEV/2; i <= TargetGrid.ANGLE_DEV/2; i= i + TargetGrid.ANGLE_STEP) {
            this.linesGroup.addLayer(this.drawSegmentAtAngle(weaponLatLng, BASEANGLE + i, startRadius, endRadius));
        }

        // Tell the user about the new functionality
        //if (localStorage.getItem("tips-targetGrid") === null) {
        //App.openToast("success", "tips-target-title", "tips-target-subtitle")
        //localStorage.setItem("tips-targetGrid", "seen");
        //}
    }

    drawArc(centerLatLng, bearingDeg, startOffset, endOffset, radius, segments = 64) {
        const points = [];
        const baseAngle = bearingDeg;
        const step = (endOffset - startOffset) / segments;

        for (let offset = startOffset; offset <= endOffset; offset += step) {
            const angleRad = (baseAngle + offset) * Math.PI / 180;
            const dx = radius * Math.cos(angleRad);
            const dy = radius * Math.sin(angleRad);
            points.push([centerLatLng.lat - dy, centerLatLng.lng + dx]);
        }

        return new Polyline(points, TargetGrid.lineOptions);
    }

    drawSegmentAtAngle(originLatLng, angleDeg, innerRadius, outerRadius) {
        const angleRad = (angleDeg) * Math.PI / 180;
        const dx = Math.cos(angleRad);
        const dy = Math.sin(angleRad);

        // Y-axis inverted: subtract dy from lat
        const startLatLng = [
            originLatLng.lat - dy * innerRadius,
            originLatLng.lng + dx * innerRadius,
        ];

        const endLatLng = [
            originLatLng.lat - dy * outerRadius,
            originLatLng.lng + dx * outerRadius,
        ];

        return new Polyline([startLatLng, endLatLng], TargetGrid.lineOptions);
    }

    show(){
        this.linesGroup.addTo(this.map.targetGrids);
    }

    hide(){
        this.linesGroup.removeFrom(this.map.targetGrids);
    }

    clear(){
        this.linesGroup.clearLayers();
    }

}