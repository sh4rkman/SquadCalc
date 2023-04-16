import { tooltip_copy, tooltip_save, tooltip_copied } from "./tooltips";
import { globalData } from "./conf";
import { MAPS } from "./maps";


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
            if (!globalData.debug.active && Number.isNaN(SUB)) {
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
 * Calculates the bearing required to see point B from point A.
 *
 * @param {LatLng} a - base point A
 * @param {LatLng} b - target point B
 * @returns {number} - bearing required to see B from A
 */
function getBearing(a, b) {
    // oh no, vector maths!
    var bearing = Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180 / Math.PI + 90;

    // Avoid Negative Angle by adding a whole rotation
    if (bearing < 0) { bearing += 360; }

    return bearing;
}

/**
 * Converts radians into NATO mils
 * @param {number} rad - radians
 * @returns {number} NATO mils
 */
function radToMil(rad) {
    return degToMil(radToDeg(rad));
}

/**
 * Converts radians into degrees
 * @param {number} rad - radians
 * @returns {number} degrees
 */
function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

/**
 * Converts degrees into NATO mils
 * @param {number} deg - degrees
 * @returns {number} NATO mils
 */
function degToMil(deg) {
    return deg / (360 / 6400);
}

/**
 * Calculates the distance between two points.
 * @param {LatLng} a - point A
 * @param {LatLng} b - point B
 * @returns {number} distance A <-> B
 */
function getDist(a, b) {
    return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

/**
 * Calculates the angle the mortar needs to be set in order
 * to hit the target at the desired distance and vertical delta.
 * @param {number} [dist] - distance between mortar and target from getDist()
 * @param {number} [vDelta] - vertical delta between mortar and target from getHeight()
 * @param {number} [vel] - initial mortar projectile velocity
 * @param {number} [G] - gravity force (9.8)
 * @returns {number || NaN} mil/deg if target in range, NaN otherwise
 */
function getElevation(dist = 0, vDelta = 0, vel = 0, G = 9.8) {
    var A1;
    const P1 = Math.sqrt(vel ** 4 - G * (G * dist ** 2 + 2 * vDelta * vel ** 2));

    // MLRS use 0-45°
    if (globalData.activeWeapon.name === "BM-21 Grad") {
        A1 = Math.atan((vel ** 2 - P1) / (G * dist));
    }
    // Others use 45-90°
    else {
        A1 = Math.atan((vel ** 2 + P1) / (G * dist));
    }

    if (globalData.activeWeapon.unit === "mil") {
        return radToMil(A1);
    } else { // if weapon is using degres
        return radToDeg(A1);
    }
}
/**
 * Apply current map offset to given position
 *
 * @param {lat;lng} pos - position
 * @returns {lat;lng} - offset position
 */
function getOffsetLatLng(pos) {
    const mapScale = globalData.canvas.size / MAPS[globalData.activeMap][1];
    return {
        lat: (pos.lat + MAPS[globalData.activeMap][2] * mapScale) * mapScale,
        lng: (pos.lng + MAPS[globalData.activeMap][3] * mapScale) * mapScale
    };
}

/**
 * Calculates the height difference between mortar and target
 *
 * @param {Number} a - {lat;lng} where mortar is
 * @param {Number} b - {lat;lng} where target is
 * @returns {number} - relative height in meters
 */
function getHeight(a, b) {
    var Aheight;
    var Bheight;
    var AOffset = { lat: 0, lng: 0 };
    var BOffset = { lat: 0, lng: 0 };
    var ctx = document.getElementById("canvas").getContext("2d");

    // if user didn't select map, no height calculation
    if (!globalData.activeMap) { return 0; }

    // Apply offset & scaling
    // Heightmaps & maps doesn't always start at A01, they sometimes need to be offset manually

    AOffset = getOffsetLatLng(a);
    BOffset = getOffsetLatLng(b);

    // Read Heightmap color values for a & b
    Aheight = ctx.getImageData(Math.round(AOffset.lat), Math.round(AOffset.lng), 1, 1).data;
    Bheight = ctx.getImageData(Math.round(BOffset.lat), Math.round(BOffset.lng), 1, 1).data;

    // Debug purpose
    if (globalData.debug.active) {
        console.log("------------------------------");
        console.log("HEIGHTMAP");
        console.log(` -> map: ${MAPS[globalData.activeMap][0]}`);
        console.log("------------------------------");
        console.log(`A {lat:${ a.lat.toFixed(2)}; lng: ${a.lng.toFixed(2)}}`);
        console.log(`    -> Offset {lat: ${AOffset.lat.toFixed(2)}; lng: ${AOffset.lng.toFixed(2)}}`);
        console.log(`    -> ${Aheight} (RGBa)`);
        console.log(`B {lat: ${b.lat.toFixed(2)}; lng: ${b.lng.toFixed(2)}}`);
        console.log(`    -> Offset {lat: ${BOffset.lat.toFixed(2)}; lng: ${BOffset.lng.toFixed(2)}}`);
        console.log(`    -> ${Bheight} (RGBa)`);

        // place visual green marker on the canvas
        ctx.fillStyle = "green";
        ctx.fillRect(AOffset.lat, AOffset.lng, 5, 5);
        ctx.fillRect(BOffset.lat, BOffset.lng, 5, 5);
    }

    // Check if a & b aren't out of canvas
    if (Aheight[2] === 0 && Aheight[0] === 0) {
        return "AERROR";
    }
    if (Bheight[2] === 0 && Bheight[0] === 0) {
        return "BERROR";
    }

    Aheight = (255 + Aheight[0] - Aheight[2]) * MAPS[globalData.activeMap][4];
    Bheight = (255 + Bheight[0] - Bheight[2]) * MAPS[globalData.activeMap][4];

    return Bheight - Aheight;
}

/**
 * Reset UI to default
 */
function resetCalc() {
    if (!globalData.debug.active) { console.clear(); }

    // First, reset any errors
    $("#settings").css({ "border-color": "#fff" });
    $("#target-location").removeClass("error2");
    $("#mortar-location").removeClass("error2");

    // prepare result divs
    $("#bearing").removeClass("hidden").addClass("pure-u-10-24");
    $("#elevation").removeClass("hidden").addClass("pure-u-10-24");
    $("#errorMsg").addClass("pure-u-4-24").removeClass("errorMsg").removeClass("pure-u-1").html("-");
    $("#savebutton").addClass("hidden");
    $("#bearing").html("xxx<i class=\"fas fa-drafting-compass fa-rotate-180 resultIcons\"></i>");
    $("#elevation").html("xxxx<i class=\"fas fa-sort-amount-up resultIcons\"></i>");

    // draw pointer cursor & tooltip on results
    if (localStorage.getItem("InfoToolTips_copy") !== "true") {
        tooltip_copy.enable();
        tooltip_copy.show();
    }
    $("#copy").addClass("copy");
}

/**
 * Calculates the distance elevation and bearing
 * @returns {target} elevation + bearing
 */
export function shoot() {
    var startA;
    var startB;
    var height;
    var distance;
    var elevation;
    var bearing;
    var vel;
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
        tooltip_copy.disable();
        return 1;
    }

    // restore cursor position
    setCursor(startA, startB, a, b);

    aPos = getPos(a);
    bPos = getPos(b);

    if (Number.isNaN(aPos.lng) || Number.isNaN(bPos.lng)) {

        if (Number.isNaN(aPos.lng) && Number.isNaN(bPos.lng)) {
            showError("Invalid mortar and target");
        } else if (Number.isNaN(aPos.lng)) {
            showError("Invalid mortar", "mortar");
        } else {
            showError("Invalid target", "target");
        }
        return 1;
    }

    height = getHeight(aPos, bPos);

    // Check if mortars/target are out of map
    if ((height === "AERROR") || (height === "BERROR")) {

        if (height === "AERROR") {
            showError("Mortar is out of map", "mortar");
        } else {
            showError("Target is out of map", "target");
        }
        return 1;
    }

    distance = getDist(aPos, bPos);
    vel = globalData.activeWeapon.getVelocity(distance);
    elevation = getElevation(distance, height, vel);

    // If Target too far, display it and exit function
    if (Number.isNaN(elevation)) {
        showError("Target is out of range : " + distance.toFixed(0) + "m", "target");
        return 1;
    }

    if (globalData.activeWeapon.name === "BM-21 Grad") {
        if (elevation < globalData.activeWeapon.minElevation) {
            showError("Target is too close : " + distance.toFixed(0) + "m", "target");
            return 1;
        }
    } else {
        if ((elevation > globalData.activeWeapon.minElevation)) {
            showError("Target is too close : " + distance.toFixed(0) + "m", "target");
            return 1;
        }
    }
    bearing = getBearing(aPos, bPos);

    insertCalc(bearing, elevation, distance, vel, height);

}

/**
 * Insert Calculations into html
 *
 * @param {number} bearing 
 * @param {number} elevation 
 * @param {number} distance 
 * @param {number} vel 
 * @param {number} height 
 */
function insertCalc(bearing, elevation, distance, vel, height) {
    if (!globalData.debug.active) {
        console.clear();
    } else {
        console.log("------------------------------");
        console.log("         FINAL CALC");
        console.log("------------------------------");
    }
    console.log(`${$("#mortar-location").val()} -> ${$("#target-location").val()}`);
    console.log(`-> Bearing: ${bearing.toFixed(1)}° - Elevation: ${elevation.toFixed(1)}↷`);
    console.log(`-> Distance: ${distance.toFixed(0)}m - height: ${height.toFixed(0)}m`);
    console.log(`-> Velocity: ${vel.toFixed(1)}m/s`);

    $("#bearing").html(bearing.toFixed(1) + "<i class=\"fas fa-drafting-compass fa-rotate-180 resultIcons\"></i>");


    //If using technica/hell mortars/mlrs, we need to be more precise (##.#)
    if (globalData.activeWeapon.unit === "deg") {
        $("#elevation").html(elevation.toFixed(1) + "<i class=\"fas fa-sort-amount-up resultIcons\"></i>");
    } else {
        $("#elevation").html(elevation.toFixed(0) + "<i class=\"fas fa-sort-amount-up resultIcons\"></i>");
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
 * @param {string} msg - error message to be displayed
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
    $("#errorMsg").removeClass("pure-u-4-24").addClass("pure-u-1").addClass("errorMsg").html(msg);

    // remove the pointer cursor & tooltip
    $("#copy").removeClass("copy");
    tooltip_copy.disable();

    $("#settings").css({ "border-color": "firebrick" });

    if (!globalData.debug.active) { console.clear(); }
    console.error(msg);
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
    COPY_ZONE.parent().effect("bounce", 400);
}


/**
 * Copy string to clipboard
 * execCommand is deprecated but navigator.clipboard doesn't work in steam browser
 */
function copy(string) {
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
function setCursor(startA, startB, a, b) {
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

    MORTAR_LOC[0].setSelectionRange(startA, startA);
    TARGET_LOC[0].setSelectionRange(startB, startB);
}


/**
 * Generate random id
 * @param {Number} length - length of desired string to be returned
 * @returns {String} randomly generated string
 */
function makeid(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;

    for (let i = 0; i < length; i += 1) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}


/**
 * Give Inputs random name to avoid browsers/mobile keyboards autocomplete
 */
export function preventAutocomplete() {
    $("#mortar-location").attr("name", makeid(10));
    $("#target-location").attr("name", makeid(10));
    $(".dropbtn").attr("name", makeid(10));
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
    $(".saved_list :input").each(function() {
        resizeInput($(this)[0]);
    });
}


/**
 * Save current calc to save list
 */
export function saveCalc() {
    if ($(".saved_list p").length === 4) {
        $(".saved_list p").first().remove();
    }
    $(".saved_list").append(
        "<p class='savedrow' style='display:none;'>" +
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
    $(".saved_list p").last().show("fast");
    tooltip_save.disable();
}

/**
 * Copy current calc to clipboard
 */
export function copyCalc() {
    const COPY_ZONE = $(".copy");

    if (!COPY_ZONE.hasClass("copy")) { return 1; }

    copy($("#target-location").val() + " ➜ " + $("#bearing").text() + " - " + $("#elevation").text());

    // the user understood he can click2copy, remove the tooltip
    localStorage.setItem("InfoToolTips_copy", true);
    tooltip_copy.disable();
    tooltip_copied.enable();
    tooltip_copied.show();
}