
import { App } from "../app.js";
import { LatLng } from "leaflet";
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
        $("#sessionActions").css("display", "none");

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
            $(".btn-session-users").html(1);
            $("#sessionActions").css("display", "flex");
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
                    App.minimap.createWeapon(new LatLng(weapon.lat, weapon.lng), weapon.uid, weapon.heightPadding);        
                });
                data.mapState.targets.forEach(target => {
                    App.minimap.createTarget(new LatLng(target.lat, target.lng), false, target.uid);
                });
            });

            if (App.minimap.layer) App.minimap.layer._resetLayer();

            $(document).one("layers:loaded", () => {
                App.LAYER_SELECTOR.val(data.mapState.activeLayer).trigger($.Event("change", { broadcast: false }));
                
                $(document).one("layer:loaded", () => {
                    App.minimap.layer._resetLayer();

                    console.debug("Clicking flags for session: ");  
                    data.mapState.selectedFlags.forEach(flag => {
                        console.debug("  looking for flag: ", flag);
                        App.minimap.layer.flags.forEach((layerFlag) => {
                            if (layerFlag.objectName === flag) {
                                if (layerFlag.isSelected) return;
                                console.debug("found, clicking it now");
                                App.minimap.layer._handleFlagClick(layerFlag, false);
                                return;
                            }
                        });
                    });

                    data.mapState.hexs.forEach(sessionHex => {
                        App.minimap.layer.hexs.forEach((layerHex) => {
                            if (sessionHex.number === layerHex._hexNumber) {
                                layerHex.setStyle({
                                    color: layerHex.COLORS[sessionHex.colorIndex],
                                    fillColor: layerHex.COLORS[sessionHex.colorIndex],
                                });
                                layerHex._colorIndex = sessionHex.colorIndex;
                                return;
                            }
                        });
                    });

                    // Load Factions and Units
                    if (!data.mapState.teams || data.mapState.teams.length === 0) return;

                    App.FACTION1_SELECTOR.val(data.mapState.teams[0][0]).trigger($.Event("change", { broadcast: false }));
                    App.FACTION2_SELECTOR.val(data.mapState.teams[1][0]).trigger($.Event("change", { broadcast: false }));
                    App.UNIT1_SELECTOR.val(data.mapState.teams[0][1]).trigger($.Event("change", { broadcast: false }));
                    App.UNIT2_SELECTOR.val(data.mapState.teams[1][1]).trigger($.Event("change", { broadcast: false }));
                });
            });

            // Update UI for joining the session
            App.openToast("success", "sessionJoined", "");

            // Show participants count
            $(".btn-session-users").html(data.sessionUsers);
            $("#sessionActions").css("display", "flex");

            this.wsActiveUsers = data.sessionUsers;
            break;
        }

        case "UPDATE_HEXAGON": {
            console.debug("new hex color !", data);
            App.minimap.layer?.hexs?.forEach((hex) => {
                if (hex._hexNumber === data.number) {
                    hex._cycleColor(null, false);
                    App.minimap.visualClick.triggerVisualClick(hex.getCenter(), "cyan");
                }
            });

            break;
        }

        case "SESSION_NOT_FOUND": {
            console.debug("Session not found");
            App.openToast("error", "Session not found", data.sessionId);
            break;
        }

        case "ACTIVE_MEMBERS_UPDATED": {
            console.debug("New Session Users Count: ", data.sessionUsers);
            $(".btn-session-users").html(data.sessionUsers);

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
        
        /**********************************************************************/
        /*                       Handle the ADD updates                       */
        /**********************************************************************/

        case "ADDING_WEAPON": {
            App.minimap.createWeapon(new LatLng(data.lat, data.lng), data.uid, data.heightPadding);
            App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
            break;
        }
        case "ADDING_TARGET": {
            App.minimap.createTarget(new LatLng(data.lat, data.lng), false, data.uid);
            App.minimap.visualClick.triggerVisualClick(new LatLng(data.lat, data.lng), "cyan");
            break;
        }

        /**********************************************************************/
        /*                       Handle the UPDATE updates                    */
        /**********************************************************************/

        case "MOVING_WEAPON": {
            App.minimap.activeWeaponsMarkers.eachLayer((weapon) => {
                if (weapon.uid === data.uid) {
                    weapon._handleDrag({ latlng: new LatLng(data.lat, data.lng), session: true });
                    weapon.heightPadding = data.heightPadding;
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

        /**********************************************************************/
        /*                                OTHERS                              */ 
        /**********************************************************************/

        case "UPDATE_FACTION": {
            console.debug("Received new faction: ", data.faction);
            // if (data.teamIndex === 0) {
            //     App.FACTION1_SELECTOR.val(data.faction).trigger($.Event("change", { broadcast: false }));
            // } else if (data.teamIndex === 1) {
            //     App.FACTION2_SELECTOR.val(data.faction).trigger($.Event("change", { broadcast: false }));
            // }
            break;
        }


        case "UPDATE_UNIT": {
            console.debug("Received new unit: ", data.faction);
            // if (data.teamIndex === 0) {
            //     App.minimap.layer.factions.UNIT1_SELECTOR.val(data.faction).trigger($.Event("change", { broadcast: false }));
            // } else if (data.teamIndex === 1) {
            //     App.minimap.layer.factions.UNIT2_SELECTOR.val(data.faction).trigger($.Event("change", { broadcast: false }));
            // }
            break;
        }

        // Trigger a map change with a custom event to skip the update
        case "UPDATE_MAP": {
            App.MAP_SELECTOR.val(data.activeMap).trigger($.Event("change", { broadcast: false }));
            break;
        }

        case "CLICK_LAYER": {
            if (!App.minimap.layer) return;
            App.minimap.layer.flags.forEach((flag) => {
                if (flag.objectName === data.flag) {
                    App.minimap.layer._handleFlagClick(flag, false);
                    return;
                }
            });
            break;
        }

        // Trigger a layer change with a custom event to skip the update
        case "UPDATE_LAYER": {
            App.LAYER_SELECTOR.val(data.layer).trigger($.Event("change", { broadcast: false }));
            break;
        }

        case "PING": {
            App.minimap.visualClick.triggerVisualClick(data.latlng, "cyan");
            break;
        }

        }

    }
}