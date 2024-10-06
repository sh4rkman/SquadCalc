
<h1 align="center">
    <a href="https://squadcalc.app">
      <img src="./src/img/github/logo.webp" alt="squadcalc logo">
    </a>
</h1>

<div align="center">
    <a href="https://github.com/sh4rkman/SquadCalc?tab=MIT-1-ov-file#readme">  
      <img src="https://img.shields.io/github/license/Naereen/StrapDown.js.svg?style=for-the-badge" alt="Licence"></a>
    <a href="https://squadcalc.app">  
      <img src="https://up.sharkman.info/api/badge/3/uptime/24?style=for-the-badge" alt="Uptime"></a>
    <a href="https://buymeacoffee.com/sharkman">  
      <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-b12222?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white" alt="Uptime"></a>
</div>

<div align="center">
    <a href="https://github.com/sh4rkman/SquadCalc/issues/new">🪳 Report a Bug</a> &nbsp;&bull;&nbsp;
    <a href="https://github.com/sh4rkman/SquadCalc/wiki/Translating-SquadCalc"> 📜 Help to Translate</a> &nbsp;&bull;&nbsp;
    <a href="https://github.com/sh4rkman/SquadCalc/wiki">📖 Wiki</a> &nbsp;&bull;&nbsp;
    <a href="https://github.com/sh4rkman/SquadCalc/blob/master/CHANGELOG.md">🆕 ChangeLog</a>
</div>

</br>
</br>



[squadcalc.app](https://squadcalc.app/) is a mortar *(and more)* calculator designed for the game <a href="https://joinsquad.com/">Squad</a> !  

</br>
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
4. [Map & Weapons Support](#map--weapons-support)


</br>
 
# <div align="center">Screenshots</div>

</br>

<div align="center">

  ![image](./src/img/github/desktop_ui_1.webp)
  ![image](./src/img/github/desktop_ui_2.webp)
  ![image](./src/img/github/desktop_ui_3.webp)
  ![image](./src/img/github/desktop_ui_4.webp)
  ![image](./src/img/github/desktop_ui_0.webp)

</div>

</br></br>

# <div align="center">Features</div>


## **Elevations Calculations**

SquadCalc utilizes heightmaps extracted from the Squad SDK to precisely compute the elevation difference between mortars and targets, automatically adjusting the elevation settings. [Check out the Wiki](https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Altitude) to understand how it works.


## **Map Layers**

<div align="center">
  <picture>
    <img src="./src/img/github/layers.webp" alt="base map">
  </picture>
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
  <picture>
    <img src="./src/img/github/heatmap.webp" alt="target information">
  </picture>
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
      <img src="./src/img/github/settings.webp">
  </picture>
</div>


</br></br>
# <div align="center">Squad Mortar Overlay Compatibility</div>

SquadCalc is compatible with [Squad Mortar Overlay](https://github.com/Devil4ngle/SquadMortarOverlay), made by [Devil4ngle](https://github.com/Devil4ngle).  
Squad Mortar Overlay is a program capturing screenshots from your ingame map and overlaying it with SquadCalc.  

It allows :
* Having ingame markers automatically merged into SquadCalc map to quickly place the right targets
* Having an ingame overlay with the current SquadCalc calculations displayed in front of Squad


<div align="center">
  <picture>
      <img src="./src/img/github/squadmortaroverlay.webp">
  </picture>
</div>



</br></br>


# <div align="center">Map & Weapons Support</div>

|                                   |       **SUPPORTED WEAPONS**   |                                            |
|-------------------------------------------------------------------|-------------------------|------------------|
|<img height="40" src="./src/img/icons/mortar.png">                 | Mortars                 |     ✅          |
|<img height="40" src="./src/img/icons/ub32_deployable.png">        | UB-32                   |     ✅          |
|<img height="40" src="./src/img/icons/hellcannon_white.png">       | Hell Canon              |     ✅          |
|<img height="40" src="./src/img/icons/technical_mortar_white.png"> | Technicals mortars      |     ✅          |
|<img height="40" src="./src/img/icons/ub32_white.png">             | Technicals/BRDM UB-32   |     ✅          |
|<img height="40" src="./src/img/icons/mlrs_white.png">             | BM-21 Grad              |     ✅          |
|<img height="40" src="./src/img/icons/m113a3_white.png">           | M1064-A3 120mm          |     ✅          |
|<img height="40" src="./src/img/icons/mk19_rws_white.png">         | MK-19 RWS (Experimental)|     ✅          |


|     |         **SUPPORTED MAPS**            |
|-----------------------------|---------------------|
| ✅ | Al Basrah, Anvil, Anvil, Belaya, Black Coast, Chora, Fallujah, Fool's Road, Goose Bay, Gorodok, Gorodok, Harju, Jensen's Range, Kamdesh Highlands, Kohat Toi, Kokan, Lashkar Valley, Logar Valley, Manicouagan, Mestia, Mutaha, Narva, Sanxian Islands, Skorpo, Sumari Bala, Tallil Outskirts, Yehorivka       |
| ❌ | Narva (flooded), Pacific Proving Grounds    |          