// Each map has a different size and require scaling w, y and z when calculating height
// Map['Name', size, z-scaling]
var maps = [
  ['Al Basrah', 3200, 0.47],
  ['Belaya', 3904, 0.5],
  ['Chora', 4064, 0.06],
  ['FoolsRoad', 1736, 0.149],
  ['Gorodok', 4340, 0.13],
  ['Kamdesh', 4032, 0.2],
  ['Kohat', 4017, 0.777],
  ['Kokan', 2496, 0.01],
  ['Lashkar', 4334, 0.28],
  ['Logar', 1761, 0.14],
  ['Mestia', 2400, 0.4],
  ['Mutaha', 2755, 0.4],
  ['Narva', 2800, 0.057],
  ['Skorpo', 7600, 0.4],
  ['Sumari', 1300, 0.037],
  ['Tallil', 4680, 0.055],
  ['Yehorivka', 5000, 0.29]
];

function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

$("li").click(function(){
  $("#selectbox").html($(this).text());
  $("#selectbox").val($(this).val());
  drawHeatmap();
  });

$(document ).ready(function() {
  $("#version").html("v2.8"); // set version
  loadHeatmap();
  console.log("Calculator Loaded!");
});

/**
 * Load the heatmap to the canvas
 */
function loadHeatmap() {
  img = new Image();   // Create new img element
  img.addEventListener('load', function() { 
    var ctx = document.getElementById('canvas').getContext('2d');
    ctx.drawImage(img, 0, 0, 250, 250); // Draw img at good scale
  }, false);
}

/**
 * Draw the selected Heatmaps in a hidden canvas
 */
function drawHeatmap(){
  var img = new Image();   // Create new img element
  var map = $("#selectbox").text().toLowerCase();
  
  img.addEventListener('load', function() { // wait for the image to load or it does crazy stuff
    var ctx = document.getElementById('canvas').getContext('2d');
    ctx.drawImage(img, 0, 0, 250, 250); 
    shoot(); // just in case there is already coordinates
  }, false);
  img.src = './img/heightmaps/'+map+'.jpg'; // Set source path
}



/**
 * Returns the latlng coordinates based on the given keypad string.
 * Supports unlimited amount of sub-keypads.
 * Throws error if keypad string is too short or parsing results in invalid latlng coordinates.
 * @param {string} kp - keypad coordinates, e.g. "A02-3-5-2"
 * @returns {LatLng} converted coordinates
 */
function getPos(kp) {

  const fkp = formatKeyPad(kp);
  if (!fkp || fkp.length < 2) {
    console.log(`invalid keypad string: ${fkp}`);
  }
  const parts = fkp.split("-");
  let x = 0;
  let y = 0;

  // "i" is is our (sub-)keypad indicator
  let i = 0;
  while (i < parts.length) {
    if (i === 0) {
      // special case, i.e. letter + number combo
      const letterCode = parts[i].charCodeAt(0);   
      const letterIndex = letterCode - 65;
      if(parts[i].charCodeAt(0) < 65){
        var pos = {
          lat: NaN,
          lng: NaN
        };
        return pos
      }
      const kpNr = Number(parts[i].slice(1)) - 1;
      x += 300 * letterIndex;
      y += 300 * kpNr;

    } else {
      // opposite of calculations in getKP()
      const sub = Number(parts[i]);
      if (Number.isNaN(sub)) {
        console.log(`invalid keypad string: ${fkp}`);
      }
      const subX = (sub - 1) % 3;
      const subY = 2 - (Math.ceil(sub / 3) - 1);

      const interval = 300 / 3 ** i;
      x += interval * subX;
      y += interval * subY;
    }
    i += 1;
  }

  // at the end, add half of last interval, so it points to the center of the deepest sub-keypad
  const interval = 300 / 3 ** (i - 1);
  x += interval / 2;
  y += interval / 2;
  var pos = {
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

    // If empty string, return
    if(text.length==0){return;}

    // special case if people prefer to input "A2-3-4" over "A0234"
    // check if length is 3 and third letter is a dash, then just convert to padded
    if (text.length === 3 && text[2] === "-") {
      text = text[0] + pad(text[1], 2);
    }
    const textND = text
      .toUpperCase()
      .split("-")
      .join("");
    const textParts = [];
  
    textParts.push(textND.slice(0, 3));
  
    // iteration through sub-keypads
    let i = 3;
    while (i < textND.length) {
      textParts.push(textND.slice(i, i + 1));
      i += 1;
    }

    return textParts.join("-");

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
  let bearing = Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180 / Math.PI;

  // Point it north
  bearing = bearing+90;

  // Avoid Negative Angle by adding a whole rotation
  if(bearing<0) bearing += 360;

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
 * Converts degrees into radians
 * @param {number} deg - degrees
 * @returns {number} radians
 */
function degToRad(deg) {
  return (deg * Math.PI) / 180;
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
  return deg / (360/6400);
}

/**
 * Calculates the distance between two points.
 * @param {LatLng} a - point A
 * @param {LatLng} b - point B
 * @returns {number} distance A and B
 */
 function getDist(a, b) {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Calculates the angle the mortar needs to be set,
 * in order to hit the target at the desired distance and vertical delta.
 * @param {number} x - distance between mortar and target from getDist()
 * @param {number} [y] - vertical delta between mortar and target from getHeight()
 * @param {number} [v] - initial mortar projectile velocity (109.890938)
 * @param {number} [g] - gravity force (9.8)
 * @returns {number || NaN} mil if target in range, NaN otherwise
 */
function getElevation(x, y = 0, v = 109.890938, g = 9.8) {
  const p1 = Math.sqrt(v ** 4 - g * (g * x ** 2 + 2 * y * v ** 2));
  const a1 = Math.atan((v ** 2 + p1) / (g * x));
  // const a2 = Math.atan((v ** 2 - p1) / (g * x));
  // no need to calculate, angle is always below 45°/800mil
  return radToMil(a1);
}

/**
 * Calculates the height difference between mortar and target
 *
   * @param {Number} a - {lat;lng} where mortar is
   * @param {Number} b - {lat;lng} where target is
   * @returns {number} - relative height in meters
 */
function getHeight(a, b) {
  if($("#selectbox").val() == 99) return 0; // if user didn't select map, no height calculation

  // load map size for scaling lat&lng
  var mapScale = 250 / maps[$("#selectbox").val()][1];

  // Read Heightmap values for a & b
  var ctx = document.getElementById('canvas').getContext('2d');
  var Aheight = ctx.getImageData(Math.round(a.lat*mapScale), Math.round(a.lng*mapScale), 1, 1).data;
  var Bheight = ctx.getImageData(Math.round(b.lat*mapScale), Math.round(b.lng*mapScale), 1, 1).data;

  Aheight = (255 + Aheight[0] - Aheight[2])*maps[$("#selectbox").val()][2];
  Bheight = (255 + Bheight[0] - Bheight[2])*maps[$("#selectbox").val()][2];

  return Bheight-Aheight;
}

/**
 * Calculates the distance between two points.
 *
 * @param {string} a - keypad string where mortar is
 * @param {string} b - keypad string where target is
 * @returns {target} elevation + bearing
 */
function shoot() {
  
  a = $("#mortar-location").val();
  b = $("#target-location").val();
  $("#mortar-location").val(formatKeyPad(a));
  $("#target-location").val(formatKeyPad(b));

  // If keypads are imprecises, reset calcs
  if (a.length < 3 || b.length < 3) {
    console.log('keypad too short');
    $("#bearing").html("xxx°");
    $("#elevation").html("xxxx∡");
    return 1
  }
  
  a = getPos(a);
  b = getPos(b);

  if(isNaN(a.lng) || isNaN(b.lng)){
    console.log('Invalid keypads');
    $("#settings").addClass("error");
    $("#bearing").html("xxx°");
    $("#elevation").html("xxxx∡");
    $("#settings").effect("shake");

    if(isNaN(a.lng) && isNaN(b.lng)){
      // Add error on target
      $("#target-location").addClass("error2");
      $("#mortar-location").addClass("error2");
      return 1
    }
    if(isNaN(a.lng)){
      $("#target-location").removeClass("error2");
      $("#target-location").animate({opacity: 1}, 1000);
      $("#mortar-location").addClass("error2");
      return 1
    } else {
      $("#mortar-location").removeClass("error2");
      $("#mortar-location").animate({opacity: 1}, 1000);
      $("#target-location").addClass("error2");
      return 1
    }
  }


  var height = getHeight(a, b);
  var distance = getDist(a, b);

  // If keypad is bad (1C32), distance is NaN
  // Detect it and display wich keypad is faultive 
  if(isNaN(distance)){

    console.log('Invalid keypads');

    if(isNaN(a.lat)||isNaN(a.lng)){
      $("#mortar-location").addClass("error2");
    } else {
      $("#mortar-location").removeClass("error2");
      $("#mortar-location").animate({opacity: 1}, 1000);
    }
    if(isNaN(b.lat)||isNaN(b.lng)){
      $("#target-location").addClass("error2");
    } else {
      $("#target-location").removeClass("error2");
      $("#target-location").animate({opacity: 1}, 1000);
    }

    $("#settings").addClass("error");
    $("#bearing").html("xxx°");
    $("#elevation").html("xxxx∡");
    $("#settings").effect("shake");
    return 1
  }

  var elevation = getElevation(distance, height);
  var bearing = getBearing(a, b);


  // If Target too far, display it and exit function
  if(isNaN(elevation)){
    console.log("Target is too far : " + distance.toFixed(0)+"m !");
    // Remove any mortar error
    $("#mortar-location").removeClass("error2");
    $("#mortar-location").animate({opacity: 1}, 1000);
    // Add error on target & settings
    $("#settings").addClass("error");
    $("#target-location").addClass("error2");
    // Insert bearing and "2far"
    $("#bearing").html(bearing.toFixed(1) + "°");
    $("#elevation").html("2far!");
    $("#settings").effect("shake");
    return 1
  }

  // If Target too close, display it and exit function
  if(distance<=50){
    console.log("Target is too close : " + distance.toFixed(0)+"m !");
    // Remove any mortar error
    $("#mortar-location").removeClass("error2");
    $("#mortar-location").animate({opacity: 1}, 1000);
    // Add error on target & settings
    $("#settings").addClass("error");
    $("#target-location").addClass("error2");
    // Insert bearing and "2close"
    $("#bearing").html(bearing.toFixed(1) + "°");
    $("#elevation").html("2close!");
    $("#settings").effect("shake");
    return 1
  }
  
  // if in range
  console.log($("#mortar-location").val().toUpperCase() + "->" + $("#target-location").val().toUpperCase() + " = " + bearing.toFixed(1) + "° - " + elevation.toFixed(0));

  // Remove Errors
  $("#settings").removeClass("error");
  $("#settings").animate({opacity: 1}, 1000);
  $("#mortar-location").removeClass("error2");
  $("#mortar-location").animate({opacity: 1}, 1000);
  $("#target-location").removeClass("error2");
  $("#target-location").animate({opacity: 1}, 1000);

  // Insert Calculations
  $("#bearing").html(bearing.toFixed(1) + "°");
  $("#elevation").html(elevation.toFixed(0) + "∡");

}

/**
 * Filter invalid key pressed by the user 
 *
 * @param {string} a - html input object from where the event is triggered
 * @param {string} e - keypress event
 * @returns {event} - empty event if we don't want the user input
 */
function filterInput(a, e) {
  var chrTyped, chrCode=0, evt=e?e:event;
  if (evt.charCode!=null)     chrCode = evt.charCode;
  else if (evt.which!=null)   chrCode = evt.which;
  else if (evt.keyCode!=null) chrCode = evt.keyCode;
 
  if (chrCode==0) chrTyped = 'SPECIAL KEY';
  else chrTyped = String.fromCharCode(chrCode);
 
  
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
  if (chrTyped.match(/\d|[\b]|SPECIAL|[A-z]/)) return true;
  if (evt.altKey || evt.ctrlKey || chrCode<28) return true;
 
  //Any other input Prevent the default response:
  if (evt.preventDefault) evt.preventDefault();
  console.log('forbidden character');
  evt.returnValue=false;
  return false;
 }
 
