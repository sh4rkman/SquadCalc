import targetIcon from "../img/icons/marker_target1.webp";
//import weaponIcon from "../img/icons/marker_mortar_0.webp";
import { degToRad, radToDeg, radToMil } from "../js/utils.js";
import { App } from "./conf.js";

export default class Simulation {

    constructor(div, results, heightPath, padding = 0.1) {
        this.div = $(div);
        this.canvas = this.div.find("canvas").get(0);
        this.results = results;
        this.heightPath = heightPath;
        this.padding = padding * this.canvas.width;
        this.xScaling = ( this.canvas.width - ( 2 * this.padding ) ) / this.results.distance;
        this.yScaling = this.canvas.width/ this.results.distance;
        this.yOffset = this.getMinGround();
        this.animationFrame = "";
        
        this.buildTables();
        this.clear();
        this.drawGrid();
        this.drawGroundLevel();
        this.drawTrajectory(function(this2) {
            this2.drawCanvasIcons();
        });
        
    }

    buildTables(){
        this.div.find(".infBearing").first().text(this.results.bearing.toFixed(1)+"°");
        this.div.find(".infDistance").first().text(this.results.distance.toFixed(1)+"m");
        this.div.find(".infWHeight").first().text(this.results.weaponHeight.toFixed(1)+"m");
        this.div.find(".infTHeight").first().text(this.results.targetHeight.toFixed(1)+"m");
        this.div.find(".infDHeight").first().text(this.results.diffHeight.toFixed(1)+"m");

        if (isNaN(this.results.elevation)) {
            this.div.find(".infElevation").first().text("---");
            this.div.find(".infTimeOfFlight").first().text("---");
            this.div.find(".infSpread").first().text("---");
        } else {
            this.div.find(".infTimeOfFlight").first().text(this.results.timeOfFlight.toFixed(1)+"s");
            this.div.find(".infSpread").first().text("H:"+this.results.spreadParameters.semiMajorAxis.toFixed(1)+"m V:"+this.results.spreadParameters.semiMinorAxis.toFixed(1)+"m");
            if (App.activeWeapon.unit === "mil"){
                this.div.find(".infElevation").first().text(radToMil(this.results.elevation).toFixed(1)+"mil");
            } else {
                this.div.find(".infElevation").first().text(radToDeg(this.results.elevation).toFixed(1)+"°");
            }
        }

    }

    getMinGround(){
        return ( 30 - Math.min(...this.heightPath) ) * this.yScaling;
    }

    /**
     * Draw a grid on canvas representing distances
     */
    drawGrid(){
        const ctx = this.canvas.getContext("2d");
        var step;

        if (this.results.distance > 1200) {
            step = 600;
        }
        else {
            step = 300;
        }


        // One grey line every 100m on x
        ctx.fillStyle = "lightgrey";
        for (let i= this.padding; i <this.canvas.width; i = i + 100 * this.xScaling){
            ctx.fillRect(i, 0, 1, this.canvas.height);
        }
    
        // One black line every 300m on x
        ctx.fillStyle = "#111";
        for (let i= this.padding + step * this.xScaling; i <this.canvas.width; i = i + step * this.xScaling){
            ctx.fillRect(i, 0, 1, this.canvas.height);
        }
    
        // One line every 50m on y
        ctx.fillStyle = "lightgrey";
        for (let i = 0 + this.yOffset; i < this.canvas.height; i = i + 50 * this.yScaling){
            ctx.fillRect(0, i, this.canvas.width, 1);
        }

        // Flip the canvas first
        ctx.translate(0, this.canvas.height);
        ctx.scale(1, -1);

        // One black line every 300m on x
        ctx.fillStyle = "#111";
        ctx.font = "14px Montserrat";
        for (let i= this.padding; i <this.canvas.width; i = i + step * this.xScaling){
            ctx.fillText( ( (i - this.padding ) / this.xScaling ).toFixed(0) + "m", i+5, 20);
        }
    
        // Flip it back
        ctx.scale(1, -1);
        ctx.translate(0, -this.canvas.height);

    }

    /**
     * TODO
     * @param {TODO} [TODO] - TODO
     * @returns {TODO} - TODO
     */
    drawGroundLevel(){
        const ctx = this.canvas.getContext("2d");
        const xScaling = ( this.canvas.width - (2 * this.padding) ) / ( this.heightPath.length - 1 );
        const groundColor = "#111";
        var ground = new Path2D();
        
        ctx.lineWidth = 1;


        this.heightPath.forEach(function(height, meter){
            let x = meter * xScaling + this.padding;
            let y = height * this.yScaling + this.yOffset;
            ground.lineTo(x, y);
        }, this);
        
        // Close ground & draw it
        ground.lineTo((this.heightPath.length-1) * xScaling + this.padding, 0);
        ground.lineTo(this.padding, 0);        
        ground.closePath();
    


        ctx.fillStyle = groundColor;
        ctx.fill(ground);
        ctx.fillStyle = "#f2f2f2";
        ctx.fillRect(0, 0, this.padding, this.canvas.height);
        ctx.fillRect(this.canvas.width, 0, -this.padding, this.canvas.height);

    }

    /**
     * TODO
     * @param {TODO} [TODO] - TODO
     * @returns {TODO} - TODO
     */
    drawCanvasIcons(){
        const ctx = this.canvas.getContext("2d");
        const yScaling = this.canvas.width/this.results.distance;
        const IMG_WIDTH = 52;
        const IMG_HEIGHT = 64;
        const image = new Image(IMG_WIDTH, IMG_HEIGHT);
    
        // Flip the canvas first
        ctx.translate(0, this.canvas.height);
        ctx.scale(1, -1);
    
        image.src = targetIcon;
        ctx.drawImage(
            image,
            this.canvas.width - this.padding - (IMG_WIDTH/2),
            this.canvas.height - (this.heightPath.at(-1) * yScaling) - IMG_HEIGHT - this.yOffset,
            IMG_WIDTH,
            IMG_HEIGHT);
        
        // Flip it back
        ctx.scale(1, -1);
        ctx.translate(0, -this.canvas.height);
    }

    /**
     * TODO
     * @param {TODO} [TODO] - TODO
     * @returns {TODO} - TODO
     */
    drawTrajectory(callback) {
        const ctx = this.canvas.getContext("2d");
        const G = 9.8 * this.results.gravityScale * this.yScaling;
        const FREQ = 20;
        var elevation;
        var xVel;
        var yVel;
        let x = this.padding;
        let oldX = this.padding;
        let y = this.heightPath[0] * this.yScaling + this.yOffset;
        let oldY = this.heightPath[0] * this.yScaling + this.yOffset;
        var this2 = this;

        if (isNaN(this.results.elevation)) {
            elevation = degToRad(45);
        } else {
            elevation = this.results.elevation;
        }

        xVel = Math.cos(elevation) * this.results.velocity * this.xScaling;
        yVel = Math.sin(elevation) * this.results.velocity * this.yScaling;



        if (isNaN(this.results.velocity)) return;

        ctx.lineWidth = 5;
        ctx.strokeStyle = "#b22222";
        ctx.beginPath();
        ctx.moveTo(oldX, oldY);


        function drawProjectile() {

            x += xVel / FREQ;
            y += yVel / FREQ;
            yVel -= G / FREQ;
            
            if (y < 0 || x > (this2.canvas.width - this2.padding)) {
                if (x > (this2.canvas.width - this2.padding)) {
                    x = this2.canvas.width - this2.padding;
                }
                ctx.lineTo(x, y);
                ctx.stroke();
                callback(this2);
            } else {
                ctx.lineTo(x, y);
                ctx.stroke();
                oldX = x;
                oldY = y;
                this2.animationFrame = requestAnimationFrame(drawProjectile);
            }
            
        }
    
        this.animationFrame = requestAnimationFrame(drawProjectile.bind(this));
    }

        
    /**
     * TODO
     * @param {TODO} [TODO] - TODO
     * @returns {TODO} - TODO
     */
    clear(){
        this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

}