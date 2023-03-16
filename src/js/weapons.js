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

        if (this.name === "BM21Grad") {
            for (i = 1; i < MLRS.length; i += 1) {
                if (distance < MLRS[i][0]) {
                    return MLRS[i - 1][1] + ((distance - MLRS[i - 1][0]) / (MLRS[i][0] - MLRS[i - 1][0])) * (MLRS[i][1] - MLRS[i - 1][1]);
                }
            }
        }

        return this.velocity;
    }

}

export const ClassicMortar = new Weapon("Classic", 109.890938, 1580);
export const TechnicalMortar = new Weapon("Technical", 0, 83.8);
export const MO120_SMortar = new Weapon("MO120_S", 109.890938, 1520);
export const MO120_MMortar = new Weapon("MO120_M", 143.5, 1520);
export const MO120_LMortar = new Weapon("MO120_L", 171.5, 1520);
export const HellMortar = new Weapon("Hell", 0, 88);
export const BM21Grad = new Weapon("BM21Grad", 0, 14.2);




// Since technicals mortars are acting weirdly, i have to stock these empirical values for now until i figure out how they work
// read https://github.com/Endebert/squadmc/discussions/101 for more information
// TECHNICALS[distance, Velocity]
export const TECHNICALS = [
    [50, 47.76901552],
    [100, 63.20591542],
    [200, 77.59023672],
    [300, 85.01920022],
    [400, 90.49300565],
    [500, 94.09830025],
    [600, 96.66132881],
    [700, 99.37483515],
    [800, 101.1651775],
    [900, 103.1447638],
    [1000, 104.7823288],
    [1100, 106.3455911],
    [1200, 108.7830358],
    [1233, 109.7640997]
];


// HELL[distance, Velocity]
export const HELL = [
    [50, 83.807],
    [150, 92.007],
    [200, 93.342],
    [300, 95.028],
    [400, 94.563],
    [500, 94.852],
    [600, 95.643],
    [700, 94.632],
    [800, 95.147],
    [875, 95.527],
    [900, 94.636],
    [925, 95.210],
];

// HELL[distance, Velocity]
export const MLRS = [
    [900, 136.176547],
    [1000, 132.382998],
    [1100, 133.837516],
    [1200, 130.112201],
    [1300, 130.932658],
    [1400, 129.418033],
    [1500, 126.850910],
    [1600, 127.718030],
    [1650, 127.161315],
];



/**
 * save current weapon into browser cache
 */
export function saveWeapon() {
    localStorage.setItem("data-weapon", $("input:checked").attr("id"));
}

/**
 * get last weapon from user cache and apply it
 */
export function getWeapon() {
    var weapon = localStorage.getItem("data-weapon");
    if (weapon === null) { return 1; }
    $("#" + weapon).prop("checked", true);
}