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
                        <button class="ctxButton fobbutton">
                            <span class="fob" data-team="ally" data-category="deployables" data-icon="deployable_fob_blue"></span>
                        </button>
                        <button class="ctxButton friendlyButton">
                            <span class="friendly" data-team="ally" data-category="vehicles" data-icon="map_truck_logistics"></span>
                        </button>
                        <button class="ctxButton friendlyInfButton">
                             <span class="friendlyInf" data-team="ally" data-category="infantry" data-icon="map_genericinfantry"></span>
                        </button>
                        <button class="ctxButton middleContextButton">
                            <span class="middleContext" data-icon="middleContext"></span>
                        </button>
                        <button class="ctxButton enemyFOBButton">
                            <span class="enemyfob" data-team="enemy" data-category="deployables" data-icon="deployable_fob"></span>
                        </button>
                        <button class="ctxButton enemyVehiclesButton">
                            <span class="enemyVehicles" data-team="enemy" data-category="vehicles" data-icon="map_truck_logistics"></span>
                        </button>
                        <button class="ctxButton enemyButton">
                            <span class="enemy" data-team="enemy" data-category="infantry" data-icon="map_genericinfantry"></span>
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
                    position: "top",
                    offset: [0, 15],
                    onShow: (tip) => {
                        tip.setContent(
                            `<div class="contextmenu"">
                                <button class="ctxButton weaponContext">
                                    <span class="arrowBlue weaponContext"></span>
                                </button>   
                            </div>
                            <div class="contextmenu"">
                                <button class="ctxButton weaponContext">
                                    <span class="arrowRed weaponContext"></span>
                                </button>   
                            </div>`
                        );
                        
                        setTimeout(() => {

                            $(".weaponContext").on("click", (event) => {
                                tip.hide();
                                
                                // Use event.target instead of event.originalEvent.originalTarget
                                let targetElement = event.target;
                            
                                // Check if the clicked element or its ancestor has the 'arrowBlue' class
                                let isBlueArrow = targetElement.classList.contains("arrowBlue") ||
                                                  targetElement.closest(".arrowBlue") !== null;
                            
                                let color = isBlueArrow ? "blue" : "#ee1b14";
                                App.minimap.createArrow(color);
                            });
                            
                        }, 0);
                    }
                });

            }
        });
    }

    open(e){
        this.mainContextMenu.e = e;
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
            offset: [57, 3],
            onShow(tip) {
                const template = document.getElementById("enemy_deployables_html");
                const clone = document.importNode(template.content, true);
                tip.setContent(clone);
            },
        });

        tippy(document.querySelector(".enemy"), {
            ...GLOBALOPTIONS,
            offset: [0, 3],
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

    }
}