/**
 * Canvas Size (in pixel)
 * It is NOT the canvas size rendered inside browser (set in scss)
 * but the canvas size set in plain html
 */
export const CANVAS_SIZE = 500;


/**
 * Activate Debug Mode (True/False)
 *    - Display canevas/Mortar/Target in plain html, 
 *    - Console is more chatty
 *    - Auto-enter coordinates
 */
export var globalData = {};
globalData.debug = {
    active: false,
    DEBUG_MORTAR_COORD: "B01",
    DEBUG_TARGET_COORD: "D01",
};


globalData.activeWeapon = "";
globalData.activeMap = "";
globalData.canvas = "";
globalData.theme = "classic";