import * as THREE from "three";
import { decode } from "fast-png";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { loadProps } from "./squad3DProps.js";
import { loadTrees } from "./squad3DTrees.js";

// Vertices per side of the terrain grid, sampled from the full-resolution heightmap.
const GRID_RESOLUTION = 512;

// World units are meters (terrainSize comes from the map's real-world size), so this
// is the fly speed in meters/second.
const MAX_MOVE_SPEED = 500;

// True when the device's PRIMARY pointing input is touch (phones/tablets) rather than a
// mouse/trackpad - "(pointer: coarse)" reflects the primary input's precision, unlike
// "ontouchstart" in window which false-positives on touch-enabled laptops that are
// actually driven by a mouse. PointerLockControls' pointer-lock-and-mouse-delta scheme
// has no touch equivalent at all (iOS Safari doesn't implement Pointer Lock and Android's
// support is inconsistent), so touch devices get OrbitControls instead - see _initScene().
const IS_TOUCH_DEVICE = window.matchMedia("(pointer: coarse)").matches;

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

// Billboard size (meters) for a placed weapon/target marker's icon sprite - see _drawMarkers().
const MARKER_WORLD_SIZE = 18;

// Target markers read slightly smaller than weapon markers, to visually rank behind them.
const TARGET_MARKER_WORLD_SIZE = MARKER_WORLD_SIZE * 0.75;

// Right-click map markers (FOBs, HABs, vehicles...) - same size as targets.
const STRAT_MARKER_WORLD_SIZE = MARKER_WORLD_SIZE * 0.75;

// Canvas size (px) SVG marker icons are rasterized at - see _loadMarkerIconTexture().
const SVG_ICON_RASTER_SIZE = 128;

// Text size (meters) of a target's elevation/bearing label - see _drawMarkers()'s
// _targetLabelText(). Smaller than a flag's LABEL_WORLD_HEIGHT since it's a secondary
// annotation on a marker, not a flag name.
const TARGET_LABEL_WORLD_HEIGHT = 6;

// Meters a target's elevation/bearing label floats above its own icon sprite - see
// _drawMarkers().
const TARGET_LABEL_CLEARANCE = 3;

// Meters a target's spread ellipse floats above the ground, just enough to avoid
// z-fighting with the terrain - see _drawTargetSpreads().
const SPREAD_GROUND_OFFSET = 0.2;

// FOB range spheres (build radius + exclusion radius) are only drawn as a band hugging the
// ground: from FOB_BAND_DEPTH meters below the terrain to FOB_BAND_HEIGHT above it, fading
// out upward - see _createFobRangeBand().
const FOB_BAND_HEIGHT = 30;
const FOB_BAND_DEPTH = 1;

// Projectile arc tube radius (meters) - see _drawProjectileArcs().
const ARC_TUBE_RADIUS = 0.8;

// Seconds between FPS HUD updates - a plain per-frame 1/delta reading jitters too much to
// read, so it's averaged over this window instead.
const FPS_UPDATE_INTERVAL = 0.5;

// Seconds between click marker distance label refreshes while the camera moves - each
// refresh that changes the value redraws the label's canvas texture, so it's capped
// rather than done every frame.
const CLICK_LABEL_UPDATE_INTERVAL = 0.1;

// requestAnimationFrame fires at the display's own refresh rate (vsync-locked) with no
// cap of its own - on a high-refresh monitor that's more render/movement-update work than
// this scene needs. Frames still get requested at the display's full rate, but the actual
// update+render work (and the FPS counter, which measures exactly that work) is skipped
// until at least 1/MAX_FPS seconds have accumulated.
const MAX_FPS = 100;
const MIN_FRAME_INTERVAL = 1 / MAX_FPS;

// NDC coordinates of the screen center (where the crosshair sits) - see the
// left-click raycast in _setupFlyControls().
const _screenCenter = new THREE.Vector2(0, 0);

// Cursor position in NDC for the drag-look fallback's click raycast, and the Euler
// reused by its mouselook - see _setupFlyControls().
const _cursorNdc = new THREE.Vector2();
const _lookEuler = new THREE.Euler(0, 0, 0, "YXZ");

// On-screen size of the left-click ground marker, as a fraction of the viewport height
// scaled by the camera's fov (a sizeAttenuation: false sprite) - see _createClickMarker().
const CLICK_MARKER_SCREEN_SIZE = 0.04;
const CLICK_MARKER_ICON_URL = "/img/icons/shared/EyeIcon.png";

// On-screen height of the click marker's distance label, same units as above.
const CLICK_LABEL_SCREEN_HEIGHT = 0.035;

// Scratch point for _rayTerrainDistance()'s march along the click ray.
const _rayPoint = new THREE.Vector3();

// Scratch objects for _rayPropsMeshDistance()'s per-part box/triangle tests.
const _localRay = new THREE.Ray();
const _inverseMatrix = new THREE.Matrix4();
const _triA = new THREE.Vector3();
const _triB = new THREE.Vector3();
const _triC = new THREE.Vector3();
const _hitPoint = new THREE.Vector3();

// Pixels the mouse may move between press and release for it to still count as a
// click (flag select) rather than a drag-look, in the drag-look fallback.
const DRAG_CLICK_THRESHOLD = 4;

// Packs a camera position + look-at target (6 world-meter coordinates) into a compact,
// URL-safe opaque token instead of a readable "x;y;z;..." list - see
// Squad3DSimulation.getShareToken()/threeDShareButton (squadCalc.js). Each coordinate
// rounds to the nearest meter and packs as a little-endian Int16 (plenty of range for any
// map's world extent), base64url-encoded: 12 bytes -> exactly 16 chars, no padding.
function encodeShareToken(position, target) {
    const values = [position.x, position.y, position.z, target.x, target.y, target.z];
    const buf = new ArrayBuffer(12);
    const view = new DataView(buf);
    values.forEach((v, i) => view.setInt16(i * 2, THREE.MathUtils.clamp(Math.round(v), -32768, 32767), true));
    const binary = String.fromCharCode(...new Uint8Array(buf));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Inverse of encodeShareToken() - decodes a "?3d=<token>" share token (see squadCalc.js's
 * parseUrlIntent()) back into a camera position + look-at target. Returns null instead of
 * throwing on anything malformed (a hand-edited or truncated URL), same "degrade to
 * empty/default" convention as this file's other manifest/heightmap parsing.
 * @param {string} token
 * @returns {?{position: {x: number, y: number, z: number}, target: {x: number, y: number, z: number}}}
 */
export function decodeShareToken(token) {
    try {
        const padded = token.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(token.length / 4) * 4, "=");
        const binary = atob(padded);
        if (binary.length !== 12) return null;
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const view = new DataView(bytes.buffer);
        const values = Array.from({ length: 6 }, (_, i) => view.getInt16(i * 2, true));
        return {
            position: { x: values[0], y: values[1], z: values[2] },
            target: { x: values[3], y: values[4], z: values[5] },
        };
    } catch {
        return null;
    }
}

// Horizontal/vertical offset (meters) of the camera spawn from the "See in 3D" arc target - see
// _spawnCamera(). Equal on both axes for an exact 45-degree down angle.
const WEAPON_SPAWN_DISTANCE = 150;

// Camera height (meters) above the ground when spawning at a clicked point on the 2D
// map (the context menu's "3D" item) - roughly a standing soldier's eye level - see
// _spawnCamera()'s spawnLatLng branch.
const EYE_HEIGHT = 2;

// Deployable models, one glTF per asset type. Only "Ammo Crate" for now - add other
// deployables.assets .type values here as models for them show up.
const DEPLOYABLE_MODELS = {
    "Ammo Crate": "/img/models/ammocrate.glb",
    "Repair Station": "/img/models/repairstation.glb",
    "Helipad": "/img/models/helipad.glb",
};

// DEPLOYABLE_MODELS whose glTF pivot sits at the model's center rather than its base -
// placed as-is at the asset's location_z (ground level), half the model ends up buried.
// _loadDeployableModel() lifts these so their bounding box's bottom sits on the pivot.
const GROUND_ALIGNED_MODELS = new Set(["Ammo Crate"]);

// localStorage keys for the settings card's own options - same "settings-*" naming and
// "1"/"0" boolean convention as SquadSettings, kept local to this class since none of
// these are checkbox/slider definitions SquadSettings' binding system can express (one
// is a <select> value, and the toggles live in a card SquadSettings doesn't own).
const STORAGE_KEYS = {
    capzonesVisible: "settings-3d-capzones",
    minimapVisible: "settings-3d-minimap",
    pathVisible: "settings-3d-path",
    arcsVisible: "settings-3d-arcs",
    treesVisible: "settings-3d-trees",
    propsVisible: "settings-3d-props",
    markersVisible: "settings-3d-markers",
    crosshairVisible: "settings-3d-crosshair",
    fpsVisible: "settings-3d-fps",
    controlsVisible: "settings-3d-controls",
    textureName: "settings-3d-texture",
};

/**
 * Reads one of STORAGE_KEYS, or falls back to `fallback` if unset.
 * @param {string} key
 * @param {string} fallback
 * @returns {string}
 */
function loadSetting(key, fallback) {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored;
}

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
    // ControlLeft deliberately not bound to "down" - W+Ctrl (a natural forward+down combo)
    // collides with the browser's own close-tab shortcut, which the page can't override.
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
        this.minimapClickMarker = container.querySelector(".threeDMinimapClickMarker");
        this.minimapClickMarker.src = CLICK_MARKER_ICON_URL;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = null;
        this.terrainMesh = null;
        this.terrainSize = 0;
        this.heights = null;
        this.gridResolution = GRID_RESOLUTION;
        this.textureName = loadSetting(STORAGE_KEYS.textureName, "basemap"); // "basemap" | "topomap" | "terrainmap" - the select's own options.
        this.sunLight = null;
        this.capzoneGroup = null;
        this.labelGroup = null;
        this.pathLine = null;
        this.deployableGroup = null;
        this.markerGroup = null;
        this.spreadGroup = null;
        this.arcGroup = null;
        this.propsGroup = null;
        this.treesGroup = null;
        this.capzonesVisible = loadSetting(STORAGE_KEYS.capzonesVisible, "1") === "1";
        this.minimapVisible = loadSetting(STORAGE_KEYS.minimapVisible, "1") === "1";
        this.pathVisible = loadSetting(STORAGE_KEYS.pathVisible, "1") === "1";
        this.arcsVisible = loadSetting(STORAGE_KEYS.arcsVisible, "1") === "1";
        this.treesVisible = loadSetting(STORAGE_KEYS.treesVisible, "1") === "1";
        this.propsVisible = loadSetting(STORAGE_KEYS.propsVisible, "1") === "1";
        this.markersVisible = loadSetting(STORAGE_KEYS.markersVisible, "1") === "1";
        this.crosshairVisible = loadSetting(STORAGE_KEYS.crosshairVisible, "1") === "1";
        this.fpsVisible = loadSetting(STORAGE_KEYS.fpsVisible, "1") === "1";
        this.controlsVisible = loadSetting(STORAGE_KEYS.controlsVisible, "1") === "1";
        // Deployable glTF templates, cached and loaded once per asset type - see
        // _drawDeployables(). Instances are shallow clones sharing this geometry/material.
        this._deployableModels = {};

        // Weapon/target marker icon textures, cached and loaded once per icon URL - see
        // _drawMarkers().
        this._markerIconTextures = {};

        // Terrain heights as a float texture, shared by every FOB range band's shader so it
        // can clip the sphere against the ground - see _rebuildTerrainMesh(). Uniform objects
        // are shared (not copied) into each band material, so a terrain rebuild updates them all.
        this._terrainHeightUniforms = {
            uHeightMap: { value: null },
            uGridRes: { value: 1 },
            uTerrainSize: { value: 1 },
        };
        this._fobSphereGeometry = new THREE.SphereGeometry(1, 128, 64); // unit sphere, scaled per band
        this.sunDir = new THREE.Vector3();
        this._minimapForward = new THREE.Vector3();
        this.loadedMapURL = null;
        this._mapLoadChain = null; // see _ensureMapLoaded()
        this._cameraMapURL = null; // map the camera was last placed on - see open()
        this._isOpen = false; // between open() and close() - see refresh()
        this._frameId = null;
        this._onResize = () => this._resize();

        // Rolling counters for the FPS HUD - updated once per FPS_UPDATE_INTERVAL instead
        // of every frame, so the displayed number doesn't flicker.
        this._fpsAccumTime = 0;
        this._fpsAccumFrames = 0;

        // Seconds accumulated since the last actual update+render - see MAX_FPS.
        this._frameCapAccum = 0;

        // Debug left-click raycast (see _setupFlyControls()) - reused every click instead
        // of allocating a new Raycaster each time.
        this._raycaster = new THREE.Raycaster();

        // Cached from the last _loadTerrain(), so a resolution change can resample
        // without re-fetching the heightmap/basemap, and so it knows what to redraw.
        this._heightmapPng = null;
        this._heightScale = 1;
        this._usingLandscapePng = true; // false when the terrain fell back to heightmap.png - see _fetchHeightmap()
        this._terrainTexture = null;
        this._lastLayer = null;
        this._lastActiveMap = null;
        this._lastMinimap = null;

        // Fly-camera movement state, keyed by the action names in KEY_BINDINGS.
        this.move = { forward: false, back: false, left: false, right: false, up: false, down: false };
        this.velocity = new THREE.Vector3();

        // Drag-look fallback for desktop browsers that refuse pointer lock (e.g. the Steam
        // overlay browser) - see _setupFlyControls(). _dragLookMode is set for good on the
        // first pointerlockerror; _dragFlying stands in for controls.isLocked while in it.
        this._dragLookMode = false;
        this._dragFlying = false;
        this._dragging = false; // left button held on the canvas
        this._dragDistance = 0; // px moved since the button went down - tells a click from a drag

        // % of MAX_MOVE_SPEED, adjusted with the scroll wheel while locked.
        this.moveSpeedPercent = 50;
        this._speedHUDTimeout = null;
    }


    /**
     * Opens the simulation for the given map, (re)building the terrain only if the
     * map changed since the last open.
     * @param {object} activeMap - SquadMinimap's activeMap (mapURL, SDK_data.landscapeScale, size)
     * @param {?SquadLayer} layer - the currently selected layer, if any - drives the capzone overlay
     * @param {?object} minimap - SquadMinimap instance, if any - drives the placed weapon/target markers overlay
     * @param {?{firingSolution: object, angleType: string}} [arcRequest] - additionally
     * highlights this exact weapon/target/angle, from the target dialog's "See in 3D"
     * button (squadTargetMarker.js) - see _drawProjectileArcs()
     * @param {?{position: {x: number, y: number, z: number}, target: {x: number, y: number, z: number}}} [sharedPosition] -
     * spawns the camera at this exact world position and facing instead of the usual
     * arc/overview logic, decoded from a "?3d=<token>" share URL (see
     * decodeShareToken(), squadCalc.js's parseUrlIntent()/_openInitial3D(), and the
     * threeDShareButton handler/getShareToken()) - see _spawnCamera()
     * @param {?object} [spawnLatLng] - spawns the camera standing at this Leaflet latlng
     * (EYE_HEIGHT above the ground, facing the map center) instead of the usual
     * arc/overview logic - from the 2D map's own right-click "3D" context menu
     * item (squadContextMenu.js, via App.open3DAt()) - see _spawnCamera()
     */
    async open(activeMap, layer = null, minimap = null, arcRequest = null, sharedPosition = null, spawnLatLng = null) {
        if (!this.renderer) this._initScene();
        this._lastLayer = layer;
        this._lastActiveMap = activeMap;
        this._lastMinimap = minimap;
        this._isOpen = true;

        await this._ensureMapLoaded(activeMap);

        // Closed, or superseded by another open()/refresh() for a different map, while
        // the terrain was loading.
        if (!this._isOpen || this._lastActiveMap !== activeMap) return;

        // Cheap enough to redo every open() - the layer can change independently of the map.
        this._drawLayerOverlays(this._lastLayer, activeMap, this._lastMinimap, arcRequest);
        // The camera is kept across close()/open() - only (re)placed for a different map
        // than it was last placed on, or an explicit spawn request (share link, context
        // menu point, "See in 3D").
        if (this._cameraMapURL !== activeMap.mapURL) {
            this.clickMarker.visible = false;
            this._updateMinimapClickMarker();
        }
        if (arcRequest || sharedPosition || spawnLatLng || this._cameraMapURL !== activeMap.mapURL) {
            this._spawnCamera(activeMap, this._lastMinimap, arcRequest, sharedPosition, spawnLatLng);
            this._cameraMapURL = activeMap.mapURL;
        }

        this.overlay.hidden = false;
        this.menuButton.hidden = true; // orbit mode never hides it on close()
        this._resize();

        // open() can run again while already open (see refresh()) - only start once.
        if (this._frameId === null) {
            window.addEventListener("resize", this._onResize);
            this.clock.getDelta(); // drop the idle time since the last close()
            this._startLoop();
        }
    }


    /**
     * Follows a map/layer change made from the header's selectors while the view is
     * already open. A different map goes through the full open() (terrain reload +
     * camera respawn); the same map only redraws the layer-dependent overlays, leaving
     * the camera where it is.
     * @param {object} activeMap - SquadMinimap's activeMap
     * @param {?SquadLayer} layer - the currently selected layer, if any
     * @param {?object} minimap - SquadMinimap instance
     */
    async refresh(activeMap, layer = null, minimap = null) {
        if (!this._isOpen) return;
        if (this._lastActiveMap !== activeMap) {
            await this.open(activeMap, layer, minimap);
            return;
        }
        this._lastLayer = layer;
        this._lastMinimap = minimap;
        // Same map but its terrain is still loading: the pending open() draws the
        // overlays from _lastLayer/_lastMinimap once it's done (and keeps its own
        // camera spawn, e.g. a "?3d=<token>" shared position).
        if (this.loadedMapURL !== activeMap.mapURL) return;
        this._drawLayerOverlays(layer, activeMap, minimap, null);
    }


    /**
     * Loads the terrain and props/trees for activeMap unless they already are. Loads are
     * chained one after another, so a quick map switch (or a refresh() racing an open())
     * never has two maps' terrain loading into the same scene at once; a queued load
     * whose map has since been switched away from is skipped.
     * @param {object} activeMap
     * @returns {Promise<void>}
     */
    _ensureMapLoaded(activeMap) {
        this._mapLoadChain = (this._mapLoadChain ?? Promise.resolve())
            .catch(() => {}) // a previous failed load mustn't block the next one
            .then(async () => {
                if (this.loadedMapURL === activeMap.mapURL || this._lastActiveMap !== activeMap) return;

                // Covers the still-visible last frame of the previous map (the canvas keeps
                // showing it until the new terrain is actually rendered) while it loads.
                this.loadingScreen.hidden = false;
                this.overlay.hidden = true;
                this.loadedMapURL = null;
                try {
                    await this._loadTerrain(activeMap);
                    await this._loadPropsAndTrees(activeMap);
                    this.loadedMapURL = activeMap.mapURL;
                } finally {
                    this.loadingScreen.hidden = true;
                }
            });
        return this._mapLoadChain;
    }


    /**
     * Draws everything that depends on the layer/placed markers rather than the map itself.
     * @param {?SquadLayer} layer
     * @param {object} activeMap
     * @param {?object} minimap
     * @param {?{firingSolution: object, angleType: string}} arcRequest
     */
    _drawLayerOverlays(layer, activeMap, minimap, arcRequest) {
        this._drawCapzones(layer, activeMap);
        this._drawFlagPath(layer, activeMap);
        this._updateMinimapImage(layer, activeMap);
        this._drawDeployables(layer, activeMap);
        this._drawMarkers(minimap, activeMap);
        this._drawTargetSpreads(minimap, activeMap);
        this._drawProjectileArcs(minimap, activeMap, arcRequest);
    }


    /**
     * Stops rendering. The scene and terrain are kept so reopening the same map is instant.
     */
    close() {
        this._isOpen = false;
        window.removeEventListener("resize", this._onResize);
        this._stopLoop();
        if (!this._orbitMode) this.controls.unlock();
        this._setDragFlying(false);
        this._dragging = false;
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
        // Neutral rather than ACES Filmic: ACES washes out saturated colors, e.g. the
        // click marker's green eye icon came out pale.
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.renderer.toneMappingExposure = 0.85;
        this.container.appendChild(this.renderer.domElement);

        // No shadow mapping - a single hard-shadowed sun is what was making everything
        // look too contrasted; flat lighting (matching the original proof-of-concept) reads
        // better here than a literally-accurate sun/shadow setup.
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
        this.scene.add(this.sunLight);

        // A real HDRI reads far better than the procedural Sky shader did - loaded once
        // and reused as the background for every map/open() since it never changes.
        // Also set as scene.environment, not just .background - every MeshStandardMaterial
        // here (terrain/props/trees) sets its own envMapIntensity expecting real ambient/
        // reflected sky light from this map, which .background alone never provides.
        new RGBELoader().load("/img/sky/skybox.hdr", (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        });
        this.scene.environmentIntensity = 0.5;
        this._updateSun();

        this.capzoneGroup = new THREE.Group();
        this.scene.add(this.capzoneGroup);
        this.labelGroup = new THREE.Group();
        this.scene.add(this.labelGroup);
        this.deployableGroup = new THREE.Group();
        this.scene.add(this.deployableGroup);
        this.markerGroup = new THREE.Group();
        this.scene.add(this.markerGroup);
        this.spreadGroup = new THREE.Group();
        this.scene.add(this.spreadGroup);
        this.arcGroup = new THREE.Group();
        this.scene.add(this.arcGroup);
        this.propsGroup = new THREE.Group();
        this.scene.add(this.propsGroup);
        this.treesGroup = new THREE.Group();
        this.scene.add(this.treesGroup);
        // Left-click ground marker: the ring plus a distance label, replaced on each click.
        this.clickMarker = new THREE.Group();
        this.clickMarker.visible = false;
        this.clickMarker.add(this._createClickMarker());
        this.clickMarkerLabel = null;
        this._clickLabelDistance = null; // rounded meters the label currently shows
        this._clickLabelAccumTime = 0;
        this.scene.add(this.clickMarker);

        this.clock = new THREE.Clock();
        this._orbitMode = IS_TOUCH_DEVICE;
        if (this._orbitMode) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 20000;
            // Just shy of the horizon - keeps the camera from ever orbiting below the
            // target's ground level (there's no "underground" view worth reaching here).
            this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
            // Two-finger pan slides the target across the ground like a map, instead of
            // along the screen plane (which lifts it into the air or sinks it underground
            // when looking at an angle) - see also _keepOrbitTargetOnGround().
            this.controls.screenSpacePanning = false;
        } else {
            this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
        }
        this._setupFlyControls();
    }


    _updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - SUN_ELEVATION);
        const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH);
        this.sunDir.setFromSphericalCoords(1, phi, theta);

        const size = this.terrainSize || 1;
        this.sunLight.position.copy(this.sunDir).multiplyScalar(size * 5);
    }


    _setupFlyControls() {
        this.overlay = this.container.querySelector(".threeDOverlay");
        this.crosshair = this.container.querySelector(".threeDCrosshair");
        this.fpsCounter = this.container.querySelector(".threeDFpsCounter");
        this.fpsValue = this.fpsCounter.querySelector(".threeDFpsValue");
        this.controlsHint = this.container.querySelector(".threeDControlsHint");

        // Touch has no equivalent of pointer-lock-driven mouselook, so OrbitControls
        // drives the camera directly off touch drag/pinch instead - no lock step, and none
        // of PointerLockControls' lock/unlock/Enter-to-lock/wheel-speed wiring applies.
        // The keyboard/mouse controls panel is desktop-only too - its toggle stays in the
        // grid, just disabled.
        if (this._orbitMode) {
            this.container.querySelector(".threeDControlsOption").classList.add("disabled");
            this.container.querySelector(".threeDControlsToggle").disabled = true;
        } else {
            // PointerLockControls dispatches "lock"/"unlock" BEFORE updating its own isLocked
            // flag, so reading this.controls.isLocked from inside these listeners would still
            // see the previous (stale) state - the locked/unlocked value is passed explicitly
            // instead of relying on it.
            this.controls.addEventListener("lock", () => { this.overlay.hidden = true; this._updateCrosshairVisibility(true); });
            this.controls.addEventListener("unlock", () => { this.overlay.hidden = false; this._updateCrosshairVisibility(false); });

            // Some desktop browsers (e.g. the Steam overlay browser) refuse pointer lock
            // outright. Fall back to drag-look for the rest of the session: WASD still
            // flies, but looking around means holding left click and dragging, with the
            // cursor left visible. The Go click that triggered this starts flying right away.
            // Newer browsers also reject requestPointerLock()'s promise - see _startFlying();
            // this event covers older ones where it returns nothing.
            document.addEventListener("pointerlockerror", () => this._enableDragLook());
            this._setupDragLook();
        }

        // Left-click while flying raycasts from the crosshair (screen center) straight
        // down the camera's view direction - or from the cursor in drag-look mode, where
        // the cursor stays visible and the crosshair is hidden.
        this.renderer.domElement.addEventListener("click", (event) => {
            if (!this.isFlying()) return;
            if (this._dragLookMode && this._dragDistance > DRAG_CLICK_THRESHOLD) return; // end of a drag-look, not a click
            this._setRayFromEvent(event);

            // Tier 1: capzone-only hit test. Capzones are semi-transparent/always-visible
            // (unlike 2D's hover-only reveal) and have no occlusion concept in 2D either,
            // so restrict the test to capzoneGroup instead of the full scene - a tree/prop
            // mesh sitting in front of a capzone must not be able to eat the click.
            const capHit = this._raycaster.intersectObjects(this.capzoneGroup.children, true)[0];
            if (capHit) {
                const objective = capHit.object.userData.objective ?? capHit.object.parent?.userData.objective;
                const flag = this._lastLayer?.flags.find((f) => f.objCluster === objective);
                if (flag && this._lastLayer._handleFlagClick(flag)) {
                    this._drawCapzones(this._lastLayer, this._lastActiveMap);
                    this._drawFlagPath(this._lastLayer, this._lastActiveMap);
                }
                return;
            }

            // Tier 2: anything else drops the click marker on the first building, tree or
            // ground point under the click, labelled with its straight-line distance from
            // the camera (world units are meters). The ground comes from a heightmap march and
            // buildings/trees are only tested up to it - a plain full-scene raycast tests
            // every terrain/prop triangle and stalls the frame. Clicking the sky removes it.
            const ray = this._raycaster.ray;
            const groundDistance = this._rayTerrainDistance(ray);
            const objectDistance = this._rayObjectDistance(groundDistance ?? this.terrainSize * 2);
            const distance = objectDistance ?? groundDistance;
            if (distance === null) {
                this.clickMarker.visible = false;
                this._updateMinimapClickMarker();
                return;
            }
            ray.at(distance, this.clickMarker.position);
            this._setClickMarkerLabel(distance);
            this.clickMarker.visible = true;
            this._updateMinimapClickMarker();
        });

        // Right-click while flying removes the eye marker, or deletes the right-click map
        // marker (FOB, HAB, vehicle...) under the crosshair/cursor - the latter through the 2D marker's own delete(), so undo history
        // and the session stay in sync. mousedown rather than contextmenu: under pointer
        // lock the browser doesn't reliably fire contextmenu.
        this.renderer.domElement.addEventListener("contextmenu", (event) => event.preventDefault());
        this.renderer.domElement.addEventListener("mousedown", (event) => {
            if (event.button !== 2 || !this.isFlying()) return;
            this._setRayFromEvent(event);

            // The eye marker draws on top of everything (depthTest off), so it's
            // removable wherever it's visible - no ground occlusion check.
            if (this.clickMarker.visible && this._raycaster.intersectObject(this.clickMarker, true).length) {
                this.clickMarker.visible = false;
                this._updateMinimapClickMarker();
                return;
            }

            // Raycasts ignore `visible` - hidden markers must not be deletable.
            if (!this.markerGroup.visible) return;
            // Sprites ignore the terrain, so a marker hidden behind a hill must not be hit.
            const groundDistance = this._rayTerrainDistance(this._raycaster.ray) ?? Infinity;
            const hit = this._raycaster.intersectObjects(this.markerGroup.children, false)
                .find((h) => h.object.userData.stratMarker && h.distance < groundDistance);
            if (!hit) return;
            hit.object.userData.stratMarker.delete();
            this.markerGroup.remove(hit.object);
            hit.object.material.dispose();
            for (const band of hit.object.userData.rangeBands ?? []) {
                this.markerGroup.remove(band);
                band.material.dispose();
            }
        });

        const goButton = this.container.querySelector(".threeDGoButton");
        // OrbitControls needs no lock step - it's already live off touch input, so Go just
        // dismisses the start card. With no Esc on touch, the menu button brings it back.
        goButton.addEventListener("click", () => this._startFlying());

        this.menuButton = this.container.querySelector(".threeDMenuButton");
        this.menuButton.addEventListener("click", () => this._backToMenu());

        this.speedHUD = this.container.querySelector(".threeDSpeedHUD");
        this.speedHUDFill = this.speedHUD.querySelector(".threeDSpeedHUDFill");
        this.speedHUDValue = this.speedHUD.querySelector(".threeDSpeedHUDValue");

        const options = this.container.querySelector(".threeDOverlayOptions");

        // Toggles restore a persisted value into `checked`, but that alone doesn't apply
        // it - unlike textureName (read straight from `this.textureName` whenever the
        // terrain next loads), visibility is only ever applied inside these
        // setters, so a persisted "off" needs an explicit call here too.
        const capzonesToggle = options.querySelector(".threeDCapzonesToggle");
        capzonesToggle.checked = this.capzonesVisible;
        this._setCapzonesVisible(this.capzonesVisible);
        capzonesToggle.addEventListener("change", () => this._setCapzonesVisible(capzonesToggle.checked));

        this.minimap = this.container.querySelector(".threeDMinimap");
        const minimapToggle = options.querySelector(".threeDMinimapToggle");
        minimapToggle.checked = this.minimapVisible;
        this._setMinimapVisible(this.minimapVisible);
        minimapToggle.addEventListener("change", () => this._setMinimapVisible(minimapToggle.checked));

        const pathToggle = options.querySelector(".threeDPathToggle");
        pathToggle.checked = this.pathVisible;
        pathToggle.addEventListener("change", () => this._setPathVisible(pathToggle.checked));

        const arcsToggle = options.querySelector(".threeDArcsToggle");
        arcsToggle.checked = this.arcsVisible;
        this._setArcsVisible(this.arcsVisible);
        arcsToggle.addEventListener("change", () => this._setArcsVisible(arcsToggle.checked));

        const markersToggle = options.querySelector(".threeDMarkersToggle");
        markersToggle.checked = this.markersVisible;
        this._setMarkersVisible(this.markersVisible);
        markersToggle.addEventListener("change", () => this._setMarkersVisible(markersToggle.checked));

        const treesToggle = options.querySelector(".threeDTreesToggle");
        treesToggle.checked = this.treesVisible;
        this._setTreesVisible(this.treesVisible);
        treesToggle.addEventListener("change", () => this._setTreesVisible(treesToggle.checked));

        const propsToggle = options.querySelector(".threeDPropsToggle");
        propsToggle.checked = this.propsVisible;
        this._setPropsVisible(this.propsVisible);
        propsToggle.addEventListener("change", () => this._setPropsVisible(propsToggle.checked));

        const crosshairToggle = options.querySelector(".threeDCrosshairToggle");
        crosshairToggle.checked = this.crosshairVisible;
        this._setCrosshairVisible(this.crosshairVisible);
        crosshairToggle.addEventListener("change", () => this._setCrosshairVisible(crosshairToggle.checked));

        const fpsToggle = options.querySelector(".threeDFpsToggle");
        fpsToggle.checked = this.fpsVisible;
        this._setFpsVisible(this.fpsVisible);
        fpsToggle.addEventListener("change", () => this._setFpsVisible(fpsToggle.checked));

        const controlsToggle = options.querySelector(".threeDControlsToggle");
        controlsToggle.checked = this.controlsVisible;
        this._setControlsVisible(this.controlsVisible);
        controlsToggle.addEventListener("change", () => this._setControlsVisible(controlsToggle.checked));
        const textureSelect = options.querySelector(".threeDTextureSelect");
        textureSelect.value = this.textureName;
        // select2 rather than the native dropdown - the browser draws a native option
        // list itself, so its hover highlight can't be restyled. select2 fires its
        // change through jQuery, which native addEventListener() listeners never see.
        $(textureSelect).select2({
            dropdownCssClass: "threeDSelectDropdown",
            dropdownParent: $(this.container), // not the card - its mobile overflow would clip it
            minimumResultsForSearch: -1,
            width: "12em",
        }).on("change", async () => {
            await this._setTexture(textureSelect.value);
            // reverts the dropdown on load failure
            $(textureSelect).val(this.textureName).trigger("change.select2");
        });

        window.addEventListener("keydown", (event) => {
            const action = KEY_BINDINGS[event.code];
            if (action) {
                if (this.isFlying()) event.preventDefault();
                this.move[action] = true;
                return;
            }

            // Esc never closes the 3D view - only the Quit button does. Drag-look has no
            // browser-handled lock to release, so Esc toggles between flying and the
            // settings card here. With pointer lock, the browser spends the Esc that
            // leaves flying itself, and won't let an Esc press re-lock (Esc doesn't count
            // as a user gesture) - Enter or Go resume flying there instead.
            if (event.code === "Escape" && this._dragLookMode && this._isOpen) {
                // Esc in a select2 dropdown on the card just closes that dropdown.
                if (!this._dragFlying && event.target.closest?.(".select2-container, input, textarea, select")) return;
                this._setDragFlying(!this._dragFlying);
                return;
            }

            // Enter takes control from the settings card, like clicking Go, but only
            // while the 3D view is actually open - this listener stays registered
            // for the app's whole lifetime, not just while it's shown. Not applicable
            // in orbit mode - controls.lock() doesn't exist on OrbitControls. Also skipped
            // while typing in a header select2 search box, which now sits on top of the view.
            if (!this._orbitMode && !this.isFlying() && (event.code === "Enter" || event.code === "NumpadEnter")
                && this._isOpen && !event.target.closest?.("input, textarea, select")) {
                event.preventDefault();
                this._startFlying();
            }
        });
        window.addEventListener("keyup", (event) => {
            const action = KEY_BINDINGS[event.code];
            if (action) this.move[action] = false;
        });

        // Mouse wheel adjusts move speed while flying, instead of zooming.
        window.addEventListener("wheel", (event) => {
            if (!this.isFlying()) return;
            event.preventDefault();
            if (this.moveSpeedPercent === 1) this.moveSpeedPercent = 0; // since min is 1 we avoid speed being 6/11/16...
            this.moveSpeedPercent = THREE.MathUtils.clamp(this.moveSpeedPercent - event.deltaY * 0.05, 1, 100);
            this._showSpeedHUD();
        }, { passive: false });
    }


    /**
     * Whether the fly camera is live (start card dismissed) - pointer-locked, or flying
     * in the drag-look fallback. Always false in orbit mode (OrbitControls has no isLocked).
     * @returns {boolean}
     */
    /**
     * Points _raycaster from the crosshair (screen center), or from the cursor in
     * drag-look mode, where the cursor stays visible and the crosshair is hidden.
     * @param {MouseEvent} event
     */
    _setRayFromEvent(event) {
        if (this._dragLookMode) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            _cursorNdc.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1,
            );
            this._raycaster.setFromCamera(_cursorNdc, this.camera);
        } else {
            this._raycaster.setFromCamera(_screenCenter, this.camera);
        }
    }


    isFlying() {
        return Boolean(this.controls?.isLocked) || this._dragFlying;
    }


    /**
     * Go button / Enter: dismisses the start card and hands control to the camera.
     */
    _startFlying() {
        if (this._orbitMode) {
            this.overlay.hidden = true;
            this.menuButton.hidden = false;
            return;
        }
        if (this._dragLookMode) {
            this._setDragFlying(true);
            return;
        }

        // Calls requestPointerLock() directly rather than controls.lock(), which drops its
        // promise - a refused lock would then log an uncaught rejection. A missing or
        // throwing requestPointerLock never fires pointerlockerror, so it's caught here too.
        const canvas = this.renderer.domElement;
        if (typeof canvas.requestPointerLock !== "function") {
            this._enableDragLook();
            return;
        }
        try {
            canvas.requestPointerLock({ unadjustedMovement: false })?.catch?.(() => this._enableDragLook());
        } catch {
            this._enableDragLook();
        }
    }


    /**
     * Menu button: brings the start card back. Only shown in orbit mode (touch, no Esc)
     * and the drag-look fallback (no pointer lock to release).
     */
    _backToMenu() {
        if (this._orbitMode) {
            this.overlay.hidden = false;
            this.menuButton.hidden = true;
            return;
        }
        this._setDragFlying(false);
    }


    /**
     * Switches to the drag-look fallback for the rest of the session and starts flying -
     * called on any pointer-lock failure (see _startFlying()). Safe to call twice, as a
     * refused lock both rejects the promise and fires pointerlockerror.
     */
    _enableDragLook() {
        if (!this._isOpen) return;
        this._dragLookMode = true;
        this._setDragFlying(true);
    }


    /**
     * Drag-look fallback's equivalent of PointerLockControls' lock/unlock.
     * @param {boolean} active
     */
    _setDragFlying(active) {
        if (!this._dragLookMode) return;
        this._dragFlying = active;
        this.overlay.hidden = active;
        this.menuButton.hidden = !active;
        this._updateCrosshairVisibility(active);
    }


    /**
     * Drag-look fallback mouselook: holding left click on the canvas and dragging turns
     * the camera, the same way PointerLockControls does off pointer-locked mouse deltas
     * (same pointerSpeed/pitch limits). Chromium still reports movementX/Y without a
     * lock, the cursor just stays visible and can hit the screen edge.
     */
    _setupDragLook() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener("pointerdown", (event) => {
            if (!this._dragFlying || event.button !== 0) return;
            this._dragging = true;
            this._dragDistance = 0;
            canvas.setPointerCapture(event.pointerId); // keep receiving moves if the cursor leaves the canvas
        });

        canvas.addEventListener("pointermove", (event) => {
            if (!this._dragging) return;
            this._dragDistance += Math.abs(event.movementX) + Math.abs(event.movementY);

            const { pointerSpeed, minPolarAngle, maxPolarAngle } = this.controls;
            _lookEuler.setFromQuaternion(this.camera.quaternion);
            _lookEuler.y -= event.movementX * 0.002 * pointerSpeed;
            _lookEuler.x -= event.movementY * 0.002 * pointerSpeed;
            _lookEuler.x = THREE.MathUtils.clamp(_lookEuler.x, Math.PI / 2 - maxPolarAngle, Math.PI / 2 - minPolarAngle);
            this.camera.quaternion.setFromEuler(_lookEuler);
        });

        const endDrag = () => { this._dragging = false; };
        canvas.addEventListener("pointerup", endDrag);
        canvas.addEventListener("pointercancel", endDrag);
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
        if (!this.isFlying()) return;

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
        this.minimapImage.src = `${base}basemap.webp`; // instant placeholder while the map loads - see open()'s _updateMinimapImage()

        // Single-layer maps only ship basemap.webp - fall back to it rather than failing
        // the whole load when the saved texture is topomap/terrainmap.
        const loader = new THREE.TextureLoader();
        const [heightBuffer, texture] = await Promise.all([
            this._fetchHeightmap(base),
            loader.loadAsync(`${base}${this.textureName}.webp`).catch((error) => {
                if (this.textureName === "basemap") throw error;
                console.warn(`[3D] No ${this.textureName}.webp for this map, using basemap`);
                return loader.loadAsync(`${base}basemap.webp`);
            }),
        ]);
        texture.colorSpace = THREE.SRGBColorSpace;
        this._heightScale = this._landscapeCalibration(activeMap).heightScale;

        this._heightmapPng = decode(new Uint8Array(heightBuffer));
        this._terrainTexture = texture;

        // Real-world map size (meters) - the heightmap's own pixel resolution can differ
        // from it, so the grid is sampled to fit this footprint rather than the PNG's.
        this.terrainSize = activeMap.size ?? this._heightmapPng.width;
        this._updateSun();
        this._rebuildTerrainMesh();

    }


    /**
     * Fetches the terrain heightmap - the dedicated 3d/landscape.png when the map has one,
     * otherwise the 2D heightmap.png (squadHeightmaps.js's source; e.g. modded maps that
     * never got a landscape export). fetch() doesn't reject on a 404, so response.ok is
     * checked explicitly - decoding the server's error page is what used to throw
     * "wrong PNG signature". Records which one was used in _usingLandscapePng, so
     * _landscapeCalibration() picks the matching height calibration.
     * @param {string} base - API_URL + the map's mapURL
     * @returns {Promise<ArrayBuffer>}
     */
    async _fetchHeightmap(base) {
        const landscape = await fetch(`${base}3d/landscape.png`);
        if (landscape.ok) {
            this._usingLandscapePng = true;
            return landscape.arrayBuffer();
        }

        console.debug(`[3D] No 3d/landscape.png for this map (HTTP ${landscape.status}), falling back to heightmap.png`);
        const heightmap = await fetch(`${base}heightmap.png`);
        if (!heightmap.ok) throw new Error(`[3D] Failed to load heightmap.png (HTTP ${heightmap.status})`);
        this._usingLandscapePng = false;
        return heightmap.arrayBuffer();
    }


    /**
     * Loads a map's real building/wall geometry (props.bin) and tree/vegetation/generic-
     * building-placeholder instances (trees.bin) - see squad3DProps.js/squad3DTrees.js.
     * Only reloaded when the map itself changes (see open()), same as the terrain -
     * unlike capzones/deployables/flag-path, props/trees are map-level static geometry,
     * not per-layer.
     *
     * Both files ship positions in real absolute-meters - the same frame as
     * activeMap.SDK_data.minimap.corner0/zOffset (and squadLayer.js's location_x/
     * location_y/location_z, divided by 100), not yet shifted into this simulation's
     * centered/landscape-relative world space. Every vertex/instance in a given file
     * needs the exact same offset, so rather than transforming each one individually
     * (like _gameToWorldXZ() does per deployable/capzone shape), it's simplest to just
     * position each returned group once - same math as _gameToWorldXZ()'s tail end
     * (corner0-relative, then centered by half the terrain footprint) plus the same
     * absolute-to-landscape-relative height shift _calibrateZOffset() applies.
     * @param {object} activeMap
     */
    async _loadPropsAndTrees(activeMap) {
        for (const group of [this.propsGroup, this.treesGroup]) {
            group.children.forEach((mesh) => {
                mesh.geometry.dispose();
                mesh.material.dispose();
            });
            group.clear();
        }

        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!corner0) return;

        const mapBase = `${process.env.API_URL}${activeMap.mapURL}`;
        const [propMeshes, { vegetation, structures }] = await Promise.all([
            loadProps(mapBase),
            loadTrees(mapBase),
        ]);

        // The map (or the view) may have changed while this was loading.
        if (this._lastActiveMap !== activeMap) return;

        const zOffsetM = this._landscapeCalibration(activeMap).zOffsetM ?? 0;
        this.propsGroup.position.set(-corner0[0] - this.terrainSize / 2, -zOffsetM, -corner0[1] - this.terrainSize / 2);
        this.treesGroup.position.copy(this.propsGroup.position);

        // structures (trees.bin's generic box/house/lshape/etc building placeholders) join
        // props.bin's real buildings under propsGroup, so "show buildings" and "show
        // trees" each control only what they say - see loadTrees()'s own comment.
        propMeshes.forEach((mesh) => this.propsGroup.add(mesh));
        structures.forEach((mesh) => this.propsGroup.add(mesh));
        vegetation.forEach((mesh) => this.treesGroup.add(mesh));
    }


    /**
     * Places the camera - on open() for a new map or an explicit spawn request, otherwise
     * the camera stays where it was left (see open()). A sharedPosition (decoded from a "?3d=<token>"
     * URL - see decodeShareToken()/getShareToken()) takes priority over everything else -
     * it's an explicit request for this exact spot and facing, not a default to fall back
     * on. A spawnLatLng (the 2D map's right-click "3D" context menu item) comes next -
     * also an explicit request, standing EYE_HEIGHT above the ground at that point, facing
     * the map center. Then an arcRequest (the "See in 3D" button) spawns on the map-center
     * side of the arc's target, WEAPON_SPAWN_DISTANCE above the ground and as far back
     * towards the center (an exact 45-degree down angle), looking at it. Falls back to a
     * plain overview 200m above the map's center, facing north, when none of the above apply.
     * @param {object} activeMap
     * @param {?object} minimap - SquadMinimap instance, if any
     * @param {?{firingSolution: object, angleType: string}} [arcRequest]
     * @param {?{position: {x: number, y: number, z: number}, target: {x: number, y: number, z: number}}} [sharedPosition]
     * @param {?object} [spawnLatLng] - Leaflet latlng, from the "3D" context menu item
     */
    _spawnCamera(activeMap, minimap, arcRequest = null, sharedPosition = null, spawnLatLng = null) {
        if (sharedPosition) {
            const { position, target } = sharedPosition;
            this.camera.position.set(position.x, position.y, position.z);
            const targetVec = new THREE.Vector3(target.x, target.y, target.z);
            this.camera.lookAt(targetVec);
            if (this._orbitMode) { this.controls.target.copy(targetVec); this.controls.update(); }
            return;
        }

        const corner0 = activeMap.SDK_data?.minimap?.corner0;

        if (spawnLatLng && corner0) {
            const { x, z, u, v } = this._latLngToWorldXZ(spawnLatLng.lat, spawnLatLng.lng, minimap, corner0);
            const eyeY = this.terrainHeightAt(u, v) + EYE_HEIGHT;
            this.camera.position.set(x, eyeY, z);

            // Face the map center, at eye level (not looking down) - same horizontal
            // direction _spawnCamera()'s focus-point branch uses, just leveled off.
            const toCenter = new THREE.Vector2(-x, -z);
            if (toCenter.lengthSq() < 1) toCenter.set(0, -1);
            toCenter.normalize();

            const target = new THREE.Vector3(x + toCenter.x, eyeY, z + toCenter.y);
            this.camera.lookAt(target);
            if (this._orbitMode) { this.controls.target.copy(target); this.controls.update(); }
            return;
        }

        const focusLatLng = arcRequest?.firingSolution.targetLatLng;

        if (focusLatLng && corner0) {
            const { x, z, u, v } = this._latLngToWorldXZ(focusLatLng.lat, focusLatLng.lng, minimap, corner0);
            const groundY = this.terrainHeightAt(u, v);

            // Horizontal direction from the focus point towards the map's center (world
            // origin) - the camera sits WEAPON_SPAWN_DISTANCE along it, and the same
            // distance above ground, so the vertical and horizontal offsets from it
            // match (45 degrees down).
            const toCenter = new THREE.Vector2(-x, -z);
            if (toCenter.lengthSq() < 1) toCenter.set(0, -1);
            toCenter.normalize();

            this.camera.position.set(
                x + toCenter.x * WEAPON_SPAWN_DISTANCE,
                groundY + WEAPON_SPAWN_DISTANCE,
                z + toCenter.y * WEAPON_SPAWN_DISTANCE
            );
            const target = new THREE.Vector3(x, groundY + MARKER_WORLD_SIZE / 2, z);
            this.camera.lookAt(target);
            if (this._orbitMode) { this.controls.target.copy(target); this.controls.update(); }
            return;
        }

        // Drop the camera 200m above the map's center, facing north, instead of at eye
        // height or a far-away overview - high enough to get a lay of the land right away
        // without clipping into terrain on a hilly map.
        const groundY = this.terrainHeightAt(0.5, 0.5);
        if (this._orbitMode) {
            // Same offset horizontally as vertically (45 degrees down), like the focus-point
            // case above - orbiting a target with zero horizontal camera offset (looking
            // straight down) sits right on OrbitControls' polar singularity.
            this.camera.position.set(0, groundY + 200, 200);
            const target = new THREE.Vector3(0, groundY, 0);
            this.camera.lookAt(target);
            this.controls.target.copy(target);
            this.controls.update();
        } else {
            this.camera.position.set(0, groundY + 200, 0);
            this.camera.lookAt(0, groundY + 200, -1);
        }
    }


    /**
     * A compact opaque token (see decodeShareToken()) encoding the current camera position
     * and a look-at point 100m ahead of it along its current facing, for the
     * threeDShareButton (squadCalc.js) to put in a "?3d=<token>" URL.
     * @returns {string}
     */
    getShareToken() {
        const direction = this.camera.getWorldDirection(new THREE.Vector3());
        const target = this.camera.position.clone().addScaledVector(direction, 100);
        return encodeShareToken(this.camera.position, target);
    }


    /**
     * World X/Z (plus the (u, v) fraction terrainHeightAt() takes) for a Leaflet
     * lat/lng - the inverse of squadLayer.js's convertToLatLng(), using the minimap's
     * own scale factors since offset_x/offset_y there always equal corner0 * 100 (see
     * getLayerOffsets()), so no layer reference is needed here.
     * @param {number} lat
     * @param {number} lng
     * @param {object} minimap - SquadMinimap instance
     * @param {[number, number]} corner0 - activeMap.SDK_data.minimap.corner0
     * @returns {{x: number, z: number, u: number, v: number}}
     */
    _latLngToWorldXZ(lat, lng, minimap, corner0) {
        const locationX = (corner0[0] + lng / minimap.gameToMapScale) * 100;
        const locationY = (corner0[1] - lat / minimap.gameToMapScaleY) * 100;
        return this._gameToWorldXZ(locationX, locationY, corner0);
    }


    /**
     * World X/Z (plus the (u, v) fraction terrainHeightAt() takes) for a placed weapon
     * or target marker.
     * @param {object} marker - a Leaflet marker, from minimap.activeWeaponsMarkers/activeTargetsMarkers
     * @param {object} minimap - SquadMinimap instance
     * @param {[number, number]} corner0 - activeMap.SDK_data.minimap.corner0
     * @returns {{x: number, z: number, u: number, v: number}}
     */
    _markerWorldPosition(marker, minimap, corner0) {
        const { lat, lng } = marker.getLatLng();
        return this._latLngToWorldXZ(lat, lng, minimap, corner0);
    }


    /**
     * Points the minimap image at the selected layer's own thumbnail (the same one the
     * layer-info dialog uses) instead of the bare map basemap, so the minimap actually
     * shows the flags/capzones for that layer. Falls back to the basemap with no layer.
     * @param {?SquadLayer} layer
     * @param {object} activeMap
     */
    _updateMinimapImage(layer, activeMap) {
        this.minimapImage.src = layer?.layerData?.rawName
            ? `${process.env.API_URL}/img/thumbnails/${encodeURIComponent(layer.layerData.rawName)}.webp`
            : `${process.env.API_URL}${activeMap.mapURL}basemap.webp`;
    }


    /**
     * (Re)builds the terrain mesh from the cached decoded heightmap/texture at
     * gridResolution, without touching the camera - see _loadTerrain().
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
        this.scene.add(this.terrainMesh);

        this._terrainHeightUniforms.uHeightMap.value?.dispose();
        const heightTexture = new THREE.DataTexture(this.heights, this.gridResolution, this.gridResolution, THREE.RedFormat, THREE.FloatType);
        heightTexture.needsUpdate = true;
        this._terrainHeightUniforms.uHeightMap.value = heightTexture;
        this._terrainHeightUniforms.uGridRes.value = this.gridResolution;
        this._terrainHeightUniforms.uTerrainSize.value = this.terrainSize;
    }


    /**
     * Switches the terrain surface texture (e.g. basemap <-> topomap), fetching it fresh -
     * a different texture is a different file. The minimap keeps using basemap
     * regardless, for consistent navigation.
     * @param {string} name - "basemap" | "topomap" | "terrainmap"
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
        localStorage.setItem(STORAGE_KEYS.textureName, name);
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
        localStorage.setItem(STORAGE_KEYS.capzonesVisible, visible ? "1" : "0");
        this.capzoneGroup.visible = visible;
        this.labelGroup.visible = visible;
    }


    /**
     * Shows/hides the bottom-right minimap (basemap + camera dot).
     * @param {boolean} visible
     */
    _setMinimapVisible(visible) {
        this.minimapVisible = visible;
        localStorage.setItem(STORAGE_KEYS.minimapVisible, visible ? "1" : "0");
        this.minimap.hidden = !visible;
    }


    /**
     * Shows/hides the fixed AAS/Seed/Skirmish flag-order path.
     * @param {boolean} visible
     */
    _setPathVisible(visible) {
        this.pathVisible = visible;
        localStorage.setItem(STORAGE_KEYS.pathVisible, visible ? "1" : "0");
        if (this.pathLine) this.pathLine.visible = visible;
    }


    /**
     * Shows/hides the weapon-to-target projectile arcs (see _drawProjectileArcs()).
     * @param {boolean} visible
     */
    _setArcsVisible(visible) {
        this.arcsVisible = visible;
        localStorage.setItem(STORAGE_KEYS.arcsVisible, visible ? "1" : "0");
        this.arcGroup.visible = visible;
    }


    /**
     * Shows/hides the weapon, target and right-click map markers (see _drawMarkers()).
     * @param {boolean} visible
     */
    _setMarkersVisible(visible) {
        this.markersVisible = visible;
        localStorage.setItem(STORAGE_KEYS.markersVisible, visible ? "1" : "0");
        this.markerGroup.visible = visible;
    }


    /**
     * Shows/hides the tree/vegetation/generic-placeholder instances (see
     * squad3DTrees.js's loadTrees()).
     * @param {boolean} visible
     */
    _setTreesVisible(visible) {
        this.treesVisible = visible;
        localStorage.setItem(STORAGE_KEYS.treesVisible, visible ? "1" : "0");
        this.treesGroup.visible = visible;
    }


    /**
     * Shows/hides the real baked building/wall/etc prop geometry (see squad3DProps.js's
     * loadProps()).
     * @param {boolean} visible
     */
    _setPropsVisible(visible) {
        this.propsVisible = visible;
        localStorage.setItem(STORAGE_KEYS.propsVisible, visible ? "1" : "0");
        this.propsGroup.visible = visible;
    }


    /**
     * Shows/hides the center crosshair. Only actually shown while flying (pointer-locked)
     * even when enabled - see _updateCrosshairVisibility().
     * @param {boolean} visible
     */
    _setCrosshairVisible(visible) {
        this.crosshairVisible = visible;
        localStorage.setItem(STORAGE_KEYS.crosshairVisible, visible ? "1" : "0");
        this._updateCrosshairVisibility();
    }


    /**
     * Shows/hides the bottom-left keyboard/mouse controls panel - flying or on the
     * settings card alike, but never in touch (orbit) mode, which has none of them.
     * @param {boolean} visible
     */
    _setControlsVisible(visible) {
        this.controlsVisible = visible;
        localStorage.setItem(STORAGE_KEYS.controlsVisible, visible ? "1" : "0");
        this.controlsHint.hidden = !visible || this._orbitMode;
    }


    /**
     * Applies crosshairVisible together with the pointer-lock state - the crosshair only
     * makes sense while actually flying, not over the start menu. Always hidden in the
     * drag-look fallback, where clicks aim with the visible cursor instead.
     * @param {boolean} [locked] - defaults to isFlying(); the "lock"/"unlock"
     * listeners pass it explicitly instead, since PointerLockControls dispatches those
     * events before updating isLocked itself.
     */
    _updateCrosshairVisibility(locked = this.isFlying()) {
        this.crosshair.hidden = !(this.crosshairVisible && locked && !this._dragLookMode);
    }


    /**
     * Shows/hides the top-left FPS counter.
     * @param {boolean} visible
     */
    _setFpsVisible(visible) {
        this.fpsVisible = visible;
        localStorage.setItem(STORAGE_KEYS.fpsVisible, visible ? "1" : "0");
        this.fpsCounter.hidden = !visible;
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

        // A flag that's "capped" - confirmed/selected in the lane solver's route, same
        // SquadObjective.isSelected the 2D map renders with its "flag selected" style -
        // turns green instead of the generic cyan.
        const selectedBoxMaterial = new THREE.MeshBasicMaterial({
            color: 0x22aa44, transparent: true, opacity: 0.28, depthWrite: false
        });
        const selectedEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x22aa44, transparent: true, opacity: 0.35 });

        // location_z is the box's real (Unreal-absolute) height, but each map's landscape
        // sits at a different absolute world Z, and our decoded heightmap is relative to
        // that landscape's own local origin - so the two datums are offset by a per-map
        // constant, applied to every box so real relative heights (tunnels, half-buried
        // zones) stay intact instead of forcing everything onto the visible ground.
        const zOffset = this._calibrateZOffset(layer, activeMap, corner0);

        for (const objective of this._flattenObjectivePoints(layer)) {
            const objectivePos = this._gameToWorldXZ(objective.location_x, objective.location_y, corner0);
            const isMain = objective.name === "Main";
            const isSelected = !isMain && layer.selectedFlags.some((flag) => flag.objCluster === objective);

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

                const boxMat = isMain ? mainBoxMaterial : isSelected ? selectedBoxMaterial : boxMaterial;
                const edgeMat = isMain ? mainEdgeMaterial : isSelected ? selectedEdgeMaterial : edgeMaterial;
                const mesh = new THREE.Mesh(geometry, boxMat);
                mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMat));
                // Back-reference for the click-to-select raycast in _setupFlyControls().
                mesh.userData.objective = objective;
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
            const labelBg = isMain ? "rgba(0, 0, 205, 0.7)" : isSelected ? "rgba(34, 170, 68, 0.7)" : undefined;
            const label = this._createLabelSprite(this._objectiveLabelText(objective), labelBg, labelWorldHeight);
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
     * the team told apart by objectName, same as squadObjective.js - not pointPosition,
     * which is the main's slot in the flag order (Team 2's is flag count + 1, e.g. 7).
     * Everything else already has a proper name.
     * @param {object} objective
     * @returns {string}
     */
    _objectiveLabelText(objective) {
        if (objective.name === "Main") return `Team ${objective.objectName === "00-Team1 Main" ? 1 : 2} Main`;
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
     * The map's own real absolute-meters height calibration - landscapeScale[2] (meters
     * per decoded heightmap unit) and zOffset (meters to add to a decoded height sample
     * to recover real absolute Unreal Z). Prefers the map's own SDK_data.landscape3D entry -
     * calibrated specifically against landscape.png, this simulation's own terrain source -
     * over the top-level SDK_data one (calibrated against heightmap.png, the source
     * squadHeightmaps.js's 2D height-difference calc still uses) whenever a map has both;
     * falls back to the top-level values for a map without its own landscape3D entry yet
     * (see src/data/maps.js), or whenever the terrain itself fell back to heightmap.png
     * (see _fetchHeightmap()) - landscape3D's values would be wrong for that file.
     * @param {object} activeMap
     * @returns {{heightScale: number, zOffsetM: ?number}}
     */
    _landscapeCalibration(activeMap) {
        const sdk = activeMap.SDK_data;
        const landscape3D = this._usingLandscapePng ? sdk?.landscape3D : null;
        return {
            heightScale: landscape3D?.landscapeScale?.[2] ?? sdk?.landscapeScale?.[2] ?? 1,
            zOffsetM: landscape3D?.zOffset ?? sdk?.zOffset,
        };
    }


    /**
     * The per-map constant that aligns location_z's absolute datum with our decoded
     * heightmap's landscape-relative one (see _drawCapzones()).
     *
     * The heightmap encoding is normalized per map (its lowest scanned point is always
     * raw height 0), so it has no idea what that point's real absolute world Z is -
     * that's exactly what _landscapeCalibration() carries (the exporter's own
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
        const zOffsetM = this._landscapeCalibration(activeMap).zOffsetM;
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
     * The physical flags currently "in play" - one entry per flag (each with its own
     * .objects[] and location_x/y/z), sourced from layer.flags instead of raw
     * layer.objectives so the 3D view matches whatever the 2D map is currently showing:
     * - layer.flags already has exactly one SquadObjective per physical flag, for every
     *   gamemode - squadLayer.js's initRandomizedLayer() merges same-location RAAS/
     *   Invasion candidates from different clusters into one flag via addCluster()
     *   instead of creating duplicates, so no location-based dedup is needed here anymore.
     * - flags the lane solver has ruled out (SquadObjective.isHidden, toggled by
     *   applySolverResult() as the user confirms a route) are skipped, same as the 2D map.
     * - flag.objCluster is a direct reference to the same raw point/objective object this
     *   method used to read straight from layer.objectives (location_x/y/z, .objects[],
     *   name, objectDisplayName, pointPosition) - every existing caller keeps working
     *   unchanged.
     * - createMainObjective() pushes into layer.flags for every gamemode (AAS, RAAS/
     *   Invasion, TC, Destruction, GLOP, TDM), so mains no longer need the separate
     *   capturePoints.points.objectives branch this method used to have for TC/Destruction.
     * @param {SquadLayer} layer
     * @returns {object[]}
     */
    _flattenObjectivePoints(layer) {
        return (layer.flags ?? [])
            .filter((flag) => !flag.isHidden)
            .map((flag) => flag.objCluster);
    }


    /**
     * Draws the flag-order path as one or more chains of translucent 5m-diameter cylinder
     * segments, floating just under each flag's label height:
     * - AAS/Seed/Skirmish ("predictive") layers have a fixed order, always fully known -
     *   one continuous chain through capturePoints.points.links (node-by-displayName
     *   lookup, same field squadLayer.js's initPredictiveLayer() uses for its 2D polyline).
     * - RAAS/Invasion ("randomized") layers only have a path once the lane solver has a
     *   perspective and the user starts confirming steps - mirrors squadLayer.js's
     *   _drawPath(): one run per contiguous span of confirmed steps (a gap - an unconfirmed
     *   depth - breaks the chain into separate runs, same as the 2D map), bracketed by
     *   perspectiveMain at step 0 and the far main once the route is fully confirmed.
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

        if (!layer) return;
        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!corner0) return;

        let runs;
        if (["AAS", "Seed", "Skirmish"].includes(layer.gamemode)) {
            runs = this._predictiveLinkRuns(layer);
        } else if (layer.isRandomized) {
            runs = this._confirmedChainRuns(layer);
        } else {
            return;
        }
        if (!runs.length) return;

        const zOffset = this._calibrateZOffset(layer, activeMap, corner0);
        this.pathLine = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false
        });

        for (const run of runs) {
            const points = [];
            for (const node of run) {
                const { x, z } = this._gameToWorldXZ(node.location_x, node.location_y, corner0);
                const topY = this._objectiveTopY(node, corner0, zOffset);
                // The label sprite is centered at topY + GROUND_CLEARANCE with half-height
                // LABEL_WORLD_HEIGHT/2, so its own bottom edge sits at topY + 2 - keep the
                // (much wider) pipe's top comfortably under that instead of crossing the name.
                const labelBottomY = topY + GROUND_CLEARANCE - LABEL_WORLD_HEIGHT / 2;
                const y = labelBottomY - PATH_RADIUS - 1.5;
                const point = new THREE.Vector3(x, y, z);

                // Adjacent nodes can coincide (predictive links share endpoints) - skip the
                // repeat so it doesn't become a zero-length cylinder below.
                if (points.length === 0 || points[points.length - 1].distanceToSquared(point) > 1e-6) {
                    points.push(point);
                }
            }
            this._addPathRun(points, material);
        }
        if (!this.pathLine.children.length) {
            this.pathLine = null;
            return;
        }

        this.pathLine.visible = this.pathVisible;
        this.scene.add(this.pathLine);
    }


    /**
     * Appends one independent cylinder per straight segment of `points` to this.pathLine -
     * not a single TubeGeometry along a CurvePath, since a tube's frame twists visibly at a
     * sharp corner between two sub-curves; separate cylinders have no shared frame to
     * twist, at the cost of a small seam at each turn instead of a smooth joint.
     * @param {THREE.Vector3[]} points
     * @param {THREE.Material} material
     */
    _addPathRun(points, material) {
        if (points.length < 2) return;
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
    }


    /**
     * The single continuous run of nodes for a predictive (AAS/Seed/Skirmish) layer's fixed
     * flag order, walked through capturePoints.points.links.
     * @param {SquadLayer} layer
     * @returns {object[][]} zero or one run
     */
    _predictiveLinkRuns(layer) {
        const links = layer.capturePoints?.points?.links;
        if (!links) return [];

        const objectives = this._flattenObjectivePoints(layer);
        const findByDisplayName = (name) => objectives.find((o) => o.objectDisplayName === name);

        const run = [];
        for (const link of Object.values(links)) {
            const nodeA = findByDisplayName(link.nodeA);
            const nodeB = findByDisplayName(link.nodeB);
            if (!nodeA || !nodeB) continue;
            run.push(nodeA, nodeB);
        }
        return run.length ? [run] : [];
    }


    /**
     * The confirmed-chain runs for a randomized (RAAS/Invasion) layer, mirroring
     * squadLayer.js's _drawPath(): only points confirmed to a single resolved depth
     * (flag.solverSteps().length === 1) count, bracketed by perspectiveMain at step 0 and
     * the far main once the route is fully confirmed (_routeComplete()). A gap between two
     * confirmed steps - a depth not confirmed yet - starts a new run instead of connecting
     * across it, same as the 2D map never drawing a line over an unconfirmed leg.
     * @param {SquadLayer} layer
     * @returns {object[][]}
     */
    _confirmedChainRuns(layer) {
        const points = layer.selectedFlags
            .map((flag) => ({ steps: flag.solverSteps(), flag }))
            .filter((p) => p.steps.length === 1)
            .map((p) => ({ step: p.steps[0], node: p.flag.objCluster }))
            .sort((a, b) => a.step - b.step);

        if (points.length && layer.perspectiveMain) {
            points.unshift({ step: 0, node: layer.perspectiveMain.objCluster });

            const farMain = layer._farMain();
            if (farMain && layer._routeComplete()) {
                points.push({ step: layer.solver.stepCount + 1, node: farMain.objCluster });
            }
        }

        const runs = [];
        let run = [];
        points.forEach((point, index) => {
            if (index && point.step !== points[index - 1].step + 1) {
                if (run.length > 1) runs.push(run);
                run = [];
            }
            run.push(point.node);
        });
        if (run.length > 1) runs.push(run);
        return runs;
    }


    /**
     * Loads (and caches) the glTF template model for one deployable type, from
     * DEPLOYABLE_MODELS. Only fetched once per type for the simulation's lifetime -
     * every placed instance is a clone() sharing this template's geometry/material.
     * GROUND_ALIGNED_MODELS come back wrapped in a Group, with the model itself shifted up
     * inside it - _drawDeployables() overwrites each clone's own position, so the offset
     * has to live one level down to survive that.
     * @param {string} type - a DEPLOYABLE_MODELS key, e.g. "Ammo Crate"
     * @returns {Promise<THREE.Object3D>}
     */
    _loadDeployableModel(type) {
        if (!this._deployableModels[type]) {
            this._deployableModels[type] = new GLTFLoader()
                .loadAsync(DEPLOYABLE_MODELS[type])
                .then((gltf) => {
                    if (!GROUND_ALIGNED_MODELS.has(type)) return gltf.scene;
                    const bottomY = new THREE.Box3().setFromObject(gltf.scene).min.y;
                    gltf.scene.position.y -= bottomY;
                    const wrapper = new THREE.Group();
                    wrapper.add(gltf.scene);
                    return wrapper;
                });
        }
        return this._deployableModels[type];
    }


    /**
     * Places 3D models for deployable assets (see DEPLOYABLE_MODELS) from
     * layerData.assets.deployables - the same flat array and "type" field
     * squadLayer.js's createDeployables() reads for the 2D icons - plus
     * layerData.assets.helipads (createHelipads()'s own separate array).
     * @param {?SquadLayer} layer
     * @param {object} activeMap
     */
    async _drawDeployables(layer, activeMap) {
        this.deployableGroup.clear();

        if (!layer) return;
        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        const deployables = layer.layerData?.assets?.deployables ?? [];
        const helipads = layer.layerData?.assets?.helipads ?? [];
        if (!corner0 || (!deployables.length && !helipads.length)) return;

        const byType = {};
        for (const asset of deployables) {
            if (!DEPLOYABLE_MODELS[asset.type]) continue;
            (byType[asset.type] ??= []).push(asset);
        }
        // Helipads are their own array, not part of deployables, and their own "type"
        // field is a per-pad id (e.g. "Team1HelicopterRepairPad1"), not a model selector -
        // every entry here is a helipad.
        if (helipads.length) (byType.Helipad ??= []).push(...helipads);
        if (!Object.keys(byType).length) return;

        const zOffset = this._calibrateZOffset(layer, activeMap, corner0);

        for (const [type, assets] of Object.entries(byType)) {
            const template = await this._loadDeployableModel(type);

            // The layer may have changed (or the view closed) while the model was
            // loading - drop this batch rather than place stale instances on top of
            // whatever _drawDeployables() ran for the new layer in the meantime.
            if (this._lastLayer !== layer) return;

            for (const asset of assets) {
                const { x, z } = this._gameToWorldXZ(asset.location_x, asset.location_y, corner0);
                const y = asset.location_z / 100 + zOffset;

                const model = template.clone();
                model.position.set(x, y, z);
                model.rotation.y = -THREE.MathUtils.degToRad(asset.rotation_z ?? 0);
                this.deployableGroup.add(model);
            }
        }
    }


    /**
     * Loads (and caches) the icon texture for one marker icon URL. Only fetched once
     * per URL for the simulation's lifetime. SVGs (the right-click map markers) are
     * rasterized onto a canvas first - about half of them have no width/height
     * attribute, which Firefox refuses to upload as a WebGL texture directly.
     * @param {string} url
     * @returns {Promise<THREE.Texture>}
     */
    _loadMarkerIconTexture(url) {
        if (!this._markerIconTextures[url]) {
            this._markerIconTextures[url] = url.endsWith(".svg")
                ? new THREE.ImageLoader().loadAsync(url).then((image) => {
                    const canvas = document.createElement("canvas");
                    canvas.width = canvas.height = SVG_ICON_RASTER_SIZE;
                    canvas.getContext("2d").drawImage(image, 0, 0, SVG_ICON_RASTER_SIZE, SVG_ICON_RASTER_SIZE);
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.colorSpace = THREE.SRGBColorSpace;
                    return texture;
                })
                : new THREE.TextureLoader().loadAsync(url);
        }
        return this._markerIconTextures[url];
    }


    /**
     * Places a camera-facing icon sprite for every weapon (mortar/artillery), target and
     * right-click map marker currently placed on the 2D map (minimap.activeWeaponsMarkers /
     * activeTargetsMarkers / activeMarkers), dropped to ground level since a Leaflet-placed marker has
     * no location_z. Each target also gets a floating elevation/bearing text label,
     * drawn the same way as a flag name (see _createLabelSprite()) - see
     * _targetLabelText(). Snapshot taken once per open()/refresh(), like every other overlay here -
     * doesn't live-update when markers move while the view stays open.
     * @param {?object} minimap - SquadMinimap instance
     * @param {object} activeMap
     */
    async _drawMarkers(minimap, activeMap) {
        this.markerGroup.clear();

        const weapons = minimap?.activeWeaponsMarkers?.getLayers() ?? [];
        const markers = [
            ...weapons.map((marker) => ({ marker, size: MARKER_WORLD_SIZE, isTarget: false })),
            ...(minimap?.activeTargetsMarkers?.getLayers() ?? []).map((marker) => ({ marker, size: TARGET_MARKER_WORLD_SIZE, isTarget: true })),
            ...(minimap?.activeMarkers?.getLayers() ?? []).map((marker) => ({ marker, size: STRAT_MARKER_WORLD_SIZE, isTarget: false, isStrat: true })),
        ];
        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!corner0 || !markers.length) return;

        for (const { marker, size, isTarget, isStrat } of markers) {
            const { x, z, u, v } = this._markerWorldPosition(marker, minimap, corner0);
            const groundY = this.terrainHeightAt(u, v);
            const y = groundY + size / 2;

            const texture = await this._loadMarkerIconTexture(marker.getIcon().options.iconUrl);

            // The map (or the view) may have changed while the texture was loading.
            if (this._lastActiveMap !== activeMap) return;

            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
            sprite.scale.set(size, size, 1);
            sprite.position.set(x, y, z);
            if (isStrat) sprite.userData.stratMarker = marker; // right-click delete target
            this.markerGroup.add(sprite);

            if (isStrat && marker.icontype === "deployable_fob") {
                // Same radii/colors as the 2D construction/exclusion circles (squadMarker.js's
                // squadStratMarker), converted back from map scale to meters.
                const { circles1Size, circles1Color, circles2Size, circles2Color } = marker.options;
                const bands = [];
                if (circles1Size) bands.push(this._createFobRangeBand(x, groundY, z, circles1Size / minimap.gameToMapScale, circles1Color));
                if (circles2Size) bands.push(this._createFobRangeBand(x, groundY, z, circles2Size / minimap.gameToMapScale, circles2Color || "white"));
                bands.forEach((band) => this.markerGroup.add(band));
                sprite.userData.rangeBands = bands; // removed along with the sprite on right-click delete
            }

            if (!isTarget) continue;
            const text = this._targetLabelText(marker, weapons);
            if (!text) continue;

            const label = this._createLabelSprite(text, undefined, TARGET_LABEL_WORLD_HEIGHT);
            label.position.set(x, groundY + size + TARGET_LABEL_CLEARANCE, z);
            this.markerGroup.add(label);
        }
    }


    /**
     * One FOB range sphere (in-game FOB radii are 3D distances), drawn only where it
     * meets the ground: the fragment shader samples the terrain height under each
     * fragment (same grid as the terrain mesh, bilinear like its triangles) and discards
     * everything outside [-FOB_BAND_DEPTH, FOB_BAND_HEIGHT] meters around it, leaving a
     * wall that follows the true sphere/terrain intersection and fades out upward.
     * @param {number} x - world X of the FOB
     * @param {number} y - world Y of the sphere's center (the FOB's ground height)
     * @param {number} z - world Z of the FOB
     * @param {number} radius - meters
     * @param {string} color - CSS color
     * @returns {THREE.Mesh}
     */
    _createFobRangeBand(x, y, z, radius, color) {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                ...this._terrainHeightUniforms,
                uColor: { value: new THREE.Color(color) },
                uBandHeight: { value: FOB_BAND_HEIGHT },
                uBandDepth: { value: FOB_BAND_DEPTH },
            },
            vertexShader: /* glsl */ `
                varying vec3 vWorldPos;
                void main() {
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: /* glsl */ `
                uniform sampler2D uHeightMap;
                uniform float uGridRes;
                uniform float uTerrainSize;
                uniform vec3 uColor;
                uniform float uBandHeight;
                uniform float uBandDepth;
                varying vec3 vWorldPos;

                float heightAt(ivec2 cell) {
                    return texelFetch(uHeightMap, cell, 0).r;
                }

                // Same (u, v) mapping as terrainHeightAt(), bilinear between grid vertices.
                float terrainHeight(vec2 xz) {
                    float last = uGridRes - 1.0;
                    vec2 grid = clamp((xz / uTerrainSize + 0.5) * last, 0.0, last);
                    ivec2 c0 = ivec2(floor(grid));
                    ivec2 c1 = min(c0 + 1, ivec2(int(last)));
                    vec2 f = grid - vec2(c0);
                    float top = mix(heightAt(c0), heightAt(ivec2(c1.x, c0.y)), f.x);
                    float bottom = mix(heightAt(ivec2(c0.x, c1.y)), heightAt(c1), f.x);
                    return mix(top, bottom, f.y);
                }

                void main() {
                    float aboveGround = vWorldPos.y - terrainHeight(vWorldPos.xz);
                    if (aboveGround < -uBandDepth || aboveGround > uBandHeight) discard;

                    float t = clamp(aboveGround / uBandHeight, 0.0, 1.0);
                    float wall = 0.35 * (1.0 - t) * (1.0 - t);
                    float groundLine = 0.5 * (1.0 - smoothstep(0.0, 1.5, abs(aboveGround)));
                    gl_FragColor = vec4(uColor, wall + groundLine);
                    #include <colorspace_fragment>
                }
            `,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
        });

        const mesh = new THREE.Mesh(this._fobSphereGeometry, material);
        mesh.position.set(x, y, z);
        mesh.scale.setScalar(radius);
        mesh.raycast = () => {}; // never a right-click delete target - only the FOB sprite is
        return mesh;
    }


    /**
     * Elevation/bearing text for a target's floating label (see _drawMarkers()), one
     * line per weapon currently placed - reuses SquadTargetMarker's own getContent(),
     * the exact same HTML the 2D calc popups (calcMarker1/calcMarker2) show, so the
     * label always matches whatever the user has customized (showBearing/showDistance/
     * showTimeOfFlight/showHeight, lastDigits, lowAndHigh, unit) instead of a fixed
     * format of our own. getContent() returns HTML though, so it's flattened to plain
     * text via _htmlToText() first - a canvas 2D context (_createLabelSprite()) can't
     * render markup. Same "1./2." prefixing as the popups only once a second weapon is
     * placed (squadTargetMarker.js's initialize()/updateCalcMarkers()). A weapon that's
     * been removed since the target was placed (target.firingSolutionN stays set, but
     * weapons[n] no longer exists) is skipped.
     * @param {object} target - a SquadTargetMarker (minimap.activeTargetsMarkers layer)
     * @param {object[]} weapons - minimap.activeWeaponsMarkers.getLayers()
     * @returns {string}
     */
    _targetLabelText(target, weapons) {
        const lines = [];
        if (weapons[0] && target.firingSolution1) {
            const [html1] = target.getContent(target.firingSolution1, weapons[0].angleType);
            const text1 = this._htmlToText(html1);
            if (text1) lines.push(weapons.length === 2 ? `1. ${text1}` : text1);
        }
        if (weapons[1] && target.firingSolution2) {
            const [html2] = target.getContent(target.firingSolution2, weapons[1].angleType);
            const text2 = this._htmlToText(html2);
            if (text2) lines.push(`2. ${text2}`);
        }
        return lines.join("\n");
    }


    /**
     * Flattens one of getContent()'s HTML fragments (squadTargetMarker.js) down to
     * plain text for _createLabelSprite()'s canvas rendering - "<br>" becomes a line
     * break (kept as "\n" through the DOM round-trip below, since textContent preserves
     * literal whitespace/newlines in text nodes) and every other tag (the empty
     * ".calcNumber" placeholder span, the elevation/bearing/etc wrapper spans) is
     * dropped, leaving just the text those spans already contain - i18next.t() was
     * already interpolated into it when getContent() built the string, so no
     * translation step is needed here.
     * @param {string} html
     * @returns {string}
     */
    _htmlToText(html) {
        const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
        const div = document.createElement("div");
        div.innerHTML = withBreaks;
        return div.textContent.trim();
    }


    /**
     * Draws each target's currently active spread ellipse(s) flat on the ground - the
     * dispersion footprint squadTargetMarker.js already computes and shows on the 2D
     * map (target.spreadMarker1/spreadMarker11/spreadMarker2), read directly instead of
     * re-deriving which weapon/elevation solution is currently active. A "spread"
     * ellipse is only ever drawn when squadTargetMarker.js's spreadOptionsOn style is
     * applied (fillOpacity > 0) - the 100/25 damage radius circles use a different,
     * always-unfilled style and are skipped here since they're not this ellipse array.
     * @param {?object} minimap - SquadMinimap instance
     * @param {object} activeMap
     */
    _drawTargetSpreads(minimap, activeMap) {
        this.spreadGroup.clear();

        const targets = minimap?.activeTargetsMarkers?.getLayers() ?? [];
        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!corner0 || !targets.length) return;

        for (const target of targets) {
            const { x, z } = this._markerWorldPosition(target, minimap, corner0);

            for (const ellipse of [target.spreadMarker1, target.spreadMarker11, target.spreadMarker2]) {
                if (!ellipse || !(ellipse.options.fillOpacity > 0)) continue;

                // Ellipse radii live in the same lat/lng-scaled space as the 2D map
                // (see squadTargetMarker.js's updateSpread(): semiMajorAxis * gameToMapScale)
                // - dividing back by that same scale gives real-world meters.
                const radius = ellipse.getRadius();
                const radiusX = radius.x / minimap.gameToMapScale;
                const radiusZ = radius.y / minimap.gameToMapScale;

                const mesh = new THREE.Mesh(
                    this._projectedEllipseGeometry(x, z, radiusX, radiusZ, ellipse._tiltDeg),
                    new THREE.MeshBasicMaterial({
                        color: 0xff2200,
                        transparent: true,
                        opacity: 0.28,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                    })
                );
                this.spreadGroup.add(mesh);
            }
        }
    }


    /**
     * Filled-ellipse geometry draped over the terrain instead of a single flat plane -
     * every vertex (built as concentric rings around the center, not just the outer
     * edge, so the interior follows slopes too) is placed in world space with its own
     * terrainHeightAt() sample, so the shape doesn't clip below the ground or float
     * above it on hilly terrain.
     * @param {number} centerX - world X of the ellipse's center
     * @param {number} centerZ - world Z of the ellipse's center
     * @param {number} radiusX - semi-axis (meters) along local +X (east) before tilt
     * @param {number} radiusZ - semi-axis (meters) along local +Z (south) before tilt
     * @param {number} tiltDeg - leaflet-ellipse.js's own _tiltDeg. World X/Z here match
     * the Canvas renderer's pixel axes exactly (+X = east = lng, +Z = south = lat), so
     * this rotates vertices with the identical formula _updateEllipse() applies via
     * ctx.rotate(tilt) - no Three.js rotation.y sign flip involved, since these are
     * plain manually-built world-space vertices, not a mesh.rotation.y Euler rotation.
     * @param {number} [segments] - points per ring
     * @param {number} [rings] - concentric rings between the center and the outer edge
     * @returns {THREE.BufferGeometry}
     */
    _projectedEllipseGeometry(centerX, centerZ, radiusX, radiusZ, tiltDeg, segments = 48, rings = 4) {
        const heightAt = (worldX, worldZ) => this.terrainHeightAt(
            worldX / this.terrainSize + 0.5,
            worldZ / this.terrainSize + 0.5
        ) + SPREAD_GROUND_OFFSET;

        const theta = THREE.MathUtils.degToRad(tiltDeg);
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const positions = [centerX, heightAt(centerX, centerZ), centerZ];
        for (let ring = 1; ring <= rings; ring++) {
            const fraction = ring / rings;
            for (let i = 0; i < segments; i++) {
                const t = (i / segments) * Math.PI * 2;
                const localX = radiusX * fraction * Math.cos(t);
                const localZ = radiusZ * fraction * Math.sin(t);
                const worldX = centerX + (localX * cosT - localZ * sinT);
                const worldZ = centerZ + (localX * sinT + localZ * cosT);
                positions.push(worldX, heightAt(worldX, worldZ), worldZ);
            }
        }

        const vertexIndex = (ring, i) => (ring === 0 ? 0 : 1 + (ring - 1) * segments + (i % segments));
        const indices = [];
        for (let i = 0; i < segments; i++) indices.push(vertexIndex(0, 0), vertexIndex(1, i), vertexIndex(1, i + 1));
        for (let ring = 1; ring < rings; ring++) {
            for (let i = 0; i < segments; i++) {
                const a = vertexIndex(ring, i);
                const b = vertexIndex(ring, i + 1);
                const c = vertexIndex(ring + 1, i);
                const d = vertexIndex(ring + 1, i + 1);
                indices.push(a, b, d, a, d, c);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        return geometry;
    }


    /**
     * Draws a projectile arc for every weapon/target pair currently placed on the 2D
     * map (minimap.activeWeaponsMarkers/activeTargetsMarkers) - so trajectories stay
     * visible for as long as 3D mode is open, not just when jumping in via the target
     * dialog's "See in 3D" button. Each target's own firingSolution1/firingSolution2
     * (computed by squadTargetMarker.js against weapon 1/2) is drawn using that
     * weapon's currently selected angleType, the same low/high choice the 2D popup and
     * marker icon already use.
     *
     * `arcRequest` (from "See in 3D") is drawn on top of that - it lets the low/high
     * simulation dialog highlight one exact firingSolution/angleType, which can differ
     * from the target's default angleType when "lowAndHigh" is enabled.
     * @param {?object} minimap - SquadMinimap instance
     * @param {object} activeMap
     * @param {?{firingSolution: object, angleType: string}} [arcRequest]
     */
    _drawProjectileArcs(minimap, activeMap, arcRequest = null) {
        this.arcGroup.clear();
        if (!minimap) return;

        const corner0 = activeMap.SDK_data?.minimap?.corner0;
        if (!corner0) return;

        const weapons = minimap.activeWeaponsMarkers.getLayers();
        const targets = minimap.activeTargetsMarkers.getLayers();

        for (const target of targets) {
            if (weapons[0] && target.firingSolution1) {
                this._addProjectileArc(target.firingSolution1, weapons[0].angleType, minimap, corner0);
            }
            if (weapons[1] && target.firingSolution2) {
                this._addProjectileArc(target.firingSolution2, weapons[1].angleType, minimap, corner0);
            }
        }

        if (arcRequest) this._addProjectileArc(arcRequest.firingSolution, arcRequest.angleType, minimap, corner0);
    }


    /**
     * Builds and adds a single projectile arc mesh between one weapon/target pair -
     * the physics-shaped path a shot along firingSolution/angleType actually takes,
     * not just a straight line. Shared by _drawProjectileArcs() for every placed
     * weapon/target pair and for the "See in 3D" highlighted arcRequest.
     *
     * Horizontal position is a plain fraction-of-time lerp between the two ground
     * points (exact, since horizontal velocity is constant - distance(t) is linear in
     * t). Height uses the same projectile motion the firing solution was solved from
     * (velocity * sin(elevation) * t - 0.5 * gravity * t^2, relative to the launch
     * point), then a small linear correction is subtracted so the arc lands exactly on
     * the target's own 3D ground height - the 2D heightmap sampling behind
     * firingSolution.heightDiff and this file's terrainHeightAt() (a different
     * resolution/grid) can disagree by a meter or so, which would otherwise leave a
     * visible gap or clip at the target end.
     * @param {object} firingSolution
     * @param {string} angleType
     * @param {object} minimap - SquadMinimap instance
     * @param {[number, number]} corner0 - activeMap.SDK_data.minimap.corner0
     */
    _addProjectileArc(firingSolution, angleType, minimap, corner0) {
        const elevation = angleType === "high" ? firingSolution.elevation.high.rad : firingSolution.elevation.low.rad;
        const timeOfFlight = angleType === "high" ? firingSolution.timeOfFlight.high : firingSolution.timeOfFlight.low;
        if (!Number.isFinite(elevation) || !Number.isFinite(timeOfFlight) || timeOfFlight <= 0) return;

        const weaponPos = this._latLngToWorldXZ(firingSolution.weaponLatLng.lat, firingSolution.weaponLatLng.lng, minimap, corner0);
        const targetPos = this._latLngToWorldXZ(firingSolution.targetLatLng.lat, firingSolution.targetLatLng.lng, minimap, corner0);
        const weaponY = this.terrainHeightAt(weaponPos.u, weaponPos.v);
        const targetY = this.terrainHeightAt(targetPos.u, targetPos.v);

        const { velocity, gravity } = firingSolution;
        const arcHeight = (t) => velocity * Math.sin(elevation) * t - 0.5 * gravity * t * t;
        const heightCorrection = arcHeight(timeOfFlight) - (targetY - weaponY);

        const segments = 48;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const fraction = i / segments;
            const t = fraction * timeOfFlight;
            const x = THREE.MathUtils.lerp(weaponPos.x, targetPos.x, fraction);
            const z = THREE.MathUtils.lerp(weaponPos.z, targetPos.z, fraction);
            const y = weaponY + arcHeight(t) - fraction * heightCorrection;
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments * 2, ARC_TUBE_RADIUS, 8, false);
        const material = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        this.arcGroup.add(new THREE.Mesh(geometry, material));
    }


    /**
     * The left-click ground marker: a billboarded eye icon (THREE.Sprite always faces the
     * camera) kept at a fixed on-screen size whatever its distance, and drawn on top of
     * everything. Lives in this.clickMarker, which is moved to each new click - see
     * _setupFlyControls().
     * @returns {THREE.Sprite}
     */
    _createClickMarker() {
        const texture = new THREE.TextureLoader().load(CLICK_MARKER_ICON_URL);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.SpriteMaterial({
            map: texture,
            sizeAttenuation: false,
            depthTest: false,
            depthWrite: false,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(CLICK_MARKER_SCREEN_SIZE, CLICK_MARKER_SCREEN_SIZE, 1);
        sprite.renderOrder = 999;
        return sprite;
    }


    /**
     * Replaces the click marker's distance label (disposing the previous one's canvas
     * texture), drawn like a flag label but at a fixed on-screen size and anchored just
     * above the ring.
     * @param {number} distance - meters, rounded for display
     */
    _setClickMarkerLabel(distance) {
        this._clickLabelDistance = Math.round(distance);
        const text = `${this._clickLabelDistance}m`;
        if (this.clickMarkerLabel) {
            this.clickMarker.remove(this.clickMarkerLabel);
            this.clickMarkerLabel.material.map.dispose();
            this.clickMarkerLabel.material.dispose();
        }

        const label = this._createLabelSprite(text);
        const aspect = label.scale.x / label.scale.y;
        label.material.sizeAttenuation = false;
        label.scale.set(CLICK_LABEL_SCREEN_HEIGHT * aspect, CLICK_LABEL_SCREEN_HEIGHT, 1);
        // Sprite.center shifts the sprite in its own (screen-facing) plane, so the label's
        // bottom edge sits at the ring's top edge at any distance or viewing angle.
        label.center.set(0.5, -(CLICK_MARKER_SCREEN_SIZE / 2) / CLICK_LABEL_SCREEN_HEIGHT);
        label.renderOrder = 999;

        this.clickMarkerLabel = label;
        this.clickMarker.add(label);
    }


    /**
     * A billboarded text label (always faces the camera - THREE.Sprite's default behavior)
     * for a flag name or a target's elevation/bearing (see _targetLabelText()), rendered
     * on top of everything so distance/terrain never occludes it. `text` may hold several
     * "\n"-separated lines (one per weapon, for a target) - each renders at `worldHeight`
     * tall, so the sprite's total height grows with the line count instead of squeezing
     * every line into one flag-label-sized box.
     * @param {string} text
     * @param {string} [bgColor] - defaults to a neutral translucent black; mains pass a
     * different color instead (see _drawCapzones()) so they stand out from regular flags.
     * @param {number} [worldHeight] - per-line height; defaults to LABEL_WORLD_HEIGHT,
     * mains pass a larger value so their name reads bigger than a regular flag's.
     * @returns {THREE.Sprite}
     */
    _createLabelSprite(text, bgColor = "rgba(0, 0, 0, 0.6)", worldHeight = LABEL_WORLD_HEIGHT) {
        const fontSize = 48;
        const paddingX = 24;
        const paddingY = 16;
        const lineHeight = fontSize * 1.15;
        const lines = text.split("\n");

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
        canvas.width = Math.ceil(textWidth) + paddingX * 2;
        canvas.height = Math.round(lineHeight * lines.length) + paddingY * 2;

        // Sizing the canvas resets its 2D context, so the font has to be set again.
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        lines.forEach((line, i) => {
            ctx.fillText(line, canvas.width / 2, paddingY + lineHeight * (i + 0.5) + 2);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(material);

        const totalWorldHeight = worldHeight * lines.length;
        sprite.scale.set(totalWorldHeight * (canvas.width / canvas.height), totalWorldHeight, 1);
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
     * Distance along a ray to where it first meets the ground, from terrainHeightAt()
     * samples: steps one grid cell at a time until the ray dips below the terrain, then
     * bisects that last step. Ignores trees/props, so it's the ground under them.
     * @param {THREE.Ray} ray - world-space, normalized direction
     * @returns {number|null} meters, or null if the ray leaves the map without hitting
     */
    _rayTerrainDistance(ray) {
        if (!this.heights || !this.terrainSize) return null;

        const step = this.terrainSize / (this.gridResolution - 1);
        const maxDistance = this.terrainSize * 2; // farther than any in-map point from any in-map camera
        const isBelowGround = (distance) => {
            ray.at(distance, _rayPoint);
            const u = _rayPoint.x / this.terrainSize + 0.5;
            const v = _rayPoint.z / this.terrainSize + 0.5;
            if (u < 0 || u > 1 || v < 0 || v > 1) return false;
            return _rayPoint.y <= this.terrainHeightAt(u, v);
        };

        let previous = 0;
        for (let distance = step; distance <= maxDistance; distance += step) {
            if (!isBelowGround(distance)) {
                previous = distance;
                continue;
            }
            // Bisect the crossing down to well under a meter.
            let low = previous;
            let high = distance;
            for (let i = 0; i < 12; i++) {
                const mid = (low + high) / 2;
                if (isBelowGround(mid)) high = mid;
                else low = mid;
            }
            return high;
        }
        return null;
    }


    /**
     * Distance along the click ray (this._raycaster.ray) to the nearest visible building
     * or tree closer than `far`. InstancedMeshes (trees/bushes, trees.bin's generic
     * building placeholders) go through three.js's own raycast, which rejects each
     * instance off its bounding sphere before any triangle test; props.bin's merged
     * meshes go through _rayPropsMeshDistance().
     * @param {number} far - meters; the ground distance, so nothing behind it is tested
     * @returns {number|null} meters, or null if nothing is hit before `far`
     */
    _rayObjectDistance(far) {
        const groups = [this.propsGroup, this.treesGroup].filter((group) => group.visible);
        let nearest = far;

        this._raycaster.far = far;
        const instanced = groups.flatMap((group) => group.children.filter((child) => child.isInstancedMesh));
        const hit = this._raycaster.intersectObjects(instanced, false)[0];
        this._raycaster.far = Infinity;
        if (hit) nearest = hit.distance;

        for (const group of groups) {
            for (const mesh of group.children) {
                if (mesh.userData.parts) nearest = this._rayPropsMeshDistance(mesh, nearest);
            }
        }
        return nearest < far ? nearest : null;
    }


    /**
     * Click-ray test against one of props.bin's merged category meshes: checks each
     * part's bounding box first (see loadProps()), then only the triangles of the parts
     * whose box the ray crosses closer than the current nearest hit.
     * @param {THREE.Mesh} mesh - with userData.parts
     * @param {number} nearest - meters; the closest hit so far
     * @returns {number} the new closest hit distance (unchanged if this mesh is behind it)
     */
    _rayPropsMeshDistance(mesh, nearest) {
        // The props group is only translated (see _loadPropsAndTrees()), so distances
        // along the local-space ray match world-space ones.
        _localRay.copy(this._raycaster.ray).applyMatrix4(_inverseMatrix.copy(mesh.matrixWorld).invert());
        const index = mesh.geometry.index;
        const position = mesh.geometry.attributes.position;

        for (const { box, start, count } of mesh.userData.parts) {
            if (!_localRay.intersectBox(box, _hitPoint)) continue;
            if (_hitPoint.distanceTo(_localRay.origin) >= nearest) continue;

            for (let i = start; i < start + count; i += 3) {
                _triA.fromBufferAttribute(position, index.getX(i));
                _triB.fromBufferAttribute(position, index.getX(i + 1));
                _triC.fromBufferAttribute(position, index.getX(i + 2));
                if (!_localRay.intersectTriangle(_triA, _triB, _triC, false, _hitPoint)) continue;
                const distance = _hitPoint.distanceTo(_localRay.origin);
                if (distance < nearest) nearest = distance;
            }
        }
        return nearest;
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
     * Mirrors the left-click eye marker onto the minimap (icon only, no distance).
     * The marker only moves on click, so this runs then rather than every frame.
     */
    _updateMinimapClickMarker() {
        this.minimapClickMarker.hidden = !this.clickMarker.visible || !this.terrainSize;
        if (this.minimapClickMarker.hidden) return;
        const u = THREE.MathUtils.clamp(this.clickMarker.position.x / this.terrainSize + 0.5, 0, 1);
        const v = THREE.MathUtils.clamp(this.clickMarker.position.z / this.terrainSize + 0.5, 0, 1);
        this.minimapClickMarker.style.left = `${u * 100}%`;
        this.minimapClickMarker.style.top = `${v * 100}%`;
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

            this._frameCapAccum += this.clock.getDelta();
            if (this._frameCapAccum < MIN_FRAME_INTERVAL) return;
            const delta = Math.min(this._frameCapAccum, 0.1);
            this._frameCapAccum = 0;

            // OrbitControls owns the camera entirely (touch drag/pinch) and needs its own
            // per-frame update() for damping inertia - no WASD fly movement to apply.
            if (this._orbitMode) {
                this.controls.update();
                this._keepOrbitTargetOnGround();
            } else {
                this._updateFlyMovement(delta);
            }
            this._updateMinimapDot();
            this._updateClickMarkerDistance(delta);
            this._updateFpsCounter(delta);
            this.renderer.render(this.scene, this.camera);
        };
        renderFrame();
    }


    /**
     * Orbit mode: pinch-zoom dollies towards controls.target and stops minDistance short
     * of it, so a target left floating above the terrain (panning over a valley, a spawn
     * target set above the ground) blocks zooming all the way down. Snaps the target onto
     * the ground under it every frame, shifting the camera by the same amount so the view
     * doesn't jump.
     */
    _keepOrbitTargetOnGround() {
        if (!this.heights || !this.terrainSize) return;
        const target = this.controls.target;
        const groundY = this.terrainHeightAt(target.x / this.terrainSize + 0.5, target.z / this.terrainSize + 0.5);
        const offsetY = groundY - target.y;
        if (Math.abs(offsetY) < 0.01) return;
        target.y += offsetY;
        this.camera.position.y += offsetY;
    }


    /**
     * Keeps the click marker's label at the camera's current distance while it moves -
     * checked at most every CLICK_LABEL_UPDATE_INTERVAL, and the label is only redrawn
     * when the rounded value actually changed, so a still camera costs nothing.
     * @param {number} delta - seconds since the last frame
     */
    _updateClickMarkerDistance(delta) {
        if (!this.clickMarker.visible) return;
        this._clickLabelAccumTime += delta;
        if (this._clickLabelAccumTime < CLICK_LABEL_UPDATE_INTERVAL) return;
        this._clickLabelAccumTime = 0;

        const distance = this.camera.position.distanceTo(this.clickMarker.position);
        if (Math.round(distance) !== this._clickLabelDistance) this._setClickMarkerLabel(distance);
    }


    /**
     * Updates the top-left FPS counter, averaged over FPS_UPDATE_INTERVAL rather than
     * read fresh every frame (1/delta alone jitters too much to be readable).
     * @param {number} delta - seconds since the last frame
     */
    _updateFpsCounter(delta) {
        this._fpsAccumTime += delta;
        this._fpsAccumFrames++;
        if (this._fpsAccumTime < FPS_UPDATE_INTERVAL) return;

        this.fpsValue.textContent = Math.round(this._fpsAccumFrames / this._fpsAccumTime);
        this._fpsAccumTime = 0;
        this._fpsAccumFrames = 0;
    }


    _stopLoop() {
        if (this._frameId !== null) cancelAnimationFrame(this._frameId);
        this._frameId = null;
    }

}
