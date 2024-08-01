import { tooltip_save, tooltip_copied } from "./tooltips";
import { App } from "./conf";
import { animateCSS, animateCalc} from "./animations";
import { LatLng } from "leaflet";
import i18next from "i18next";
import SquadFiringSolution from "./squadFiringSolution";

/**
 * Returns the latlng coordinates based on the given keypad string.
 * Supports unlimited amount of sub-keypads.
 * Throws error if keypad string is too short or parsing results in invalid latlng coordinates.
 * @param {string} kp - keypad coordinates, e.g. "A02-3-5-2"
 * @returns {LatLng} converted coordinates
 */
function getPos(kp) {
    const FORMATTED_KEYPAD = formatKeyPad(kp);
    const PARTS = FORMATTED_KEYPAD.split("-");
    var interval;
    var lat = 0;
    var lng = 0;
    var i = 0;

    while (i < PARTS.length) {
        if (i === 0) {
            // special case, i.e. letter + number combo
            const LETTERCODE = PARTS[i].charCodeAt(0);
            const LETTERINDEX = LETTERCODE - 65;
            if (PARTS[i].charCodeAt(0) < 65) { return { lat: NaN, lng: NaN }; }
            const KEYPADNB = Number(PARTS[i].slice(1)) - 1;
            lat += 300 * LETTERINDEX;
            lng += 300 * KEYPADNB;

        } else {
            // opposite of calculations in getKP()
            const SUB = Number(PARTS[i]);
            if (Number.isNaN(SUB)) {
                console.log(`invalid keypad string: ${FORMATTED_KEYPAD}`);
            }
            const subX = (SUB - 1) % 3;
            const subY = 2 - (Math.ceil(SUB / 3) - 1);

            interval = 300 / 3 ** i;
            lat += interval * subX;
            lng += interval * subY;
        }
        i += 1;
    }

    // at the end, add half of last interval, so it points to the center of the deepest sub-keypad
    interval = 300 / 3 ** (i - 1);
    lat += interval / 2;
    lng += interval / 2;

    return { lat: lat, lng: lng };
}

/**
 * Format keypad input, setting text to uppercase and adding dashes
 * @param {string} text - keypad string to be formatted
 * @returns {string} formatted string
 */
function formatKeyPad(text = "") {
    var i = 3;
    const TEXTPARTS = [];

    // If empty string, return
    if (text.length === 0) { return; }

    const TEXTND = text.toUpperCase().split("-").join("");
    TEXTPARTS.push(TEXTND.slice(0, 3));

    // iteration through sub-keypads
    while (i < TEXTND.length) {
        TEXTPARTS.push(TEXTND.slice(i, i + 1));
        i += 1;
    }

    return TEXTPARTS.join("-");
}

/**
 * Reset UI to default
 */
function resetCalc() {
    //if (!globalData.debug.active) {console.clear();}

    // First, reset any errors
    $("#settings").css({ "border-color": "#fff" });
    $("#target-location").removeClass("error2");
    $("#mortar-location").removeClass("error2");

    // prepare result divs
    $("#bearing").removeClass("hidden").addClass("pure-u-10-24");
    $("#elevation").removeClass("hidden").addClass("pure-u-10-24");
    $("#errorMsg").addClass("pure-u-4-24").removeClass("errorMsg").removeClass("pure-u-1").html("-");
    $("#savebutton").addClass("hidden");
    $("#highlow i").removeClass("active");

    // draw pointer cursor on results
    $("#copy").addClass("copy");
}

/**
 * Calculates the distance elevation and bearing
 * @returns {target} elevation + bearing
 */
export function shoot(inputChanged = "") {
    var startA;
    var startB;
    var elevation;
    var firingSolution;
    const MORTAR_LOC = $("#mortar-location");
    const TARGET_LOC = $("#target-location");
    var a = MORTAR_LOC.val();
    var b = TARGET_LOC.val();
    var aPos;
    var bPos;

    resetCalc();

    // store current cursor positions on input
    startA = MORTAR_LOC[0].selectionStart;
    startB = TARGET_LOC[0].selectionStart;

    // format keypads
    MORTAR_LOC.val(formatKeyPad(a));
    TARGET_LOC.val(formatKeyPad(b));

    // If keypads are imprecises, do nothing
    if (a.length < 3 || b.length < 3) {
        // disable tooltip and copy function
        $("#copy").removeClass("copy");
        $("#bearingNum").html("xxx");
        $("#elevationNum").html("xxxx");
        return 1;
    }

    // restore cursor position
    setCursor(startA, startB, a, b, inputChanged);

    aPos = getPos(a);
    bPos = getPos(b);

    if (Number.isNaN(aPos.lng) || Number.isNaN(bPos.lng)) {
        if (Number.isNaN(aPos.lng) && Number.isNaN(bPos.lng)) {
            showError("<div data-i18n='common:invalidMortarTarget'>" + i18next.t("common:invalidMortarTarget") + "</div>");
        } else if (Number.isNaN(aPos.lng)) {
            showError("<div data-i18n='common:invalidMortar'>" + i18next.t("common:invalidMortar") + "</div>", "mortar");
        } else {
            showError("<div data-i18n='common:invalidTarget'>" + i18next.t("common:invalidTarget") + "</div>", "target");
        }
        return 1;
    }

    aPos = new LatLng(-aPos.lng * App.minimap.gameToMapScale, aPos.lat * App.minimap.gameToMapScale);
    bPos = new LatLng(-bPos.lng * App.minimap.gameToMapScale, bPos.lat * App.minimap.gameToMapScale);

    firingSolution = new SquadFiringSolution(aPos, bPos, App.minimap, 0);

    if (App.activeWeapon.getAngleType() === -1) {
        elevation = firingSolution.elevation.high;
    } else {
        elevation = firingSolution.elevation.low;
    }

    if (App.activeWeapon.unit === "mil") {
        elevation = elevation.mil;
    } else {
        elevation = elevation.deg;
    }

    if (App.activeWeapon.getAngleType() === -1) {
        if (elevation > App.activeWeapon.minElevation[1]) {
            showError("<span data-i18n='common:targetTooClose'>" + i18next.t("common:targetTooClose") + "</span> : " + firingSolution.distance.toFixed(0) + "<span data-i18n='common:m'>" + i18next.t("common:m") + "</span>", "target");
            return 1;
        }
    } else {
        if (elevation < App.activeWeapon.minElevation[0]) {
            showError("<span data-i18n='common:targetTooClose'>" + i18next.t("common:targetTooClose") + "</span> : " + firingSolution.distance.toFixed(0) + "<span data-i18n='common:m'>" + i18next.t("common:m") + "</span>", "target");
            return 1;
        }  
    }
    
    // If Target too far, display it and exit function
    if (Number.isNaN(elevation)) {
        showError("<span data-i18n='common:targetOutOfRange'>" + i18next.t("common:targetOutOfRange") + "</span> : " + firingSolution.distance.toFixed(0) + "<span data-i18n='common:m'>" + i18next.t("common:m") + "</span>", "target");
        return 1;
    }

    insertCalc(firingSolution.bearing, elevation, firingSolution.distance);

}

/**
 * Insert Calculations into html
 * @param {number} bearing 
 * @param {number} elevation 
 */
function insertCalc(bearing, elevation) {

    animateCalc($("#bearingNum").html(),bearing.toFixed(1),500,"bearingNum");
    animateCalc($("#elevationNum").html(),elevation.toFixed(App.activeWeapon.elevationPrecision),500,"elevationNum");

    $("elevation").html($("<i class=\"fas fa-drafting-compass fa-rotate-180 resultIcons\"></i>"));
    
    if (App.activeWeapon.getAngleType() === -1) {
        $("#highlow").html($("<i class=\"fa-solid fa-sort-amount-up resultIcons\"></i>"));
    }
    else {
        $("#highlow").html($("<i class=\"fa-solid fa-sort-amount-down resultIcons\"></i>"));
    }
    
    if (App.activeWeapon.name != "Mortar" && App.activeWeapon.name != "UB-32") {
        $("#highlow i").addClass("active");
    }
    
    // show actions button
    $("#savebutton").removeClass("hidden");
}


/**
 * Filter invalid key pressed by the user
 *
 * @param {string} e - keypress event
 * @returns {event} - empty event if we don't want the user input
 */
export function filterInput(e) {
    var chrTyped;
    var chrCode = 0;
    var evt = e ? e : event;

    if (evt.charCode !== null) {
        chrCode = evt.charCode;
    } else if (evt.which !== null) {
        chrCode = evt.which;
    } else if (evt.keyCode !== null) {
        chrCode = evt.keyCode;
    }

    if (chrCode === 0) {
        chrTyped = "SPECIAL KEY";
    } else {
        chrTyped = String.fromCharCode(chrCode);
    }

    //Letters, Digits, special keys & backspace [\b] work as usual:
    if (chrTyped.match(/\d|[\b]|SPECIAL|[A-Za-z]/)) { return true; }
    if (evt.altKey || evt.ctrlKey || chrCode < 28) { return true; }

    //Any other input Prevent the default response:
    if (evt.preventDefault) { evt.preventDefault(); }
    evt.returnValue = false;
    return false;
}



/**
 * Display error in html & console
 * @param {string} msg - error message code to be displayed
 * @param {string} issue - mortar/target/both
 */
function showError(msg, issue) {

    if (issue === "mortar") {
        $("#mortar-location").addClass("error2");
    } else if (issue === "target") {
        $("#target-location").addClass("error2");
    } else {
        $("#target-location, #mortar-location").addClass("error2");
    }

    // Rework the #setting div to display a single message
    $("#bearing").addClass("hidden").removeClass("pure-u-10-24");
    $("#elevation").addClass("hidden").removeClass("pure-u-10-24");
    $("#errorMsg").removeClass("pure-u-4-24").addClass("pure-u-1").addClass("errorMsg");
    $("#errorMsg").html(msg);

    // remove the pointer cursor & tooltip
    $("#copy").removeClass("copy");
    $("#settings").css({ "border-color": "firebrick" });
    animateCSS($("#settings"), "shakeX");

}


/**
 * Copy Saved calcs to clipboard
 */
export function copySave(COPY_ZONE) {
    var text2copy;

    if (COPY_ZONE.prev().val().length === 0) {
        text2copy = COPY_ZONE.prev().attr("placeholder") + COPY_ZONE.text();
    } else {
        text2copy = COPY_ZONE.prev().val() + COPY_ZONE.text();
    }

    copy(text2copy);
    animateCSS(COPY_ZONE.parent(), "headShake");
}


/**
 * Copy string to clipboard
 */
function copy(string) {
    // execCommand is deprecated but navigator.clipboard doesn't work in steam browser
    const el = document.createElement("textarea");
    el.value = string;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
}

/**
 * Remove a saved keypad
 *  * @param {object} a - saved calcs to remove
 */
export function RemoveSaves(a) {
    if ($(".saved_list p").length === 1) { $("#saved").addClass("hidden"); }
    a.closest("p").remove();
}


/**
 * Set the cursor at the correct position after MSMC messed with the inputs by reformating its values
 * @param {string} startA - cursor position on mortar
 * @param {string} startB - cursor position on target
 * @param {string} a - previous mortar coord before reformating
 * @param {string} b - previous tardget coord before reformating
 */
function setCursor(startA, startB, a, b, inputChanged) {
    const MORTAR_LOC = $("#mortar-location");
    const TARGET_LOC = $("#target-location");
    const MORTAR_LENGTH = MORTAR_LOC.val().length;
    const TARGET_LENGTH = TARGET_LOC.val().length;

    a = a.length;
    b = b.length;


    // if the keypads.lenght is <3, do nothing.
    // Otherwise we guess if the user is deleting or adding something
    // and ajust the cursor considering MSMC added/removed a '-'

    if (startA >= 3) {
        if (a > MORTAR_LENGTH) {
            startA -= 1;
        } else {
            startA += 1;
        }
    }

    if (startB >= 3) {
        if (b > TARGET_LENGTH) {
            startB -= 1;
        } else {
            startB += 1;
        }
    }
    
    if (inputChanged === "weapon") {
        MORTAR_LOC[0].setSelectionRange(startA, startA);
    }
    else if (inputChanged === "target"){
        TARGET_LOC[0].setSelectionRange(startB, startB);
    }
    else {
        MORTAR_LOC[0].setSelectionRange(startA, startA);
        TARGET_LOC[0].setSelectionRange(startB, startB);
    }
}


/**
 * Resize Saved Names according to their content
 * using a hidden <span> as a ruler
 * @param {input} i - input to resize
 */
export function resizeInput(i) {

    if (i.value.length === 0) {
        $("#ruler").html(i.placeholder);
    } else {
        $("#ruler").html(i.value);
    }
    i.style.width = $("#ruler").width() * 1.05 + "px";
}

/**
 * Resize every saved name
 */
export function resizeInputsOnResize() {
    const mobileWidth = 767;

    $(".saved_list :input").each(function() {
        resizeInput($(this)[0]);
    });

    if ($(window).width() <= mobileWidth) {
        App.line.hide("none");
    }
}


/**
 * Save current calc to save list
 */
export function saveCalc() {
    if ($(".saved_list p").length === 4) {
        $(".saved_list p").first().remove();
    }
    $(".saved_list").append(
        "<p class='savedrow'>" +
        "<input maxlength=\"20\" spellcheck='false' placeholder='" + encodeURI($("#target-location").val()) + "'class='friendlyname'></input>" +
        "<span class=\"savespan\"> ➜ " +
        $("#bearing").text() +
        " - " +
        $("#elevation").text() +
        "&nbsp;&nbsp;" +
        "</span><i class=\"fa fa-times-circle fa-fw del\" aria-hidden=\"true\"></i></p>");

    // resize the inserted input according the the placeholder length 
    $(".saved_list p").find("input").last().width($("#target-location").val().length * 1.2 + "ch");

    // display it
    $("#saved").removeClass("hidden");
    animateCSS($(".saved_list p").last(), "fadeInDown");
    tooltip_save.disable();
}

/**
 * Copy current calc to clipboard
 * @param {event} e - click event that triggered copy
 */
export function copyCalc(e) {
    
    // If calcs aren't ready, do nothing
    if (!$(".copy").hasClass("copy")) { return 1; }

    if ($(e.target).hasClass("fa-sort-amount-down") || $(e.target).hasClass("fa-sort-amount-up") ) {
        if (!$(e.target).hasClass("active")) {
            return 1;
        }
    }

    animateCSS($(".copy"), "headShake");

    copy($("#target-location").val() + " ➜ " + $("#bearing").text() + " - " + $("#elevation").text());

    // the user understood he can click2copy, remove the tooltip
    localStorage.setItem("InfoToolTips_copy", true);
    tooltip_copied.enable();
    tooltip_copied.show();
}

/**
 * Toggle high/low angles
 */
export function changeHighLow(){
    const isLowAngle = $("#highlow").find(".fa-sort-amount-up").length > 0;
    App.activeWeapon.angleType = isLowAngle ? "low" : "high";
    shoot();
}

export function isTouchDevice() {
    return (("ontouchstart" in window) ||
       (navigator.maxTouchPoints > 0) ||
       (navigator.msMaxTouchPoints > 0));
}