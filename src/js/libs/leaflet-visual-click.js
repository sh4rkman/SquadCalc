/*
* L.VisualClick
* Description: A plugin that adds visual feedback when user clicks/taps the map. Useful for when you have a delay on the clickEvents for async fetching of data, or implmentation of Leaflet.singleclick
* Example: L.visualClick({map: leafletMap}); //Just works
* Author: Dag Jomar Mersland (twitter: @dagjomar)
* 
* Modified by Maxime "sharkman" Boussard for https://github.com/sh4rkman/SquadCalc
* The patch change the visualClick to be manually triggered and its color to be set
*/

import { Map, Marker, Handler, DivIcon } from "leaflet";

Map.VisualClick = class extends Handler {

    _visualIcon = null;

    _makeVisualIcon(color){
        var touchMode = this._map.options.visualClickMode === "touch" ? true : false;
        return new DivIcon({
            className: "leaflet-visualclick-icon" + (touchMode ? "-touch" : "") + " " + color,
            iconSize: [0, 0],
            clickable: false
        });
    }

    triggerVisualClick(latlng, color = "white") {

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
    }

    addHooks() {}

};


Map.mergeOptions({
    visualClick: true,
    visualClickMode: matchMedia("(pointer: coarse)").matches ? "touch" : "desktop",
    visualClickPane: "shadowPane"	// Map pane where the pulse markers will be shown
});

Map.addInitHook("addHandler", "visualClick", Map.VisualClick);