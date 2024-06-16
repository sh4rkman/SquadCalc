// Node Modules
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "animate.css";
import "leaflet/dist/leaflet.css";
//import "leaflet/dist/images/marker-shadow.png"; // fix

// Local styles
import "./css/styles.scss";
import "./css/responsive.scss";

// JS Functions
import { preventAutocomplete, loadUI, showPage } from "./js/utils";
import { loadMapSelector, loadMinimap } from "./js/maps";
import { loadWeapons } from "./js/weapons";
import { createLine } from "./js/animations";
import { loadSettings } from "./js/settings.js";
import { registerServiceWorkers } from "./js/serviceWorkers.js";
import packageInfo from "../package.json";
import "./js/listeners.js";

$(function() {
    loadSettings();
    createLine();
    loadMapSelector();
    loadMinimap();
    loadWeapons();
    loadUI();
    preventAutocomplete();
    showPage();
    registerServiceWorkers();
    console.log("Calculator v" + packageInfo.version + " Loaded!");
});