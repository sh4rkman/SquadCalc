/* jshint ignore:start */
/**
 * CONSTANTS
 */


const table = [
    [1000, 14.7],
    [1050, 15.5],
    [1100, 16.3],
    [1150, 17.2],
    [1200, 18.0],
    [1250, 18.9],
    [1300, 19.8],
    [1350, 20.7],
    [1400, 21.7],
    [1450, 22.7],
    [1500, 23.7],
    [1550, 24.7],
    [1600, 25.9],
    [1650, 25.9],
    [1700, 28.2],
    [1750, 29.6],
    [1800, 31.0],
    [1850, 32.6],
    [1900, 34.4],
    [1950, 36.5],
    [2000, 39.4],
    [2050, 45],
];

// V4.4 ingame table
const gradTable = [
    [1000, 14.7],
    [1050, 15.5],
    [1100, 16.3],
    [1150, 17.2],
    [1200, 18.0],
    [1250, 18.9],
    [1300, 19.8],
    [1350, 20.7],
    [1400, 21.7],
    [1450, 22.7],
    [1500, 23.7],
    [1550, 24.7],
    [1600, 25.9],
    [1650, 25.9],
    [1700, 28.2],
    [1750, 29.6],
    [1800, 31.0],
    [1850, 32.6],
    [1900, 34.4],
    [1950, 36.5],
    [2000, 39.4],
    [2050, 45],
];

// V4.3 ingame table
const oldGrad_table = [
    [900, 14.2],
    [1000, 17],
    [1100, 18.5],
    [1200, 22],
    [1300, 24],
    [1400, 27.5],
    [1500, 33],
    [1600, 37],
    [1650, 45],
]

const UB32_table = [
    [1000, 12],
    [1100, 13.5],
    [1200, 15.5],
    [1300, 16.3],
    [1400, 18.0],
    [1500, 20],
    [1600, 22.5],
    [1700, 25],
    [1800, 27.5],
    [1900, 29.8],
    [1700, 25],
];

// gravity
const g = 9.8 * 2;

// deg to mil factor
// "1mil = 1/6400 of a circle in NATO countries."
const milFNATO = 360 / 6400; // deg to mil factor
const milF = 360 / 6000; // deg to mil factor

// conversions
function milToDeg(mil) {
    return mil * milFNATO;
}

function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

function degToMil(deg) {
    return deg / milFNATO;
}

function radToMil(rad) {
    return degToMil(radToDeg(rad));
}

function milToRad(mil) {
    return degToRad(milToDeg(mil));
}

// calculate time needed to hit target at distance x
function getTime(x, rad) {
    return Math.sqrt((2 * x * Math.tan(rad)) / g);
}


// following functions taken from wikipedia
// https://en.wikipedia.org/wiki/Projectile_motion

// calculate distance based on velocity and angle
function getDist(v, rad) {
    const x = (Math.tan(rad) * 2 * v * v * Math.cos(rad) * Math.cos(rad)) / g;
    return x;
}

// get velocity needed to hit target at distance x with angle a
function getVel(x, rad) {
    const vel = Math.sqrt((x * x * g) / (x * Math.sin(2 * rad)));
    return vel;
}


// get angle to hit target at distance x and height y with velocity v
function findAngle(x, y, v) {
    const p1 = Math.sqrt(v ** 4 - g * (g * x ** 2 + 2 * y * v ** 2));
    const a1 = Math.atan((v ** 2 - p1) / (g * x));

    // a2 is always below 800 mil -> can't be used in the game
    // const a2 = Math.atan((v ** 2 - p1) / (g * x));

    return a1;
}

/**
 * LOGIC
 */

console.log(`Gathering velocities...`);
console.log(`===============================================`);

// get velocity per table row
const velocities = [];
table.forEach((entry) => {
    const tDistance = entry[0];
    const tAngle = entry[1];
    const v = getVel(tDistance, degToRad(tAngle));
    velocities.push(v);
    console.log(`${tDistance}m\t${tAngle.toFixed(1)}° => ${v}`);
});

// cut off first and last entries, might result in more accurate average
//const slicedVelocities = velocities.slice(1, velocities.length - 2);
const slicedVelocities = velocities;
// calculate average velocity
let avgVel = slicedVelocities.reduce((acc, sum) => acc + sum) / slicedVelocities.length;
//let avgVel = 141.74

console.log(`===============================================`);
console.log(`average velocity: ${avgVel}`);
console.log(`maximum distance: ${getDist(avgVel, degToRad(45)).toFixed(2)}`);
console.log(`===============================================`);
console.log(`Generating overview...`);
console.log(`===============================================`);
console.log(` DIST  T-DEG  | F-DEG |  DEV  `);
console.log(`--------------|-------|-------`);

// iterate through table yet again, printing table values + calculated values based on average velocity
table.forEach((entry) => {
    const tDistance = entry[0];
    const tAngle = entry[1];

    const elevation = radToDeg(findAngle(tDistance, 0, avgVel));
    const elFormatted = isNaN(elevation) ? 'XX.X' : elevation.toFixed(1);
    const deviation = tAngle - elevation;
    const dFormatted = (deviation < 0 ? "-" : "+") + (isNaN(deviation) ? 'X.XX' : Math.abs(deviation).toFixed(2));

    console.log(
        `${tDistance}m\t${tAngle.toFixed(1)}° | ${elFormatted}° | ${dFormatted}°`,
    );
});