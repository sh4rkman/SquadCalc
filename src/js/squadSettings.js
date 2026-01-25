import { animateCSS } from "./animations.js";
import SquadFactions from "./squadFactions.js";

/**
 * Centralized settings management for SquadCalc.
 * Handles loading, saving, and UI binding for all user preferences.
 */
export default class SquadSettings {

    static get TYPES() {
        return {
            CHECKBOX: "checkbox",
            SLIDER: "slider"
        };
    }

    constructor(app) {
        this.app = app;
        this.definitions = this.getCheckboxDefinitions();
        this.sliderDefinitions = this.getSliderDefinitions();
    }

    /**
     * Initialize all settings - call after DOM is ready
     */
    init() {
        this.loadCheckboxes();
        this.loadSliders();
        this.bindCheckboxes();
        this.bindSliders();
        this.bindLabelClicks();
        this.bindMenuButtons();
        this.applyInitialState();
    }


    /**
     * Checkbox setting definitions
     * Each setting has: key (localStorage), default, selector, and optional onChange handler
     */
    getCheckboxDefinitions() {
        return {
            // Keypad & Cursor
            keypadUnderCursor: {
                key: "settings-keypad-cursor",
                default: false,
                selector: "#keypadUnderCursorSetting",
                requiresMouse: true,
                onChange: (val) => {
                    if (val) {
                        this.app.minimap.on("pointermove", this.app.minimap._handleMouseMove);
                    } else {
                        this.app.minimap.off("pointermove", this.app.minimap._handleMouseMove);
                        this.app.minimap.mouseLocationPopup.close();
                    }
                }
            },
            cursor: {
                key: "settings-cursor",
                default: false,
                selector: "#cursorChoiceSettings",
                requiresMouse: true,
                onChange: () => {
                    $("body").toggleClass("map-crosshair", !this.cursor);
                }
            },

            // Weapon & Target Markers
            weaponDrag: {
                key: "settings-weapon-drag",
                default: true,
                selector: "#weaponDragSetting"
            },
            targetDrag: {
                key: "settings-target-drag",
                default: true,
                selector: "#targetDragSetting"
            },
            spreadRadius: {
                key: "settings-spread-radius",
                default: true,
                selector: "#spreadRadiusSetting",
                onChange: () => this.app.minimap.updateTargetsSpreads()
            },
            damageRadius: {
                key: "settings-damage-radius",
                default: true,
                selector: "#damageRadiusSetting",
                onChange: () => this.app.minimap.updateTargetsSpreads()
            },
            targetGrid: {
                key: "settings-target-grid",
                default: false,
                selector: "#targetGridSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            lineToTarget: {
                key: "settings-line-to-target",
                default: false,
                selector: "#lineToTargetSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            targetAnimation: {
                key: "settings-target-animation",
                default: true,
                selector: "#targetAnimationSettings",
                onChange: () => {
                    this.app.minimap.activeTargetsMarkers.eachLayer((target) => {
                        target.updateCalcPopUps();
                        target.updateIcon();
                    });
                }
            },
            realMaxRange: {
                key: "settings-real-max-range",
                default: false,
                selector: "#realMaxRangeSettings",
                onChange: () => this.app.minimap.updateWeapons()
            },
            experimentalWeapons: {
                key: "settings-experimental-weapons",
                default: false,
                selector: "#experimentalSetting",
                onChange: () => this.app.toggleExperimentalWeapons()
            },


            // Calculation Display
            lowAndHigh: {
                key: "settings-low-high",
                default: false,
                selector: "#lowAndHighSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            lastDigits: {
                key: "settings-last-digits",
                default: false,
                selector: "#lastDigitsSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            showBearing: {
                key: "settings-show-bearing",
                default: true,
                selector: "#bearingSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            showDistance: {
                key: "settings-show-distance",
                default: false,
                selector: "#distanceSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            showTimeOfFlight: {
                key: "settings-show-timeofflight",
                default: false,
                selector: "#timeOfFlightSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            showHeight: {
                key: "settings-show-height",
                default: false,
                selector: "#heightSetting",
                onChange: () => this.app.minimap.updateTargets()
            },
            copyTarget: {
                key: "settings-copy-target",
                default: false,
                selector: "#targetCopySetting"
            },


            // Factions & Layer
            enableFactions: {
                key: "settings-enable-factions",
                default: true,
                selector: "#enableFactionsSettings",
                controls: ["#hideLowRespawnSettings", "#disableSoundsSettings", "#defaultFactionsSettings"],
                onChange: (val) => {
                    if (!val) {
                        $("#factionsTab").hide();
                        $("#hideLowRespawnSettings").prop("disabled", true);
                        $("#disableSoundsSettings").prop("disabled", true);
                        $("#defaultFactionsSettings").prop("disabled", true);
                    } else {
                        $("#hideLowRespawnSettings").prop("disabled", false);
                        $("#disableSoundsSettings").prop("disabled", false);
                        $("#defaultFactionsSettings").prop("disabled", false);
                        if (this.app.minimap.layer) {
                            this.app.minimap.layer.factions = new SquadFactions(this.app.minimap.layer);
                            $("#factionsTab").show();
                        }
                    }
                }
            },
            defaultFactions: {
                key: "settings-default-factions",
                default: true,
                selector: "#defaultFactionsSettings"
            },
            disableSounds: {
                key: "settings-disable-sounds",
                default: false,
                selector: "#disableSoundsSettings"
            },
            hideLowRespawn: {
                key: "settings-hide-lowrespawn",
                default: true,
                selector: "#hideLowRespawnSettings",
                onChange: () => {
                    if ($(".btn-pin.active").length === 0) return;

                    // Clear all pinned vehicles & remove timers
                    $("#pinnedVehiclesTab .pinnedVehicles").each(function() {
                        const $vehicleDiv = $(this);
                        const timerId = $vehicleDiv.data("timerId");
                        if (timerId) clearInterval(timerId);
                        $vehicleDiv.removeClass("active");
                        $vehicleDiv.removeData("timerId");
                    });
                    $("#pinnedVehiclesTab").empty();

                    let factionData, country, faction;
                    if ($(".btn-pin.active")[0]?.id === "team1PinButton") {
                        factionData = this.app.minimap.layer.layerData.units.team1Units;
                        country = $(".dropbtn8").val();
                        faction = $(".dropbtn9").val();
                    } else {
                        factionData = this.app.minimap.layer.layerData.units.team2Units;
                        country = $(".dropbtn10").val();
                        faction = $(".dropbtn11").val();
                    }
                    this.app.minimap.layer.factions.pinUnit(factionData, country, faction);
                }
            },
            showRespawnCam: {
                key: "settings-show-respawn-cam",
                default: true,
                selector: "#respawnCamSettings",
                onChange: (val) => {
                    if (val) {
                        this.app.minimap.layer.cameraActor?.show();
                    } else {
                        this.app.minimap.layer.cameraActor?.hide();
                    }
                }
            },
            revealLayerOnHover: {
                key: "settings-reveal-onHover",
                default: true,
                selector: "#revealLayerOnHoverSettings"
            },
            capZoneOnHover: {
                key: "settings-capZone-onHover",
                default: false,
                selector: "#capZoneOnHoverSettings",
                onChange: (val) => {
                    if (!this.app.minimap.layer) return;
                    if (this.app.minimap.getZoom() <= this.app.minimap.detailedZoomThreshold) return;
                    if (!val) {
                        this.app.minimap.layer.revealAllCapzones();
                    } else {
                        this.app.minimap.layer.hideAllCapzones();
                    }
                }
            },


            // Flags & Zones
            circlesFlags: {
                key: "settings-circles-flags",
                default: true,
                selector: "#circlesFlagsSettings",
                onChange: () => {
                    if (this.app.minimap.layer) {
                        this.app.minimap.layer.flags.forEach(flag => flag.update());
                        if (!this.app.minimap.layer.isVisible) {
                            this.app.minimap.layer.toggleVisibility();
                        }
                    }
                }
            },
            showNextFlagsPercentages: {
                key: "settings-show-next-flags-percentages",
                default: true,
                selector: "#showNextFlagPercentageSettings",
                onChange: (val) => {
                    if (this.app.minimap.layer) {
                        if (val) {
                            this.app.minimap.layer.flags.forEach(flag => {
                                if (flag.isNext) flag.showPercentage();
                            });
                        } else {
                            this.app.minimap.layer.flags.forEach(flag => {
                                flag.percentageText?.removeFrom(this.app.minimap.layer.layerGroup).remove();
                            });
                        }
                    }
                }
            },
            showFlagsDistance: {
                key: "settings-show-flags-distance",
                default: true,
                selector: "#showFlagsDistanceSettings",
                onChange: (val) => {
                    if (this.app.minimap.layer) {
                        if (val) {
                            this.app.minimap.layer.polyline.showMeasurements({
                                minPixelDistance: 50,
                                scaling: this.app.minimap.mapToGameScale,
                            });
                        } else {
                            this.app.minimap.layer.polyline.hideMeasurements();
                        }
                    }
                }
            },
            showMapBorders: {
                key: "settings-show-map-borders",
                default: true,
                selector: "#showMapBordersSettings",
                onChange: (val) => {
                    if (this.app.minimap.layer.borders) {
                        this.app.minimap.layer.borders.setStyle({
                            opacity: 0,
                            fillOpacity: val ? 0.75 : 0
                        });
                    }
                }
            },
            showMainZones: {
                key: "settings-show-mainzones",
                default: true,
                selector: "#showMainZonesSettings",
                onChange: (val) => {
                    this.app.minimap.layer.mainZones.rectangles.forEach((rectangle) => {
                        rectangle.setStyle({
                            fillOpacity: val ? 0.1 : 0,
                            opacity: val ? 1 : 0
                        });
                    });
                }
            },
            showMainAssets: {
                key: "settings-show-mainassets",
                default: true,
                selector: "#showMainAssetsSettings",
                onChange: (val) => {
                    if (this.app.minimap.getZoom() > this.app.minimap.detailedZoomThreshold) {
                        this.app.minimap.layer.mainZones.assets.forEach(asset => {
                            asset.setOpacity(val ? 1 : 0);
                            if (val) {
                                this.app.minimap.layer.revealSpawns();
                            } else {
                                this.app.minimap.layer.hideSpawns();
                            }
                        });
                        this.app.minimap.layer.vehicleSpawners.forEach(spawn => {
                            if (val) spawn.show();
                            else spawn.hide();
                        });
                    }
                }
            },


            // Map & UI
            smoothMap: {
                key: "settings-smooth-map",
                default: false,
                selector: "#mapAnimationSettings"
            },
            contextMenu: {
                key: "settings-contextmenu",
                default: true,
                selector: "#contextMenuSettings"
            },
            highQualityImages: {
                key: "settings-highquality-images",
                default: false,
                selector: null,  // Uses button, not checkbox
                onLoad: (val) => {
                    if (val) $(".btn-hd").addClass("active");
                }
            }
        };
    }


    /**
     * Slider setting definitions
     * Values must match HTML input attributes
     */
    getSliderDefinitions() {
        return {
            fontSize: {
                key: "settings-font-size",
                min: 0.5,
                default: 3,
                max: 1.5,
                selector: "#fontSlider",
                ticksSelector: "#fontTicks",
                tickValues: [0.5, 1, 1.5],
                defaultTickIndex: 1,
                formatTick: (val) => `${val * 100}%`,
                onChange: () => this.app.changeFontSize()
            },
            markerSize: {
                key: "settings-marker-size",
                min: 0.5,
                default: 3,
                max: 1.5,
                selector: "#markerSlider",
                ticksSelector: "#markerTicks",
                tickValues: [0.5, 1, 1.5],
                defaultTickIndex: 1,
                formatTick: (val) => `${val * 100}%`,
                onChange: () => {
                    this.app.minimap.activeMarkers.eachLayer((marker) => { marker.updateIconSize(); });
                    this.app.minimap.activeTargetsMarkers.eachLayer((target) => { target.updateIcon(); });
                    this.app.minimap.activeWeaponsMarkers.eachLayer((weapon) => { weapon.updateIcon(); });
                }
            },
            gridOpacity: {
                key: "settings-grid-opacity",
                min: 0,
                default: 0.8,
                max: 1,
                selector: "#gridSlider",
                ticksSelector: "#gridTicks",
                tickValues: [0, 0.8, 1],
                defaultTickIndex: 1,
                formatTick: (val) => `${val * 100}%`,
                onChange: () => {
                    this.app.minimap.grid.setOpacity(this.gridOpacity);
                }
            },
            zoomSensitivity: {
                key: "settings-zoom-sensitivity",
                min: 0.5,
                default: 2,
                max: 1.5,
                selector: "#zoomSlider",
                ticksSelector: "#zoomTicks",
                tickValues: [0.5, 1, 1.5],
                defaultTickIndex: 1,
                formatTick: (val) => `${val * 100}%`,
                onChange: () => {
                    this.app.minimap.options.smoothSensitivity = this.zoomSensitivity;
                    this.app.minimap.options.wheelPxPerZoomLevel = 120 / this.zoomSensitivity;
                }
            },
            brightness: {
                key: "settings-brightness",
                min: 0.5,
                default: 1,
                max: 1.5,
                selector: "#brightnessSlider",
                ticksSelector: "#brightnessTicks",
                tickValues: [0.5, 1, 1.5],
                defaultTickIndex: 1,
                formatTick: (val) => `${val * 100}%`,
                onChange: () => this.applyMapFilter()
            },
            contrast: {
                key: "settings-contrast",
                min: 0.5,
                default: 1,
                max: 1.5,
                selector: "#contrastSlider",
                ticksSelector: "#contrastTicks",
                tickValues: [0.5, 1, 1.5],
                defaultTickIndex: 1,
                formatTick: (val) => `${val * 100}%`,
                onChange: () => this.applyMapFilter()
            }
        };
    }


    /**
     * Load all checkbox settings from localStorage
     */
    loadCheckboxes() {
        Object.entries(this.definitions).forEach(([name, def]) => {
            // Handle mouse-dependent settings
            if (def.requiresMouse && !this.app.hasMouse) {
                this[name] = false;
                if (def.selector) {
                    $(def.selector).prop("disabled", true).prop("checked", false);
                }
                return;
            }

            const stored = localStorage.getItem(def.key);
            if (stored === null || isNaN(stored) || stored === "") {
                localStorage.setItem(def.key, def.default ? 1 : 0);
                this[name] = def.default;
            } else {
                this[name] = stored === "1" || stored === "true";
            }

            // Update checkbox state
            if (def.selector) {
                $(def.selector).prop("checked", this[name]);
            }

            // Call onLoad if defined
            if (def.onLoad) {
                def.onLoad(this[name]);
            }
        });
    }


    /**
     * Load all slider settings from localStorage
     */
    loadSliders() {
        Object.entries(this.sliderDefinitions).forEach(([name, def]) => {
            const stored = localStorage.getItem(def.key);
            
            if (stored === null || isNaN(stored) || stored === "") {
                localStorage.setItem(def.key, def.default);
                this[name] = def.default;
            } else {
                this[name] = parseFloat(stored);
            }

            const slider = document.getElementById(def.selector.replace("#", ""));
            if (slider) {
                slider.value = this[name];
            }

            // Create tick marks
            this.createSliderTicks(def);
        });
    }

    /**
     * Create tick marks for a slider
     */
    createSliderTicks(def) {
        const ticks = document.getElementById(def.ticksSelector.replace("#", ""));
        if (!ticks) return;

        def.tickValues.forEach((val, index) => {
            const tick = document.createElement("div");
            tick.className = "tick";
            tick.setAttribute("data-value", def.formatTick(val));
            
            const percent = ((val - def.min) / (def.max - def.min)) * 100;
            tick.style.left = percent + "%";
            
            if (index === def.defaultTickIndex) {
                tick.classList.add("default-tick");
            }
            ticks.appendChild(tick);
        });
    }


    /**
     * Bind change events to all checkboxes
     */
    bindCheckboxes() {
        Object.entries(this.definitions).forEach(([name, def]) => {
            if (!def.selector) return;

            $(def.selector).on("change", () => {
                const val = $(def.selector).is(":checked");
                this.set(name, val);
            });
        });
    }

    /**
     * Bind input events to all sliders
     */
    bindSliders() {
        Object.entries(this.sliderDefinitions).forEach(([name, def]) => {
            const slider = document.getElementById(def.selector.replace("#", ""));
            if (!slider) return;

            slider.oninput = () => {
                this[name] = parseFloat(slider.value);
                localStorage.setItem(def.key, this[name]);
                if (def.onChange) {
                    def.onChange(this[name]);
                }
            };
        });
    }

    /**
     * Bind click events to setting labels for toggle behavior
     */
    bindLabelClicks() {
        $(".toggleCheckbox").on("click", function() {
            const checkbox = $(this).closest("tr").find("input[type='checkbox']");
            if (checkbox.prop("disabled")) return;
            checkbox.prop("checked", !checkbox.prop("checked")).trigger("change");
            animateCSS($(this).closest("td"), "headShake");
        });
    }


    /**
     * Apply initial state after loading (e.g., CSS filters, cursor, map mode)
     */
    applyInitialState() {
        // Load map mode from URL
        const currentUrl = new URL(window.location);
        const mapMode = currentUrl.searchParams.get("type");

        if ($(".btn-" + mapMode).length) {
            $(".btn-" + mapMode).addClass("active");
        } else {
            // Default to basemap button
            $(".btn-basemap").addClass("active");
            this.app.updateUrlParams({type: null});
        }

        // Apply map filter
        this.applyMapFilter();

        // Apply cursor setting
        $("body").toggleClass("map-crosshair", !this.cursor);

        // Handle faction-dependent settings
        if (!this.enableFactions) {
            $("#hideLowRespawnSettings").prop("disabled", true);
            $("#disableSoundsSettings").prop("disabled", true);
            $("#defaultFactionsSettings").prop("disabled", true);
        }

        // Hide factions if disabled via environment
        if (process.env.DISABLE_FACTIONS === "true") {
            $(".factionSettings").hide();
        }

        // Load target image
        $("#targetImg").attr("src", "/img/target.webp");
    }

    /**
     * Apply brightness and contrast filter to map
     */
    applyMapFilter() {
        const brightness = this.brightness * 100;
        const contrast = this.contrast * 100;
        $("#map").css("filter", `brightness(${brightness}%) contrast(${contrast}%)`);
    }

    /**
     * Bind menu button events (footer menu open/close, help dialog)
     */
    bindMenuButtons() {
        // Open/close footer menu
        $(document).on("click", "#fabCheckbox4", () => {
            const footerButtons = document.getElementById("footerButtons");
            if (!footerButtons.classList.contains("expanded")) {
                footerButtons.classList.add("expanded");
                $(".fab4").html("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 640\"><path d=\"M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z\"/></svg>");
            } else {
                this.app.closeMenu();
            }

            // Close menu when clicking outside
            document.addEventListener("click", (e) => {
                if (footerButtons.classList.contains("expanded") && !footerButtons.contains(e.target)) {
                    this.app.closeMenu();
                }
            });
        });

        // Open help dialog
        $(document).on("click", "#fabCheckbox", () => {
            $("#helpDialog")[0].showModal();
            this.app.closeMenu();
        });
    }

    /**
     * Set a setting value and trigger side effects
     * @param {string} name - Setting name
     * @param {*} value - New value
     */
    set(name, value) {
        const def = this.definitions[name] || this.sliderDefinitions[name];
        if (!def) {
            console.warn(`Unknown setting: ${name}`);
            return;
        }

        this[name] = value;
        localStorage.setItem(def.key, +value);

        if (def.onChange) {
            def.onChange(value);
        }
    }

    /**
     * Get a setting value
     * @param {string} name - Setting name
     * @returns {*} Setting value
     */
    get(name) {
        return this[name];
    }
}