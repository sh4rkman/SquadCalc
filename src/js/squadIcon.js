import { Icon } from "leaflet";

import shadowIconImg from "../img/icons/marker_shadow.webp";
import mortarIconImg from "../img/icons/marker_mortar_0.webp";
import mortarIconImg1 from "../img/icons/marker_mortar_1.webp";
import mortarIconImg2 from "../img/icons/marker_mortar_2.webp";
import targetIconImg1 from "../img/icons/marker_target1.webp";


export var mortarIcon = new Icon({
    iconUrl: mortarIconImg,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export var mortarIcon1 = new Icon({
    iconUrl: mortarIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker"
});

export var mortarIcon2 = new Icon({
    iconUrl: mortarIconImg2,
    shadowUrl: shadowIconImg,
    iconSize:     [38, 47], 
    shadowSize:   [38, 47], 
    iconAnchor:   [19, 47],
    shadowAnchor: [10, 47],
    className: "animatedWeaponMarker" 
});


export var targetIcon1 = new Icon({
    iconUrl: targetIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
});


export var targetIconAnimated1 = new Icon({
    iconUrl: targetIconImg1,
    shadowUrl: shadowIconImg,
    iconSize:     [28, 34], 
    shadowSize:   [38, 34],
    iconAnchor:   [14, 34],
    shadowAnchor: [12, 34], 
    className: "animatedTargetMarker"
});
