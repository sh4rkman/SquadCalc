import _ from 'lodash';
import './css/styles.css';
import './css/responsive.css';

$(document).ready(function() {
    loadMaps();
    loadHeatmap();
    preventAutocomplete();
    loadToolTips();
    console.log("Calculator Loaded!");
});