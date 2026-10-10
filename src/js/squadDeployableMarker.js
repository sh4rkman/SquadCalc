import { Marker, DivIcon, Browser, DomEvent } from "leaflet";
import tippy from "tippy.js";
import { App } from "../app.js";


export const squadDeployableMarker = Marker.extend({

    options: {
        draggable: false,
        riseOnHover: false,
        keyboard: false,
        zIndexOffset: -1000,
        opacity: 0,
        iconSize: 30,
    },

    // Constructor
    initialize: function (latlng, asset, icon, options) {

        Marker.prototype.initialize.call(this, latlng, options);

        this.asset = asset;
        this.icon = icon;

        this.setIcon(
            new DivIcon({
                className: "deployables vehSpawnIcon",
                iconSize: [this.options.iconSize, this.options.iconSize]
            })
        );

        // DivIcon element is recreated on every add, so (re)apply the background each time
        this.on("add", () => {
            const el = this.getElement();
            if (el) el.style.backgroundImage = `url('/img/icons/default/deployables/${icon}.svg')`;
        });

        // Hover card on desktop only, on mobile the click dialog replaces it
        if (!Browser.mobile) {
            this.on("pointerover", this._handleOver, this);
            this.on("pointerout", this._handleOut, this);
        }
        this.on("click", this._handleClick, this);

        // Catch this events and disable propagation
        this.on("contextmenu", this._handleCtxMenu, this);
        this.on("dblclick", this._handleCtxMenu, this);
    },


    open(event) {
        const el = event.target._icon;
        if (el._tippy) el._tippy.destroy();

        tippy(el, {
            delay: 200,
            placement: "top",
            duration: 0,
            allowHTML: true,
            interactive: true,
            theme: "spawnCards",
            appendTo: document.body,
            onHidden: (tip) => this._cleanup(tip),
            onShow: (tip) => this._onShow(tip),
        });
    },


    getCardHTML() {
        return `
            <div class='spawnVehicleCard deployableCard animate__animated animate__fadeIn animate__faster'>
                <div class="vehTitle">
                    <div class="vehName">${this.asset.type}</div>
                    ${this.getFlagHTML()}
                </div>
                <img src="/img/deployables/${this.asset.type}.webp" onerror="this.onerror=null; this.src='/img/vehicles/placeholder.webp';"/>
            </div>
        `;
    },


    _onShow(tip) {
        this.tip = tip;

        // Disable System context menu on the tippy
        tip.popper.addEventListener("contextmenu", e => e.preventDefault());

        this.tip.setContent(this.getCardHTML());

        // The card only gets its height once the image is loaded (after the 404 fallback),
        // so recompute placement then, otherwise it never flips to the bottom
        tip.popper.querySelectorAll("img").forEach(img => {
            img.addEventListener("load", () => tip.popperInstance?.update());
        });
    },


    getFlagHTML() {
        const layer = App.minimap.layer;
        if (!layer?.factions || !App.userSettings.enableFactions || process.env.DISABLE_FACTIONS == "true") return "";

        // Neutral/unknown team deployables don't belong to a faction
        const selectors = { "Team One": layer.factions.FACTION1_SELECTOR, "Team Two": layer.factions.FACTION2_SELECTOR };
        const faction = selectors[this.asset.team]?.val();
        if (!faction) return "";

        return `<img class="vehFlag" src="/img/flags/${layer.modFolder}/${faction}.webp" onerror="this.onerror=null; this.src='/img/flags/unknown.webp';"/>`;
    },


    _cleanup(tip) {
        if (tip._cleanup) tip._cleanup();
        tip.destroy();
    },


    _handleOver(event) {
        // Markers are kept on the map with opacity 0 when hidden, don't show a card for those
        if (this.options.opacity === 0) return;
        this.open(event);
    },


    _handleClick(event) {
        if (this.options.opacity === 0) return;
        this._handleOut(event);
        App.openSpawnCardDialog(this.getCardHTML());
    },


    _handleOut(event) {
        const el = event.target._icon;
        if (el._tippy) el._tippy.hide();
    },


    _handleCtxMenu(event) {
        DomEvent.preventDefault(event);   // prevent browser menu
        DomEvent.stopPropagation(event);  // stop Leaflet listeners
        return false;
    }

});
