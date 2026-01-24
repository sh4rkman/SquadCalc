import tippy, {followCursor} from "tippy.js";
import "tippy.js/dist/tippy.css";
import { App } from "../app.js";
import { MapDrawing } from "./squadShapes.js";


export default class SquadContextMenu {

    constructor() {

        this.boundHandleContextMenu = this.handleContextMenu.bind(this);
        document.addEventListener("contextmenu", this.boundHandleContextMenu);
        
        this.mainContextMenu = tippy(document.querySelector("#map"), {
            allowHTML: true,
            theme: "contextmenu",
            interactive: true,
            trigger: "manual",
            showOnCreate: false,
            followCursor: "initial",
            plugins: [followCursor],
            duration: 0,
            arrow: false,
            offset: [0, -15],
            onHide: () => {
                $(".ctxButton").off("click");
                document.removeEventListener("contextmenu", this.boundHandleContextMenu);
            },
            onShow: (tip) => {
                tip.setContent(
                    `<div class="contextmenu"">
                        <button class="ctxButton">
                            <span class="fob" data-team="ally" data-category="deployables" data-icon="deployable_fob_blue"></span>
                        </button>
                        <button class="ctxButton">
                            <span class="friendly" data-team="ally" data-category="vehicles" data-icon="map_truck_logistics"></span>
                        </button>
                        <button class="ctxButton">
                             <span class="friendlyInf" data-team="ally" data-category="infantry" data-icon="map_genericinfantry"></span>
                        </button>
                        <button class="ctxButton middleContextButton">
                            <span class="middleContext" data-team="shared" data-category="ctx" data-icon="middleContext"></span>
                        </button>
                        <button class="ctxButton">
                            <span class="enemy" data-team="enemy" data-category="infantry" data-icon="map_genericinfantry"></span>
                        </button>
                        <button class="ctxButton">
                            <span class="enemyVehicles" data-team="enemy" data-category="vehicles" data-icon="map_truck_logistics"></span>
                        </button>
                        <button class="ctxButton">
                            <span class="enemyfob" data-team="enemy" data-category="deployables" data-icon="deployable_fob"></span>
                        </button>
                    </div>`
                );


                this.setIcons(tip);

                // Delay the event listeners to let the DOM update
                setTimeout(() => {

                    $(".ctxButton").on("click", (event) => {

                        const target = event.originalEvent.target;

                        // Add additional options for specific markers
                        if (target.dataset.icon === "middleContext") { 
                            App.minimap.createWeapon(tip.e.latlng);
                            this.close();
                            return;
                        } 

                        App.minimap.createMarker(tip.e.latlng, target.dataset.team, target.dataset.category, target.dataset.icon);     
                        this.close();
                    });

                }, 0);

            }
        });

        this.weaponContextMenu = tippy(document.querySelector("#map"), {
            allowHTML: true,
            theme: "contextmenu",
            interactive: true,
            trigger: "manual",
            showOnCreate: false,
            followCursor: "initial",
            plugins: [followCursor],
            duration: 0,
            arrow: false,
            offset: [0, 15],
            onHide: () => {
                $(".shapeButton").off("click");
                $(".penButton").off("click");
            },
            onShow: (tip) => {
                tip.setContent(
                    `
                    <div class="contextmenu">
                        <button id="penButton" class="shapeButton penButton">
                            <span class="pen blue" data-team="shared" data-category="ctx" data-icon="pen"></span>
                        </button>
                    </div>
                    <div class="contextmenu">
                        <button class="shapeButton">
                            <span class="circle blue" data-team="shared" data-category="ctx" data-icon="circle"></span>
                        </button>
                    </div>
                    <div class="contextmenu">
                        <button class="shapeButton">
                            <span class="rectangle blue" data-team="shared" data-category="ctx" data-icon="rectangle"></span>
                        </button>   
                    </div>
                    <div class="contextmenu">
                        <button class="shapeButton">
                            <span class="arrow blue" data-team="shared" data-category="ctx" data-icon="arrow"></span>
                        </button>
                    </div>
                    `
                );

                this.setIcons(tip);

                setTimeout(() => {
                    $(".penButton").on("click", (event) => {

                        // Extract the color from the clicked element
                        let targetElement = event.target.closest(".shapeButton span");

                        // Catch weird clicks outside the span
                        if (!targetElement) return;

                        const color = [...targetElement.classList].find(cls => cls !== "pen");

                        App.minimap.on("pointerdown", (e) => {
                            if (!App.minimap.drawingMode)  return;
                            if (e.originalEvent.button !== 0) return;
                            App.minimap.drawing = true;
                            App.minimap.points = [e.latlng];
                            App.minimap.currentLine = new MapDrawing(App.minimap, color, App.minimap.points);
                        });

                        App.minimap.on("pointermove", (e) => {
                            if (!App.minimap.drawingMode) return;
                            if (!App.minimap.drawing) return;
                            App.minimap.points.push(e.latlng);
                            App.minimap.currentLine.polyline.setLatLngs(App.minimap.points);
                        });
                
                        App.minimap.on("pointerup", () => {
                            if (!App.minimap.drawingMode) return;
                            if (!App.minimap.drawing) return;
                
                            // Avoid creating lines with less than 2 points
                            if (App.minimap.currentLine.polyline.getLatLngs().length < 2) {
                                App.minimap.currentLine.delete();
                                return;
                            }

                            App.minimap.currentLine.finalize();
                            App.minimap.drawing = false;
                            App.minimap.currentLine = null;
                        });

                        App.minimap.enableDrawingMode();
                        this.close();
                    });


                    $(".shapeButton").on("click", (event) => {
                        let targetElement = event.target.closest(".shapeButton span"); // Ensure we get the <span> inside the button
                    
                        if (!targetElement) return;
                                       
                        // Extract the shape type (arrow, rectangle, circle)
                        const shape = ["arrow", "rectangle", "circle"].find(type => targetElement.classList.contains(type));
                    
                        // Extract the color (any other class that isn't the shape itself)
                        const color = [...targetElement.classList].find(cls => cls !== shape);
                    
                        if (shape && color) {
                        // Call the corresponding method dynamically
                            const methodName = `create${shape.charAt(0).toUpperCase() + shape.slice(1)}`;
                            if (typeof App.minimap[methodName] === "function") {
                                App.minimap[methodName](color);
                            }
                        }
                    
                        this.close();
                    });
                }, 0);


            }
        });
    }

    open(event) {
        this.mainContextMenu.e = event;
        this.mainContextMenu.show();
        this.weaponContextMenu.show();
    }

    close(){
        this.mainContextMenu.hide();
        this.weaponContextMenu.hide();
    }

    handleContextMenu() {
        const GLOBALOPTIONS = {
            allowHTML: true,
            interactive: true,
            placement: "bottom",
            duration: 0,
            arrow: false,
            interactiveBorder: 0,
            theme: "contextmenu",
        };

        tippy(document.querySelector(".fob"), {
            ...GLOBALOPTIONS,
            offset: [57, 3],
            onShow: (tip) => {
                const template = document.getElementById("ally_deployables_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });

        tippy(document.querySelector(".friendly"), {
            ...GLOBALOPTIONS,
            offset: [28, 3],
            onShow : (tip) => {
                const template = document.getElementById("ally_vehicles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });

        tippy(document.querySelector(".friendlyInf"), {
            ...GLOBALOPTIONS,
            offset: [-1, 3],
            onShow : (tip) => {
                const template = document.getElementById("ally_infantry_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            },
        });
        
        tippy(document.querySelector(".enemyfob"), {
            ...GLOBALOPTIONS,
            offset: [0, 3],
            onShow : (tip) => {
                const template = document.getElementById("enemy_deployables_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            },
        });

        tippy(document.querySelector(".enemy"), {
            ...GLOBALOPTIONS,
            offset: [57, 3],
            onShow : (tip) => {
                const template = document.getElementById("enemy_infantry_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });

        tippy(document.querySelector(".enemyVehicles"), {
            ...GLOBALOPTIONS,
            offset: [28, 3],
            onShow : (tip) => {
                const template = document.getElementById("enemy_vehicles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });

        tippy(document.querySelector(".pen.blue"), {
            ...GLOBALOPTIONS,
            placement: "right",
            offset: [0, 3],
            onShow : (tip) => {
                const template = document.getElementById("pens_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });

        tippy(document.querySelector(".arrow.blue"), {
            ...GLOBALOPTIONS,
            placement: "right",
            offset: [0, 3],
            onShow : (tip) => {
                const template = document.getElementById("arrows_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });

        tippy(document.querySelector(".rectangle.blue"), {
            ...GLOBALOPTIONS,
            placement: "right",
            offset: [0, 3],
            onShow : (tip) => {
                const template = document.getElementById("rectangles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });

        tippy(document.querySelector(".circle.blue"), {
            ...GLOBALOPTIONS,
            placement: "right",
            offset: [0, 3],
            onShow : (tip) => {
                const template = document.getElementById("circles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
                this.setIcons(tip);
            }
        });
    }

    setIcons(tip) {
        // Dynamically set background from data attributes
        tip.popper.querySelectorAll("[data-icon]").forEach(el => {
            const team = el.dataset.team;
            const category = el.dataset.category;
            const icon = el.dataset.icon;

            // Build the path
            let iconPath = `/img/icons/${team}/${category}/${icon}.webp`;
            el.style.backgroundImage = `url('${iconPath}')`;
            el.style.backgroundSize = "contain";
        });
    }
}