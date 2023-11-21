
<p align="center">
  <img width="500" height="250" src="./src/img/github/logo.png">
</p>


<p align="center">
  <a href="https://github.com/sh4rkman/SquadCalc/blob/master/LICENSE"><img src="https://img.shields.io/github/license/Naereen/StrapDown.js.svg" alt="Licence"></a>
  <a href="https://validator.w3.org/nu/?doc=https%3A%2F%2Fsquadcalc.app%2F"><img src="https://img.shields.io/badge/W3C-Good-green.svg" alt="W3C"></a>
  <a href="https://deepscan.io/dashboard#view=project&tid=12376&pid=25781&bid=811276"><img src="https://deepscan.io/api/teams/12376/projects/25781/branches/811276/badge/grade.svg" alt="DeepScan grade"></a>
  <a href="https://www.codefactor.io/repository/github/sh4rkman/squadcalc"><img src="https://www.codefactor.io/repository/github/sh4rkman/squadcalc/badge" alt="CodeFactor"></a>
</p>

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

 <p align="center">
  <img width="600" height="426" src="./src/img/github/desktop_ui.png">
  <img width="224" height="426" src="./src/img/github/mobile_ui.png">
</p>
 
<p align="center">
  <img width="600" height="426" src="./src/img/github/desktop.png">
  <img width="224" height="426" src="./src/img/github/mobile.png">
</p>


</br></br>

# **Features**


### **Elevations Calculations**

SquadCalc utilizes heightmaps extracted from the Squad SDK to precisely compute the elevation difference between mortars and targets, automatically adjusting the elevation settings. 



### **Map & Weapons Support**


| **Weapons**      |           |
|-----------------------|--------------------|
| Mortars               |        ✅          |
| UB-32                 |          ✅        |
| Hell Canon            |           ✅       |
| Technicals mortars    |        ✅            |
| Technicals/BRDM UB-32 |      ✅              |
| BM-21 Grad            |      ✅             |



| **Maps**                     |                |
|-----------------------------|----------------|
| Al Basrah                   |        ✅           |
| Anvil                       |        ✅           |
| Belaya                      |       ✅               |
| Black Coast                 |        ✅           |
| Chora                       |       ✅            |
| Fallujah                    |      ✅             |
| Fool's Road                 |       ✅            |
| Goose Bay                   |       ✅            |
| Gorodok                     |        ✅           |
| Harju                       |         ✅          |
| Jensen's Range              |            ❌       |
| Kamdesh Highlands           |         ✅          |
| Kohat Toi                   |         ✅          |
| Kokan                       |        ✅           |
| Lashkar Valley              |         ✅          |
| Logar Valley                |        ✅           |
| Manicouagan                 |        ✅           |
| Mestia                      |         ✅          |
| Mutaha                      |        ✅           |
| Narva                       |          ✅         |
| Pacific Proving Grounds     |         ❌          |
| Sanxian Islands             |      WIP             |
| Skorpo                      |        ✅           |
| Sumari Bala                 |      ✅             |
| Tallil Outskirts            |       ✅            |
| Yehorivka                   |       ✅            |


</br></br>

# Installation
</br>


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

for a preprod environnement (robots.txt disallow all):
```
npm run build:dev
```
</br>

for a final production environnement :
```
npm run build:prod
```

</br></br>



# Thanks

This project is **largely** inspired by the work of Endebert on <a href="https://github.com/Endebert/squadmc">SquadMC</a>.  
I wanted a lighter alternative to this great tool, some could say this project is just a new interface to squadmc calculation code.
