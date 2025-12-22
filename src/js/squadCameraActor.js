import { Marker, Icon, Browser, DomEvent } from "leaflet";
import tippy from "tippy.js";
import i18next from "i18next";
import "./libs/leaflet-rotatedMarker.js";


export const squadCameraActor = Marker.extend({

    options: {
        draggable: false,
        riseOnHover: false,
        keyboard: false,
        animate: true,
        zIndexOffset: -900
    },

    // Constructor
    initialize: function (latlng, camera, layer, options) {
        
        Marker.prototype.initialize.call(this, latlng, options);

        this.data = camera;
        this.layer = layer;
        this.tippy = "";

        this.setIcon(
            new Icon({
                iconUrl: "/api/v2/img/icons/shared/camera.webp",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                className: "vehSpawnIcon"
            })
        );

        this.setRotationAngle(camera.rotation_z);

        if (!Browser.mobile) {
            this.on("pointerover", this._handleOver, this);
            this.on("pointerout", this._handleOut, this);
        } else {
            this.on("click", this._handleOver, this);
        }

        // Catch this events and disable propagation
        this.on("contextmenu", this._handleContextMenu, this);
        this.on("dblclick", this._handleUnwantedActions, this);
        
    },


    open(event) {

        const el = event.target._icon;

        if (el._tippy) el._tippy.destroy();

        this.tippy = tippy(el, {
            delay: 200,
            placement: "top",
            sticky: true,
            duration: 0,
            allowHTML: true,
            interactive: true,
            theme: "spawnCards",
            appendTo: document.body,
            onHidden: (tip) => this._cleanup(tip),
            onShow: (tip) => this._onShow(tip),
        });


        // On mobile manually trigger without delay
        if (Browser.mobile) el._tippy.show();

    },

    hide() {
        this.removeFrom(this.layer.activeLayerMarkers);
    },

    show() {
        this.addTo(this.layer.activeLayerMarkers);
    },

    _onShow(tip) {
        this.tip = tip;

        // Disable System context menu on the tippy
        tip.popper.addEventListener("contextmenu", e => e.preventDefault());

        let html = `
            <div class='spawnGroupCard animate__animated animate__fadeIn animate__faster'>
                <div class="spawnTitle"><div class="spawnName">${i18next.t("common:respawnCamera")}</div></div>
                <div class="statsHolder">
                    <div class="rightClicToRemove">
                        <span> ${i18next.t("common:rightClicToRemove")}</span>
                    </div>
                </div>
                <img src="/api/v2/img/icons/shared/deathCam.webp"/>
            </div>
        `;
        
        this.tip.setContent(html);
    },



    _cleanup(tip) {
        if (tip._cleanup) tip._cleanup();
        tip.destroy();
    },


    _handleOver: function(event){
        this.open(event);
    },


    _handleOut(event) {
        const el = event.target._icon;
        if (el._tippy) el._tippy.hide();
    },

    _handleContextMenu(event) {
        DomEvent.preventDefault(event);

        // clean up tooltip if needed
        if (this.tippy && this.tippy.destroy) {
            this.tippy.destroy();
        }

        // remove marker from map
        this.remove();
        this.layer.cameraActor = null;
    },


    _handleUnwantedActions(event) {
        DomEvent.preventDefault(event);
        DomEvent.stopPropagation(event);
        return false;  
    }

});