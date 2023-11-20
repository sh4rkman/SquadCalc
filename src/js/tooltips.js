import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";


export var tooltip_save;
export var tooltip_copied;
export var tooltip_mlrs;
export var tooltip_newUI;

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

tippy("#elevationNum", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    touch: false,
    content: "Elevation </br> <span class=\"tooltipsubtext\">(how far it will shoot)</span>",
    theme: "results",
});

tippy(".fab-action-1", {
    animation: "fade",
    allowHTML: true,
    content: "View code on </br>GitHub",
    theme: "fab",
});
tippy(".fab-action-2", {
    animation: "fade",
    allowHTML: true,
    content: "Change </br>Theme",
    theme: "fab",
});
tippy(".fab-action-3", {
    placement: "left-start",
    animation: "fade",
    allowHTML: true,
    content: "Watch my </br>Videos!",
    theme: "fab",
});
tippy(".fab-action-4", {
    placement: "left",
    animation: "fade",
    allowHTML: true,
    content: "Report a </br>Bug",
    theme: "fab",
});


if ($(window).width() > 767) {
    if(!localStorage.getItem("InfoToolTips_uimode")) {
        tippy(".fab2", {
            placement: "right",
            animation: "fade",
            allowHTML: true,
            content: "Map Mode </br> (beta)",
            theme: "fab",
        });
        tooltip_newUI = document.querySelector(".fab2")._tippy
        tooltip_newUI.show()
    }
}



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