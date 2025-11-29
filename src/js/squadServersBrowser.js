import i18next from "i18next";
import { App } from "../app.js";
import { MAPS } from "./data/maps.js";
import { activeServerBrowserTooltips } from "./tooltips.js";


export default class SquadServersBrowser {

    constructor() {
        this.serversData = null;
        this.syncInterval = null;
        this.selectedServer = null;
        this.selectedLayer = null;
        this.refreshInterval = 20; // seconds
    }

    init(){
        this.loadServersInfo();
    }

    toMinSec(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }


    async syncWithServer(){

        // log hour:min
        var d = new Date();
        var n = d.toLocaleTimeString();

        if (!this.selectedServer) return;

        this.getServers();

        if (!this.serversData) return;

        this.serversData.forEach(server => {
            if (server.id == this.selectedServer) {
                let playTime = this.toMinSec(server.attributes.details.squad_playTime);
                let map = server.attributes.details.map;
                console.log(`${n} - ${server.attributes.name} - ${map} - playtime : ${playTime}`);
                if (map != this.selectedLayer) {
                    console.warn(`  LAYER CHANGED FROM ${this.selectedLayer} to ${map}`);
                    this.selectedLayer = map;
                    this.switchLayer(server.name,
                        server.mapName,
                        map,
                        server.team1,
                        server.team2,
                        server.attributes.details.squad_teamOne,
                        server.attributes.details.squad_teamTwo
                    );
                }
            }
        });
    }


    async getServers() {
        try {
            const response = await fetch(`${process.env.API_URL}/get/servers`);
            const data = await response.json();
            this.serversData = data.servers;
        } catch (error) {
            console.error("Error fetching server data:", error);
            //serversList.innerHTML = `<p data-i18n="common:errorLoading">${i18next.t("loadingServers", { ns: "common" })}</p>`;
        }
    }

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

    async refreshRows() {

        const tbody = document.getElementById("serversTableBody");
        const searchInput = document.getElementById("serverSearch");
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <p>${i18next.t("loadingServers", { ns: "common" })}</p>
                </td>
            </tr>
        `;
        await this.getServers();
        this.filterServers(searchInput.value);
    }


    filterServers(query) {
        const q = query.toLowerCase();

        if (this.serversData) {
            this.filteredData = this.serversData?.filter(s =>
                s.attributes.name.toLowerCase().includes(q) ||
                (s.attributes.details.map || "").toLowerCase().includes(q)
            );
        }

        console.debug(`Filtered servers with query "${query}":`, this.filteredData);
        this.renderRows(this.filteredData);
    }

    renderRows(servers){
        // Always update the table body and results count
        const tbody = document.getElementById("serversTableBody");
        //const resultsCount = document.getElementById("resultsCount");

        if (servers && servers.length > 0) {

            tbody.innerHTML = servers.map(server => `
                <tr class="
                    ${server.id == this.selectedServer ? "selected" : ""}
                    ${!server.team1 || !server.team2 || !server.mapName ? "unavailable" : ""}
                "
                data-servername="${server.attributes.name}"
                data-serverid="${server.id}"
                data-layer="${server.attributes.details.map}"
                data-map="${server.mapName}" 
                data-team1="${server.team1}"
                data-team2="${server.team2}"
                data-unit1="${server.attributes.details.squad_teamOne || ""}"
                data-unit2="${server.attributes.details.squad_teamTwo || ""}">
                    <td title="${server.attributes.name}">${server.attributes.name}</td>
                    <td class="mapdata">
                    ${server.attributes.details.map}<br>
                    ${server.attributes.details.squad_nextLayer ? `
                        <span class="nextMap">${i18next.t("next", { ns: "common" })}: ${server.attributes.details.squad_nextLayer}</span>`
        : 
        "<span class=\"nextMap\">Map Voting</span>"
}
                    </td>
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
                </tr>
            `).join("");
        }
        else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        ${i18next.t("noServersFound", { ns: "common" })}
                    </td>
                </tr>
                `;
        }

        // const loadButtons = serversList.querySelectorAll(".status-badge.ok");
        // loadButtons.forEach(button => {
        //     button.addEventListener("click", (e) => {
        //         this.switchLayer(e.target);
        //     });
        // });
    }

    renderTable(servers) {
        const serversList = document.getElementById("serversList");

        // Only render the full structure on initial load
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
                        </tr>
                    </thead>
                    <tbody id="serversTableBody"></tbody>
                </table>
            </div>
        `;

        serversList.innerHTML = fullHTML;

        $(".servers-table").on("click", "tr", (event) => {
            const row = $(event.currentTarget);

            // --- UNSELECT ---
            if (row.hasClass("selected")) {

                row.removeClass("selected");
                $("#servers").removeClass("active");

                this.selectedServer = null;

                // stop sync
                if (this.syncInterval) {
                    clearInterval(this.syncInterval);
                    this.syncInterval = null;
                }

                activeServerBrowserTooltips.disable();
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
                this.sortTable(header.getAttribute("data-sort"));
            });
        });

        this.renderRows(servers);

        // if (resultsCount) {
        //     if (servers.length === 1) {
        //         resultsCount.textContent = `${servers.length} ${i18next.t("server", { ns: "common" })} ${i18next.t("found", { ns: "common" })}`;
        //     } else {
        //         resultsCount.textContent = `${servers.length} ${i18next.t("servers", { ns: "common" })} ${i18next.t("found", { ns: "common" })}`;
        //     }
        // }
    }


    switchLayer(serverName, mapName, layerIndex, team1, team2, unit1, unit2){
        
        if (!mapName) return;

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
        activeServerBrowserTooltips.setContent(`Map Synced with ${serverName}`);
        activeServerBrowserTooltips.enable();
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
        this.renderRows(sorted);
    }

}