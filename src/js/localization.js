import i18next from "i18next";
import HttpApi from "i18next-http-backend";
import { App } from "./conf.js";
import { updatePreview } from "./settings.js";

function getLanguage(){
    const supportedLanguages = ["en", "ru", "zh", "fr", "uk"];
    const browserLanguage = navigator.language.split("-")[0].toLowerCase();
    var language = localStorage.getItem("settings-language");

    if (language === null || language === ""){
        if (supportedLanguages.includes(browserLanguage)) {
            language = browserLanguage;
        } else {
            language = "en";
        }
        localStorage.setItem("settings-language", language);
    }

    $(".dropbtn4").val(language);
    $(".dropbtn4").trigger("change");
}


function updateContent() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        element.textContent = i18next.t(key);
    });

    document.querySelectorAll("[data-i18n-title], [data-i18n-label], [data-i18n-aria-label], [data-i18n-alt]").forEach(element => {
        Array.from(element.attributes).forEach(attribute => {
            if (attribute.name.startsWith("data-i18n-")) {
                const key = attribute.value;
                const attributeName = attribute.name.substring("data-i18n-".length);
                const translatedValue = i18next.t(key);
                element.setAttribute(attributeName, translatedValue);
            }
        });
    });

    App.minimap.updateTargets();
    updatePreview();

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
}

export function loadLanguage() {
    i18next.use(HttpApi).init({
        lng: "en",
        fallbackLng: ["en"],
        ns: ["tooltips","settings", "maps", "weapons", "common"],
        debug: false,
        backend: {
            loadPath: "./locales/{{lng}}/{{ns}}.json",
        }
    }, function(err) {
        if (err) return console.error(err);
        getLanguage();
    });

    $(document).on("change", ".dropbtn4", function() { 
        i18next.changeLanguage(this.value, updateContent);
        localStorage.setItem("settings-language", this.value);
        $("html").attr("lang", this.value);
    });
}