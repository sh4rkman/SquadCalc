import { shoot, filterInput, resizeInput, resizeInputsOnResize, RemoveSaves, copySave, copyCalc, saveCalc, changeHighLow, switchUI } from "./utils";
import { changeWeapon } from "./weapons";
import { drawHeatmap, drawMap, clearMap } from "./maps";

$(document).on("change", ".dropbtn2", function() { changeWeapon(); });
$(document).on("change", ".dropbtn", function() { drawHeatmap(); clearMap(); drawMap(); shoot();});

$(document).on("input", "#mortar-location", function() { shoot("weapon"); });
$(document).on("input", "#target-location", function() { shoot("target"); });
$(document).on("input", ".friendlyname", function() { resizeInput(this); });

$(document).on("keypress", "#mortar-location", function(event) { filterInput(event); });
$(document).on("keypress", "#target-location", function(event) { filterInput(event); });

$(document).on("click", ".del", function() { RemoveSaves(this); });
$(document).on("click", ".savespan", function() { copySave($(this)); });

$(document).on("click", "#savebutton", function() { saveCalc(); });
$(document).on("click", "#copy", function(e) { copyCalc(e); });
$(document).on("click", "#highlow", function() { changeHighLow(); });
$(document).on("click", function(event) {if (!$(event.target).closest(".fab-wrapper").length) {$("#fabCheckbox").prop("checked", false);}});
$(document).on("click", ".fab2", function() {switchUI();});
$(document).on("click", ".fab", function() {$("#helpDialog")[0].showModal();});
$(window).on("resize", function() { resizeInputsOnResize(); });


const dialog = document.querySelector("dialog");
$(document).on("click", ".fab-action-2", function() {
    
});


document.querySelector("dialog button").addEventListener("click", () => {
    $("#helpDialog")[0].close();
});

$("#helpDialog").on("click", function(event) {
    var rect = dialog.getBoundingClientRect();
    var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
    if (!isInDialog) {
        dialog.close();
    }
});

