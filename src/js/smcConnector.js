import { App } from "../app.js";

/**
 * Initializes WebSocket connections for map and coordinate data communication
 * Creates two WebSocket connections - one for map data and one for coordinates
 * Handles connection events and data transfer between client and SquadMortarOverlay.exe
 * @returns {Promise<void>} A promise that resolves when initialization is complete
 */
export async function initWebSocket() {
    // Disable WebSockets if not activated
    if (process.env.WEBSOCKET != "true") { return; }
    while (!await checkServerAvailability()) {
        await sleep(5000);
    }
    console.debug("Trying to connect to SquadMortarOverlay");
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
                reader.onload = function () {
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
            App.openToast("success", "mapUpdated", "");
        }
    });
}

/**
 * Utility function to create a promise that resolves after specified milliseconds
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise<void>} A promise that resolves after the specified delay
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks and sends updated coordinate information through WebSocket
 * Processes each target marker to extract bearing and elevation data
 * Formats the data as a string and sends it if changed from previous update
 * @param {WebSocket} socketCoordinates - WebSocket connection for sending coordinates
 */
function checkCoordinates(socketCoordinates) {
    let coorArray = "";
    let prevCoorArray = "";
    if (App.minimap.activeTargetsMarkers) {
        App.minimap.activeTargetsMarkers.eachLayer(function (target) {
            const BEARING = target.firingSolution1.bearing;
            let elevation;
            if (App.minimap.activeWeaponsMarkers.getLayers()[0].angleType === "high") {
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
async function checkServerAvailability(timeout = 2000) {
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