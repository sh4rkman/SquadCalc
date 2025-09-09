
import { App } from "../app.js";
import { DivIcon } from "leaflet";
import { animateCSS } from "./animations.js";
import i18next from "i18next";
import { squadVehicleMarker } from "./squadVehicleMarker.js";
import tippy from "tippy.js";

export default class SquadFactions {

    /**
     * * @param {Object} layerData - The layer data object containing the factions and units
     * * @param {SquadLayer} squadLayer - The SquadLayer object containing the main icons
     * */
    constructor(squadLayer) {
        this.squadLayer = squadLayer;
        this.FACTION1_SELECTOR = $(".dropbtn8");
        this.FACTION2_SELECTOR = $(".dropbtn10");
        this.UNIT1_SELECTOR = $(".dropbtn9");
        this.UNIT2_SELECTOR = $(".dropbtn11");
        this.init(squadLayer.layerData);
        this.initDropdowns();
        this.pinned = false;
        this.pinnedFaction = "";
    }


    /*
     *  Reset the factions button to its default state
     */
    resetFactionsButton() {
        $("#factionsButton button").empty().append(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                <path fill="currentColor" d="M176 8c-6.6 0-12.4 4-14.9 10.1l-29.4 74L55.6 68.9c-6.3-1.9-13.1 .2-17.2 5.3s-4.6 12.2-1.4 17.9l39.5 69.1L10.9 206.4c-5.4 3.7-8 10.3-6.5 16.7s6.7 11.2 13.1 12.2l78.7 12.2L90.6 327c-.5 6.5 3.1 12.7 9 15.5s12.9 1.8 17.8-2.6l35.3-32.5 9.5-35.4 10.4-38.6c8-29.9 30.5-52.1 57.9-60.9l41-59.2c11.3-16.3 26.4-28.9 43.5-37.2c-.4-.6-.8-1.2-1.3-1.8c-4.1-5.1-10.9-7.2-17.2-5.3L220.3 92.1l-29.4-74C188.4 12 182.6 8 176 8zM367.7 161.5l135.6 36.3c6.5 1.8 11.3 7.4 11.8 14.2l4.6 56.5-201.5-54 32.2-46.6c3.8-5.6 10.8-8.1 17.3-6.4zm-69.9-30l-47.9 69.3c-21.6 3-40.3 18.6-46.3 41l-10.4 38.6-16.6 61.8-8.3 30.9c-4.6 17.1 5.6 34.6 22.6 39.2l15.5 4.1c17.1 4.6 34.6-5.6 39.2-22.6l8.3-30.9 247.3 66.3-8.3 30.9c-4.6 17.1 5.6 34.6 22.6 39.2l15.5 4.1c17.1 4.6 34.6-5.6 39.2-22.6l8.3-30.9L595 388l10.4-38.6c6-22.4-2.5-45.2-19.6-58.7l-6.8-84c-2.7-33.7-26.4-62-59-70.8L384.2 99.7c-32.7-8.8-67.3 4-86.5 31.8zm-17 131a24 24 0 1 1 -12.4 46.4 24 24 0 1 1 12.4-46.4zm217.9 83.2A24 24 0 1 1 545 358.1a24 24 0 1 1 -46.4-12.4z"/>
            </svg>
        `);
    }


    /**
     * * Format the factions for the select2 results and options
     * * @param {Object} state - The select2 state object
     * * @param {boolean} isSelection - Whether the state is a result (true) or an option (false)
     * */
    formatFactions(state, isSelection = false) {
        if (!state.id) return state.text;
        const imgHtml = `<img src="${process.env.API_URL}/img/flags/${state.element.value}.webp" class="img-flag" />`;
        if (isSelection) return $(`<span class="countryFlags" title="${i18next.t(state.element.value + "_displayName", { ns: "factions" }) }">${imgHtml}</span>`);
        return $(`
            <span class="countryFlags" title="${i18next.t(state.element.value + "_displayName", { ns: "factions" }) }">
                <p>${imgHtml}</p>
                <span class="flag-label">${i18next.t("factions:" + state.element.value)}</span>
            </span>
        `);
    }


    /**
     * * Format the units for the select2 results and options
     * * * @param {Object} state - The select2 state object
     * * * @param {boolean} isSelection - Whether the option is a result (true) or an option (false)
     * */
    formatUnits(state, isSelection = false) {
        if (!state.id) return state.text;
        const $element = $(state.element);
        const type = $element.data("type");
        const name = $element.data("name");
        return $(`
            <div class="unit-option">
                <img src="${process.env.API_URL}/img/units/${type}.webp" class="unit-logo${isSelection ? " selection" : ""}" alt="${state.text}" />
                <div class="unit-texts">
                    <div class="unit-type">${i18next.t(type, { ns: "units" })}</div>
                    ${isSelection ? "" : `<div class="unit-name">${i18next.t(name, { ns: "units" })}</div>`}
                </div>
            </div>
        `);
    }

    /**
     * * * Pin the selected unit to the map and start a timer for its respawn time
     * * @param {Array} teamfaction - The faction data for the selected unit
     * * @param {string} country - The country code for the flag icon (RGF, USA, etc.)
     *  * @param {string} unitName - The unit name for the selected unit
     * */
    pinUnit(teamfaction, country, unitName, teamMain) {
        this.unpinUnit(); // should be possible

        this.pinnedFaction = teamMain;

        // Set the pinned faction flag in the left side button
        const $img = $("<img>", {
            src: `${process.env.API_URL}/img/flags/${country}.webp`,
            alt: "Faction Icon",
            class: "faction-img"
        });
        $("#factionsButton button").empty().append($img);

        // Find the given faction in the teamfaction unit list
        const selectedUnit = teamfaction.find((unit) => unit.unitObjectName === unitName);
        if (!selectedUnit) return;

        let boatsAvailable;

        if (teamMain === "00-Team1 Main") {
            boatsAvailable = this.squadLayer.layerData.team1boats;
            $("#team1PinButton").addClass("active").text(i18next.t("common:pinned"));
            $("#team1PinButton").attr("data-i18n", "common:pinned");
        } else {
            boatsAvailable = this.squadLayer.layerData.team2boats;
            $("#team2PinButton").addClass("active").text(i18next.t("common:pinned"));
            $("#team2PinButton").attr("data-i18n", "common:pinned");
        }

        if (!this.squadLayer.layerData.commanderDisabled) {
            selectedUnit.commanderAssets.forEach((asset) => {
                let tactical = "commander";
                if (asset.displayName.includes("Drone") || asset.displayName.includes("UAV")) tactical = "drone";
                $("#pinnedVehiclesTab").append(`
                    <div class="pinnedVehicles animate__animated animate__fadeInLeft" data-vehiclename="${asset.displayName}" data-vehtype="${tactical}" data-vehicon="${tactical}"data-respawntime="${asset.delay}">
                        <button type="button" class="btn-pined" aria-label="Select Factions">
                            <img src="${process.env.API_URL}/img/icons/shared/commander/${asset.icon}.webp" alt="Faction Icon"/>
                        </button>
                        <div class="pinedVehiclesMeta">
                            <div class="pinedVehiclesName" data-i18n="vehicles:${asset.displayName}">${i18next.t(asset.displayName, { ns: "vehicles" })}</div>
                            <div class="pinedVehiclesTimer">${asset.delay}<span class="" data-i18n="common:min">${i18next.t("common:min")}</span></div>
                        </div>
                    </div>
                `);
            });
        }

        selectedUnit.vehicles.forEach((vehicle) => {
            for (let i = 0; i < vehicle.count; i++){
                
                // Filter out vehicles with respawn time < 10 minutes
                if (App.userSettings.hideLowRespawn && vehicle.respawnTime < 5) return;

                // Skip boats if the team doesn't have boat spawn available
                if (vehicle.spawnerSize === "Boat" && !boatsAvailable) return;

                $("#pinnedVehiclesTab").append(`
                    <div class="pinnedVehicles animate__animated animate__fadeInLeft" data-vehiclename="${vehicle.type}" data-vehtype="${vehicle.vehType}" c data-respawntime="${vehicle.respawnTime}">
                        <button type="button" class="btn-pined" aria-label="Select Factions">
                            <img src="${process.env.API_URL}/img/icons/ally/vehicles/${vehicle.icon}.webp" alt="Faction Icon"/>
                        </button>
                        <div class="pinedVehiclesMeta">
                            <div class="pinedVehiclesName" data-i18n="vehicles:${vehicle.type}">${i18next.t(vehicle.type, { ns: "vehicles" })}</div>
                            <div class="pinedVehiclesTimer">${vehicle.respawnTime}<span class="" data-i18n="common:min">${i18next.t("common:min")}</span></div>
                        </div>
                    </div>
                `);
            }
        });

        // Prevent focus
        $(document).off("pointerdown", ".btn-pined, .pinnedVehicles");
        $(document).on("pointerdown", ".btn-pined, .pinnedVehicles", (event) => {event.preventDefault();});

        $(document).off("click", ".pinnedVehicles");

        $(document).on("click", ".pinnedVehicles", (event) => { 
            const $clicked = $(event.currentTarget);
            const baseRespawnTime = $clicked.data("respawntime");
            if ($clicked.data("vehtype") === "commander") {
                const $otherCommanders = $(".pinnedVehicles[data-vehtype='commander']").not($clicked);
                $otherCommanders.each((_, el) => {
                    // const baseRespawnTime = $(el).data("respawntime");
                    this.pinClick($(el), 15);
                });
            }
            this.pinClick($(event.currentTarget), baseRespawnTime);
        });
        
        this.pinned = true;
    }


    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }


    unpinClick($vehicleDiv, $timerDiv) {
        const timerId = $vehicleDiv.data("timerId");
        const baseRespawnTime = $vehicleDiv.data("respawntime");
        if (timerId) clearInterval(timerId);
        $timerDiv.empty().append(`${baseRespawnTime}<span class="unit" data-i18n="common:min">${i18next.t("common:min")}</span>`);
        $vehicleDiv.removeClass("active").removeData("timerId endTime");
        return;
    }


    pinClick(target, baseRespawnTime) {
        const $vehicleDiv = target;
        const $timerDiv = $vehicleDiv.find(".pinedVehiclesTimer");

        if ($vehicleDiv.hasClass("active")) {
            this.unpinClick($vehicleDiv, $timerDiv, baseRespawnTime);
            return;
        }

        $vehicleDiv.addClass("active");
        const vehIcon = $vehicleDiv.data("vehicon");
    
        const endTime = Date.now() + baseRespawnTime * 1000 * 60; // Minutes to milliseconds
        $vehicleDiv.data("endTime", endTime);
    
        const updateTimer = () => {

            const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));

            if (remaining > 0) {
                $timerDiv.text(this.formatTime(remaining));
                return;
            } 

            clearInterval(timerId);
            $vehicleDiv.removeClass("active").removeData("timerId endTime");
            $timerDiv.empty().append(`${baseRespawnTime}<span class="unit" data-i18n="common:min">${i18next.t("common:min")}</span>`);
            App.openToast("warning", "vehicleRespawned", "");

            if (!App.userSettings.disableSounds) {
                const LANG = localStorage.getItem("settings-language");
                new Audio(`/sounds/${LANG}/${vehIcon}.mp3`).play();  
            }
            
        };
    
        updateTimer();
        const timerId = setInterval(updateTimer, 1000);
        $vehicleDiv.data("timerId", timerId);
    }

    unpinUnit() {
        // Clear any active timers
        $("#pinnedVehiclesTab .pinnedVehicles").each(function() {
            const $vehicleDiv = $(this);
            const timerId = $vehicleDiv.data("timerId");
            if (timerId) clearInterval(timerId);
            $vehicleDiv.removeClass("active");
            $vehicleDiv.removeData("timerId");
        });

        // Now clear the pinned vehicles tab and reset Pin buttons
        $("#pinnedVehiclesTab").empty();
        $(".btn-pin, #mapPinButton").removeClass("active").text(i18next.t("common:pinToMap"));
        $(".btn-pin, #mapPinButton").attr("data-i18n", "common:pinToMap");
        
        this.resetFactionsButton();
        this.pinned = false;
        this.pinnedFaction = "";
    }


    /**
     * * Load the given units for a given faction into the selector
     * * @param {string} FACTION - The faction name
     * * @param {Array} UNITS - The array of all units and vehicles
     * * @param {Array} FACTIONS - The layer factions
     * * @param {jQuery} SELECTOR - The jQuery selector to load the units into
     * */
    loadUnits(FACTION, UNITS, FACTIONS, SELECTOR, broadcast = false) {

        // Clear the selector
        SELECTOR.empty();

        // Load the factions units into the selector
        FACTIONS.forEach((faction) => {
            if (faction.factionID == FACTION) {
                for (const unit of UNITS) {
                    if (unit.unitObjectName === faction.defaultUnit) {
                        SELECTOR.append(`<option value="${faction.defaultUnit}" data-type="${unit.type}" data-name="${unit.displayName}"></option>`);
                        break;
                    }
                }
                for (const type of faction.types) {
                    for (const unit of UNITS) {
                        if (unit.unitObjectName === type.unit) {
                            SELECTOR.append(`<option value="${type.unit}" data-type="${unit.type}" data-name="${unit.displayName}"></option>`);
                            break;
                        }
                    }
                }
            }
        });

        // Set the default value to the first option
        SELECTOR.val(SELECTOR.find("option:first").val()).trigger($.Event("change", { broadcast: broadcast }));
    }


    /**
     * * * Update the main icon on the map with the given faction
     * * @param {string} teamKey - The team key (team1 or team2)
     * * @param {string} FACTION - The faction name (USA, RGF, etc.)
     * * @param {SquadObjective} MAIN - The main object containing the icon and nameText
     * */
    updateMainIcon(teamKey, FACTION) {

        var mainFlag;
        var html = "";

        this.squadLayer.mains.forEach((main) => {
            if (main.objectName.toLowerCase().includes(teamKey)) {
                mainFlag = main;
                return;
            }
        });

        html = `
            <span>
                <span data-i18n="common:${teamKey}">
                    ${i18next.t(teamKey, { ns: "common" })}
                </span>
            `;

        if (FACTION !== "") html += `: <span data-i18n="factions:${FACTION}">${i18next.t(FACTION, { ns: "factions" })}</span>`;

        html  += "</span>";

        // Update the name text icon
        mainFlag.nameText.setIcon(
            new DivIcon({
                className: "objText main",
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, 38] : [150, 32],
                //shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        );

        mainFlag.updateMainIcon();
    }


    /**
     * * * Copy the vehicle name to the clipboard
     * * * Add doublequotes to the vehicle name in case there is spaces
     * * * By default squad are created with "1" so they are locked
     * @param {*} event 
     */
    copyVehicleName(event) {
        navigator.clipboard.writeText(`CreateSquad "${event.target.innerText}" 1`);
        animateCSS($(event.target), "fadeIn");
        const originalText = event.target.innerText;
        event.target.innerText = i18next.t("tooltips:copied");
        setTimeout(() => {
            animateCSS($(event.target), "fadeIn");
            event.target.innerText = originalText;
        }, 2000);
    }

    
    /**
     * Open/Close Vehicle Cards
     * @param {*} event
     */
    openCard(event) {
        if ($(event.target).closest(".vehicle-type").length) return;

        const $card = $(event.currentTarget);
        const $image = $card.find(".image");

        // Check if card is currently expanded (image is visible)
        const isExpanded = $image.is(":visible");

        if (isExpanded) {
            // Card is expanded, collapse it
            $card.removeClass("selected");
        } else {
            // Card is collapsed, expand it
            $card.addClass("selected");
        }
    }

    spawnVehicle(vehicle, spawners, activeFactionMarkers){

        if (vehicle.spawnerSize === "Helicopter") {
            for (let v = 0; v < vehicle.count; v++) {
                if (spawners.helicopters.length === 0) break;
                // Pick a random Helicopter spawner
                const randIndex = Math.floor(Math.random() * spawners.helicopters.length);
                const spawner = spawners.helicopters[randIndex];
                const latlng = this.squadLayer.convertToLatLng(spawner.location_x, spawner.location_y);
                vehicle.dedicatedSpawn = true;
                this.squadLayer.mainZones.assets.push(new squadVehicleMarker(latlng, spawner, vehicle, spawners.faction, true).addTo(activeFactionMarkers));
                // remove the used spawner
                spawners.helicopters.splice(randIndex, 1);
            }
            return;
        }

        if (vehicle.spawnerSize === "QuadBike") {
            for (let v = 0; v < vehicle.count; v++) {
                if (spawners.bikes.length === 0) break;
                // Pick first spawner in the list
                const spawner = spawners.bikes[0];
                const latlng = this.squadLayer.convertToLatLng(spawner.location_x, spawner.location_y);
                this.squadLayer.mainZones.assets.push(new squadVehicleMarker(latlng, spawner, vehicle, spawners.faction, true).addTo(activeFactionMarkers));
                // remove the used spawner
                spawners.bikes.splice(0, 1);
            }
            return;
        }

        if (vehicle.spawnerSize === "Boat") {
            for (let v = 0; v < vehicle.count; v++) {
                if (spawners.boats.length === 0) break;
                // pick random index
                const randIndex = Math.floor(Math.random() * spawners.boats.length);
                const spawner = spawners.boats[randIndex];
                const latlng = this.squadLayer.convertToLatLng(spawner.location_x, spawner.location_y);
                this.squadLayer.mainZones.assets.push(new squadVehicleMarker(latlng, spawner, vehicle, spawners.faction, true).addTo(activeFactionMarkers));
                // remove the used spawner
                spawners.boats.splice(randIndex, 1);
            }
            return;
        }

        for (let v = 0; v < vehicle.count; v++) {

            let foundDedicated = false;
            const vehType = vehicle.vehType;

            // collect only spawners that allow this vehType
            const validSpawners = spawners.vehicles.filter(spawner =>
                spawner.typePriorities.some(p => p.name === vehType)
            );

            if (validSpawners.length > 0) {
                // pick one random spawner between the valid spawn
                const randIndex = Math.floor(Math.random() * validSpawners.length);
                const spawner = validSpawners[randIndex];
                foundDedicated = true;
                const latlng = this.squadLayer.convertToLatLng(spawner.location_x, spawner.location_y);
                this.squadLayer.mainZones.assets.push(new squadVehicleMarker(latlng, spawner, vehicle, spawners.faction, true).addTo(activeFactionMarkers));
                // remove the chosen spawner from the main pool
                spawners.vehicles = spawners.vehicles.filter(s => s !== spawner);
            }

            if (!foundDedicated) {

                // filter only spawners with empty typePriorities
                const fallbackSpawners = spawners.vehicles.filter(s => 
                    !s.typePriorities || s.typePriorities.length === 0
                );

                if (fallbackSpawners.length > 0) {
                    const randomIndex = Math.floor(Math.random() * fallbackSpawners.length);
                    const spawner = fallbackSpawners[randomIndex];
                    const latlng = this.squadLayer.convertToLatLng(spawner.location_x, spawner.location_y);
                    this.squadLayer.mainZones.assets.push(new squadVehicleMarker(latlng, spawner, vehicle, spawners.faction, false).addTo(activeFactionMarkers));
                    const originalIndex = spawners.vehicles.indexOf(spawner);
                    if (originalIndex !== -1) spawners.vehicles.splice(originalIndex, 1);

                } else {
                    console.debug("NO EMPTY SPAWNERS LEFT!");
                }
            }
        }
    }


    generateCardHTML(vehicle, DIV, LEFT = false) {

        const typeHTML = `
            <div class="vehicle-type" data-i18n="vehicles:${vehicle.type}" title="${i18next.t("clickToCopy", { ns: "tooltips" })}">
                ${i18next.t(vehicle.type, { ns: "vehicles" })}
            </div>`;

        const metaHTML = `
            <div class="vehicle-meta">
                ${this.getCardTicketHTML(vehicle, LEFT)}
                ${this.getCardRespawnHTML(vehicle, LEFT)}
                ${this.getCardDelayHTML(vehicle, LEFT)}
            </div>`;

        DIV.append(`
            <div class="vehicle-card animate__animated animate__fadeIn animate__faster">
                <div class="card-content">
                    <div class="vehicle-icon">
                        <img src="${process.env.API_URL}/img/icons/ally/vehicles/${vehicle.icon}.webp" alt='${vehicle.type}'>
                    </div>
                    <div class="vehicle-icon">
                        <div class="vehicle-count">×${vehicle.count}</div>
                    </div>
                    <div class="vehicle-info">
                        ${LEFT ? metaHTML + typeHTML : typeHTML + metaHTML}
                    </div>
                </div>
                ${this.getCardImgHTML(vehicle)}
            </div>
        `);
    }


    getCardImgHTML(vehicle){
        let shortVehName = vehicle.type.split(" ")[0];
        let amphibious = "";
        if (vehicle.isAmphibious) {
            amphibious = `
                <div class="tag">
                    <img src="${process.env.API_URL}/img/icons/shared/amphibious.webp" title="${i18next.t("amphibious", { ns: "common" })}">
                </div>
            `;
        }

        let ATGM = "";
        if (vehicle.ATGM) {
            ATGM = `
                <div class="tag">
                    <img src="${process.env.API_URL}/img/icons/shared/ATGM.webp" title="${i18next.t("atgm", { ns: "common" })}">
                </div>
            `;
        }

        let totalSeats = vehicle.passengerSeats + vehicle.driverSeats; 
        let passengersHTML = `
                <div class="tag">
                    <div class="passenger">${totalSeats}</div>
                    <img src="${process.env.API_URL}/img/icons/shared/passenger.webp" title="${i18next.t("passengers", { ns: "common" })}">
                </div>
            `;

        return `
            <div class="image">
                <a href="https://squad.fandom.com/wiki/${shortVehName}" target="_blank" class="attribution">squad.fandom.com</a>
                <div class="tags">${passengersHTML}${amphibious}${ATGM}</div>
                <img src="${process.env.API_URL}/img/vehicles/${vehicle.type}.webp" onerror="this.onerror=null; this.src='${process.env.API_URL}/img/vehicles/placeholder.webp';"/>
            </div>
        `;
    }



    getCardTicketHTML(vehicle, iconLeft = true) {
        if (!vehicle.ticketValue || vehicle.ticketValue == 0) return;

        const oneOrMoreTickets = vehicle.ticketValue === 1 ? "ticket" : "tickets";

        const iconHTML = `
            <span class="ticket-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path d="M96 128C60.7 128 32 156.7 32 192L32 256C32 264.8 39.4 271.7 47.7 274.6C66.5 281.1 80 299 80 320C80 341 66.5 358.9 47.7 365.4C39.4 368.3 32 375.2 32 384L32 448C32 483.3 60.7 512 96 512L544 512C579.3 512 608 483.3 608 448L608 384C608 375.2 600.6 368.3 592.3 365.4C573.5 358.9 560 341 560 320C560 299 573.5 281.1 592.3 274.6C600.6 271.7 608 264.8 608 256L608 192C608 156.7 579.3 128 544 128L96 128zM448 400L448 240L192 240L192 400L448 400zM144 224C144 206.3 158.3 192 176 192L464 192C481.7 192 496 206.3 496 224L496 416C496 433.7 481.7 448 464 448L176 448C158.3 448 144 433.7 144 416L144 224z"/>
                </svg>
            </span>`;

        const textHTML = `
            <span class="ticket">
                <span class="ticketText"><span data-i18n="common:value">${i18next.t("common:value")}</span>
                : </span>${vehicle.ticketValue}
                <span data-i18n="common:${oneOrMoreTickets}">${i18next.t("common:"+oneOrMoreTickets)}</span>
            </span>`;

        return `
            <span class="ticketHolder">
                ${iconLeft ? iconHTML + textHTML : textHTML + iconHTML}
            </span>`;
    }



    getCardDelayHTML(vehicle, iconLeft = true) {
        if (vehicle.delay == 0 || !vehicle.delay) return "<span class='delayHolder'></span>";

        const iconHTML = `
            <span class="count-delay-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M256 0c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-29.3C378.8 81.9 448 160.9 448 256c0 106-86 192-192 192S64 362 64 256c0-53.7 22-102.3 57.6-137.1c12.6-12.4 12.8-32.6 .5-45.3S89.5 60.8 76.8 73.1C29.5 119.6 0 184.4 0 256C0 397.4 114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM193 159c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l80 80c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80z"/>
                </svg>
            </span>`;

        const textHTML = `
            <span class="delay">
                <span class="delayText"><span data-i18n="common:delayed">${i18next.t("common:delayed")}</span>
                : </span>${vehicle.delay}
                <span data-i18n="common:min">${i18next.t("common:min")}</span>
            </span>`;

        return `
            <span class="delayHolder">
                <span class="count-delay">
                    ${iconLeft ? iconHTML + textHTML : textHTML + iconHTML}
                </span>
            </span>`;
    }


    getCardRespawnHTML(vehicle, iconLeft = true) {
        const iconHTML = `
            <span class="respawn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"/>
                </svg>
            </span>`;

        let textHTML;

        if (vehicle.singleUse) {
            textHTML = `
                <span class="respawn">-</span>`;
        } else {
            textHTML = `
                <span class="respawn">
                    <span class="respawnText">
                        <span data-i18n="common:respawn">${i18next.t("common:respawn")}</span>:
                    </span>
                    ${vehicle.respawnTime}
                    <span data-i18n="common:min">${i18next.t("common:min")}</span>
                </span>`;
        }

        return `
            <span class="respawnHolder${vehicle.singleUse ? " warning" : ""}">
                ${iconLeft ? iconHTML + textHTML : textHTML + iconHTML}
            </span>`;
    }



    /** 
     * * Initialize the factions selector and load the factions into it
     * * @param {Object} factionData - The faction data object
     * */
    init(factionData) {

        $(".dropbtn8, .dropbtn10").empty();
        this.resetFactionsButton();

        factionData.teamConfigs.factions.team1Units.forEach((faction) => {
            this.FACTION1_SELECTOR.append(`<option data-i18n=factions:${faction.factionID} value=${faction.factionID}></option>`);
        });

        factionData.teamConfigs.factions.team2Units.forEach((faction) => {
            this.FACTION2_SELECTOR.append(`<option data-i18n=factions:${faction.factionID} value=${faction.factionID}></option>`);
        });

        
        this.FACTION1_SELECTOR.off("change").on("change", (event) => {
            // Reset UI
            $("#team1Vehicles").empty();
            $("#team1CommanderAsset").empty();

            this.loadFactionBackground("#factionImg1", event.target.value);
            
            if ( $("#team1PinButton").hasClass("active") ) this.unpinUnit();

            // Broadcast the Unit change to the session if needed
            const broadcast = event.broadcast ?? true;

            // Update Unit selector and main icon
            this.loadUnits(event.target.value, factionData.units.team1Units, factionData.teamConfigs.factions.team1Units, this.UNIT1_SELECTOR, broadcast);
            this.updateMainIcon("team1", event.target.value);

            if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                App.session.ws.send(
                    JSON.stringify({
                        type: "UPDATE_FACTION",
                        teamIndex: 0,
                        faction: event.target.value,

                    })
                );
            }
        });

        this.FACTION2_SELECTOR.off("change").on("change", (event) => {
            // Reset UI
            $("#team2Vehicles").empty();
            if ( $("#team2PinButton").hasClass("active") ) this.unpinUnit();

            this.loadFactionBackground("#factionImg2", event.target.value);


            // Broadcast the Faction change to the session if needed
            const broadcast = event.broadcast ?? true;

            // Update Unit selector and main icon
            this.loadUnits(event.target.value, factionData.units.team2Units, factionData.teamConfigs.factions.team2Units, this.UNIT2_SELECTOR, broadcast);
            this.updateMainIcon("team2", event.target.value);

            if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                App.session.ws.send(
                    JSON.stringify({
                        type: "UPDATE_FACTION",
                        teamIndex: 1,
                        faction: event.target.value,

                    })
                );
            }
        });

        this.UNIT1_SELECTOR.off("change").on("change", (event) => {

            // Reset UI
            $("#team1Vehicles").empty();
            if ($("#team1PinButton").hasClass("active")) this.unpinUnit();

            // Clear spawned vehicles 
            this.squadLayer.activeFaction1Markers.clearLayers();
        
            const selectedUnit = factionData.units.team1Units.find((unit) => unit.unitObjectName === event.target.value);
        
            if (!selectedUnit) {
                console.warn("No matching unit found for", event.target.value);
                return;
            }

            // Broadcast the map change to the session if needed
            const broadcast = event.broadcast ?? true;

            if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                console.log("broadcasting unit1 change", event.target.value);
                App.session.ws.send(
                    JSON.stringify({
                        type: "UPDATE_UNIT",
                        teamIndex: 0,
                        unit: event.target.value,
                    })
                );
            }

            // Create a local copy of available spawners
            let spawners = {
                helicopters: [...this.squadLayer.team1VehicleSpawners.helicopters],
                boats: [...this.squadLayer.team1VehicleSpawners.boats],
                vehicles: [...this.squadLayer.team1VehicleSpawners.vehicles],
                bikes: [...this.squadLayer.team1VehicleSpawners.bikes],
                faction: this.FACTION1_SELECTOR.val()
            };

            selectedUnit.vehicles.forEach((vehicle) => {
                // Skip boats if the team doesn't have boat spawn available
                if (vehicle.spawnerSize === "Boat" && !factionData.team1boats) return;
                this.generateCardHTML(vehicle, $("#team1Vehicles"), true);
                this.spawnVehicle(vehicle, spawners, this.squadLayer.activeFaction1Markers);
            });

            // Handle click-to-copy
            $(".vehicle-card").off("click").on("click", (event) => { this.openCard(event); });
            $(".vehicle-type").off("click").on("click", (event) => { this.copyVehicleName(event); });

            // Load Commanders Icons & Tooltips
            this.loadCommanderAssets("#team1CommanderAsset", selectedUnit);
            
        });


        this.UNIT2_SELECTOR.off("change").on("change", (event) => {

            let teamFactionDiv =  $("#team2Vehicles");

            // Empty the vehicles container
            teamFactionDiv.empty();
            $("#team2CommanderAsset").empty();

            if ( $("#team2PinButton").hasClass("active") ) this.unpinUnit();

            // Clear spawned vehicles 
            this.squadLayer.activeFaction2Markers.clearLayers();

            const selectedUnit = factionData.units.team2Units.find((unit) => unit.unitObjectName === event.target.value);
        
            if (!selectedUnit) {
                console.warn("No matching unit found for", event.target.value);
                return;
            }

            // Broadcast the map change to the session if needed
            const broadcast = event.broadcast ?? true;

            if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                console.log("broadcasting unit2 change", event.target.value);
                App.session.ws.send(
                    JSON.stringify({
                        type: "UPDATE_UNIT",
                        teamIndex: 1,
                        unit: event.target.value,
                    })
                );
            }

            // Create a local copy of available spawners
            let spawners = {
                helicopters: [...this.squadLayer.team2VehicleSpawners.helicopters],
                boats: [...this.squadLayer.team2VehicleSpawners.boats],
                vehicles: [...this.squadLayer.team2VehicleSpawners.vehicles],
                bikes: [...this.squadLayer.team2VehicleSpawners.bikes],
                faction: this.FACTION2_SELECTOR.val()
            };

            selectedUnit.vehicles.forEach((vehicle) => {
                // Skip boats if the team doesn't have boat spawn available
                if (vehicle.spawnerSize === "Boat" && !factionData.team2boats) return;
                this.generateCardHTML(vehicle, $("#team2Vehicles"), false);
                this.spawnVehicle(vehicle, spawners, this.squadLayer.activeFaction2Markers);
            });

            // Load Commanders Icons & Tooltips
            this.loadCommanderAssets("#team2CommanderAsset", selectedUnit);

            // Handle click-to-copy
            $(".vehicle-type").off("click").on("click", (event) => { this.copyVehicleName(event); });
            $(".vehicle-card").off("click").on("click", (event) => { this.openCard(event); });
        });

        if (App.userSettings.enableFactions) {
            if (App.userSettings.defaultFactions) {
                const team1DefaultFaction = factionData.teamConfigs.team1.defaultFactionUnit.split("_")[0];
                const team2DefaultFaction = factionData.teamConfigs.team2.defaultFactionUnit.split("_")[0];

                if (this.FACTION1_SELECTOR.find(`option[value="${team1DefaultFaction}"]`).length > 0) {
                    this.FACTION1_SELECTOR.val(team1DefaultFaction).trigger($.Event("change", { broadcast: false }));
                } else {
                    console.debug(`Default faction for team 1 not found in dropdown: ${team1DefaultFaction}`);
                    console.debug(`Falling back to ${factionData.teamConfigs.factions.team1Units[0].factionID}`);
                    this.FACTION1_SELECTOR.val(factionData.teamConfigs.factions.team1Units[0].factionID).trigger($.Event("change", { broadcast: false }));
                }

                if (this.FACTION2_SELECTOR.find(`option[value="${team2DefaultFaction}"]`).length > 0) {
                    this.FACTION2_SELECTOR.val(team2DefaultFaction).trigger($.Event("change", { broadcast: false }));
                } else {
                    console.debug(`Default faction for team 2 not found in dropdown: ${team2DefaultFaction}`);
                    console.debug(`Falling back to ${factionData.teamConfigs.factions.team2Units[0].factionID}`);
                    this.FACTION2_SELECTOR.val(factionData.teamConfigs.factions.team2Units[0].factionID).trigger($.Event("change", { broadcast: false }));
                }

            } else {
                this.FACTION1_SELECTOR.val("").trigger($.Event("change", { broadcast: false }));
                this.FACTION2_SELECTOR.val("").trigger($.Event("change", { broadcast: false }));
            }
        }

        $(".btn-pin").off("click").on("click", (event) => {
            
            // Already Pinned, unpin.
            if ($(event.currentTarget).hasClass("active")) {
                this.unpinUnit();
                $(event.currentTarget).removeClass("active");
                return;
            } 

            let country;
            let faction;
            let teamfaction;
            let teamMain;
            
            if (event.currentTarget.id === "team1PinButton") {
                country = this.FACTION1_SELECTOR.val();
                faction = this.UNIT1_SELECTOR.val();
                teamfaction = factionData.units.team1Units;
                teamMain = "00-Team1 Main";
            } else {
                country = this.FACTION2_SELECTOR.val();
                faction = this.UNIT2_SELECTOR.val();
                teamfaction = factionData.units.team2Units;
                teamMain = "Z-Team2 Main";
            }

            // if country of faction is empty or null, do nothing
            if (country === null || faction === null) return;
            if (country === "" || faction === "") return;

            this.pinUnit(teamfaction, country, faction, teamMain);
    
        });

    }


    loadFactionBackground(DIV, selectedUnit) {
        $(DIV).empty();
        if (selectedUnit) $(DIV).append(`<img src="${process.env.API_URL}/img/spawnGroup/${selectedUnit}.webp" class="factionImgs animate__animated animate__fadeIn animate__faster" />`);
    }


    loadCommanderAssets(DIV, selectedUnit) {

        // Load Commanders Assets
        $(DIV).empty();

        // Clear existing tooltips
        tippy(`${DIV} .commander-asset`).forEach(instance => { instance.destroy(); });

        // Layer don't have commander (Skirmish, Seed, Kokan)
        if (this.squadLayer.layerData.commanderDisabled) {
            $(DIV).append(`${i18next.t("common:noCommander")}`);
            return;
        } 

        Object.values(selectedUnit.commanderAssets).forEach(asset => {
            $(DIV).append(`
                <img src="${process.env.API_URL}/img/icons/shared/commander/${asset.icon}.webp"
                    class="commander-asset" 
                    data-tippy-name="${asset.displayName}"
                    data-tippy-delay="${asset.delay}" />
            `);
        });

        // Initialize tooltips for all images in one go
        tippy(`${DIV} .commander-asset`, {
            appendTo: () => document.querySelector("#factionsDialog"),
            delay: 200,
            placement: "bottom",
            allowHTML: true,
            theme: "infTooltips",
            onShow(instance) {
                const el = instance.reference;
                const name = el.getAttribute("data-tippy-name");
                const delay = el.getAttribute("data-tippy-delay");
                instance.setContent(
                    `<div class="tooltip-content">
                        <strong>${name}</strong><br>
                        <span class="delayText"><span data-i18n="common:delayed">${i18next.t("common:delayed")}</span>
                        : </span>${delay}
                        <span data-i18n="common:min">${i18next.t("common:min")}</span>
                    </div>`
                );
            },
        });

    }


    initDropdowns() {
        let factionPlaceholder = i18next.t("common:faction");
        let unitPlaceholder = i18next.t("common:unit");

        // Initialize Select2 with the structured data

        this.FACTION1_SELECTOR.select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#faction1"),
            allowClear: true,
            placeholder: factionPlaceholder,
            width: "100px",
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatFactions(state, false),
            templateSelection: (state) => this.formatFactions(state, true),
        });

        this.FACTION2_SELECTOR.select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#faction2"),
            allowClear: true,
            placeholder: factionPlaceholder,
            width: "100px",
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatFactions(state, false),
            templateSelection: (state) => this.formatFactions(state, true),
        });

        this.UNIT1_SELECTOR.select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#unit1"),
            placeholder: unitPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatUnits(state, false),
            templateSelection: (state) => this.formatUnits(state, true),
        });

        this.UNIT2_SELECTOR.select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#unit2"),
            placeholder: unitPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatUnits(state, false),
            templateSelection: (state) => this.formatUnits(state, true),
        });
    }

}