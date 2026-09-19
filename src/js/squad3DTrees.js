import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// See squad3DProps.js's own copy of this constant for why it's needed.
const ENV_MAP_INTENSITY = 0.15;

// Per-species shape/orientation classification, ported from map-patterns.mjs
// (COLUMNAR_TREE_PATTERNS/CONICAL_TREE_PATTERNS/PINE_TREE_PATTERNS/
// HOUSE_ROOF_RIDGE_ALONG_X_PATTERNS/DOUBLEGABLE_ROOF_RIDGE_ALONG_Z_PATTERNS). That file's
// getMapPatterns(mapId) always returns the same GLOBAL_PATTERNS object regardless of
// mapId (mapId is only validated against a known-map allowlist, never used to select a
// different pattern set) - these lists really are global across every map, so no mapId
// parameter is needed here either.

// Real Lombardy poplars are narrow and columnar ("flame"-shaped), not round like most
// other tree species.
const COLUMNAR_TREE_PATTERNS = [/^LombardyPoplar/i];
// Norway spruce reads as an actual cone (unlike the poplar case, where a cone was
// rejected as "too pine-like") - a real conifer silhouette.
const CONICAL_TREE_PATTERNS = [/^SM_Norwayspruce/i];
// Siberian pine species: real geometry has a long bare trunk with the crown only
// starting well above the ground - a plain conical shape's canopy sits too close to the
// ground for these, so they get their own shape (tall bare trunk, small crown near the
// top) instead.
const PINE_TREE_PATTERNS = [/^SM_Siberian/i, /^SM_Beech_03$/i];
// Species whose real local long axis is X, not the default Z - buildGenericHouseGeometry's
// gable ridge needs to run the other way for these.
const HOUSE_ROOF_RIDGE_ALONG_X_PATTERNS = [
    /^SM_NA_Barn_Beams$/i,
    /^Half_Ass_Factory_Main$/i,
    /^Half_Ass_Factory_Connector$/i,
    /^SM_EastAsia_VillageHouse_4mFill_01a$/i,
];
// Same idea, for double-gable species whose real local long axis is Z instead of the
// default X.
const DOUBLEGABLE_ROOF_RIDGE_ALONG_Z_PATTERNS = [/^StaticMesh_bigwarehouse2$/i];

function isColumnarTree(name) {
    return COLUMNAR_TREE_PATTERNS.some((re) => re.test(name));
}
function isConicalTree(name) {
    return CONICAL_TREE_PATTERNS.some((re) => re.test(name));
}
function isPineTree(name) {
    return PINE_TREE_PATTERNS.some((re) => re.test(name));
}
function isHouseRoofRidgeAlongX(name) {
    return HOUSE_ROOF_RIDGE_ALONG_X_PATTERNS.some((re) => re.test(name));
}
function isDoubleGableRidgeAlongZ(name) {
    return DOUBLEGABLE_ROOF_RIDGE_ALONG_Z_PATTERNS.some((re) => re.test(name));
}

// --- generic tree/bush/box/house/etc placeholder geometry ---
// Thousands of instances across only a handful of species/kinds. Real detailed geometry
// per species would mean one draw call per species at real foliage/building vertex
// counts; instead, one shared low-poly placeholder shape per kind, scaled/colored per
// species, collapsed into one InstancedMesh draw call per kind.

function buildGenericTreeGeometry() {
    // One shared low-poly tree (cylinder trunk + icosahedron canopy) for every species.
    // Trunk and canopy are returned separately (not merged) and rendered as two
    // InstancedMeshes - the canopy needs its own per-species instanceColor (a "Fall"-
    // flagged species gets autumn orange/maroon instead of summer green), same white-
    // base-multiply approach as buildGenericHouseGeometry's roof. The trunk keeps a real
    // baked-in brown - it never needs per-species tinting. Both geometries keep their
    // ORIGINAL local-space coordinates and `height` is the combined trunk+canopy bbox
    // height - callers scale both InstancedMeshes by the same factor
    // (naturalHeight / height) so they still line up as one tree.
    const trunkHeight = 1.6;
    // Radius reduced by a third (x2/3) per user request - was (0.12, 0.22).
    const trunk = new THREE.CylinderGeometry(0.08, 0.1467, trunkHeight, 6).toNonIndexed();
    trunk.translate(0, trunkHeight / 2, 0);
    const trunkColor = new THREE.Color(0x5c4530);
    trunk.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(trunk.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? trunkColor.r : i % 3 === 1 ? trunkColor.g : trunkColor.b)), 3
    ));

    const canopyRadius = 0.825;
    const canopy = new THREE.IcosahedronGeometry(canopyRadius, 0).toNonIndexed();
    canopy.translate(0, trunkHeight + canopyRadius * 0.6, 0);
    canopy.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(canopy.attributes.position.count * 3).fill(1), 3
    ));

    const merged = mergeGeometries([trunk, canopy], false);
    merged.computeBoundingBox();
    const height = merged.boundingBox.max.y - merged.boundingBox.min.y;
    return { trunk, canopy, height };
}

function buildGenericColumnarTreeGeometry() {
    // Lombardy poplars read as a narrow upright column with a rounded top - a slim
    // capsule, not a cone (tapers to a point - reads as a pine, not a poplar).
    const trunkHeight = 1.0;
    const trunk = new THREE.CylinderGeometry(0.1, 0.16, trunkHeight, 6).toNonIndexed();
    trunk.translate(0, trunkHeight / 2, 0);
    const trunkColor = new THREE.Color(0x5c4530);
    trunk.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(trunk.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? trunkColor.r : i % 3 === 1 ? trunkColor.g : trunkColor.b)), 3
    ));

    const canopyRadius = 0.45;
    const canopyLength = 2.3;
    const canopy = new THREE.CapsuleGeometry(canopyRadius, canopyLength, 4, 8).toNonIndexed();
    canopy.translate(0, trunkHeight + canopyLength / 2 + canopyRadius, 0);
    const canopyColor = new THREE.Color(0x3f6b34);
    canopy.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(canopy.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? canopyColor.r : i % 3 === 1 ? canopyColor.g : canopyColor.b)), 3
    ));

    const merged = mergeGeometries([trunk, canopy], false);
    merged.computeBoundingBox();
    const height = merged.boundingBox.max.y - merged.boundingBox.min.y;
    return { geometry: merged, height };
}

function buildGenericConicalTreeGeometry() {
    // Real conifers (spruce/pine) read as a cone.
    const trunkHeight = 0.9;
    const trunk = new THREE.CylinderGeometry(0.1, 0.16, trunkHeight, 6).toNonIndexed();
    trunk.translate(0, trunkHeight / 2, 0);
    const trunkColor = new THREE.Color(0x5c4530);
    trunk.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(trunk.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? trunkColor.r : i % 3 === 1 ? trunkColor.g : trunkColor.b)), 3
    ));

    const coneRadius = 0.8;
    const coneHeight = 2.2;
    const canopy = new THREE.ConeGeometry(coneRadius, coneHeight, 8).toNonIndexed();
    canopy.translate(0, trunkHeight + coneHeight / 2, 0);
    const canopyColor = new THREE.Color(0x2f5c34);
    canopy.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(canopy.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? canopyColor.r : i % 3 === 1 ? canopyColor.g : canopyColor.b)), 3
    ));

    const merged = mergeGeometries([trunk, canopy], false);
    merged.computeBoundingBox();
    const height = merged.boundingBox.max.y - merged.boundingBox.min.y;
    return { geometry: merged, height };
}

function buildGenericPineGeometry() {
    // Siberian pine: long bare trunk with only a small crown near the top, unlike
    // buildGenericConicalTreeGeometry's cone sitting right on a short trunk.
    const trunkHeight = 1.8;
    const trunk = new THREE.CylinderGeometry(0.09, 0.15, trunkHeight, 6).toNonIndexed();
    trunk.translate(0, trunkHeight / 2, 0);
    const trunkColor = new THREE.Color(0x5c4530);
    trunk.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(trunk.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? trunkColor.r : i % 3 === 1 ? trunkColor.g : trunkColor.b)), 3
    ));

    const coneRadius = 0.55;
    const coneHeight = 1.1;
    const canopy = new THREE.ConeGeometry(coneRadius, coneHeight, 8).toNonIndexed();
    canopy.translate(0, trunkHeight + coneHeight / 2, 0);
    const canopyColor = new THREE.Color(0x3a5c3f);
    canopy.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(canopy.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? canopyColor.r : i % 3 === 1 ? canopyColor.g : canopyColor.b)), 3
    ));

    const merged = mergeGeometries([trunk, canopy], false);
    merged.computeBoundingBox();
    const height = merged.boundingBox.max.y - merged.boundingBox.min.y;
    return { geometry: merged, height };
}

function buildGenericBushGeometry() {
    // Two overlapping flattened icosahedra (no trunk - bushes sit low, unlike trees).
    const color = new THREE.Color(0x5a7548);
    function blob(radius, x, y, z) {
        const g = new THREE.IcosahedronGeometry(radius, 0).toNonIndexed();
        g.scale(1, 0.65, 1);
        g.translate(x, y, z);
        g.setAttribute("color", new THREE.BufferAttribute(
            new Float32Array(g.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? color.r : i % 3 === 1 ? color.g : color.b)), 3
        ));
        return g;
    }
    const merged = mergeGeometries([blob(0.7, 0, 0.45, 0), blob(0.45, 0.15, 0.75, -0.1)], false);
    merged.computeBoundingBox();
    const height = merged.boundingBox.max.y - merged.boundingBox.min.y;
    return { geometry: merged, height };
}

// Default box color for species whose name doesn't hint at a material.
const DEFAULT_BOX_COLOR = 0x8a8f94;
const BOX_COLOR_BY_NAME_KEYWORD = [
    [/^SM_ME_UrbRes_Bld_Med_09$/i, 0x555145],
    [/^SM_ME_UrbRes_Bld_Med_12$/i, 0x638085],
    [/^SM_Factory_Chimney_01/i, 0xb07f68],
    [/SM_ShippingContainer.*White/i, 0xc9c9c4],
    [/SM_ShippingContainer.*Green/i, 0x3f5c3a],
    [/SM_ShippingContainer.*Red/i, 0x8a3328],
    [/SM_ShippingContainer.*Yellow/i, 0xc9a227],
    [/SM_ShippingContainer.*Blue/i, 0x2f5270],
    [/olive/i, 0x5a5c3a],
    [/_tan_/i, 0xb0a89c],
    [/wood/i, 0x6b4a2f],
    [/pinelog/i, 0x6b4a2f],
    [/SM_Apartment_Block_8story_Base02/i, 0x8b8072],
    [/SM_Apartment_Block_4story02v1/i, 0x817f79],
    [/^(SM_)?ME_|^SM_IRQ_|^afg_|UrbCnt|Market_Buildings|Market_Shops|^shopfront_|^policestation|^SM_Construction_Site/i, 0xa89a7c],
    [/^SM_EastAsia_Offices_01a/i, 0x9c5b3c],
];
function boxColorForSpecies(label) {
    for (const [re, color] of BOX_COLOR_BY_NAME_KEYWORD) {
        if (re.test(label)) return color;
    }
    return DEFAULT_BOX_COLOR;
}

function buildGenericBoxGeometry() {
    // A plain unit box spanning (0,0,0)-(1,1,1) (corner-anchored, not centered) -
    // buildInstancedBoxProps scales+translates this per species to exactly match that
    // species' real local bounding box. White base color - instanceColor (set per
    // species, see boxColorForSpecies) multiplies against this.
    const geometry = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
    geometry.translate(0.5, 0.5, 0.5);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

// Sets every vertex's color attribute to a fixed (r,g,b) triplet.
function setUniformColor(geometry, r, g, b) {
    const count = geometry.attributes.position.count;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        arr[i * 3] = r; arr[i * 3 + 1] = g; arr[i * 3 + 2] = b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(arr, 3));
}

// Extrudes a star-shaped-from-centroid footprint (an array of [x,z] points going around
// the perimeter) straight up from y=0 to y=height - side walls plus fan-triangulated
// top/bottom caps from the centroid. General-purpose, reusable for any other prism-shaped
// placeholder.
function buildPrismGeometry(points, height) {
    function quad(a, b, c, d) {
        return [a, b, c, a, c, d];
    }
    const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const cz = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    const tris = [];
    for (let i = 0; i < points.length; i++) {
        const [x0, z0] = points[i];
        const [x1, z1] = points[(i + 1) % points.length];
        tris.push(...quad([x0, 0, z0], [x1, 0, z1], [x1, height, z1], [x0, height, z0])); // side wall
        tris.push([cx, 0, cz], [x1, 0, z1], [x0, 0, z0]); // bottom cap
        tris.push([cx, height, cz], [x0, height, z0], [x1, height, z1]); // top cap
    }
    const posArr = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { posArr[i * 3] = v[0]; posArr[i * 3 + 1] = v[1]; posArr[i * 3 + 2] = v[2]; });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    return geometry;
}

// Rotates a unit-cube-space (0,0,0)-(1,1,1) geometry 90 degrees around the cube's own
// vertical center axis, in place - (x, z) -> (z, 1 - x) maps the unit square to itself
// (each corner cycles to the next), unlike a plain THREE.Object3D.rotateY() which would
// rotate around the geometry's local origin and carry it outside the unit cube instead of
// keeping it in the same (0,0,0)-(1,1,1) space every buildInstancedBoxProps shape expects.
// Used by buildGenericMonoSlopeHouseDoorGeometry() to turn buildGenericMonoSlopeHouseGeometry's
// z=1 tall end wall into the x=1 face its door belongs on.
function rotateXZPlus90(geometry) {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        pos.setX(i, z);
        pos.setZ(i, 1 - x);
    }
    pos.needsUpdate = true;
    return geometry;
}

// Local-space height split for buildGenericToppedBoxGeometry, calibrated for
// SM_Apartment_Block_8story_Base02's real bbox height (~32.82m).
const TOPPEDBOX_MAIN_HEIGHT_FRACTION = 0.9184;
// Rooftop box footprint, as fractions of the local unit cube.
const TOPPEDBOX_TOP_WIDTH_X = 0.3744;
const TOPPEDBOX_TOP_WIDTH_Z = 0.1526;
// Corner notch for the main body, as fractions of the local unit cube - a right-angle
// step cut (not a 45-degree chamfer), at all 4 corners, running the full height.
const TOPPEDBOX_NOTCH_X = 0.0936;
const TOPPEDBOX_NOTCH_Z = 0.375;

function buildGenericToppedBoxGeometry() {
    // A main body topped by a second, narrower/shorter box - for species whose real bbox
    // height is dominated by a small rooftop structure that a single full-height box
    // placeholder flattens away. Spans the unit cube (0,0,0)-(1,1,1) like
    // buildGenericBoxGeometry, so it gets the same per-species non-uniform scale+translate
    // treatment in buildInstancedBoxProps.
    //
    // Main body is a rectangle with a right-angle step notched out of each corner (not a
    // plain box, not a 45-degree chamfer) - see TOPPEDBOX_NOTCH_X/Z above. Union of a
    // full-X-width "spine" (the middle Z range) and a narrower-X "end" band (the full Z
    // range) - the notch only shows up near the two Z ends, where the spine doesn't reach.
    const nx = TOPPEDBOX_NOTCH_X, nz = TOPPEDBOX_NOTCH_Z;
    const notchedRect = [
        [nx, 0], [1 - nx, 0], [1 - nx, nz], [1, nz], [1, 1 - nz], [1 - nx, 1 - nz],
        [1 - nx, 1], [nx, 1], [nx, 1 - nz], [0, 1 - nz], [0, nz], [nx, nz],
    ];
    const main = buildPrismGeometry(notchedRect, TOPPEDBOX_MAIN_HEIGHT_FRACTION);
    setUniformColor(main, 1, 1, 1); // white - instanceColor shows through unmodified

    const topHeight = 1 - TOPPEDBOX_MAIN_HEIGHT_FRACTION;
    const top = new THREE.BoxGeometry(TOPPEDBOX_TOP_WIDTH_X, topHeight, TOPPEDBOX_TOP_WIDTH_Z).toNonIndexed();
    top.deleteAttribute("normal");
    top.deleteAttribute("uv");
    top.translate(0.5, TOPPEDBOX_MAIN_HEIGHT_FRACTION + topHeight / 2, 0.5);
    setUniformColor(top, 1, 1, 1);

    // Two ground-floor doors, one centered on each long (Z) face - one door per long
    // wall, centered along the building's length. Baked non-white so instanceColor
    // darkens them relative to the wall instead of matching it exactly, same mechanism
    // as the tree trunk's fixed color.
    const DOOR_HALF_WIDTH = 0.0429;
    const DOOR_HEIGHT = 0.1005;
    const DOOR_THICKNESS = 0.0023;
    function buildDoor(onMaxXFace) {
        const door = new THREE.BoxGeometry(DOOR_THICKNESS, DOOR_HEIGHT, DOOR_HALF_WIDTH * 2).toNonIndexed();
        door.deleteAttribute("normal");
        door.deleteAttribute("uv");
        const x = onMaxXFace ? 1 + DOOR_THICKNESS / 2 : -DOOR_THICKNESS / 2;
        door.translate(x, DOOR_HEIGHT / 2, 0.5);
        setUniformColor(door, 0.25, 0.2, 0.15);
        return door;
    }
    const door1 = buildDoor(false); // x=0 face
    const door2 = buildDoor(true); // x=1 face

    // Windows, 8 floors evenly dividing the main body's height - a 3-bay facade on each
    // long face: a projecting center bay (full X reach, where the door + rooftop box
    // already are) with 2 windows/floor, flanked by two recessed wings (set back to
    // x=nx/1-nx, the same notch region as the footprint) with 2 windows/floor each.
    // Ground floor's center-bay windows are skipped (the door occupies that spot); the
    // wings keep windows on every floor including ground. Glass-toned (bluish-grey),
    // distinct from the doors' brown, same fixed-color-under-instanceColor mechanism.
    const FLOOR_COUNT = 8;
    const FLOOR_HEIGHT = TOPPEDBOX_MAIN_HEIGHT_FRACTION / FLOOR_COUNT;
    const WINDOW_HALF_WIDTH = 0.0191;
    const WINDOW_HEIGHT = 0.0457;
    // Center-bay window offset - pulled in close to the door rather than centered in the bay.
    const CENTER_WINDOW_OFFSET = 0.066;
    // 3 windows per wing, each wing spanning z in [0,nz] or [1-nz,1].
    const WING_WINDOW_Z = [nz * 0.15, nz * 0.5, nz * 0.85, 1 - nz * 0.85, 1 - nz * 0.5, 1 - nz * 0.15];

    function buildWindow(x, z, floorY) {
        const win = new THREE.BoxGeometry(DOOR_THICKNESS, WINDOW_HEIGHT, WINDOW_HALF_WIDTH * 2).toNonIndexed();
        win.deleteAttribute("normal");
        win.deleteAttribute("uv");
        win.translate(x, floorY, z);
        setUniformColor(win, 0.25, 0.3, 0.35);
        return win;
    }

    const windows = [];
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {
        const floorY = (floor + 0.5) * FLOOR_HEIGHT;
        if (floor > 0) {
            windows.push(buildWindow(-DOOR_THICKNESS / 2, 0.5 - CENTER_WINDOW_OFFSET, floorY));
            windows.push(buildWindow(-DOOR_THICKNESS / 2, 0.5 + CENTER_WINDOW_OFFSET, floorY));
            windows.push(buildWindow(1 + DOOR_THICKNESS / 2, 0.5 - CENTER_WINDOW_OFFSET, floorY));
            windows.push(buildWindow(1 + DOOR_THICKNESS / 2, 0.5 + CENTER_WINDOW_OFFSET, floorY));
        }
        for (const z of WING_WINDOW_Z) {
            windows.push(buildWindow(nx - DOOR_THICKNESS / 2, z, floorY));
            windows.push(buildWindow(1 - nx + DOOR_THICKNESS / 2, z, floorY));
        }
    }

    return mergeGeometries([main, top, door1, door2, ...windows], false);
}

// Notch, as fractions of the local unit cube, for buildGenericNotchedApartmentGeometry -
// calibrated for SM_Apartment_Block_4story02v1's real footprint (~22.2m x ~33.4m).
const NOTCHEDAPARTMENT_NOTCH_X = 0.1127;
const NOTCHEDAPARTMENT_NOTCH_Z = 0.1796;

function buildGenericNotchedApartmentGeometry() {
    // Same notched-corner (right-angle step, not chamfer) main body as
    // buildGenericToppedBoxGeometry, with a door centered on each long face, windows
    // flanking each door, and windows on each notch (wing) face - but no rooftop box
    // (not requested for this smaller, 4-story species). Spans the unit cube
    // (0,0,0)-(1,1,1) like buildGenericBoxGeometry, so it gets the same per-species
    // non-uniform scale+translate treatment in buildInstancedBoxProps.
    const nx = NOTCHEDAPARTMENT_NOTCH_X, nz = NOTCHEDAPARTMENT_NOTCH_Z;
    const notchedRect = [
        [nx, 0], [1 - nx, 0], [1 - nx, nz], [1, nz], [1, 1 - nz], [1 - nx, 1 - nz],
        [1 - nx, 1], [nx, 1], [nx, 1 - nz], [0, 1 - nz], [0, nz], [nx, nz],
    ];
    const main = buildPrismGeometry(notchedRect, 1);
    setUniformColor(main, 1, 1, 1);

    // Doors, one centered on each long face - same real-world size as
    // buildGenericToppedBoxGeometry's doors, converted into this species' own local fractions.
    const DOOR_HALF_WIDTH = 0.0337;
    const DOOR_HEIGHT = 0.1937;
    const DOOR_THICKNESS = 0.0022;
    function buildDoor(onMaxXFace) {
        const door = new THREE.BoxGeometry(DOOR_THICKNESS, DOOR_HEIGHT, DOOR_HALF_WIDTH * 2).toNonIndexed();
        door.deleteAttribute("normal");
        door.deleteAttribute("uv");
        const x = onMaxXFace ? 1 + DOOR_THICKNESS / 2 : -DOOR_THICKNESS / 2;
        door.translate(x, DOOR_HEIGHT / 2, 0.5);
        setUniformColor(door, 0.25, 0.2, 0.15);
        return door;
    }
    const door1 = buildDoor(false);
    const door2 = buildDoor(true);

    // Windows: 4 floors evenly dividing the full height.
    const FLOOR_COUNT = 4;
    const FLOOR_HEIGHT = 1 / FLOOR_COUNT;
    const WINDOW_HALF_WIDTH = 0.015;
    const WINDOW_HEIGHT = 0.0881;
    // Door-face windows: 2 each side of the door, between the door edge and the notch
    // edge - skipped on the ground floor (the door occupies that spot instead).
    const DOOR_FACE_WINDOW_Z = [0.2513, 0.3946, 0.6054, 0.7487];
    // Notch-face windows: 2 per notch, on every floor including ground - not blocked by
    // the door since they're on a different wall.
    const NOTCH_FACE_WINDOW_Z = [nz * 0.3, nz * 0.7, 1 - nz * 0.7, 1 - nz * 0.3];

    function buildWindow(x, z, floorY) {
        const win = new THREE.BoxGeometry(DOOR_THICKNESS, WINDOW_HEIGHT, WINDOW_HALF_WIDTH * 2).toNonIndexed();
        win.deleteAttribute("normal");
        win.deleteAttribute("uv");
        win.translate(x, floorY, z);
        setUniformColor(win, 0.25, 0.3, 0.35);
        return win;
    }

    const windows = [];
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {
        const floorY = (floor + 0.5) * FLOOR_HEIGHT;
        if (floor > 0) {
            for (const z of DOOR_FACE_WINDOW_Z) {
                windows.push(buildWindow(-DOOR_THICKNESS / 2, z, floorY));
                windows.push(buildWindow(1 + DOOR_THICKNESS / 2, z, floorY));
            }
        }
        for (const z of NOTCH_FACE_WINDOW_Z) {
            windows.push(buildWindow(nx - DOOR_THICKNESS / 2, z, floorY));
            windows.push(buildWindow(1 - nx + DOOR_THICKNESS / 2, z, floorY));
        }
    }

    // One centered window on each of the two flat short end faces (z=0, z=1, spanning
    // x in [nx,1-nx]) per floor - the only walls with nothing on them so far.
    const END_WINDOW_HALF_WIDTH = 0.0225;
    const END_WINDOW_THICKNESS = 0.0015;
    function buildEndWindow(z, floorY) {
        const win = new THREE.BoxGeometry(END_WINDOW_HALF_WIDTH * 2, WINDOW_HEIGHT, END_WINDOW_THICKNESS).toNonIndexed();
        win.deleteAttribute("normal");
        win.deleteAttribute("uv");
        const zPos = z === 0 ? -END_WINDOW_THICKNESS / 2 : 1 + END_WINDOW_THICKNESS / 2;
        win.translate(0.5, floorY, zPos);
        setUniformColor(win, 0.25, 0.3, 0.35);
        return win;
    }
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {
        const floorY = (floor + 0.5) * FLOOR_HEIGHT;
        windows.push(buildEndWindow(0, floorY), buildEndWindow(1, floorY));
    }

    return mergeGeometries([main, door1, door2, ...windows], false);
}

function buildGenericCylinderGeometry() {
    // A cylinder inscribed in the unit cube, for round objects (silos, tanks, towers)
    // where a box placeholder would obviously read wrong.
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 20).toNonIndexed();
    geometry.translate(0.5, 0.5, 0.5);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

// Box base height as a fraction of the unit cube, and shaft radius (unit-space, base
// spans 0-1) - calibrated for SM_Factory_Chimney_01's real ~23.16m height (~4m base).
const CHIMNEY_BASE_HEIGHT_FRACTION = 0.1727;
const CHIMNEY_SHAFT_RADIUS = 0.3;

function buildGenericChimneyGeometry() {
    // Box base + cylinder shaft - for factory chimney species where a plain cylinder or
    // box placeholder reads wrong on its own. Spans the unit cube (0,0,0)-(1,1,1) like
    // every other buildInstancedBoxProps shape.
    const base = new THREE.BoxGeometry(1, CHIMNEY_BASE_HEIGHT_FRACTION, 1).toNonIndexed();
    base.translate(0.5, CHIMNEY_BASE_HEIGHT_FRACTION / 2, 0.5);
    const shaftHeight = 1 - CHIMNEY_BASE_HEIGHT_FRACTION;
    const shaft = new THREE.CylinderGeometry(CHIMNEY_SHAFT_RADIUS, CHIMNEY_SHAFT_RADIUS, shaftHeight, 20).toNonIndexed();
    shaft.translate(0.5, CHIMNEY_BASE_HEIGHT_FRACTION + shaftHeight / 2, 0.5);
    const geometry = mergeGeometries([base, shaft], false);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

function buildGenericLogGeometry() {
    // A single cylinder lying on its side, length along local Z instead of Y - for
    // fallen-log species whose long axis is horizontal.
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16).toNonIndexed();
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0.5, 0.5, 0.5);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

function buildGenericLogPileGeometry() {
    // A pyramid of cylindrical "logs" (3 on the bottom row, 2 nested on top). Renormalized
    // to span the unit cube (0,0,0)-(1,1,1) exactly at the end since the packing math is
    // only approximate.
    const radius = 1 / 6;
    const rowGap = radius * Math.sqrt(3);
    const positions = [
        [radius, radius], [3 * radius, radius], [5 * radius, radius],
        [2 * radius, radius + rowGap], [4 * radius, radius + rowGap],
    ];

    const color = new THREE.Color(0x6b4a2f);
    const logs = positions.map(([x, y]) => {
        const g = new THREE.CylinderGeometry(radius, radius, 1, 10).toNonIndexed();
        g.rotateX(Math.PI / 2);
        g.translate(x, y, 0.5);
        g.setAttribute("color", new THREE.BufferAttribute(
            new Float32Array(g.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? color.r : i % 3 === 1 ? color.g : color.b)), 3
        ));
        return g;
    });

    const merged = mergeGeometries(logs, false);
    merged.computeBoundingBox();
    const { min, max } = merged.boundingBox;
    merged.translate(-min.x, -min.y, -min.z);
    merged.scale(1 / (max.x - min.x), 1 / (max.y - min.y), 1 / (max.z - min.z));
    return merged;
}

function buildGenericBunkerGeometry() {
    // Trapezoid-prism aircraft bunker/hardened shelter, flat top, "/    \" cross-section
    // extruded along Z - the slope runs the full height, starting right at the ground (no
    // separate vertical wall section). Plus a hangar door on the front face. TOP_RATIO is
    // the measured real-species top-width to bottom-width ratio; spans the unit cube
    // (0,0,0)-(1,1,1) exactly.
    const TOP_RATIO = 0.386;
    const tx0 = (1 - TOP_RATIO) / 2;
    const tx1 = 1 - tx0;
    const bl0 = [0, 0, 0], br0 = [1, 0, 0], bl1 = [0, 0, 1], br1 = [1, 0, 1];
    const tl0 = [tx0, 1, 0], tr0 = [tx1, 1, 0], tl1 = [tx0, 1, 1], tr1 = [tx1, 1, 1];
    function quad(a, b, c, d) {
        return [a, b, c, a, c, d];
    }
    const tris = [
        ...quad(bl0, br0, br1, bl1), // bottom
        ...quad(tl0, tr0, tr1, tl1), // flat top
        ...quad(bl0, br0, tr0, tl0), // front end
        ...quad(bl1, br1, tr1, tl1), // back end
        ...quad(bl0, tl0, tl1, bl1), // left sloped side
        ...quad(br0, tr0, tr1, br1), // right sloped side
    ];
    const posArr = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { posArr[i * 3] = v[0]; posArr[i * 3 + 1] = v[1]; posArr[i * 3 + 2] = v[2]; });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    setUniformColor(geometry, 1, 1, 1);

    // Hangar door on the back (z=1) face. Centered exactly on the back face (half in,
    // half out) - a fully flush/recessed position z-fights with the bunker's own
    // coincident back face, so this reads as a slight panel without a full protrusion.
    const DOOR_HEIGHT = 0.8;
    const DOOR_HALF_WIDTH = 0.1752;
    const DOOR_THICKNESS = 0.005; // thin, not a chunky sticking-out rectangle
    const door = new THREE.BoxGeometry(DOOR_HALF_WIDTH * 2, DOOR_HEIGHT, DOOR_THICKNESS).toNonIndexed();
    door.deleteAttribute("normal");
    door.deleteAttribute("uv");
    door.translate(0.5, DOOR_HEIGHT / 2, 1);
    setUniformColor(door, 0.15, 0.15, 0.15);

    return mergeGeometries([geometry, door], false);
}

// Door proportions for buildGenericTubeHangarGeometry's z=1 doorway, as a fraction of the
// arch's local (pre-normalization) width/peak-height.
const TUBE_HANGAR_DOOR_HALF_WIDTH = 0.07;
const TUBE_HANGAR_DOOR_HEIGHT_FRACTION = 0.6;

function buildGenericTubeHangarGeometry() {
    // Airport "tube" hangar - half-cylinder arch shell (flat side on the ground, curved
    // roof), extruded along Z. z=0 is a fully solid semicircular end cap; z=1 is the same
    // wall with a rectangular doorway cut into its base, centered. Renormalized to the
    // unit cube (0,0,0)-(1,1,1) at the end.
    const SEGMENTS = 16;
    const arc = [];
    for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * Math.PI;
        arc.push([0.5 - 0.5 * Math.cos(theta), 0.5 * Math.sin(theta)]);
    }
    function quad(a, b, c, d) {
        return [a, b, c, a, c, d];
    }
    const tris = [];
    for (let i = 0; i < SEGMENTS; i++) {
        const [x0, y0] = arc[i], [x1, y1] = arc[i + 1];
        tris.push(...quad([x0, y0, 0], [x1, y1, 0], [x1, y1, 1], [x0, y0, 1])); // curved shell
    }
    const capCenter0 = [0.5, 0, 0];
    for (let i = 0; i < SEGMENTS; i++) {
        const [x0, y0] = arc[i], [x1, y1] = arc[i + 1];
        tris.push(capCenter0, [x1, y1, 0], [x0, y0, 0]);
    }
    const doorX0 = 0.5 - TUBE_HANGAR_DOOR_HALF_WIDTH;
    const doorX1 = 0.5 + TUBE_HANGAR_DOOR_HALF_WIDTH;
    const doorHeight = 0.5 * TUBE_HANGAR_DOOR_HEIGHT_FRACTION;
    const outline = new THREE.Shape(arc.map(([x, y]) => new THREE.Vector2(x, y)));
    const doorHole = new THREE.Path([
        new THREE.Vector2(doorX0, 0),
        new THREE.Vector2(doorX1, 0),
        new THREE.Vector2(doorX1, doorHeight),
        new THREE.Vector2(doorX0, doorHeight),
    ]);
    outline.holes.push(doorHole);
    const capWithDoor = new THREE.ShapeGeometry(outline);
    const capPos = capWithDoor.attributes.position;
    const capIdx = capWithDoor.index;
    for (let i = 0; i < capIdx.count; i += 3) {
        const tri = [];
        for (let k = 0; k < 3; k++) {
            const vi = capIdx.getX(i + k);
            tri.push([capPos.getX(vi), capPos.getY(vi), 1]);
        }
        tris.push(...tri);
    }
    const posArr = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { posArr[i * 3] = v[0]; posArr[i * 3 + 1] = v[1]; posArr[i * 3 + 2] = v[2]; });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    geometry.computeBoundingBox();
    const { min, max } = geometry.boundingBox;
    geometry.translate(-min.x, -min.y, -min.z);
    geometry.scale(1 / (max.x - min.x), 1 / (max.y - min.y), 1 / (max.z - min.z));
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

// Default roof color for species whose name doesn't mention a color at all.
const DEFAULT_ROOF_COLOR = 0x7a4a3a;
const ROOF_COLOR_BY_NAME_KEYWORD = [
    [/^SM_Norwayhouse_(2b|6a|5a)$/i, 0x626272],
    [/^SM_Norwayhouse_3c$/i, 0x8a8a8a],
    [/yellow/i, 0xab9a6e],
    [/red/i, 0xad7e74],
    [/blue/i, 0x536165],
    [/green/i, 0x708673],
    [/brick/i, 0x9c5b3c],
    [/white/i, 0xd8d4c8],
    [/gr[ae]y/i, 0x8a8a8a],
    [/wooden|wood/i, 0x6b4a2f],
    [/SM_Industrial_02/i, 0x8a8a8a],
];
function roofColorForSpecies(label) {
    for (const [re, color] of ROOF_COLOR_BY_NAME_KEYWORD) {
        if (re.test(label)) return color;
    }
    return DEFAULT_ROOF_COLOR;
}

// Round-tree canopy color - summer green, except a "Fall"-flagged species (e.g.
// SM_BirchLarge03_Fall), which gets autumn orange/maroon instead, and a "snowy"-flagged
// species (e.g. SM_ScotsPinesnowymid02_cut), which gets a pale snow-dusted green/grey -
// checked before the fall check.
const DEFAULT_CANOPY_COLOR = 0x4a7c3f;
const FALL_CANOPY_COLOR = 0x705c3a;
const FALL_SPECIES_PATTERN = /fall/i;
const SNOWY_CANOPY_COLOR = 0xaabc82;
const SNOWY_SPECIES_PATTERN = /snowy/i;
function canopyColorForSpecies(label) {
    if (SNOWY_SPECIES_PATTERN.test(label)) return SNOWY_CANOPY_COLOR;
    return FALL_SPECIES_PATTERN.test(label) ? FALL_CANOPY_COLOR : DEFAULT_CANOPY_COLOR;
}

// Default wall color for species whose name doesn't hint at a material.
const DEFAULT_WALL_COLOR = 0xb0a89c;
const WALL_COLOR_BY_NAME_KEYWORD = [
    [/SM_Industrial_02/i, 0x9c5b3c],
    [/^SM_Industrial_Small_Addon_01$/i, 0xbfb8a9],
    [/^SM_Norwayhouse_2b$/i, 0x908f51],
    [/^SM_Norwayhouse_(6a|5a)$/i, 0x613133],
    [/^SM_Norwayhouse_3c$/i, 0x1f3965],
    [/^(industrial_office1(_plain)?|CAF_industrial_office1)$/i, 0x636963],
];
function wallColorForSpecies(label) {
    for (const [re, color] of WALL_COLOR_BY_NAME_KEYWORD) {
        if (re.test(label)) return color;
    }
    return DEFAULT_WALL_COLOR;
}

function buildGenericHouseGeometry(ridgeAlongX = false) {
    // Box walls + a triangular-prism gable roof on top - the classic "Monopoly house"
    // silhouette. Walls and roof are kept as SEPARATE geometries so the roof can get its
    // own per-instance color without tinting the walls too.
    const wallHeight = 0.62;
    const walls = new THREE.BoxGeometry(1, wallHeight, 1).toNonIndexed();
    walls.translate(0.5, wallHeight / 2, 0.5);
    walls.deleteAttribute("normal");
    walls.deleteAttribute("uv");
    walls.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(walls.attributes.position.count * 3).fill(1), 3
    ));

    // Gable roof: ridge along Z at x=0.5 by default, from wallHeight up to 1 - built by
    // hand from 6 corner points (two triangular gable ends + two rectangular slopes).
    // ridgeAlongX swaps X/Z so the ridge instead runs the other way.
    const p = ridgeAlongX ? [
        [0, wallHeight, 0], [0, wallHeight, 1], [0, 1, 0.5],
        [1, wallHeight, 0], [1, wallHeight, 1], [1, 1, 0.5],
    ] : [
        [0, wallHeight, 0], [1, wallHeight, 0], [0.5, 1, 0],
        [0, wallHeight, 1], [1, wallHeight, 1], [0.5, 1, 1],
    ];
    const tris = [
        p[0], p[1], p[2],
        p[3], p[5], p[4],
        p[0], p[2], p[5], p[0], p[5], p[3],
        p[1], p[4], p[5], p[1], p[5], p[2],
    ];
    const roofPos = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { roofPos[i * 3] = v[0]; roofPos[i * 3 + 1] = v[1]; roofPos[i * 3 + 2] = v[2]; });
    const roof = new THREE.BufferGeometry();
    roof.setAttribute("position", new THREE.BufferAttribute(roofPos, 3));
    roof.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(roof.attributes.position.count * 3).fill(1), 3
    ));

    return { walls, roof };
}

function buildGenericFacadeHouseGeometry() {
    // Same gable house shape as buildGenericHouseGeometry (box walls + triangular-prism
    // roof), with a 2-floor door/window facade. Door face is x=1: floor 1 is [2 windows]
    // [door][4 windows][door][2 windows], 10 evenly-spaced positions along Z. The
    // opposite face (x=0) gets the same 10-position window rows but no door. On both
    // faces, floor 1's windows start at the same height the door ends; floor 2's windows
    // stay centered in their own band. Roof keeps its normal per-species color variation
    // (roofColorForSpecies, untouched).
    const { walls, roof } = buildGenericHouseGeometry();

    const wallHeight = 0.62;
    const FLOOR_COUNT = 2;
    const FLOOR_HEIGHT = wallHeight / FLOOR_COUNT;
    const DOOR_HEIGHT = FLOOR_HEIGHT * 0.7;
    const WINDOW_HEIGHT = FLOOR_HEIGHT * 0.3;
    const DOOR_HALF_WIDTH = 0.022;
    const WINDOW_HALF_WIDTH = 0.018;
    const THICKNESS = 0.005;

    // 10 evenly-spaced Z positions with margin - index 2 and 7 are doors on floor 1 of
    // the door face (symmetric: 2 windows, door, 4 windows, door, 2 windows).
    const positions = Array.from({ length: 10 }, (_, i) => 0.05 + (i + 0.5) * 0.09);
    const DOOR_INDICES = new Set([2, 7]);

    function buildOpening(onMaxXFace, z, floor, isDoor) {
        const floorY = floor * FLOOR_HEIGHT;
        const height = isDoor ? DOOR_HEIGHT : WINDOW_HEIGHT;
        const halfWidth = isDoor ? DOOR_HALF_WIDTH : WINDOW_HALF_WIDTH;
        const piece = new THREE.BoxGeometry(THICKNESS, height, halfWidth * 2).toNonIndexed();
        piece.deleteAttribute("normal");
        piece.deleteAttribute("uv");
        // Doors fill their floor band bottom-up (y=0). Floor 1 windows start right where
        // the door ends; floor 2+ windows stay centered in their own band.
        let y;
        if (isDoor) y = height / 2;
        else if (floor === 0) y = DOOR_HEIGHT + height / 2;
        else y = floorY + FLOOR_HEIGHT / 2;
        const x = onMaxXFace ? 1 + THICKNESS / 2 : -THICKNESS / 2;
        piece.translate(x, y, z);
        if (isDoor) setUniformColor(piece, 0.25, 0.2, 0.15);
        else setUniformColor(piece, 0.25, 0.3, 0.35);
        return piece;
    }

    const openings = [];
    positions.forEach((z, i) => {
        for (let floor = 0; floor < FLOOR_COUNT; floor++) {
            openings.push(buildOpening(true, z, floor, floor === 0 && DOOR_INDICES.has(i))); // x=1, door face
            openings.push(buildOpening(false, z, floor, false)); // x=0, windows only
        }
    });

    const facadeWalls = mergeGeometries([walls, ...openings], false);
    return { walls: facadeWalls, roof };
}

function buildGenericFourStoryApartmentGeometry() {
    // Same gable house shape as buildGenericHouseGeometry, with a 4-floor door/window
    // facade - buildGenericFacadeHouseGeometry's bigger sibling. Door face is x=1, same
    // 10 evenly-spaced Z positions with 2 door columns (index 2 and 7). Ground floor:
    // door columns get a door on the door face only, nothing else anywhere (opposite
    // face and non-door columns stay fully blank) - the door is the only ground-floor
    // opening, matching a real apartment entrance with no ground-floor windows. Floors
    // 1-3: door columns get 2 stairwell windows on BOTH faces, sitting at the floor
    // BOUNDARIES above the door (y = 2*FLOOR_HEIGHT and 3*FLOOR_HEIGHT) rather than
    // centered in either floor's own band - reads as a stairwell landing window, not a
    // room window. Non-door columns get a regular window centered in its own band on
    // both faces, once per floor for floors 1-3.
    const { walls, roof } = buildGenericHouseGeometry();

    const wallHeight = 0.62;
    const FLOOR_COUNT = 4;
    const FLOOR_HEIGHT = wallHeight / FLOOR_COUNT;
    const DOOR_HEIGHT = FLOOR_HEIGHT * 0.7;
    const WINDOW_HEIGHT = FLOOR_HEIGHT * 0.5;
    const DOOR_HALF_WIDTH = 0.022;
    const WINDOW_HALF_WIDTH = 0.018;
    const THICKNESS = 0.005;

    // Same 10-position door-face layout as buildGenericFacadeHouseGeometry.
    const positions = Array.from({ length: 10 }, (_, i) => 0.05 + (i + 0.5) * 0.09);
    const DOOR_INDICES = new Set([2, 7]);

    function buildOpening(onMaxXFace, z, y, isDoor) {
        const height = isDoor ? DOOR_HEIGHT : WINDOW_HEIGHT;
        const halfWidth = isDoor ? DOOR_HALF_WIDTH : WINDOW_HALF_WIDTH;
        const piece = new THREE.BoxGeometry(THICKNESS, height, halfWidth * 2).toNonIndexed();
        piece.deleteAttribute("normal");
        piece.deleteAttribute("uv");
        const x = onMaxXFace ? 1 + THICKNESS / 2 : -THICKNESS / 2;
        piece.translate(x, y, z);
        if (isDoor) setUniformColor(piece, 0.25, 0.2, 0.15);
        else setUniformColor(piece, 0.25, 0.3, 0.35);
        return piece;
    }

    const openings = [];
    positions.forEach((z, i) => {
        const isDoorColumn = DOOR_INDICES.has(i);
        if (isDoorColumn) {
            openings.push(buildOpening(true, z, DOOR_HEIGHT / 2, true)); // door, ground floor
            openings.push(buildOpening(true, z, 2 * FLOOR_HEIGHT, false)); // stairwell window, floor 2/3 boundary
            openings.push(buildOpening(true, z, 3 * FLOOR_HEIGHT, false)); // stairwell window, floor 3/4 boundary
            openings.push(buildOpening(false, z, 2 * FLOOR_HEIGHT, false));
            openings.push(buildOpening(false, z, 3 * FLOOR_HEIGHT, false));
        } else {
            for (let floor = 1; floor < FLOOR_COUNT; floor++) {
                const y = floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
                openings.push(buildOpening(true, z, y, false));
                openings.push(buildOpening(false, z, y, false));
            }
        }
    });

    const facadeWalls = mergeGeometries([walls, ...openings], false);
    return { walls: facadeWalls, roof };
}

function buildGenericThreeStorySmallApartmentGeometry() {
    // Same gable house shape, 3-floor facade with real-world-calibrated opening sizes
    // (this species' real bbox is 13.62 x 16.43 x 18.50, X/Y/Z) instead of the fractional
    // FLOOR_HEIGHT-relative sizing buildGenericFourStoryApartmentGeometry uses - small
    // enough that a fraction of wallHeight read too large. Door face is x=1, 5 evenly-
    // spaced Z positions with a single door column (index 2, the middle one). Door rows
    // are packed between the door top and the roofline (ROW_GAP margin on each end)
    // rather than split into even FLOOR_HEIGHT bands, so 3 window rows fit cleanly above
    // the door without one colliding with it. Door column gets 2 stairwell windows at the
    // midpoints between row 1/2 and row 2/3 (door face only); every other column gets a
    // regular window on all 3 rows, both faces.
    const { walls, roof } = buildGenericHouseGeometry();

    const wallHeight = 0.62;
    const FLOOR_COUNT = 3;
    // Real bbox for this species: 13.62 x 16.43 x 18.50 (X/Y/Z).
    const WINDOW_HEIGHT = 1.2 / 16.43; // ~1.2m real
    const WINDOW_HALF_WIDTH = (1.2 / 18.50) / 2;
    const DOOR_HEIGHT = 2.80 / 16.43; // ~2.80m real
    const DOOR_HALF_WIDTH = (1.47 / 18.50) / 2; // ~1.47m real
    const THICKNESS = 0.005;

    const positions = Array.from({ length: 5 }, (_, i) => 0.05 + (i + 0.5) * 0.18);
    const DOOR_INDEX = 2;

    const ROW_GAP = 0.02;
    const rowsBottom = DOOR_HEIGHT + ROW_GAP;
    const rowsTop = wallHeight - ROW_GAP;
    const rowSegment = (rowsTop - rowsBottom) / FLOOR_COUNT;
    const rowY = Array.from({ length: FLOOR_COUNT }, (_, i) => rowsBottom + (i + 0.5) * rowSegment);

    function buildOpening(onMaxXFace, z, y, isDoor) {
        const height = isDoor ? DOOR_HEIGHT : WINDOW_HEIGHT;
        const halfWidth = isDoor ? DOOR_HALF_WIDTH : WINDOW_HALF_WIDTH;
        const piece = new THREE.BoxGeometry(THICKNESS, height, halfWidth * 2).toNonIndexed();
        piece.deleteAttribute("normal");
        piece.deleteAttribute("uv");
        const x = onMaxXFace ? 1 + THICKNESS / 2 : -THICKNESS / 2;
        piece.translate(x, y, z);
        if (isDoor) setUniformColor(piece, 0.25, 0.2, 0.15);
        else setUniformColor(piece, 0.25, 0.3, 0.35);
        return piece;
    }

    const openings = [];
    positions.forEach((z, i) => {
        if (i === DOOR_INDEX) {
            openings.push(buildOpening(true, z, DOOR_HEIGHT / 2, true));
            openings.push(buildOpening(true, z, (rowY[0] + rowY[1]) / 2, false));
            openings.push(buildOpening(true, z, (rowY[1] + rowY[2]) / 2, false));
        } else {
            for (let floor = 0; floor < FLOOR_COUNT; floor++) {
                openings.push(buildOpening(true, z, rowY[floor], false));
                openings.push(buildOpening(false, z, rowY[floor], false));
            }
        }
    });

    const facadeWalls = mergeGeometries([walls, ...openings], false);
    return { walls: facadeWalls, roof };
}

// Fixed colors for buildGenericIndustrialOfficeGeometry's windows/door - kept off the
// walls mesh (and off wallColorForSpecies/instanceColor) since merging them in would let
// the per-species wall tint wrongly multiply the window/door colors too.
const INDUSTRIALOFFICE_WINDOW_COLOR = 0x404d59;
const INDUSTRIALOFFICE_DOOR_COLOR = 0x403326;

function buildGenericIndustrialOfficeGeometry() {
    // Plain box body (industrial_office1's real shape has no roof overhang worth a
    // separate mesh, unlike the gable-house shapes) with 3 separately-instanced overlay
    // meshes: walls (per-species tinted, see wallColorForSpecies), windows and door (both
    // fixed-color, see INDUSTRIALOFFICE_WINDOW_COLOR/_DOOR_COLOR). All real-world sizes
    // below (2.2, 1.6, 3.8, 1.8, 13.04, 11.6, 31.93, etc.) are hardcoded to
    // industrial_office1's specific real bbox (~13 x 11.6 x 32, X/Y/Z) - not reusable
    // as-is for a different species' bbox.
    const box = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
    box.translate(0.5, 0.5, 0.5);
    box.deleteAttribute("normal");
    box.deleteAttribute("uv");
    setUniformColor(box, 1, 1, 1);

    const FLOOR_COUNT = 2;
    const FLOOR_HEIGHT = 1 / FLOOR_COUNT;
    const WINDOW_HEIGHT = 2.2 / 11.6;
    const WINDOW_HALF_WIDTH = 1.6 / 31.93;
    const WINDOW_WIDTH = WINDOW_HALF_WIDTH * 2;
    const WINDOW_BOTTOM_MARGIN_BY_FLOOR = [2.5 / 11.6, 1.8 / 11.6];
    const THICKNESS = 0.005;
    const WINDOW_COUNT = 7;

    const GAP = (1 - WINDOW_COUNT * WINDOW_WIDTH) / (WINDOW_COUNT + 1);
    const positions = Array.from({ length: WINDOW_COUNT }, (_, i) => GAP * (i + 1) + WINDOW_WIDTH * (i + 0.5));

    function buildWindow(z, floor) {
        const y = floor * FLOOR_HEIGHT + WINDOW_BOTTOM_MARGIN_BY_FLOOR[floor] + WINDOW_HEIGHT / 2;
        const piece = new THREE.BoxGeometry(THICKNESS, WINDOW_HEIGHT, WINDOW_WIDTH).toNonIndexed();
        piece.deleteAttribute("normal");
        piece.deleteAttribute("uv");
        piece.translate(-THICKNESS / 2, y, z);
        setUniformColor(piece, 1, 1, 1);
        return piece;
    }

    // North-face door (ground floor, 3rd window slot).
    const DOOR_INDEX = 2;
    const DOOR_HEIGHT = 3.8 / 11.6;
    function buildDoor(z) {
        const piece = new THREE.BoxGeometry(THICKNESS, DOOR_HEIGHT, WINDOW_WIDTH).toNonIndexed();
        piece.deleteAttribute("normal");
        piece.deleteAttribute("uv");
        piece.translate(-THICKNESS / 2, DOOR_HEIGHT / 2, z);
        setUniformColor(piece, 1, 1, 1);
        return piece;
    }

    // East/west (short end wall) doors, 2nd floor.
    const END_DOOR_WIDTH = 1.8 / 13.04;
    const END_DOOR_HEIGHT = 3.2 / 11.6;
    function buildEndDoor(onMaxZFace) {
        const piece = new THREE.BoxGeometry(END_DOOR_WIDTH, END_DOOR_HEIGHT, THICKNESS).toNonIndexed();
        piece.deleteAttribute("normal");
        piece.deleteAttribute("uv");
        const y = FLOOR_HEIGHT + END_DOOR_HEIGHT / 2;
        const z = onMaxZFace ? 1 + THICKNESS / 2 : -THICKNESS / 2;
        piece.translate(0.5, y, z);
        setUniformColor(piece, 1, 1, 1);
        return piece;
    }

    const windows = [];
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {
        positions.forEach((z, i) => {
            if (floor === 0 && i === DOOR_INDEX) return;
            windows.push(buildWindow(z, floor));
        });
    }
    const door = mergeGeometries([buildDoor(positions[DOOR_INDEX]), buildEndDoor(true), buildEndDoor(false)], false);

    // South-face top row: 4 wide windows near the roofline.
    const TOP_WINDOW_COUNT = 4;
    const TOP_WINDOW_HEIGHT = 1.0 / 11.6;
    const TOP_WINDOW_HALF_WIDTH = 2.0 / 31.93;
    const TOP_WINDOW_TOP_MARGIN = 1.0 / 11.6;
    const TOP_WINDOW_WIDTH = TOP_WINDOW_HALF_WIDTH * 2;
    const topGap = (1 - TOP_WINDOW_COUNT * TOP_WINDOW_WIDTH) / (TOP_WINDOW_COUNT + 1);
    const topPositions = Array.from({ length: TOP_WINDOW_COUNT }, (_, i) => topGap * (i + 1) + TOP_WINDOW_WIDTH * (i + 0.5));
    const topY = 1 - TOP_WINDOW_TOP_MARGIN - TOP_WINDOW_HEIGHT / 2;
    function buildTopWindow(z) {
        const piece = new THREE.BoxGeometry(THICKNESS, TOP_WINDOW_HEIGHT, TOP_WINDOW_WIDTH).toNonIndexed();
        piece.deleteAttribute("normal");
        piece.deleteAttribute("uv");
        piece.translate(1 + THICKNESS / 2, topY, z);
        setUniformColor(piece, 1, 1, 1);
        return piece;
    }
    for (const z of topPositions) windows.push(buildTopWindow(z));

    return { walls: box, windows: mergeGeometries(windows, false), door };
}

// Fixed grey for buildGenericMonoSlopeHouseGeometry's roof - a flat industrial roof tone,
// not per-species like roofColorForSpecies.
const MONOSLOPE_ROOF_COLOR = 0x8a8a8a;

function buildGenericMonoSlopeHouseGeometry() {
    // Same box walls as buildGenericHouseGeometry, but a single-slope (mono-pitch/shed)
    // roof instead of a gable - a gently tilted flat slab. Slope runs along Z: low edge
    // at z=0 (meets the flat wall top exactly), high edge at z=1. SLOPE_GRADE is a
    // rise/run ratio over the unit footprint's local depth, not a real-world-calibrated
    // pitch - this placeholder gets non-uniformly scaled per instance like every other
    // one here, so it only holds in this local unit-cube space, not after scaling.
    //
    // The wall top is flat (constant y=wallHeight) but the roof underside rises toward
    // z=1, leaving a gap between them there. That gap is a triangular prism running the
    // full X width: the two end-cap triangles (at x=0 and x=1) close its sides, and a
    // third rectangular face at z=1 (from y=wallHeight up to the roof's high edge) closes
    // its back. All three merged into the walls geometry (wall-colored, not roof-colored)
    // - they read as the wall plane rising to meet the roof, like a shed's high end wall.
    const wallHeight = 0.62;
    const SLOPE_GRADE = 0.15;
    const ROOF_THICKNESS = 0.05;

    function quad(a, b, c, d) {
        return [a, b, c, a, c, d];
    }

    const box = new THREE.BoxGeometry(1, wallHeight, 1).toNonIndexed();
    box.translate(0.5, wallHeight / 2, 0.5);
    box.deleteAttribute("normal");
    box.deleteAttribute("uv");

    function gableFillTris(x) {
        // A: zero-height corner at the low edge (z=0). B: base of the tall end (z=1),
        // level with the flat wall top. C: tip of the tall end (z=1), at the roof's
        // underside height.
        const A = [x, wallHeight, 0];
        const B = [x, wallHeight, 1];
        const C = [x, wallHeight + SLOPE_GRADE, 1];
        return [A, B, C];
    }
    const backFill = quad([0, wallHeight, 1], [1, wallHeight, 1], [1, wallHeight + SLOPE_GRADE, 1], [0, wallHeight + SLOPE_GRADE, 1]);
    const fillPos = new Float32Array([...gableFillTris(0), ...gableFillTris(1), ...backFill].flat());
    const fill = new THREE.BufferGeometry();
    fill.setAttribute("position", new THREE.BufferAttribute(fillPos, 3));

    const walls = mergeGeometries([box, fill], false);
    walls.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(walls.attributes.position.count * 3).fill(1), 3
    ));

    const lowY = wallHeight; // at z=0
    const highY = wallHeight + SLOPE_GRADE; // at z=1
    const b00 = [0, lowY, 0], b10 = [1, lowY, 0];
    const b01 = [0, highY, 1], b11 = [1, highY, 1];
    const t00 = [0, lowY + ROOF_THICKNESS, 0], t10 = [1, lowY + ROOF_THICKNESS, 0];
    const t01 = [0, highY + ROOF_THICKNESS, 1], t11 = [1, highY + ROOF_THICKNESS, 1];
    const tris = [
        ...quad(t00, t10, t11, t01), // top
        ...quad(b00, b01, b11, b10), // bottom
        ...quad(b00, b10, t10, t00), // low end (z=0)
        ...quad(b01, t01, t11, b11), // high end (z=1)
        ...quad(b00, t00, t01, b01), // side (x=0)
        ...quad(b10, b11, t11, t10), // side (x=1)
    ];
    const roofPos = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { roofPos[i * 3] = v[0]; roofPos[i * 3 + 1] = v[1]; roofPos[i * 3 + 2] = v[2]; });
    const roof = new THREE.BufferGeometry();
    roof.setAttribute("position", new THREE.BufferAttribute(roofPos, 3));
    roof.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(roof.attributes.position.count * 3).fill(1), 3
    ));

    return { walls, roof };
}

// Fixed colors for buildGenericMonoSlopeHouseDoorGeometry - all three meshes are
// fixed-color (not per-species like wallColorForSpecies/roofColorForSpecies), since this
// shape stands in for one specific real species rather than a whole family of them.
const MONOSLOPEHOUSEDOOR_ROOF_COLOR = 0x8fa695;
const MONOSLOPEHOUSEDOOR_WALL_COLOR = 0xa0927f;
const MONOSLOPEHOUSEDOOR_DOOR_COLOR = 0x403326;

function buildGenericMonoSlopeHouseDoorGeometry() {
    // Same mono-slope shed shape as buildGenericMonoSlopeHouseGeometry, rotated 90 degrees
    // (see rotateXZPlus90()) so the tall end wall - originally at z=1, where the roof
    // meets its high edge - ends up on the x=1 face instead, plus a door on that face.
    // Door face/size taken from real ground truth: EU_shed_med_wood_01's actual mesh has a
    // WarehouseDoor-material primitive near the max-X face.
    const { walls, roof } = buildGenericMonoSlopeHouseGeometry();
    rotateXZPlus90(walls);
    rotateXZPlus90(roof);

    const THICKNESS = 0.005;
    const DOOR_HEIGHT = 0.593; // real 2.04m of 3.44m
    const DOOR_WIDTH = 0.549; // real 2.06m of 3.75m (Z depth) - matches the real WarehouseDoor primitive's width exactly

    const door = new THREE.BoxGeometry(THICKNESS, DOOR_HEIGHT, DOOR_WIDTH).toNonIndexed();
    door.deleteAttribute("normal");
    door.deleteAttribute("uv");
    door.translate(1 + THICKNESS / 2, DOOR_HEIGHT / 2, 0.5);
    setUniformColor(door, 1, 1, 1);

    return { walls, roof, door };
}

function buildGenericLShapeGeometry() {
    // Two equal-sized rectangular wings meeting at a corner. The notch (missing quadrant)
    // is always at the local (maxX, minZ) corner.
    const wallHeight = 0.62;
    const top = new THREE.BoxGeometry(1, wallHeight, 0.5).toNonIndexed();
    top.translate(0.5, wallHeight / 2, 0.75);
    const bottomLeft = new THREE.BoxGeometry(0.5, wallHeight, 0.5).toNonIndexed();
    bottomLeft.translate(0.25, wallHeight / 2, 0.25);
    const geometry = mergeGeometries([top, bottomLeft], false);
    const color = new THREE.Color(0x8a8f94);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).map((_, i) => (i % 3 === 0 ? color.r : i % 3 === 1 ? color.g : color.b)), 3
    ));
    return geometry;
}

function buildGenericLShapeBoxGeometry() {
    // Flat-topped L, per-species colored. Notch at the local (minX, maxZ) corner.
    const wallHeight = 0.62;
    const bottom = new THREE.BoxGeometry(1, wallHeight, 0.5).toNonIndexed();
    bottom.translate(0.5, wallHeight / 2, 0.25);
    const topRight = new THREE.BoxGeometry(0.5, wallHeight, 0.5).toNonIndexed();
    topRight.translate(0.75, wallHeight / 2, 0.75);
    const geometry = mergeGeometries([bottom, topRight], false);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

function buildGenericLShapeBox2Geometry() {
    // Same flat-topped L, mirrored on Z - notch at the local (minX, minZ) corner.
    const wallHeight = 0.62;
    const top = new THREE.BoxGeometry(1, wallHeight, 0.5).toNonIndexed();
    top.translate(0.5, wallHeight / 2, 0.75);
    const bottomRight = new THREE.BoxGeometry(0.5, wallHeight, 0.5).toNonIndexed();
    bottomRight.translate(0.75, wallHeight / 2, 0.25);
    const geometry = mergeGeometries([top, bottomRight], false);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

function buildGenericLShapeHouseGeometry() {
    // Same L footprint as buildGenericLShapeGeometry, but with a peaked gable roof over
    // each wing - "two Monopoly houses joined at the corner". Notch at (minX, minZ).
    const wallHeight = 0.62;
    const roofTop = 1;

    const topWall = new THREE.BoxGeometry(1, wallHeight, 0.5).toNonIndexed();
    topWall.translate(0.5, wallHeight / 2, 0.75);
    const rightWall = new THREE.BoxGeometry(0.5, wallHeight, 0.5).toNonIndexed();
    rightWall.translate(0.75, wallHeight / 2, 0.25);
    const walls = mergeGeometries([topWall, rightWall], false);
    walls.deleteAttribute("normal");
    walls.deleteAttribute("uv");
    walls.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(walls.attributes.position.count * 3).fill(1), 3
    ));

    function gableTris(x0, x1, z0, z1, ridgeAlongX) {
        if (ridgeAlongX) {
            const zm = (z0 + z1) / 2;
            const p = [
                [x0, wallHeight, z0], [x0, wallHeight, z1], [x0, roofTop, zm],
                [x1, wallHeight, z0], [x1, wallHeight, z1], [x1, roofTop, zm],
            ];
            return [p[0], p[1], p[2], p[3], p[5], p[4], p[0], p[2], p[5], p[0], p[5], p[3], p[1], p[4], p[5], p[1], p[5], p[2]];
        }
        const xm = (x0 + x1) / 2;
        const p = [
            [x0, wallHeight, z0], [x1, wallHeight, z0], [xm, roofTop, z0],
            [x0, wallHeight, z1], [x1, wallHeight, z1], [xm, roofTop, z1],
        ];
        return [p[0], p[1], p[2], p[3], p[5], p[4], p[0], p[2], p[5], p[0], p[5], p[3], p[1], p[4], p[5], p[1], p[5], p[2]];
    }
    const tris = [
        ...gableTris(0, 1, 0.5, 1, true),
        ...gableTris(0.5, 1, 0, 0.5, false),
    ];
    const roofPos = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { roofPos[i * 3] = v[0]; roofPos[i * 3 + 1] = v[1]; roofPos[i * 3 + 2] = v[2]; });
    const roof = new THREE.BufferGeometry();
    roof.setAttribute("position", new THREE.BufferAttribute(roofPos, 3));
    roof.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(roof.attributes.position.count * 3).fill(1), 3
    ));

    return { walls, roof };
}

function buildGenericLShapeHouseGeometry2() {
    // Same two-wing gable-roofed L-house, mirrored across Z - notch at (minX, maxZ).
    const wallHeight = 0.62;
    const roofTop = 1;

    const bottomWall = new THREE.BoxGeometry(1, wallHeight, 0.5).toNonIndexed();
    bottomWall.translate(0.5, wallHeight / 2, 0.25);
    const rightWall = new THREE.BoxGeometry(0.5, wallHeight, 0.5).toNonIndexed();
    rightWall.translate(0.75, wallHeight / 2, 0.75);
    const walls = mergeGeometries([bottomWall, rightWall], false);
    walls.deleteAttribute("normal");
    walls.deleteAttribute("uv");
    walls.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(walls.attributes.position.count * 3).fill(1), 3
    ));

    function gableTris(x0, x1, z0, z1, ridgeAlongX) {
        if (ridgeAlongX) {
            const zm = (z0 + z1) / 2;
            const p = [
                [x0, wallHeight, z0], [x0, wallHeight, z1], [x0, roofTop, zm],
                [x1, wallHeight, z0], [x1, wallHeight, z1], [x1, roofTop, zm],
            ];
            return [p[0], p[1], p[2], p[3], p[5], p[4], p[0], p[2], p[5], p[0], p[5], p[3], p[1], p[4], p[5], p[1], p[5], p[2]];
        }
        const xm = (x0 + x1) / 2;
        const p = [
            [x0, wallHeight, z0], [x1, wallHeight, z0], [xm, roofTop, z0],
            [x0, wallHeight, z1], [x1, wallHeight, z1], [xm, roofTop, z1],
        ];
        return [p[0], p[1], p[2], p[3], p[5], p[4], p[0], p[2], p[5], p[0], p[5], p[3], p[1], p[4], p[5], p[1], p[5], p[2]];
    }
    const tris = [
        ...gableTris(0, 1, 0, 0.5, true),
        ...gableTris(0.5, 1, 0.5, 1, false),
    ];
    const roofPos = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { roofPos[i * 3] = v[0]; roofPos[i * 3 + 1] = v[1]; roofPos[i * 3 + 2] = v[2]; });
    const roof = new THREE.BufferGeometry();
    roof.setAttribute("position", new THREE.BufferAttribute(roofPos, 3));
    roof.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(roof.attributes.position.count * 3).fill(1), 3
    ));

    return { walls, roof };
}

function buildGenericDoubleGableGeometry(ridgeAlongZ = false) {
    // Plain rectangular footprint (no notch), but with TWO parallel gable roofs side by
    // side - "^^" seen from the end. Ridges run along local X by default; ridgeAlongZ
    // swaps X/Z for species whose real local long axis is Z instead.
    const wallHeight = 0.62;
    const roofTop = 1;

    const walls = new THREE.BoxGeometry(1, wallHeight, 1).toNonIndexed();
    walls.translate(0.5, wallHeight / 2, 0.5);
    walls.deleteAttribute("normal");
    walls.deleteAttribute("uv");
    walls.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(walls.attributes.position.count * 3).fill(1), 3
    ));

    function gableTrisAlongX(z0, z1) {
        const zm = (z0 + z1) / 2;
        const p = [
            [0, wallHeight, z0], [0, wallHeight, z1], [0, roofTop, zm],
            [1, wallHeight, z0], [1, wallHeight, z1], [1, roofTop, zm],
        ];
        return [p[0], p[1], p[2], p[3], p[5], p[4], p[0], p[2], p[5], p[0], p[5], p[3], p[1], p[4], p[5], p[1], p[5], p[2]];
    }
    function gableTrisAlongZ(x0, x1) {
        const xm = (x0 + x1) / 2;
        const p = [
            [x0, wallHeight, 0], [x1, wallHeight, 0], [xm, roofTop, 0],
            [x0, wallHeight, 1], [x1, wallHeight, 1], [xm, roofTop, 1],
        ];
        return [p[0], p[1], p[2], p[3], p[5], p[4], p[0], p[2], p[5], p[0], p[5], p[3], p[1], p[4], p[5], p[1], p[5], p[2]];
    }
    const tris = ridgeAlongZ ? [
        ...gableTrisAlongZ(0, 0.5),
        ...gableTrisAlongZ(0.5, 1),
    ] : [
        ...gableTrisAlongX(0, 0.5),
        ...gableTrisAlongX(0.5, 1),
    ];
    const roofPos = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => { roofPos[i * 3] = v[0]; roofPos[i * 3 + 1] = v[1]; roofPos[i * 3 + 2] = v[2]; });
    const roof = new THREE.BufferGeometry();
    roof.setAttribute("position", new THREE.BufferAttribute(roofPos, 3));
    roof.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(roof.attributes.position.count * 3).fill(1), 3
    ));

    return { walls, roof };
}

function buildGenericTShapeGeometry() {
    // A wide crossbar along the local minZ edge (full X width) with a narrower stem
    // extending toward maxZ from the middle third of X.
    const wallHeight = 0.62;
    const crossbar = new THREE.BoxGeometry(1, wallHeight, 1 / 3).toNonIndexed();
    crossbar.translate(0.5, wallHeight / 2, 1 / 6);
    const stem = new THREE.BoxGeometry(1 / 3, wallHeight, 2 / 3).toNonIndexed();
    stem.translate(0.5, wallHeight / 2, 2 / 3);
    const geometry = mergeGeometries([crossbar, stem], false);
    geometry.setAttribute("color", new THREE.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1), 3
    ));
    return geometry;
}

// Builds one InstancedMesh for a set of species entries, all sharing the same generic
// placeholder geometry, each instance scaled to that species' real height - shared by
// both trees and bushes. Returns the built InstancedMesh (caller decides where it goes)
// or null if there were no instances.
// colorFn is optional: (speciesLabel) => hex color, multiplies against the geometry's own
// (white) vertex color per-instance.
function buildInstancedVegetation(entries, buf, geometry, genericHeight, meshName, colorFn) {
    const totalInstances = entries.reduce((sum, s) => sum + s.instanceCount, 0);
    if (totalInstances === 0) return null;

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        metalness: 0,
        envMapIntensity: ENV_MAP_INTENSITY,
        flatShading: true,
        side: THREE.DoubleSide,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, totalInstances);
    const tmpMatrix = new THREE.Matrix4();
    const tmpColor = new THREE.Color();
    const scaleMatrix = new THREE.Matrix4();
    let writeIndex = 0;

    const decPos = new THREE.Vector3();
    const decQuat = new THREE.Quaternion();
    const decScale = new THREE.Vector3();
    for (const s of entries) {
        const { positions, matrices } = s.layout;
        const positionArr = new Float32Array(buf, positions.byteOffset, positions.byteLength / 4);
        const matrixArr = new Float32Array(buf, matrices.byteOffset, matrices.byteLength / 4);

        let naturalHeight = s.heightOverride;
        if (naturalHeight === undefined) {
            let minY = Infinity, maxY = -Infinity;
            for (let i = 1; i < positionArr.length; i += 3) {
                if (positionArr[i] < minY) minY = positionArr[i];
                if (positionArr[i] > maxY) maxY = positionArr[i];
            }
            naturalHeight = maxY - minY;
        }
        naturalHeight = Math.max(naturalHeight, 0.5);
        const scaleFactor = naturalHeight / genericHeight;
        scaleMatrix.makeScale(scaleFactor, scaleFactor, scaleFactor);

        const speciesLabel = s.label.replace(/_0$/, "");
        const instanceColor = colorFn ? colorFn(speciesLabel) : null;
        for (let i = 0; i < s.instanceCount; i++) {
            // Packed as position(3)+quaternion(4)+scale(3) (10 floats/instance).
            decPos.set(matrixArr[i * 10], matrixArr[i * 10 + 1], matrixArr[i * 10 + 2]);
            decQuat.set(matrixArr[i * 10 + 3], matrixArr[i * 10 + 4], matrixArr[i * 10 + 5], matrixArr[i * 10 + 6]);
            decScale.set(matrixArr[i * 10 + 7], matrixArr[i * 10 + 8], matrixArr[i * 10 + 9]);
            tmpMatrix.compose(decPos, decQuat, decScale).multiply(scaleMatrix);
            instancedMesh.setMatrixAt(writeIndex, tmpMatrix);
            if (instanceColor !== null) instancedMesh.setColorAt(writeIndex, tmpColor.setHex(instanceColor));
            writeIndex++;
        }
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.name = meshName;
    return instancedMesh;
}

// Same one-draw-call InstancedMesh idea as buildInstancedVegetation, but for "box" species
// (repeated identical props like shipping containers/buildings): no natural-height scaling
// from real geometry, instead each species gets its own scale+translate built from its
// stored [bboxMin, bboxMax], composed under the per-instance world matrix. One shared unit
// box/shape geometry covers every species regardless of real size. Returns the built
// InstancedMesh or null if there were no instances.
function buildInstancedBoxProps(entries, buf, geometry, meshName, colorFn) {
    const totalInstances = entries.reduce((sum, s) => sum + s.instanceCount, 0);
    if (totalInstances === 0) return null;

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        metalness: 0,
        envMapIntensity: ENV_MAP_INTENSITY,
        flatShading: true,
        side: THREE.DoubleSide,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, totalInstances);
    const tmpMatrix = new THREE.Matrix4();
    const tmpColor = new THREE.Color();
    const boxLocal = new THREE.Matrix4();
    const scaleM = new THREE.Matrix4();
    const translateM = new THREE.Matrix4();
    const decPos = new THREE.Vector3();
    const decQuat = new THREE.Quaternion();
    const decScale = new THREE.Vector3();
    let writeIndex = 0;

    for (const s of entries) {
        const { matrices } = s.layout;
        const matrixArr = new Float32Array(buf, matrices.byteOffset, matrices.byteLength / 4);

        const [minX, minY, minZ] = s.bboxMin;
        const [maxX, maxY, maxZ] = s.bboxMax;
        scaleM.makeScale(Math.max(maxX - minX, 0.01), Math.max(maxY - minY, 0.01), Math.max(maxZ - minZ, 0.01));
        translateM.makeTranslation(minX, minY, minZ);
        boxLocal.multiplyMatrices(translateM, scaleM);

        const speciesLabel = s.label.replace(/_0$/, "");
        const instanceColor = colorFn ? colorFn(speciesLabel) : null;
        for (let i = 0; i < s.instanceCount; i++) {
            decPos.set(matrixArr[i * 10], matrixArr[i * 10 + 1], matrixArr[i * 10 + 2]);
            decQuat.set(matrixArr[i * 10 + 3], matrixArr[i * 10 + 4], matrixArr[i * 10 + 5], matrixArr[i * 10 + 6]);
            decScale.set(matrixArr[i * 10 + 7], matrixArr[i * 10 + 8], matrixArr[i * 10 + 9]);
            tmpMatrix.compose(decPos, decQuat, decScale).multiply(boxLocal);
            instancedMesh.setMatrixAt(writeIndex, tmpMatrix);
            if (instanceColor !== null) instancedMesh.setColorAt(writeIndex, tmpColor.setHex(instanceColor));
            writeIndex++;
        }
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.name = meshName;
    return instancedMesh;
}


/**
 * Loads a map's trees/bushes/generic-building-placeholder instances (trees.json/
 * trees.bin) as one InstancedMesh per placeholder kind (see the buildGeneric*Geometry()
 * functions above). Not every map has this extracted yet - a missing/non-JSON manifest
 * resolves to empty arrays rather than throwing.
 *
 * trees.bin covers two unrelated things that just happen to share the same instanced-
 * matrix pipeline: real vegetation (round/columnar/conical/pine trees, bushes) AND
 * generic placeholder shapes standing in for buildings that only got a repeated shape
 * instead of real baked geometry (box/house/lshape/tshape/doublegable/cylinder/log/
 * logpile/bunker/tubehangar - the same building "kinds" props.bin's real geometry also
 * covers). Returned split into `vegetation` and `structures` so a caller can group
 * `structures` with props.bin's real buildings under one "show buildings" toggle, instead
 * of one toggle hiding the other's content just because it shipped in the same binary.
 *
 * Positions inside each instance's decomposed matrix are exactly as stored in trees.bin -
 * real absolute-meters, same frame as squad3DProps.js's loadProps(). The caller offsets
 * the whole returned group in one step rather than this module transforming every
 * instance matrix (see Squad3DSimulation._loadPropsAndTrees()).
 * @param {string} mapBase - `${process.env.API_URL}${activeMap.mapURL}`
 * @returns {Promise<{vegetation: THREE.Object3D[], structures: THREE.Object3D[]}>}
 */
export async function loadTrees(mapBase) {
    const empty = { vegetation: [], structures: [] };
    const manifestRes = await fetch(`${mapBase}3d/trees.json`);
    if (!manifestRes.ok || !(manifestRes.headers.get("content-type") || "").includes("json")) return empty;
    let manifest;
    try {
        manifest = await manifestRes.json();
    } catch {
        return empty;
    }

    const buf = await fetch(`${mapBase}3d/trees.bin`).then((res) => res.arrayBuffer());

    // Only primitive 0 per tree/bush species - other primitives (e.g. a tree's separate
    // leaves primitive) share the exact same per-instance transforms, so including them
    // would just duplicate matrices for no benefit. Box/house/lshape/tshape/etc species
    // are the exception: a "split primitive" species legitimately has one real part per
    // primitive, not a duplicate, so every primitive stays.
    const boxLikeKinds = new Set(["box", "house", "monoslopehouse", "monoslopehousedoor", "toppedbox", "notchedapartment", "facadehouse", "fourstoryapartment", "threestorysmallapartment", "industrialoffice", "lshape", "lshapehouse", "lshapehouse2", "tshape", "doublegable", "cylinder", "chimney", "log", "lshapebox", "lshapebox2", "logpile", "bunker", "tubehangar"]);
    const primaryEntries = manifest.species.filter((s) => s.label.endsWith("_0") || boxLikeKinds.has(s.kind));
    const bushEntries = primaryEntries.filter((s) => s.kind === "bush");
    const boxEntries = primaryEntries.filter((s) => s.kind === "box");
    const houseEntriesAll = primaryEntries.filter((s) => s.kind === "house");
    const houseEntries = houseEntriesAll.filter((s) => !isHouseRoofRidgeAlongX(s.label.replace(/_0$/, "")));
    const houseEntriesRidgeX = houseEntriesAll.filter((s) => isHouseRoofRidgeAlongX(s.label.replace(/_0$/, "")));
    const monoslopeHouseEntries = primaryEntries.filter((s) => s.kind === "monoslopehouse");
    const monoslopeHouseDoorEntries = primaryEntries.filter((s) => s.kind === "monoslopehousedoor");
    const toppedBoxEntries = primaryEntries.filter((s) => s.kind === "toppedbox");
    const notchedApartmentEntries = primaryEntries.filter((s) => s.kind === "notchedapartment");
    const facadeHouseEntries = primaryEntries.filter((s) => s.kind === "facadehouse");
    const fourStoryApartmentEntries = primaryEntries.filter((s) => s.kind === "fourstoryapartment");
    const threeStorySmallApartmentEntries = primaryEntries.filter((s) => s.kind === "threestorysmallapartment");
    const industrialOfficeEntries = primaryEntries.filter((s) => s.kind === "industrialoffice");
    const lshapeEntries = primaryEntries.filter((s) => s.kind === "lshape");
    const lshapehouseEntries = primaryEntries.filter((s) => s.kind === "lshapehouse");
    const lshapehouse2Entries = primaryEntries.filter((s) => s.kind === "lshapehouse2");
    const tshapeEntries = primaryEntries.filter((s) => s.kind === "tshape");
    const doublegableEntriesAll = primaryEntries.filter((s) => s.kind === "doublegable");
    const doublegableEntries = doublegableEntriesAll.filter((s) => !isDoubleGableRidgeAlongZ(s.label.replace(/_0$/, "")));
    const doublegableEntriesRidgeZ = doublegableEntriesAll.filter((s) => isDoubleGableRidgeAlongZ(s.label.replace(/_0$/, "")));
    const cylinderEntries = primaryEntries.filter((s) => s.kind === "cylinder");
    const chimneyEntries = primaryEntries.filter((s) => s.kind === "chimney");
    const logEntries = primaryEntries.filter((s) => s.kind === "log");
    const lshapeboxEntries = primaryEntries.filter((s) => s.kind === "lshapebox");
    const lshapebox2Entries = primaryEntries.filter((s) => s.kind === "lshapebox2");
    const logpileEntries = primaryEntries.filter((s) => s.kind === "logpile");
    const bunkerEntries = primaryEntries.filter((s) => s.kind === "bunker");
    const tubeHangarEntries = primaryEntries.filter((s) => s.kind === "tubehangar");
    const treeEntries = primaryEntries.filter((s) => s.kind !== "bush" && !boxLikeKinds.has(s.kind));
    const columnarEntries = treeEntries.filter((s) => isColumnarTree(s.label.replace(/_0$/, "")));
    const conicalEntries = treeEntries.filter((s) => isConicalTree(s.label.replace(/_0$/, "")));
    const pineEntries = treeEntries.filter((s) => isPineTree(s.label.replace(/_0$/, "")));
    const roundEntries = treeEntries.filter((s) => !isColumnarTree(s.label.replace(/_0$/, "")) && !isConicalTree(s.label.replace(/_0$/, "")) && !isPineTree(s.label.replace(/_0$/, "")));

    const round = buildGenericTreeGeometry();
    const columnar = buildGenericColumnarTreeGeometry();
    const conical = buildGenericConicalTreeGeometry();
    const pine = buildGenericPineGeometry();
    const bush = buildGenericBushGeometry();
    const box = buildGenericBoxGeometry();
    const house = buildGenericHouseGeometry();
    const houseRidgeX = buildGenericHouseGeometry(true);
    const monoslopeHouse = buildGenericMonoSlopeHouseGeometry();
    const monoslopeHouseDoor = buildGenericMonoSlopeHouseDoorGeometry();
    const toppedBox = buildGenericToppedBoxGeometry();
    const notchedApartment = buildGenericNotchedApartmentGeometry();
    const facadeHouse = buildGenericFacadeHouseGeometry();
    const fourStoryApartment = buildGenericFourStoryApartmentGeometry();
    const threeStorySmallApartment = buildGenericThreeStorySmallApartmentGeometry();
    const industrialOffice = buildGenericIndustrialOfficeGeometry();
    const lshape = buildGenericLShapeGeometry();
    const lshapehouse = buildGenericLShapeHouseGeometry();
    const lshapehouse2 = buildGenericLShapeHouseGeometry2();
    const tshape = buildGenericTShapeGeometry();
    const doublegable = buildGenericDoubleGableGeometry();
    const doublegableRidgeZ = buildGenericDoubleGableGeometry(true);
    const cylinder = buildGenericCylinderGeometry();
    const chimney = buildGenericChimneyGeometry();
    const log = buildGenericLogGeometry();
    const lshapebox = buildGenericLShapeBoxGeometry();
    const lshapebox2 = buildGenericLShapeBox2Geometry();
    const logpile = buildGenericLogPileGeometry();
    const bunker = buildGenericBunkerGeometry();
    const tubeHangar = buildGenericTubeHangarGeometry();

    const vegetation = [];
    const structures = [];
    const addVeg = (mesh) => { if (mesh) vegetation.push(mesh); };
    const addStruct = (mesh) => { if (mesh) structures.push(mesh); };

    // Trunk stays a fixed color; the canopy gets its own per-species instanceColor (fall
    // variants read autumn orange/maroon instead of green).
    addVeg(buildInstancedVegetation(roundEntries, buf, round.trunk, round.height, "trees_round_trunk"));
    addVeg(buildInstancedVegetation(roundEntries, buf, round.canopy, round.height, "trees_round_canopy", canopyColorForSpecies));
    addVeg(buildInstancedVegetation(columnarEntries, buf, columnar.geometry, columnar.height, "trees_columnar"));
    addVeg(buildInstancedVegetation(conicalEntries, buf, conical.geometry, conical.height, "trees_conical"));
    addVeg(buildInstancedVegetation(pineEntries, buf, pine.geometry, pine.height, "trees_pine"));
    addVeg(buildInstancedVegetation(bushEntries, buf, bush.geometry, bush.height, "bushes_generic"));
    addStruct(buildInstancedBoxProps(boxEntries, buf, box, "box_props_generic", boxColorForSpecies));
    // Walls stay one uniform color; the roof gets its own per-instance color derived from
    // the species name - two separate InstancedMeshes since they need different
    // per-instance coloring.
    addStruct(buildInstancedBoxProps(houseEntries, buf, house.walls, "house_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(houseEntries, buf, house.roof, "house_props_roof", roofColorForSpecies));
    addStruct(buildInstancedBoxProps(houseEntriesRidgeX, buf, houseRidgeX.walls, "house_props_walls_ridgex", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(houseEntriesRidgeX, buf, houseRidgeX.roof, "house_props_roof_ridgex", roofColorForSpecies));
    // Roof forced grey (see MONOSLOPE_ROOF_COLOR), not per-species like the gable house's
    // roofColorForSpecies.
    addStruct(buildInstancedBoxProps(monoslopeHouseEntries, buf, monoslopeHouse.walls, "monoslopehouse_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(monoslopeHouseEntries, buf, monoslopeHouse.roof, "monoslopehouse_props_roof", () => MONOSLOPE_ROOF_COLOR));
    addStruct(buildInstancedBoxProps(monoslopeHouseDoorEntries, buf, monoslopeHouseDoor.walls, "monoslopehousedoor_props_walls", () => MONOSLOPEHOUSEDOOR_WALL_COLOR));
    addStruct(buildInstancedBoxProps(monoslopeHouseDoorEntries, buf, monoslopeHouseDoor.roof, "monoslopehousedoor_props_roof", () => MONOSLOPEHOUSEDOOR_ROOF_COLOR));
    addStruct(buildInstancedBoxProps(monoslopeHouseDoorEntries, buf, monoslopeHouseDoor.door, "monoslopehousedoor_props_door", () => MONOSLOPEHOUSEDOOR_DOOR_COLOR));
    addStruct(buildInstancedBoxProps(toppedBoxEntries, buf, toppedBox, "toppedbox_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(notchedApartmentEntries, buf, notchedApartment, "notchedapartment_props_generic", boxColorForSpecies));
    // Walls carry the doors/windows baked in, tinted via wallColorForSpecies; roof keeps
    // the standard per-species roofColorForSpecies variation.
    addStruct(buildInstancedBoxProps(facadeHouseEntries, buf, facadeHouse.walls, "facadehouse_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(facadeHouseEntries, buf, facadeHouse.roof, "facadehouse_props_roof", roofColorForSpecies));
    addStruct(buildInstancedBoxProps(fourStoryApartmentEntries, buf, fourStoryApartment.walls, "fourstoryapartment_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(fourStoryApartmentEntries, buf, fourStoryApartment.roof, "fourstoryapartment_props_roof", roofColorForSpecies));
    addStruct(buildInstancedBoxProps(threeStorySmallApartmentEntries, buf, threeStorySmallApartment.walls, "threestorysmallapartment_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(threeStorySmallApartmentEntries, buf, threeStorySmallApartment.roof, "threestorysmallapartment_props_roof", roofColorForSpecies));
    // Three separately-instanced meshes: walls tinted per-species, windows/door fixed-color
    // - merging them into one mesh would let the wall tint wrongly multiply the other two.
    addStruct(buildInstancedBoxProps(industrialOfficeEntries, buf, industrialOffice.walls, "industrialoffice_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(industrialOfficeEntries, buf, industrialOffice.windows, "industrialoffice_props_windows", () => INDUSTRIALOFFICE_WINDOW_COLOR));
    addStruct(buildInstancedBoxProps(industrialOfficeEntries, buf, industrialOffice.door, "industrialoffice_props_door", () => INDUSTRIALOFFICE_DOOR_COLOR));
    addStruct(buildInstancedBoxProps(lshapeEntries, buf, lshape, "lshape_props_generic"));
    addStruct(buildInstancedBoxProps(lshapehouseEntries, buf, lshapehouse.walls, "lshapehouse_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(lshapehouseEntries, buf, lshapehouse.roof, "lshapehouse_props_roof", roofColorForSpecies));
    addStruct(buildInstancedBoxProps(lshapehouse2Entries, buf, lshapehouse2.walls, "lshapehouse2_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(lshapehouse2Entries, buf, lshapehouse2.roof, "lshapehouse2_props_roof", roofColorForSpecies));
    addStruct(buildInstancedBoxProps(tshapeEntries, buf, tshape, "tshape_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(doublegableEntries, buf, doublegable.walls, "doublegable_props_walls", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(doublegableEntries, buf, doublegable.roof, "doublegable_props_roof", roofColorForSpecies));
    addStruct(buildInstancedBoxProps(doublegableEntriesRidgeZ, buf, doublegableRidgeZ.walls, "doublegable_props_walls_ridgez", wallColorForSpecies));
    addStruct(buildInstancedBoxProps(doublegableEntriesRidgeZ, buf, doublegableRidgeZ.roof, "doublegable_props_roof_ridgez", roofColorForSpecies));
    addStruct(buildInstancedBoxProps(cylinderEntries, buf, cylinder, "cylinder_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(chimneyEntries, buf, chimney, "chimney_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(logEntries, buf, log, "log_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(lshapeboxEntries, buf, lshapebox, "lshapebox_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(lshapebox2Entries, buf, lshapebox2, "lshapebox2_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(logpileEntries, buf, logpile, "logpile_props_generic"));
    addStruct(buildInstancedBoxProps(bunkerEntries, buf, bunker, "bunker_props_generic", boxColorForSpecies));
    addStruct(buildInstancedBoxProps(tubeHangarEntries, buf, tubeHangar, "tubehangar_props_generic", boxColorForSpecies));

    return { vegetation, structures };
}
