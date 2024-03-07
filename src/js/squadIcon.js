import L from "leaflet";

import shadowIconImg from "../img/icons/marker_shadow.png";
import mortarIconImg from "../img/icons/marker_mortar_0.png";
import mortarIconImg1 from "../img/icons/marker_mortar_1.png";
import mortarIconImg2 from "../img/icons/marker_mortar_2.png";
import targetIconImg1 from "../img/icons/marker_target1.png";


export var mortarIcon = L.icon({
    iconUrl: mortarIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export var mortarIcon1 = L.icon({
    iconUrl: mortarIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export var mortarIcon2 = L.icon({
    iconUrl: mortarIconImg2,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker" 
});


export var targetIcon1 = L.icon({
    iconUrl: targetIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});


export var targetIconAnimated1 = L.icon({
    iconUrl: targetIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
    className: "animatedTargetMarker"
});
