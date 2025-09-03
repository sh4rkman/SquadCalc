/* Leaflet EdgeBuffer Plugin
 * https://github.com/TolonUK/Leaflet.EdgeBuffer
 * (MIT) Copyright (c) 2015-2025 Alex Paterson
 * 
 * edited by Maxime "sharkman" Boussard for lealfet v2.0
 */

import { GridLayer, Bounds } from "leaflet";

const originalPxBoundsToTileRange = GridLayer.prototype._pxBoundsToTileRange;

GridLayer.prototype._pxBoundsToTileRange = function(bounds) {
    const tileRange = originalPxBoundsToTileRange.call(this, bounds);
	
    // Default is to buffer one tile beyond the pixel bounds (edgeBufferTiles = 1)
    let edgeBufferTiles = 1;
    if ((this.options.edgeBufferTiles !== undefined) && (this.options.edgeBufferTiles !== null)) {
        edgeBufferTiles = this.options.edgeBufferTiles;
    }
	
    if (edgeBufferTiles > 0) {
        //const pixelEdgeBuffer = this.getTileSize().multiplyBy(edgeBufferTiles);
        return new Bounds(
            tileRange.min.subtract([edgeBufferTiles, edgeBufferTiles]),
            tileRange.max.add([edgeBufferTiles, edgeBufferTiles])
        );
    }
	
    return tileRange;
};

export default {};