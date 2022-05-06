import './css/styles.scss';
import './css/responsive.scss';
import { loadHeatmap } from "./js/utils.js";
import { loadMaps } from "./js/utils.js";
import { preventAutocomplete } from "./js/utils.js";

$(function() {
    loadMaps();
    loadHeatmap();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});