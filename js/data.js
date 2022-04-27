const version = 6.0;
var stopInfoTooltips = false;

// Each map has a different size and require scaling w, y and z when calculating height
// maps['Name', size, z-scaling]
const maps = [
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
// technicals[distance, Velocity]
const technicals = [
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

// Stocking those values without using it for now
// 120mm mortars are from french DLC and using three different velocity
//var weapons = [
//    ['Classic', 109.890938],
//    ['Technical', 0],
//    ['120mm (S)', 109.890938],
//    ['120mm (M)', 143.5],
//    ['120mm (L)', 171.5],
//];