/* Leaflet EdgeBuffer Plugin
 * https://github.com/bbecquet/Leaflet.RotatedMarker
 * (MIT) Copyright (c) 2015 Benjamin Becquet
 * 
 * edited by Maxime "sharkman" Boussard for leaflet v2.0
 */

import { Marker } from "leaflet";

(function() {
    const proto_initIcon = Marker.prototype._initIcon;
    const proto_setPos = Marker.prototype._setPos;

    Marker.addInitHook(function () {
        const iconOptions = this.options.icon && this.options.icon.options;
        const iconAnchor = iconOptions && iconOptions.iconAnchor;

        this.options.rotationOrigin = this.options.rotationOrigin ||
            (iconAnchor ? iconAnchor[0] + "px " + iconAnchor[1] + "px" : "center bottom");
        this.options.rotationAngle = this.options.rotationAngle || 0;

        this.on("drag", () => this._applyRotation());
    });

    Marker.include({
        _initIcon: function() {
            proto_initIcon.call(this);
            this._applyRotation();
        },

        _setPos: function (pos) {
            proto_setPos.call(this, pos);
            this._applyRotation();
        },

        _applyRotation: function () {
            if (!this._icon) return;

            if (this.options.rotationAngle) {
                this._icon.style.transformOrigin = this.options.rotationOrigin;

                // Keep Leaflet's translate3d and add rotation
                const transform = this._icon.style.transform || "";
                const translate = transform.match(/translate3d\([^)]+\)/);

                this._icon.style.transform = 
                    (translate ? translate[0] : "") + 
                    ` rotateZ(${this.options.rotationAngle}deg)`;
            }
        },

        setRotationAngle: function(angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },

        setRotationOrigin: function(origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
})();