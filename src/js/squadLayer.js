
import { DivIcon, Marker, Circle, LayerGroup, Polyline, Polygon, Rectangle, FeatureGroup } from "leaflet";
import { SquadObjective } from "./squadObjective.js";
import { App } from "../app.js";
import i18next from "i18next";
import "./libs/leaflet-measure-path.js";

export default class SquadLayer {

    constructor(map, layerData) {
        this.map = map;
        this.activeLayerMarkers = new LayerGroup().addTo(this.map);
        this.layerData = layerData;
        this.offset_x = Math.min(this.layerData.mapTextureCorners[0].location_x, this.layerData.mapTextureCorners[1].location_x);
        this.offset_y = Math.min(this.layerData.mapTextureCorners[0].location_y, this.layerData.mapTextureCorners[1].location_y);
        this.isVisible = true;
        // Current position in the layer
        this.currentPosition = 0;

        // latlng's of the currently selected flags
        this.path = [];
        this.polyline = new Polyline(this.path, {
            color: "white",
            opacity: 0.9,
            showMeasurements: true,
            measurementOptions: {
                showTotalDistance: false,
                minPixelDistance: 50,
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

        // If already zoomed in, reveal capzones/main assets
        if (this.map.getZoom() > this.map.detailedZoomThreshold) this.revealAllCapzones();

        this.setMainZoneOpacity(true);
    }



    /**
     * xxxx
     * @return {number} - xxxx
     */
    init(){

        // Destruction
        if (this.layerData.gamemode === "Destruction") {

            // Creating the Caches
            Object.values(this.layerData.capturePoints.objectiveSpawnLocations).forEach((cache) => {
                const latlng = this.convertToLatLng(cache.location_x, cache.location_y);
                const radius = 1.5 * this.map.gameToMapScale;
                this.caches.addLayer(new Circle(latlng, {
                    radius: radius,
                    color: "firebrick",
                    fillColor: "white",
                    opacity: 1,
                    weight: 1.5,
                    fillOpacity: 1,
                }).addTo(this.activeLayerMarkers));
            });

            // Creating the Mains
            Object.values(this.layerData.capturePoints.points.objectives).forEach((main) => {
                const latlng = this.convertToLatLng(main.location_x, main.location_y);
                const newFlag = new SquadObjective(latlng, this, main, 1, main);
                this.flags.push(newFlag);
                newFlag.flag.off();
                newFlag.flag.options.interactive = false;
            });


            // Creating the phase aeras
            Object.values(this.layerData.capturePoints.destructionObject.phases).forEach((phases) => {

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

            this.createAssets();
            return;
        }

        // AAS
        if (this.layerData.gamemode === "AAS") {

            const objectiveKeys = Object.keys(this.layerData.objectives);
            const numFlags = objectiveKeys.length - 1;

            Object.values(this.layerData.objectives).forEach((obj, i) => {

                const latlng = this.convertToLatLng(obj.location_x, obj.location_y);

                // Ignore the first and last flags (Mains)
                // We will draw their protection zones instead later
                if (i === 0 || i === numFlags){
                    this.path.push(latlng);
                    this.flags.push(new SquadObjective(latlng, this, obj, 1, obj));
                    return;
                }

                const newFlag = new SquadObjective(latlng, this, obj, 0, obj);
                this.path.push(latlng);
                this.flags.push(newFlag);

                // Adding capzones to the flag object
                obj.objects.forEach((cap) => {
                    newFlag.createCapZone(cap);
                });

            });

            this.polyline.setLatLngs(this.path);
            this.createAssets();
            return;
        }

        // RAAS / INVASION

        Object.values(this.layerData.objectives).forEach((objCluster) => {

            if (!objCluster.points) {
                const latlng = this.convertToLatLng(objCluster.location_x, objCluster.location_y);
                const newFlag = new SquadObjective(latlng, this, objCluster, 1, objCluster);
                this.mains.push(newFlag);
                this.flags.push(newFlag);
            } 
            else {
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
            }
        });

        // Pre-select first main flag in invasion
        if (this.layerData.gamemode === "Invasion") {
            this.mains.forEach((main) => {
                if (main.objectName === this.layerData.capturePoints.clusters.listOfMains[0].replaceAll(" ", "")){
                    this._handleFlagClick(main);
                }
            });
        }

        this.createAssets();
    }


    revealAllCapzones() {
        if (App.userSettings.capZoneOnHover || !this.isVisible) return;
        this.flags.forEach(flag => {
            if (!flag.isHidden && !flag.isFadeOut) flag.revealCapZones();
        });
    }

    hideAllCapzones() {
        this.flags.forEach(flag => { flag.hideCapZones(); });
    }

    
    /**
     * xxxx
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
            this.mainZones.assets.push(new Marker(latlng, {
                interactive: false,
                keyboard: false,
                zIndexOffset: -1000,
                opacity: 1,
                icon: new DivIcon({
                    className: "helipads",
                    iconSize: [36, 36],
                })
            }).addTo(this.activeLayerMarkers));
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
            opacity: 1,
        };

        this.layerData.assets.deployables.forEach((asset) => {

            const latlng = this.convertToLatLng(asset.location_x, asset.location_y);

            if (asset.type === "Repair Station") {
                this.mainZones.assets.push(new Marker(latlng, {
                    ...assetsMarkerParams,
                    icon: new DivIcon({
                        className: "repairStations",
                        iconSize: [30, 30]
                    })
                }).addTo(this.activeLayerMarkers));
            }

            if (asset.type === "Ammo Crate") {
                this.mainZones.assets.push(new Marker(latlng, {
                    ...assetsMarkerParams,
                    icon: new DivIcon({
                        className: "ammocrates",
                        iconSize: [25, 25]
                    })
                }).addTo(this.activeLayerMarkers));
            }
        });
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
        const PZONECOLOR = "firebrick";

        // Creating protectionZones + noConstructionZones
        this.layerData.mapAssets.protectionZones.forEach((pZone) => {

            // Skip small protection zones
            if (pZone.objects[0].boxExtent.extent_x < 1000) return;

            // Center of the protection zone
            let [location_y, location_x] = this.convertToLatLng(pZone.objects[0].location_x, pZone.objects[0].location_y);

            // Protection Zone is a Rectangle/Capsule
            // We're drawing capsule as a rectangle cause it's easier
            if (pZone.objects[0].isBox || pZone.objects[0].isCapsule) {

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
                    fillOpacity: 0.1,
                }).addTo(this.activeLayerMarkers);

                let noDeployZone = new Rectangle(noDeployBounds, {
                    color: PZONECOLOR,
                    dashArray: "10,20",
                    opacity: 1,
                    weight: 1,
                    fillOpacity: 0.1,
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
                    color: "firebrick",
                    opacity: 1,
                    weight: 2,
                    fillOpacity: 0.1,
                    radius: protectRadius,
                }).addTo(this.activeLayerMarkers);

                let noDeployZone = new Circle(latlngSphere, {
                    color: "firebrick",
                    dashArray: "10,20",
                    opacity: 1,
                    weight: 1,
                    fillOpacity: 0.1,
                    radius: noDeployRadius,
                }).addTo(this.activeLayerMarkers);

                this.mainZones.rectangles.push(protectionZone);
                this.mainZones.rectangles.push(noDeployZone);
            }

        });

    }

    
    createAssets() {
        this.createHelipads();
        this.createDeployables();
        this.createProtectionZones();
    }


    setMainZoneOpacity(on){
        const opacity = on ? 1 : 0;
        const textOpacity = on ? 1 : 0;
        const fillOpacity = on ? 0.1 : 0;


        this.mainZones.rectangles.forEach((rectangle) => {
            rectangle.setStyle({ fillOpacity: fillOpacity, opacity: opacity });
        });

        this.mainZones.texts.forEach((text) => {
            text.setOpacity(textOpacity);
        });

        this.mainZones.assets.forEach(asset => {
            asset.setOpacity(opacity);
        });

    }


    _handleFlagClick(flag) {
        let backward = false;

        console.debug("**************************");
        console.debug("      NEW CLICKED FLAG    ");
        console.debug("**************************");
        console.debug("  -> Selected Flag:", flag.objectName);
        console.debug("  -> Clicked flag position", flag.position);
        console.debug("  -> Flag Object:", flag);
        console.debug("  -> Current position", this.currentPosition);
        console.debug("  -> Current selected Flags", this.selectedFlags);
        console.debug("  -> Cluster History", this.selectedReachableClusters);

        if (this.selectedFlags.length === 0){
            console.debug("  -> First flag clicked");
            this.startPosition = flag.position;
            console.debug("  -> starting position", this.startPosition);
            if (flag.position > 1){
                console.debug("  -> (Going from enemy main to main");
                this.reversed = true;
            }
        }

        // If the clicked flag is in front of the current position, skip
        if (Math.abs(this.startPosition - flag.position) > this.currentPosition) {

            // In RAAS, we can click on the oposite main flag to reset the layer
            if (this.layerData.gamemode === "RAAS" && flag.isMain){
                this._resetLayer();
                this._handleFlagClick(flag);
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
                this._resetLayer();
                return;
            }

            if (flag.isMain){
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
        }


        console.debug("**************************");
        console.debug("       STARTING DFS       ");
        console.debug("**************************");

        // Set to track clusters that can be reached from the clicked flag
        let reachableClusters = new Set();

        // Start DFS from each clicked flag clusters
        flag.clusters.forEach((cluster) => {
            // Only start DFS from clusters that are from our current position
            if (Math.abs(this.startPosition - cluster.pointPosition)+1 == this.currentPosition){
                const clusterName = cluster.name === "Main" ? cluster.objectDisplayName : cluster.name;
                this.dfs(clusterName, reachableClusters);
            }        
        });

        //Remove clusters that were not reachable from the previous flag
        reachableClusters = this._filterClusters(reachableClusters);

        // Something went wrong, we are in the wrong direction
        if (reachableClusters.size === 1 && this.currentPosition === 1){
            if (flag.isMain){
                console.debug("Already blocked");
                console.debug("Trying again in the other direction");
                this.reversed = !this.reversed;
                reachableClusters.clear();
                this.dfs(flag.clusters[0].objectDisplayName, reachableClusters);
            }
        }


        // Store the clusters in case we need to backtrack later
        this.selectedReachableClusters.push(reachableClusters);
        console.debug("Cluster History updated", this.selectedReachableClusters);


        /***************  RENDERING  ***************/
        /* We can finally act on the flags now !  */
        /***************  RENDERING  ***************/

        console.debug("****************************************");
        console.debug("Hiding Clusters in front of clicked flag");
        console.debug("****************************************");

        // Hide all clusters first, then selectively show reachable ones
        Object.values(this.layerData.objectives).forEach((cluster) => {
            console.debug("Should we hide cluster :", cluster.name);
            console.debug("   -> Cluster position", cluster.pointPosition);
            console.debug("   -> Clicked flag position", flag.position);
            console.debug("   -> Current position", this.currentPosition);
            if (Math.abs(this.startPosition - cluster.pointPosition)+1 >= this.currentPosition) {
                console.debug("   -> Cluster is in front! Hiding.");
                if (!flag.clusters.some(c => c.name === cluster.objectName)) {
                    this._hideCluster(cluster, flag);
                }
            } else {
                // Ignore clusters that are behind us
                console.debug("   -> Cluster behind, skipping it.");
            }
        });

        console.debug("*****************************************");
        console.debug("Showing Clusters in front of clicked flag");
        console.debug("*****************************************");


        // We will store the very next flags in this array
        let nextFlags = [];

        // Show reachable clusters
        reachableClusters.forEach((clusterName) => {

            let cluster = this.layerData.objectives[clusterName];

            // If the cluster is not found directly, search for a matching displayName (mains)
            if (!cluster) {
                cluster = Object.values(this.layerData.objectives).find(
                    (obj) => obj.objectDisplayName === clusterName
                );
            }

            console.debug("Cluster to show", cluster.name);
            console.debug("   -> cluster.pointPosition", cluster.pointPosition);
            console.debug("   -> Current position", this.currentPosition);

            // If the cluster is in front of the clicked flag, show it
            if (Math.abs(this.startPosition - cluster.pointPosition) + 1 > this.currentPosition){
        
                console.debug("   -> Cluster in front, showing it !");
                this._showCluster(cluster);
                
                // If cluster is directly in front of the clicked flag, count the next flags
                if (Math.abs(this.startPosition - cluster.pointPosition) + 1 === this.currentPosition+1){
                    const futurFlags = this.flags.filter((f) => f.clusters.includes(cluster));
                    futurFlags.forEach((flag) => {
                        // Only add if not already in the list
                        if (!nextFlags.includes(flag)) {
                            nextFlags.push(flag);
                        }
                    });
                }
                    
            }
            else {
                console.debug("   -> Cluster behind, skipping it.");
            }
        });

        this.handleNextFlags(nextFlags, backward);
    }

    
    /**
     * Handle next flags behaviour
     * Hightlight the next flags / Copy their names to the clipboard / Click the next flag if only one
     * @param {Array} nextFlags - Array of next flags
     * @param {boolean} backward - True if we are going backward
     */
    handleNextFlags(nextFlags, backward) {
        console.debug("Flags next step :", nextFlags);

        let nextFlagsNamesArray = [];

        // Highlight the next flags with a proper class
        nextFlags.forEach((flag) => {
            flag.flag._icon.classList.add("next");
            flag.flag.options.icon.options.className = "flag flag" + flag.position + " next";
            flag.isNext = true;
            nextFlagsNamesArray.push(flag.name);
        });

        // Copy the next flags names to the clipboard
        if (App.userSettings.copyNextFlags) {
            App.copy(i18next.t("common:nextFlags") + " : " + nextFlagsNamesArray.join("/"));
        }  
       
        // Only one flag in front ? Click it
        if (nextFlags.length === 1 && !backward && App.userSettings.autoLane){
            this._handleFlagClick(nextFlags[0]);
        }
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

        console.debug("**************************");
        console.debug("         DFS ENDED        ");
        console.debug("**************************");
        console.debug("Reachable clusters:", Array.from(reachableClusters));

        return reachableClusters;
    }
     
     

    preview(flag) {

        console.debug("**************************");
        console.debug("       NEW PREVIEW        ");
        console.debug("**************************");
        console.debug("  -> Selected Flag:", flag.objectName);
        console.debug("  -> Hovered flag position", flag.position);
        console.debug("  -> Flag Object:", flag);
        console.debug("  -> Current position", this.currentPosition);
        console.debug("  -> Current selected Flags", this.selectedFlags);
        console.debug("  -> Cluster History", this.selectedReachableClusters);
        console.debug("**************************");
        console.debug("       STARTING DFS       ");
        console.debug("**************************");

        // Set to track clusters that can be reached from the clicked flag
        let reachableClusters = new Set();

        // Start DFS from each clicked flag clusters
        flag.clusters.forEach((cluster) => {
            // Only start DFS from clusters that are from our current position
            if (Math.abs(this.startPosition - cluster.pointPosition) === this.currentPosition){
                this.dfs(cluster.name, reachableClusters);
            }
        });

        reachableClusters = this._filterClusters(reachableClusters);
      

        /***************  RENDERING  ***************/
        /* We can finally act on the flags now !  */
        /***************  RENDERING  ***************/

        console.debug("****************************************");
        console.debug(" Fading Clusters in front of clicked flag");
        console.debug("****************************************");

        // Hide all clusters first, then selectively show reachable ones
        Object.values(this.layerData.objectives).forEach((cluster) => {
            console.debug("Should we fade cluster :", cluster.name);
            console.debug("   -> Cluster position", cluster.pointPosition);
            console.debug("   -> Clicked flag position", flag.position);
            console.debug("   -> Current position", this.currentPosition+1);
            if (Math.abs(this.startPosition - cluster.pointPosition) >= this.currentPosition) {
                console.debug("   -> Cluster is in front! Hiding.");
                this._fadeOutCluster(cluster, flag);  
            } else {
                // Ignore clusters that are behind us
                console.debug("   -> Cluster behind, skipping it.");
            }
        });


        console.debug("*****************************************");
        console.debug("Showing Clusters in front of clicked flag");
        console.debug("*****************************************");

        // Show reachable clusters
        reachableClusters.forEach((clusterName) => {

            let cluster = this.layerData.objectives[clusterName];

            // If the cluster is not found directly, search for a matching displayName (mains)
            if (!cluster) {
                cluster = Object.values(this.layerData.objectives).find(
                    (obj) => obj.objectDisplayName === clusterName
                );
            }

            console.debug("Cluster to show", cluster.name);
            console.debug("   -> cluster.pointPosition", cluster.pointPosition);
            console.debug("   -> Current position", this.currentPosition+1);

            // If the cluster is in front of the clicked flag, show it
            if (Math.abs(this.startPosition - cluster.pointPosition) > this.currentPosition){
                console.debug("   -> Cluster in front, showing it !");
                this._fadeInCluster(cluster, flag);   
            }
            else {
                console.debug("   -> Cluster behind, skipping it.");
            }
        });

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
        const links = this.layerData.capturePoints.lanes.links || this.layerData.capturePoints.clusters.links;

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
        if (this.layerData.gamemode === "Invasion") {
            this.mains.forEach((main) => {
                if (main.objectName === this.layerData.capturePoints.clusters.listOfMains[0].replaceAll(" ", "")){
                    this._handleFlagClick(main);
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
        if (this.layerData.gamemode === "Destruction") {

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

        console.debug("   -> hiding cluster", cluster);

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

        console.debug("   -> Fading cluster", cluster);

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

        console.debug("   -> Fading cluster", cluster);

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
        }
        else {
            this._setOpacity(1);
            this.setMainZoneOpacity(true);
            if (App.userSettings.showFlagsDistance) {
                this.polyline.showMeasurements({
                    measurementOptions: {
                        showTotalDistance: false,
                        minPixelDistance: 50,
                    }
                });
            }
            $(".btn-layer").addClass("active");
            this.isVisible = true;
            if (this.map.getZoom() > this.map.detailedZoomThreshold) this.revealAllCapzones();

        }
    }

    /**
     * xxxx
     * @return {number} - xxxx
     */
    clear(){
        this.activeLayerMarkers.clearLayers();
        this.phaseNumber.clearLayers();
        this.phaseAeras.clearLayers();
    }

}