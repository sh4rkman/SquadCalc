// Each map has a different size and require scaling w, y and z when calculating height
// Map['Name', size, z-scaling]
var maps = [
  ['Al Basrah', 3200, 0.4],
  ['Belaya', 3904, 0.5],
  ['Chora', 4064, 0.06],
  ['Fallujah', 4081, 0.055],
  ['FoolsRoad', 1736, 0.149],
  ['Gorodok', 4340, 0.13],
  ['Kamdesh', 4032, 0.2],
  ['Kohat', 4017, 0.777],
  ['Kokan', 2496, 0.01],
  ['Lashkar', 4334, 0.28],
  ['Logar', 1761, 0.14],
  ['Mestia', 2400, 0.4],
  ['Mutaha', 2755, 0.4],
  ['Narva', 2800, 0.057],
  ['Skorpo', 7600, 2.0],
  ['Sumari', 1300, 0.037],
  ['Tallil', 4680, 0.055],
  ['Yehorivka', 5000, 0.29]
];


$(document).ready(function() {
  $("#version").html("v3.2");
  loadHeatmap();
  console.log("Calculator Loaded!");
});

