import Snow from "./libs/pure-snow.js";

/**
 * Seasonal snow overlay - loader screen (#snow1) and idle map background (#snow2) only,
 * never over the live leaflet map. Toggled by the "xmasTheme" setting.
 */
export default class SquadXmas {
    constructor(app) {
        this.app = app;
        this.snow1 = null;
        this.snow2 = null;
        this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    init() {
        if (this.app.userSettings.xmasTheme) this.enable();
    }

    enable() {
        document.body.classList.add("xmas-theme");

        if (this.reducedMotion) return;

        if (!this.snow1) this.snow1 = new Snow("#snow1");
        if (!this.snow2) this.snow2 = new Snow("#snow2");

        this.snow1.create();
        this.snow1.show();
        this.snow2.create();
        this.snow2.show();
    }

    disable() {
        document.body.classList.remove("xmas-theme");
        this.snow1?.destroy();
        this.snow2?.destroy();
        this.snow1 = null;
        this.snow2 = null;
    }
}
