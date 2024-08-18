import { App } from "../app";
import { WEAPONS } from "../data/weapons.js";

export class Weapon {
    constructor(name, velocity, gravityScale, minElevation, unit, logo, marker, logoCannonPos, type, angleType, elevationPrecision, minDistance, moa, maxDamage, startRadius, endRadius, distanceFromImpact, falloff, shells = []) {
        this.name = name;
        this.velocity = velocity;
        this.gravityScale = gravityScale;
        this.minElevation = minElevation;
        this.unit = unit;
        this.logo = logo;
        this.marker = marker;
        this.logoCannonPos = logoCannonPos;
        this.type = type;
        this.angleType = angleType;
        this.elevationPrecision = elevationPrecision;
        this.minDistance = minDistance;
        this.moa = moa;
        this.maxDistance = this.getMaxDistance();
        this.hundredDamageRadius = this.calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, distanceFromImpact, 100);
        this.twentyFiveDamageRadius = this.calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, distanceFromImpact, 25);
        this.shells = shells;
    }

    /**
     * Return the weapon velocity
     * @param {number} } [distance] - distance between mortar and target from getDist()
     * @returns {number} - Velocity of the weapon for said distance
     */
    getVelocity(distance) {
        if (this.velocity.constructor != Array) { return this.velocity; }

        for (let i = 1; i < this.velocity.length; i += 1) {
            if (distance < this.velocity[i][0]) {
                return this.velocity[i - 1][1] + ((distance - this.velocity[i - 1][0]) / (this.velocity[i][0] - this.velocity[i - 1][0])) * (this.velocity[i][1] - this.velocity[i - 1][1]);
            }
        }
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
     * Return maximum distance for 45°
     * https://en.wikipedia.org/wiki/Projectile_motion#Maximum_distance_of_projectile
     * @returns {number} [distance]
     */
    getMaxDistance() {
        if (this.velocity.constructor != Array) {
            return (this.velocity ** 2) / App.gravity / this.gravityScale;
        }

        // When using UB32, return last value from UB32_table
        return this.velocity.slice(-1)[0][0];
    }

    /**
     * Return distance at which will be dealt given damage
     * https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Damage-Radius
     */
    calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, distanceFromImpact, targetDamage) {
        var characterSize = 1.8;
        var radius = endRadius - (Math.pow(targetDamage / maxDamage, 1 / falloff) * (endRadius - startRadius));
        return Math.sqrt(-Math.pow(distanceFromImpact - characterSize, 2 ) + Math.pow(radius, 2));
    }

    changeShell(){
        var shell = $(".dropbtn3").val();
        if ($(".dropbtn2").val() != 6) { return;}
    
        App.activeWeapon.moa = WEAPONS[6].shells[shell].moa;
        App.activeWeapon.hundredDamageRadius = App.activeWeapon.calculateDistanceForDamage(
            WEAPONS[6].shells[shell].explosionDamage,
            WEAPONS[6].shells[shell].explosionRadius[0],
            WEAPONS[6].shells[shell].explosionRadius[1],
            WEAPONS[6].shells[shell].damageFallOff,
            WEAPONS[6].shells[shell].explosionDistanceFromImpact, 
            100);
    
        App.activeWeapon.twentyFiveDamageRadius = App.activeWeapon.calculateDistanceForDamage(
            WEAPONS[6].shells[shell].explosionDamage,
            WEAPONS[6].shells[shell].explosionRadius[0],
            WEAPONS[6].shells[shell].explosionRadius[1],
            WEAPONS[6].shells[shell].damageFallOff,
            WEAPONS[6].shells[shell].explosionDistanceFromImpact, 
            25);

        App.minimap.updateTargets();
    }

}




