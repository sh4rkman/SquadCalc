/**
 * Global object holding current application state
 */
export var globalData = {
    activeWeapon: "",
    activeMap: "",
    angleTypePref: "",
    canvas: {
        obj: "",
        size: 500, //canvas size defined in plain html (not the css resize)
    },
    debug: {
        active: false,
        DEBUG_MORTAR_COORD: "B03-4-5-3",
        DEBUG_TARGET_COORD: "C04-3",
    },
    gravity: 9.8,
    theme: "classic",
    line: "",
};