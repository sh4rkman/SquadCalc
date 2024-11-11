import packageInfo from "../../package.json";
import { App } from "../app.js";


/**
 * Sends marker data to the API via a POST request.
 * @param {Object} markerData - The data object to be sent to the API.
 * @returns {Promise<void>} A promise that resolves if the data is successfully sent, or logs an error if not.
 * @throws {Error} Logs details of any network or HTTP errors encountered during the request.
 */
export function sendMarkerData(markerData) {
    fetch(`${process.env.API_URL}/post/weapons`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-App-Version": packageInfo.version
        },
        body: JSON.stringify(markerData)
    }).then(response => {
        if (!response.ok) {
            console.debug("HTTP error:", response.status);
        }
    }).catch(error => {
        console.debug("Error sending marker data:", error);
    });
}

/**
 * Sends target data to the API via a POST request.
 * @param {Object} targetData - The data object to be sent to the API.
 * @returns {Promise<void>} A promise that resolves if the data is successfully sent, or logs an error if not.
 */
export function sendTargetData(targetData) {
    fetch(`${process.env.API_URL}/post/targets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-App-Version": packageInfo.version
        },
        body: JSON.stringify(targetData)
    })
        .then(response => {
            if (!response.ok) {
                console.debug("HTTP error:", response.status);
            }
        })
        .catch(error => {
            console.debug("Error sending target data:", error);
        });
}


/**
 * Checks the health of the API by sending a request to the `/health` endpoint.
 * @returns {Promise<void>} A promise that resolves if the API is healthy, or logs an error if not.
 * @throws Will log an error if the network request fails or if the API response is not OK.
 */
export const checkApiHealth = async () => {
    if(!process.env.API_URL) { return; }
    try {
        const response = await fetch(`${process.env.API_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            if (data.status === "OK") {
                console.log(`Connected to ${process.env.API_URL}`);
            }
        } else {
            console.error(`Not connected to ${process.env.API_URL}`);
        }
    } catch (error) {
        console.error(`Not connected to ${process.env.API_URL}`);
        console.debug(error);
    }
};


/**
 * Fetches marker data for a specific map and weapon from the API.
 * @param {string} mapName - The name of the map to fetch marker data for.
 * @param {string} weapon - The weapon to filter the marker data by.
 * @returns {Promise<Object>} A promise that resolves with the fetched marker data in JSON format.
 * @throws {Error} Throws an error if the network request fails or the response is not OK.
 */
export async function fetchMarkersByMap(mapName, weapon) {
    const url = `${process.env.API_URL}/get/weapons?map=${encodeURIComponent(mapName)}&weapon=${encodeURIComponent(weapon)}`;

    try {

        const response = await fetch(url, {
            headers: { "X-App-Version": packageInfo.version },
        });
        
        if (!response.ok) { throw new Error("Network response was not ok"); }
        const data = await response.json();
        return data;

    } catch (error) {
        console.debug("Error fetching marker data:", error);
        throw error;
    }
}



export async function initWebSocket() {

    // Disable WebSockets if not activated
    if (process.env.WEBSOCKET != "true") { return; }
    if (!await checkServerAvailability()) { return; }

    const socketMap = new WebSocket("ws://127.0.0.1:12345");
    const socketCoordinates = new WebSocket("ws://127.0.0.1:12346");
    setInterval(() => checkCoordinates(socketCoordinates), 1000);
    
    socketMap.addEventListener("open", () => {
        console.log("Connected to SquadMortarOverlay.exe");
        App.openToast("success", "connectedTo", "squadMortarOverlay");
    });
    
    socketMap.addEventListener("message", async (event) => {
        if (event.data === "Map") {
            if (socketMap.readyState === WebSocket.OPEN) {
                let imageUrl = "maps" + App.minimap.activeMap.mapURL + "basemap.webp";
                // Fetch the image and send its binary data
                const response = await fetch(imageUrl);
                const imageBlob = await response.blob();
                const reader = new FileReader();
                reader.onload = function() {
                    const arrayBuffer = this.result;
                    socketMap.send(arrayBuffer);
                };
                reader.readAsArrayBuffer(imageBlob);
                App.minimap.changeLayer();
            }
        }
    });
    
    socketMap.addEventListener("message", (event) => {
        if (event.data instanceof Blob) {
            const url = URL.createObjectURL(event.data);
            App.minimap.activeLayer.setUrl(url);
            const notification = document.createElement("div");
            notification.innerText = "Map Updated!";
            notification.style.position = "fixed";
            notification.style.top = "15px";
            notification.style.left = "50%";
            notification.style.transform = "translateX(-50%)";
            notification.style.backgroundColor = "green";
            notification.style.padding = "10px";
            notification.style.borderRadius = "5px";
            notification.style.zIndex = "1000";
            notification.style.opacity = "0";
            notification.style.transition = "opacity 0.5s";
            document.body.appendChild(notification);
            
            // Fade in
            setTimeout(() => {
                notification.style.opacity = "1";
            }, 10); // Delay to ensure the element is rendered before starting the fade-in
            
            // Fade out after 3 seconds
            setTimeout(() => {
                notification.style.opacity = "0";
                // Remove the notification after fade out
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500); // Match the duration of the opacity transition
            }, 2500);
        }
    });
}


function checkCoordinates(socketCoordinates) {
    let coorArray = "";
    let prevCoorArray = "";
    if (App.minimap.activeTargetsMarkers) {
        App.minimap.activeTargetsMarkers.eachLayer(function (target) {
            const BEARING = target.firingSolution1.bearing;
            let elevation;
            if (App.minimap.activeWeaponsMarkers.getLayers()[0].angleType === "high"){
                elevation = target.firingSolution1.elevation.high;
            }
            else {
                elevation = target.firingSolution1.elevation.low;
            }

            if (isNaN(elevation)) {
                elevation = "---";
            } else {
                if (App.activeWeapon.unit === "mil") {
                    elevation = elevation.mil.toFixed(0);
                } else {
                    elevation = elevation.deg.toFixed(1);
                }
            }
            if (coorArray !== "") {
                coorArray = coorArray + "\n";
            }
            coorArray = coorArray + `${elevation} | ${BEARING.toFixed(1)}°`;
        });
    }
    if (coorArray !== prevCoorArray) {
        prevCoorArray = coorArray;
        if (socketCoordinates.readyState === WebSocket.OPEN) {
            socketCoordinates.send(coorArray);
        }
    }
}

/**
 * Checks the availability of a SquadMortarOverlay.exe by attempting to load a fake image from it
 * @param {number} [timeout] - The maximum time to wait for response
 * @returns {Promise<boolean>} A promise that resolves to `true` if the SquadMortarOverlay.exe is running
 */
function checkServerAvailability(timeout = 2000) {
    return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => {
            img.src = "";
            resolve(false);
        }, timeout);

        img.onload = img.onerror = () => {
            clearTimeout(timer);
            resolve(true);
        };
        
        img.src = "http://127.0.0.1:12345";
    });
}


/**
 * xxxxxxxxxxxxxxxxxxxxxx
 * @param {string} mapName - The name of the map to fetch layers data for.
 * @returns {Promise<Object>} A promise that resolves with the fetched marker data in JSON format.
 * @throws {Error} Throws an error if the network request fails or the response is not OK.
 */
export async function fetchLayersByMap(mapName) {
    const url = `${process.env.API_URL}/get/layers?map=${encodeURIComponent(mapName)}`;
    try {
        const response = await fetch(url, { headers: { "X-App-Version": packageInfo.version }, });
        if (!response.ok) { throw new Error("Network response was not ok"); }
        const data = await response.json();
        return data;
    } catch (error) {
        console.debug("Error fetching layers data:", error);
        throw error;
    }
}

/**
 * xxxxxxxxxxxxxxxxxxxxxx
 * @param {string} mapName - The name of the map to fetch layers data for.
 * @returns {Promise<Object>} A promise that resolves with the fetched marker data in JSON format.
 * @throws {Error} Throws an error if the network request fails or the response is not OK.
 */
export async function fetchLayerByName(layerName) {
    const url = `${process.env.API_URL}/get/layer?name=${encodeURIComponent(layerName)}`;
    try {
        const response = await fetch(url, { headers: { "X-App-Version": packageInfo.version }, });
        if (!response.ok) { throw new Error("Network response was not ok"); }
        const data = await response.json();
        return data;
    } catch (error) {
        console.debug("Error fetching layers data:", error);
        throw error;
    }
}