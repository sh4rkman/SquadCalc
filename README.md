
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

[squadcalc.app](https://squadcalc.app/) is a mortar calculator and lane finder for the game <a href="https://joinsquad.com/">Squad</a> !  

</br>

# <div align="center">Table of Contents</div>


- [Screenshots](#screenshots)  
- [Features](#features)
  - [Mortar Calculator](#mortar-calculator)
    - [Elevations Calculations](#elevations-calculations)
    - [Spread & Damage Radiuses](#Spread-and-Damages-radiuses)
    - [Commonly Used Spot](#commonly-used-spot)
    - [Squad Mortar Overlay Compatibility](#squad-mortar-overlay-compatibility)
  - [Lane Finder](#lane-finder)
    - [Lane preview](#lane-preview)
    - [Capzones](#capzones)
    - [Auto Complete](#Auto-Complete)
  - [Others](#Others)
      - [Shared Sessions](#Shared-Sessions)
      - [Advanced Customisation & Informations](#Advanced-Customisation--Informations)
      - [Map Layers](#map-layers)

- [Attributions](#Attributions)
- [Support the project](#support-the-project)


</br>
 
# <div align="center">Screenshots</div>

</br>

<div align="center">
  <picture><img src="./src/img/github/desktop_ui_1.webp" alt="classic preview"></picture>  
  <picture><img src="./src/img/github/desktop_ui_5.webp" alt="Lane Finder preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_2.webp" alt="topographic preview"></picture>
    <picture><img src="./src/img/github/desktop_ui_6.webp" alt="capzone/mains preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_3.webp" alt="weapon information preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_4.webp" alt="calculations information preview"></picture>
  <picture><img src="./src/img/github/desktop_ui_0.webp" alt="legacy preview"></picture>
</div>

</br></br>

# <div align="center"><b>Features</b></div>

</br>

# <div align="center"><b>Mortar Calculator</b></div>


## **Elevations Calculations**

SquadCalc utilizes heightmaps extracted from the Squad SDK to precisely compute the elevation difference between mortars and targets, automatically adjusting the elevation settings.  [Check out the Wiki](https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Altitude) to understand how it works.

## **Spread and Damages radiuses**

Reduce teamkilling and maximize your damage by visualizing the spread of your shells and the range of their explosions.  
Check out the Wiki on [Spread](https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Spread) and [Damage](https://github.com/sh4rkman/SquadCalc/wiki/Deducing-Damage-Radius) to understand how it works.

<div align="center">
  <picture>
      <img width="50%" src="./src/img/github/radiuses.webp" alt="settings">
  </picture>
</div>



## **Commonly used spot**

Squadcalc is logging up to 15000 weapon positions for each map and each weapons, thus allowing to create a dynamic heatmap of where other players commonly set their weapons. If you're having trouble finding a good spot to place your mortar or weapons, activate the 'Frequent Locations' feature !

<div align="center">
  <picture><img width="60%" src="./src/img/github/heatmap.webp" alt="commonly used spots"></picture>
</div>

</br></br>
## **Squad Mortar Overlay Compatibility**

SquadCalc is compatible with [Squad Mortar Overlay](https://github.com/Devil4ngle/SquadMortarOverlay), made by [Devil4ngle](https://github.com/Devil4ngle).  
Squad Mortar Overlay is a program capturing screenshots from your ingame map and overlaying it with SquadCalc.  

It allows :
* Having ingame markers automatically merged into SquadCalc map to quickly place the right targets
* Having an ingame overlay with the current SquadCalc calculations displayed in front of Squad


</br>

### <div align="center">[> Download Squad Mortar Overlay <](https://github.com/Devil4ngle/SquadMortarOverlay/releases)</div>


</br></br>

# <div align="center"><b>Lane Finder</b></div>

<div align="center">
  <picture><img width="60%" src="./src/img/github/layer-finder.gif" alt="capzones"></picture>
</div>


## **Lane preview**

Hover over a flag to preview how selecting it would affect the layer.  
This allows you to quickly scan how the layer looks at the start of the game, for example.

## **Capzones**

SquadCalc lets you extract data for each flag from the SDK and view it in detail.  
It helps you find the perfect location for a FOB, the best route to sneak into a cap zone, or even where to fire mortars effectively.

<div align="center">
  <picture><img width="60%" src="./src/img/github/capzones.webp" alt="capzones">></picture>
</div>

## **Auto Complete**

SquadCalc will automatically complete the layer if there is only one possible incoming flag, saving you a few clicks.

<div align="center">
  <picture><img width="50%" src="./src/img/github/autocomplete.gif" alt="autocomplete"></picture>
</div>

</br></br>

# <div align="center"><b>Others</b></div>

## **Shared Sessions**

Start a shared session and invite your friends!  

Collaborate on a single map, sharing markers, weapons, and targets in real time.
Synchronize your mortar targets more efficiently, strategize together, and develop tactics seamlessly.

Sessions works up to 10 participants.

<div align="center">
  <picture><img width="100%" src="./src/img/github/sessions.webp" alt="map layers"></picture>
</div>
  


## **Advanced Customisation & Informations**

Want to see Spread radius, time of flight, distance AND bearing for each targets ? You can.  
Rather have a minimalist/non-clustered map ? you can too. Hop in settings to customise everything.

Get a better and complete understanding of your shots and visualise a simulation of the projectile path and the terrain between you and your targets. You can even see if terrain is going to block your projectiles when using low angle weapons ! (UB/GRAD) 

<div align="center">
  <picture>
      <img width="60%" src="./src/img/github/settings.webp" alt="settings">
  </picture>
    <picture>
    <img width="46%" src="./src/img/github/simulation.webp" alt="target information">
  </picture>
  <picture>
    <img width="40%" src="./src/img/github/weaponInformation.webp" alt="weapon information">
  </picture>
</div>


</br>

## **Map Layers**

<div align="center">
  <picture><img width="50%" src="./src/img/github/layers.webp" alt="map layers"></picture>
</div>

### Base map :
The classic, straight from the game base map.  

### Terrain map :
Base map enhanced with bumpmap from SDK's heightmap. Add a better comprehension of terrain.  
Also known as "why the fuck is it not the default ingame map?"

### Topographic map :
A mix of bump map, contour map with a touch of hypsometric colors for a complete understanding of map reliefs.


## **Ultra HD Maps**

<div align="center">
  <picture><img width="80%" src="./src/img/github/hdmaps.webp" alt="map layers"></picture>
  <div align="center">UHD Maps vs regular ingame map image</div>
</div>


<br>

With a single click, you can switch the map to a high-definition version powered by AI upscaling. The HD maps are 8192×8192 resolution images, letting you explore every part of the map in ultra-sharp detail right within the Leaflet interface.

## **Import/Export Your Maps**

<br>

<div align="center">
  <picture><img width="50%" src="./src/img/github/import_export.webp" alt="Map Import/Export Preview"></picture>
</div>

<br>

Easily export your map and markers to an offline file for backup or sharing. To restore them later, just drag and drop the file into SquadCalc—your markers will be instantly loaded. These files are also perfect for sharing with teammates to ensure everyone’s on the same page.




</br></br></br>
# <div align="center">Attributions</div>
</br>

* 🗺️ Map System built on **[Leaflet JS](https://leafletjs.com/)**
* 🖼️ Map Images, Icons are from SquadSDK by **[OffWorld Industries](https://www.offworldindustries.com/)**
* 🧮 Map Data is extracted thanks to **[Squad-Wiki Pipeline Map Data](https://github.com/Squad-Wiki/squad-wiki-pipeline-map-data)** SDK extractor Assets
* 🗣️ AI Text-To-Speech made with **[Luvvoice](https://luvvoice.com/)** 
* 👌🏼 Thanks to everyone supporting the project with kinds words, clever suggestions, and better code than mine
  * MK19 implementation by [Ferrariic](https://github.com/Ferrariic)
  * SquadMortarOverlay connector by [Devil4ngle](https://github.com/Devil4ngle)
  * ZH Translations by [Guducat](https://github.com/Guducat)
  * RU Translations by sitroz




</br></br></br>
# <div align="center">Support the project</div>
</br>

[![buy me a coffee](https://img.shields.io/badge/BUY%20ME%20A%20COFFEE-b12222?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/sharkman)  
[![help to translate](https://img.shields.io/badge/HELP%20TO%20TRANSLATE-111?style=for-the-badge&logo=google-translate&logoColor=white)](https://github.com/sh4rkman/SquadCalc/wiki/Translating-SquadCalc)


