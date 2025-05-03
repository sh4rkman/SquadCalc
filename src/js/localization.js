import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import { App } from "../app.js";

/**
 * Update every label with the correct localization text
 */
export function loadLanguage(LANGUAGES) {
    const LANG_SELECTOR = $(".dropbtn4");

    i18next.use(HttpApi).init({
        fallbackLng: false,
        ns: [
            "tooltips",
            "settings",
            "maps",
            "weapons",
            "common",
            "factions",
            "units",
        ],
        debug: false,
        backend: {
            loadPath: "./locales/{{lng}}/{{ns}}.json",
        }
    }, function(err) {
        if (err) return console.error(err);
        getLanguage(LANGUAGES);
    });


    LANG_SELECTOR.select2({
        dropdownCssClass: "dropbtn4",
        dropdownParent: $("#helpDialog"),
        minimumResultsForSearch: -1,
    });

    LANGUAGES.forEach(function(lng) {
        LANG_SELECTOR.append(`<option value=${lng[0]}>${lng[1]}</option>`);
    });

    $(document).on("change", ".dropbtn4", function() { 
        i18next.changeLanguage(this.value, updateContent);
        localStorage.setItem("settings-language", this.value);
        $("html").attr("lang", this.value);
    });
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

    $(".dropbtn4").val(language).trigger("change");
}

/**
 * Update every label with the correct localization text
 */
function updateContent() {
    document.querySelectorAll("[data-i18n], [data-i18n-title], [data-i18n-content], [data-i18n-label], [data-i18n-aria-label], [data-i18n-alt]").forEach(element => {
        if (element.hasAttribute("data-i18n")) {
            const key = element.getAttribute("data-i18n");
            element.textContent = i18next.t(key);
        }
        
        Array.from(element.attributes).forEach(attribute => {
            if (attribute.name.startsWith("data-i18n-")) {
                const key = attribute.value;
                const attributeName = attribute.name.substring("data-i18n-".length);
                const translatedValue = i18next.t(key);
                element.setAttribute(attributeName, translatedValue);
            }
        });
    });

    if (App.minimap.layer) App.minimap.layer.polyline.updateMeasurements();
   
    $(".dropbtn").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#mapSelector"),
        minimumResultsForSearch: -1,
    });

    $(".dropbtn2").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#weaponSelector"),
        minimumResultsForSearch: -1,
    });

    $(".dropbtn3").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#ammoSelector"),
        minimumResultsForSearch: -1,
    });

    let layerPlaceholder = i18next.t("common:layerPlaceholder");
    let factionPlaceholder = i18next.t("common:faction");
    let unitPlaceholder = i18next.t("common:unit");

    $(".dropbtn5").select2("destroy").select2({
        dropdownCssClass: "dropbtn",
        dropdownParent: $("#layerSelector"),
        allowClear: true,
        placeholder: layerPlaceholder,
        minimumResultsForSearch: -1,
    });

    $(".dropbtn6").select2("destroy").select2({
        dropdownCssClass: "dropbtn6",
        dropdownParent: $("#helpDialog"),
        minimumResultsForSearch: -1,
        width: "fit-content",
    });

    $(".dropbtn7").select2("destroy").select2({
        dropdownCssClass: "dropbtn7",
        dropdownParent: $("#helpDialog"),
        minimumResultsForSearch: -1,
        width: "fit-content",
    });


    if (App.minimap.layer) {
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
