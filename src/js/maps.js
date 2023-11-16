import { globalData } from "./conf";
import { shoot } from "./utils";
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
    { name: "Al Basrah", size: 3040, offset: [0, 0], scaling: 0.02294, url: AlBasrahURL},
    { name: "Anvil", size: 3040, offset: [0, 0], scaling: 0.216675, url: AnvilURL },
    { name: "Belaya", size: 3904, offset: [0, 0], scaling: 0.0726, url: BelayaURL },
    { name: "Black Coast", size: 4580, offset: [0, 0], scaling: 0.35, url: BlackCoastURL },
    { name: "Chora", size: 4045, offset: [0, 0], scaling: 0.064, url: ChoraURL },
    { name: "Fallujah", size: 3005, offset: [-200, 0], scaling: 0.0401, url: FallujahURL },
    { name: "Fool's Road", size: 1736, offset: [-150, 0], scaling: 0.15744, url: FoolsRoadURL },
    { name: "Goose Bay", size: 4065, offset: [0, 0], scaling: 0.2, url: GooseBayURL },
    { name: "Gorodok", size: 4340, offset: [200, 200], scaling: 0.119, url: GorodokURL },
    { name: "Harju", size: 4065, offset: [0, 0], scaling: 0.1, url: HarjuURL },
    { name: "Kamdesh", size: 4032, offset: [0, 0], scaling: 0.190215, url: KamdeshURL },
    { name: "Kohat", size: 4617, offset: [-1000, 0], scaling: 1, url: KohatURL },
    { name: "Kokan", size: 2496, offset: [0, 0], scaling: 0.0164, url: KokanURL },
    { name: "Lashkar", size: 4334, offset: [0, 0], scaling: 0.28215, url: LashkarURL },
    { name: "Logar", size: 1761, offset: [0, 0], scaling: 0.13575, url: LogarURL },
    { name: "Manicouagan", size: 4065, offset: [0, 0], scaling: 0.3564, url: ManicouaganURL },
    { name: "Mestia", size: 2400, offset: [0, 0], scaling: 0.41028, url: MestiaURL },
    { name: "Mutaha", size: 2755, offset: [-70, -100], scaling: 0.07071, url: MutahaURL },
    { name: "Narva", size: 2800, offset: [-100, -100], scaling: 0.0583, url: NarvaURL },
    { name: "Sanxian (beta)", size: 3571, offset: [-9600, -9600], scaling: 0.1892, url: SanxianURL },
    { name: "Skorpo", size: 7600, offset: [0, 0], scaling: 2.14515, url: SkorpoURL },
    { name: "Sumari", size: 1300, offset: [0, 0], scaling: 0.035925, url: SumariURL },
    { name: "Tallil", size: 4680, offset: [-200, -200], scaling: 0.05275, url: TallilURL },
    { name: "Yehorivka", size: 5000, offset: [-8300, -8300], scaling: 0.2732, url: YehorivkaURL }
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
    IMG.src = MAPS.find((elem, index) => index == globalData.activeMap).url;

    IMG.addEventListener("load", function() { // wait for the image to load or it does crazy stuff
        globalData.canvas.obj.drawImage(IMG, 0, 0, globalData.canvas.size, globalData.canvas.size);
        shoot()
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

    var map = L.map('map', {
        center: [700, 700],
        attributionControl: false,
        crs: L.CRS.Simple,
        minZoom: 1,
        maxZoom: 6,
        cursor: true
    });

    globalData.map = map;
    globalData.map.setView([-128, 128], 2);
    globalData.markersGroup = L.layerGroup().addTo(globalData.map);
    globalData.layerGroup = L.layerGroup().addTo(globalData.map);
    globalData.controlGroup = L.layerGroup().addTo(globalData.map);

    globalData.map.on("click", function(e){
        console.log("lat: " + e.latlng.lat + "lng: " + e.latlng.lng + "zoom: " + map.getZoom());
    });
}

export function drawMap(){
    var imageBounds = [[0, 0], [-255, 255]];
    var mapName = MAPS.find((elem, index) => index == globalData.activeMap).name

    globalData.layerGroup.clearLayers();
    globalData.controlGroup.clearLayers();

    // Remove any layers already drawn
    globalData.layerGroup.eachLayer(function(layer){
        globalData.layerGroup.removeLayer(layer)
    });

    // Draw the current layer
    var maplayer = L.tileLayer("src/img/maps/" + mapName.toLowerCase() + "/{z}_{x}_{y}.jpg", {
        maxNativeZoom: 4,
        noWrap: true,
        bounds: imageBounds,
    }).addTo(globalData.layerGroup);


    var imageUrl = "src/img/heightmaps/" + mapName.toLowerCase() + ".jpg";
    var heightmaplayer = L.imageOverlay(imageUrl, imageBounds, {
        opacity: 0.5,
    }).addTo(globalData.layerGroup);


    //BaseLayer
    const Map_BaseLayer = {
        //'MIERUNE Color': maplayer,
        //'MIERUNE MONO': heightmaplayer,
    };

    //AddLayer
    const Map_AddLayer = {
        'Heightmap': heightmaplayer,
    };

    //LayerControl
    L.control.layers(Map_BaseLayer, Map_AddLayer, {
        collapsed: false,
    }).addTo(globalData.map);


}



export function insertMarkers(a, b){

    const mapScale = 255 / MAPS.find((elem, index) => index == globalData.activeMap).size;

    var aScaled = {
        lat: a.lat * mapScale,
        lng: a.lng * mapScale
    }

    var bScaled = {
        lat: b.lat * mapScale,
        lng: b.lng * mapScale
    }

    L.marker([-aScaled.lng, aScaled.lat]).addTo(globalData.markersGroup);
    L.marker([-bScaled.lng, bScaled.lat]).addTo(globalData.markersGroup);
    //L.marker([bScaled.lat, -bScaled.lng]).addTo(globalData.markersGroup);


}




