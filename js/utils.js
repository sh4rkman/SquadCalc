
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
    var map = $(".dropbtn option:selected").text().toLowerCase();
    
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
    var pos;
    while (i < parts.length) {
      if (i === 0) {
        // special case, i.e. letter + number combo
        const letterCode = parts[i].charCodeAt(0);   
        const letterIndex = letterCode - 65;
        if(parts[i].charCodeAt(0) < 65){
          pos = {
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


    if($("#radio-one").is(':checked')){
      return radToMil(a1);
    }
    else { 
      return radToDeg(a1);
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

    // if user didn't select map, no height calculation
    if($(".dropbtn").val() == "") return 0; 
  
    // load map size for scaling lat&lng
    var mapScale = 250 / maps[$(".dropbtn").val()][1];
  
    // Read Heightmap values for a & b
    var ctx = document.getElementById('canvas').getContext('2d');
    var Aheight = ctx.getImageData(Math.round(a.lat*mapScale), Math.round(a.lng*mapScale), 1, 1).data;
    var Bheight = ctx.getImageData(Math.round(b.lat*mapScale), Math.round(b.lng*mapScale), 1, 1).data;
  
    // Check if a & b arn't out of canvas
    if(Aheight[3]==0){
      return 998;
    }
    if(Bheight[3]==0){
      return 999;
    }
  
    Aheight = (255 + Aheight[0] - Aheight[2])*maps[$(".dropbtn").val()][2];
    Bheight = (255 + Bheight[0] - Bheight[2])*maps[$(".dropbtn").val()][2];
  
    return Bheight-Aheight;
  }
  
  /**
   * Calculates the distance elevation and bearing
   * @returns {target} elevation + bearing
   */
  function shoot() {
  
    // First, reset any errors
    $("#settings").removeClass("error");
    $("#target-location").removeClass("error2");
    $("#mortar-location").removeClass("error2");

    $("#bearing").removeClass("hidden");
    $("#elevation").removeClass("hidden");
    $("#bearing").addClass("pure-u-10-24");
    $("#elevation").addClass("pure-u-10-24");
    $("#errorMsg").addClass("pure-u-4-24");
    $("#errorMsg").removeClass("errorMsg");
    $("#errorMsg").removeClass("pure-u-24-24");
    $("#errorMsg").html("-");


    // store current cursor positions on input
    var startA = $("#mortar-location")[0].selectionStart;
    var startB = $("#target-location")[0].selectionStart;

    // store current keypads
    a = $("#mortar-location").val();
    b = $("#target-location").val();

    // format keypads
    $("#mortar-location").val(formatKeyPad(a));
    $("#target-location").val(formatKeyPad(b));
  
    // restore cursor position
    setCursor(startA, startB, a, b);

    // If keypads are imprecises, do nothing
    if (a.length < 3 || b.length < 3) {
      $("#bearing").html("xxx°");
      $("#elevation").html("xxxx∡");
      return 1
    }
    
    a = getPos(a);
    b = getPos(b);
  
    if(isNaN(a.lng) || isNaN(b.lng)){

      if(isNaN(a.lng) && isNaN(b.lng)){
        console.log('Invalid mortar and target');
        showError("Invalid mortar and target");
      } else if(isNaN(a.lng)){
        console.log('Invalid mortar');
        showError("Invalid mortar", "mortar");
      } else {
        console.log('Invalid target');
        showError("Invalid target", "target");   
      }
      return 1
    }
  
  
    var height = getHeight(a, b);

    // Check if mortars/target are out of map
    if((height == 998) || (height == 999)){

      if(height == 998){
        console.log('Mortar are out of map');
        showError("Mortar are out of map", "mortar");
      } else {
        console.log('Target is out of map');
        showError("Target is out of map", "target");
      }
      return 1
    }
  
  
    var distance = getDist(a, b);

    var elevation;

    // Classical calc for mortar
    if($("#radio-one").is(':checked')){
      elevation = getElevation(distance, height);
    }
    else { // If technical mortar
      
      for (var i = 0; i < technicals.length; i++) {
        if(distance<technicals[i][0]){
          var h = technicals[i-1][0];
          var v = technicals[i-1][1];
          var H = technicals[i][0];
          var V = technicals[i][1];

          // Ajust the velocity based on ingame-value
          var vel = v + ((distance - h)/(H-h))*(V-v);
          elevation = getElevation(distance, height, vel);
          break;
        }
      }

    }

    var bearing = getBearing(a, b);
  
    // If Target too far, display it and exit function
    if(isNaN(elevation)){
      console.log("Target is too far : " + distance.toFixed(0)+"m");
      showError("Target is out of range : " + distance.toFixed(0)+"m", "target");
      return 1
    }
  
    // If Target too close, display it and exit function
    if(distance<=50){
      console.log("Target is too close : " + distance.toFixed(0)+"m");
      showError("Target is too close : " + distance.toFixed(0)+"m", "target");
      return 1
    }
    
    // if in range, Insert Calculations
    console.clear();
    console.log($("#mortar-location").val().toUpperCase() + " -> " + $("#target-location").val().toUpperCase());
    console.log("-> Bearing: " + bearing.toFixed(1) + "° - Elevation: " + elevation.toFixed(1) + "∡");
    console.log("-> Distance: " + distance.toFixed(0) + "m - height: " + height.toFixed(0) + "m")
    
    $("#bearing").html(bearing.toFixed(1) + "°");
    
    // If using technical mortars, we need to be more precise (##.#)
    if($("#radio-one").is(':checked')){
      $("#elevation").html(elevation.toFixed(0) + "∡");
    }
    else {
      $("#elevation").html(elevation.toFixed(1) + "∡");
    }
    
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
    if (chrTyped.match(/\d|[\b]|SPECIAL|[A-Za-z]/)) return true;
    if (evt.altKey || evt.ctrlKey || chrCode<28) return true;
  
    //Any other input Prevent the default response:
    if (evt.preventDefault) evt.preventDefault();
    console.log('forbidden character');
    evt.returnValue=false;
    return false;
  }
   

  
   /**
   * showError
   * @param {string} msg - error message to be displayed
   * @param {string} issue - mortar/target/both
   */
  function showError(msg, issue) {

    if(issue == 'mortar') {
      $("#mortar-location").addClass("error2");
    }
    else if(issue == 'target') {
      $("#target-location").addClass("error2");
    }
    else {
      $("#target-location").addClass("error2");
      $("#mortar-location").addClass("error2");
    }


    // Rework the #setting div to display a single message
    $("#bearing").addClass("hidden");
    $("#elevation").addClass("hidden");
    $("#bearing").removeClass("pure-u-10-24");
    $("#elevation").removeClass("pure-u-10-24");
    $("#errorMsg").removeClass("pure-u-4-24");
    $("#errorMsg").addClass("pure-u-24-24");
    $("#errorMsg").addClass("errorMsg");

    // insert error message
    $("#errorMsg").html(msg);

    // https://youtu.be/PWgvGjAhvIw?t=233
    $("#settings").addClass("error");
    $("#settings").effect("shake");

  }
    
  
  
  /**
  * Load the maps from data.js to the menu
  */
  function loadMaps() {

    // Initiate select2 object (https://select2.org/)
    $('.dropbtn').select2({
      placeholder: 'SELECT A MAP',
      dropdownParent: $('#mapSelector'),
      dropdownCssClass: 'dropbtn',
      minimumResultsForSearch: -1, // Disable search for better Xperience for mobile users
    });

    // load maps into select2
    for(var i=0 ; i < maps.length; ++i){
      $(".dropbtn").append('<option value="' + i + '">'+ maps[i][0] + '</option>');
    }
  }

  // Event to initiate a placeholder for select2
  /*
  $('.dropbtn').one('select2:open', function(e) {
    $('input.select2-search__field').prop('placeholder', 'search');
  });
  */
   
  /**
   * Draw the selected Heatmap in a hidden canvas
   */
  $(".dropbtn").change(function(){
    drawHeatmap();
  });


 /**
  * Set the cursor at the correct position after MSMC messed with the inputs by reformating its values
  * @param {string} startA - cursor position on mortar
  * @param {string} startB - cursor position on target
  * @param {string} a - previous mortar coord before reformating
  * @param {string} b - previous tardget coord before reformating
  */
  function setCursor(startA, startB, a, b) {

    a = a.length;
    b = b.length;
    c = $("#mortar-location").val().length;
    d = $("#target-location").val().length;

    // if the keypads.lenght is <3, do nothing.
    // Otherwise we guess if the user is deleting or adding something
    // and ajust the cursor considering MSMC added/removed a '-'

    if(startA >=3){
      if(a > c) {
        startA--;
      }
      else {
        startA++; 
      }
    }

    if(startB >=3){
      if(b > d) {
        startB--;
      }
      else {
        startB++;    
      }
    }

    $("#mortar-location")[0].setSelectionRange(startA, startA);
    $("#target-location")[0].setSelectionRange(startB, startB);

  }
