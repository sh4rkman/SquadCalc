import tippy, {followCursor} from "tippy.js";
import "tippy.js/dist/tippy.css";
import { App } from "../app.js";
import { Icon, Polyline, PolylineDecorator, Symbol, DomEvent } from "leaflet";
import { squadStratMarker } from "./squadMarker.js";



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
                        const team = target.dataset.team;
                        const category = target.dataset.category;
                        const icon = target.dataset.icon;
                        var markerOptions = { icon: "" };
                        var iconSize = [30, 30];

                        // Add additional options for specific markers
                        if (icon === "middleContext") { 
                            App.minimap.createWeapon(tip.e.latlng);
                            this.close();
                            return;
                        }
                        if (icon === "deployable_fob_blue") { markerOptions.circles = true; }
                        if (icon === "deployable_fob") { 
                            markerOptions.circles = true;
                            markerOptions.circlesOnHover = true;
                            markerOptions.color = "#f23534";
                        }
                        if (icon === "deployable_hab_activated") { iconSize = [38, 38]; }
                        if (icon === "T_strategic_uav") { 
                            markerOptions.circles = true;
                            if (team === "ally") { markerOptions.color = "#ffc400"; }
                            else { markerOptions.color = "#f23534"; }
                        }
                        markerOptions.icon = new Icon({
                            iconUrl: `/icons/${team}/${category}/${icon}.webp`,
                            iconSize: iconSize,
                            iconAnchor: [iconSize[0]/2, iconSize[1]/2]
                        });
                        
                        // Create marker and close context menu
                        new squadStratMarker(tip.e.latlng, markerOptions, App.minimap).addTo(App.minimap.markersGroup);                        
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
                                let isDrawing = false;
                                let polyline = null;
                                let polylineDecorator = null;
                                let color = event.originalEvent.originalTarget.classList.contains("arrowBlue") ? "blue" : "#ee1b14";
                                
                                document.removeEventListener("contextmenu", this.handleContextMenu);
                            
                                const handleMouseMove = (e) => {
                                    const endLatLng = e.latlng;
                                    if (polyline) {
                                        polyline.setLatLngs([this.mainContextMenu.e.latlng, endLatLng]);
                                        polylineDecorator.removeFrom(App.minimap.markersGroup);
                                        polylineDecorator = new PolylineDecorator(polyline, {
                                            patterns: [ {
                                                offset: "100%",
                                                repeat: 0,
                                                symbol: new Symbol.arrowHead({
                                                    pixelSize: 15,
                                                    polygon: false,
                                                    fill: true,
                                                    yawn: 70,
                                                    pathOptions: {
                                                        stroke: true,
                                                        color: color,
                                                        weight: 3,
                                                        fillColor: color,
                                                        fillOpacity: 1,
                                                    }
                                                })
                                            }]
                                        }).addTo(App.minimap.markersGroup);
                                    } else {
                                        let arrowOptions = {
                                            color: color,
                                            weight: 3,
                                            className: "mapArrow",
                                            showMeasurements: true,
                                            measurementOptions: {
                                                showTotalDistance: false,
                                                minPixelDistance: 100,
                                                showOnHover: true,
                                            }
                                        };
                                        polyline = new Polyline([this.mainContextMenu.e.latlng, endLatLng], arrowOptions).addTo(App.minimap.markersGroup);
                                        polylineDecorator = new PolylineDecorator(polyline, {
                                            patterns: [
                                                {offset: "100%", repeat: 0, symbol: new Symbol.arrowHead({pixelSize: 100, polygon: false, pathOptions: {stroke: true}})}
                                            ]
                                        }).addTo(App.minimap.markersGroup);

                                        polyline.on("mouseover", () => {
                                            //polyline.hideMeasurements()
                                        });
                                        
                                        // Add a contextmenu event listener to cancel drawing
                                        polyline.once("contextmenu", (e) => {
                                            
                                            App.minimap.removeLayer(polyline); // Remove the polyline from the map
                                            App.minimap.removeLayer(polylineDecorator);
                                            polylineDecorator.removeFrom(App.minimap.markersGroup);
                                            polyline = null;
                                            isDrawing = false;
                                            App.minimap.off("mousemove", handleMouseMove);
                                            DomEvent.preventDefault(e);
                                            DomEvent.stopPropagation(e);
                                            DomEvent.stop(e);
                                            
                                        });
                                    }
                                };
                            
                                const handleClick = () => {
                                    if (isDrawing) {
                                        // Finalize the polyline
                                        App.minimap.off("mousemove", handleMouseMove); // Stop updating the polyline
                                        isDrawing = false; // Stop the drawing process
                                    }
                                };
                            
                                const handleRightClick = () => {
                                    // Cancel the drawing process on right-click
                                    if (isDrawing) {
                                        App.minimap.removeLayer(polyline); // Remove the polyline from the map
                                        polylineDecorator.removeFrom(App.minimap.markersGroup);
                                        polyline = null; // Reset the polyline reference
                                        isDrawing = false; // Stop the drawing process
                                        App.minimap.off("mousemove", handleMouseMove);
                                    }
                                    
                                };
                            
                                // Start drawing process when weaponContext is clicked
                                if (!isDrawing) {
                                    isDrawing = true;
                                    App.minimap.on("mousemove", handleMouseMove); // Add the mousemove listener
                                    App.minimap.once("click", handleClick); // Add a one-time click listener to finalize the polyline
                                }
                            
                                // Add a right-click (contextmenu) listener to cancel the drawing process
                                App.minimap.on("contextmenu", handleRightClick);
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