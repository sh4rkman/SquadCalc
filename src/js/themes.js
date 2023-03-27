export const THEMES = [
    "classic",
    "dark",
    "blue",
    "green",
];

/**
 * get last theme used by user and apply it
 */
export function getTheme() {
    var theme = localStorage.getItem("data-theme");

    if (theme === null) {
        changeTheme(THEMES[0]);
        return 0;
    }

    $("body").attr("data-theme", theme);
}

/**
 * Apply theme to css
 * @param {String} theme - theme to be applied
 */
export function changeTheme(theme) {
    localStorage.setItem("data-theme", theme);
    $("body").attr("data-theme", theme);
}

/**
 * get last theme used by user and apply it
 */
export function switchTheme() {
    var theme = $("body").attr("data-theme");

    for (let i = 0; i < THEMES.length - 1; i++) {
        if (THEMES[i] === theme) {
            changeTheme(THEMES[i + 1]);
            return 0;
        }
        // we are in classic but don't know it
        changeTheme(THEMES[0]);
    }
}