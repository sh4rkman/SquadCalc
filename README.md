
<h1 align="center">
    <a href="https://squadcalc.app">
      <img src="./src/img/github/logo.webp" alt="squadcalc logo">
    </a>
</h1>

<div align="center">
    <a href="https://discord.gg/BNPAc5kEJP">  
      <img src="https://img.shields.io/badge/Discord-111?style=for-the-badge&logo=discord&logoColor=white" alt="discord"></a>
    <a href="https://github.com/sh4rkman/SquadCalc/blob/master/CHANGELOG.md">  
      <img src="https://img.shields.io/badge/CHANGELOG-111?style=for-the-badge&logo=github&logoColor=white" alt="changelog"></a>
    <a href="https://github.com/sh4rkman/SquadCalc/wiki/Translating-SquadCalc">  
      <img src="https://img.shields.io/badge/TRANSLATE-111?style=for-the-badge&logo=google-translate&logoColor=white" alt="translate"></a>
    <a href="https://github.com/sh4rkman/SquadCalc/wiki">  
      <img src="https://img.shields.io/badge/WIKI-111?style=for-the-badge&logo=github&logoColor=white" alt="wiki"></a>  
</div>


</br>
</br>

[squadcalc.app](https://squadcalc.app/) is a mortar *(and more)* calculator designed for the game <a href="https://joinsquad.com/">Squad</a> !  

</br>

# <div align="center">Table of Contents</div>

1. [Screenshots](#screenshots)
2. [Features](#features)
   - [Elevations Calculations](#elevations-calculations)
   - [Map Layers](#map-layers)
   - [Commonly Used Spot](#commonly-used-spot)
   - [Advanced Information & Simulation](#advanced-informations--simulation)
   - [Advanced Customisation](#advanced-customisation)
3. [Squad Mortar Overlay Compatibility](#squad-mortar-overlay-compatibility)
4. [Weapons Support](#weapons-support)
4. [Support the project](#support-the-project)


</br>
 
# <div align="center">Screenshots</div>

</br>

<div align="center">
  <picture><img src="./src/img/github/desktop_ui_1.webp" alt="classic preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_2.webp" alt="topographic preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_3.webp" alt="weapon information preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_4.webp" alt="calculations information preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_0.webp" alt="legacy preview"></picture>
</div>

</br></br>

# <div align="center">Features</div>


## **Elevations Calculations**

SquadCalc utilizes heightmaps extracted from the Squad SDK to precisely compute the elevation difference between mortars and targets, automatically adjusting the elevation settings. [Check out the Wiki](https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Altitude) to understand how it works.


## **Map Layers**

<div align="center">
  <picture><img src="./src/img/github/layers.webp" alt="map layers"></picture>
</div>

### Base map :
The classic, straight from the game base map.  
Also avaiblable in AI Upscaled 8192x8192 pixels though the Settings. 

### Terrain map :
Base map enhanced with bumpmap from SDK's heightmap. Add a better comprehension of terrain.  
Also known as "why the fuck is it not the default ingame map?"

### Topographic map :
A mix of bump map, contour map with a touch of hypsometric colors for a complete understanding of map reliefs.


## **Commonly used spot**

If you're having trouble finding a good spot to place your mortar or weapons, activate the 'Frequent Locations' feature to see where other players commonly set theirs!

<div align="center">
  <picture><img src="./src/img/github/heatmap.webp" alt="commonly used spots"></picture>
</div>

## **Advanced informations & Simulation**

Get a better and complete understanding of your shots and visualise a simulation of the projectile path and the terrain between you and your targets. 
You can even see if terrain is going to block your projectiles when using low angle weapons ! (UB/GRAD) 

<div align="center">
  <picture>
    <img src="./src/img/github/simulation.webp" alt="target information">
  </picture>
  <picture>
    <img src="./src/img/github/weaponInformation.webp" alt="weapon information">
  </picture>
</div>

## **Advanced customisation**

Want to see Spread radius, time of flight, distance AND bearing for each targets ? You can.  
Rather have a minimalist/non-clustered map ? you can too. Hop in settings to customise everything.

<div align="center">
  <picture>
      <img src="./src/img/github/settings.webp" alt="settings">
  </picture>
</div>


</br></br>
# <div align="center">Squad Mortar Overlay Compatibility</div>

SquadCalc is compatible with [Squad Mortar Overlay](https://github.com/Devil4ngle/SquadMortarOverlay), made by [Devil4ngle](https://github.com/Devil4ngle).  
Squad Mortar Overlay is a program capturing screenshots from your ingame map and overlaying it with SquadCalc.  

It allows :
* Having ingame markers automatically merged into SquadCalc map to quickly place the right targets
* Having an ingame overlay with the current SquadCalc calculations displayed in front of Squad

### [>> Download Squad Mortar Overlay last version <<](https://github.com/Devil4ngle/SquadMortarOverlay/releases)

</br>

<div align="center">
  <picture><img src="./src/img/github/squadmortaroverlay.webp" alt="squad mortar overlay">></picture>
</div>



</br></br></br>
# <div align="center">Weapons Support</div>
</br>

|ICON |       **NAME**   | Range |
|--------|-------|-------|
|<img height="35" src="./src/img/icons/mortar.png">| Mortar | 1237m |
|<img height="35" src="./src/img/icons/ub32_deployable.png">| UB-32 | 2245m |
|<img height="35" src="./src/img/icons/hellcannon_white.png">| Hell Canon | 923m |
|<img height="35" src="./src/img/icons/technical_mortar_white.png">| Technicals Mortars | 1237m |
|<img height="30" src="./src/img/icons/ub32_white.png">| Technicals/BRDM UB-32 | 2245m |
|<img height="35" src="./src/img/icons/mlrs_white.png">| BM-21 Grad | 2045m |
|<img height="35" src="./src/img/icons/m113a3_white.png">| M1064-A3 120mm | 2062m |
|<img height="35" src="./src/img/icons/mk19_rws_white.png">| MK-19 RWS *(Experimental)* | 5647m |  


</br></br>
# Support the project
</br>

[![buy me a coffee](https://img.shields.io/badge/BUY%20ME%20A%20COFFEE-b12222?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/sharkman)  

[![help to translate](https://img.shields.io/badge/HELP%20TO%20TRANSLATE-111?style=for-the-badge&logo=google-translate&logoColor=white)](https://buymeacoffee.com/sharkman)
