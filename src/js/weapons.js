import { App } from "./conf";
import { drawLine } from "./animations";
import { shoot } from "./utils";

import classicLogo from "../img/icons/mortar.png";
import hellcannonLogo from "../img/icons/hellcannon_white.png";
import ub322Logo from "../img/icons/ub32_deployable.png";
import technicalLogo from "../img/icons/technical_mortar_white.png";
import mlrsLogo from "../img/icons/mlrs_white.png";
import ub32Logo from "../img/icons/ub32_white.png";
import m113Logo from "../img/icons/m113a3_white.png";

import { mortarIcon, hellIcon, ub32Icon, tMortarIcon, tub32Icon, gradIcon, m121Icon} from "./squadIcon";

/* eslint no-unused-vars: "off" */
import target from "../img/icons/target.png";




export class Weapon {
    constructor(name, velocity, gravityScale, minElevation, unit, logo, marker, logoCannonPos, type, angleType, elevationPrecision, minDistance, moa, damageSpash) {
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
        this.damageSpash = damageSpash;
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


const weaponTypes = ["deployables", "vehicles",];

const UB32_table = [
    [100,  334.7778886114855],
    [200, 305.6459342280165],
    [300, 283.0585190456855],
    [400, 269.15585935988156],
    [500, 268.4445467197605],
    [600, 241.58938992870094],
    [700, 230.00396877923583],
    [800, 227.48886673532039],
    [900, 226.87144522938755],
    [1000, 219.29451804327465],
    [1100, 217.69947684093455],
    [1200, 213.47910836403614],
    [1300, 217.24714731055712],
    [1400, 215.84356249799185],
    [1500, 213.64675771020842],
    [1600, 210.37877185692568],
    [1700, 208.344434014631],
    [1800, 207.3186719065925],
    [1900, 207.57652270427334],
    [2000, 208.62643147834694],
    [2050, 206.18365942119797],
    [2100, 205.6621778109742],
    [2143, 204.87704785305388],
];



export const WEAPONS = [
    new Weapon("Mortar", 110, 1, [800, 1579], "mil", classicLogo, mortarIcon, "130%", "deployables", "high", 0, 51, 50),
    new Weapon("UB-32", UB32_table, 2, [-25, 35], "deg", ub322Logo, ub32Icon, "110%", "deployables", "low", 1, 0, 300),
    new Weapon("Hell Cannon", 95, 1, [10, 85], "deg", hellcannonLogo, hellIcon, "130%", "deployables", "high", 1, 160, 100),
    new Weapon("Tech. Mortar", 110, 1, [-45, 135], "deg", technicalLogo,  tMortarIcon, "50%", "vehicles", "high", 1, 51, 50),
    new Weapon("Tech. UB-32", UB32_table, 2, [-45, 135], "deg", ub32Logo, tub32Icon, "55%", "vehicles", "low", 1, 0, 300),
    new Weapon("BM-21 Grad", 200, 2, [-45, 135], "deg", mlrsLogo, gradIcon, "60%", "vehicles", "low", 1, 0, 200),
    new Weapon("M1064 M121", 142, 1, [45, 85.3], "deg", m113Logo, m121Icon, "45%", "vehicles", "high", 1, 340, 50),
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

    if (App.ui === 0) { drawLine(); }

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