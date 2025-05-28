// Node Modules
import "purecss/build/pure-min.css";
import "purecss/build/grids-responsive-min.css";
import "select2/dist/css/select2.min.css";
import "select2/dist/js/select2.min.js";
import "animate.css";
import "leaflet/dist/leaflet.css";

// Local styles
import "./components/header/header.scss";
import "./components/footer/footer.scss";
import "./components/map/map.scss";
import "./components/contextMenu/contextMenu.scss";
import "./components/legacyui/legacyui.scss";
import "./components/dialogs/dialogs.scss";
import "./components/shared/_tooltips.scss";
import "./components/shared/_responsive.scss";

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
        ["fr", "FR"],
        ["de", "DE"]
    ],
    gravity: 9.78,
    mapSize: 256,
    debug: false,
};

export var App = new SquadCalc(options);
App.init();