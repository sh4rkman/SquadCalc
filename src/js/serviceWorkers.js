


export function registerServiceWorkers(){

    if ("serviceWorker" in navigator) {
        try {
            navigator.serviceWorker.register("sw.js");
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
}
    
