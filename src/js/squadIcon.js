import { Icon } from "leaflet";

import shadowIconImg from "../img/icons/markers/marker_shadow.webp";
import DEFAULTSHADOW from "leaflet/dist/images/marker-shadow.png";

import targetIconImgEnabled from "../img/icons/markers/marker_target_enabled.webp";
import targetIconSessionImgEnabled from "../img/icons/markers/marker_target_session_enabled.webp";

import targetIconImgDisabled from "../img/icons/markers/marker_target_disabled.webp";
import targetIconImgMinimal from "../img/icons/markers/marker_target_mini.webp";
import targetIconSessionImgMinimal from "../img/icons/markers/marker_target_session_mini.webp";
import targetIconImgDisabledMinimal from "../img/icons/markers/marker_target_disabled_mini.webp";

//import mortarIconImg from ;
import hellcannonMarker from "../img/icons/markers/marker_hellcannon.webp";
import ub32Marker from "../img/icons/markers/marker_ub32.webp";
import tmortarMarker from "../img/icons/markers/marker_tmortar.webp";
import tub32Marker from "../img/icons/markers/marker_tub32.webp";
import gradMarker from "../img/icons/markers/marker_grad.webp";
import M121Marker from "../img/icons/markers/marker_m121.webp";
import Mk19Marker from "../img/icons/markers/marker_mk19.webp";

import mortarIconImg1 from "../img/icons/markers/marker_mortar_1.webp";
import mortarIconImg2 from "../img/icons/markers/marker_mortar_2.webp";

export const mortarIcon = new Icon({
    iconUrl: "./marker_mortar.webp",
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const hellIcon = new Icon({
    iconUrl: hellcannonMarker,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const ub32Icon = new Icon({
    iconUrl: ub32Marker,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const tMortarIcon = new Icon({
    iconUrl: tmortarMarker,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const tub32Icon = new Icon({
    iconUrl: tub32Marker,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const gradIcon = new Icon({
    iconUrl: gradMarker,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const m121Icon = new Icon({
    iconUrl: M121Marker,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const mk19Icon = new Icon({
    iconUrl: Mk19Marker,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const mortarIcon1 = new Icon({
    iconUrl: mortarIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export const mortarIcon2 = new Icon({
    iconUrl: mortarIconImg2,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker" 
});

export const targetIconMinimal = new Icon({
    iconUrl: targetIconImgMinimal,
    shadowUrl: DEFAULTSHADOW,
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIconSessionMinimal = new Icon({
    iconUrl: targetIconSessionImgMinimal,
    shadowUrl: DEFAULTSHADOW,
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIconMinimalDisabled = new Icon({
    iconUrl: targetIconImgDisabledMinimal,
    shadowUrl: DEFAULTSHADOW,
    shadowSize: [0, 0], // hack to avoid 404
    iconSize:     [30, 30], 
    iconAnchor:   [15, 15],
});

export const targetIcon1 = new Icon({
    iconUrl: targetIconImgEnabled,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetSessionIcon1 = new Icon({
    iconUrl: targetIconSessionImgEnabled,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconDisabled = new Icon({
    iconUrl: targetIconImgDisabled,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconDisabledAnimated = new Icon({
    iconUrl: targetIconImgDisabled,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});

export const targetIconAnimated = new Icon({
    iconUrl: targetIconImgEnabled,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
    className: "animatedTargetMarker"
});

