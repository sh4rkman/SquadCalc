import i18next from "i18next";
import { App } from "../app.js";
import { MAPS } from "./data/maps.js";


export default class SquadServersBrowser {

    constructor() {
        this.loadServersInfo();
    }


    async loadServersInfo() {
        const serversList = document.getElementById("serversList");

        try {
            // Show loading indicator
            serversList.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>${i18next.t("loadingServers", { ns: "common" })}</p>
                </div>
            `;

            // Fetch from **your** API instead of BattleMetrics directly
            const response = await fetch(`${process.env.API_URL}/get/servers`);
            const data = await response.json();
            this.serversData = data.servers;
            this.renderTable(this.serversData, true);
        } catch (error) {
            console.error("Error fetching server data:", error);
            serversList.innerHTML = `<p data-i18n="common:errorLoading">${i18next.t("loadingServers", { ns: "common" })}</p>`;
        }
    }


    filterServers(query) {
        const q = query.toLowerCase();
        this.filteredData = this.serversData.filter(s =>
            s.attributes.name.toLowerCase().includes(q) ||
            (s.attributes.details.map || "").toLowerCase().includes(q)
        );

        console.debug(`Filtered servers with query "${query}":`, this.filteredData);
        this.renderTable(this.filteredData);
    }


    renderTable(servers, isInitialRender = false) {
        const serversList = document.getElementById("serversList");

        // Only render the full structure on initial load
        if (isInitialRender) {
            const fullHTML = `
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
                                placeholder="${i18next.t("searchServerPlaceholder", { ns: "common" })}"
                                id="serverSearch"
                            />
                        </div>
                        <span class="results-count" id="resultsCount"></span>
                        <button class="refresh-btn" id="refreshBtn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div id="tableContainer" class="animate__animated animate__fadeIn">

                    <table class="servers-table">
                        <thead>
                            <tr>
                                <th class="sortable" data-sort="name"">
                                    ${i18next.t("serverName", { ns: "common" })} <span class="sort-indicator">⇅</span>
                                </th>
                                <th class="sortable" data-sort="map">
                                    ${i18next.t("currentMap", { ns: "common" })} <span class="sort-indicator">⇅</span>
                                </th>
                                <th class="sortable" data-sort="players">
                                    ${i18next.t("players", { ns: "common" })} <span class="sort-indicator">⇅</span>
                                </th>
                                <th>${i18next.t("team1", { ns: "common" })}</th>
                                <th>${i18next.t("team2", { ns: "common" })}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="serversTableBody"></tbody>
                    </table>
                </div>
            `;
            serversList.innerHTML = fullHTML;

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
                    this.loadServersInfo();
                });
            }

            // Sortable headers
            const sortableHeaders = serversList.querySelectorAll("th[data-sort]");
            sortableHeaders.forEach(header => {
                header.addEventListener("click", () => {
                    this.sortTable(header.getAttribute("data-sort"));
                });
            });

        }

        // Always update the table body and results count
        const tbody = document.getElementById("serversTableBody");
        const resultsCount = document.getElementById("resultsCount");

        if (tbody) {
            tbody.innerHTML = servers.length > 0 ? servers.map(server => `
                <tr>
                    <td title="${server.attributes.name}">${server.attributes.name}</td>
                    <td class="mapdata">${server.attributes.details.map || i18next.t("servers:unknown")}</td>
                    <td>${server.attributes.players}/${server.attributes.maxPlayers}</td>
                    <td>
                        ${server.team1  ? `<img title="${server.attributes.details.squad_teamOne}"
                                src="${process.env.API_URL}/img/flags/${server.team1}.webp" 
                                alt="${server.team1}" class="flag-icon">`
        : "-"
}
                    </td>
                    <td>
                        ${server.team2 ? `<img title="${server.attributes.details.squad_teamTwo}"
                                src="${process.env.API_URL}/img/flags/${server.team2}.webp" 
                                alt="${server.team2}" class="flag-icon">`
        : "-"
}
                    </td>
                    <td>
                        ${!server.team1 || !server.team2 || !server.mapName ? "" : `<button 
                                data-map="${server.mapName}" 
                                data-layer="${server.attributes.details.map}" 
                                data-team1="${server.team1}"
                                data-team2="${server.team2}"
                                data-unit1="${server.attributes.details.squad_teamOne || ""}"
                                data-unit2="${server.attributes.details.squad_teamTwo || ""}"
                                class="status-badge ok">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                    <path d="M416 160L480 160C497.7 160 512 174.3 512 192L512 448C512 465.7 497.7 480 480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L480 544C533 544 576 501 576 448L576 192C576 139 533 96 480 96L416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160zM406.6 342.6C419.1 330.1 419.1 309.8 406.6 297.3L278.6 169.3C266.1 156.8 245.8 156.8 233.3 169.3C220.8 181.8 220.8 202.1 233.3 214.6L306.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L306.7 352L233.3 425.4C220.8 437.9 220.8 458.2 233.3 470.7C245.8 483.2 266.1 483.2 278.6 470.7L406.6 342.7z"/>
                                </svg>
                            </button>`
}
                    </td>
                </tr>
            `).join("") : `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        ${i18next.t("noServersFound", { ns: "common" })}
                    </td>
                </tr>
            `;
        }

        const loadButtons = serversList.querySelectorAll(".status-badge.ok");
        loadButtons.forEach(button => {
            button.addEventListener("click", () => {
                const mapName = button.getAttribute("data-map");
                const mapIndex = MAPS.findIndex(m => m.name.toLowerCase() === mapName.toLowerCase());
                const layerIndex = button.getAttribute("data-layer");
                const team1 = button.getAttribute("data-team1");
                const team2 = button.getAttribute("data-team2");
                const unit1 = button.getAttribute("data-unit1");
                const unit2 = button.getAttribute("data-unit2");
                if (mapName) App.MAP_SELECTOR.val(mapIndex).trigger($.Event("change", { broadcast: true }));
                $(document).one("layers:loaded", () => {
                    App.LAYER_SELECTOR.val(layerIndex).trigger($.Event("change", { broadcast: true }));
                    $(document).one("layer:loaded", () => {
                        App.FACTION1_SELECTOR.val(team1).trigger($.Event("change", { broadcast: true }));
                        App.FACTION2_SELECTOR.val(team2).trigger($.Event("change", { broadcast: true }));
                        App.UNIT1_SELECTOR.val(unit1).trigger($.Event("change", { broadcast: true }));
                        App.UNIT2_SELECTOR.val(unit2).trigger($.Event("change", { broadcast: true }));
                    });
                });
                
                $("#serversInformation")[0].close();
            });
        });

        if (resultsCount) {
            if (servers.length === 1) {
                resultsCount.textContent = `${servers.length} ${i18next.t("server", { ns: "common" })} ${i18next.t("found", { ns: "common" })}`;
            } else {
                resultsCount.textContent = `${servers.length} ${i18next.t("servers", { ns: "common" })} ${i18next.t("found", { ns: "common" })}`;
            }
        }
    }


    sortTable(column) {
        if (!this.serversData) return;

        let sortOrder = this.currentSort === column && this.sortAscending ? -1 : 1;
        this.sortAscending = !this.sortAscending;
        this.currentSort = column;

        // Sort from the current filteredData, or full dataset if empty
        const baseData = this.filteredData?.length ? this.filteredData : [...this.serversData];

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
        this.renderTable(sorted);
    }

}