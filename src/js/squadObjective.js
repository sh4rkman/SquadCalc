import { DivIcon, Marker, LayerGroup, Polygon } from "leaflet";
import polygonClipping from "polygon-clipping";
import { App } from "../app.js";
import i18next from "i18next";
import "tippy.js/dist/tippy.css";
import { FactionCtxMenu } from "./squadFactionCtxMenu.js";

// Number of points used to draw a round capzone edge
const CAPZONE_ARC_SEGMENTS = 128;

// Modded factionIDs are prefixed with the mod key (e.g. "SU_RGF", "WZ_RGF"), but
// faction translations are shared with vanilla ("RGF") - strip the prefix for
// i18next lookup. Images use the full prefixed factionID as-is.
export function translationId(factionID) {
    return factionID ? factionID.replace(/^(SU|WZ)_/, "").replace(/-\d+$/, "").replace(/P[12]$/, "") : factionID;
}

export class SquadObjective {

    constructor(latlng, layer, objCluster, isMain, cluster) {
        this.name = objCluster.name;
        this.objectName = objCluster.objectName;
        this.objCluster = objCluster;
        this.cluster = cluster;
        this.layerGroup = layer.activeLayerMarkers;
        this.layer = layer;
        this.latlng = latlng;
        this.clusters = [];

        // Every candidate slot this flag occupies, by point objectName. The randomizer can
        // offer the same capture zone on several routes and at several depths. objectName is
        // unique per layer, name is not, so the solver identifies points by it.
        this.candidateIds = [];
        this.capZones = new LayerGroup();
        this.isMain = isMain;
        this.isHidden = false;
        this.position = cluster.pointPosition;
        this.isNext = false;
        this.percentage = "";

        console.debug("[LAYER] creating flag", this.name, "at position", this.position);
        let html;
        if (!this.isMain){ 
            html = this.name;
        } else {
            if (this.objectName === "00-Team1 Main") {
                html = `<span><span data-i18n="common:team1">${i18next.t("team1", { ns: "common" })}</span></span>`;
            } else {
                html = `<span><span data-i18n="common:team2">${i18next.t("team2", { ns: "common" })}</span></span>`;
            }
        }

        this.nameText = new Marker(latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: "objText",
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, 38] : [150, 32],
                shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);

        // Temporary icon to avoid 404s on leaflet shadow marker
        let tempIcon = new DivIcon({
            shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
            shadowSize: [0, 0],
        });

        this.flag = new Marker(latlng, {icon : tempIcon}).addTo(this.layerGroup);
        this.addCluster(cluster, objCluster);
        this.updateMainIcon();

        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("pointerover", this._handleMouseOver, this);
        this.flag.on("pointerout", this._handleMouseOut, this);
    }


    showPercentage() {
        this.percentageText = new Marker(this.latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: "objText",
                keyboard: false,
                html: Math.round(this.percentage) + "%",
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, -18] : [150, -12],
                shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);
    }

    update(){
        if (this.isSelected){
            this.select();
        } else {
            if (!this.isHidden) this.unselect();
        }
    }


    updateMainIcon() {
        if (!this.isMain) return;

        let dropdownSelector, fileName;

        if (this.objectName === "00-Team1 Main") {
            dropdownSelector = ".dropbtn8";
        } else {
            dropdownSelector = ".dropbtn10";
        }

        fileName = $(dropdownSelector).val();
        const isMainFallback = !fileName || !App.userSettings.enableFactions;
        const folder = isMainFallback ? "" : `${this.layer.modFolder}/`;
        if (isMainFallback) {
            fileName = App.userSettings.circlesFlags ? "main_circle" : "main";
        } else if (App.userSettings.circlesFlags) {
            fileName = `circles/${fileName}`;
        }
        this.flag.getElement().style.backgroundImage = `url('/img/flags/${folder}${fileName}.webp')`;
    }


    select(){
        let html = "";
        let className = "flag selected";
        this.isNext = false;
        this.flag.removeFrom(this.layerGroup).remove();

        if (App.userSettings.circlesFlags) className += " circleFlag";
    
        if (this.isMain) {
            className += " main";
        } else {
            const positions = this.solverSteps();
            html = positions.length > 1 ? positions.join("·") : (positions[0] ?? "");
            if (positions.length > 1) className += positions.length > 2 ? " multiPos multiPosMany" : " multiPos";
        }

        this.updateMarker(className, html);

        this.isSelected = true;
        this.flag.on("click", this._handleClick, this);
        this.flag.on("contextmenu", this._handleContextMenu, this);
        this.flag.on("dblclick", this._handleDoubleClick, this);
        this.flag.on("pointerover", this._handleMouseOver, this);
        this.flag.on("pointerout", this._handleMouseOut, this);
    }


    updateMarker(className, html){
        let nameTextClassName = "objText";

        this.flag = new Marker(this.latlng, {
            interactive: true,
            keyboard: false,
            icon: new DivIcon({
                className: className,
                html: html,
                iconSize: [44, 22],
                iconAnchor: [22, 11]
            })
        }).addTo(this.layerGroup);

        if (!this.isMain){ 
            html = this.name;
        } else {

            nameTextClassName += " main";

            if (process.env.DISABLE_FACTIONS != "true" && App.userSettings.enableFactions) {

                if (this.objectName === "00-Team1 Main") {
                    html = `<span><span data-i18n="common:team1">${i18next.t("team1", { ns: "common" })}</span>`;
                    if ($(".dropbtn8").val() != null) html += ` : <span data-i18n="factions:${translationId($(".dropbtn8").val())}">${i18next.t(translationId($(".dropbtn8").val()), { ns: "factions" })}</span>`;
                } else {
                    html = `<span><span data-i18n="common:team2">${i18next.t("team2", { ns: "common" })}</span>`;
                    if ($(".dropbtn10").val() != null) html += ` : <span data-i18n="factions:${translationId($(".dropbtn10").val())}">${i18next.t(translationId($(".dropbtn10").val()), { ns: "factions" })}</span>`;
                }
                html += "</span>";

            } else {
                if (this.objectName === "00-Team1 Main") html = `<span data-i18n="common:team1">${i18next.t("team1", { ns: "common" })}</span>`;
                else html = `<span data-i18n="common:team2">${i18next.t("team2", { ns: "common" })}</span>`;
            }
        }

        this.nameText.removeFrom(this.layerGroup).remove();
        if (this.percentageText) this.percentageText.removeFrom(this.layerGroup).remove();
        this.nameText = new Marker(this.latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: nameTextClassName,
                keyboard: false,
                html: html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, 38] : [150, 32],
                shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);

        this.updateMainIcon();

    }


    /**
     * Rotate a point around a center
     * @param {Array} point - [lat, lng] to rotate
     * @param {number} angle - The angle in degrees
     * @param {Array} center - [lat, lng] center of rotation
     * @returns {Array} The rotated [lat, lng]
     */
    _rotatePoint([lat, lng], angle, [centerLat, centerLng]) {
        const radians = (Math.PI / 180) * angle;
        const latDiff = lat - centerLat;
        const lngDiff = lng - centerLng;
        return [
            centerLat + (latDiff * Math.cos(radians) - lngDiff * Math.sin(radians)),
            centerLng + (latDiff * Math.sin(radians) + lngDiff * Math.cos(radians))
        ];
    }


    /**
     * Turn a circle into a polygon so it can be merged with the other shapes
     * @param {Array} center - [lat, lng] center of the circle
     * @param {number} radius - Radius in map units
     * @returns {Array} A ring of [lat, lng]
     */
    _circleRing([lat, lng], radius) {
        const r = Math.abs(radius);
        const ring = [];
        for (let i = 0; i < CAPZONE_ARC_SEGMENTS; i++) {
            const angle = (i / CAPZONE_ARC_SEGMENTS) * 2 * Math.PI;
            ring.push([lat + r * Math.sin(angle), lng + r * Math.cos(angle)]);
        }
        return ring;
    }


    /**
     * Build the outlines of one capzone shape
     * @param {object} cap - One entry of objective.objects
     * @returns {Array} Array of rings, each an array of [lat, lng]
     */
    _capShapeRings(cap) {
        const SCALE = this.layer.map.gameToMapScale;

        // Capzone location whatever shape it has
        const location_x = -(cap.location_x - this.layer.offset_x) / 100 * -SCALE;
        const location_y = (cap.location_y - this.layer.offset_y) / 100 * -SCALE;

        // Capzone is a Sphere
        if (cap.isSphere) {
            return [this._circleRing([location_y, location_x], cap.sphereRadius / 100 * SCALE)];
        }

        // Capzone is a Rectangle/Capsule
        if (!cap.isBox && !cap.isCapsule) return [];

        let rectangleRadiusX;
        let rectangleRadiusY;
        let totalRotation = cap.boxExtent.rotation_z;

        // If object is on his side (often the case for capsules) take x/y/z in account
        // Sometime it can be -89.98 or 90.04 so we need to take a range
        if (Math.abs(cap.boxExtent.rotation_y) > 89 && Math.abs(cap.boxExtent.rotation_y) < 91) {
            if (cap.boxExtent.rotation_y > 0) {
                totalRotation -= cap.boxExtent.rotation_x + cap.boxExtent.rotation_y;
            } else {
                totalRotation += cap.boxExtent.rotation_x + cap.boxExtent.rotation_y;
            }
        }

        // Cap radiis
        if (cap.isBox) {
            rectangleRadiusX = (cap.boxExtent.extent_x / 100) * cap.boxExtent.scaling_x * -SCALE;
            rectangleRadiusY = (cap.boxExtent.extent_y / 100) * cap.boxExtent.scaling_y * -SCALE;
        }
        else {
            rectangleRadiusX = cap.capsuleRadius / 100 * -SCALE;
            rectangleRadiusY = (cap.capsuleLength - cap.capsuleRadius) / 100 * -SCALE;
        }

        const center = [location_y, location_x];
        const lat1 = location_y + rectangleRadiusY;
        const lat2 = location_y - rectangleRadiusY;
        const lng1 = location_x + rectangleRadiusX;
        const lng2 = location_x - rectangleRadiusX;
        const rings = [];

        // A capsule as long as it is wide has no rectangle, only the two circles
        if (rectangleRadiusX !== 0 && rectangleRadiusY !== 0) {
            rings.push(
                [[lat1, lng1], [lat1, lng2], [lat2, lng2], [lat2, lng1]]
                    .map(corner => this._rotatePoint(corner, totalRotation, center))
            );
        }

        // Capsules also get a circle on each end of the rectangle
        if (cap.isCapsule) {
            const capsuleRadius = cap.capsuleRadius / 100 * SCALE;
            // Only rotate the circles if the capsule is not vertical
            const rotation = cap.capsuleLength != cap.capsuleRadius ? totalRotation : 0;

            [lat1, lat2].forEach(lat => {
                const [rotatedLat, rotatedLng] = this._rotatePoint([lat, location_x], rotation, center);
                rings.push(this._circleRing([rotatedLat, rotatedLng], capsuleRadius));
            });
        }

        return rings;
    }


    /**
     * Merge every capzone shape of this objective into a single outline
     * @param {Array} caps - The objective.objects array
     */
    createCapZones(caps) {
        const CZOPACITY = 0;
        const CZFILLOPACITY = 0;
        const CZCOLOR = "rgb(255, 255, 255)";
        const CZWEIGHT = 2;

        const CZOPTIONS = {
            color: CZCOLOR,
            opacity: CZOPACITY,
            fillColor: CZCOLOR,
            fillOpacity: CZFILLOPACITY,
            weight: CZWEIGHT,
            // Keep every point, Leaflet's default simplification makes the curves jagged
            smoothFactor: 0,
            className: "capZone"
        };

        const rings = caps.flatMap(cap => this._capShapeRings(cap));
        if (rings.length === 0) return;

        let geometry;

        if (rings.length === 1) {
            geometry = [rings[0]];
        } else {
            try {
                // polygon-clipping repeats the first point at the end, Leaflet does not want it
                geometry = polygonClipping.union(...rings.map(ring => [ring]))
                    .map(polygon => polygon.map(ring => ring.slice(0, -1)));
                if (geometry.length === 0) throw new Error("empty union");
            } catch (error) {
                // If the merge fails, draw the shapes separately like before
                console.warn("[LAYER] capzone union failed, drawing shapes separately", error);
                geometry = rings.map(ring => [ring]);
            }
        }

        const capZone = new Polygon(geometry, {...CZOPTIONS}).addTo(this.layer.activeLayerMarkers);
        this.capZones.addLayer(capZone);
    }


    unselect(){
        let html = "";
        let className = "flag";
        const positions = this.layer.isRandomized ? this.solverSteps() : [];

        if (App.userSettings.circlesFlags) className += " circleFlag";

        if (this.isMain) {
            className += this.layer.isRandomized ? " main selectable" : " main unselectable";
        } else {
            if (this.layer.isRandomized && positions.length){
                html = positions.length > 1 ? positions.join("·") : positions[0];
                className += " flag" + positions[0];
                if (positions.length > 1) className += positions.length > 2 ? " multiPos multiPosMany" : " multiPos";
            }
        }

        // "Next" is the shallowest depth still unconfirmed.
        if (this.layer.isRandomized && positions.includes(this.layer.nextStep)){
            className += " next";
            this.isNext = true;
        } else this.isNext = false;

        this.flag.removeFrom(this.layerGroup).remove();
        this.updateMarker(className, html);

        this.isSelected = false;

        if (this.layer.isRandomized){
            this.flag.on("click", this._handleClick, this);
            this.flag.on("contextmenu", this._handleContextMenu, this);
            this.flag.on("dblclick", this._handleDoubleClick, this);
            this.flag.on("pointerover", this._handleMouseOver, this);
            this.flag.on("pointerout", this._handleMouseOut, this);
        }
    }

    
    /**
     * Attach one more cluster (lane slot) that offers this same physical point.
     * @param {object} cluster - the capture-zone cluster
     * @param {object} [point] - the candidate inside that cluster. Its objectName identifies the slot.
     */
    addCluster(cluster, point){
        this.clusters.push(cluster);
        if (point?.objectName && !this.candidateIds.includes(point.objectName)) {
            this.candidateIds.push(point.objectName);
        }
        this.updatePosition();
    }


    /**
     * This flag's state in the layer's latest solve.
     * @returns {{steps: number[], probability: number}} depths where it is still possible
     *          (1 = first point after the main), and the chance it is on the route
     */
    solverInfo(){
        const result = this.layer.solverResult;
        const steps = new Set();
        let probability = 0;

        if (result) {
            this.candidateIds.forEach((id) => {
                const entry = result.byId.get(id);
                if (!entry) return;
                entry.steps.forEach((step) => steps.add(step));
                probability += entry.probability;
            });
        }

        return { steps: [...steps].sort((a, b) => a - b), probability };
    }


    /**
     * Depths where this flag is still possible.
     * @returns {number[]}
     */
    solverSteps(){
        return this.solverInfo().steps;
    }


    /**
     * Repaint this flag from the layer's latest solve: hidden when no longer possible,
     * selected when confirmed, otherwise numbered with its remaining depths.
     * @param {boolean} preview - hover preview, so fade instead of rebuilding
     */
    applySolverResult(preview = false){

        if (this.isMain) {
            // Mains carry no candidates. They only show which side the depths count from.
            if (preview) return;
            if (this === this.layer.perspectiveMain) this.select();
            else this.unselect();
            return;
        }

        const { steps, probability } = this.solverInfo();

        if (preview) {
            if (steps.length) { if (this.isFadeOut) this._fadeIn(); }
            else this._fadeOut();
            return;
        }

        if (!steps.length) {
            if (!this.isHidden) this.hide();
            return;
        }

        if (this.isHidden) this.show();

        if (this.layer.selectedFlags.includes(this)) {
            this.select();
            return;
        }

        this.unselect();

        // Shown for every still-possible point, not only the next one. A point that has
        // become certain shows 100%.
        if (App.userSettings.showNextFlagsPercentages) {
            this.percentage = probability * 100;
            this.showPercentage();
        }
    }


    /**
     * Refresh this flag's icon. The depth label comes from the solver, which does not
     * exist yet during construction, so the flag starts unnumbered and the layer paints
     * it after init().
     */
    updatePosition() {

        let className = "flag";
        let html = "";
        const positions = this.layer.isRandomized ? this.solverSteps() : [];

        // Shallowest remaining depth, or the raw cluster data before the first solve.
        // Only used for the colour class.
        this.position = positions[0] ?? this.clusters.reduce(
            (min, item) => (item.pointPosition != null && item.pointPosition < min ? item.pointPosition : min),
            Infinity
        );
        if (!Number.isFinite(this.position)) this.position = 0;

        if (App.userSettings.circlesFlags){
            className += " circleFlag";
        }

        if (this.isMain) {
            className += this.layer.isRandomized ? " main selectable" : " main unselectable";
        } else if (this.layer.isRandomized && positions.length) {
            className += " flag" + positions[0];
            html = positions.length > 1 ? positions.join("·") : positions[0];
            if (positions.length > 1) className += positions.length > 2 ? " multiPos multiPosMany" : " multiPos";
        }

        // Refresh the flag icon
        this.flag.setIcon(new DivIcon({
            className: className,
            html: html,
            iconSize: [44, 22],
            iconAnchor: [22, 11]
        }));
    }


    _handleClick(){
        clearTimeout(this.mouseOverTimeout);
        if (!this.layer.isRandomized) return;
        this.layer._handleFlagClick(this);
    }

    
    _handleDoubleClick(){
        return false;
    }

    
    _handleContextMenu(e){
        
        if (this.isMain && App.userSettings.enableFactions && process.env.DISABLE_FACTIONS != "true") {
            this.ctxMenu = new FactionCtxMenu(this.layer, this.objCluster.objectDisplayName).open(e);
            return;
        }

        if (this.layer.isRandomized && this.isSelected) this.layer._handleFlagClick(this);
    }

    _handleMouseOver() {

        // On RAAS/Invasion, preview the lane on hover
        if (this.layer.isRandomized) {
            // In ordered mode only the next point can be clicked, so preview only that one.
            const clickable = App.userSettings.freePointSelection || this.isNext;
            if (clickable && !this.isSelected && !this.isHidden && App.userSettings.revealLayerOnHover) {
                this.mouseOverTimeout = setTimeout(() => {
                    this.layer._renderFromSolver(this);
                }, 250);
            }
        }

        // If the user has the capzones on hover setting enabled, show them
        if (App.userSettings.capZoneOnHover) {
            if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
                this.revealCapZones();
            }
        }

    }

    _handleMouseOut(){
        // Cancel the timeout if the user moves the mouse out before 1 second
        clearTimeout(this.mouseOverTimeout);

        if (App.userSettings.capZoneOnHover) this.hideCapZones();

        this.layer.flags.forEach((flag) => {
            if (flag.isHidden) return;
            flag._fadeIn();
            flag.isFadeOut = false;
            if (!App.userSettings.capZoneOnHover) {
                if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
                    flag.revealCapZones();
                }
            }
        });

    }


    revealCapZones(){
        this.capZones.eachLayer((cap) => {
            cap.setStyle({ opacity: 1, fillOpacity: 0.3 });
        });
    }


    hideCapZones(){
        this.capZones.eachLayer((cap) => {
            cap.setStyle({ opacity: 0, fillOpacity: 0 });
        });
    }


    hide(){
        this.nameText.removeFrom(this.layerGroup);
        this.percentageText?.removeFrom(this.layerGroup).remove();
        this.flag.removeFrom(this.layerGroup);
        this.flag.options.interactive = false;
        this.flag.off();
        this.hideCapZones();
        this.isHidden = true;
    }

    _setOpacity(value){
        this.flag.setOpacity(value);
        this.nameText.setOpacity(value);
        this.percentageText?.setOpacity(value);

        // if opacity = 0, this.flag can't be clicked
        // css cursor is set to default on hover
        if (value === 0){
            $(".flag").css("pointer-events", "none");
        } else {
            $(".flag").css("pointer-events", "all");
        }
    }


    _fadeIn(){
        this.flag.setOpacity(1);
        this.nameText.setOpacity(1);
        this.percentageText?.setOpacity(1);
        this.isFadeOut = false;
    }

    _fadeOut(){
        this.flag.setOpacity(0.15);
        this.nameText.setOpacity(0.15);
        this.percentageText?.setOpacity(0.15);
        this.isFadeOut = true;
    }

    delete(){
        this.nameText.removeFrom(this.layerGroup).remove();
        this.percentageText?.removeFrom(this.layerGroup).remove();
        this.flag.removeFrom(this.layerGroup).remove();
    }

    show(){
        this.nameText.setOpacity(1).addTo(this.layerGroup);
        this.flag.setOpacity(1).addTo(this.layerGroup);
        this.unselect();
        this.isHidden = false;

        if (App.userSettings.capZoneOnHover) return;
        
        if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
            this.revealCapZones();
        }
        
    }
}