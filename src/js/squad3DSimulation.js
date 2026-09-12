import * as THREE from "three";
import { decode } from "fast-png";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Sky } from "three/addons/objects/Sky.js";

// Default vertices per side of the terrain grid, sampled from the full-resolution
// heightmap - user-adjustable via the resolution selector (see _setResolution()).
const DEFAULT_GRID_RESOLUTION = 2048;

// World units are meters (terrainSize comes from the map's real-world size), so this
// is the fly speed in meters/second.
const MAX_MOVE_SPEED = 500;

// Default sun position (degrees) - fixed for now, no time-of-day control yet.
const SUN_ELEVATION = 35;
const SUN_AZIMUTH = 130;

// Meters flag labels/paths float above the ground, so they read as clearly above the
// terrain (and any capzone volumes) rather than skimming it.
const GROUND_CLEARANCE = 8;

// Vertical size of a flag name label sprite (see _createLabelSprite()) - shared with
// _drawFlagPath() so the path can be kept clear of the label's own bounding box.
const LABEL_WORLD_HEIGHT = 12;

// Flag-path pipe radius (5m diameter) - see _drawFlagPath().
const PATH_RADIUS = 2.5;

// Movement bindings by event.code (physical key position), not event.key (the
// character it produces) - so AZERTY (ZQSD) and QWERTY (WASD) both work: AZERTY's W/A
// keys sit where QWERTY has Z/Q, but they still report codes "KeyW"/"KeyA" since
// event.code names the physical key, not what the layout prints on it.
const KEY_BINDINGS = {
    KeyW: "forward",
    KeyZ: "forward",
    ArrowUp: "forward",
    KeyS: "back",
    ArrowDown: "back",
    KeyA: "left",
    KeyQ: "left",
    ArrowLeft: "left",
    KeyD: "right",
    ArrowRight: "right",
    Space: "up",
    ShiftLeft: "down",
    ControlLeft: "down",
};

/**
 * Squad 3D Simulation
 * Renders the current map's heightmap + basemap as a textured terrain mesh in Three.js.
 * @class Squad3DSimulation
 */
export default class Squad3DSimulation {

    /**
     * @param {HTMLElement} container - element the WebGL canvas is mounted into
     */
    constructor(container) {
        this.container = container;
        this.loadingScreen = container.querySelector(".threeDLoading");
        this.minimapImage = container.querySelector(".threeDMinimapImage");
        this.minimapDot = container.querySelector(".threeDMinimapDot");
        this.minimapDot.src = "/img/icons/shared/camera.webp";
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = null;
        this.terrainMesh = null;
        this.terrainSize = 0;
        this.heights = null;
        this.gridResolution = DEFAULT_GRID_RESOLUTION;
        this.textureName = "basemap"; // "basemap" | "topomap" - the select's own options.
        this.sky = null;
        this.sunLight = null;
        this.capzoneGroup = null;
        this.labelGroup = null;
        this.pathLine = null;
        this.capzonesVisible = true;
        this.minimapVisible = true;
        this.pathVisible = true;
        this.sunDir = new THREE.Vector3();
        this._minimapForward = new THREE.Vector3();
        this.loadedMapURL = null;
        this._frameId = null;
        this._onResize = () => this._resize();

        // Cached from the last _loadTerrain(), so a resolution change can resample
        // without re-fetching the heightmap/basemap, and so it knows what to redraw.
        this._heightmapPng = null;
        this._heightScale = 1;
        this._terrainTexture = null;
        this._lastLayer = null;
        this._lastActiveMap = null;

        // Fly-camera movement state, keyed by the action names in KEY_BINDINGS.
        this.move = { forward: false, back: false, left: false, right: false, up: false, down: false };
        this.velocity = new THREE.Vector3();

        // % of MAX_MOVE_SPEED, adjusted with the scroll wheel while locked.
        this.moveSpeedPercent = 50;
        this._speedHUDTimeout = null;
    }


    /**
     * Opens the simulation for the given map, (re)building the terrain only if the
     * map changed since the last open.
     * @param {object} activeMap - SquadMinimap's activeMap (mapURL, SDK_data.landscapeScale, size)
     * @param {?SquadLayer} layer - the currently selected layer, if any - drives the capzone overlay
     */
    async open(activeMap, layer = null) {
        if (!this.renderer) this._initScene();
        this._lastLayer = layer;
        this._lastActiveMap = activeMap;

        if (this.loadedMapURL !== activeMap.mapURL) {
            // Covers the still-visible last frame of the previous map (the canvas keeps
            // showing it until the new terrain is actually rendered) while it loads.
            this.loadingScreen.hidden = false;
            this.overlay.hidden = true;
            try {
                await this._loadTerrain(activeMap);
                this.loadedMapURL = activeMap.mapURL;
            } finally {
                this.loadingScreen.hidden = true;
            }
        }

        // Cheap enough to redo every open() - the layer can change independently of the map.
        this._drawCapzones(layer, activeMap);
        this._drawFlagPath(layer, activeMap);

        this.overlay.hidden = false;
        window.addEventListener("resize", this._onResize);
        this._resize();
        this.clock.getDelta(); // drop the idle time since the last close()
        this._startLoop();
    }


    /**
     * Stops rendering. The scene and terrain are kept so reopening the same map is instant.
     */
    close() {
        window.removeEventListener("resize", this._onResize);
        this._stopLoop();
        this.controls.unlock();
        for (const key of Object.keys(this.move)) this.move[key] = false;
        this.velocity.set(0, 0, 0);
        clearTimeout(this._speedHUDTimeout);
        this.speedHUD.classList.remove("visible");
    }


    _initScene() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(60, 1, 1, 50000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(2048, 2048);
        this.scene.add(this.sunLight);

        this.sky = new Sky();
        this.sky.scale.setScalar(20000);
        this.sky.material.uniforms.turbidity.value = 4;
        this.sky.material.uniforms.rayleigh.value = 3;
        this.sky.material.uniforms.mieCoefficient.value = 0.005;
        this.sky.material.uniforms.mieDirectionalG.value = 0.8;
        this.scene.add(this.sky);
        this._updateSun();

        this.capzoneGroup = new THREE.Group();
        this.scene.add(this.capzoneGroup);
        this.labelGroup = new THREE.Group();
        this.scene.add(this.labelGroup);

        this.clock = new THREE.Clock();
        this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
        this._setupFlyControls();
    }


    _updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - SUN_ELEVATION);
        const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH);
        this.sunDir.setFromSphericalCoords(1, phi, theta);

        this.sky.material.uniforms.sunPosition.value.copy(this.sunDir);

        const size = this.terrainSize || 1;
        this.sunLight.position.copy(this.sunDir).multiplyScalar(size * 5);

        // Shadow camera is an orthographic frustum covering the terrain footprint,
        // sized to the real map so shadow resolution doesn't degrade on bigger maps.
        const halfSize = size * 0.6;
        const shadowCam = this.sunLight.shadow.camera;
        shadowCam.left = -halfSize;
        shadowCam.right = halfSize;
        shadowCam.top = halfSize;
        shadowCam.bottom = -halfSize;
        shadowCam.near = size * 0.1;
        shadowCam.far = size * 10;
        shadowCam.updateProjectionMatrix();
    }


    _setupFlyControls() {
        this.overlay = this.container.querySelector(".threeDOverlay");
        this.controls.addEventListener("lock", () => { this.overlay.hidden = true; });
        this.controls.addEventListener("unlock", () => { this.overlay.hidden = false; });

        const goButton = this.container.querySelector(".threeDGoButton");
        goButton.addEventListener("click", () => this.controls.lock());

        this.speedHUD = this.container.querySelector(".threeDSpeedHUD");
        this.speedHUDFill = this.speedHUD.querySelector(".threeDSpeedHUDFill");
        this.speedHUDValue = this.speedHUD.querySelector(".threeDSpeedHUDValue");

        const options = this.container.querySelector(".threeDOverlayOptions");

        const capzonesToggle = options.querySelector(".threeDCapzonesToggle");
        capzonesToggle.checked = this.capzonesVisible;
        capzonesToggle.addEventListener("change", () => this._setCapzonesVisible(capzonesToggle.checked));

        this.minimap = this.container.querySelector(".threeDMinimap");
        const minimapToggle = options.querySelector(".threeDMinimapToggle");
        minimapToggle.checked = this.minimapVisible;
        minimapToggle.addEventListener("change", () => this._setMinimapVisible(minimapToggle.checked));

        const pathToggle = options.querySelector(".threeDPathToggle");
        pathToggle.checked = this.pathVisible;
        pathToggle.addEventListener("change", () => this._setPathVisible(pathToggle.checked));

        const resolutionSelect = options.querySelector(".threeDResolutionSelect");
        resolutionSelect.value = String(this.gridResolution);
        resolutionSelect.addEventListener("change", () => this._setResolution(Number(resolutionSelect.value)));

        const textureSelect = options.querySelector(".threeDTextureSelect");
        textureSelect.value = this.textureName;
        textureSelect.addEventListener("change", async () => {
            await this._setTexture(textureSelect.value);
            textureSelect.value = this.textureName; // reverts the dropdown on load failure
        });

        window.addEventListener("keydown", (event) => {
            const action = KEY_BINDINGS[event.code];
            if (action) {
                if (this.controls.isLocked) event.preventDefault();
                this.move[action] = true;
                return;
            }

            // Enter takes control from the settings card, like clicking Go, but only
            // while the 3D dialog is actually open - this listener stays registered
            // for the dialog's whole lifetime, not just while it's shown.
            if (!this.controls.isLocked && (event.code === "Enter" || event.code === "NumpadEnter")
                && this.container.closest("dialog")?.open) {
                event.preventDefault();
                this.controls.lock();
            }
        });
        window.addEventListener("keyup", (event) => {
            const action = KEY_BINDINGS[event.code];
            if (action) this.move[action] = false;
        });

        // Mouse wheel adjusts move speed while flying, instead of zooming.
        window.addEventListener("wheel", (event) => {
            if (!this.controls.isLocked) return;
            event.preventDefault();
            this.moveSpeedPercent = THREE.MathUtils.clamp(this.moveSpeedPercent - event.deltaY * 0.05, 0, 100);
            this._showSpeedHUD();
        }, { passive: false });
    }


    /**
     * Flashes the speed HUD (VLC-volume-OSD style): updates it, shows it, and
     * re-arms the fade-out timer so it only disappears once scrolling stops.
     */
    _showSpeedHUD() {
        const percent = Math.round(this.moveSpeedPercent);
        this.speedHUDFill.style.width = `${percent}%`;
        this.speedHUDValue.textContent = `${percent}%`;
        this.speedHUD.classList.add("visible");
        clearTimeout(this._speedHUDTimeout);
        this._speedHUDTimeout = setTimeout(() => this.speedHUD.classList.remove("visible"), 900);
    }


    _updateFlyMovement(delta) {
        if (!this.controls.isLocked) return;

        const maxSpeed = (this.moveSpeedPercent / 100) * MAX_MOVE_SPEED;

        const damping = Math.max(0, 1 - delta * 8);
        this.velocity.x *= damping;
        this.velocity.z *= damping;

        const accel = maxSpeed * 4;
        if (this.move.forward) this.velocity.z -= accel * delta;
        if (this.move.back) this.velocity.z += accel * delta;
        if (this.move.left) this.velocity.x -= accel * delta;
        if (this.move.right) this.velocity.x += accel * delta;

        this.velocity.x = THREE.MathUtils.clamp(this.velocity.x, -maxSpeed, maxSpeed);
        this.velocity.z = THREE.MathUtils.clamp(this.velocity.z, -maxSpeed, maxSpeed);

        this.controls.moveRight(this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        if (this.move.up) this.camera.position.y += maxSpeed * 0.5 * delta;
        if (this.move.down) this.camera.position.y -= maxSpeed * 0.5 * delta;
    }


    async _loadTerrain(activeMap) {
        const base = `${process.env.API_URL}${activeMap.mapURL}`;
        this._heightScale = activeMap.SDK_data?.landscapeScale?.[2] ?? 1;
        this.minimapImage.src = `${base}basemap.webp`;

        const [heightBuffer, texture] = await Promise.all([
            fetch(`${base}heightmap.png`).then((response) => response.arrayBuffer()),
            new THREE.TextureLoader().loadAsync(`${base}${this.textureName}.webp`),
        ]);
        texture.colorSpace = THREE.SRGBColorSpace;

        this._heightmapPng = decode(new Uint8Array(heightBuffer));
        this._terrainTexture = texture;

        // Real-world map size (meters) - the heightmap's own pixel resolution can differ
        // from it, so the grid is sampled to fit this footprint rather than the PNG's.
        this.terrainSize = activeMap.size ?? this._heightmapPng.width;
        this._updateSun();
        this._rebuildTerrainMesh();

        // Drop the camera 200m above the map's center, facing north, instead of at eye
        // height or a far-away overview - high enough to get a lay of the land right away
        // without clipping into terrain on a hilly map.
        const groundY = this.terrainHeightAt(0.5, 0.5);
        this.camera.position.set(0, groundY + 200, 0);
        this.camera.lookAt(0, groundY + 200, -1);
    }


    /**
     * (Re)builds the terrain mesh from the cached decoded heightmap/texture at the current
     * gridResolution, without touching the camera - shared by _loadTerrain() (first build)
     * and _setResolution() (resolution change on an already-loaded map).
     */
    _rebuildTerrainMesh() {
        this.heights = this._sampleHeights(this._heightmapPng, this._heightScale, this.gridResolution);

        const segments = this.gridResolution - 1;
        const geometry = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, segments, segments);
        geometry.rotateX(-Math.PI / 2);

        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) positions.setY(i, this.heights[i]);
        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        if (this.terrainMesh) {
            this.terrainMesh.geometry.dispose();
            this.terrainMesh.material.dispose();
            this.scene.remove(this.terrainMesh);
        }
        const material = new THREE.MeshStandardMaterial({ map: this._terrainTexture, roughness: 0.9, metalness: 0 });
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = true;
        this.scene.add(this.terrainMesh);
    }


    /**
     * Switches the terrain grid resolution and rebuilds it from the already-downloaded
     * heightmap (no network refetch), then redraws the capzones and flag path since their
     * ground-height sampling depends on the same grid.
     * @param {number} resolution
     */
    _setResolution(resolution) {
        if (resolution === this.gridResolution || !this._heightmapPng) return;
        this.gridResolution = resolution;
        this._rebuildTerrainMesh();
        this._drawCapzones(this._lastLayer, this._lastActiveMap);
        this._drawFlagPath(this._lastLayer, this._lastActiveMap);
    }


    /**
     * Switches the terrain surface texture (e.g. basemap <-> topomap), fetching it fresh -
     * unlike resolution, a different texture is a different file, not something the
     * already-downloaded data can be resampled into. The minimap keeps using basemap
     * regardless, for consistent navigation.
     * @param {string} name - "basemap" | "topomap"
     */
    async _setTexture(name) {
        if (name === this.textureName || !this._lastActiveMap || !this.terrainMesh) return;

        const base = `${process.env.API_URL}${this._lastActiveMap.mapURL}`;
        let texture;
        try {
            texture = await new THREE.TextureLoader().loadAsync(`${base}${name}.webp`);
        } catch (error) {
            console.error(`[3D] Failed to load ${name}.webp for this map:`, error);
            return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;

        this.textureName = name;
        this._terrainTexture.dispose();
        this._terrainTexture = texture;
        this.terrainMesh.material.map = texture;
        this.terrainMesh.material.needsUpdate = true;
    }


    /**
     * Shows/hides the capzone boxes/spheres/capsules and their name labels together.
     * @param {boolean} visible
     */
    _setCapzonesVisible(visible) {
        this.capzonesVisible = visible;
        this.capzoneGroup.visible = visible;
        this.labelGroup.visible = visible;
    }


    /**
     * Shows/hides the bottom-right minimap (basemap + camera dot).
     * @param {boolean} visible
     */
    _setMinimapVisible(visible) {
        this.minimapVisible = visible;
        this.minimap.hidden = !visible;
    }


    /**
     * Shows/hides the fixed AAS/Seed/Skirmish flag-order path.
     * @param {boolean} visible
     */
    _setPathVisible(visible) {
        this.pathVisible = visible;
        if (this.pathLine) this.pathLine.visible = visible;
    }



    /**
     * Draws each objective's capture-zone shapes (boxes, spheres, capsules), whatever the
     * gamemode, as translucent 3D volumes, plus a billboarded name label floating above
     * each one. Unlike the 2D map (see squadCapZone.js), each shape is drawn on its own -
     * merging overlapping shapes into one outline only matters for a flat 2D outline.
     * @param {?SquadLayer} layer
     * @param {object} activeMap
     */
    _drawCapzones(layer, activeMap) {
        this.capzoneGroup.children.forEach((mesh) => {
            mesh.geometry.dispose();
            mesh.material.dispose();
            const edges = mesh.children[0];
            edges.geometry.dispose();
            edges.material.dispose();
        });
        this.capzoneGroup.clear();

        this.labelGroup.children.forEach((sprite) => {
            sprite.material.map.dispose();
            sprite.material.dispose();
        });
        this.labelGroup.clear();

        if (!layer) return;
        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!corner0) return;

        const boxMaterial = new THREE.MeshBasicMaterial({
            color: 0x22ccff, transparent: true, opacity: 0.28, depthWrite: false
        });
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x22ccff, transparent: true, opacity: 0.35 });

        // Mains get one shared color instead of the generic capzone cyan, so they stand
        // out as mains regardless of team.
        const mainBoxMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000cd, transparent: true, opacity: 0.28, depthWrite: false
        });
        const mainEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x0000cd, transparent: true, opacity: 0.35 });

        // location_z is the box's real (Unreal-absolute) height, but each map's landscape
        // sits at a different absolute world Z, and our decoded heightmap is relative to
        // that landscape's own local origin - so the two datums are offset by a per-map
        // constant, applied to every box so real relative heights (tunnels, half-buried
        // zones) stay intact instead of forcing everything onto the visible ground.
        const zOffset = this._calibrateZOffset(layer, activeMap, corner0);

        for (const objective of this._flattenObjectivePoints(layer)) {
            const objectivePos = this._gameToWorldXZ(objective.location_x, objective.location_y, corner0);
            const isMain = objective.name === "Main";

            for (const shape of objective.objects ?? []) {
                if (!shape.isBox && !shape.isSphere && !shape.isCapsule) continue;

                const { x, z } = this._gameToWorldXZ(shape.location_x, shape.location_y, corner0);
                const centerY = shape.location_z / 100 + zOffset;

                let geometry;
                if (shape.isBox) {
                    const extent = shape.boxExtent ?? {};
                    const sizeX = (extent.extent_x ?? 0) / 100 * (extent.scaling_x ?? 1) * 2;
                    const sizeY = (extent.extent_y ?? 0) / 100 * (extent.scaling_y ?? 1) * 2;
                    const sizeZ = (extent.extent_z ?? 0) / 100 * (extent.scaling_z ?? 1) * 2;
                    geometry = new THREE.BoxGeometry(sizeX, sizeZ, sizeY);
                } else if (shape.isCapsule) {
                    // capsuleLength is the straight cylinder segment only (excluding the two
                    // hemispherical caps) - the same convention THREE.CapsuleGeometry takes.
                    // Capture-zone capsules are always lying flat (matches squadCapZone.js's
                    // _shapeRings(), which only ever draws them as a flat rectangle + two end
                    // circles - never a vertical pole), so it's tipped 90deg below regardless
                    // of the raw rotation_x/y/z split.
                    const radius = parseFloat(shape.capsuleRadius) / 100;
                    const length = parseFloat(shape.capsuleLength) / 100;
                    geometry = new THREE.CapsuleGeometry(radius, length, 4, 8);
                } else {
                    const radius = parseFloat(shape.sphereRadius) / 100;
                    geometry = new THREE.SphereGeometry(radius, 12, 8);
                }

                const mesh = new THREE.Mesh(geometry, isMain ? mainBoxMaterial : boxMaterial);
                mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), isMain ? mainEdgeMaterial : edgeMaterial));
                mesh.position.set(x, centerY, z);
                if (shape.isBox) {
                    // Sign unverified against an in-game reference - flip if boxes look mirrored/rotated wrong.
                    mesh.rotation.y = -THREE.MathUtils.degToRad(shape.boxExtent?.rotation_z ?? 0);
                } else if (shape.isCapsule) {
                    // Same yaw-correction heuristic as squadCapZone.js's _shapeRings(): rotation_z
                    // alone is only reliable unless the capsule was tipped onto its side via
                    // rotation_y near +-90deg (the classic pitch gimbal-lock case), where
                    // rotation_x/y have to be folded back in to recover the true yaw.
                    const rot = shape.boxExtent ?? {};
                    let totalRotation = rot.rotation_z ?? 0;
                    if (Math.abs(rot.rotation_y ?? 0) > 89 && Math.abs(rot.rotation_y ?? 0) < 91) {
                        if (rot.rotation_y > 0) totalRotation -= (rot.rotation_x ?? 0) + rot.rotation_y;
                        else totalRotation += (rot.rotation_x ?? 0) + rot.rotation_y;
                    }

                    // Tip the capsule (THREE builds it standing along local Y) onto its side
                    // first, then yaw it around world Y - composed as quaternions since a
                    // plain Euler .set() would apply the yaw around the capsule's own
                    // already-tipped local Y axis instead of the world-vertical one.
                    const tip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
                    const yaw = new THREE.Quaternion().setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0), -THREE.MathUtils.degToRad(totalRotation)
                    );
                    mesh.quaternion.copy(yaw).multiply(tip);
                }

                this.capzoneGroup.add(mesh);
            }

            const topY = this._objectiveTopY(objective, corner0, zOffset);
            const labelWorldHeight = isMain ? LABEL_WORLD_HEIGHT * 1.5 : LABEL_WORLD_HEIGHT;
            const label = this._createLabelSprite(
                this._objectiveLabelText(objective),
                isMain ? "rgba(0, 0, 205, 0.7)" : undefined,
                labelWorldHeight
            );
            // Grows upward from the same bottom edge every label shares (see _drawFlagPath()'s
            // labelBottomY) rather than around a fixed center, so a bigger main label doesn't
            // dip lower and start crossing the flag-order path underneath it.
            const labelBottomY = topY + GROUND_CLEARANCE - LABEL_WORLD_HEIGHT / 2;
            label.position.set(objectivePos.x, labelBottomY + labelWorldHeight / 2, objectivePos.z);
            this.labelGroup.add(label);
        }
    }


    /**
     * The name to show on an objective's floating label. Mains carry the generic raw
     * name "Main" (see squadLayer.js's initPredictiveLayer()/createMainObjective()) with
     * the team told apart only by pointPosition (1 or 2, same convention as any other
     * objective's position in the flag order) - everything else already has a proper name.
     * @param {object} objective
     * @returns {string}
     */
    _objectiveLabelText(objective) {
        if (objective.name === "Main") return `Team ${objective.pointPosition} Main`;
        return objective.name ?? objective.objectDisplayName ?? "";
    }


    /**
     * Half-height (meters) of one capzone shape along its own vertical axis - box's
     * extent_z, or the radius for a sphere/capsule (both lie/curve back down within one
     * radius of their center). Shared by _drawCapzones()'s mesh sizing and
     * _objectiveTopY()'s label/path clearance so the two never disagree.
     * @param {object} shape
     * @returns {number}
     */
    _shapeHalfHeight(shape) {
        if (shape.isBox) {
            const extent = shape.boxExtent ?? {};
            return (extent.extent_z ?? 0) / 100 * (extent.scaling_z ?? 1);
        }
        if (shape.isCapsule) return parseFloat(shape.capsuleRadius) / 100;
        return parseFloat(shape.sphereRadius) / 100; // isSphere
    }


    /**
     * The height (world Y) a flag label - or anything else that should clear this
     * objective's capzone volumes - starts from, before adding GROUND_CLEARANCE: the
     * decoded ground height, or the top of its tallest box/sphere/capsule if that's higher.
     * @param {object} objective
     * @param {[number, number]} corner0
     * @param {number} zOffset - see _calibrateZOffset()
     * @returns {number}
     */
    _objectiveTopY(objective, corner0, zOffset) {
        const { u, v } = this._gameToWorldXZ(objective.location_x, objective.location_y, corner0);
        let topY = this.terrainHeightAt(u, v);
        for (const shape of objective.objects ?? []) {
            if (!shape.isBox && !shape.isSphere && !shape.isCapsule) continue;
            const centerY = shape.location_z / 100 + zOffset;
            topY = Math.max(topY, centerY + this._shapeHalfHeight(shape));
        }
        return topY;
    }


    /**
     * The per-map constant that aligns location_z's absolute datum with our decoded
     * heightmap's landscape-relative one (see _drawCapzones()).
     *
     * The heightmap encoding is normalized per map (its lowest scanned point is always
     * raw height 0), so it has no idea what that point's real absolute world Z is -
     * that's exactly what activeMap.SDK_data.zOffset carries (the exporter's own
     * `z_offset_m`, verified against every AAS layer we had data for: worldZ = decoded
     * height + z_offset_m, so decoded height = location_z/100 - z_offset_m). Falls back
     * to a median-based estimate (decoded ground height - location_z across every capzone
     * box, median so a few genuinely underground/elevated boxes don't skew it) for a map
     * missing that field.
     * @param {SquadLayer} layer
     * @param {object} activeMap
     * @param {[number, number]} corner0
     * @returns {number} meters to add to location_z/100
     */
    _calibrateZOffset(layer, activeMap, corner0) {
        const zOffsetM = activeMap.SDK_data?.zOffset;
        if (zOffsetM !== undefined) return -zOffsetM;

        const samples = [];
        for (const objective of this._flattenObjectivePoints(layer)) {
            for (const shape of objective.objects ?? []) {
                if (!shape.isBox && !shape.isSphere && !shape.isCapsule) continue;
                const { u, v } = this._gameToWorldXZ(shape.location_x, shape.location_y, corner0);
                samples.push(this.terrainHeightAt(u, v) - shape.location_z / 100);
            }
        }
        if (!samples.length) return 0;
        samples.sort((a, b) => a - b);
        return samples[Math.floor(samples.length / 2)];
    }


    /**
     * Flattens layer.objectives to one entry per point (each with its own .objects[] and
     * location_x/y/z), matching squadLayer.js's initRandomizedLayer(): on RAAS/Invasion,
     * objectives are keyed by *cluster*, and the real points - one per random-route
     * candidate - live under cluster.points[]; AAS objectives and mains have no .points
     * and already are a single point. No dependency on the lane solver's confirmation
     * state, so every candidate point in every cluster is included, not just the one a
     * live match would actually pick.
     *
     * Some physical flags sit in more than one cluster's candidate list (they're reachable
     * from several lane combinations) - each cluster gives its copy its own prefixed name
     * (e.g. "A1-Monastery" vs "B1-Monastery" for the very same building, confirmed same
     * location_x/y/z), so the same physical flag can otherwise show up twice here -
     * stacking two identical translucent capzone shapes on top of each other and making
     * that flag visibly more opaque than the rest. Deduped by location instead of name to
     * draw each physical flag once.
     *
     * TC and Destruction have no layer.objectives at all (matching squadLayer.js's
     * initTerritoryControl()/initDestruction()) - their two mains live only under
     * capturePoints.points.objectives instead, so that's included too. Every other
     * gamemode we draw capzones for leaves that field empty, so this is a no-op there.
     * @param {SquadLayer} layer
     * @returns {object[]}
     */
    _flattenObjectivePoints(layer) {
        const points = [...(layer.capturePoints?.points?.objectives ?? [])];
        for (const objective of Object.values(layer.objectives ?? {})) {
            if (objective.points) points.push(...objective.points);
            else points.push(objective);
        }

        const seen = new Set();
        return points.filter((point) => {
            const key = `${point.location_x},${point.location_y},${point.location_z}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }


    /**
     * Draws the fixed flag order for AAS/Seed/Skirmish ("predictive") layers as a chain of
     * translucent 5m-diameter cylinder segments, one per link, floating just under each
     * flag's label height, through capturePoints.points.links - the same field and node-
     * by-displayName lookup squadLayer.js's initPredictiveLayer() uses to build its 2D
     * polyline. RAAS/Invasion have no fixed order (their path only exists once the lane
     * solver picks a route), so they're skipped entirely.
     * @param {?SquadLayer} layer
     * @param {object} activeMap
     */
    _drawFlagPath(layer, activeMap) {
        if (this.pathLine) {
            this.pathLine.children.forEach((mesh) => mesh.geometry.dispose());
            this.pathLine.children[0]?.material.dispose();
            this.scene.remove(this.pathLine);
            this.pathLine = null;
        }

        if (!layer || !["AAS", "Seed", "Skirmish"].includes(layer.gamemode)) return;
        const links = layer.capturePoints?.points?.links;
        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!links || !corner0) return;

        const objectives = Object.values(layer.objectives ?? {});
        const findByDisplayName = (name) => objectives.find((o) => o.objectDisplayName === name);
        const zOffset = this._calibrateZOffset(layer, activeMap, corner0);

        const points = [];
        for (const link of Object.values(links)) {
            const nodeA = findByDisplayName(link.nodeA);
            const nodeB = findByDisplayName(link.nodeB);
            if (!nodeA || !nodeB) continue;

            for (const node of [nodeA, nodeB]) {
                const { x, z } = this._gameToWorldXZ(node.location_x, node.location_y, corner0);
                const topY = this._objectiveTopY(node, corner0, zOffset);
                // The label sprite is centered at topY + GROUND_CLEARANCE with half-height
                // LABEL_WORLD_HEIGHT/2, so its own bottom edge sits at topY + 2 - keep the
                // (much wider) pipe's top comfortably under that instead of crossing the name.
                const labelBottomY = topY + GROUND_CLEARANCE - LABEL_WORLD_HEIGHT / 2;
                const y = labelBottomY - PATH_RADIUS - 1.5;
                const point = new THREE.Vector3(x, y, z);

                // Links share endpoints (nodeB of one is nodeA of the next) - skip the
                // repeat so it doesn't become a zero-length cylinder below.
                if (points.length === 0 || points[points.length - 1].distanceToSquared(point) > 1e-6) {
                    points.push(point);
                }
            }
        }
        if (points.length < 2) return;

        // One independent cylinder per straight segment, not a single TubeGeometry along
        // a CurvePath - a tube's frame twists visibly at a sharp corner between two
        // sub-curves; separate cylinders have no shared frame to twist, at the cost of a
        // small seam at each turn instead of a smooth joint.
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false
        });
        this.pathLine = new THREE.Group();
        const up = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            const offset = new THREE.Vector3().subVectors(end, start);

            const geometry = new THREE.CylinderGeometry(PATH_RADIUS, PATH_RADIUS, offset.length(), 8);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(start).addScaledVector(offset, 0.5);
            mesh.quaternion.setFromUnitVectors(up, offset.normalize());
            this.pathLine.add(mesh);
        }
        this.pathLine.visible = this.pathVisible;
        this.scene.add(this.pathLine);
    }


    /**
     * A billboarded text label (always faces the camera - THREE.Sprite's default behavior)
     * for a flag name, rendered on top of everything so distance/terrain never occludes it.
     * @param {string} text
     * @param {string} [bgColor] - defaults to a neutral translucent black; mains pass a
     * different color instead (see _drawCapzones()) so they stand out from regular flags.
     * @param {number} [worldHeight] - defaults to LABEL_WORLD_HEIGHT; mains pass a larger
     * value so their name reads bigger than a regular flag's.
     * @returns {THREE.Sprite}
     */
    _createLabelSprite(text, bgColor = "rgba(0, 0, 0, 0.6)", worldHeight = LABEL_WORLD_HEIGHT) {
        const fontSize = 48;
        const paddingX = 24;
        const paddingY = 16;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `bold ${fontSize}px sans-serif`;
        canvas.width = Math.ceil(ctx.measureText(text).width) + paddingX * 2;
        canvas.height = fontSize + paddingY * 2;

        // Sizing the canvas resets its 2D context, so the font has to be set again.
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(material);

        sprite.scale.set(worldHeight * (canvas.width / canvas.height), worldHeight, 1);
        return sprite;
    }


    /**
     * Converts a raw game-unit location (cm, Unreal-style) to this map's world space
     * (meters, origin at map center) - the same transform squadLayer.js's
     * convertToLatLng()/getLayerOffsets() use for the 2D map, collapsed to one map-level
     * offset (SDK_data.minimap.corner0) since the per-layer texture-origin term cancels out.
     * @param {number} locationX
     * @param {number} locationY
     * @param {[number, number]} corner0 - activeMap.SDK_data.minimap.corner0, in meters
     * @returns {{x: number, z: number, u: number, v: number}} world X/Z (meters) and the
     * normalized (u, v) fraction terrainHeightAt() takes
     */
    _gameToWorldXZ(locationX, locationY, corner0) {
        const metersX = locationX / 100 - corner0[0];
        const metersY = locationY / 100 - corner0[1];
        const u = metersX / this.terrainSize;
        const v = metersY / this.terrainSize;
        return { x: metersX - this.terrainSize / 2, z: metersY - this.terrainSize / 2, u, v };
    }


    /**
     * Ground height (world Y, meters) at a normalized map fraction (u, v), sampled from
     * the same decoded grid the terrain mesh was built from.
     * @param {number} u - 0..1, left to right
     * @param {number} v - 0..1, top to bottom
     * @returns {number}
     */
    terrainHeightAt(u, v) {
        const resolution = this.gridResolution;
        const ix = THREE.MathUtils.clamp(Math.round(u * (resolution - 1)), 0, resolution - 1);
        const iy = THREE.MathUtils.clamp(Math.round(v * (resolution - 1)), 0, resolution - 1);
        return this.heights[iy * resolution + ix];
    }


    /**
     * Moves the minimap arrow to the camera's current position (the same normalized
     * (u, v) fraction terrainHeightAt() takes) and points it where the camera is facing.
     */
    _updateMinimapDot() {
        if (!this.terrainSize) return;
        const u = THREE.MathUtils.clamp(this.camera.position.x / this.terrainSize + 0.5, 0, 1);
        const v = THREE.MathUtils.clamp(this.camera.position.z / this.terrainSize + 0.5, 0, 1);
        this.minimapDot.style.left = `${u * 100}%`;
        this.minimapDot.style.top = `${v * 100}%`;

        // Heading clockwise from north (-Z, the minimap's "up"). camera.webp's own artwork
        // faces right (east) at 0deg rotation rather than up, so it needs a -90deg
        // correction to point up (i.e. north) when heading is 0.
        this.camera.getWorldDirection(this._minimapForward);
        const heading = THREE.MathUtils.radToDeg(Math.atan2(this._minimapForward.x, -this._minimapForward.z));
        this.minimapDot.style.transform = `translate(-50%, -50%) rotate(${heading - 90}deg)`;
    }


    /**
     * Nearest-neighbor resample of the decoded heightmap onto a `resolution` x `resolution`
     * grid. height = (255 + r - b) * scale[2], matching SquadHeightmap.loadHeightmapPNG().
     * @param {{width: number, height: number, data: Uint8Array|Uint16Array, channels: number}} png
     * @param {number} heightScale
     * @param {number} resolution
     * @returns {Float32Array}
     */
    _sampleHeights(png, heightScale, resolution) {
        const { width, height, data, channels } = png;
        const heights = new Float32Array(resolution * resolution);

        for (let gy = 0; gy < resolution; gy++) {
            const sy = Math.min(height - 1, Math.round((gy / (resolution - 1)) * (height - 1)));
            for (let gx = 0; gx < resolution; gx++) {
                const sx = Math.min(width - 1, Math.round((gx / (resolution - 1)) * (width - 1)));
                const idx = (sy * width + sx) * channels;
                const r = data[idx];
                const b = data[idx + 2];
                heights[gy * resolution + gx] = (255 + r - b) * heightScale;
            }
        }
        return heights;
    }


    _resize() {
        const { clientWidth: width, clientHeight: height } = this.container;
        if (!width || !height) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }


    _startLoop() {
        const renderFrame = () => {
            this._frameId = requestAnimationFrame(renderFrame);
            const delta = Math.min(this.clock.getDelta(), 0.1);
            this._updateFlyMovement(delta);
            this._updateMinimapDot();
            this.renderer.render(this.scene, this.camera);
        };
        renderFrame();
    }


    _stopLoop() {
        if (this._frameId !== null) cancelAnimationFrame(this._frameId);
        this._frameId = null;
    }

}
