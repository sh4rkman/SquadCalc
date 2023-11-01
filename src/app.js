// Node Modules
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "animate.css";

// Local styles
import "./css/styles.scss";
import "./css/responsive.scss";

// JS Functions
import { preventAutocomplete } from "./js/utils";
import { loadMaps } from "./js/maps";
import { loadTheme } from "./js/themes";
import { loadWeapons } from "./js/weapons";
import { createLine } from "./js/animations";
import "./js/listeners.js";

$(function() {
    createLine();
    loadTheme();
    loadWeapons();
    loadMaps();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});