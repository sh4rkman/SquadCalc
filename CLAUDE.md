# SquadCalc — Claude Notes

## Commands
- `npm start` — webpack dev server (localhost:3000)
- `npm run build` — production build to `/dist/`
- `npm run lint` — stylelint + htmlhint + eslint

## Stack
- **Bundler**: webpack 5, entry at `src/app.js`, output to `dist/` with `[contenthash]`
- **CSS**: SCSS modules per component, compiled via sass-loader
- **UI**: jQuery + select2 for dropdowns, Leaflet for the map
- **i18n**: i18next with http-backend, locales at `public/locales/{{lng}}/{{ns}}.json?v={{version}}`
- **Animations**: `animateCSS($el, "headShake")` from `src/js/animations.js`

## Key files
| File | Role |
|---|---|
| `src/data/weapons.js` | Weapon definitions — plain object array, mutated into `Weapon` instances at runtime |
| `src/js/squadWeapons.js` | `Weapon` class — constructor is the source of truth for which properties survive |
| `src/js/squadCalc.js` | Main app logic, weapon selector, mod filter UI |
| `src/js/squadSettings.js` | Settings system — checkbox bindings, localStorage, `isModEnabled`/`setModEnabled` helpers |
| `src/js/localization.js` | i18next init + `updateContent()` for language switches |
| `src/components/dialogs/settings.html` | Settings dialog HTML (compiled into index.html via html-loader) |
| `src/components/dialogs/settings.scss` | Settings styles incl. `.mcui-checkbox`, `#modFiltersContainer` |
| `src/components/shared/_responsive.scss` | Responsive breakpoints for dropdown heights etc. |
| `config/webpack.config.js` | Webpack config |

## Weapons data model
```js
{
    name: "WeaponName",   // used as i18next key: weapons:WeaponName
    type: "deployables" | "vehicles" | "modded",
    mod: "ModKey",        // only on modded weapons; drives per-mod filtering
    // ... physics props
    shells: [{ name, velocity, moa, ... }]
}
```
`loadWeapons()` in `squadCalc.js` replaces every plain object with `new Weapon(...)`. **Any new property added to a weapon object in `weapons.js` must also be added to the `Weapon` constructor in `squadWeapons.js`**, otherwise it's silently dropped.

## Modded weapons system
- `type: "modded"` still set on all modded weapons for legacy compat, but filtering now uses `mod:` property
- Current mods: `SuperMod`, `InfiniteWarefare`, `SteelDivision`, `SquadAdminTools`
- Each mod gets its own optgroup in the weapon dropdown (`data-mod="${modKey}"` attribute for targeting)
- Per-mod toggles appear in settings when "Enable modded weapons" is checked (`#modFiltersRow` / `#modFiltersContainer`)
- Mod display names live in `public/locales/*/settings.json` (same key as `mod:` value)
- Mod enable state stored in localStorage: `settings-mod-${modKey}`

## Settings system
- Definitions in `squadSettings.js` constructor — each has `key`, `default`, `selector`, `onChange`
- Stored in localStorage as `"1"` / `"0"`
- Checkbox animation: `animateCSS($(element), "headShake")`
- Label click handler wired via `.toggleCheckbox` class + `bindLabelClicks()`

## Locales
- Namespaces: `tooltips`, `settings`, `maps`, `weapons`, `common`, `factions`, `units`, `vehicles`
- Languages: `en`, `fr`, `de`, `ru`, `uk`, `zh`
- Cache-busted by appending `?v=${version}` (from `package.json`)
- Weapon display names: `public/locales/*/weapons.json` — key = `weapon.name`, value = display string
- Weapon names with spaces break i18next keys — use underscores (e.g. `type_63` not `Type 63`)

## Changelog
- File: `CHANGELOG.md`
- Format: shields.io badges (`-new%20features-green`, `-bug%20fixes-b22`, `-minor%20release-cd6f68`)
- Version bump also in `package.json`

## Never commit
User manages all git commits — never run `git commit`.
