import { Icon } from "leaflet";

import DEFAULTSHADOW from "leaflet/dist/images/marker-shadow.png";

export const mortarIcon = new Icon({
    iconUrl: "../img/markers/marker_mortar.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const hellIcon = new Icon({
    iconUrl: "../img/markers/marker_hellcannon.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const ub32Icon = new Icon({
    iconUrl: "../img/markers/marker_ub32.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const tMortarIcon = new Icon({
    iconUrl: "../img/markers/marker_tmortar.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const tub32Icon = new Icon({
    iconUrl: "../img/markers/marker_tub32.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const gradIcon = new Icon({
    iconUrl: "../img/markers/marker_grad.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const m121Icon = new Icon({
    iconUrl: "../img/markers/marker_m121.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const mk19Icon = new Icon({
    iconUrl: "../img/markers/marker_mk19.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const mortarIcon1 = new Icon({
    iconUrl: "../img/markers/marker_mortar_1.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const mortarIcon2 = new Icon({
    iconUrl: "../img/markers/marker_mortar_2.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker" 
});

export const targetIconMinimal = new Icon({
    iconUrl: "../img/markers/marker_target_mini.webp",
    shadowUrl: DEFAULTSHADOW,
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIconSessionMinimal = new Icon({
    iconUrl: "../img/markers/marker_target_session_mini.webp",
    shadowUrl: DEFAULTSHADOW,
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIconMinimalDisabled = new Icon({
    iconUrl: "../img/markers/marker_target_disabled_mini.webp",
    shadowUrl: DEFAULTSHADOW,
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIcon1 = new Icon({
    iconUrl: "../img/markers/marker_target_enabled.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetSessionIcon1 = new Icon({
    iconUrl: "../img/markers/marker_target_session_enabled.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconDisabled = new Icon({
    iconUrl: "../img/markers/marker_target_disabled.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconDisabledAnimated = new Icon({
    iconUrl: "../img/markers/marker_target_disabled.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconAnimated = new Icon({
    iconUrl: "../img/markers/marker_target_enabled.webp",
    shadowUrl: "../img/markers/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
    className: "animatedTargetMarker"
});