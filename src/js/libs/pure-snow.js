let snowflakesCount = 50; // Snowflake count, can be overwritten by attrs
let baseCSS = "";

let bodyHeightPx = null;
let pageHeightVh = null;

function setHeightVariables() {
    bodyHeightPx = document.body.offsetHeight;
    pageHeightVh = (100 * bodyHeightPx / window.innerHeight);
}

// get params set in snow div
function getSnowAttributes() {
    const snowWrapper = document.getElementById("snow");
    snowflakesCount = Number(
        snowWrapper && snowWrapper.dataset && snowWrapper.dataset.count || snowflakesCount
    );
}

// This function allows you to turn on and off the snow
export function showSnow(value) {
    if (value) {
        document.getElementById("snow").style.display = "block";
    }
    else {
        document.getElementById("snow").style.display = "none";
    }
}

// Creating snowflakes
function generateSnow(snowDensity = 200) {
    snowDensity -= 1;
    const snowWrapper = document.getElementById("snow");
    snowWrapper.innerHTML = "";
    for (let i = 0; i < snowDensity; i++) {
        let board = document.createElement("div");
        board.className = "snowflake";
        snowWrapper.appendChild(board);
    }
}

function getOrCreateCSSElement() {
    let cssElement = document.getElementById("psjs-css");
    if (cssElement) return cssElement;

    cssElement = document.createElement("style");
    cssElement.id = "psjs-css";
    document.head.appendChild(cssElement);
    return cssElement;
}

// Append style for each snowflake to the head
function addCSS(rule) {
    const cssElement = getOrCreateCSSElement();
    cssElement.innerHTML = rule; // safe to use innerHTML
    document.head.appendChild(cssElement);
}

// Math
function randomInt(value = 100) {
    return Math.floor(Math.random() * value) + 1;
}

function randomIntRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// Create style for snowflake
function generateSnowCSS(snowDensity = 200) {
    let snowflakeName = "snowflake";
    let rule = baseCSS;

    for (let i = 1; i < snowDensity; i++) {
        let randomX = Math.random() * 100; // vw
        let randomOffset = Math.random() * 10; // vw;
        let randomXEnd = randomX + randomOffset;
        let randomXEndYoyo = randomX + (randomOffset / 2);
        let randomYoyoTime = getRandomArbitrary(0.3, 0.8);
        let randomYoyoY = randomYoyoTime * pageHeightVh; // vh
        let randomScale = Math.random();
        let fallDuration = randomIntRange(10, pageHeightVh / 10 * 3); // s
        let fallDelay = randomInt(pageHeightVh / 10 * 3) * -1; // s
        let opacity = Math.random();

        rule += `
      .${snowflakeName}:nth-child(${i}) {
        opacity: ${opacity};
        transform: translate(${randomX}vw, -10px) scale(${randomScale});
        animation: fall-${i} ${fallDuration}s ${fallDelay}s linear infinite;
      }
      @keyframes fall-${i} {
        ${randomYoyoTime * 100}% {
          transform: translate(${randomXEnd}vw, ${randomYoyoY}vh) scale(${randomScale});
        }
        to {
          transform: translate(${randomXEndYoyo}vw, ${pageHeightVh}vh) scale(${randomScale});
        }
      }
    `;
    }
    addCSS(rule);
}

// Load the rules and execute after the DOM loads
export function createSnow() {
    setHeightVariables();
    getSnowAttributes();
    generateSnowCSS(snowflakesCount);
    generateSnow(snowflakesCount);
}


window.addEventListener("resize", createSnow);

