import { globalData } from "./conf";
import LeaderLine from "leader-line-new";


/**
 * Give a anime.css class to a given element
 * @param {text} [element] - element id to animated
 * @param {text} [animation] - animation name to apply
 */
export function animateCSS(element, animation, prefix = "animate__") {
    // We create a Promise and return it
    new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve("Animation ended");
        }

        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });
}


/**
 * Initiate a animated line between weapon and target images
 */
export function createLine() {
    const lineOptions = {
        color: "rgba(255, 255, 255, 0.7)",
        path: "arc",
        startSocket: "top",
        endSocket: "top",
        slash: true,
        endPlug: "behind",
        size: 1,
        dash: { len: 10, gap: 8 },
    };

    globalData.line = new LeaderLine(
        LeaderLine.pointAnchor(
            document.getElementById("mortarImg"), { x: globalData.activeWeapon.logoCannonPos, y: "-30%" }
        ),
        LeaderLine.pointAnchor(
            document.getElementById("targetImg"), { x: "-30%", y: "-30%" }
        ),
        lineOptions
    ).hide("none");
}

/**
 * Draw the animated line
 */
export function drawLine() {
    if ($(window).width() > 767) {
        setTimeout(function() {
            globalData.line.start = LeaderLine.pointAnchor(document.getElementById("mortarImg"), { x: globalData.activeWeapon.logoCannonPos, y: "-30%" });
            globalData.line.show("draw", { duration: 2000 });
            explode($(".leader-line").position().left, $(".leader-line").position().top);
        }, 1000);
    }
}

/**
 * Draw an explosion at given coordinated
 * @param {number} [x] - horizontal coordinates in pixel
 * @param {number} [y] - vertical coordinates in pixel
 */
function explode(x, y) {
    const colors = ["rgba(255, 255, 255, 0.1)"];
    const bubbles = 10;
    const r = (a, b, c) => parseFloat((Math.random() * ((a ? a : 1) - (b ? b : 0)) + (b ? b : 0)).toFixed(c ? c : 0));
    let particles = [];
    let ratio = window.devicePixelRatio;
    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");

    c.style.position = "absolute";
    c.style.left = (x - 100) + "px";
    c.style.top = (y - 100) + "px";
    c.style.pointerEvents = "none";
    c.style.width = 200 + "px";
    c.style.height = 200 + "px";
    c.style.zIndex = 100;
    c.width = 200 * ratio;
    c.height = 200 * ratio;
    document.body.appendChild(c);

    for (let i = 0; i < bubbles; i++) {
        particles.push({
            x: c.width / 2,
            y: c.height / 2,
            radius: r(10, 15),
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: r(-135, 45, true),
            speed: r(2, 3),
            friction: 0.9,
            opacity: r(0, 0.1, true),
            yVel: 0,
            gravity: 0
        });
    }

    render(particles, ctx, c.width, c.height);
    setTimeout(() => document.body.removeChild(c), 1000);
}


/**
 * Draw an explosion at given coordinated
 * @param {number} [particles] - Array of particles generated via explode()
 * @param {number} [ctx] - canvas
 * @param {number} [width] - canvas width
 * @param {number} [height] - canvas height
 * @returns {object} canvas
 */
function render(particles, ctx, width, height) {
    requestAnimationFrame(() => render(particles, ctx, width, height));
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
        p.x += p.speed * Math.cos(p.rotation * Math.PI / 180);
        p.y += p.speed * Math.sin(p.rotation * Math.PI / 180);

        p.opacity -= 0.01;
        p.speed *= p.friction;
        p.radius *= p.friction;
        p.yVel += p.gravity;
        p.y += p.yVel;

        if (p.opacity < 0 || p.radius < 0) return;

        ctx.beginPath();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, false);
        ctx.fill();
    });

    return ctx;
}