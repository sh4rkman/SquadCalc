import { App } from "../app.js";
import { createSessionTooltips, leaveSessionTooltips } from "./tooltips.js";
import SquadSession from "./squadSession.js";

/**
 * Sends weapon data to the API via a POST request.
 * @param {Object} markerData - The data object to be sent to the API.
 * @returns {Promise<void>} A promise that resolves if the data is successfully sent, or logs an error if not.
 * @throws {Error} Logs details of any network or HTTP errors encountered during the request.
 */
export function sendMarkerData(markerData) {
    fetch(`${process.env.API_URL}/post/weapons`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-App-Version": App.version
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
 * Sends FOB marker data to the API via a POST request.
 * @param {Object} markerData - The data object to be sent to the API.
 * @returns {Promise<void>} A promise that resolves if the data is successfully sent, or logs an error if not.
 * @throws {Error} Logs details of any network or HTTP errors encountered during the request.
 */
export function sendFOBData(FOBData) {
    fetch(`${process.env.API_URL}/post/fobs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-App-Version": App.version
        },
        body: JSON.stringify(FOBData)
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
            "X-App-Version": App.version
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
    try {
        const response = await fetch(`${process.env.API_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            if (data.status === "OK") {
                console.log(`Connected to ${process.env.API_URL}`);
                const urlParams = new URLSearchParams(window.location.search);
                const sessionId = urlParams.get("session");
                if (sessionId) {
                    $(".btn-session").addClass("active");
                    createSessionTooltips.disable();
                    leaveSessionTooltips.enable();
                    
                    // Wait for layer/layers to load before creating session
                    // This ensures layer data is included in the initial session state
                    if (urlParams.has("layer")) {
                        $(document).one("layer:loaded", () => {
                            App.session = new SquadSession(sessionId);
                        });
                    } else {
                        $(document).one("layers:loaded", () => {
                            App.session = new SquadSession(sessionId);
                        });
                    }
                }
            }
        } else {
            console.error("Not connected to SquadCalc API");
        }
    } catch (error) {
        console.error("Not connected to SquadCalc API");
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
            headers: { "X-App-Version": App.version },
        });
        
        if (!response.ok) { throw new Error("Network response was not ok"); }
        const data = await response.json();
        return data;

    } catch (error) {
        console.debug("Error fetching marker data:", error);
        throw error;
    }
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
        const response = await fetch(url, { headers: { "X-App-Version": App.version }, });
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
export async function fetchLayerByName(layerName, options = {}) {
    const url = `${process.env.API_URL}/get/layer?name=${encodeURIComponent(layerName)}`;
    const { signal } = options; 
    try {
        const response = await fetch(url, {
            headers: { "X-App-Version": App.version },
            signal
        });
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
export async function fetchUnitByName(unitName, options = {}) {
    const url = `${process.env.API_URL}/get/unit?name=${encodeURIComponent(unitName)}`;
    const { signal } = options;
    try {
        const response = await fetch(url, {
            headers: { "X-App-Version": App.version },
            signal
        });
        if (!response.ok) { throw new Error("Network response was not ok"); }
        const data = await response.json();
        return data;
    } catch (error) {
        console.debug("Error fetching Unit data:", error);
        throw error;
    }
}