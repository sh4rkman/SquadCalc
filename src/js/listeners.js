import { shoot, changeTheme, filterInput, drawHeatmap, resizeInput, RemoveSaves, copySave, copy } from "./utils.js";
import { saveWeapon } from "./weapons.js";
import { THEMES } from "./themes";
import { tooltip_copy, tooltip_copied, tooltip_save } from "./tooltips";

$(document).on("change", ".switch-field", function() { saveWeapon(); });
$(document).on("change", ".dropbtn", function() { drawHeatmap(); });
$(document).on("input", "#target-location", function() { shoot(); });
$(document).on("input", "#mortar-location", function() { shoot(); });
$(document).on("input", ".resize", function() { resizeInput(this); });
$(document).on("keypress", "#mortar-location", function(event) { filterInput(event); });
$(document).on("keypress", "#target-location", function(event) { filterInput(event); });
$(document).on("click", ".del", function() { RemoveSaves(this); });
$(document).on("click", "#savespan", function() { copySave($(this)); });

$(document).on("click", ".fab-action-2", function() {
    var theme = $("body").attr("data-theme");


    for (let i = 0; i < THEMES.length - 1; i++) {
        if (THEMES[i] === theme) {
            changeTheme(THEMES[i + 1]);
            return;
        }
        // we are in classic but don't know it
        changeTheme(THEMES[0]);
    }

});

$(document).on("click", ".save", function() {

    if ($(".saved_list p").length === 4) {
        $(".saved_list p").first().remove();
    }
    $(".saved_list").append(
        "<p class='savedrow' style='display:none;'>" +
        "<input maxlength=\"20\" spellcheck='false' placeholder='" + encodeURI($("#target-location").val()) + "'class='friendlyname resize'></input>" +
        "<span id=\"savespan\"> ➜ " +
        $("#bearing").text() +
        " - " +
        $("#elevation").text() +
        "&nbsp;&nbsp;" +
        "</span><i class=\"fa fa-times-circle fa-fw del\" aria-hidden=\"true\"></i></p>");

    // resize the inserted input according the the placeholder lengtH 
    $(".saved_list p").find("input").last().width($("#target-location").val().length * 1.2 + "ch");

    // display it
    $(".saved").removeClass("hidden");
    $(".saved_list p").last().show("fast");
    tooltip_save.disable();

});



$(document).on("click", "#copy", function() {
    const COPY_ZONE = $(".copy");

    if (!COPY_ZONE.hasClass("copy")) { return 1; }

    copy($("#target-location").val() + " ➜ " + $("#bearing").text() + " - " + $("#elevation").text());

    // the user understood he can click2copy, remove the tooltip
    localStorage.setItem("InfoToolTips_copy", true);
    tooltip_copy.disable();
    tooltip_copied.enable();
    tooltip_copied.show();
});