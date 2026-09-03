import { MAPS, initMapsProperties } from "../data/maps.js";
import { WEAPONS, WEAPONSTYPE } from "../data/weapons.js";
import { MODS } from "../data/mods.js";
import { squadMinimap } from "./squadMinimap.js";
import { Weapon } from "./squadWeapons.js";
import { animateCSS, animateCalc } from "./animations.js";
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

const changelogRenderer = new Renderer();
changelogRenderer.link = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};
import i18next from "i18next";
import SquadLayer from "./squadLayer.js";
import { serverBrowserTooltips, settingsTooltips, layerInfoTooltips } from "./tooltips.js";
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
        this.MAP_SELECTOR = $(".dropbtn");
        this.WEAPON_SELECTOR = $(".dropbtn2");
        this.SHELL_SELECTOR = $(".dropbtn3");
        this.LAYER_SELECTOR = $(".dropbtn5");
        this.SERVER_SELECTOR = $(".dropbtn6");
        this.FACTION1_SELECTOR = $(".dropbtn8");
        this.FACTION2_SELECTOR = $(".dropbtn10");
        this.UNIT1_SELECTOR = $(".dropbtn9");
        this.UNIT2_SELECTOR = $(".dropbtn11");
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
        return {
            server:    p.get("server"),
            session:   p.get("session"),
            map:       p.get("map"),
            layer:     p.get("layer"),
            team1:     p.get("team1"),
            team1unit: p.get("team1unit"),
            team2:     p.get("team2"),
            team2unit: p.get("team2unit"),
        };
    }

    applyUrlIntent() {
        const { server, session } = this.urlIntent;
        if (server)       this.initServerMode(server, session);
        else if (session) this.initSessionMode(session, this.urlIntent);
        else              this.initStaticMode(this.urlIntent);
        this.initFavoriteServers();
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
                this.SERVER_SELECTOR.val("").trigger("change.select2");
                this.loadLayers();
                this.initStaticMode(this.urlIntent);
                return;
            }

            // Server found — discard any URL team overrides; map/layer are overwritten by switchLayer
            this.updateUrlParams({ team1: null, team1unit: null, team2: null, team2unit: null });

            this.squadServersBrowser.selectedServer = server.id;
            this.squadServersBrowser.selectedLayer = server.attributes.details.map;

            // Ensure layers are loaded for the server's map before switching layer
            if (!this.layersLoaded) {
                console.debug("Layers not loaded yet, loading layers for server map");
                this.loadLayers();
            }

            this.squadServersBrowser.switchLayer(
                server.attributes.name,
                server.mapName,
                server.attributes.details.map,
                server.team1FactionId || server.team1,
                server.team2FactionId || server.team2,
                server.attributes.details.squad_teamOne,
                server.attributes.details.squad_teamTwo
            );

            $("#serversTableBody tr").removeClass("selected");
            $(`#serversTableBody tr[data-serverid="${serverId}"]`).addClass("selected");
            $("#servers").addClass("active");

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
            $(document).one("servers:loaded", setup);
        }
    }

    initSessionMode(sessionId, intent = null) {
        $(".btn-session").addClass("active");
        createSessionTooltips.disable();
        leaveSessionTooltips.enable();

        const startSession = () => { this.session = new SquadSession(sessionId); };

        if (intent?.layer) {
            this.initStaticMode(intent, startSession);
        } else if (this.layersLoaded) {
            startSession();
        } else {
            $(document).one("layers:loaded", startSession);
        }
    }

    initStaticMode(intent, onLayerLoaded = null) {
        if (!intent.layer) {
            onLayerLoaded?.();
            return;
        }

        const applyLayer = () => {
            const urlLayerName = intent.layer.toLowerCase().replaceAll(" ", "");
            const match = this.LAYER_SELECTOR.find("option").filter((_, el) =>
                ($(el).data("urlid") ?? "").toLowerCase() === urlLayerName
            );

            if (!match.length) {
                this.updateUrlParams({ layer: null });
                onLayerLoaded?.();
                return;
            }

            match.prop("selected", true);

            if (intent.team1 || intent.team2 || onLayerLoaded) {
                $(document).one("layer:loaded", () => {
                    [
                        { faction: intent.team1, unit: intent.team1unit, fSel: this.FACTION1_SELECTOR, uSel: this.UNIT1_SELECTOR },
                        { faction: intent.team2, unit: intent.team2unit, fSel: this.FACTION2_SELECTOR, uSel: this.UNIT2_SELECTOR },
                    ].forEach(({ faction, unit, fSel, uSel }) => {
                        if (faction) {
                            const fm = fSel.find("option").filter((_, el) => el.value.toLowerCase() === faction.toLowerCase());
                            if (fm.length) fSel.val(fm.val()).trigger($.Event("change", { broadcast: false }));
                        }
                        if (unit) {
                            const um = uSel.find("option").filter((_, el) => el.value.toLowerCase() === unit.toLowerCase());
                            if (um.length) uSel.val(um.val()).trigger($.Event("change", { broadcast: false }));
                        }
                    });
                    this.updateUrlParams({ team1: null, team1unit: null, team2: null, team2unit: null });
                    onLayerLoaded?.();
                });
            }

            this.LAYER_SELECTOR.trigger($.Event("change", { broadcast: false }));
        };

        if (this.layersLoaded) {
            applyLayer();
        } else {
            $(document).one("layers:loaded", applyLayer);
        }
    }

    /**
     * Load the maps to the menu
     */
    loadMapSelector() {

        // Initiate Maps&Layers Dropdown
        this.MAP_SELECTOR.select2();
        this.LAYER_SELECTOR.select2();
        this.SERVER_SELECTOR.select2({ minimumResultsForSearch: Infinity, dropdownParent: $("#serverSelector"), allowClear: true });
        this.SERVER_SELECTOR.on("change", (event) => {
            const serverId = event.target.value;
            if (!serverId) {
                this.updateUrlParams({ server: null });
                $("#serversTableBody tr").removeClass("selected");
                $("#servers").removeClass("active");
                if (this.squadServersBrowser) {
                    this.squadServersBrowser.selectedServer = null;
                    clearInterval(this.squadServersBrowser.syncInterval);
                    this.squadServersBrowser.syncInterval = null;
                }
                return;
            }
            this.updateUrlParams({ server: serverId });
            this.initServerMode(serverId);
        });
        this.FACTION1_SELECTOR.select2();
        $(".dropbtn8").select2();
        $(".dropbtn9").select2();
        $(".dropbtn10").select2();
        $(".dropbtn11").select2();
        
        // Load maps
        this._rebuildMapSelector();

        // Add event listener
        this.MAP_SELECTOR.on("change", (event) => {

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

            if (broadcast && this.session.ws && this.session.ws.readyState === WebSocket.OPEN) {
                this.session.ws.send(
                    JSON.stringify({
                        type: "UPDATE_MAP",
                        activeMap: this.MAP_SELECTOR.val(),
                    })
                );
                console.debug(`Sent map update for map #${this.MAP_SELECTOR.val()}`);
            }
        });

        let abortController = null;

        this.LAYER_SELECTOR.on("change", (event) => {

            const selectedLayerValue = this.LAYER_SELECTOR.find(":selected").data("urlid") ?? "";
            const selectedLayerMod = this.LAYER_SELECTOR.find(":selected").data("mod");
            const broadcast = event.broadcast ?? true;

            // User cleared the layer selector, remove the layer and clean the URL
            if (selectedLayerValue === "") {
                this.updateUrlParams({ layer: null, team1: null, team1unit: null, team2: null, team2unit: null });
                if (abortController) { abortController.abort(); } // Abort the ongoing fetch request
                if (this.minimap.layer) this.minimap.layer.clear();
                $(".btn-layer, .btn-layer-info").hide();
                $("#factionsTab, #factionsButton").hide();

                // Empty Factions&Units selectors
                this.FACTION1_SELECTOR.empty();
                this.UNIT1_SELECTOR.empty();
                this.FACTION2_SELECTOR.empty();
                this.UNIT2_SELECTOR.empty();

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

            $(".dropbtn8").empty();
            $(".dropbtn10").empty();
            
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
                    $("#factionsTab, #factionsButton").hide();
                    this.minimap.spin(false);

                    // Stop the chain
                    throw error;
                })
                .then(layerData => {
                    if (!layerData) return; // prevent continuing on fetch failure

                    if (this.minimap.layer) this.minimap.layer.clear();
                    this.minimap.layer = new SquadLayer(this.minimap, layerData, broadcast, selectedLayerMod);
                    $(".btn-layer").addClass("active").show();
                    $(".btn-layer-info").show();

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
                    $(document).trigger("layer:loaded");
                    this.minimap.spin(false);
                });
        });
    }

    /**
     * Retrieve list of available layers name from squadcalc api
     */
    loadLayers() {
        this.minimap.spin(true, this.minimap.spinOptions);
        $("#layerSelector").hide();
        const selectedValue = this.LAYER_SELECTOR.val();
        this.LAYER_SELECTOR.empty();

        const enabledMods = this._getUniqueMods().filter(mod => this.userSettings.isModEnabled(mod));

        fetchLayersByMap(this.minimap.activeMap.name, enabledMods).then(layers => {

            if (layers.length === 0) {
                this.minimap.spin(false);
                this.updateUrlParams({ layer: null, team1: null, team1unit: null, team2: null, team2unit: null });
                return;
            }

            // Re-empty just in case user changed map while the request was on the way
            this.LAYER_SELECTOR.empty();
            this.LAYER_SELECTOR.append("<option value=></option>");

            const vanillaLayers = layers.filter(layer => !layer.mod);
            const vanillaContainer = enabledMods.length
                ? $(`<optgroup label="${i18next.t("settings:vanilla", { defaultValue: "Vanilla" })}"></optgroup>`)
                : this.LAYER_SELECTOR;

            vanillaLayers.forEach((layer) => {
                vanillaContainer.append(`<option value="${layer.rawName}" data-urlid="${layer.shortName.replaceAll(" ", "")}">${layer.shortName}</option>`);
            });

            if (enabledMods.length && vanillaContainer.children().length) this.LAYER_SELECTOR.append(vanillaContainer);

            const mapName = this.minimap.activeMap.name;

            enabledMods.forEach((modKey) => {
                const label = i18next.t(`settings:${modKey}`, { defaultValue: modKey });
                const optgroup = $(`<optgroup data-mod="${modKey}" label="${label}"></optgroup>`);

                layers.filter(layer => layer.mod?.toLowerCase() === modKey.toLowerCase()).forEach((layer) => {
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

                    optgroup.append(`<option value="${layer.rawName}" data-mod="${modKey}" data-urlid="${modKey}_${displayName.replaceAll(" ", "")}">${displayName}</option>`);
                });

                if (optgroup.children().length) this.LAYER_SELECTOR.append(optgroup);
            });

            if (this.LAYER_SELECTOR.find(`option[value="${selectedValue}"]`).length) {
                this.LAYER_SELECTOR.val(selectedValue).trigger("change.select2");
            }

            this.minimap.spin(false);
            $("#layerSelector").show();

            this.layersLoaded = true;
            $(document).trigger("layers:loaded");

        }).catch(error => {
            $("#layerSelector").hide();
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
        this.SERVER_SELECTOR.empty();
        this.SERVER_SELECTOR.append("<option value=\"\"></option>");
        const currentServerId = this.squadServersBrowser?.selectedServer ?? this.urlIntent.server;
        servers.forEach(server => {
            const unavailable = !server.team1 || !server.team2 || !server.mapName;
            const isActive = !unavailable && currentServerId && String(currentServerId) === String(server.id);
            const option = new Option(server.attributes.name, server.id, false, isActive);
            if (unavailable) {
                option.disabled = true;
                option.title = "Modded layer";
            }
            this.SERVER_SELECTOR.append(option);
        });
        this.SERVER_SELECTOR.trigger("change.select2");
        $("#serverSelector").show();
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

        this.MAP_SELECTOR.val(mapIndex);
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
        this.WEAPON_SELECTOR.select2({
            dropdownCssClass: "dropbtn2",
            dropdownParent: $("#weaponSelector"),
            minimumResultsForSearch: -1,
        });

        this.SHELL_SELECTOR.select2({
            dropdownCssClass: "dropbtn3",
            dropdownParent: $("#ammoSelector"),
            minimumResultsForSearch: -1,
        });

        // Load Weapons
        for (const type of WEAPONSTYPE) {
            this.WEAPON_SELECTOR.append(`<optgroup data-i18n-label=weapons:${type}>`);
            for (const [index, weapon] of WEAPONS.entries()) {
                if (weapon.type === type) {
                    this.WEAPON_SELECTOR.append(`<option data-i18n=weapons:${weapon.name} value=${index}></option>`);
                }
            }
            this.WEAPON_SELECTOR.append("</optgroup>");
        }


        // Populate the Mods settings panel and apply currently enabled mods
        this.initModsPanel();

        // Add Events Listeners
        this.WEAPON_SELECTOR.on("change", () => { this.changeWeapon(); });
        this.SHELL_SELECTOR.on("change", () => { this.activeWeapon.changeShell(); });
        
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
     * Populate #modsPanelContainer with one toggle tile per mod
     */
    _renderModTiles() {
        const mods = this._getUniqueMods().sort((a, b) => {
            const labelA = i18next.t(`settings:${a}`, { defaultValue: a });
            const labelB = i18next.t(`settings:${b}`, { defaultValue: b });
            return labelA.localeCompare(labelB);
        });
        const container = $("#modsPanelContainer");
        container.empty();

        const statsHtml = (layers, weapons, maps) => {
            const parts = [];
            if (layers > 0) parts.push(`<span>${i18next.t("settings:modLayersCount", { count: layers, defaultValue: `${layers} Layers` })}</span>`);
            if (weapons > 0) parts.push(`<span>${i18next.t("settings:modWeaponsCount", { count: weapons, defaultValue: `${weapons} Weapons` })}</span>`);
            if (maps > 0) parts.push(`<span>${i18next.t("settings:modMapsCount", { count: maps, defaultValue: `${maps} Maps` })}</span>`);
            return `<span class="modTileStats">${parts.join(`<span class="modTileStatsSeparator">•</span>`)}</span>`;
        };

        mods.forEach((modKey) => {
            const active = this.userSettings.isModEnabled(modKey) ? "active" : "";
            const label = i18next.t(`settings:${modKey}`, { defaultValue: modKey });
            const weapons = WEAPONS.filter(w => w.mod === modKey).length;
            const layers = this.layerCounts?.[modKey.toLowerCase()] ?? 0;
            const maps = MAPS.filter(m => m.mod === modKey).length;
            container.append(`
                <button type="button" class="modToggleTile ${active}" data-mod="${modKey}">
                    <img class="modTileLogo" src="/img/mods/${modKey.toLowerCase()}.webp" alt="" onerror="this.style.display='none'">
                    <span class="modTileName" data-i18n="settings:${modKey}">${label}</span>
                    ${statsHtml(layers, weapons, maps)}
                </button>
            `);
        });

        $(".modToggleTile").not(".locked").on("click", (e) => {
            const tile = $(e.currentTarget);
            const modKey = tile.data("mod");
            const enabled = !tile.hasClass("active");
            tile.toggleClass("active", enabled);
            this.userSettings.setModEnabled(modKey, enabled);
            this._rebuildModdedWeapons();
            const mapWasReset = this._rebuildMapSelector();
            if (!mapWasReset && this.minimap.activeMap) this.loadLayers();
        });
    }

    /**
     * Rebuild the map selector: vanilla maps always shown, plus one optgroup
     * per enabled mod that has its own maps (same mechanics as the layer selector).
     * Falls back to the first vanilla map if the currently active map got hidden
     * (e.g. its mod was just disabled). Returns true if that fallback fired.
     */
    _rebuildMapSelector() {
        const selectedValue = this.MAP_SELECTOR.val();
        this.MAP_SELECTOR.empty();

        const enabledMods = this._getUniqueMods().filter(modKey => this.userSettings.isModEnabled(modKey));

        const vanillaContainer = enabledMods.length
            ? $(`<optgroup data-i18n-label="settings:vanilla" label="${i18next.t("settings:vanilla", { defaultValue: "Vanilla" })}"></optgroup>`)
            : this.MAP_SELECTOR;

        MAPS.forEach((map, i) => {
            if (!map.mod) vanillaContainer.append(`<option data-i18n="maps:${map.name}" value="${i}">${i18next.t("maps:" + map.name)}</option>`);
        });

        if (enabledMods.length && vanillaContainer.children().length) this.MAP_SELECTOR.append(vanillaContainer);

        enabledMods.forEach(modKey => {
            const label = i18next.t(`settings:${modKey}`, { defaultValue: modKey });
            const optgroup = $(`<optgroup data-mod="${modKey}" data-i18n-label="settings:${modKey}" label="${label}"></optgroup>`);

            MAPS.forEach((map, i) => {
                if (map.mod === modKey) {
                    optgroup.append(`<option data-i18n="maps:${map.name}" value="${i}">${i18next.t("maps:" + map.name)}</option>`);
                }
            });

            if (optgroup.children().length) this.MAP_SELECTOR.append(optgroup);
        });

        if (this.MAP_SELECTOR.find(`option[value="${selectedValue}"]`).length) {
            this.MAP_SELECTOR.val(selectedValue).trigger("change.select2");
            return false;
        }

        if (this.minimap?.activeMap) {
            this.MAP_SELECTOR.val(0).trigger("change");
            return true;
        }

        return false;
    }

    /**
     * Rebuild per-mod optgroups in the weapon selector based on currently enabled mods
     */
    _rebuildModdedWeapons() {
        const selectedValue = this.WEAPON_SELECTOR.val();
        const selectedIsModded = !!(WEAPONS[selectedValue]?.mod);

        this.WEAPON_SELECTOR.find("optgroup[data-mod]").remove();

        this._getUniqueMods().forEach(modKey => {
            if (!this.userSettings.isModEnabled(modKey)) return;

            const label = i18next.t(`settings:${modKey}`, { defaultValue: modKey });
            const optgroup = $(`<optgroup data-mod="${modKey}" data-i18n-label="settings:${modKey}" label="${label}"></optgroup>`);

            for (let y = 0; y < WEAPONS.length; y++) {
                if (WEAPONS[y].mod === modKey) {
                    optgroup.append(`<option data-i18n="weapons:${WEAPONS[y].name}" value="${y}">${i18next.t("weapons:" + WEAPONS[y].name)}</option>`);
                }
            }

            if (optgroup.children().length) {
                this.WEAPON_SELECTOR.append(optgroup);
            }
        });

        if (selectedIsModded) {
            this.WEAPON_SELECTOR.val(0).trigger("change");
        }
    }

    /**
     * Initialize the Mods settings panel and apply currently enabled mods to the weapon selector
     */
    initModsPanel() {
        this._renderModTiles();
        this._rebuildModdedWeapons();
    }




    loadUI(){
        this._dialogs = {
            calc:    document.querySelector("#calcInformation"),
            weapon:  document.querySelector("#weaponInformation"),
            help:    document.querySelector("#helpDialog"),
            factions:document.querySelector("#factionsDialog"),
            servers: document.querySelector("#serversInformation"),
            shortcutCapture: document.querySelector("#shortcutCaptureDialog"),
            changelog: document.querySelector("#changelogDialog"),
            layerInfo: document.querySelector("#layerInformation"),
        };
        this._changelogCache = null;
        const { calc: calcInformation, weapon: weaponInformation, help: helpDialog, factions: factionsDialog, servers: serversInformation, layerInfo: layerInfoDialog } = this._dialogs;

        $(".btn-delete, .btn-undo, .btn-layer, .btn-layer-info, .returnBtn, #mapLayerMenu").hide();

        this.ui = localStorage.getItem("data-ui");

        if (this.ui === null || isNaN(this.ui) || this.ui === ""){
            this.ui = 1; 
            localStorage.setItem("data-ui", 1);  
        }

        if (this.ui == 1) this.loadMapUIMode();
        else {
            $(".returnBtn").show();
            $(".weaponSelector").addClass("active");
        }

        // Add Events listeners

        // LEGACY MODE
        $("#mortar-location").on("input", () => { this.shoot("weapon"); });
        $("#target-location").on("input",  () => { this.shoot("target"); });
        $("#mortar-location").on("keypress", (event) => { this.filterInput(event); });
        $("#target-location").on("keypress", (event) => { this.filterInput(event); });
        $(document).on("input", ".friendlyname", (event) => { this.resizeInput(event.target); });
        $(window).on("resize", () => { this.resizeInputsOnResize(); });
        $(document).on("click", ".del", (event) => { this.removeSaves(event.target); });
        $(document).on("click", ".savespan", (event) => { this.copySave($(event.target)); });
        $(".savespan").on("click", (event) => { this.copySave(event); });
        $("#savebutton").on("click",  () => { this.saveCalc(); });
        $("#copy").on("click", (event) => { this.copyCalc(event); });

        // MAP MODE
        this.closeDialogOnClickOutside(calcInformation);
        this.closeDialogOnClickOutside(weaponInformation);
        this.closeDialogOnClickOutside(serversInformation);
        this.closeDialogOnClickOutside(helpDialog);
        this.closeDialogOnClickOutside(factionsDialog);
        this.closeDialogOnClickOutside(this._dialogs.changelog);
        this.closeDialogOnClickOutside(layerInfoDialog);
        
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

        $(document).on("click", "#servers", () => {
            serverBrowserTooltips.hide();
            serverBrowserTooltips.disable();
            if (!this.squadServersBrowser) {
                this.squadServersBrowser = new SquadServersBrowser();
                this.squadServersBrowser.init();
            }
            $("#serversInformation")[0].showModal();

            // Focus search input at the end
            const searchInput = document.getElementById("serverSearch");
            if (searchInput) searchInput.focus();
        });

        $(document).on("favorites:changed", (_event, { favorites, servers }) => {
            const favoriteServers = (servers || []).filter(s => favorites.has(String(s.id)));
            if (favoriteServers.length === 0) {
                $("#serverSelector").hide();
                return;
            }
            this.buildFavoriteServersDropdown(favoriteServers);
        });

        serversInformation.addEventListener("close", () => {
            setTimeout(() => serverBrowserTooltips.enable(), 50);
        });

        helpDialog.addEventListener("close", () => {
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

        $(".btn-delete").on("click", () => {
            this.minimap.deleteTargets();
            this.minimap.deleteMarkers();
            this.minimap.deleteArrows();
            this.minimap.deleteRectangles();
            this.minimap.deleteCircles();
            this.minimap.deletePolylines();
        });

        $(".btn-download").on("click", () => { this.saveMapStateToFile(); });
        $(".btn-upload").on("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".squadcalc,.json";
            input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) this.loadMapStateFromFile(file);
            };
            input.click();
        });
        $(".btn-undo").on("click", () => { if (this.minimap.history.length > 0) this.minimap.history.at(-1).delete(); });
        $(".btn-layer").on("click", () => { this.minimap.layer.toggleVisibility(); });
        $(".btn-layer-info").on("click", () => {
            const layerData = this.minimap.layer?.layerData;
            if (!layerData) return;

            layerInfoTooltips.hide();
            layerInfoTooltips.disable();

            $(".infLayerMap").text(layerData.Name ?? layerData.rawName ?? "");
            $(".infLayerGamemode").text(layerData.gamemode ?? "");
            $(".infLayerVersion").text(layerData.layerVersion ?? "");
            $(".infLayerSize").text(layerData.mapSize ?? "");
            $(".infLayerTeam1Tickets").text(layerData.teamConfigs?.team1?.tickets ?? "");
            $(".infLayerTeam2Tickets").text(layerData.teamConfigs?.team2?.tickets ?? "");

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
            const team1Faction = this.FACTION1_SELECTOR.val();
            const team2Faction = this.FACTION2_SELECTOR.val();
            const factionUnitArgs = (team1Faction && team2Faction)
                ? ` ${team1Faction}+${unitTypeOf("team1", this.UNIT1_SELECTOR.val())} ${team2Faction}+${unitTypeOf("team2", this.UNIT2_SELECTOR.val())}`
                : "";

            $(".layerCommandInput").val(`AdminSetNextLayer ${layerData.rawName}${factionUnitArgs}`);
            $(".layerChangeCommandInput").val(`AdminChangeLayer ${layerData.rawName}${factionUnitArgs}`);

            $(".layerShareUrlInput").val(this.buildShareUrl());

            $(".layerThumbnail")
                .show()
                .attr("src", `${process.env.API_URL}/img/thumbnails/${encodeURIComponent(layerData.rawName)}.webp`);

            layerInfoDialog.showModal();
        });
        $(".layerCommandCopyBtn").on("click", (event) => {
            const input = event.currentTarget.closest(".layerCommandRow").querySelector("input");
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(input.value);
            } else {
                input.select();
                document.execCommand("copy");
            }
            this.openToast("success", "copied", "");
        });
        $(".btn-drawingMode").on("click", () => { this.minimap.disableDrawingMode(); });
        $(".btn-legacy").on("click", () => { if (this.ui !== 0) this.switchUI(); });
        $("#factionsButton .factionBar-top").on("click", (e) => {
            e.stopPropagation();
            $("#factionsButton").toggleClass("collapsed");
        });
        $("#factionsButton button.btn-faction").on("click", () => { $("#factionsDialog")[0].showModal(); });
        $(".btn-settings").on("click", () => {
            settingsTooltips.hide();
            settingsTooltips.disable();
            helpDialog.showModal();
        });

        $(document).on("click", "#openChangelog", async () => {
            const changelogDialog = this._dialogs.changelog;
            const contentEl = document.getElementById("changelogContent");
            changelogDialog.showModal();
            if (this._changelogCache) {
                contentEl.innerHTML = this._changelogCache;
                return;
            }
            const { default: changelogMd } = await import("../../CHANGELOG.md");
            const html = marked.parse(changelogMd, { renderer: changelogRenderer });
            this._changelogCache = html;
            contentEl.innerHTML = html;
        });

        $("#mapLayerMenu").find("button.btn-session").on("click", () => {
            if ($(".btn-session").hasClass("active")) {
                
                // Quit session
                if (this.session) {
                    this.session.ws.close();
                    this.session = false;
                }
                
                // Update UI
                $(".btn-session").removeClass("active");
                leaveSessionTooltips.disable();
                createSessionTooltips.enable();
                //this.openToast("error", "Session quit", "You have quit the session.");
                
            } else {
                // Create session
                this.session = new SquadSession();
                $(".btn-session").addClass("active");
                createSessionTooltips.disable();
                leaveSessionTooltips.enable();
            }
        });


        $("#mapLayerMenu").find("button.layers").on("click", (event) => {

            if ($(event.currentTarget).hasClass("active")) { return; }
            const VAL = $(event.currentTarget).attr("value");

            if (VAL === "helpmap") {
                $(".btn-"+VAL).toggleClass("active");
                this.minimap.toggleHeatmap();
                return;
            }

            $("#mapLayerMenu").find(".layers").removeClass("active");
            $(".btn-"+VAL).addClass("active");
            this.updateUrlParams({ type: VAL === "basemap" ? null : VAL });
            localStorage.setItem("settings-map-mode", VAL);
            this.userSettings.layerMode = VAL;
            this.minimap.changeLayer();
        });

        $("#mapLayerMenu").find("button.btn-helpmap").on("click", () => {
            $(".btn-helpmap").toggleClass("active");
            this.minimap.toggleHeatmap();
        });

        $("#mapLayerMenu").find("button.btn-hd").on("click", () => {
            if ($(".btn-hd").hasClass("locked")) return;
            const VAL = !$(".btn-hd").hasClass("active");
            $(".btn-hd").toggleClass("active");
            this.userSettings.highQualityImages = VAL;
            localStorage.setItem("settings-highquality-images", +VAL);
            this.minimap.changeLayer();
        });

        $(".fontSizeSelector input").on("change", (event) => {
            this.userSettings.fontSize = Math.max(1, Math.min($(event.target).val(), 5));
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

            $("#mapLayerMenu").find("button.btn-focus").on("click", () => {
                $("header").hide();
                $("#background").hide();
                $("#mapLayerMenu").hide();
                this.openToast("success", "focusMode", "enterToExit");
            });

            $(document).on("keydown", (event) => this.handleKeydown(event));


        } else {
            $(".btn-focus").hide();
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
            }
        });
      
        weaponInformation.addEventListener("close", function(){
            // Remove listeners when closing weapon information to avoid stacking
            $("input[type=radio][name=angleChoice]").off();
            $(".moveToBtn").off();
        });
        
        $("#canvasControls button").on("click", (event) => {
            if ($(event.currentTarget).hasClass("active")){ return;}
            $("#canvasControls > .active").first().removeClass("active");
            $(event.currentTarget).addClass("active");
            $(".sim.active").removeClass("active");
            $("#"+$(event.currentTarget).val()).addClass("active");
        });

        $("#settingsControls button").on("click", (event) => {
            if ($(event.currentTarget).hasClass("active")){ return;}
            $("#settingsControls > .active").first().removeClass("active");
            $(event.currentTarget).addClass("active");
            $(".panel.active").removeClass("active");
            $("#"+$(event.currentTarget).val()).addClass("active");
        });

        $("#settingsControls button[value='panel4']").on("click", () => this.initShortcutsPanel());

        this.show();
    }


    buildShareUrl() {
        const cur    = new URLSearchParams(window.location.search);
        const params = new URLSearchParams();
        if (cur.has("map"))   params.set("map", cur.get("map"));
        if (cur.has("layer")) params.set("layer", cur.get("layer"));

        const t1 = this.FACTION1_SELECTOR.val();
        const u1 = this.UNIT1_SELECTOR.val();
        const t2 = this.FACTION2_SELECTOR.val();
        const u2 = this.UNIT2_SELECTOR.val();
        if (t1) params.set("team1", t1);
        if (u1) params.set("team1unit", u1);
        if (t2) params.set("team2", t2);
        if (u2) params.set("team2unit", u2);

        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
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
        if ($("header").is(":hidden")) {
            $("header").show();
            $("#mapLayerMenu").show();
            $("#background").show();
            if (this.minimap.layer && this.userSettings.enableFactions) {
                $("#factionsButton").show();
            }
            this.closeToast();
        } else {
            $("header").hide();
            $("#background").hide();
            $("#mapLayerMenu").hide();
            $("#factionsButton").hide();
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
        const tbody = $("#panel4 .shortcuts tbody");
        tbody.empty();

        for (const { id, i18nKey } of SquadCalc.SHORTCUT_ACTIONS) {
            const sc = this.shortcuts[id];
            const isCustom = JSON.stringify(sc) !== JSON.stringify(SquadCalc.DEFAULT_SHORTCUTS[id]);
            const $row = $(`
                <tr class="shortcut-row${isCustom ? " is-custom" : ""}" data-action="${id}">
                    <td class="shortcut-key-cell">${this.formatShortcutHTML(sc)}</td>
                    <td class="arrow">→</td>
                    <td class="shortcut-desc" data-i18n="${i18nKey}"></td>
                    <td class="shortcut-edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/></svg>
                    </td>
                </tr>
            `);
            $row.on("click", () => this.openShortcutCapture(id));
            tbody.append($row);
        }

        $("#panel4 .shortcuts [data-i18n]").each(function() {
            this.textContent = i18next.t(this.dataset.i18n);
        });
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

        const { calc, weapon, help, factions, servers, changelog } = this._dialogs;
        if (weapon.open || calc.open || help.open || factions.open || servers.open || changelog.open) return;

        if ($(event.target).is("input, textarea, select")) return;

        if (this.matchesShortcut(event, "switchUI")) {
            event.preventDefault();
            this.switchUI();
            return;
        }

        if (this.matchesShortcut(event, "toggleMap")) {
            if (this.minimap.activeMap.singleLayer) return;
            const layers = ["topomap", "terrainmap", "basemap"];
            const currentLayer = $("#mapLayerMenu .layers.active").attr("value") || "basemap";
            const nextIndex = (layers.indexOf(currentLayer) + 1) % layers.length;
            const nextLayer = layers[nextIndex];
            $("#mapLayerMenu").find(".layers").removeClass("active");
            $(".btn-" + nextLayer).addClass("active");
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
        // Recreate the map layer behind the loader splash : layers created during
        // boot stay stuck in Firefox's slow synchronous-decode path, making zoom
        // very laggy until the layer is recreated. Timed so the logo stamp
        // animation (0.6s) is done and the fade-in (0.7s) ends before the
        // loader starts fading out at 1.8s.
        setTimeout(() => this.minimap.changeLayer(), 800);
        setTimeout(() => {
            const logo = document.getElementById("loaderLogo");
            logo.classList.remove("logo-stamp");
            logo.classList.add("logo-stamp-out");
            $("#loader").fadeOut(500);
        }, 1800);
    }

    /**
     * Calculate heights for a given LatLng Point
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    switchUI(){

        if (this.ui == 0) {
            this.loadMapUIMode();
            $(".returnBtn").hide();
            if (this.minimap.hasMarkers()) $(".btn-delete, .btn-undo").show();
            return;
        }

        $(".returnBtn").show();
        $("#map_ui").addClass("hidden");
        $("#classic_ui").removeClass("hidden");
        $("header").removeClass("ui");
        $("#mapLayerMenu").hide();
        $("#layerSelector").hide();
        $(".weaponSelector").addClass("active");
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

    loadMapUIMode(){
        $("#classic_ui").addClass("hidden");
        $("#map_ui").removeClass("hidden");
        $("header").addClass("ui");
        $("#mapLayerMenu").show();
        if (this.LAYER_SELECTOR.find("option").length > 1) $("#layerSelector").show();
        if (this.minimap.activeWeaponsMarkers.getLayers().length === 0) {
            $(".weaponSelector").removeClass("active animate__fadeIn");
        }
        this.ui = 1;
        localStorage.setItem("data-ui", 1);
        this.minimap.invalidateSize();
    }

    /**
     * save current weapon into browser cache
     */
    changeWeapon() {
        const WEAPON = this.WEAPON_SELECTOR.val();

        localStorage.setItem("data-weapon", WEAPON);
        this.activeWeapon = WEAPONS[WEAPON];
    
        if (this.activeWeapon.shells.length > 1) {
            $("#ammoSelector").show();
        } else {
            $("#ammoSelector").hide();
        }

        // Load SHELL_SELECTOR with weapon.shells
        this.SHELL_SELECTOR.empty();    
        this.activeWeapon.shells.forEach((shell, index) => {
            this.SHELL_SELECTOR.append(`
                <option data-i18n=weapons:${shell.name} value=${index}>
                    ${i18next.t("weapons:" + shell.name)}
                </option>`
            );
        });
        this.SHELL_SELECTOR.val(0).trigger("change");

        $("#mortarImg").attr("src", `/img/weapons/${this.activeWeapon.name}.webp`);
        
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
        $(".dropbtn2").val(weapon);
        this.changeWeapon();
    }

    /**
     * Calculates the distance elevation and bearing
     * @returns {target} elevation + bearing
     */
    shoot(inputChanged = "") {
        const MORTAR_LOC = $("#mortar-location");
        const TARGET_LOC = $("#target-location");
        const a = MORTAR_LOC.val();
        const b = TARGET_LOC.val();
        let aPos;
        let bPos;

        this.resetCalc();

        // store current cursor positions on input
        let startA = MORTAR_LOC[0].selectionStart;
        let startB = TARGET_LOC[0].selectionStart;

        // format keypads
        MORTAR_LOC.val(this.formatKeyPad(a));
        TARGET_LOC.val(this.formatKeyPad(b));

        // If keypads are imprecises, do nothing
        if (a.length < 3 || b.length < 3) {
            // disable tooltip and copy function
            $("#copy").removeClass("copy");
            $("#bearingNum").html("xxx");
            $("#elevationNum").html("xxxx");
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

        if (this.activeWeapon.name != "Mortar" && this.activeWeapon.name != "UB-32") $("#highlow").addClass("active");
        if (this.activeWeapon.getAngleType() === -1) $("#highlowicon").css({ transform: "rotate(0deg)"});
        else $("#highlowicon").css({transform: "rotate(180deg)"});

        // show actions button
        $("#savebutton").removeClass("hidden");
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

        if (issue === "mortar") $("#mortar-location").addClass("error2");
        else if (issue === "target") $("#target-location").addClass("error2");
        else $("#target-location, #mortar-location").addClass("error2");

        // Rework the #setting div to display a single message
        $("#bearing").addClass("hidden").removeClass("pure-u-10-24");
        $("#elevation").addClass("hidden").removeClass("pure-u-10-24");
        $("#errorMsg").removeClass("pure-u-4-24").addClass("pure-u-1").addClass("errorMsg");
        $("#errorMsg").html(msg);

        // remove the pointer cursor & tooltip
        $("#copy").removeClass("copy");
        $("#settings").css({ "border-color": "var(--main-color)" });
        animateCSS($("#settings"), "shakeX");
    }


    /**
     * Reset UI to default
     */
    resetCalc() {

        // First, reset any errors
        $("#settings").css({ "border-color": "#fff" });
        $("#target-location").removeClass("error2");
        $("#mortar-location").removeClass("error2");

        // prepare result divs
        $("#bearing").removeClass("hidden").addClass("pure-u-10-24");
        $("#elevation").removeClass("hidden").addClass("pure-u-10-24");
        $("#errorMsg").addClass("pure-u-4-24").removeClass("errorMsg").removeClass("pure-u-1").html("-");
        $("#savebutton").addClass("hidden");
        $("#highlow").removeClass("active");

        // draw pointer cursor on results
        $("#copy").addClass("copy");
    }

    /**
     * Copy Saved calcs to clipboard
     */
    copySave(COPY_ZONE) {
        let text2copy;

        if (COPY_ZONE.prev().val().length === 0) text2copy = COPY_ZONE.prev().attr("placeholder").trim() + COPY_ZONE.text().trim();
        else text2copy = COPY_ZONE.prev().val().trim() + COPY_ZONE.text().trim();

        navigator.clipboard.writeText(text2copy);
        animateCSS(COPY_ZONE.parent(), "headShake");
    }

    /**
     * Format keypad input, setting text to uppercase and adding dashes
     * @param {string} text - keypad string to be formatted
     * @returns {string} formatted string
     */
    formatKeyPad(text) {
        const TEXTPARTS = [];

        // If empty string, return
        if (text.length === 0) { return; }

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
        if ($(".saved_list p").length === 1) { $("#saved").addClass("hidden"); }
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
        const MORTAR_LOC = $("#mortar-location");
        const TARGET_LOC = $("#target-location");
        const MORTAR_LENGTH = MORTAR_LOC.val().length;
        const TARGET_LENGTH = TARGET_LOC.val().length;

        a = a.length;
        b = b.length;


        // if the keypads.lenght is <3, do nothing.
        // Otherwise we guess if the user is deleting or adding something
        // and ajust the cursor considering MSMC added/removed a '-'

        if (startA >= 3) startA += (a > MORTAR_LENGTH) ? -1 : 1;
        if (startB >= 3) startB += (b > TARGET_LENGTH) ? -1 : 1;
        
        if (inputChanged === "weapon") MORTAR_LOC[0].setSelectionRange(startA, startA);
        else if (inputChanged === "target") TARGET_LOC[0].setSelectionRange(startB, startB);
        else {
            MORTAR_LOC[0].setSelectionRange(startA, startA);
            TARGET_LOC[0].setSelectionRange(startB, startB);
        }
    }


    /**
     * Resize Saved Names according to their content
     * using a hidden <span> as a ruler
     * @param {input} i - input to resize
     */
    resizeInput(i) {
        const content = i.value.length === 0 ? i.placeholder : i.value;
        $("#ruler").text(content); // Use text() to escape content safely
        i.style.width = `${$("#ruler").width() * 1.05}px`;
    }

    /**
     * Resize every saved name
     */
    resizeInputsOnResize() {
        $(".saved_list :input").each((_, element) => { this.resizeInput($(element)[0]); });
    }


    /**
     * Save current calc to save list
     */
    saveCalc() {

        if ($(".saved_list p").length === 4) $(".saved_list p").first().remove();
        
        $(".saved_list").append(
            `<p class=savedrow>
                <input maxlength=20 spellcheck=false placeholder="${$("#target-location").val()}" class=friendlyname></input>
                <span class=savespan> 
                    ➜ ${$("#bearingNum").text()} - ${$("#elevationNum").text()}
                </span>
                <span class="del">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM160 128l41.4 0 11.3-11.3c3-3 7.1-4.7 11.3-4.7l64 0c4.2 0 8.3 1.7 11.3 4.7L310.6 128l41.4 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l192 0L338.4 354.7c-1.4 16.6-15.2 29.3-31.9 29.3l-101.1 0c-16.6 0-30.5-12.8-31.9-29.3L160 192z"/></svg>
                </span>
            </p>`
        );

        // resize the inserted input according the the placeholder length 
        $(".saved_list p").find("input").last().width(`${$("#target-location").val().length * 1.2}ch`);

        // display it
        $("#saved").removeClass("hidden");
        animateCSS($(".saved_list p").last(), "fadeInDown");
        tooltip_save.disable();
    }

    /**
     * Copy current calc to clipboard
     * @param {event} event - click event that triggered copy
     */
    copyCalc(event) {
        
        // If calcs aren't ready, do nothing
        if (!$(".copy").hasClass("copy")) return 1;

        if (event.target.id === "highlowicon" || event.target.id === "highlow") {
            if ($("#highlow").hasClass("active")) this.changeHighLow();
            return 1;
        }

        animateCSS($(".copy"), "headShake");
        navigator.clipboard.writeText(`${$("#target-location").val()} ➜ ${$("#bearingNum").text()} - ${$("#elevationNum").text()}`);
        this.openToast("success", "copied", "");

    }

    /**
     * Toggle high/low angles
     */
    changeHighLow(){
        const transformValue = $("#highlowicon").css("transform");
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
        const activeWeapon = this.WEAPON_SELECTOR.val();
        const activeMap = this.MAP_SELECTOR.val();
        const activeLayer = this.LAYER_SELECTOR.val();
        const team1 = [this.FACTION1_SELECTOR.val(), this.UNIT1_SELECTOR.val()];
        const team2 = [this.FACTION2_SELECTOR.val(), this.UNIT2_SELECTOR.val()];
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

                $(".dropbtn").val(data.activeMap).trigger($.Event("change", { broadcast: true }));

                data.markers.forEach(marker => { this.minimap.createMarker(new LatLng(marker.lat, marker.lng), marker.team, marker.category, marker.icon, marker.uid); });
                data.arrows.forEach(arrow => { new MapArrow(this.minimap, arrow.color, arrow.latlngs[0], arrow.latlngs[1], arrow.uid); });
                data.circles.forEach(circle => { new MapCircle(this.minimap, circle.color, circle.latlng, circle.radius, circle.uid); });
                data.rectangles.forEach(rectangle => { new MapRectangle(this.minimap, rectangle.color, rectangle.bounds._southWest, rectangle.bounds._northEast, rectangle.uid); });
                data.draws.forEach(draw => { new MapDrawing(this.minimap, draw.color, draw.latlngs, draw.uid).finalize(false); });

                $(document).one("heightmap:loaded", () => {
                    if (Array.isArray(data.weapons) && data.weapons.length > 0) {
                        data.weapons.forEach(weapon => { this.minimap.createWeapon(new LatLng(weapon.lat, weapon.lng)); });
                        data.targets.forEach(target => { this.minimap.createTarget(new LatLng(target.lat, target.lng), false); });
                    }
                    this.openToast("success", "importSuccess", "");
                });

                $(document).one("layers:loaded", () => {
                    this.LAYER_SELECTOR.val(data.activeLayer).trigger($.Event("change", { broadcast: true }));
                    $(document).one("layer:loaded", () => {
                        data.selectedFlags.forEach(flag => {
                            this.minimap.layer.flags.forEach((layerFlag) => {
                                if (layerFlag.objectName != flag) return;
                                if (layerFlag.isSelected) return;
                                this.minimap.layer._handleFlagClick(layerFlag);
                            });
                        });
                        this.FACTION1_SELECTOR.val(data.teams[0][0]).trigger($.Event("change", { broadcast: false }));
                        this.FACTION2_SELECTOR.val(data.teams[1][0]).trigger($.Event("change", { broadcast: false }));
                        this.UNIT1_SELECTOR.val(data.teams[0][1]).trigger($.Event("change", { broadcast: false }));
                        this.UNIT2_SELECTOR.val(data.teams[1][1]).trigger($.Event("change", { broadcast: false }));
                    });
                });
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
        ["map", "layer", "type", "session", "server"].forEach((param) => {
            if (urlParams.has(param)) {
                sortedParams.set(param, urlParams.get(param));
                urlParams.delete(param);
            }
        });

        // Add any remaining parameters
        for (const [key, value] of urlParams.entries()) sortedParams.set(key, value);

        // Construct the new URL
        const newUrl = `${window.location.pathname}?${sortedParams.toString()}`;
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