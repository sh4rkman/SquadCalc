import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import Choices from "choices.js";
import { App } from "../app.js";
import pkg from "../../package.json";
const { version } = pkg;

// Flag icon (public/img/lang/<code>.svg) per supported language code - emoji flags fall
// back to plain two-letter text on Windows (no flag glyphs in its emoji font), so these are
// rendered as actual images instead. "uk" is the Ukrainian language, not the UK.
const LANG_FLAGS = {
    en: "gb",
    de: "de",
    fr: "fr",
    pt: "br",
    ru: "ru",
    tr: "tr",
    uk: "ua",
    zh: "cn",
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
    const language = resolveLanguage(LANGUAGES);

    i18next.use(HttpApi).init({
        lng: language,
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
        langSelect.setChoiceByValue(language);
        document.documentElement.lang = language;
        updateContent();
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
                    el.innerHTML = `<img class="settings-langFlag" src="/img/lang/${choice.customProperties?.flag}.svg" alt="" /><span>${escapeForTemplate(options.allowHTML, short)}</span>`;
                    return el;
                },
                // Dropdown row: flag + native name (English, Deutsch, ...)
                choice(options, choice, selectText, groupName) {
                    const el = defaultChoiceTemplate.call(this, options, choice, selectText, groupName);
                    el.classList.add("settings-langOption");
                    el.innerHTML = `<img class="settings-langFlag" src="/img/lang/${choice.customProperties?.flag}.svg" alt="" /><span>${el.innerHTML}</span>`;
                    return el;
                },
            };
        },
    });

    langSelect.containerOuter.element.setAttribute("aria-label", document.getElementById("settingsLangSelect").getAttribute("aria-label") || "Language");

    document.getElementById("settingsLangSelect").addEventListener("change", (event) => onLanguageChange(event.target.value));
}

/**
 * Apply a new language
 * @param {string} value - language code
 */
function onLanguageChange(value) {
    if (!value) return;
    i18next.changeLanguage(value, updateContent);
    localStorage.setItem("settings-language", value);
    document.documentElement.lang = value;
}

/**
 * Find what language to use
 * Priority Order : LocalStorage > navigator.language > English
 */
function resolveLanguage(LANGUAGES){
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

    return language;
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
    if (App.mapSelect) App._rebuildMapSelector();
    if (App.weaponSelect) {
        App._rebuildModdedWeapons();
        App.changeWeapon();
    }
    App.simulation3D?._rebuildTextureChoices();

    // The layer/server selectors' placeholder choice is also snapshotted (by setChoices())
    // at whatever i18next.t() returned when it was built - often the raw key, since that
    // first build runs before i18next's async backend has loaded. The generic data-i18n
    // loop above fixes the text currently on screen, but Choices re-renders the placeholder
    // from this stale cached label when the selection is cleared - refresh it too.
    refreshChoicesPlaceholder(App.layerSelect, "common:layerPlaceholder");
    refreshChoicesPlaceholder(App.serverSelect, "common:favServers");
}

function refreshChoicesPlaceholder(instance, key) {
    if (!instance) return;
    const translated = i18next.t(key);
    const placeholderChoice = instance._store?.choices?.find(choice => choice.placeholder);
    if (placeholderChoice) placeholderChoice.label = translated;
    instance._placeholderValue = translated;
    instance.containerOuter?.element?.querySelector(".choices__placeholder")?.replaceChildren(translated);
}
