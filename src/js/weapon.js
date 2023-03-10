import { TECHNICALS, HELL } from "./data.js";

export class Weapon {
    constructor(name, velocity, minDistance) {
        this.name = name;
        this.velocity = velocity;
        this.minDistance = minDistance;
    }

    /**
     * Return the weapon velocity
     * Since Hellmortars and Technical mounted mortars are not following the classic
     * projectile motion, i have to estimate velocity based on ingame values
     * @param {number} [distance] - distance between mortar and target from getDist()
     * @returns {number} - Velocity of the weapon for said distance
     */
    getVelocity(distance) {
        var i;
        if (this.name === "Technical") {
            for (i = 1; i < TECHNICALS.length; i += 1) {
                if (distance < TECHNICALS[i][0]) {
                    return TECHNICALS[i - 1][1] + ((distance - TECHNICALS[i - 1][0]) / (TECHNICALS[i][0] - TECHNICALS[i - 1][0])) * (TECHNICALS[i][1] - TECHNICALS[i - 1][1]);
                }
            }
        }

        if (this.name === "Hell") {
            for (i = 1; i < HELL.length; i += 1) {
                if (distance < HELL[i][0]) {
                    return HELL[i - 1][1] + ((distance - HELL[i - 1][0]) / (HELL[i][0] - HELL[i - 1][0])) * (HELL[i][1] - HELL[i - 1][1]);
                }
            }
        }

        return this.velocity;
    }

}