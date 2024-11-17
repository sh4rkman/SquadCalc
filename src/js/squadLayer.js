
import { DomEvent, DivIcon, Marker, Circle, LayerGroup, Polyline, Polygon, Rectangle, FeatureGroup, rectangle, } from "leaflet";

export class SquadLayer {

    constructor(map, layerData) {
        this.map = map;
        this.revealed = false;

        // Current position in the layer
        this.currentPosition = 0;

        // latlng's of the currently selected flags
        this.path = [];

        // Currently selected flags
        this.selectedFlags = [];
        this.selectedReachableClusters = [];

        // Hold the availables clusters at all time
        this.currentReachableClusters = new Set();

        this.mains = [];
        this.mainZones = {
            rectangles: [],
            texts: [],
        };
        this.caches = new FeatureGroup().addTo(this.map);
        this.flags = [];


        this.reversed = false;

        this.assets = [];

        this.layerData = layerData;
        this.activeLayerMarkers = new LayerGroup().addTo(this.map);
        this.polyline = new Polyline(this.path, {color: 'white', opacity: 0.7}).addTo(this.activeLayerMarkers)
        this.currentIndex = 0;
        this.offset_x = Math.min(this.layerData.mapTextureCorners[0].location_x, this.layerData.mapTextureCorners[1].location_x)
        this.offset_y = Math.min(this.layerData.mapTextureCorners[0].location_y, this.layerData.mapTextureCorners[1].location_y)
        this.init();

        if(this.map.getZoom() > 3){
            this.setMainZoneOpacity(true);
        }

    }

    /**
     * xxxx
     * @return {number} - xxxx
     */
    init(){

        // Destruction
        if (this.layerData.gamemode === "Destruction") {

            // Creating the Caches
            Object.values(this.layerData.capturePoints.objectiveSpawnLocations).forEach((cache, i) => {
                var latlng = this.convertToLatLng(cache.location_x, cache.location_y);
                const radius = 1.5 * this.map.gameToMapScale;
                this.caches.addLayer(new Circle(latlng, {
                    radius: radius,
                    color: 'firebrick',
                    fillColor: 'white',
                    opacity: 1,
                    weight: 1.5,
                    fillOpacity: 0.4,
                }).addTo(this.activeLayerMarkers));
            });

            // Creating the Mains
            Object.values(this.layerData.capturePoints.points.objectives).forEach((main, i) => {
                var latlng = this.convertToLatLng(main.location_x, main.location_y);
                var newFlag = new SquadObjective(latlng, this, "", main, 1, main);
                this.mains.push(newFlag);
                newFlag.flag.off()
                newFlag.flag.options.interactive = false;
            });


            // Creating the phase aeras
            Object.values(this.layerData.capturePoints.destructionObject.phases).forEach((phases) => {

                phases.phaseObjectives.forEach((obj) => {

                    var latlngs = [];
                    let totalLat = 0;
                    let totalLng = 0;

                    obj.splinePoints.forEach((point) => {
                        var latlng = this.convertToLatLng(point.location_x, point.location_y);
                        totalLat += point.location_x;
                        totalLng += point.location_y;
                        latlngs.push(latlng);
                    });
            
                    // Draw the aeras
                    new Polygon(latlngs, {
                        color: 'red',
                        dashArray: "10,8",
                        weight: 1,
                        fillOpacity: 0.05,
                    }).addTo(this.activeLayerMarkers);

                    // This is the centroid where we'll place the phase number
                    var center = [totalLat / latlngs.length, totalLng / latlngs.length];
                    
                    // Place the phase number in the center of the zone
                    new Marker(center, {
                        interactive: false,
                        icon: new DivIcon({
                            className: "destructionPhase",
                            html: phases.PhaseNumber + 1,
                            iconSize: [50, 50],
                            iconAnchor: [25, 25]
                          })
                    }).addTo(this.activeLayerMarkers);
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

                var latlng = this.convertToLatLng(obj.location_x, obj.location_y);

                // Ignore the first and last flags (Mains)
                // We will draw their protection zones instead later
                if(i === 0 || i === numFlags){
                    var newFlag = new SquadObjective(latlng, this, "", obj, 1, obj);
                    this.path.push(latlng);
                    this.flags.push(newFlag);
                    return;
                }

                var newFlag = new SquadObjective(latlng, this, "", obj, 0, obj);
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

        // Find the # of objective in the layer
        this.objNumber = Math.max(
            ...Object.values(this.layerData.objectives)
            .filter(obj => obj.pointPosition !== undefined)
            .map(obj => obj.pointPosition)
        );


        Object.values(this.layerData.objectives).forEach((objCluster, i) => {

            if(!objCluster.points) {
                var latlng = this.convertToLatLng(objCluster.location_x, objCluster.location_y);
                var newFlag = new SquadObjective(latlng, this, "", objCluster, 1, objCluster);
                this.mains.push(newFlag);
                this.flags.push(newFlag);
            } 
            else {
                objCluster.points.forEach((obj) => {

                    latlng = this.convertToLatLng(obj.location_x, obj.location_y);
                    const pos = objCluster.pointPosition;
                    let flagExists = false;
                    const roundedLatLng = latlng;

                    this.flags.forEach((flag) => {
                        if (this.areLatLngsClose(flag.latlng, roundedLatLng)) {
                            console.log(`adding cluster ${objCluster.name} to flag ${flag.name}`)
                            console.log("new clustersList: ", flag.clusters)
                            flag.addCluster(objCluster);
                            flagExists = true;
                        }
                    });

                    if (!flagExists) {
                        const newFlag = new SquadObjective(latlng, this, pos, obj, 0, objCluster);
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
        if(this.layerData.gamemode === "Invasion") {
            this.mains.forEach((main) => {
                if(main.position === 1){ this._handleFlagClick(main); }
            });
        }

        this.createAssets();
    }


    /**
     * xxxx
     * @param {number} x - latitude in cm as found in the squadpipeline extraction
     * @param {number} y - longitude in cm as found in the squadpipeline extraction
     * @returns {Array} - [latitude, longitude] in meters
     */ 
    convertToLatLng(x, y) {
        return [ (y - this.offset_y) / 100 * -this.map.gameToMapScale, (x - this.offset_x) / 100 * this.map.gameToMapScale];
    }

    /**
     * Function to check if two latlngs are close to each other
     * @param {Array} latlng1 - [latitude, longitude] in meters
     * @param {Array} latlng2 - [latitude, longitude] in meters
     * @param {number} threshold - The distance threshold in meters (default 5)
     * @returns {boolean} - True if the distance is less than the threshold
     */
    areLatLngsClose = (latlng1, latlng2, threshold = 5) => {
        const [x1, y1] = latlng1;
        const [x2, y2] = latlng2;
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance < threshold;
    };


    createAssets() {

        // Creating Helipads
        this.layerData.assets.helipads.forEach((asset) => {
            const latlng = this.convertToLatLng(asset.location_x, asset.location_y);
            this.assets.push(new Marker(latlng, {
                interactive: false,
                zIndexOffset: -1000,
                opacity: 0,
                icon: new DivIcon({
                    className: 'helipads',
                    iconSize: [36, 36],
                  })
            }).addTo(this.activeLayerMarkers));
        });

    
        // Creating Deployables
        this.layerData.assets.deployables.forEach((asset) => {
            const latlng = this.convertToLatLng(asset.location_x, asset.location_y);
            // Repairs
            if(asset.type === "Repair Station") {
                this.assets.push(new Marker(latlng, {
                    interactive: false,
                    zIndexOffset: -1000,
                    opacity: 0,
                    icon: new DivIcon({
                        className: 'repairStations',
                        iconSize: [30, 30]
                        })
                }).addTo(this.activeLayerMarkers));
            }
            // Crates
            if(asset.type === "Ammo Crate") {
                this.assets.push(new Marker(latlng, {
                    interactive: false,
                    zIndexOffset: -1000,
                    opacity: 0,
                    icon: new DivIcon({
                        className: 'ammocrates',
                        iconSize: [25, 25]
                        })
                }).setOpacity(0).addTo(this.activeLayerMarkers));
            }
        });

        // Creating protectionZones + noConstructionZones
        this.layerData.mapAssets.protectionZones.forEach((asset) => {

            // remove useless protection zones (<10m)
            if(asset.objects[0].boxExtent.extent_x/100 < 10) return;


            // Position of the protection zone
            var location_x = -(asset.objects[0].location_x - this.offset_x) / 100;
            var location_y = (asset.objects[0].location_y - this.offset_y) / 100;

            // Draw a rectangle for the protection zone
            var boxExtentX = asset.objects[0].boxExtent.extent_x / 100;
            var boxExtentY = asset.objects[0].boxExtent.extent_y / 100;
            var bound1 = [(location_y + boxExtentY) * -this.map.gameToMapScale , (location_x + boxExtentX) * -this.map.gameToMapScale];
            var bound2 = [(location_y - boxExtentY) * -this.map.gameToMapScale , (location_x - boxExtentX) * -this.map.gameToMapScale];
            var bounds = [bound1, bound2];

            let noDeployZone = new Rectangle(bounds, {
                color: 'firebrick',
                opacity: 0,
                weight: 2,
                fillOpacity: 0,
            }).addTo(this.activeLayerMarkers)


            // Same rectangle + asset.deployableLockDistance for the noConstructionZone
            var boxExtentX2 = (asset.objects[0].boxExtent.extent_x + asset.deployableLockDistance) / 100;
            var boxExtentY2 = (asset.objects[0].boxExtent.extent_y + asset.deployableLockDistance) / 100;
            var bound3 = [(location_y + boxExtentY2) * -this.map.gameToMapScale , (location_x + boxExtentX2) * -this.map.gameToMapScale];
            var bound4 = [(location_y - boxExtentY2) * -this.map.gameToMapScale , (location_x - boxExtentX2) * -this.map.gameToMapScale];
            var bounds2 = [bound3, bound4];

            let noConsZone = new Rectangle(bounds2, {
                color: 'firebrick',
                dashArray: "10,20",
                opacity: 0,
                weight: 1,
                fillOpacity: 0,
            }).addTo(this.activeLayerMarkers)


            var location_x = -(asset.objects[0].location_x - this.offset_x ) / 100 * -this.map.gameToMapScale;
            var location_y = (asset.objects[0].location_y - this.offset_y + asset.objects[0].boxExtent.extent_y) / 100 * -this.map.gameToMapScale;
            var latlng = [location_y, location_x];

            var noDeployText = new Marker(latlng, {
                interactive: false,
                opacity: 0,
                icon: new DivIcon({
                    className: "protectionZonesTexts",
                    html: "Protection Zone",
                })
            }).addTo(this.activeLayerMarkers);


            var location_x2 = -(asset.objects[0].location_x - this.offset_x) / 100 * -this.map.gameToMapScale;
            var location_y2 = (asset.objects[0].location_y - this.offset_y + asset.objects[0].boxExtent.extent_y + asset.deployableLockDistance) / 100 * -this.map.gameToMapScale;
            var latlng2 = [location_y2, location_x2];

            var noConsText = new Marker(latlng2, {
                interactive: false,
                opacity: 0,
                icon: new DivIcon({
                    className: "protectionZonesTexts",
                    html: "No Construction Zone",
                })
            }).addTo(this.activeLayerMarkers);

            this.mainZones.rectangles.push(noConsZone);
            this.mainZones.texts.push(noConsText);
            this.mainZones.rectangles.push(noDeployZone);
            this.mainZones.texts.push(noDeployText);

        });


    }

    setMainZoneOpacity(on){

        if(on){
            var opacity = 1;
            var textOpacity = 1;
            var fillOpacity = 0.1;
        } else {
            var opacity = 0;
            var textOpacity = 0;
            var fillOpacity = 0;
        }

        this.mainZones.rectangles.forEach((rectangle) => {
            rectangle.setStyle({ fillOpacity: fillOpacity, opacity: opacity });
        });

        this.mainZones.texts.forEach((text) => {
            text.setOpacity(textOpacity);
        });

        this.assets.forEach(asset => {
            asset.setOpacity(opacity);
        });

    }


    _handleFlagClick(flag) {
        var backward = false;

        // todo remove
        console.clear();
        console.debug("**************************")
        console.debug("      NEW CLICKED FLAG    ")
        console.debug("**************************")
        console.debug("  -> Selected Flag:", flag.objectName);
        console.debug("  -> Clicked flag position", flag.position)
        console.debug("  -> Flag Object:", flag);
        console.debug("    **************************")
        console.debug("  -> Current position", this.currentPosition)
        console.debug("  -> Current selected Flags", this.selectedFlags)
        console.debug("  -> Cluster History", this.selectedReachableClusters)

        if(this.selectedFlags.length === 0){
            console.debug("  -> First flag clicked");
            this.startPosition = flag.position;
            console.debug("  -> starting position", this.startPosition)
            if(flag.position > 1){
                console.debug("  -> (Going from enemy main to main");
                this.reversed = true;
            }
        }

        // If the clicked flag is in front of the current position, skip
        if(Math.abs(this.startPosition - flag.position)+1 > this.currentPosition+1) {
            console.debug("  -> Clicked Flag is in front, skipping..")
            return; 
        }

        // Going backward
        if(Math.abs(this.startPosition - flag.position)+1 <= this.currentPosition){

            backward = true;
            this.selectedReachableClusters.pop();

            var positionToReduce = (this.currentPosition - Math.abs(this.startPosition - flag.position));
            console.debug("# of Going backward : ", positionToReduce)

            if(flag === this.selectedFlags[0]) {
                console.debug("Can't unselect main flag")
                this._resetLayer();
                return;
            }
            
            // Remove the selectedFlags from the end
            for(var i = 0; i < positionToReduce; i++){
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


        console.debug("**************************")
        console.debug("       STARTING DFS       ")
        console.debug("**************************")

        // Set to track clusters that can be reached from the clicked flag
        const reachableClusters = new Set();

        // Start DFS from each cluster associated with the clicked flag
        flag.clusters.forEach((cluster) => {

            // Ignore clusters that are in front of the clicked for now
            if(Math.abs(this.startPosition - cluster.pointPosition)+1 > this.currentPosition){
                console.debug("Cluster is irrevelant! skipping DFS for now..", cluster);
                return;
            }
           
            // If the clicked flag is a main flag, use the objectDisplayName instead
            if(cluster.name === "Main"){
                this.dfs(cluster.objectDisplayName, reachableClusters);
                return;
            }

            this.dfs(cluster.name, reachableClusters);
        });



        // Remove clusters that are not reachable from the previous flag
        if(this.selectedReachableClusters.length > 0){
            Array.from(reachableClusters).forEach((cluster) => {
                if(!this.selectedReachableClusters.at(-1).has(cluster)){
                    reachableClusters.delete(cluster);
                    console.debug(" -> filtered because wasn't previously reachable :", cluster);
                }
            });
        }

        // At this point, `reachableClusters` holds all clusters that are reachable
        console.debug("**************************")
        console.debug("         DFS ENDED        ")
        console.debug("**************************")
        console.debug("Reachable clusters:", Array.from(reachableClusters));


        // Store the clusters in case we need to backtrack later
        this.selectedReachableClusters.push(reachableClusters);
        console.debug("Cluster History updated", this.selectedReachableClusters)


        /***************  RENDERING  ***************/
        /* We can finally act on the flags now !  */
        /***************  RENDERING  ***************/

        console.debug("****************************************")
        console.debug("Hiding Clusters in front of clicked flag")
        console.debug("****************************************")

        // Hide all clusters first, then selectively show reachable ones
        Object.values(this.layerData.objectives).forEach((cluster) => {
            console.debug("Should we hide cluster :", cluster.name)
            console.debug("   -> Cluster position", cluster.pointPosition)
            console.debug("   -> Clicked flag position", flag.position)
            console.debug("   -> Current position", this.currentPosition)
            if (Math.abs(this.startPosition - cluster.pointPosition)+1 >= this.currentPosition) {
                console.debug("   -> Cluster is in front! Hiding.");
                if (!flag.clusters.some(c => c.name === cluster.objectName)) {
                    this._hideCluster(cluster, flag);
                }
            } else {
                // Ignore clusters that are behind us
                console.log("   -> Cluster behind, skipping it.");
            }
        });

        console.debug("*****************************************")
        console.debug("Showing Clusters in front of clicked flag")
        console.debug("*****************************************")


        // We will store the very next flags in this array
        var nextFlags = [];

        // Show reachable clusters
        reachableClusters.forEach((clusterName) => {
            // Attempt to retrieve the cluster directly by name
            let cluster = this.layerData.objectives[clusterName];

            // If the cluster is not found directly, search for a matching displayName (mains)
            if (!cluster) {
                cluster = Object.values(this.layerData.objectives).find(
                    (obj) => obj.objectDisplayName === clusterName
                );
            }

            console.debug("Cluster to show", cluster)
            console.debug("   -> cluster.pointPosition", cluster.pointPosition)
            console.debug("   -> Flag position", flag.position)
            console.debug("   -> Current position", this.currentPosition)

            // If the cluster is in front of the clicked flag, show it
            if(Math.abs(this.startPosition - cluster.pointPosition) + 1 > this.currentPosition){
                  
                console.debug("   -> Cluster in front, showing it !");

                this._showCluster(cluster);
                
                // If cluster is directly in front of the clicked flag, count the next flags
                if(Math.abs(this.startPosition - cluster.pointPosition) + 1 === this.currentPosition+1){
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

        console.debug("Flags next step :", nextFlags);


        // Highlight the next flags with a proper class
        nextFlags.forEach((flag) => {
            var div = flag.flag._icon;
            div.classList.add("next");
            flag.flag.options.icon.options.className = "flag flag" + flag.position + " next";
        });


        // Only one flag in front ? Click it
        if(nextFlags.length === 1 && !backward){
            this._handleFlagClick(nextFlags[0]);
        }

    }


    /**
     * Deep First Search to find all reachable clusters from a given cluster
     * @param {String} clusterName 
     * @param {Array} reachableClusters - Set to store reachable clusters
     */
    dfs(clusterName, reachableClusters) {
        if (reachableClusters.has(clusterName)) return;  // If already visited, skip
        reachableClusters.add(clusterName); // Mark this cluster as reachable)
        console.debug("Added to reachableCluster :", clusterName);
        // Sometimes links are stored in clusters, sometimes in lanes
        const links = this.layerData.capturePoints.lanes.links || this.layerData.capturePoints.clusters.links;

        // Traverse each link to find connected clusters
        links.forEach((link) => {
            if(this.reversed){
                if (link.nodeB === clusterName && !reachableClusters.has(link.nodeA)) {
                    this.dfs(link.nodeA, reachableClusters);  // Traverse from nodeB to nodeA
                }
            }
            else {
                if (link.nodeA === clusterName && !reachableClusters.has(link.nodeB)) {
                    this.dfs(link.nodeB, reachableClusters);  // Traverse from nodeA to nodeB
                }
            }

        });
    }


    /**
     * Unselects all flags and resets the layer
     */
    _resetLayer() {
        console.clear();
        console.log("Resetting layer");

        this.currentPosition = 0;
        this.selectedReachableClusters = [];
        this.selectedFlags = [];
        this.reversed = false;

        this.path = [];
        this.polyline.setLatLngs([]);

        this.flags.forEach((flag) => {
            flag.unselect();
            if(!flag.isMain){ flag.hide(); }
        });

        // Pre-select first main flag in invasion
        if(this.layerData.gamemode === "Invasion") {
            this.mains.forEach((main) => {
                if(main.position === 1){ this._handleFlagClick(main); }
            });
        }
    }

    /**
     * Set the opacity of the layer
     * @param {number} value - The opacity value (0-1)
     */
    _setOpacity(value){
        this.polyline.setStyle({ opacity: value });
        this.flags.forEach((flag) => {
            flag._setOpacity(value);
        });
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
                if(this.selectedReachableClusters.at(-1).has(cluster.name)){
                    foundClusters.push(cluster);
                }
            });

            console.log("   -> filtered clusters from previous step", foundClusters)

            var newPos;

            if(this.reversed){
                // store the lowest foundsclusters pointPosition in var new pos
                newPos = foundClusters.reduce((max, item) =>
                    item.pointPosition > max ? item.pointPosition : max,
                    foundClusters[0].pointPosition
                );
            } else {
                newPos = foundClusters.reduce((min, item) => {
                    // Check that the item's pointPosition is both less than the current min
                    // and greater than this.currentPosition
                    if (item.pointPosition < min && item.pointPosition > this.currentPosition) {
                        return item.pointPosition;
                    }
                    return min;
                }, foundClusters[0].pointPosition);
            }

            flagToShow.position = newPos;
            flagToShow.show();

        });

    }

    _hideCluster(cluster, clickedFlag) {

        console.log("   -> hiding cluster", cluster)

        if (cluster.name === "Main") return;

        const flagsToHide = this.flags.filter((f) =>
            f !== clickedFlag && f.clusters.includes(cluster)
        );

        // Show each flag that was found
        flagsToHide.forEach((flagToHide) => {
            if(!this.selectedFlags.includes(flagToHide)){
                flagToHide.hide();
            }
        });
    }



    /**
     * xxxx
     * @return {number} - xxxx
     */
    clear(){
        this.activeLayerMarkers.clearLayers();
    }

}





export class SquadObjective {

    constructor(latlng, layer, position, objCluster, isMain, cluster) {

        this.name = objCluster.name;
        this.objectName = objCluster.objectName;
        this.objCluster = objCluster
        this.layerGroup = layer.activeLayerMarkers;
        this.layer = layer
        this.latlng = latlng;
        this.clusters = [];
        this.capZones = new LayerGroup().addTo(this.layerGroup);
        this.isMain = isMain;
        this.isHidden = true;
        this.position = cluster.pointPosition;

        console.log("creating flag", this.name, "at position", this.position)

        var html = "";
        if(!this.isMain){
            html = this.name;
        }

        this.nameText = new Marker(latlng, {
            interactive: false,
            icon: new DivIcon({
                className: "objText",
                html: html,
                iconSize: [300, 20],
                iconAnchor: [150, 30]
            })
        }).addTo(this.layerGroup);


        if(this.isMain){
            if(this.layer.layerData.gamemode === "AAS" || this.layer.layerData.gamemode === "Destruction"){
                var className = "flag main unselectable";
            } else {
                var className = "flag main selectable";
            }
        } else {
            var className = "flag flag" + this.position;
        }


        this.flag = new Marker(latlng, {
            interactive: true,
            icon: new DivIcon({
                className: className,
                html: 99,
                iconSize: [40, 18],
                iconAnchor: [20, 9] 
            })
        }).addTo(this.layerGroup);

        this.addCluster(cluster);

        this.flag.on('click', this._handleClick, this);
        this.flag.on('mouseover', this._handleMouseOver, this);
        this.flag.on('mouseout', this._handleMouseOut, this);
    }

    select(){
        console.log("Selecting flag: ", this.name)
        this.flag.removeFrom(this.layerGroup).remove();

        if(this.isMain) { 
            var html= "";
            var className = "flag selected main";
        } 
        else {
            var position = Math.abs(this.layer.startPosition - this.position); 
            var position = Math.abs(this.layer.startPosition - this.position); 
        }

        if(!this.isMain) { 
            var position = Math.abs(this.layer.startPosition - this.position); 
        }

        if(!this.isMain) { 
            var html = position; 
            var className = "flag selected";
        }

        this.flag = new Marker(this.latlng, {
            interactive: true,
            icon: new DivIcon({
                className: className,
                html: html,
                iconSize: [40, 18], 
                iconAnchor: [20, 9] 
            })
        }).addTo(this.layerGroup);

        this.isSelected = true;
        this.flag.on('click', this._handleClick, this);
        this.flag.on('mouseover', this._handleMouseOver, this);
        this.flag.on('mouseout', this._handleMouseOut, this);
    }


    createCapZone(cap){

        var location_x = -(cap.location_x - this.layer.offset_x) / 100;
        var location_y = (cap.location_y - this.layer.offset_y) / 100;
        var boxExtentX = cap.boxExtent.location_x / 100;
        var boxExtentY = cap.boxExtent.location_y / 100;


        // define rectangle geographical bounds
        var bound1 = [(location_y + boxExtentY) * -this.layer.map.gameToMapScale , (location_x + boxExtentX) * -this.layer.map.gameToMapScale];
        var bound2 = [(location_y - boxExtentY) * -this.layer.map.gameToMapScale , (location_x - boxExtentX) * -this.layer.map.gameToMapScale];
        var bounds = [bound1, bound2];
  
        // create the rectangle
        this.capZones.addLayer(
            new Rectangle(bounds, {
                color: 'rgb(230, 230, 230)',
                fillColor: 'rgb(199, 199, 199)',
                opacity: 0,
                weight: 2,
                fillOpacity: 0,
            }).addTo(this.layer.activeLayerMarkers)
        );

    }



    unselect(){

        this.flag.removeFrom(this.layerGroup).remove();

        var html = "";
        var position = Math.abs(this.layer.startPosition - this.position); 
        var className = "flag";
        //var position = this.position;

        if(this.isMain) { 
            html= "";
            if(this.layer.layerData.gamemode === "AAS" || this.layer.layerData.gamemode === "Destruction"){
                className = "flag main unselectable";
            } else {
                className = "flag main selectable";
            }
        } else {
            html = position;
            className = className + " flag" + position;
        }

        this.flag = new Marker(this.latlng, {
            interactive: true,
            icon: new DivIcon({
                className: className,
                html: html,
                iconSize: [40, 18], // smaller when selected
                iconAnchor: [20, 9] 
            })
        }).addTo(this.layerGroup);


        this.isSelected = false;
        this.flag.on('click', this._handleClick, this);
        this.flag.on('mouseover', this._handleMouseOver, this);
        this.flag.on('mouseout', this._handleMouseOut, this);
    }

    addCluster(cluster){
        this.clusters.push(cluster);
        this.updatePosition();
    }


    updatePosition() {

        let lowestPossiblePosition;

        lowestPossiblePosition = this.clusters.reduce((min, item) =>
            item.pointPosition < min ? item.pointPosition : min,
            this.clusters[0].pointPosition
        );

        if(this.layer.reversed) {
            lowestPossiblePosition = this.clusters.reduce((max, item) =>
                item.pointPosition > max ? item.pointPosition : max,
                this.clusters[0].pointPosition
            );
        }

        this.position = lowestPossiblePosition;

        // default parameters for AAS
        var className = "flag";
        var html = "";

        // if RAAS/Invasion, add the flag number and a colored icon
        if(this.layer.layerData.gamemode != "AAS") {
            className += " flag" + this.position;
            html = this.position;
        }

        if(this.isMain) { 
            html = "";
            if(this.layer.layerData.gamemode === "AAS" || this.layer.layerData.gamemode === "Destruction"){
                className = "flag main unselectable";
            } else {
                className = "flag main selectable";
            }
        }

        // Refresh the flag icon
        this.flag.setIcon(new DivIcon({
            className: className,
            html: html,
            iconSize: [40, 18],
            iconAnchor: [20, 9]
        }));

    }

    _handleClick(){
        if(this.layer.layerData.gamemode === "Destruction" || this.layer.layerData.gamemode === "AAS") return;
        this.layer._handleFlagClick(this);
    }

    _handleMouseOver() {
        const map = this.layer.map;
        const currentZoom = map.getZoom();
        const mapSize = map.activeMap.size;
    
        // Calculate the threshold dynamically based on map size
        const zoomThreshold = 1.039 * Math.pow(mapSize, 0.13);
    
        // Show markers only if the zoom level is high enough
        if (currentZoom > zoomThreshold) {
            // Adjust opacity when the threshold is met
            this.capZones.eachLayer((cap) => {
                cap.setStyle({ opacity: 1, fillOpacity: 0.3 });
            });
        }

    }

    _handleMouseOut(){
        this.capZones.eachLayer((cap) => {
            cap.setStyle({ opacity: 0, fillOpacity: 0 });
        });
    }


    hide(){
        this.nameText.removeFrom(this.layerGroup)
        this.flag.removeFrom(this.layerGroup)
        this.flag.options.interactive = false;
        this.flag.off()
        console.log("      -> Hiding flag: ", this.name)
        this.isHidden = true;
    }

    _setOpacity(value){
        this.flag.setOpacity(value);
        this.nameText.setOpacity(value);
    }

    delete(){
        this.nameText.removeFrom(this.layerGroup).remove();
        this.flag.removeFrom(this.layerGroup).remove();
    }

    show(){
        console.log("      -> Showing flag: ", this.name)

        this.nameText.setOpacity(1).addTo(this.layerGroup);
        this.flag.setOpacity(1).addTo(this.layerGroup);
        this.unselect();
        this.isHidden = false;

        // when showing a flag
        this.flag.on('click', this._handleClick, this);
        this.flag.options.interactive = true;
    }

}