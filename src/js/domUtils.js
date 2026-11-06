/**
 * Dispatch a native "change" event carrying a `broadcast` flag,
 * read by change handlers to decide whether to re-broadcast over the session WebSocket.
 * @param {Element} element
 * @param {boolean} broadcast
 */
export function triggerChange(element, broadcast) {
    element.dispatchEvent(Object.assign(new Event("change"), { broadcast }));
}
