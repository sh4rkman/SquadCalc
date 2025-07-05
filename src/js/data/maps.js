const FOBEXCLUSIONS = {
    small: 300,
    medium: 400,
};

export const MAPS = [
    { 
        name: "AlBasrah", 
        size: 4000,
        scaling: 0.0582,
        mapURL: "/albasrah/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    // { 
    //     name: "AlBasrah", 
    //     size: 3040, // OK
    //     scaling: 0.01294, // OK
    //     mapURL: "/albasrah/",
    //     radiusExclusion: FOBEXCLUSIONS.medium,
    // },
    { 
        name: "Anvil", 
        size: 3060, //OK
        scaling: 0.216675, 
        mapURL: "/anvil/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Belaya", 
        size: 3904, //OK
        scaling: 0.0726, 
        mapURL: "/belaya/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "BlackCoast", 
        size: 4600, // OK but not what mapdata gave us. Maybe because of x scaling?
        scaling: 0.35, 
        mapURL: "/blackcoast/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Chora", 
        size: 4064, // OK
        scaling: 0.064, 
        mapURL: "/chora/",
        radiusExclusion: FOBEXCLUSIONS.small,
    },
    { 
        name: "Fallujah", 
        size: 3005, // OK
        scaling: 0.0401, // OK
        mapURL: "/fallujah/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "FoolsRoad",
        size: 1774, // OK
        scaling: 0.21600000000000003,
        mapURL: "/foolsroad/",
        radiusExclusion: FOBEXCLUSIONS.small,
    },
    { 
        name: "GooseBay", 
        size: 4031, // OK
        scaling: 0.22064, // OK
        mapURL: "/goosebay/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Gorodok", 
        size: 4064, // OK
        scaling: 0.2, // OK
        mapURL: "/gorodok/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Jensen", 
        size: 4008, // OK
        scaling: 0.0859, // OK
        mapURL: "/jensen/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Harju", 
        size: 4032, // OK
        scaling: 0.131, // OK
        mapURL: "/harju/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Kamdesh", 
        size: 4032, // OK
        scaling: 0.190215, 
        mapURL: "/kamdesh/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Kohat", 
        size: 4617, // OK
        scaling: 0.733125, // OK
        mapURL: "/kohat/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Kokan",
        size: 2496, // OK
        scaling: 0.0164, 
        mapURL: "/kokan/",
        radiusExclusion: FOBEXCLUSIONS.small,
    },
    { 
        name: "Lashkar", 
        size: 4334, // OK
        scaling: 0.28215, 
        mapURL: "/lashkar/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Logar", 
        size: 1761, // OK
        scaling: 0.13575, 
        mapURL: "/logar/",
        radiusExclusion: FOBEXCLUSIONS.small,
    },
    { 
        name: "Manicouagan", 
        size: 4031, // OK
        scaling: 0.3564, 
        mapURL: "/manicouagan/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Mestia", 
        size: 2400,
        scaling: 0.41028, 
        mapURL: "/mestia/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Mutaha", 
        size: 2755, // OK
        scaling: 0.07071, 
        mapURL: "/mutaha/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Narva", 
        size: 2800, // OK
        scaling: 0.0583, 
        mapURL: "/narva/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Narva_f", 
        size: 2800, // OK
        scaling: 0.0583, 
        mapURL: "/narva-flooded/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Pacific", 
        size: 4032, // OK
        scaling: 0.25852400000000003, 
        mapURL: "/pacific/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Sanxian",
        size: 4600, 
        scaling: 0.1892, 
        mapURL: "/sanxian/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Skorpo", 
        size: 6869, // OK
        scaling: 1.0927, 
        mapURL: "/skorpo/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Sumari", 
        size: 1300, // OK
        scaling: 0.035925, 
        mapURL: "/sumari/",
        radiusExclusion: FOBEXCLUSIONS.small,
    },
    { 
        name: "Tallil", 
        size: 4680, // OK
        scaling: 0.05275, 
        mapURL: "/tallil/",
        radiusExclusion: FOBEXCLUSIONS.medium,
    },
    { 
        name: "Yehorivka", 
        size: 6350, // Not the SDK values weirdly
        scaling: 0.3332, 
        mapURL: "/yehorivka/", 
        radiusExclusion: FOBEXCLUSIONS.medium,
    }
];