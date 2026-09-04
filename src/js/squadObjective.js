import { DivIcon, Marker, Circle, LayerGroup, Rectangle } from "leaflet";
import { App } from "../app.js";
import i18next from "i18next";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import { FactionCtxMenu } from "./squadFactionCtxMenu.js";
import SquadLaneSolver from "./squadLaneSolver.js";

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
        const html = Math.round(this.percentage) + "%";

        this.percentageText = new Marker(this.latlng, {
            interactive: false,
            keyboard: false,
            icon: new DivIcon({
                className: "objText",
                keyboard: false,
                html,
                iconSize: [300, 20],
                iconAnchor: App.userSettings.circlesFlags ? [150, -18] : [150, -12],
                shadowUrl: "../img/icons/markers/weapons/marker_shadow.webp",
                shadowSize: [0, 0],
            })
        }).addTo(this.layerGroup);
    }


    /**
     * Per-depth breakdown tooltip on the flag icon, for every objective that has
     * a solved percentage (even a single-depth one, to spell out its one step).
     */
    _showPercentageTooltip() {
        if (!this.percentageBreakdown?.length) return;

        const el = this.flag.getElement();
        // Don't clobber a tippy owned by something else on this element (e.g. the
        // faction context menu on a main flag).
        if (!el || (el._tippy && el._tippy !== this.percentageTippy)) return;
        if (el._tippy) el._tippy.destroy();

        // Each row's own lanes (not the flag's overall set) - a flag's steps can come
        // from different lanes, so the badges must match the step they're next to.
        const rows = this.percentageBreakdown
            .map(({ step, value, lanes }) => {
                const badges = lanes
                    .map((l) => `<span style="background-color:${this.layer.getLaneColor(SquadLaneSolver.laneLabel(l), l)}">${SquadLaneSolver.laneLabel(l)}</span>`)
                    .join("");
                return `
                    <div class="laneTooltipStep">
                        <span class="laneTooltipStepLanes">${badges}</span>
                        <span class="laneTooltipStepLead">${i18next.t("positionStep", { ns: "tooltips", step })}</span>
                        <span class="laneTooltipStepValue">${Math.round(value)}%</span>
                    </div>`;
            })
            .join("");

        const html = `
            <div class="laneTooltipCard">
                <div class="laneTooltipTitle">
                    <span class="laneTooltipName" title="${this.name}">${this.name}</span>
                    <span class="laneTooltipTotal">${Math.round(this.percentage)}%</span>
                </div>
                <div class="laneTooltipBody">${rows}</div>
            </div>
        `;

        this.percentageTippy = tippy(el, {
            content: html,
            allowHTML: true,
            placement: "top",
            popperOptions: {
                modifiers: [{ name: "flip", options: { fallbackPlacements: ["bottom"] } }],
            },
            theme: "laneInfo",
            animation: "fade",
            delay: [200, 0],
        });
        this.percentageTippy.show();
    }

    _hidePercentageTooltip() {
        const el = this.flag.getElement();
        if (el?._tippy && el._tippy === this.percentageTippy) el._tippy.destroy();
        this.percentageTippy = null;
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


    createCapZone(cap){
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
            className: "capZone"
        };


        // Capzone location whatever shape it has
        let location_x = -(cap.location_x - this.layer.offset_x) / 100 * -this.layer.map.gameToMapScale;
        let location_y = (cap.location_y - this.layer.offset_y) / 100 * -this.layer.map.gameToMapScale;

        // Capzone is a Sphere
        if (cap.isSphere) {
            let latlng = [location_y , location_x];
            let radius = cap.sphereRadius / 100 * this.layer.map.gameToMapScale;
            let capZone = new Circle(latlng, {
                radius: radius,
                ...CZOPTIONS,
            }).addTo(this.layer.activeLayerMarkers);
            this.capZones.addLayer(capZone);
            return;
        }

        // Capzone is a Rectangle/Capsule
        if (cap.isBox || cap.isCapsule) {
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
                rectangleRadiusX = (cap.boxExtent.extent_x / 100) * cap.boxExtent.scaling_x * -this.layer.map.gameToMapScale;
                rectangleRadiusY = (cap.boxExtent.extent_y / 100) * cap.boxExtent.scaling_y * -this.layer.map.gameToMapScale;
            }
            else if (cap.isCapsule) {
                rectangleRadiusX = cap.capsuleRadius / 100 * -this.layer.map.gameToMapScale;
                rectangleRadiusY = (cap.capsuleLength - cap.capsuleRadius) / 100 * -this.layer.map.gameToMapScale;
            }

            // Cap Zone bounds
            let capNWCorner = [(location_y + rectangleRadiusY) , (location_x + rectangleRadiusX)];
            let capSECorner = [(location_y - rectangleRadiusY), (location_x - rectangleRadiusX)];
            let capBounds = [capNWCorner, capSECorner];

            let capZone = new Rectangle(capBounds, {...CZOPTIONS}).addTo(this.layer.activeLayerMarkers);
            this.capZones.addLayer(capZone);
        
            // For capsules we'll need to create 2 circles aswell
            if (cap.isCapsule) {
                let latSphere1 = (capZone.getBounds().getNorthEast().lat + capZone.getBounds().getNorthWest().lat ) / 2;
                let lngSphere1 = (capZone.getBounds().getNorthEast().lng + capZone.getBounds().getNorthWest().lng ) / 2;
                let latlng1 = { lat: latSphere1, lng: lngSphere1 };

                let latSphere2 = (capZone.getBounds().getSouthEast().lat + capZone.getBounds().getSouthWest().lat ) / 2;
                let lngSphere2 = (capZone.getBounds().getSouthEast().lng + capZone.getBounds().getSouthWest().lng ) / 2;
                let latlng2 = { lat: latSphere2, lng: lngSphere2 };

                let circle1 = new Circle(latlng1, {
                    radius: cap.capsuleRadius / 100 * this.layer.map.gameToMapScale,
                    ...CZOPTIONS,
                }).addTo(this.layer.activeLayerMarkers);
                this.capZones.addLayer(circle1);

                let circle2 = new Circle(latlng2, {
                    radius: cap.capsuleRadius / 100 * this.layer.map.gameToMapScale,
                    ...CZOPTIONS,
                }).addTo(this.layer.activeLayerMarkers);
                this.capZones.addLayer(circle2);

                // Only rotate the circles if the capsule is not vertical
                if (cap.capsuleLength != cap.capsuleRadius) {
                    this.layer.rotateCircle(circle1, totalRotation, capZone.getCenter());
                    this.layer.rotateCircle(circle2, totalRotation, capZone.getCenter());
                }
            }

            this.layer.rotateRectangle(capZone, totalRotation);
            this.capZones.addLayer(capZone);
        }

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

        // Free point selection lets any still-possible flag be clicked, not only
        // the next one - matches _confirmationFor()'s own eligibility check.
        if (!this.isMain && positions.length && !this.isNext && App.userSettings.freePointSelection) {
            className += " clickable";
        }

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
     * @returns {{steps: number[], probability: number, byStep: Map<number, number>}} depths
     *          where it is still possible (1 = first point after the main), the chance it is
     *          on the route overall, and that same chance broken down per depth
     */
    solverInfo(){
        const result = this.layer.solverResult;
        const steps = new Set();
        const byStep = new Map();
        const lanes = new Set();
        const lanesByStep = new Map();
        let probability = 0;

        if (result) {
            this.candidateIds.forEach((id) => {
                const entry = result.byId.get(id);
                if (!entry) return;
                entry.steps.forEach((step) => steps.add(step));
                probability += entry.probability;
                entry.byStep.forEach((share, step) => byStep.set(step, (byStep.get(step) || 0) + share));
                entry.lanes.forEach((lane) => lanes.add(lane));
                entry.lanesByStep.forEach((stepLanes, step) => {
                    if (!lanesByStep.has(step)) lanesByStep.set(step, new Set());
                    stepLanes.forEach((lane) => lanesByStep.get(step).add(lane));
                });
            });
        }

        return {
            steps: [...steps].sort((a, b) => a - b),
            probability,
            byStep,
            lanes: [...lanes].sort((a, b) => a - b),
            lanesByStep,
        };
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

        const { steps, probability, byStep, lanes, lanesByStep } = this.solverInfo();

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

        // Computed for every still-possible point, not only the next one, regardless of
        // the setting below - the tooltip (hover) always needs it, the on-map label doesn't.
        this.percentage = probability * 100;
        this.percentageBreakdown = [...byStep.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([step, share]) => ({ step, value: share * 100, lanes: [...(lanesByStep.get(step) ?? [])].sort((a, b) => a - b) }));
        this.lanes = lanes;

        if (App.userSettings.showNextFlagsPercentages) {
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
        clearTimeout(this.percentageHoverTimeout);
        this._hidePercentageTooltip();
        this.layer.hideLanes();
        if (!this.layer.isRandomized) return;
        this.layer._handleFlagClick(this);
    }

    
    _handleDoubleClick(){
        return false;
    }

    
    _handleContextMenu(e){

        clearTimeout(this.mouseOverTimeout);
        clearTimeout(this.percentageHoverTimeout);
        this._hidePercentageTooltip();
        this.layer.hideLanes();

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
                }, 500);
            }
        }

        // If the user has the capzones on hover setting enabled, show them
        if (App.userSettings.capZoneOnHover) {
            if (this.layer.map.getZoom() > this.layer.map.detailedZoomThreshold){
                this.revealCapZones();
            }
        }

        this.percentageHoverTimeout = setTimeout(() => {
            this.nameText.setOpacity(0);
            this.percentageText?.setOpacity(0);
            this._showPercentageTooltip();
            if (!this.isMain) this.layer.showLanes(this.solverInfo().lanes);
        }, 500);

    }

    _handleMouseOut(){
        // Cancel the timeout if the user moves the mouse out before 1 second
        clearTimeout(this.mouseOverTimeout);
        clearTimeout(this.percentageHoverTimeout);

        const opacity = this.isFadeOut ? 0.15 : 1;
        this.nameText.setOpacity(opacity);
        this.percentageText?.setOpacity(opacity);

        this._hidePercentageTooltip();

        this.layer.hideLanes();

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