
import { DivIcon, Marker, Circle, LayerGroup, Polyline, Polygon, Rectangle, FeatureGroup } from "leaflet";
import { SquadObjective } from "./squadObjective.js";
import { App } from "../app.js";
import "./libs/leaflet-measure-path.js";
import SquadFactions from "./squadFactions.js";
import { Hexagon } from "./libs/leaflet-hexagon.js";
import { Curve } from "./libs/leaflet-curve.js";
import { squadSpawnGroup } from "./squadSpawnGroup.js";
import { squadCameraActor } from "./squadCameraActor.js";
import { SquadVehicleSpawner } from "./squadVehicleSpawner.js";
import SquadLaneSolver from "./squadLaneSolver.js";

export default class SquadLayer {

    constructor(map, layerData, broadcast, mod) {
        this.map = map;
        // Vanilla (no mod) assets live in .../vanilla/, modded assets live in .../<mod key lowercased>/
        // (e.g. "GalacticContention" -> galacticcontention/, "SuperMod" -> supermod/). Referenced by every class that builds a
        // /img/flags/ or /img/spawnGroup/ path for this layer.
        this.modFolder = mod ? mod.toLowerCase() : "vanilla";
        this.activeLayerMarkers = new LayerGroup().addTo(this.map);
        this.activeFaction1Markers = new LayerGroup();
        this.activeFaction2Markers = new LayerGroup();
        this.layerData = layerData;
        this.capturePoints = layerData.capturePoints;
        this.objectives = layerData.objectives;
        this.gamemode = layerData.gamemode;

        [this.offset_x, this.offset_y] = this.getLayerOffsets(this.layerData.mapTextureCorners);
        this.isVisible = true;

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

        // On randomized layers the chain is drawn as one polyline per run of adjacent
        // confirmed points, so no line crosses a gap the user has not confirmed.
        this.pathLines = [];

        // Capture points the user has confirmed, in no particular order.
        // See squadLaneSolver.js.
        this.selectedFlags = [];

        // Depth each confirmed flag is pinned to. A point that could sit at two depths is
        // pinned to the shallowest one still open. Confirm the points before it to pin it
        // deeper.
        this.confirmedStep = new Map();

        // Latest solver output, recalculated on every confirmation. SquadObjective reads
        // it to decide what each flag shows and whether it is still possible.
        this.solverResult = null;
        this.nextStep = 1;

        // Which main the depth numbers are counted from. Defaults to the main the routes
        // start from.
        this.perspectiveMain = null;
        this.countFromEnd = false;
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
        this.hexs = [];
        this.stagingZones = [];

        this.spawnGroups = [];
        this.vehicleSpawners = [];

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


        this.mainZones.ammocrates = [];

        this.isRandomized = this.isRandomized();

        // Randomized layers are resolved from their route space instead of walked step by
        // step, so the solver has to exist before the flags are drawn.
        if (this.isRandomized) this.solver = new SquadLaneSolver(layerData);
        if (this.solver?.ok) this._buildLaneLines();

        this.init();

        if (this.solver?.ok) {
            this.perspectiveMain = this._mainForNode(this.solver.start);
            this._renderFromSolver();
        }
        else if (this.isRandomized) console.debug("[LAYER] no usable route graph, lane prediction disabled");

        if (process.env.DISABLE_FACTIONS != "true") {
            this.factions = new SquadFactions(this, broadcast);
            if (App.userSettings.enableFactions) $("#factionsTab, #factionsButton").show();
        }

        // If already zoomed in, reveal capzones/main assets
        if (this.map.getZoom() > this.map.detailedZoomThreshold) this.revealAllCapzones();

        this.setMainZoneOpacity(true);
    }


    /**
     * Checks if the current layer's gamemode is randomized.
     * A layer is considered randomized if its gamemode is "RAAS", "RVAAS", "RINV", or "Invasion"
     * @returns {boolean} True if the layer is randomized, false otherwise
     */
    isRandomized() {
        return this.gamemode === "RAAS" || this.gamemode === "RVAAS" || this.gamemode === "Invasion" || this.gamemode === "RINV";
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
        case "Skirmish":
            this.initPredictiveLayer();
            break;
        case "TC":
        case "TerritoryControl":
            this.initTerritoryControl(this.capturePoints);
            break;
        case "RAAS":
        case "RVAAS": // SuperMod
        case "RINV":   // GC
        case "Invasion":
            this.initRandomizedLayer();
            break;
        case "TDM":
            this.initTDM();
            break;
        default:
            this.clear();
            this.map.spin(false);
            throw new Error(`Unsupported gamemode: "${this.gamemode}"`);
        }

        // Create Other Layer Assets
        this.createHelipads();
        this.createDeployables();
        this.createProtectionZones();
        //this.createBorders();
        this.createSplineBorders();
        this.createSpawners();
        this.createTeamSpawns();
        this.createCameraActors();
        //this.createStagingZones();
        //this.createTeamSpawnsPoints();
    }

    createCameraActors(){
        if (!this.layerData.mapCameraActor) return;
        this.cameraActor = new squadCameraActor(this.convertToLatLng(this.layerData.mapCameraActor.location_x, this.layerData.mapCameraActor.location_y), this.layerData.mapCameraActor, this);
        if (App.userSettings.showRespawnCam) this.cameraActor.show();
    }


    createTeamSpawns(){
        this.layerData.mapAssets.spawnGroups.forEach((spawnGroup) => {
            const latlng = this.convertToLatLng(spawnGroup.location_x, spawnGroup.location_y);
            this.spawnGroups.push(new squadSpawnGroup(latlng, spawnGroup, this).addTo(this.activeLayerMarkers));
        });
        if (App.userSettings.showMainAssets && this.map.getZoom() > this.map.detailedZoomThreshold) {
            this.vehicleSpawners.forEach(spawn => { spawn.show(); });
        }
    }


    // WIP, not used for now
    createTeamSpawnsPoints(){
        this.layerData.mapAssets.spawnPoints.forEach((spawnPoint) => {
            const latlng = this.convertToLatLng(spawnPoint.location_x, spawnPoint.location_y);
            //this.spawnGroups.push(new squadSpawnGroup(latlng, spawnGroup, this).addTo(this.activeLayerMarkers));
            const radius = 1 * this.map.gameToMapScale;
            new Circle(latlng, {
                radius: radius,
                color: App.mainColor,
                fillColor: "white",
                opacity: 1,
                weight: 1.5,
                fillOpacity: 1,
            }).addTo(this.activeLayerMarkers);
        });
    }

    createSpawners(){
        this.layerData.assets.vehicleSpawners.forEach((spawner) => {
            const latlng = this.convertToLatLng(spawner.location_x, spawner.location_y);
            this.vehicleSpawners.push(new SquadVehicleSpawner(latlng, spawner, this));
        });
        if (App.userSettings.showMainAssets && this.map.getZoom() > this.map.detailedZoomThreshold) {
            this.vehicleSpawners.forEach(spawn => { spawn.show(); });
        }
    }


    /**
     * Initialize a layer going from first to last point
     * AAS - SEED - Skirmish
     */
    initPredictiveLayer(){

        if (!this.capturePoints?.points?.links) {
            console.debug(`[LAYER] initPredictiveLayer: missing capturePoints.points.links for gamemode "${this.gamemode}", falling back to initRandomizedLayer`);
            this.gamemode = "RAAS";
            this.initRandomizedLayer();
            return;
        }

        // Set Paths
        Object.values(this.capturePoints.points.links).forEach(link => {
            const nodeAFlag = Object.values(this.objectives).find(objective => objective.objectDisplayName === link.nodeA);
            const nodeBFlag = Object.values(this.objectives).find(objective => objective.objectDisplayName === link.nodeB);
            const latlngNodeA = this.convertToLatLng(nodeAFlag.location_x, nodeAFlag.location_y);
            const latlngNodeB = this.convertToLatLng(nodeBFlag.location_x, nodeBFlag.location_y);
            this.path.push(latlngNodeA, latlngNodeB);
        });

        Object.values(this.objectives).forEach((obj) => {
            const latlng = this.convertToLatLng(obj.location_x, obj.location_y);

            // Identify and process mains
            if (obj.name === "Main") {
                this.createMainObjective(obj);
                return;
            }

            const newFlag = new SquadObjective(latlng, this, obj, 0, obj);
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
            this.createMainObjective(main);
        });

        // Create the Hexagons
        Object.values(capturePoints.hexs.hexs).forEach((hex) => {
            const LATLNG = this.convertToLatLng(hex.location_x, hex.location_y);
            const HEXRADIUS = (hex.boxExtent.location_x * this.map.gameToMapScale) / 100;
            const teamColors = {
                0: "white",
                1: "MediumBlue",
                2: "firebrick"
            };
            
            this.hexs.push(new Hexagon(LATLNG, HEXRADIUS, this, hex.hexNum, {color: teamColors[hex.initialTeam], weight: 1}).addTo(this.activeLayerMarkers));
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
                this.createMainObjective(objCluster);
                return;
            }

            objCluster.points.forEach((obj) => {

                let latlng = this.convertToLatLng(obj.location_x, obj.location_y);
                let flagExists = false;

                this.flags.forEach((flag) => {
                    if (this.areLatLngsClose(flag.latlng, latlng)) {
                        console.debug(`[LAYER] adding cluster ${objCluster.name} to flag ${flag.name}`);
                        console.debug("[LAYER] new clustersList: ", flag.clusters);
                        flag.addCluster(objCluster, obj);
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

    }


    getLaneColor(laneName, i) {
        const colors = ["red", "blue", "green", "purple", "white", "yellow", "orange"];
        return colors[i % colors.length]; // cycle through colors
    }


    /**
     * Draw every lane (main to main, through each of its clusters' avgLocation) as
     * a hidden polyline, indexed like this.solver.routes so a flag's `lanes` (from
     * SquadObjective.solverInfo()) map straight to this.lanePolylines[index].
     */
    _buildLaneLines() {
        const coordOf = (objective) => {
            const loc = objective.avgLocation ?? objective;
            return this.convertToLatLng(loc.location_x, loc.location_y);
        };

        this.lanePolylines = this.solver.routes.map((route, i) => {
            const latlngs = [
                this.objectives[this.solver.start],
                ...route.map((step) => this.objectives[step.cluster]),
                this.objectives[this.solver.end],
            ].map(coordOf);

            return new Polyline(latlngs, {
                color: this.getLaneColor(SquadLaneSolver.laneLabel(i), i),
                weight: 10,
                opacity: 0,
                interactive: false,
                className: "laneLine",
            }).addTo(this.activeLayerMarkers);
        });
    }


    /**
     * Reveal only the given lanes (by route index), hide the rest.
     * @param {number[]} indices
     */
    showLanes(indices) {
        this.lanePolylines?.forEach((line, i) => line.setStyle({ opacity: indices.includes(i) ? 0.45 : 0 }));
    }


    /** Hide every lane. */
    hideLanes() {
        this.lanePolylines?.forEach((line) => line.setStyle({ opacity: 0 }));
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
            this.createMainObjective(main);
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
     * Initialize TDM layer - no capture points/objectives, just the two team mains,
     * built from mapAssets.protectionZones since layerData.objectives is empty for TDM.
     */
    initTDM() {
        this.layerData.mapAssets.protectionZones.forEach((pZone) => {
            const zoneObject = pZone.objects[0];
            const isTeam1 = pZone.teamid === "1";

            this.createMainObjective({
                name: "Main",
                objectName: isTeam1 ? "00-Team1 Main" : "Z-Team2 Main",
                objectDisplayName: isTeam1 ? "00-Team1 Main" : "Z-Team2 Main",
                location_x: zoneObject.location_x,
                location_y: zoneObject.location_y,
                location_z: zoneObject.location_z,
                pointPosition: isTeam1 ? 1 : 2,
            });
        });
    }


    createMainObjective(obj) {
        const latlng = this.convertToLatLng(obj.location_x, obj.location_y);
        const newFlag = new SquadObjective(latlng, this, obj, 1, obj);
        this.flags.push(newFlag);
        this.mains.push(newFlag);
    }


    /**
     * Calculates the X and Y offsets needed to align a layer object to the Map
     *
     * @param {Array<{location_x: number, location_y: number}>} mapTextureCorners array of layers one or two corners
     * @returns {[number, number]} array containing the calculated X and Y offsets
     */
    getLayerOffsets(mapTextureCorners) {
        const corner1 = mapTextureCorners[1] ?? mapTextureCorners[0];
        let layerOriginX = Math.min(mapTextureCorners[0].location_x, corner1.location_x);
        let layerOriginY = Math.min(mapTextureCorners[0].location_y, corner1.location_y);
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
        return [(y - this.offset_y) / 100 * -this.map.gameToMapScaleY, (x - this.offset_x) / 100 * this.map.gameToMapScale];
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
            iconElement.style.backgroundImage = "url('/img/icons/default/deployables/deployable_helipad.svg')";
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
                iconElement.style.backgroundImage = "url('/img/icons/default/deployables/deployable_repairstation.svg')";
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
                iconElement.style.backgroundImage = "url('/img/icons/default/deployables/deployable_ammocrate.svg')";
                this.mainZones.assets.push(marker);
                this.mainZones.ammocrates.push(marker);
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
        if (this.layerData.border.length <= 2) return;

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

        let opacity = 0.25;

        if (!App.userSettings.showMapBorders) opacity = 0;

        this.borders = new Polygon([MAPBOUNDS, borderPath], {
            color: "red",
            fillOpacity: opacity,
            weight: 0,
            className: "unplayable-area",
        }).addTo(this.activeLayerMarkers);
    }

    /**
     * Same as createBorders() but renders the border as a spline (cubic bezier)
     * using the arriveTangent/leaveTangent data from the extractor, instead of
     * straight segments between border points. Not wired in yet - keeping both
     * around until we decide whether to switch.
     */
    createSplineBorders() {
        const MAPBOUNDS = [
            [0, 0],
            [0, this.map.pixelSize],
            [-this.map.pixelSize, this.map.pixelSize],
            [-this.map.pixelSize, 0],
            [0, 0]
        ];

        // There's no border but the map bounds
        if (this.layerData.border.length <= 2) return;

        // convertToLatLng() scales+offsets a position, subtracting the same
        // conversion at the origin turns it into a pure scale for a tangent vector
        const zero = this.convertToLatLng(0, 0);
        const convertVectorToLatLng = (x, y) => {
            const v = this.convertToLatLng(x || 0, y || 0);
            return [v[0] - zero[0], v[1] - zero[1]];
        };

        const borderPoints = this.layerData.border.map((border) => {
            const latlng = this.convertToLatLng(border.location_x, border.location_y);
            // keep the latlng within the map bounds
            if (latlng[1] > this.map.pixelSize) {latlng[1] = this.map.pixelSize;}
            if (latlng[0] < -this.map.pixelSize) {latlng[0] = -this.map.pixelSize;}
            if (latlng[1] < 0) {latlng[1] = 0;}
            if (latlng[0] > 0) {latlng[0] = 0;}
            return {
                latlng: latlng,
                leaveTangent: convertVectorToLatLng(border.leaveTangent_x, border.leaveTangent_y),
                arriveTangent: convertVectorToLatLng(border.arriveTangent_x, border.arriveTangent_y),
            };
        });

        const path = ["M", MAPBOUNDS[0], "L", MAPBOUNDS[1], "L", MAPBOUNDS[2], "L", MAPBOUNDS[3], "L", MAPBOUNDS[4], "Z"];

        // Hermite tangents -> cubic bezier control points (standard 1/3 scale)
        path.push("M", borderPoints[0].latlng);
        for (let i = 1; i < borderPoints.length; i++) {
            const prev = borderPoints[i - 1];
            const cur = borderPoints[i];
            const cp1 = [prev.latlng[0] + prev.leaveTangent[0] / 3, prev.latlng[1] + prev.leaveTangent[1] / 3];
            const cp2 = [cur.latlng[0] - cur.arriveTangent[0] / 3, cur.latlng[1] - cur.arriveTangent[1] / 3];
            path.push("C", cp1, cp2, cur.latlng);
        }
        path.push("Z");

        let opacity = 0.75;

        if (!App.userSettings.showMapBorders) opacity = 0;

        this.borders = new Curve(path, {
            color: "#111",
            fill: true,
            stroke: false,
            fillRule: "evenodd",
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
     * Create staging zones from mapAssets.stagingZones
     * Draws a box for every object of each zone (center + boxExtent + rotation)
     * @param {Array} this.layerData.mapAssets.stagingZones - Array of staging zones
     */
    createStagingZones() {
        if (!this.layerData.mapAssets.stagingZones) return;

        this.layerData.mapAssets.stagingZones.forEach((zone) => {
            zone.objects.forEach((box) => {
                if (!box.isBox) return;

                const [location_y, location_x] = this.convertToLatLng(box.location_x, box.location_y);

                const radiusX = (box.boxExtent.extent_x / 100) * -this.map.gameToMapScale;
                const radiusY = (box.boxExtent.extent_y / 100) * -this.map.gameToMapScale;

                const bounds = [
                    [location_y + radiusY, location_x + radiusX],
                    [location_y - radiusY, location_x - radiusX]
                ];

                const stagingZone = new Rectangle(bounds, {
                    color: "white",
                    weight: 4,
                    fillOpacity: 0,
                }).addTo(this.activeLayerMarkers);

                if (box.boxExtent.rotation_z != 0) this.rotateRectangle(stagingZone, box.boxExtent.rotation_z);

                this.stagingZones.push(stagingZone);
            });
        });
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
            if (Math.abs(pZone.objects[0].boxExtent.extent_x) < 100) return;

            // Skip weird protection zones
            if (pZone.teamid === "0") return;

            // A protection zone can be made of several shapes (e.g. Tatooine's team
            // zones = box + sphere) - draw all of them.
            pZone.objects.forEach((zoneObject) => {

                // Center of the protection zone
                let [location_y, location_x] = this.convertToLatLng(zoneObject.location_x, zoneObject.location_y);

                // Protection Zone is a Rectangle/Capsule
                // We're drawing capsule as a rectangle cause it's easier
                //if (zoneObject.isBox || zoneObject.isCapsule) {
                if (zoneObject.isBox) {

                    // Radiis
                    let protectRadiusX = ( Math.abs(zoneObject.boxExtent.extent_x) / 100 ) * -this.map.gameToMapScale;
                    let protectRadiusY = ( Math.abs(zoneObject.boxExtent.extent_y) / 100 ) * -this.map.gameToMapScale;

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

                    if (zoneObject.boxExtent.rotation_z != 0){
                        this.rotateRectangle(protectionZone, zoneObject.boxExtent.rotation_z);
                        this.rotateRectangle(noDeployZone, zoneObject.boxExtent.rotation_z);
                    }

                    this.mainZones.rectangles.push(protectionZone);
                    this.mainZones.rectangles.push(noDeployZone);
                    return;
                }

                // Protection is a Sphere
                if (zoneObject.isSphere) {

                    // Center of the protection zone
                    let latlngSphere = [location_y, location_x];

                    // Protection & NoDeployementZone radiis
                    let protectRadius = zoneObject.sphereRadius / 100 * this.map.gameToMapScale;
                    let noDeployRadius = (zoneObject.sphereRadius + pZone.deployableLockDistance) / 100 * this.map.gameToMapScale;

                    let protectionZone = new Circle(latlngSphere, {
                        color: PZONECOLOR,
                        opacity: 1,
                        weight: 2,
                        radius: protectRadius,
                    }).addTo(this.activeLayerMarkers);

                    let noDeployZone = new Circle(latlngSphere, {
                        color: PZONECOLOR,
                        dashArray: "10,20",
                        opacity: 1,
                        weight: 1,
                        radius: noDeployRadius,
                    }).addTo(this.activeLayerMarkers);

                    this.mainZones.rectangles.push(protectionZone);
                    this.mainZones.rectangles.push(noDeployZone);
                }
            });

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


    /**
     * Confirm or un-confirm a capture point.
     *
     * Confirmations are a set, not a sequence. With free selection on, any point on the
     * map can be clicked, and clicking a confirmed point removes it. The solver
     * recalculates everything from the whole set, so click order does not matter.
     *
     * @param {SquadObjective} flag - the clicked flag
     * @param {boolean} broadcast - forward the click to the collaborative session
     * @returns {boolean} true if the click changed anything
     */
    _handleFlagClick(flag, broadcast = true) {

        if (!this.solver?.ok) return false;

        if (flag.isMain) {
            // Mains are not capture points. Clicking one points the depth numbering at
            // that side. Clicking the side already selected clears every confirmation.
            if (flag === this.perspectiveMain) {
                this._resetLayer();
            } else {
                this.perspectiveMain = flag;
                this.countFromEnd = flag === this._mainForNode(this.solver.end);
                this._renderFromSolver();
            }
        } else if (!this.selectedFlags.includes(flag)) {
            const confirmation = this._confirmationFor(flag);
            if (!confirmation) {
                console.debug(`[LAYER] ${flag.name} cannot be confirmed right now, ignoring`);
                return false;
            }
            this.selectedFlags.push(flag);
            this.confirmedStep.set(flag, confirmation.step);
            this._renderFromSolver();
        } else if (App.userSettings.freePointSelection) {
            // Clicking a confirmed point removes it.
            this._release(flag);
            this._renderFromSolver();
        } else {
            // Ordered mode walks back down the chain: releasing a point also releases
            // everything confirmed after it.
            const pinnedAt = this.confirmedStep.get(flag);
            this.selectedFlags
                .filter((other) => (this.confirmedStep.get(other) ?? 0) >= pinnedAt)
                .forEach((other) => this._release(other));
            this._renderFromSolver();
        }

        if (broadcast && App.session.ws && App.session.ws.readyState === WebSocket.OPEN) {
            App.session.ws.send(
                JSON.stringify({
                    type: "CLICK_LAYER",
                    flag: flag.objectName,
                    selectedFlags: this.selectedFlags.map((f) => f.objectName),
                })
            );
            console.debug(`[LAYER] Sent layer click update for flag #${flag.objectName}`);
        }

        return true;
    }


    /**
     * Solver constraints for the confirmed flags. A flag owns several candidate ids when
     * the randomizer offers the same point on more than one route, so each entry means
     * "any one of these ids, at this depth".
     * @param {SquadObjective[]} [flags] - defaults to every confirmed flag
     * @returns {{ids: string[], step: ?number}[]}
     */
    _constraints(flags = this.selectedFlags) {
        return flags.map((flag) => ({
            ids: flag.candidateIds,
            step: this.confirmedStep.get(flag) ?? null,
        }));
    }


    /**
     * Drop a flag's confirmation.
     * @param {SquadObjective} flag
     */
    _release(flag) {
        const at = this.selectedFlags.indexOf(flag);
        if (at !== -1) this.selectedFlags.splice(at, 1);
        this.confirmedStep.delete(flag);
    }


    /**
     * What a click would confirm about this flag, or null if it cannot be confirmed now.
     *
     * A point that could still sit at the next open depth is pinned there, which is the
     * user saying "this is my next point". A point further along is confirmed without a
     * depth: all it says is that the point is on the route. Pinning it to its shallowest
     * depth would silently discard the routes carrying it deeper, and those are often the
     * majority. Its depth resolves once the points before it are confirmed.
     *
     * Ordered mode only accepts the next point, so it never confirms without a depth.
     * @param {SquadObjective} flag
     * @returns {?{step: ?number}}
     */
    _confirmationFor(flag) {
        const options = this._stepOptionsFor(flag);
        if (!options.length) return null;
        if (options.includes(this.nextStep)) return { step: this.nextStep };
        return App.userSettings.freePointSelection ? { step: null } : null;
    }


    /**
     * Depths a flag could still be pinned to, ignoring its own current confirmation.
     * @param {SquadObjective} flag
     * @returns {number[]} sorted, empty if the other confirmations already rule it out
     */
    _stepOptionsFor(flag) {
        const others = this.selectedFlags.filter((other) => other !== flag);
        const result = this.solver.solve(this._constraints(others), this.countFromEnd);
        const steps = new Set();
        flag.candidateIds.forEach((id) => result.byId.get(id)?.steps.forEach((step) => steps.add(step)));
        return [...steps].sort((a, b) => a - b);
    }


    /**
     * Recalculate the board from the confirmed set and paint it.
     * @param {SquadObjective} [previewFlag] - painted as if confirmed, without confirming it
     */
    _renderFromSolver(previewFlag = null) {

        if (!this.solver?.ok) return;

        const constraints = this._constraints();

        if (previewFlag) {
            // Preview what clicking would do, including the depth it would pin.
            const confirmation = this._confirmationFor(previewFlag);
            if (!confirmation) return;
            constraints.push({ ids: previewFlag.candidateIds, step: confirmation.step });
        }

        const result = this.solver.solve(constraints, this.countFromEnd);
        if (previewFlag && !result.alive) return;

        // Preview reuses solverResult as the channel applySolverResult() reads from, but
        // must not leave the board's real solve state contaminated once the hover ends -
        // nothing else re-solves on mouseout to fix it back up.
        const previousResult = this.solverResult;
        this.solverResult = result;

        // Shallowest step not yet pinned. Flags that can fill it are marked "next".
        // Confirmations without a depth do not take a slot, since which one they fill
        // is still open.
        const pinned = new Set([...this.confirmedStep.values()].filter((step) => step != null));
        let nextStep = 1;
        while (pinned.has(nextStep)) nextStep++;
        this.nextStep = nextStep;

        this.flags.forEach((flag) => flag.applySolverResult(previewFlag !== null));

        if (previewFlag === null) this._drawPath();
        else this.solverResult = previousResult;
    }


    /**
     * The main flag a route graph node id refers to. Links address mains by
     * objectDisplayName, so match that first.
     * @param {string} node
     * @returns {SquadObjective|undefined}
     */
    _mainForNode(node) {
        if (!node) return undefined;
        return this.mains.find(
            (main) => (main.objCluster.objectDisplayName ?? main.objectName) === node
        );
    }


    /**
     * Draw the chain through the confirmed points.
     *
     * Only points next to each other in the chain are joined. Knowing the first and the
     * last point says nothing about the route between them, so a single line across the
     * map would show a path that has not been confirmed. Each run of adjacent points
     * becomes its own polyline, which also keeps the distance labels on confirmed legs.
     */
    _drawPath() {

        this.pathLines.forEach((line) => line.removeFrom(this.activeLayerMarkers).remove());
        this.pathLines = [];

        // A confirmed point whose depth is still open has no place in the chain yet.
        const points = this.selectedFlags
            .map((flag) => ({ steps: flag.solverSteps(), latlng: flag.latlng }))
            .filter((point) => point.steps.length === 1)
            .map((point) => ({ step: point.steps[0], latlng: point.latlng }))
            .sort((a, b) => a.step - b.step);

        // The mains bracket the chain. The one the numbering counts from sits one step
        // before the first capture point, the other one step after the last. The far main
        // is joined only once the deepest point is confirmed.
        if (points.length && this.perspectiveMain) {
            points.unshift({ step: 0, latlng: this.perspectiveMain.latlng });

            const farMain = this.mains.find((main) => main !== this.perspectiveMain);
            if (farMain && points.some((point) => point.step === this.solver.stepCount)) {
                points.push({ step: this.solver.stepCount + 1, latlng: farMain.latlng });
            }
        }

        let run = [];
        const flush = () => {
            if (run.length > 1) this.pathLines.push(this._createPathLine(run.map((point) => point.latlng)));
            run = [];
        };

        points.forEach((point, index) => {
            if (index && point.step !== points[index - 1].step + 1) flush();
            run.push(point);
        });
        flush();

        this.path = this.pathLines.map((line) => line.getLatLngs());
    }


    /**
     * One leg of the confirmed chain.
     * @param {Array} latlngs
     * @returns {Polyline}
     */
    _createPathLine(latlngs) {
        const line = new Polyline(latlngs, {
            color: "white",
            opacity: this.isVisible ? 0.9 : 0,
            showMeasurements: true,
            measurementOptions: {
                minPixelDistance: 50,
                scaling: this.map.mapToGameScale,
            }
        }).addTo(this.activeLayerMarkers);

        if (!App.userSettings.showFlagsDistance || !this.isVisible) line.hideMeasurements();

        return line;
    }


    // WIP
    refreshLane(flag) {

        const laneObjects = this.layerData.capturePoints.lanes.laneObjects;

        // collect the cluster names from the selected flag
        const flagClusterNames = flag.clusters.map(c => c.name);

        Object.values(laneObjects).forEach((lane) => {
            if (!lane.polyline) return; // skip if no polyline

            // check if lane.pointsOrder contains at least one of the flag's clusters
            const containsCluster = lane.pointsOrder.some(clusterName =>
                flagClusterNames.includes(clusterName)
            );

            if (containsCluster) {
                lane.polyline.addTo(this.map); // show
            } else {
                lane.polyline.remove(); // hide
            }
        });
    }


    /**
     * Drop every confirmation and show the whole layer again.
     */
    _resetLayer() {
        console.debug("[LAYER] Resetting layer");
        this.selectedFlags = [];
        this.confirmedStep.clear();
        this._renderFromSolver();
    }


    /**
     * Set the opacity of the layer
     * @param {number} value - opacity value (0-1)
     */
    _setOpacity(value){
        
        // Polyline opacity
        this.polyline.setStyle({ opacity: value });
        this.pathLines.forEach((line) => line.setStyle({ opacity: value }));

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

        // Player Spawns
        this.spawnGroups.forEach(spawnGroup => { spawnGroup.setOpacity(value); });
    }


    toggleVisibility() {
        if (this.isVisible) {
            this._setOpacity(0);
            this.polyline.hideMeasurements();
            this.pathLines.forEach((line) => line.hideMeasurements());
            this.isVisible = false;
            $(".btn-layer").removeClass("active");
            this.hideAllCapzones();
            this.cameraActor?.hide();
            this.setMainZoneOpacity(false);
            this.hexs.forEach((hex => { hex.hide();}));
            this.vehicleSpawners.forEach(spawn => { spawn.hide(); });
            if (App.userSettings.showMapBorders) this.borders?.setStyle({ fillOpacity: 0 });
        }
        else {
            this.cameraActor?.show();
            this.hexs.forEach((hex => { hex.show();}));
            this._setOpacity(1);
            this.setMainZoneOpacity(true);
            if (App.userSettings.showFlagsDistance) {
                const measurementOptions = { minPixelDistance: 50, scaling: this.map.mapToGameScale };
                this.polyline.showMeasurements(measurementOptions);
                this.pathLines.forEach((line) => line.showMeasurements(measurementOptions));
            }
            $(".btn-layer").addClass("active");
            this.isVisible = true;

            if (this.map.getZoom() > this.map.detailedZoomThreshold) {
                this.vehicleSpawners.forEach(spawn => { spawn.show(); });
                this.revealAllCapzones();
            }
            if (this.borders && App.userSettings.showMapBorders) this.borders.setStyle({ fillOpacity: 0.75 });
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
        $(".btn-layer-info").hide();
        this.spawnGroups = [];
        this.vehicleSpawners = [];
        this.hexs = [];
        this.stagingZones = [];
        this.selectedFlags = [];
        this.confirmedStep.clear();
        this.solverResult = null;
    }

}