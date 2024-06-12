import { App } from "./conf";
import { drawLine } from "./animations";
import { shoot } from "./utils";

import classicLogo from "../img/icons/mortar.png";
import hellcannonLogo from "../img/icons/hellcannon_white.png";
import technicalLogo from "../img/icons/technical_mortar_white.png";
import mlrsLogo from "../img/icons/mlrs_white.png";
//import frenchLogo from "../img/icons/120mm_white.png";
import ub32Logo from "../img/icons/ub32_white.png";
import ub322Logo from "../img/icons/ub32_deployable.png";
import m113Logo from "../img/icons/m113a3_white.png";

/* eslint no-unused-vars: "off" */
import target from "../img/icons/target.png";




export class Weapon {
    constructor(name, velocity, gravityScale, minElevation, unit, logo, logoCannonPos, type, angleType, elevationPrecision, minDistance, moa) {
        this.name = name;
        this.velocity = velocity;
        this.gravityScale = gravityScale;
        this.minElevation = minElevation;
        this.unit = unit;
        this.logo = logo;
        this.logoCannonPos = logoCannonPos;
        this.type = type;
        this.angleType = angleType;
        this.elevationPrecision = elevationPrecision;
        this.minDistance = minDistance;
        this.moa = moa;
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
}


const weaponTypes = ["deployables", "vehicles"/*, "frenchDLC"*/];

const UB32_table = [
    [100, 335.1200224653227],
    [200, 305.9582960205495],
    [300, 283.34779711713827],
    [400, 269.43092929304714],
    [500, 256.00067568689457],
    [600, 246.0597855795005],
    [700, 230.23902655011395],
    [800, 227.72135414063865],
    [900, 227.10330164679877],
    [1000, 219.51863104815288],
    [1100, 217.92195975729098],
    [1200, 213.69727817913733],
    [1300, 217.46916795849413],
    [1400, 216.06414872060554],
    [1500, 213.86509885836008],
    [1600, 210.59377321283807],
    [1700, 208.55735633285997],
    [1800, 207.5305459239776],
    [1900, 207.7886602381275],
    [2000, 208.8396419902778],
    [2050, 206.39437348683896],
    [2100, 205.87235893665985],
    [2143, 205.08642659737743],
];


export const WEAPONS = [
    new Weapon("Mortar", 109.890938, 1, [800, 1579], "mil", classicLogo, "130%", "deployables", "high", 0, 51, 50),
    new Weapon("UB-32", UB32_table, 2, [-25, 35], "deg", ub322Logo, "110%", "deployables", "low", 1, 0, 300),
    new Weapon("Hell Cannon", 95, 1, [10, 85], "deg", hellcannonLogo, "130%", "deployables", "high", 1, 160, 100),

    new Weapon("Tech. Mortar", 109.890938, 1, [-45, 135], "deg", technicalLogo, "50%", "vehicles", "high", 1, 51, 50),
    new Weapon("Tech. UB-32", UB32_table, 2, [-45, 135], "deg", ub32Logo, "55%", "vehicles", "low", 1, 0, 300),
    new Weapon("BM-21 Grad", 200, 2, [-45, 135], "deg", mlrsLogo, "60%", "vehicles", "low", 1, 0, 200),
    new Weapon("M1064 120mm", 190, 1, [45, 85.3], "deg", m113Logo, "45%", "vehicles", "high", 1, 600, 25),
    //new Weapon("Short", 109.890938, 1, 1520, undefined, "mil", frenchLogo, "135%", "frenchDLC", "high", 0),
    //new Weapon("Medium", 143.5, 1, 1520, undefined, "mil", frenchLogo, "135%", "frenchDLC", "high", 0),
    //new Weapon("Long", 171.5, 1, 1520, undefined, "mil", frenchLogo, "135%", "frenchDLC", "high", 0),
];


/**
 * save current weapon into browser cache
 */
export function changeWeapon() {
    const weapon = $(".dropbtn2").val();

    App.line.hide("none");
    localStorage.setItem("data-weapon", weapon);
    App.activeWeapon = WEAPONS[weapon];
    $("#mortarImg").attr("src", App.activeWeapon.logo);
    shoot();

    if (App.ui === 0){drawLine();}

    // Update Minimap marker
    App.minimap.updateWeapons();
    App.minimap.updateTargets();
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


/**
 * Load weapons into html
 */
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