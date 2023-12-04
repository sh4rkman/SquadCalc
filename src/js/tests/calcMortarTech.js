/* jshint ignore:start */
/**
 * CONSTANTS
 */


const table = [
    [100, 0.5],
    [200, 1.2],
    [300, 2.1],
    [400, 3.1],
    [500, 3.9],
    [600, 5.8],
    [700, 7.5],
    [800, 8.8],
    [900, 10],
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
    [2000, 32],
    [2050, 35.3],
    [2100, 38.1],
    [2143, 43.5],
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
    [100, 0.5],
    [200, 1.2],
    [300, 2.1],
    [400, 3.1],
    [500, 3.9],
    [600, 5.8],
    [700, 7.5],
    [800, 8.8],
    [900, 10],
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
    [2000, 32],
    [2050, 35.3],
    [2100, 38.1],
    [2143, 43.5],
];

const hell_table = [
    [150, 85],
    [200, 83.5],
    [300, 80.5],
    [400, 77],
    [500, 73.5],
    [600, 70],
    [700, 65],
    [800, 60],
    [875, 55],
    [900, 50],
    [925, 45],
];

const tech_table = [
    [50, 83.8],
    [100, 82.9],
    [200, 80.5],
    [300, 78],
    [400, 75.7],
    [500, 73.2],
    [600, 70.5],
    [700, 68],
    [800, 65],
    [900, 62],
    [1000, 58.4],
    [1100, 53.8],
    [1200, 48.2],
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
    var vel = Math.sqrt((x * x * g) / (x * Math.sin(2 * rad)));
    //vel = vel + 0.5 * 2 * -20
    return vel;
}

function getVelS5(x, rad) {
    var time = getTime(x, rad)
    time = time * 200 + 0.5 * 2 * -50
    return getVel(test, rad)
}

// get angle to hit target at distance x and height y with velocity v
function findAngle(x, y, v) {
    const p1 = Math.sqrt(v ** 4 - g * (g * x ** 2 + 2 * y * v ** 2));

    const a1 = Math.atan((v ** 2 - p1) / (g * x));
    // const a1 = Math.atan((v ** 2 + p1) / (g * x));
    return a1;
}



/**
 * LOGIC
 */

console.log(`Gathering velocities...`);
console.log(`===============================================`);

// get velocity per table row
const velocities = [];
const deviations = [];

table.forEach((entry) => {
    const tDistance = entry[0];
    const tAngle = entry[1];
    const v = getVel(tDistance, degToRad(tAngle));
    velocities.push(v);
    console.log(`${tDistance}m\t${tAngle.toFixed(1)}° => ${v}`);
});

// cut off first and last entries, might result in more accurate average
const slicedVelocities = velocities.slice(1, velocities.length - 2);
//const slicedVelocities = velocities

//const slicedVelocities = velocities;
// calculate average velocity
let avgVel = slicedVelocities.reduce((acc, sum) => acc + sum) / slicedVelocities.length;
//let avgVel = 300;

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
    deviations.push(deviation)
    const dFormatted = (deviation < 0 ? "-" : "+") + (isNaN(deviation) ? 'X.XX' : Math.abs(deviation).toFixed(2));

    console.log(
        `${tDistance}m\t${tAngle.toFixed(1)}° | ${elFormatted}° | ${dFormatted}°`,
    );
});
var slicedDeviations = deviations.slice(1, deviations.length - 2);
var avgDev = slicedDeviations.reduce((acc, sum) => acc + sum) / slicedDeviations.length;
console.log(`average deviation: ${avgDev}`);