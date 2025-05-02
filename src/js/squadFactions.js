
import { App } from "../app.js";
import i18next from "i18next";
import { DivIcon } from "leaflet";

export default class SquadFactions {

    constructor(layerData, minimap) {
        this.layerData = layerData;
        this.minimap = minimap;
        this.loadFaction(layerData);
    }


    formatFactions(state, isSelection = false) {
        if (!state.id) return state.text;
        const imgHtml = `<img src="/icons/flags/${state.element.value}.webp" class="img-flag" />`;
        if (isSelection) return $(`<span class="countryFlags">${imgHtml}</span>`);
        return $(`
            <span class="countryFlags">
                <p>${imgHtml}</p>
                <span class="flag-label">${i18next.t("factions:" + state.element.value)}</span>
            </span>
        `);
    }


    formatUnits(option, isSelection = false) {

        if (!option.id) return option.text;
        const $element = $(option.element);
        const type = $element.data("type");
        const name = $element.data("name");
    
        return $(`
            <div class="unit-option">
                <img src="/icons/units/${type}.webp" class="unit-logo${isSelection ? " selection" : ""}" alt="${option.text}" />
                <div class="unit-texts">
                    <div class="unit-type">${i18next.t(type, { ns: "units" })}</div>
                    ${isSelection ? "" : `<div class="unit-name">${i18next.t(name, { ns: "units" })}</div>`}
                </div>
            </div>
        `);
    }


    pinUnit(teamfaction, country, faction) {
    
        $("#factionsButton button").empty().append(`
            <img src="/icons/flags/${country}.webp" alt="Faction Icon" class="faction-img" />
        `);
        
        const selectedUnit = teamfaction.find((unit) => unit.unitObjectName === faction);

        if (!selectedUnit) return;

        selectedUnit.vehicles.forEach((vehicle) => {
            for (let i = 0; i < vehicle.count; i++){
                
                // Filter out vehicles with respawn time < 10 minutes
                if (App.userSettings.hideLowRespawn && vehicle.respawnTime < 5) return;

                $("#pinnedVehiclesTab").append(`
                    <div class="pinnedVehicles animate__animated animate__fadeInLeft" data-vehiclename="${vehicle.type}" data-vehtype="${vehicle.vehType}" data-vehicon="${vehicle.icon}" data-respawntime="${vehicle.respawnTime}">
                        <button type="button" class="btn-pined" aria-label="Select Factions">
                            <img src="/icons/ally/vehicles/${vehicle.icon}.webp" alt="Faction Icon" class="faction-img" />
                        </button>
                        <div class="pinedVehiclesMeta">
                            <div class="pinedVehiclesName">${vehicle.type}</div>
                            <div class="pinedVehiclesTimer">${vehicle.respawnTime}<span class="unit" data-i18n="common:min">${i18next.t("common:min")}</span></div>
                        </div>
                    </div>
                `);
            }
        });
            
        

        // Prevent focus
        $(document).off("mousedown", ".btn-pined, .pinnedVehicles");
        $(document).on("mousedown", ".btn-pined, .pinnedVehicles", (event) => {event.preventDefault();});

        $(document).off("click", ".pinnedVehicles");
        $(document).on("click", ".pinnedVehicles", (event) => {
            const SECONDSINAMINUTE = 60;
            const $vehicleDiv = $(event.currentTarget);
            const $timerDiv = $vehicleDiv.find(".pinedVehiclesTimer");
            let respawnTime = $vehicleDiv.data("respawntime") * SECONDSINAMINUTE; // minutes to seconds

            if ($vehicleDiv.hasClass("active")) {
                // If active, cancel the timer and reset
                const timerId = $vehicleDiv.data("timerId");
                if (timerId) clearInterval(timerId);
                $timerDiv.empty().append(`
                    ${respawnTime}<span class="unit" data-i18n="common:min">${i18next.t("common:min")}</span>
                `);
                $vehicleDiv.removeClass("active");
                $vehicleDiv.removeData("timerId");
                return;
            }
        
            $vehicleDiv.addClass("active");
            
            let vehIcon = $vehicleDiv.data("vehicon");
        
            $timerDiv.text(formatTime(respawnTime));
        
            const timerId = setInterval(() => {
                respawnTime--;
        
                if (respawnTime > 0) {
                    $timerDiv.text(formatTime(respawnTime));
                } else {
                    clearInterval(timerId);
                    $vehicleDiv.removeClass("active");
                    $vehicleDiv.removeData("timerId");
                    $timerDiv.empty().append(`
                        ${$vehicleDiv.data("respawntime") * SECONDSINAMINUTE}<span class="unit" data-i18n="common:min">${i18next.t("common:min")}</span>
                    `);
                    this.openToast("warning", "Vehicle respawned", "");
                    // TODO: support for every language
                    // use https://luvvoice.com/ if you want to add voice support for your language
                    if (!this.userSettings.disableSounds) new Audio(`/sounds/en/${vehIcon}.mp3`).play();    
                }
            }, 1000);
        
            $vehicleDiv.data("timerId", timerId);
        });
        
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes}:${secs.toString().padStart(2, "0")}`;
        }
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

        // Now clear the pinned vehicles tab and reset buttons
        $("#pinnedVehiclesTab").empty();
        $(".btn-pin").removeClass("active").text(i18next.t("common:pinToMap")).attr("data-i18n", "common:pinToMap");
        $("#factionsButton button").empty().append(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                <path fill="currentColor" d="M265.2 192c25.4 0 49.8 7.1 70.8 19.9L336 512l-192 0 0-174.3L90.4 428.3c-11.2 19-35.8 25.3-54.8 14.1s-25.3-35.8-14.1-54.8L97.7 258.8c24.5-41.4 69-66.8 117.1-66.8l50.4 0zM160 80a80 80 0 1 1 160 0A80 80 0 1 1 160 80zM448 0c8.8 0 16 7.2 16 16l0 116.3c9.6 5.5 16 15.9 16 27.7l0 109.3 16-5.3 0-56c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 84.5c0 6.9-4.4 13-10.9 15.2L480 325.3l0 26.7 48 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-44 0 23 92.1c2.5 10.1-5.1 19.9-15.5 19.9L432 512c-8.8 0-16-7.2-16-16l0-96-16 0c-17.7 0-32-14.3-32-32l0-144c0-17.7 14.3-32 32-32l0-32c0-11.8 6.4-22.2 16-27.7L416 32c-8.8 0-16-7.2-16-16s7.2-16 16-16l16 0 16 0z"/>
            </svg>
        `);
    }


    loadFaction(factionData) {

        $(".dropbtn8").empty();
        $(".dropbtn10").empty();

        factionData.teamConfigs.factions.team1Units.forEach((faction) => {
            $(".dropbtn8").append(`<option data-i18n=factions:${faction.factionID} value=${faction.factionID}></option>`);
        });

        factionData.teamConfigs.factions.team2Units.forEach((faction) => {
            $(".dropbtn10").append(`<option data-i18n=factions:${faction.factionID} value=${faction.factionID}></option>`);
        });


        $(".dropbtn8").off("change").on("change", (event) => {

            //empty the unit type selector
            $(".dropbtn9").empty();
            $("#team1Vehicles").empty();

            if ( $("#team1PinButton").hasClass("active") ) this.unpinUnit();
            
            factionData.teamConfigs.factions.team1Units.forEach((faction) => {
                if (faction.factionID == event.target.value) {
                    for (const unit of factionData.factions.team1factions) {
                        if (unit.unitObjectName === faction.defaultUnit) {
                            $(".dropbtn9").append(`<option value="${faction.defaultUnit}" data-type="${unit.type}" data-name="${unit.displayName}"></option>`);
                            break;
                        }
                    }
                    for (const type of faction.types) {
                        for (const unit of factionData.factions.team1factions) {
                            if (unit.unitObjectName === type.unit) {

                                $(".dropbtn9").append(`<option value="${type.unit}" data-type="${unit.type}" data-name="${unit.displayName}"></option>`);
                                break;
                            }
                        }
                    }
                }
            });
            // Set the default value to the first option
            $(".dropbtn9").val($(".dropbtn9 option:first").val()).trigger("change");

            const iconEl = this.minimap.layer.mains[0].flag._icon;

            // Remove any old country_XXX class
            iconEl.classList.forEach(className => {
                if (className.startsWith("country_")) {
                    iconEl.classList.remove(className);
                }
            });

            const value = event.target.value;
            const iconAnchor = App.userSettings.circlesFlags ? [150, 38] : [150, 32];
            const isValid = value !== "";
            
            // Update the icon class if a new value is selected
            if (isValid) {
                iconEl.classList.add(`country_${value}`);
            }
            
            // Update Main 1 Name with either selected faction or default name
            this.minimap.layer.mains[0].nameText.setIcon(
                new DivIcon({
                    className: "objText main",
                    keyboard: false,
                    html: isValid ? value : i18next.t("common:team1"),
                    iconSize: [300, 20],
                    iconAnchor,
                    shadowUrl: "../img/icons/markers/marker_shadow.webp",
                    shadowSize: [0, 0],
                })
            );

            

        });

        $(".dropbtn10").off("change").on("change", (event) => {
            //empty the unit type selector
            $(".dropbtn11").empty();
            $("#team2Vehicles").empty();
            if ( $("#team2PinButton").hasClass("active") ) this.unpinUnit();

            factionData.teamConfigs.factions.team2Units.forEach((faction) => {
                if (faction.factionID == event.target.value) {
                    for (const unit of factionData.factions.team2factions) {
                        if (unit.unitObjectName === faction.defaultUnit) {
                            $(".dropbtn11").append(`<option value="${faction.defaultUnit}" data-type="${unit.type}" data-name="${unit.displayName}"></option>`);
                            break;
                        }
                    }
                    for (const type of faction.types) {
                        for (const unit of factionData.factions.team2factions) {
                            if (unit.unitObjectName === type.unit) {
                                $(".dropbtn11").append(`<option value="${type.unit}" data-type="${unit.type}" data-name="${unit.displayName}"></option>`);
                                break;
                            }
                        }
                    }
                }
            });

            // Set the default value to the first option
            $(".dropbtn11").val($(".dropbtn11 option:first").val()).trigger("change");
            const iconEl = this.minimap.layer.mains[1].flag._icon;

            // Remove any old country_XXX class
            iconEl.classList.forEach(className => {
                if (className.startsWith("country_")) {
                    iconEl.classList.remove(className);
                }
            });

            const value = event.target.value;
            const iconAnchor = App.userSettings.circlesFlags ? [150, 38] : [150, 32];
            const isValid = value !== "";
            
            // Update the icon class if a new value is selected
            if (isValid) {
                iconEl.classList.add(`country_${value}`);
            }
            
            // Update Main 2 Name with either selected faction or default name
            this.minimap.layer.mains[1].nameText.setIcon(
                new DivIcon({
                    className: "objText main",
                    keyboard: false,
                    html: isValid ? value : i18next.t("common:team2"),
                    iconSize: [300, 20],
                    iconAnchor,
                    shadowUrl: "../img/icons/markers/marker_shadow.webp",
                    shadowSize: [0, 0],
                })
            );
        });

        $(".dropbtn9").off("change").on("change", (event) => {
            // Empty the vehicles container
            $("#team1Vehicles").empty();
            if ($("#team1PinButton").hasClass("active")) this.unpinUnit();
        
            const selectedUnit = factionData.factions.team1factions.find((unit) => unit.unitObjectName === event.target.value);
        
            if (!selectedUnit) {
                console.warn("No matching unit found for", event.target.value);
                return;
            }

            selectedUnit.vehicles.forEach((vehicle) => {

                let delayInfo = "";
                if (vehicle.delay > 0) {
                    delayInfo = `
                        <span class="delay">
                            <span data-i18n="common:delayed">${i18next.t("common:delayed")}</span>
                            : ${vehicle.delay}
                            <span data-i18n="common:min">${i18next.t("common:min")}</span>
                        </span>
                    `;
                }

                $("#team1Vehicles").append(`
                    <div class="vehicle-card animate__animated animate__fadeIn animate__faster">
                        <div class="vehicle-icon">
                            <img src='/icons/ally/vehicles/${vehicle.icon}.webp' alt='${vehicle.type}' class='vehicle-icon-img'>
                        </div>
                        <div class="vehicle-icon">
                            <div class="vehicle-count">×${vehicle.count}</div>
                        </div>
                        <div class="vehicle-info">
                            <div class="vehicle-meta">
                                <span class="respawn">
                                    <span data-i18n="common:respawn">${i18next.t("common:respawn")}</span>
                                    : ${vehicle.respawnTime}
                                    <span data-i18n="common:min">${i18next.t("common:min")}</span>
                                </span>
                                <span class="count-delay"> ${delayInfo}</span>
                            </div>
                            <div class="vehicle-type">${vehicle.type}</div>
                        </div>
                    </div>
                `);
            });
    
            // Handle click-to-copy
            $(".vehicle-type").off("click").on("click", (event) => {
                navigator.clipboard.writeText(`CreateSquad ${event.target.innerText}`);
                animateCSS($(event.target), "fadeIn");
                const originalText = event.target.innerText;
                event.target.innerText = i18next.t("tooltips:copied");
                setTimeout(() => {
                    animateCSS($(event.target), "fadeIn");
                    event.target.innerText = originalText;
                }, 2000);
            });
        });

        $(".dropbtn11").off("change").on("change", (event) => {
            // Empty the vehicles container
            $("#team2Vehicles").empty();
            if ( $("#team2PinButton").hasClass("active") ) this.unpinUnit();

            const selectedUnit = factionData.factions.team2factions.find((unit) => unit.unitObjectName === event.target.value);
        
            if (!selectedUnit) {
                console.warn("No matching unit found for", event.target.value);
                return;
            }

            selectedUnit.vehicles.forEach((vehicle) => {
                
                let delayInfo = "";
                if (vehicle.delay > 0) {
                    delayInfo = `
                        <span class="delay">
                            <span data-i18n="common:delayed">${i18next.t("common:delayed")}</span>
                            : ${vehicle.delay}
                            <span data-i18n="common:min">${i18next.t("common:min")}</span>
                        </span>
                    `;
                }

                $("#team2Vehicles").append(`
                    <div class="vehicle-card animate__animated animate__fadeIn animate__faster">
                        <div class="vehicle-icon">
                            <img src="/icons/ally/vehicles/${vehicle.icon}.webp" alt='${vehicle.type}' class='vehicle-icon-img'>
                        </div>
                        <div class="vehicle-icon">
                            <div class="vehicle-count">×${vehicle.count}</div>
                        </div>
                        <div class="vehicle-info">
                            <div class="vehicle-type">${vehicle.type}</div>
                            <div class="vehicle-meta">
                                <span class="respawn">
                                    <span data-i18n="common:respawn">${i18next.t("common:respawn")}</span>
                                    : ${vehicle.respawnTime}
                                    <span data-i18n="common:min">${i18next.t("common:min")}</span>
                                </span>
                                <span class="count-delay">${delayInfo}</span>
                            </div>
                        </div>
                    </div>
                `);
            });
    
            $(".vehicle-type").off("click").on("click", (event) => {
                navigator.clipboard.writeText(`CreateSquad ${event.target.innerText}`);
                animateCSS($(event.target), "fadeIn");
                const originalText = event.target.innerText;
                event.target.innerText = i18next.t("tooltips:copied");
                setTimeout(() => {
                    animateCSS($(event.target), "fadeIn");
                    event.target.innerText = originalText;
                }, 2000);
            });
        });

        if (App.userSettings.enableFactions) {
            if (App.userSettings.defaultFactions) {
                const team1DefaultFaction = factionData.teamConfigs.team1.defaultFactionUnit.split("_")[0];
                const team2DefaultFaction = factionData.teamConfigs.team2.defaultFactionUnit.split("_")[0];
                $(".dropbtn8").val(team1DefaultFaction).trigger("change");
                $(".dropbtn10").val(team2DefaultFaction).trigger("change");
            } else {
                $(".dropbtn8").val("").trigger("change");
                $(".dropbtn10").val("").trigger("change");
            }
        }

        $(".btn-pin").off("click").on("click", (event) => {
            
            if ($(event.currentTarget).hasClass("active")) {
                this.unpinUnit();
                $(event.currentTarget).removeClass("active");
                $("#factionsButton button").empty().append(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                        <path fill="currentColor" d="M265.2 192c25.4 0 49.8 7.1 70.8 19.9L336 512l-192 0 0-174.3L90.4 428.3c-11.2 19-35.8 25.3-54.8 14.1s-25.3-35.8-14.1-54.8L97.7 258.8c24.5-41.4 69-66.8 117.1-66.8l50.4 0zM160 80a80 80 0 1 1 160 0A80 80 0 1 1 160 80zM448 0c8.8 0 16 7.2 16 16l0 116.3c9.6 5.5 16 15.9 16 27.7l0 109.3 16-5.3 0-56c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 84.5c0 6.9-4.4 13-10.9 15.2L480 325.3l0 26.7 48 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-44 0 23 92.1c2.5 10.1-5.1 19.9-15.5 19.9L432 512c-8.8 0-16-7.2-16-16l0-96-16 0c-17.7 0-32-14.3-32-32l0-144c0-17.7 14.3-32 32-32l0-32c0-11.8 6.4-22.2 16-27.7L416 32c-8.8 0-16-7.2-16-16s7.2-16 16-16l16 0 16 0z"/>
                    </svg>
                `);
                return;
            }
            this.unpinUnit();

            $(".btn-pin").removeClass("active").text(i18next.t("common:pinToMap"));
            $(".btn-pin").attr("data-i18n", "common:pinToMap");

            let country;
            let faction;
            let teamfaction;
            
            if (event.currentTarget.id === "team1PinButton") {
                country = $(".dropbtn8").val();
                faction = $(".dropbtn9").val();
                teamfaction = factionData.factions.team1factions;
            } else {
                country = $(".dropbtn10").val();
                faction = $(".dropbtn11").val();
                teamfaction = factionData.factions.team2factions;
            }

            // if country of faction is empty or null, return
            if (country === null || faction === null) return;
            if (country === "" || faction === "") return;

            $(event.currentTarget).addClass("active").text(i18next.t("common:pinned"));
            $(event.currentTarget).attr("data-i18n", "common:pinned");

            this.pinUnit(teamfaction, country, faction);
    
        });

        let factionPlaceholder = i18next.t("common:faction");
        let unitPlaceholder = i18next.t("common:unit");

        // Initialize Select2 with the structured data

        $(".dropbtn8").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#faction1"),
            allowClear: true,
            placeholder: factionPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatFactions(state, false),
            templateSelection: (state) => this.formatFactions(state, true),
        });

        $(".dropbtn10").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#faction2"),
            allowClear: true,
            placeholder: factionPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatFactions(state, false),
            templateSelection: (state) => this.formatFactions(state, true),
        });

        $(".dropbtn9").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#unit1"),
            placeholder: unitPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatUnits(state, false),
            templateSelection: (state) => this.formatUnits(state, true),
        });

        $(".dropbtn11").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#unit2"),
            placeholder: unitPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => this.formatUnits(state, false),
            templateSelection: (state) => this.formatUnits(state, true),
        });

    }

}