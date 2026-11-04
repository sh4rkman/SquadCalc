import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import i18next from "i18next";
import { App } from "../app.js";

export var tooltip_save;
export var tooltip_copied;


tippy("#settings", {
    allowHTML: true,
    animation: "fade",
    placement: "bottom",
    theme: "new",
    trigger: "manual",
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:copied")}`);
        setTimeout(() => {
            tip.hide();
            tip.disable();
        }, 1500);
    }
});
tooltip_copied = document.querySelector("#settings")._tippy;
tooltip_copied.disable();

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


/* ******************* */
/* Map Button tooltips */
/* ******************* */

const commonMapMenuToolipsSettings = {
    animation: "fade",
    allowHTML: true,
    placement: "top",
    touch: false,
    theme: "menu",
    delay: [500, 0],
};

tippy(".btn-basemap", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:basemode")}</div>
            <div class="tooltipsubtext">${App.formatShortcutHTML(App.shortcuts.toggleMap)}</div>
            `
        );
    },
});
tippy(".btn-terrainmap", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:terrainmode")}</div>
            <div class="tooltipsubtext">${App.formatShortcutHTML(App.shortcuts.toggleMap)}</div>
            `
        );
    },
});
tippy(".btn-topomap", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:topographicmode")}</div>
            <div class="tooltipsubtext">${App.formatShortcutHTML(App.shortcuts.toggleMap)}</div>
            `
        );
    },
});
tippy(".btn-layer", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:toggleLayer"));
    },
});
tippy(".btn-hd", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        const locked = tip.reference.classList.contains("locked");
        tip.setContent(i18next.t(locked ? "tooltips:hdUnavailable" : "settings:highquality"));
    },
});
export const layerInfoTooltips = tippy(".btn-layer-info", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:layerInfo"));
    },
})[0];
export const threeDTooltips = tippy(".btn-3d", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        const locked = tip.reference.classList.contains("locked");
        tip.setContent(i18next.t(locked ? "tooltips:view3DUnavailable" : "tooltips:view3D"));
    },
})[0];
tippy(".btn-legacy", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `<div>${i18next.t("tooltips:legacyMode")}</div>
            <div class="tooltipsubtext">CTRL+M</div>`
        );
    },
});
tippy(".returnBtn", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    offset: [0, 15],
    onShow(tip) {
        tip.setContent(
            `<div>${i18next.t("tooltips:returnToMap")}</div>
            <div class="tooltipsubtext">CTRL+M</div>`
        );
    },
});
export const settingsTooltips = tippy(".btn-settings", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:settings"));
    },
})[0];
tippy(".btn-helpmap", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:helpmode"));
    },
});
tippy(".btn-focus", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:focusMode")}</div>
            <div class="tooltipsubtext">${App.formatShortcutHTML(App.shortcuts.focusMode)}</div>
            `
        );
    },
});

export const serverBrowserTooltips = tippy("#servers", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:serverBrowser"));
    },
})[0];

// export const activeServerBrowserTooltips = tippy("#servers", {
//     ...commonMapMenuToolipsSettings,
//     placement: "left",
// })[0];
// activeServerBrowserTooltips.disable();


export const createSessionTooltips = tippy(".btn-session", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:createSession"));
    },
})[0];
export const leaveSessionTooltips =  tippy(".btn-session", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:leaveSession"));
    },
})[0];
leaveSessionTooltips.disable();

tippy(".btn-undo", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:undo")}</div>
            <div class="tooltipsubtext">${App.formatShortcutHTML(App.shortcuts.deleteLastTarget)}</div>
            `
        );
    },
});

tippy(".btn-download", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:download")}</div>
            <div class="tooltipsubtext">${App.formatShortcutHTML(App.shortcuts.saveMap)}</div>
            `
        );
    },
});

tippy(".btn-upload", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:upload")}</div>
            `
        );
    },
});

tippy(".btn-delete", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:deleteTargets")}</div>
            <div class="tooltipsubtext">${App.formatShortcutHTML(App.shortcuts.clearTargets)}</div>
            `
        );
    },
});

tippy(".btn-drawingMode", {
    ...commonMapMenuToolipsSettings,
    placement: "left",
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:quitDrawingMode")}</div>
            <div class="tooltipsubtext">${i18next.t("tooltips:escape")}</div>
            `
        );
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

tippy("#savebutton svg", {
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
tooltip_save = document.querySelector("#savebutton svg")._tippy;


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
