/**
 * Global object holding current application state
 */
export var globalData = {
    activeWeapon: "",
    activeWeaponMarkers: "",
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
        active: false,
        DEBUG_MORTAR_COORD: "E0432",
        DEBUG_TARGET_COORD: "E0535",
    },
    gravity: 9.8,
    theme: "classic",
    line: "",
};