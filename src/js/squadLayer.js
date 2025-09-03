
import { DivIcon, Marker, Circle, LayerGroup, Polyline, Polygon, Rectangle, FeatureGroup } from "leaflet";
import { SquadObjective } from "./squadObjective.js";
import { App } from "../app.js";
import "./libs/leaflet-measure-path.js";
import SquadFactions from "./squadFactions.js";
import { Hexagon } from "./libs/leaflet-hexagon.js";

export default class SquadLayer {

    constructor(map, layerData) {
        this.map = map;
        this.activeLayerMarkers = new LayerGroup().addTo(this.map);
        this.activeFaction1Markers = new LayerGroup();
        this.activeFaction2Markers = new LayerGroup();
        this.layerData = layerData;
        this.capturePoints = layerData.capturePoints;
        this.objectives = layerData.objectives;
        this.gamemode = layerData.gamemode;
        this.isRandomized = this.isRandomized(); 
        
        [this.offset_x, this.offset_y] = this.getLayerOffsets(this.layerData.mapTextureCorners);
        this.isVisible = true;
        this.currentPosition = 0;

        // latlng's of the currently selected flags
        this.path = [];
        this.polyline = new Polyline(this.path, {
            color: "white",
            opacity: 0.9,
            showMeasurements: true,
            measurementOptions: {
                minPixelDistance: 50,
                scaling: this.map.mapToGameScale,
            }
        }).addTo(this.activeLayerMarkers);

        if (!App.userSettings.showFlagsDistance) this.polyline.hideMeasurements();

        // Currently selected flags
        this.selectedFlags = [];
        this.selectedReachableClusters = [];

        // Hold the availables clusters at all time
        this.currentReachableClusters = new Set();
        this.mains = [];
        this.mainZones = {
            rectangles: [],
            texts: [],
            assets: []
        };
        this.caches = new FeatureGroup().addTo(this.map);
        this.phaseNumber = new FeatureGroup().addTo(this.map);
        this.phaseAeras = new FeatureGroup().addTo(this.map);
        this.flags = [];
        this.reversed = false;
        this.init();

        if (process.env.DISABLE_FACTIONS != "true") {
            this.factions = new SquadFactions(this);
            if (App.userSettings.enableFactions) $("#factionsTab").show();
        }

        // If already zoomed in, reveal capzones/main assets
        if (this.map.getZoom() > this.map.detailedZoomThreshold) this.revealAllCapzones();

        this.setMainZoneOpacity(true);
    }


    /**
     * Checks if the current layer's gamemode is randomized.
     * A layer is considered randomized if its gamemode is either "RAAS" or "Invasion"
     * @returns {boolean} True if the layer is randomized, false otherwise
     */
    isRandomized() {
        return this.gamemode === "RAAS" || this.gamemode === "Invasion";
    }


    /**
     * xxxx
     * @return {number} - xxxx
     */
    init(){

        switch (this.gamemode) {
        case "Destruction":
            this.initDestruction(this.capturePoints);
            break;
        case "AAS":
        case "Seed":
            this.initPredictiveLayer();
            //this.initSkirmishLayer(); // TODO: use a single function for AASGraphs
            break;
        case "TC":
            this.initTerritoryControl(this.capturePoints);
            break;
        case "RAAS":
        case "Invasion":
            this.initRandomizedLayer();
            break;
        case "Skirmish":
            this.initSkirmishLayer();
            break;
        default:
            this.clear();
            throw new Error(`Unsupported gamemode: "${this.gamemode}"`);
        }

        // Create Other Layer Assets
        this.createHelipads();
        this.createDeployables();
        this.createProtectionZones();
        this.createBorders();
        this.createSpawners();
    }


    createSpawners(){

        this.Team1QuadBikes = [];
        this.Team2QuadBikes = [];
        this.Team1MRAPs = [];

        this.team1VehicleSpawners = {
            helicopters: [],
            boats: [],
            vehicles: [],
            bikes: [],
        };

        this.team2VehicleSpawners = {
            helicopters: [],
            boats: [],
            vehicles: [],
            bikes: []
        };

        this.layerData.assets.vehicleSpawners.forEach((spawner) => {

            const latlng = this.convertToLatLng(spawner.location_x, spawner.location_y);

            const vehicleConfig = {
                MBT: { color: "white", halfWidth: 2.3, halfHeight: 1.7, key: "vehicles" },
                APC: { color: "purple",   halfWidth: 3,   halfHeight: 1.7, key: "vehicles" },
                Car: { color: "blue",     halfWidth: 2,   halfHeight: 1.5, key: "vehicles" },
                QuadBike: { color: "yellow", halfWidth: 1,   halfHeight: 0.8, key: "bikes" },
                Helicopter: { color: "white", halfWidth: 12,  halfHeight: 12, key: "helicopters" },
                Boat: { color: "black",   halfWidth: 3,   halfHeight: 1.5, key: "boats" },
            };

            let color = "white";
            let halfWidth = 1;
            let halfHeight = 1;

            const config = vehicleConfig[spawner.size];
            if (config) {
                ({ color, halfWidth, halfHeight } = config);

                const teamKey = spawner.type === "Team One" ? this.team1VehicleSpawners : this.team2VehicleSpawners;
                    
                    

                teamKey[config.key].push(spawner);
            }

            const bounds = [
                [latlng[0] - halfHeight * this.map.gameToMapScale, latlng[1] - halfWidth * this.map.gameToMapScale], // top-left (y, x)
                [latlng[0] + halfHeight * this.map.gameToMapScale, latlng[1] + halfWidth * this.map.gameToMapScale]  // bottom-right
            ];


            let spawnRectangle;

            if (spawner.typePriorities.length > 0) {
                
                // let prio = spawner.typePriorities[0].name;
                // new Marker(latlng, {
                //     interactive: false,
                //     icon: new DivIcon({
                //         className: "spawnText",
                //         html: `${prio}`,
                //         iconSize: [50, 50],
                //         iconAnchor: [25, 40]
                //     })
                // }).addTo(this.activeLayerMarkers);

                spawnRectangle = new Rectangle(bounds, {
                    color: color,
                    fillOpacity: 0.25,
                    opacity: 1,
                    weight: 1,
                }).addTo(this.activeLayerMarkers);

            } else {

                spawnRectangle = new Rectangle(bounds, {
                    color: color,
                    fillOpacity: 0.05,
                    opacity: 0.75,
                    weight: 1,
                    dashArray: "4 4" 
                }).addTo(this.activeLayerMarkers);

            }

            this.rotateRectangle(spawnRectangle, spawner.rotation_z);

        });

    }


    initSkirmishLayer() {

        // Set Paths
        Object.values(this.capturePoints.points.links).forEach(link => {
            const nodeAFlag = Object.values(this.objectives).find(objective => objective.objectDisplayName === link.nodeA);
            const nodeBFlag = Object.values(this.objectives).find(objective => objective.objectDisplayName === link.nodeB);
            const latlngNodeA = this.convertToLatLng(nodeAFlag.location_x, nodeAFlag.location_y);
            const latlngNodeB = this.convertToLatLng(nodeBFlag.location_x, nodeBFlag.location_y);
            let path = [latlngNodeA, latlngNodeB];

            // Not using this.path here because several path would be created on each others
            new Polyline(path, {
                color: "white",
                opacity: 0.9,
                weight: 2,
                showMeasurements: false,
                // measurementOptions: {
                //     minPixelDistance: 50,
                //     scaling: this.map.mapToGameScale,
                // }
            }).addTo(this.activeLayerMarkers);

        });

        Object.values(this.objectives).forEach((obj) => {
            const latlng = this.convertToLatLng(obj.location_x, obj.location_y);

            // Identify and process mains
            if (obj.name === "Main") {
                let newFlag = new SquadObjective(latlng, this, obj, 1, obj);
                this.flags.push(newFlag);
                this.mains.push(newFlag);
                return;
            }

            const newFlag = new SquadObjective(latlng, this, obj, 0, obj);
            this.flags.push(newFlag);

            obj.objects.forEach(cap => {
                newFlag.createCapZone(cap);
            });
        });

        //this.polyline.setLatLngs(this.path);

    }



    /**
     * Initialize a layer going from first to last point
     * AAS - SEED
     */
    initPredictiveLayer(){
        const pointsOrder = this.capturePoints?.points?.pointsOrder;
        const objectives = this.objectives;

        let orderedObjectives = [];

        // Sort objectives according to their order in layerData.capturePoints.points.pointsOrder
        const nameToObjective = Object.values(objectives).reduce((acc, obj) => {
            acc[obj.objectDisplayName] = obj;
            return acc;
        }, {});

        orderedObjectives = pointsOrder.map(name => nameToObjective[name]).filter(Boolean);

        orderedObjectives.forEach((obj) => {
            const latlng = this.convertToLatLng(obj.location_x, obj.location_y);

            // Identify and process mains
            if (obj.name === "Main") {
                this.path.push(latlng);
                let newFlag = new SquadObjective(latlng, this, obj, 1, obj);
                this.flags.push(newFlag);
                this.mains.push(newFlag);
                return;
            }

            const newFlag = new SquadObjective(latlng, this, obj, 0, obj);
            this.path.push(latlng);
            this.flags.push(newFlag);

            obj.objects.forEach(cap => {
                newFlag.createCapZone(cap);
            });
        });

        this.polyline.setLatLngs(this.path);
    }

    /**
     * Initialize TC
     * @param {Array} capturePoints - List of Points from layerData
     */
    initTerritoryControl(capturePoints) {

        // Create the Mains
        Object.values(capturePoints.points.objectives).forEach((main) => {
            const latlng = this.convertToLatLng(main.location_x, main.location_y);
            const newFlag = new SquadObjective(latlng, this, main, 1, main);
            this.flags.push(newFlag);
            this.mains.push(newFlag);
        });

        // Create the Hexagons
        Object.values(capturePoints.hexs.hexs).forEach((hex) => {
            const LATLNG = this.convertToLatLng(hex.location_x, hex.location_y);
            const HEXRADIUS = (hex.boxExtent.location_x * this.map.gameToMapScale) / 100;
            const teamColors = { 0: "white", 1: "MediumBlue", 2: "firebrick" };
            const color = teamColors[hex.initialTeam];
            
            new Hexagon(LATLNG, HEXRADIUS, {color: color, weight: 1}).addTo(this.activeLayerMarkers);
            new Marker(LATLNG, {
                interactive: false,
                icon: new DivIcon({
                    className: "hexNumber",
                    html: hex.hexNum,
                    iconSize: [50, 50],
                    iconAnchor: [25, 8]
                })
            }).addTo(this.activeLayerMarkers);
        });
    }


    /**
     * Initialize a layer going from first to last point
     * RAAS - Invasion
     */
    initRandomizedLayer() {

        Object.values(this.objectives).forEach((objCluster) => {

            // Create Mains
            if (!objCluster.points) {
                const latlng = this.convertToLatLng(objCluster.location_x, objCluster.location_y);
                const newFlag = new SquadObjective(latlng, this, objCluster, 1, objCluster);
                this.mains.push(newFlag);
                this.flags.push(newFlag);
                return;
            } 

            objCluster.points.forEach((obj) => {

                let latlng = this.convertToLatLng(obj.location_x, obj.location_y);
                let flagExists = false;

                this.flags.forEach((flag) => {
                    if (this.areLatLngsClose(flag.latlng, latlng)) {
                        console.debug(`adding cluster ${objCluster.name} to flag ${flag.name}`);
                        console.debug("new clustersList: ", flag.clusters);
                        flag.addCluster(objCluster);
                        flagExists = true;
                    }
                });

                if (!flagExists) {
                    const newFlag = new SquadObjective(latlng, this, obj, 0, objCluster);
                    this.flags.push(newFlag);
                    newFlag.hide();
                    // Adding capzones to the flag object
                    obj.objects.forEach((cap) => {
                        newFlag.createCapZone(cap);
                    });
                }
            });
        });

        // Pre-select first main flag in invasion
        if (this.gamemode === "Invasion") {
            this.mains.forEach((main) => {
                // Invaders are always Team 1
                if (main.objectName.toLowerCase().includes("team1")){
                    this._handleFlagClick(main, false);
                    return;
                }
            });
        }
    
    }

    /**
     * Initialize Destruction layer
     */
    initDestruction(capturePoints) {
        // Creating the Caches
        Object.values(capturePoints.objectiveSpawnLocations).forEach((cache) => {
            const latlng = this.convertToLatLng(cache.location_x, cache.location_y);
            const radius = 1.5 * this.map.gameToMapScale;
            this.caches.addLayer(new Circle(latlng, {
                radius: radius,
                color: App.mainColor,
                fillColor: "white",
                opacity: 1,
                weight: 1.5,
                fillOpacity: 1,
            }).addTo(this.activeLayerMarkers));
        });
        // Creating the Mains
        Object.values(capturePoints.points.objectives).forEach((main) => {
            const latlng = this.convertToLatLng(main.location_x, main.location_y);
            const newFlag = new SquadObjective(latlng, this, main, 1, main);
            this.flags.push(newFlag);
            this.mains.push(newFlag);
        });
        // Creating the phase aeras
        Object.values(capturePoints.destructionObject.phases).forEach((phases) => {

            phases.phaseObjectives.forEach((obj) => {
                const latlngs = [];
                let totalLat = 0;
                let totalLng = 0;
                let center;

                obj.splinePoints.forEach((point) => {
                    let latlng = this.convertToLatLng(point.location_x, point.location_y);
                    totalLat += ((point.location_y - this.offset_y) / 100 * -this.map.gameToMapScale);
                    totalLng += ((point.location_x - this.offset_x) / 100 * this.map.gameToMapScale);
                    latlngs.push(latlng);
                });
        
                // Draw the aeras
                new Polygon(latlngs, {
                    color: "red",
                    dashArray: "10,8",
                    weight: 1,
                    fillOpacity: 0,
                }).addTo(this.phaseAeras);

                // This is the centroid where we'll place the phase number
                center = [totalLat / latlngs.length, totalLng / latlngs.length];
                
                // Place the phase number in the center of the zone
                new Marker(center, {
                    interactive: false,
                    icon: new DivIcon({
                        className: "destructionPhase",
                        html: phases.PhaseNumber + 1,
                        iconSize: [50, 50],
                        iconAnchor: [25, 25]
                    })
                }).addTo(this.phaseNumber);
            });
        });
    }


    /**
     * Calculates the X and Y offsets needed to align a layer object to the Map
     *
     * @param {Array<{location_x: number, location_y: number}>} mapTextureCorners array of layers two corner
     * @returns {[number, number]} array containing the calculated X and Y offsets
     */
    getLayerOffsets(mapTextureCorners) {
        let layerOriginX = Math.min(mapTextureCorners[0].location_x, mapTextureCorners[1].location_x);
        let layerOriginY = Math.min(mapTextureCorners[0].location_y, mapTextureCorners[1].location_y);
        let layerOffsetToMapX = (this.map.activeMap.SDK_data.minimap.corner0[0] * 100) - layerOriginX;
        let layerOffsetToMapY = (this.map.activeMap.SDK_data.minimap.corner0[1] * 100) - layerOriginY;
        return [layerOriginX + layerOffsetToMapX, layerOriginY + layerOffsetToMapY];
    }


    /**
     * Reveal all capzones on the map
     */
    revealAllCapzones() {
        if (App.userSettings.capZoneOnHover || !this.isVisible) return;
        this.flags.forEach(flag => {
            if (!flag.isHidden && !flag.isFadeOut) flag.revealCapZones();
        });
    }


    /**
     * Hide all capzones on the map
     */
    hideAllCapzones() {
        this.flags.forEach(flag => { flag.hideCapZones(); });
    }

    
    /**
     * Convert a SDK coordinate to a Leaflet LatLng coordinate
     * @param {number} x - latitude in cm as found in the squadpipeline extraction
     * @param {number} y - longitude in cm as found in the squadpipeline extraction
     * @returns {Array} - [latitude, longitude] in meters
     */ 
    convertToLatLng(x, y) {
        return [(y - this.offset_y) / 100 * -this.map.gameToMapScale, (x - this.offset_x) / 100 * this.map.gameToMapScale];
    }


    /**
     * Convert a coordinate from the game scale to the map scale
     * @param {number} coord - coordinate in cm
     * @returns {number} - coordinate in meters, scaled to the map
     */
    scaleToMap(coord) {
        return coord / 100 * this.map.gameToMapScale;
    }


    /**
     * Function to check if two latlngs are close to each other
     * @param {Array} latlng1 - [latitude, longitude] in meters
     * @param {Array} latlng2 - [latitude, longitude] in meters
     * @param {number} threshold - The distance threshold in meters (default 5)
     * @returns {boolean} - True if the distance is less than the threshold
     */
    areLatLngsClose(latlng1, latlng2, threshold = 3) {
        const [x1, y1] = latlng1;
        const [x2, y2] = latlng2;
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance < threshold;
    }


    /**
     * Create helipads on the map
     * @param {Array} this.layerData.assets.helipads - Array of helipads
     * @returns {void}
     */
    createHelipads() {
        this.layerData.assets.helipads.forEach((asset) => {
            const latlng = this.convertToLatLng(asset.location_x, asset.location_y);
            let marker = new Marker(latlng, {
                interactive: false,
                keyboard: false,
                zIndexOffset: -1000,
                opacity: 0,
                icon: new DivIcon({
                    className: "deployables",
                    iconSize: [36, 36],
                })
            }).addTo(this.activeLayerMarkers);
            const iconElement = marker.getElement();
            iconElement.style.backgroundImage = `url('${process.env.API_URL}/img/icons/ally/deployables/deployable_helipad.webp')`;
            this.mainZones.assets.push(marker);
        });
    }


    /**
     * Create deployables on the map
     * @param {Array} this.layerData.assets.deployables - Array of deployables
     * @returns {void}
     */
    createDeployables() {

        let assetsMarkerParams = {
            interactive: false,
            keyboard: false,
            zIndexOffset: -1000,
            opacity: 0,
        };

        this.layerData.assets.deployables.forEach((asset) => {

            const latlng = this.convertToLatLng(asset.location_x, asset.location_y);

            if (asset.type === "Repair Station") {
                let marker = new Marker(latlng, {
                    ...assetsMarkerParams,
                    icon: new DivIcon({
                        className: "deployables",
                        iconSize: [30, 30]
                    })
                }).addTo(this.activeLayerMarkers);
                const iconElement = marker.getElement();
                iconElement.style.backgroundImage = `url('${process.env.API_URL}/img/icons/ally/deployables/deployable_repairstation.webp')`;
                this.mainZones.assets.push(marker);
            }

            if (asset.type === "Ammo Crate") {
                let marker = new Marker(latlng, {
                    ...assetsMarkerParams,
                    icon: new DivIcon({
                        className: "deployables",
                        iconSize: [25, 25]
                    })
                }).addTo(this.activeLayerMarkers);

                const iconElement = marker.getElement();
                iconElement.style.backgroundImage = `url('${process.env.API_URL}/img/icons/ally/deployables/deployable_ammocrate.webp')`;
                this.mainZones.assets.push(marker);
            }
        });
    }


    createBorders() {
        const MAPBOUNDS = [
            [0, 0],
            [0, this.map.pixelSize],
            [-this.map.pixelSize, this.map.pixelSize],
            [-this.map.pixelSize, 0],
            [0, 0]
        ];

        // There's no border but the map bounds
        if (this.layerData.border.length === 2) return;

        let borderPath = [];

        this.layerData.border.forEach((border) => {
            // keep the latlng within the map bounds
            var latlng = this.convertToLatLng(border.location_x, border.location_y);
            if (latlng[1] > this.map.pixelSize) {latlng[1] = this.map.pixelSize;}
            if (latlng[0] < -this.map.pixelSize) {latlng[0] = -this.map.pixelSize;}
            if (latlng[1] < 0) {latlng[1] = 0;}
            if (latlng[0] > 0) {latlng[0] = 0;}
            borderPath.push(latlng);
        });

        let opacity = 0.75;

        if (!App.userSettings.showMapBorders) opacity = 0;

        this.borders = new Polygon([MAPBOUNDS, borderPath], {
            color: "#111",
            fillOpacity: opacity,
            weight: 0,
            className: "unplayable-area",
        }).addTo(this.activeLayerMarkers);
    }

    /**
     * Rotate a Leaflet Rectangle around its center
     * @param {Rectangle} rectangle - Rectangle to rotate
     * @param {number} angle - The angle in degrees
     * @param {Array} rotationCenter - The center of rotation [latitude, longitude]
     * @returns {void}
     */
    rotateRectangle(rectangle, angle) {
        const center = rectangle.getBounds().getCenter();
        const corners = rectangle.getLatLngs()[0];
        const radians = (Math.PI / 180) * angle;
        const rotatedCorners = corners.map(corner => {
            const latDiff = corner.lat - center.lat;
            const lngDiff = corner.lng - center.lng;
            return [
                center.lat + (latDiff * Math.cos(radians) - lngDiff * Math.sin(radians)),
                center.lng + (latDiff * Math.sin(radians) + lngDiff * Math.cos(radians))
            ];
        });
        rectangle.setLatLngs(rotatedCorners);
    }

    
    /**
     * Rotate a Leaflet Circle around a center point
     * @param {Circle} circle - Leaflet circle to rotate
     * @param {number} angle - The angle in degrees
     * @param {Array} rotationCenter - The center of rotation [latitude, longitude]
     * @returns {void}
     */ 
    rotateCircle(circle, angle, rotationCenter) {
        const circleCenter = circle.getLatLng();
        const radians = (Math.PI / 180) * angle; // Convert angle to radians
        const latDiff = circleCenter.lat - rotationCenter.lat;
        const lngDiff = circleCenter.lng - rotationCenter.lng;
        const newCenter = [
            rotationCenter.lat + (latDiff * Math.cos(radians) - lngDiff * Math.sin(radians)),
            rotationCenter.lng + (latDiff * Math.sin(radians) + lngDiff * Math.cos(radians))
        ];
        circle.setLatLng(newCenter);
    }
    

    /**
     * Create protection zones and no construction zones
     * @param {Array} this.layerData.mapAssets.protectionZones - Array of protection zones
     */
    createProtectionZones() {
        const PZONECOLOR = App.mainColor;

        // Creating protectionZones + noConstructionZones
        this.layerData.mapAssets.protectionZones.forEach((pZone) => {

            // Skip small protection zones (old basrah)
            if (pZone.objects[0].boxExtent.extent_x < 100) return;

            // Skip weird protection zones
            if (pZone.teamid === "0") return;

            // Center of the protection zone
            let [location_y, location_x] = this.convertToLatLng(pZone.objects[0].location_x, pZone.objects[0].location_y);

            // Protection Zone is a Rectangle/Capsule
            // We're drawing capsule as a rectangle cause it's easier
            //if (pZone.objects[0].isBox || pZone.objects[0].isCapsule) {  
            if (pZone.objects[0].isBox) {              

                // Radiis
                let protectRadiusX = ( pZone.objects[0].boxExtent.extent_x / 100 ) * -this.map.gameToMapScale;
                let protectRadiusY = ( pZone.objects[0].boxExtent.extent_y / 100 ) * -this.map.gameToMapScale;

                let nodeploRadiusX = protectRadiusX + ( pZone.deployableLockDistance / 100 ) * -this.map.gameToMapScale;
                let nodeploRadiusY = protectRadiusY + ( pZone.deployableLockDistance / 100 ) * -this.map.gameToMapScale;

                // Bounds
                let protectNWCorner = [(location_y + protectRadiusY) , (location_x + protectRadiusX)];
                let protectSECorner = [(location_y - protectRadiusY), (location_x - protectRadiusX)];
                let protectBounds = [protectNWCorner, protectSECorner];

                let noDeployNWCorner = [(location_y + nodeploRadiusY) , (location_x + nodeploRadiusX)];
                let noDeploySECorner = [(location_y - nodeploRadiusY), (location_x - nodeploRadiusX)];
                let noDeployBounds = [noDeployNWCorner, noDeploySECorner];

                let protectionZone = new Rectangle(protectBounds, {
                    color: PZONECOLOR,
                    opacity: 1,
                    weight: 2,
                }).addTo(this.activeLayerMarkers);

                let noDeployZone = new Rectangle(noDeployBounds, {
                    color: PZONECOLOR,
                    dashArray: "10,20",
                    opacity: 1,
                    weight: 1,
                }).addTo(this.activeLayerMarkers);

                if (pZone.objects[0].boxExtent.rotation_z != 0){
                    this.rotateRectangle(protectionZone, pZone.objects[0].boxExtent.rotation_z);
                    this.rotateRectangle(noDeployZone, pZone.objects[0].boxExtent.rotation_z);
                }

                this.mainZones.rectangles.push(protectionZone);
                this.mainZones.rectangles.push(noDeployZone);
                return;
            }

            // Protection is a Sphere
            if (pZone.objects[0].isSphere) {

                // Center of the protection zone
                let latlngSphere = [location_y, location_x];

                // Protection & NoDeployementZone radiis
                let protectRadius = pZone.objects[0].sphereRadius / 100 * this.map.gameToMapScale;
                let noDeployRadius = (pZone.objects[0].sphereRadius + pZone.deployableLockDistance) / 100 * this.map.gameToMapScale;

                let protectionZone = new Circle(latlngSphere, {
                    color: App.mainColor,
                    opacity: 1,
                    weight: 2,
                    radius: protectRadius,
                }).addTo(this.activeLayerMarkers);

                let noDeployZone = new Circle(latlngSphere, {
                    color: App.mainColor,
                    dashArray: "10,20",
                    opacity: 1,
                    weight: 1,
                    radius: noDeployRadius,
                }).addTo(this.activeLayerMarkers);

                this.mainZones.rectangles.push(protectionZone);
                this.mainZones.rectangles.push(noDeployZone);
            }

        });
    }

    setMainZoneOpacity(on){
        var opacity = on ? 1 : 0;
        const textOpacity = on ? 1 : 0;
        const fillOpacity = on ? 0.05 : 0;

        this.mainZones.rectangles.forEach((rectangle) => {
            if (!App.userSettings.showMainZones) {
                rectangle.setStyle({ fillOpacity: 0, opacity: 0 });
            } else {
                rectangle.setStyle({ fillOpacity: fillOpacity, opacity: opacity });
            }  
        });

        this.mainZones.texts.forEach((text) => {
            text.setOpacity(textOpacity);
        });

        if (!App.userSettings.showMainAssets) opacity = 0;

        if (this.map.getZoom() > this.map.detailedZoomThreshold) {
            this.mainZones.assets.forEach(asset => {
                asset.setOpacity(opacity);
            });
        }


    }


    _handleFlagClick(flag, broadcast = true) {
        let backward = false;

        if (this.selectedFlags.length === 0){
            this.startPosition = flag.position;
            if (flag.position > 1){
                this.reversed = true;
            }
        }

        // If the clicked flag is in front of the current position, skip
        if (Math.abs(this.startPosition - flag.position) > this.currentPosition) {

            // In RAAS, we can click on the oposite main flag to reset the layer
            if (this.gamemode === "RAAS" && flag.isMain){
                if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                    App.session.ws.send(
                        JSON.stringify({
                            type: "CLICK_LAYER",
                            flag: flag.objectName,
                            selectedFlags: [],
                        })
                    );
                    console.debug(`Sent layer click update for flag #${flag.objectName}`);
                }

                this._resetLayer();
                this._handleFlagClick(flag, false);
                return true;
            }

            console.debug("  -> Clicked Flag is in front, skipping..");
            return false; 
        }

        // Going backward
        if (Math.abs(this.startPosition - flag.position)+1 <= this.currentPosition){

            backward = true;
            this.selectedReachableClusters.pop();

            let positionToReduce = (this.currentPosition - Math.abs(this.startPosition - flag.position));
            console.debug("# of Going backward : ", positionToReduce);

            if (flag === this.selectedFlags[0]) {
                console.debug("Can't unselect main flag");
                if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                    App.session.ws.send(
                        JSON.stringify({
                            type: "CLICK_LAYER",
                            flag: flag.objectName,
                            selectedFlags: [],
                        })
                    );
                    console.debug(`Sent layer click update for flag #${flag.objectName}`);
                }
                this._resetLayer();
                return;
            }

            if (flag.isMain && this.gamemode != "Invasion"){
                this._resetLayer();
                this._handleFlagClick(flag);
                return;
            }
            
            // Remove the selectedFlags from the end
            for (let i = 0; i < positionToReduce; i++){
                this.selectedFlags.at(-1).unselect();
                this.selectedFlags.pop();
                // remove last entry from this.selectedReachableClusters
                this.selectedReachableClusters.pop();
                this.currentPosition--;
                this.path.pop();
            }


            // update the path and DFS from the last selected flag
            this.polyline.setLatLngs(this.path);

            if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                let selectedFlags = [];
                this.selectedFlags.forEach(flag => {
                    selectedFlags.push(flag.objectName);
                });
                App.session.ws.send(
                    JSON.stringify({
                        type: "CLICK_LAYER",
                        flag: flag.objectName,
                        selectedFlags: selectedFlags,
                    })
                );
            }

            flag = this.selectedFlags.at(-1);
        }
        // Going forward
        else {
            // Add the clicked flag to the selected flags
            flag.select();
            this.selectedFlags.push(flag);
            this.currentPosition++;
            // Update the path
            this.path.push(flag.latlng);
            this.polyline.setLatLngs(this.path);

            if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
                let selectedFlags = [];
                this.selectedFlags.forEach(flag => {
                    selectedFlags.push(flag.objectName);
                });
                App.session.ws.send(
                    JSON.stringify({
                        type: "CLICK_LAYER",
                        flag: flag.objectName,
                        selectedFlags: selectedFlags,
                    })
                );
            }
        }

        this.render(flag, false, backward);

    }

    /**
     * For a given flag render the layer
     * Start a DFS from the flag, hide every not-already-selected flags & show the reachable ones
     * @param {Objectives} flag - Flag from where to start
     * @param {boolean} preview - Should we just fade out other flags or hide them
     * @param {boolean} backward - User is going backward (unselecting flags)
     */
    render(flag, preview, backward = false) {

        console.debug("****************************************");
        console.debug("              LAYER UPDATE              ");
        console.debug("****************************************");
        console.debug("  -> Preview:", preview);
        console.debug("  -> Reverse:", this.reversed);
        console.debug("  -> Selected Flag:", flag.objectName);
        console.debug("  -> Clicked flag position", flag.position);
        console.debug("  -> Current position", this.currentPosition);
        console.debug("  -> Current selected Flags", this.selectedFlags);
        console.debug("  -> Cluster History", this.selectedReachableClusters);

        console.debug("****************************************");
        console.debug("                  DFS                   ");
        console.debug("****************************************");

        let reachableClusters = this.getReachableClusters(flag, preview);
        if (reachableClusters.size <= 1) return;

        console.debug("****************************************");
        console.debug("               Rendering                ");
        console.debug("****************************************");

        this.hideClusters(flag, preview);
        let nextFlags = this.showClusters(flag, reachableClusters, preview);
        if (!preview) this.handleNextFlags(nextFlags, backward);

    }

    /**
     * Return the reachable clusters
     * @param {Objectives} flag - Flag from where to start
     * @param {boolean} preview - Should we just fade in other flags or hide them
     */
    showClusters(flag, reachableClusters, preview = false){
        
        let nextFlags = [];
        console.debug("Showing Clusters");

        // Show reachable clusters
        reachableClusters.forEach((clusterName) => {

            let cluster = this.objectives[clusterName];

            // If the cluster is not found directly, search for a matching displayName (mains)
            if (!cluster) {
                cluster = Object.values(this.objectives).find((obj) => obj.objectDisplayName === clusterName);
            }

            let position = Math.abs(this.startPosition - cluster.pointPosition);
            if (!preview) position += 1;

            // If the cluster is in front of the clicked flag, show it
            if (position > this.currentPosition){
        
                console.debug(`  -> ${cluster.name}`);
                if (preview) this._fadeInCluster(cluster, flag);  
                else  this._showCluster(cluster);

                // If cluster is directly in front of the clicked flag, count the next flags
                if (Math.abs(position) === this.currentPosition+1){
                    const futurFlags = this.flags.filter((f) => f.clusters.includes(cluster));
                    futurFlags.forEach((flag) => {
                        // Only add if not already in the list
                        if (!nextFlags.includes(flag)) nextFlags.push(flag);
                    });
                }
                
            }
        });

        return nextFlags;
    }

    /**
     * Hide Clusters in front of a given flag
     * @param {Objectives} flag - Flag from where to start
     * @param {boolean} preview - Should we just fade out other flags or hide them
     */
    hideClusters(flag, preview = false){
        console.debug("Hidding Clusters");
        Object.values(this.objectives).forEach((cluster) => {
            // Only Hide/Fade cluster in front of us
            if (Math.abs(this.startPosition - cluster.pointPosition)+1 >= this.currentPosition) {
                console.debug(`  -> ${cluster.name}`);
                if (!flag.clusters.some(c => c.name === cluster.objectName)) {
                    if (preview) this._fadeOutCluster(cluster, flag);  
                    else this._hideCluster(cluster, flag);
                }
            }
        });
    }


    /**
     * Return the reachable clusters
     * @param {Objectives} flag - Flag from where to start
     * @return {Set} Set of cluster reachable in front of the flag
     */
    getReachableClusters(flag, preview) {
        let reachableClusters = new Set();
        // Start DFS from each clicked flag clusters
        flag.clusters.forEach((cluster) => {
            let position = Math.abs(this.startPosition - cluster.pointPosition);
            if (!preview) position += 1;
            if (position == this.currentPosition){
                // Only start DFS from clusters that are from our current position
                const clusterName = cluster.name === "Main" ? cluster.objectDisplayName : cluster.name;
                this.dfs(clusterName, reachableClusters);
            }
        });

        // Something went wrong, we are in the wrong direction
        if (reachableClusters.size === 1 && this.currentPosition === 1){
            if (!flag.isMain) return;
            console.debug("Already blocked, Trying again in the other direction");
            this.reversed = !this.reversed;
            reachableClusters.clear();
            this.dfs(flag.clusters[0].objectDisplayName, reachableClusters);
        }

        // Remove clusters that were not reachable from the previous flag
        reachableClusters = this._filterClusters(reachableClusters);

        // Store the clusters in case we need to backtrack later
        if (!preview) {
            this.selectedReachableClusters.push(reachableClusters);
            console.debug("Cluster History updated", this.selectedReachableClusters);
        }
        
        return reachableClusters;
    }
    

    /**
     * Handle next flags behaviour
     * Hightlight the next flags / Copy their names to the clipboard / Click the next flag if only one
     * @param {Array} nextFlags - Array of next flags
     * @param {boolean} backward - True if we are going backward
     */
    handleNextFlags(nextFlags, backward) {

        // Highlight the next flags with a proper class
        nextFlags.forEach((flag) => {
            flag.flag._icon.classList.add("next");
            flag.flag.options.icon.options.className = "flag flag" + flag.position + " next";
            flag.isNext = true;
        });
       
        // Only one flag in front ? Click it
        if (nextFlags.length === 1 && !backward) this._handleFlagClick(nextFlags[0], false);
    }


    /**
     * Remove clusters that were not reachable from the previous position
     * @param {Set} reachableClusters - Set of reachable clusters
     * @returns {Array} - List of reachable clusters
     */
    _filterClusters(reachableClusters) {
        if (this.selectedReachableClusters.length > 0){
            Array.from(reachableClusters).forEach((cluster) => {
                if (!this.selectedReachableClusters.at(-1).has(cluster)){
                    reachableClusters.delete(cluster);
                    console.debug(" -> filtered because wasn't previously reachable :", cluster);
                }
            });
        }
        console.debug("Reachable clusters:", Array.from(reachableClusters));
        return reachableClusters;
    }
     
     
    /**
     * Deep First Search to find all reachable clusters from a given cluster
     * @param {String} clusterName 
     * @param {Array} reachableClusters - Set to store reachable clusters
     */
    dfs(clusterName, reachableClusters) {
        if (reachableClusters.has(clusterName)) return;  // If already visited, skip
        reachableClusters.add(clusterName); // Mark this cluster as reachable)

        // Sometimes links are stored in clusters, sometimes in lanes
        const links = this.capturePoints.lanes.links || this.capturePoints.clusters.links;

        // Traverse each link to find connected clusters
        links.forEach((link) => {
            if (this.reversed){
                if (link.nodeB === clusterName && !reachableClusters.has(link.nodeA)) {
                    this.dfs(link.nodeA, reachableClusters);  // Traverse from nodeB to nodeA
                }
            }
            else if (link.nodeA === clusterName && !reachableClusters.has(link.nodeB)) {
                this.dfs(link.nodeB, reachableClusters);  // Traverse from nodeA to nodeB
            }
        });
    }


    /**
     * Unselects all flags and resets the layer
     */
    _resetLayer() {
        console.debug("Resetting layer");

        this.currentPosition = 0;
        this.selectedReachableClusters = [];
        this.selectedFlags = [];
        this.reversed = false;
        this.path = [];
        this.polyline.setLatLngs([]);

        this.flags.forEach((flag) => {
            flag.unselect();
            if (!flag.isMain) flag.hide();
        });

        // Pre-select first main flag in invasion
        if (this.gamemode === "Invasion") {
            this.mains.forEach((main) => {
                if (main.objectName === this.capturePoints.clusters.listOfMains[0]){
                    this._handleFlagClick(main, false);
                }
            });
        }
    }

    /**
     * Set the opacity of the layer
     * @param {number} value - opacity value (0-1)
     */
    _setOpacity(value){
        
        // Polyline opacity
        this.polyline.setStyle({ opacity: value });

        // Flags opacity
        this.flags.forEach((flag) => {
            flag._setOpacity(value);
        });

        // Caches opacity
        if (this.gamemode === "Destruction") {

            this.caches.eachLayer((layer) => {
                layer.setStyle({ fillOpacity: value, opacity: value });
            });

            this.phaseNumber.eachLayer((layer) => {
                layer.setOpacity(value);
            }); 

            this.phaseAeras.eachLayer((layer) => {
                layer.setStyle({ opacity: value });
            }); 
        }
    }


    _showCluster(cluster) {
        if (cluster.name === "Main") return;

        const flagsToShow = this.flags.filter((f) =>
            f.clusters.includes(cluster)
        );

        flagsToShow.forEach((flagToShow) => {

            const foundClusters = [];

            // Filters the clusters that were reachable from the previous flag
            flagToShow.clusters.forEach((cluster) => {
                if (this.selectedReachableClusters.at(-1).has(cluster.name)){
                    foundClusters.push(cluster);
                }
            });

            let newPos;

            if (this.reversed){
                newPos = 0;
                for (const item of foundClusters) {
                    if (Math.abs(this.startPosition - item.pointPosition) >= this.currentPosition && item.pointPosition > newPos) {
                        newPos = item.pointPosition;
                    }
                }
            } else {
                newPos = Infinity;
                for (const item of foundClusters) {
                    if (item.pointPosition > this.currentPosition && item.pointPosition < newPos) {
                        newPos = item.pointPosition;
                    }
                }
                // Something went wrong, try the opposite
                if (newPos === Infinity){
                    newPos = 0;
                    for (const item of foundClusters) {
                        if (item.pointPosition <= this.currentPosition && item.pointPosition > newPos) {
                            newPos = item.pointPosition;
                        }
                    }
                }
            }
            flagToShow.position = newPos;
            flagToShow.show();
        });

    }

    _hideCluster(cluster, clickedFlag) {

        if (cluster.name === "Main") return;

        const flagsToHide = this.flags.filter((f) =>
            f !== clickedFlag && f.clusters.includes(cluster)
        );

        // Show each flag that was found
        flagsToHide.forEach((flagToHide) => {
            if (!this.selectedFlags.includes(flagToHide)){
                flagToHide.hide();
            }
        });
    }

    _fadeInCluster(cluster, clickedFlag) {

        if (cluster.name === "Main") return;

        const flagsToHide = this.flags.filter((f) =>
            f !== clickedFlag && f.clusters.includes(cluster)
        );

        // Show each flag that was found
        flagsToHide.forEach((flagToHide) => {
            if (!this.selectedFlags.includes(flagToHide)){
                flagToHide._fadeIn();
                if (!App.userSettings.capZoneOnHover) {
                    if (this.map.getZoom() > this.map.detailedZoomThreshold){
                        flagToHide.revealCapZones();
                    }
                }
            }
        });
    }

    _fadeOutCluster(cluster, clickedFlag) {

        if (cluster.name === "Main") return;

        const flagsToHide = this.flags.filter((f) =>
            f !== clickedFlag && f.clusters.includes(cluster)
        );

        // Show each flag that was found
        flagsToHide.forEach((flagToHide) => {
            if (!this.selectedFlags.includes(flagToHide)){
                flagToHide._fadeOut();
                flagToHide.hideCapZones();
            }
        });
    }

    toggleVisibility() {
        if (this.isVisible) {
            this._setOpacity(0);
            this.polyline.hideMeasurements();
            this.isVisible = false;
            $(".btn-layer").removeClass("active");
            this.hideAllCapzones();
            this.setMainZoneOpacity(false);
            if (this.borders && App.userSettings.showMapBorders) this.borders.setStyle({ opacity: 0, fillOpacity: 0 });
        }
        else {
            this._setOpacity(1);
            this.setMainZoneOpacity(true);
            if (App.userSettings.showFlagsDistance) {
                this.polyline.showMeasurements({
                    minPixelDistance: 50,
                    scaling: this.map.mapToGameScale,
                });
            }
            $(".btn-layer").addClass("active");
            this.isVisible = true;
            if (this.map.getZoom() > this.map.detailedZoomThreshold) this.revealAllCapzones();
            if (this.borders && App.userSettings.showMapBorders) this.borders.setStyle({ opacity: 0, fillOpacity: 0.75 });
        }
    }


    revealSpawns(){
        this.activeFaction1Markers.addTo(this.map);
        this.activeFaction2Markers.addTo(this.map);
    }

    hideSpawns(){
        this.activeFaction1Markers.remove();
        this.activeFaction2Markers.remove();
    }


    /**
     * xxxx
     * @return {number} - xxxx
     */
    clear(){
        this.activeLayerMarkers.removeFrom(this.map).clearLayers();
        this.activeFaction1Markers.removeFrom(this.map).clearLayers();
        this.activeFaction2Markers.removeFrom(this.map).clearLayers();
        this.phaseNumber.removeFrom(this.map).clearLayers();
        this.phaseAeras.removeFrom(this.map).clearLayers();
        if (this.factions) this.factions.unpinUnit();
        $(".btn-layer").removeClass("active").hide();
    }

}