/* jshint ignore:start */
// TABLES
const squadTable = [
    [50, 1579],
    [100, 1558],
    [150, 1538],
    [200, 1517],
    [250, 1496],
    [300, 1475],
    [350, 1453],
    [400, 1431],
    [450, 1409],
    [500, 1387],
    [550, 1364],
    [600, 1341],
    [650, 1317],
    [700, 1292],
    [750, 1267],
    [800, 1240],
    [850, 1212],
    [900, 1183],
    [950, 1152],
    [1000, 1118],
    [1050, 1081],
    [1100, 1039],
    [1150, 988],
    [1200, 918],
    [1250, 800],
];

const HELL = [
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

const MLRS = [
    [900, 136.176547],
    [1000, 132.382998],
    [1100, 133.837516],
    [1200, 130.112201],
    [1300, 130.932658],
    [1400, 129.418033],
    [1500, 126.850910],
    [1600, 127.718030],
    [1650, 127.161315],
];

const TECH = [
    [50, 83.8],
    [100, 82.9],
    [200, 80.5],
    [300, 78.0],
    [400, 75.7],
    [500, 73.2],
    [600, 70.5],
    [700, 68.0],
    [800, 65.0],
    [900, 62.0],
    [1000, 58.4],
    [1100, 53.8],
    [1200, 48.2],
    [1250, 40.0],
];




const tables = [
    // ["CLAS", squadTable],
    ["HELL", HELL],
    // ["TECH", TECH],
];

// gravity
const g = 9.8;

// deg to mil factor
// "1mil = 1/6400 of a circle in NATO countries."
const milF = 360 / 6400; // deg to mil factor

// conversions
function milToDeg(mil) {
    return mil * milF;
}

function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

function degToMil(deg) {
    return deg / milF;
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

// my own attempt. same result, but requires two calculations
// 1. calculate time for shell to reach target
// 2. calculate velocity using time
// eslint-disable-next-line no-unused-vars
function getVelOld(x, rad) {
    const t = getTime(x, rad);
    const r = x / (Math.cos(rad) * t);

    return r;
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

// get angle needed to hit target at distance x with velocity v
// eslint-disable-next-line no-unused-vars
function getAngle(x, v) {
    const a = 0.5 * Math.asin((g * x) / (v * v));
    return a;
}

// function getAngle2(x, v) {
//   return Math.atan(v * v - (Math.sqrt(v * v * v * v - g * g * x * x) / g) * x);
// }

// get angle to hit target at distance x and height y with velocity v
function findAngle(x, y, v) {
    const p1 = Math.sqrt(v ** 4 - g * (g * x ** 2 + 2 * y * v ** 2));
    //const a1 = Math.atan((v ** 2 + p1) / (g * x));
    // a2 is always below 800 mil -> can't be used in the game
    const a1 = Math.atan((v ** 2 - p1) / (g * x));

    return a1;
}

// get angle to hit target at distance x and height y with velocity v
function findAngle2(x, y, v) {
    const p1 = Math.sqrt(v ** 4 - g * (g * x ** 2 + 2 * y * v ** 2));
    const a1 = Math.atan((v ** 2 + p1) / (g * x));
    // a2 is always below 800 mil -> can't be used in the game
    //const a1 = Math.atan((v ** 2 - p1) / (g * x));

    return a1;
}

// zero-pad number
function pad(num, size) {
    return `000000000${num}`.substr(-size);
}

// max velocity decimal precision, up to which algorithm tries to optimize deviation from table
const maxPrecision = 2;

// main

const startTime = Date.now();

tables.forEach((t) => {
    const tName = t[0];
    const tTable = t[1];

    console.log(`${tName}: Gathering velocities...`);
    console.log(`${tName}: ===============================================`);

    // get velocity per table row
    const velocities = [];
    tTable.forEach((entry) => {
        const tDistance = entry[0];
        const tAngle = entry[1];

        if (tName === 'HELL' || tName === 'TECH') {
            var v = getVel(tDistance, degToRad(tAngle));
            console.log(`${tName}: ${pad(tDistance, 4)}m ${pad(tAngle, 4)}° => ${v.toFixed(maxPrecision)}`);
        } else if (tName === "CLAS") {
            var v = getVel(tDistance, milToRad(tAngle));
            console.log(`${tName}: ${pad(tDistance, 4)}m ${pad(tAngle, 4)}mil => ${v.toFixed(maxPrecision)}`);
        } else {
            console.log(`${tName}: ${pad(tDistance, 4)}m ${pad(tAngle, 4)}mil => ${v.toFixed(maxPrecision)}`);
            var v = getVel(tDistance, tAngle);
        }

        velocities.push(v);

    });

    // cut off first and last entries, might result in more accurate average
    const slicedVelocities = velocities.slice(1, velocities.length - 2);

    // calculate average velocity
    let avgVel = slicedVelocities.reduce((acc, cur) => acc + cur) / slicedVelocities.length;

    console.log(`${tName}: ===============================================`);
    console.log(`${tName}: average velocity: ${avgVel.toFixed(maxPrecision)}`);
    console.log(`${tName}: maximum distance: ${getDist(avgVel, milToRad(800)).toFixed(2)}`);
    console.log(`${tName}: ===============================================`);
    console.log(`${tName}: Minimizing deviation...`);
    console.log(`${tName}: ===============================================`);

    // initial average deviation to a value other than 0
    let avgDev = Number.MAX_VALUE;

    // deviation and velocity of previous loop
    let lAvgDev = avgDev;
    let lAvgVel = avgVel;

    // initial precision
    let curPrecision = 1;

    // loop until deviation can't be further optimized without going beyond velocity decimal precision
    while (true) {
        const step = 1 / 10 ** curPrecision;
        avgVel += avgDev >= 0 ? +step : -step;

        // get deviation per table row
        const deviations = [];
        // eslint-disable-next-line no-loop-func
        tTable.forEach((entry) => {
            const tDistance = entry[0];
            const tAngle = entry[1];

            if (tName === 'HELL' || tName === 'TECH') {
                estimatedAngle = radToDeg(findAngle2(tDistance, 0, avgVel));
            } else if (tName === "CLAS") {
                estimatedAngle = radToMil(findAngle2(tDistance, 0, avgVel));
            } else {
                estimatedAngle = radToMil(findAngle(tDistance, 0, avgVel));
            }

            const d = tAngle - estimatedAngle;
            deviations.push(d);
        });

        // cut off first and last entries, might result in more accurate average
        const slicedDeviations = deviations.slice(1, deviations.length - 2);

        // calculate average deviation
        avgDev = slicedDeviations.reduce((acc, cur) => acc + cur) / slicedDeviations.length;

        if (Math.abs(avgDev) <= Math.abs(lAvgDev)) {
            // if new deviation is smaller than previous, save velocity and deviation and loop again
            console.log(
                `${tName}: ${pad(curPrecision, 2)} | ${avgVel.toFixed(maxPrecision)} | ${Math.abs(avgDev).toFixed(
            maxPrecision + 1,
          )}`,
            );
            lAvgVel = avgVel;
            lAvgDev = avgDev;
        } else if (curPrecision < maxPrecision) {
            // if deviation is bigger, increase precision and reuse velocity from previous loop
            curPrecision++;
            avgVel = lAvgVel;
            avgDev = lAvgDev;
        } else {
            // max precision reached, break loop
            break;
        }
    }
    console.log(`${tName}: ===============================================`);
    console.log(`${tName}: FINAL VELOCITY     : ${lAvgVel.toFixed(maxPrecision)}`);
    console.log(`${tName}: FINAL AVG DEVIATION: ${lAvgDev.toFixed(maxPrecision + 1)}`);
    console.log(`${tName}: FINAL MAX RANGE    : ${getDist(lAvgVel, milToRad(800)).toFixed(2)}`);
    console.log(`${tName}: ===============================================`);
    console.log(`${tName}: Generating overview...`);
    console.log(`${tName}: ===============================================`);
    console.log(`${tName}:  DIST  T-ANG  |   E-ANG   |   DEV   |    VEL`);
    console.log(`${tName}: --------------|-----------|---------|----------`);

    // iterate through table yet again, printing table values,
    // calculated values based on optimized velocity, and deviation from table
    tTable.forEach((entry) => {
        const tDistance = entry[0];
        const tAngle = entry[1];
        var estimatedAngle
        var eAFormatted;
        var d;

        if (tName === 'HELL' || tName === 'TECH') {
            var v = getVel(tDistance, degToRad(tAngle));
            estimatedAngle = radToDeg(findAngle2(tDistance, 0, avgVel));
            eAFormatted = pad(estimatedAngle.toFixed(1), 6);
            d = tAngle - estimatedAngle;

        } else if (tName === "CLAS") {
            var v = getVel(tDistance, milToRad(tAngle));
            estimatedAngle = radToMil(findAngle2(tDistance, 0, avgVel));
            eAFormatted = pad(estimatedAngle.toFixed(1), 6);
            d = tAngle - estimatedAngle;
        } else {
            var v = getVel(tDistance, tAngle);
            estimatedAngle = findAngle(tDistance, 0, avgVel);
            eAFormatted = pad(estimatedAngle.toFixed(1), 6);
            d = tAngle - estimatedAngle;
        }


        const dFormatted = pad(Math.abs(d).toFixed(2), 5)


        if (tName === 'HELL' || tName === 'TECH') {
            console.log(`${tName}: ${pad(tDistance, 4)}m ${pad(tAngle, 4)}deg | ${pad(eAFormatted, 6)}deg | d=${dFormatted} | v=${v.toFixed(3)}`);
        } else if (tName === "CLAS") {
            console.log(`${tName}: ${pad(tDistance, 4)}m ${pad(tAngle, 4)}mil | ${pad(eAFormatted, 6)}mil | d=${dFormatted} | v=${v.toFixed(3)}`);
        } else {
            console.log(`${tName}: ${pad(tDistance, 4)}m ${pad(tAngle, 4)}mixdfdfdfdfl | ${pad(eAFormatted, 4)}mdfdfdil | d=${dFormatted} | v=${v.toFixed(3)}`);
        }



    });
});
console.log(`done after ${Date.now() - startTime}ms`);