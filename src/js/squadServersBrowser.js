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

        console.log(`Filtered servers with query "${query}":`, this.filteredData);
        this.renderTable(this.filteredData);
    }

    renderTable(servers, isInitialRender = false) {
        const serversList = document.getElementById("serversList");

        // Only render the full structure on initial load
        if (isInitialRender) {
            const fullHTML = `
                <div class="search-container">
                    <input 
                        type="text" 
                        id="serverSearch" 
                        class="search-input" 
                        placeholder="${i18next.t("searchServerPlaceholder", { ns: "common" })}"
                    />
                </div>

                <div class="results-count-wrapper">
                    <span class="results-count" id="resultsCount"></span>
                </div>

                <div id="tableContainer">

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
                                class="status-badge ok">${i18next.t("load", { ns: "common" })} <span>→</span></button>`
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