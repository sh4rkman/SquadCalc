
import { App } from "../app.js";
import { LatLng } from "leaflet";
import  { MapArrow }  from "./squadMinimap.js";
import { createSessionTooltips, leaveSessionTooltips } from "./tooltips.js";

export default class SquadSession {

    constructor(sessionId) {
        const WS_URL = process.env.API_URL.replace(/^http/, "ws");
        this.ws = new WebSocket(`${WS_URL}/`);
        this.wsActiveUsers = 1;

        // WEB SOCKET EVENT HANDLERS
        this.ws.onopen = () => { this._open(sessionId); };
        this.ws.onclose = (event) => { this._close(event); };
        this.ws.onmessage = (message) => { this._handleMessage(message); };
    }

    // Send JOIN_SESSION if sessionId exists, otherwise send CREATE_SESSION
    _open(sessionId) {
        const message = sessionId ? {type: "JOIN_SESSION", sessionId, mapState: App.getAppState()} : { type: "CREATE_SESSION", mapState: App.getAppState()};
        this.ws.send(JSON.stringify(message));
    }

    _close(event) {
        // Remove the session query parameter from the URL
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("session"); // Remove the session parameter if it exists
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, "", newUrl); // Update the URL without reloading the page
        App.updateUrlParams({ session: null });

        // Update UI
        $(".btn-session").removeClass("active");
        leaveSessionTooltips.disable();
        createSessionTooltips.enable();
        $("#sessionUsers").css("display", "none");


        if (event.code === 1008) {
            console.error("Your app version is outdated. Please update to the latest version.");
            App.openToast("error", "outdatedVersion", "pleaseupdate");
        }
        else if (event.code === 4001) {
            App.openToast("error", "sessionFull", "");
        }
        else {
            App.openToast("error", "sessionClosed", "");
        }



        // todo : reverse all circles to red
        App.minimap.activeTargetsMarkers.eachLayer((target) => {
            if (target.fromSession) {
                target.fromSession = false;
                target.updateIcon();
                target.updateSpread();
                target.updateDamageRadius();
            }
        });

        // Enable Map Selector back
        App.MAP_SELECTOR.prop("disabled", false);
        //hostOnlyTooltip.disable();
    }

    _handleMessage(message) {
        const data = JSON.parse(message.data);
        
        switch (data.type) {

        case "SESSION_CREATED": {
            console.debug("New Session created : " + data.sessionId);
            App.updateUrlParams({ session: data.sessionId });
            App.openToast("success", "sessionCreated", "shareSession", true);
            break;
        }

        case "SESSION_JOINED": {
            console.debug("Successfully joined session: " + data.sessionId);

            // Update MAP with custom event to skip the broadcast
            App.MAP_SELECTOR.val(data.mapState.activeMap).trigger($.Event("change", { broadcast: false }));

            // Disable Map Selector for participants
            // App.MAP_SELECTOR.prop('disabled', true);
            // hostOnlyTooltip.enable();
                
            // Create every existing marker in the session
            data.mapState.weapons.forEach(weapon => {
                App.minimap.createWeapon(new LatLng(weapon.lat, weapon.lng), weapon.uid);        
            });       
            data.mapState.targets.forEach(target => {
                App.minimap.createTarget(new LatLng(target.lat, target.lng), false, target.uid);
            });
            data.mapState.markers.forEach(marker => {
                App.minimap.createMarker(new LatLng(marker.lat, marker.lng), marker.team, marker.category, marker.icon, marker.uid);
            });
            data.mapState.arrows.forEach(arrow => {
                new MapArrow(App.minimap, arrow.color, arrow.latlngs[0], arrow.latlngs[1], arrow.uid);
            });

            // Update UI for joining the session
            App.openToast("success", "sessionJoined", "");

            $("#sessionUsers").html(data.sessionUsers);
            if (data.sessionUsers > 1) {
                $("#sessionUsers").css("display", "flex");
            } else {
                $("#sessionUsers").css("display", "none");
            }
            this.wsActiveUsers = data.sessionUsers;
            break;
        }

        case "SESSION_NOT_FOUND": {
            console.debug("Session not found");
            App.openToast("error", "Session not found", data.sessionId);
            break;
        }

        case "ACTIVE_MEMBERS_UPDATED": {
            console.debug("New Session Users Count: ", data.sessionUsers);
            $("#sessionUsers").html(data.sessionUsers);
            if (data.sessionUsers > 1) {
                $("#sessionUsers").css("display", "flex");
            } else {
                $("#sessionUsers").css("display", "none");
            }

            // Only one left in the session
            if (data.sessionUsers === 1) {
                App.openToast("info", "someoneLeft", "youAreAlone");
                // Enable Map Selector back
                App.MAP_SELECTOR.prop("disabled", false);
                //hostOnlyTooltip.disable();
            } else {
                if (data.sessionUsers > this.wsActiveUsers) {
                    App.openToast("info", "someoneJoined", "");
                } else {
                    App.openToast("info", "someoneLeft", "");
                }
            }

            this.wsActiveUsers = data.sessionUsers;
            break;
        }


        /**********************************************************************/
        /*                       Handle the DELETE update                     */ 
        /**********************************************************************/

        case "DELETE_WEAPON": {
            App.minimap.activeWeaponsMarkers.eachLayer((weapon) => {
                if (weapon.uid === data.uid) {
                    weapon.delete(false);
                    console.debug(`Deleted weapon with UID: ${data.uid}`);
                }
            });
            break;
        }

        case "DELETE_TARGET": {
            App.minimap.activeTargetsMarkers.eachLayer((target) => {
                if (target.uid === data.uid) {
                    target.delete(false);
                    console.debug(`Deleted target with UID: ${data.uid}`);
                }
            });
            break;
        }

        case "DELETE_MARKER": {
            App.minimap.activeMarkers.eachLayer((marker) => {
                if (marker.uid === data.uid) {
                    marker.delete(false);
                    console.debug(`Deleted marker with UID: ${data.uid}`);
                }
            });
            break;
        }

        case "DELETE_ARROW": {
            App.minimap.activeArrows.forEach((arrow) => {
                if (arrow.uid === data.uid) {
                    arrow.removeArrow(false);
                    console.debug(`Deleted arrow with UID: ${data.uid}`);
                }
            });
            break;
        }


        /**********************************************************************/
        /*                       Handle the ADD updates                       */
        /**********************************************************************/

        case "ADDING_WEAPON": {
            console.debug("Received weapon: ", data.uid);
            App.minimap.createWeapon(new LatLng(data.lat, data.lng), data.uid);
            break;
        }

        case "ADDING_TARGET": {
            console.debug("Received target: ", data.uid);
            App.minimap.createTarget(new LatLng(data.lat, data.lng), false, data.uid);
            break;
        }

        case "ADDING_MARKER": {
            console.debug("Received marker: ", data.uid);
            App.minimap.createMarker(new LatLng(data.lat, data.lng), data.team, data.category, data.icon, data.uid);
            break;
        }

        case "ADDING_ARROW": {
            console.debug("Received marker: ", data.uid);
            new MapArrow(App.minimap, data.color, data.latlngs[0], data.latlngs[1], data.uid);
            break;
        }

        /**********************************************************************/
        /*                       Handle the UPDATE updates                    */
        /**********************************************************************/

        case "MOVING_WEAPON": {
            App.minimap.activeWeaponsMarkers.eachLayer((weapon) => {
                if (weapon.uid === data.uid) {
                    const simulatedEvent = { latlng: new LatLng(data.lat, data.lng), session: true };
                    weapon._handleDrag(simulatedEvent); // Call the drag handler to update position
                    App.minimap.updateTargets();
                    console.debug(`Updated position for weapon with UID: ${data.uid}`);
                }
            });
            break;
        }

        case "MOVING_TARGET": {
            App.minimap.activeTargetsMarkers.eachLayer((target) => {
                if (target.uid === data.uid) {
                    const simulatedEvent = { latlng: new LatLng(data.lat, data.lng) };
                    target._handleDrag(simulatedEvent); // Call the drag handler to update position
                    console.debug(`Moved target with UID: ${data.uid} to new position: (${data.lat}, ${data.lng})`);
                }
            });
            break;
        }

        case "MOVING_MARKER": {
            App.minimap.activeMarkers.eachLayer((marker) => {
                if (marker.uid === data.uid) {
                    const simulatedEvent = { latlng: new LatLng(data.lat, data.lng) };
                    marker._handleDrag(simulatedEvent);
                    console.debug(`Moved marker with UID: ${data.uid} to new position: (${data.lat}, ${data.lng})`);
                }
            });
            break;
        }

        /**********************************************************************/
        /*                                OTHERS                              */ 
        /**********************************************************************/

        case "UPDATE_MAP": {
            // Trigger a map change with a custom event to skip the update
            App.MAP_SELECTOR.val(data.activeMap).trigger($.Event("change", { broadcast: false }));
            break;
        }

        }

    }
}