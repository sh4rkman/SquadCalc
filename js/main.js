
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
      throw new Error(`invalid keypad string: ${fkp}`);
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
        const kpNr = Number(parts[i].slice(1)) - 1;
        x += 300 * letterIndex;
        y += 300 * kpNr;
      } else {
        // opposite of calculations in getKP()
        const sub = Number(parts[i]);
        if (Number.isNaN(sub)) {
          throw new Error(`Invalid keypad string: ${fkp}`);
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
    // special case if people prefer to input "A2-3-4" over "A0234"
    // check if length is 3 and third letter is a dash, then just convert to padded
    if (text.length === 3 && text[2] === "-") {
      // eslint-disable-next-line no-param-reassign
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
  // point it north
  //bearing = (180 - bearing) % 360;
  bearing = bearing+90;

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
 *
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
 *
 * Function taken from https://en.wikipedia.org/wiki/Projectile_motion
 *
 * @param {number} x - distance between mortar and target
 * @param {number} [y] - vertical delta between mortar and target
 * @param {number} [v] - initial mortar projectile velocity
 * @param {number} [g] - gravity force
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
 * Calculates the distance between two points.
 *
 * @param {string} a - keypad string where mortar is
 * @param {string} b - keypad string where target is
 * @returns {target} elevation + bearing
 */
function shoot(a, b) {
  
  a = getPos(a);
  b = getPos(b);

  var bearing = getBearing(a, b);
  var distance = getDist(a, b);
  var elevation = getElevation(distance, 0)

  var settings = {
    bearing: bearing.toFixed(1),
    elevation: elevation.toFixed(1),
    distance: distance.toFixed(1)
  };

  return settings;
}
