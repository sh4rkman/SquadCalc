import { App } from "./conf";
import { tooltip_coordPreview } from "./tooltips.js";
import i18next from "i18next";

/* eslint no-unused-vars: "off" */
import speadIcon from "../img/icons/spread.png";
import gridIcon from "../img/icons/grid.png";
import maxRangeIcon from "../img/icons/maxrange.png";
import damageRangeIcon from "../img/icons/damage.png";


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
    var setting = localStorage.getItem("settings-map-mode");
    
    App.userSettings.keypadUnderCursor = loadLocalSetting("settings-keypad-cursor");
    if (matchMedia("(pointer:fine)").matches) {
        $("#keypadUnderCursorSetting").prop("checked", App.userSettings.keypadUnderCursor);
    }
    else {
        $("#keypadUnderCursorSettingRow").hide();
        $(".cursorChoiceSettings").hide();
        App.userSettings.keypadUnderCursor = false;
    }



    if (setting === null || setting === ""){
        setting = "basemap";
        localStorage.setItem("settings-map-mode", setting);
    }

    $(".btn-"+setting).addClass("active");


    App.userSettings.spreadRadius = loadLocalSetting("settings-spread-radius");
    $("#spreadRadiusSetting").prop("checked", App.userSettings.spreadRadius);

    App.userSettings.damageRadius = loadLocalSetting("settings-damage-radius", 0);
    $("#damageRadiusSetting").prop("checked", App.userSettings.damageRadius);

    App.userSettings.showHeight = loadLocalSetting("settings-show-height", 0);
    $("#heightSetting").prop("checked", App.userSettings.showHeight);

    App.userSettings.targetAnimation = loadLocalSetting("settings-target-animation");
    $("#targetAnimationSettings").prop("checked", App.userSettings.targetAnimation);

    App.userSettings.grid = loadLocalSetting("settings-grid");
    $("#gridSetting").prop("checked", App.userSettings.grid);
    
    App.userSettings.weaponMinMaxRange = loadLocalSetting("settings-weapon-range");
    $("#weaponRangeSettings").prop("checked", App.userSettings.weaponMinMaxRange);

    App.userSettings.showBearing = loadLocalSetting("settings-show-bearing", 1);
    $("#bearingSetting").prop("checked", App.userSettings.showBearing);

    App.userSettings.showDistance = loadLocalSetting("settings-show-distance", 0);
    $("#distanceSetting").prop("checked", App.userSettings.showDistance);

    App.userSettings.showTimeOfFlight = loadLocalSetting("settings-show-timeofflight", 0);
    $("#timeOfFlightSetting").prop("checked", App.userSettings.showTimeOfFlight);

    App.userSettings.cursor = loadLocalSetting("settings-cursor", 0);
    $("#cursorChoiceSettings").prop("checked", App.userSettings.cursor);

    if (App.userSettings.cursor) {
        $("#preview").css("cursor", "default");
        $("#map").css("cursor", "default");
        $(".crosshair").css("cursor", "default");
        $(".default").css("cursor", "default");
    }
    else {
        $("#preview").css("cursor", "crosshair");
        $("#map").css("cursor", "crosshair");
        $(".default").css("cursor", "crosshair");
        $(".crosshair").css("cursor", "crosshair");        
    }
}


export function updatePreview(){
    var subtextContent;

    if (App.userSettings.spreadRadius){
        $("#spreadPreview").show();
    } else {
        $("#spreadPreview").hide();
    }

    if (App.userSettings.weaponMinMaxRange){
        $("#maxRangePreview").show();
    } else {
        $("#maxRangePreview").hide();
    }

    if (App.userSettings.damageRadius){
        $("#damagePreview").show();
    } else {
        $("#damagePreview").hide();
    }

    subtextContent = "<span>1345</span><br>";

    if (App.userSettings.showBearing){ 
        subtextContent += "<span class=\"bearingPreview\">241.5" + i18next.t("common:°") +"</span><br>";
    } 
    if (App.userSettings.showTimeOfFlight){
        subtextContent += "<span class=\"bearingPreview\">20.1" + i18next.t("common:s") +" </span><br>";
    } 
    if (App.userSettings.showDistance){ 
        subtextContent += "<span class=\"bearingPreview\">1145" + i18next.t("common:m") + "</span><br>";
    }
    if (App.userSettings.showHeight){ 
        subtextContent += "<span class=\"bearingPreview\">+19" + i18next.t("common:m") +"</span><br>";
    } 

    $("#textPreview").html(subtextContent);

    if (App.userSettings.grid){
        $("#gridPreview").show();
    } else {
        $("#gridPreview").hide();
    }

    if (App.userSettings.keypadUnderCursor){
        tooltip_coordPreview.enable();
    } else {
        tooltip_coordPreview.disable();
    }
}



$("#keypadUnderCursorSetting").on("change", function() {
    var val;

    // if no mouse support detected, disable the fonctionality
    if (!matchMedia("(pointer:fine)").matches) {
        App.userSettings.keypadUnderCursor = false;
        return;
    }

    val = $("#keypadUnderCursorSetting").is(":checked");

    if (val){
        App.minimap.on("mousemove", App.minimap._handleMouseMove);
    }
    else {
        App.minimap.off("mousemove", App.minimap._handleMouseMove);
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

$("#damageRadiusSetting").on("change", function() {
    var val = $("#damageRadiusSetting").is(":checked");
    App.userSettings.damageRadius = val;
    localStorage.setItem("settings-damage-radius", +val);
    App.minimap.updateTargetsSpreads(); // Update every targets to add/remove spread radius
    updatePreview();
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


$("#weaponRangeSettings").on("change", function() {
    var val =  $("#weaponRangeSettings").is(":checked");
    App.userSettings.weaponMinMaxRange = val;
    localStorage.setItem("settings-weapon-range", +val);
    App.minimap.updateWeapons();
    updatePreview();
});

$("#cursorChoiceSettings").on("change", function() {
    var val =  $("#cursorChoiceSettings").is(":checked");
    App.userSettings.cursor = val;
    localStorage.setItem("settings-cursor", +val);

    if (val) {
        $("#preview").css("cursor", "default");
        $("#map").css("cursor", "default");
        $(".crosshair").css("cursor", "default");
        $(".default").css("cursor", "default");
    }
    else {
        $("#preview").css("cursor", "crosshair");
        $("#map").css("cursor", "crosshair");
        $(".default").css("cursor", "crosshair");
        $(".crosshair").css("cursor", "crosshair");
    }
});

$("#targetAnimationSettings").on("change", function() {
    var val = $("#targetAnimationSettings").is(":checked");
    App.userSettings.targetAnimation = val;
    localStorage.setItem("settings-target-animation", +val);

    App.minimap.activeTargetsMarkers.eachLayer(function (weapon) {
        weapon.updateIcon();
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

