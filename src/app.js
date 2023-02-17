import "webpack-jquery-ui/effects"

import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";

import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";

import "./css/styles.scss";
import "./css/darktheme.scss";
import "./css/bluetheme.scss";
import "./css/greentheme.scss";
import "./css/responsive.scss";



import { loadHeatmap, loadMaps, preventAutocomplete, getTheme, getWeapon } from "./js/utils.js";


$(function() {
    getTheme();
    getWeapon();
    loadMaps();
    loadHeatmap();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});