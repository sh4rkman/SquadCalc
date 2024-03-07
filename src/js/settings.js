import { globalData } from "./conf";
import { tooltip_coordPreview } from "./tooltips.js";

/* eslint no-unused-vars: "off" */
import speadIcon from "../img/icons/spread.png";
import gridIcon from "../img/icons/grid.png";
import maxRangeIcon from "../img/icons/maxrange.png";

import { 
    targetIcon1,
    targetIconAnimated1,
} from "./squadIcon";

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

    globalData.userSettings.keypadUnderCursor = loadLocalSetting("settings-keypad-cursor");
    if (matchMedia("(pointer:fine)").matches) {
        $("#keypadUnderCursorSetting").prop("checked", globalData.userSettings.keypadUnderCursor);
    }
    else {
        $("#keypadUnderCursorSetting").attr("disabled", true);
        $("#KPSettingSubText").text("(Disabled: no mouse detected!)");
        globalData.userSettings.keypadUnderCursor = false;
    }

    globalData.userSettings.spreadRadius = loadLocalSetting("settings-spread-radius");
    $("#spreadRadiusSetting").prop("checked", globalData.userSettings.spreadRadius);

    globalData.userSettings.targetAnimation = loadLocalSetting("settings-target-animation");
    $("#targetAnimationSettings").prop("checked", globalData.userSettings.targetAnimation);

    globalData.userSettings.grid = loadLocalSetting("settings-grid");
    $("#gridSetting").prop("checked", globalData.userSettings.grid);
    
    globalData.userSettings.weaponMinMaxRange = loadLocalSetting("settings-weapon-range");
    $("#weaponRangeSettings").prop("checked", globalData.userSettings.weaponMinMaxRange);

    globalData.userSettings.bearingOverDistance = loadLocalSetting("settings-bearing-distance", false);
    $("#bearingOverDistanceSettings").prop("checked", globalData.userSettings.bearingOverDistance);

    globalData.userSettings.cursor = loadLocalSetting("settings-cursor", true);

    if (globalData.userSettings.cursor) {
        $("#preview").css("cursor", "crosshair");
        $("#map").css("cursor", "crosshair");
        $(".leaflet-overlay-pane, .leaflet-interactive").css("cursor", "crosshair");
    }
    else {
        $("#preview").css("cursor", "default");
        $("#map").css("cursor", "default");
        $(".leaflet-overlay-pane, .leaflet-interactive").css("cursor", "default");
    }

    $("#cursorChoice1").prop("checked", globalData.userSettings.cursor);
    $("#cursorChoice2").prop("checked", !globalData.userSettings.cursor);

    updatePreview();
}


function updatePreview(){
    if (globalData.userSettings.spreadRadius){
        $("#spreadPreview").show();
    } else {
        $("#spreadPreview").hide();
    }

    if (globalData.userSettings.weaponMinMaxRange){
        $("#maxRangePreview").show();
    } else {
        $("#maxRangePreview").hide();
    }

    if (globalData.userSettings.bearingOverDistance){
        $("#bearingPreview").text("1145m");
    } else {
        $("#bearingPreview").text("241.5°");
    }

    if (globalData.userSettings.grid){
        $("#gridPreview").show();
    } else {
        $("#gridPreview").hide();
    }

    if (globalData.userSettings.keypadUnderCursor){
        tooltip_coordPreview.enable();
    } else {
        tooltip_coordPreview.disable();
    }
}



$("#keypadUnderCursorSetting").on("change", function() {
    var val;

    // if no mouse support detected, disable the fonctionality
    if (!matchMedia("(pointer:fine)").matches) {
        globalData.userSettings.keypadUnderCursor = false;
        return;
    }

    val = $("#keypadUnderCursorSetting").is(":checked");

    if (val){
        globalData.minimap.on("mousemove", globalData.minimap._handleMouseMove);
    }
    else {
        globalData.minimap.off("mousemove", globalData.minimap._handleMouseMove);
        globalData.minimap.mouseLocationPopup.close();
    }
    globalData.userSettings.keypadUnderCursor = val;
    localStorage.setItem("settings-keypad-cursor", +val);
    updatePreview();
});

$("#gridSetting").on("change", function() {
    var val = $("#gridSetting").is(":checked");
    if (val) {
        globalData.userSettings.grid = val;
        localStorage.setItem("settings-grid", +val);
        globalData.minimap.showGrid();
    }
    else {
        globalData.userSettings.grid = val;
        localStorage.setItem("settings-grid", +val);
        globalData.minimap.hideGrid();
    }
    updatePreview();
});

$("#spreadRadiusSetting").on("change", function() {
    var val = $("#spreadRadiusSetting").is(":checked");
    globalData.userSettings.spreadRadius = val;
    localStorage.setItem("settings-spread-radius", +val);
    globalData.minimap.updateTargets(); // Update every targets to add/remove spread radius
    updatePreview();
});

$("#weaponRangeSettings").on("change", function() {
    var val =  $("#weaponRangeSettings").is(":checked");
    globalData.userSettings.weaponMinMaxRange = val;
    localStorage.setItem("settings-weapon-range", +val);
    globalData.minimap.updateWeapons();
    updatePreview();
});

$("input[type=radio][name=cursorChoice]").on("change", function() {
    var val = this.value;

    if (this.value === "crosshair") {
        val = 1;
        $("#preview").css("cursor", "crosshair");
        $("#map").css("cursor", "crosshair");
        $(".default").css("cursor", "crosshair");
        $(".crosshair").css("cursor", "crosshair");
    }
    else {
        val = 0;
        $("#preview").css("cursor", "default");
        $("#map").css("cursor", "default");
        $(".crosshair").css("cursor", "default");
        $(".default").css("cursor", "default");
    }

    globalData.userSettings.cursor = val;
    localStorage.setItem("settings-cursor", val);

});

$("#targetAnimationSettings").on("change", function() {
    var val = $("#targetAnimationSettings").is(":checked");
    globalData.userSettings.targetAnimation = val;
    localStorage.setItem("settings-target-animation", +val);

    globalData.minimap.activeTargetsMarkers.eachLayer(function (layer) {
        if (val) {
            layer.setIcon(targetIconAnimated1);
        }
        else {
            layer.setIcon(targetIcon1);
        }
    });
});

$("#bearingOverDistanceSettings").on("change", function() {
    if ($("#bearingOverDistanceSettings").is(":checked")) {
        globalData.userSettings.bearingOverDistance = 1;
        localStorage.setItem("settings-bearing-distance", 1);
    }
    else {
        globalData.userSettings.bearingOverDistance = 0;
        localStorage.setItem("settings-bearing-distance", 0);
    }

    // Update every targets to add/remove distance
    globalData.minimap.updateTargets();
    updatePreview();
});


