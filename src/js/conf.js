/**
 * Global object holding current application state
 */
export var globalData = {
    activeWeapon: "",
    activeMap: "",
    angleTypePref: "",
    map: "",
    markersGroup: "",
    canvas: {
        obj: "",
        size: 500, //canvas size defined in plain html (not the css resize)
    },
    ui: true,
    debug: {
        active: true,
        DEBUG_MORTAR_COORD: "K0432",
        DEBUG_TARGET_COORD: "E1076",
    },
    gravity: 9.8,
    theme: "classic",
    line: "",
};