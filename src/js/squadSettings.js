import { initWebSocket, stopWebSocket } from "./smcConnector.js";

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
        this.segmentedDefinitions = this.getSegmentedDefinitions();
    }

    /**
     * Initialize all settings - call after DOM is ready
     */
    init() {
        document.getElementById("squadGuessrLogo").src = "/img/logos/squadguessr.webp";
        document.getElementById("squadBuildLogo").src = "/img/logos/squadbuild.webp";
        this.loadCheckboxes();
        this.loadSliders();
        this.loadSegmented();
        this.bindCheckboxes();
        this.bindSliders();
        this.bindSegmented();
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
                    document.body.classList.toggle("map-crosshair", !this.cursor);
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
            realMaxRange: {
                key: "settings-real-max-range",
                default: false,
                selector: "#settingsRealMaxRange",
                onChange: () => this.app.minimap.updateWeapons()
            },
            smo: {
                key: "settings-smo",
                default: false,
                selector: "#settingsSMO",
                onChange: (value) => value ? initWebSocket() : stopWebSocket()
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
                    document.getElementById("factionsButton").classList.toggle("collapsed", val);
                },
                onChange: (val) => {
                    document.getElementById("factionsButton").classList.toggle("collapsed", val);
                }
            },
            hideLowRespawn: {
                key: "settings-hide-lowrespawn",
                default: true,
                selector: "#settingsHideLowRespawn",
                onChange: () => {
                    const activePinBtn = document.querySelector(".btn-pin.active");
                    if (!activePinBtn) return;

                    // Clear all pinned vehicles & remove timers
                    document.querySelectorAll("#pinnedVehiclesTab .pinnedVehicles").forEach((vehicleDiv) => {
                        const timerId = vehicleDiv.dataset.timerId;
                        if (timerId) clearInterval(timerId);
                        vehicleDiv.classList.remove("active");
                        delete vehicleDiv.dataset.timerId;
                    });
                    document.getElementById("pinnedVehiclesTab").replaceChildren();

                    let factionData, country, faction;
                    if (activePinBtn.id === "team1PinButton") {
                        factionData = this.app.minimap.layer.layerData.units.team1Units;
                        country = document.querySelector(".dropbtn8").value;
                        faction = document.querySelector(".dropbtn9").value;
                    } else {
                        factionData = this.app.minimap.layer.layerData.units.team2Units;
                        country = document.querySelector(".dropbtn10").value;
                        faction = document.querySelector(".dropbtn11").value;
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
            showFlagsPath: {
                key: "settings-show-flags-path",
                default: true,
                selector: "#settingsShowFlagsPath",
                onChange: (val) => {
                    if (this.app.minimap.layer) this.app.minimap.layer._setPathVisibility(val);
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
                    if (val) document.querySelector(".btn-hd").classList.add("active");
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
     * Segmented-control setting definitions (2+ mutually exclusive buttons,
     * value stored as the clicked button's data-value) - same boolean storage
     * (0/1 in localStorage) as a checkbox, just a different widget
     */
    getSegmentedDefinitions() {
        return {
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
                const el = def.selector && document.querySelector(def.selector);
                if (el) {
                    el.disabled = true;
                    el.checked = false;
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
            const checkboxEl = def.selector && document.querySelector(def.selector);
            if (checkboxEl) {
                checkboxEl.checked = this[name];
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
            const el = document.querySelector(def.selector);
            if (!el) return;

            el.addEventListener("change", () => {
                this.set(name, el.checked);
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
     * Load all segmented-control settings from localStorage
     */
    loadSegmented() {
        Object.entries(this.segmentedDefinitions).forEach(([name, def]) => {
            const stored = localStorage.getItem(def.key);
            if (stored === null || isNaN(stored) || stored === "") {
                localStorage.setItem(def.key, def.default ? 1 : 0);
                this[name] = def.default;
            } else {
                this[name] = stored === "1" || stored === "true";
            }

            const container = def.selector && document.querySelector(def.selector);
            if (!container) return;
            container.querySelectorAll(".settings-segment").forEach((btn) => {
                btn.classList.toggle("active", (btn.dataset.value === "1") === this[name]);
            });
        });
    }

    /**
     * Bind click events to all segmented controls
     */
    bindSegmented() {
        Object.entries(this.segmentedDefinitions).forEach(([name, def]) => {
            const container = def.selector && document.querySelector(def.selector);
            if (!container) return;

            container.addEventListener("click", (event) => {
                const btn = event.target.closest(".settings-segment");
                if (!btn) return;
                const value = btn.dataset.value === "1";
                if (value === this[name]) return;

                container.querySelectorAll(".settings-segment").forEach((el) => {
                    el.classList.toggle("active", el === btn);
                });
                this.set(name, value);
            });
        });
    }

    /**
     * Apply initial state after loading (e.g., CSS filters, cursor, map mode)
     */
    applyInitialState() {
        // Load map mode from URL
        const currentUrl = new URL(window.location);
        const mapMode = currentUrl.searchParams.get("type");

        const mapModeButton = document.querySelector(".btn-" + mapMode);
        if (mapModeButton) {
            mapModeButton.classList.add("active");
        } else {
            // Default to basemap button
            document.querySelector(".btn-basemap").classList.add("active");
            this.app.updateUrlParams({type: null});
        }

        // Apply map filter
        this.applyMapFilter();

        // Apply cursor setting
        document.body.classList.toggle("map-crosshair", !this.cursor);

        // Hide factions if disabled via environment
        if (process.env.DISABLE_FACTIONS === "true") {
            document.querySelectorAll(".factionSettings").forEach((el) => el.style.display = "none");
        }

        // Hide SquadMortarOverlay connector setting if disabled via environment
        if (process.env.SMO_WEBSOCKET !== "true") {
            document.querySelectorAll(".smoSettings").forEach((el) => el.style.display = "none");
        }

        // Load target image
        document.getElementById("targetImg").setAttribute("src", "/img/target.webp");
    }

    /**
     * Apply brightness and contrast filter to map
     */
    applyMapFilter() {
        const brightness = this.brightness * 100;
        const contrast = this.contrast * 100;
        document.getElementById("map").style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
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
        const anyVisible = defs.some(d => !document.querySelector(d.buttons)._placeholder);
        document.querySelector(containerSelector).style.display = anyVisible ? "" : "none";
    }

    _updateDotsButton() {
        const anyDemoted = this.getButtonToggleDefinitions().some(d =>
            document.querySelector(d.buttons)._placeholder
        );
        document.getElementById("mapBtnTools").style.display = anyDemoted ? "" : "none";
    }

    _moveButtonsToMenu(def) {
        const dotsGroup = document.querySelector("#mapBtnTools .btnLayersGroup");
        document.querySelectorAll(def.buttons).forEach((el) => {
            const placeholder = document.createElement("span");
            placeholder.className = "btn-placeholder";
            el.before(placeholder);
            el._placeholder = placeholder;
            dotsGroup.appendChild(el);
        });
        this._updateSharedContainer(def.sharedContainer);
        this._updateDotsButton();
    }

    _restoreButtons(def) {
        document.querySelectorAll(def.buttons).forEach((el) => {
            const placeholder = el._placeholder;
            if (placeholder) {
                placeholder.before(el);
                placeholder.remove();
            }
            delete el._placeholder;
        });
        this._updateSharedContainer(def.sharedContainer);
        this._updateDotsButton();
    }

    loadButtonToggles() {
        this.getButtonToggleDefinitions().forEach(def => {
            const stored = localStorage.getItem(def.key);
            const val = stored === null ? def.default : stored === "1";
            if (!val) this._moveButtonsToMenu(def);
            document.querySelector(`#settingsDialog input[data-toolbar-key="${def.key}"]`).checked = val;
        });
        this._updateDotsButton();
    }

    bindButtonToggles() {
        document.getElementById("settingsDialog").addEventListener("change", (e) => {
            if (!e.target.matches("input[data-toolbar-key]")) return;
            const key = e.target.dataset.toolbarKey;
            const def = this.getButtonToggleDefinitions().find(d => d.key === key);
            if (!def) return;

            const newVal = e.target.checked;
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
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".returnBtn")) return;
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
        const def = this.definitions[name] || this.sliderDefinitions[name] || this.segmentedDefinitions[name];
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