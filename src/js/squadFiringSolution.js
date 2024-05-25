import { App } from "./conf";
import { LatLng } from "leaflet";



// WIP, currently not using this class


export default class SquadFiringSolution {

    constructor(weaponLatLng, targetLatLng, map) {
        this.map = map;
        this.activeWeapon = App.activeWeapon;
        this.weaponLatLng = weaponLatLng;
        this.targetLatLng = targetLatLng;
        this.gravity = App.gravity * App.activeWeapon.gravityScale;
        this.distance = this.getDist();
        this.bearing = this.getBearing(this.weaponLatLng, this.targetLatLng);
        this.velocity = App.activeWeapon.getVelocity(this.distance);
        this.weaponHeight = this.map.heightmap.getHeight(weaponLatLng);
        this.targetHeight = this.map.heightmap.getHeight(targetLatLng);
        this.heightDiff =  this.targetHeight - this.weaponHeight;
        this.elevation = {low: [], high: []};
        this.elevation.low.rad = this.getElevation(this.distance, this.heightDiff, this.velocity, true);
        this.elevation.low.deg = this.radToDeg(this.elevation.low.rad);
        this.elevation.low.mil = this.radToMil(this.elevation.low.rad);
        this.elevation.high.rad = this.getElevation(this.distance, this.heightDiff, this.velocity, false);
        this.elevation.high.deg = this.radToDeg(this.elevation.high.rad);
        this.elevation.high.mil = this.radToMil(this.elevation.high.rad);
        this.spreadParameters = {low: [], high: []};
        this.spreadParameters.low = this.getSpreadParameter(this.elevation.low.rad, this.velocity);
        this.spreadParameters.high = this.getSpreadParameter(this.elevation.high.rad, this.velocity);
        this.timeOfFlight = {low: [], high: []};
        this.timeOfFlight.low = this.getTimeOfFlight(this.elevation.low.rad, this.velocity, this.heightDiff);
        this.timeOfFlight.high = this.getTimeOfFlight(this.elevation.high.rad, this.velocity, this.heightDiff);
    }


    /**
     * TODO
     * @return {number} - distance in meter
     */
    getDist(){
        const scaledWeaponLatLng = new LatLng(this.weaponLatLng.lng * this.map.mapToGameScale, this.weaponLatLng.lat * -this.map.mapToGameScale);
        const scaledTargetLatLng = new LatLng(this.targetLatLng.lng * this.map.mapToGameScale, this.targetLatLng.lat * -this.map.mapToGameScale);
        return Math.hypot(scaledWeaponLatLng.lat - scaledTargetLatLng.lat, scaledWeaponLatLng.lng - scaledTargetLatLng.lng);
    }

    /**
     * Calculates the angle the mortar needs to be set in order
     * to hit the target at the desired distance and vertical delta.
     * @param {number} [dist] - distance between mortar and target from getDist()
     * @param {number} [vDelta] - vertical delta between mortar and target from getHeight()
     * @param {number} [vel] - initial mortar projectile velocity
     * @param {boolean} [lowangle] - "high" or "low" angle
     * @returns {number || NaN} radian angle if target in range, NaN otherwise
    */
    getElevation(dist = 0, vDelta = 0, vel = 0, lowangle = false) {
        var padding = 0;
        const P1 = Math.sqrt(vel ** 4 - this.gravity * (this.gravity * dist ** 2 + 2 * vDelta * vel ** 2));
    
        if (App.activeWeapon.name==="Technical"){
            // The technical mortar is bugged : the ingame range metter is off by 5°, Ugly fix until OWI correct it
            padding = -0.0872665;
        }

        if (lowangle) {
            return padding + Math.atan((vel ** 2 - (P1)) / (this.gravity * dist));
        }
        else {
            return padding + Math.atan((vel ** 2 + (P1)) / (this.gravity * dist));
        }
    }

    /**
     * Calculates the bearing required to see point B from point A.
     * @returns {number} - bearing required to see B from A
     */
    getBearing() {
        const scaledWeaponLatLng = new LatLng(this.weaponLatLng.lng * this.map.mapToGameScale, this.weaponLatLng.lat * -this.map.mapToGameScale);
        const scaledTargetLatLng = new LatLng(this.targetLatLng.lng * this.map.mapToGameScale, this.targetLatLng.lat * -this.map.mapToGameScale);
        var bearing = Math.atan2(scaledTargetLatLng.lng - scaledWeaponLatLng.lng, scaledTargetLatLng.lat - scaledWeaponLatLng.lat) * 180 / Math.PI + 90;
        if (bearing < 0) { bearing += 360; } // Avoid Negative Angle by adding a whole rotation
        return bearing;
    }

    /**
     * TODO
     * @param {number} TODO - radians
     * @returns {number} TODO
     */
    getSpreadParameter(elevation, vel){  
        return  {
            semiMajorAxis: this.getHorizontalSpread(elevation, vel, this.gravity),
            semiMinorAxis: this.getVerticalSpread(elevation, vel),
            ellipseAngle: (elevation * (180 / Math.PI))
        };
    }

    /**
     * Calculates the horizontal spread for a given trajectory path length 
     * @param {number} [angle] - angle of the initial shot in radian
     * @param {number} [vel] - initial mortar projectile velocity in m/s
     * @param {number} [gravity] - gravity applied to the projectile
     * @returns {number} - Length of horizontal spread in meters
     */
    getHorizontalSpread(angle, velocity){
        var MOA = App.activeWeapon.moa / 60;
        var p1 = 2 * Math.PI * this.getProjectilePathDistance(angle, velocity);
        var p2 = (MOA / 360) * p1;

        if (isNaN(p2)) {
            return 0;
        } else {
            return p2;
        }
    }

    /**
     * Calculates the length of the projectile path in air, neglecting heights difference
     * https://en.wikipedia.org/wiki/Projectile_motion#Total_Path_Length_of_the_Trajectory
     * @param {number} [angle] - angle of the initial shot in radian
     * @param {number} [vel] - initial mortar projectile velocity in m/s
     * @param {number} [gravity] - gravity applied to the projectile
     * @returns {number} - projectile path length in meters
     */
    getProjectilePathDistance(angle, velocity){
        const p1 = velocity**2 / this.gravity;
        const p2 = Math.sin(angle) + Math.cos(angle)**2 * Math.atanh(Math.sin(angle));
        return Math.abs(p1 * p2);
    }

    /**
     * Calculates the vertical spread of a projectile
     * to hit the target at the desired distance and vertical delta.
     * @param {number} [angle] - angle of the initial shot
     * @param {number} [vel] - initial mortar projectile velocity in m/s
     * @returns {number} - vertical spread in meter
     */
    getVerticalSpread(angle, vel){

        const moa = this.degToRad((App.activeWeapon.moa / 2) / 60);
    
        // Apply MOA to found Angle and deduce the spread distance
        // https://en.wikipedia.org/wiki/Projectile_motion#Maximum_distance_of_projectile
        const verticalSpread1 = (vel ** 2 * Math.sin(2*(angle + moa))) / this.gravity;
        const verticalSpread2  = (vel ** 2 * Math.sin(2*(angle - moa))) / this.gravity;
        const totalSpread = Math.abs(verticalSpread2 - verticalSpread1);
    
        if (isNaN(totalSpread)) {
            return 0;
        } else {
            return totalSpread;
        }
    }

    /**
     * Calculate the time of flight of the projectile
     * @param {number} [angle] - angle of the initial shot in radian
     * @param {number} [vel] - initial mortar projectile velocity in m/s
     * @param {number} [heightDiff] - difference between weapon and target in meters
     * @returns {number} - time of flight in seconds
     */
    getTimeOfFlight(angle, vel, heightDiff){
        const t = vel * Math.sin(angle) + Math.sqrt( (Math.pow(vel, 2) * Math.pow(Math.sin(angle), 2)) + (2 * this.gravity * -heightDiff));
        return t / this.gravity;
    }

    /**
     * Converts radians into degrees
     * @param {number} rad - radians
     * @returns {number} degrees
     */
    radToDeg(rad) {
        return (rad * 180) / Math.PI;
    }

    /**
     * Converts radians into NATO mils
     * @param {number} rad - radians
     * @returns {number} NATO mils
     */
    radToMil(rad) {
        return this.degToMil(this.radToDeg(rad));
    }

    /**
     * Converts degrees to radians
     * @param {number} deg - degrees
     * @returns {number} radians
     */
    degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    /**
     * Converts degrees into NATO mils
     * @param {number} deg - degrees
     * @returns {number} NATO mils
     */
    degToMil(deg) {
        return deg / (360 / 6400);
    }
}