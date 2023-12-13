
import { globalData } from "./conf";


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
});

$("#spreadRadiusSetting").on("change", function() {
    var val = $("#spreadRadiusSetting").is(":checked");
    globalData.userSettings.spreadRadius = val;
    localStorage.setItem("settings-spread-radius", +val);
    globalData.minimap.updateTargets(); // Update every targets to add/remove spread radius
});

$("#weaponRangeSettings").on("change", function() {
    var val =  $("#weaponRangeSettings").is(":checked");
    globalData.userSettings.weaponMinMaxRange = val;
    localStorage.setItem("settings-weapon-range", +val);
    globalData.minimap.updateWeapons();
});

$("#targetAnimationSettings").on("change", function() {
    var val = $("#targetAnimationSettings").is(":checked");
    globalData.userSettings.targetAnimation = val;
    localStorage.setItem("settings-target-animation", +val);
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
});


