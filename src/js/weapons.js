import { App } from "./conf";

export class Weapon {
    constructor(name, velocity, gravityScale, minElevation, unit, logo, marker, logoCannonPos, type, angleType, elevationPrecision, minDistance, moa, maxDamage, startRadius, endRadius, falloff) {
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
        this.hundredDamageRadius = this.calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, 100);
        this.twentyFiveDamageRadius = this.calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, 25);
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

    calculateDistanceForDamage(maxDamage, startRadius, endRadius, falloff, targetDamage) {
        return endRadius - (Math.pow(targetDamage / maxDamage, 1 / falloff) * (endRadius - startRadius));
    }

}




