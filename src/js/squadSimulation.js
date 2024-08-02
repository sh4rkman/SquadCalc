import targetIcon from "../img/icons/marker_target_enabled.webp";
import targetIconDisabled from "../img/icons/marker_target_disabled.webp";
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
        this.drawTrajectory(function(this2) {
            this2.drawCanvasIcons();
        });
        
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

        if (isNaN(this.firingSolution.elevation.high.rad)) {
            this.div.find(".infElevation").first().text("---");
            this.div.find(".infTimeOfFlight").first().text("---");
            this.div.find(".infSpread").first().text("---");
        } else {

            if (this.angleType === "high"){
                this.div.find(".infTimeOfFlight").first().text(this.firingSolution.timeOfFlight.high.toFixed(1)+i18next.t("common:s"));
                this.div.find(".infSpread").first().text(`H:${this.firingSolution.spreadParameters.high.semiMajorAxis.toFixed(1) + i18next.t("common:m")} V:${this.firingSolution.spreadParameters.high.semiMinorAxis.toFixed(1) + i18next.t("common:m")}`);
                if (this.activeWeaponUnit === "mil"){
                    this.div.find(".infElevation").first().text(`${this.firingSolution.elevation.high.mil.toFixed(1)}mil`);
                } else {
                    this.div.find(".infElevation").first().text(this.firingSolution.elevation.high.deg.toFixed(2)+i18next.t("common:°"));
                }
            } else {
                this.div.find(".infTimeOfFlight").first().text(this.firingSolution.timeOfFlight.low.toFixed(1)+i18next.t("common:s"));
                this.div.find(".infSpread").first().text(`H:${this.firingSolution.spreadParameters.low.semiMajorAxis.toFixed(1) + i18next.t("common:m")} V:${this.firingSolution.spreadParameters.low.semiMinorAxis.toFixed(1) + i18next.t("common:m")}`);
                if (this.activeWeaponUnit === "mil"){
                    this.div.find(".infElevation").first().text(`${this.firingSolution.elevation.low.mil.toFixed(1)}mil`);
                } else {
                    this.div.find(".infElevation").first().text(this.firingSolution.elevation.low.deg.toFixed(2)+i18next.t("common:°"));
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
        var step;

        if (this.firingSolution.distance > 1200) { step = 600; } else { step = 300; }

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
        var ground = new Path2D();
        
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
               
        if (isNaN(this.firingSolution.elevation.high.rad)) {
            image.src = targetIconDisabled;
        } 
        else {
            image.src = targetIcon;
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
     * Draw Trajectile projectory in the canvas
     * @param {Function} [Callback] - Function to callback after projectile is drawn
     */
    drawTrajectory(callback) {
        const G = this.firingSolution.gravity * this.yScaling;
        const FREQ = 20;
        var elevation;
        var xVel;
        var yVel;
        let x = this.padding;
        let oldX = this.padding;
        let y = this.firingSolution.weaponHeight * this.yScaling + this.yOffset;
        let oldY = this.firingSolution.weaponHeight * this.yScaling + this.yOffset;
        var this2 = this;

        if (isNaN(this.firingSolution.elevation.high.rad)) {
            // if no firing solution, simulate a maxdisance shot
            elevation = 0.785398;
        } else {
            if (this.angleType === "high") {
                elevation = this.firingSolution.elevation.high.rad;
            } else {
                elevation = this.firingSolution.elevation.low.rad;
            }
        }

        xVel = Math.cos(elevation) * this.firingSolution.velocity * this.xScaling;
        yVel = Math.sin(elevation) * this.firingSolution.velocity * this.yScaling;

        if (isNaN(this.firingSolution.velocity)) return;

        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = "#b22222";
        this.ctx.beginPath();
        this.ctx.moveTo(oldX, oldY);


        function drawProjectile() {

            x += xVel / FREQ;
            y += yVel / FREQ;
            yVel -= G / FREQ;
            
            if (y < 0 || x > (this2.canvas.width - this2.padding)) {
                if (x > (this2.canvas.width - this2.padding)) {
                    x = this2.canvas.width - this2.padding;
                }
                this2.ctx.lineTo(x, y);
                this2.ctx.stroke();
                callback(this2);
            } else {
                this2.ctx.lineTo(x, y);
                this2.ctx.stroke();
                oldX = x;
                oldY = y;
                this2.animationFrame = requestAnimationFrame(drawProjectile);
            }
            
        }
    
        this.animationFrame = requestAnimationFrame(drawProjectile.bind(this));
    }

        
    /**
     * Erase the canvas back to white
     */
    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

}