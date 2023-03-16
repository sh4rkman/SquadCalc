import { shoot, changeTheme, filterInput, drawHeatmap, resizeInput, RemoveSaves, copySave, } from "./utils.js";
import { saveWeapon } from "./weapons.js";
import { tooltip_copy, tooltip_copied, tooltip_save } from "./tooltips";

$(document).on("change", ".switch-field", function() {
    shoot();
    saveWeapon();
});
$(document).on("change", ".switch-field2", function() { shoot(); });
$(document).on("change", ".dropbtn", function() { drawHeatmap(); });
$(document).on("input", "#target-location", function() { shoot(); });
$(document).on("input", "#mortar-location", function() { shoot(); });
$(document).on("input", ".resize", function() { resizeInput(this); });
$(document).on("keypress", "#mortar-location", function(event) { filterInput(event); });
$(document).on("keypress", "#target-location", function(event) { filterInput(event); });
$(document).on("click", ".del", function() { RemoveSaves(this); });
$(document).on("click", "#savespan", function() { copySave($(this)); });

$(document).on("click", ".fab-action-2", function() {
    if ($("body").attr("data-theme") === "classic") {
        changeTheme("dark");
    } else if ($("body").attr("data-theme") === "dark") {
        changeTheme("blue");
    } else if ($("body").attr("data-theme") === "blue") {
        changeTheme("green");
    } else if ($("body").attr("data-theme") === "green") {
        changeTheme("classic");
    } else { // we are in classic but don't know it
        changeTheme("dark");
    }
});

$(document).on("click", ".save", function() {

    if ($(".saved_list p").length === 4) {
        $(".saved_list p").first().remove();
    }
    $(".saved_list").append(
        "<p class='savedrow' style='display:none;'><input maxlength=\"20\" spellcheck='false' placeholder='" + $("#target-location").val() + "'class='friendlyname resize'></input>" +
        "<span id=\"savespan\" style=\"font-weight:bold\"> ➜ " +
        $("#bearing").text() +
        " - " +
        $("#elevation").text() +
        "&nbsp;&nbsp;</span><i class=\"fa fa-times-circle fa-fw del\" aria-hidden=\"true\"></i></p>");

    $(".saved").removeClass("hidden");

    $(".saved_list p").last().show("fast");

    // the user understood he can click2save, remove the tooltip now
    if (localStorage.getItem("InfoToolTips_save") !== "true") {
        tooltip_save.disable();
        localStorage.setItem("InfoToolTips_save", "true");
    }

});



$(document).on("click", "#copy", function() {
    const COPY_ZONE = $(".copy");

    if (!COPY_ZONE.hasClass("copy")) { return 1; }

    navigator.clipboard.writeText("➜ " + $("#target-location").val() + " = " + $("#bearing").text() + " - " + $("#elevation").text());

    // the user understood he can click2copy, remove the tooltip
    localStorage.setItem("InfoToolTips_copy", true);
    tooltip_copy.disable();
    tooltip_copied.enable();
    tooltip_copied.show();

});