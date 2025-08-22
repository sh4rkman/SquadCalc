import { App } from "../app.js";

let prevCoorArray = "";
let isConnecting = false;
let socketMap = null;
let socketCoordinates = null;
let connectionInterval = null;

/**
 * Initializes WebSocket connections for map and coordinate data communication
 * Creates two WebSocket connections - one for map data and one for coordinates
 * Handles connection events and data transfer between client and SquadMortarOverlay.exe
 * @returns {Promise<void>} A promise that resolves when initialization is complete
 */
export async function initWebSocket() {
    if (process.env.WEBSOCKET != "true") { return; }
    if (isConnecting) return;
    startConnectionAttempts();
}

/**
 * Starts the connection attempt cycle
 */
function startConnectionAttempts() {
    if (!isConnecting) {
        isConnecting = true;
        cleanup();
        connectionInterval = setInterval(async () => {
            const isAvailable = await checkServerAvailability();
            if (isAvailable) {
                await setupWebSockets();
            }
        }, 5000);
    }
}

/**
 * Cleans up existing connections and intervals
 */
function cleanup() {
    if (socketMap) socketMap.close();
    if (socketCoordinates) socketCoordinates.close();
    if (connectionInterval) clearInterval(connectionInterval);
    socketMap = null;
    socketCoordinates = null;
}

/**
 * Sets up WebSocket connections and their event listeners
 */
async function setupWebSockets() {
    try {
        socketMap = new WebSocket("ws://127.0.0.1:12345");
        socketCoordinates = new WebSocket("ws://127.0.0.1:12346");

        setInterval(() => checkCoordinates(socketCoordinates), 1000);

        socketMap.addEventListener("open", () => {
            console.log("Connected to SquadMortarOverlay.exe");
            App.openToast("success", "connectedTo", "squadMortarOverlay");
            isConnecting = false;
            clearInterval(connectionInterval);

            // HD Maps are not compatible with squadmortaroverlay
            if ($(".btn-hd").hasClass("active")) {
                App.userSettings.highQualityImages = false;
                $(".btn-hd").removeClass("active");
                App.minimap.spin(false);
                App.minimap.changeLayer();
            }
            $(".btn-hd").prop("disabled", true);
        });

        socketMap.addEventListener("message", async (event) => {
            if (event.data === "Map") {
                if (socketMap.readyState === WebSocket.OPEN) {
                    socketMap.send(App.minimap.activeMap.name);
                }
            }

            if (event.data === "MapData") {
                let imageUrl = "maps" + App.minimap.activeMap.mapURL + "basemap.webp";
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

            if (event.data instanceof Blob) {
                const url = URL.createObjectURL(event.data);
                App.minimap.activeLayer.setUrl(url);
                App.openToast("success", "mapUpdated", "");
            }
        });

        // Add error and close event handlers for both sockets
        socketMap.addEventListener("close", handleDisconnect);
        socketMap.addEventListener("error", handleDisconnect);
        socketCoordinates.addEventListener("close", handleDisconnect);
        socketCoordinates.addEventListener("error", handleDisconnect);
    } catch (error) {
        handleDisconnect();
        console.debug("Error setting up WebSocket connections", error);
    }
}

/**
 * Handles WebSocket disconnection events
 */
function handleDisconnect() {
    $(".btn-hd").prop("disabled", false);
    startConnectionAttempts();
}

/**
 * Checks and sends updated coordinate information through WebSocket
 * Processes each target marker to extract bearing and elevation data
 * Formats the data as a string and sends it if changed from previous update
 * @param {WebSocket} socketCoordinates - WebSocket connection for sending coordinates
 */
function checkCoordinates(socketCoordinates) {
    let coorArray = "";
    if (App.minimap.activeTargetsMarkers) {
        App.minimap.activeTargetsMarkers.eachLayer(function (target) {
            const BEARING = target.firingSolution1.bearing;
            const DISTANCE = target.firingSolution1.distance;
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

            if (App.userSettings.showDistance) {
                coorArray = coorArray + ` | ${DISTANCE.toFixed(0)}m`;
            }
        });
    }
    if (coorArray != prevCoorArray) {
        prevCoorArray = coorArray;
        if (socketCoordinates && socketCoordinates.readyState === WebSocket.OPEN) {
            socketCoordinates.send(coorArray);
        }
    }
}

/**
 * Checks if the server is available
 * @param {number} [timeout=2000] - Timeout in milliseconds
 * @returns {Promise<boolean>} True if server is available, false otherwise
 */
async function checkServerAvailability(timeout = 2000) {
    // Using XMLHttpRequest instead of fetch to avoid console errors
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                resolve(xhr.status === 200);
            }
        };

        // Suppress error event
        xhr.onerror = () => {
            resolve(false);
        };

        xhr.ontimeout = () => {
            resolve(false);
        };

        try {
            xhr.open("GET", "http://127.0.0.1:12347/health", true);
            xhr.timeout = timeout;
            xhr.send();
        } catch (error) {
            console.debug("Error checking server availability", error);
            resolve(false);
        }
    });
}