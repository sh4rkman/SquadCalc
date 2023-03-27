import "webpack-jquery-ui/effects";
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "./css/styles.scss";
import "./css/themes.scss";
import "./css/responsive.scss";

import { preventAutocomplete } from "./js/utils";
import { loadHeatmap, loadMaps } from "./js/maps";
import { getTheme } from "./js/themes";
import { getWeapon } from "./js/weapons";

$(function() {
    getTheme();
    getWeapon();
    loadMaps();
    loadHeatmap();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});