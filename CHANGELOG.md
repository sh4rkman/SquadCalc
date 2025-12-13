# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **40.1.0** *(2025-12-13)*

</br><img src="https://img.shields.io/badge/-bug%20fixes-b22">  
- Fixed a text no updating when swithing language *([#415](https://github.com/sh4rkman/SquadCalc/issues/415))*

</br><img src="https://img.shields.io/badge/-%20improv%20-orange"> 
- Server search now use fuzzy matching so typos are more forgiving and still return results

</br><img src="https://img.shields.io/badge/-other%20-grey">
- Settings code fully reworked by Metroseksuaali *([#274](https://github.com/sh4rkman/SquadCalc/issues/274))*  
- Added a [BattleMetrics.com](https://www.battlemetrics.com/) attribution link in the server browser
- Updated readme

</br></br><!-- CHANGELOG SPLIT MARKER -->
# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge"> **41.0.0** *(2025-12-03)*


</br><img src="https://img.shields.io/badge/-new%20features-green"> 

- **Server Browser & Server Syncing** *([#394](https://github.com/sh4rkman/SquadCalc/issues/394))*  

You can now browse the list of active servers and select the one you’re playing on. SquadCalc will automatically update the current layer, factions, and units to match the selected server. If the server changes the map, SquadCalc will detect it and update the layer accordingly as soon as possible. *(thanks Takyon Scure, C-BoT-AU!)*

- **BTR4 AGS30**  

Added the new Ukrainian BTR-4 equipped with the AGS-30 grenade launcher to the mortar calculator.


</br><img src="https://img.shields.io/badge/-%20improv%20-orange">  

- **Projectile Lifespan** *([#399](https://github.com/sh4rkman/SquadCalc/issues/399))*  
SquadCalc now accounts for projectiles with a limited lifespan. If a shot would expire mid-air, it will be marked as out of range.  


</br><img src="https://img.shields.io/badge/-bug%20fixes-b22">   

- Joining a session that switched layer after its creation now correctly load the current layer *([#406](https://github.com/sh4rkman/SquadCalc/issues/406))*
- Opening a SquadCalc link with an embedded session now correctly loads the associated layer. *([#403](https://github.com/sh4rkman/SquadCalc/issues/403), thanks Metroseksuaali)*
- Vehicle Spawner texts are still visible after changing the base layer *([#407](https://github.com/sh4rkman/SquadCalc/issues/407))*
- Adjusted Jensen's range heightmap by a few meters
- Fixed Projectile Trajectory Simulations being wrong for Technical Mortars 
- Fixed a missing French locale  


</br><img src="https://img.shields.io/badge/-other%20-grey">  

- Updated TOS-1A MOA from `500` to `200` *(thanks ovalnik!)*  
- Grids code have been updated to handle maps that are rectangle (looking at you Skorpo)


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **40.2.0** *(2025-11-12)*


<img src="https://img.shields.io/badge/-new%20features-green">

- **Respawn Camera:** : Added a feature to display the Respawn Cam position on the map. (thanks jadow)
Can be disabled in settings, marker can be deleted with a right clic.


<img src="https://img.shields.io/badge/-bug%20fixes-b22">  

- Fixed an issue where existing markers did not appear when joining a session
- Fixed an issue where markers where not created when importing a save file
- Fixed TC hexagons displaying with incorrect colors when joining a session ([#383](https://github.com/sh4rkman/SquadCalc/issues/383))
- Skirmish links between flags now correctly fade out when the layer is hidden ([#391](https://github.com/sh4rkman/SquadCalc/issues/391))

<img src="https://img.shields.io/badge/-other%20-grey"> 

- Added a `.env` template/example file for developers ([#393](https://github.com/sh4rkman/SquadCalc/issues/393))



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-hotfix-grey?style=for-the-badge"> **40.1.1** *(2025-11-02)*

<img src="https://img.shields.io/badge/-bug%20fixes-b22">  

- Fixed map not refreshing after taking a screenshot with squadmortaroverlay (thanks Hans_Wurst)


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **40.1.0** *(2025-11-02)*

<img src="https://img.shields.io/badge/-new%20features-green">  

- **Compact Elevation setting:** Enable this option to decluster the map and only keep the last 3 digit of elevations (1275 -> 275) ([#387](https://github.com/sh4rkman/SquadCalc/pull/387), thanks d503-ai!)
  

<img src="https://img.shields.io/badge/-dev%20-grey">  

- Updated code structure to make it easier for developers to add custom local maps.
- Changed heightmaps & locales caching

</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge"> **40.0.0** *(2025-10-19)*


<img src="https://img.shields.io/badge/-new%20features-green"> 

- 🎃

- **Interactive Hexagons for Territory control**  
Hexagons in TC can now be right-clicked to cycle through red/blue/neutral colors. Colors are Synced between sessions.

- **New Settings**  
  - Brightness, Contrast, Zoom Sensitivity, Grid Opacity can now be customised in `Settings > Map` (thanks exhausted_ghost ! fix #372)
  - A line can now be toggled on/off between weapons and targets in `Settings > Mortars` ([#380](https://github.com/sh4rkman/SquadCalc/pull/380), thanks Antiaris74!)

<img src="https://img.shields.io/badge/-%20improv%20-orange">  

- If a target isn't reachable by first mortar but reachable by second one, a deviation grid will now be displayed for the second weapon ([#380](https://github.com/sh4rkman/SquadCalc/pull/380), thanks Antiaris74!)
- Font-Size selector is now a slider
- Logo is now vertical on mobile

<img src="https://img.shields.io/badge/-bug%20fixes-b22">   

- Territory control Hexagons are now correctly hidden when hiding the layer
- Territory control Hexagons numbers now scale with font size settings (fix #373)
- Layer should now correctly load when joining a session
- Fixed missing BMP-2M illustration (fix #371)
- When hovering a target, other targets deviation grids are now correctly faded out
- When dragging a weapon, deviations grids are now faded out

<img src="https://img.shields.io/badge/-other%20-grey">  

- Custom context menu and markers are back in `Settings > Map`
- Removed blur effect when dialogs are open

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-hotfix-grey?style=for-the-badge"> **39.2.1** *(2025-09-29)*

<img src="https://img.shields.io/badge/-%20improv%20-orange">  

- Added a setting to enable/disable next flag probabilities (fix #369)

<img src="https://img.shields.io/badge/-bug%20fixes-b22">   

- Fixed bottom-right buttons being clickable even when not displayed (fix #367)
- Mains now shows "Team 1" / "Team 2" when factions are disabled
- FactionContextMenu is now disabled when factions are disabled (fix #368)
- SpawnPoints now correctly display a generic "team1/2" image on hover when factions are disabled
- Fixed mains icons having no background color when no faction are selected
- Fixed AlBasrah Invasion layers that couldn't be fully completed
- Fixed missing translations for Commander/SpawnPoints (fix #365)

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **39.2.0** *(2025-09-28)*


<img src="https://img.shields.io/badge/-new%20features-green"> 

- **Map Spawns**  
SquadCalc now displays the available spawns for each team. This includes main bases as well as temporary spawns in Invasion, and advanced spawns that appear later in the game.

- **Next flags %**  
In Invasion and RAAS, now displaying for each possible next flag the percentage chance that it will appear in the layer.

<img src="https://img.shields.io/badge/-%20improv%20-orange">  

- Vehicle tooltips now open with a 200ms delay to avoid accidental openings
- Improved faction selector panel responsiveness on mobile  
- Vehicle names can no longer be clicked on mobile to avoid misclicks
- Vehicle spawns now show their reserved vehicle type, if any
- Main base names now include the team number for clarity (Thanks AndersHogqvist & grey275, fix #361)

<img src="https://img.shields.io/badge/-bug%20fixes-b22">   

- Fixed bottom-right buttons being clickable even when not displayed (Thanks Madlifer!)
- Commander assets are now hidden on layers where they are not available (fix #358)
- Commander assets are now hidden on layers after unselecting a faction
- Hovering over the number of available seats now correctly triggers the tooltip
- Vehicle spawn emplacements are now correctly hidden if the "show main assets" setting is disabled
- Fixed HellCannon data so it can be fired from 10° to 90° (Thanks Mooraragi!)
- Fixed map grid sometimes not displaying the last letter/number on large maps (fix #362)
- Fixed main bases on Harju Skirmish v2 (Thanks ghoti!)
- Fixed flag orders on Kohat_Invasion_v1, Kohat_Invasion_v2, Manicouagan_Invasion_v1, Anvil_Invasion_v1, Harju_Invasion_v3, Narva_Invasion_v1 (Thanks Take The L-iam!)



</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-hotfix-grey?style=for-the-badge">  **39.1.1** *(2025-09-05)*

<img src="https://img.shields.io/badge/-bug%20fixes-b22"> Commander Assets icons now loads properly


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **39.1.0** *(2025-09-05)*

<img src="https://img.shields.io/badge/-new%20features-green"> **Commanders Assets !**

You can know see on faction panel what commander asset each time has.  
You can now track the enemy commander assets cooldowns when pinning a faction.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Keypad under cursors now reflect UE5 "Fake grids" (Thanks yourothersis!)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Deviation Grid tooltips now indicate the correct angle deviation value (Thanks yourothersis!)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a bug where quicly changing maps could mix up their layers (Thanks Snowflake!)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed tooltips styles on Weapons & Targets information pop-ups

<img src="https://img.shields.io/badge/-other%20fix%20-grey"> "Only Track High Respawn Times Pinned Vehicles" setting is now activated by default

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-hotfix-grey?style=for-the-badge">  **39.0.4** *(2025-09-04)*

<img src="https://img.shields.io/badge/-bug%20fixes-b22"> SquadMortarOverlay images now load properly


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-hotfix-grey?style=for-the-badge">  **39.0.3** *(2025-09-04)*

<img src="https://img.shields.io/badge/-bug%20fixes-b22"> creating weapon & target markers on mobile should now be working

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-hotfix-grey?style=for-the-badge">  **39.0.1** *(2025-09-03)*

<img src="https://img.shields.io/badge/-bug%20fixes-b22"> Fixed Albasrah/Skorpo size and grid. (thanks Mooraragi)

<img src="https://img.shields.io/badge/-bug%20fixes-b22"> Fixed squadtactics.app button URL


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **39.0.0** *(2025-09-03)*

<img src="https://img.shields.io/badge/-new%20features-green">

- **9.0 & UE5 Ready** 
New AlBasrah and updated Factions/Units/Layers.

- **Spawning Vehicles** ([#343](https://github.com/sh4rkman/SquadCalc/issues/343))  
Vehicles now spawn on map's main after picking a faction, so you can anticipate where they will appear. All spawns possibilities are shown.  
Hovering over an icon opens an info card about it.

- **Faction & Unit Selection from the Map**  
You can now right-click any main flag to select the Faction/Unit of that team and pin it to the screen.

- **Target Deviation Grids**  
  You can now enable a deviation grid on targets that helps adjust shots without the need to place another target: vertical lines show angle deviation (2°), and horizontal arcs show elevation deviation (10 mils or 1° depending on the weapon's unit system).

- **Modded Weapons** ([#327](https://github.com/sh4rkman/SquadCalc/issues/327))  
  Added support for 5 new artillery vehicles from popular mods : Himars, TOS-1A, M109 Paladin, MTLB БЕГЕМОТ, T62 Dump Truck.  
  (Thanks [yobaNGE](https://github.com/yobaNGE) for the weapons data !)

- **Territory Control, Seed & Skirmish Layers Support** 

- **Vehicle Illustration in Faction Selection**  
  Click any vehicle in the faction panel to see what it looks like in-game.
  Added in-cards showing tickets values, if a vehicle is amphibious or has ATGM, and its number of available seats.

- **SquadTactics!** https://squadtactics.app  
Features for creating markers, strategizing, and planning your future games have been removed from squadcalc.app and moved to their own dedicated (but very similar) app. If you need a companion app while playing, use squadcalc.app; if you want to plan your next match outside the game, use squadtactics.app.  


- **And more**  
  - Added complete faction names when hovering over a flag in faction selection.  
  - Added links in faction selection redirecting to each vehicle's `squad.fandom.com` page in a new tab.  
  - "Auto pick single flag" is now activated by default: SquadCalc will automatically pick a flag if it's the only available option. The setting has been removed.  
  - Enabling distance on target markers also displays the distance in squadmortaroverlay (thanks TheMatheusDev! [#345](https://github.com/sh4rkman/SquadCalc/pull/345)).  
  - Logi Boats now appear next to other boats in the vehicle list.  
  - Factions are now sorted alphabetically
  - Vehicles now show if they won't respawn instead of showing default respawn time.
  - Boats are removed from vehicle lists if they can't spawn in the current layer.  
  - Changed the maximum additional height a user can set for a weapon from 100 to 300m.  
  - Improved contrast of the target's compact icon.  
  - Improved map & heightmap caching to speed up image loading.  
  - Reduced button and selector sizes on mobile to be more compact.  
  - Added a custom "Under Maintenance" page.  
  - Added a custom `404` page.



<img src="https://img.shields.io/badge/-bug%20fixes-b22">

- Fixed a Skorpo heightmap being slightly misrotated (Thanks ZFZR031! fix [#295](https://github.com/sh4rkman/SquadCalc/issues/295)).  
- SquadCalc is now installable again as a Progressive Web App (Thanks Acemantura! fix [#328](https://github.com/sh4rkman/SquadCalc/issues/328)).  
- Additional weapon heights are now correctly shared between session members (Thanks aiphton! fix [#322](https://github.com/sh4rkman/SquadCalc/issues/322)).  
- Vehicle respawn timers no longer appear in seconds after being started/aborted (Thanks Petro! fix [#324](https://github.com/sh4rkman/SquadCalc/issues/324)).  
- Changing layers while in a session now broadcasts the layer change to other session members (fix [#305](https://github.com/sh4rkman/SquadCalc/issues/324)).  
- Changing factions/units while in a session now broadcasts the change to other session members (fix [#305](https://github.com/sh4rkman/SquadCalc/issues/324)).  
- Main faction names are now correctly translated.  
- Fixed `CreateSquad` commands to work with vehicle names containing spaces (Thanks Snowflake!).   
- SquadCalc no longer tries to copy targets to the clipboard when moving a weapon if "auto-copy target to clipboard" is enabled.  
- SquadCalc no longer tries to copy targets created by session members to the clipboard when "auto-copy target to clipboard" is enabled.  
- Fixed a rare calculation error when shooting at very close range and high elevation with BM21-Grad (fix [#329](https://github.com/sh4rkman/SquadCalc/issues/329)).  
- Fixed console errors appearing when switching languages.  
- Added missing vehicle translation file for German.  
- Fixed typo in vehicle translation file for Russian (Thanks kimochi!).  
- Right-clicking a marker no longer triggers a console error.



</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **38.1.0** *(2025-05-07)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Sound Notifications & Vehicles Localization Support (fix [#320](https://github.com/sh4rkman/SquadCalc/issues/320))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Vehicles timers will try to continue to run in background on mobile when phone is locked (sounds notifications won't play !) (fix [#319](https://github.com/sh4rkman/SquadCalc/issues/319))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Security fixes


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **38.0.0** *(2025-05-06)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Factions and Destroyed Vehicles Tracking!**  
When selecting a layer, you can now choose the two active factions and their units to view their vehicle lists, respawn times, and delays. You can also pin a unit list to the map to keep it in view and mark vehicles as destroyed—a timer will start, and a sound notification will alert you when they respawn. ([#304](https://github.com/sh4rkman/SquadCalc/issues/304))

<img src="https://img.shields.io/badge/-new%20feature-green"> Selecting a layer now also displays the playable area, if available (invisible walls within the actual map borders). This can be toggled off in `Settings > Layer Settings`. ([#310](https://github.com/sh4rkman/SquadCalc/issues/310))

<img src="https://img.shields.io/badge/-new%20feature-green"> Added new settings to toggle main assets and main zones on/off

<img src="https://img.shields.io/badge/-%20translations%20-blue"> Added German translations by [f0xcb](https://github.com/f0xcb) (Thanks!)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Narva_Invasion_v2 Invaders starting to the wrong main (thanks Devil4ngle !)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Distance units between flags are now correctly translated

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Clicking an already selected terrain type no longer reloads the image

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed borders disappearing when clicking an unselectable flag

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Added tracked MSV, tracked logistics, and tracked artillery icons to the context menu icons list

<img src="https://img.shields.io/badge/-%20other%20-grey"> Removed the "Auto-copy next flags" feature


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **37.4.0** *(2025-04-20)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Markers export/import:** You can now export the current state of the map to a file that can be shared or dragged & dropped back later, recreating the markers. ([#298](https://github.com/sh4rkman/SquadCalc/issues/298))

<img src="https://img.shields.io/badge/-new%20feature-green"> **Custom Markers Size:** You can change the default size of the map markers ([#294](https://github.com/sh4rkman/SquadCalc/issues/294))

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Calculations now take the height of the weapon into account (fix [#287](https://github.com/sh4rkman/SquadCalc/issues/287))

<img src="https://img.shields.io/badge/-%20translations%20-blue"> Improved ZH-CH translations by Guducat (Thanks!)

<img src="https://img.shields.io/badge/-%20translations%20-blue"> Improved ru-RU translations by sitroz (Thanks!)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed existing markers not taking the heightmap into account when joining a session (fix [#301](https://github.com/sh4rkman/SquadCalc/issues/301), thanks modern-nm!)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Hiding the layer now also works with Destruction layers (fix [#291](https://github.com/sh4rkman/SquadCalc/issues/291))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed rectangle markers not being synced in a session when created before a session is created



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **37.3.1** *(2025-04-02)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed SquadCalc not loading on Firefox > 137.0 (fix [#292](https://github.com/sh4rkman/SquadCalc/issues/292), thanks mrbeatbox!)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Kohat heightmap (fix [#297](https://github.com/sh4rkman/SquadCalc/issues/297), thanks ZFZR031!)

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **37.3.0** *(2025-02-23)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a button to Show/Hide flags while a layer is selected (Thanks @Syntax for the suggestion, fix [#289](https://github.com/sh4rkman/SquadCalc/issues/289))


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **37.2.0** *(2025-02-05)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Circles and Rectangles Markers (fix [#285](https://github.com/sh4rkman/SquadCalc/issues/285))

<img src="https://img.shields.io/badge/-new%20feature-green"> Shapes/Arrows are now available in Blue/Red/Green/Black

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed enemy markers context menu positions (fix [#286](https://github.com/sh4rkman/SquadCalc/issues/286))

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Code Refactoring


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **37.1.1** *(2025-02-03)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Under-Cursor Keypads sub-digits are now smaller for clarity (fix [#283](https://github.com/sh4rkman/SquadCalc/issues/283), thanks Flandflard!)

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Under-Cursor Keypads, and Markers position Keypads now scale with the font size set in settings

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added a FadeIn animation when switching layers 

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Target position keypads are a little higher when several weapons are on the map

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added a slight fade-in animation on markers

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Disabled shortcuts panel in settings (shortcuts keys can now be found directly on buttons tooltips)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed pings being oversized on mobile

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Refactoring


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **37.1.0** *(2025-01-31)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Session Pings: Left-clicking the map while in a session displays a ping for everyone in the session. Pings also occur when other participants interact with markers (adding, deleting, etc.).

<img src="https://img.shields.io/badge/-%20Translations%20-blue"> Improved ZH-CH translations by @Guducat (Thanks! Fix [#281](https://github.com/sh4rkman/SquadCalc/issues/281)).

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Sharing a session URL now correctly preserves the shared layer.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Clicking the close button on the "Session Created" toast no longer copies the session ID (Fix [#272](https://github.com/sh4rkman/SquadCalc/issues/272)).

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Leaving a session now correctly re-colors other players' markers, as well as the spread and damage zones, in red (Fix [#270](https://github.com/sh4rkman/SquadCalc/issues/270)).

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Closing SquadMortarOverlay now correctly re-enables the HD map button.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Opening multiple toasts now correctly restarts the timer and closing animation.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Flag names are now properly adjusted when using rectangular flags.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed the missing Logar Valley topographic HD map.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed background color inside context menus for Chromium-based browsers (Fix [#275](https://github.com/sh4rkman/SquadCalc/issues/275)).

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> The "Cap Zones on Hover" setting is now properly checked if previously selected (Fix [#277](https://github.com/sh4rkman/SquadCalc/issues/277), thanks @matoid!).

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Session IDs are now restricted to 6–20 characters. A toast message has been added for invalid session ID attempts.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Distance text between flags now fades out while dragging targets/markers (Fix [#264](https://github.com/sh4rkman/SquadCalc/issues/264)).

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added a "Undo" button in addition of the backspace shortcut. Undo now also remove the last marker/arrow dropped on the map.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> The "Delete All" button and shortcuts now also remove every markers/arrows on the map.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Buttons that have shortcuts are now displaying it in their tooltips

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Removed 750MB of unused HD map files.

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Improved connector for SquadMortarOverlay v2.4.0 (#278 by @devil4ngle).


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **37.0.0** *(2025-01-24)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Sessions !**

Introducing the session system: You can now create collaborative sessions and share a unique link with friends. This allows multiple users to place markers together on a shared map in real time. Whether you’re strategizing, planning, or simply collaborating, the session system makes teamwork easier and more interactive!

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reordered marker categories in the context menu.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Improved the map list display on devices with small screen heights (fix [#266](https://github.com/sh4rkman/SquadCalc/issues/266)).

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Standardized URL parameters order (Map>Layer>type>Session)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed arrow markers not working on Chromium-based browsers (fix [#268](https://github.com/sh4rkman/SquadCalc/issues/268), thanks @devil4ngle!).

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a bug where hovering over a marker would cause target text to fade out permanently (fix [#267](https://github.com/sh4rkman/SquadCalc/issues/267), thanks @dkanrjteh!).

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed an issue where arrow markers would "blink" when displayed for the first time (fix [#265](https://github.com/sh4rkman/SquadCalc/issues/265)).



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **36.0.0** *(2025-01-15)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Squad Map Markers:** Right-click on the map to open a context menu that lets you place markers, helping you strategize for future games.

<img src="https://img.shields.io/badge/-new%20feature-green"> **Auto-Copy Targets:** Enable this setting to automatically copy the calculations of the most recently placed or moved target to the clipboard, making it easy to share them in-game using Ctrl+V.

<img src="https://img.shields.io/badge/-new%20feature-green"> **Auto-Copy Next Flags:** Enable this setting to automatically copy the name of the next flag when clicking a flag in a RAAS/Invasion layer, making it easy to share in-game using Ctrl+V.

<img src="https://img.shields.io/badge/-new%20feature-green"> **Display Low & High Angles:** Enable this setting to display both low- and high-angle solutions on the marker for weapons that support both. (Thanks, Matador, for the suggestion. Fix #258)

<img src="https://img.shields.io/badge/-new%20feature-green"> **Flags Distance:** In AAS/RAAS/Invasion, a new setting allows you to show or hide the distance between flags.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> HD maps (8k × 8k) are now tiled for better performance and efficiency.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added various tooltips to settings.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added various animations.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Yehorivka heightmaps being twice the size they should be. (Fix #259)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> The heatmap is no longer redrawn each time the layer is changed on the same map.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed flag numbers being off-center on rectangular flags.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed seconds being displayed as meters in some languages.



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **35.0.0** *(2025-01-02)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Custom font size:** you can now change the size of the texts appearing on the map to your liking (Fixes [#254](https://github.com/sh4rkman/SquadCalc/issues/254))

<img src="https://img.shields.io/badge/-new%20feature-green"> Added new "HD" buttons to use very high-quality maps (previously located in Settings)
SquadCalc now serves very high-quality (8192px × 8192px) terrain and topographic images upon request.
Performance may be significantly affected, especially when using the Steam browser, which appears to deliver the worst performance—even on high-end machines, for reasons unknown.
(Fixes [#253](https://github.com/sh4rkman/SquadCalc/issues/253))

<img src="https://img.shields.io/badge/-new%20feature-green"> New keyboard shortcut: Press Backspace to remove the last target placed on the map.

<img src="https://img.shields.io/badge/-new%20feature-green"> New Settings tab listing shortcuts: A new tab in Settings allows you to browse all available keyboard shortcuts for SquadCalc. Not customizable (yet?).

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a bug where layers weren't correctly removed when switching maps.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed circle flags being slightly off-center.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed flag numbers being off-centered on some browsers.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a visual bug in calculation popups when adding and removing a second weapon.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a typo in french locales

<img src="https://img.shields.io/badge/-%20improv%20-orange"> The "Emphasis markers on hover" option is now activated by default, and the corresponding setting has been removed.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Removed ant-lines connecting weapons to targets when hovering over a marker.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Main icons now use regular image icons instead of emojis.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> The Settings preview now displays the selected marker type (Big or Minimalistic).

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added various button animations.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Now using .svg icons to improve speed and eliminate dependency on CDNs.


</br></br><!-- CHANGELOG SPLIT MARKER -->




# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **34.1.4** *(2024-12-27)*


<img src="https://img.shields.io/badge/-new%20feature-green"> **New keyboard shortcut:** press delete to clear all targets on the map (fix #250)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed KP-gridlines sometimes being drawn outside of map bounds (fix #251)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed KP-gridlines somestimes not appearing when zooming too fast

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Heatmaps should be scaled better on very small/large maps (fix #249)

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Security enhancements

<img src="https://img.shields.io/badge/-%20other%20-grey"> Removed Christmas theme


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **34.1.3** *(2024-12-17)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed markers being undraggable on mobile

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed toasts not showing on mobile

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Replaced Albasrah basemap with a better encoded version

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Damage radiuses option is now activated by default



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **34.1.2** *(2024-12-16)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Hovering a flag while zooming in doesn't reveal hidden flags capzones anymore

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Removed an empty space appearing when no layers were available on mobile

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed empty space between map buttons that couldn't be used

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Damage radiuses option is now activated by default

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Removed the ability to right-click on different buttons

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Changelog rework for lane finder


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **34.1.1** *(2024-12-11)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed some aeras around weapons/maps selectors where it was impossible to click on map/markers

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Souk capzone on Sumari RAAS v1

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Police Station capzones on Anvil Invasion v1



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **34.1.0** *(2024-12-09)*


<img src="https://img.shields.io/badge/-%20improv%20-orange"> Clicking the enemy main in RAAS now resets the layer and switches sides even if you’ve already selected flags

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Time of flight is now rounded when displayed next to markers to improve readability

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Previewing a layer now also hides faded-out flags' cap zones

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> "Reveal Layer" settings are now correctly checked by default

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed simulations for the emplaced UB32

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed RealMaxRange for the emplaced UB32 (fix #241)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed damage radii not showing on the emplaced UB32 (fix #242)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Snowflakes no longer block mouse clicks

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed incorrect cursor on the enemy main in Invasion (fix #237)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Qalat, Compound 16, Lavender Farm, Riverside, Vineyard, and Police Station cap zones on Anvil RAAS v1, RAAS v2, and Invasion v1

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Radio Station cap zones on Chora AAS v1 and AAS v2

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Added a script to convert heightmaps to .json in /js/tests/ (fix #240)

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **34.0.1** *(2024-12-06)*

<img src="https://img.shields.io/badge/-new%20feature-green"> ⛄

<img src="https://img.shields.io/badge/-new%20feature-green"> 🔵 Circles Icon for flags
You can now toggle flags icon between circles & rectangles in settings.

<img src="https://img.shields.io/badge/-new%20feature-green"> 🔎Layer Preview
Without clicking a flag, you can preview what would happen by hovering it

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Clicking the enemy main in RAAS now reset layer and switch sides even if you are have already selected flags.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Real Max Range "Circle" now stops at map borders

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Real Max Range "Circle" now stops at weapon angle boundaries (e.g it won't show ranges that are not reachable because you have to go below 800mil)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed markers displaying elevation that couldn't be reached by weapons emplacements with a minimum and a maximum elevation (fix #226)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed some rare capzones being misoriented on Harju RAAS v1/v2 (fix #233)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Map Buttons sometimes appearing behind map & layer selectors on small screens (fix #235)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed FavIcon



</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **34.0.0** *(2024-12-02)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Lane Finder !** You can now select a layer to reveal the potential flags/Cache in AAS/RAAS/Invasion/Destruction gamemodes.  
* **Auto-picker**: If only one flag is reachable next step, SquadCalc will automatically advance into the layer (can be disabled in settings)
* **Capzone:** Zoom in or hover a flag (can be set in settings) to reveal flags capzones
* **Main Zones:** Display Main Protection & NoDeployement zones
* **Game Assets:** Helipads, Repair stations, ammoboxes are displayed when zooming in
* **Known Bug :** capzone can sometimes be very, very small.

<img src="https://img.shields.io/badge/-new%20feature-green"> **Minimistic Icons**  
You now have the choice between Large Animated Target Icons and small circles to help declustering the map when spaming targets. [#224](https://github.com/sh4rkman/SquadCalc/issues/224)  
Option "Animated target icon" have been replaced with "Use Large Icons"  

<img src="https://img.shields.io/badge/-new%20feature-green"> **Real Max Range** *(code by devil4ngle)*  
You can now toggle "Real Max Range" in settings to make the max range circle take heights into account.  
**CPU intensive**, be advised.

<img src="https://img.shields.io/badge/-new%20feature-green"> **FOB Construction Radius** [#225](https://github.com/sh4rkman/SquadCalc/issues/225) *(thanks cytuk)*  
A new circle now appear when hovering/dragging a deployable weapon showing the FOB Range radius.     
Usefull if you are wondering where to place a radio for the weapon to be constructed here.

<img src="https://img.shields.io/badge/-new%20feature-green"> **Sharable URL's** [#222](https://github.com/sh4rkman/SquadCalc/issues/222) *(thanks grey275)*  
URL's now hold the map, layer and type of basemap so it can be easily shared/bookmarked 

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Reapplied -5° Offset to technical mortar [#227](https://github.com/sh4rkman/SquadCalc/issues/227) *(thanks zoslcne)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed faulty pixel on Sanxian heightmap [#229](https://github.com/sh4rkman/SquadCalc/issues/229) *(thanks zoslcne)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed ammo selector being misplaced on 2/4K resolution *(thanks mahtoid)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed logo not properly displaying on slow connection

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed calculations being done twice when placing a new marker

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Gridline now takes map size into accounts when appearing/disapearing [#221](https://github.com/sh4rkman/SquadCalc/issues/227)  

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Bigger gridlines now appears on top of smaller ones for a better clarity

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added a fadein animation on "delete on targets" button

<img src="https://img.shields.io/badge/-%20dev%20-grey"> "Frequent weapon position" button is now hidden if no api is provided in a `.env` file

<img src="https://img.shields.io/badge/-%20dev%20-grey"> API new routes: ``/api/get/layers`` & ``/api/get/layer``


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **33.0.2** *(2024-11-14)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> SquadCalc now attempt to connect to SquadMortarOverlay regulary (no need to refresh squadcalc if SMO is launched after squadcalc) - [#219](https://github.com/sh4rkman/SquadCalc/pull/219)

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Moved websockets code for SMO to its own file - [#219](https://github.com/sh4rkman/SquadCalc/pull/219)


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **33.0.1** *(2024-11-04)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Targets not working properly on Safari (thanks @Hooded_Lizard & @SOHNER)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Keypads appearing randomly on touch on mobile devices



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **33.0.0** *(2024-11-01)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Dragging or hovering a target for more than 0.5s will create a line between the target and the placed weapons simulating the projectile path.

<img src="https://img.shields.io/badge/-new%20feature-green"> Hovering a target for more than 0.5s will fade out other markers for clarity. Can be toggled off though settings.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Kokan/Goosebay/Foolroad gamma (thanks zfzr031 ! fix #206)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed incorrect cursor sometimes appearing while dragging

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed incorrect cursor sometimes appearing when hovering the lower part of a marker

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Atempt to fix toast message sometimes shifting the window at launch

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Focus mode should now be correctly hidden on mobile devices

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> "Keypad Under Cursor" & "Use Classic Cursor" settings are now correctly disabled on mobile devices

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed slow image loading in settings preview

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Removed Halloween event theme

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Settings preview is now hidden on small screens to provide more space for settings

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added new tooltip on "Use classic cursor" setting

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Settings will be displayed compacted on width smaller than 992px (previously 768px)

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Settings preview is now hidden on small screens to provide more space for settings

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Settings added this last two months has been marked as 'New'

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Replaced deprecated sass import function (fix [#213](https://github.com/sh4rkman/SquadCalc/issues/213))


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **32.3.0** *(2024-10-20)*

<img src="https://img.shields.io/badge/-new%20feature-green"> 🎃

<img src="https://img.shields.io/badge/-%20dev%20-grey"> reworked changelog

<img src="https://img.shields.io/badge/-%20dev%20-grey"> fixed memory leaks

</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **32.2.0** *(2024-10-14)*

<img src="https://img.shields.io/badge/-new%20feature-green"> New Options: "Show keypads while dragging". Enable to display current keypad while dragging weapon/target markers

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reworked Setting tab on three columns : Map, Weapon and Target settings

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Target Texts are now rised over anything else when hovering a Marker (avoid confusion when trying to read text when two targets are close to each others)


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **32.1.0** *(2024-10-13)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Narva (Flooded) to the map list

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Pacific Proving Grounds to the map list

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed MK19 spash damage values

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added a quick ping to Squad Mortar Overlay before opening websocket to it, avoid ugly error message in console when it's off (code by Devil4ngle)

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Splited HTML/SCSS into components 


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **32.0.0** *(2024-10-06)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **New Weapon : MK19-RWS.** This vehicule mounted MK19 can actually be shot *kinda* precisely at very long range (5km!!) thanks to the degrees indicator in the HUD. It's added as "experimental weapon" for now because of some flows : At very long range the projectile tends to disapear, and the HUD angle indicator being rounded the overall precision can be meh. Thanks to [Ferrariic](https://github.com/Ferrariic) for his original idea and numerous tests (see [this discussion](https://github.com/sh4rkman/SquadCalc/pull/204))

<img src="https://img.shields.io/badge/-new%20feature-green"> **New Setting : "High Quality Basemap"**, allow you to use AI Upscaled 8192px*8192px file as default basemap. Resolution and quality is actually better than the ingame map but be aware it can cause performance issues/high loading time on some browsers.

<img src="https://img.shields.io/badge/-new%20feature-green"> **New Setting : "Experimental Weapons"**, allow you to use experimental indirect-fire weapons in Squadcalc. For now MK19-RWS is available.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reworked several settings labels/tooltips in several language to be more concise

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Slightly reduced font size in weapons/maps dropdown lists.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Realigned Bearing/Distance in setting's preview


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **31.2.0** *(2024-10-01)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed "first zooms lags" due to map image not being properly decoded on Chrome

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added a quick ping to Squad Mortar Overlay before opening websocket to it, avoid ugly error message in console when it's off (code by Devil4ngle)

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Improved responsivness of settings dialog on very small resolution

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reduced heat points size/chroma on weapons heatmaps

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Splited HTML/SCSS into components 

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Simplified github actions workflows

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Linters : Removed w3c validator / Added htmlhint config

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Project now use module syntax (imports/exports) pretty much everywhere


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **31.1.1** *(2024-09-27)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Emplaced and mobile UB-32 are now using perfectly accurate formulas taking deceleration into account instead of "deducing" average velocities from ingame table. Thanks to @Devil4ngle and check out <a href="https://github.com/Devil4ngle/squadmortar">his project</a>

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Projectile Simulation now plays at consistent speed whatever refresh rate your monitor is 

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added shitty animations on loading logo, settings texts when clicked, and dialogs

<img src="https://img.shields.io/badge/-%20improv%20-orange"> added a new tooltip on "show min/max distance" setting

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed weird span when scrolling at Min and Max zoomLevel ([#201](https://github.com/sh4rkman/SquadCalc/issues/201))

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Back to using CDN to serve Fonts/Icons

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Added support for Devil4ngle squadmortar by introducing activable websocket connection

<img src="https://img.shields.io/badge/-%20dev%20-grey"> moved non-squadcalc JS libraries to a separate folder `/src/js/libs/`


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **31.0.1** *(2024-09-23)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed faulty 'pointer' cursor when hovering settings row without any text

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Skorpo basemap

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Fixed environnement variables not correctly loaded

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **31.0.0** *(2024-09-23)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Single Image Maps : maps are now displayed with a single image file, instead of hundreds of tiles. Add a smoother usage once fully loaded at the cost of higher bandwidth/initial loading

<img src="https://img.shields.io/badge/-new%20feature-green"> New setting : "Pan/Zoom animations" allow you to toggle map animation while moving/zooming on the map. Smooth vs Reactive experience

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a loading indicator while loading maps

<img src="https://img.shields.io/badge/-new%20feature-green"> Added tooltips adding precision on some settings

<img src="https://img.shields.io/badge/-new%20feature-green"> Settings label can now be clicked to tick them

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reduced size heatmap points

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Removed service worker caching for now to see if it fixes caching problems


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **30.0.0** *(2024-09-13)*

<img src="https://img.shields.io/badge/-new%20feature-green"> New feature : "Show Frequent Weapon Locations". Thanks to the data collected through squadcalc API users can now display a heatmap of common places where to deploy their weapon.

<img src="https://img.shields.io/badge/-new%20feature-green"> New feature : Focus Mode. A new button allow to hide everything but the map to have a minimalist/focused view. Shortcut: Enter.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Restyled tooltips

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Improved project bundling with webpack (now using webpack-copy-plugin instead of manual copy, using internal webpack ENV variable, less useless npm scripts, ...)

<img src="https://img.shields.io/badge/-%20dev%20-grey"> Updated every dependencies

<img src="https://img.shields.io/badge/-%20dev%20-grey"> removed playwright tests


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **29.0.3** *(2024-09-06)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> API calls now send current squadcalc version

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **29.0.2** *(2024-09-03)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Dragging Targets around the map doesn't call the post/target api hundreds of times anymore 

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **29.0.1** *(2024-09-02)*

<img src="https://img.shields.io/badge/-new%20feature-green"> SquadCalc now publish targets positions to the API for futur incoming features (heatmap of commonly used targets positions)

<img src="https://img.shields.io/badge/-new%20feature-green"> Now cheching the API health at startup

<img src="https://img.shields.io/badge/-%20improv%20-orange"> webpack & npm script simplifications

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **29.0.0** *(2024-09-01)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Now connected to brand new SquadCalc API, SquadCalc now publish weapons positions to the API for futur incoming features (heatmap of commonly used mortar positions)

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **28.0.5** *(2024-08-18)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed some translations not updating when switching language on settings dialog 

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed M1064 shell name not appearing on weapon dialog  

<img src="https://img.shields.io/badge/-%20improv%20-orange"> (huge) Code reworking

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **28.0.4** *(2024-07-31)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Added missing translations on legacy mode

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed height calculations on legacy mode  

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Now hidding the classic cursor setting on touch screen 

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed gorodok heightmap/zscaling

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Code reworking

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **28.0.3** *(2024-07-26)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Improved language loading mechanic

<img src="https://img.shields.io/badge/-%20improv%20-orange"> New readme with redirection to Wiki

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Code cleaning

<img src="https://img.shields.io/badge/-%20improv%20-orange"> removed self-promotion to my dead youtube channel

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **28.0.2** *(2024-07-25)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Corrected Chinese translations (thanks @peter5he1by !)

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **28.0.1** *(2024-07-19)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Now avoid loading english translations if another language is set

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Damage spreads now correctly disappear when target is out of range and spread radius is off

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Now translating site description for search engines


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">   **28.0.0** *(2024-07-16)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Chinese, Ukrainian, Russian, French language

<img src="https://img.shields.io/badge/-new%20feature-green"> Added the possibility to choose between Impact and Near-Surface rounds when using M121

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Jensen's Range to map list

<img src="https://img.shields.io/badge/-new%20feature-green"> Added the possibility to display height difference between weapon & target in target firing solution

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed UB32 imprecision at high range (2050-2150m)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a visual bug in map selector



</br></br><!-- CHANGELOG SPLIT MARKER -->




# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **27.1.0** *(2024-07-11)*


<img src="https://img.shields.io/badge/-%20improv%20-orange"> Damage radius now take into account the height of the explosion. Mostly impact M121 proximity rounds that explode at 10m from the ground, resulting on a much smaller kill zone.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> UB-32 & Technical UB-32 now have their own damage radius

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Removed the ability to switch to high angle on UB-32 emplacement (both on legacy and map mode)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Removed the ability to switch to high angle on regular mortar (legacy mode)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> tweaked font size of dialogs on mobile





</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **27.0.0** *(2024-07-09)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Weapon Informations & advanced customisation ! You can now left click a weapon to check his properties (velocity, moa, ...). You also switch between High & Low angles, and add some elevation when shooting from the top of a building for example

<img src="https://img.shields.io/badge/-new%20feature-green"> Weapon splash damage ! Jump into settings to active target radius for 100 & 25 damage range.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> In simulation dialog, targets now use a grey/disabled version if there is no firing solution

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reworked settings on two columns on large screen

<img src="https://img.shields.io/badge/-%20improv%20-orange"> **Lot** of code rewriting



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **26.0.1** *(2024-06-30)*


<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed an issue where alt/shift-tabbing would focus map grid and pan the map out of the current view

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed UB32 precision with the new gravity introduced in 26.0.0



</br></br><!-- CHANGELOG SPLIT MARKER -->




# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **26.0.0** *(2024-06-27)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Each weapon now have their own map marker

<img src="https://img.shields.io/badge/-new%20feature-green"> Out of range targets now have their own "grey" marker so you can spot at a glance if it's in range or not

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Reduced global gravity from 9.8 to 9.78. This should make every weapon shoots 1-3m shorter and be more accurate than before. See [#156](https://github.com/sh4rkman/SquadCalc/issues/156)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Changed mortars velocity from 109.89 to 110m/s (SDK value)

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **25.0.3** *(2024-06-24)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Changed M121 Velocity and MOA to 8.1 hotfix

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Renamed M1064 120mm to M1064-M121

<img src="https://img.shields.io/badge/-%20improv%20-orange"> SquadCalc now load a random map at first launch instead of a the same default map

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Advanced Informations now displays elevation up to two decimals for weapons using degrees


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **25.0.2** *(2024-06-12)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Corrected Yehorivka heightmap [#155](https://github.com/sh4rkman/SquadCalc/issues/155) (Thanks SuisQi!)


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **25.0.1** *(2024-06-12)*

<img src="https://img.shields.io/badge/-%20improv%20-orange">  Added minimum range for M1064-A3


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **25.0.0** *(2024-06-12)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added M1064-A3 120mm


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **24.1.0** *(2024-05-25)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Now displaying a weapon number next to calcs when using several weapons

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> fixed dead pixels on Kohat heightmap (thanks zfzr031 !)

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Scaled down Kohat heightmap

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Code rewritting and three-shaking



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **24.0.0** *(2024-05-11)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Topographic maps !** Heightmap layers have been replaced with a mix of topographic, hypsometric and hillshading layers. Blue/Red heightmaps are still used behind the scene to find heights

<img src="https://img.shields.io/badge/-new%20feature-green"> Grid now display the letters and numbers next to every column and row

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> fixed a bug where the grid was drawn a pixel too far

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> fixed a bug where mini-placing-circles were not properly destroyed and still hoverable



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **23.3.0** *(2024-05-07)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a "loading" animation background on logo

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed some bridges/buildings being covered with terrain on kohat/manicouagan terrain maps

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> fix [#142](https://github.com/sh4rkman/SquadCalc/issues/142)



</br></br><!-- CHANGELOG SPLIT MARKER -->





# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **23.2.0** *(2024-05-06)*


<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Layer preference is now properly restored when loading the page again

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Bearing is displayed again with 1 digit after the decimal point (thanks ThaViking4 [#140](https://github.com/sh4rkman/SquadCalc/issues/140))


</br></br><!-- CHANGELOG SPLIT MARKER -->







# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **23.1.0** *(2024-05-05)*

<img src="https://img.shields.io/badge/-new%20feature-green"> You can now preview calc informations for a second weapon if it's placed

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed layer button appearing sometime in legacy mode

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed calculation not taking heights in account in legacy mode when switching map on existing calcs



</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **23.0.0** *(2024-05-01)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Heightmaps** ! You can know switch to a "heightmaps" mode with better understanding of elevation.

<img src="https://img.shields.io/badge/-new%20feature-green"> **Calc Information** ! You can know clic a target to see advanced informations and previsualize the terrain between weapon and target, and if the projectile is going to hit terrain.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reworked the layer picking buttons

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Disabled target updating while dragging on mobile to avoid sluttering

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Lot of code rewriting





</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **22.0.0** *(2024-04-25)*

<img src="https://img.shields.io/badge/-new%20feature-green"> **Terrain maps** ! You can know switch to a "terrain" mode with better understanding of elevation. Straight from the SDK, makes you wondering how the fuck you can't have decent minimap ingame right.



</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **21.0.0** *(2024-04-20)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a button to clear all target markers

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a bug that prevented from placing markers near the bottom of the page

<img src="https://img.shields.io/badge/-%20improv%20-orange"> improved font caching/loading for faster experience (Largest Contentuful Paint went from 1.1s to 0.8s, and First Contentful Paint from 0.7s to 0.3s !)

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **20.7.2** *(2024-04-15)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed maps/tiles caching for better performance/fix caching problems when updating maps

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **20.7.1** *(2024-04-13)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Updated Skorpo map & heightmap (thanks peter5he1by! [#130](https://github.com/sh4rkman/SquadCalc/issues/130))



</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **20.7.0** *(2024-04-03)*

<img src="https://img.shields.io/badge/-new%20feature-green"> New explosion animation when a target is created (can be disabled in settings)



</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **20.6.0** *(2024-03-29)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> SquadCalc is now using [ServiceWorker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) to load maps faster, and store itself offline


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **20.5.1** *(2024-03-25)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed changelog link


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **20.5.0** *(2024-03-24)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Logo is now displayed under map tiles


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **20.4.0** *(2024-03-23)*

<img src="https://img.shields.io/badge/-new%20feature-green"> New logo/favicons

<img src="https://img.shields.io/badge/-new%20feature-green"> new loading page

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed "Show keypads under cursor" setting appearing on mobile/touch screen


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **20.3.0** *(2024-03-22)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Falling back to 256px tiles

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Updated Kokan minimap

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Updated AlBasrah Heightmap

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reworked FavIcons/PWA Manifest


</br></br><!-- CHANGELOG SPLIT MARKER -->





# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">   **20.1.0** *(2024-03-19)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Converted markers to .webp format

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Converted heightmaps to .webp format

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed -again- slight borders appearing between tiles when moving map on chromium (still visible but barely)

</br></br><!-- CHANGELOG SPLIT MARKER -->




# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **20.0.0** *(2024-03-18)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Updated Narva, Tallil, Logar anf Yehorivka maps

<img src="https://img.shields.io/badge/-new%20feature-green"> Now using 512px*512px .WEBP images for tiles, instead of 256px*256px .JPG, thus only using 8% more bandwitch on average.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reduced grid thickness at lower zoom level

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Default map is now Chora (new Basrah is ugly af)

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reduced Javascript bundles size for faster load

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **19.0.0** *(2024-03-07)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Updated AlBasrah, Belaya and Kokan maps according to Squad 7.2 update

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Disabled cursor choice on mobile

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **18.0.0** *(2024-03-07)*

<img src="https://img.shields.io/badge/-new%20feature-green"> You can know choose between classic cursor and crosshair

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a preview in settings popup to help visualizing how settings impact the map

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed an issue with second weapon icons not being renamed correctly after deleting the first weapon

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **17.0.0** *(2024-03-01)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Dispersion calculations are now calculated according to ingame/real life physics and not just estimated. They should be more accurate. Thanks to Moleman for his help understanding the formulas, check [his guide](https://steamcommunity.com/sharedfiles/filedetails/?l=english&id=3118256939&searchtext=Cerca+tra+le+guide+di+Squad) on mortars btw.

<img src="https://img.shields.io/badge/-new%20feature-green"> Now displaying dispersion for UB32 weapon/deployable

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Corrected dead pixels on Sanxian heightmap + resized the file

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Corrected dead pixels on Skorpo

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Corrected dead pixels on Gorodok (thanks Phir)

</br></br><!-- CHANGELOG SPLIT MARKER -->




# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge"> **16.0.0** *(2024-02-08)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Sanxian

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed dead pixels on AlBasrah, Belaya, Chora, Fools Road, Gorodok, Logar, Mestia, Narva, Sumari and Tallil heightmaps resulting on "Out of map" calculations


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **15.0.1** *(2023-12-07)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Weapons being able to be placed outside of map with right click ([#104](https://github.com/sh4rkman/SquadCalc/issues/104))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Map/Settings buttons being offcentered on Safari/SteamBrowsers ([#105](https://github.com/sh4rkman/SquadCalc/issues/105))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Enable calc text zoomanimation so it doesn't "jump" on the map while zooming/unzooming

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Map can now be unzoom further away, allowing to see whole map on mobile/small device

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Re-enabled map-tile buffering : when idle on the map, tiles ouside of view are loading in background to avoid tiles appearing while panning


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **15.0.0** *(2023-12-04)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Simplified interractions with markers : double-click - new targets (or weapon if no weapon have been placed), right-clic - new weapon. Left clicking any markers delete it

<img src="https://img.shields.io/badge/-new%20feature-green"> Weapons Marker can now be deleted even if there is only one left. In this case every target markers are also deleted

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a new setting to show/hide grid

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a new "Shortcuts" in the settings dialog to display how to use the map mode

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Added a slight shadow outline on target markers so they are easier to see on red-ish background or on top of another marker

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed image being cached improperly



</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **14.1.0** *(2023-12-02)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a new setting to replace bearing (°) with distance to target (m) on map mode's targets.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Settings background is now more constrasted, specially in classic mode.

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Moved "show markers animations" to the Performance category in settings

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reduced switchmode/settings buttons on mobile

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed UB32 being inaccurate between 1500-1600m, thanks @Butterhead98 ([#102](https://github.com/sh4rkman/SquadCalc/issues/102))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed social media buttons being blue in settings menu



</br></br><!-- CHANGELOG SPLIT MARKER -->





# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **14.0.0** *(2023-12-01)*

<img src="https://img.shields.io/badge/-new%20feature-green"> New settings menu on bottom right corner to customize map/marker behaviour (external links have been moved here aswell in a more compact way)

<img src="https://img.shields.io/badge/-new%20feature-green"> New animations for weapons & targets markers when created (can be desactivated in settings)

<img src="https://img.shields.io/badge/-new%20feature-green"> New icon for targets markers

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Grid have been reworked to be less blurry at every zoom level

<img src="https://img.shields.io/badge/-%20improv%20-orange"> now buffering grid outside of view to avoid entire parts of maps without grid while panning

<img src="https://img.shields.io/badge/-%20improv%20-orange"> now buffering map tiles outside of view to avoid appearing tiles while panning

<img src="https://img.shields.io/badge/-%20removed%20-red"> Themes have been removed for now, maybe to return later in another form.


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **13.1.0** *(2023-11-26)*

<img src="https://img.shields.io/badge/-new%20feature-green"> A new spread circle has been added on targets to show the spread possibility of rounds (mortar, hellcanon, technicals only)

<img src="https://img.shields.io/badge/-new%20feature-green"> You can now place up to two weapons on the map (CTRL+doubleclick)

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Reduced target marker size

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> The switchmode icon is now correctly centered ([#101](https://github.com/sh4rkman/SquadCalc/issues/101))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Page now waits to be fully loaded before displaying content, avoiding flash of unstyled content. ([#99](https://github.com/sh4rkman/SquadCalc/issues/99))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> On mapmode, calculations doesn't avoid mouse-grabbing the map anymore ([#97](https://github.com/sh4rkman/SquadCalc/issues/97))


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **13.0.1** *(2023-11-22)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Markers now cannot be placed/dragged outside of map ([#98](https://github.com/sh4rkman/SquadCalc/issues/98))

<img src="https://img.shields.io/badge/-%20improv%20-orange">A map (al basrah) is selected by default (legacy/mapmode) ([#93](https://github.com/sh4rkman/SquadCalc/issues/93))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Grid is now fully covering the map ([#92](https://github.com/sh4rkman/SquadCalc/issues/92))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Updated Kokan map



</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **13.0.0** *(2023-11-21)*

<img src="https://img.shields.io/badge/-new%20feature-green"> New interactive map mode ! You can know switch UI mode with the bottom right button to display a map where you can place and drag markers.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed a bug where in legacy mode calculations were displayed even if target was too close. ([#90](https://github.com/sh4rkman/SquadCalc/issues/90)) 


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **12.2** *(2023-11-07)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Sanxian Island (beta)


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **12.1.2** *(2023-11-04)*

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Bottom-right menu now autoclose when clicking elsewhere in the window


</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **12.1.1** *(2023-11-02)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed an issue on Chrome/Edge where calcs on heightmaps were slightly off ([#88](https://github.com/sh4rkman/SquadCalc/issues/88)) 


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **12.1.0** *(2023-11-01)*

<img src="https://img.shields.io/badge/-new%20feature-green"> You are now able to choose high/low angle for every vehicles and Hell cannon by clicking the icon next to elevation

<img src="https://img.shields.io/badge/-new%20feature-green"> You are now able to get negative elevation results for vehicles, it should cover situation where you can tilt a vehicle on a slope to hit a target under you.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed an issue on Safari/Webkit where focus was skipping from target to weapon input when editing weapon coordinates ([#69](https://github.com/sh4rkman/SquadCalc/issues/69) - thanks to TheGrimReaper13/PhiR)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed an issue on Safari Mobile where keyboard is blinking when editing weapon coordinates (Thanks to PhiR)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed an issue where the tooltip encouraging clicking the results to copy them was covering the target input on mobile with on-screen keyboard open. Tooltip is now hidden on mobile

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Implementated an automated testing tool to detect issues and test on various browswers

<img src="https://img.shields.io/badge/-%20improv%20-orange"> Various code refactor & rework


</br></br><!-- CHANGELOG SPLIT MARKER -->




# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **12.0.1** *(2023-10-26)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added new UB32 deployables (same calc than technical UB32, but fancy icon)

<img src="https://img.shields.io/badge/-new%20feature-green"> Reworked weapons in two categories : Deployables/Vehicles

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed [#83](https://github.com/sh4rkman/SquadCalc/issues/83)

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed [#84](https://github.com/sh4rkman/SquadCalc/issues/84)

</br></br><!-- CHANGELOG SPLIT MARKER -->




# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **12.0.0** *(2023-10-26)*

<img src="https://img.shields.io/badge/-new%20feature-green"> New "counting" animation when updating calc numbers

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **11.2.0** *(2023-10-24)*

<img src="https://img.shields.io/badge/-new%20feature-green"> You can know switch between high/low angle with BM-21 Grad by clicking the elevation icon next to elevation number.

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Disabling French DLC mortar for now

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **11.1.2** *(2023-10-16)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fontawesome Icons are now selfhosted


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge">  **11.1.1** *(2023-05-11)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed weapon image width for Steam Browser ([#71](https://github.com/sh4rkman/SquadCalc/issues/66))

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Shooting animation is now hidden when screen size is too small

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **11.1.0** *(2023-05-04)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added a new fancy shooting animation

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed weapon list so it doesn't need scrolling on mobile

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Reduced classic mortar icon size

</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge">  **11.0.0** *(2023-04-26)*

<img src="https://img.shields.io/badge/-new%20feature-green"> aded UB-32 suport

<img src="https://img.shields.io/badge/-%20improv%20-orange"> HellCannon and technical mortar are now using the standard projectile motion formula instead of estimated calculations on ingame table


</br></br><!-- CHANGELOG SPLIT MARKER -->



# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **10.4.0** *(2023-04-24)*

<img src="https://img.shields.io/badge/-new%20feature-green"> updated BM-21 to V4.4  
* new min & max ranges.  
* Reworked weapon to work with a fixed velocity instead of working with the ingame table.  
* BM-21 is now using x2 gravity scale  
* removed min angle

<img src="https://img.shields.io/badge/-new%20feature-green"> added a new red theme



</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **10.3.0** *(2023-04-16)*

<img src="https://img.shields.io/badge/-dev-grey"> Reworked project structure

</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **10.2.0** *(2023-04-14)*

<img src="https://img.shields.io/badge/-new%20feature-green"> now auto-generating robots.txt in prod/dev building scripts

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> fixed weapon selector list being offset

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> fixed [#66](https://github.com/sh4rkman/SquadCalc/issues/66)


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **10.1.0** *(2023-04-08)*

<img src="https://img.shields.io/badge/-new%20feature-green"> updated hellcannon icon

<img src="https://img.shields.io/badge/-new%20feature-green"> added color on save button hover

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> fixed saved calc being misplaced when resizing window

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> updated readme still mentioning 'MSMC'

<img src="https://img.shields.io/badge/-dev-grey"> JS refactoring


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge"> **10.0.0** *(2023-04-06)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Active weapon icon is now displayed in the keypads section

<img src="https://img.shields.io/badge/-new%20feature-green"> Weapons selector is now a classic dropdown selector, displaying weapons in category : mortars, vehicles, frenchdlc

<img src="https://img.shields.io/badge/-new%20feature-green"> Dropdown list now shows current selected in a light red color

<img src="https://img.shields.io/badge/-new%20feature-green"> Added fancy animations on first page load

<img src="https://img.shields.io/badge/-dev-grey"> HTML/CSS refactoring

</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **9.0.3** *(2023-03-20)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added informative tooltips on results

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Removed an unecessary space when saving calcs to clipboard 

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Copy to clipboard now working again on Steam Browser

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Saved calcs should now be correctly centered on all devices

<img src="https://img.shields.io/badge/-dev-grey"> Code refactoring

</br></br><!-- CHANGELOG SPLIT MARKER -->


# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **9.0.2** *(2023-03-18)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added this changelog file

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed caracter " ° " encoding when saving a Tehnical/Hellcanon/Grad-21 calc (Thanks @TheGrimReaper13 !)


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-minor%20release-cd6f68?style=for-the-badge"> **9.0.1** *(2023-03-18)*

<img src="https://img.shields.io/badge/-bug%20fix%20-b22"> Fixed Yehorivka heightmap's offset, heights calculations should be right for now (Thanks @TheGrimReaper13 !)


</br></br><!-- CHANGELOG SPLIT MARKER -->

# <img src="https://img.shields.io/badge/-major%20release-b22222?style=for-the-badge"> **9.0.0** *(2023-03-16)*

<img src="https://img.shields.io/badge/-new%20feature-green"> Added Manicouagan in the map list (removed Manic)

<img src="https://img.shields.io/badge/-new%20feature-green"> Added new weapon : BM-21 "Grad"

<img src="https://img.shields.io/badge/-dev-grey"> Added a "Debug mode" that can be activated in conf.js to make debugging easier
