// Node Modules
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "animate.css";
import 'leaflet/dist/leaflet.css';
import "leaflet/dist/images/marker-shadow.png"; // fix

// Local styles
import "./css/styles.scss";
import "./css/responsive.scss";
import "leaflet.control.opacity/dist/L.Control.Opacity.css";

// JS Functions
import { preventAutocomplete } from "./js/utils";
import { loadMapSelector, loadMap } from "./js/maps";
import { loadTheme } from "./js/themes";
import { loadWeapons } from "./js/weapons";
import { createLine } from "./js/animations";
import { loadUI } from "./js/listeners"
import "./js/listeners.js";
import 'leaflet.control.opacity';


$(function() {
    loadMap()
    createLine();
    loadTheme();
    loadWeapons();
    loadMapSelector();
    loadUI();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});