export default class Snow {
    constructor(selector, count = 50) {
        this.selector = selector;
        this.wrapper = document.querySelector(selector);
        this.snowflakesCount = count;

        // #snow1/#snow2's wrappers are always fixed, full-viewport overlays (see
        // snow.scss), never taller than the screen - unlike a normal scrollable page,
        // so the fall distance is a constant 100vh, not document.body's height.
        this.pageHeightVh = 100;
    }

    // ----------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------

    randomIntRange(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    // ----------------------------------------------------------
    // Core snow functionality
    //
    // Every flake shares the single "snow-fall" @keyframes from snow.scss and only
    // varies via CSS custom properties set inline - cheaper than beta.4's per-flake
    // injected @keyframes blocks (one unique stylesheet rule per flake).
    // ----------------------------------------------------------

    generateSnowflakes(count) {
        this.wrapper.innerHTML = "";

        for (let i = 0; i < count; i++) {
            const randomX = Math.random() * 100;
            const randomOffset = Math.random() * 10;
            const randomXMid = randomX + randomOffset;
            const randomXEnd = randomX + randomOffset / 2;

            const yoyoTime = this.getRandomArbitrary(0.3, 0.8);
            const yoyoY = yoyoTime * this.pageHeightVh;

            const scale = Math.random();
            const duration = this.randomIntRange(10, this.pageHeightVh / 10 * 3);
            const delay = this.randomIntRange(1, this.pageHeightVh / 10 * 3) * -1;

            const div = document.createElement("div");
            div.className = "snowflake";
            div.style.setProperty("--x-start", `${randomX}vw`);
            div.style.setProperty("--x-mid", `${randomXMid}vw`);
            div.style.setProperty("--y-mid", `${yoyoY}vh`);
            div.style.setProperty("--x-end", `${randomXEnd}vw`);
            div.style.setProperty("--y-end", `${this.pageHeightVh}vh`);
            div.style.setProperty("--scale", scale);
            div.style.setProperty("--opacity", Math.random());
            div.style.setProperty("--duration", `${duration}s`);
            div.style.setProperty("--delay", `${delay}s`);
            this.wrapper.appendChild(div);
        }
    }

    // ----------------------------------------------------------
    // Public API
    // ----------------------------------------------------------

    create() {
        this.generateSnowflakes(this.snowflakesCount);
    }

    show() {
        this.wrapper.style.display = "block";
    }

    hide() {
        this.wrapper.style.display = "none";
    }

    destroy() {
        this.wrapper.innerHTML = "";
    }
}
