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