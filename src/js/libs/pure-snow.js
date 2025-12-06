export default class Snow {
    constructor(selector = "#snow") {
        this.selector = selector;
        this.wrapper = document.querySelector(selector);
        this.snowflakesCount = Number(this.wrapper?.dataset?.count || 50);

        this.bodyHeightPx = 0;
        this.pageHeightVh = 0;
        this.baseCSS = "";

        this.cssElement = null;

        this.handleResize = this.create.bind(this);
        window.addEventListener("resize", this.handleResize);
    }

    // ----------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------

    setHeightVariables() {
        this.bodyHeightPx = document.body.offsetHeight;
        this.pageHeightVh = (100 * this.bodyHeightPx / window.innerHeight);
    }

    getCSSContainer() {
        if (this.cssElement) return this.cssElement;

        this.cssElement = document.createElement("style");
        this.cssElement.id = "psjs-css";
        document.head.appendChild(this.cssElement);

        return this.cssElement;
    }

    addCSS(rule) {
        const el = this.getCSSContainer();
        el.innerHTML = rule;
    }

    randomInt(value = 100) {
        return Math.floor(Math.random() * value) + 1;
    }

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
    // ----------------------------------------------------------

    generateSnowflakes(count) {
        this.wrapper.innerHTML = "";

        for (let i = 0; i < count; i++) {
            const div = document.createElement("div");
            div.className = "snowflake";
            this.wrapper.appendChild(div);
        }
    }

    generateSnowCSS(count) {
        let rule = this.baseCSS;

        for (let i = 0; i < count; i++) {
            const nth = i + 1;

            let randomX = Math.random() * 100;
            let randomOffset = Math.random() * 10;
            let randomXEnd = randomX + randomOffset;
            let randomXEndYoyo = randomX + randomOffset / 2;

            let randomYoyoTime = this.getRandomArbitrary(0.3, 0.8);
            let randomYoyoY = randomYoyoTime * this.pageHeightVh;

            let randomScale = Math.random();
            let fallDuration = this.randomIntRange(10, this.pageHeightVh / 10 * 3);
            let fallDelay = this.randomInt(this.pageHeightVh / 10 * 3) * -1;
            let opacity = Math.random();

            rule += `
            .snowflake:nth-child(${nth}) {
            opacity: ${opacity};
            transform: translate(${randomX}vw, -10px) scale(${randomScale});
            animation: fall-${nth} ${fallDuration}s ${fallDelay}s linear infinite;
            }
            @keyframes fall-${nth} {
            ${randomYoyoTime * 100}% {
                transform: translate(${randomXEnd}vw, ${randomYoyoY}vh) scale(${randomScale});
            }
            to {
                transform: translate(${randomXEndYoyo}vw, ${this.pageHeightVh}vh) scale(${randomScale});
            }
            }
        `;
        }

        this.addCSS(rule);
    }

    // ----------------------------------------------------------
    // Public API
    // ----------------------------------------------------------

    create() {
        this.setHeightVariables();

        // Reload dataset count each time
        this.snowflakesCount = Number(
            this.wrapper?.dataset?.count || this.snowflakesCount
        );

        this.generateSnowCSS(this.snowflakesCount);
        this.generateSnowflakes(this.snowflakesCount);
    }

    show() {
        this.wrapper.style.display = "block";
    }

    hide() {
        this.wrapper.style.display = "none";
    }

    destroy() {
        window.removeEventListener("resize", this.handleResize);
        this.wrapper.innerHTML = "";
        if (this.cssElement) this.cssElement.remove();
    }
}
