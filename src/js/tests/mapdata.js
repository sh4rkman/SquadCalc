// Script made By Endebert to calulate map/heightmap properties
// -> https://github.com/Endebert/squadmc-maps
/* jshint ignore:start */

const MAPDATA = [

    {
      name: "sanxianIslands",
      url: "/maps/sanxianIslands/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/sanxianIslands.jpg",
        tile: "/heightmaps/sanxianIslands/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: { // extra information taken from SquadSDK and exported heightmap, used to scale + crop heightmaps
        // check printMapExtras() function for more information
        scale: [1, 1, 1], // x, y & z scale from SquadSDK (in meters)
        levels: [1349, 3241],
        minimap: [ // taken from blueprints in SquadSDK
          [-2300, -2050],
          [2300, 2550],
        ],
        hDim: [4081, 4081], // dimensions of exported heightmap
        lOrigin: [-2040, -2040], // origin of landscape in SquadSDK (sometimes extracted by placing actor in corner)
      },
    },
    {
      name: "Harju",
      url: "/maps/Harju/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/Harju.jpg",
        tile: "/heightmaps/Harju/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: { // extra information taken from SquadSDK and exported heightmap, used to scale + crop heightmaps
        // check printMapExtras() function for more information
        scale: [1, 1, 1], // x, y & z scale from SquadSDK (in meters)
        levels: [622, 2235],
        minimap: [ // taken from blueprints in SquadSDK
          [-2016, -2016],
          [2016, 2016],
        ],
        hDim: [3907, 3907], // dimensions of exported heightmap
        lOrigin: [-2016, -2016], // origin of landscape in SquadSDK (sometimes extracted by placing actor in corner)
      },
    },
    
    {
      name: "Al Basrah",
      url: "/maps/albasrah/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/albasrah.jpg",
        tile: "/heightmaps/albasrah/{z}_{x}_{y}.jpg",
      },
      extra: { // extra information taken from SquadSDK and exported heightmap, used to scale + crop heightmaps
        // check printMapExtras() function for more information
        scale: [1, 1, 0.1], // x, y & z scale from SquadSDK (in meters)
        levels: [2793, 4087],
        minimap: [ // taken from blueprints in SquadSDK
          [-1520, -1520],
          [1520, 1520],
        ],
        hDim: [3049, 3049], // dimensions of exported heightmap
        lOrigin: [-2032, -2032], // origin of landscape in SquadSDK (sometimes extracted by placing actor in corner)
      },
    },
    {
      name: "Anvil",
      url: "/maps/albasrah/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/Anvil.jpg",
        tile: "/heightmaps/albasrah/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: { // extra information taken from SquadSDK and exported heightmap, used to scale + crop heightmaps
        // check printMapExtras() function for more information
        scale: [0.75, 0.75, 0.45], // x, y & z scale from SquadSDK (in meters)
        levels: [1825, 6640],
        minimap: [ // taken from blueprints in SquadSDK
          [-2040, -2040],
          [1020, 1020],
        ],
        hDim: [4081, 4081], // dimensions of exported heightmap
        lOrigin: [-2040, -2040], // origin of landscape in SquadSDK (sometimes extracted by placing actor in corner)
      },
    },
    {
      name: "Belaya",
      url: "/maps/belaya/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/belaya.jpg",
        tile: "/heightmaps/belaya/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Militia Main", [3221, 554]],
        ["Radio Station", [2507, 1433]],
        ["Nikola", [2002, 1693]],
        ["Train Tunnel", [1376, 1425]],
        ["Tire Factory", [707, 1662]],
        ["Russia Main", [558, 2866]],
      ],
      extra: {
        scale: [1, 1, 1],
        levels: [0, 2360],
        minimap: [
          [-1954, -2080],
          [1950, 1825],
        ],
        hDim: [4033, 4033],
        lOrigin: [-2016, -2142],
      },
    },
    {
      name: "BlackCoast",
      url: "/maps/albasrah/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/sanxianIslands.jpg",
        tile: "/heightmaps/albasrah/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: { 
        scale: [1.003937, 1.003937, 0.8], // x, y & z scale from SquadSDK (in meters)
        levels: [2593, 7712],
        minimap: [ // taken from blueprints in SquadSDK
          [-2299, -2127],
          [2299, 2472],
        ],
        hDim: [4065, 4065], // dimensions of exported heightmap
        lOrigin: [-2040, -2142], // origin of landscape in SquadSDK (sometimes extracted by placing actor in corner)
      },
    },
    {
      name: "Chora Valley",
      url: "/maps/chora/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/chora.jpg",
        tile: "/heightmaps/chora/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Russia Main", [2730, 600]],
        ["Monolith", [2345, 850]],
        ["SW Nursery", [2529, 1213]],
        ["Orchard", [1835, 1428]],
        ["Large Mosque", [1808, 2631]],
        ["Provincial Estate", [2055, 2355]],
        ["East Poppy Farm", [1934, 1710]],
        ["West Poppy Farm", [2000, 1320]],
        ["Small Mosque", [2093, 921]],
        ["South Orchard", [2413, 1556]],
        ["Radio Station", [2224, 1898]],
        ["Hemp Farm", [1755, 2148]],
        ["Gas Station", [1817, 2511]],
        ["US Main", [1795, 2905]],
        ["Insurgent Checkpoint", [1541, 2436]],
      ],
      extra: {
        scale: [0.5, 0.5, 4],
        levels: [1209, 1369],
        minimap: [
          [-2464, -2664],
          [1600, 1400],
        ],
        hDim: [8129, 4827],
        lOrigin: [-2464, -2664],
      },
  
    },
    {
      name: "Fallujah",
      url: "/maps/fallujah/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/fallujah.jpg",
        tile: "/heightmaps/fallujah/{z}_{x}_{y}.jpg",
      },
      locations: [],
      extra: {
        scale: [1, 1, 1],
        levels: [39, 440],
        minimap: [
          [-1315,  -1545],
          [1690, 1460],
        ],
        hDim: [4081, 4081],
        lOrigin: [-2040, -2040],
      },
    },
    {
      name: "Jensen's Range",
      url: "/maps/jensens/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/jensen.jpg",
        tile: "/heightmaps/jensen/{z}_{x}_{y}.jpg",
      },
      locations: [],
      extra: {
        scale: [1, 1, 1],
        levels: [4683, 5542],
        minimap: [
          [-2004,  -2004],
          [2004, 2004],
        ],
        hDim: [4081, 4081],
        lOrigin: [-2040, -2040],
      },
    },
    {
      name: "Fool's Road",
      url: "/maps/foolsroad/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/foolsroad.jpg",
        tile: "/heightmaps/foolsroad/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Russian Main", [1718, 1584]],
        ["Mine Entrance", [1205, 962]],
        ["Train Station", [1516, 426]],
        ["Fortress", [309, 292]],
        ["Hilltop Encampment", [546, 959]],
        ["FOB Papanov", [168, 1401]],
        ["OP Fortress", [883, 354]],
        ["Ammo Depot | Hill", [777, 761]],
        ["North Village", [440, 1399]],
        ["Hill 123", [686, 1555]],
      ],
      extra: {
        scale: [1, 1, 3.2],
        levels: [0, 675],
        minimap: [
          [-1326, -1326],
          [448, 448],
        ],
        hDim: [2806, 2806],
        lOrigin: [-1598, -1866],
      },
    },
    {
      name: "Operation First Light",
      url: "/maps/forest/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/forest.jpg",
        tile: "/heightmaps/forest/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Militia Main", [139, 852]],
        ["Railroad Village", [469, 882]],
        ["The Castle", [352, 502]],
        ["Storage Site", [632, 375]],
        ["Nirem Village", [870, 458]],
        ["Rail Docks", [788, 773]],
        ["US Main", [1049, 767]],
      ],
      extra: {
        scale: [0.5, 0.5, 0.08],
        levels: [3069, 10000],
        minimap: [
          [-1100, -1100],
          [100, 100],
        ],
        hDim: [2017, 2017],
        lOrigin: [-1100, -1100],
      },
    },
    {
      name: "Goose Bay",
      url: "/maps/goosebay/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/goosebay.jpg",
        tile: "/heightmaps/goosebay/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: {
        scale: [1, 1, 0.40],
        levels: [0, 5516],
        minimap: [
          [-2016, -2016],
          [2015, 2015],
        ],
        hDim: [4065, 4065],
        lOrigin: [-2032, -2032],
      },
  
    },
    {
      name: "Gorodok",
      url: "/maps/gorodok/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/gorodok.jpg",
        tile: "/heightmaps/gorodok/{z}_{x}_{y}.jpg",
      },
      extra: {
        scale: [1, 1, 10],
        levels: [780, 899],
        minimap: [
          [-2032, -2032],
          [2032, 2032],
        ],
        hDim: [4065, 4065],
        lOrigin: [-2032, -2032],
      },
  
    },
    {
      name: "Jensen's Range",
      url: "/maps/jensens/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/jensens.jpg",
        tile: "/heightmaps/jensens/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["US Main", [336, 800]],
        ["Vehicles", [599, 977]],
      ],
      extra: {
        scale: [1.5, 1.5, 0.15],
        levels: [431, 10000],
        minimap: [
          [-723, -544],
          [788, 965],
        ],
        hDim: [1009, 1009],
        lOrigin: [-723, -544],
      },
  
    },
    {
      name: "Kamdesh Highlands",
      url: "/maps/kamdesh/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/kamdesh.jpg",
        tile: "/heightmaps/kamdesh/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Sao", [2142, 1066]],
        ["Naray", [1890, 1500]],
        ["Paprok", [1581, 1829]],
        ["Manyal", [1334, 2197]],
        ["Shako", [1048, 2753]],
        ["Nahrain", [2097, 1805]],
        ["Godri", [2101, 2651]],
        ["Papra", [2869, 1175]],
        ["Khune", [2992, 2089]],
        ["Kaga", [2919, 3053]],
        ["Agasi", [1054, 1281]],
        ["Storage Bunker", [1492, 3086]],
        ["Toba", [3116, 859]],
        ["Aringshah", [3124, 1575]],
        ["Alingal", [3029, 2489]],
        ["Badeen", [2290, 3447]],
        ["Hemp Farm", [1888, 3238]],
        ["Nilaw", [1565, 2631]],
        ["Training Camp", [816, 2359]],
      ],
      extra: {
        scale: [1, 1, 1.35],
        levels: [5437, 6846],
        minimap: [
          [-2016, -2016],
          [2016, 2016],
        ],
        hDim: [4033, 4033],
        lOrigin: [-2016, -2016],
      },
    },
    {
      name: "Kohat Toi River Valley",
      url: "/maps/kohat/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/kohat.jpg",
        tile: "/heightmaps/kohat/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: {
        scale: [1, 1, 0.75],
        levels: [0, 9775],
        minimap: [
          [-2300, -2300],
          [2317, 2317],
        ],
        hDim: [4065, 4065],
        lOrigin: [-2016, -2016],
      },
    },
    {
      name: "Kokan",
      url: "/maps/kokan/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/kokan.jpg",
        tile: "/heightmaps/kokan/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: {
        scale: [0.5, 0.5, 1],
        levels: [100, 264],
        minimap: [
          [-1076, -1076],
          [1420, 1420],
        ],
        hDim: [6097, 7367],
        lOrigin: [-1334, -1715], // not in the sdk, deduced
      },
    },
    {
      name: "Lashkar Valley",
      url: "/maps/lashkar/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/lashkar.jpg",
        tile: "/heightmaps/lashkar/{z}_{x}_{y}.jpg",
      },
      locations: [],
      extra: {
        scale: [1, 1, 1.5], // heightmap scale
        levels: [5006, 6887], // levels in Gimp
        minimap: [
          [-2167, -2167], // top left corner
          [2167, 2167], // bottom right corner
        ],
        hDim: [4336, 4336], // heightmap dimensions
        lOrigin: [-2167, -2167], // top left landscape origin
      },
    },
    {
      name: "Logar Valley",
      url: "/maps/logarvalley/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/logarvalley.jpg",
        tile: "/heightmaps/logarvalley/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Old Militia Main", [692, 144]],
        ["Mechanic Shop", [1018, 123]],
        ["Bend", [1193, 302]],
        ["South Residence / Compound", [1331, 455]],
        ["Lower / South DC", [1107, 749]],
        ["Lower Central DC", [1013, 774]],
        ["Upper Central DC", [909, 802]],
        ["Upper / North DC", [818, 857]],
        ["North Residence", [574, 1077]],
        ["Residence", [693, 1231]],
        ["Poppy Farm", [718, 1423]],
        ["Militia Main", [696, 1564]],
        ["Old Murika Main", [1113, 1483]],
      ],
      extra: {
        scale: [1, 1, 0.5],
        levels: [6188, 8903],
        minimap: [
          [-881, -1132],
          [880, 629],
        ],
        hDim: [2773, 1891],
        lOrigin: [-1386, -1260],
      },
    },
    {
      name: "Manicouagan",
      url: "/maps/Manicouagan/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/Manicouagan.jpg",
        tile: "/heightmaps/Manicouagan/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: {
        scale: [1, 1, 3],
        levels: [2479, 5898],
        minimap: [
          [-2016, -2016],
          [2015, 2015],
        ],
        hDim: [4065, 4065],
        lOrigin: [-2032, -2032],
      },
    },
    {
      name: "Mestia",
      url: "/maps/mestia/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/mestia.jpg",
        tile: "/heightmaps/mestia/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Militia Main", [1062, 233]],
        ["The Armory", [1318, 594]],
        ["Fortification", [1017, 854]],
        ["Warehouse", [1769, 819]],
        ["Crucible Beta", [1233, 1275]],
        ["Crucible Alpha", [1123, 1305]],
        ["Quarry", [586, 1684]],
        ["Crucible Gamma", [1118, 1503]],
        ["Farmstead", [1381, 1794]],
        ["Russian Main", [1656, 2235]],
      ],
      extra: {
        scale: [1, 1, 1.2],
        levels: [2479, 5898],
        minimap: [
          [-1200, -1100],
          [1200, 1300],
        ],
        hDim: [3061, 2551],
        lOrigin: [-1545, -1260],
      },
    },
    {
      name: "Mutaha",
      url: "/maps/mutaha/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/mutaha.jpg",
        tile: "/heightmaps/mutaha/{z}_{x}_{y}.jpg",
      },
      locations: [
      ],
      extra: {
        scale: [1, 1, 0.3],
        levels: [4326, 6683],
        minimap: [
          [-935, 1615],
          [1820, -1140],
        ],
        hDim: [4081, 4081],
        lOrigin: [-1785, -1785],
      },
    },
    {
      name: "Narva",
      url: "/maps/narva/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/narva.jpg",
        tile: "/heightmaps/narva/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["US Main", [570, 215]],
        ["Abandoned Airfield", [778, 598]],
        ["Ring Road", [1311, 717]],
        ["Quarry", [2000, 1181]],
        ["Shipping Yard", [1730, 1655]],
        ["Radio Station", [628, 836]],
        ["Old Barracks", [690, 1290]],
        ["Old Hospital", [1085, 1268]],
        ["Oru Village", [1540, 1129]],
        ["Kanepi Rd", [1831, 1372]],
        ["Power Plant", [1969, 1844]],
        ["Casle", [1242, 1898]],
        ["Church", [832, 1127]],
        ["Train Depot", [1343, 1647]],
        ["Fuel Storage", [1661, 853]],
        ["Foundry", [1744, 1103]],
        ["Lakeshore", [1683, 1464]],
        ["Warehouse", [1625, 1744]],
        ["Storefronts", [1118, 1641]],
        ["Factories", [1223, 1044]],
        ["Shopping Centre", [1024, 1524]],
        ["Council Towers", [1085, 1151]],
        ["University", [858, 1628]],
        ["Geneva Apts", [1249, 1417]],
        ["Kalda Court", [1550, 1587]],
        ["Parusinka", [1780, 2190]],
        ["Russian Main", [1757, 2658]],
      ],
      extra: {
        scale: [1, 1, 1],
        levels: [4940, 5523],
        minimap: [
          [-1390, -1402],
          [1410, 1398],
        ],
        hDim: [4033, 4033],
        lOrigin: [-2016, -2016],
      },
  
    },
    {
      name: "Skorpo",
      url: "/maps/skorpo/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/skorpo.jpg",
        tile: "/heightmaps/skorpo/{z}_{x}_{y}.jpg",
      },
      extra: {
        scale: [1.2, 1.2, 3.5],
        levels: [952, 4074],
        minimap: [
          [-3601, -3293],
          [3248, 3576],
        ],
        hDim: [7113, 5081],
        lOrigin: [-4811, -3947],
      },
    },
    {
      name: "Skorpo Town",
      url: "/maps/skorpotown/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/skorpotown.jpg",
        tile: "/heightmaps/skorpotown/{z}_{x}_{y}.jpg",
      },
      extra: {
        scale: [1.2, 1.2, 3.5],
        levels: [952, 4074],
        minimap: [
          [-1300, -2200],
          [3400, 2500],
        ],
        hDim: [7113, 5081],
        lOrigin: [-4811, -3947],
      },
    },
    {
      name: "Sumari Bala",
      url: "/maps/sumari/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/sumari.jpg",
        tile: "/heightmaps/sumari/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["US Main", [743, 137]],
        ["Junction", [700, 362]],
        ["Police Station", [630, 575]],
        ["Ancient Qanat", [531, 716]],
        ["Raisin Dryers", [833, 479]],
        ["Commons", [510, 869]],
        ["School", [704, 885]],
        ["INS Hideout", [754, 1134]],
        ["Market", [584, 478]],
        ["Courtyard", [707, 436]],
        ["Checkpoint", [803, 283]],
        ["Palace", [712, 759]],
        ["Training Camp", [610, 1008]],
        ["INS Main", [517, 1181]],
      ],
      extra: {
        scale: [1, 1, 0.75],
        levels: [1375, 1854],
        minimap: [
          [-640, -447],
          [660, 853],
        ],
        hDim: [1427, 1055],
        lOrigin: [-683, -373], // not from sdk
      },
    },
    {
      name: "Tallil",
      url: "/maps/tallil/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/tallil.jpg",
        tile: "/heightmaps/tallil/{z}_{x}_{y}.jpg",
      },
      extra: {
        scale: [1, 1, 1.25],
        levels: [3689, 4111],
        minimap: [
          [-2340, -2340],
          [2340, 2340],
        ],
        hDim: [4573, 4573],
        lOrigin: [-2032, -2032],
      },
    },
    {
      name: "Yehorivka",
      url: "/maps/yehorivka/{z}_{x}_{y}.jpg",
      heightmap: {
        url: "/heightmaps/yehorivka.jpg",
        tile: "/heightmaps/yehorivka/{z}_{x}_{y}.jpg",
      },
      locations: [
        ["Russian Main", [864, 986]],
        ["Upper Petrivka", [1090, 2206]],
        ["Central Petrivka", [1306, 1837]],
        ["Lower Petrivka", [1479, 2229]],
        ["Village", [1440, 2771]],
        ["Stepne", [1874, 3046]],
        ["Storage Site", [2141, 1605]],
        ["Upper Novo", [2336, 2350]],
        ["Central Novo", [2651, 1981]],
        ["Lower Novo", [2668, 2325]],
        ["Airfield", [3143, 2212]],
        ["US Main", [3455, 2827]],
      ],
      extra: {
        scale: [1, 1, 4],
        levels: [0, 833],
        minimap: [
          [-3002, -3002],
          [3048, 3048],
        ],
        hDim: [6351, 6351],
        lOrigin: [-3002, -3002], // don't trust sdk, landscape origin changed
      },
    },
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
    MAPDATA.forEach((map) => {
      const e = map.extra;
      if (e) {
        const mm = e.minimap;
        const mmBounds = bounds(mm[0], mm[1]);
  
        const xO = e.lOrigin[0] - Math.min(mm[0][0], mm[1][0]);
        const yO = e.lOrigin[1] - Math.min(mm[0][1], mm[1][1]);
  
        // map info
        console.log(`${map.name}`);
        console.log(`    map dimensions: [${mmBounds}], scale: [${e.scale}]`);
        console.log(`    orig heightmap: ${e.hDim[0]}x${e.hDim[1]}`);
  
        if (e.levels) {
          console.log(`       final scale: ${scale(e.levels[0], e.levels[1], e.scale[2])}`);
        }
  
        // how to scale & crop heightmap in gimp
        if (e.hDim) {
          console.log(`scale heightmap to: ${Math.round(e.hDim[0] * e.scale[0])}x${Math.round(e.hDim[1] * e.scale[1])}`);
          console.log(`set canvas size to: ${mmBounds[0]}x${mmBounds[1]}`);
          console.log(`       with offset: ${xO}x${yO}`);
  
          // warning if the heightmap is smaller than the minimap
          if (e.hDim[0] * e.scale[0] < mmBounds[0] || e.hDim[1] * e.scale[1] < mmBounds[1]) {
            // console.log(`${e.hDim[0] * e.scale[0]} < ${mmBounds[0]} || ${e.hDim[1] * e.scale[1]} < ${mmBounds[1]}`)
            console.warn("scaled heightmap still too small!");
          }
        }
  
        // what to set the levels to in gimp
        if (e.levels) {
          console.log(`     set levels to: ${e.levels[0]} <-> ${e.levels[1]}`);
        }
  
      } else {
        console.warn(`${map.name} has no extras!`);
      }
      console.log("---");
    });
  }
  
  /**
   * Takes the MAPDATA object and fills it with necessary information calculated from the extras object for each map.
   * Then it generates and saves a valid json object, that can later be retrieved by SquadMC
   * to properly display the maps stored in this repository.
   * See the npm run mapdata script to know where the json will be saved to.
   */
  function generateJSON() {
    const obj = MAPDATA;
    obj.forEach((map) => {
      const e = map.extra;
      if (e) {
        const mm = e.minimap;
  
        if (mm) {
          map.bounds = bounds(mm[0], mm[1]);
        } else {
          throw new Error(`map ${map.name} has no minimap! Can't calculate bounds!`);
        }
  
        if (map.heightmap && e && e.levels && e.scale) {
          map.heightmap.scale = scale(e.levels[0], e.levels[1], e.scale[2]);
        } else {
          console.warn(`map ${map.name} has no heightmap, or is missing information in extras object`);
        }
      } else {
        console.warn(`map ${map.name} has no extras!`)
      }
  
    });
  
    // raw printing the json object, will be piped by npm script into file
    process.stdout.write(JSON.stringify(obj));
  }
  
  // based on args, either print info, or raw print json object
  if (process.argv.length > 2) {
    extraInfo();
  } else {
    generateJSON();
  }


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
  MAPDATA.forEach((map) => {
    const e = map.extra;
    if (e) {
      const mm = e.minimap;
      const mmBounds = bounds(mm[0], mm[1]);

      const xO = e.lOrigin[0] - Math.min(mm[0][0], mm[1][0]);
      const yO = e.lOrigin[1] - Math.min(mm[0][1], mm[1][1]);

      // map info
      console.log(`${map.name}`);
      console.log(`    map dimensions: [${mmBounds}], scale: [${e.scale}]`);
      console.log(`    orig heightmap: ${e.hDim[0]}x${e.hDim[1]}`);

      if (e.levels) {
        console.log(`       final scale: ${scale(e.levels[0], e.levels[1], e.scale[2])}`);
      }

      // how to scale & crop heightmap in gimp
      if (e.hDim) {
        console.log(`scale heightmap to: ${Math.round(e.hDim[0] * e.scale[0])}x${Math.round(e.hDim[1] * e.scale[1])}`);
        console.log(`set canvas size to: ${mmBounds[0]}x${mmBounds[1]}`);
        console.log(`       with offset: ${xO}x${yO}`);

        // warning if the heightmap is smaller than the minimap
        if (e.hDim[0] * e.scale[0] < mmBounds[0] || e.hDim[1] * e.scale[1] < mmBounds[1]) {
          // console.log(`${e.hDim[0] * e.scale[0]} < ${mmBounds[0]} || ${e.hDim[1] * e.scale[1]} < ${mmBounds[1]}`)
          console.warn("scaled heightmap still too small!");
        }
      }

      // what to set the levels to in gimp
      if (e.levels) {
        console.log(`     set levels to: ${e.levels[0]} <-> ${e.levels[1]}`);
      }

    } else {
      console.warn(`${map.name} has no extras!`);
    }
    console.log("---");
  });
}

/**
 * Takes the MAPDATA object and fills it with necessary information calculated from the extras object for each map.
 * Then it generates and saves a valid json object, that can later be retrieved by SquadMC
 * to properly display the maps stored in this repository.
 * See the npm run mapdata script to know where the json will be saved to.
 */
function generateJSON() {
  const obj = MAPDATA;
  obj.forEach((map) => {
    const e = map.extra;
    if (e) {
      const mm = e.minimap;

      if (mm) {
        map.bounds = bounds(mm[0], mm[1]);
      } else {
        throw new Error(`map ${map.name} has no minimap! Can't calculate bounds!`);
      }

      if (map.heightmap && e && e.levels && e.scale) {
        map.heightmap.scale = scale(e.levels[0], e.levels[1], e.scale[2]);
      } else {
        console.warn(`map ${map.name} has no heightmap, or is missing information in extras object`);
      }
    } else {
      console.warn(`map ${map.name} has no extras!`)
    }

  });

  // raw printing the json object, will be piped by npm script into file
  process.stdout.write(JSON.stringify(obj));
}

// based on args, either print info, or raw print json object
if (process.argv.length > 2) {
  extraInfo();
} else {
  generateJSON();
}

