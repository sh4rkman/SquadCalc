import { App } from "../app.js";
import { tooltip_coordPreview } from "./tooltips.js";
import { animateCSS } from "./animations.js";
import SquadFactions from "./squadFactions.js";
import i18next from "i18next";

/* eslint no-unused-vars: "off" */

function loadLocalSetting(item, default_value = 1) {

    var setting = localStorage.getItem(item);

    if (setting === null || isNaN(setting) || setting === ""){
        localStorage.setItem(item, default_value);
        setting = default_value;
    }

    // convert a 0/1 string to false/true boolean
    return Boolean(Number(setting));
}


export function loadSettings(){
    
    App.userSettings.keypadUnderCursor = loadLocalSetting("settings-keypad-cursor", 0);
    if (App.hasMouse) {
        $("#keypadUnderCursorSetting").prop("checked", App.userSettings.keypadUnderCursor);
    }
    else {
        $("#keypadUnderCursorSetting").prop("disabled", true).prop("checked", false);
        $("#cursorChoiceSettings").prop("disabled", true).prop("checked", false);
        App.userSettings.keypadUnderCursor = false;
    }

    // Load the last selected map mode
    const currentUrl = new URL(window.location);
    const mapMode = currentUrl.searchParams.get("type");

    if ($(".btn-" + mapMode).length) {
        $(".btn-"+mapMode).addClass("active");
    } 
    else {
        // Default to the first button
        $(".btn-basemap").addClass("active");
        App.updateUrlParams({type: null});
    }


    let fontSize = localStorage.getItem("settings-font-size");
    if (fontSize === null || isNaN(fontSize) || fontSize === ""){
        localStorage.setItem("settings-font-size", 3);
        fontSize = 3;
    }
    App.userSettings.fontSize = fontSize;

    $(".dropbtn6").select2({
        dropdownCssClass: "dropbtn6",
        dropdownParent: $("#helpDialog"),
        minimumResultsForSearch: -1,
    });
    $(".dropbtn6").val(fontSize).trigger("change");


    let markerSize = localStorage.getItem("settings-marker-size");
    if (markerSize === null || isNaN(fontSize) || fontSize === ""){
        localStorage.setItem("settings-marker-size", 3);
        markerSize = 3;
    }
    App.userSettings.markerSize = markerSize;
    $(".dropbtn7").select2({
        dropdownCssClass: "dropbtn7",
        dropdownParent: $("#helpDialog"),
        minimumResultsForSearch: -1, // Disable search
    });
    $(".dropbtn7").val(markerSize).trigger("change");


    App.userSettings.enableFactions = loadLocalSetting("settings-enable-factions");
    $("#enableFactionsSettings").prop("checked", App.userSettings.enableFactions);

    if (!App.userSettings.enableFactions) {
        $("#hideLowRespawnSettings").prop("disabled", true);
        $("#disableSoundsSettings").prop("disabled", true);
        $("#defaultFactionsSettings").prop("disabled", true);
    }

    if (process.env.DISABLE_FACTIONS === "true") {
        $(".factionSettings").hide();
    }

    App.userSettings.showMapBorders = loadLocalSetting("settings-show-map-borders");
    $("#showMapBordersSettings").prop("checked", App.userSettings.showMapBorders);

    App.userSettings.defaultFactions = loadLocalSetting("settings-default-factions");
    $("#defaultFactionsSettings").prop("checked", App.userSettings.defaultFactions);

    App.userSettings.disableSounds = loadLocalSetting("settings-disable-sounds", 0);
    $("#disableSoundsSettings").prop("checked", App.userSettings.disableSounds);

    App.userSettings.hideLowRespawn = loadLocalSetting("settings-hide-lowrespawn", 1);
    $("#hideLowRespawnSettings").prop("checked", App.userSettings.hideLowRespawn);

    App.userSettings.showMainZones = loadLocalSetting("settings-show-mainzones");
    $("#showMainZonesSettings").prop("checked", App.userSettings.showMainZones);
    
    App.userSettings.showMainAssets = loadLocalSetting("settings-show-mainassets");
    $("#showMainAssetsSettings").prop("checked", App.userSettings.showMainAssets);

    App.userSettings.showFlagsDistance = loadLocalSetting("settings-show-flags-distance");
    $("#showFlagsDistanceSettings").prop("checked", App.userSettings.showFlagsDistance);

    // App.userSettings.copyNextFlags = loadLocalSetting("settings-copy-next-flags", 0);
    // $("#copyNextFlagsSettings").prop("checked", App.userSettings.copyNextFlags);

    App.userSettings.lowAndHigh = loadLocalSetting("settings-low-high", 0);
    $("#lowAndHighSetting").prop("checked", App.userSettings.lowAndHigh);
    
    App.userSettings.copyTarget = loadLocalSetting("settings-copy-target", 0);
    $("#targetCopySetting").prop("checked", App.userSettings.copyTarget);

    App.userSettings.circlesFlags = loadLocalSetting("settings-circles-flags");
    $("#circlesFlagsSettings").prop("checked", App.userSettings.circlesFlags);
    
    App.userSettings.revealLayerOnHover = loadLocalSetting("settings-reveal-onHover");
    $("#revealLayerOnHoverSettings").prop("checked", App.userSettings.revealLayerOnHover);

    App.userSettings.capZoneOnHover = loadLocalSetting("settings-capZone-onHover", 0);
    $("#capZoneOnHoverSettings").prop("checked", App.userSettings.capZoneOnHover);

    App.userSettings.weaponDrag = loadLocalSetting("settings-weapon-drag");
    $("#weaponDragSetting").prop("checked", App.userSettings.weaponDrag);

    App.userSettings.targetDrag = loadLocalSetting("settings-target-drag");
    $("#targetDragSetting").prop("checked", App.userSettings.targetDrag);

    App.userSettings.experimentalWeapons = loadLocalSetting("settings-experimental-weapons", 0);
    $("#experimentalSetting").prop("checked", App.userSettings.experimentalWeapons);

    App.userSettings.highQualityImages = loadLocalSetting("settings-highquality-images", 0);
    if (App.userSettings.highQualityImages) $(".btn-hd").addClass("active");

    App.userSettings.smoothMap = loadLocalSetting("settings-smooth-map", 0);
    $("#mapAnimationSettings").prop("checked", App.userSettings.smoothMap);

    App.userSettings.spreadRadius = loadLocalSetting("settings-spread-radius");
    $("#spreadRadiusSetting").prop("checked", App.userSettings.spreadRadius);

    App.userSettings.damageRadius = loadLocalSetting("settings-damage-radius");
    $("#damageRadiusSetting").prop("checked", App.userSettings.damageRadius);

    App.userSettings.targetGrid = loadLocalSetting("settings-target-grid", 0);
    $("#targetGridSetting").prop("checked", App.userSettings.targetGrid);

    App.userSettings.showHeight = loadLocalSetting("settings-show-height", 0);
    $("#heightSetting").prop("checked", App.userSettings.showHeight);

    App.userSettings.targetAnimation = loadLocalSetting("settings-target-animation");
    $("#targetAnimationSettings").prop("checked", App.userSettings.targetAnimation);
    if (App.userSettings.targetAnimation) {
        $("#markerPreview").attr("src", "/img/markers/targets/marker_target_enabled.webp");
        $("#markerPreview").css("margin-top", "0px");
    } 
    else {
        $("#markerPreview").attr("src", "/img/markers/targets/marker_target_mini.webp");
        $("#markerPreview").css("margin-top", "20px");
    }

    App.userSettings.grid = loadLocalSetting("settings-grid");
    $("#gridSetting").prop("checked", App.userSettings.grid);
    
    App.userSettings.realMaxRange = loadLocalSetting("settings-real-max-range", 0);
    $("#realMaxRangeSettings").prop("checked", App.userSettings.realMaxRange);

    App.userSettings.showBearing = loadLocalSetting("settings-show-bearing");
    $("#bearingSetting").prop("checked", App.userSettings.showBearing);

    App.userSettings.showDistance = loadLocalSetting("settings-show-distance", 0);
    $("#distanceSetting").prop("checked", App.userSettings.showDistance);

    App.userSettings.showTimeOfFlight = loadLocalSetting("settings-show-timeofflight", 0);
    $("#timeOfFlightSetting").prop("checked", App.userSettings.showTimeOfFlight);

    App.userSettings.cursor = loadLocalSetting("settings-cursor", 0);
    $("#cursorChoiceSettings").prop("checked", App.userSettings.cursor);

    if (App.userSettings.cursor) {
        $("#map").css("cursor", "default");
        $("#preview").css("cursor", "default");
    }
    else {
        $("#map").css("cursor", "crosshair");
        $("#preview").css("cursor", "crosshair");
    }

    // Load Preview
    $("#gridPreview").attr("src", "/img/preview/grid.png");
    $("#mapPreview").attr("src", "/img/preview/preview.webp");
    $("#maxRangePreview").attr("src", "/img/preview/maxrange.png");
    $("#spreadPreview").attr("src", "/img/preview/spread.png");
    $("#damagePreview").attr("src", "/img/preview/damage.png");
    $("#targetGridPreview").attr("src", "/img/preview/targetGrid.webp");

    // Load that image aswell because wtf not.
    $("#targetImg").attr("src", "/img/target.png");

    // Open Menu
    $(document).on("click", "#fabCheckbox4", function() {

        const footerButtons = document.getElementById("footerButtons");
        if (!footerButtons.classList.contains("expanded")) {
            footerButtons.classList.add("expanded");
            $(".fab4").html("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 640\"><path d=\"M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z\"/></svg>");
        } else {
            App.closeMenu();
        }

        // Close the menu
        document.addEventListener("click", e => {
            if (footerButtons.classList.contains("expanded") && !footerButtons.contains(e.target)) App.closeMenu();
        });
    });

    $(document).on("click", "#fabCheckbox", function() {
        updatePreview();
        $("#helpDialog")[0].showModal();
        App.closeMenu();
    });

}


export function updatePreview(){
    var subtextContent;

    if (App.userSettings.spreadRadius){
        $("#spreadPreview").show();
    } else {
        $("#spreadPreview").hide();
    }

    if (App.userSettings.damageRadius){
        $("#damagePreview").show();
    } else {
        $("#damagePreview").hide();
    }

    subtextContent = "<span>1345</span><br>";

    if (App.userSettings.showBearing){ 
        subtextContent += `<span class=bearingPreview>241.5<span data-i18n="common:°">${i18next.t("common:°")}</span></span><br>`;
    } 
    if (App.userSettings.showTimeOfFlight){
        subtextContent += `<span class=bearingPreview>20.1<span data-i18n="common:s">${i18next.t("common:s")}</span></span><br>`;
    } 
    if (App.userSettings.showDistance){ 
        subtextContent += `<span class=bearingPreview>1145<span data-i18n="common:m">${i18next.t("common:m")}</span></span><br>`;
    }
    if (App.userSettings.showHeight){ 
        subtextContent += `<span class=bearingPreview>+19<span data-i18n="common:m">${i18next.t("common:m")}</span></span><br>`;
    } 

    $("#textPreview").html(subtextContent);

    if (App.userSettings.grid){
        $("#gridPreview").show();
    } else {
        $("#gridPreview").hide();
    }

    if (App.userSettings.targetGrid){
        $("#targetGridPreview").show();
    } else {
        $("#targetGridPreview").hide();
    }

    if (App.userSettings.keypadUnderCursor){
        tooltip_coordPreview.enable();
    } else {
        tooltip_coordPreview.disable();
    }


    if (App.userSettings.targetAnimation) {
        $("#markerPreview").attr("src", "/img/markers/targets/marker_target_enabled.webp");
        $("#markerPreview").css("margin-top", "0px");
    } 
    else {
        $("#markerPreview").attr("src", "/img/markers/targets/marker_target_mini.webp");
        $("#markerPreview").css("margin-top", "20px");
    }
}

$("#showMapBordersSettings").on("change", function() {
    var val = $("#showMapBordersSettings").is(":checked");
    App.userSettings.showMapBorders = val;
    localStorage.setItem("settings-show-map-borders", +val);

    if (val) {
        if (App.minimap.layer.borders) App.minimap.layer.borders.setStyle({ opacity: 0, fillOpacity: 0.75 });
    } else {
        if (App.minimap.layer.borders) App.minimap.layer.borders.setStyle({ opacity: 0, fillOpacity: 0 });
    }
});

$("#defaultFactionsSettings").on("change", function() {
    var val = $("#defaultFactionsSettings").is(":checked");
    App.userSettings.defaultFactions = val;
    localStorage.setItem("settings-default-factions", +val);
});


$("#showMainZonesSettings").on("change", function() {
    var val = $("#showMainZonesSettings").is(":checked");
    App.userSettings.showMainZones = val;
    localStorage.setItem("settings-show-mainzones", +val);

    App.minimap.layer.mainZones.rectangles.forEach((rectangle) => {
        if (!val) {
            rectangle.setStyle({ fillOpacity: 0, opacity: 0 });
        } else {
            rectangle.setStyle({ fillOpacity: 0.1, opacity: 1 });
        }  
    });
});


$("#showMainAssetsSettings").on("change", function() {
    var val = $("#showMainAssetsSettings").is(":checked");
    App.userSettings.showMainAssets = val;
    localStorage.setItem("settings-show-mainassets", +val);

    if (App.minimap.getZoom() > App.minimap.detailedZoomThreshold) {
        App.minimap.layer.mainZones.assets.forEach(asset => {
            if (!val) {
                asset.setOpacity(0);
                App.minimap.layer.hideSpawns();
            } else {
                asset.setOpacity(1);
                App.minimap.layer.revealSpawns();
            }
        });
        App.minimap.layer.vehicleSpawners.forEach(spawn => {
            if (!val) {
                spawn.hide();
            } else {
                spawn.show();
            }
        });
    }
});

$("#disableSoundsSettings").on("change", function() {
    var val = $("#disableSoundsSettings").is(":checked");
    App.userSettings.disableSounds = val;
    localStorage.setItem("settings-disable-sounds", +val);
});

$("#hideLowRespawnSettings").on("change", function() {
    var val = $("#hideLowRespawnSettings").is(":checked");
    App.userSettings.hideLowRespawn = val;
    localStorage.setItem("settings-hide-lowrespawn", +val);

    if ($(".btn-pin.active").length == 0 ) return;

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
        factionData = App.minimap.layer.layerData.units.team1Units;
        country = $(".dropbtn8").val();
        faction = $(".dropbtn9").val();
    } else {
        factionData = App.minimap.layer.layerData.units.team2Units;
        country = $(".dropbtn10").val();
        faction = $(".dropbtn11").val();
    }

    App.minimap.layer.factions.pinUnit(factionData, country, faction);

});



$("#enableFactionsSettings").on("change", function() {
    var val = $("#enableFactionsSettings").is(":checked");
    App.userSettings.enableFactions = val;
    localStorage.setItem("settings-enable-factions", +val);
    if (!val){
        $("#factionsTab").hide();
        $("#hideLowRespawnSettings").prop("disabled", true);
        $("#disableSoundsSettings").prop("disabled", true);
        $("#defaultFactionsSettings").prop("disabled", true);
    } else {
        $("#hideLowRespawnSettings").prop("disabled", false);
        $("#disableSoundsSettings").prop("disabled", false);
        $("#defaultFactionsSettings").prop("disabled", false);

        if (App.minimap.layer) {
            App.minimap.layer.factions = new SquadFactions(App.minimap.layer);
            $("#factionsTab").show();
        }
    }
});

$("#circlesFlagsSettings").on("change", function() {
    var val = $("#circlesFlagsSettings").is(":checked");
    App.userSettings.circlesFlags = val;
    localStorage.setItem("settings-circles-flags", +val);

    if (App.minimap.layer){
        App.minimap.layer.flags.forEach(flag => {
            flag.update();
        });
        if (!App.minimap.layer.isVisible) App.minimap.layer.toggleVisibility();
    }
});

$("#revealLayerOnHoverSettings").on("change", function() {
    var val = $("#revealLayerOnHoverSettings").is(":checked");
    App.userSettings.revealLayerOnHover = val;
    localStorage.setItem("settings-reveal-onHover", +val);
});

$("#showFlagsDistanceSettings").on("change", function() {
    var val = $("#showFlagsDistanceSettings").is(":checked");
    App.userSettings.showFlagsDistance = val;
    localStorage.setItem("settings-show-flags-distance", +val);
    if (App.minimap.layer){
        if (val){
            App.minimap.layer.polyline.showMeasurements({
                minPixelDistance: 50,
                scaling: App.minimap.mapToGameScale,
            });
        } else {
            App.minimap.layer.polyline.hideMeasurements();
        }
    }
});

$("#capZoneOnHoverSettings").on("change", function() {
    var val = $("#capZoneOnHoverSettings").is(":checked");
    App.userSettings.capZoneOnHover = val;
    localStorage.setItem("settings-capZone-onHover", +val);
    
    if (!App.minimap.layer) return;
    if (App.minimap.getZoom() <= App.minimap.detailedZoomThreshold) return;

    // Hide/Show cap zones if the user is already zoomed in
    if (!val){
        App.minimap.layer.revealAllCapzones();
    } else {
        App.minimap.layer.hideAllCapzones();
    }
});

$("#keypadUnderCursorSetting").on("change", function() {
    var val = $("#keypadUnderCursorSetting").is(":checked");

    if (val){
        App.minimap.on("pointermove", App.minimap._handleMouseMove);
        //App.minimap.on("zoomend", App.minimap._handleZoom);
    }
    else {
        App.minimap.off("pointermove", App.minimap._handleMouseMove);
        //App.minimap.off("zoomend", App.minimap._handleZoom);
        App.minimap.mouseLocationPopup.close();
    }
    App.userSettings.keypadUnderCursor = val;
    localStorage.setItem("settings-keypad-cursor", +val);
    updatePreview();
});

$("#gridSetting").on("change", function() {
    var val = $("#gridSetting").is(":checked");
    if (val) {
        App.userSettings.grid = val;
        localStorage.setItem("settings-grid", +val);
        App.minimap.showGrid();
    }
    else {
        App.userSettings.grid = val;
        localStorage.setItem("settings-grid", +val);
        App.minimap.hideGrid();
    }
    updatePreview();
});

$("#spreadRadiusSetting").on("change", function() {
    var val = $("#spreadRadiusSetting").is(":checked");
    App.userSettings.spreadRadius = val;
    localStorage.setItem("settings-spread-radius", +val);
    App.minimap.updateTargetsSpreads(); // Update every targets to add/remove spread radius
    updatePreview();
});

$("#mapAnimationSettings").on("change", function() {
    var val = $("#mapAnimationSettings").is(":checked");
    App.userSettings.smoothMap = val;
    localStorage.setItem("settings-smooth-map", +val);
});

$("#damageRadiusSetting").on("change", function() {
    var val = $("#damageRadiusSetting").is(":checked");
    App.userSettings.damageRadius = val;
    localStorage.setItem("settings-damage-radius", +val);
    App.minimap.updateTargetsSpreads(); // Update every targets to add/remove spread radius
    updatePreview();
});

$("#targetGridSetting").on("change", function() {
    var val = $("#targetGridSetting").is(":checked");
    App.userSettings.targetGrid = val;
    localStorage.setItem("settings-target-grid", +val);
    App.minimap.updateTargets();
    updatePreview();
});

$("#targetDragSetting").on("change", function() {
    var val = $("#targetDragSetting").is(":checked");
    App.userSettings.targetDrag = val;
    localStorage.setItem("settings-target-drag", +val);
});

$("#weaponDragSetting").on("change", function() {
    var val = $("#weaponDragSetting").is(":checked");
    App.userSettings.weaponDrag = val;
    localStorage.setItem("settings-weapon-drag", +val);
});

$("#heightSetting").on("change", function() {
    if ($("#heightSetting").is(":checked")) {
        App.userSettings.showHeight = 1;
        localStorage.setItem("settings-show-height", 1);
    }
    else {
        App.userSettings.showHeight = 0;
        localStorage.setItem("settings-show-height", 0);
    }

    App.minimap.updateTargets();
    updatePreview();
});

$("#experimentalSetting").on("change", function() {
    var val =  $("#experimentalSetting").is(":checked");
    App.userSettings.experimentalWeapons = val;
    localStorage.setItem("settings-experimental-weapons", +val);
    App.toggleExperimentalWeapons();
});


$("#realMaxRangeSettings").on("change", function() {
    var val =  $("#realMaxRangeSettings").is(":checked");
    App.userSettings.realMaxRange = val;
    localStorage.setItem("settings-real-max-range", +val);
    App.minimap.updateWeapons();
});

$("#targetCopySetting").on("change", function() {
    var val =  $("#targetCopySetting").is(":checked");
    App.userSettings.copyTarget = val;
    localStorage.setItem("settings-copy-target", +val);
});

$("#lowAndHighSetting").on("change", function() {
    var val =  $("#lowAndHighSetting").is(":checked");
    App.userSettings.lowAndHigh = val;
    localStorage.setItem("settings-low-high", +val);
    App.minimap.updateTargets();
});


// $("#copyNextFlagsSettings").on("change", function() {
//     var val =  $("#copyNextFlagsSettings").is(":checked");
//     App.userSettings.copyNextFlags = val;
//     localStorage.setItem("settings-copy-next-flags", +val);
// });

$("#cursorChoiceSettings").on("change", function() {
    var val =  $("#cursorChoiceSettings").is(":checked");
    App.userSettings.cursor = val;
    localStorage.setItem("settings-cursor", +val);

    if (val) {
        $("#map").css("cursor", "default");
        $("#preview").css("cursor", "default");
    }
    else {
        $("#map").css("cursor", "crosshair");
        $("#preview").css("cursor", "crosshair");
    }
});

$("#targetAnimationSettings").on("change", function() {
    var val = $("#targetAnimationSettings").is(":checked");
    App.userSettings.targetAnimation = val;
    localStorage.setItem("settings-target-animation", +val);

    if (App.userSettings.targetAnimation) {
        $("#markerPreview").attr("src", "/img/markers/targets/marker_target_enabled.webp");
        $("#markerPreview").css("margin-top", "0px");
    } 
    else {
        $("#markerPreview").attr("src", "/img/markers/targets/marker_target_mini.webp");
        $("#markerPreview").css("margin-top", "20px");
    }

    App.minimap.activeTargetsMarkers.eachLayer(function (target) {
        target.updateCalcPopUps();
        target.updateIcon();
    });
});

$("#bearingOverDistanceSettings").on("change", function() {
    if ($("#bearingOverDistanceSettings").is(":checked")) {
        App.userSettings.bearingOverDistance = 1;
        localStorage.setItem("settings-bearing-distance", 1);
    }
    else {
        App.userSettings.bearingOverDistance = 0;
        localStorage.setItem("settings-bearing-distance", 0);
    }

    // Update every targets to add/remove distance
    App.minimap.updateTargets();
    updatePreview();
});

$("#bearingSetting").on("change", function() {
    if ($("#bearingSetting").is(":checked")) {
        App.userSettings.showBearing = 1;
        localStorage.setItem("settings-show-bearing", 1);
    }
    else {
        App.userSettings.showBearing = 0;
        localStorage.setItem("settings-show-bearing", 0);
    }

    App.minimap.updateTargets();
    updatePreview();
});

$("#distanceSetting").on("change", function() {
    if ($("#distanceSetting").is(":checked")) {
        App.userSettings.showDistance = 1;
        localStorage.setItem("settings-show-distance", 1);
    }
    else {
        App.userSettings.showDistance = 0;
        localStorage.setItem("settings-show-distance", 0);
    }

    App.minimap.updateTargets();
    updatePreview();
});


$("#timeOfFlightSetting").on("change", function() {
    if ($("#timeOfFlightSetting").is(":checked")) {
        App.userSettings.showTimeOfFlight = 1;
        localStorage.setItem("settings-show-timeofflight", 1);
    }
    else {
        App.userSettings.showTimeOfFlight = 0;
        localStorage.setItem("settings-show-timeofflight", 0);
    }

    App.minimap.updateTargets();
    updatePreview();
});


// Add an even listener on all settings label so it can also be clicked
$(".toggleCheckbox").on("click", function() {

    // Find the checkbox
    const checkbox = $(this).closest("tr").find("input[type='checkbox']");

    // Check if the checkbox is disabled
    if (checkbox.prop("disabled")) { return;}

    // Toggle it
    checkbox.prop("checked", !checkbox.prop("checked")).trigger("change");
    animateCSS($(this).closest("td"), "headShake");
});
