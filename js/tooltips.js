var tooltip_save;
var tooltip_copy;
var tooltip_copied;
var tooltip_new;

function loadToolTips() {
    tippy('#classic', {
        animation: 'fade',
        content: "Classic",
    });

    tippy('#technical', {
        animation: 'fade',
        content: "Technical",
    });

    tippy('#french', {
        allowHTML: true,
        animation: 'fade',
        arrow: false,
        content: "<div class=\"switch-field2 unselectable\"><input type=\"radio\" id=\"radio-four\" name=\"switch-two\" onchange=\"shoot()\" checked/><label id=\"classic\" for=\"radio-four\" class=\"french_mortar_selector french_mortar_selector_short\"></label><input type=\"radio\" id=\"radio-five\" name=\"switch-two\" onchange=\"shoot()\" /><label id=\"technical\" for=\"radio-five\" class=\"french_mortar_selector french_mortar_selector_medium\"></label><input type=\"radio\" id=\"radio-six\" name=\"switch-two\" onchange=\"shoot()\" /><label id=\"french\" for=\"radio-six\" class=\"french_mortar_selector french_mortar_selector_long \"></label> </div>",
        interactive: true,
        placement: "bottom",
        theme: 'french',
        trigger: 'click',
        onShown() { // Hide 'new' tooltip when user hover french mortars
            tooltip_new = document.querySelector('#french')._tippy;
            tooltip_new.hide(0);
            tooltip_new.disable();
        },
        onHide() {
            if ($("#radio-four").is(':checked')) {
                frenchSelection = 0;
            } else if ($("#radio-five").is(':checked')) {
                frenchSelection = 1;
            } else {
                frenchSelection = 2;
            }
        },
    });


    // "NEW !" ToolTip
    tippy('#french', {
        allowHTML: true,
        content: "New!",
        placement: 'bottom',
        showOnCreate: true,
        theme: 'new',
        onHidden(instance) {
            instance.disable();
        },
    });

    tippy('#settings', {
        animation: 'fade',
        content: "Click to copy to clipboard!",
        placement: 'bottom',
    });

    // initiate tooltip but hide it for now
    tooltip_copy = document.querySelector('#settings')._tippy;
    tooltip_copy.disable();


    tippy('#settings', {
        allowHTML: true,
        animation: 'fade',
        content: "<i class=\"fa fa-check\"></i> Copied !",
        placement: "bottom",
        theme: 'new',
        onShow(instance) {
            setTimeout(() => {
                instance.hide();
                instance.disable();
            }, 1500);

        }
    });
    tooltip_copied = document.querySelector('#settings')._tippy;
    tooltip_copied.disable();

    tippy('.youtube', {
        animation: 'fade',
        content: "Watch my videos!",
    });

    tippy('.github', {
        animation: 'fade',
        content: "View code on GitHub!",
    });

    tippy('.save i', {
        animation: 'fade',
        content: "Save for later",
        interactiveDebounce: 75,
        placement: 'right',
    });
    tooltip_save = document.querySelector('.save i')._tippy;
}