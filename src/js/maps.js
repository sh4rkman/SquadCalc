import { globalData } from "./conf";
import { shoot, getKP,isTouchDevice } from "./utils";
import { mortarIcon, targetIcon, squadWeaponMarker,squadTargetMarker } from "./marker";
import SquadGrid from "./SquadGrid";

import L from "leaflet";

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


// Each map has a different size and require scaling w, y and z when calculating height
export const MAPS = [
    { 
        name: "Al Basrah", 
        size: 3040, // OK but heightmap is off
        offset: [0, 0],
        scaling: 0.01294, //0.02294, anciennement
        heightmapURL: AlBasrahURL,
        mapURL: "/albasrah/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Anvil", 
        size: 3060, //OK
        offset: [0, 0], 
        scaling: 0.216675, 
        heightmapURL: AnvilURL,
        mapURL: "/anvil/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Belaya", 
        size: 3904, //OK
        offset: [0, 0], 
        scaling: 0.0726, 
        heightmapURL: BelayaURL,
        mapURL: "/belaya/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Black Coast", 
        size: 4600, // OK but not what mapdata gave us. Maybe because of x scaling?
        offset: [0, 0], 
        scaling: 0.35, 
        heightmapURL: BlackCoastURL,
        mapURL: "/blackcoast/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Chora", 
        size: 4064, // OK
        offset: [0, 0], 
        scaling: 0.064, 
        heightmapURL: ChoraURL,
        mapURL: "/chora/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Fallujah", 
        size: 3005, // OK
        offset: [-200, 0], 
        scaling: 0.0401, 
        heightmapURL: FallujahURL,
        mapURL: "/fallujah/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Fool's Road",
        size: 1774, // OK
        offset: [-150, 0], 
        scaling: 0.15744, 
        heightmapURL: FoolsRoadURL,
        mapURL: "/foolsroad/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Goose Bay", 
        size: 4031, // OK
        offset: [0, 0], 
        scaling: 0.2, 
        heightmapURL: GooseBayURL,
        mapURL: "/goosebay/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Gorodok", 
        size: 4064, 
        offset: [200, 200], 
        scaling: 0.119, 
        heightmapURL: GorodokURL,
        mapURL: "/gorodok/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Harju", 
        size: 4032, // OK
        offset: [0, 0], 
        scaling: 0.1, 
        heightmapURL: HarjuURL,
        mapURL: "/harju/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Kamdesh", 
        size: 4032, // OK
        offset: [0, 0], 
        scaling: 0.190215, 
        heightmapURL: KamdeshURL,
        mapURL: "/kamdesh/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Kohat", 
        size: 4617, // OK
        offset: [-1000, 0], 
        scaling: 1, 
        heightmapURL: KohatURL,
        mapURL: "/kohat/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Kokan",
        size: 2496, // OK
        offset: [0, 0], 
        scaling: 0.0164, 
        heightmapURL: 
        KokanURL,
        mapURL: "/kokan/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Lashkar", 
        size: 4334, // OK
        offset: [0, 0], 
        scaling: 0.28215, 
        heightmapURL: LashkarURL,
        mapURL: "/lashkar/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Logar", 
        size: 1761, // OK
        offset: [0, 0], 
        scaling: 0.13575, 
        heightmapURL: LogarURL,
        mapURL: "/logar/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Manicouagan", 
        size: 4031, // OK
        offset: [0, 0], 
        scaling: 0.3564, 
        heightmapURL: ManicouaganURL,
        mapURL: "/manicouagan/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Mestia", 
        size: 2400, // OK mais minimap à refaire
        offset: [0, 0], 
        scaling: 0.41028, 
        heightmapURL: MestiaURL,
        mapURL: "/mestia/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Mutaha", 
        size: 2755, // OK
        offset: [-70, -100], 
        scaling: 0.07071, 
        heightmapURL: MutahaURL,
        mapURL: "/mutaha/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Narva", 
        size: 2800, // OK
        offset: [-100, -100], 
        scaling: 0.0583, 
        heightmapURL: NarvaURL,
        mapURL: "/narva/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Sanxian (beta)",
        size: 3571, 
        offset: [-9600, -9600], 
        scaling: 0.1892, 
        heightmapURL: SanxianURL,
        mapURL: "/sanxian/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Skorpo", 
        size: 7600, // OK
        offset: [0, 0], 
        scaling: 2.14515, 
        heightmapURL: SkorpoURL,
        mapURL: "/skorpo/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Sumari", 
        size: 1300, // OK
        offset: [0, 0], 
        scaling: 0.035925, 
        heightmapURL: SumariURL,
        mapURL: "/sumari/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Tallil", 
        size: 4680, // OK
        offset: [-200, -200], 
        scaling: 0.05275, 
        heightmapURL: TallilURL,
        mapURL: "/tallil/{z}_{x}_{y}.jpg",
    },
    { 
        name: "Yehorivka", 
        size: 6350, // Not the SDK values weirdly
        offset: [-8300, -8300], 
        scaling: 0.2732, 
        heightmapURL: YehorivkaURL,
        mapURL: "/yehorivka/{z}_{x}_{y}.jpg", 
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
    loadHeatmap();
}

/**
 * Draw the selected Heatmaps in a hidden canvas
 */
export function drawHeatmap() {
    const IMG = new Image(); // Create new img element

    globalData.activeMap = $(".dropbtn").val();
    IMG.src = MAPS.find((elem, index) => index == globalData.activeMap).heightmapURL;

    IMG.addEventListener("load", function() { // wait for the image to load or it does crazy stuff
        globalData.canvas.obj.drawImage(IMG, 0, 0, globalData.canvas.size, globalData.canvas.size);
        shoot();
    }, false);

}


/**
 * Load the heatmap to the canvas
 */
function loadHeatmap() {
    const IMG = new Image();
    globalData.canvas.obj = document.getElementById("canvas").getContext("2d", {willReadFrequently: true});

    IMG.addEventListener("load", function() {
        globalData.canvas.obj.drawImage(IMG, 0, 0, globalData.canvas.size, globalData.canvas.size); // Draw img at good scale
    }, false);

    if (globalData.debug.active) {
        // when in debug mode, display the heightmap and prepare keypads
        $("#canvas").css("display", "flex");
        $("#mortar-location").val(globalData.debug.DEBUG_MORTAR_COORD);
        $("#target-location").val(globalData.debug.DEBUG_TARGET_COORD);
        shoot();
    }
}

export function loadMap(){

    var map = L.map("map", {
        center: [700, 700],
        attributionControl: false,
        crs: L.CRS.Simple,
        minZoom: 1,
        maxZoom: 6,
        zoomControl: false,
        doubleClickZoom: false,
    });

    var mouseLocationPopup = L.popup({
        closeButton: false,
        className: "kpPopup",
        autoClose: false,
        closeOnClick: false,
        closeOnEscapeKey: false,
        offset: [0, 75],
        autoPan: false,
        interactive: false,
    });

    globalData.map = map;
    globalData.map.setView([-128, 128], 2);
    globalData.markersGroup = L.layerGroup().addTo(globalData.map);
    globalData.layerGroup = L.layerGroup().addTo(globalData.map);
    globalData.weaponGroup = L.layerGroup().addTo(globalData.map);
    globalData.activeWeaponMarkers = L.layerGroup().addTo(globalData.map);


    $(document).on("mouseleave", function () {
        mouseLocationPopup.close();
    });


    globalData.map.on("mousemove", function(e){
        if (!isTouchDevice()){
            const mapScale = MAPS.find((elem, index) => index == globalData.activeMap).size / 256;

            // If no map has been loaded
            if (globalData.layerGroup.getLayers().length === 0) {return 1;}
    
            // If out of bounds
            if (e.latlng.lat > 0 ||  e.latlng.lat < -256 || e.latlng.lng < 0 || e.latlng.lng > 256) {
                mouseLocationPopup.close();
                return;
            }
    
            mouseLocationPopup.setLatLng(e.latlng).openOn(globalData.map);
            mouseLocationPopup.setContent("<p>"+ getKP(-e.latlng.lat * mapScale, e.latlng.lng * mapScale) + "</p>");
        }
        
    });    

    globalData.map.on("dblclick", function(e){
        // If out of bounds
        if (e.latlng.lat > 0 ||  e.latlng.lat < -256 || e.latlng.lng < 0 || e.latlng.lng > 256) {
            return 1;
        }
        new squadTargetMarker(L.latLng(e.latlng), {icon: targetIcon}).addTo(globalData.markersGroup);
    });

}



export function drawMap(){

    var imageBounds = L.latLngBounds(L.latLng(0, 0), L.latLng(-255, 255));
    var mapName = MAPS.find((elem, index) => index == globalData.activeMap).name;
    var mapURL = MAPS.find((elem, index) => index == globalData.activeMap).mapURL;
    var grid;
    var imageUrl;
    var heightmaplayer;

    globalData.layerGroup.clearLayers();
    globalData.markersGroup.clearLayers();
    globalData.weaponGroup.clearLayers();
   
    // Remove any layers already drawn
    globalData.layerGroup.eachLayer(function(layer){
        globalData.layerGroup.removeLayer(layer);
    });

    // Draw the current layer
    L.tileLayer("src/img/maps" + mapURL, {
        maxNativeZoom: 4,
        noWrap: true,
        bounds: imageBounds,
    }).addTo(globalData.layerGroup);

    // create weapon
    globalData.activeWeaponMarker = new squadWeaponMarker(L.latLng([-128, 128]), {icon: mortarIcon, draggable: true}).addTo(globalData.markersGroup);

    grid = new SquadGrid();
    grid.setBounds(imageBounds);
    grid.addTo(globalData.layerGroup);


    if (globalData.debug.active){
        imageUrl = "src/img/heightmaps/" + mapName.toLowerCase() + ".jpg";
        heightmaplayer = L.imageOverlay(imageUrl, imageBounds, {
            opacity: 0.5,
        }).addTo(globalData.layerGroup);

        //BaseLayer
        const Map_BaseLayer = {
            //'MIERUNE Color': maplayer,
            //'MIERUNE MONO': heightmaplayer,
        };

        //AddLayer
        const Map_AddLayer = {
            "Heightmap": heightmaplayer,
        };

        //LayerControl
        L.control.layers(Map_BaseLayer, Map_AddLayer, {
            collapsed: false,
        }).addTo(globalData.map);
    }

}


export function insertMarkers(a, b){

    const mapScale = 256 / MAPS.find((elem, index) => index == globalData.activeMap).size;
    var aScaled = L.latLng(a.lat * mapScale, a.lng * -mapScale);
    var bScaled = L.latLng(b.lat * mapScale, b.lng * -mapScale);

    globalData.activeWeaponMarker = new squadWeaponMarker(aScaled, {icon: mortarIcon, draggable: true}).addTo(globalData.markersGroup);
    new squadTargetMarker(bScaled, {icon: targetIcon, draggable: true}).addTo(globalData.markersGroup);
}




