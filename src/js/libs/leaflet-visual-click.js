/*
* L.VisualClick
* Description: A plugin that adds visual feedback when user clicks/taps the map. Useful for when you have a delay on the clickEvents for async fetching of data, or implmentation of Leaflet.singleclick
* Example: L.visualClick({map: leafletMap}); //Just works
* Author: Dag Jomar Mersland (twitter: @dagjomar)
* 
* Modified by Maxime "sharkman" Boussard for https://github.com/sh4rkman/SquadCalc
* The patch change the visualClick to be manually triggered and its color to be set
*/

import { Map, Marker, Handler, DivIcon, Browser} from "leaflet";

Map.VisualClick = Handler.extend({

    _makeVisualIcon: function(color){
        var touchMode = this._map.options.visualClickMode === "touch" ? true : false;
        return new DivIcon({
            className: "leaflet-visualclick-icon" + (touchMode ? "-touch" : "") + " " + color,
            iconSize: [0, 0],
            clickable: false
        });
    },

    _visualIcon: null,

    triggerVisualClick: function(latlng, color = "white") {

        var map = this._map;

        var marker = new Marker(latlng, {
            pane: this._map.options.visualClickPane,
            icon: this._makeVisualIcon(color),
            interactive: false
        }).addTo(map);

        window.setTimeout(function(){
            if (map){
                map.removeLayer(marker);
            }
        }.bind(this), map.options.visualClick.removeTimeout || 450);    // Should somewhat match the css animation to prevent loops

        return true;
    },

    addHooks: function () {
        if (this._map.options.visualClickPane === "ie10-visual-click-pane") {
            this._map.createPane("ie10-visual-click-pane");
        }
    },

});


Map.mergeOptions({
    visualClick: Browser.any3d ? true : false, //Can be true, desktop, touch, false. Not straight forward to use L.Browser.touch flag because true on IE10
    visualClickMode: Browser.touch && Browser.mobile ? "touch" : "desktop", //Not straight forward to use only L.Browser.touch flag because true on IE10 - so this is slightly better
    visualClickPane: (Browser.ie && document.documentMode === 10) ?
        "ie10-visual-click-pane" :
        "shadowPane"	// Map pane where the pulse markers will be shown
});

Map.addInitHook("addHandler", "visualClick", Map.VisualClick);