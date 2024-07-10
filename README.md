

![image](./src/img/github/logo.webp)


 <a href="https://github.com/sh4rkman/SquadCalc/blob/master/LICENSE"><img src="https://img.shields.io/github/license/Naereen/StrapDown.js.svg" alt="Licence"></a>
<a href="https://validator.w3.org/nu/?doc=https%3A%2F%2Fsquadcalc.app%2F"><img src="https://img.shields.io/badge/W3C-Good-green.svg" alt="W3C"></a>
<a href="https://deepscan.io/dashboard#view=project&tid=12376&pid=25781&bid=811276"><img src="https://deepscan.io/api/teams/12376/projects/25781/branches/811276/badge/grade.svg" alt="DeepScan grade"></a>
<a href="https://www.codefactor.io/repository/github/sh4rkman/squadcalc"><img src="https://www.codefactor.io/repository/github/sh4rkman/squadcalc/badge" alt="CodeFactor"></a>


</br>
</br>


# Introduction


</br>


Squadcalc.app is a mortar calculator designed specifically for the game <a href="https://joinsquad.com/">Squad</a>.  
This tool facilitates rapid mortar calculations through two distinct modes:
1. **Interactive Map Mode:** This mode enables users to intuitively add visual targets by double-clicking on the map, allowing easy manipulation of weapons and targets through drag-and-drop functionality.

2. **Simple Legacy Mode:** For a straightforward approach, the legacy mode allows users to swiftly enter keypad inputs without the complexity of maps, buttons, or icons.
 


</br>
 
# **Screenshots**

</br>


![image](./src/img/github/desktop_ui.webp)
![image](./src/img/github/desktop_ui_2.webp)
![image](./src/img/github/desktop.webp)



</br></br>

# **Features**


## **Elevations Calculations**

SquadCalc utilizes heightmaps extracted from the Squad SDK to precisely compute the elevation difference between mortars and targets, automatically adjusting the elevation settings. 


## **Map Layers**

### Base map :
The classic, straight from the game base map.  


<picture>
  <img src="./src/img/github/basemap.webp" alt="base map">
</picture>

### Terrain map :
Base map enhanced with bumpmap from SDK's heightmap. Add a better comprehension of terrain.  
Also known as "why the fuck is it not the default ingame map?"


<picture>
  <img src="./src/img/github/terrainmap.webp" alt="terrain map">
</picture>

### Topographic map :
A mix of bump map, contour map with a touch of hypsometric colors for a complete understanding of map reliefs.

<picture>
  <img src="./src/img/github/topomap.webp" alt="topographic map">
</picture>


## **Advanced informations & Simulation**

Get a better and complete understanding of your shots and visualise a simulation of the projectile path and the terrain between you and your targets. 
You can even see if terrain is going to block your projectiles when using low angle weapons ! (UB/GRAD) 


<picture>
  <img src="./src/img/github/simulation.webp" alt="target information">
</picture>

<picture>
  <img src="./src/img/github/weaponInformation.webp" alt="weapon information">
</picture>

## **Advanced customisation**

Want to see Spread radius, time of flight, distance AND bearing for each targets ? You can.  
Rather have a minimalist/non-clustered map ? you can too. Hop in settings to customise everything.

<picture>
    <img src="./src/img/github/settings.webp">
</picture>

</br></br>


# **Map & Weapons Support**


|                                   |       **WEAPONS**     |                                                    |
|-------------------------------------------------------------------|-----------------------|--------------------|
|<img height="40" src="./src/img/icons/mortar.png">                 | Mortars               |        ✅          |
|<img height="40" src="./src/img/icons/ub32_deployable.png">        | UB-32                 |        ✅          |
|<img height="40" src="./src/img/icons/hellcannon_white.png">       | Hell Canon            |        ✅          |
|<img height="40" src="./src/img/icons/technical_mortar_white.png"> | Technicals mortars    |        ✅          |
|<img height="40" src="./src/img/icons/ub32_white.png">             | Technicals/BRDM UB-32 |        ✅          |
|<img height="40" src="./src/img/icons/mlrs_white.png">             | BM-21 Grad            |        ✅          |
|<img height="40" src="./src/img/icons/m113a3_white.png">           | M1064-A3 120mm        |        ✅          |



| **MAPS**                    |                     |
|-----------------------------|---------------------|
| Al Basrah                   |         ✅          |
| Anvil                       |         ✅          |
| Belaya                      |         ✅          |
| Black Coast                 |         ✅          |
| Chora                       |         ✅          |
| Fallujah                    |         ✅          |
| Fool's Road                 |         ✅          |
| Goose Bay                   |         ✅          |
| Gorodok                     |         ✅          |
| Harju                       |         ✅          |
| Jensen's Range              |         ❌          |
| Kamdesh Highlands           |         ✅          |
| Kohat Toi                   |         ✅          |
| Kokan                       |         ✅          |
| Lashkar Valley              |         ✅          |
| Logar Valley                |         ✅          |
| Manicouagan                 |         ✅          |
| Mestia                      |         ✅          |
| Mutaha                      |         ✅          |
| Narva                       |         ✅          |
| Narva (flooded)             |         ❌          |
| Pacific Proving Grounds     |         ❌          |
| Sanxian Islands             |         ✅          |
| Skorpo                      |         ✅          |
| Sumari Bala                 |         ✅          |
| Tallil Outskirts            |         ✅          |
| Yehorivka                   |         ✅          |


</br></br>

# Installation



## Clone and install

```
git clone https://github.com/sh4rkman/SquadCalc.git
cd SquadCalc
npm ci
```

## Running a development local server
```
npm run start
```

## Building production bundle
</br>


For a final production environnement :
```
npm run build:prod
```
