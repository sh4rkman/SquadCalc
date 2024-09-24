import packageInfo from "../../package.json";


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
export function fetchMarkersByMap(mapName, weapon) {
    var url = `${process.env.API_URL}/get/weapons?map=${encodeURIComponent(mapName)}&weapon=${encodeURIComponent(weapon)}`;

    return fetch(url, {
        headers: { "X-App-Version": packageInfo.version },
    }).then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    }).then(data => {
        console.debug(`${mapName} data successfully fetched`);
        return data;
    }).catch(error => {
        console.debug("Error fetching marker data:", error);
        throw error;
    });
}