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

        let html = `
            <div class='spawnVehicleCard animate__animated animate__fadeIn animate__faster'>

                <div class="vehTitle">
                    <div class="vehName">${i18next.t(this.vehicle.type, { ns: "vehicles" })}</div>
                    <img class="vehFlag" src="${process.env.API_URL}/img/flags/${this.faction}.webp" class="img-flag" />
                </div>

                <div class="statsHolder">
                    ${this.getTicketsHTML()}
                    ${this.getRespawnHTML()}
                    ${this.getLocationHTML()}
                    ${this.getDelayHTML()}
                </div>

                ${this.getTagsHTML()}
                <img src="${process.env.API_URL}/img/vehicles/${this.vehicle.type}.webp" onerror="this.onerror=null; this.src='${process.env.API_URL}/img/vehicles/placeholder.webp';"/>
            </div>
        `;
        
        this.tip.setContent(html);
    },


    getTagsHTML() {
        const tags = [];
        let totalSeats = this.vehicle.passengerSeats + this.vehicle.driverSeats;
        tags.push(`<img src="${process.env.API_URL}/img/icons/shared/passenger.webp" alt="ATGM"><div class="passengers">${totalSeats}</div>`);
        if (this.vehicle.isAmphibious) tags.push(`<img src="${process.env.API_URL}/img/icons/shared/amphibious.webp" alt="Amphibious">`);
        if (this.vehicle.ATGM) tags.push(`<img src="${process.env.API_URL}/img/icons/shared/ATGM.webp" alt="ATGM">`);

        return `
            <div class="tags">
                ${tags.map(tag => `<div class="tag">${tag}</div>`).join("")}
            </div>
        `;
    },


    getLocationHTML() {
        const warning = this.dedicatedSpawn ? "" : "warning";
        const spawnKey = this.dedicatedSpawn ? "dedicactedSpawn" : "randomSpawn";
        const dedicatedSpawnInfo = `<span class="dedicatedSpawn">${i18next.t(spawnKey, { ns: "common" })}</span>`;

        return `
            <span class="locationHolder ${warning}">
                <span class="location-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <!--!Font Awesome Free v7.0.0 by @fontawesome -->
                        <path d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z"/>
                    </svg>
                </span>
                ${dedicatedSpawnInfo}
            </span>
        `;
    },



    getTicketsHTML() {
        if (!this.vehicle.ticketValue) return "";
        const oneOrMoreTickets = this.vehicle.ticketValue === 1 ? "ticket" : "tickets";
        return `
            <span class="ticketHolder">
                <span class="ticket-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M96 128C60.7 128 32 156.7 32 192L32 256C32 264.8 39.4 271.7 47.7 274.6C66.5 281.1 80 299 80 320C80 341 66.5 358.9 47.7 365.4C39.4 368.3 32 375.2 32 384L32 448C32 483.3 60.7 512 96 512L544 512C579.3 512 608 483.3 608 448L608 384C608 375.2 600.6 368.3 592.3 365.4C573.5 358.9 560 341 560 320C560 299 573.5 281.1 592.3 274.6C600.6 271.7 608 264.8 608 256L608 192C608 156.7 579.3 128 544 128L96 128zM448 400L448 240L192 240L192 400L448 400zM144 224C144 206.3 158.3 192 176 192L464 192C481.7 192 496 206.3 496 224L496 416C496 433.7 481.7 448 464 448L176 448C158.3 448 144 433.7 144 416L144 224z"/></svg>
                </span>
                <span class="ticket">
                    ${this.vehicle.ticketValue} ${i18next.t("common:"+oneOrMoreTickets)}
                </span>
            </span>
        `;
    },

    getRespawnHTML() {
        if (!this.vehicle.respawnTime) return "";

        let html = `<span>${this.vehicle.respawnTime} ${i18next.t("common:min")}</span>`;
        if (this.vehicle.singleUse) html = "<span>—</span>";

        return `
            <span class="respawnHolder${this.vehicle.singleUse ? " warning" : ""}">
                <span class="respawn-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"/></svg>
                </span>
                ${html}
            </span>
        `;
    },

    getDelayHTML() {
        if (this.vehicle.delay == 0 || !this.vehicle.delay) return "";
        return `
            <div class="delayHolder">
                <span class="delay-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M256 0c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-29.3C378.8 81.9 448 160.9 448 256c0 106-86 192-192 192S64 362 64 256c0-53.7 22-102.3 57.6-137.1c12.6-12.4 12.8-32.6 .5-45.3S89.5 60.8 76.8 73.1C29.5 119.6 0 184.4 0 256C0 397.4 114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM193 159c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l80 80c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80z"/>
                    </svg>
                </span>
                <span> ${this.vehicle.delay} ${i18next.t("common:min")} </span>
            </div>
        `;
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