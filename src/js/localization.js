import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import Choices from "choices.js";
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

    const { item: defaultItemTemplate, choice: defaultChoiceTemplate } = Choices.defaults.templates;
    langSelect = new Choices("#settingsLangSelect", {
        choices: LANGUAGES.map(([code, label]) => ({
            value: code,
            label: LANG_NAMES[code] || code,
            customProperties: { short: label, flag: LANG_FLAGS[code] || "" },
        })),
        searchEnabled: false,
        shouldSort: false,
        itemSelectText: "",
        callbackOnCreateTemplates(template, escapeForTemplate) {
            return {
                // Selected item shown in the header: flag + short code (EN, FR, ...)
                item(options, choice, removeItemButton) {
                    const el = defaultItemTemplate.call(this, options, choice, removeItemButton);
                    const short = choice.customProperties?.short || choice.value.toUpperCase();
                    el.classList.add("settings-langOption");
                    el.innerHTML = `<span class="settings-langFlag">${choice.customProperties?.flag || ""}</span><span>${escapeForTemplate(options.allowHTML, short)}</span>`;
                    return el;
                },
                // Dropdown row: flag + native name (English, Deutsch, ...)
                choice(options, choice, selectText, groupName) {
                    const el = defaultChoiceTemplate.call(this, options, choice, selectText, groupName);
                    el.classList.add("settings-langOption");
                    el.innerHTML = `<span class="settings-langFlag">${choice.customProperties?.flag || ""}</span><span>${el.innerHTML}</span>`;
                    return el;
                },
            };
        },
    });

    $("#settingsLangSelect").on("change", (event) => onLanguageChange(event.target.value));
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
 * Find what language to use
 * Priority Order : LocalStorage > navigator.language > English
 */
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

    langSelect.setChoiceByValue(language);
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

    // Choices (map/layer/server/weapon/shell/texture selectors) has no live DOM sync
    // like select2 - its option labels were snapshotted at the last setChoices() call,
    // so a language change needs an explicit rebuild instead of a destroy()/re-init().
    // Layer/server names come from the API (not i18next keys) so only their rarely-
    // seen placeholder text goes stale here - not worth a refetch just to fix that.
    if (App.mapSelect) App._rebuildMapSelector();
    if (App.weaponSelect) {
        App._rebuildModdedWeapons();
        App.changeWeapon();
    }
    App.simulation3D?._rebuildTextureChoices();
}
