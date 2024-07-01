import { App } from "./conf";
import { squadMinimap } from "./squadMinimap";

// Each map has a different size and require scaling w, y and z when calculating height
export const MAPS = [
    { 
        name: "Al Basrah", 
        size: 3040, // OK
        offset: [0, 0],
        scaling: 0.01294, // OK
        mapURL: "/albasrah/",
        maxZoomLevel: 4,
    },
    { 
        name: "Anvil", 
        size: 3060, //OK
        offset: [0, 0], 
        scaling: 0.216675, 
        mapURL: "/anvil/",
        maxZoomLevel: 4,
    },
    { 
        name: "Belaya", 
        size: 3904, //OK
        offset: [0, 0], 
        scaling: 0.0726, 
        mapURL: "/belaya/",
        maxZoomLevel: 4,
    },
    { 
        name: "Black Coast", 
        size: 4600, // OK but not what mapdata gave us. Maybe because of x scaling?
        offset: [0, 0], 
        scaling: 0.35, 
        mapURL: "/blackcoast/",
        maxZoomLevel: 4,
    },
    { 
        name: "Chora", 
        size: 4064, // OK
        offset: [0, 0], 
        scaling: 0.064, 
        mapURL: "/chora/",
        maxZoomLevel: 4,
    },
    { 
        name: "Fallujah", 
        size: 3005, // OK
        offset: [0, 0], 
        scaling: 0.0401, // OK
        mapURL: "/fallujah/",
        maxZoomLevel: 4,
    },
    { 
        name: "Fool's Road",
        size: 1774, // OK
        offset: [0, 0], 
        scaling: 0.21600000000000003,
        mapURL: "/foolsroad/",
        maxZoomLevel: 4,
    },
    { 
        name: "Goose Bay", 
        size: 4031, // OK
        offset: [0, 0], 
        scaling: 0.22064, // OK
        mapURL: "/goosebay/",
        maxZoomLevel: 4,
    },
    { 
        name: "Gorodok", 
        size: 4064, // OK
        offset: [200, 200], 
        scaling: 0.236,
        mapURL: "/gorodok/",
        maxZoomLevel: 4,
    },
    // { 
    //     name: "Jensen's Range", 
    //     size: 4008, // OK
    //     offset: [0, 0], 
    //     scaling: 0.0859, // OK
    //     mapURL: "/jensen/",
    //     maxZoomLevel: 4,
    // },
    { 
        name: "Harju", 
        size: 4032, // OK
        offset: [0, 0], 
        scaling: 0.131, // OK
        mapURL: "/harju/",
        maxZoomLevel: 4,
    },
    { 
        name: "Kamdesh", 
        size: 4032, // OK
        offset: [0, 0], 
        scaling: 0.190215, 
        mapURL: "/kamdesh/",
        maxZoomLevel: 4,
    },
    { 
        name: "Kohat", 
        size: 4617, // OK
        offset: [0, 0], 
        scaling: 0.733125, // OK
        mapURL: "/kohat/",
        maxZoomLevel: 4,
    },
    { 
        name: "Kokan",
        size: 2496, // OK
        offset: [0, 0], 
        scaling: 0.0164, 
        mapURL: "/kokan/",
        maxZoomLevel: 4,
    },
    { 
        name: "Lashkar", 
        size: 4334, // OK
        offset: [0, 0], 
        scaling: 0.28215, 
        mapURL: "/lashkar/",
        maxZoomLevel: 4,
    },
    { 
        name: "Logar", 
        size: 1761, // OK
        offset: [0, 0], 
        scaling: 0.13575, 
        mapURL: "/logar/",
        maxZoomLevel: 4,
    },
    { 
        name: "Manicouagan", 
        size: 4031, // OK
        offset: [0, 0], 
        scaling: 0.3564, 
        mapURL: "/manicouagan/",
        maxZoomLevel: 4,
    },
    { 
        name: "Mestia", 
        size: 2400,
        offset: [0, 0], 
        scaling: 0.41028, 
        mapURL: "/mestia/",
        maxZoomLevel: 4,
    },
    { 
        name: "Mutaha", 
        size: 2755, // OK
        offset: [-70, -100], 
        scaling: 0.07071, 
        mapURL: "/mutaha/",
        maxZoomLevel: 4,
    },
    { 
        name: "Narva", 
        size: 2800, // OK
        offset: [-100, -100], 
        scaling: 0.0583, 
        mapURL: "/narva/",
        maxZoomLevel: 4,
    },
    /*{ 
        name: "Narva (f)", 
        size: 2800, // OK
        offset: [-100, -100], 
        scaling: 0.0583, 
        mapURL: "/narva-flooded/{z}_{x}_{y}.webp",
        maxZoomLevel: 4,
    }, */
    { 
        name: "Sanxian",
        size: 4600, 
        offset: [0, 0], 
        scaling: 0.1892, 
        mapURL: "/sanxian/",
        maxZoomLevel: 4,
    },
    { 
        name: "Skorpo", 
        size: 6869, // OK
        offset: [0, 0], 
        scaling: 1.0927, 
        mapURL: "/skorpo/",
        maxZoomLevel: 4,
    },
    { 
        name: "Sumari", 
        size: 1300, // OK
        offset: [0, 0], 
        scaling: 0.035925, 
        mapURL: "/sumari/",
        maxZoomLevel: 4,
    },
    { 
        name: "Tallil", 
        size: 4680, // OK
        offset: [-200, -200], 
        scaling: 0.05275, 
        mapURL: "/tallil/",
        maxZoomLevel: 4,
    },
    { 
        name: "Yehorivka", 
        size: 6350, // Not the SDK values weirdly
        offset: [-8300, -8300], 
        scaling: 0.3332, 
        mapURL: "/yehorivka/", 
        maxZoomLevel: 4,
    }
];

/**
 * Load the maps to the menu
 */
export function loadMapSelector() {
    const MAP_SELECTOR = $(".dropbtn");

    // Initiate select2 object (https://select2.org/)
    if (App.debug.active) {
        MAP_SELECTOR.select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#mapSelector"),
            minimumResultsForSearch: -1,
            placeholder: "DEBUG MODE"
        });
    } else {
        MAP_SELECTOR.select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#mapSelector"),
            minimumResultsForSearch: -1, // Disable search
            placeholder: "SELECT A MAP"
        });
    }

    // load maps into select2
    MAPS.forEach(function(map, i) {
        MAP_SELECTOR.append("<option value=\"" + i + "\">" + map.name + "</option>");
    });


}

export function loadMinimap(){
    var tileSize = 256;
    var randMapId = Math.floor(Math.random() * MAPS.length);
    var defaultMap = MAPS[randMapId];
    $(".dropbtn").val(randMapId);
    App.minimap = new squadMinimap("map", tileSize, defaultMap);
    App.minimap.draw();
}