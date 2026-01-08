import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);


// NEVER cache HTML documents
registerRoute(
    ({ request }) => request.mode === "navigate",
    new NetworkOnly()
);


// Cache map images for 30 days with StaleWhileRevalidate
registerRoute(
    ({ url }) => url.pathname.includes("/maps/") && url.pathname.endsWith(".webp"),
    new StaleWhileRevalidate ({
        cacheName: "map-images",
        plugins: [
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                purgeOnQuotaError: true,
            }),
        ],
    })
);

// Block all OTHER API requests from being cached
registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new NetworkOnly()
);



// registerRoute(
//     ({ url }) => url.pathname.includes("/maps/") && url.pathname.endsWith("heightmap.json"),
//     new StaleWhileRevalidate({
//         cacheName: "map-heightmap",
//         plugins: [
//             new ExpirationPlugin({
//                 maxEntries: 30,
//                 maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
//                 purgeOnQuotaError: true,
//             }),
//         ],
//     })
// );

// registerRoute(
//     ({ url }) => url.pathname.includes("/locales/") && url.pathname.endsWith(".json"),
//     new StaleWhileRevalidate({
//         cacheName: "locales",
//         plugins: [
//             new ExpirationPlugin({
//                 maxEntries: 30,
//                 maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
//                 purgeOnQuotaError: true,
//             }),
//         ],
//     })
// );