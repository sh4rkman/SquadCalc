import { tooltip_save, tooltip_copied } from "./tooltips";
import { App } from "./conf";
import { MAPS } from "../data/maps";
import { animateCSS, animateCalc} from "./animations";
import { LatLng } from "leaflet";

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
            if (!App.debug.active && Number.isNaN(SUB)) {
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
export function getBearing(a, b) {
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
export function radToMil(rad) {
    return degToMil(radToDeg(rad));
}

/**
 * Converts degrees to radians
 * @param {number} deg - degrees
 * @returns {number} radians
 */
export function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

/**
 * Converts radians into degrees
 * @param {number} rad - radians
 * @returns {number} degrees
 */
export function radToDeg(rad) {
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
export function getDist(a, b) {
    return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

/**
 * Calculates the angle the mortar needs to be set in order
 * to hit the target at the desired distance and vertical delta.
 * @param {number} [dist] - distance between mortar and target from getDist()
 * @param {number} [vDelta] - vertical delta between mortar and target from getHeight()
 * @param {number} [vel] - initial mortar projectile velocity
 * @returns {number || NaN} radian angle if target in range, NaN otherwise
 */
export function getElevation(dist = 0, vDelta = 0, vel = 0) {
    var padding = 0;
    const GRAVITY = App.gravity * App.activeWeapon.gravityScale;
    const P1 = Math.sqrt(vel ** 4 - GRAVITY * (GRAVITY * dist ** 2 + 2 * vDelta * vel ** 2));

    if (App.activeWeapon.name === "Tech. Mortar"){
        // The technical mortar is bugged : the ingame range metter is off by 5°
        // Ugly fix until OWI correct it
        padding = -0.0872665;
    }

    return padding + Math.atan((vel ** 2 - (P1 * App.activeWeapon.getAngleType())) / (GRAVITY * dist));
}

/**
 * Apply current map offset to given position
 *
 * @param {lat;lng} pos - position
 * @returns {lat;lng} - offset position
 */
export function getOffsetLatLng(pos) {
    const mapScale = App.canvas.size / MAPS.find((elem, index) => index == App.activeMap).size;
    return {
        lat: (pos.lat + MAPS.find((elem, index) => index == App.activeMap).offset[0] * mapScale) * mapScale,
        lng: (pos.lng + MAPS.find((elem, index) => index == App.activeMap).offset[1] * mapScale) * mapScale
    };
}

/**
 * Calculates the height difference between mortar and target
 *
 * @param {Number} a - {lat;lng} where mortar is
 * @param {Number} b - {lat;lng} where target is
 * @returns {number} - relative height in meters
 */
export function getHeight(a, b) {
    var Aheight;
    var Bheight;
    var AOffset;
    var BOffset;
    var ctx = document.getElementById("canvas").getContext("2d");

    // if user didn't select map, no height calculation
    if (!App.activeMap) { return 0; }

    // Apply offset & scaling
    // Heightmaps & maps doesn't always start at A01, they sometimes need to be offset manually
    AOffset = getOffsetLatLng(a);
    BOffset = getOffsetLatLng(b);


    // Read Heightmap color values for a & b
    Aheight = ctx.getImageData(Math.round(AOffset.lat), Math.round(AOffset.lng), 1, 1).data;
    Bheight = ctx.getImageData(Math.round(BOffset.lat), Math.round(BOffset.lng), 1, 1).data;


    // Debug purpose
    if (App.debug.active) {
        console.log("------------------------------");
        console.log("HEIGHTMAP");
        console.log("------------------------------");
        console.log(`A {lat:${ a.lat.toFixed(2)}; lng: ${a.lng.toFixed(2)}}`);
        console.log(`    -> Offset {lat: ${AOffset.lat.toFixed(2)}; lng: ${AOffset.lng.toFixed(2)}}`);
        console.log(`    -> ${Aheight} (RGBa)`);
        console.log(`B {lat: ${b.lat.toFixed(2)}; lng: ${b.lng.toFixed(2)}}`);
        console.log(`    -> Offset {lat: ${BOffset.lat.toFixed(2)}; lng: ${BOffset.lng.toFixed(2)}}`);
        console.log(`    -> ${Bheight} (RGBa)`);

        // place visual green marker on the canvas
        ctx.fillStyle = "green";
        //ctx.fillRect(AOffset.lat, AOffset.lng, 10, 10);
        //ctx.fillRect(BOffset.lat, BOffset.lng, 10, 10);
    }

    // Check if a & b aren't out of canvas
    if (Aheight[2] === 0 && Aheight[0] === 0) {
        return "AERROR";
    }
    if (Bheight[2] === 0 && Bheight[0] === 0) {
        return "BERROR";
    }

    Aheight = (255 + Aheight[0] - Aheight[2]) * MAPS.find((elem, index) => index == App.activeMap).scaling;
    Bheight = (255 + Bheight[0] - Bheight[2]) * MAPS.find((elem, index) => index == App.activeMap).scaling;

    return Bheight - Aheight;
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
    var height;
    var heightB;
    var heightA;
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
    const mapScale = App.mapSize / MAPS.find((elem, index) => index == App.activeMap).size;

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
            showError("Invalid mortar and target");
        } else if (Number.isNaN(aPos.lng)) {
            showError("Invalid mortar", "mortar");
        } else {
            showError("Invalid target", "target");
        }
        return 1;
    }

    heightA = App.minimap.heightmap.getHeight(new LatLng(aPos.lng * -mapScale, aPos.lat * mapScale));
    heightB = App.minimap.heightmap.getHeight(new LatLng(bPos.lng * -mapScale, bPos.lat * mapScale));
    height = heightB - heightA;

    distance = getDist(aPos, bPos);
    bearing = getBearing(aPos, bPos);
    vel = App.activeWeapon.getVelocity(distance);
    elevation = getElevation(distance, height, vel);


    if (App.activeWeapon.unit === "mil") {
        elevation = radToMil(elevation);
    } else {
        elevation = radToDeg(elevation);
        // The technical mortar is bugged : the ingame range metter is off by 5°
        // Ugly fix until OWI correct it
        if (App.activeWeapon.name === "Technical") { elevation = elevation - 5; }
    }


    // If Target too far, display it and exit function
    if (Number.isNaN(elevation)) {
        showError("Target is out of range : " + distance.toFixed(0) + "m", "target");
        return 1;
    }


    if ((elevation > App.activeWeapon.minElevation[1])) {
        showError("Target is too close : " + distance.toFixed(0) + "m", "target");
        return 1;
    }
    
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

    if (!App.debug.active) {
        //console.clear();
    } else {
        console.log("------------------------------");
        console.log("         FINAL CALC");
        console.log("------------------------------");
    }
    console.log(`${$("#mortar-location").val()} -> ${$("#target-location").val()}`);
    console.log(`-> Bearing: ${bearing.toFixed(1)}° - Elevation: ${elevation.toFixed(1)}↷`);
    console.log(`-> Distance: ${distance.toFixed(0)}m - height: ${height.toFixed(0)}m`);
    console.log(`-> Velocity: ${vel.toFixed(1)}m/s`);

    animateCalc($("#bearingNum").html(),bearing.toFixed(1),500,"bearingNum");
    animateCalc($("#elevationNum").html(),elevation.toFixed(App.activeWeapon.elevationPrecision),500,"elevationNum");

    $("elevation").html($("<i class=\"fas fa-drafting-compass fa-rotate-180 resultIcons\"></i>"));
     
    if (App.activeWeapon.getAngleType() === -1) {
        $("#highlow").html($("<i class=\"fa-solid fa-sort-amount-up resultIcons\"></i>"));
    }
    else {
        $("#highlow").html($("<i class=\"fa-solid fa-sort-amount-down resultIcons\"></i>"));
    }
    
    if (App.activeWeapon.name != "mortar" && App.activeWeapon.name != "UB-32") {
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
    $("#settings").css({ "border-color": "firebrick" });
    animateCSS($("#settings"), "shakeX");

    if (!App.debug.active) { console.clear(); }
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
    animateCSS(COPY_ZONE.parent(), "headShake");
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

    // When using BM-21, and the target icon is clicked, do nothing
    if (App.activeWeapon.name != "mortar" || App.activeWeapon.name != "B-32") {
        if ($(e.target).hasClass("fa-sort-amount-down") || $(e.target).hasClass("fa-sort-amount-up") ) {
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
    // If mortar/deployable UB32, deny changing
    if (App.activeWeapon.name == "mortar" || App.activeWeapon.name == "UB-32") {return 1;}

    const isLowAngle = $("#highlow").find(".fa-sort-amount-up").length > 0;
    App.activeWeapon.angleType = isLowAngle ? "low" : "high";
    shoot();
}


/**
 * Returns true if 'a' is a multiple of 'b' with a precision up to 4 decimals
 *
 * @param a
 * @param b
 * @returns {boolean} true if 'a' is a multiple of 'b' with a precision up to 4 decimals,
 *                    false otherwise
 */
export function isMultiple(a, b) {
    const t = b / a;
    const r = Math.round(t);
    const d = t >= r ? t - r : r - t;
    return d < 0.0001;
}


/**
 * Calculates the keypad coordinates for a given latlng coordinate, e.g. "A5-3-7"
 * @param lat - latitude coordinate
 * @param lng - longitude coordinate
 * @param precision - wanted precision (optionnal)
 * @returns {string} keypad coordinates as string
 */
export function getKP(lat, lng, precision) {
    // to minimize confusion
    const x = lng;
    const y = lat;

    if (x < 0 || y < 0) {
        return "XXX-X-X"; // when outside of min bounds
    }

    const kp = 300 / 3 ** 0; // interval of main keypad, e.g "A5"
    const s1 = 300 / 3 ** 1; // interval of first sub keypad
    const s2 = 300 / 3 ** 2; // interval of second sub keypad
    const s3 = 300 / 3 ** 3; // interval of third sub keypad
    const s4 = 300 / 3 ** 4; // interval of third sub keypad

    // basic grid, e.g. B5
    const kpCharCode = 65 + Math.floor(x / kp);
    let kpLetter;
    // PostScriptum Arnhem Lane A->Z and then a->b letters fix
    if (kpCharCode > 90) {
        kpLetter = String.fromCharCode(kpCharCode + 6);
    } else {
        kpLetter = String.fromCharCode(kpCharCode);
    }

    const kpNumber = Math.floor(y / kp) + 1;

    // sub keypad 1, e.g. B5 - 5
    // ok when we go down, we have 3x3 pads and start with the left most column, i.e. 7,4,1
    // so we check which index y is in, either 1st (7), 2nd (4), or 3rd (1)
    const subY = Math.floor(y / s1) % 3;

    // now we substract the index times 3 from 10
    // 1st = 10 - 1*3 = 7
    // 1st = 10 - 2*3 = 4
    // 1st = 10 - 3*3 = 1
    let subNumber = 10 - (subY + 1) * 3;

    // now all we need to do is add the index for of x, but starting from 0
    subNumber += Math.floor(x / s1) % 3;

    // sub keypad 2, e.g. B5 - 5 - 3;
    // same as above for sub keypad 1
    const sub2Y = Math.floor(y / s2) % 3;
    let sub2Number = 10 - (sub2Y + 1) * 3;
    sub2Number += Math.floor(x / s2) % 3;


    // sub keypad 3, e.g. B5 - 5 - 3 - 2;
    // same as above for sub keypad 2
    const sub3Y = Math.floor(y / s3) % 3;
    let sub3Number = 10 - (sub3Y + 1) * 3;
    sub3Number += Math.floor(x / s3) % 3;

    // sub keypad 3, e.g. B5 - 5 - 3 - 2;
    // same as above for sub keypad 2
    const sub4Y = Math.floor(y / s4) % 3;
    let sub4Number = 10 - (sub4Y + 1) * 3;
    sub4Number += Math.floor(x / s4) % 3;

    if (!precision){
        precision = App.minimap.getZoom();
    }

    // The more the user zoom in, the more precise we display coords under mouse
    switch (precision){
    case 0:
        return `${kpLetter}${pad(kpNumber, 2)}`; 
    case 1:
        return `${kpLetter}${pad(kpNumber, 2)}`;
    case 2:
        return `${kpLetter}${pad(kpNumber, 2)}`;
    case 3:
        return `${kpLetter}${pad(kpNumber, 2)}-${subNumber}`;
    case 4:
        return `${kpLetter}${pad(kpNumber, 2)}-${subNumber}-${sub2Number}`;
    case 5:
        return `${kpLetter}${pad(kpNumber, 2)}-${subNumber}-${sub2Number}-${sub3Number}`;
    default:
        return `${kpLetter}${pad(kpNumber, 2)}-${subNumber}-${sub2Number}-${sub3Number}-${sub4Number}`;
    }
}  

/**
 * 0-padding for numbers.
 * @param num - number to be padded
 * @param size - size of target string length, e.g. size == 4 == 4 digits
 * @returns {string} padded number as string
 */
export function pad(num, size) {
    return `0000${num}`.substr(-size);
}









export function isTouchDevice() {
    return (("ontouchstart" in window) ||
       (navigator.maxTouchPoints > 0) ||
       (navigator.msMaxTouchPoints > 0));
}