import { MAPS, initMapsProperties } from "../data/maps.js";
import { WEAPONS, WEAPONSTYPE } from "../data/weapons.js";
import { MODS } from "../data/mods.js";
import { squadMinimap } from "./squadMinimap.js";
import { Weapon } from "./squadWeapons.js";
import { animateCSS, animateCalc } from "./animations.js";
import { triggerChange } from "./domUtils.js";
import { loadLanguage } from "./localization.js";
import { tooltip_save, createSessionTooltips, leaveSessionTooltips } from "./tooltips.js";
import { checkApiHealth, fetchLayersByMap, fetchLayerByName } from "./squadCalcAPI.js";
import { initWebSocket } from "./smcConnector.js";
import { LatLng } from "leaflet";
import SquadServersBrowser from "./squadServersBrowser.js";
import SquadSession from "./squadSession.js";
import SquadFiringSolution from "./squadFiringSolution.js";
import SquadSettings from "./squadSettings.js";
import packageInfo from "../../package.json";
import { marked, Renderer } from "marked";
import Choices from "choices.js";

const changelogRenderer = new Renderer();
changelogRenderer.link = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

function fadeOut(el, duration, callback) {
    const start = parseFloat(getComputedStyle(el).opacity) || 1;
    const startTime = performance.now();
    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        el.style.opacity = start * (1 - progress);
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.style.display = "none";
            callback?.();
        }
    }
    requestAnimationFrame(step);
}
import i18next from "i18next";
import SquadLayer from "./squadLayer.js";
import Squad3DSimulation, { decodeShareToken } from "./squad3DSimulation.js";
import { serverBrowserTooltips, settingsTooltips, layerInfoTooltips, threeDTooltips } from "./tooltips.js";
import { MapDrawing, MapArrow, MapCircle, MapRectangle } from "./squadShapes.js";



/**
 * Main class for SquadCalc
 * @classdesc Holds all the main functions
 */
export default class SquadCalc {

    static get DEFAULT_SHORTCUTS() {
        return {
            toggleMap:        { key: "m",       ctrl: false, alt: false, shift: false },
            switchUI:         { key: "m",       ctrl: true,  alt: false, shift: false },
            focusMode:        { key: "Enter",   ctrl: false, alt: false, shift: false },
            clearTargets:     { key: "Delete",  ctrl: false, alt: false, shift: false },
            deleteLastTarget: { key: "z",       ctrl: true,  alt: false, shift: false },
            saveMap:          { key: "s",       ctrl: true,  alt: false, shift: false },
        };
    }

    static get SHORTCUT_ACTIONS() {
        return [
            { id: "toggleMap",        i18nKey: "settings:toggleMap"        },
            { id: "switchUI",         i18nKey: "settings:switchUI"          },
            { id: "focusMode",        i18nKey: "settings:enter"             },
            { id: "clearTargets",     i18nKey: "settings:clearTargets"      },
            { id: "deleteLastTarget", i18nKey: "settings:deleteLastTarget"  },
            { id: "saveMap",          i18nKey: "settings:saveMap"           },
        ];
    }

    /**
     * @param {Array} [options]
     */
    constructor(options) {
        this.supportedLanguages = options.supportedLanguages;
        this.MAPSIZE = options.mapSize;
        this.gravity = options.gravity;
        this.debug = options.debug;
        this.userSettings = new SquadSettings(this);
        this.shortcuts = this.loadShortcuts();
        this.activeWeapon = "";
        this.hasMouse = matchMedia("(pointer:fine)").matches;
        this.MAP_SELECTOR = document.querySelector(".dropbtn");
        this.WEAPON_SELECTOR = document.querySelector(".dropbtn2");
        this.SHELL_SELECTOR = document.querySelector(".dropbtn3");
        this.LAYER_SELECTOR = document.querySelector(".dropbtn5");
        this.SERVER_SELECTOR = document.querySelector(".dropbtn6");
        this.FACTION1_SELECTOR = document.querySelector(".dropbtn8");
        this.FACTION2_SELECTOR = document.querySelector(".dropbtn10");
        this.UNIT1_SELECTOR = document.querySelector(".dropbtn9");
        this.UNIT2_SELECTOR = document.querySelector(".dropbtn11");
        this.session = false;
        this.version = packageInfo.version;
    }

    init() {
        this.urlIntent = this.parseUrlIntent();
        loadLanguage(this.supportedLanguages);
        initMapsProperties();
        this.userSettings.init();
        this.loadMapSelector();
        this.loadMinimap();
        this.loadWeapons();
        this.loadUI();
        this.loadTheme();
        checkApiHealth();
        initWebSocket();
        console.log(`SquadCalc v${this.version} Loaded! 🎯`);
    }

    parseUrlIntent() {
        const p = new URLSearchParams(window.location.search);

        // "?3d" alone just opens the 3D view; "?3d=<token>" (see threeDShareButton, in
        // loadUI(), and decodeShareToken()) also spawns the camera at that exact world
        // position/facing - _openInitial3D() strips the token back down to a bare "3d"
        // flag once it's been consumed, so this only ever matters on the very first load.
        const threeDValue = p.get("3d");
        const threeDPosition = threeDValue ? decodeShareToken(threeDValue) : null;

        return {
            server:    p.get("server"),
            session:   p.get("session"),
            map:       p.get("map"),
            layer:     p.get("layer"),
            team1:     p.get("team1"),
            team1unit: p.get("team1unit"),
            team2:     p.get("team2"),
            team2unit: p.get("team2unit"),
            threeD:    p.has("3d"),
            threeDPosition,
        };
    }

    applyUrlIntent() {
        const { server, session } = this.urlIntent;
        if (server)       this.initServerMode(server, session);
        else if (session) this.initSessionMode(session, this.urlIntent);
        else              this.initStaticMode(this.urlIntent, () => this._openInitial3D());
        this.initFavoriteServers();
    }

    /**
     * If the URL asked for the 3D view (?3d=1), opens it once on initial page load -
     * after the map loads if the URL has no layer, or after the layer loads if it does.
     */
    _openInitial3D() {
        if (!this.urlIntent.threeD || this.minimap.activeMap.no3D) return;
        this.show3D();
        this.simulation3D.open(this.minimap.activeMap, this.minimap.layer, this.minimap, null, this.urlIntent.threeDPosition);
        // The share token's only useful once, to spawn the camera above - drop it back
        // down to a bare "3d" flag so it doesn't linger in the address bar afterwards.
        if (this.urlIntent.threeDPosition) this.updateUrlParams({ "3d": "" });
    }

    /**
     * Opens the 3D view - shared by the map's own "3D" button and the target dialog's
     * "See in 3D" button (squadTargetMarker.js, via App.open3D()).
     * @param {?{firingSolution: object, angleType: string}} [arcRequest] - additionally
     * highlights this exact weapon/target/angle - see
     * Squad3DSimulation.open()/_drawProjectileArcs()
     */
    open3D(arcRequest = null) {
        this.show3D();
        this.simulation3D.open(this.minimap.activeMap, this.minimap.layer, this.minimap, arcRequest);
        this.updateUrlParams({ "3d": "" });
    }

    /**
     * Opens the 3D view standing at a clicked point on the 2D map - the right-click
     * context menu's "3D" item (squadContextMenu.js).
     * @param {object} latlng - Leaflet latlng to spawn the camera at
     */
    open3DAt(latlng) {
        if (this.minimap.activeMap.no3D) return;
        this.show3D();
        this.simulation3D.open(this.minimap.activeMap, this.minimap.layer, this.minimap, null, null, latlng);
        this.updateUrlParams({ "3d": "" });
    }

    /**
     * Whether the 3D view (#threeDView) is currently shown.
     * @returns {boolean}
     */
    get is3DOpen() {
        return !this.threeDView.hidden;
    }

    /**
     * Shows the 3D view container. It's a plain fixed <div>, not a modal dialog, so the
     * header's map/layer selectors stay usable on top of it - see header.scss's
     * .threeD-open rule. Callers still start the simulation themselves (open()).
     */
    show3D() {
        threeDTooltips.hide();
        threeDTooltips.disable();
        this.threeDView.hidden = false;
        document.body.classList.add("threeD-open");
    }

    /**
     * Hides the 3D view and stops the simulation - Quit button, Esc, or switching
     * to a map without 3D data.
     */
    hide3D() {
        if (!this.is3DOpen) return;
        this.threeDView.hidden = true;
        document.body.classList.remove("threeD-open");
        this.simulation3D.close();
        setTimeout(() => threeDTooltips.enable(), 50);
        this.updateUrlParams({ "3d": null });
    }

    /**
     * Keeps an open 3D view in sync with the header's map/layer selectors - see
     * Squad3DSimulation.refresh().
     * @param {?SquadLayer} [layer] - defaults to the current layer; null right after a map
     * change, before the new map's layer has loaded (minimap.layer is still the old one)
     */
    refresh3D(layer = this.minimap.layer) {
        if (!this.is3DOpen) return;
        if (this.minimap.activeMap.no3D) {
            this.hide3D();
            return;
        }
        this.simulation3D.refresh(this.minimap.activeMap, layer, this.minimap);
    }

    /**
     * Redraws an open 3D view's overlays after a change on the 2D map (often made from
     * the 3D minimap itself): a weapon/target/map marker placed, moved or removed
     * (squadMarker.js), or a flag clicked (SquadLayer._handleFlagClick()). Batched, so a
     * burst of changes - a session sync, "clear all" - only redraws once.
     */
    refresh3DOverlays() {
        if (!this.is3DOpen) return;
        clearTimeout(this._refresh3DOverlaysTimeout);
        this._refresh3DOverlaysTimeout = setTimeout(() => this.refresh3D(), 100);
    }

    initServerMode(serverId, sessionId = null) {
        if (!this.squadServersBrowser) {
            this.squadServersBrowser = new SquadServersBrowser();
            this.squadServersBrowser.init();
        }

        const setup = () => {
            const server = this.squadServersBrowser.serversData?.find(s => s.id == serverId);

            if (!server) {
                this.updateUrlParams({ server: null });
                this.openToast("error", "serverNotFound", "");
                this.loadLayers();
                this.initStaticMode(this.urlIntent);
                return;
            }

            if (!server.team1 || !server.team2 || !server.mapName) {
                this.updateUrlParams({ server: null });
                this.serverSelect.setChoiceByValue("");
                triggerChange(this.SERVER_SELECTOR, true);
                this.loadLayers();
                this.initStaticMode(this.urlIntent);
                return;
            }

            // Server found — discard any URL team overrides; map/layer are overwritten by switchLayer
            this.updateUrlParams({ team1: null, team1unit: null, team2: null, team2unit: null });

            this.squadServersBrowser.selectedServer = server.id;
            this.squadServersBrowser.selectedLayer = server.attributes.details.map;

            this.squadServersBrowser.switchLayer(
                server.attributes.name,
                server.mapName,
                server.attributes.details.map,
                server.team1FactionId || server.team1,
                server.team2FactionId || server.team2,
                server.attributes.details.squad_teamOne,
                server.attributes.details.squad_teamTwo
            );

            document.querySelectorAll("#serversTableBody tr").forEach((el) => el.classList.remove("selected"));
            document.querySelector(`#serversTableBody tr[data-serverid="${serverId}"]`)?.classList.add("selected");
            document.getElementById("servers").classList.add("active");

            if (this.squadServersBrowser.syncInterval) clearInterval(this.squadServersBrowser.syncInterval);
            this.squadServersBrowser.syncInterval = setInterval(
                () => this.squadServersBrowser.syncWithServer(),
                this.squadServersBrowser.refreshInterval * 1000
            );

            if (sessionId) this.initSessionMode(sessionId);
        };

        if (this.squadServersBrowser.serversData) {
            setup();
        } else {
            document.addEventListener("servers:loaded", setup, { once: true });
        }
    }

    initSessionMode(sessionId, intent = null) {
        document.querySelectorAll(".btn-session").forEach((el) => el.classList.add("active"));
        createSessionTooltips.disable();
        leaveSessionTooltips.enable();

        const startSession = () => { this.session = new SquadSession(sessionId); };

        if (intent?.layer) {
            this.initStaticMode(intent, startSession);
        } else if (this.layersLoaded) {
            startSession();
        } else {
            document.addEventListener("layers:loaded", startSession, { once: true });
        }
    }

    initStaticMode(intent, onLayerLoaded = null) {
        if (!intent.layer) {
            onLayerLoaded?.();
            return;
        }

        const applyLayer = () => {
            const urlLayerName = intent.layer.toLowerCase().replaceAll(" ", "");
            const match = Array.from(this.LAYER_SELECTOR.options).find((el) =>
                (el.dataset.urlid ?? "").toLowerCase() === urlLayerName
            );

            if (!match) {
                this.updateUrlParams({ layer: null });
                onLayerLoaded?.();
                return;
            }

            match.selected = true;
            this.layerSelect.setChoiceByValue(match.value);

            if (intent.team1 || intent.team2 || onLayerLoaded) {
                document.addEventListener("layer:loaded", () => {
                    [
                        { faction: intent.team1, unit: intent.team1unit, fSel: this.FACTION1_SELECTOR, uSel: this.UNIT1_SELECTOR },
                        { faction: intent.team2, unit: intent.team2unit, fSel: this.FACTION2_SELECTOR, uSel: this.UNIT2_SELECTOR },
                    ].forEach(({ faction, unit, fSel, uSel }) => {
                        if (faction) {
                            const fm = Array.from(fSel.options).find((el) => el.value.toLowerCase() === faction.toLowerCase());
                            if (fm) { fSel.value = fm.value; triggerChange(fSel, false); }
                        }
                        if (unit) {
                            const um = Array.from(uSel.options).find((el) => el.value.toLowerCase() === unit.toLowerCase());
                            if (um) { uSel.value = um.value; triggerChange(uSel, false); }
                        }
                    });
                    this.updateUrlParams({ team1: null, team1unit: null, team2: null, team2unit: null });
                    onLayerLoaded?.();
                }, { once: true });
            }

            triggerChange(this.LAYER_SELECTOR, false);
        };

        if (this.layersLoaded) {
            applyLayer();
        } else {
            document.addEventListener("layers:loaded", applyLayer, { once: true });
        }
    }

    /**
     * Load the maps to the menu
     */
    loadMapSelector() {

        // TEMP DEBUG: keeps dropdowns open while devtools steals focus - remove after debugging
        this._disableBlurClose = (instance) => {
            instance.containerOuter.element.removeEventListener("blur", instance._onBlur);
            instance.input.element.removeEventListener("blur", instance._onBlur);
        };

        // With searchChoices:false, Choices never re-renders the dropdown on input, so
        // hide/show the already-rendered rows ourselves by text match instead of going
        // through setChoices() - that keeps real optgroups (nothing gets rebuilt) and
        // never touches the backing <select>'s actual selected option, unlike rebuilding
        // the choice set every keystroke (which risks losing or faking the selection).
        this._wireGroupedSearch = (instance) => {
            instance.input.element.addEventListener("input", (e) => {
                const q = e.target.value.trim().toLowerCase();
                const rows = instance.choiceList.element.querySelectorAll(".choices__item--selectable");
                rows.forEach((row) => {
                    const match = !q || row.textContent.toLowerCase().includes(q);
                    row.classList.toggle("choices__item--search-hidden", !match);
                    // Choices' arrow-key nav walks siblings by [data-choice-selectable] alone,
                    // not visibility - drop it on hide so hidden rows get skipped instead of
                    // silently receiving the highlight while invisible.
                    if (match) {
                        row.dataset.choiceSelectable = "";
                    } else {
                        delete row.dataset.choiceSelectable;
                        row.classList.remove("is-highlighted");
                    }
                });
                // the visible heading text sits in a .choices__heading child, but that div
                // has no siblings of its own - the group wrapper (.choices__group) is what's
                // actually a sibling of the item rows that follow it, up to the next group
                instance.choiceList.element.querySelectorAll(".choices__group").forEach((group) => {
                    let sibling = group.nextElementSibling;
                    let anyVisible = false;
                    while (sibling && !sibling.classList.contains("choices__group")) {
                        if (!sibling.classList.contains("choices__item--search-hidden")) anyVisible = true;
                        sibling = sibling.nextElementSibling;
                    }
                    group.classList.toggle("choices__item--search-hidden", !anyVisible);
                });
                // select2 auto-highlighted the first match so Enter selected it right away -
                // mirror that instead of leaving nothing highlighted until an arrow key is pressed
                const firstMatch = instance.choiceList.element.querySelector(".choices__item--selectable:not(.choices__item--search-hidden)");
                if (firstMatch) {
                    instance._highlightChoice(firstMatch);
                } else {
                    instance._removeHighlightedChoices();
                }
            });
            // nothing re-renders the dropdown on close (unlike setChoices-driven filtering),
            // so the hidden rows from the last search would otherwise still be hidden next
            // time it opens - reset on close instead of on open, since choiceList can get
            // rebuilt in between (mod toggle, map change) and lose our classes anyway
            instance.passedElement.element.addEventListener("hideDropdown", () => {
                instance.input.element.value = "";
                instance.choiceList.element.querySelectorAll(".choices__item--search-hidden").forEach((el) => {
                    el.classList.remove("choices__item--search-hidden");
                    el.dataset.choiceSelectable = "";
                });
            });
        };

        // Initiate Maps&Layers Dropdown
        this.mapSelect = new Choices(this.MAP_SELECTOR, {
            searchEnabled: true,
            searchChoices: false,
            searchResultLimit: -1,
            shouldSort: false,
            itemSelectText: "",
        });
        this.layerSelect = new Choices(this.LAYER_SELECTOR, {
            searchEnabled: true,
            // Choices' own Fuse search flattens groups and drops optgroup headers from
            // the results - searchChoices:false skips that internal filtering (keeps the
            // search box UI) so _wireGroupedSearch() below can filter+setChoices() itself,
            // which keeps real optgroups since isSearching never flips true.
            searchChoices: false,
            searchResultLimit: -1,
            shouldSort: false,
            itemSelectText: "",
            removeItemButton: true,
            removeItemButtonAlignLeft: true,
        });
        this.serverSelect = new Choices(this.SERVER_SELECTOR, {
            searchEnabled: false,
            shouldSort: false,
            itemSelectText: "",
            removeItemButton: true,
            removeItemButtonAlignLeft: true,
        });
        [this.mapSelect, this.layerSelect, this.serverSelect].forEach(this._disableBlurClose);
        this._wireGroupedSearch(this.mapSelect);
        this._wireGroupedSearch(this.layerSelect);
        this.SERVER_SELECTOR.addEventListener("change", (event) => {
            const serverId = event.target.value;
            if (!serverId) {
                this.updateUrlParams({ server: null });
                document.querySelectorAll("#serversTableBody tr").forEach((el) => el.classList.remove("selected"));
                document.getElementById("servers").classList.remove("active");
                if (this.squadServersBrowser) {
                    this.squadServersBrowser.selectedServer = null;
                    clearInterval(this.squadServersBrowser.syncInterval);
                    this.squadServersBrowser.syncInterval = null;
                }
                return;
            }
            // buildFavoriteServersDropdown() re-triggers "change" just to refresh its own
            // Choices UI selection - skip re-running server mode when it's already active
            if (this.squadServersBrowser && String(this.squadServersBrowser.selectedServer) === String(serverId)) return;

            this.updateUrlParams({ server: serverId });
            this.initServerMode(serverId);
        });
        // Load maps
        this._rebuildMapSelector();

        // Add event listener
        this.MAP_SELECTOR.addEventListener("change", (event) => {

            // Update the minimap with the selected map
            this.minimap.activeMap = MAPS.find((_, index) => index == event.target.value);
            this.minimap.clear(); 
            this.minimap.draw();

            // Broadcast the map change to the session if needed
            const broadcast = event.broadcast ?? true;

            // Update the URL
            if (broadcast) {
                this.updateUrlParams({ map: this.minimap.activeMap.name, layer: null, team1: null, team1unit: null, team2: null, team2unit: null });
            } else {
                this.updateUrlParams({ map: this.minimap.activeMap.name });
            }
            
            // Refresh layer selector
            this.loadLayers();

            // Start loading the new map's terrain in an open 3D view right away - its
            // layer follows on "layer:loaded"
            this.refresh3D(null);

            if (broadcast && this.session.ws && this.session.ws.readyState === WebSocket.OPEN) {
                this.session.ws.send(
                    JSON.stringify({
                        type: "UPDATE_MAP",
                        activeMap: this.MAP_SELECTOR.value,
                    })
                );
                console.debug(`Sent map update for map #${this.MAP_SELECTOR.value}`);
            }
        });

        let abortController = null;

        this.LAYER_SELECTOR.addEventListener("change", (event) => {

            const selectedLayerValue = this.LAYER_SELECTOR.selectedOptions[0]?.dataset.urlid ?? "";
            const selectedLayerMod = this.LAYER_SELECTOR.selectedOptions[0]?.dataset.mod;
            const broadcast = event.broadcast ?? true;

            // User cleared the layer selector, remove the layer and clean the URL
            if (selectedLayerValue === "") {
                this.updateUrlParams({ layer: null, team1: null, team1unit: null, team2: null, team2unit: null });
                if (abortController) { abortController.abort(); } // Abort the ongoing fetch request
                if (this.minimap.layer) this.minimap.layer.clear();
                document.querySelectorAll(".btn-layer, .btn-layer-info").forEach((el) => el.style.display = "none");
                document.querySelectorAll("#factionsTab, #factionsButton").forEach((el) => el.style.display = "none");
                this.refresh3D(null);

                // Empty Factions&Units selectors
                this.FACTION1_SELECTOR.replaceChildren();
                this.UNIT1_SELECTOR.replaceChildren();
                this.FACTION2_SELECTOR.replaceChildren();
                this.UNIT2_SELECTOR.replaceChildren();

                if (broadcast && this.session.ws && this.session.ws.readyState === WebSocket.OPEN) {
                    this.session.ws.send(
                        JSON.stringify({
                            type: "UPDATE_LAYER",
                            layer: event.target.value,
                        })
                    );
                    console.debug(`Sent layer update for layer #${event.target.value}`);
                }
                return;
            }

            document.querySelector(".dropbtn8").replaceChildren();
            document.querySelector(".dropbtn10").replaceChildren();
            
            // Update the the URL
            if (broadcast) {
                this.updateUrlParams({ layer: selectedLayerValue, team1: null, team1unit: null, team2: null, team2unit: null });
            } else {
                this.updateUrlParams({ layer: selectedLayerValue });
            }

            // Abort any in-progress layer fetch before starting a new one
            if (abortController) abortController.abort();
            abortController = new AbortController();
            const signal = abortController.signal;
            this.minimap.spin(true, this.minimap.spinOptions);
            fetchLayerByName(event.target.value, { signal })
                .catch(error => {
                    if (error.name !== "AbortError") {
                        this.openToast("error", "error", "apiError");
                        console.error("Error fetching layer data:", error);
                    }
                    document.querySelectorAll("#factionsTab, #factionsButton").forEach((el) => el.style.display = "none");
                    this.minimap.spin(false);
                    // falls through to .then() below with layerData undefined, which bails out
                })
                .then(layerData => {
                    if (!layerData) return; // prevent continuing on fetch failure

                    // Warm the browser cache now so the layer info dialog's thumbnail
                    // is already loaded by the time the user opens it, instead of
                    // flashing the previous layer's image while this one loads.
                    new Image().src = `${process.env.API_URL}/img/thumbnails/${encodeURIComponent(layerData.rawName)}.webp`;

                    if (this.minimap.layer) this.minimap.layer.clear();
                    this.minimap.layer = new SquadLayer(this.minimap, layerData, broadcast, selectedLayerMod);
                    const btnLayer = document.querySelector(".btn-layer");
                    btnLayer.classList.add("active");
                    btnLayer.style.removeProperty("display");
                    document.querySelector(".btn-layer-info").style.removeProperty("display");

                    if (broadcast && this.session.ws?.readyState === WebSocket.OPEN) {
                        this.session.ws.send(
                            JSON.stringify({
                                type: "UPDATE_LAYER",
                                layer: event.target.value,
                            })
                        );
                        console.debug(`Sent layer update for layer #${event.target.value}`);
                    }

                    this.layerLoaded = true;
                    document.dispatchEvent(new CustomEvent("layer:loaded"));
                    this.refresh3D();
                    this.minimap.spin(false);
                });
        });
    }

    /**
     * Retrieve list of available layers name from squadcalc api
     */
    loadLayers() {
        this.minimap.spin(true, this.minimap.spinOptions);
        document.getElementById("layerSelector").style.display = "none";
        const selectedValue = this.LAYER_SELECTOR.value;

        const enabledMods = this._getUniqueMods().filter(mod => this.userSettings.isModEnabled(mod));

        fetchLayersByMap(this.minimap.activeMap.name, enabledMods).then(layers => {

            if (layers.length === 0) {
                this.minimap.spin(false);
                this.updateUrlParams({ layer: null, team1: null, team1unit: null, team2: null, team2unit: null });
                return;
            }

            // Choices has no live DOM sync (unlike select2) - built as a plain array for
            // setChoices() below. data-urlid/data-mod aren't part of what Choices understands
            // as value/label, so they're patched onto the real <option>s it creates afterward -
            // they're read elsewhere via jQuery .data() (the LAYER_SELECTOR change handler,
            // initStaticMode()).
            const meta = new Map();
            const mapName = this.minimap.activeMap.name;

            const vanillaChoices = layers.filter(layer => !layer.mod).map((layer) => {
                meta.set(layer.rawName, { urlid: layer.shortName.replaceAll(" ", "") });
                return { value: layer.rawName, label: layer.shortName };
            });

            const moddedGroups = enabledMods.map((modKey) => {
                const modChoices = layers.filter(layer => layer.mod?.toLowerCase() === modKey.toLowerCase()).map((layer) => {
                    // rawName sometimes carries an extra variant tag between the mod prefix and the
                    // map name (e.g. "SU_GoingDark_Anvil_AAS_v1") that shortName doesn't reflect.
                    // mapName itself can contain underscores (e.g. "Hrodna_Border"), so it's matched
                    // as a token subsequence rather than a single token.
                    const tokens = layer.rawName.split("_");
                    const mapNameTokens = mapName.toLowerCase().split("_");
                    let mapIdx = -1;
                    for (let i = 0; i <= tokens.length - mapNameTokens.length; i++) {
                        if (mapNameTokens.every((t, j) => tokens[i + j].toLowerCase() === t)) {
                            mapIdx = i;
                            break;
                        }
                    }
                    const prefixTag = mapIdx > 1 ? tokens.slice(1, mapIdx).join(" ") : "";
                    const tagsBeforeShortName = [prefixTag];

                    // rawName can also carry an extra tag AFTER the version number that shortName
                    // doesn't reflect (e.g. "SU_Chornivsk_RVAAS_v1_Large" vs "..._v1", or GC's
                    // "GC_VenatorAssault_INV_V1_R" / "..._V1_S" faction-locked variants, sometimes
                    // hyphenated onto the version token itself like "GC_Venator_SKM_V1-L").
                    // Anything found after/attached to the version token is treated as a suffix tag.
                    let suffixTag = "";
                    const verIdx = tokens.findIndex(t => /^v\d+/i.test(t));
                    if (verIdx !== -1) {
                        const [, dashSuffix] = tokens[verIdx].split("-");
                        const typeTokenIdx = verIdx - 1;
                        const typeToken = typeTokenIdx >= 0 ? tokens[typeTokenIdx] : null;
                        const firstWord = layer.shortName.trim().split(" ")[0];

                        // A separate tag can also sit between the map name and the type token
                        // (e.g. "SD_AlBasrah_Legacy_Invasion_v1" vs "SD_AlBasrah_Invasion_v1").
                        if (mapIdx !== -1 && typeTokenIdx > mapIdx + mapNameTokens.length) {
                            tagsBeforeShortName.push(tokens.slice(mapIdx + mapNameTokens.length, typeTokenIdx).join(" "));
                        }

                        let typeSuffix = "";
                        if (typeToken && typeToken.toLowerCase() !== firstWord.toLowerCase()) {
                            if (typeToken.length > firstWord.length && typeToken.toLowerCase().startsWith(firstWord.toLowerCase())) {
                                // glued-on suffix, e.g. "SeedVehicle" vs "Seed"
                                typeSuffix = typeToken.slice(firstWord.length);
                            } else if (typeToken !== typeToken.toUpperCase()) {
                                // A genuinely different mode name mapped to the same shortName
                                // (e.g. "Rampage"/"Track_Attack" both showing as "Invasion"/"RAAS"),
                                // as opposed to an all-caps abbreviation like "INV"/"SKM" that's just
                                // shorthand for a shortName word it doesn't otherwise match.
                                tagsBeforeShortName.push(typeToken);
                            }
                        }

                        suffixTag = [typeSuffix, dashSuffix, ...tokens.slice(verIdx + 1)].filter(Boolean).join(" ");
                    }

                    const displayName = [...tagsBeforeShortName, layer.shortName.trim(), suffixTag].filter(Boolean).join(" ");

                    meta.set(layer.rawName, { urlid: `${modKey}_${displayName.replaceAll(" ", "")}`, mod: modKey });
                    return { value: layer.rawName, label: displayName };
                });

                return { label: i18next.t(`settings:${modKey}`, { defaultValue: modKey }), choices: modChoices };
            }).filter(group => group.choices.length);

            const allLayerChoices = [...vanillaChoices, ...moddedGroups.flatMap(group => group.choices)];
            const selectedStillExists = allLayerChoices.some(choice => choice.value === selectedValue);
            if (selectedStillExists) {
                allLayerChoices.find(choice => choice.value === selectedValue).selected = true;
            }

            const placeholder = { value: "", label: i18next.t("common:layerPlaceholder"), placeholder: true, selected: !selectedStillExists };
            const choices = enabledMods.length
                ? [placeholder, { label: i18next.t("settings:vanilla", { defaultValue: "Vanilla" }), choices: vanillaChoices }, ...moddedGroups]
                : [placeholder, ...vanillaChoices];

            this.layerSelect.setChoices(choices, "value", "label", true, true, true);

            meta.forEach(({ urlid, mod }, value) => {
                const option = Array.from(this.LAYER_SELECTOR.options).find((el) => el.value === value);
                if (!option) return;
                option.setAttribute("data-urlid", urlid);
                if (mod) option.setAttribute("data-mod", mod);
            });

            // Choices' rendered placeholder (closed value + dropdown row) isn't the native
            // <option> the generic data-i18n loop would normally catch - tag it directly so
            // a later language switch retranslates it like everything else.
            this.LAYER_SELECTOR.querySelector("option[value='']")?.setAttribute("data-i18n", "common:layerPlaceholder");
            this.LAYER_SELECTOR.closest(".dropdown").querySelector(".choices__placeholder")?.setAttribute("data-i18n", "common:layerPlaceholder");

            if (selectedStillExists) {
                triggerChange(this.LAYER_SELECTOR, true);
            }

            this.minimap.spin(false);
            document.getElementById("layerSelector").style.removeProperty("display");

            this.layersLoaded = true;
            document.dispatchEvent(new CustomEvent("layers:loaded"));

        }).catch(error => {
            document.getElementById("layerSelector").style.display = "none";
            this.minimap.spin(false);
            this.openToast("error", "error", "apiError_layers");
            console.debug("Error fetching layers from API:", error);
        });
    }


    /**
     * Retrieve some CSS variable so it can be used in plain JS
     */
    loadTheme() {
        this.mainColor = getComputedStyle(document.documentElement).getPropertyValue("--main-color").trim();
    }


    async initFavoriteServers() {
        let favoriteIds;
        try {
            const stored = localStorage.getItem("favoriteServers");
            if (!stored) return;
            favoriteIds = new Set(JSON.parse(stored));
        } catch {
            return;
        }
        if (favoriteIds.size === 0) return;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(`${process.env.API_URL}/get/servers`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) return;
            const data = await response.json();
            const favoriteServers = (data.servers || []).filter(s => favoriteIds.has(String(s.id)));
            if (favoriteServers.length === 0) return;
            this.buildFavoriteServersDropdown(favoriteServers);
        } catch {
            // favorites dropdown is optional, fail silently
        }
    }


    buildFavoriteServersDropdown(servers) {
        const currentServerId = this.squadServersBrowser?.selectedServer ?? this.urlIntent.server;
        const unavailableValues = [];

        const serverChoices = servers.map(server => {
            const unavailable = !server.team1 || !server.team2 || !server.mapName;
            const isActive = !unavailable && currentServerId && String(currentServerId) === String(server.id);
            if (unavailable) unavailableValues.push(String(server.id));
            return {
                value: String(server.id),
                label: server.attributes.name,
                disabled: unavailable,
                selected: isActive,
            };
        });

        // title isn't part of what Choices understands as a choice - patched onto the
        // real <option> afterward, same as loadLayers()'s data-urlid/data-mod.
        this.serverSelect.setChoices([{ value: "", label: i18next.t("common:favServers"), placeholder: true }, ...serverChoices], "value", "label", true, true, true);
        unavailableValues.forEach(value => {
            this.SERVER_SELECTOR.querySelectorAll("option").forEach((el) => {
                if (el.value === value) el.setAttribute("title", "Modded layer");
            });
        });

        this.SERVER_SELECTOR.querySelector("option[value='']")?.setAttribute("data-i18n", "common:favServers");
        this.SERVER_SELECTOR.closest(".dropdown").querySelector(".choices__placeholder")?.setAttribute("data-i18n", "common:favServers");

        triggerChange(this.SERVER_SELECTOR, true);
        // #serverSelector's own stylesheet rule sets display:none - removeProperty wouldn't undo that
        document.getElementById("serverSelector").style.display = "block";
    }


    loadMinimap(){
        const currentUrl = new URL(window.location.href);
        let mapIndex;

        // try to retrieve map from URL
        if (currentUrl.searchParams.has("map")) {
            const urlMapName = currentUrl.searchParams.get("map").toLowerCase();
            mapIndex = MAPS.findIndex(map => map.name.toLowerCase() === urlMapName);
            if (mapIndex === -1) {
                // user entered garbage, pick a random map & clean the url
                mapIndex = Math.floor(Math.random() * MAPS.length);
                this.updateUrlParams({ layer: null, team1: null, team1unit: null, team2: null, team2unit: null });
            }
        } 
        else {
            // mapIndex = Math.floor(Math.random() * MAPS.length); // pick a random map
            mapIndex = 0; // New Basrah
        }

        // A linked map may belong to a mod that isn't enabled yet - turn it on
        // so the map, its layers and the mods panel all agree it's active
        const requiredMod = MAPS[mapIndex].mod;
        if (requiredMod && !this.userSettings.isModEnabled(requiredMod)) {
            this.userSettings.setModEnabled(requiredMod, true);
            this._rebuildMapSelector();
        }

        this.mapSelect.setChoiceByValue(String(mapIndex));
        this.minimap = new squadMinimap("map", this.MAPSIZE, MAPS[mapIndex]);
        this.minimap.draw();

        // Update the URL & Layer
        this.updateUrlParams({ map: this.minimap.activeMap.name });

        // In server mode, skip the initial layers fetch — switchLayer will load
        // the correct map's layers once server data arrives
        if (!this.urlIntent.server) {
            this.loadLayers();
        }

    }

    /**
     * Load weapons into html
     */
    loadWeapons() {

        WEAPONS.forEach((weapon, index, arr) => {
            arr[index] = new Weapon(
                weapon.name,
                weapon.deceleration,
                weapon.decelerationTime,
                weapon.gravityScale,
                weapon.minElevation,
                weapon.unit,
                weapon.logo,
                weapon.marker,
                weapon.type,
                weapon.angleType,
                weapon.elevationPrecision,
                weapon.shells,
                weapon.heightOffset,
                weapon.angleOffset,
                weapon.projectileLifespan,
                weapon.mod
            );
        });
        
        // Initiate Weapons & Shells Dropdown
        this.weaponSelect = new Choices(this.WEAPON_SELECTOR, {
            searchEnabled: true,
            searchChoices: false,
            searchResultLimit: -1,
            shouldSort: false,
            itemSelectText: "",
        });
        this.shellSelect = new Choices(this.SHELL_SELECTOR, {
            searchEnabled: false,
            shouldSort: false,
            itemSelectText: "",
        });
        [this.weaponSelect, this.shellSelect].forEach(this._disableBlurClose);
        this._wireGroupedSearch(this.weaponSelect);

        // Populate the Mods settings panel and apply currently enabled mods
        // (this also does the weapon selector's first build, see _rebuildModdedWeapons())
        this.initModsPanel();

        // Add Events Listeners
        this.WEAPON_SELECTOR.addEventListener("change", () => { this.changeWeapon(); });
        this.SHELL_SELECTOR.addEventListener("change", () => { this.activeWeapon.changeShell(); });
        
        this.getWeapon();
    }

    /**
     * Returns known mod keys - the explicit MODS list (source of truth, so a
     * mod that only ships layers for vanilla maps still gets a settings toggle),
     * unioned with any mod key found in WEAPONS/MAPS in case one was added
     * there without being added to MODS yet.
     */
    _getUniqueMods() {
        const weaponMods = WEAPONS.filter(w => w.mod).map(w => w.mod);
        const mapMods = MAPS.filter(m => m.mod).map(m => m.mod);
        return [...new Set([...MODS, ...weaponMods, ...mapMods])].sort();
    }

    /**
     * Populate the settings dialog Mods tab with one row per mod
     * Re-run once layer counts arrive from the API (see checkApiHealth())
     */
    _renderMods() {
        const list = document.querySelector("#settingsDialog .settings-mods");
        if (!list) return;
        list.replaceChildren();

        const mods = this._getUniqueMods().sort((a, b) => {
            const labelA = i18next.t(`settings:${a}`, { defaultValue: a });
            const labelB = i18next.t(`settings:${b}`, { defaultValue: b });
            return labelA.localeCompare(labelB);
        });

        mods.forEach((modKey) => {
            const label = i18next.t(`settings:${modKey}`, { defaultValue: modKey });
            const layers = this.layerCounts?.[modKey.toLowerCase()] ?? 0;
            const weapons = WEAPONS.filter(w => w.mod === modKey).length;
            const maps = MAPS.filter(m => m.mod === modKey).length;
            const stats = [];
            if (layers > 0) stats.push(i18next.t("settings:modLayersCount", { count: layers, defaultValue: `${layers} Layers` }));
            if (weapons > 0) stats.push(i18next.t("settings:modWeaponsCount", { count: weapons, defaultValue: `${weapons} Weapons` }));
            if (maps > 0) stats.push(i18next.t("settings:modMapsCount", { count: maps, defaultValue: `${maps} Maps` }));
            const checked = this.userSettings.isModEnabled(modKey) ? " checked" : "";

            list.insertAdjacentHTML("beforeend", `
                <div class="settings-field settings-mod-field">
                    <label class="settings-mod">
                        <img class="settings-mod-logo" src="/img/mods/${modKey.toLowerCase()}.webp" alt="" onerror="this.style.visibility='hidden'">
                        <span class="settings-mod-text">
                            <span class="settings-mod-name settings-search-text" data-i18n="settings:${modKey}">${label}</span>
                            <span class="settings-field-hint">${stats.join(" • ")}</span>
                        </span>
                        <input type="checkbox" data-mod="${modKey}"${checked}>
                        <span class="settings-chip-box"><svg class="settings-chip-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
                    </label>
                </div>
            `);
        });

        // Delegated so it survives re-renders, bound once
        if (!this._modsToggleBound) {
            this._modsToggleBound = true;
            list.addEventListener("change", (e) => {
                if (!e.target.matches("input[data-mod]")) return;
                this.userSettings.setModEnabled(e.target.dataset.mod, e.target.checked);
                this._rebuildModdedWeapons();
                const mapWasReset = this._rebuildMapSelector();
                if (!mapWasReset && this.minimap.activeMap) this.loadLayers();
            });
        }
    }

    /**
     * Rebuild the map selector: vanilla maps always shown, plus one optgroup
     * per enabled mod that has its own maps (same mechanics as the layer selector).
     * Falls back to the first vanilla map if the currently active map got hidden
     * (e.g. its mod was just disabled). Returns true if that fallback fired.
     */
    _rebuildMapSelector() {
        const selectedValue = this.MAP_SELECTOR.value;
        const enabledMods = this._getUniqueMods().filter(modKey => this.userSettings.isModEnabled(modKey));

        // Choices has no live DOM sync (unlike select2) - every rebuild goes through
        // setChoices() with a plain data array instead of appending <option>s.
        const mapChoice = (map, i) => ({ value: String(i), label: i18next.t("maps:" + map.name), selected: String(i) === selectedValue });

        const vanillaMaps = MAPS.map((map, i) => ({ map, i })).filter(({ map }) => !map.mod).map(({ map, i }) => mapChoice(map, i));

        const choices = enabledMods.length
            ? [{ label: i18next.t("settings:vanilla", { defaultValue: "Vanilla" }), choices: vanillaMaps }]
            : vanillaMaps;

        enabledMods.forEach(modKey => {
            const modMaps = MAPS.map((map, i) => ({ map, i })).filter(({ map }) => map.mod === modKey).map(({ map, i }) => mapChoice(map, i));
            if (modMaps.length) {
                choices.push({ label: i18next.t(`settings:${modKey}`, { defaultValue: modKey }), choices: modMaps });
            }
        });

        this.mapSelect.setChoices(choices, "value", "label", true, true, true);

        const selectedStillExists = MAPS.some((map, i) =>
            String(i) === selectedValue && (!map.mod || enabledMods.includes(map.mod))
        );

        // Selection didn't actually move - setChoices() above already marked it selected,
        // no need to re-trigger "change" (which would wipe the map and reload the layer
        // for nothing, since map/layer never changed)
        if (selectedStillExists) {
            return false;
        }

        if (this.minimap?.activeMap) {
            this.mapSelect.setChoiceByValue("0");
            triggerChange(this.MAP_SELECTOR, true);
            return true;
        }

        return false;
    }

    /**
     * Build the weapon selector's choices: vanilla optgroups by WEAPONSTYPE, plus
     * one optgroup per enabled mod. Choices has no live DOM sync (unlike select2),
     * so every rebuild - initial load, mod toggling, post-i18n-load refresh - goes
     * through this same full array instead of patching individual <optgroup>s.
     * @param {string} selectedValue
     */
    _buildWeaponChoices(selectedValue) {
        const weaponChoice = (weapon, index) => ({
            value: String(index),
            label: i18next.t("weapons:" + weapon.name),
            selected: String(index) === selectedValue,
        });

        const choices = WEAPONSTYPE.map(type => ({
            label: i18next.t(`weapons:${type}`),
            choices: WEAPONS
                .map((weapon, index) => ({ weapon, index }))
                .filter(({ weapon }) => weapon.type === type)
                .map(({ weapon, index }) => weaponChoice(weapon, index)),
        })).filter(group => group.choices.length);

        this._getUniqueMods().forEach(modKey => {
            if (!this.userSettings.isModEnabled(modKey)) return;

            const modWeapons = WEAPONS
                .map((weapon, index) => ({ weapon, index }))
                .filter(({ weapon }) => weapon.mod === modKey)
                .map(({ weapon, index }) => weaponChoice(weapon, index));

            if (modWeapons.length) {
                choices.push({ label: i18next.t(`settings:${modKey}`, { defaultValue: modKey }), choices: modWeapons });
            }
        });

        return choices;
    }

    /**
     * Rebuild the weapon selector's optgroups based on currently enabled mods
     */
    _rebuildModdedWeapons() {
        const selectedValue = this.WEAPON_SELECTOR.value;
        const selectedIsModded = !!(WEAPONS[selectedValue]?.mod);

        this.weaponSelect.setChoices(this._buildWeaponChoices(selectedValue), "value", "label", true, true, true);

        if (selectedIsModded) {
            this.weaponSelect.setChoiceByValue("0");
            triggerChange(this.WEAPON_SELECTOR, true);
        }
    }

    /**
     * Initialize the Mods settings panel and apply currently enabled mods to the weapon selector
     */
    initModsPanel() {
        this._renderMods();
        this._rebuildModdedWeapons();
    }




    loadUI(){
        this._dialogs = {
            calc:    document.querySelector("#calcInformation"),
            weapon:  document.querySelector("#weaponInformation"),
            factions:document.querySelector("#factionsDialog"),
            settings: document.querySelector("#settingsDialog"),
            servers: document.querySelector("#serversInformation"),
            shortcutCapture: document.querySelector("#shortcutCaptureDialog"),
            layerInfo: document.querySelector("#layerInformation"),
            spawnCard: document.querySelector("#spawnCardInformation"),
        };
        this._changelogCache = null;
        const { calc: calcInformation, weapon: weaponInformation, factions: factionsDialog, servers: serversInformation, layerInfo: layerInfoDialog } = this._dialogs;

        this.threeDView = document.querySelector("#threeDView");
        this.simulation3D = new Squad3DSimulation(document.querySelector(".threeDViewport"));
        // Settings dialog's "3D" tab mirrors the in-3D-view overlay card's own options -
        // the show/hide toggles go through SquadSettings (see squadSettings.js), but
        // there's no equivalent there for the texture <select>.
        this.simulation3D.bindSettingsTextureSelect();

        document.querySelectorAll(".btn-delete, .btn-undo, .btn-layer, .btn-layer-info, .returnBtn, #mapLayerMenu, #layerSelector").forEach((el) => el.style.display = "none");

        this.ui = localStorage.getItem("data-ui");

        if (this.ui === null || isNaN(this.ui) || this.ui === ""){
            this.ui = 1; 
            localStorage.setItem("data-ui", 1);  
        }

        if (this.ui == 1) this.loadMapUIMode();
        else {
            document.querySelectorAll(".returnBtn").forEach((el) => el.style.removeProperty("display"));
            document.querySelector(".weaponSelector").classList.add("active");
        }

        // Add Events listeners

        // LEGACY MODE
        document.getElementById("mortar-location").addEventListener("input", () => { this.shoot("weapon"); });
        document.getElementById("target-location").addEventListener("input",  () => { this.shoot("target"); });
        document.getElementById("mortar-location").addEventListener("keypress", (event) => { this.filterInput(event); });
        document.getElementById("target-location").addEventListener("keypress", (event) => { this.filterInput(event); });
        document.addEventListener("input", (event) => { if (event.target.closest(".friendlyname")) this.resizeInput(event.target); });
        window.addEventListener("resize", () => { this.resizeInputsOnResize(); });
        document.addEventListener("click", (event) => { if (event.target.closest(".del")) this.removeSaves(event.target); });
        document.addEventListener("click", (event) => { if (event.target.closest(".savespan")) this.copySave(event.target); });
        document.querySelectorAll(".savespan").forEach((el) => el.addEventListener("click", (event) => { this.copySave(event); }));
        document.getElementById("savebutton").addEventListener("click",  () => { this.saveCalc(); });
        document.getElementById("copy").addEventListener("click", (event) => { this.copyCalc(event); });

        // MAP MODE
        this.closeDialogOnClickOutside(calcInformation);
        this.closeDialogOnClickOutside(weaponInformation);
        this.closeDialogOnClickOutside(serversInformation);
        this.closeDialogOnClickOutside(factionsDialog);
        this.closeDialogOnClickOutside(layerInfoDialog);
        this.closeDialogOnClickOutside(this._dialogs.spawnCard);

        const overlay = document.getElementById("dropOverlay");
        let dragCounter = 0;
        
        document.addEventListener("dragenter", (e) => {
            e.preventDefault();
            dragCounter++;
            overlay.style.display = "flex";
        });
        
        document.addEventListener("dragleave", (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                overlay.style.display = "none";
            }
        });
        
        document.addEventListener("dragover", (e) => {
            e.preventDefault(); // Needed to allow dropping
        });
        
        document.addEventListener("drop", (e) => {
            e.preventDefault();
            dragCounter = 0;
            overlay.style.display = "none";
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest("#servers")) return;
            serverBrowserTooltips.hide();
            serverBrowserTooltips.disable();
            if (!this.squadServersBrowser) {
                this.squadServersBrowser = new SquadServersBrowser();
                this.squadServersBrowser.init();
            }
            document.getElementById("serversInformation").showModal();

            // Focus search input at the end
            const searchInput = document.getElementById("serverSearch");
            if (searchInput) searchInput.focus();
        });

        document.addEventListener("favorites:changed", ({ detail: { favorites, servers } }) => {
            const favoriteServers = (servers || []).filter(s => favorites.has(String(s.id)));
            if (favoriteServers.length === 0) {
                document.getElementById("serverSelector").style.display = "none";
                return;
            }
            this.buildFavoriteServersDropdown(favoriteServers);
        });

        serversInformation.addEventListener("close", () => {
            setTimeout(() => serverBrowserTooltips.enable(), 50);
        });

        // Settings dialog
        const settingsDialog = document.getElementById("settingsDialog");
        settingsDialog.addEventListener("click", (event) => {
            const tab = event.target.closest(".settings-tab");
            if (!tab) return;
            settingsDialog.querySelectorAll(".settings-tab").forEach((el) => el.classList.remove("active"));
            tab.classList.add("active");
            // Mobile top bar: bring the selected tab fully into view
            tab.scrollIntoView({ block: "nearest", inline: "nearest" });
            settingsDialog.querySelectorAll(".settings-panel").forEach((el) => el.classList.remove("active"));
            settingsDialog.querySelector(`.settings-panel[data-panel="${tab.value}"]`)?.classList.add("active");
        });
        // Mobile top bar: touch-dragging scrolls it fine, but a mouse has no drag
        // gesture and the scrollbar is hidden there - redirect the vertical wheel
        // into horizontal scroll so it's still reachable without a touchscreen
        const settingsTabs = settingsDialog.querySelector(".settings-tabs");
        settingsTabs.addEventListener("wheel", (event) => {
            if (settingsTabs.scrollWidth <= settingsTabs.clientWidth) return;
            event.preventDefault();
            settingsTabs.scrollLeft += event.deltaY;
        });
        // Range sliders: fill the track up to the thumb, and show a
        // min / default / max scale with a tick at the default value 
        // Labels map the input range linearly onto data-display-min/max (in %), like the old ticks did
        const formatRange = (input, value) => {
            const min = Number(input.min);
            const max = Number(input.max);
            const displayMin = Number(input.dataset.displayMin ?? min * 100);
            const displayMax = Number(input.dataset.displayMax ?? max * 100);
            const ratio = (value - min) / (max - min);
            return `${Math.round(displayMin + ratio * (displayMax - displayMin))}%`;
        };
        const makeSpan = (className, text) => {
            const span = document.createElement("span");
            span.className = className;
            span.setAttribute("aria-hidden", "true");
            span.textContent = text;
            return span;
        };
        const buildRangeScale = (input) => {
            const min = Number(input.min);
            const max = Number(input.max);
            const def = Number(input.dataset.default ?? input.value);
            const pos = (def - min) / (max - min);
            const track = input.closest(".settings-range-track");
            track.style.setProperty("--pos", pos);
            track.appendChild(makeSpan("settings-range-tick", ""));
            const scale = document.createElement("div");
            scale.className = "settings-range-scale";
            scale.setAttribute("aria-hidden", "true");
            scale.appendChild(makeSpan("settings-range-min", formatRange(input, min)));
            // Skip the default label when it sits on min or max, it would overlap
            if (pos > 0 && pos < 1) scale.appendChild(makeSpan("settings-range-default", formatRange(input, def)));
            scale.appendChild(makeSpan("settings-range-max", formatRange(input, max)));
            track.appendChild(scale);
        };
        const updateRange = (input) => {
            const percent = (input.value - input.min) / (input.max - input.min) * 100;
            input.style.setProperty("--fill", `${percent}%`);
        };
        settingsDialog.querySelectorAll(".settings-range input[type=range]").forEach((input) => {
            buildRangeScale(input);
            updateRange(input);
        });
        settingsDialog.addEventListener("input", (event) => {
            if (event.target.matches(".settings-range input[type=range]")) updateRange(event.target);
        });
        // Shortcuts tab (rebuilt after every change in openShortcutCapture())
        this.initShortcutsPanel();

        // Search: filter fields by label/hint text across every panel
        const settingsSearch = document.getElementById("settingsSearch");
        const settingsSearchClear = document.getElementById("settingsSearchClear");
        // Give each panel a title (the tab label), only visible while searching
        settingsDialog.querySelectorAll(".settings-panel").forEach((panel) => {
            const tabLabel = settingsDialog.querySelector(`.settings-tab[value="${panel.dataset.panel}"] span[data-i18n]`);
            const h2 = document.createElement("h2");
            h2.className = "settings-panel-title";
            h2.setAttribute("data-i18n", tabLabel.getAttribute("data-i18n"));
            h2.textContent = tabLabel.textContent;
            panel.prepend(h2);
        });
        const normalizeSearch = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const filterSettings = (query) => {
            const q = normalizeSearch(query.trim());
            settingsDialog.classList.toggle("settings-searching", q !== "");
            if (!q) {
                settingsDialog.querySelectorAll(".settings-hidden").forEach((el) => el.classList.remove("settings-hidden"));
                settingsDialog.querySelectorAll(".settings-search-empty").forEach((el) => el.hidden = true);
                return;
            }
            let total = 0;
            settingsDialog.querySelectorAll(".settings-panel").forEach((panel) => {
                let panelCount = 0;
                panel.querySelectorAll(".settings-section").forEach((section) => {
                    let sectionCount = 0;
                    section.querySelectorAll(".settings-field").forEach((field) => {
                        const text = Array.from(field.querySelectorAll("label, .settings-field-hint, .settings-search-text"))
                            .map((el) => el.textContent).join("");
                        const match = normalizeSearch(text).includes(q);
                        field.classList.toggle("settings-hidden", !match);
                        if (match) sectionCount++;
                    });
                    section.classList.toggle("settings-hidden", sectionCount === 0);
                    panelCount += sectionCount;
                });
                panel.classList.toggle("settings-hidden", panelCount === 0);
                total += panelCount;
            });
            settingsDialog.querySelectorAll(".settings-search-empty").forEach((el) => el.hidden = total > 0);
        };
        settingsSearch.addEventListener("input", () => {
            settingsSearchClear.hidden = settingsSearch.value === "";
            filterSettings(settingsSearch.value);
        });
        // Esc clears the search first, and only closes the dialog when it's already empty
        settingsSearch.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && settingsSearch.value !== "") {
                event.preventDefault();
                settingsSearch.value = "";
                settingsSearchClear.hidden = true;
                filterSettings("");
            }
        });
        settingsSearchClear.addEventListener("click", () => {
            settingsSearch.value = "";
            settingsSearch.focus();
            settingsSearchClear.hidden = true;
            filterSettings("");
        });
        // Picking a tab leaves search mode
        settingsDialog.addEventListener("click", (event) => {
            if (!event.target.closest(".settings-tab")) return;
            if (settingsSearch.value === "") return;
            settingsSearch.value = "";
            settingsSearchClear.hidden = true;
            filterSettings("");
        });

        // Changelog tab: render CHANGELOG.md on first open
        settingsDialog.addEventListener("click", async (event) => {
            if (!event.target.closest(".settings-tab[value=changelog]")) return;
            const changelog = settingsDialog.querySelector(".settings-changelog");
            if (changelog._loaded) return;
            changelog._loaded = true;
            if (!this._changelogCache) {
                const { default: changelogMd } = await import("../../CHANGELOG.md");
                this._changelogCache = marked.parse(changelogMd, { renderer: changelogRenderer });
            }
            changelog.innerHTML = this._changelogCache;
            // Group each release (its h1 + everything until the next h1) into a card
            Array.from(changelog.children).filter((el) => el.tagName === "H1").forEach((heading) => {
                const release = document.createElement("article");
                release.className = "settings-release";
                heading.before(release);
                const toMove = [heading];
                let sib = heading.nextElementSibling;
                while (sib && sib.tagName !== "H1") {
                    toMove.push(sib);
                    sib = sib.nextElementSibling;
                }
                toMove.forEach((el) => release.appendChild(el));
            });
        });

        // About tab
        document.getElementById("settingsAppVersion").textContent = `v${this.version}`;

        settingsDialog.addEventListener("close", () => {
            setTimeout(() => settingsTooltips.enable(), 50);
        });

        layerInfoDialog.addEventListener("close", () => {
            setTimeout(() => layerInfoTooltips.enable(), 50);
        });

        window.addEventListener("drop", e => {
            e.preventDefault();

            if (this.ui == 0) return; // Don't handle drop in legacy mode

            const file = e.dataTransfer.files?.[0];
            if (file) this.loadMapStateFromFile(file);
        });

        document.querySelector(".btn-delete").addEventListener("click", () => {
            this.minimap.deleteTargets();
            this.minimap.deleteMarkers();
            this.minimap.deleteArrows();
            this.minimap.deleteRectangles();
            this.minimap.deleteCircles();
            this.minimap.deletePolylines();
        });

        document.querySelector(".btn-download").addEventListener("click", () => { this.saveMapStateToFile(); });
        document.querySelector(".btn-upload").addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".squadcalc,.json";
            input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) this.loadMapStateFromFile(file);
            };
            input.click();
        });
        document.querySelector(".btn-undo").addEventListener("click", () => { if (this.minimap.history.length > 0) this.minimap.history.at(-1).delete(); });
        document.querySelector(".btn-layer").addEventListener("click", () => { this.minimap.layer.toggleVisibility(); });
        document.querySelector(".btn-layer-info").addEventListener("click", () => {
            const layerData = this.minimap.layer?.layerData;
            if (!layerData) return;

            layerInfoTooltips.hide();
            layerInfoTooltips.disable();

            document.querySelector(".infLayerMap").textContent = layerData.Name ?? layerData.rawName ?? "";
            document.querySelector(".infLayerGamemode").textContent = layerData.gamemode ?? "";
            document.querySelector(".infLayerVersion").textContent = layerData.layerVersion ?? "";
            document.querySelector(".infLayerSize").textContent = layerData.mapSize ?? "";
            document.querySelector(".infLayerTeam1Tickets").textContent = layerData.teamConfigs?.team1?.tickets ?? "";
            document.querySelector(".infLayerTeam2Tickets").textContent = layerData.teamConfigs?.team2?.tickets ?? "";

            // The compact "unitType" token AdminChangeLayer/AdminSetNextLayer expect (e.g. "CombinedArms",
            // "Mechanized") only shows up for a faction's non-default subfactions, in teamConfigs.factions'
            // "types" list. The default subfaction (not always "CombinedArms" - some modded factions default
            // to something else) isn't listed there, so fall back to the descriptive "type" name from the
            // layer's units list, stripped of spaces and any parenthetical qualifier (e.g. "Mechanized
            // (Wheeled)" -> "Mechanized"), which for a faction's default entry is always the plain type name.
            const allUnits = [...(layerData.units?.team1Units ?? []), ...(layerData.units?.team2Units ?? [])];
            const compactType = (raw) => raw ? raw.replace(/\s*\(.*?\)/g, "").replace(/\s+/g, "") : "";
            const unitTypeOf = (teamKey, unitObjectName) => {
                if (!unitObjectName) return "";
                for (const faction of layerData.teamConfigs?.factions?.[`${teamKey}Units`] ?? []) {
                    const match = faction.types?.find((t) => t.unit === unitObjectName);
                    if (match) return match.unitType;
                }
                const unit = allUnits.find((u) => u.unitObjectName === unitObjectName);
                return unit ? compactType(unit.type) : "";
            };
            const team1Faction = this.FACTION1_SELECTOR.value;
            const team2Faction = this.FACTION2_SELECTOR.value;
            const factionUnitArgs = (team1Faction && team2Faction)
                ? ` ${team1Faction}+${unitTypeOf("team1", this.UNIT1_SELECTOR.value)} ${team2Faction}+${unitTypeOf("team2", this.UNIT2_SELECTOR.value)}`
                : "";

            document.querySelector(".layerCommandInput").value = `AdminSetNextLayer ${layerData.rawName}${factionUnitArgs}`;
            document.querySelector(".layerChangeCommandInput").value = `AdminChangeLayer ${layerData.rawName}${factionUnitArgs}`;

            document.querySelector(".layerShareUrlInput").value = this.buildShareUrl();

            const thumbnail = document.querySelector(".layerThumbnail");
            thumbnail.style.removeProperty("display");
            thumbnail.setAttribute("src", `${process.env.API_URL}/img/thumbnails/${encodeURIComponent(layerData.rawName)}.webp`);

            layerInfoDialog.showModal();
        });
        document.querySelector(".btn-3d").addEventListener("click", () => {
            if (document.querySelector(".btn-3d").classList.contains("locked")) return;
            this.open3D();
        });
        document.querySelector(".threeDQuitButton").addEventListener("click", () => this.hide3D());
        document.querySelector(".threeDShareButton").addEventListener("click", () => {
            // Builds the URL for the clipboard only, same as buildShareUrl() - the
            // sharer's own address bar isn't meant to change, just what gets copied.
            const params = new URLSearchParams(window.location.search);
            params.set("3d", this.simulation3D.getShareToken());
            navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?${params.toString()}`);
            this.openToast("success", "copied", "");
        });
        document.querySelector(".layerCommandCopyBtn").addEventListener("click", (event) => {
            const input = event.currentTarget.closest(".layerCommandRow").querySelector("input");
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(input.value);
            } else {
                input.select();
                document.execCommand("copy");
            }
            this.openToast("success", "copied", "");
        });
        document.querySelector(".btn-drawingMode").addEventListener("click", () => { this.minimap.disableDrawingMode(); });
        document.querySelector(".btn-legacy").addEventListener("click", () => { if (this.ui !== 0) this.switchUI(); });
        document.querySelector("#factionsButton .factionBar-top").addEventListener("click", (e) => {
            e.stopPropagation();
            document.getElementById("factionsButton").classList.toggle("collapsed");
        });
        document.querySelector("#factionsButton button.btn-faction").addEventListener("click", () => { document.getElementById("factionsDialog").showModal(); });
        document.querySelector(".btn-settings").addEventListener("click", () => this.openSettings());

        document.querySelector("#mapLayerMenu button.btn-session").addEventListener("click", () => {
            if (document.querySelector(".btn-session").classList.contains("active")) {

                // Quit session
                if (this.session) {
                    this.session.ws.close();
                    this.session = false;
                }

                // Update UI
                document.querySelectorAll(".btn-session").forEach((el) => el.classList.remove("active"));
                leaveSessionTooltips.disable();
                createSessionTooltips.enable();
                //this.openToast("error", "Session quit", "You have quit the session.");

            } else {
                // Create session
                this.session = new SquadSession();
                document.querySelectorAll(".btn-session").forEach((el) => el.classList.add("active"));
                createSessionTooltips.disable();
                leaveSessionTooltips.enable();
            }
        });


        document.querySelectorAll("#mapLayerMenu button.layers").forEach((btn) => btn.addEventListener("click", (event) => {

            if (event.currentTarget.classList.contains("active")) { return; }
            const VAL = event.currentTarget.getAttribute("value");

            if (VAL === "helpmap") {
                document.querySelector(".btn-"+VAL).classList.toggle("active");
                this.minimap.toggleHeatmap();
                return;
            }

            document.querySelectorAll("#mapLayerMenu .layers").forEach((el) => el.classList.remove("active"));
            document.querySelector(".btn-"+VAL).classList.add("active");
            this.updateUrlParams({ type: VAL === "basemap" ? null : VAL });
            localStorage.setItem("settings-map-mode", VAL);
            this.userSettings.layerMode = VAL;
            this.minimap.changeLayer();
        }));

        document.querySelector("#mapLayerMenu button.btn-helpmap").addEventListener("click", () => {
            document.querySelector(".btn-helpmap").classList.toggle("active");
            this.minimap.toggleHeatmap();
        });

        document.querySelector("#mapLayerMenu button.btn-hd").addEventListener("click", () => {
            if (document.querySelector(".btn-hd").classList.contains("locked")) return;
            const VAL = !document.querySelector(".btn-hd").classList.contains("active");
            document.querySelector(".btn-hd").classList.toggle("active");
            this.userSettings.highQualityImages = VAL;
            localStorage.setItem("settings-highquality-images", +VAL);
            this.minimap.changeLayer();
        });

        document.querySelector(".fontSizeSelector input")?.addEventListener("change", (event) => {
            this.userSettings.fontSize = Math.max(1, Math.min(event.target.value, 5));
            localStorage.setItem("settings-font-size", this.userSettings.fontSize);
            this.changeFontSize();
        });

        this.changeFontSize();

        // Hack for Chrome to avoid lag when zooming inside the map
        // Force a decode each time focus a acquired again
        // $(document).on("visibilitychange", () => {
        //     if (document.visibilityState === "visible") {
        //         this.minimap.decode();
        //     }
        // });

        if (this.hasMouse) {

            document.querySelector("#mapLayerMenu button.btn-focus").addEventListener("click", () => {
                document.querySelector("header").style.display = "none";
                document.getElementById("background").style.display = "none";
                document.getElementById("mapLayerMenu").style.display = "none";
                this.openToast("success", "focusMode", "enterToExit");
            });

            document.addEventListener("keydown", (event) => this.handleKeydown(event));


        } else {
            document.querySelector(".btn-focus").style.display = "none";
        }

        this._countdown = null;

        // Global click listener for toast
        document.querySelector("#toast").addEventListener("click", (event) => {
            const toast = document.querySelector("#toast");
            const title = toast.querySelector("h4").getAttribute("data-i18n");  // Get data-i18n attribute
            
            // close current toast
            this.closeToast();

            if (title === "tooltips:sessionCreated" && event.target.tagName !== "BUTTON") {
                const url = new URL(window.location.href);
                const map = url.searchParams.get("map");
                const session = url.searchParams.get("session");
        
                const params = new URLSearchParams();
                if (map) params.set("map", map);
                if (session) params.set("session", session);
                const newUrl = `${url.origin}/?${params.toString()}`;
                navigator.clipboard.writeText(newUrl);
                this.openToast("success", "copied", "");
            } else if (title === "tooltips:newVersion" && event.target.tagName !== "BUTTON") {
                this.openSettings("changelog");
            }
        });
      
        weaponInformation.addEventListener("close", function(){
            // Remove listeners when closing weapon information to avoid stacking
            // (handler refs stored on the elements by squadMarker.js's _handleClick)
            document.querySelectorAll("input[type=radio][name=angleChoice]").forEach((el) => {
                if (el._changeHandler) el.removeEventListener("change", el._changeHandler);
            });
            const moveToBtn = document.querySelector(".moveToBtn");
            if (moveToBtn._clickHandler) moveToBtn.removeEventListener("click", moveToBtn._clickHandler);
        });
        
        document.querySelectorAll("#canvasControls button").forEach((btn) => btn.addEventListener("click", (event) => {
            if (event.currentTarget.classList.contains("active")){ return;}
            document.querySelector("#canvasControls > .active")?.classList.remove("active");
            event.currentTarget.classList.add("active");
            document.querySelector(".sim.active")?.classList.remove("active");
            document.getElementById(event.currentTarget.value)?.classList.add("active");
        }));



        this.show();
    }


    buildShareUrl() {
        const cur    = new URLSearchParams(window.location.search);
        const params = new URLSearchParams();
        if (cur.has("map"))   params.set("map", cur.get("map"));
        if (cur.has("layer")) params.set("layer", cur.get("layer"));

        const t1 = this.FACTION1_SELECTOR.value;
        const u1 = this.UNIT1_SELECTOR.value;
        const t2 = this.FACTION2_SELECTOR.value;
        const u2 = this.UNIT2_SELECTOR.value;
        if (t1) params.set("team1", t1);
        if (u1) params.set("team1unit", u1);
        if (t2) params.set("team2", t2);
        if (u2) params.set("team2unit", u2);

        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }

    /**
     * Open the settings dialog, optionally on a given tab
     * @param {string} [tab] - value of a .settings-tab (e.g. "changelog", "mods")
     */
    openSettings(tab) {
        const dialog = document.getElementById("settingsDialog");
        settingsTooltips.hide();
        settingsTooltips.disable();
        if (!dialog.open) dialog.showModal();
        // showModal() auto-focuses the first focusable descendant (the search box) absent
        // an explicit autofocus target - on touch devices that pops the virtual keyboard
        // immediately, so move focus back to the dialog itself there
        if (!this.hasMouse) dialog.querySelector("#settingsSearch")?.blur();
        if (tab) dialog.querySelector(`.settings-tab[value="${tab}"]`)?.click();
    }

    closeToast() {
        const toast = document.querySelector("#toast");
        if (!toast) return;
        toast.style.animation = "close 0.3s cubic-bezier(.87,-1,.57,.97) forwards";
        document.querySelector("#timer").classList.remove("timer-animation");
        clearTimeout(this._countdown);
    }

    openToast(type, title, text) {
        const toast = document.querySelector("#toast");
        clearTimeout(this._countdown);

        const timer = document.querySelector("#timer");
        timer.classList.remove("timer-animation");
        void timer.offsetWidth;
        timer.classList.add("timer-animation");

        toast.classList = [type];
        toast.style.animation = "open 0.3s cubic-bezier(.47,.02,.44,2) forwards";

        toast.querySelector("h4").setAttribute("data-i18n", `tooltips:${title}`);
        toast.querySelector("h4").innerHTML = i18next.t(`tooltips:${title}`);
        toast.querySelector("p").setAttribute("data-i18n", `tooltips:${text}`);
        toast.querySelector("p").innerHTML = i18next.t(`tooltips:${text}`);

        this._countdown = setTimeout(() => { this.closeToast(); }, 5000);
    }

    toggleFocusMode() {
        const header = document.querySelector("header");
        if (getComputedStyle(header).display === "none") {
            header.style.removeProperty("display");
            document.getElementById("mapLayerMenu").style.removeProperty("display");
            document.getElementById("background").style.removeProperty("display");
            if (this.minimap.layer) {
                // #factionsButton's own stylesheet rule sets display:none - removeProperty wouldn't undo that
                document.getElementById("factionsButton").style.display = "block";
            }
            this.closeToast();
        } else {
            header.style.display = "none";
            document.getElementById("background").style.display = "none";
            document.getElementById("mapLayerMenu").style.display = "none";
            document.getElementById("factionsButton").style.display = "none";
            this.openToast("success", "focusMode", "enterToExit");
        }
    }

    loadShortcuts() {
        const defaults = SquadCalc.DEFAULT_SHORTCUTS;
        try {
            const stored = localStorage.getItem("settings-shortcuts");
            if (stored) return { ...defaults, ...JSON.parse(stored) };
        } catch { /* ignore corrupt data */ }
        return { ...defaults };
    }

    saveShortcuts() {
        localStorage.setItem("settings-shortcuts", JSON.stringify(this.shortcuts));
    }

    matchesShortcut(event, id) {
        const sc = this.shortcuts[id];
        if (!sc) return false;
        return (sc.ctrl  === (event.ctrlKey || event.metaKey))
            && (sc.alt   === event.altKey)
            && (sc.shift === event.shiftKey)
            && event.key.toLowerCase() === sc.key.toLowerCase();
    }

    formatShortcutHTML(shortcut) {
        const parts = [];
        if (shortcut.ctrl)  parts.push("<kbd>Ctrl</kbd>");
        if (shortcut.alt)   parts.push("<kbd>Alt</kbd>");
        if (shortcut.shift) parts.push("<kbd>Shift</kbd>");
        const name = shortcut.key === " " ? "Space"
            : shortcut.key.length === 1 ? shortcut.key.toUpperCase()
                : shortcut.key;
        parts.push(`<kbd>${name}</kbd>`);
        return parts.join(" + ");
    }

    initShortcutsPanel() {
        const list = document.querySelector("#settingsDialog .settings-shortcuts");
        const editIcon = "<svg class='settings-shortcut-edit' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M12 20h9'/><path d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'/></svg>";
        list.replaceChildren();

        for (const { id, i18nKey } of SquadCalc.SHORTCUT_ACTIONS) {
            const shortcut = this.shortcuts[id];
            const isCustom = JSON.stringify(shortcut) !== JSON.stringify(SquadCalc.DEFAULT_SHORTCUTS[id]);

            const row = document.createElement("button");
            row.type = "button";
            row.className = "settings-shortcut";
            row.setAttribute("data-action", id);

            const label = document.createElement("span");
            label.className = "settings-shortcut-label settings-search-text";
            label.setAttribute("data-i18n", i18nKey);
            row.appendChild(label);

            if (isCustom) {
                const custom = document.createElement("span");
                custom.className = "settings-shortcut-custom";
                custom.setAttribute("data-i18n", "settings:shortcutCustom");
                custom.textContent = "Custom";
                row.appendChild(custom);
            }

            const keys = document.createElement("span");
            keys.className = "settings-shortcut-keys";
            keys.innerHTML = this.formatShortcutHTML(shortcut);
            row.appendChild(keys);

            row.insertAdjacentHTML("beforeend", editIcon);
            row.addEventListener("click", () => this.openShortcutCapture(id));

            const field = document.createElement("div");
            field.className = "settings-field settings-shortcut-field";
            field.appendChild(row);
            list.appendChild(field);
        }

        // On rebuilds (after a change) the language is already loaded, translate right away
        if (i18next.isInitialized) {
            list.querySelectorAll("[data-i18n]").forEach((el) => {
                el.textContent = i18next.t(el.dataset.i18n);
            });
        }
    }

    openShortcutCapture(actionId) {
        const dialog = this._dialogs.shortcutCapture;
        const actionLabel = i18next.t(
            SquadCalc.SHORTCUT_ACTIONS.find(a => a.id === actionId).i18nKey
        );

        dialog.querySelector(".capture-title").textContent = actionLabel;

        const preview  = dialog.querySelector(".capture-preview");
        const listening = dialog.querySelector(".capture-listening");
        const conflict = dialog.querySelector(".capture-conflict");
        const saveBtn  = dialog.querySelector("#captureSave");

        let pending = null;

        const reset = () => {
            pending = null;
            preview.innerHTML = "";
            listening.style.display = "";
            conflict.textContent = "";
            saveBtn.disabled = true;
        };
        reset();

        const onKeydown = (event) => {
            if (!dialog.open) return;
            event.preventDefault();
            if (["Tab", "Escape", "Control", "Alt", "Shift", "Meta"].includes(event.key)) return;

            pending = {
                key:   event.key.length === 1 ? event.key.toLowerCase() : event.key,
                ctrl:  event.ctrlKey || event.metaKey,
                alt:   event.altKey,
                shift: event.shiftKey,
            };

            listening.style.display = "none";
            preview.innerHTML = this.formatShortcutHTML(pending);

            const conflictEntry = SquadCalc.SHORTCUT_ACTIONS.find(({ id }) => {
                if (id === actionId) return false;
                const sc = this.shortcuts[id];
                return sc.ctrl  === pending.ctrl
                    && sc.alt   === pending.alt
                    && sc.shift === pending.shift
                    && sc.key.toLowerCase() === pending.key.toLowerCase();
            });

            if (conflictEntry) {
                conflict.textContent = i18next.t("settings:captureConflict", {
                    action: i18next.t(conflictEntry.i18nKey)
                });
                saveBtn.disabled = true;
            } else {
                conflict.textContent = "";
                saveBtn.disabled = false;
            }
        };

        document.addEventListener("keydown", onKeydown, true);

        dialog.querySelector("#captureSave").onclick = () => {
            if (!pending) return;
            this.shortcuts[actionId] = pending;
            this.saveShortcuts();
            this.initShortcutsPanel();
            cleanup();
        };

        dialog.querySelector("#captureReset").onclick = () => {
            this.shortcuts[actionId] = { ...SquadCalc.DEFAULT_SHORTCUTS[actionId] };
            this.saveShortcuts();
            this.initShortcutsPanel();
            cleanup();
        };

        dialog.querySelector("#captureCancel").onclick = () => cleanup();

        const cleanup = () => {
            document.removeEventListener("keydown", onKeydown, true);
            if (dialog.open) dialog.close();
        };

        dialog.addEventListener("close", cleanup, { once: true });

        dialog.showModal();
    }

    handleKeydown(event) {

        const { calc, weapon, settings, factions, servers } = this._dialogs;
        if (weapon.open || calc.open || settings.open || factions.open || servers.open || this.is3DOpen) return;

        if (event.target.matches("input, textarea, select")) return;

        if (this.matchesShortcut(event, "switchUI")) {
            event.preventDefault();
            this.switchUI();
            return;
        }

        if (this.matchesShortcut(event, "toggleMap")) {
            if (this.minimap.activeMap.singleLayer) return;
            const layers = ["topomap", "terrainmap", "basemap"];
            const currentLayer = document.querySelector("#mapLayerMenu .layers.active")?.getAttribute("value") || "basemap";
            const nextIndex = (layers.indexOf(currentLayer) + 1) % layers.length;
            const nextLayer = layers[nextIndex];
            document.querySelectorAll("#mapLayerMenu .layers").forEach((el) => el.classList.remove("active"));
            document.querySelector(".btn-" + nextLayer).classList.add("active");
            this.updateUrlParams({ type: nextLayer === "basemap" ? null : nextLayer });
            localStorage.setItem("settings-map-mode", nextLayer);
            this.userSettings.layerMode = nextLayer;
            this.minimap.changeLayer();
        }

        if (this.ui == 0) return;

        if (this.matchesShortcut(event, "focusMode")) this.toggleFocusMode();
        if (this.matchesShortcut(event, "clearTargets")) this.minimap.history.forEach((item) => { item.delete(); });

        if (event.key === "Escape") this.minimap.disableDrawingMode();

        if (event.key === "Backspace" || this.matchesShortcut(event, "deleteLastTarget")) {
            event.preventDefault();
            if (this.minimap.history.length > 0) this.minimap.history.at(-1).delete();
        }

        if (this.matchesShortcut(event, "saveMap")) {
            event.preventDefault();
            if (this.minimap.hasMarkers()) this.saveMapStateToFile();
        }

    }

    changeIconsSize(){
        this.minimap.activeMarkers.eachLayer((marker) => {
            marker.updateIconSize();
        });
    }

    
    changeFontSize(){
        let fontSize;
        this.userSettings.fontSize = parseInt(this.userSettings.fontSize, 10) || 1;

        switch (this.userSettings.fontSize) {
        case 1:
            fontSize = 0.8;
            break;
        case 2:
            fontSize = 0.9;
            break;    
        case 3:
            fontSize = 1;
            break;
        case 4:
            fontSize = 1.1;
            break;
        case 5:
            fontSize = 1.2;
            break;
        default:
            fontSize = 1;
            break;
        }

        const root = document.documentElement;
        root.style.setProperty("--font-size-objtext", `${fontSize}em`);
        root.style.setProperty("--font-size-calc-popup", `${fontSize - 0.1}em`);
    }

    /**
     * Reveal the page
     */
    show(){
        document.body.style.visibility = "visible";
        setTimeout(() => this.minimap.changeLayer(), 800);
        setTimeout(() => {
            fadeOut(document.getElementById("loader"), 500, () => this.showNewVersionToast());
        }, 1800);
    }

    /**
     * Announce a new version once, on the first load after an update
     */
    showNewVersionToast(){
        if (localStorage.getItem("lastSeenVersion") === this.version) return;
        localStorage.setItem("lastSeenVersion", this.version);
        this.openToast("info", "newVersion", "clickToSeeChangelog");
    }

    /**
     * Calculate heights for a given LatLng Point
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    switchUI(){

        if (this.ui == 0) {
            this.loadMapUIMode();
            document.querySelectorAll(".returnBtn").forEach((el) => el.style.display = "none");
            if (this.minimap.hasMarkers()) {
                document.querySelectorAll(".btn-delete, .btn-undo").forEach((el) => el.style.removeProperty("display"));
            }
            return;
        }

        document.querySelectorAll(".returnBtn").forEach((el) => el.style.removeProperty("display"));
        document.getElementById("map_ui").classList.add("hidden");
        document.getElementById("classic_ui").classList.remove("hidden");
        document.querySelector("header").classList.remove("ui");
        document.getElementById("mapLayerMenu").style.display = "none";
        document.getElementById("layerSelector").style.display = "none";
        document.querySelector(".weaponSelector").classList.add("active");
        this.ui = 0;
        localStorage.setItem("data-ui", 0);

    }

    closeDialogOnClickOutside(dialog) {
        dialog.addEventListener("click", function(event) {
            const RECT = dialog.getBoundingClientRect();
            const isInDialog = (RECT.top <= event.clientY && event.clientY <= RECT.top + RECT.height &&
                              RECT.left <= event.clientX && event.clientX <= RECT.left + RECT.width);
            if (!isInDialog) {
                dialog.close();
            }
        });
    }

    /**
     * Opens the spawn card dialog (vehicle/deployable markers) with the given card HTML
     * @param {string} html - card markup, same as the marker's hover tooltip
     */
    openSpawnCardDialog(html) {
        const dialog = this._dialogs.spawnCard;
        dialog.querySelector("#spawnCardContent").innerHTML = html;
        dialog.showModal();
    }

    loadMapUIMode(){
        document.getElementById("classic_ui").classList.add("hidden");
        document.getElementById("map_ui").classList.remove("hidden");
        document.querySelector("header").classList.add("ui");
        document.getElementById("mapLayerMenu").style.removeProperty("display");
        if (this.LAYER_SELECTOR.options.length > 1) document.getElementById("layerSelector").style.removeProperty("display");
        if (this.minimap.activeWeaponsMarkers.getLayers().length === 0) {
            document.querySelector(".weaponSelector").classList.remove("active", "animate__fadeIn");
        }
        this.ui = 1;
        localStorage.setItem("data-ui", 1);
        this.minimap.invalidateSize();
    }

    /**
     * save current weapon into browser cache
     */
    changeWeapon() {
        const WEAPON = this.WEAPON_SELECTOR.value;

        localStorage.setItem("data-weapon", WEAPON);
        this.activeWeapon = WEAPONS[WEAPON];
    
        if (this.activeWeapon.shells.length > 1) {
            document.getElementById("ammoSelector").style.removeProperty("display");
        } else {
            document.getElementById("ammoSelector").style.display = "none";
        }

        // Load SHELL_SELECTOR with weapon.shells
        const shellChoices = this.activeWeapon.shells.map((shell, index) => ({
            value: String(index),
            label: i18next.t("weapons:" + shell.name),
            selected: index === 0,
        }));
        this.shellSelect.setChoices(shellChoices, "value", "label", true, true, true);
        triggerChange(this.SHELL_SELECTOR, true);

        document.getElementById("mortarImg").setAttribute("src", `/img/weapons/${this.activeWeapon.name}.webp`);
        
        this.shoot();
    
        // Update Minimap marker
        this.minimap.updateWeapons();
        this.minimap.updateTargets();

        // Refresh Heatmap
        this.minimap.toggleHeatmap();
    }

    /**
     * get last selected weapon from user cache and apply it
     */
    getWeapon() {
        let weapon = localStorage.getItem("data-weapon");
        if (weapon === null || isNaN(weapon) || weapon === "") { weapon = 0; }
        this.weaponSelect.setChoiceByValue(String(weapon));
        this.changeWeapon();
    }

    /**
     * Calculates the distance elevation and bearing
     * @returns {target} elevation + bearing
     */
    shoot(inputChanged = "") {
        const MORTAR_LOC = document.getElementById("mortar-location");
        const TARGET_LOC = document.getElementById("target-location");
        const a = MORTAR_LOC.value;
        const b = TARGET_LOC.value;
        let aPos;
        let bPos;

        this.resetCalc();

        // store current cursor positions on input
        let startA = MORTAR_LOC.selectionStart;
        let startB = TARGET_LOC.selectionStart;

        // format keypads
        MORTAR_LOC.value = this.formatKeyPad(a);
        TARGET_LOC.value = this.formatKeyPad(b);

        // If keypads are imprecises, do nothing
        if (a.length < 3 || b.length < 3) {
            // disable tooltip and copy function
            document.getElementById("copy").classList.remove("copy");
            document.getElementById("bearingNum").innerHTML = "xxx";
            document.getElementById("elevationNum").innerHTML = "xxxx";
            return 1;
        }

        // restore cursor position
        this.setCursor(startA, startB, a, b, inputChanged);

        aPos = this.getPos(a);
        bPos = this.getPos(b);

        if (Number.isNaN(aPos.lng) || Number.isNaN(bPos.lng)) {
            if (Number.isNaN(aPos.lng) && Number.isNaN(bPos.lng)) {
                this.showError(`<div data-i18n='common:invalidMortarTarget'>${i18next.t("common:invalidMortarTarget")}</div>`);
            } else if (Number.isNaN(aPos.lng)) {
                this.showError(`<div data-i18n='common:invalidMortar'>${i18next.t("common:invalidMortar")}</div>`, "mortar");
            } else {
                this.showError(`<div data-i18n='common:invalidTarget'>${i18next.t("common:invalidTarget")}</div>`, "target");
            }
            return 1;
        }

        aPos = {lat: -aPos.lng * this.minimap.gameToMapScale, lng: aPos.lat * this.minimap.gameToMapScale};
        bPos = {lat: -bPos.lng * this.minimap.gameToMapScale, lng: bPos.lat * this.minimap.gameToMapScale};

        let firingSolution = new SquadFiringSolution(aPos, bPos, this.minimap, 0);

        let elevation = this.activeWeapon.getAngleType() === -1 ? firingSolution.elevation.high : firingSolution.elevation.low;
        elevation = this.activeWeapon.unit === "mil" ? elevation.mil : elevation.deg;
    

        // If Target too close/far
        if (isNaN(elevation)) {
            this.showError(`<span data-i18n=common:targetOutOfRange>${i18next.t("common:targetOutOfRange")}</span> : ${firingSolution.distance.toFixed(0)}<span data-i18n=common:m>${i18next.t("common:m")}</span>`, "target");
            return 1;
        }

        this.insertCalc(firingSolution.bearing, elevation, firingSolution.distance);
    }

    /**
     * Insert Calculations into html
     * @param {number} bearing 
     * @param {number} elevation 
     */
    insertCalc(bearing, elevation) {

        animateCalc(bearing.toFixed(1), 500, "bearingNum");
        animateCalc(elevation.toFixed(this.activeWeapon.elevationPrecision), 500, "elevationNum");

        if (this.activeWeapon.name != "Mortar" && this.activeWeapon.name != "UB-32") document.getElementById("highlow").classList.add("active");
        if (this.activeWeapon.getAngleType() === -1) document.getElementById("highlowicon").style.transform = "rotate(0deg)";
        else document.getElementById("highlowicon").style.transform = "rotate(180deg)";

        // show actions button
        document.getElementById("savebutton").classList.remove("hidden");
    }



    /**
     * Filter invalid key pressed by the user
     * @param {event} event - keypress event
     * @returns {event} - empty event if we don't want the user input
     */
    filterInput(event) {
        const chrCode = event.charCode || event.which || event.keyCode || 0;
        const chrTyped = chrCode === 0 ? "SPECIAL KEY" : String.fromCharCode(chrCode);
    
        // Letters, Digits, special keys & backspace [\b] work as usual
        if (/\d|\b|SPECIAL|[A-Za-z]/.test(chrTyped) || event.altKey || event.ctrlKey || chrCode < 28) {
            return true;
        }
    
        // Prevent the default action for any other input
        event.preventDefault();
        return false;
    }
    

    /**
     * Display error in html & console
     * @param {string} msg - error message code to be displayed
     * @param {string} issue - mortar/target/both
     */
    showError(msg, issue) {

        if (issue === "mortar") document.getElementById("mortar-location").classList.add("error2");
        else if (issue === "target") document.getElementById("target-location").classList.add("error2");
        else document.querySelectorAll("#target-location, #mortar-location").forEach((el) => el.classList.add("error2"));

        // Rework the #setting div to display a single message
        document.getElementById("bearing").classList.add("hidden");
        document.getElementById("bearing").classList.remove("pure-u-10-24");
        document.getElementById("elevation").classList.add("hidden");
        document.getElementById("elevation").classList.remove("pure-u-10-24");
        const errorMsg = document.getElementById("errorMsg");
        errorMsg.classList.remove("pure-u-4-24");
        errorMsg.classList.add("pure-u-1", "errorMsg");
        errorMsg.innerHTML = msg;

        // remove the pointer cursor & tooltip
        document.getElementById("copy").classList.remove("copy");
        document.getElementById("settings").style.borderColor = "var(--main-color)";
        animateCSS(document.getElementById("settings"), "shakeX");
    }


    /**
     * Reset UI to default
     */
    resetCalc() {

        // First, reset any errors
        document.getElementById("settings").style.borderColor = "#fff";
        document.getElementById("target-location").classList.remove("error2");
        document.getElementById("mortar-location").classList.remove("error2");

        // prepare result divs
        document.getElementById("bearing").classList.remove("hidden");
        document.getElementById("bearing").classList.add("pure-u-10-24");
        document.getElementById("elevation").classList.remove("hidden");
        document.getElementById("elevation").classList.add("pure-u-10-24");
        const errorMsg = document.getElementById("errorMsg");
        errorMsg.classList.add("pure-u-4-24");
        errorMsg.classList.remove("errorMsg", "pure-u-1");
        errorMsg.innerHTML = "-";
        document.getElementById("savebutton").classList.add("hidden");
        document.getElementById("highlow").classList.remove("active");

        // draw pointer cursor on results
        document.getElementById("copy").classList.add("copy");
    }

    /**
     * Copy Saved calcs to clipboard
     */
    copySave(copyZone) {
        let text2copy;
        const prev = copyZone.previousElementSibling;

        if (prev.value.length === 0) text2copy = prev.getAttribute("placeholder").trim() + copyZone.textContent.trim();
        else text2copy = prev.value.trim() + copyZone.textContent.trim();

        navigator.clipboard.writeText(text2copy);
        animateCSS(copyZone.parentElement, "headShake");
    }

    /**
     * Format keypad input, setting text to uppercase and adding dashes
     * @param {string} text - keypad string to be formatted
     * @returns {string} formatted string
     */
    formatKeyPad(text) {
        const TEXTPARTS = [];

        // If empty string, return
        if (text.length === 0) { return ""; }

        const TEXTND = text.toUpperCase().split("-").join("");
        TEXTPARTS.push(TEXTND.slice(0, 3));

        // iteration through sub-keypads
        let i = 3;
        while (i < TEXTND.length) {
            TEXTPARTS.push(TEXTND.slice(i, i + 1));
            i += 1;
        }

        return TEXTPARTS.join("-");
    }

    /**
     * Remove a saved keypad
     *  * @param {object} a - saved calcs to remove
     */
    removeSaves(a) {
        if (document.querySelectorAll(".saved_list p").length === 1) { document.getElementById("saved").classList.add("hidden"); }
        a.closest("p").remove();
    }

    /**
     * Set the cursor at the correct position after formatKeyPad() messed with the inputs by reformating its values
     * @param {string} startA - cursor position on mortar
     * @param {string} startB - cursor position on target
     * @param {string} a - previous mortar coord before reformating
     * @param {string} b - previous tardget coord before reformating
     * @param {string} inputChanged - "mortar" or "target"
     */
    setCursor(startA, startB, a, b, inputChanged) {
        const MORTAR_LOC = document.getElementById("mortar-location");
        const TARGET_LOC = document.getElementById("target-location");
        const MORTAR_LENGTH = MORTAR_LOC.value.length;
        const TARGET_LENGTH = TARGET_LOC.value.length;

        a = a.length;
        b = b.length;


        // if the keypads.lenght is <3, do nothing.
        // Otherwise we guess if the user is deleting or adding something
        // and ajust the cursor considering MSMC added/removed a '-'

        if (startA >= 3) startA += (a > MORTAR_LENGTH) ? -1 : 1;
        if (startB >= 3) startB += (b > TARGET_LENGTH) ? -1 : 1;

        if (inputChanged === "weapon") MORTAR_LOC.setSelectionRange(startA, startA);
        else if (inputChanged === "target") TARGET_LOC.setSelectionRange(startB, startB);
        else {
            MORTAR_LOC.setSelectionRange(startA, startA);
            TARGET_LOC.setSelectionRange(startB, startB);
        }
    }


    /**
     * Resize Saved Names according to their content
     * using a hidden <span> as a ruler
     * @param {input} i - input to resize
     */
    resizeInput(i) {
        const content = i.value.length === 0 ? i.placeholder : i.value;
        const ruler = document.getElementById("ruler");
        ruler.textContent = content; // Use textContent to escape content safely
        i.style.width = `${ruler.getBoundingClientRect().width * 1.05}px`;
    }

    /**
     * Resize every saved name
     */
    resizeInputsOnResize() {
        document.querySelectorAll(".saved_list input, .saved_list textarea, .saved_list select, .saved_list button").forEach((element) => { this.resizeInput(element); });
    }


    /**
     * Save current calc to save list
     */
    saveCalc() {

        const savedList = document.querySelector(".saved_list");
        if (savedList.querySelectorAll("p").length === 4) savedList.querySelector("p").remove();

        const targetLocationValue = document.getElementById("target-location").value;
        const bearingNumText = document.getElementById("bearingNum").textContent;
        const elevationNumText = document.getElementById("elevationNum").textContent;

        savedList.insertAdjacentHTML("beforeend",
            `<p class=savedrow>
                <input maxlength=20 spellcheck=false placeholder="${targetLocationValue}" class=friendlyname></input>
                <span class=savespan>
                    ➜ ${bearingNumText} - ${elevationNumText}
                </span>
                <span class="del">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM160 128l41.4 0 11.3-11.3c3-3 7.1-4.7 11.3-4.7l64 0c4.2 0 8.3 1.7 11.3 4.7L310.6 128l41.4 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l192 0L338.4 354.7c-1.4 16.6-15.2 29.3-31.9 29.3l-101.1 0c-16.6 0-30.5-12.8-31.9-29.3L160 192z"/></svg>
                </span>
            </p>`
        );

        // resize the inserted input according the the placeholder length
        const savedInputs = savedList.querySelectorAll("p input");
        savedInputs[savedInputs.length - 1].style.width = `${targetLocationValue.length * 1.2}ch`;

        // display it
        document.getElementById("saved").classList.remove("hidden");
        const savedRows = document.querySelectorAll(".saved_list p");
        animateCSS(savedRows[savedRows.length - 1], "fadeInDown");
        tooltip_save.disable();
    }

    /**
     * Copy current calc to clipboard
     * @param {event} event - click event that triggered copy
     */
    copyCalc(event) {

        // If calcs aren't ready, do nothing
        if (!document.querySelector(".copy").classList.contains("copy")) return 1;

        if (event.target.id === "highlowicon" || event.target.id === "highlow") {
            if (document.getElementById("highlow").classList.contains("active")) this.changeHighLow();
            return 1;
        }

        animateCSS(document.querySelector(".copy"), "headShake");
        navigator.clipboard.writeText(`${document.getElementById("target-location").value} ➜ ${document.getElementById("bearingNum").textContent} - ${document.getElementById("elevationNum").textContent}`);
        this.openToast("success", "copied", "");

    }

    /**
     * Toggle high/low angles
     */
    changeHighLow(){
        const transformValue = getComputedStyle(document.getElementById("highlowicon")).transform;
        if (transformValue === "none" || transformValue === "matrix(1, 0, 0, 1, 0, 0)") this.activeWeapon.angleType = "low";
        else this.activeWeapon.angleType = "high";
        this.shoot();
    }


    /**
     * Returns the latlng coordinates based on the given keypad string.
     * Supports unlimited amount of sub-keypads.
     * Throws error if keypad string is too short or parsing results in invalid latlng coordinates.
     * @param {string} kp - keypad coordinates, e.g. "A02-3-5-2"
     * @returns {LatLng} converted coordinates
     */
    getPos(kp) {
        const FORMATTED_KEYPAD = this.formatKeyPad(kp);
        const PARTS = FORMATTED_KEYPAD.split("-");
        const gridSize = this.minimap.gridSize;
        let interval;
        let lat = 0;
        let lng = 0;
        let i = 0;

        while (i < PARTS.length) {
            if (i === 0) {
                // special case, i.e. letter + number combo
                const LETTERCODE = PARTS[i].charCodeAt(0);
                const LETTERINDEX = LETTERCODE - 65;
                if (PARTS[i].charCodeAt(0) < 65) { return { lat: NaN, lng: NaN }; }
                const KEYPADNB = Number(PARTS[i].slice(1)) - 1;
                lat += gridSize * LETTERINDEX;
                lng += gridSize * KEYPADNB;

            } else {
                // opposite of calculations in getKP()
                const SUB = Number(PARTS[i]);
                if (Number.isNaN(SUB)) console.debug(`invalid keypad string: ${FORMATTED_KEYPAD}`);
                const subX = (SUB - 1) % 3;
                const subY = 2 - (Math.ceil(SUB / 3) - 1);

                interval = gridSize / 3 ** i;
                lat += interval * subX;
                lng += interval * subY;
            }
            i += 1;
        }

        // at the end, add half of last interval, so it points to the center of the deepest sub-keypad
        interval = gridSize / 3 ** (i - 1);
        lat += interval / 2;
        lng += interval / 2;

        return { lat: lat, lng: lng };
    }

    getAppState() {
        const weapons = [];
        const targets = [];
        const markers = [];
        const arrows = [];
        const circles = [];
        const rectangles = [];
        const draws = [];
        const hexs = [];
        const activeWeapon = this.WEAPON_SELECTOR.value;
        const activeMap = this.MAP_SELECTOR.value;
        const activeLayer = this.LAYER_SELECTOR.value;
        const team1 = [this.FACTION1_SELECTOR.value, this.UNIT1_SELECTOR.value];
        const team2 = [this.FACTION2_SELECTOR.value, this.UNIT2_SELECTOR.value];
        const teams = [team1, team2];
        const selectedFlags = [];
        const version = this.version;
    
        this.minimap.activeWeaponsMarkers.eachLayer(weapon => {
            weapons.push({ lat: weapon._latlng.lat, lng: weapon._latlng.lng, heightPadding: weapon.heightPadding, uid: weapon.uid });
        });
        this.minimap.activeTargetsMarkers.eachLayer(target => {
            targets.push({ lat: target._latlng.lat, lng: target._latlng.lng, uid: target.uid });
        });
        this.minimap.activeMarkers.eachLayer(marker => {
            markers.push({ lat: marker._latlng.lat, lng: marker._latlng.lng, uid: marker.uid, team: marker.team, category: marker.category, icon: marker.icontype });
        });
        this.minimap.activeArrows.forEach(arrow => {
            arrows.push({ uid: arrow.uid, latlngs: arrow.polyline.getLatLngs(), color: arrow.color, });
        });
        this.minimap.activeCircles.forEach(circle => {
            circles.push({ uid: circle.uid, latlng: circle.circle.getLatLng(), color: circle.color, radius: circle.circle.getRadius(), });
        });
        this.minimap.activeRectangles.forEach(rectangle => {
            rectangles.push({ uid: rectangle.uid, color: rectangle.color, bounds: rectangle.rectangle.getBounds(), });
        });
        this.minimap.activePolylines.forEach(polyline => {
            draws.push({ uid: polyline.uid, color: polyline.color, bounds: polyline.polyline.getBounds(), latlngs: polyline.polyline.getLatLngs(), });
        });

        if (this.minimap.layer) {
            this.minimap.layer.selectedFlags.forEach(flag => { selectedFlags.push(flag.objectName); });
            this.minimap.layer.hexs.forEach((hex) => {
                hexs.push({ number: hex._hexNumber, colorIndex: hex._colorIndex, });
            });
        }

        
        return { hexs, weapons, targets, markers, arrows, circles, rectangles, draws, activeWeapon, activeMap, activeLayer, selectedFlags, teams, version };
    }

    saveMapStateToFile() {
        const now = new Date();
        const data = this.getAppState();
        const formattedDate =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") + "_" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0");
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.minimap.activeMap.name}_${formattedDate}.squadcalc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.openToast("success", "mapSaved", "dragToImport");
    }

    loadMapStateFromFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                console.debug("Parsed JSON:", data);

                this.mapSelect.setChoiceByValue(String(data.activeMap));
                triggerChange(this.MAP_SELECTOR, true);

                data.markers.forEach(marker => { this.minimap.createMarker(new LatLng(marker.lat, marker.lng), marker.team, marker.category, marker.icon, marker.uid); });
                data.arrows.forEach(arrow => { new MapArrow(this.minimap, arrow.color, arrow.latlngs[0], arrow.latlngs[1], arrow.uid); });
                data.circles.forEach(circle => { new MapCircle(this.minimap, circle.color, circle.latlng, circle.radius, circle.uid); });
                data.rectangles.forEach(rectangle => { new MapRectangle(this.minimap, rectangle.color, rectangle.bounds._southWest, rectangle.bounds._northEast, rectangle.uid); });
                data.draws.forEach(draw => { new MapDrawing(this.minimap, draw.color, draw.latlngs, draw.uid).finalize(false); });

                document.addEventListener("heightmap:loaded", () => {
                    if (Array.isArray(data.weapons) && data.weapons.length > 0) {
                        data.weapons.forEach(weapon => { this.minimap.createWeapon(new LatLng(weapon.lat, weapon.lng)); });
                        data.targets.forEach(target => { this.minimap.createTarget(new LatLng(target.lat, target.lng), false); });
                    }
                    this.openToast("success", "importSuccess", "");
                }, { once: true });

                document.addEventListener("layers:loaded", () => {
                    this.layerSelect.setChoiceByValue(String(data.activeLayer));
                    triggerChange(this.LAYER_SELECTOR, true);
                    document.addEventListener("layer:loaded", () => {
                        data.selectedFlags.forEach(flag => {
                            this.minimap.layer.flags.forEach((layerFlag) => {
                                if (layerFlag.objectName != flag) return;
                                if (layerFlag.isSelected) return;
                                this.minimap.layer._handleFlagClick(layerFlag);
                            });
                        });
                        this.FACTION1_SELECTOR.value = data.teams[0][0];
                        triggerChange(this.FACTION1_SELECTOR, false);
                        this.FACTION2_SELECTOR.value = data.teams[1][0];
                        triggerChange(this.FACTION2_SELECTOR, false);
                        this.UNIT1_SELECTOR.value = data.teams[0][1];
                        triggerChange(this.UNIT1_SELECTOR, false);
                        this.UNIT2_SELECTOR.value = data.teams[1][1];
                        triggerChange(this.UNIT2_SELECTOR, false);
                    }, { once: true });
                }, { once: true });
            } catch (err) {
                console.debug("Not valid JSON", err);
                this.openToast("error", "fileNotSupported", "");
            }
        };
        reader.readAsText(file);
    }


    /**
     * Updates the URL search parameters by applying the provided updates.
     *
     * This function reads the current URL's search parameters and applies the given key-value updates:
     * - If a value is not null or undefined, the corresponding parameter gets added or updated.
     * - If a value is null or undefined, the parameter is removed.
     *
     * After updating, the function reorganizes the parameters based on a defined order 
     * (["map", "layer", "type", "session"]) to ensure consistency.
     *
     * @param {Object} updates - An object with keys and values to update in the URL. 
     * For example: { map: "newMap", session: "abc123", layer: null }
     */
    updateUrlParams(updates = {}) {
        const urlParams = new URLSearchParams(window.location.search);

        // Apply updates (add or update parameters)
        for (const [key, value] of Object.entries(updates)) {
            if (value !== null && value !== undefined) {
                urlParams.set(key, value);
                
            } else {
                urlParams.delete(key);
            }
        }
       
        // Create a new URLSearchParams object for the sorted parameters
        const sortedParams = new URLSearchParams();

        // Add parameters in the order defined by paramOrder
        ["map", "layer", "type", "3d", "session", "server"].forEach((param) => {
            if (urlParams.has(param)) {
                sortedParams.set(param, urlParams.get(param));
                urlParams.delete(param);
            }
        });

        // Add any remaining parameters
        for (const [key, value] of urlParams.entries()) sortedParams.set(key, value);

        // Construct the new URL - bare flags (empty value, e.g. "3d") drop the
        // trailing "=" that URLSearchParams.toString() would otherwise leave.
        const query = sortedParams.toString().replace(/=(&|$)/g, "$1");
        const newUrl = `${window.location.pathname}?${query}`;
        window.history.replaceState({}, "", newUrl);
    }

    sanitize(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

}