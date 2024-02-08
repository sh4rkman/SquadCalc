/**
 * Global object holding current application state
 */
export var globalData = {
    activeWeapon: "",
    activeMap: "",
    angleTypePref: "",
    minimap: "",
    mapScale: "",
    markersGroup: "",
    canvas: {
        obj: "",
        size: 500, //canvas size defined in plain html (not the css resize)
    },
    ui: true,
    debug: {
        active: false,
        DEBUG_MORTAR_COORD: "d048533",
        DEBUG_TARGET_COORD: "K059546",
    },
    gravity: 9.8,
    theme: "classic",
    line: "",
    userSettings: {
        keypadUnderCursor: true,
        spreadRadius: true,
        targetAnimation: true,
        weaponMinMaxRange: true,
        bearingOverDistance: false,
    }
};