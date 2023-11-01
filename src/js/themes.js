export const THEMES = [
    "#111111", // classic
    "#000000", // dark
    "#000031", // blue
    "#031a00", // green
    "#3f0000", // red
];



/**
 * get last theme used by user and apply it
 */
export function loadTheme() {
    var theme = localStorage.getItem("data-theme");

    if (!CSS.supports("color", theme) ){
        localStorage.setItem("data-theme", "#111111");
        theme = "#111111";
    }

    document.documentElement.style.setProperty("--themecolor", theme);
}


/**
 * get last theme used by user and apply it
 */
export function switchTheme() {
    var theme = localStorage.getItem("data-theme");

    for (let i = 0; i < THEMES.length - 1; i++) {
        if (THEMES[i] === theme) {
            changeTheme(THEMES[i + 1]);
            return 0;
        }
        // we are in classic but don't know it
        changeTheme(THEMES[0]);
    }
}


/**
 * Apply theme to css
 * @param {String} theme - theme to be applied
 */
export function changeTheme(theme) {
    localStorage.setItem("data-theme", theme);
    document.documentElement.style.setProperty("--themecolor", theme);
}