import AlBasrahURL from "../img/heightmaps/al basrah.jpg";
import AnvilURL from "../img/heightmaps/anvil.jpg";
import BelayaURL from "../img/heightmaps/belaya.jpg";
import BlackCoastURL from "../img/heightmaps/black coast.jpg";
import ChoraURL from "../img/heightmaps/chora.jpg";
import FallujahURL from "../img/heightmaps/fallujah.jpg";
import FoolsRoadURL from "../img/heightmaps/fool's road.jpg";
import GooseBayURL from "../img/heightmaps/goose bay.jpg";
import GorodokURL from "../img/heightmaps/gorodok.jpg";
import HarjuURL from "../img/heightmaps/harju.jpg";
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

// Each map has a different size and require scaling w, y and z when calculating height
// MAPS['Name', size, X-offset, Y-offset, z-scaling, mapURL]
export const MAPS = [
    ["Al Basrah", 3200, 432, 432, 0.02294, AlBasrahURL],
    ["Anvil", 3060, 0, 0, 0.2, AnvilURL],
    ["Belaya", 3904, 62, 62, 0.0726, BelayaURL],
    ["Black Coast", 4625, 0, 0, 0.35, BlackCoastURL],
    ["Chora", 4064, 0, 0, 0.064, ChoraURL],
    ["Fallujah", 4080, 5700, 3800, 0.0401, FallujahURL],
    ["Fool's Road", 1736, -150, 0, 0.15744, FoolsRoadURL],
    ["Goose Bay", 4065, 0, 0, 0.2, GooseBayURL],
    ["Gorodok", 4340, 200, 200, 0.119, GorodokURL],
    ["Harju", 4065, 0, 0, 0.1, HarjuURL],
    ["Kamdesh", 4032, 0, 0, 0.190215, KamdeshURL],
    ["Kohat", 4617, -1000, 0, 1, KohatURL],
    ["Kokan", 2496, 0, 0, 0.0164, KokanURL],
    ["Lashkar", 4334, 0, 0, 0.28215, LashkarURL],
    ["Logar", 1761, 0, 0, 0.13575, LogarURL],
    ["Manic", 4065, 0, 0, 0.76, ManicURL],
    ["Mestia", 2400, 0, 0, 0.41028, MestiaURL],
    ["Mutaha", 2755, -70, -100, 0.07071, MutahaURL],
    ["Narva", 2800, -100, -100, 0.0583, NarvaURL],
    ["Skorpo", 7600, 0, 0, 2.14515, SkorpoURL],
    ["Sumari", 1300, 0, 0, 0.035925, SumariURL],
    ["Tallil", 4680, -200, -200, 0.05275, TallilURL],
    ["Yehorivka", 5000, -300, -300, 0.2732, YehorivkaURL]
];