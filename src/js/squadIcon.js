import { Icon } from "leaflet";

//import DEFAULTSHADOW from "leaflet/dist/images/marker-shadow.png";

export const mortarIcon = new Icon({
    iconUrl: "../img/markers/weapons/marker_mortar.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});


export const mortarIcon1 = new Icon({
    iconUrl: "../img/markers/weapons/marker_mortar_1.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const mortarIcon2 = new Icon({
    iconUrl: "../img/markers/weapons/marker_mortar_2.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker" 
});

export const targetIconMinimal = new Icon({
    iconUrl: "../img/markers/targets/marker_target_mini.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIconSessionMinimal = new Icon({
    iconUrl: "../img/markers/targets/marker_target_session_mini.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIconMinimalDisabled = new Icon({
    iconUrl: "../img/markers/targets/marker_target_disabled_mini.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIcon1 = new Icon({
    iconUrl: "../img/markers/targets/marker_target_enabled.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetSessionIcon1 = new Icon({
    iconUrl: "../img/markers/targets/marker_target_session_enabled.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconDisabled = new Icon({
    iconUrl: "../img/markers/targets/marker_target_disabled.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconDisabledAnimated = new Icon({
    iconUrl: "../img/markers/targets/marker_target_disabled.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconAnimated = new Icon({
    iconUrl: "../img/markers/targets/marker_target_enabled.webp",
    shadowUrl: "/img/markers/targets/marker_shadow.webp",
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
    className: "animatedTargetMarker"
});