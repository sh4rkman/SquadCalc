import './css/styles.css';
import './css/responsive.css';
import { loadHeatmap } from "./js/utils.js";
import { loadMaps } from "./js/utils.js";
import { preventAutocomplete } from "./js/utils.js";

$(document).ready(function() {
    loadMaps();
    loadHeatmap();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});