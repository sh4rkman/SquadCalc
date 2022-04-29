/**
 * Load the heatmap to the canvas
 */
function loadHeatmap() {
    var ctx = document.getElementById('canvas').getContext('2d');
    var img = new Image();

    img.addEventListener('load', function() {
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE); // Draw img at good scale
    }, false);
}

/**
 * Draw the selected Heatmaps in a hidden canvas
 */
function drawHeatmap() {
    var img = new Image(); // Create new img element
    var ctx = document.getElementById('canvas').getContext('2d');;
    var map = $(".dropbtn option:selected").text().toLowerCase();

    img.src = './img/heightmaps/' + map + '.jpg'; // Set source path

    img.addEventListener('load', function() { // wait for the image to load or it does crazy stuff
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        shoot(); // just in case there is already coordinates in inputs
    }, false);


}


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
    var pos;
    var interval;
    var x = 0;
    var y = 0;
    var i = 0;

    if (!FORMATTED_KEYPAD || FORMATTED_KEYPAD.length < 2) {
        console.log(`invalid keypad string: ${FORMATTED_KEYPAD}`);
    }

    while (i < PARTS.length) {
        if (i === 0) {
            // special case, i.e. letter + number combo
            const LETTERCODE = PARTS[i].charCodeAt(0);
            const LETTERINDEX = LETTERCODE - 65;
            if (PARTS[i].charCodeAt(0) < 65) {
                pos = {
                    lat: NaN,
                    lng: NaN
                };
                return pos;
            }
            const KEYPADNB = Number(PARTS[i].slice(1)) - 1;
            x += 300 * LETTERINDEX;
            y += 300 * KEYPADNB;

        } else {
            // opposite of calculations in getKP()
            const SUB = Number(PARTS[i]);
            if (Number.isNaN(SUB)) {
                console.log(`invalid keypad string: ${FORMATTED_KEYPAD}`);
            }
            const subX = (SUB - 1) % 3;
            const subY = 2 - (Math.ceil(SUB / 3) - 1);

            interval = 300 / 3 ** i;
            x += interval * subX;
            y += interval * subY;
        }
        i += 1;
    }

    // at the end, add half of last interval, so it points to the center of the deepest sub-keypad
    interval = 300 / 3 ** (i - 1);
    x += interval / 2;
    y += interval / 2;
    pos = {
        lat: x,
        lng: y
    };
    // might throw error
    return pos;
}

/**
 * Format keypad input, setting text to uppercase and adding dashes
 * @param {string} text - keypad string to be formatted
 * @returns {string} formatted string
 */
function formatKeyPad(text = "") {
    var i = 3;
    // If empty string, return
    if (text.length === 0) { return; }

    const TEXTND = text
        .toUpperCase()
        .split("-")
        .join("");
    const TEXTPARTS = [];

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
    var bearing = Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180 / Math.PI;

    // Point it north
    bearing = bearing + 90;

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
 * Converts degrees into radians
 * @param {number} deg - degrees
 * @returns {number} radians
 */
function degToRad(deg) {
    return (deg * Math.PI) / 180;
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
 * @returns {number} distance A and B
 */
function getDist(a, b) {
    const DLAT = a.lat - b.lat;
    const DLNG = a.lng - b.lng;
    return Math.sqrt(DLAT * DLAT + DLNG * DLNG);
}

/**
 * Calculates the angle the mortar needs to be set,
 * in order to hit the target at the desired distance and vertical delta.
 * @param {number} [x] - distance between mortar and target from getDist()
 * @param {number} [y] - vertical delta between mortar and target from getHeight()
 * @param {number} [vel] - initial mortar projectile velocity (109.890938)
 * @param {number} [G] - gravity force (9.8)
 * @returns {number || NaN} mil if target in range, NaN otherwise
 */
function getElevation(x, y = 0, vel = WEAPONS[0][1], G = GRAVITY) {

    // if user selected french DLC 120mm mortar (MO120)
    // MO120 from French DLC has three different charges
    // https://smf.tactical-collective.com/2021/10/03/mod-link-changed-beta-21-10-01-changelog/
    // I'm coding this drunk, this is terrible and should be changed when i get sober (but works)
    if ($("#radio-three").is(':checked')) {
        if ($("#radio-four").is(':checked')) {
            frenchSelection = 0;
            vel = WEAPONS[2][1];
        } else if ($("#radio-five").is(':checked')) {
            frenchSelection = 1;
            vel = WEAPONS[3][1];
        } else if ($("#radio-six").is(':checked')) {
            frenchSelection = 2;
            vel = WEAPONS[4][1];
        } else {
            if (frenchSelection === 0) {
                vel = WEAPONS[2][1];
            } else if (frenchSelection === 1) {
                vel = WEAPONS[3][1];
            } else {
                vel = WEAPONS[4][1];
            }
        }
    }

    const P1 = Math.sqrt(vel ** 4 - G * (G * x ** 2 + 2 * y * vel ** 2));
    const A1 = Math.atan((vel ** 2 + P1) / (G * x));

    if ($("#radio-one").is(':checked') || $("#radio-three").is(':checked')) {
        return radToMil(A1);
    } else {
        return radToDeg(A1);
    }

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
    var ctx;
    var mapScale;
    const DROPBTN_VAL = $(".dropbtn").val();


    // if user didn't select map, no height calculation
    if (DROPBTN_VAL === "") { return 0; }



    // load map size for scaling lat&lng
    mapScale = CANVAS_SIZE / MAPS[DROPBTN_VAL][1];

    // Read Heightmap values for a & b
    ctx = document.getElementById('canvas').getContext('2d');
    console.log(a);
    console.log(b);
    Aheight = ctx.getImageData(Math.round(a.lat * mapScale), Math.round(a.lng * mapScale), 1, 1).data;
    Bheight = ctx.getImageData(Math.round(b.lat * mapScale), Math.round(b.lng * mapScale), 1, 1).data;

    console.log(Aheight);
    console.log(Bheight);

    // Check if a & b arn't out of canvas
    if (Aheight[3] === 0) {
        return "AERROR";
    }
    if (Bheight[3] === 0) {
        return "BERROR";
    }

    Aheight = (255 + Aheight[0] - Aheight[2]) * MAPS[DROPBTN_VAL][2];
    Bheight = (255 + Bheight[0] - Bheight[2]) * MAPS[DROPBTN_VAL][2];

    return Bheight - Aheight;
}

/**
 * Calculates the distance elevation and bearing
 * @returns {target} elevation + bearing
 */
function shoot() {
    var startA;
    var startB;
    var height;
    var distance;
    var elevation;
    var i;
    var bearing;
    var h;
    var v;
    var H;
    var V;
    var vel;
    var a;
    var b;
    const MORTAR_LOC = $("#mortar-location");
    const TARGET_LOC = $("#target-location");


    // First, reset any errors
    $("#settings").removeClass("error");
    TARGET_LOC.removeClass("error2");
    MORTAR_LOC.removeClass("error2");

    // prepare result divs
    $("#bearing").removeClass("hidden").addClass("pure-u-10-24");
    $("#elevation").removeClass("hidden").addClass("pure-u-10-24");
    $("#errorMsg").addClass("pure-u-4-24").removeClass("errorMsg").removeClass("pure-u-24-24").html("-");
    $(".save").addClass("hidden");

    // draw pointer cursor & tooltip on results
    if (!stopInfoTooltips) {
        tooltip_copy.enable();
    }
    $("#copy").addClass("copy");

    // store current cursor positions on input
    startA = MORTAR_LOC[0].selectionStart;
    startB = TARGET_LOC[0].selectionStart;

    // store current keypads
    a = MORTAR_LOC.val();
    b = TARGET_LOC.val();

    // format keypads
    MORTAR_LOC.val(formatKeyPad(a));
    TARGET_LOC.val(formatKeyPad(b));

    // restore cursor position
    setCursor(startA, startB, a, b);

    // If keypads are imprecises, do nothing
    if (a.length < 3 || b.length < 3) {
        $("#bearing").html("xxx°");
        $("#elevation").html("xxxx↷");

        // disable tooltip and copy function
        $("#copy").removeClass("copy");
        tooltip_copy.disable();
        return 1;
    }

    a = getPos(a);
    b = getPos(b);

    if (Number.isNaN(a.lng) || Number.isNaN(b.lng)) {

        if (Number.isNaN(a.lng) && Number.isNaN(b.lng)) {
            showError("Invalid mortar and target");
        } else if (Number.isNaN(a.lng)) {
            showError("Invalid mortar", "mortar");
        } else {
            showError("Invalid target", "target");
        }
        return 1;
    }


    height = getHeight(a, b);

    // Check if mortars/target are out of map
    if ((height === "AERROR") || (height === "BERROR")) {

        if (height === "AERROR") {
            showError("Mortar is out of map", "mortar");
        } else {
            showError("Target is out of map", "target");
        }
        return 1;
    }

    distance = getDist(a, b);


    // Classical calc for mortar
    if ($("#radio-one").is(':checked') || $("#radio-three").is(':checked')) {
        elevation = getElevation(distance, height);
    } else { // If technical mortar

        for (i = 1; i < TECHNICALS.length; i += 1) {

            if (distance < TECHNICALS[i][0]) {
                h = TECHNICALS[i - 1][0];
                v = TECHNICALS[i - 1][1];
                H = TECHNICALS[i][0];
                V = TECHNICALS[i][1];

                // Ajust the velocity based on ingame-value
                vel = v + ((distance - h) / (H - h)) * (V - v);
                elevation = getElevation(distance, height, vel);
                break;
            }

        }

    }

    bearing = getBearing(a, b);

    // If Target too far, display it and exit function
    if (Number.isNaN(elevation)) {
        showError("Target is out of range : " + distance.toFixed(0) + "m", "target");
        return 1;
    }

    if ($("#radio-one").is(':checked')) {
        if (elevation > WEAPONS[0][2]) {
            showError("Target is too close : " + distance.toFixed(0) + "m", "target");
            return 1;
        }
    } else if ($("#radio-three").is(':checked')) {

        if (elevation > WEAPONS[4][2]) {
            showError("Target is too close : " + distance.toFixed(0) + "m", "target");
            return 1;
        }

    } else { // If technical mortar
        if (elevation > WEAPONS[1][2]) {
            showError("Target is too close : " + distance.toFixed(0) + "m", "target");
            return 1;
        }
    }


    // if in range, Insert Calculations
    console.clear();
    console.log($(MORTAR_LOC.val().toUpperCase() + " -> " + TARGET_LOC.val().toUpperCase()));
    console.log("-> Bearing: " + bearing.toFixed(1) + "° - Elevation: " + elevation.toFixed(1) + "↷");
    console.log("-> Distance: " + distance.toFixed(0) + "m - height: " + height.toFixed(0) + "m");

    $("#bearing").html(bearing.toFixed(1) + "°");


    // If using technical mortars, we need to be more precise (##.#)
    if ($("#radio-two").is(':checked')) {
        $("#elevation").html(elevation.toFixed(1) + "↷");
    } else {
        $("#elevation").html(elevation.toFixed(0) + "↷");
    }

    // show actions button
    $(".save").removeClass("hidden");

}



/**
 * Filter invalid key pressed by the user
 *
 * @param {string} a - html input object from where the event is triggered
 * @param {string} e - keypress event
 * @returns {event} - empty event if we don't want the user input
 */
function filterInput(a, e) {
    var chrTyped;
    var chrCode = 0;
    var evt = e ? e : event;

    if (evt.charCode !== null) { chrCode = evt.charCode; } else if (evt.which !== null) { chrCode = evt.which; } else if (evt.keyCode !== null) { chrCode = evt.keyCode; }

    if (chrCode === 0) { chrTyped = 'SPECIAL KEY'; } else { chrTyped = String.fromCharCode(chrCode); }


    // If there is already a letter in the input.value, prevent the keypress
    // Disabled for now, it prevents overwritting a keypad without erasing it completly first
    // Could be enabled if it check first if the whole input is selected
    /*
    if (chrTyped.match(/[A-z]/)){
      if(a.value[0] != undefined){
        if(a.value[0].match(/[A-z]/)){
          console.log('there is already a letter');
          evt.returnValue=false;
          return false;
        }
        return true;
      }
    }
    */

    //Letters, Digits, special keys & backspace [\b] work as usual:
    if (chrTyped.match(/\d|[\b]|SPECIAL|[A-Za-z]/)) { return true; }
    if (evt.altKey || evt.ctrlKey || chrCode < 28) { return true; }

    //Any other input Prevent the default response:
    if (evt.preventDefault) { evt.preventDefault(); }
    console.log('forbidden character');
    evt.returnValue = false;
    return false;
}



/**
 * showError
 * @param {string} msg - error message to be displayed
 * @param {string} issue - mortar/target/both
 */
function showError(msg, issue) {

    if (issue === 'mortar') {
        $("#mortar-location").addClass("error2");
    } else if (issue === 'target') {
        $("#target-location").addClass("error2");
    } else {
        $("#target-location").addClass("error2");
        $("#mortar-location").addClass("error2");
    }


    // Rework the #setting div to display a single message
    $("#bearing").addClass("hidden").removeClass("pure-u-10-24");
    $("#elevation").addClass("hidden").removeClass("pure-u-10-24");
    $("#errorMsg").removeClass("pure-u-4-24").addClass("pure-u-24-24").addClass("errorMsg").html(msg);

    // remove the pointer cursor & tooltip
    $("#copy").removeClass("copy");
    tooltip_copy.disable();



    // https://youtu.be/PWgvGjAhvIw?t=233
    $("#settings").addClass("error").effect("shake");


    console.log(msg);
}


/**
 * Load the maps from data.js to the menu
 */
function loadMaps() {
    var i;
    const DROPBTN = $(".dropbtn");

    // Initiate select2 object (https://select2.org/)
    $('.dropbtn').select2({
        dropdownCssClass: 'dropbtn',
        dropdownParent: $('#mapSelector'),
        minimumResultsForSearch: -1, // Disable search
        placeholder: 'SELECT A MAP'
    });

    // load maps into select2
    for (i = 0; i < MAPS.length; i += 1) {
        DROPBTN.append('<option value="' + i + '">' + MAPS[i][0] + '</option>');
    }
}


/**
 * Draw the selected Heatmap in a hidden canvas
 */
$(".dropbtn").change(function() {
    drawHeatmap();
});


/**
 * Copy calcs to clipboard
 */
$("#copy").click(function() {

    // if there is any error, skip copying and move on
    if (!$("#copy").hasClass('copy')) { return 1; }

    const el = document.createElement('textarea');
    el.value = "➜ " + $("#target-location").val() + " = " + $("#bearing").text() + " - " + $("#elevation").text();
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    $(".copy").effect("bounce", 500);

    console.log("copied ! : " + el.value);

    // the user understood he can click2copy, remove the tooltip
    stopInfoTooltips = true;
    tooltip_copy.disable();
    tooltip_copied.enable();
    tooltip_copied.show();
});


/**
 * Save a keypad
 */
$(".save").click(function() {
    var i;
    var target;

    if ($(".saved_list p").length === 3) {
        $(".saved_list p").first().remove();
    }

    target = $("#target-location").val();

    for (i = 0; i < 11 - target.length; i += 1) {
        target = target + "&nbsp;";
    }

    $(".saved_list").append("<p style='display:none;'>" +
        " ➜ " +
        target +
        " : " +
        "<span style=\"font-weight:bold\">" +
        $("#bearing").text() +
        " - " +
        $("#elevation").text() +
        "&nbsp;&nbsp;</span><i class=\"fa fa-times-circle fa-fw del\" aria-hidden=\"true\" onclick=\"RemoveSaves(this)\"></i></p>");

    $(".saved").removeClass("hidden");
    $(".save").effect("bounce", 500);

    $(".saved_list p").last().show("fast");

    // the user understood he can click2copy, remove the tooltip now
    tooltip_save.disable();

});

/**
 * Remove a saved keypad
 *  * @param {object} a - saved calcs to remove
 */
function RemoveSaves(a) {

    // remove list if it's empty
    if ($(".saved_list p").length === 1) {
        $(".saved").addClass("hidden");
    }

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
    const C = $("#mortar-location").val().length;
    const D = $("#target-location").val().length;

    a = a.length;
    b = b.length;


    // if the keypads.lenght is <3, do nothing.
    // Otherwise we guess if the user is deleting or adding something
    // and ajust the cursor considering MSMC added/removed a '-'

    if (startA >= 3) {
        if (a > C) {
            startA -= 1;
        } else {
            startA += 1;
        }
    }

    if (startB >= 3) {
        if (b > D) {
            startB -= 1;
        } else {
            startB += 1;
        }
    }

    $("#mortar-location")[0].setSelectionRange(startA, startA);
    $("#target-location")[0].setSelectionRange(startB, startB);

}


/**
 * Generate random id
 * @param {Number} length - length of desired string to be returned
 * @returns {String} randomly generated string
 */
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    var i;

    for (i = 0; i < length; i += 1) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}


/**
 * Give Inputs random name to browser autocomplete
 */
function preventAutocomplete() {
    $("#mortar-location").attr('name', makeid(10));
    $("#target-location").attr('name', makeid(10));
    $(".dropbtn").attr('name', makeid(10));
}