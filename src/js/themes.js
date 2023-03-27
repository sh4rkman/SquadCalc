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
        return 1;
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