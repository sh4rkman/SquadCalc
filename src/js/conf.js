/**
 * Global object holding current application state
 */
export var App = {
    activeWeapon: "",
    activeMap: "",
    minimap: "",
    mapSize: 255,
    canvas: {
        obj: "",
        size: 1000, //canvas size defined in plain html (not the css resize)
    },
    ui: true,
    debug: {
        active: false,
        DEBUG_MORTAR_COORD: "",
        DEBUG_TARGET_COORD: "",
    },
    gravity: 9.78,
    line: "",
    userSettings: {
        keypadUnderCursor: true,
        spreadRadius: true,
        targetAnimation: true,
        weaponMinMaxRange: true,
        bearingOverDistance: false,
    }
};

