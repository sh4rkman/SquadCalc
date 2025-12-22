import tippy, {sticky} from "tippy.js";
import i18next from "i18next";

export class FactionCtxMenu {
    constructor(layer, flagName) {
        this.layer = layer;
        this.flagName = flagName;
        this.tip = null;
    }

    open(e) {
        const el = e.target._icon;
        if (el._tippy) el._tippy.destroy();

        tippy(el, {
            trigger: "manual",
            placement: "top",
            sticky: true,
            plugins: [sticky],
            duration: 0,
            allowHTML: true,
            interactive: true,
            theme: "mapFactionMenu",
            appendTo: document.body, // Avoid handling mouse events to the map
            onHidden: (tip) => this._cleanup(tip),
            onShow: (tip) => this._onShow(tip)
        });

        el._tippy.show();
    }

    _cleanup(tip) {
        if (tip._cleanup) tip._cleanup();
        tip.destroy();
    }

    _onShow(tip) {
        this.tip = tip;
        const isTeam1 = this.flagName === "00-Team1 Main";
        this.FACTIONS = isTeam1 ? this.layer.layerData.teamConfigs.factions.team1Units : this.layer.layerData.teamConfigs.factions.team2Units;
        this.UNITS = isTeam1 ? this.layer.layerData.units.team1Units : this.layer.layerData.units.team2Units;
        this.FACTION_SELECTOR = isTeam1 ? this.layer.factions.FACTION1_SELECTOR : this.layer.factions.FACTION2_SELECTOR;
        this.UNIT_SELECTOR = isTeam1 ? this.layer.factions.UNIT1_SELECTOR : this.layer.factions.UNIT2_SELECTOR;

        // Disable System context menu on the tippy
        tip.popper.addEventListener("contextmenu", e => e.preventDefault());

        this.openFactionsCtxMenu();

    }

    openUnitsCtxMenu(factionId) {
        let html = "<div class='faction-grid animate__animated animate__fadeIn animate__faster'>";
        
        if (this.FACTION_SELECTOR.val() != factionId) {
            if (this.flagName === this.layer.factions.pinnedFaction) this.layer.factions.unpinUnit();
            this.FACTION_SELECTOR.val(factionId).trigger($.Event("change", { broadcast: true }));
        }

        this.FACTIONS.forEach(faction => {
            if (faction.factionID === factionId) {
                const unitsToShow = [faction.defaultUnit, ...faction.types.map(t => t.unit)];
                unitsToShow.forEach(unitId => {
                    const unit = this.UNITS.find(u => u.unitObjectName === unitId);
                    if (!unit) return;

                    const selected = this.UNIT_SELECTOR.val() === unitId ? "_selected" : "";
                    html += `<div class="faction-item units ${selected}" id="${unit.unitObjectName}" title="${i18next.t(unit.type, { ns: "units" })} - ${i18next.t(unit.displayName, { ns: "units" })}">
                        <img 
                            src="/img/units/${unit.unitIcon}.webp" 
                            onerror="this.onerror=null; this.src='/img/units/placeholder.webp';"
                        />
                        <div class="faction-label">${i18next.t(unit.type, { ns: "units" })}</div>
                    </div>`;
                });
            }
        });

        html += `</div>
        <div id="mapCtxButtonsContainer">
            <button id="backToFactionsBtn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M177.5 446c-8.8 3.8-19 2-26-4.6l-144-136C2.7 300.9 0 294.6 0 288s2.7-12.9 7.5-17.4l144-136c7-6.6 17.2-8.4 26-4.6s14.5 12.5 14.5 22l0 88 192 0c17.7 0 32-14.3 32-32l0-144c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 144c0 70.7-57.3 128-128 128l-192 0 0 88c0 9.6-5.7 18.2-14.5 22z"/>
                </svg>
            </button>
            <button id="mapPinButton">${i18next.t("common:pinToMap")}</button>
        </div>`;

        this.tip.setContent(html);

        // If that unit is already pinned, set the button to "pinned"
        if (this.layer.factions.pinned && this.flagName === this.layer.factions.pinnedFaction) {
            $("#mapPinButton").addClass("active").text(i18next.t("common:pinned")).attr("data-i18n", "common:pinned");
        }

        this._attachUnitHandlers();
    }

    openFactionsCtxMenu() {
        let html = "<div class='faction-grid animate__animated animate__fadeIn animate__faster'>";
        this.FACTIONS.forEach(faction => {
            const selected = this.FACTION_SELECTOR.val() === faction.factionID ? "_selected" : "";
            html += `<div class="faction-item ${selected}" id="${faction.factionID}" title="${i18next.t(faction.factionID + "_displayName", { ns: "factions" })}">
                <img src="/img/flags/${faction.factionID}.webp"/>
                <div class="faction-label">${i18next.t(faction.factionID, { ns: "factions" })}</div>
            </div>`;
        });
        html += "</div>";

        this.tip.setContent(html);

        const items = this.tip.popper.querySelectorAll(".faction-item");
        items.forEach(item => {
            item.addEventListener("click", ev => this._handleFactionClick(ev));
            item.addEventListener("contextmenu", ev => { this._handleFactionCtxMenu(ev); });
        });

        this.tip._cleanup = () => {
            items.forEach(item => {
                item.removeEventListener("click", this._handleFactionClick);
                item.removeEventListener("contextmenu", this._handleFactionCtxMenu);
            }); 
        };
    }

    _handleFactionClick(event) {
        this.openUnitsCtxMenu(event.currentTarget.id);
    }


    _handleFactionCtxMenu(event){
        if ($(event.currentTarget).hasClass("_selected")){
            $(event.currentTarget).removeClass("_selected");
            this.FACTION_SELECTOR.val("").trigger($.Event("change", { broadcast: true }));
        } 
    }


    _handleUnitCtxMenu(event){
        if ($(event.currentTarget).hasClass("_selected")){
            $(event.currentTarget).removeClass("_selected");
            this.UNIT_SELECTOR.val("").trigger($.Event("change", { broadcast: true }));
        } 
    }

    
    _attachUnitHandlers() {
        const tip = this.tip;
        const unitItems = tip.popper.querySelectorAll(".faction-item.units");
        const pinButton = tip.popper.querySelector("#mapPinButton");
        const backButton = tip.popper.querySelector("#backToFactionsBtn");

        const handleClickUnit = (ev) => {
            const unitId = ev.currentTarget.id;
            if (this.UNIT_SELECTOR.val() !== unitId) {
                if (this.flagName === this.layer.factions.pinnedFaction) this.layer.factions.unpinUnit();
                tip.popper.querySelectorAll(".faction-item.units._selected").forEach(item => item.classList.remove("_selected"));
                ev.currentTarget.classList.add("_selected");
                pinButton.classList.remove("active");
                pinButton.textContent = i18next.t("common:pinToMap");
                this.UNIT_SELECTOR.val(unitId).trigger($.Event("change", { broadcast: true }));
            }
        };

        const handleClickPin = (ev) => {
            const $btn = $(ev.currentTarget);
            if ($btn.hasClass("active")) {
                this.layer.factions.unpinUnit();
                $btn.removeClass("active").text(i18next.t("common:pinToMap"));
            } else {
                this.layer.factions.pinUnit(this.UNITS, this.FACTION_SELECTOR.val(), this.UNIT_SELECTOR.val(), this.flagName);
                $btn.addClass("active").text(i18next.t("common:pinned"));
                //tip.hide();
            }
        };

        const handleClickBack = () => this.openFactionsCtxMenu();

        unitItems.forEach(item => {
            item.addEventListener("click", handleClickUnit);
            item.addEventListener("contextmenu", ev => { this._handleUnitCtxMenu(ev); });
        });

        pinButton.addEventListener("click", handleClickPin);
        backButton.addEventListener("click", handleClickBack);

        const prevCleanup = tip._cleanup;
        tip._cleanup = () => {
            unitItems.forEach(item => item.removeEventListener("click", handleClickUnit));
            pinButton.removeEventListener("click", handleClickPin);
            backButton.removeEventListener("click", handleClickBack);
            if (prevCleanup) prevCleanup();
        };
    }
}