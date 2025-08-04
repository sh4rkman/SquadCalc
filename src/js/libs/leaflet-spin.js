// From https://github.com/makinacorpus/Leaflet.Spin

// leaflet-spin-esm.js
import { Map } from "leaflet";
import { Spinner } from "spin.js";

// Extend Leaflet's Map prototype with a .spin method
const SpinMapMixin = {
  spin(state, options) {
    if (state) {
      // Start spinning
      if (!this._spinner) {
        this._spinner = new Spinner(options).spin(this._container);
        this._spinning = 0;
      }
      this._spinning++;
    } else {
      // Stop spinning
      this._spinning--;
      if (this._spinning <= 0 && this._spinner) {
        this._spinner.stop();
        this._spinner = null;
      }
    }
  }
};

function SpinMapInitHook() {
  this.on("layeradd", function (e) {
    if (e.layer.loading) this.spin(true);
    if (typeof e.layer.on !== "function") return;

    e.layer.on("data:loading", () => this.spin(true), this);
    e.layer.on("data:loaded", () => this.spin(false), this);
  }, this);

  this.on("layerremove", function (e) {
    if (e.layer.loading) this.spin(false);
    if (typeof e.layer.on !== "function") return;

    e.layer.off("data:loaded");
    e.layer.off("data:loading");
  }, this);
}

// Inject mixin + init hook into Leaflet's Map class
Map.include(SpinMapMixin);
Map.addInitHook(SpinMapInitHook);

// Optional named export
export { SpinMapMixin, SpinMapInitHook };
