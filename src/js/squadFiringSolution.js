import { App } from "../app.js";

export default class SquadFiringSolution {

    constructor(weaponLatLng, targetLatLng, map, heightPadding) {
        this.map = map;
        this.activeWeapon = App.activeWeapon;
        this.weaponLatLng = weaponLatLng;
        this.targetLatLng = targetLatLng;
        this.moa = this.degToRad((App.activeWeapon.moa) / 60);
        this.gravity = App.gravity * App.activeWeapon.gravityScale;
        this.distance = this.getDist();
        this.bearing = this.getBearing(this.weaponLatLng, this.targetLatLng);
        this.velocity = App.activeWeapon.getVelocity(this.distance);
        this.weaponHeight = this.map.heightmap.getHeight(weaponLatLng) + parseFloat(heightPadding);
        this.targetHeight = this.map.heightmap.getHeight(targetLatLng);
        this.heightDiff =  this.targetHeight - this.weaponHeight;
        this.elevation = {low: [], high: []};
        this.elevation.low.rad = this.getElevation(this.distance, true);
        this.elevation.low.deg = this.radToDeg(this.elevation.low.rad);
        this.elevation.low.mil = this.radToMil(this.elevation.low.rad);
        this.elevation.high.rad = this.getElevation(this.distance, false);
        this.elevation.high.deg = this.radToDeg(this.elevation.high.rad);
        this.elevation.high.mil = this.radToMil(this.elevation.high.rad);
        this.timeOfFlight = {low: [], high: []};
        this.timeOfFlight.low = this.getTimeOfFlight(this.elevation.low.rad);
        this.timeOfFlight.high = this.getTimeOfFlight(this.elevation.high.rad);
        this.spreadParameters = {low: [], high: []};
        this.spreadParameters.low = this.getSpreadParameter(this.elevation.low.rad, this.timeOfFlight.low);
        this.spreadParameters.high = this.getSpreadParameter(this.elevation.high.rad, this.timeOfFlight.high);

        if (this.timeOfFlight.low > App.activeWeapon.projectileLifespan) this.elevation.low.rad = NaN;
        if (this.timeOfFlight.high > App.activeWeapon.projectileLifespan) this.elevation.high.rad = NaN;
    }


    /**
     * Calculate ingame distance between weapon & target
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-distance-and-bearing#finding-distance
     * @return {number} - distance in meter
     */
    getDist(){
        const latDelta = (this.targetLatLng.lat - this.weaponLatLng.lat) * -this.map.mapToGameScale;
        const lngDelta = (this.targetLatLng.lng - this.weaponLatLng.lng) * this.map.mapToGameScale;
        return Math.hypot(latDelta, lngDelta);
    }

    /**
     * Calculates the angle the mortar needs to be set in order
     * to hit the target at the desired distance and vertical delta.
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Elevation
     * @param {number} [dist] - distance between mortar and target from getDist()
     * @param {boolean} [lowangle] - "high" or "low" angle
     * @returns {number || NaN} radian angle if target in range, NaN otherwise
    */
    getElevation(dist = 0, lowangle = false) {
        let angleFactor;
        
        const P1 = Math.sqrt(this.velocity ** 4 - this.gravity * (this.gravity * dist ** 2 + 2 * (this.heightDiff - App.activeWeapon.heightOffset) * this.velocity ** 2));
        angleFactor = lowangle ? -P1 : P1;

        let elevation = Math.atan((this.velocity ** 2 + angleFactor) / (this.gravity * dist)) - this.degToRad(App.activeWeapon.angleOffset);

        if (this.radToDeg(elevation) < App.activeWeapon.minElevation[0] || this.radToDeg(elevation) > App.activeWeapon.minElevation[1]){
            return NaN;
        }

        return elevation;
    }


    /**
     * Calculates the bearing required to see point B from point A.
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-distance-and-bearing#finding-bearing
     * @returns {number} - bearing required to see B from A
     */
    getBearing() {
        const latDelta = (this.targetLatLng.lat - this.weaponLatLng.lat) * -this.map.mapToGameScale;
        const lngDelta = (this.targetLatLng.lng - this.weaponLatLng.lng) * this.map.mapToGameScale;
        let bearing = Math.atan2(latDelta, lngDelta) * 180 / Math.PI + 90;
        if (bearing < 0) { bearing += 360; } // Avoid Negative Angle by adding a whole rotation
        return bearing;
    }

    
    /**
     * Calculates the horizontal distance a projectile will travel given a launch angle,
     * initial velocity, and vertical height difference between origin and target.
     * 
     * This function solves the vertical motion equation using the quadratic formula
     * to find the total flight time (t) required to reach the specified height difference.
     * It then uses that time to compute the horizontal distance.
     * 
     * VERY imprecise at low angles and high heights diff
     * 
     * @param {number} angle - Launch angle in degrees (from horizontal).
     * @returns {number} Horizontal distance the projectile will travel (in meters).
     */
    getProjectileDistance(angle) {
        if (App.activeWeapon.name === "Tech.Mortar") angle += 5;

        const angleRad = angle * Math.PI / 180;
        const vx = this.velocity * Math.cos(angleRad);
        const vy = this.velocity * Math.sin(angleRad);

        const a = 0.5 * this.gravity;
        const b = -vy;
        const c = this.heightDiff;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) return 0; // No real solution, target unreachable

        const sqrtDisc = Math.sqrt(discriminant);
        const denom = 2 * a;
        const t1 = (-b + sqrtDisc) / denom;
        const t2 = (-b - sqrtDisc) / denom;

        const t = t1 > 0 ? t1 : (t2 > 0 ? t2 : 0);
        if (t < 0) return 0;

        const distance = vx * t;
        return Math.max(0, distance);
    }


    /**
     * Calculate Axises and angle for spread ellipse
     * @param {number} [elevation] - Elevation angle in radian
     * @param {number} [timeOfFlight] - Time of flight in seconds
     * @returns {object} [semiMajorAxis, semiMinorAxis, ellipseAngle]
     */
    getSpreadParameter(elevation, timeOfFlight){  
        return  {
            semiMajorAxis: this.getHorizontalSpread(timeOfFlight),
            semiMinorAxis: this.getVerticalSpread(elevation, this.velocity),
            ellipseAngle: (elevation * (180 / Math.PI))
        };
    }


    /**
     * Calculates the horizontal spread for a given trajectory path length 
     * @param {number} [timeOfFlight] - Time of flight in seconds
     * @returns {number} - Length of horizontal spread in meters
     */
    getHorizontalSpread(timeOfFlight){
        const horizontalVelocity = Math.sin(this.moa) * this.velocity;
        const horizontalSpread = horizontalVelocity * timeOfFlight;
        return Math.max(0, horizontalSpread);
    }


    /**
     * Calculates the vertical spread of a projectile
     * to hit the target at the desired distance and vertical delta.
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Spread#vertical-spread
     * @param {number} [angle] - angle of the initial shot
     * @returns {number} - vertical spread in meter
     */
    getVerticalSpread(angle){
        const verticalSpread1 = (this.velocity ** 2 * Math.sin(2*(angle + (this.moa/2)))) / this.gravity;
        const verticalSpread2  = (this.velocity ** 2 * Math.sin(2*(angle - (this.moa/2)))) / this.gravity;
        const totalSpread = Math.abs(verticalSpread2 - verticalSpread1);
        return Math.max(0, totalSpread);
    }


    /**
     * Calculate the time of flight of the projectile
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Time-Of-Flight
     * @param {number} [angle] - angle of the initial shot in radian
     * @returns {number} - time of flight in seconds
     */
    getTimeOfFlight(angle){
        // In extreme cases ToF can be NaN (low angle, high heights)
        // if it does just aproximate without taking heights in account this time
        var t = this.velocity * Math.sin(angle) + Math.sqrt( (Math.pow(this.velocity, 2) * Math.pow(Math.sin(angle), 2)) + (2 * this.gravity * -this.heightDiff));
        if (isNaN(t))  t = this.velocity * Math.sin(angle) + Math.sqrt( (Math.pow(this.velocity, 2) * Math.pow(Math.sin(angle), 2)));
        return t / this.gravity;
    }


    /**
     * Converts radians into degrees
     * @param {number} rad - radians
     * @returns {number} degrees
     */
    radToDeg(rad){
        return (rad * 180) / Math.PI;
    }


    /**
     * Converts radians into NATO mils
     * @param {number} rad - radians
     * @returns {number} NATO mils
     */
    radToMil(rad){
        return this.degToMil(this.radToDeg(rad));
    }


    /**
     * Converts degrees to radians
     * @param {number} deg - degrees
     * @returns {number} radians
     */
    degToRad(deg){
        return (deg * Math.PI) / 180;
    }


    /**
     * Converts degrees into NATO mils
     * @param {number} deg - degrees
     * @returns {number} NATO mils
     */
    degToMil(deg){
        return deg / (360 / 6400);
    }
    
    /**
     * Converts NATO mils into degrees
     * @param {number} mil - NATO mils
     * @returns {number} degrees
     */
    milToDeg(mil){
        return mil * (360 / 6400);
    }

}
