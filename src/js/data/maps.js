const FOBEXCLUSIONS = {
    small: 300,
    medium: 400,
};

export const MAPS = [
    {   // UE5
        name: "AlBasrah",
        mapURL: "/api/v2/img/maps/albasrah/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2000, -2000],
                corner1: [2000, 2000],
            },
            heightmap: {
                origin: [-2040, -2040],
                size: [4081, 4081],
                scale: [1, 1, 1],
                BWlevels: [291, 873],
            }
        }
    },
    { 
        name: "Anvil", 
        mapURL: "/api/v2/img/maps/anvil/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2040, -2040],
                corner1: [1020, 1020],
            },
            heightmap: {
                origin: [-2040, -2040],
                size: [4081, 4081],
                scale: [0.75, 0.75, 0.45],
                BWlevels: [1825, 6640]
            }
        }
    },
    { 
        name: "Belaya", 
        mapURL: "/api/v2/img/maps/belaya/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1954, -2080],
                corner1: [1950, 1825],
            },
            heightmap: {
                origin: [-2016, -2142],
                size: [4033, 4033],
                scale: [1, 1, 1],
                BWlevels: [0, 2360]
            }
        }
    },
    { 
        name: "BlackCoast", 
        mapURL: "/api/v2/img/maps/blackcoast/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2299, -2127],
                corner1: [2299, 2472],
            },
            heightmap: {
                origin: [-2040, -2142],
                size: [4065, 4065],
                scale: [1.003937, 1.003937, 0.8],
                BWlevels: [2593, 7712]
            }
        }
    },
    { 
        name: "Chora", 
        mapURL: "/api/v2/img/maps/chora/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-2464, -2664],
                corner1: [1600, 1400],
            },
            heightmap: {
                origin: [-2464, -2664],
                size: [8129, 4827],
                scale: [0.5, 0.5, 4],
                BWlevels: [1209, 1369]
            }
        }
    },
    { 
        name: "Fallujah", 
        mapURL: "/api/v2/img/maps/fallujah/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1315, -1545],
                corner1: [1690, 1460],
            },
            heightmap: {
                origin: [-2040, -2040],
                size: [4081, 4081],
                scale: [1, 1, 1],
                BWlevels: [39, 440]
            }
        }
    },
    { 
        name: "FoolsRoad",
        mapURL: "/api/v2/img/maps/foolsroad/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-1326, -1326],
                corner1: [448, 448],
            },
            heightmap: {
                origin: [-1598, -1866],
                size: [2806, 2806],
                scale: [1, 1, 3.2],
                BWlevels: [0, 675]
            }
        }
    },
    { 
        name: "GooseBay", 
        mapURL: "/api/v2/img/maps/goosebay/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2015, 2015],
            },
            heightmap: {
                origin: [-2032, -2032],
                size: [4065, 4065],
                scale: [1, 1, 0.40],
                BWlevels: [0, 5516]
            }
        }
    },
    { 
        name: "Gorodok", 
        mapURL: "/api/v2/img/maps/gorodok/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2032, -2032],
                corner1: [2032, 2032],
            },
            heightmap: {
                origin: [-2032, -2032],
                size: [4065, 4065],
                scale: [1, 1, 10],
                BWlevels: [750, 950]
            }
        }
    },
    { 
        name: "Jensen", 
        mapURL: "/api/v2/img/maps/jensen/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2004, -2004],
                corner1: [2004, 2004],
            },
            heightmap: {
                origin: [-2040, -2040],
                size: [4081, 4081],
                scale: [1, 1, 1],
                BWlevels: [4643, 5595]
            }
        }
    },
    { 
        name: "Harju", 
        mapURL: "/api/v2/img/maps/harju/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2016, 2016],
            },
            heightmap: {
                origin: [-2016, -2016],
                size: [4032, 4032],
                scale: [1, 1, 1],
                BWlevels: [1349, 3241]
            }
        }
    },
    { 
        name: "Kamdesh", 
        mapURL: "/api/v2/img/maps/kamdesh/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2016, 2016],
            },
            heightmap: {
                origin: [-2016, -2016],
                size: [4033, 4033],
                scale: [1, 1, 1.35],
                BWlevels: [5437, 6846]
            }
        }
    },
    { 
        name: "Kohat", 
        mapURL: "/api/v2/img/maps/kohat/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2300, -2300],
                corner1: [2317, 2317],
            },
            heightmap: {
                origin: [-2016, -2016],
                size: [4065, 4065],
                scale: [1, 1, 0.75],
                BWlevels: [0, 9775]
            }
        }
    },
    { 
        name: "Kokan",
        mapURL: "/api/v2/img/maps/kokan/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-1076, -1076],
                corner1: [1420, 1420],
            },
            heightmap: {
                origin: [-1334, -1715],
                size: [6097, 7367],
                scale: [0.5, 0.5, 1],
                BWlevels: [100, 264]
            }
        }
    },
    { 
        name: "Lashkar", 
        mapURL: "/api/v2/img/maps/lashkar/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2167, -2167],
                corner1: [2167, 2167],
            },
            heightmap: {
                origin: [-2167, -2167],
                size: [4336, 4336],
                scale: [1, 1, 1.5],
                BWlevels: [5006, 6887]
            }
        }
    },
    { 
        name: "Logar", 
        mapURL: "/api/v2/img/maps/logar/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-881, -1132],
                corner1: [880, 629],
            },
            heightmap: {
                origin: [-1386, -1260],
                size: [2773, 1891],
                scale: [1, 1, 0.5],
                BWlevels: [6188, 8903]
            }
        }
    },
    { 
        name: "Manicouagan", 
        mapURL: "/api/v2/img/maps/manicouagan/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2015, 2015],
            },
            heightmap: {
                origin: [-2032, -2032],
                size: [4065, 4065],
                scale: [1, 1, 3],
                BWlevels: [2479, 5898]
            }
        }
    },
    { 
        name: "Mestia", 
        mapURL: "/api/v2/img/maps/mestia/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1200, -1100],
                corner1: [1200, 1300],
            },
            heightmap: {
                origin: [-1545, -1260],
                size: [3061, 2551],
                scale: [1, 1, 1.2],
                BWlevels: [2479, 5898]
            }
        }
    },
    { 
        name: "Mutaha", 
        mapURL: "/api/v2/img/maps/mutaha/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-935, -1140],
                corner1: [1820, 1615],
            },
            heightmap: {
                origin: [-1785, -1785],
                size: [4081, 4081],
                scale: [1, 1, 0.3],
                BWlevels: [4326, 6683]
            }
        }
    },
    { 
        name: "Narva", 
        mapURL: "/api/v2/img/maps/narva/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1390, -1402],
                corner1: [1410, 1398],
            },
            heightmap: {
                origin: [-2016, -2016],
                size: [4033, 4033],
                scale: [1, 1, 1],
                BWlevels: [4940, 5523]
            }
        }
    },
    { 
        name: "Narva_f", 
        mapURL: "/api/v2/img/maps/narva-flooded/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1390, -1402],
                corner1: [1410, 1398],
            },
            heightmap: {
                origin: [-2016, -2016],
                size: [4033, 4033],
                scale: [1, 1, 1],
                BWlevels: [4940, 5523]
            }
        }
    },
    { 
        name: "Pacific", 
        mapURL: "/api/v2/img/maps/pacific/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2016, 2016],
            },
            heightmap: {
                origin: [-2016, -2016],
                size: [4033, 4033],
                scale: [1, 1, 0.28],
                BWlevels: [410, 9643]
            }
        }
    },
    { 
        name: "Sanxian",
        mapURL: "/api/v2/img/maps/sanxian/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2300, -2050],
                corner1: [2300, 2550],
            },
            heightmap: {
                origin: [-2040, -2040],
                size: [4081, 4081],
                scale: [1, 1, 1],
                BWlevels: [1349, 3241]
            }
        }
    },
    { 
        // HEIGHTMAP SHOULD BE ROTATED 2.02deg
        // THEN SCALED TO 8510/6079
        // THEN OFFSET -421;+998
        name: "Skorpo", 
        mapURL: "/api/v2/img/maps/skorpo/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                // 6869x6869 is not from SDK, probably due to 2.02deg rotation
                // This corners are perfect for settings map assets, but the ingame grid is more 6900*6900
                corner0: [-3611, -3293],
                corner1: [3238, 3576],
            },
            heightmap: {
                origin: [-4811, -3947],
                size: [7113, 5081],
                scale: [1.2, 1.2, 3.5],
                BWlevels: [952, 4074]
            }
        }
    },
    { 
        name: "Sumari", 
        mapURL: "/api/v2/img/maps/sumari/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-640, -447],
                corner1: [660, 853],
            },
            heightmap: {
                origin: [-683, -373],
                size: [1427, 1055],
                scale: [1, 1, 0.75],
                BWlevels: [1375, 1854]
            }
        }
    },
    { 
        name: "Tallil", 
        mapURL: "/api/v2/img/maps/tallil/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2340, -2340],
                corner1: [2340, 2340],
            },
            heightmap: {
                origin: [-2287, -2287], // SDK is wrong, this is deduced instead
                size: [4573, 4573],
                scale: [1, 1, 1.25],
                BWlevels: [3689, 4111]
            }
        }
    },
    { 
        name: "Yehorivka", 
        mapURL: "/api/v2/img/maps/yehorivka/", 
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-3302, -3302], 
                corner1: [3048, 3048],
            },
            heightmap: {
                origin: [-3302, -3302], // SDK is wrong, this is deduced instead
                size: [6351, 6351],
                scale: [1, 1, 4],
                BWlevels: [0, 833]
            }
        }
    },
    // Custom Map Template
    //   * Create the necessary folders in /public/ and point mapURL to it
    //   * squadcalc will look at the folder looking for basemap/terrainmap/topomap .webp
    //   * You can also tile your images by using basemap/terrainmap/topomap folders
    // { 
    //     name: `CustomMap #1`,
    //     mapURL: `/img/maps/customMap1/`, 
    //     radiusExclusion: FOBEXCLUSIONS.medium,
    //     SDK_data: {
    //         minimap: {
    //             corner0: [-3302, -3302], 
    //             corner1: [3048, 3048],
    //         },
    //     }
    // },
];


/**
 * Calculates the final z-scaling of a heightmap,
 * by taking the black and white levels used in gimp to optimize the heightmap,
 * and the zScale of the UE4 landscape transform in meters from SquadSDK
 * @param {number} bLevel - optimized black level from original heightmap
 * @param {number} wLevel - optimized white level from original heightmap
 * @param {number} zScale - original zScale of landscape transform in SquadSDK in meters
 * @returns {number} final scaling
 */
function scale(bLevel, wLevel, zScale) {
    const levelRange = (wLevel - bLevel) / 10000;
    return (512 * levelRange * zScale) / 512;
}


/**
 * Generates array with [x,y] dimensions of map, based on the minimap corner transforms from SquadSDK
 * @param {Number[]} fCorner - [x,y] positon of north west corner of minimap in SquadSDK
 * @param {Number[]} sCorner - [x,y] positon of south east corner of minimap in SquadSDK
 * @returns {Number[]} - bounds array with lengths of x and y dimensions of map
 */
function bounds(fCorner, sCorner) {
    // using min and max so that it doesn't matter which corners are used, as long as they are opposite to each other
    const xM = Math.max(fCorner[0], sCorner[0]) - Math.min(fCorner[0], sCorner[0]);
    const yM = Math.max(fCorner[1], sCorner[1]) - Math.min(fCorner[1], sCorner[1]);
    return [xM, yM];
}


/**
 * Utility function to generate information needed to optimize heightmaps.
 * Generates information about scaling and cropping heightmaps so that they match the minimap and map dimensions.
 * Also calculates map dimensions.
 */
function extraInfo() {

    MAPS.forEach((map) => {

        const e = map.SDK_data;
        if (!e) {
            console.warn(`${map.name} has no SDK Data!`);
            return;
        }

        const mm = e.minimap;
        const mmBounds = bounds(mm.corner0, mm.corner1);

        const xO = e.heightmap.origin[0] - Math.min(mm.corner0[0], mm.corner1[0]);
        const yO = e.heightmap.origin[1] - Math.min(mm.corner0[1], mm.corner1[1]);

        // Map info
        console.log(`${map.name}`);
        console.log(`    * Map dimensions: [${mmBounds}]`);
        console.log(`    * Heightmap dimensions : [${e.heightmap.size[0]},${e.heightmap.size[1]}], scale: [${e.heightmap.scale}]`);

        // how to scale & crop heightmap in gimp
        console.log("    * Minimap & Heightmap position :");
        console.log(`        -> scale heightmap to: ${Math.round(e.heightmap.size[0] * e.heightmap.scale[0])}x${Math.round(e.heightmap.size[1] * e.heightmap.scale[1])}`);
        console.log(`        -> set canvas size to: ${mmBounds[0]}x${mmBounds[1]} with offset: ${xO}x${yO}`);

        // Warning if the heightmap is smaller than the minimap
        if (e.heightmap.size[0] * e.heightmap.scale[0] < mmBounds[0] || e.heightmap.size[1] * e.heightmap.scale[1] < mmBounds[1]) {
            console.warn("        -> heightmap is smaller than the minimap");
        }

        // Heightmap z-scaling & levels
        console.log("    * Heightmap z-scaling & Levels :");
        console.log(`        -> set levels to: ${e.heightmap.BWlevels[0]} <-> ${e.heightmap.BWlevels[1]}`);
        console.log(`        -> final z-scale: ${scale(e.heightmap.BWlevels[0], e.heightmap.BWlevels[1], e.heightmap.scale[2])}`);
        console.log("---");
    });

}

// Only run this with `node src/js/data/maps.js mapinfo`
if (typeof process !== "undefined" && process.argv?.[2] === "mapinfo") {
    extraInfo();
}

// Compute size in meters and z-scaling from SDK data for each map
export function initMapsProperties() {
    MAPS.forEach((map) => {
        map.size = bounds(map.SDK_data.minimap.corner0, map.SDK_data.minimap.corner1)[0];
        map.sizeY = bounds(map.SDK_data.minimap.corner0, map.SDK_data.minimap.corner1)[1];
        map.scaling = scale(
            map.SDK_data?.heightmap?.BWlevels?.[0] ?? 0,
            map.SDK_data?.heightmap?.BWlevels?.[1] ?? 0,
            map.SDK_data?.heightmap?.scale?.[2] ?? 1
        ) || 1;
    });
}

