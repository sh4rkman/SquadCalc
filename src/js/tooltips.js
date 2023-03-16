/* eslint-disable no-unused-vars */
import { setFrenchSelection } from "./utils";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

export var tooltip_save;
export var tooltip_copy;
export var tooltip_copied;
export var tooltip_mlrs;

tippy("#classic", {
    animation: "fade",
    content: "Classic",
});

tippy("#hell", {
    animation: "fade",
    content: "Hell Cannon",
});

tippy("#technical", {
    animation: "fade",
    content: "Technical",
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
    content: "<div class=\"switch-field2 unselectable\"><input type=\"radio\" id=\"radio-five\" name=\"switch-two\" checked/><label id=\"classic\" for=\"radio-five\" class=\"french_mortar_selector french_mortar_selector_short\"></label><input type=\"radio\" id=\"radio-six\" name=\"switch-two\"/><label id=\"technical\" for=\"radio-six\" class=\"french_mortar_selector french_mortar_selector_medium\"></label><input type=\"radio\" id=\"radio-seven\" name=\"switch-two\"/><label id=\"french\" for=\"radio-seven\" class=\"french_mortar_selector french_mortar_selector_long \"></label> </div>",
    interactive: true,
    placement: "bottom",
    theme: "french",
    trigger: "click",
    onHide() {
        if ($("#radio-five").is(":checked")) {
            setFrenchSelection(0);
        } else if ($("#radio-six").is(":checked")) {
            setFrenchSelection(1);
        } else {
            setFrenchSelection(2);
        }
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


if (localStorage.getItem("InfoToolTips_save") !== "true") {
    tippy(".save i", {
        animation: "fade",
        content: "Save for later",
        interactiveDebounce: 75,
        placement: "right",
    });
    tooltip_save = document.querySelector(".save i")._tippy;
}