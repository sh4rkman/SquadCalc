
import { DivIcon, Marker, Circle, LayerGroup, Polyline, Rectangle } from "leaflet";


/**
 * DISCLAIMER: This code is an abomination that should never be read by another human being.
 * It will be reworked.
 *
 * One day
 */


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
                var newFlag = new SquadObjective(latlng, radius, this, "" , obj);
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
        console.warn("**************************")
        console.warn("      NEW CLICKED FLAG    ")
        console.warn("**************************")
        console.log("Current position", this.currentPosition)
        console.log("Selected Flag:", flag);
        console.log("Clicked flag position", flag.position)
        console.log("Cluster History", this.selectedReachableClusters)



        if(flag.position > this.currentPosition) return; // flag is too far to be reached for now

        // Going backward
        if(flag.position <= this.currentPosition-1){

            backward = true;

            var positionToReduce = Math.abs(this.currentPosition - flag.position);

            console.error("# of Going backward : ", positionToReduce)
            if(flag === this.selectedFlags[0]) {positionToReduce--}
            // Unselecting the same flag
            // Mains can't be unselected
            if(positionToReduce === 0) {
                console.error("Unselecting the same flag")
                if(flag != this.selectedFlags[0]) {positionToReduce++;}
            }
            this.selectedReachableClusters.pop();
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




        // Set to track clusters that can be reached from the clicked flag
        const reachableClusters = new Set();

        // DFS function to explore connections recursively
        const dfs = (clusterName) => {
            if (reachableClusters.has(clusterName)) return;  // If already visited, skip
            reachableClusters.add(clusterName); // Mark this cluster as reachable

            // Sometimes links are stored in clusters, sometimes in lanes
            const links = this.layerData.capturePoints.lanes.links || this.layerData.capturePoints.clusters.links;

            // Traverse each link to find connected clusters
            links.forEach((link) => {
                if (link.nodeA === clusterName && !reachableClusters.has(link.nodeB)) {
                    dfs(link.nodeB);  // Traverse from nodeA to nodeB
                }
            });
        };

        // Start DFS from each cluster associated with the clicked flag
        flag.clusters.forEach((cluster) => {

            // Ignore clusters that are in front of the clicked for now
            if(cluster.pointPosition > this.currentPosition){
                console.warn("Cluster is irrevelant! skipping..", cluster);
                return;
            }

            console.log("Starting DFS from cluster", cluster.name);
            console.log("Cluster point position", cluster.pointPosition);
            console.log("Current position", this.currentPosition);

            // If the clicked flag is a main flag, use the objectDisplayName instead
            if(cluster.name === "Main"){
                dfs(cluster.objectDisplayName);
                return;
            }

            dfs(cluster.name);
        });



        // Remove clusters that are not reachable from the previous flag
        if(this.selectedReachableClusters.length > 0){
            Array.from(reachableClusters).forEach((cluster) => {
                if(!this.selectedReachableClusters.at(-1).has(cluster)){
                    reachableClusters.delete(cluster);
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

            if (cluster.pointPosition >= flag.position + 1) {
                //console.log("Cluster is in front", cluster);
                if (!flag.clusters.some(c => c.name === cluster.objectName)) {
                    this._hideCluster(cluster, flag);
                }
            } else {
                // Ignore clusters that are behind us
                //console.warn("Cluster is behind", cluster);
            }
        });



        console.warn("****************************************")
        console.warn("Showing Clusters in front of clicked flag")
        console.warn("****************************************")

        var nbNextFlags = [];

        // Show reachable clusters
        reachableClusters.forEach((clusterName) => {
            // Attempt to retrieve the cluster directly by name
            let cluster = this.layerData.objectives[clusterName];

            // If the cluster is not found directly, search for a matching displayName
            if (!cluster) {
                cluster = Object.values(this.layerData.objectives).find(
                    (obj) => obj.objectDisplayName === clusterName
                );
            }

            if(cluster.pointPosition > flag.position+1){
                if (cluster) {

                    this._showCluster(cluster);

                    // If cluster is directly in front of the clicked flag, count the next flags
                    if(cluster.pointPosition === this.currentPosition+1){
                        const nextFlags = this.flags.filter((f) => f.clusters.includes(cluster));
                        nextFlags.forEach((flag) => {
                            // Only add if not already in the list
                            if (!nbNextFlags.includes(flag)) {
                                nbNextFlags.push(flag);
                            }
                        });
                    }
                    
                }
            }
            else {
                console.log("Cluster is behind, skipping..", cluster);
            }
        });

        console.warn("Flags next step :", nbNextFlags)

        // Only one flag in front ? Click it
        if(nbNextFlags.length === 1 && !backward){
            this._handleFlagClick(nbNextFlags[0]);
        }


    }

    _resetLayer() {
        this.currentPosition = 0;
        this.flags.forEach((flag) => {
            flag.show();
            flag.unselect();
        });
    }

    _showCluster(cluster) {
        console.log("showing cluster", cluster)
        if (cluster.name === "Main") return;


        const flagsToShow = this.flags.filter((f) =>
            f.clusters.includes(cluster)
        );


        flagsToShow.forEach((flagToShow) => {
            //if(flagToShow.isHidden) {return}
            //flagToShow.updatePosition(cluster.pointPosition-1);
            console.log("showing flag", flagToShow)

            //console.log(`adding cluster ${cluster.name} to flag ${flagToShow.name}`)
            //flagToShow.addCluster(cluster);

            const foundClusters = [];

            flagToShow.clusters.forEach((cluster) => {
                // check if cluster is found in the selectedReachableClusters last entry
                // create an array that hold the cluster founds in the selectedReachableClusters last entry
                if(this.selectedReachableClusters.at(-1).has(cluster.name)){
                    foundClusters.push(cluster);
                }
            });

            console.log("found available clusters", foundClusters)

            // store the lowest foundsclusters pointPosition in var new pos
            const newPos = foundClusters.reduce((min, item) =>
                item.pointPosition < min ? item.pointPosition : min,
                foundClusters[0].pointPosition
            ) -1;

            console.log("new position to update", newPos)
            flagToShow.position = newPos;
            flagToShow.show();

        });

    }

    _hideCluster(cluster, clickedFlag) {

        console.log("hiding cluster", cluster)

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
        //this.name = this.name + " (" + cluster.name.substring(0, 2) + ")";
        this.objCluster = objCluster
        this.layerGroup = layer.activeLayerMarkers;
        this.layer = layer
        this.latlng = latlng;
        this.clusters = [];
        this.isMain = isMain;
        this.isHidden = true;
        this.position = cluster.pointPosition;




        this.nameText = new Marker(latlng, {
            interactive: false,
            icon: new DivIcon({
                className: "objText",
                html: `${this.name}`,
                iconSize: [300, 20],
                iconAnchor: [150, 30]
            })
        }).addTo(this.layerGroup);

        this.flag = new Marker(latlng, {
            interactive: true,
            icon: new DivIcon({
                className: `flag flag${this.position}`,
                html: this.position-1,
                iconSize: [42, 20],
                iconAnchor: [21, 10]
            })
        }).addTo(this.layerGroup);

        this.addCluster(cluster);


        this.flag.on('click', this._handleClick, this);
    }

    select(){

        this.flag.removeFrom(this.layerGroup).remove();
        this.flag = new Marker(this.latlng, {
            interactive: true,
            icon: new DivIcon({
                className: `flag selected`,
                html: this.position,
                iconSize: [42, 20],
                iconAnchor: [21, 10]
            })
        }).addTo(this.layerGroup);
        this.isSelected = true;
        this.flag.on('click', this._handleClick, this);
    }

    unselect(){
        this.flag.removeFrom(this.layerGroup).remove();
        this.flag = new Marker(this.latlng, {
            interactive: true,
            icon: new DivIcon({
                className: `flag flag${this.position}`,
                html: this.position,
                iconSize: [42, 20],
                iconAnchor: [21, 10]
            })
        }).addTo(this.layerGroup);
        this.isSelected = false;
        this.flag.on('click', this._handleClick, this);
    }

    addCluster(cluster){
        this.clusters.push(cluster);
        this.updatePosition();
    }


    updatePosition() {

        const lowestPointPosition = this.clusters.reduce((min, item) =>
            item.pointPosition < min ? item.pointPosition : min,
            this.clusters[0].pointPosition
        );

        this.position = lowestPointPosition - 1;

        this.flag.setIcon(new DivIcon({
            className: `flag flag${this.position}`,
            html: this.position,
            iconSize: [42, 20],
            iconAnchor: [21, 10]
        }));

    }

    _handleClick(){
        console.log(`Flag marker clicked: ${this.name}`);
        console.warn(this)
        this.layer._handleFlagClick(this);
    }


    hide(){
        this.nameText.setOpacity(0.8).removeFrom(this.layerGroup)
        this.flag.setOpacity(0.2).removeFrom(this.layerGroup)
        this.flag.options.interactive = false;
        this.flag.off()
        console.log("Hiding flag: ", this.name)
        this.isHidden = true;
    }

    delete(){
        this.nameText.removeFrom(this.layerGroup).remove();
        this.flag.removeFrom(this.layerGroup).remove();
    }

    show(){
        // console.warn("showing flag", this.name)

        // if(pointPosition) {
        //     this.position = pointPosition-1;
        //     console.warn("his cluster position", pointPosition)
        // }


        this.nameText.setOpacity(1).addTo(this.layerGroup);
        this.flag.setOpacity(1).addTo(this.layerGroup);
        this.unselect();
        this.isHidden = false;

        // when showing a flag

        this.flag.on('click', this._handleClick, this);

        this.flag.options.interactive = true;
    }

    /**
     * xxxx
     * @return {number} - xxxx
     */
    clear(){
        this.layerGroup.clearLayers()
    }

}