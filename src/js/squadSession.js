
import { App } from "../app.js";
import { latLng } from "leaflet";
import  { MapArrow }  from "./squadMinimap.js";
import { hostOnlyTooltip } from "./tooltips.js";

export default class SquadSession {

    constructor(sessionId) {
        const WS_URL = process.env.API_URL.replace(/^http/, "ws");
        console.log(WS_URL+"/")
        this.ws = new WebSocket(WS_URL+"/");
        this.wsActiveUsers = 1;

        // WEB SOCKET EVENT HANDLERS
        this.ws.onopen = () => { this._open(sessionId); };
        this.ws.onclose = () => { this._close(); };
        this.ws.onmessage = (message) => { this._handleMessage(message); };
    }

    // Send JOIN_SESSION if sessionId exists, otherwise send CREATE_SESSION
    _open = (sessionId) => {
        const message = sessionId 
            ? { 
                type: 'JOIN_SESSION',
                sessionId,
                mapState: App.getAppState()
            }
            : { type: 'CREATE_SESSION',
                mapState: App.getAppState()
            };
        this.ws.send(JSON.stringify(message));
    }

    _close = () => {
            // Remove the session query parameter from the URL
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete('session'); // Remove the session parameter if it exists
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({}, '', newUrl); // Update the URL without reloading the page
            
            // Update UI
            $(".btn-session").removeClass("active");
            $("#sessionUsers").css('display', 'none');
            App.openToast('error', 'sessionClosed', '');

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
            App.MAP_SELECTOR.prop('disabled', false);
            hostOnlyTooltip.disable();
    }

    _handleMessage = (message) => {
        const data = JSON.parse(message.data);
            
        if (data.type === 'SESSION_CREATED') {
            console.debug('New Session created : ' + data.sessionId);
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('session', data.sessionId); // Add or update the session parameter
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({}, '', newUrl); // Update the URL without reloading the page
            App.openToast('success', 'sessionCreated', 'shareSession', true);
        }

        if (data.type === 'SESSION_JOINED') {
            console.debug('Successfully joined session: ' + data.sessionId);

            // $(".dropbtn2").val(data.mapState.activeWeapon);
            // $(".dropbtn2").trigger('change');

            // Disable Map Selector for participants


            // Update MAP
            console.debug("received map: ", data.mapState.activeMap);
            const customEvent = $.Event("change", {
                skipUpdate: true, 
            });
            App.MAP_SELECTOR.val(data.mapState.activeMap).trigger(customEvent);
            // Disable Map Selector for participants
            // App.MAP_SELECTOR.prop('disabled', true);
            // hostOnlyTooltip.enable();
            
            // Create every existing marker in the session
            data.mapState.weapons.forEach(weapon => {
                App.minimap.createWeapon(new latLng(weapon.lat, weapon.lng), weapon.uid);        
            });       
            data.mapState.targets.forEach(target => {
                App.minimap.createTarget(new latLng(target.lat, target.lng), false, target.uid);
            });
            data.mapState.markers.forEach(marker => {
                App.minimap.createMarker(new latLng(marker.lat, marker.lng), marker.team, marker.category, marker.icon, marker.uid);
            });
            data.mapState.arrows.forEach(arrow => {
                new MapArrow(App.minimap, arrow.color, arrow.latlngs[0], arrow.latlngs[1], arrow.uid);
            });



            // Update UI for joining the session
            App.openToast('success', 'sessionJoined', ``);
            $("#sessionUsers").html(data.sessionUsers);
            if (data.sessionUsers > 1) {
                $("#sessionUsers").css('display', 'flex');
            } else {
                $("#sessionUsers").css('display', 'none');
            }
            this.wsActiveUsers = data.sessionUsers;
        }

        if (data.type === 'SESSION_NOT_FOUND') {
            console.debug('Session not found');
            App.openToast('error', 'Session not found', data.sessionId);
        }

        if (data.type === 'ACTIVE_MEMBERS_UPDATED') {
            //console.debug("Old Session Users Count: ", this.wsActiveUsers);
            console.debug("New Session Users Count: ", data.sessionUsers);

            $("#sessionUsers").html(data.sessionUsers);
            if (data.sessionUsers > 1) {
                $("#sessionUsers").css('display', 'flex');
            } else {
                $("#sessionUsers").css('display', 'none');
            }

            // Only one left in the session
            if (data.sessionUsers === 1) {
                App.openToast('error', 'someoneLeft', `youAreAlone`);
                // Enable Map Selector back
                App.MAP_SELECTOR.prop('disabled', false);
                hostOnlyTooltip.disable();
            } else {
                if (data.sessionUsers > this.wsActiveUsers) {
                    App.openToast('success', 'someoneJoined', ``);
                } else {
                    App.openToast('error', 'someoneLeft', ``);
                }
            }

            this.wsActiveUsers = data.sessionUsers;
            
        }



        /**********************************************************************/
        /*                       Handle the DELETE update                     */ 
        /**********************************************************************/
        if (data.type === 'DELETE_WEAPON') {
            App.minimap.activeWeaponsMarkers.eachLayer((weapon) => {
                if (weapon.uid === data.uid) {
                    weapon.delete(false);
                    console.debug(`Deleted weapon with UID: ${data.uid}`);
                }
            });
        }
        if (data.type === 'DELETE_TARGET') {
            App.minimap.activeTargetsMarkers.eachLayer((target) => {
                if (target.uid === data.uid) {
                    target.delete(false);
                    console.debug(`Target with UID: ${data.uid} deleted.`);
                }
            });
        }
        if (data.type === 'DELETE_MARKER') {       
            App.minimap.activeMarkers.eachLayer((marker) => {
                if (marker.uid === data.uid) {
                    marker.delete(false); // Remove the marker
                    console.debug(`Marker with UID: ${data.uid} deleted.`);
                }
            });
        }
        if (data.type === 'DELETE_ARROW') {
            console.log("deleting arrow : ", data.uid);
            App.minimap.activeArrows.forEach((arrow) => {
                if (arrow.uid === data.uid) {
                    arrow.removeArrow(false); // Remove the marker
                    console.debug(`Arrows with UID: ${data.uid} deleted.`);
                }else
                {
                    console.log("Arrow not found : ", arrow.uid);
                }
            });
        }
        
        /**********************************************************************/
        /*                       Handle the ADD updates                       */ 
        /**********************************************************************/
        if (data.type === 'ADDING_WEAPON') {
            console.debug("Received weapon: ", data.uid);
            App.minimap.createWeapon(new L.latLng(data.lat, data.lng), data.uid);
        }
        if (data.type === 'ADDING_TARGET') {
            console.debug("Received target: ", data.uid);
            App.minimap.createTarget(new L.latLng(data.lat, data.lng), false, data.uid);
        }
        if (data.type === 'ADDING_MARKER') {
            console.debug("Received marker: ", data.uid);
            App.minimap.createMarker(new L.latLng(data.lat, data.lng), data.team, data.category, data.icon, data.uid);
        }
        if (data.type === 'ADDING_ARROW') {
            console.debug("Received marker: ", data.uid);
            new MapArrow(App.minimap, data.color, data.latlngs[0], data.latlngs[1], data.uid);
        }

        /**********************************************************************/
        /*                     Handle the POSITION updates                    */ 
        /**********************************************************************/
        if (data.type === 'MOVING_WEAPON') {         
            App.minimap.activeWeaponsMarkers.eachLayer((weapon) => {
                if (weapon.uid === data.uid) {
                    const simulatedEvent = { latlng: new L.LatLng(data.lat, data.lng) };
                    weapon._handleDrag(simulatedEvent);
                    App.minimap.updateTargets();
                    console.debug(`Updated position for weapon with UID: ${data.uid}`);
                }
            });
        }
        if (data.type === 'MOVING_TARGET') {
            App.minimap.activeTargetsMarkers.eachLayer((target) => {
                if (target.uid === data.uid) {
                    // Update the position of the target marker
                    const simulatedEvent = { latlng: new L.LatLng(data.lat, data.lng) };
                    target._handleDrag(simulatedEvent); // Call the drag handler to update position
                    console.debug(`Moved target with UID: ${data.uid} to new position: (${data.lat}, ${data.lng})`);
                }
            });
        }
        if (data.type === 'MOVING_MARKER') {
            App.minimap.activeMarkers.eachLayer((marker) => {
                if (marker.uid === data.uid) {
                    // Update the position of the marker
                    const simulatedEvent = { latlng: new L.LatLng(data.lat, data.lng) };
                    marker._handleDrag(simulatedEvent);
                    console.debug(`Moved marker with UID: ${data.uid} to new position: (${data.lat}, ${data.lng})`);
                }
            });
        }

        if (data.type === 'UPDATE_MAP') {
            const customEvent = $.Event("change", {
                skipUpdate: true, 
            });
            App.MAP_SELECTOR.val(data.activeMap).trigger(customEvent);
        }
        
    }

}