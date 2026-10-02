import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// scene.environment lights every MeshStandardMaterial's diffuse term on top of the
// hemisphere/sun lights already in the scene - envMapIntensity defaults to 1 (full
// strength), which overexposes everything ("looks like ice"). Kept low and set
// explicitly, purely for a subtle ambient/sky-tinted lift.
const ENV_MAP_INTENSITY = 0.15;

// props.bin's index buffers are Uint16 whenever the part's own vertex count allows it -
// falls back to Uint32 when the manifest doesn't say otherwise.
function readIndexArray(buf, indices) {
    const bytesPerIndex = indices.bytesPerIndex || 4;
    return bytesPerIndex === 2
        ? new Uint16Array(buf, indices.byteOffset, indices.byteLength / 2)
        : new Uint32Array(buf, indices.byteOffset, indices.byteLength / 4);
}


/**
 * Loads a map's real baked building/wall/hesco/etc prop geometry (props.json/props.bin)
 * and merges same-category parts (grouped by the part label's prefix, e.g. every
 * "SM_Wall_..." segment) into one THREE.Mesh per category - with thousands of
 * individually-placed spline wall segments, one THREE.Mesh per part would mean thousands
 * of draw calls; merging collapses that to one draw call per category while keeping each
 * part's original color via a baked-in vertex-color attribute.
 *
 * Not every map has props extracted yet - a missing/non-JSON manifest response resolves
 * to an empty array rather than throwing, same as squad3DSimulation.js's own "missing
 * layer" handling elsewhere.
 *
 * Positions are returned exactly as stored in props.bin - real absolute-meters, in the
 * same frame as activeMap.SDK_data.minimap.corner0/zOffset, NOT yet shifted into this
 * simulation's centered/landscape-relative world space. The caller offsets the whole
 * returned group in one step (see Squad3DSimulation._loadPropsAndTrees()) rather than
 * this module transforming every vertex.
 * @param {string} mapBase - `${process.env.API_URL}${activeMap.mapURL}`
 * @returns {Promise<THREE.Mesh[]>}
 */
export async function loadProps(mapBase) {
    const manifestRes = await fetch(`${mapBase}3d/props.json`);
    if (!manifestRes.ok || !(manifestRes.headers.get("content-type") || "").includes("json")) return [];
    let manifest;
    try {
        manifest = await manifestRes.json();
    } catch {
        return [];
    }

    const buf = await fetch(`${mapBase}3d/props.bin`).then((res) => res.arrayBuffer());

    // Bake each part's flat color into a per-vertex color attribute, then merge all parts
    // sharing a category into one BufferGeometry. No normal attribute - the material below
    // uses flatShading:true, which derives normals from screen-space position derivatives
    // and never reads a vertex normal attribute, so props.bin doesn't ship one.
    const byCategory = new Map(); // prefix -> geometry[]
    for (const part of manifest.parts) {
        const { positions, indices } = part.layout;
        const positionArr = new Float32Array(buf, positions.byteOffset, positions.byteLength / 4);
        const indexArr = readIndexArray(buf, indices);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positionArr.slice(), 3));
        geometry.setIndex(new THREE.BufferAttribute(indexArr.slice(), 1));

        const color = new THREE.Color(part.color);
        const colorArr = new Float32Array(positionArr.length);
        for (let i = 0; i < colorArr.length; i += 3) {
            colorArr[i] = color.r;
            colorArr[i + 1] = color.g;
            colorArr[i + 2] = color.b;
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(colorArr, 3));

        const prefix = part.label.split("_")[0];
        if (!byCategory.has(prefix)) byCategory.set(prefix, []);
        byCategory.get(prefix).push(geometry);
    }

    const meshes = [];
    for (const [prefix, geometries] of byCategory) {
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 1,
            metalness: 0,
            envMapIntensity: ENV_MAP_INTENSITY,
            flatShading: true,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(mergeGeometries(geometries, false), material);
        mesh.name = prefix;
        meshes.push(mesh);
    }
    return meshes;
}
