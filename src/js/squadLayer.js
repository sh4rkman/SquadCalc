
import { DivIcon, Marker, Circle, LayerGroup, Polyline, Rectangle } from "leaflet";

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
        this.flags = [];

        this.reversed = false;


        //this.objNumber = "";
        this.layerData = layerData;
        this.activeLayerMarkers = new LayerGroup().addTo(this.map);
        this.polyline = new Polyline(this.path, {color: 'white', opacity: 0.7}).addTo(this.activeLayerMarkers)
        this.currentIndex = 0;
        this.offset_x = Math.min(this.layerData.mapTextureCorners[0].location_x, this.layerData.mapTextureCorners[1].location_x)
        this.offset_y = Math.min(this.layerData.mapTextureCorners[0].location_y, this.layerData.mapTextureCorners[1].location_y)
        this.init();

        console.log(layerData)
    }

    /**
     * xxxx
     * @return {number} - xxxx
     */
    init(){

        // AAS
        if (this.layerData.gamemode === "AAS") {
            Object.values(this.layerData.objectives).forEach((obj, i) => {
                obj.location_x = -(obj.location_x - this.offset_x) / 100
                obj.location_y = (obj.location_y - this.offset_y) / 100
                var latlng = [obj.location_y * -this.map.gameToMapScale, obj.location_x * -this.map.gameToMapScale]
                var radius = obj.objects[0].sphereRadius/100 * this.map.gameToMapScale
                var newFlag = new SquadObjective(latlng, radius, this, "", obj, 0, obj);
                newFlag.flag.off()
                this.path.push(latlng)
            });

            this.polyline.setLatLngs(this.path);
            return;
        }

        // RAAS / INVASION

        // Find the # of obective in the layer
        this.objNumber = Math.max(
            ...Object.values(this.layerData.objectives)
            .filter(obj => obj.pointPosition !== undefined)
            .map(obj => obj.pointPosition)
        );

        const areLatLngsClose = (latlng1, latlng2, threshold) => {
            const [x1, y1] = latlng1;
            const [x2, y2] = latlng2;
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            return distance < threshold;
        };

        Object.values(this.layerData.objectives).forEach((objCluster, i) => {

            if(!objCluster.points) {
                objCluster.location_x = -(objCluster.location_x - this.offset_x) / 100;
                objCluster.location_y = (objCluster.location_y - this.offset_y) / 100
                var latlng = [objCluster.location_y * -this.map.gameToMapScale, objCluster.location_x * -this.map.gameToMapScale]
                var radius = objCluster.objects[0].sphereRadius/100 * this.map.gameToMapScale
                //const pos = objCluster.pointPosition;
                var newFlag = new SquadObjective(latlng, radius, this, "", objCluster, 1, objCluster)
                this.mains.push(newFlag);
                this.flags.push(newFlag);
            } else {

                objCluster.points.forEach((obj) => {
                    const location_x = -(obj.location_x - this.offset_x) / 100;
                    const location_y = (obj.location_y - this.offset_y) / 100;
                    const latlng = [location_y * -this.map.gameToMapScale, location_x * -this.map.gameToMapScale];
                    const radius = obj.objects[0].sphereRadius / 100 * this.map.gameToMapScale;
                    const pos = objCluster.pointPosition;

                    let flagExists = false;

                    const threshold = 5; // Threshold distance in meters
                    const roundedLatLng = latlng;

                    this.flags.forEach((flag) => {
                        if (areLatLngsClose(flag.latlng, roundedLatLng, threshold)) {
                            console.log(`adding cluster ${objCluster.name} to flag ${flag.name}`)
                            console.log("new clustersList: ", flag.clusters)
                            flag.addCluster(objCluster);
                            flagExists = true;
                        }
                    });

                    if (!flagExists) {
                        const newFlag = new SquadObjective(latlng, radius, this, pos, obj, 0, objCluster);
                        this.flags.push(newFlag);
                        newFlag.hide();
                    }


                });


            }


        });

        console.log("flags: ", this.flags)

    }


    _handleFlagClick(flag) {
        var backward = false;

        // todo remove
        console.clear();
        console.warn("**************************")
        console.warn("      NEW CLICKED FLAG    ")
        console.warn("**************************")
        console.log("  -> Selected Flag:", flag.objectName);
        console.log("  -> Clicked flag position", flag.position)
        console.log("  -> Flag Object:", flag);
        console.log("    **************************")
        console.log("  -> Current position", this.currentPosition)
        console.log("  -> Current selected Flags", this.selectedFlags)
        console.log("  -> Cluster History", this.selectedReachableClusters)


        //return;

        if(this.selectedFlags.length === 0){
            console.log("  -> First flag clicked");

            this.startPosition = flag.position;
            console.log("  -> starting position", this.startPosition)

            if(flag.position > 1){
                console.log("  -> (Going from enemy main to main");
                this.reversed = true;
            }

        }

        //var correctedFlagPosition = Math.abs(this.startPosition - flag.position);
        //console.log("  -> Corrected flag position", Math.abs(this.startPosition - flag.position));

        //flag.position = Math.abs(this.startPosition - flag.position)+1;
        //console.error(flag.position)


        if(Math.abs(this.startPosition - flag.position)+1 > this.currentPosition+1) {
            console.error("  -> Clicked Flag is in front, skipping..")
            return; 
        }

        // Going backward
        if(Math.abs(this.startPosition - flag.position)+1 <= this.currentPosition){

            backward = true;
            this.selectedReachableClusters.pop();

            var positionToReduce = (this.currentPosition - Math.abs(this.startPosition - flag.position));
            console.error("# of Going backward : ", positionToReduce)

            if(flag === this.selectedFlags[0]) {
                console.log("Can't unselect main flag")
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


        console.warn("**************************")
        console.warn("       STARTING DFS       ")
        console.warn("**************************")

        // Set to track clusters that can be reached from the clicked flag
        const reachableClusters = new Set();

        // Start DFS from each cluster associated with the clicked flag
        flag.clusters.forEach((cluster) => {

            // Ignore clusters that are in front of the clicked for now
            //cluster.pointPosition = Math.abs(this.startPosition - cluster.pointPosition)
            //if(cluster.pointPosition > this.currentPosition){
            if(Math.abs(this.startPosition - cluster.pointPosition)+1 > this.currentPosition){
                console.warn("Cluster is irrevelant! skipping DFS for now..", cluster);
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
                    console.log(" -> filtered because wasn't previously reachable :", cluster);
                }
            });
        }

        // At this point, `reachableClusters` holds all clusters that are reachable
        console.warn("**************************")
        console.warn("         DFS ENDED        ")
        console.warn("**************************")
        console.log("Reachable clusters:", Array.from(reachableClusters));


        // Store the clusters in case we need to backtrack later
        this.selectedReachableClusters.push(reachableClusters);
        console.log("Cluster History updated", this.selectedReachableClusters)


        /***************  RENDERING  ***************/
        /* We can finally act on the flags now !  */
        /***************  RENDERING  ***************/
        console.warn("**************************************")
        console.warn("RENDERING REACHABLE CLUSTERS AND FLAGS")
        console.warn("**************************************")



        console.warn("****************************************")
        console.warn("Hiding Clusters in front of clicked flag")
        console.warn("****************************************")

        // Hide all clusters first, then selectively show reachable ones
        Object.values(this.layerData.objectives).forEach((cluster) => {
            //cluster.pointPosition = Math.abs(this.startPosition - cluster.pointPosition+1);
            console.log("Should we hide cluster :", cluster)
            console.log("   -> Cluster position", cluster.pointPosition)
            console.log("   -> Clicked flag position", flag.position)
            console.log("   -> Current position", this.currentPosition)
            if (Math.abs(this.startPosition - cluster.pointPosition)+1 >= this.currentPosition) {
                console.log("   -> Cluster is in front! Hiding.");
                if (!flag.clusters.some(c => c.name === cluster.objectName)) {
                    this._hideCluster(cluster, flag);
                }
            } else {
                // Ignore clusters that are behind us
                console.log("   -> Cluster behind, skipping it.");
            }
        });



        console.warn("*****************************************")
        console.warn("Showing Clusters in front of clicked flag")
        console.warn("*****************************************")


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

            console.log("Cluster to show", cluster)
            console.log("   -> cluster.pointPosition", cluster.pointPosition)
            console.log("   -> Flag position", flag.position)
            console.log("   -> Current position", this.currentPosition)
            //cluster.pointPosition = Math.abs(this.startPosition - cluster.pointPosition)
            //console.warn("cluster.pointPosition corrected", cluster.pointPosition)

            // If the cluster is in front of the clicked flag, show it
            if(Math.abs(this.startPosition - cluster.pointPosition) + 1 > this.currentPosition){
                  
                console.log("   -> Cluster in front, showing it !");

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
                console.log("   -> Cluster behind, skipping it.");
            }
        });

        console.warn("Flags next step :", nextFlags);


        // Highlight the next flags with a proper class
        nextFlags.forEach((flag) => {
            var div = flag.flag._icon;
            div.classList.add("next");
            flag.flag.options.icon.options.className = "flag flag" + flag.position + " next";
        });


        // Only one flag in front ? Click it
        if(nextFlags.length === 1 && !backward){
            //this._handleFlagClick(nextFlags[0]);
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
                // store the lowest foundsclusters pointPosition in var new pos
                newPos = foundClusters.reduce((min, item) =>
                    item.pointPosition < min ? item.pointPosition : min,
                    foundClusters[0].pointPosition
                );
            }




            flagToShow.position = newPos;
            flagToShow.show();

            //console.log("new position updated", newPos)
        });

    }

    _hideCluster(cluster, clickedFlag) {

        console.log("   -> hiding cluster", cluster)

        if (cluster.name === "Main") return;

        const flagsToHide = this.flags.filter((f) =>
            f !== clickedFlag && f.clusters.includes(cluster)
        );

        //console.log("flags to hide", flagsToHide)

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
        this.activeLayerMarkers.clearLayers()
    }

}



export class SquadObjective {

    constructor(latlng, radius, layer, position, objCluster, isMain, cluster) {

        this.name = objCluster.name;
        this.objectName = objCluster.objectName;
        this.objCluster = objCluster
        this.layerGroup = layer.activeLayerMarkers;
        this.layer = layer
        this.latlng = latlng;
        this.clusters = [];
        this.isMain = isMain;
        this.isHidden = true;
        this.position = cluster.pointPosition;

        console.log("creating flag", this.name, "at position", this.position)

        this.nameText = new Marker(latlng, {
            interactive: false,
            icon: new DivIcon({
                className: "objText",
                html: `${this.name}`,
                iconSize: [300, 20],
                iconAnchor: [150, 33]
            })
        }).addTo(this.layerGroup);


        //var position = Math.abs(this.layer.startPosition - this.position);

        this.flag = new Marker(latlng, {
            interactive: true,
            icon: new DivIcon({
                className: `flag flag${this.position}`,
                html: 99,
                iconSize: [46, 24],
                iconAnchor: [23, 12]
            })
        }).addTo(this.layerGroup);

        this.addCluster(cluster);


        this.flag.on('click', this._handleClick, this);
    }

    select(){
        console.log("Selecting flag: ", this.name)
        this.flag.removeFrom(this.layerGroup).remove();

        var position = Math.abs(this.layer.startPosition - this.position); 

        if(!this.isMain) { 
            var html = position; 
            var className = "flag selected";
        } else {
            var html= this.name;
            //var html = position; 
            var className = "flag selected main";
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

        this.isSelected = true;
        this.flag.on('click', this._handleClick, this);
    }

    unselect(){

        this.flag.removeFrom(this.layerGroup).remove();

        var html = "";
        var position = Math.abs(this.layer.startPosition - this.position); 
        var className = "flag";
        //var position = this.position;

        if(!this.isMain) { 
            html = position;
            className = className + " flag" + position;
        } else {
            html= this.name;
            //html = position;
            className = className + " main";
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
    }

    addCluster(cluster){
        //cluster.pointPosition--;
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
            //html = this.position;
            html = this.position;
        }

        if(this.isMain) { 
            //html = this.name;
            className = className + " main";
        }

        // Refresh the flag icon
        this.flag.setIcon(new DivIcon({
            className: className,
            html: html,
            iconSize: [40, 18],
            iconAnchor: [23, 12]
        }));

    }

    _handleClick(){
        this.layer._handleFlagClick(this);
    }


    hide(){
        this.nameText.removeFrom(this.layerGroup)
        this.flag.removeFrom(this.layerGroup)
        this.flag.options.interactive = false;
        this.flag.off()
        console.log("      -> Hiding flag: ", this.name)
        this.isHidden = true;
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