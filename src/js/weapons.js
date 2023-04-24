import { globalData } from "./conf";
import { shoot } from "./utils";

import classicLogo from "../img/icons/mortar.png";
import hellcannonLogo from "../img/icons/hellcannon_white.png";
import technicalLogo from "../img/icons/technical_mortar_white.png";
import mlrsLogo from "../img/icons/mlrs_white.png";
import frenchLogo from "../img/icons/120mm_white.png";
//import ub32Logo from "../img/icons/ub32_white.png";

/* eslint no-unused-vars: "off" */
import mainLogo from "../img/logo.png";
import target from "../img/icons/target.png";




export class Weapon {
    constructor(name, velocity, gravityScale, minElevation, table, unit, logo, type) {
        this.name = name;
        this.velocity = velocity;
        this.gravityScale = gravityScale;
        this.minElevation = minElevation;
        this.table = table;
        this.unit = unit;
        this.logo = logo;
        this.type = type;
    }

    /**
     * Return the weapon velocity
     * Since Hellmortars and Technical mounted mortars are not following the classic
     * projectile motion, i have to estimate velocity based on ingame values
     * @param {number} [distance] - distance between mortar and target from getDist()
     * @returns {number} - Velocity of the weapon for said distance
     */
    getVelocity(distance) {
        if (!this.table) { return this.velocity; }
        for (let i = 1; i < this.table.length; i += 1) {
            if (distance < this.table[i][0]) {
                return this.table[i - 1][1] + ((distance - this.table[i - 1][0]) / (this.table[i][0] - this.table[i - 1][0])) * (this.table[i][1] - this.table[i - 1][1]);
            }
        }
    }

}


const weaponTypes = ["mortars", "vehicules", "frenchDLC"];

// Since technicals mortars are acting weirdly, i have to stock these empirical values for now until i figure out how they work
// read https://github.com/Endebert/squadmc/discussions/101 for more information
// TECHNICALS[distance, Velocity]
const TECHNICALS = [
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
const HELL = [
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

// const UB32_table = [
//     [550, 5],
//     [700, 7.5],
//     [800, 8.8],
//     [900, 10],
//     [1000, 12],
//     [1100, 13.5],
//     [1200, 15.5],
//     [1300, 16.3],
//     [1400, 18],
//     [1500, 22.5],
//     [1600, 18],
//     [1700, 25],
//     [1800, 27.5],
//     [1900, 29.8],
//     [1900, 29.8],
//     [2000, 32],
// ];



export const WEAPONS = [
    new Weapon("Default", 109.890938, 1, 1580, undefined, "mil", classicLogo, "mortars"),
    new Weapon("Hell Cannon", undefined, 1, 88, HELL, "deg", hellcannonLogo, "mortars"),
    new Weapon("Technical", undefined, 1, 83.8, TECHNICALS, "deg", technicalLogo, "vehicules"),
    new Weapon("BM-21 Grad", 200.05799, 2, 0, undefined, "deg", mlrsLogo, "vehicules"),
    new Weapon("Short", 109.890938, 1, 1520, undefined, "mil", frenchLogo, "frenchDLC"),
    new Weapon("Medium", 143.5, 1, 1520, undefined, "mil", frenchLogo, "frenchDLC"),
    new Weapon("Long", 171.5, 1, 1520, undefined, "mil", frenchLogo, "frenchDLC"),
    //UB32 = new Weapon("BM-21 Grad", 0, 14.2, UB32_table, "deg", ub32Logo, "vehicule"),
];

/**
 * save current weapon into browser cache
 */
export function changeWeapon() {
    const weapon = $(".dropbtn2").val();
    localStorage.setItem("data-weapon", weapon);
    globalData.activeWeapon = WEAPONS[weapon];
    $("#mortar > img").attr("src", globalData.activeWeapon.logo);
    shoot();
}


/**
 * get last selected weapon from user cache and apply it
 */
function getWeapon() {
    var weapon = localStorage.getItem("data-weapon");
    if (weapon === null || isNaN(weapon) || weapon === "") { weapon = 0; }
    $(".dropbtn2").val(weapon);
    changeWeapon();
}


export function loadWeapons() {
    const WEAPONSLENGTH = WEAPONS.length;
    const WEAPON_SELECTOR = $(".dropbtn2");

    WEAPON_SELECTOR.select2({
        dropdownCssClass: "dropbtn2",
        dropdownParent: $("#weaponSelector"),
        minimumResultsForSearch: -1, // Disable search
        placeholder: "SELECT A WEAPON"
    });

    for (let i = 0; i < weaponTypes.length; i += 1) {
        WEAPON_SELECTOR.append("<optgroup label=\"" + weaponTypes[i] + "\">");
        for (let y = 0; y < WEAPONSLENGTH; y += 1) {
            if (WEAPONS[y].type === weaponTypes[i]) {
                WEAPON_SELECTOR.append("<option value=\"" + y + "\">" + WEAPONS[y].name + "</option>");
            }
        }
        WEAPON_SELECTOR.append("</optgroup>");
    }

    getWeapon();
}