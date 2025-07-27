import { App } from "../app.js";
import { Polyline, LayerGroup } from "leaflet";

export default class TargetGrid {
    
    constructor(map, firingSolution) {
        this.map = map;
        this.firingSolution = firingSolution;
        this.elevation = App.minimap.activeWeaponsMarkers.getLayers()[0].angleType === "high" ? firingSolution.elevation.high.mil : firingSolution.elevation.low.mil;
        
        this.ANGLE_DEV = 10;
        this.ANGLE_STEP = 1;
        if (this.firingSolution.activeWeapon.unit === "deg") {
            this.ELEVATION_DEVIATION = this.firingSolution.degToMil(0.5) * 6;
            this.ELEVATION_STEP = this.firingSolution.degToMil(0.5);
        } else {
            this.ELEVATION_DEVIATION = 30;
            this.ELEVATION_STEP = 5;
        }

        this.lineOptions = { color: "DarkGreen", weight: 2, opacity: 0.7 };
        this.linesGroup = new LayerGroup();

        if (App.userSettings.targetGrid) {
            this.build();
            this.show();

            // Tell the user about the new functionality
            // if (localStorage.getItem("tips-targetGrid") === null) {
            //     App.openToast("success", "New target grid", "you can disable it in settings")
            //     localStorage.setItem("tips-targetGrid", "seen");
            // }
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

        const weaponLatLng = this.map.activeWeaponsMarkers.getLayers()[0].getLatLng();

        const startRadius = (this.firingSolution.getProjectileDistance(this.firingSolution.milToDeg(this.elevation - this.ELEVATION_DEVIATION/2)) + AVGDELTA) * this.map.gameToMapScale;
        const endRadius = (this.firingSolution.getProjectileDistance(this.firingSolution.milToDeg(this.elevation + this.ELEVATION_DEVIATION/2)) + AVGDELTA) * this.map.gameToMapScale;
        if (isNaN(startRadius) || isNaN(endRadius)) return;

        // Start drawing the horizontal arcs
        for (let i = this.elevation - this.ELEVATION_DEVIATION/2; i <= this.elevation + this.ELEVATION_DEVIATION/2 + 1; i = i+ this.ELEVATION_STEP) {
            let aproxDist = this.firingSolution.getProjectileDistance(this.firingSolution.milToDeg(i));
            let finalDist = (aproxDist + AVGDELTA) * this.map.gameToMapScale;
            this.linesGroup.addLayer(this.drawArc(weaponLatLng, this.firingSolution.bearing, -this.ANGLE_DEV/2, this.ANGLE_DEV/2, finalDist));
        }


        // Start drawing vertical segment
        const baseAngle = this.firingSolution.bearing - 90; // face North
        for (let i= -this.ANGLE_DEV/2; i <= this.ANGLE_DEV/2; i= i + this.ANGLE_STEP) {
            this.linesGroup.addLayer(this.drawSegmentAtAngle(weaponLatLng, baseAngle + i, startRadius, endRadius));
        }

    }

    drawArc(centerLatLng, bearingDeg, startOffset, endOffset, radius, segments = 64) {
        const points = [];
        const baseAngle = bearingDeg - 90;
        const step = (endOffset - startOffset) / segments;

        for (let offset = startOffset; offset <= endOffset; offset += step) {
            const angleRad = (baseAngle + offset) * Math.PI / 180;
            const dx = radius * Math.cos(angleRad);
            const dy = radius * Math.sin(angleRad);
            points.push([centerLatLng.lat - dy, centerLatLng.lng + dx]);
        }

        return new Polyline(points, this.lineOptions);
    }

    drawSegmentAtAngle(originLatLng, angleDeg, innerRadius, outerRadius) {
        const angleRad = angleDeg * Math.PI / 180;
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

        return new Polyline([startLatLng, endLatLng], this.lineOptions);
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