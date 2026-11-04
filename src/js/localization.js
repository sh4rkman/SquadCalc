import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import TomSelect from "tom-select";
import { App } from "../app.js";
import pkg from "../../package.json";
const { version } = pkg;

// Flag emoji per supported language code. "uk" is the Ukrainian language, not the UK.
const LANG_FLAGS = {
    en: "🇬🇧",
    de: "🇩🇪",
    fr: "🇫🇷",
    pt: "🇧🇷",
    ru: "🇷🇺",
    tr: "🇹🇷",
    uk: "🇺🇦",
    zh: "🇨🇳",
};

// Native language names shown in the language picker
const LANG_NAMES = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    pt: "Português (Brasil)",
    ru: "Русский",
    tr: "Türkçe",
    uk: "Українська",
    zh: "中文",
};

let langSelect;

/**
 * Update every label with the correct localization text
 */
export function loadLanguage(LANGUAGES) {
    i18next.use(HttpApi).init({
        fallbackLng: "en",
        ns: [
            "tooltips",
            "settings",
            "maps",
            "weapons",
            "common",
            "factions",
            "units",
            "vehicles",
        ],
        debug: false,
        backend: {
            loadPath: `./locales/{{lng}}/{{ns}}.json?v=${version}`,
        }
    }, function(err) {
        if (err) return console.error(err);
        getLanguage(LANGUAGES);
    });

    langSelect = new TomSelect("#settingsLangSelect", {
        options: LANGUAGES.map(([code, label]) => ({ value: code, text: LANG_NAMES[code] || code, short: label })),
        maxItems: 1,
        controlInput: null,
        render: {
            option: renderLangOption,
            item: renderLangItem,
        },
    });

    langSelect.on("change", onLanguageChange);
}

/**
 * Apply a new language
 * @param {string} value - language code
 */
function onLanguageChange(value) {
    if (!value) return;
    i18next.changeLanguage(value, updateContent);
    localStorage.setItem("settings-language", value);
    $("html").attr("lang", value);
}

/**
 * Flag + native name, used for the dropdown options
 * @param {{value: string, text: string}} data
 * @param {Function} escape
 * @returns {string} html
 */
function renderLangOption(data, escape) {
    return `
        <div class="settings-langOption">
            <span class="settings-langFlag">${LANG_FLAGS[data.value] || ""}</span>
            <span>${escape(data.text)}</span>
        </div>
    `;
}

/**
 * Find what language to use
 * Priority Order : LocalStorage > navigator.language > English
 */
/**
 * Flag + short label (EN, FR, ...), used for the selected item in the header
 * @param {{value: string, short: string}} data
 * @param {Function} escape
 * @returns {string} html
 */
function renderLangItem(data, escape) {
    return `
        <div class="settings-langOption">
            <span class="settings-langFlag">${LANG_FLAGS[data.value] || ""}</span>
            <span>${escape(data.short || data.value.toUpperCase())}</span>
        </div>
    `;
}

function getLanguage(LANGUAGES){
    const browserLanguage = navigator.language.split("-")[0].toLowerCase();
    const supportedLanguagesCodes = LANGUAGES.map(pair => pair[0]);
    let language = localStorage.getItem("settings-language");

    // If nothing in localstorage, try to find what language navigator is using
    if (language === null || language === ""){
        if (supportedLanguagesCodes.includes(browserLanguage)) {
            language = browserLanguage;
        } else {
            // language not supported, set default to english
            language = "en";
        }
        localStorage.setItem("settings-language", language);
    }

    langSelect.setValue(language);
}

/**
 * Update every label with the correct localization text
 */
function updateContent() {
    document.querySelectorAll("[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-content], [data-i18n-label], [data-i18n-aria-label], [data-i18n-alt]").forEach(element => {
        if (element.hasAttribute("data-i18n")) {
            const rawKey = element.getAttribute("data-i18n");
            const [namespace, ...rest] = rawKey.split(":");
            const key = rest.join(":"); // in case ":" appears in the key
            element.textContent = i18next.t(key, { ns: namespace });
        }
    
        Array.from(element.attributes).forEach(attribute => {
            if (attribute.name.startsWith("data-i18n-")) {
                const rawKey = attribute.value;
                const attributeName = attribute.name.substring("data-i18n-".length);
                const [namespace, ...rest] = rawKey.split(":");
                const key = rest.join(":");
                const translatedValue = i18next.t(key, { ns: namespace });
                element.setAttribute(attributeName, translatedValue);
            }
        });
    });

    if (App.minimap.layer) App.minimap.layer.polyline.updateMeasurements();
    if (App.userSettings) App._renderMods();
    $(".threeDTextureSelect").trigger("change.select2"); // re-render its selected option's new text
   
    const selectorWidth = window.matchMedia("screen and (min-width: 124em) and (min-height: 68em)").matches ? "350px" : "250px";

    let layerPlaceholder = i18next.t("common:layerPlaceholder");
    let factionPlaceholder = i18next.t("common:faction");
    let unitPlaceholder = i18next.t("common:unit");

    $(".dropbtn").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#mapSelector"),
        minimumResultsForSearch: 1,
        width: selectorWidth,
    });

    $(".dropbtn2").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#weaponSelector"),
        minimumResultsForSearch: 1,
        width: selectorWidth,
    });

    $(".dropbtn3").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#ammoSelector"),
        minimumResultsForSearch: -1,
        width: selectorWidth,
    });

    $(".dropbtn5").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#layerSelector"),
        allowClear: true,
        placeholder: layerPlaceholder,
        minimumResultsForSearch: 1,
        width: selectorWidth,
    });

    $(".dropbtn6").select2("destroy").select2({
        dropdownParent: $("#serverSelector"),
        allowClear: true,
        placeholder: i18next.t("common:favServers"),
        minimumResultsForSearch: Infinity,
        width: selectorWidth,
    });

    if (App.minimap.layer?.faction) {

        $(".dropbtn8").select2("destroy").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#faction1"),
            allowClear: true,
            placeholder: factionPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => App.minimap.layer.factions.formatFactions(state, false),
            templateSelection: (state) => App.minimap.layer.factions.formatFactions(state, true),
        });

        $(".dropbtn9").select2("destroy").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#unit1"),
            placeholder: unitPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => App.minimap.layer.factions.formatUnits(state, false),
            templateSelection: (state) => App.minimap.layer.factions.formatUnits(state, true),
        });

        $(".dropbtn10").select2("destroy").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#faction2"),
            allowClear: true,
            placeholder: factionPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => App.minimap.layer.factions.formatFactions(state, false),
            templateSelection: (state) => App.minimap.layer.factions.formatFactions(state, true),
        });

        $(".dropbtn11").select2("destroy").select2({
            dropdownCssClass: "dropbtn",
            dropdownParent: $("#unit2"),
            placeholder: unitPlaceholder,
            minimumResultsForSearch: -1,
            templateResult: (state) => App.minimap.layer.factions.formatUnits(state, false),
            templateSelection: (state) => App.minimap.layer.factions.formatUnits(state, true),
        });
    }
    
}
