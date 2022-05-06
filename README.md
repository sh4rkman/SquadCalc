
 <p align="center">
   <img width="500" height="250" src="https://i.imgur.com/AvOk3yK.png">
 </p>

<p align="center">


</p>

<p align="center">
  <a href="https://github.com/sh4rkman/MSMC/blob/master/LICENSE"><img src="https://img.shields.io/github/license/Naereen/StrapDown.js.svg" alt="Licence"></a>
</p>
<p align="center">
  <a href="https://validator.w3.org/nu/?doc=https%3A%2F%2Fmortar.sharkman.info%2F"><img src="https://img.shields.io/badge/W3C-Good-green.svg" alt="W3C"></a>
  <a href="https://deepscan.io/dashboard#view=project&tid=12376&pid=15404&bid=306486"><img src="https://deepscan.io/api/teams/12376/projects/15404/branches/306486/badge/grade.svg" alt="Deepscan"></a>
  <a href="https://www.codefactor.io/repository/github/sh4rkman/msmc"><img src="https://www.codefactor.io/repository/github/sh4rkman/msmc/badge" alt="CodeFactor"></a>
</p>



</br>

# **Introduction**

## **MSMC** : A Minimalist Squad Mortar Calculator

</br>

**MSMC** is a simple, easy on the eyes mortar calculator for <a href="https://joinsquad.com/">Squad</a>.  
It allows quick mortars calculations without fancy map, buttons and icons.
 
</br>

Select a map, enter locations, shoot.

</br>
 
 
<p align="center">
  <img width="400" height="284" src="https://i.imgur.com/icCrf1q.png">
  <img width="150" height="284" src="https://i.imgur.com/05Iszff.png">
</p>

# **Features**


## **Elevations Calculations**

MSMC is using heightmaps from Squad SDK to calculate the height difference between mortars and targets and ajust automatically the elevation.  
If your target is up a hill, MSMC will make sure you don't waste 1000 ammo points 20 meters off that enemy HAB.

Heightmaps are hidden : simply pick your map from the list and shoot.

</br>

<p align="center">
  <img width="150" height="150" src="https://github.com/sh4rkman/MSMC/blob/master/src/img/heightmaps/gorodok.jpg?raw=true">
  <img width="150" height="150" src="https://github.com/sh4rkman/MSMC/blob/master/src/img/heightmaps/tallil.jpg?raw=true">
</p>
<p align="center"><sub><sup>Examples of Heightmaps used for caculations (Gorodok & Tallil)</sub></sup></p>


</br>

## **Different Weapons Support**

</br>


MSMC support different type of mortars :
- Classics mortars
- Technicals mortars
- Long range (3000m) 120mm mortars from the <a href="https://smf.tactical-collective.com/">French Mod</a>

 </br>
 <p align="center">
   <img width="229" height="43" src="https://i.imgur.com/QVUnpec.png">
 </p>

 </br></br>


## **Calculation Saving**

</br>

Save up to three calcs for later :

 </br>

 <p align="center">
   <img width="523" height="399" src="https://i.imgur.com/24gnFal.gif">
 </p>

 </br></br>

# Installation
</br>


## Clone and install

```
git clone https://github.com/sh4rkman/MSMC.git
cd MSMC
npm install
```

## Development
```
npm run start
```

## Building production bundle
```
npm run build
```

</br></br>

# Thanks

This project is **largely** inspired by the work of Endebert on <a href="https://github.com/Endebert/squadmc">SquadMC</a>.  
I wanted a lighter alternative to this great tool, some could say this project is just a new interface to squadmc calculation code.


