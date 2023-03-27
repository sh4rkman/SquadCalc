import { shoot, filterInput, resizeInput, RemoveSaves, copySave, copyCalc, saveCalc } from "./utils";
import { saveWeapon } from "./weapons";
import { drawHeatmap } from "./maps";
import { switchTheme } from "./themes";


$(document).on("change", ".switch-field", function() { saveWeapon(); });
$(document).on("change", ".dropbtn", function() { drawHeatmap(); });

$(document).on("input", "#target-location", function() { shoot(); });
$(document).on("input", "#mortar-location", function() { shoot(); });
$(document).on("input", ".resize", function() { resizeInput(this); });

$(document).on("keypress", "#mortar-location", function(event) { filterInput(event); });
$(document).on("keypress", "#target-location", function(event) { filterInput(event); });

$(document).on("click", ".del", function() { RemoveSaves(this); });
$(document).on("click", "#savespan", function() { copySave($(this)); });
$(document).on("click", ".fab-action-2", function() { switchTheme(); });
$(document).on("click", ".save", function() { saveCalc() });
$(document).on("click", "#copy", function() { copyCalc() });