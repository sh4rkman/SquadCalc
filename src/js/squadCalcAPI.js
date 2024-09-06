import packageInfo from "../../package.json";


export function sendMarkerData(markerData) {
    fetch(`${process.env.API_URL}/post/weapons`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'X-App-Version': packageInfo.version
        },
        body: JSON.stringify(markerData)
    })
    .then(response => {
        if (response.ok) {
            console.debug(`Marker data successfully sent to ${process.env.API_URL}`);
        } else {
            console.debug("HTTP error:", response.status);
        }
    })
    .catch(error => {
        console.debug("Error sending marker data:", error);
    });
}

export function sendTargetData(targetData) {
    fetch(`${process.env.API_URL}/post/targets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'X-App-Version': packageInfo.version
        },
        body: JSON.stringify(targetData)
    })
        .then(response => {
            if (response.ok) {
                console.debug(`Target data successfully sent to ${process.env.API_URL}`);
            } else {
                console.debug("HTTP error:", response.status);
            }
        })
        .catch(error => {
            console.debug("Error sending target data:", error);
        });
}


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
    }
};


//TBA
// export function fetchMarkersByMap(mapName, weapon) {
//     //var url = `${process.env.API_URL}/get/weapons?map=${encodeURIComponent(mapName)}&weapon=${encodeURIComponent(weapon)}`;
//     var url = `${process.env.API_URL}/get/targets?map=${encodeURIComponent(mapName)}`;

//     return fetch(url)
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             //console.debug(mapName + ' data successfully fetched', data);
//             return data;
//         })
//         .catch(error => {
//             //console.debug('Error fetching marker data:', error);
//             throw error;
//         });
// }