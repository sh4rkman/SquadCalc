import { globalData } from "./conf";

export default class SquadFiringSolution {

    constructor(targetLatLng, weaponLatLng) {
        this.weaponLatLng = weaponLatLng;
        this.targetLatLng = targetLatLng;
        this.activeWeapon = globalData.activeWeapon;
        this.distance = this.getDist();
        this.elevation = this.getElevation(0, 110);
    }


    /**
     * Draw a grid on canvas representing distances
     * @return {number} - distance in meter
     */
    getDist(){
        return Math.hypot(this.weaponLatLng.lat - this.targetLatLng.lat, this.weaponLatLng.lng - this.targetLatLng.lng);
    }

    /**
     * Calculates the angle the mortar needs to be set in order
     * to hit the target at the desired distance and vertical delta.
     * @param {number} [dist] - distance between mortar and target from getDist()
     * @param {number} [vDelta] - vertical delta between mortar and target from getHeight()
     * @param {number} [vel] - initial mortar projectile velocity
     * @returns {number || NaN} radian angle if target in range, NaN otherwise
    */
    getElevation(dist = 0, vDelta = 0, vel = 0) {
        var padding = 0;
        const GRAVITY = globalData.gravity * globalData.activeWeapon.gravityScale;
        const P1 = Math.sqrt(vel ** 4 - GRAVITY * (GRAVITY * dist ** 2 + 2 * vDelta * vel ** 2));
    
        if (globalData.activeWeapon.name==="Technical"){
            // The technical mortar is bugged : the ingame range metter is off by 5°
            // Ugly fix until OWI correct it
            padding = -0.0872665;
        }
    
        return padding + Math.atan((vel ** 2 - (P1 * globalData.activeWeapon.getAngleType())) / (GRAVITY * dist));
    }

}