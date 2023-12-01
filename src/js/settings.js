
import { globalData } from "./conf";



export function loadSettings(){
    var val;

    globalData.userSettings.keypadUnderCursor = localStorage.getItem("settings-keypad-cursor");
    globalData.userSettings.spreadRadius = localStorage.getItem("settings-spread-radius");
    globalData.userSettings.LowSpecMode = localStorage.getItem("settings-low-spec");
    globalData.userSettings.targetAnimation = localStorage.getItem("settings-target-animation");
    globalData.userSettings.weaponMinMaxRange = localStorage.getItem("settings-weapon-range");

    if (globalData.userSettings.keypadUnderCursor === null || 
        isNaN(globalData.userSettings.keypadUnderCursor) || 
        globalData.userSettings.keypadUnderCursor === ""){
        globalData.userSettings.keypadUnderCursor = 1; 
        localStorage.setItem("settings-keypad-cursor", 1);  
    }

    if (globalData.userSettings.spreadRadius === null|| 
        isNaN(globalData.userSettings.spreadRadius) || 
        globalData.userSettings.spreadRadius === ""){
        globalData.userSettings.spreadRadius = 1; 
        localStorage.setItem("settings-spread-radius", 1);  
    }

    if (globalData.userSettings.LowSpecMode === null || 
        isNaN(globalData.userSettings.LowSpecMode) || 
        globalData.userSettings.LowSpecMode === ""){
        globalData.userSettings.LowSpecMode = 1; 
        localStorage.setItem("settings-low-spec", 1);  
    }

    if (globalData.userSettings.targetAnimation === null || 
        isNaN(globalData.userSettings.targetAnimation) || 
        globalData.userSettings.targetAnimation === ""){
        globalData.userSettings.targetAnimation = 1; 
        localStorage.setItem("settings-target-animation", 1);  
    }

    if (globalData.userSettings.weaponMinMaxRange === null || 
        isNaN(globalData.userSettings.weaponMinMaxRange) || 
        globalData.userSettings.weaponMinMaxRange === ""){
        globalData.userSettings.weaponMinMaxRange = 1; 
        localStorage.setItem("settings-weapon-range", 1);  
    }

    if (globalData.userSettings.spreadRadius == 1) {
        val = true;
    } else {
        val = false;
    }
    $("#spreadRadiusSetting").prop("checked", val);

    if (globalData.userSettings.keypadUnderCursor == 1) {
        val = true;
    } else {
        val = false;
    }
    $("#keypadUnderCursorSetting").prop("checked", val);

    if (globalData.userSettings.LowSpecMode == 1) {
        val = true;
    } else {
        val = false;
    }
    $("#LowSpecModeSetting").prop("checked", val);

    if (globalData.userSettings.targetAnimation == 1) {
        val = true;
    } else {
        val = false;
    }
    $("#targetAnimationSettings").prop("checked", val);

    if (globalData.userSettings.weaponMinMaxRange == 1) {
        val = true;
    } else {
        val = false;
    }
    $("#weaponRangeSettings").prop("checked", val);
}

$("#keypadUnderCursorSetting").on("change", function() {
    if ($("#keypadUnderCursorSetting").is(":checked")) {
        globalData.userSettings.keypadUnderCursor = 1;
        localStorage.setItem("settings-keypad-cursor", 1);
        globalData.mouseLocationPopup.close();
    }
    else {
        globalData.userSettings.keypadUnderCursor = 0;
        localStorage.setItem("settings-keypad-cursor", 0);
        globalData.mouseLocationPopup.close();
    }
});

$("#LowSpecModeSetting").on("change", function() {
    if ($("#LowSpecModeSetting").is(":checked")) {
        globalData.userSettings.LowSpecMode = 1;
        localStorage.setItem("settings-low-spec", 1);
    }
    else {
        globalData.userSettings.LowSpecMode = 0;
        localStorage.setItem("settings-low-spec", 0);
    }
});

$("#spreadRadiusSetting").on("change", function() {
    if ($("#spreadRadiusSetting").is(":checked")) {
        globalData.userSettings.spreadRadius = 1;
        localStorage.setItem("settings-spread-radius", 1);
    }
    else {
        globalData.userSettings.spreadRadius = 0;
        localStorage.setItem("settings-spread-radius", 0);
    }

    // Update every targets to add/remove spread radius
    globalData.activeTargetsMarkers.eachLayer(function (layer) {
        layer.updateCalc(layer.latlng);
    });
});

$("#weaponRangeSettings").on("change", function() {
    if ($("#weaponRangeSettings").is(":checked")) {
        globalData.userSettings.weaponMinMaxRange = 1;
        localStorage.setItem("settings-weapon-range", 1);
    }
    else {
        globalData.userSettings.weaponMinMaxRange = 0;
        localStorage.setItem("settings-weapon-range", 0);
    }
    globalData.activeWeaponMarker.eachLayer(function (layer) {
        layer.updateWeapon();
    });
});

$("#targetAnimationSettings").on("change", function() {
    if ($("#targetAnimationSettings").is(":checked")) {
        globalData.userSettings.targetAnimation = 1;
        localStorage.setItem("settings-target-animation", 1);
    }
    else {
        globalData.userSettings.targetAnimation = 0;
        localStorage.setItem("settings-target-animation", 0);
    }
});

