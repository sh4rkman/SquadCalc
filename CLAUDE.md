# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm start` — webpack dev server (localhost:3000)
- `npm run build` — production build to `/dist/`
- `npm run lint` — stylelint + htmlhint + eslint (run once after a batch of changes, not after every edit)

## Setup
Copy `.env.template` to `.env` before first run. `API_URL` is required — default points to `https://squadcalc.app/api`.

## Architecture

### The App singleton
`src/app.js` creates the single `SquadCalc` instance and exports it as `App`. Every other module imports `{ App }` from `../app.js` to access shared state and utilities. This is the primary communication pattern — there is no event bus or prop-passing.

```js
// src/app.js
export var App = new SquadCalc(options);
App.init();

// Every other module
import { App } from "../app.js";
App.activeWeapon; // current weapon
App.userSettings; // SquadSettings instance
App.sanitize(str); // HTML escape utility (static method)
```

### Startup flow
`App.init()` → `applyUrlIntent()` branches into one of three modes:
- **Static mode** — default, user picks map/layer manually
- **Server mode** (`?server=<id>`) — loads live server data, locks the layer to what the server is playing
- **Session mode** (`?session=<id>`) — collaborative real-time session over WebSocket

### Key classes
| Class/Module | File | Role |
|---|---|---|
| `SquadCalc` | `squadCalc.js` | Main app — weapon selector, UI wiring, URL state, toast/shortcuts |
| `squadMinimap` | `squadMinimap.js` | Leaflet `Map` **extension** (not a regular class) — basemap, markers, heatmap, context menu |
| `SquadLayer` | `squadLayer.js` | Renders one game layer: objectives, capture zones, spawn groups, faction assets |
| `SquadFiringSolution` | `squadFiringSolution.js` | Ballistics engine — computes bearing, elevation (low/high), spread, time of flight from two LatLngs |
| `SquadFactions` | `squadFactions.js` | Faction/unit picker dialogs and background images |
| `SquadSession` | `squadSession.js` | WebSocket collab session (create/join/sync map state) |
| `SquadSettings` | `squadSettings.js` | Settings definitions, localStorage bindings, mod toggles |
| `squadCalcAPI.js` | `squadCalcAPI.js` | All backend fetch calls (`process.env.API_URL`) — layers, heatmap markers, health check |
| `smcConnector.js` | `smcConnector.js` | Optional WebSocket bridge to SquadMortarOverlay.exe (enabled via `SMO_WEBSOCKET=true` in `.env`) |

### Weapons data model
```js
{
    name: "WeaponName",   // i18next key: weapons:WeaponName
    type: "deployables" | "vehicles" | "modded",
    mod: "ModKey",        // modded weapons only; drives per-mod filtering
    shells: [{ name, velocity, moa, ... }]
    // ... physics props
}
```
`loadWeapons()` in `squadCalc.js` replaces every plain object with `new Weapon(...)`. **Any new property in `weapons.js` must also be added to the `Weapon` constructor in `squadWeapons.js`** — otherwise it is silently dropped.

### Modded weapons
- `type: "modded"` kept for legacy compat; filtering now uses `mod:` property
- Current mods: `SuperMod`, `InfiniteWarefare`, `SteelDivision`, `SquadAdminTools`
- Each mod gets its own `<optgroup data-mod="${modKey}">` in the weapon dropdown
- Per-mod toggles appear in settings when "Enable modded weapons" is on (`#modFiltersRow`)
- Mod display names: `public/locales/*/settings.json` (same key as `mod:` value)
- Mod enable state: localStorage key `settings-mod-${modKey}`

### Settings system
- Definitions in `SquadSettings` constructor — each entry has `key`, `default`, `selector`, `onChange`
- Stored in localStorage as `"1"` / `"0"`
- `isModEnabled(modKey)` / `setModEnabled(modKey, bool)` helpers for mod toggles
- Checkbox animation: `animateCSS($(element), "headShake")`

### Locales
- Namespaces: `tooltips`, `settings`, `maps`, `weapons`, `common`, `factions`, `units`, `vehicles`
- Languages: `en`, `fr`, `de`, `ru`, `uk`, `zh`
- Files: `public/locales/{{lng}}/{{ns}}.json`, cache-busted with `?v=${version}` from `package.json`
- Weapon display names: key = `weapon.name` value — **spaces in weapon names break i18next keys**, use underscores (e.g. `type_63` not `Type 63`)

## Stack
- **Bundler**: webpack 5, entry `src/app.js`, output `dist/` with `[contenthash]`
- **CSS**: SCSS per component via sass-loader
- **UI**: jQuery + select2 for dropdowns, Leaflet for the map
- **i18n**: i18next with http-backend
- **Animations**: `animateCSS($el, "animationName")` from `src/js/animations.js`

## Changelog
- File: `CHANGELOG.md`
- Format: shields.io badges (`-new%20features-green`, `-bug%20fixes-b22`, `-minor%20release-cd6f68`)
- Version bump also required in `package.json`

## Never commit
User manages all git commits — never run `git commit`.
