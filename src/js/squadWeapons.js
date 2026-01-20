import { App } from "../app.js";
import { WEAPONS } from "../data/weapons.js";

export class Weapon {
    constructor(name, deceleration, decelerationTime, gravityScale, minElevation, unit, logo, marker, type, angleType, elevationPrecision, shells = [], heightOffset = 0, angleOffset = 0, projectileLifespan = 100) {
        this.name = name;
        //this.velocity = velocity;
        this.deceleration = deceleration;
        this.decelerationTime = decelerationTime;
        //this.decelerationDistance = this.velocity * this.decelerationTime - 0.5 * this.deceleration * Math.pow(this.decelerationTime, 2);
        this.gravityScale = gravityScale;
        this.minElevation = minElevation;
        this.unit = unit;
        this.logo = logo;
        this.marker = marker;
        this.type = type;
        this.angleType = angleType;
        this.elevationPrecision = elevationPrecision;
        //this.minDistance = minDistance;
        //this.moa = moa;
        //this.maxDistance = this.getMaxDistance();
        //this.hundredDamageRadius = this.calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, distanceFromImpact, 100);
        //this.twentyFiveDamageRadius = this.calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, distanceFromImpact, 25);
        this.shells = shells;
        this.heightOffset = heightOffset;
        this.angleOffset = angleOffset;
        this.projectileLifespan = projectileLifespan;

    }


    /**
     * Calculate the weapon velocity based on the distance to the target.
     * If the projectile has a deceleration phase, the function considers both the deceleration
     * and the post-deceleration velocity. 
     * The deceleration code is black magic produced by https://github.com/Devil4ngle
     * @param {number} [distance] - Distance between the mortar and the target from getDist().
     * @returns {number} - Calculated velocity of the weapon for the given distance.
     */
    getVelocity(distance) {

        // If there's no deceleration, return the constant velocity
        if (this.decelerationDistance === 0) return this.velocity;
        
        // If the distance is within the deceleration phase
        if (distance <= this.decelerationDistance) {
            const discriminant = Math.sqrt(Math.pow(this.velocity, 2) + 2 * this.deceleration * distance);
            const t = (-this.velocity + discriminant) / this.deceleration;
            return this.velocity - this.deceleration * t;
        } 
        
        // If the distance is beyond the deceleration phase
        const finalVelocity = this.velocity - this.deceleration * this.decelerationTime;
        const distanceAfterDeceleration = distance - this.decelerationDistance;
        const timeAfterDeceleration = distanceAfterDeceleration / finalVelocity;
        const totalTime = this.decelerationTime + timeAfterDeceleration;

        // Calculate the average velocity
        return distance / totalTime;   
    }


    /**
     * Return the angle factor from 45°
     * @returns {1/-1} -1 = 0-45° / 1 = 45-90°
     */
    getAngleType() {
        if (this.angleType === "high") { return -1; }
        return 1;
    }


    /**
     * Calculate the maximum distance a projectile can travel at a 45° angle.
     * 
     * If no deceleration is specified (`decelerationDistance == 0`), the total distance is simply the 
     * standard maximum range for a projectile with no deceleration, based on the initial velocity.
     *
     * Reference: https://en.wikipedia.org/wiki/Projectile_motion#Maximum_distance_of_projectile
     * 
     * @returns {number} - The maximum distance the projectile can travel.
     */
    getMaxDistance() {

        // If there's no deceleration (anything but UB32)
        if (this.decelerationDistance == 0) { 
            return (this.velocity ** 2) / App.gravity / this.gravityScale; 
        }

        // Calculate distance due to deceleration (only the velocity difference part)
        const velocityDifference = this.velocity - (this.velocity - this.deceleration * this.decelerationTime);
        const decelerationDistance = velocityDifference * this.decelerationTime;

        // Calculate distance at constant velocity like if the whole trajectory was at cruise speed
        const finalVelocity = this.velocity - this.deceleration * this.decelerationTime;
        const cruiseDistance = (finalVelocity ** 2) / App.gravity / this.gravityScale;

        // Add both parts of the distance
        return decelerationDistance + cruiseDistance;
    }


    /**
     * Return distance at which will be dealt given damage
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Damage-Radius
     */
    calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, distanceFromImpact, targetDamage) {
        const PLAYERSIZE = 1.8;
        const RADIUS = endRadius - (Math.pow(targetDamage / maxDamage, 1 / falloff) * (endRadius - startRadius));
        return Math.sqrt(-Math.pow(distanceFromImpact - PLAYERSIZE, 2 ) + Math.pow(RADIUS, 2));
    }

    /**
     * Updates the shell type for the active weapon 
     * (recalculates damage radiuses / update MOA)
     * @returns {void} 
     */
    changeShell(){
        const SHELL_NUM = $(".dropbtn3").val();
        const WEAPON_NUM = $(".dropbtn2").val();
        const SHELL_DATA = WEAPONS[WEAPON_NUM].shells[SHELL_NUM];

        const explosionParams = [
            SHELL_DATA.explosionDamage,
            SHELL_DATA.explosionRadius[0],
            SHELL_DATA.explosionRadius[1],
            SHELL_DATA.damageFallOff,
            SHELL_DATA.explosionDistanceFromImpact
        ];
    
        // Load Shell data into Weapon
        App.activeWeapon.velocity = SHELL_DATA.velocity;
        App.activeWeapon.decelerationDistance = App.activeWeapon.velocity * App.activeWeapon.decelerationTime - 0.5 * App.activeWeapon.deceleration * Math.pow(App.activeWeapon.decelerationTime, 2);
        App.activeWeapon.minDistance = SHELL_DATA.minDistance;
        App.activeWeapon.moa = SHELL_DATA.moa;
        App.activeWeapon.maxDistance = this.getMaxDistance();
        App.activeWeapon.hundredDamageRadius = App.activeWeapon.calculateDistanceForDamage(...explosionParams, 100);
        App.activeWeapon.twentyFiveDamageRadius = App.activeWeapon.calculateDistanceForDamage(...explosionParams, 25);
        App.activeWeapon.moa = SHELL_DATA.moa;

        // Update Existsing Targets on Minimap
        App.minimap.updateTargets();
        App.minimap.updateWeapons();
    }

}