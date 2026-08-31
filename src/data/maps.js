const FOBEXCLUSIONS = {
    small: 300,
    medium: 400,
};

export const MAPS = [
    {   // UE5
        name: "AlBasrah",
        mapURL: "/img/maps/albasrah/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2000, -2000],
                corner1: [2000, 2000],
            },
            landscapeScale: [1, 1, 0.087813952],
        }
    },
    { 
        name: "Anvil", 
        mapURL: "/img/maps/anvil/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2040, -2040],
                corner1: [1020, 1020],
            },
            landscapeScale: [0.75, 0.75, 0.226426712],
        }
    },
    // { 
    //     name: "Belaya", 
    //     mapURL: "/img/maps/belaya/",
    //     radiusExclusion: FOBEXCLUSIONS.medium,
    //     SDK_data: {
    //         minimap: {
    //             corner0: [-1954, -2080],
    //             corner1: [1950, 1825],
    //         },
    //     }
    // },
    { 
        name: "BlackCoast", 
        mapURL: "/img/maps/blackcoast/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2299, -2127],
                corner1: [2299, 2472],
            },
            landscapeScale: [1.003937, 1.003937, 0.417170742],
        }
    },
    { 
        name: "Chora", 
        mapURL: "/img/maps/chora/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-2464, -2664],
                corner1: [1600, 1400],
            },
            landscapeScale: [0.5, 0.5, 0.982942589],
        }
    },
    { 
        name: "Fallujah", 
        mapURL: "/img/maps/fallujah/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1315, -1545],
                corner1: [1690, 1460],
            },
            landscapeScale: [1, 1, 0.14797459],
        }
    },
    { 
        name: "FoolsRoad",
        mapURL: "/img/maps/foolsroad/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-1326, -1326],
                corner1: [448, 448],
            },
            landscapeScale: [1, 1, 0.20168671],
        }
    },
    { 
        name: "GooseBay", 
        mapURL: "/img/maps/goosebay/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2015, 2015],
            },
            landscapeScale: [1, 1, 0.274412178],
        }
    },
    { 
        name: "Gorodok", 
        mapURL: "/img/maps/gorodok/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2032, -2032],
                corner1: [2032, 2032],
            },
            landscapeScale: [1, 1, 0.173697718],
        }
    },
    { 
        name: "Harju", 
        mapURL: "/img/maps/harju/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2016, 2016],
            },
            landscapeScale: [1, 1, 0.229927482],

        }
    },
    { 
        name: "Jensen", 
        mapURL: "/img/maps/jensen/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2004, -2004],
                corner1: [2004, 2004],
            },
            landscapeScale: [1, 1, 0.185722727],
        }
    },
    { 
        name: "Kamdesh", 
        mapURL: "/img/maps/kamdesh/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2016, 2016],
            },
            landscapeScale: [1, 1, 0.387570609],
        }
    },
    { 
        name: "Kohat", 
        mapURL: "/img/maps/kohat/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2300, -2300],
                corner1: [2317, 2317],
            },
            landscapeScale: [1, 1, 0.750167993],
        }
    },
    { 
        name: "Kokan",
        mapURL: "/img/maps/kokan/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-1076, -1076],
                corner1: [1420, 1420],
            },
            landscapeScale: [0.5, 0.5, 0.174065564],
        }
    },
    { 
        name: "Lashkar", 
        mapURL: "/img/maps/lashkar/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2167, -2167],
                corner1: [2167, 2167],
            },
            landscapeScale: [1, 1, 0.321048558],
        }
    },
    { 
        name: "Logar", 
        mapURL: "/img/maps/logar/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-881, -1132],
                corner1: [880, 629],
            },
            landscapeScale: [1, 1, 0.248098348],
        }
    },
    { 
        name: "Manicouagan", 
        mapURL: "/img/maps/manicouagan/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2015, 2015],
            },
            landscapeScale: [1, 1, 0.403959641],
        }
    },
    { 
        name: "Mestia", 
        mapURL: "/img/maps/mestia/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1200, -1100],
                corner1: [1200, 1300],
            },
            landscapeScale: [1, 1, 0.493831859],
        }
    },
    { 
        name: "Mutaha", 
        mapURL: "/img/maps/mutaha/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-935, -1140],
                corner1: [1820, 1615],
            },
            landscapeScale: [1, 1, 0.112586966],
        }
    },
    { 
        name: "Narva", 
        mapURL: "/img/maps/narva/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1390, -1402],
                corner1: [1410, 1398],
            },
            landscapeScale: [1, 1, 0.205154741],
        }
    },
    // { 
    //     name: "Narva_f", 
    //     mapURL: "/img/maps/narva-flooded/",
    //     radiusExclusion: FOBEXCLUSIONS.medium,
    //     SDK_data: {
    //         minimap: {
    //             corner0: [-1390, -1402],
    //             corner1: [1410, 1398],
    //         },
    //         heightmapPNG: {
    //             scale: [1, 1, 0.4],
    //         }
    //     }
    // },
    { 
        name: "Pacific", 
        mapURL: "/img/maps/pacific/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016],
                corner1: [2016, 2016],
            },
            landscapeScale: [1, 1, 0.317704444],
        }
    },
    { 
        name: "Sanxian",
        mapURL: "/img/maps/sanxian/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2300, -2050],
                corner1: [2300, 2550],
            },
            landscapeScale: [1, 1, 0.233953671],
        }
    },
    { 
        // HEIGHTMAP SHOULD BE ROTATED 2.02deg
        // THEN SCALED TO 8510/6079
        // THEN OFFSET -421;+998
        name: "Skorpo", 
        mapURL: "/img/maps/skorpo/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                // 6869x6869 is not from SDK, probably due to 2.02deg rotation
                // This corners are perfect for settings map assets, but the ingame grid is more 6900*6900
                corner0: [-3611, -3293],
                corner1: [3238, 3576],
            },
            landscapeScale: [1.2, 1.2, 2.086916336],
        }
    },
    { 
        name: "Sumari", 
        mapURL: "/img/maps/sumari/",
        radiusExclusion: FOBEXCLUSIONS.small,
        SDK_data: {
            minimap: {
                corner0: [-640, -447],
                corner1: [660, 853],
            },
            landscapeScale: [1, 1, 0.267739565],
        }
    },
    { 
        name: "Tallil", 
        mapURL: "/img/maps/tallil/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2340, -2340],
                corner1: [2340, 2340],
            },
            landscapeScale: [1, 1, 0.152035884],
        }
    },
    { 
        name: "Yehorivka", 
        mapURL: "/img/maps/yehorivka/", 
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-3302, -3302], 
                corner1: [3048, 3048],
            },
            landscapeScale: [1, 1, 0.485970247],
        }
    },
    // SPM
    { 
        name: "Hrodna_Border", 
        mapURL: "/img/maps/MODS/SPM/hrodna/", 
        radiusExclusion: FOBEXCLUSIONS.medium,
        singleLayer: true,
        mod: "SuperMod",
        SDK_data: {
            minimap: {
                corner0: [-2016, -2016], 
                corner1: [2016, 2016],
            },
            landscapeScale: [1, 1, 0.485617783],
        }
    },
    { 
        name: "Chornivsk", 
        mapURL: "/img/maps/MODS/SPM/chornivsk/", 
        radiusExclusion: FOBEXCLUSIONS.medium,
        singleLayer: true,
        mod: "SuperMod",
        SDK_data: {
            minimap: {
                corner0: [-1649, -1547], 
                corner1: [1535, 1637],
            },
            landscapeScale: [1, 1, 0.124958144],
        }
    },
    //SD
    {
        name: "AlBasrah_legacy",
        mapURL: "/img/maps/MODS/SD/albasrah_legacy/",
        radiusExclusion: FOBEXCLUSIONS.medium,
        mod: "SteelDivision",
        SDK_data: {
            minimap: {
                corner0: [-1520,-1520],
                corner1: [1520,1520],
            },
            landscapeScale: [1, 1, 0.087813952],
        }
    },
    // GC
    {
        name: "Bespin",
        mapURL: "/img/maps/MODS/GC/bespin/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2031.92, -2031.92],
                corner1: [2031.92, 2031.92],
            },
        }
    },
    {
        name: "Coruscant",
        mapURL: "/img/maps/MODS/GC/coruscant/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2000, -2000],
                corner1: [2000, 2000],
            },
        }
    },
    {
        name: "Corvette",
        mapURL: "/img/maps/MODS/GC/corvette/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-166.20, -78.11],
                corner1: [-6.65, 81.44]
            }
        }
    },
    {
        name: "Felucia",
        mapURL: "/img/maps/MODS/GC/felucia/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-789.93, -3999.91],
                corner1: [1876.70, -1333.21],
            }
        }
    },
    {
        name: "Galban",
        mapURL: "/img/maps/MODS/GC/galban/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1784.99, -1784.97],
                corner1: [1784.97, 1784.91],
            }
        }
    },
    {
        name: "Geonosis",
        mapURL: "/img/maps/MODS/GC/geonosis/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2015.67, -2015.67],
                corner1: [2015.7, 2015.7],
            }
        }
    },
    {
        name: "Kashyyyk",
        mapURL: "/img/maps/MODS/GC/kashyyyk/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2106.43,-2814.39],
                corner1: [1893.56, 1185.59],
            },
        }
    },
    {
        name: "Kavado",
        mapURL: "/img/maps/MODS/GC/kavado/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1072.36, -2098.28],
                corner1: [2052.09, 1026.17],
            }
        }
    },
    {
        name: "Mallidon",
        mapURL: "/img/maps/MODS/GC/mallidon/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2400, -2400],
                corner1: [-400, -400]
            },
        }
    },
    {
        name: "Miniosis",
        mapURL: "/img/maps/MODS/GC/miniosis/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1020, -1020],
                corner1: [1020, 1020]
            },
        }
    },
    {
        name: "Morak",
        mapURL: "/img/maps/MODS/GC/morak/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-3250, -3250],
                corner1: [3250, 3250]
            },
        }
    },
    {
        name: "Mygeeto",
        mapURL: "/img/maps/MODS/GC/mygeeto/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2000, -2000],
                corner1: [2000, 2000],
            },
        }
    },
    {
        name: "NabooPlains",
        mapURL: "/img/maps/MODS/GC/nabooplains/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1967.98, -1967.98],
                corner1: [1968.98, 1968.98],
            },
        }
    },
    {
        name: "Ortoplutonia",
        mapURL: "/img/maps/MODS/GC/ortoplutonia/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1999.95, -1999.95],
                corner1: [2000.05, 2000.05],
            }
        }
    },
    {
        name: "Rhenvar",
        mapURL: "/img/maps/MODS/GC/rhenvar/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        gridSize: 900,
        SDK_data: {
            minimap: {
                corner0: [-4079.85, -4079.85],
                corner1: [4053.6, 4053.6],
            },
        }
    },
    {
        name: "Ryloth",
        mapURL: "/img/maps/MODS/GC/ryloth/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-620, -620],
                corner1: [620, 620],
            },
        }
    },
    // {
    //     name: "Ryloth_Canyons",
    //     mapURL: "/img/maps/MODS/GC/ryloth_canyons/",
    //     singleLayer: true,
    //     mod: "GalacticContention",
    //     radiusExclusion: FOBEXCLUSIONS.medium,
    //     SDK_data: {
    //         minimap: {
    //             corner0: [-220, -220],
    //             corner1: [220, 220],
    //         },
    //     }
    // },
    {
        name: "Sesid",
        mapURL: "/img/maps/MODS/GC/sesid/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1880, -1880],
                corner1: [1880, 1880],
            },
        }
    },
    {
        name: "SesidEquator",
        mapURL: "/img/maps/MODS/GC/sesidequator/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-2400, -2400],
                corner1: [2400, 2400],
            },
        }
    },
    {
        name: "Sullust",
        mapURL: "/img/maps/MODS/GC/sullust/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1078.77, -1078.77],
                corner1: [1079.56, 1079.56],
            },
        }
    },
    {
        name: "Tatooine",
        mapURL: "/img/maps/MODS/GC/tatooine/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1966.20, -1865.35],
                corner1: [1579.80, 1680.65]
            },
        }
    },
    {
        name: "Umbara",
        mapURL: "/img/maps/MODS/GC/umbara/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-800, -800],
                corner1: [800, 800],
            },
        }
    },
    {
        name: "VenatorAssault",
        mapURL: "/img/maps/MODS/GC/venator/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-400.3, -399.6],
                corner1: [399.7, 400.4],
            }
        }
    },
    {
        name: "VenatorAssault2",
        mapURL: "/img/maps/MODS/GC/venator2/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-855.4, -462],
                corner1: [644.6, 1038],
            }
        }
    },
    {
        name: "Yavin4",
        mapURL: "/img/maps/MODS/GC/yavin4/",
        singleLayer: true,
        mod: "GalacticContention",
        radiusExclusion: FOBEXCLUSIONS.medium,
        SDK_data: {
            minimap: {
                corner0: [-1260.02, -1260.02],
                corner1: [1260.02, 1260.02]
            },
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

// Compute size in meters for each map
export function initMapsProperties() {
    MAPS.forEach((map) => {
        map.size = bounds(map.SDK_data.minimap.corner0, map.SDK_data.minimap.corner1)[0];
        map.sizeY = bounds(map.SDK_data.minimap.corner0, map.SDK_data.minimap.corner1)[1];
    });
}

