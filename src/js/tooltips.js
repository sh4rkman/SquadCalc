import tippy, {followCursor} from "tippy.js";
import "tippy.js/dist/tippy.css";
import i18next from "i18next";

export var tooltip_save;
export var tooltip_copied;
export var tooltip_coordPreview;


const helpDialog = document.querySelector("#helpDialog");

tippy("#settings", {
    allowHTML: true,
    animation: "fade",
    placement: "bottom",
    theme: "new",
    trigger: "manual",
    onShow(tip) {
        tip.setContent(`<i class=fa fa-check></i>${i18next.t("tooltips:copied")}`);
        setTimeout(() => {
            tip.hide();
            tip.disable();
        }, 1500);
    }
});
tooltip_copied = document.querySelector("#settings")._tippy;
tooltip_copied.disable();

tippy("span[data-i18n='settings:showDamage']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    maxWidth: 200,
    delay: 50,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:damageRadiusTooltip")}`);
    },
});

tippy("span[data-i18n='settings:mapAnimationSettings']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 50,
    maxWidth: 200,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:smoothMapTooltip")}`);
    },
});

tippy("span[data-i18n='settings:highquality']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 50,
    maxWidth: 275,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:highqualityTooltip")}`);
    },
});

tippy("span[data-i18n='settings:experimentalWeapons']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 50,
    maxWidth: 275,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:experimentalWeaponsTooltip")}`);
    },
});

tippy("span[data-i18n='settings:showAnimations']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 50,
    maxWidth: 200,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:targetAnimationTooltip")}`);
    },
});

tippy("span[data-i18n='settings:showKeypad']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 50,
    maxWidth: 200,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:showKeypadTooltip")}`);
    },
});

tippy("span[data-i18n='settings:showSpread']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 50,
    maxWidth: 200,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:showSpreadTooltip")}`);
    },
});

tippy("span[data-i18n='settings:showMaxRange']", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 50,
    maxWidth: 200,
    appendTo: helpDialog,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:showMaxRangeTooltip")}`);
    },
});


tippy("#bearingNum", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "results",
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:bearing")}</br><span class=tooltipsubtext>${i18next.t("tooltips:whereToAim")}</span>`);
    },
});

tippy(".btn-delete", {
    animation: "fade",
    placement: "left",
    touch: false,
    theme: "menu",
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:deleteTargets"));
    },
});

tippy(".btn-focus", {
    animation: "fade",
    placement: "left",
    touch: false,
    theme: "menu",
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:focusMode"));
    },
});

tippy(".btn-basemap", {
    animation: "fade",
    placement: "left",
    theme: "menu",
    touch: false,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:basemode"));
    },
});

tippy(".btn-terrainmap", {
    animation: "fade",
    placement: "left",
    theme: "menu",
    touch: false,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:terrainmode"));
    },
});


tippy(".btn-topomap", {
    animation: "fade",
    placement: "left",
    theme: "menu",
    touch: false,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:topographicmode"));
    },
});

tippy(".btn-helpmap", {
    animation: "fade",
    placement: "left",
    theme: "menu",
    touch: false,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:helpmode"));
    },
});


tippy("#elevationNum", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    theme: "results",
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:elevation")}</br><span class=tooltipsubtext>${i18next.t("tooltips:howFar")}</span>`);
    },
});

tippy("#savebutton i", {
    animation: "fade",
    allowHTML: true,
    interactiveDebounce: 75,
    placement: "bottom",
    theme: "results",
    touch: false,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:save")}</br><span class=tooltipsubtext> ${i18next.t("tooltips:resultLater")}</span>`);
    },
});
tooltip_save = document.querySelector("#savebutton i")._tippy;

tippy("#preview", {
    animation: false,
    content: "B03-4-5",
    followCursor: true,
    plugins: [followCursor],
    touch: false,
    placement: "bottom",
    appendTo: document.querySelector("#preview"),
    theme: "preview",
    hideOnClick: false,
});
tooltip_coordPreview = document.querySelector("#preview")._tippy;

const targetDialog = document.getElementById("calcInformation");
tippy(".infSpreadTooltip", {
    animation: "fade",
    placement: "top",
    touch: false,
    appendTo: targetDialog,
    theme: "infTooltips",
    delay: [500, 0],
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:spreadDesc"));
    },
});

const weaponDialog = document.getElementById("weaponInformation");
tippy(".infMOATooltip", {
    animation: "fade",
    placement: "top",
    touch: false,
    appendTo: weaponDialog,
    theme: "infTooltips",
    delay: [500, 0],
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:moaDesc"));
    },
});

tippy(".infVelocityTooltip", {
    animation: "fade",
    placement: "top",
    touch: false,
    appendTo: weaponDialog,
    theme: "infTooltips",
    delay: [500, 0],
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:velocityDesc"));
    },
});

tippy(".infHeightPaddingTooltip", {
    animation: "fade",
    placement: "top",
    touch: false,
    appendTo: weaponDialog,
    theme: "infTooltips",
    delay: [500, 0],
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:heightPaddingDesc"));
    },
});
