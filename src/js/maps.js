import { globalData } from "./conf";

import AlBasrahURL from "../img/heightmaps/al basrah.jpg";
import AnvilURL from "../img/heightmaps/anvil.jpg";
import BelayaURL from "../img/heightmaps/belaya.jpg";
import BlackCoastURL from "../img/heightmaps/black coast.jpg";
import ChoraURL from "../img/heightmaps/chora.jpg";
import FallujahURL from "../img/heightmaps/fallujah.jpg";
import FoolsRoadURL from "../img/heightmaps/fool's road.jpg";
import GooseBayURL from "../img/heightmaps/goose bay.jpg";
import GorodokURL from "../img/heightmaps/gorodok.jpg";
import HarjuURL from "../img/heightmaps/harju.jpg";
import KamdeshURL from "../img/heightmaps/kamdesh.jpg";
import KohatURL from "../img/heightmaps/kohat.jpg";
import KokanURL from "../img/heightmaps/kokan.jpg";
import LashkarURL from "../img/heightmaps/lashkar.jpg";
import LogarURL from "../img/heightmaps/logar.jpg";
import ManicouaganURL from "../img/heightmaps/manicouagan.jpg";
import MestiaURL from "../img/heightmaps/mestia.jpg";
import MutahaURL from "../img/heightmaps/mutaha.jpg";
import NarvaURL from "../img/heightmaps/narva.jpg";
import SanxianURL from "../img/heightmaps/sanxian (beta).jpg";
import SkorpoURL from "../img/heightmaps/skorpo.jpg";
import SumariURL from "../img/heightmaps/sumari.jpg";
import TallilURL from "../img/heightmaps/tallil.jpg";
import YehorivkaURL from "../img/heightmaps/yehorivka.jpg";
import { squadMinimap } from "./squadMinimap";


// Each map has a different size and require scaling w, y and z when calculating height
export const MAPS = [
    { 
        name: "Al Basrah", 
        size: 3040, // OK
        offset: [0, 0],
        scaling: 0.01294, // OK
        heightmapURL: AlBasrahURL,
        mapURL: "/albasrah/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Anvil", 
        size: 3060, //OK
        offset: [0, 0], 
        scaling: 0.216675, 
        heightmapURL: AnvilURL,
        mapURL: "/anvil/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Belaya", 
        size: 3904, //OK
        offset: [0, 0], 
        scaling: 0.0726, 
        heightmapURL: BelayaURL,
        mapURL: "/belaya/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Black Coast", 
        size: 4600, // OK but not what mapdata gave us. Maybe because of x scaling?
        offset: [0, 0], 
        scaling: 0.35, 
        heightmapURL: BlackCoastURL,
        mapURL: "/blackcoast/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Chora", 
        size: 4064, // OK
        offset: [0, 0], 
        scaling: 0.064, 
        heightmapURL: ChoraURL,
        mapURL: "/chora/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Fallujah", 
        size: 3005, // OK
        offset: [0, 0], 
        scaling: 0.0401, // OK
        heightmapURL: FallujahURL,
        mapURL: "/fallujah/{z}_{x}_{y}.jpg",
        maxZoomLevel: 5,
    },
    { 
        name: "Fool's Road",
        size: 1774, // OK
        offset: [0, 0], 
        scaling: 0.15744, // OK
        heightmapURL: FoolsRoadURL,
        mapURL: "/foolsroad/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Goose Bay", 
        size: 4031, // OK
        offset: [0, 0], 
        scaling: 0.22064, // OK
        heightmapURL: GooseBayURL,
        mapURL: "/goosebay/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Gorodok", 
        size: 4064, // OK
        offset: [200, 200], 
        scaling: 0.11900000000000001, // OK
        heightmapURL: GorodokURL,
        mapURL: "/gorodok/{z}_{x}_{y}.jpg",
        maxZoomLevel: 5,
    },
    { 
        name: "Harju", 
        size: 4032, // OK
        offset: [0, 0], 
        scaling: 0.131, // OK
        heightmapURL: HarjuURL,
        mapURL: "/harju/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Kamdesh", 
        size: 4032, // OK
        offset: [0, 0], 
        scaling: 0.190215, 
        heightmapURL: KamdeshURL,
        mapURL: "/kamdesh/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Kohat", 
        size: 4617, // OK
        offset: [0, 0], 
        scaling: 0.733125, // OK
        heightmapURL: KohatURL,
        mapURL: "/kohat/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Kokan",
        size: 2496, // OK
        offset: [0, 0], 
        scaling: 0.0164, 
        heightmapURL: KokanURL,
        mapURL: "/kokan/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Lashkar", 
        size: 4334, // OK
        offset: [0, 0], 
        scaling: 0.28215, 
        heightmapURL: LashkarURL,
        mapURL: "/lashkar/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Logar", 
        size: 1761, // OK
        offset: [0, 0], 
        scaling: 0.13575, 
        heightmapURL: LogarURL,
        mapURL: "/logar/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Manicouagan", 
        size: 4031, // OK
        offset: [0, 0], 
        scaling: 0.3564, 
        heightmapURL: ManicouaganURL,
        mapURL: "/manicouagan/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Mestia", 
        size: 2400,
        offset: [0, 0], 
        scaling: 0.41028, 
        heightmapURL: MestiaURL,
        mapURL: "/mestia/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Mutaha", 
        size: 2755, // OK
        offset: [-70, -100], 
        scaling: 0.07071, 
        heightmapURL: MutahaURL,
        mapURL: "/mutaha/{z}_{x}_{y}.jpg",
        maxZoomLevel: 5,
    },
    { 
        name: "Narva", 
        size: 2800, // OK
        offset: [-100, -100], 
        scaling: 0.0583, 
        heightmapURL: NarvaURL,
        mapURL: "/narva/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Sanxian (beta)",
        size: 3571, 
        offset: [0, 0], 
        scaling: 0.1892, 
        heightmapURL: SanxianURL,
        mapURL: "/sanxian/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Skorpo", 
        size: 7600, // OK
        offset: [0, 0], 
        scaling: 2.14515, 
        heightmapURL: SkorpoURL,
        mapURL: "/skorpo/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Sumari", 
        size: 1300, // OK
        offset: [0, 0], 
        scaling: 0.035925, 
        heightmapURL: SumariURL,
        mapURL: "/sumari/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Tallil", 
        size: 4680, // OK
        offset: [-200, -200], 
        scaling: 0.05275, 
        heightmapURL: TallilURL,
        mapURL: "/tallil/{z}_{x}_{y}.jpg",
        maxZoomLevel: 4,
    },
    { 
        name: "Yehorivka", 
        size: 6350, // Not the SDK values weirdly
        offset: [-8300, -8300], 
        scaling: 0.2732, 
        heightmapURL: YehorivkaURL,
        mapURL: "/yehorivka/{z}_{x}_{y}.jpg", 
        maxZoomLevel: 4,
    }
];

/**
 * Load the maps to the menu
 */
export function loadMapSelector() {
    const MAP_SELECTOR = $(".dropbtn");

    // Initiate select2 object (https://select2.org/)
    if (globalData.debug.active) {
        MAP_SELECTOR.select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#mapSelector"),
            minimumResultsForSearch: -1, // Disable search
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

    $(".dropbtn").val("0");
    globalData.minimap.loadHeatmap();
}

export function loadMinimap(){
    globalData.minimap = new squadMinimap("map");
    globalData.minimap.draw();
}