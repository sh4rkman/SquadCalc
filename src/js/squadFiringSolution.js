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
        // Check if weapon has barrel geometry - if yes, use iterative method
        if ((App.activeWeapon.muzzleOffset && App.activeWeapon.muzzleOffset.y > 0) ||
            (App.activeWeapon.barrelLength && App.activeWeapon.barrelLength > 0)) {
            return this.getElevationWithBarrel(dist, lowangle);
        }

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
     * Calculates elevation with iterative method accounting for 3D barrel geometry.
     * Used for weapons with muzzle offsets (forward, perpendicular, or vertical).
     * Converges to accurate elevation by iteratively adjusting for muzzle position changes.
     * @param {number} [dist] - distance between weapon and target from getDist()
     * @param {boolean} [lowangle] - "high" or "low" angle
     * @returns {number || NaN} radian angle if target in range, NaN otherwise
     */
    getElevationWithBarrel(dist = 0, lowangle = false) {
        // Support both new muzzleOffset and legacy barrelLength
        const muzzleOffset = App.activeWeapon.muzzleOffset || {
            x: 0,
            y: App.activeWeapon.barrelLength || 0,
            z: 0
        };

        // Adjust base distance for perpendicular muzzle offset
        // After bearing correction, actual muzzle-to-target distance is reduced
        // Geometry: √(D² - X²) where D = weapon-center-to-target, X = perpendicular offset
        let baseDistance = dist;
        if (muzzleOffset.x !== 0) {
            const perpOffset = muzzleOffset.x;
            const distSquared = dist * dist;
            const offsetSquared = perpOffset * perpOffset;

            // Ensure we don't get imaginary numbers if offset > distance (shouldn't happen)
            if (distSquared > offsetSquared) {
                baseDistance = Math.sqrt(distSquared - offsetSquared);
            } else {
                // Target is closer than perpendicular offset - likely won't hit
                // Use original distance and let trajectory calculation determine if possible
                baseDistance = dist;
            }
        }

        const maxIterations = 50;
        const tolerance = 0.0001;

        // Initial approximation without forward/vertical muzzle offset consideration
        let angleFactor;
        const P1 = Math.sqrt(this.velocity ** 4 - this.gravity * (this.gravity * baseDistance ** 2 + 2 * (this.heightDiff - App.activeWeapon.heightOffset) * this.velocity ** 2));
        angleFactor = lowangle ? -P1 : P1;
        let elevation = Math.atan((this.velocity ** 2 + angleFactor) / (this.gravity * baseDistance)) - this.degToRad(App.activeWeapon.angleOffset);

        // Iterative calculation accounting for forward and vertical muzzle offsets
        for (let i = 0; i < maxIterations; i++) {
            const sinElev = Math.sin(elevation);
            const cosElev = Math.cos(elevation);

            // Calculate 3D muzzle position offsets from pitch pivot
            // When barrel elevates, Y and Z components rotate around pitch axis
            const muzzleVerticalOffset = muzzleOffset.y * sinElev + muzzleOffset.z * cosElev;
            const muzzleHorizontalOffset = muzzleOffset.y * cosElev - muzzleOffset.z * sinElev;

            // Final adjustments: account for forward offset along barrel
            const finalDist = baseDistance - muzzleHorizontalOffset;
            const finalHeightDiff = this.heightDiff - App.activeWeapon.heightOffset - muzzleVerticalOffset;

            // Calculate new angle with all adjustments
            const P1_adjusted = Math.sqrt(this.velocity ** 4 - this.gravity * (this.gravity * finalDist ** 2 + 2 * finalHeightDiff * this.velocity ** 2));
            const angleFactor_adjusted = lowangle ? -P1_adjusted : P1_adjusted;
            const newElevation = Math.atan((this.velocity ** 2 + angleFactor_adjusted) / (this.gravity * finalDist)) - this.degToRad(App.activeWeapon.angleOffset);

            // Check convergence
            if (Math.abs(newElevation - elevation) < tolerance) {
                elevation = newElevation;
                break;
            }

            elevation = newElevation;
        }

        // Validate angle is within weapon limits
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

        // Apply bearing correction for perpendicular muzzle offset
        if (App.activeWeapon.muzzleOffset && App.activeWeapon.muzzleOffset.x !== 0) {
            const perpendicularOffset = App.activeWeapon.muzzleOffset.x;
            // Positive X offset means muzzle is to the right of center (when facing forward)
            // Bearing correction (in degrees): arctan(offset / distance)
            // Negative correction rotates bearing left to compensate for right offset
            const bearingCorrection = -Math.atan2(perpendicularOffset, this.distance) * 180 / Math.PI;
            bearing += bearingCorrection;

            if (bearing < 0) { bearing += 360; }
            if (bearing >= 360) { bearing -= 360; }
        }

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
