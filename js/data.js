const VERSION = 6.0;
const GRAVITY = 9.8;
const CANVAS_SIZE = 500;
var frenchSelection = 0;
var stopInfoTooltips = false;

const ClassicMortar = new Weapon("Classic", 109.890938, 1580);
const TechnicalMortar = new Weapon("Technical", 0, 83.8);
const MO120_SMortar = new Weapon("MO120_S", 109.890938, 1520);
const MO120_MMortar = new Weapon("MO120_M", 143.5, 1520);
const MO120_LMortar = new Weapon("MO120_L", 171.5, 1520);

// Each map has a different size and require scaling w, y and z when calculating height
// MAPS['Name', size, z-scaling]
const MAPS = [
    ['Al Basrah', 3200, 0.025],
    ['Anvil', 3060, 0.2],
    ['Belaya', 3904, 0.5],
    ['Chora', 4064, 0.06],
    ['Fallujah', 4081, 0.055],
    ['Fool\'s Road', 1736, 0.149],
    ['Goose Bay', 4065, 0.2],
    ['Gorodok', 4340, 0.13],
    ['Kamdesh', 4032, 0.2],
    ['Kohat', 4617, 1],
    ['Kokan', 2496, 0.01],
    ['Lashkar', 4334, 0.28],
    ['Logar', 1761, 0.14],
    ['Manic', 4065, 0.76],
    ['Mestia', 2400, 0.4],
    ['Mutaha', 2755, 0.4],
    ['Narva', 2800, 0.057],
    ['Skorpo', 7600, 2.0],
    ['Sumari', 1300, 0.037],
    ['Tallil', 4680, 0.055],
    ['Yehorivka', 5000, 0.29]
];

// Since technicals mortars are acting weirdly, i have to stock these empirical values for now until i figure out how they work
// read https://github.com/Endebert/squadmc/discussions/101 for more information
// TECHNICALS[distance, Velocity]
const TECHNICALS = [
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