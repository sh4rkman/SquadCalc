import './css/darktheme.scss';
import './css/bluetheme.scss';
import './css/greentheme.scss';
import './css/styles.scss';
import './css/responsive.scss';
import { loadHeatmap, loadMaps, preventAutocomplete, getTheme } from "./js/utils.js";


$(function() {
    getTheme();
    loadMaps();
    loadHeatmap();
    preventAutocomplete();
    console.log("Calculator Loaded!");
});