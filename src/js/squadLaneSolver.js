/**
 * Squad Lane Solver
 *
 * Works out which capture points are still possible on a randomized layer
 * (RAAS, RVAAS, Invasion, RINV), at which depth, and with what probability.
 *
 * A randomized layer picks one route from main to main, then one point per
 * cluster along that route:
 *
 *     route   = ordered list of clusters (one lane, main to main)
 *     cluster = one step on the route, holding N candidate points
 *     step    = 1-based index along the route. This is the number drawn on the flag.
 *
 * A confirmed point is a constraint. It removes every route that cannot carry the
 * point and locks the cluster that can. Constraints are unordered, so any point in
 * the chain can be confirmed, not only the next one.
 *
 * Points are identified by objectName ("C4-BridgeviewApartments"), which is unique
 * inside a layer. The name field is not: 16 of 42 layers checked reuse a display
 * name for two unrelated locations. One flag can own several ids when the randomizer
 * offers the same location on more than one route or at more than one depth, so a
 * constraint holds a set of ids and any one of them satisfies it.
 *
 * No Leaflet, no DOM, no App singleton. Reads layerData only.
 */

/** Cap on route enumeration. Most layers stay under 10 routes. Largest seen is 260 (Manicouagan RAAS v2). */
const MAX_ROUTES = 2000;

export default class SquadLaneSolver {

    /**
     * @param {object} layerData - raw layer payload from /get/layer
     */
    constructor(layerData) {
        this.routes = [];
        this.truncated = false;
        this.ok = false;

        // Node ids of the mains the routes run between. start is the main the links
        // point away from, which is Team 1's main in every layer checked.
        this.start = null;
        this.end = null;
        this._build(layerData);
    }

    /**
     * Enumerate every simple route from the start main to the end main.
     * @param {object} layerData
     */
    _build(layerData) {
        const capturePoints = layerData?.capturePoints;
        if (!capturePoints || !layerData.objectives) return;

        // Links are stored in lanes on some layers and in clusters on others.
        const links = capturePoints.lanes?.links?.length
            ? capturePoints.lanes.links
            : capturePoints.clusters?.links;
        if (!links?.length) return;

        // Links refer to mains by objectDisplayName and to clusters by name.
        const byNode = {};
        Object.values(layerData.objectives).forEach((objective) => {
            byNode[objective.name === "Main" ? objective.objectDisplayName : objective.name] = objective;
        });

        const adjacency = new Map();
        const hasIncoming = new Set();
        const hasOutgoing = new Set();
        links.forEach((link) => {
            if (!adjacency.has(link.nodeA)) adjacency.set(link.nodeA, []);
            adjacency.get(link.nodeA).push(link.nodeB);
            hasOutgoing.add(link.nodeA);
            hasIncoming.add(link.nodeB);
        });

        const nodes = new Set([...hasOutgoing, ...hasIncoming]);
        const start = [...nodes].find((n) => !hasIncoming.has(n));
        const end = [...nodes].find((n) => !hasOutgoing.has(n));
        if (!start || !end) return;
        this.start = start;
        this.end = end;

        const found = [];
        const walk = (node, trail) => {
            if (found.length >= MAX_ROUTES) { this.truncated = true; return; }
            if (node === end) { found.push(trail.slice()); return; }
            for (const next of (adjacency.get(node) || [])) {
                if (trail.includes(next)) continue;
                trail.push(next);
                walk(next, trail);
                trail.pop();
                if (this.truncated) return;
            }
        };
        walk(start, [start]);

        // Drop the mains, they carry no candidates.
        this.routes = found
            .map((route) => route
                .map((node) => byNode[node])
                .filter((objective) => objective?.points?.length)
                .map((cluster) => ({
                    cluster: cluster.name,
                    pos: cluster.pointPosition,
                    ids: cluster.points.map((point) => point.objectName),
                })))
            .filter((route) => route.length);

        this.ok = this.routes.length > 0;

        // Depth of the last capture point. Every route in a layer has the same length in
        // the data checked, so this is also the step before the far main.
        this.stepCount = this.ok ? Math.max(...this.routes.map((route) => route.length)) : 0;
    }

    /**
     * Every candidate id in the layer, unconstrained.
     * @returns {Set<string>}
     */
    allIds() {
        const ids = new Set();
        this.routes.forEach((route) => route.forEach((step) => step.ids.forEach((id) => ids.add(id))));
        return ids;
    }

    /**
     * Resolve the layer against a set of confirmations.
     *
     * @param {{ids: string[], step: ?number}[]} constraints - one entry per confirmed flag.
     *        ids are the candidate slots the flag owns, and any one of them satisfies it.
     *        step pins the flag to that depth. Confirming a point means "this is my Nth
     *        point", so routes carrying it at another depth are removed.
     * @param {boolean} [fromEnd] - number the steps from the end main instead of the start
     *                              main, so depths read from the side the user plays
     * @returns {{alive: number, total: number, steps: Map<number, Map<string, number>>,
     *            byId: Map<string, {steps: Set<number>, probability: number}>, impossible: boolean}}
     */
    solve(constraints = [], fromEnd = false) {
        const survivors = [];

        for (const route of this.routes) {
            const locks = new Map();      // step index -> the id that must sit there
            const hitsPerConstraint = [];
            let viable = true;

            for (const constraint of constraints) {
                const ids = constraint.ids;
                const pinned = constraint.step ?? null;
                const hits = [];
                route.forEach((step, index) => {
                    if (pinned !== null && (fromEnd ? route.length - index : index + 1) !== pinned) return;
                    const overlap = step.ids.filter((id) => ids.includes(id));
                    if (overlap.length) hits.push({ index, overlap });
                });

                // This route cannot carry the flag at all.
                if (!hits.length) { viable = false; break; }

                // Only one cluster on this route can hold it, and only one way. Lock it.
                if (hits.length === 1 && hits[0].overlap.length === 1) {
                    const { index, overlap } = hits[0];
                    if (locks.has(index) && locks.get(index) !== overlap[0]) { viable = false; break; }
                    locks.set(index, overlap[0]);
                }
                hitsPerConstraint.push(hits.map((h) => h.index));
            }

            // Two flags cannot share a step. If two constraints both come down to the same
            // single cluster the route is impossible, even when neither of them locked
            // (each had several candidates in that cluster).
            if (viable) {
                for (let a = 0; a < hitsPerConstraint.length && viable; a++) {
                    if (hitsPerConstraint[a].length !== 1) continue;
                    for (let b = a + 1; b < hitsPerConstraint.length; b++) {
                        if (hitsPerConstraint[b].length !== 1) continue;
                        if (hitsPerConstraint[a][0] === hitsPerConstraint[b][0]) { viable = false; break; }
                    }
                }
            }

            if (viable) survivors.push({ route, locks });
        }

        const steps = new Map();
        const byId = new Map();
        const routeWeight = survivors.length ? 1 / survivors.length : 0;

        survivors.forEach(({ route, locks }) => {
            route.forEach((step, index) => {
                const ids = locks.has(index) ? [locks.get(index)] : step.ids;
                const share = routeWeight / ids.length;
                const stepNumber = fromEnd ? route.length - index : index + 1;

                if (!steps.has(stepNumber)) steps.set(stepNumber, new Map());
                const atStep = steps.get(stepNumber);

                ids.forEach((id) => {
                    atStep.set(id, (atStep.get(id) || 0) + share);
                    let entry = byId.get(id);
                    if (!entry) { entry = { steps: new Set(), probability: 0 }; byId.set(id, entry); }
                    entry.steps.add(stepNumber);
                    entry.probability += share;
                });
            });
        });

        return {
            alive: survivors.length,
            total: this.routes.length,
            steps,
            byId,
            impossible: constraints.length > 0 && survivors.length === 0,
        };
    }
}
