/* eslint-disable no-unused-vars */
import { setFrenchSelection } from "./utils";
import { globalData } from "./conf";
import { WEAPONS } from "./weapons";

import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";


export var tooltip_save;
export var tooltip_copy;
export var tooltip_copied;
export var tooltip_mlrs;

tippy("#classic", {
    animation: "fade",
    content: "Classic",
    theme: "weaponsTooltip",
});

tippy("#hell", {
    animation: "fade",
    content: "Hell Cannon",
    theme: "weaponsTooltip",
});

tippy("#technical", {
    animation: "fade",
    content: "Technical",
    theme: "weaponsTooltip",
});

if (localStorage.getItem("MLRS") !== "true") {
    tippy("#mlrs", {
        animation: "fade",
        content: "new!",
        theme: "new",
        onShow() {
            localStorage.setItem("MLRS", true);
        },
    });
    tooltip_mlrs = document.querySelector("#mlrs")._tippy;
    tooltip_mlrs.show();
}

tippy("#mlrs", {
    animation: "fade",
    content: "MLRS",
    theme: "weaponsTooltip",
    onShow() {
        if (tooltip_mlrs) {
            tooltip_mlrs.hide();
            tooltip_mlrs.disable();
        }
    },
});

tippy("#french", {
    allowHTML: true,
    animation: "fade",
    content: "120mm</br> <font size=\"1em\">(Squad MOD France)</font>",
    theme: "120mm",
});

tippy("#french", {
    allowHTML: true,
    animation: "fade",
    arrow: false,
    content: "<div class=\"switch-field2 unselectable\"><input type=\"radio\" id=\"4\" name=\"switch-two\" checked/><label id=\"classic\" for=\"4\" class=\"french_mortar_selector french_mortar_selector_short\"></label><input type=\"radio\" id=\"5\" name=\"switch-two\"/><label id=\"technical\" for=\"5\" class=\"french_mortar_selector french_mortar_selector_medium\"></label><input type=\"radio\" id=\"6\" name=\"switch-two\"/><label id=\"french\" for=\"6\" class=\"french_mortar_selector french_mortar_selector_long \"></label> </div>",
    interactive: true,
    placement: "bottom",
    theme: "french",
    trigger: "click",
    onHide() {
        globalData.activeWeapon = WEAPONS[$(".switch-field2 > input:checked").attr("id")];
        localStorage.setItem("data-weapon", $(".switch-field2 > input:checked").attr("id"));
    },
});

tippy("#settings", {
    animation: "fade",
    content: "Click results to copy to clipboard and share it ingame!",
    delay: [100, 10000000000],
    hideOnClick: "toggle",
    placement: "bottom",
});

// initiate tooltip but hide it for now
tooltip_copy = document.querySelector("#settings")._tippy;
tooltip_copy.disable();


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

tippy("#bearing", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
    content: "Bearing </br> <span class=\"tooltipsubtext\">(where to aim)</span>",
    theme: "results",
});

tippy("#elevation", {
    animation: "fade",
    placement: "bottom",
    allowHTML: true,
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



tippy(".save i", {
    animation: "fade",
    allowHTML: true,
    content: "Save </br> <span class=\"tooltipsubtext\"> (the results for later)</span> ",
    interactiveDebounce: 75,
    placement: "bottom",
    theme: "results"
});
tooltip_save = document.querySelector(".save i")._tippy;