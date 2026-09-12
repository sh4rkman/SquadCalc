import * as THREE from "three";
import { decode } from "fast-png";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Sky } from "three/addons/objects/Sky.js";

// Vertices per side of the terrain grid. Sampled from the full-resolution heightmap
// at this fixed size for now - configurable resolution is a later step.
const GRID_RESOLUTION = 2048;

// World units are meters (terrainSize comes from the map's real-world size), so this
// is the fly speed in meters/second.
const MAX_MOVE_SPEED = 300;

// Default sun position (degrees) - fixed for now, no time-of-day control yet.
const SUN_ELEVATION = 35;
const SUN_AZIMUTH = 130;

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
        this.sky = null;
        this.sunLight = null;
        this.capzoneGroup = null;
        this.labelGroup = null;
        this.sunDir = new THREE.Vector3();
        this._minimapForward = new THREE.Vector3();
        this.loadedMapURL = null;
        this._frameId = null;
        this._onResize = () => this._resize();

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
        this.overlay.addEventListener("click", () => this.controls.lock());
        this.controls.addEventListener("lock", () => { this.overlay.hidden = true; });
        this.controls.addEventListener("unlock", () => { this.overlay.hidden = false; });

        this.speedHUD = this.container.querySelector(".threeDSpeedHUD");
        this.speedHUDFill = this.speedHUD.querySelector(".threeDSpeedHUDFill");
        this.speedHUDValue = this.speedHUD.querySelector(".threeDSpeedHUDValue");

        window.addEventListener("keydown", (event) => {
            const action = KEY_BINDINGS[event.code];
            if (!action) return;
            if (this.controls.isLocked) event.preventDefault();
            this.move[action] = true;
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
        const heightScale = activeMap.SDK_data?.landscapeScale?.[2] ?? 1;
        this.minimapImage.src = `${base}basemap.webp`;

        const [heightBuffer, texture] = await Promise.all([
            fetch(`${base}heightmap.png`).then((response) => response.arrayBuffer()),
            new THREE.TextureLoader().loadAsync(`${base}basemap.webp`),
        ]);
        texture.colorSpace = THREE.SRGBColorSpace;

        const png = decode(new Uint8Array(heightBuffer));
        this.heights = this._sampleHeights(png, heightScale, GRID_RESOLUTION);

        // Real-world map size (meters) - the heightmap's own pixel resolution can differ
        // from it, so the grid is sampled to fit this footprint rather than the PNG's.
        this.terrainSize = activeMap.size ?? png.width;
        this._updateSun();
        const segments = GRID_RESOLUTION - 1;
        const geometry = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, segments, segments);
        geometry.rotateX(-Math.PI / 2);

        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) positions.setY(i, this.heights[i]);
        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0 });

        if (this.terrainMesh) {
            this.terrainMesh.geometry.dispose();
            this.terrainMesh.material.dispose();
            this.scene.remove(this.terrainMesh);
        }
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = true;
        this.scene.add(this.terrainMesh);

        // Drop the camera at eye height above the map's center, facing north, instead
        // of a far-away overview - immediately walkable once the user clicks to look around.
        const groundY = this.terrainHeightAt(0.5, 0.5);
        this.camera.position.set(0, groundY + 1.7, 0);
        this.camera.lookAt(0, groundY + 1.7, -1);
    }


    /**
     * Draws each AAS objective's capture-zone boxes as translucent 3D volumes, plus a
     * billboarded name label floating above each one. Unlike the 2D map (see
     * squadCapZone.js), each shape is drawn on its own - merging overlapping shapes into
     * one outline only matters for a flat 2D outline.
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

        if (!layer || layer.gamemode !== "AAS") return;
        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!corner0) return;

        const boxMaterial = new THREE.MeshBasicMaterial({
            color: 0x22ccff, transparent: true, opacity: 0.28, depthWrite: false
        });
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x22ccff });
        const LABEL_MARGIN = 8; // meters above the tallest box, so it clears the volume

        for (const objective of Object.values(layer.objectives ?? {})) {
            const objectivePos = this._gameToWorldXZ(objective.location_x, objective.location_y, corner0);
            let topY = this.terrainHeightAt(objectivePos.u, objectivePos.v);

            for (const shape of objective.objects ?? []) {
                if (!shape.isBox) continue;

                const { x, z, u, v } = this._gameToWorldXZ(shape.location_x, shape.location_y, corner0);
                const extent = shape.boxExtent ?? {};
                const sizeX = (extent.extent_x ?? 0) / 100 * (extent.scaling_x ?? 1) * 2;
                const sizeY = (extent.extent_y ?? 0) / 100 * (extent.scaling_y ?? 1) * 2;
                const sizeZ = (extent.extent_z ?? 0) / 100 * (extent.scaling_z ?? 1) * 2;

                const geometry = new THREE.BoxGeometry(sizeX, sizeZ, sizeY);
                const mesh = new THREE.Mesh(geometry, boxMaterial);
                mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));

                // Rests on our own decoded heightmap rather than the box's raw location_z:
                // that raw value's datum isn't consistent across maps (matched the terrain
                // within ~2m on AlBasrah, but sat ~70m below it on Anvil), so it can't be
                // trusted as an absolute height on its own.
                const groundY = this.terrainHeightAt(u, v);
                mesh.position.set(x, groundY + sizeZ / 2, z);
                // Sign unverified against an in-game reference - flip if boxes look mirrored/rotated wrong.
                mesh.rotation.y = -THREE.MathUtils.degToRad(extent.rotation_z ?? 0);

                this.capzoneGroup.add(mesh);
                topY = Math.max(topY, groundY + sizeZ);
            }

            const label = this._createLabelSprite(objective.name ?? objective.objectDisplayName ?? "");
            label.position.set(objectivePos.x, topY + LABEL_MARGIN, objectivePos.z);
            this.labelGroup.add(label);
        }
    }


    /**
     * A billboarded text label (always faces the camera - THREE.Sprite's default behavior)
     * for a flag name, rendered on top of everything so distance/terrain never occludes it.
     * @param {string} text
     * @returns {THREE.Sprite}
     */
    _createLabelSprite(text) {
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
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(material);

        const worldHeight = 6; // meters
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
        const ix = THREE.MathUtils.clamp(Math.round(u * (GRID_RESOLUTION - 1)), 0, GRID_RESOLUTION - 1);
        const iy = THREE.MathUtils.clamp(Math.round(v * (GRID_RESOLUTION - 1)), 0, GRID_RESOLUTION - 1);
        return this.heights[iy * GRID_RESOLUTION + ix];
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

        // Heading clockwise from north (-Z, the minimap's "up"): 0deg matches the
        // arrow's own resting orientation (pointing up), so no offset is needed.
        this.camera.getWorldDirection(this._minimapForward);
        const heading = THREE.MathUtils.radToDeg(Math.atan2(this._minimapForward.x, -this._minimapForward.z));
        this.minimapDot.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
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
