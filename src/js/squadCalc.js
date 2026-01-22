import { MAPS, initMapsProperties } from "../data/maps.js";
import { WEAPONS, WEAPONSTYPE } from "../data/weapons.js";
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
import i18next from "i18next";
import SquadLayer from "./squadLayer.js";
import { serverBrowserTooltips } from "./tooltips.js";
import { MapDrawing, MapArrow, MapCircle, MapRectangle } from "./squadShapes.js";



/**
 * Main class for SquadCalc
 * @classdesc Holds all the main functions
 */
export default class SquadCalc {

    /**
     * @param {Array} [options]
     */
    constructor(options) {
        this.supportedLanguages = options.supportedLanguages;
        this.MAPSIZE = options.mapSize;
        this.gravity = options.gravity;
        this.debug = options.debug;
        this.userSettings = new SquadSettings(this);
        this.activeWeapon = "";
        this.hasMouse = matchMedia("(pointer:fine)").matches;
        this.MAP_SELECTOR = $(".dropbtn");
        this.WEAPON_SELECTOR = $(".dropbtn2");
        this.SHELL_SELECTOR = $(".dropbtn3");
        this.LAYER_SELECTOR = $(".dropbtn5");
        this.FACTION1_SELECTOR = $(".dropbtn8");
        this.FACTION2_SELECTOR = $(".dropbtn10");
        this.UNIT1_SELECTOR = $(".dropbtn9");
        this.UNIT2_SELECTOR = $(".dropbtn11");
        this.session = false;
        this.version = packageInfo.version;
    }

    init() {
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

    /**
     * Load the maps to the menu
     */
    loadMapSelector() {

        // Initiate Maps&Layers Dropdown
        this.MAP_SELECTOR.select2();
        this.LAYER_SELECTOR.select2();
        this.FACTION1_SELECTOR.select2();
        $(".dropbtn8").select2();
        $(".dropbtn9").select2();
        $(".dropbtn10").select2();
        $(".dropbtn11").select2();
        
        // Load maps 
        MAPS.forEach((map, i) => {
            this.MAP_SELECTOR.append(`<option data-i18n="maps:${map.name}" value="${i}"></option>`);
        });        

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
                this.updateUrlParams({ map: this.minimap.activeMap.name, layer: null });
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
            const selectedLayerText = this.LAYER_SELECTOR.find(":selected").text().replaceAll(" ", "");
            const broadcast = event.broadcast ?? true;

            // User cleared the layer selector, remove the layer and clean the URL
            if (selectedLayerText === "") {
                this.updateUrlParams({ layer: null });
                if (abortController) { abortController.abort(); } // Abort the ongoing fetch request
                if (this.minimap.layer) this.minimap.layer.clear();
                $(".btn-layer").hide();
                $("#factionsTab").hide();

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
            this.updateUrlParams({ layer: selectedLayerText });

            // Initialize a new AbortController for the fetch request
            abortController = new AbortController();
            const signal = abortController.signal;
            this.minimap.spin(true, this.minimap.spinOptions);
            fetchLayerByName(event.target.value, { signal })
                .catch(error => {
                    if (error.name !== "AbortError") {
                        this.openToast("error", "error", "apiError");
                        console.error("Error fetching layer data:", error);
                    }
                    $("#factionsTab").hide();
                    this.minimap.spin(false);

                    // Stop the chain
                    throw error;
                })
                .then(layerData => {
                    if (!layerData) return; // prevent continuing on fetch failure

                    if (this.minimap.layer) this.minimap.layer.clear();
                    this.minimap.layer = new SquadLayer(this.minimap, layerData, broadcast);
                    $(".btn-layer").addClass("active").show();

                    if (broadcast && this.session.ws?.readyState === WebSocket.OPEN) {
                        this.session.ws.send(
                            JSON.stringify({
                                type: "UPDATE_LAYER",
                                layer: event.target.value,
                            })
                        );
                        console.debug(`Sent layer update for layer #${event.target.value}`);
                    }

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
        const currentUrl = new URL(window.location);
        $("#layerSelector").hide();
        this.LAYER_SELECTOR.empty();

        fetchLayersByMap(this.minimap.activeMap.name).then(layers => {

            if (layers.length === 0) { 
                this.minimap.spin(false);
                this.updateUrlParams({ layer: null });
                return;
            }

            // Re-empty just in case user changed map while the request was on the way
            this.LAYER_SELECTOR.empty();

            // Empty option for placeholder
            this.LAYER_SELECTOR.append("<option value=></option>");

            layers.forEach((layer) => { this.LAYER_SELECTOR.append(`<option value=${layer.rawName}>${layer.shortName}</option>`);});
            

            // If URL has a "layer" parameter and no active session yet
            // Using this.session instead of URL param allows layer to load on first call,
            // but prevents overwriting session state when SESSION_JOINED triggers a reload
            if (currentUrl.searchParams.has("layer") && !this.session) {
                const urlLayerName = currentUrl.searchParams.get("layer").toLowerCase().replaceAll(" ", "");
            
                // Normalize option text by removing any extra spaces around the "V"
                const matchingOption = this.LAYER_SELECTOR.find("option").filter(function() {
                    const optionText = $(this).text().toLowerCase().replaceAll(" ", "");
                    return optionText === urlLayerName;
                });
            
                // If we find a matching option, set it as selected
                if (matchingOption.length > 0) {
                    matchingOption.prop("selected", true);
                    this.LAYER_SELECTOR.trigger($.Event("change", { broadcast: false }));
                } 
                else {
                    // layer in url doesn't make sense, clean the url
                    this.updateUrlParams({ layer: null });
                }
            }

            this.minimap.spin(false);
            $("#layerSelector").show();

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
                this.updateUrlParams({ layer: null });
            }
        } 
        else { 
            // mapIndex = Math.floor(Math.random() * MAPS.length); // pick a random map
            mapIndex = 0; // New Basrah
        }
        
        this.MAP_SELECTOR.val(mapIndex);
        this.minimap = new squadMinimap("map", this.MAPSIZE, MAPS[mapIndex]);
        this.minimap.draw();

        // Update the URL & Layer
        this.updateUrlParams({ map: this.minimap.activeMap.name });
        this.loadLayers(); 

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
                weapon.projectileLifespan
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


        // Add Experimental weapons if wanted by user settings
        this.toggleExperimentalWeapons();

        // Add Events Listeners
        this.WEAPON_SELECTOR.on("change", () => { this.changeWeapon(); });
        this.SHELL_SELECTOR.on("change", () => { this.activeWeapon.changeShell(); });
        
        this.getWeapon();
    }

    /**
     * Add/Remove Experimental Weapons from Weapons dropdown list according to user settings
     */
    toggleExperimentalWeapons(){
        const WEAPONSLENGTH = WEAPONS.length;

        if (this.userSettings.experimentalWeapons) {

            this.WEAPON_SELECTOR.append(`<optgroup data-i18n-label=weapons:modded label="${i18next.t("weapons:modded")}">`);
            for (let y = 0; y < WEAPONSLENGTH; y += 1) {
                if (WEAPONS[y].type === "modded") {
                    this.WEAPON_SELECTOR.append(`<option data-i18n=weapons:${WEAPONS[y].name} value=${y}>${i18next.t("weapons:" + WEAPONS[y].name)}</option>`);
                }
            }
            this.WEAPON_SELECTOR.append("</optgroup>");

        } else {

            let selectedValue = this.WEAPON_SELECTOR.val();
            
            // Remove the experimental optgroup
            this.WEAPON_SELECTOR.find("optgroup[data-i18n-label='weapons:modded']").remove();
            
            // Remove experimental options and check if the selected value is experimental
            this.WEAPON_SELECTOR.find("option").filter(
                function() {
                    return WEAPONS[$(this).val()].type === "modded";
                }).each(function() {
                if ($(this).val() === selectedValue) {
                    selectedValue = null;
                }
                $(this).remove();
            });
            
            // If the selected value was an experimental option, reset to Mortars
            if (selectedValue === null) {
                this.WEAPON_SELECTOR.val(0).trigger("change");
            }
        }
    }


    closeMenu() {
        $("#footerButtons").removeClass("expanded");
        $(".fab4").html("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><path d=\"M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z\"/></svg>");
    }


    loadUI(){
        const calcInformation = document.querySelector("#calcInformation");
        const weaponInformation = document.querySelector("#weaponInformation");
        const helpDialog = document.querySelector("#helpDialog");
        const factionsDialog = document.querySelector("#factionsDialog");
        const serversInformation = document.querySelector("#serversInformation");

        $(".btn-delete, .btn-undo, .btn-layer, #mapLayerMenu").hide();

        this.ui = localStorage.getItem("data-ui");

        if (this.ui === null || isNaN(this.ui) || this.ui === ""){
            this.ui = 1; 
            localStorage.setItem("data-ui", 1);  
        }

        if (this.ui == 1) this.loadMapUIMode();

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
          
        window.addEventListener("drop", e => {
            e.preventDefault();
          
            if (this.ui == 0) return; // Don't handle drop in legacy mode

            const files = e.dataTransfer.files;
            const file = files?.[0];
            if (!file) return;
          
            const reader = new FileReader();
          
            reader.onload = (event) => {
                const content = event.target.result;
          
                // Try parsing as JSON
                try {
                    const data = JSON.parse(content);
                    console.debug("Parsed JSON:", data);

                    $(".dropbtn").val(data.activeMap).trigger($.Event("change", { broadcast: true }));

                    data.markers.forEach(marker => { this.minimap.createMarker(new LatLng(marker.lat, marker.lng), marker.team, marker.category, marker.icon, marker.uid); });
                    data.arrows.forEach(arrow => { new MapArrow(this.minimap, arrow.color, arrow.latlngs[0], arrow.latlngs[1], arrow.uid); });
                    data.circles.forEach(circle => { new MapCircle(this.minimap, circle.color, circle.latlng, circle.radius, circle.uid); });
                    data.rectangles.forEach(rectangle => { new MapRectangle(this.minimap, rectangle.color, rectangle.bounds._southWest, rectangle.bounds._northEast, rectangle.uid); });
                    data.draws.forEach(draw => { new MapDrawing(this.minimap, draw.color, draw.latlngs, draw.uid).finalize(false); });

                    // Wait for the heightmap to load before adding weapons/targets
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
                            // Select Flags
                            data.selectedFlags.forEach(flag => {
                                this.minimap.layer.flags.forEach((layerFlag) => {
                                    if (layerFlag.objectName != flag) return;
                                    if (layerFlag.isSelected) return;
                                    this.minimap.layer._handleFlagClick(layerFlag);
                                    return;
                                });
                            });
                            // Load Factions and Units
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
        $(".btn-undo").on("click", () => { if (this.minimap.history.length > 0) this.minimap.history.at(-1).delete(); });
        $(".btn-layer").on("click", () => { this.minimap.layer.toggleVisibility(); });
        $(".btn-drawingMode").on("click", () => { this.minimap.disableDrawingMode(); });
        $("#fabCheckbox2").on("change", () => { this.switchUI();});
        $("#factionsButton").on("click", () => { $("#factionsDialog")[0].showModal(); });
        
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


        // $("#btn-map-choices").on("hover", () => {
        //     $("button.layers").show();
        //     console.log("Map Layers Menu opened");
        // });

        // $("button.layers").hide();

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
                $("footer").hide();
                $("#background").hide();
                $("#mapLayerMenu").hide();
                this.openToast("success", "focusMode", "enterToExit");
            });

            $(document).on("keydown", (event) => {

                // Disable Shortkeys in legacy mode
                if (this.ui == 0) return;

                // Disable Shortkeys when currently in a dialog
                if (weaponInformation.open || calcInformation.open || helpDialog.open || factionsDialog.open || serversInformation.open) return;

                // ENTER = FOCUS MODE
                if (event.key === "Enter") {
                    if ($("header").is(":hidden")) { // Quit focus mode
                        $("header").show();
                        $("footer").show();
                        $("#mapLayerMenu").show();
                        $("#background").show();
                        if (this.minimap.layer && this.userSettings.enableFactions) {
                            $("#factionsButton").show();
                        }
                        closeToast();
                    } else {
                        $("header").hide();
                        $("footer").hide();
                        $("#background").hide();
                        $("#mapLayerMenu").hide();
                        $("#factionsButton").hide();
                        this.openToast("success", "focusMode", "enterToExit");
                    }
                }

                // DELETE = REMOVE ALL MARKERS
                if (event.key === "Delete") {
                    if (this.minimap.history.length > 0) {
                        this.minimap.history.forEach((item) => {
                            item.delete();
                        });
                    }
                }

                // BACKSPACE / CTRL+Z = REMOVE LAST CREATED TARGET MARKER
                if (event.key === "Backspace" ||(event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
                    event.preventDefault();
                    if (this.minimap.history.length > 0) this.minimap.history.at(-1).delete();
                }

                // CTRL + S = SAVE CURRENT MAP TO A FILE
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                    event.preventDefault();
                    if (this.minimap.hasMarkers()) this.saveMapStateToFile();
                }

                // ESCAPE = QUIT DRAWING MODE
                if (event.key === "Escape") { this.minimap.disableDrawingMode(); }

            });


        } else {
            $(".btn-focus").hide();
        }

        let countdown;

        const closeToast = () => {
            const toast = document.querySelector("#toast");
            if (!toast) return;
            toast.style.animation = "close 0.3s cubic-bezier(.87,-1,.57,.97) forwards";
            document.querySelector("#timer").classList.remove("timer-animation");
            clearTimeout(countdown);
        };
        
        this.openToast = (type, title, text) => {
            const toast = document.querySelector("#toast");
            clearTimeout(countdown);
        
            // Reset timer animation by forcing reflow
            const timer = document.querySelector("#timer");
            timer.classList.remove("timer-animation");
            void timer.offsetWidth; // Trigger reflow
            timer.classList.add("timer-animation");
        
            toast.classList = [type];
            toast.style.animation = "open 0.3s cubic-bezier(.47,.02,.44,2) forwards";
        
            toast.querySelector("h4").setAttribute("data-i18n", `tooltips:${title}`);
            toast.querySelector("h4").innerHTML = i18next.t(`tooltips:${title}`);
            toast.querySelector("p").setAttribute("data-i18n", `tooltips:${text}`);
            toast.querySelector("p").innerHTML = i18next.t(`tooltips:${text}`);
        
            // Start a new countdown
            countdown = setTimeout(() => {
                closeToast();
            }, 5000);
        };

        // Global click listener for toast
        document.querySelector("#toast").addEventListener("click", (event) => {
            const toast = document.querySelector("#toast");
            const title = toast.querySelector("h4").getAttribute("data-i18n");  // Get data-i18n attribute
            
            // close current toast
            closeToast();

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
            $(".heightPadding input").off();
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

        this.show();
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
        setTimeout(function() {
            $("#loaderLogo").fadeOut("slow", function() {
                $("#loader").fadeOut("fast");
            });
        }, 1300);
    }

    /**
     * Calculate heights for a given LatLng Point
     * @param {LatLng} [latlng] - LatLng Point
     * @returns {integer} - height in meters
     */
    switchUI(){
        
        const newSvg = $("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'><path d='M384 476.1L192 421.2l0-385.3L384 90.8l0 385.3zm32-1.2l0-386.5L543.1 37.5c15.8-6.3 32.9 5.3 32.9 22.3l0 334.8c0 9.8-6 18.6-15.1 22.3L416 474.8zM15.1 95.1L160 37.2l0 386.5L32.9 474.5C17.1 480.8 0 469.2 0 452.2L0 117.4c0-9.8 6-18.6 15.1-22.3z'/></svg>");
        $(".fab1").empty().append(newSvg);

        if (this.ui == 0) {
            this.loadMapUIMode();
            if (this.minimap.hasMarkers()) $(".btn-delete, .btn-undo").show();
            return;
        }

        $("#map_ui").addClass("hidden");
        $("#classic_ui").removeClass("hidden");
        $("header").removeClass("ui");
        //$(".btn-delete").hide();
        //$(".btn-undo").hide();
        $("#mapLayerMenu").hide();
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

        const LEGACYICONSVG = $("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 512'><path d='M32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l576 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 32zm0 384c-17.7 0-32 14.3-32 32s14.3 32 32 32l576 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 416zM7 167c-9.4 9.4-9.4 24.6 0 33.9l55 55L7 311c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55L41 167c-9.4-9.4-24.6-9.4-33.9 0zM265 167c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55zM455 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z'/></svg>");
        $(".fab1").empty().append(LEGACYICONSVG);

        $("#mapLayerMenu").show();
        this.ui = 1;
        //this.line.hide("none");
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
                lat += 300 * LETTERINDEX;
                lng += 300 * KEYPADNB;

            } else {
                // opposite of calculations in getKP()
                const SUB = Number(PARTS[i]);
                if (Number.isNaN(SUB)) console.debug(`invalid keypad string: ${FORMATTED_KEYPAD}`);
                const subX = (SUB - 1) % 3;
                const subY = 2 - (Math.ceil(SUB / 3) - 1);

                interval = 300 / 3 ** i;
                lat += interval * subX;
                lng += interval * subY;
            }
            i += 1;
        }

        // at the end, add half of last interval, so it points to the center of the deepest sub-keypad
        interval = 300 / 3 ** (i - 1);
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
        ["map", "layer", "type", "session"].forEach((param) => {
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
    
}