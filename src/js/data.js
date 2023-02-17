import AlBasrahURL from "../img/heightmaps/al basrah.jpg";
import AnvilURL from "../img/heightmaps/anvil.jpg";
import BelayaURL from "../img/heightmaps/belaya.jpg";
import BlackCoastURL from "../img/heightmaps/black coast.jpg";
import ChoraURL from "../img/heightmaps/chora.jpg";
import FallujahURL from "../img/heightmaps/fallujah.jpg";
import FoolsRoadURL from "../img/heightmaps/fool's road.jpg";
import GooseBayURL from "../img/heightmaps/goose bay.jpg";
import GorodokURL from "../img/heightmaps/gorodok.jpg";
import KamdeshURL from "../img/heightmaps/kamdesh.jpg";
import KohatURL from "../img/heightmaps/kohat.jpg";
import KokanURL from "../img/heightmaps/kokan.jpg";
import LashkarURL from "../img/heightmaps/lashkar.jpg";
import LogarURL from "../img/heightmaps/logar.jpg";
import ManicURL from "../img/heightmaps/manic.jpg";
import MestiaURL from "../img/heightmaps/mestia.jpg";
import MutahaURL from "../img/heightmaps/mutaha.jpg";
import NarvaURL from "../img/heightmaps/narva.jpg";
import SkorpoURL from "../img/heightmaps/skorpo.jpg";
import SumariURL from "../img/heightmaps/sumari.jpg";
import TallilURL from "../img/heightmaps/tallil.jpg";
import YehorivkaURL from "../img/heightmaps/yehorivka.jpg";



import { Weapon } from "./weapon.js";


export const ClassicMortar = new Weapon("Classic", 109.890938, 1580);
export const TechnicalMortar = new Weapon("Technical", 0, 83.8);
export const MO120_SMortar = new Weapon("MO120_S", 109.890938, 1520);
export const MO120_MMortar = new Weapon("MO120_M", 143.5, 1520);
export const MO120_LMortar = new Weapon("MO120_L", 171.5, 1520);
export const HellMortar = new Weapon("Hell", 0, 88);

export const GRAVITY = 9.8;
export const CANVAS_SIZE = 500;

export var frenchSelection = 0;

export function setFrenchSelection(val) {
    frenchSelection = val;
}

// Each map has a different size and require scaling w, y and z when calculating height
// MAPS['Name', size, z-scaling, mapURL]
export const MAPS = [
    ["Al Basrah", 3200, 0.025, AlBasrahURL],
    ["Anvil", 3060, 0.2, AnvilURL],
    ["Belaya", 3904, 0.074, BelayaURL],
    ["Black Coast", 4625, 0.35, BlackCoastURL],
    ["Chora", 4064, 0.06, ChoraURL],
    ["Fallujah", 4081, 0.055, FallujahURL],
    ["Fool's Road", 1736, 0.149, FoolsRoadURL],
    ["Goose Bay", 4065, 0.2, GooseBayURL],
    ["Gorodok", 4340, 0.13, GorodokURL],
    ["Kamdesh", 4032, 0.2, KamdeshURL],
    ["Kohat", 4617, 1, KohatURL],
    ["Kokan", 2496, 0.01, KokanURL],
    ["Lashkar", 4334, 0.28, LashkarURL],
    ["Logar", 1761, 0.14, LogarURL],
    ["Manic", 4065, 0.76, ManicURL],
    ["Mestia", 2400, 0.4, MestiaURL],
    ["Mutaha", 2755, 0.4, MutahaURL],
    ["Narva", 2800, 0.057, NarvaURL],
    ["Skorpo", 7600, 2.0, SkorpoURL],
    ["Sumari", 1300, 0.037, SumariURL],
    ["Tallil", 4680, 0.055, TallilURL],
    ["Yehorivka", 5000, 0.29, YehorivkaURL]
];

// Since technicals mortars are acting weirdly, i have to stock these empirical values for now until i figure out how they work
// read https://github.com/Endebert/squadmc/discussions/101 for more information
// TECHNICALS[distance, Velocity]
export const TECHNICALS = [
    [50, 47.76901552],
    [100, 63.20591542],
    [200, 77.59023672],
    [300, 85.01920022],
    [400, 90.49300565],
    [500, 94.09830025],
    [600, 96.66132881],
    [700, 99.37483515],
    [800, 101.1651775],
    [900, 103.1447638],
    [1000, 104.7823288],
    [1100, 106.3455911],
    [1200, 108.7830358],
    [1233, 109.7640997]
];


// HELL[distance, Velocity]
export const HELL = [
    [50, 83.807],
    [150, 92.007],
    [200, 93.342],
    [300, 95.028],
    [400, 94.563],
    [500, 94.852],
    [600, 95.643],
    [700, 94.632],
    [800, 95.147],
    [875, 95.527],
    [900, 94.636],
    [925, 95.210],
];