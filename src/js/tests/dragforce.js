/* jshint ignore:start */
// Define the parameters
const v0 = 95; // m/s
const g = 9.81; // m/s^2
const rho = 1.2; // kg/m^3
const Cd = 0.04; // Drag coefficient
const A = Math.PI * Math.pow(0.016, 2); // m^2 (object radius)
const m = 7; // kg (mass of the projectile)
let x = 0; // distance to start shooting
const tol = 1; // error tolerance
const maxDistance = rangeFunction(Math.PI / 4.0).toFixed(0);

const HELLMORTAR = {
    v0: 95,
    m: 7, //40kg from sdk
    minDistance: 150,
    radius: 0.016, //32 from sdk
    dragCoef: 0.04,
}

const TECHNICAL = {
    v0: 110,
    m: 4,
    minDistance: 100,
    radius: 0.016,
    dragCoef: 0.04,
}

// Define the function to find the horizontal range
function rangeFunction(theta) {
    const v0x = v0 * Math.cos(theta);
    const v0y = v0 * Math.sin(theta);
    const tFlight = 2.0 * v0y / g;
    const xRange = v0x * tFlight - (1.0 / 2.0) * (rho / m) * Cd * A * Math.pow(v0x, 2) * Math.pow(tFlight, 2);
    return xRange - x;
}

function calc() {
    // Use bisection to find the launch angle 
    let thetaLeft = Math.PI / 2.0; // 90°
    let thetaRight = 0.0; // 0°
    let thetaMid = (thetaLeft + thetaRight) / 2.0;
    while (Math.abs(rangeFunction(thetaMid)) > tol) {

        //console.log(Math.abs(rangeFunction(thetaMid)))

        if (Math.abs(rangeFunction(thetaMid)) > maxDistance) { return; }

        if (rangeFunction(thetaLeft) * rangeFunction(thetaMid) < 0) {
            thetaRight = thetaMid;
        } else {
            thetaLeft = thetaMid;
        }
        thetaMid = (thetaLeft + thetaRight) / 2.0;
    }

    // Output the result
    console.log(`| ${x} m |${(thetaMid * 180.0 / Math.PI).toFixed(1)} degrees|`);
}



console.log("--------------------------");
console.log("Max distance: " + maxDistance + "m");
console.log("--------------------------");

console.log("|DISTANCE|  DEGREE  |");
for (let i = 0; i < maxDistance; i++) {
    calc();
    x += 50;
}
x = maxDistance
calc()