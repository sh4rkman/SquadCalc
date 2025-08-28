import { Marker, Icon, Browser, DomEvent } from "leaflet";
import tippy, {sticky} from "tippy.js";
import i18next from "i18next";
import "./libs/leaflet-rotatedMarker.js";


export const squadVehicleMarker = Marker.extend({

    options: {
        draggable: false,
        riseOnHover: false,
        keyboard: false,
        animate: true,
        zIndexOffset: -1000
    },

    // Constructor
    initialize: function (latlng, spawner, vehicle, faction, dedicatedSpawn, options) {
        
        Marker.prototype.initialize.call(this, latlng, options);

        this.spawner = spawner;
        this.vehicle = vehicle;
        this.dedicatedSpawn = dedicatedSpawn;
        this.faction = faction;

        this.setIcon(
            new Icon({
                iconUrl: `${process.env.API_URL}/img/icons/ally/vehicles/${vehicle.icon}.webp`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                className: "vehSpawnIcon"
            }));

        this.setRotationAngle(spawner.rotation_z + 90);
        

        if (!Browser.mobile) {
            this.on("pointerover", this._handleOver, this);
            this.on("pointerout", this._handleOut, this);
        } else {
            this.on("click", this._handleOver, this);
        }

        this.on("contextmenu", this._handleCtxMenu, this);
        
    },
   

    open(event) {
        const el = event.target._icon;
        if (el._tippy) el._tippy.destroy();

        tippy(el, {
            trigger: "manual",
            delay: 200,
            placement: "top",
            sticky: true,
            plugins: [sticky],
            duration: 0,
            allowHTML: true,
            interactive: true,
            theme: "spawnCards",
            appendTo: document.body,
            onHidden: (tip) => this._cleanup(tip),
            onShow: (tip) => this._onShow(tip),
        });

        el._tippy.show();
    },


    _onShow(tip) {
        this.tip = tip;
     
        // Disable System context menu on the tippy
        tip.popper.addEventListener("contextmenu", e => e.preventDefault());

        let dedicatedSpawnInfo;

        if (this.dedicatedSpawn) dedicatedSpawnInfo = `<div class='dedicatedSpawn'>${i18next.t("dedicactedSpawn", { ns: "common" })}</div>`;
        else dedicatedSpawnInfo = `<div class='dedicatedSpawn warning'>${i18next.t("randomSpawn", { ns: "common" })}</div>`;

        let delayInfo = "";

        if (this.vehicle.delay > 0) {
            delayInfo = `
            <div class="delay">
                <span >
                    <span data-i18n="common:delayed">${i18next.t("common:delayed")}</span>
                    : ${this.vehicle.delay}<span data-i18n="common:min">${i18next.t("common:min")}</span>
                </span>
            </div>
            `;
        }

        let html = `
            <div class='spawnVehicleCard animate__animated animate__fadeIn animate__faster'>
                <div class="vehTitle">
                    <div class="vehName">${i18next.t(this.vehicle.type, { ns: "vehicles" })}</div>
                    <img class="vehFlag" src="${process.env.API_URL}/img/flags/${this.faction}.webp" class="img-flag" />
                </div>
                <div class="respawn">
                    <span>${i18next.t("common:respawn")}</span> : ${this.vehicle.respawnTime} <span>${i18next.t("common:min")}</span>
                </div>
                ${delayInfo}
                ${dedicatedSpawnInfo}
                <img src="${process.env.API_URL}/img/vehicles/${this.vehicle.type}.webp" onerror="this.onerror=null; this.src='${process.env.API_URL}/img/vehicles/placeholder.webp';"/>
            </div>
        `;
        
        this.tip.setContent(html);
    },


    _cleanup(tip) {
        if (tip._cleanup) tip._cleanup();
        tip.destroy();
    },


    /**
     * dqsdqsdqsdqsdqd
     * @param {event} [event] - event
     * @returns {event} - sfsdfsdfsdfsd
     */
    _handleOver: function(event){
        this.open(event);
    },


    _handleOut(event) {
        const el = event.target._icon;
        if (el._tippy) {
            el._tippy.hide();
        }
    },

    _handleCtxMenu(event) {
        DomEvent.preventDefault(event);   // prevent browser menu
        DomEvent.stopPropagation(event);  // stop Leaflet listeners
        return false;  
    }

});