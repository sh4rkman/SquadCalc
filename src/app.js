// Node Modules
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "animate.css";
import "leaflet/dist/leaflet.css";

// Local styles
import "./css/styles.scss";
import "./css/responsive.scss";

// JS
import SquadCalc from "./js/squadCalc.js";


/***************/
// Start the App
/***************/

var options = {
    supportedLanguages: [
        ["en", "EN"],
        ["zh", "中文"],
        ["uk", "UKR"],
        ["ru", "РУС"],
        ["fr", "FR"]
    ],
    gravity: 9.78,
    debug: false,
};

export var App = new SquadCalc(options);
App.init();

