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
        this.loadButtonToggles();
        this.bindButtonToggles();
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
                selector: "#settingsKeypadUnderCursor",
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
                selector: "#settingsClassicCursor",
                requiresMouse: true,
                onChange: () => {
                    $("body").toggleClass("map-crosshair", !this.cursor);
                }
            },

            // Weapon & Target Markers
            weaponDrag: {
                key: "settings-weapon-drag",
                default: true,
                selector: "#settingsWeaponDrag"
            },
            targetDrag: {
                key: "settings-target-drag",
                default: true,
                selector: "#settingsTargetDrag"
            },
            spreadRadius: {
                key: "settings-spread-radius",
                default: true,
                selector: "#settingsSpreadRadius",
                onChange: () => this.app.minimap.updateTargetsSpreads()
            },
            damageRadius: {
                key: "settings-damage-radius",
                default: true,
                selector: "#settingsDamageRadius",
                onChange: () => this.app.minimap.updateTargetsSpreads()
            },
            targetGrid: {
                key: "settings-target-grid",
                default: false,
                selector: "#settingsTargetGrid",
                onChange: () => this.app.minimap.updateTargets()
            },
            lineToTarget: {
                key: "settings-line-to-target",
                default: false,
                selector: "#settingsLineToTarget",
                onChange: () => this.app.minimap.updateTargets()
            },
            targetAnimation: {
                key: "settings-target-animation",
                default: true,
                selector: "#settingsTargetAnimation",
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
                selector: "#settingsRealMaxRange",
                onChange: () => this.app.minimap.updateWeapons()
            },
            // Calculation Display
            lowAndHigh: {
                key: "settings-low-high",
                default: false,
                selector: "#settingsLowAndHigh",
                onChange: () => this.app.minimap.updateTargets()
            },
            lastDigits: {
                key: "settings-last-digits",
                default: false,
                selector: "#settingsLastDigits",
                onChange: () => this.app.minimap.updateTargets()
            },
            showBearing: {
                key: "settings-show-bearing",
                default: true,
                selector: "#settingsBearing",
                onChange: () => this.app.minimap.updateTargets()
            },
            showDistance: {
                key: "settings-show-distance",
                default: false,
                selector: "#settingsDistance",
                onChange: () => this.app.minimap.updateTargets()
            },
            showTimeOfFlight: {
                key: "settings-show-timeofflight",
                default: false,
                selector: "#settingsTimeOfFlight",
                onChange: () => this.app.minimap.updateTargets()
            },
            showHeight: {
                key: "settings-show-height",
                default: false,
                selector: "#settingsHeightDiff",
                onChange: () => this.app.minimap.updateTargets()
            },
            copyTarget: {
                key: "settings-copy-target",
                default: false,
                selector: "#settingsTargetCopy"
            },


            // Factions & Layer
            enableFactions: {
                key: "settings-enable-factions",
                default: true,
                selector: "#settingsEnableFactions",
                controls: ["#settingsHideLowRespawn", "#settingsDisableSounds", "#settingsDefaultFactions", "#settingsMinimizeFactionBar"],
                onChange: (val) => {
                    if (!val) {
                        $("#factionsTab, #factionsButton").hide();
                        $("#settingsHideLowRespawn").prop("disabled", true);
                        $("#settingsDisableSounds").prop("disabled", true);
                        $("#settingsDefaultFactions").prop("disabled", true);
                        $("#settingsMinimizeFactionBar").prop("disabled", true);
                    } else {
                        $("#settingsHideLowRespawn").prop("disabled", false);
                        $("#settingsDisableSounds").prop("disabled", false);
                        $("#settingsDefaultFactions").prop("disabled", false);
                        $("#settingsMinimizeFactionBar").prop("disabled", false);
                        if (this.app.minimap.layer) {
                            this.app.minimap.layer.factions = new SquadFactions(this.app.minimap.layer);
                            $("#factionsTab, #factionsButton").show();
                        }
                    }
                }
            },
            defaultFactions: {
                key: "settings-default-factions",
                default: true,
                selector: "#settingsDefaultFactions"
            },
            disableSounds: {
                key: "settings-disable-sounds",
                default: false,
                selector: "#settingsDisableSounds"
            },
            minimizeFactionBar: {
                key: "settings-minimize-factionbar",
                default: false,
                selector: "#settingsMinimizeFactionBar",
                onLoad: (val) => {
                    $("#factionsButton").toggleClass("collapsed", val);
                },
                onChange: (val) => {
                    $("#factionsButton").toggleClass("collapsed", val);
                }
            },
            hideLowRespawn: {
                key: "settings-hide-lowrespawn",
                default: true,
                selector: "#settingsHideLowRespawn",
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
                selector: "#settingsRespawnCam",
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
                selector: "#settingsRevealLayerOnHover"
            },
            capZoneOnHover: {
                key: "settings-capZone-onHover",
                default: false,
                selector: "#settingsCapZoneOnHover",
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
                selector: "#settingsCirclesFlags",
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
                selector: "#settingsShowNextFlagPercentage",
                onChange: (val) => {
                    if (this.app.minimap.layer) {
                        if (val) {
                            this.app.minimap.layer.flags.forEach(flag => {
                                if (flag.percentageBreakdown?.length) flag.showPercentage();
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
                selector: "#settingsShowFlagsDistance",
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
                selector: "#settingsShowMapBorders",
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
                selector: "#settingsShowMainZones",
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
                selector: "#settingsShowMainAssets",
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
                selector: "#settingsMapAnimation"
            },
            contextMenu: {
                key: "settings-contextmenu",
                default: true,
                selector: null  // Not exposed in the settings dialog anymore, keeps its stored value
            },
            highQualityImages: {
                key: "settings-highquality-images",
                default: false,
                selector: null,  // Uses button, not checkbox
                onLoad: (val) => {
                    if (val) $(".btn-hd").addClass("active");
                }
            },


            // 3D Mode - mirrors the in-3D-view overlay card's own toggles (same
            // localStorage keys as Squad3DSimulation's STORAGE_KEYS); setToggle()
            // there applies the change live and keeps that card's checkbox in sync.
            threeDCapzones: {
                key: "settings-3d-capzones",
                default: true,
                selector: "#settings3dCapzones",
                onChange: (val) => this.app.simulation3D.setToggle("capzonesVisible", val)
            },
            threeDMinimap: {
                key: "settings-3d-minimap",
                default: true,
                selector: "#settings3dMinimap",
                onChange: (val) => this.app.simulation3D.setToggle("minimapVisible", val)
            },
            threeDPath: {
                key: "settings-3d-path",
                default: true,
                selector: "#settings3dPath",
                onChange: (val) => this.app.simulation3D.setToggle("pathVisible", val)
            },
            threeDArcs: {
                key: "settings-3d-arcs",
                default: true,
                selector: "#settings3dArcs",
                onChange: (val) => this.app.simulation3D.setToggle("arcsVisible", val)
            },
            threeDMarkers: {
                key: "settings-3d-markers",
                default: true,
                selector: "#settings3dMarkers",
                onChange: (val) => this.app.simulation3D.setToggle("markersVisible", val)
            },
            threeDTrees: {
                key: "settings-3d-trees",
                default: true,
                selector: "#settings3dTrees",
                onChange: (val) => this.app.simulation3D.setToggle("treesVisible", val)
            },
            threeDProps: {
                key: "settings-3d-props",
                default: true,
                selector: "#settings3dProps",
                onChange: (val) => this.app.simulation3D.setToggle("propsVisible", val)
            },
            threeDCrosshair: {
                key: "settings-3d-crosshair",
                default: true,
                selector: "#settings3dCrosshair",
                onChange: (val) => this.app.simulation3D.setToggle("crosshairVisible", val)
            },
            threeDFps: {
                key: "settings-3d-fps",
                default: true,
                selector: "#settings3dFps",
                onChange: (val) => this.app.simulation3D.setToggle("fpsVisible", val)
            },
            threeDControls: {
                key: "settings-3d-controls",
                default: true,
                selector: "#settings3dControls",
                onChange: (val) => this.app.simulation3D.setToggle("controlsVisible", val)
            }
        };
    }


    /**
     * Slider setting definitions
     * Range (min/max/step) lives on the <input type="range"> in settings.html
     */
    getSliderDefinitions() {
        return {
            fontSize: {
                key: "settings-font-size",
                default: 3,
                selector: "#settingsFontSize",
                onChange: () => this.app.changeFontSize()
            },
            markerSize: {
                key: "settings-marker-size",
                default: 3,
                selector: "#settingsMarkerSize",
                onChange: () => {
                    this.app.minimap.activeMarkers.eachLayer((marker) => { marker.updateIconSize(); });
                    this.app.minimap.activeTargetsMarkers.eachLayer((target) => { target.updateIcon(); });
                    this.app.minimap.activeWeaponsMarkers.eachLayer((weapon) => { weapon.updateIcon(); });
                }
            },
            gridOpacity: {
                key: "settings-grid-opacity",
                default: 0.8,
                selector: "#settingsGridOpacity",
                onChange: () => {
                    this.app.minimap.grid.setOpacity(this.gridOpacity);
                }
            },
            zoomSensitivity: {
                key: "settings-zoom-sensitivity",
                default: 2,
                selector: "#settingsZoomSensitivity",
                onChange: () => {
                    this.app.minimap.options.smoothSensitivity = this.zoomSensitivity;
                    this.app.minimap.options.wheelPxPerZoomLevel = 120 / this.zoomSensitivity;
                }
            },
            brightness: {
                key: "settings-brightness",
                default: 1,
                selector: "#settingsBrightness",
                onChange: () => this.applyMapFilter()
            },
            contrast: {
                key: "settings-contrast",
                default: 1,
                selector: "#settingsContrast",
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
            $("#settingsHideLowRespawn").prop("disabled", true);
            $("#settingsDisableSounds").prop("disabled", true);
            $("#settingsDefaultFactions").prop("disabled", true);
            $("#settingsMinimizeFactionBar").prop("disabled", true);
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

    getButtonToggleDefinitions() {
        return [
            { key: "settings-btn-layers",  sharedContainer: "#mapBtnLayers",  buttons: ".btn-topomap, .btn-terrainmap, .btn-basemap", default: true },
            { key: "settings-btn-hd",      sharedContainer: null,             buttons: ".btn-hd",                                   default: true },
            { key: "settings-btn-3d",      sharedContainer: null,             buttons: ".btn-3d",                                   default: true },
            { key: "settings-btn-layer-info", sharedContainer: "#mapBtnMain", buttons: ".btn-layer-info",                           default: true },
            { key: "settings-btn-legacy",  sharedContainer: "#mapBtnMain",    buttons: ".btn-legacy",                                default: false },
            { key: "settings-btn-helpmap", sharedContainer: "#mapBtnMain",    buttons: ".btn-helpmap",                               default: false },
            { key: "settings-btn-focus",   sharedContainer: "#mapBtnMain",    buttons: ".btn-focus",                                 default: false },
            { key: "settings-btn-servers", sharedContainer: "#mapBtnServers", buttons: "#servers",                                  default: true },
            { key: "settings-btn-session", sharedContainer: "#mapBtnServers", buttons: "#sessionGroup",                             default: true },
            { key: "settings-btn-undo",        sharedContainer: "#mapBtnActions",     buttons: ".btn-undo",         default: true },
            { key: "settings-btn-delete",      sharedContainer: "#mapBtnActions",     buttons: ".btn-delete",       default: true },
            { key: "settings-btn-download",    sharedContainer: "#mapBtnMain",        buttons: ".btn-download",     default: false },
            { key: "settings-btn-upload",      sharedContainer: "#mapBtnMain",        buttons: ".btn-upload",       default: false },
        ];
    }

    _updateSharedContainer(containerSelector) {
        if (!containerSelector) return;
        const defs = this.getButtonToggleDefinitions().filter(d => d.sharedContainer === containerSelector);
        const anyVisible = defs.some(d => !$(d.buttons).data("placeholder"));
        $(containerSelector).toggle(anyVisible);
    }

    _updateDotsButton() {
        const anyDemoted = this.getButtonToggleDefinitions().some(d =>
            $(d.buttons).data("placeholder")
        );
        $("#mapBtnTools").toggle(anyDemoted);
    }

    _moveButtonsToMenu(def) {
        const $dotsGroup = $("#mapBtnTools .btnLayersGroup");
        $(def.buttons).each((_, el) => {
            const $el = $(el);
            const $placeholder = $("<span class=\"btn-placeholder\"></span>");
            $el.before($placeholder);
            $el.data("placeholder", $placeholder);
            $dotsGroup.append($el);
        });
        this._updateSharedContainer(def.sharedContainer);
        this._updateDotsButton();
    }

    _restoreButtons(def) {
        $(def.buttons).each((_, el) => {
            const $el = $(el);
            const $placeholder = $el.data("placeholder");
            if ($placeholder && $placeholder.length) {
                $placeholder.before($el);
                $placeholder.remove();
            }
            $el.removeData("placeholder");
        });
        this._updateSharedContainer(def.sharedContainer);
        this._updateDotsButton();
    }

    loadButtonToggles() {
        this.getButtonToggleDefinitions().forEach(def => {
            const stored = localStorage.getItem(def.key);
            const val = stored === null ? def.default : stored === "1";
            if (!val) this._moveButtonsToMenu(def);
            $(`#settingsDialog input[data-toolbar-key="${def.key}"]`).prop("checked", val);
        });
        this._updateDotsButton();
    }

    bindButtonToggles() {
        $("#settingsDialog").on("change", "input[data-toolbar-key]", (e) => {
            const key = e.currentTarget.dataset.toolbarKey;
            const def = this.getButtonToggleDefinitions().find(d => d.key === key);
            if (!def) return;

            const newVal = e.currentTarget.checked;
            localStorage.setItem(key, newVal ? 1 : 0);

            if (newVal) {
                this._restoreButtons(def);
            } else {
                this._moveButtonsToMenu(def);
            }
        });
    }

    /**
     * Bind settings button event (switch to map mode from legacy)
     */
    bindMenuButtons() {
        $(document).on("click", ".returnBtn", (event) => {
            event.preventDefault();
            this.app.switchUI();
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

    isModEnabled(modKey) {
        const stored = localStorage.getItem(`settings-mod-${modKey}`);
        return stored === null ? false : stored === "1";
    }

    setModEnabled(modKey, enabled) {
        localStorage.setItem(`settings-mod-${modKey}`, +enabled);
    }
}