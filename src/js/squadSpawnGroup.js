import { Marker, Icon, Browser, DomEvent } from "leaflet";
import tippy from "tippy.js";
import i18next from "i18next";


export const squadSpawnGroup = Marker.extend({

    options: {
        draggable: false,
        riseOnHover: false,
        keyboard: false,
        animate: true,
        zIndexOffset: -900
    },

    // Constructor
    initialize: function (latlng, spawnGroup, layer, options) {
        
        Marker.prototype.initialize.call(this, latlng, options);

        this.data = spawnGroup;
        this.layer = layer;
        this.temporary = spawnGroup.initialLifeSpan !== 0;
        this.spawningEnabled = this.data.spawningEnabled;
        this.tippy = "";

        this.setIcon(
            new Icon({
                iconUrl: `${process.env.API_URL}/img/icons/ally/deployables/mainspawn.webp`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                className: "vehSpawnIcon"
            }));

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


    _onShow(tip) {
        this.tip = tip;
        
        let team, teamName;

        if (this.data.team === "Team One" || this.data.team === "Team Neutral") {
            if (this.layer.factions.FACTION1_SELECTOR.val()) {
                team = this.layer.factions.FACTION1_SELECTOR.val();
                teamName = i18next.t(`factions:${this.layer.factions.FACTION1_SELECTOR.val()}`);
            } 
            else {
                team = "Team1";
                teamName = i18next.t("common:team1");
            }
        } 
        else {
            if (this.layer.factions.FACTION2_SELECTOR.val()) {
                team = this.layer.factions.FACTION2_SELECTOR.val();
                teamName = i18next.t(`factions:${this.layer.factions.FACTION2_SELECTOR.val()}`);
            } 
            else {
                team = "Team2";
                teamName = i18next.t("common:team2");
            }
        }

        // Disable System context menu on the tippy
        tip.popper.addEventListener("contextmenu", e => e.preventDefault());

        let spawnName = i18next.t("common:spawn");
        if (this.temporary) spawnName = `${i18next.t("common:temporary")} ${spawnName}`;

        let html = `
            <div class='spawnGroupCard animate__animated animate__fadeIn animate__faster'>
                <div class="spawnTitle"><div class="spawnName">${teamName} ${spawnName}</div></div>
                <div class="statsHolder">
                    ${this.getDelayHTML()}
                    ${this.getSpawningEnabledHTML()}
                </div>
                <img src="${process.env.API_URL}/img/spawnGroup/${team}.webp"/>
            </div>
        `;
        
        this.tip.setContent(html);
    },


    getDelayHTML() {

        if (!this.temporary || !this.data.initialLifeSpan) return "";

        let secondsToMinute = this.data.initialLifeSpan / 60;

        return `
            <div class="spawnDelayHolder">
                <span class="spawn-delay-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M256 0c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-29.3C378.8 81.9 448 160.9 448 256c0 106-86 192-192 192S64 362 64 256c0-53.7 22-102.3 57.6-137.1c12.6-12.4 12.8-32.6 .5-45.3S89.5 60.8 76.8 73.1C29.5 119.6 0 184.4 0 256C0 397.4 114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM193 159c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l80 80c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80z"/>
                    </svg>
                </span>
                <span> ${secondsToMinute}${i18next.t("common:mn")}</span>
            </div>
        `;
    },


    getSpawningEnabledHTML() {

        if (this.spawningEnabled) return "";

        return `
            <div class="spawnDelayHolder">
                <span class="spawn-delay-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path d="M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L504.5 470.8C507.2 468.4 509.9 466 512.5 463.6C559.3 420.1 590.6 368.2 605.5 332.5C608.8 324.6 608.8 315.8 605.5 307.9C590.6 272.2 559.3 220.2 512.5 176.8C465.4 133.1 400.7 96.2 319.9 96.2C263.1 96.2 214.3 114.4 173.9 140.4L73 39.1zM236.5 202.7C260 185.9 288.9 176 320 176C399.5 176 464 240.5 464 320C464 351.1 454.1 379.9 437.3 403.5L402.6 368.8C415.3 347.4 419.6 321.1 412.7 295.1C399 243.9 346.3 213.5 295.1 227.2C286.5 229.5 278.4 232.9 271.1 237.2L236.4 202.5zM357.3 459.1C345.4 462.3 332.9 464 320 464C240.5 464 176 399.5 176 320C176 307.1 177.7 294.6 180.9 282.7L101.4 203.2C68.8 240 46.4 279 34.5 307.7C31.2 315.6 31.2 324.4 34.5 332.3C49.4 368 80.7 420 127.5 463.4C174.6 507.1 239.3 544 320.1 544C357.4 544 391.3 536.1 421.6 523.4L357.4 459.2z"/>
                    </svg>
                </span>
                <span> ${i18next.t("common:disabledSpawn")}</span>
            </div>
        `;
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

        if (!this.temporary) return; 

        // clean up tooltip if needed
        if (this.tippy && this.tippy.destroy) {
            this.tippy.destroy();
        }

        this.removeNearAmmocrates(20);

        // remove marker from map
        this.remove();

    },



    removeNearAmmocrates(searchDistance){
        const nearbyAssets = [];
        const spawnLatLng = this.getLatLng();

        // Looking for Ammocrates near the spawn
        this.layer.mainZones.ammocrates.forEach(asset => {
            const assetPoint = asset.getLatLng();
            const latDelta = (assetPoint.lat - spawnLatLng.lat) * -this.layer.map.mapToGameScale;
            const lngDelta = (assetPoint.lng - spawnLatLng.lng) * this.layer.map.mapToGameScale;
            const dist = Math.hypot(latDelta, lngDelta);
            if (dist < searchDistance) { nearbyAssets.push(asset); }
        });

        // Remove the found ammobox;
        nearbyAssets.forEach(asset => { asset.remove(); });
    },



    _handleUnwantedActions(event) {
        DomEvent.preventDefault(event);
        DomEvent.stopPropagation(event);
        return false;  
    }

});