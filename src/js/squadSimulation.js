import targetIcon from "../img/icons/marker_target1.webp";
import weaponIcon from "../img/icons/marker_mortar_0.webp";

export default class Simulation {

    constructor(canvas, results, heightPath, padding = 0.1) {
        this.canvas = canvas;
        this.results = results;
        this.heightPath = heightPath;
        this.padding = padding * canvas.width;
        this.clear();
        this.drawGrid();
        this.drawGroundLevel();
        this.drawTrajectory();
    }


    /**
     * Draw a grid on canvas representing distances
     * @param {CanvasRenderingContext2D} [canvas] - canvas to draw
     * @param {Uint16Array} [distance] - distance of the shot
     * @param {Array} [heightPath] - heights that will be drawn
     */
    drawGrid(){
        const maxGround = Math.max(...this.heightPath);
        const ctx = this.canvas.getContext("2d");
        const xScaling = this.canvas.width - ( 2 * this.padding ) / this.results.distance;
        const yScaling = this.canvas.height / (maxGround * 4);

        ctx.fillStyle = "lightgrey";
        ctx.font = "24px serif";

        // One grey line every 100m on x
        for (let i= this.padding; i <this.canvas.width; i = i + 100 * xScaling){
            ctx.fillRect(i, 0, 1, this.canvas.height);
        }
    
        // One black line every 300m on x
        ctx.fillStyle = "black";
        for (let i= this.padding + 300 * xScaling; i <this.canvas.width; i = i + 300 * xScaling){
            ctx.fillRect(i, 0, 1, this.canvas.height);
        }
    
        // One line every 50m on y
        ctx.fillStyle = "lightgrey";
        for (let i = this.padding; i < this.canvas.height; i = i + 50 * yScaling){
            // ctx.fillRect(0, i, this.canvas.width, 1)
        }
    
    }

    /**
     * TODO
     * @param {TODO} [TODO] - TODO
     * @returns {TODO} - TODO
     */
    drawGroundLevel(){
        const maxGround = Math.max(...this.heightPath);
        const ctx = this.canvas.getContext("2d");
        const xScaling = ( this.canvas.width - (2 * this.padding) ) / ( this.heightPath.length - 1 );
        const yScaling = this.canvas.height/(maxGround * 4);
        const groundColor = "black";
        var ground = new Path2D();
        
        ctx.lineWidth = 1;


        this.heightPath.forEach(function(height, meter){
            let x = meter * xScaling + this.padding;
            let y = height * yScaling;
            ground.lineTo(x, y);
        }, this);
        
        // Close ground & draw it
        ground.lineTo((this.heightPath.length-1) * xScaling + this.padding, 0);
        ground.lineTo(this.padding, 0);        
        ground.closePath();
    


        ctx.fillStyle = groundColor;
        ctx.fill(ground);
        
        ctx.fillStyle = "#e6e1e1";
        ctx.fillRect(0, 0, this.padding, this.canvas.height);
        ctx.fillRect(this.canvas.width, 0, -this.padding, this.canvas.height);

        // Draw icons
        //this.drawCanvasIcons(PADDING);
    }

    /**
     * TODO
     * @param {TODO} [TODO] - TODO
     * @returns {TODO} - TODO
     */
    drawCanvasIcons(PADDING){
        const ctx = this.canvas.getContext("2d");
        const maxGround = Math.max(...this.heightPath);
        const yScaling = this.canvas.height/(maxGround * 4);
        const IMG_WIDTH = 68;
        const IMG_HEIGHT = 84;
        const image = new Image(IMG_WIDTH, IMG_HEIGHT);
    
        // Flip the canvas first
        ctx.translate(0, this.canvas.height);
        ctx.scale(1, -1);
    
        image.src = targetIcon;
        ctx.drawImage(
            image,
            this.canvas.width - (PADDING * this.canvas.width) - (IMG_WIDTH/2),
            this.canvas.height - (this.heightPath.at(-1) * yScaling) - IMG_HEIGHT,
            IMG_WIDTH,
            IMG_HEIGHT);

        image.src = weaponIcon;
        ctx.drawImage(
            image,
            (PADDING * this.canvas.width) - (IMG_WIDTH/2),
            this.canvas.height - (this.heightPath.at(1) * yScaling) - IMG_HEIGHT,
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
    drawTrajectory(){
        const ctx = this.canvas.getContext("2d");
        const maxGround = Math.max(...this.heightPath);
        const PADDING = 0.1;
        const xScaling = ( this.canvas.width - (2 * this.padding ) ) / ( this.results.distance );
        const yScaling = this.canvas.height/(maxGround * 4);
        const G = 9.8 * this.results.gravityScale * yScaling;
        const FREQ = 25;
        var this2 = this; // https://stackoverflow.com/questions/10944004/how-to-pass-this-to-window-setinterval
    
        //var distanceMax = ((vel ** 2) / G) * Math.sin(2 * angle);
        
        var x = this.padding;
        var oldX = this.padding;
        var y = this.heightPath[0] * yScaling;
        var oldY = this.heightPath[0] * yScaling;
    
        var xVel = Math.cos(this.results.elevation) * this.results.velocity * xScaling;
        var yVel = Math.sin(this.results.elevation) * this.results.velocity * yScaling;

        var projectile = setInterval(function () {
            x += xVel / FREQ;
            y += yVel / FREQ;
            yVel -= G / FREQ;
    

            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(oldX,oldY);
            ctx.strokeStyle = "green";
            ctx.lineTo(x,y);
            ctx.stroke();
            oldX = x;
            oldY = y;

            if (y < 0 || x > (this.canvas.width - this2.padding)) {

                clearInterval(projectile);

                ctx.closePath();


            }
    
        });
        

        ctx.fillStyle = "lightgrey";
        ctx.fillRect(0, 0, this.padding, this.canvas.height);
        ctx.fillRect(this.canvas.width, 0, -this.padding, this.canvas.height);
        this.drawCanvasIcons(PADDING); // redraw to overide path
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