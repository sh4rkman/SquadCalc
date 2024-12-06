import { MAPS } from "./data/maps.js";
import { WEAPONS, WEAPONSTYPE } from "./data/weapons.js";
import { squadMinimap } from "./squadMinimap.js";
import { Weapon } from "./squadWeapons.js";
import { createLine, drawLine } from "./animations.js";
import { loadSettings } from "./settings.js";
import { loadLanguage } from "./localization.js";
import { animateCSS, animateCalc } from "./animations.js";
import { tooltip_save, tooltip_copied } from "./tooltips.js";
import { checkApiHealth, fetchLayersByMap, fetchLayerByName } from "./squadCalcAPI.js";
import { initWebSocket } from "./smcConnector.js";
import SquadFiringSolution from "./squadFiringSolution.js";
import packageInfo from "../../package.json";
import i18next from "i18next";
import { SquadLayer } from "./squadLayer.js";

export default class SquadCalc {

    /**
     * @param {Array} [options]
     */
    constructor(options) {
        this.supportedLanguages = options.supportedLanguages;
        this.MAPSIZE = options.mapSize;
        this.gravity = options.gravity;
        this.debug = options.debug;
        this.userSettings = [];
        this.activeWeapon = "";
        this.hasMouse = matchMedia("(pointer:fine)").matches;
        this.MAP_SELECTOR = $(".dropbtn");
        this.WEAPON_SELECTOR = $(".dropbtn2");
        this.SHELL_SELECTOR = $(".dropbtn3");
        this.LAYER_SELECTOR = $(".dropbtn5");
    }

    init(){
        loadLanguage(this.supportedLanguages);
        loadSettings();
        createLine();
        this.loadMapSelector();
        this.loadMinimap();
        this.loadWeapons();
        this.loadUI();
        this.loadTheme();
        checkApiHealth();
        initWebSocket();
        console.log(`SquadCalc v${packageInfo.version} Loaded!`);
    }

    /**
     * Load the maps to the menu
     */
    loadMapSelector() {

        // Initiate Maps&Layers Dropdown
        this.MAP_SELECTOR.select2();
        this.LAYER_SELECTOR.select2();
        
        // Load maps 
        MAPS.forEach((map, i) => {
            this.MAP_SELECTOR.append(`<option data-i18n=maps:${map.name} value=${i}></option>`);
        });        

        // Add event listener
        this.MAP_SELECTOR.on("change", (event) => {
            const currentUrl = new URL(window.location);

            // Update the minimap with the selected map
            this.minimap.activeMap = MAPS.find((_, index) => index == event.target.value);
            this.minimap.clear(); 
            this.minimap.draw();

            // Update the URL
            currentUrl.searchParams.set("map", this.minimap.activeMap.name);
            currentUrl.searchParams.delete("layer");
            window.history.replaceState({}, "", currentUrl);

            // Refresh layer selector if API is available
            if (process.env.API_URL) { this.loadLayers(); }
                
        });

        let abortController = null;

        this.LAYER_SELECTOR.on("change", (event) => {
            const currentUrl = new URL(window.location);
            const selectedLayerText = this.LAYER_SELECTOR.find(":selected").text().replaceAll(" ", "");

            // User cleared the layer selector, remove the layer and clean the URL
            if (selectedLayerText === "") {
                currentUrl.searchParams.delete("layer");
                window.history.replaceState({}, "", currentUrl);
                if (abortController) { abortController.abort(); } // Abort the ongoing fetch request
                if (this.minimap.layer) this.minimap.layer.clear();
                return;
            } 
            
            // Update the the URL with the layer
            currentUrl.searchParams.set("layer", selectedLayerText);
            window.history.replaceState({}, "", currentUrl);

            // Initialize a new AbortController for the fetch request
            abortController = new AbortController();
            const signal = abortController.signal;
            this.minimap.spin(true, this.minimap.spinOptions);
            fetchLayerByName(event.target.value, { signal }).then(layerData => {
                if (this.minimap.layer) this.minimap.layer.clear();
                this.minimap.layer = new SquadLayer(this.minimap, layerData);
                this.minimap.spin(false);
            }).catch(error => {        
                if (error.name !== "AbortError") {
                    this.openToast("error", "error", "apiError");
                    console.debug("Error fetching layer data:", error);
                }   
                this.minimap.spin(false);
            });
        });

    }


    /**
     * Retrieve list of available layers name from squadcalc api
     */
    loadLayers() {
        const currentUrl = new URL(window.location);
        $("#layerSelector").hide();
        this.LAYER_SELECTOR.empty();

        this.minimap.spin(true, this.minimap.spinOptions);

        fetchLayersByMap(this.minimap.activeMap.name).then(layers => {

            if (layers.length === 0) { 
                this.minimap.spin(false);
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.delete("layer");
                window.history.replaceState({}, "", currentUrl);
                return;
            }

            // Empty option for placeholder
            this.LAYER_SELECTOR.append("<option value=></option>");

            layers.forEach((layer) => {
                this.LAYER_SELECTOR.append(`<option value=${layer.rawName}>${layer.shortName}</option>`);
            });
            

            // If URL has a "layer" parameter
            if (currentUrl.searchParams.has("layer")) {
                const urlLayerName = currentUrl.searchParams.get("layer").toLowerCase().replaceAll(" ", "");
            
                // Normalize option text by removing any extra spaces around the "V"
                const matchingOption = this.LAYER_SELECTOR.find("option").filter(function() {
                    const optionText = $(this).text().toLowerCase().replaceAll(" ", "");
                    return optionText === urlLayerName;
                });
            
                // If we find a matching option, set it as selected
                if (matchingOption.length > 0) {
                    matchingOption.prop("selected", true);
                    this.LAYER_SELECTOR.trigger("change");
                } 
                else {
                    // layer in url doesn't make sense, clean the url
                    const currentUrl = new URL(window.location);
                    currentUrl.searchParams.delete("layer");
                    window.history.replaceState({}, "", currentUrl);
                }
            }

            this.minimap.spin(false);
            $("#layerSelector").show();

        }).catch(error => {
            this.LAYER_SELECTOR.hide();
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
        var mapIndex;

        // try to retrieve map from URL
        if (currentUrl.searchParams.has("map")) {
            const urlMapName = currentUrl.searchParams.get("map").toLowerCase();
            mapIndex = MAPS.findIndex(map => map.name.toLowerCase() === urlMapName);
            if (mapIndex === -1) { 
                // user entered garbage, pick a random map & clean the url
                mapIndex = Math.floor(Math.random() * MAPS.length); 
                currentUrl.searchParams.delete("layer");
            }
        } 
        else {
            mapIndex = Math.floor(Math.random() * MAPS.length);
        }
    
        this.MAP_SELECTOR.val(mapIndex);
        this.minimap = new squadMinimap("map", this.MAPSIZE, MAPS[mapIndex]);
        this.minimap.draw();

        // Update the URL
        currentUrl.searchParams.set("map", this.minimap.activeMap.name);
        window.history.replaceState({}, "", currentUrl);

        // If no API if provided, hide the layer selector
        if (process.env.API_URL) { 
            this.loadLayers(); 
        } else {
            this.LAYER_SELECTOR.hide();
            $(".btn-helpmap").hide();
        }

    }

    /**
     * Load weapons into html
     */
    loadWeapons() {
        const WEAPONSLENGTH = WEAPONS.length;

        WEAPONS.forEach((weapon, index, arr) => {
            arr[index] = new Weapon(
                weapon.name,
                weapon.velocity,
                weapon.deceleration,
                weapon.decelerationTime,
                weapon.gravityScale,
                weapon.minElevation,
                weapon.unit,
                weapon.logo,
                weapon.marker,
                weapon.logoCannonPos,
                weapon.type,
                weapon.angleType,
                weapon.elevationPrecision,
                weapon.minDistance,
                weapon.moa,
                weapon.explosionDamage,
                weapon.explosionRadius[0],
                weapon.explosionRadius[1],
                weapon.explosionDistanceFromImpact,
                weapon.damageFallOff,
                weapon.shells
            );
        });
        
        // Initiate Weapons & Shells Dropdown
        this.WEAPON_SELECTOR.select2({
            dropdownCssClass: "dropbtn2",
            dropdownParent: $("#weaponSelector"),
            minimumResultsForSearch: -1, // Disable search
            //placeholder: "SELECT A WEAPON"
        });

        this.SHELL_SELECTOR.select2({
            dropdownCssClass: "dropbtn3",
            dropdownParent: $("#ammoSelector"),
            minimumResultsForSearch: -1, // Disable search
            //placeholder: "SELECT A WEAPON"
        });

        // Load Weapons
        for (let i = 0; i < WEAPONSTYPE.length; i += 1) {
            this.WEAPON_SELECTOR.append(`<optgroup data-i18n-label=weapons:${WEAPONSTYPE[i]}>`);
            for (let y = 0; y < WEAPONSLENGTH; y += 1) {
                if (WEAPONS[y].type === WEAPONSTYPE[i]) {
                    this.WEAPON_SELECTOR.append(`<option data-i18n=weapons:${WEAPONS[y].name} value=${y}></option>`);
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

            this.WEAPON_SELECTOR.append(`<optgroup data-i18n-label=weapons:experimental label="${i18next.t("weapons:experimental")}">`);
            for (let y = 0; y < WEAPONSLENGTH; y += 1) {
                if (WEAPONS[y].type === "experimental") {
                    this.WEAPON_SELECTOR.append(`<option data-i18n=weapons:${WEAPONS[y].name} value=${y}>${i18next.t("weapons:" + WEAPONS[y].name)}</option>`);
                }
            }
            this.WEAPON_SELECTOR.append("</optgroup>");

        } else {

            let selectedValue = this.WEAPON_SELECTOR.val();
            
            // Remove the experimental optgroup
            this.WEAPON_SELECTOR.find("optgroup[data-i18n-label='weapons:experimental']").remove();
            
            // Remove experimental options and check if the selected value is experimental
            this.WEAPON_SELECTOR.find("option").filter(
                function() {
                    return WEAPONS[$(this).val()].type === "experimental";
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

    loadUI(){
        const calcInformation = document.querySelector("#calcInformation");
        const weaponInformation = document.querySelector("#weaponInformation");
        const helpDialog = document.querySelector("#helpDialog");

        $(".btn-delete").hide();
        $("#mapLayerMenu").hide();
        this.ui = localStorage.getItem("data-ui");

        if (this.ui === null || isNaN(this.ui) || this.ui === ""){
            this.ui = 1; 
            localStorage.setItem("data-ui", 1);  
        }

        if (this.ui == 1){
            this.loadMapUIMode();
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
        this.closeDialogOnClickOutside(helpDialog);
        $(".btn-delete").on("click", () => { this.minimap.deleteTargets();});
        $("#fabCheckbox2").on("change", () => { this.switchUI();});


        $("#mapLayerMenu").find("button.layers").on("click", (e) => {
            const currentUrl = new URL(window.location);
            var val = $(e.currentTarget).attr("value");

            if (val === "helpmap") {
                $(".btn-"+val).toggleClass("active");
                this.minimap.toggleHeatmap();
                return;
            }

            $("#mapLayerMenu").find(".layers").removeClass("active");
            $(".btn-"+val).addClass("active");

            if (val === "basemap") {
                currentUrl.searchParams.delete("type");
            } else {
                currentUrl.searchParams.set("type", val);
            }
            window.history.replaceState({}, "", currentUrl);

            localStorage.setItem("settings-map-mode", val);
            this.userSettings.layerMode = val;
            this.minimap.changeLayer();
        });

        $("#mapLayerMenu").find("button.btn-helpmap").on("click", () => {
            $(".btn-helpmap").toggleClass("active");
            this.minimap.toggleHeatmap();
        });


        // Hack for Chrome to avoid lag when zooming inside the map
        // Force a decode each time focus a acquired again
        $(document).on("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.minimap.decode();
            }
        });

        if (this.hasMouse) {

            $("#mapLayerMenu").find("button.btn-focus").on("click", () => {
                $("header").hide();
                $("footer").hide();
                $("#background").hide();
                $("#mapLayerMenu").hide();
                this.openToast("success", "focusMode", "enterToExit");
            });
    
            $(document).on("keydown", (e) => {

                // Disable Shortkeys in legacy mode
                if (this.ui == 0) { return; }

                // ENTER = FOCUS MODE
                if (e.key === "Enter") {

                    // A dialog is open, user probably just wants to close it
                    if (weaponInformation.open || calcInformation.open || helpDialog.open) { return; }
                    
                    if ($("header").is(":hidden")) { // Quit focus mode
                        $("header").show();
                        $("footer").show();
                        $("#mapLayerMenu").show();
                        $("#background").show();
                        closeToast();
                    } else {
                        $("header").hide();
                        $("footer").hide();
                        $("#background").hide();
                        $("#mapLayerMenu").hide();

                        this.openToast("success", "focusMode", "enterToExit");
                    }
                }

            });

            
            let countdown;
            
            const closeToast = () => {
                document.querySelector("#toast").style.animation = "close 0.3s cubic-bezier(.87,-1,.57,.97) forwards";
                document.querySelector("#timer").classList.remove("timer-animation");
                clearTimeout(countdown);
            };
            
            this.openToast = (type, title, text) => {
                const toast = document.querySelector("#toast");
                clearTimeout(countdown);
                toast.classList = [type];
                toast.style.animation = "open 0.3s cubic-bezier(.47,.02,.44,2) forwards";
                document.querySelector("#timer").classList.add("timer-animation");
                toast.querySelector("h4").setAttribute("data-i18n", `tooltips:${title}`);
                toast.querySelector("h4").innerHTML = i18next.t(`tooltips:${title}`);
                toast.querySelector("p").setAttribute("data-i18n", `tooltips:${text}`);
                toast.querySelector("p").innerHTML = i18next.t(`tooltips:${text}`);
                countdown = setTimeout(() => { closeToast(); }, 5000);
            };

            document.querySelector("#toast").addEventListener("click", closeToast);

        } else {
            $(".btn-focus").hide();
        }

      
        weaponInformation.addEventListener("close", function(){
            // Remove listeners when closing weapon information to avoid stacking
            $("input[type=radio][name=angleChoice]").off();
            $(".heightPadding input").off();
        });
        
        $("#canvasControls button").on("click", (e) => {
            if ($(e.currentTarget).hasClass("active")){ return;}
            $("#canvasControls > .active").first().removeClass("active");
            $(e.currentTarget).addClass("active");
            $(".sim.active").removeClass("active");
            $("#"+$(e.currentTarget).val()).addClass("active");
        });

        $("#settingsControls button").on("click", (e) => {
            if ($(e.currentTarget).hasClass("active")){ return;}
            $("#settingsControls > .active").first().removeClass("active");
            $(e.currentTarget).addClass("active");
            $(".panel.active").removeClass("active");
            $("#"+$(e.currentTarget).val()).addClass("active");
        });


        this.show();
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

        if (this.ui == 0){
            this.loadMapUIMode();
            if (this.minimap.activeTargetsMarkers.getLayers().length > 0) {
                $(".btn-delete").show();
                $("#mapLayerMenu").show();
            }
            return;
        }

        $("#map_ui").addClass("hidden");
        $("#classic_ui").removeClass("hidden");
        $(".weaponSelector").removeClass("ui");
        $(".mapSelector").removeClass("ui");
        $("#switchUIbutton").removeClass("fa-xmarks-lines").addClass("fa-map");
        $(".btn-delete").hide();
        $("#mapLayerMenu").hide();
        this.ui = 0;
        localStorage.setItem("data-ui", 0);

    }

    closeDialogOnClickOutside(dialog) {
        dialog.addEventListener("click", function(event) {
            var rect = dialog.getBoundingClientRect();
            var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
                              rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
            if (!isInDialog) {
                dialog.close();
            }
        });
    }

    loadMapUIMode(){
        $("#classic_ui").addClass("hidden");
        $("#map_ui").removeClass("hidden");
        $(".weaponSelector").addClass("ui");
        $(".mapSelector").addClass("ui");
        $("#switchUIbutton").removeClass("fa-map").addClass("fa-xmarks-lines");
        $("#mapLayerMenu").show();
        this.ui = 1;
        this.line.hide("none");
        localStorage.setItem("data-ui", 1);
        this.minimap.invalidateSize();
    }

    /**
     * save current weapon into browser cache
     */
    changeWeapon() {
        const WEAPON = this.WEAPON_SELECTOR.val();
    
        this.line.hide("none");
        localStorage.setItem("data-weapon", WEAPON);
        this.activeWeapon = WEAPONS[WEAPON];
    
        if (WEAPON == 6) {
            $("#ammoSelector").show();
            this.activeWeapon.changeShell();
        } else {
            $("#ammoSelector").hide();
        }
    
        $("#mortarImg").attr("src", this.activeWeapon.logo);
        this.shoot();
    
        if (this.ui === 0) { drawLine(); }
    
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
        var weapon = localStorage.getItem("data-weapon");
        if (weapon === null || isNaN(weapon) || weapon === "") { weapon = 0; }
        $(".dropbtn2").val(weapon);
        this.changeWeapon();
    }

    /**
     * Calculates the distance elevation and bearing
     * @returns {target} elevation + bearing
     */
    shoot(inputChanged = "") {
        var startA;
        var startB;
        var elevation;
        var firingSolution;
        const MORTAR_LOC = $("#mortar-location");
        const TARGET_LOC = $("#target-location");
        var a = MORTAR_LOC.val();
        var b = TARGET_LOC.val();
        var aPos;
        var bPos;

        this.resetCalc();

        // store current cursor positions on input
        startA = MORTAR_LOC[0].selectionStart;
        startB = TARGET_LOC[0].selectionStart;

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

        firingSolution = new SquadFiringSolution(aPos, bPos, this.minimap, 0);

        if (this.activeWeapon.getAngleType() === -1) {
            elevation = firingSolution.elevation.high;
        } else {
            elevation = firingSolution.elevation.low;
        }

        if (this.activeWeapon.unit === "mil") {
            elevation = elevation.mil;
        } else {
            elevation = elevation.deg;
        }

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

        animateCalc($("#bearingNum").html(), bearing.toFixed(1), 500, "bearingNum");
        animateCalc($("#elevationNum").html(), elevation.toFixed(this.activeWeapon.elevationPrecision), 500, "elevationNum");

        $("elevation").html($("<i class=\"fas fa-drafting-compass fa-rotate-180 resultIcons\"></i>"));

        if (this.activeWeapon.getAngleType() === -1) {
            $("#highlow").html($("<i class=\"fa-solid fa-sort-amount-up resultIcons\"></i>"));
        }
        else {
            $("#highlow").html($("<i class=\"fa-solid fa-sort-amount-down resultIcons\"></i>"));
        }

        if (this.activeWeapon.name != "Mortar" && this.activeWeapon.name != "UB-32") {
            $("#highlow i").addClass("active");
        }

        // show actions button
        $("#savebutton").removeClass("hidden");
    }



    /**
     * Filter invalid key pressed by the user
     * @param {string} e - keypress event
     * @returns {event} - empty event if we don't want the user input
     */
    filterInput(e) {
        var chrTyped;
        var chrCode = 0;
        var evt = e ? e : event;

        if (evt.charCode !== null) {
            chrCode = evt.charCode;
        } else if (evt.which !== null) {
            chrCode = evt.which;
        } else if (evt.keyCode !== null) {
            chrCode = evt.keyCode;
        }

        if (chrCode === 0) {
            chrTyped = "SPECIAL KEY";
        } else {
            chrTyped = String.fromCharCode(chrCode);
        }

        //Letters, Digits, special keys & backspace [\b] work as usual:
        if (chrTyped.match(/\d|[\b]|SPECIAL|[A-Za-z]/)) { return true; }
        if (evt.altKey || evt.ctrlKey || chrCode < 28) { return true; }

        //Any other input Prevent the default response:
        if (evt.preventDefault) { evt.preventDefault(); }
        evt.returnValue = false;
        return false;
    }

    /**
     * Display error in html & console
     * @param {string} msg - error message code to be displayed
     * @param {string} issue - mortar/target/both
     */
    showError(msg, issue) {

        if (issue === "mortar") {
            $("#mortar-location").addClass("error2");
        } else if (issue === "target") {
            $("#target-location").addClass("error2");
        } else {
            $("#target-location, #mortar-location").addClass("error2");
        }

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
        $("#highlow i").removeClass("active");

        // draw pointer cursor on results
        $("#copy").addClass("copy");
    }

    /**
     * Copy Saved calcs to clipboard
     */
    copySave(COPY_ZONE) {
        var text2copy;

        if (COPY_ZONE.prev().val().length === 0) {
            text2copy = COPY_ZONE.prev().attr("placeholder") + COPY_ZONE.text();
        } else {
            text2copy = COPY_ZONE.prev().val() + COPY_ZONE.text();
        }

        this.copy(text2copy);
        animateCSS(COPY_ZONE.parent(), "headShake");
    }


    /**
     * Copy string to clipboard
     * execCommand is deprecated but navigator.clipboard doesn't work in steam browser :(
     */
    copy(string) {
        const el = document.createElement("textarea");
        el.value = string;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
    }

    /**
     * Format keypad input, setting text to uppercase and adding dashes
     * @param {string} text - keypad string to be formatted
     * @returns {string} formatted string
     */
    formatKeyPad(text) {
        var i = 3;
        const TEXTPARTS = [];

        // If empty string, return
        if (text.length === 0) { return; }

        const TEXTND = text.toUpperCase().split("-").join("");
        TEXTPARTS.push(TEXTND.slice(0, 3));

        // iteration through sub-keypads
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

        if (startA >= 3) {
            if (a > MORTAR_LENGTH) {
                startA -= 1;
            } else {
                startA += 1;
            }
        }

        if (startB >= 3) {
            if (b > TARGET_LENGTH) {
                startB -= 1;
            } else {
                startB += 1;
            }
        }
        
        if (inputChanged === "weapon") {
            MORTAR_LOC[0].setSelectionRange(startA, startA);
        }
        else if (inputChanged === "target"){
            TARGET_LOC[0].setSelectionRange(startB, startB);
        }
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
        if (i.value.length === 0) {
            $("#ruler").html(i.placeholder);
        } else {
            $("#ruler").html(i.value);
        }
        i.style.width = `${$("#ruler").width() * 1.05}px`;
    }

    /**
     * Resize every saved name
     */
    resizeInputsOnResize() {
        const mobileWidth = 767;

        $(".saved_list :input").each((index, element) => {
            this.resizeInput($(element)[0]);
        });

        if ($(window).width() <= mobileWidth) {
            this.line.hide("none");
        }
    }


    /**
     * Save current calc to save list
     */
    saveCalc() {
        if ($(".saved_list p").length === 4) {
            $(".saved_list p").first().remove();
        }
        $(".saved_list").append(
            `<p class=savedrow>
                <input maxlength=20 spellcheck=false placeholder=${encodeURI($("#target-location").val())} class=friendlyname></input>
                <span class=savespan> 
                    ➜ ${$("#bearing").text()} - ${$("#elevation").text()}
                </span>
                <i class="fa fa-times-circle fa-fw del" aria-hidden=true></i>
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
     * @param {event} e - click event that triggered copy
     */
    copyCalc(e) {
        
        // If calcs aren't ready, do nothing
        if (!$(".copy").hasClass("copy")) { return 1; }

        if ($(e.target).hasClass("fa-sort-amount-down") || $(e.target).hasClass("fa-sort-amount-up") ) {
            if ($(e.target).hasClass("active")) {
                this.changeHighLow();
            }
            return 1;
        }

        animateCSS($(".copy"), "headShake");

        this.copy(`${$("#target-location").val()} ➜ ${$("#bearing").text()} - ${$("#elevation").text()}`);

        // the user understood he can click2copy, remove the tooltip
        localStorage.setItem("InfoToolTips_copy", true);
        tooltip_copied.enable();
        tooltip_copied.show();
    }

    /**
     * Toggle high/low angles
     */
    changeHighLow(){
        const isLowAngle = $("#highlow").find(".fa-sort-amount-up").length > 0;
        this.activeWeapon.angleType = isLowAngle ? "low" : "high";
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
        var interval;
        var lat = 0;
        var lng = 0;
        var i = 0;

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
                if (Number.isNaN(SUB)) {
                    console.log(`invalid keypad string: ${FORMATTED_KEYPAD}`);
                }
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
}