import i18next from "i18next";
import { App } from "../app.js";
import { MAPS } from "../data/maps.js";
import { activeServerBrowserTooltips } from "./tooltips.js";
import Fuse from "fuse.js";

export default class SquadServersBrowser {

    constructor() {
        this.serversData = null;
        this.filteredData = null;
        this.syncInterval = null;
        this.selectedServer = null;
        this.selectedLayer = null;
        this.refreshInterval = 20; // seconds
        this.favorites = this.loadFavorites();
    }

    init(){
        this.loadServersInfo();
    }


    /**
     * Syncs the selected server's state:
     * - Updates `selectedLayer` if the server's current map changes
     * - Switches map, layer, factions, and units to match the server
     */
    async syncWithServer(){

        if (!this.selectedServer) return;
        this.getServers();
        if (!this.serversData) return;

        this.serversData.forEach(server => {
            if (server.id == this.selectedServer) {
                let playTime = this.toMinSec(server.attributes.details.squad_playTime);
                console.debug(`${server.attributes.name} - ${server.attributes.details.map} - playtime : ${playTime}`);
                if (server.attributes.details.map != this.selectedLayer) {
                    console.debug(`  LAYER CHANGED FROM ${this.selectedLayer} to ${server.attributes.details.map}`);
                    this.selectedLayer = server.attributes.details.map;
                    this.switchLayer(
                        server.attributes.name,
                        server.mapName,
                        server.attributes.details.map,
                        server.team1,
                        server.team2,
                        server.attributes.details.squad_teamOne,
                        server.attributes.details.squad_teamTwo
                    );
                }
            }
        });
    }


    /**
     * Fetches the list of servers from the API and stores it in `this.serversData`.
     */
    async getServers() {
        try {
            const response = await fetch(`${process.env.API_URL}/get/servers`);
            const data = await response.json();
            this.serversData = data.servers;

            // Initiate fuse index
            this.fuse = new Fuse(this.serversData, {
                includeScore: true,
                threshold: 0.4,
                distance: 500,
                //minMatchCharLength: 3,
                keys: ["attributes.name", "attributes.details.map"]
            });

        } catch (error) {
            console.error("Error fetching server data:", error);
            //serversList.innerHTML = `<p data-i18n="common:errorLoading">${i18next.t("loadingServers", { ns: "common" })}</p>`;
        }
    }


    /**
     * Initial Loads the server and renders the full servers table.
     */
    async loadServersInfo() {
        const serversList = document.getElementById("serversList");
        serversList.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>${i18next.t("loadingServers", { ns: "common" })}</p>
            </div>
        `;
        await this.getServers();
        this.renderTable(this.serversData);
    }


    /**
     * Refreshes the server table:
     * - Shows a loading message
     * - Fetches the latest server data
     * - Applies the current search filter
     */
    async refreshRows() {
        const tbody = document.getElementById("serversTableBody");
        const searchInput = document.getElementById("serverSearch");
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <p>${i18next.t("loadingServers", { ns: "common" })}</p>
                </td>
            </tr>
        `;
        await this.getServers();
        this.filterServers(searchInput.value);
    }


    /**
     * Filters servers by name or map and updates the table.
     * Uses Fuse.js for fuzzy matching, so typos like "YEORIVKA" will match "YEHORIVKA".
     * @param {string} query
     */
    filterServers(query) {
        if (!query.trim()) {
            this.filteredData = this.serversData;
            this.renderRows(this.filteredData);
            return;
        }

        if (!this.fuse) return;

        const results = this.fuse.search(query);
        this.filteredData = results.map(r => r.item);
        this.renderRows(this.filteredData);
    }


    /**
     * Loads favorites from persistent storage.
     * @returns {Set} Set of favorite server IDs
     */
    loadFavorites() {
        try {
            const stored = localStorage.getItem("favoriteServers");
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.warn("Could not load favorites:", error);
            return new Set();
        }
    }


    /**
     * Returns the star icon HTML for the favorite button.
     * @param {string|number} serverId
     * @returns {string}
     */
    getFavoriteStarHTML(serverId) {
        const isFav = this.isFavorite(serverId);
        return `
            <button class="favorite-btn ${isFav ? "favorited" : ""}" data-serverid="${serverId}" title="${isFav ? "Remove from favorites" : "Add to favorites"}">
                <svg class="star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20">
                    <path d="M341.5 45.1C337.4 37.1 329.1 32 320.1 32C311.1 32 302.8 37.1 298.7 45.1L225.1 189.3L65.2 214.7C56.3 216.1 48.9 222.4 46.1 231C43.3 239.6 45.6 249 51.9 255.4L166.3 369.9L141.1 529.8C139.7 538.7 143.4 547.7 150.7 553C158 558.3 167.6 559.1 175.7 555L320.1 481.6L464.4 555C472.4 559.1 482.1 558.3 489.4 553C496.7 547.7 500.4 538.8 499 529.8L473.7 369.9L588.1 255.4C594.5 249 596.7 239.6 593.9 231C591.1 222.4 583.8 216.1 574.8 214.7L415 189.3L341.5 45.1z"/>
                </svg>
            </button>
        `;
    }


    /**
     * Toggles a server as favorite and updates storage.
     * @param {string|number} serverId
     */
    toggleFavorite(serverId) {
        if (this.favorites.has(serverId)) {
            this.favorites.delete(serverId);
        } else {
            this.favorites.add(serverId);
        }
        this.saveFavorites();
    }


    /**
     * Saves favorites to persistent storage.
     */
    saveFavorites() {
        try {
            localStorage.setItem("favoriteServers", JSON.stringify([...this.favorites]));
        } catch (error) {
            console.warn("Could not save favorites to localStorage:", error);
        }
    }


    /**
     * Handles favorite button clicks without triggering row selection.
     * @param {Event} event
     */
    handleFavoriteClick(event) {
        event.stopPropagation();
        const btn = event.target.closest(".favorite-btn");
        if (!btn) return;

        const serverId = btn.dataset.serverid;
        this.toggleFavorite(serverId);
        
        // Update the button appearance
        btn.classList.toggle("favorited");
        const path = btn.querySelector(".star-icon path");
        const isFav = btn.classList.contains("favorited");
        path.setAttribute("fill", isFav ? "currentColor" : "none");
    }


    /**
     * Checks if a server is favorited.
     * @param {string|number} serverId
     * @returns {boolean}
     */
    isFavorite(serverId) {
        return this.favorites.has(serverId);
    }



    /**
     * Returns the HTML for the server's next layer (or "Map Voting" if unavailable).
     * @param {object} server
     * @returns {string}
     */
    getNextLayerHTML(server){
        if (server.attributes.details.squad_nextLayer) {
            return `
                <span class="nextMap" data-i18n="common:next">
                    ${i18next.t("next", { ns: "common" })}: ${server.attributes.details.squad_nextLayer}
                </span>
                `;
        } 
        return "<span class=\"nextMap\">Map Voting</span>";
    }


    /**
     * Returns the flag icon HTML for a team, or "-" if none.
     * @param {string|null} team
     * @param {string} label
     * @returns {string}
     */
    getTeamHTML(team, label) {
        if (team) {
            return `<img title="${label}" src="/img/flags/${team}.webp" alt="${team}" class="flag-icon">`;
        } else {
            return "-";
        }
    }


    /**
     * Renders table rows for the given servers list.
     * @param {Array} servers
     */
    renderRows(servers){
        const tbody = document.getElementById("serversTableBody");
        let rows = "";
        
        if (servers && servers.length > 0) {
            // Sort favorites to top
            const sortedServers = [...servers].sort((a, b) => {
                const aIsFav = this.isFavorite(a.id) ? 1 : 0;
                const bIsFav = this.isFavorite(b.id) ? 1 : 0;
                return bIsFav - aIsFav; // Favorites first
            });
            
            sortedServers.forEach(server => {
                const isSelected = server.id == this.selectedServer ? "selected" : "";
                const unavailable = (!server.team1 || !server.team2 || !server.mapName) ? "unavailable" : "";
                const favoriteStarHTML = this.getFavoriteStarHTML(server.id);
                const nextLayer = this.getNextLayerHTML(server);
                rows += `
                    <tr class="${isSelected} ${unavailable}"
                        data-servername="${server.attributes.name}"
                        data-serverid="${server.id}"
                        data-layer="${server.attributes.details.map}"
                        data-map="${server.mapName}" 
                        data-team1="${server.team1}"
                        data-team2="${server.team2}"
                        data-unit1="${server.attributes.details.squad_teamOne || ""}"
                        data-unit2="${server.attributes.details.squad_teamTwo || ""}">
                        <td class="favoriteCell">${favoriteStarHTML}</td>
                        <td title="${server.attributes.name}">${server.attributes.name}</td>
                        <td class="mapdata">
                            ${server.attributes.details.map}<br>
                            ${nextLayer}
                        </td>
                        <td class="teamFlags">${this.getTeamHTML(server.team1, server.attributes.details.squad_teamOne)}</td>
                        <td class="teamFlags">${this.getTeamHTML(server.team2, server.attributes.details.squad_teamTwo)}</td>
                    </tr>
                `;
            });
        } else {
            rows = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        ${i18next.t("noServersFound", { ns: "common" })}
                    </td>
                </tr>
                `;
        }
        tbody.innerHTML = rows;
    }


    /**
     * Generates the HTML structure for the server table, search input, and buttons.
     * @returns {string} The full HTML markup for the servers list.
     */
    generateTableHTML() {
        return `
            <div class="container animate__animated animate__fadeIn">
                <div class="search-container">
                    <div class="search-wrapper">
                        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input 
                            type="text" 
                            class="search-input" 
                            data-i18n-placeholder="common:searchServerPlaceholder"
                            placeholder="${i18next.t("searchServerPlaceholder", { ns: "common" })}"
                            id="serverSearch"
                        />
                    </div>
                    <button class="searchBtn refresh-btn" id="refreshBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                        </svg>
                    </button>
                    <button class="searchBtn info-btn" id="">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M224 224C224 171 267 128 320 128C373 128 416 171 416 224C416 266.7 388.1 302.9 349.5 315.4C321.1 324.6 288 350.7 288 392L288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416L352 392C352 390.3 352.6 387.9 355.5 384.7C358.5 381.4 363.4 378.2 369.2 376.3C433.5 355.6 480 295.3 480 224C480 135.6 408.4 64 320 64C231.6 64 160 135.6 160 224C160 241.7 174.3 256 192 256C209.7 256 224 241.7 224 224zM320 576C342.1 576 360 558.1 360 536C360 513.9 342.1 496 320 496C297.9 496 280 513.9 280 536C280 558.1 297.9 576 320 576z"/></svg>
                    </button>
                </div>
            </div>

            <div id="tableContainer" class="animate__animated animate__fadeIn">
                <table class="servers-table">
                    <thead>
                        <tr>
                            <th class="favoriteHeader"></th>
                            <th class="sortable" data-sort="name" data-i18n="common:serverName">
                                ${i18next.t("serverName", { ns: "common" })} <span class="sort-indicator">⇅</span>
                            </th>
                            <th class="sortable" data-sort="map" data-i18n="common:currentMap">
                                ${i18next.t("currentMap", { ns: "common" })} <span class="sort-indicator">⇅</span>
                            </th>
                            <th class="teamFlags" data-i18n="common:team1">${i18next.t("team1", { ns: "common" })}</th>
                            <th class="teamFlags" data-i18n="common:team2">${i18next.t("team2", { ns: "common" })}</th>
                        </tr>
                    </thead>
                    <tbody id="serversTableBody"></tbody>
                </table>
            </div>
            <div id="battlemetrics">
                <a href="https://www.battlemetrics.com/servers/squad" target="_blank">
                    Powered by <span id="battle">BATTLE</span>METRICS.com
                </a>
            </div>
        `;
    }


    /**
     * Handles click events on a server table row:
     * - Selects or unselects the row
     * - Updates the active server and layer
     * - Starts or stops automatic syncing
     * - Switches the map/layer/factions/units to match the selected server
     * @param {jQuery<HTMLElement>} row - The clicked table row as a jQuery object.
     */
    handleRowClicks(row, event) {

        // Ignore clicks on header rows
        if (row.closest("thead").length) return;

        // Ignore clicks on favorite button - check the actual clicked element
        const clickedElement = $(event.target);
        if (clickedElement.closest(".favorite-btn").length) return;

        // --- UNSELECT ---
        if (row.hasClass("selected")) {
            row.removeClass("selected");
            $("#servers").removeClass("active");
            this.selectedServer = null;
            activeServerBrowserTooltips.disable();
            // stop sync
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
            return;
        }

        // --- SELECT ---
        $(".servers-table tr").removeClass("selected");
        row.addClass("selected");
        $("#servers").addClass("active");

        this.selectedServer = row.data("serverid");
        this.selectedLayer = row.data("layer");

        // start sync every X seconds
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => this.syncWithServer(), this.refreshInterval * 1000);

        // switch layer immediately
        this.switchLayer(
            row.data("servername"),
            row.data("map"),
            row.data("layer"),
            row.data("team1"),
            row.data("team2"),
            row.data("unit1"),
            row.data("unit2")
        );
    }



    /**
     * Renders the full servers table with search, refresh, info buttons, and event listeners.
     * @param {Array} servers - The array of server objects to display.
     */
    renderTable(servers) {
        const serversList = document.getElementById("serversList");

        // Load the HTML Table
        serversList.innerHTML = this.generateTableHTML();

        // Rows Click Handler
        $(".servers-table").on("click", "tr", (event) => {
            this.handleRowClicks($(event.currentTarget), event);
        });

        // Favorite button click handler - use event delegation on the table
        $(".servers-table").on("click", ".favorite-btn", (event) => {
            event.stopPropagation();
            this.handleFavoriteClick(event);
        });

        // Search input listener
        const searchInput = document.getElementById("serverSearch");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.filterServers(e.target.value);
            });
        }

        // Refresh Button listener
        const refreshBtn = document.getElementById("refreshBtn");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                this.refreshRows();
            });
        }

        // Sortable headers
        const sortableHeaders = serversList.querySelectorAll("th[data-sort]");
        sortableHeaders.forEach(header => {
            header.addEventListener("click", () => {
                const column = header.getAttribute("data-sort");

                // Get sort direction ("asc" or "desc")
                const direction = this.sortTable(column);

                // Reset all headers
                sortableHeaders.forEach(h => {
                    h.classList.remove("sorted");
                    const indicator = h.querySelector(".sort-indicator");
                    if (indicator) indicator.textContent = "⇅";
                });

                // Apply style + arrow to clicked header
                header.classList.add("sorted");
                const indicator = header.querySelector(".sort-indicator");

                if (indicator) {
                    indicator.textContent = direction === "asc" ? "▲" : "▼";
                }
            });
        });

        this.renderRows(servers);

        // Focus search input at the end
        if (searchInput) searchInput.focus();
        
    }


    /**
     * Switches the map, layer, factions, and units to match the selected server.
     * @param {string} serverName
     * @param {string} mapName
     * @param {number} layerIndex
     * @param {string} team1
     * @param {string} team2
     * @param {string} unit1
     * @param {string} unit2
     */
    switchLayer(serverName, mapName, layerIndex, team1, team2, unit1, unit2){
        
        if (!mapName || !serverName || !layerIndex) return;

        const mapIndex = MAPS.findIndex(m => m.name.toLowerCase() === mapName.toLowerCase());
        App.MAP_SELECTOR.val(mapIndex).trigger($.Event("change", { broadcast: true }));

        $(document).one("layers:loaded", () => {
            App.LAYER_SELECTOR.val(layerIndex).trigger($.Event("change", { broadcast: true }));
            $(document).one("layer:loaded", () => {
                if (team1 && team2) {
                    App.FACTION1_SELECTOR.val(team1).trigger($.Event("change", { broadcast: true }));
                    App.FACTION2_SELECTOR.val(team2).trigger($.Event("change", { broadcast: true }));
                    if (unit1 && unit2) {
                        App.UNIT1_SELECTOR.val(unit1).trigger($.Event("change", { broadcast: true }));
                        App.UNIT2_SELECTOR.val(unit2).trigger($.Event("change", { broadcast: true }));
                    }
                }

            });
        });
        
        $("#serversInformation")[0].close();
        activeServerBrowserTooltips.setContent(`${i18next.t("mapSyncedwith", { ns: "common" })} ${serverName}`);
        activeServerBrowserTooltips.enable();
        activeServerBrowserTooltips.hide();
        App.openToast("success", "mapUpdated", "");
    }


    /**
     * Sorts the server table by the given column and re-renders the rows.
     * @param {string} column
     * @returns {"asc"|"desc"}
     */
    sortTable(column) {
        if (!this.serversData) return;

        let sortOrder = this.currentSort === column && this.sortAscending ? -1 : 1;
        const direction = sortOrder === 1 ? "asc" : "desc";
        this.sortAscending = !this.sortAscending;
        this.currentSort = column;

        // Sort from the current filteredData, or full dataset if empty
        const baseData = this.filteredData !== null ? this.filteredData : [...this.serversData];

        const sorted = [...baseData].sort((a, b) => {
            let valA, valB;

            switch (column) {
            case "name":
                valA = a.attributes.name.toLowerCase();
                valB = b.attributes.name.toLowerCase();
                break;
            case "map":
                valA = (a.attributes.details.map || "").toLowerCase();
                valB = (b.attributes.details.map || "").toLowerCase();
                break;
            case "players":
                valA = a.attributes.players;
                valB = b.attributes.players;
                break;
            default:
                return 0;
            }

            if (valA < valB) return -1 * sortOrder;
            if (valA > valB) return 1 * sortOrder;
            return 0;
        });

        this.filteredData = sorted;
        this.renderRows(sorted);
        return direction;
    }


    /**
     * Converts a time in seconds to "HH:MM:SS" format.
     * @param {number} seconds - The total time in seconds.
     * @returns {string} Formatted time as "HH:MM".
     */
    toMinSec(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }


    /**
     * Converts a time in seconds to "HH:MM" format.
     * @param {number} seconds - The total time in seconds.
     * @returns {string} Formatted time as "HH:MM".
     */
    formatPlayTime(seconds) {
        const totalMinutes = Math.floor(seconds / 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }

}