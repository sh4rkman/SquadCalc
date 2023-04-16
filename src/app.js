import "webpack-jquery-ui/effects";
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "./js/listeners.js";
import "./css/styles.scss";
import "./css/themes.scss";
import "./css/responsive.scss";

import { preventAutocomplete } from "./js/utils";
import { loadMaps } from "./js/maps";
import { loadTheme } from "./js/themes";
import { loadWeapons } from "./js/weapons";

$(function() {
    loadTheme();
    loadWeapons();
    loadMaps();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});