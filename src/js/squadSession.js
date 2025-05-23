
import { App } from "../app.js";
import { LatLng } from "leaflet";
import  { MapArrow, MapCircle, MapRectangle }  from "./squadShapes.js";
import { createSessionTooltips, leaveSessionTooltips } from "./tooltips.js";


export default class SquadSession {

    constructor(sessionId) {
        const WS_URL = process.env.API_URL.replace(/^http/, "ws");
        this.ws = new WebSocket(`${WS_URL}/`);
        this.wsActiveUsers = 1;
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
        App.updateUrlParams({ session: null });

        // Update UI
        $(".btn-session").removeClass("active");
        leaveSessionTooltips.disable();
        createSessionTooltips.enable();
        $("#sessionUsers").css("display", "none");

        // Open a toast message based on the close event

        if (event.code === 4001) {
            App.openToast("error", "sessionFull", "");
        }
        else if (event.code === 4002) {
            console.error("The provided session is invalid (6 characters minimum).");
            App.openToast("error", "invalidSession", "invalidSessionRules");
        }
        else if (event.code === 4003) {
            console.error("Your app version is outdated. Please update to the latest version.");
            App.openToast("error", "outdatedVersion", "pleaseupdate");
        }
        else {
            App.openToast("error", "sessionClosed", "");
        }

        // Reverse all targets created by other session member to default color
        App.minimap.activeTargetsMarkers.eachLayer((target) => {
            if (target.fromSession) {
                target.fromSession = false;
                target.spreadOptionsOn = { color: App.mainColor };
                target.hundredDamageCircleOn = { color: App.mainColor };
                target.twentyFiveDamageCircleOn  = { color: App.mainColor };
                target.updateIcon();
                target.updateSpread();
                target.updateDamageRadius();
            }
        });

        // Enable Map Selector back
        // App.MAP_SELECTOR.prop("disabled", false);
        // hostOnlyTooltip.disable();
    }

    _handleMessage(message) {
        const data = JSON.parse(message.data);
        
        switch (data.type) {

        case "SESSION_CREATED": {
            console.debug("New Session created : " + data.sessionId);
            $("#sessionUsers").html(1);
            $("#sessionUsers").css("display", "flex");
            App.updateUrlParams({ session: data.sessionId });
            App.openToast("success", "sessionCreated", "shareSession", true);
            break;
        }

        case "SESSION_JOINED": {
            console.debug("Successfully joined session: " + data.sessionId);

            // Update MAP with custom event to skip the broadcast
            App.MAP_SELECTOR.val(data.mapState.activeMap).trigger($.Event("change", { broadcast: false }));

            // Create every existing marker in the session

            // Wait for the heightmap to be loaded before creating the markers
            // Otherwise, the markers will be created with the default height of 0
            $(document).one("heightmap:loaded", () => {
                data.mapState.weapons.forEach(weapon => {
                    App.minimap.createWeapon(new LatLng(weapon.lat, weapon.lng), weapon.uid);        
                });
                data.mapState.targets.forEach(target => {
                    App.minimap.createTarget(new LatLng(target.lat, target.lng), false, target.uid);
                });
            });

            data.mapState.markers.forEach(marker => {
                App.minimap.createMarker(new LatLng(marker.lat, marker.lng), marker.team, marker.category, marker.icon, marker.uid);
            });
            data.mapState.arrows.forEach(arrow => {
                new MapArrow(App.minimap, arrow.color, arrow.latlngs[0], arrow.latlngs[1], arrow.uid);
            });
            data.mapState.circles.forEach(circle => {
                new MapCircle(App.minimap, circle.color, circle.latlng, circle.radius, circle.uid);
            });
            data.mapState.rectangles.forEach(rectangle => {
                new MapRectangle(App.minimap, rectangle.color, rectangle.bounds._southWest, rectangle.bounds._northEast, rectangle.uid);
            });

            // Update UI for joining the session
            App.openToast("success", "sessionJoined", "");

            // Show participants count
            $("#sessionUsers").html(data.sessionUsers);
            $("#sessionUsers").css("display", "flex");

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

            // Only one left in the session
            if (data.sessionUsers === 1) {
                App.openToast("info", "someoneLeft", "youAreAlone");
                // Enable Map Selector back
                // App.MAP_SELECTOR.prop("disabled", false);
                // hostOnlyTooltip.disable();
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
                    App.minimap.visualClick.triggerVisualClick(weapon.getLatLng(), "cyan");
                }
            });
            break;
        }
        case "DELETE_TARGET": {
            App.minimap.activeTargetsMarkers.eachLayer((target) => {
                if (target.uid === data.uid) {
                    target.delete(false);
                    App.minimap.visualClick.triggerVisualClick(target.getLatLng(), "cyan");
                }
            });
            break;
        }
        case "DELETE_MARKER": {
            App.minimap.activeMarkers.eachLayer((marker) => {
                if (marker.uid === data.uid) {
                    marker.delete(false);
                    App.minimap.visualClick.triggerVisualClick(marker.getLatLng(), "cyan");
                }
            });
            break;
        }
        case "DELETE_ARROW": {
            App.minimap.activeArrows.forEach((arrow) => {
                if (arrow.uid === data.uid) {
                    arrow.delete(false);
                }
            });
            break;
        }
        case "DELETE_CIRCLE": {
            App.minimap.activeCircles.forEach((circle) => {
                if (circle.uid === data.uid) {
                    circle.delete(false);
                }
            });
            break;
        }
        case "DELETE_RECTANGLE": {
            App.minimap.activeRectangles.forEach((rectangle) => {
                if (rectangle.uid === data.uid) {
                    rectangle.delete(false);
                }
            });
            break;
        }


        /**********************************************************************/
        /*                       Handle the ADD updates                       */
        /**********************************************************************/

        case "ADDING_WEAPON": {
            App.minimap.createWeapon(new LatLng(data.lat, data.lng), data.uid);
            App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
            break;
        }
        case "ADDING_TARGET": {
            App.minimap.createTarget(new LatLng(data.lat, data.lng), false, data.uid);
            App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
            break;
        }
        case "ADDING_MARKER": {
            App.minimap.createMarker(new LatLng(data.lat, data.lng), data.team, data.category, data.icon, data.uid);
            App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
            break;
        }
        case "ADDING_ARROW": {
            new MapArrow(App.minimap, data.color, data.latlngs[0], data.latlngs[1], data.uid);
            App.minimap.visualClick.triggerVisualClick(data.latlngs[0], "cyan");
            break;
        }
        case "ADDING_CIRCLE": {
            new MapCircle(App.minimap, data.color, data.latlng, data.radius, data.uid);
            App.minimap.visualClick.triggerVisualClick(data.latlng, "cyan");
            break;
        }
        case "ADDING_RECTANGLE": {
            console.log(data.bounds);
            new MapRectangle(App.minimap, data.color, data.bounds._northEast, data.bounds._southWest, data.uid);
            App.minimap.visualClick.triggerVisualClick(data.bounds._northEast, "cyan");
            break;
        }

        /**********************************************************************/
        /*                       Handle the UPDATE updates                    */
        /**********************************************************************/

        case "MOVING_WEAPON": {
            App.minimap.activeWeaponsMarkers.eachLayer((weapon) => {
                if (weapon.uid === data.uid) {
                    weapon._handleDrag({ latlng: new LatLng(data.lat, data.lng), session: true });
                    App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
                    App.minimap.updateTargets();
                }
            });
            break;
        }
        case "MOVING_TARGET": {
            App.minimap.activeTargetsMarkers.eachLayer((target) => {
                if (target.uid === data.uid) {
                    target._handleDrag({ latlng: new LatLng(data.lat, data.lng) });
                    App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
                } 
            });
            break;
        }
        case "MOVING_MARKER": {
            App.minimap.activeMarkers.eachLayer((marker) => {
                if (marker.uid === data.uid) {
                    marker._handleDrag({ latlng: new LatLng(data.lat, data.lng) });
                    App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
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

        case "PING": {
            App.minimap.visualClick.triggerVisualClick(data.latlng, "cyan");
            break;
        }

        }

    }
}