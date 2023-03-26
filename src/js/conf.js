/**
 * Activate Debug Mode (True/False)
 *    - Display canevas/Mortar/Target in plain html, 
 *    - Console is more chatty
 *    - Auto-enter coordinates
 */
export var globalData = {
    activeWeapon: "",
    activeMap: "",
    canvas: "",
    CANVAS_SIZE: 500, //canvas size defined in plain html (not the css resize)
    debug: {
        active: false,
        DEBUG_MORTAR_COORD: "A01-6",
        DEBUG_TARGET_COORD: "D01-4",
    },
    theme: "classic",
};