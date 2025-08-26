/* Leaflet Spin Plugin - v2.0 Compatible */

import { LeafletMap } from "leaflet";
import { Spinner } from "spin.js";
import "spin.js/spin.css";

var SpinMapMixin = {
    spin: function (state, options) {
        if (state) {
            // start spinning !
            if (!this._spinner) {
                this._spinner = new Spinner(options)
                    .spin(this._container);
                this._spinning = 0;
            }
            this._spinning++;
        }
        else {
            this._spinning--;
            if (this._spinning <= 0) {
                // end spinning !
                if (this._spinner) {
                    this._spinner.stop();
                    this._spinner = null;
                }
            }
        }
    }
};

var SpinMapInitHook = function () {
    this.on("layeradd", function (e) {
        // If added layer is currently loading, spin !
        if (e.layer.loading) this.spin(true);
        if (typeof e.layer.on !== "function") return;
        e.layer.on("data:loading", function () {
            this.spin(true);
        }, this);
        e.layer.on("data:loaded",  function () {
            this.spin(false);
        }, this);
    }, this);
    this.on("layerremove", function (e) {
        // Clean-up
        if (e.layer.loading) this.spin(false);
        if (typeof e.layer.on !== "function") return;
        e.layer.off("data:loaded");
        e.layer.off("data:loading");
    }, this);
};

// Apply to Map prototype (replaces L.Map.include)
Object.assign(LeafletMap.prototype, SpinMapMixin);

// Add init hook (replaces L.Map.addInitHook)
const originalInitialize = LeafletMap.prototype.initialize;
LeafletMap.prototype.initialize = function(id, options) {
    const result = originalInitialize.call(this, id, options);
    SpinMapInitHook.call(this);
    return result;
};

export default SpinMapMixin;