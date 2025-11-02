import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import i18next from "i18next";

export var tooltip_save;
export var tooltip_copied;

const helpDialog = document.querySelector("#helpDialog");

const commonToolipsSettings = {
    animation: "fade",
    placement: "right",
    offset: [0, 20],
    allowHTML: true,
    touch: false,
    theme: "settingsTooltips",
    hideOnClick: true,
    delay: 200,
    maxWidth: 250, 
    appendTo: helpDialog,
};

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

tippy("span[data-i18n='settings:lowAndHigh']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:lowAndHighTooltip")}`);
    },
});

tippy("span[data-i18n='settings:lowAndHigh']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:lowAndHighTooltip")}`);
    },
});

tippy("span[data-i18n='settings:mapAnimationSettings']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:smoothMapTooltip")}`);
    },
});

tippy("span[data-i18n='settings:moddedWeapons']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:moddedWeaponTooltip")}`);
    },
});

tippy("span[data-i18n='settings:showAnimations']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:targetAnimationTooltip")}`);
    },
});

tippy("span[data-i18n='settings:weaponDrag']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:markerDragTooltip")}`);
    },
});

tippy("span[data-i18n='settings:targetDrag']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:markerDragTooltip")}`);
    },
});


tippy("span[data-i18n='settings:showKeypad']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:showKeypadTooltip")}`);
    },
});

tippy("span[data-i18n='settings:useClassicCursor']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:useClassicCursorTooltip")}`);
    },
});

tippy("span[data-i18n='settings:showSpread']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:showSpreadTooltip")}`);
    },
});

tippy("span[data-i18n='settings:targetGrid']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:targetGridTooltip")}`);
    },
});

tippy("span[data-i18n='settings:lineToTarget']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`${i18next.t("tooltips:lineToTargetTooltip")}`);
    },
});

tippy("span[data-i18n='settings:realMaxRange']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:showMaxRangeTooltip")} <br><br>
            <p class='perfWarning'>${i18next.t("tooltips:performanceWarning")}</p>
        `);
    },
});

// tippy("span[data-i18n='settings:copyNextFlags']", {
//     ...commonToolipsSettings,
//     onShow(tip) {
//         tip.setContent(`
//             ${i18next.t("tooltips:copyNextFlagsTooltip")}
//         `);
//     },
// });

tippy("span[data-i18n='settings:copyTarget']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:copyTargetTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:lastDigits']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:lastDigitsTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:capZoneOnHover']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:capZoneOnHoverTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:revealLayerOnHover']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:revealLayerOnHoverTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:showMainZones']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:showMainZonesTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:showMainAssets']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:showMainAssetsTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:enableFactions']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:enableFactionsTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:defaultFactions']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:defaultFactionsTooltip")}
        `);
    },
});

tippy("span[data-i18n='settings:hideLowRespawn']", {
    ...commonToolipsSettings,
    onShow(tip) {
        tip.setContent(`
            ${i18next.t("tooltips:hideLowRespawnTooltip")}
        `);
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


/* ******************* */
/* Map Button tooltips */
/* ******************* */

const commonMapMenuToolipsSettings = {
    animation: "fade",
    allowHTML: true,
    placement: "left",
    touch: false,
    theme: "menu",
    delay: [500, 0],
};

tippy(".btn-basemap", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:basemode"));
    },
});
tippy(".btn-terrainmap", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:terrainmode"));
    },
});
tippy(".btn-topomap", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:topographicmode"));
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
    onShow(tip) {
        tip.setContent(i18next.t("settings:highquality"));
    },
});
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
            <div class="tooltipsubtext">${i18next.t("tooltips:enter")}</div>
            `
        );
    },
});
tippy("#factionsButton", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:factions&Vehicles"));
    },
});

tippy(".copy-vehicle-btn", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:factions&Vehicles"));
    },
});

export const createSessionTooltips = tippy(".btn-session", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:createSession"));
    },
})[0];
export const leaveSessionTooltips =  tippy(".btn-session", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(i18next.t("tooltips:leaveSession"));
    },
})[0];
leaveSessionTooltips.disable();


tippy(".btn-undo", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:undo")}</div>
            <div class="tooltipsubtext">${i18next.t("tooltips:backspace")}</div>
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
            <div class="tooltipsubtext">CTRL+S</div>
            `
        );
    },
});

tippy(".btn-delete", {
    ...commonMapMenuToolipsSettings,
    onShow(tip) {
        tip.setContent(
            `
            <div>${i18next.t("tooltips:deleteTargets")}</div>
            <div class="tooltipsubtext">${i18next.t("tooltips:delete")}</div>
            `
        );
    },
});

// export var hostOnlyTooltip = tippy("#mapSelector", {
//     theme: "menu",
//     offset: [0, 20],
//     allowHTML: true,
//     touch: false,
//     hideOnClick: true,
//     delay: [500, 100],
//     maxWidth: 230, 
//     followCursor: true,
//     plugins: [followCursor],
//     onShow(tip) {
//         tip.setContent(i18next.t("tooltips:hostOnly"));
//     },
// })[0];
// hostOnlyTooltip.disable();


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
