import { globalData } from "./conf";
import { shoot } from "./utils";
import { drawLine } from "./animations";

import classicLogo from "../img/icons/mortar.png";
import hellcannonLogo from "../img/icons/hellcannon_white.png";
import technicalLogo from "../img/icons/technical_mortar_white.png";
import mlrsLogo from "../img/icons/mlrs_white.png";
import frenchLogo from "../img/icons/120mm_white.png";
import ub32Logo from "../img/icons/ub32_white.png";

/* eslint no-unused-vars: "off" */
import mainLogo from "../img/logo.png";
import target from "../img/icons/target.png";




export class Weapon {
    constructor(name, velocity, gravityScale, minElevation, table, unit, logo, logoCannonPos, type, angleType, elevationPrecision) {
        this.name = name;
        this.velocity = velocity;
        this.gravityScale = gravityScale;
        this.minElevation = minElevation;
        this.table = table;
        this.unit = unit;
        this.logo = logo;
        this.logoCannonPos = logoCannonPos;
        this.type = type;
        this.angleType = angleType;
        this.elevationPrecision = elevationPrecision;
    }

    /**
     * Return the weapon velocity
     * @param {number} [distance] - distance between mortar and target from getDist()
     * @returns {number} - Velocity of the weapon for said distance
     */
    getVelocity(distance) {
        if (!this.table) { return this.velocity; }

        // UB-32 estimations
        for (let i = 1; i < this.table.length; i += 1) {
            if (distance < this.table[i][0]) {
                return this.table[i - 1][1] + ((distance - this.table[i - 1][0]) / (this.table[i][0] - this.table[i - 1][0])) * (this.table[i][1] - this.table[i - 1][1]);
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

}


const weaponTypes = ["mortars", "vehicules", "frenchDLC"];

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
    [1500, 203.90654411707584],
    [1600, 230.9822908792792],
    [1700, 208.55735633285997],
    [1800, 207.5305459239776],
    [1900, 207.7886602381275],
    [2000, 208.8396419902778],
    [2050, 206.39437348683896],
    [2100, 205.87235893665985],
    [2143, 205.08642659737743],
];



export const WEAPONS = [
    new Weapon("Default", 109.890938, 1, 1580, undefined, "mil", classicLogo, "130%", "mortars", "high", 0),
    new Weapon("Hell Cannon", 95, 1, 90, undefined, "deg", hellcannonLogo, "130%", "mortars", "high", 1),
    new Weapon("Technical", 110, 1, 90, undefined, "deg", technicalLogo, "50%", "vehicules", "high", 1),
    new Weapon("BM-21 Grad", 200, 2, 0, undefined, "deg", mlrsLogo, "60%", "vehicules", "low", 1),
    new Weapon("Short", 109.890938, 1, 1520, undefined, "mil", frenchLogo, "135%", "frenchDLC", "high", 0),
    new Weapon("Medium", 143.5, 1, 1520, undefined, "mil", frenchLogo, "135%", "frenchDLC", "high", 0),
    new Weapon("Long", 171.5, 1, 1520, undefined, "mil", frenchLogo, "135%", "frenchDLC", "high", 0),
    new Weapon("UB-32", 0, 2, 999, UB32_table, "deg", ub32Logo, "55%", "vehicules", "low", 1),
];


/**
 * save current weapon into browser cache
 */
export function changeWeapon() {
    globalData.line.hide("none");
    const weapon = $(".dropbtn2").val();
    localStorage.setItem("data-weapon", weapon);
    globalData.activeWeapon = WEAPONS[weapon];
    $("#mortarImg").attr("src", globalData.activeWeapon.logo);
    drawLine();
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