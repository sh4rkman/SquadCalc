/**
 * Give a animate.css class to a given element (https://animate.style/)
 * @param {Element} [element] - DOM element to animate
 * @param {text} [animation] - animation name to apply
 */
export function animateCSS(element, animation, prefix = "animate__") {
    return new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const hasAnimationClass = element.classList.contains(`${prefix}animated`);

        element.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            element.classList.remove(animationName);
            if (!hasAnimationClass) element.classList.remove(`${prefix}animated`);
            resolve("Animation ended");
        }

        element.addEventListener("animationend", handleAnimationEnd, { once: true });
    });
}

/**
 * Draw an explosion at given coordinated
 * @param {number} [x] - horizontal coordinates in pixel
 * @param {number} [y] - vertical coordinates in pixel
 */
export function explode(x, y, startAngle, endAngle) {
    const colors = ["rgba(255, 255, 255, 0.3)"];
    const bubbles = 30;
    const r = (a, b, c) => parseFloat((Math.random() * ((a || 1) - (b || 0)) + (b || 0)).toFixed(c || 0));
    let particles = [];
    let ratio = window.devicePixelRatio;
    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");

    c.style.position = "absolute";
    c.style.left = `${x - 100}px`;
    c.style.top = `${y - 100}px`;
    c.style.pointerEvents = "none";
    c.style.width = `${200}px`;
    c.style.height = `${200}px`;
    c.style.zIndex = 100;
    c.width = 200 * ratio;
    c.height = 200 * ratio;
    document.body.appendChild(c);

    for (let i = 0; i < bubbles; i++) {
        particles.push({
            x: c.width / 2,
            y: c.height / 2,
            radius: r(5, 20),
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: r(startAngle, endAngle, true),
            speed: r(0.5,1.5),
            friction: 0.98,
            opacity: r(0.9, 0.9, true),
            yVel: 0,
            gravity: 0
        });
    }

    render(particles, ctx, c.width, c.height);
    setTimeout(() => document.body.removeChild(c), 200);
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


export function animateCalc(goal, duration, destination) {
    // Ensure target is a number
    const element = document.getElementById(destination);
    let target = isNaN(element.textContent) ? 0 : Number(element.textContent);

    const increment = Math.abs(goal - target) / (duration / 16);

    // If goal is an integer, intermediate values will be integers too
    const decimalPlaces = Number.isInteger(Number(goal)) ? 0 : 1;

    function updateCount(current) {
        element.textContent = current.toFixed(decimalPlaces);

        // Determine the animation direction
        if ((target < goal && current < goal) || (target > goal && current > goal)) {
            requestAnimationFrame(() => updateCount(target < goal ? current + increment : current - increment));
        } else {
            element.textContent = goal;
        }
    }

    updateCount(target);
}