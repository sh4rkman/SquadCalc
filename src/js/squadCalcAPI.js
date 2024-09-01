

export function sendMarkerData(markerData) {
    fetch(`${process.env.API_URL}/post/weapons`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(markerData)
    })
        .then(response => {
            if (response.ok) {
                console.debug("Marker data successfully sent.");
            } else {
                console.debug("HTTP error:", response.status);
            }
        })
        .catch(error => {
            console.debug("Error sending marker data:", error);
        });
}

// TBA
// export function fetchMarkersByMap(mapName) {
//     var url = `${process.env.API_URL}/get/weapons?map=${encodeURIComponent(mapName)}`;
//     //console.debug("Trying to fetch " + url);
    
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