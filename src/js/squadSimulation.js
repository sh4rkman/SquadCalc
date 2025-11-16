import { App } from "../app.js";
import i18next from "i18next";

export default class Simulation {

    constructor(div, firingSolution, heightPath, angleType, activeWeaponUnit, padding = 0.1) {
        this.div = $(div);
        this.firingSolution = firingSolution;
        this.heightPath = heightPath;
        this.angleType = angleType;
        this.canvas = this.div.find("canvas").get(0);
        this.ctx = this.canvas.getContext("2d");
        this.padding = padding * this.canvas.width;
        this.xScaling = ( this.canvas.width - ( 2 * this.padding ) ) / this.firingSolution.distance;
        this.yScaling = this.canvas.width/ this.firingSolution.distance;
        this.yOffset = this.getMinGround();
        this.animationFrame = "";
        this.activeWeaponUnit = activeWeaponUnit;
        
        this.buildTables();
        this.clear();
        this.drawGrid();
        this.drawGroundLevel();
        this.drawTrajectory(function() {
            if (App.userSettings.lowAndHigh &&
                App.activeWeapon.name !== "Mortar" &&
                App.activeWeapon.name !== "UB-32" &&
                App.activeWeapon.name !== "M1064M121" &&
                App.activeWeapon.name !== "Mk19") {
        
                if (this.angleType === "low") {
                    this.angleType = "high";
                } else {
                    this.angleType = "low";
                }
                this.drawTrajectory(function() {
                    this.drawCanvasIcons();
                }.bind(this));
            } else {
                this.drawCanvasIcons();
            }
        }.bind(this));
    }


    
    /**
     * Populate the simulation table with info
     */
    buildTables(){
        this.div.find(".infBearing").first().text(this.firingSolution.bearing.toFixed(1)+i18next.t("common:°"));
        this.div.find(".infDistance").first().text(this.firingSolution.distance.toFixed(1)+i18next.t("common:m"));
        this.div.find(".infWHeight").first().text(this.firingSolution.weaponHeight.toFixed(1)+i18next.t("common:m"));
        this.div.find(".infTHeight").first().text(this.firingSolution.targetHeight.toFixed(1)+i18next.t("common:m"));
        this.div.find(".infDHeight").first().text(this.firingSolution.heightDiff.toFixed(1)+i18next.t("common:m"));


        if (isNaN(this.firingSolution.elevation.high.rad) && isNaN(this.firingSolution.elevation.low.rad)) {
            this.div.find(".infElevation").first().text("---");
            this.div.find(".infTimeOfFlight").first().text("---");
            this.div.find(".infSpread").first().text("---");
        } else {

            if (App.userSettings.lowAndHigh &&
                App.activeWeapon.name != "Mortar" &&
                 App.activeWeapon.name != "UB-32" &&
                  App.activeWeapon.name != "M1064M121" &&
                   App.activeWeapon.name != "Mk19" &&
                    App.activeWeapon.name != "BTR4-AGS"
                ) {

                let elevationlow = this.firingSolution.elevation.low;
                let elevationhigh = this.firingSolution.elevation.high;
                let timeOfFlightlow;
                let timeOfFlighthigh;

                if (isNaN(elevationlow.rad)){
                    elevationlow = "---";
                    timeOfFlightlow = "---";
                } else {
                    if (this.activeWeaponUnit === "mil"){
                        elevationlow = `${elevationlow.mil.toFixed(1)}mil`;
                    } else {
                        elevationlow = elevationlow.deg.toFixed(2)+i18next.t("common:°");
                    }
                    timeOfFlightlow = this.firingSolution.timeOfFlight.low.toFixed(1)+i18next.t("common:s");
                }

                if (isNaN(elevationhigh.rad)){
                    elevationhigh = "---";
                    timeOfFlighthigh = "---";
                } else {
                    if (this.activeWeaponUnit === "mil"){
                        elevationhigh = `${elevationhigh.mil.toFixed(1)}mil`;
                    } else {
                        elevationhigh = elevationhigh.deg.toFixed(2)+i18next.t("common:°");
                    }
                    timeOfFlighthigh = this.firingSolution.timeOfFlight.high.toFixed(1)+i18next.t("common:s");
                }

                

                this.div.find(".infElevation").first().text(`${elevationlow} / ${elevationhigh}`);
                this.div.find(".infTimeOfFlight").first().text(`${timeOfFlightlow} / ${timeOfFlighthigh}`);
                this.div.find(".infSpread").first().text(`
                    H:${this.firingSolution.spreadParameters.low.semiMajorAxis.toFixed(0)}/${this.firingSolution.spreadParameters.high.semiMajorAxis.toFixed(0) + i18next.t("common:m")} 
                    V:${Math.max(this.firingSolution.spreadParameters.low.semiMinorAxis, this.firingSolution.spreadParameters.high.semiMinorAxis).toFixed(0) + i18next.t("common:m")}
                `); // Vertical spread is almost the same for both angles, so we take the highest value and call it a day

            } else {

                if (this.angleType === "high"){
                    this.div.find(".infTimeOfFlight").first().text(this.firingSolution.timeOfFlight.high.toFixed(1)+i18next.t("common:s"));
                    this.div.find(".infSpread").first().text(`H:${this.firingSolution.spreadParameters.high.semiMajorAxis.toFixed(1) + i18next.t("common:m")} V:${this.firingSolution.spreadParameters.high.semiMinorAxis.toFixed(1) + i18next.t("common:m")}`);
                    switch (App.activeWeapon.unit) {
                        case "mil":
                            this.div.find(".infElevation").first().text(`${this.firingSolution.elevation.high.mil.toFixed(1)}mil`);
                            break;
                        case "degMin": {
                            // Convert degrees to degrees + minutes
                            let degrees = Math.floor(this.firingSolution.elevation.high.deg);
                            let minutes = Math.round((this.firingSolution.elevation.high.deg - degrees) * 60);
                            if (minutes === 60) {
                                degrees += 1;
                                minutes = 0;
                            }
                            this.div.find(".infElevation").first().text(`${degrees}°${minutes.toString().padStart(2, '0')}' (${this.firingSolution.elevation.high.deg.toFixed(2)+i18next.t("common:°")})`);
                            break;
                        }
                        default:
                            this.div.find(".infElevation").first().text(this.firingSolution.elevation.low.deg.toFixed(2)+i18next.t("common:°"));
                    }
                } else {
                    this.div.find(".infTimeOfFlight").first().text(this.firingSolution.timeOfFlight.low.toFixed(1)+i18next.t("common:s"));
                    this.div.find(".infSpread").first().text(`H:${this.firingSolution.spreadParameters.low.semiMajorAxis.toFixed(1) + i18next.t("common:m")} V:${this.firingSolution.spreadParameters.low.semiMinorAxis.toFixed(1) + i18next.t("common:m")}`);
                    
                    switch (App.activeWeapon.unit) {
                        case "mil":
                            this.div.find(".infElevation").first().text(`${this.firingSolution.elevation.low.mil.toFixed(1)}mil`);
                            break;
                        case "degMin": {
                            // Convert degrees to degrees + minutes
                            let degrees = Math.floor(this.firingSolution.elevation.low.deg);
                            let minutes = Math.round((this.firingSolution.elevation.low.deg - degrees) * 60);
                            if (minutes === 60) {
                                degrees += 1;
                                minutes = 0;
                            }
                            this.div.find(".infElevation").first().text(`${degrees}°${minutes.toString().padStart(2, '0')}' (${this.firingSolution.elevation.low.deg.toFixed(2)+i18next.t("common:°")})`);
                            break;
                        }
                        default:
                            this.div.find(".infElevation").first().text(this.firingSolution.elevation.low.deg.toFixed(2)+i18next.t("common:°"));
                    }

                }
            }
        }
    }


    /**
     * Read the heightpath and determine the appropriate ground level to display 
     * @return {number} Minimum ground
     */
    getMinGround(){
        return ( 30 - Math.min(...this.heightPath) ) * this.yScaling;
    }


    /**
     * Draw a grid on canvas representing distances
     */
    drawGrid(){
        let step;

        if (this.firingSolution.distance > 1200) { step = 500; } else { step = 300; }

        // One grey line every 100m on x
        this.ctx.fillStyle = "lightgrey";
        for (let i= this.padding; i <this.canvas.width; i = i + 100 * this.xScaling){
            this.ctx.fillRect(i, 0, 1, this.canvas.height);
        }
    
        // One black line every 300m on x
        this.ctx.fillStyle = "#111";
        for (let i= this.padding + step * this.xScaling; i <this.canvas.width; i = i + step * this.xScaling){
            this.ctx.fillRect(i, 0, 1, this.canvas.height);
        }
    
        // One line every 50m on y
        this.ctx.fillStyle = "lightgrey";
        for (let i = 0 + this.yOffset; i < this.canvas.height; i = i + 50 * this.yScaling){
            this.ctx.fillRect(0, i, this.canvas.width, 1);
        }

        // Flip the canvas first
        this.ctx.translate(0, this.canvas.height);
        this.ctx.scale(1, -1);

        // One black line every 300m on x
        this.ctx.fillStyle = "#111";
        this.ctx.font = "14px Montserrat";
        for (let i = this.padding; i <this.canvas.width; i = i + step * this.xScaling){
            this.ctx.fillText( ( (i - this.padding ) / this.xScaling ).toFixed(0) + i18next.t("common:m"), i+5, 20);
        }
    
        // Flip it back
        this.ctx.scale(1, -1);
        this.ctx.translate(0, -this.canvas.height);
    }


    /**
     * Draw the ground in the canvas
     */
    drawGroundLevel(){
        const xScaling = ( this.canvas.width - (2 * this.padding) ) / ( this.heightPath.length - 1 );
        const groundColor = "#111";
        const ground = new Path2D();
        
        this.ctx.lineWidth = 1;

        this.heightPath.forEach(function(height, meter){
            let x = meter * xScaling + this.padding;
            let y = height * this.yScaling + this.yOffset;
            ground.lineTo(x, y);
        }, this);
        
        // Close ground & draw it
        ground.lineTo((this.heightPath.length-1) * xScaling + this.padding, 0);
        ground.lineTo(this.padding, 0);        
        ground.closePath();
    
        this.ctx.fillStyle = groundColor;
        this.ctx.fill(ground);
        this.ctx.fillStyle = "#f2f2f2";
        this.ctx.fillRect(0, 0, this.padding, this.canvas.height);
        this.ctx.fillRect(this.canvas.width, 0, -this.padding, this.canvas.height);
    }


    /**
     * Draw Target Icon in the simulation canvas
     */
    drawCanvasIcons(){
        const yScaling = this.canvas.width / this.firingSolution.distance;
        const IMG_WIDTH = 52;
        const IMG_HEIGHT = 64;
        const image = new Image(IMG_WIDTH, IMG_HEIGHT);
    
        // Flip the canvas first
        this.ctx.translate(0, this.canvas.height);
        this.ctx.scale(1, -1);
               
        if (isNaN(this.firingSolution.elevation.high.rad) && isNaN(this.firingSolution.elevation.low.rad)) {
            image.src = "./img/markers/targets/marker_target_disabled.webp";
        } 
        else {
            image.src = "./img/markers/targets/marker_target_enabled.webp";
        }

        this.ctx.drawImage(
            image,
            this.canvas.width - this.padding - (IMG_WIDTH/2),
            this.canvas.height - (this.heightPath.at(-1) * yScaling) - IMG_HEIGHT - this.yOffset,
            IMG_WIDTH,
            IMG_HEIGHT);

        // Flip it back
        this.ctx.scale(1, -1);
        this.ctx.translate(0, -this.canvas.height);
    }

    
    /**
     * Draw projectile trajectory on the canvas.
     * @param {Function} [callback] - Function to call after the projectile is drawn.
     */
    drawTrajectory(callback) {
        const MAXANGLE = 45;
        const MAXANGLE_UB32 = 35;
        const G = this.firingSolution.gravity * this.yScaling;

        let xVel;
        let yVel;
        let x = this.padding;
        let y = this.firingSolution.weaponHeight * this.yScaling + this.yOffset;
        let elevation = this.angleType === "high" ? this.firingSolution.elevation.high.rad : this.firingSolution.elevation.low.rad;

        // If the elevation has been offsetted, reset it
        elevation = elevation +  this.firingSolution.degToRad(App.activeWeapon.angleOffset);

        // If no firing solution, simulate a max distance shot 
        if (isNaN(elevation)) {
            if (this.firingSolution.activeWeapon.name === "UB-32"){
                elevation = this.firingSolution.degToRad(MAXANGLE_UB32);
            }
            else {
                elevation = this.firingSolution.degToRad(MAXANGLE);
            }
        }

        xVel = Math.cos(elevation) * this.firingSolution.velocity * this.xScaling;
        yVel = Math.sin(elevation) * this.firingSolution.velocity * this.yScaling;

        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = App.mainColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);

        let lastTime = performance.now();

        const drawProjectile = (currentTime) => {
            // Calculate time elapsed since the last frame
            const deltaTime = (currentTime - lastTime) / 100; // Convert to seconds
            lastTime = currentTime;

            // Update the projectile's position based on the elapsed time
            x += xVel * deltaTime;
            y += yVel * deltaTime;
            yVel -= G * deltaTime; // Update y velocity with gravity

            // Check if the projectile is out of bounds
            if (y < 0 || x > (this.canvas.width - this.padding)) {
                if (x > (this.canvas.width - this.padding)) {
                    x = this.canvas.width - this.padding;
                }
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                callback(this);
            } else {
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                this.animationFrame = requestAnimationFrame(drawProjectile);
            }
        };

        this.animationFrame = requestAnimationFrame(drawProjectile);
    }

        
    /**
     * Erase the canvas back to white
     */
    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

}