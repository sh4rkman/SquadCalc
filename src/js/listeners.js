import { shoot, filterInput, resizeInput, resizeInputsOnResize, RemoveSaves, copySave, copyCalc, saveCalc, changeHighLow } from "./utils";
import { changeWeapon } from "./weapons";
import { drawHeatmap } from "./maps";
import { switchTheme } from "./themes";

$(document).on("change", ".dropbtn2", function() { changeWeapon(); });
$(document).on("change", ".dropbtn", function() { drawHeatmap(); });

$(document).on("input", "#target-location", function() { shoot(); });
$(document).on("input", "#mortar-location", function() { shoot(); });
$(document).on("input", ".friendlyname", function() { resizeInput(this); });

$(document).on("keypress", "#mortar-location", function(event) { filterInput(event); });
$(document).on("keypress", "#target-location", function(event) { filterInput(event); });

$(document).on("click", ".del", function() { RemoveSaves(this); });
$(document).on("click", ".savespan", function() { copySave($(this)); });
$(document).on("click", ".fab-action-2", function() { switchTheme(); });
$(document).on("click", "#savebutton", function() { saveCalc(); });
$(document).on("click", "#copy", function(e) { copyCalc(e); });
$(document).on("click", "#highlow", function() { changeHighLow(); });

$(window).on("resize", function() { resizeInputsOnResize(); });