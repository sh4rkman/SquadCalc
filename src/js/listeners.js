import { shoot, filterInput, resizeInput, resizeInputsOnResize, RemoveSaves, copySave, copyCalc, saveCalc, changeHighLow, switchUI } from "./utils";
import { changeWeapon } from "./weapons";
import { App } from "./conf";
import { MAPS } from "./maps";

$(document).on("change", ".dropbtn2", function() { changeWeapon(); });
$(document).on("change", ".dropbtn", function() {
    App.minimap.activeMap = MAPS.find((elem, index) => index == this.value);
    App.minimap.clear(); 
    App.minimap.draw(true); 
});

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
$(document).on("click", "#fabCheckbox2", function() {switchUI();});
$(document).on("click", "#fabCheckbox", function() {$("#helpDialog")[0].showModal();});
$(document).on("click", ".btn-delete", function() { App.minimap.deleteTargets();});

$(window).on("resize", function() { resizeInputsOnResize(); });

$("#canvasControls button").on("click", function(){
    if ($(this).hasClass("active")){ return;}
    $("#canvasControls > .active").first().removeClass("active");
    $(this).addClass("active");
    $(".sim.active").removeClass("active");
    $("#"+$(this).val()).addClass("active");
});

$("#mapLayerMenu").find("button").on("click", function () {
    App.minimap.reDraw($(this).attr("value"));
});


const helpDialog = document.querySelector("#helpDialog");
$("#helpDialog").on("click", function(event) {
    var rect = helpDialog.getBoundingClientRect();
    var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
    if (!isInDialog) {
        helpDialog.close();
    }
});

const calcInformation = document.querySelector("#calcInformation");
$("#calcInformation").on("click", function(event) {
    var rect = calcInformation.getBoundingClientRect();
    var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
    if (!isInDialog) {
        calcInformation.close();
    }
});
