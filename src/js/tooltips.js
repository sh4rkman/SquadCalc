import tippy, {followCursor} from "tippy.js";
import "tippy.js/dist/tippy.css";


export var tooltip_save;
export var tooltip_copied;
export var tooltip_mlrs;
export var tooltip_newUI;
export var tooltip_coordPreview;

tippy("#settings", {
    allowHTML: true,
    animation: "fade",
    content: "<i class=\"fa fa-check\"></i> Copied !",
    placement: "bottom",
    theme: "new",
    trigger: "manual",
    onShow(instance) {
        setTimeout(() => {
            instance.hide();
            instance.disable();
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
    content: "Bearing </br> <span class=\"tooltipsubtext\">(where to aim)</span>",
    theme: "results",
});

tippy(".btn-delete", {
    animation: "fade",
    placement: "top",
    touch: false,
    content: "Delete all targets",
});

tippy(".btn-basemap", {
    animation: "fade",
    placement: "left",
    touch: false,
    content: "Base Map",
});

tippy(".btn-terrainmap", {
    animation: "fade",
    placement: "left",
    touch: false,
    content: "Terrain Map",
});

tippy(".btn-topomap", {
    animation: "fade",
    placement: "left",
    touch: false,
    content: "Topographic Map",
});


tippy("#elevationNum", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    content: "Elevation </br> <span class=\"tooltipsubtext\">(how far it will shoot)</span>",
    theme: "results",
});

tippy("#savebutton i", {
    animation: "fade",
    allowHTML: true,
    content: "Save </br> <span class=\"tooltipsubtext\"> (the results for later)</span>",
    interactiveDebounce: 75,
    placement: "bottom",
    theme: "results",
    touch: false,
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
    content: "Due to the weapon's minute of angle (MOA) imprecision and the length of the projectile, shots can spread in an elliptical pattern.",
});

const weaponDialog = document.getElementById("weaponInformation");
tippy(".infMOATooltip", {
    animation: "fade",
    placement: "top",
    touch: false,
    appendTo: weaponDialog,
    theme: "infTooltips",
    delay: [500, 0],

    content: "A minute of angle (MOA) in artillery measures weapon imprecision, indicating the spread of shots. One MOA equals 1/60th of a degree.",
});
tippy(".infVelocityTooltip", {
    animation: "fade",
    placement: "top",
    touch: false,
    appendTo: weaponDialog,
    theme: "infTooltips",
    delay: [500, 0],

    content: "Muzzle velocity is the speed at which a projectile leaves the barrel of a gun, measured immediately upon exit. It affects the range, and accuracy the shot.",
});
tippy(".infHeightPaddingTooltip", {
    animation: "fade",
    placement: "top",
    touch: false,
    appendTo: weaponDialog,
    theme: "infTooltips",
    delay: [500, 0],

    content: "When placing the weapon above the ground (e.g., on buildings or bridges), use this field to specify the additional height.",
});
