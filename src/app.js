// Node Modules
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "animate.css";

// Local CSS
import "./css/fontawesome/fontawesome.scss";
import "./css/fontawesome/solid.scss";
import "./css/fontawesome/brands.scss";

// Local JS
import "./js/listeners.js";
import "./css/styles.scss";
import "./css/themes.scss";
import "./css/responsive.scss";


import { preventAutocomplete } from "./js/utils";
import { loadMaps } from "./js/maps";
import { loadTheme } from "./js/themes";
import { loadWeapons } from "./js/weapons";
import { createLine } from "./js/animations";

$(function() {
    createLine();
    loadTheme();
    loadWeapons();
    loadMaps();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});