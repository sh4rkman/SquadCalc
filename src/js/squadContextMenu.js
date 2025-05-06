import tippy, {followCursor} from "tippy.js";
import "tippy.js/dist/tippy.css";
import { App } from "../app.js";


export default class SquadContextMenu {

    constructor() {

        document.addEventListener("contextmenu", this.handleContextMenu);
        
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
                document.removeEventListener("contextmenu", this.handleContextMenu);
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
                            <span class="middleContext" data-icon="middleContext"></span>
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
            },
            onShow: (tip) => {
                tip.setContent(
                    `
                    <div class="contextmenu">
                        <button class="shapeButton">
                            <span class="circle blue"></span>
                        </button>
                    </div>
                    <div class="contextmenu">
                        <button class="shapeButton">
                            <span class="rectangle blue"></span>
                        </button>   
                    </div>
                    <div class="contextmenu">
                        <button class="shapeButton">
                            <span class="arrow blue"></span>
                        </button>
                    </div>
                    `
                );
                
                setTimeout(() => {
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
            onShow(tip) {
                const template = document.getElementById("ally_deployables_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            }
        });

        tippy(document.querySelector(".friendly"), {
            ...GLOBALOPTIONS,
            offset: [28, 3],
            onShow(tip) {
                const template = document.getElementById("ally_vehicles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            }
        });

        tippy(document.querySelector(".friendlyInf"), {
            ...GLOBALOPTIONS,
            offset: [-1, 3],
            onShow(tip) {
                const template = document.getElementById("ally_infantry_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            },
        });
        
        tippy(document.querySelector(".enemyfob"), {
            ...GLOBALOPTIONS,
            offset: [0, 3],
            onShow(tip) {
                const template = document.getElementById("enemy_deployables_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            },
        });

        tippy(document.querySelector(".enemy"), {
            ...GLOBALOPTIONS,
            offset: [57, 3],
            onShow(tip) {
                const template = document.getElementById("enemy_infantry_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            }
        });

        tippy(document.querySelector(".enemyVehicles"), {
            ...GLOBALOPTIONS,
            offset: [28, 3],
            onShow(tip) {
                const template = document.getElementById("enemy_vehicles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            }
        });

        tippy(document.querySelector(".arrow.blue"), {
            ...GLOBALOPTIONS,
            placement: "right",
            offset: [0, 3],
            onShow(tip) {

                const template = document.getElementById("arrows_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            }
        });

        tippy(document.querySelector(".rectangle.blue"), {
            ...GLOBALOPTIONS,
            placement: "right",
            offset: [0, 3],
            onShow(tip) {
                const template = document.getElementById("rectangles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            }
        });

        tippy(document.querySelector(".circle.blue"), {
            ...GLOBALOPTIONS,
            placement: "right",
            offset: [0, 3],
            onShow(tip) {
                const template = document.getElementById("circles_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            }
        });


    }
}