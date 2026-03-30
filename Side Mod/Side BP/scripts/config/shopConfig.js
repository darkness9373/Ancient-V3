// ============================================================
//  SHOP CONFIG
//  sellPrice / buyPrice : gold per batch
//  sellAmount / buyAmount: jumlah item per batch
// ============================================================

// ============================================================
//  GOLD SELL
// ============================================================

export const GOLD_SELL_CATEGORIES = [
    {
        name: '§2Logs',
        items: [
            { typeId: 'minecraft:oak_log',        name: 'Oak Log',      sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:birch_log',       name: 'Birch Log',    sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:spruce_log',      name: 'Spruce Log',   sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:jungle_log',      name: 'Jungle Log',   sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:acacia_log',      name: 'Acacia Log',   sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:dark_oak_log',    name: 'Dark Oak Log', sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:mangrove_log',    name: 'Mangrove Log', sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:cherry_log',      name: 'Cherry Log',   sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:pale_oak_log',    name: 'Pale Oak Log', sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:crimson_stem',    name: 'Crimson Stem', sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:warped_stem',     name: 'Warped Stem',  sellAmount: 16, sellPrice: 4 },
        ]
    },
    {
        name: '§aCrops & Plants',
        items: [
            { typeId: 'minecraft:wheat',           name: 'Wheat',          sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:beetroot',        name: 'Beetroot',       sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:pumpkin',         name: 'Pumpkin',        sellAmount: 16, sellPrice: 6 },
            { typeId: 'minecraft:melon_slice',     name: 'Watermelon',     sellAmount: 16, sellPrice: 5 },
            { typeId: 'minecraft:carrot',          name: 'Carrot',         sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:potato',          name: 'Potato',         sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:sweet_berries',   name: 'Sweet Berries',  sellAmount: 16, sellPrice: 4 },
            { typeId: 'minecraft:bamboo',          name: 'Bamboo',         sellAmount: 16, sellPrice: 3 },
            { typeId: 'minecraft:reeds',           name: 'Sugar Cane',     sellAmount: 16, sellPrice: 3 },
            { typeId: 'minecraft:brown_mushroom',  name: 'Brown Mushroom', sellAmount: 16, sellPrice: 5 },
            { typeId: 'minecraft:red_mushroom',    name: 'Red Mushroom',   sellAmount: 16, sellPrice: 5 },
        ]
    },
    {
        name: '§cNether & Misc',
        items: [
            { typeId: 'minecraft:nether_wart',     name: 'Nether Wart',    sellAmount: 16, sellPrice: 9   },
            { typeId: 'minecraft:quartz',          name: 'Nether Quartz',  sellAmount: 16, sellPrice: 8   },
            { typeId: 'minecraft:glowstone_dust',  name: 'Glowstone Dust', sellAmount: 16, sellPrice: 7   },
            { typeId: 'minecraft:slime_ball',      name: 'Slimeball',      sellAmount: 8,  sellPrice: 12  },
            { typeId: 'minecraft:nether_star',     name: 'Nether Star',    sellAmount: 1,  sellPrice: 900 },
        ]
    },
    // // Tambahkan kategori sell baru di sini:
    // {
    //     name: '§eNama Kategori',
    //     items: [
    //         { typeId: 'namespace:item_id', name: 'Item Name', sellAmount: 16, sellPrice: 10 },
    //     ]
    // },
]

export const GOLD_SELL_ITEMS = GOLD_SELL_CATEGORIES.flatMap(c => c.items);

// ============================================================
//  GOLD BUY
// ============================================================

export const GOLD_BUY_CATEGORIES = [
    {
        name: '§bOres & Materials',
        items: [
            { typeId: 'minecraft:diamond',         name: 'Diamond',        buyAmount: 1,  buyPrice: 160  },
            { typeId: 'minecraft:raw_iron',        name: 'Raw Iron',       buyAmount: 16, buyPrice: 10   },
            { typeId: 'minecraft:raw_gold',        name: 'Raw Gold',       buyAmount: 16, buyPrice: 15   },
            { typeId: 'minecraft:raw_copper',      name: 'Raw Copper',     buyAmount: 16, buyPrice: 8    },
            { typeId: 'minecraft:quartz',          name: 'Nether Quartz',  buyAmount: 16, buyPrice: 12   },
            { typeId: 'minecraft:clay_ball',       name: 'Clay Ball',      buyAmount: 16, buyPrice: 5    },
            { typeId: 'minecraft:glowstone_dust',  name: 'Glowstone Dust', buyAmount: 16, buyPrice: 10   },
            { typeId: 'minecraft:redstone',        name: 'Redstone Dust',  buyAmount: 16, buyPrice: 8    },
            { typeId: 'minecraft:slime_ball',      name: 'Slimeball',      buyAmount: 8,  buyPrice: 18   },
            { typeId: 'minecraft:blaze_powder',    name: 'Blaze Powder',   buyAmount: 16, buyPrice: 22   },
            { typeId: 'minecraft:obsidian',        name: 'Obsidian',       buyAmount: 8,  buyPrice: 30   },
        ]
    },
    {
        name: '§2Logs',
        items: [
            { typeId: 'minecraft:oak_log',         name: 'Oak Log',        buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:birch_log',       name: 'Birch Log',      buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:spruce_log',      name: 'Spruce Log',     buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:jungle_log',      name: 'Jungle Log',     buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:acacia_log',      name: 'Acacia Log',     buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:dark_oak_log',    name: 'Dark Oak Log',   buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:mangrove_log',    name: 'Mangrove Log',   buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:cherry_log',      name: 'Cherry Log',     buyAmount: 16, buyPrice: 9 },
            { typeId: 'minecraft:pale_oak_log',    name: 'Pale Oak Log',   buyAmount: 16, buyPrice: 9 },
            { typeId: 'minecraft:crimson_stem',    name: 'Crimson Stem',   buyAmount: 16, buyPrice: 8 },
            { typeId: 'minecraft:warped_stem',     name: 'Warped Stem',    buyAmount: 16, buyPrice: 8 },
        ]
    },
    {
        name: '§7Blocks',
        items: [
            { typeId: 'minecraft:stone',           name: 'Stone',          buyAmount: 16, buyPrice: 5  },
            // Concrete — semua warna
            { typeId: 'minecraft:white_concrete',      name: 'White Concrete',      buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:orange_concrete',     name: 'Orange Concrete',     buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:magenta_concrete',    name: 'Magenta Concrete',    buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:light_blue_concrete', name: 'Light Blue Concrete', buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:yellow_concrete',     name: 'Yellow Concrete',     buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:lime_concrete',       name: 'Lime Concrete',       buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:pink_concrete',       name: 'Pink Concrete',       buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:gray_concrete',       name: 'Gray Concrete',       buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:light_gray_concrete', name: 'Light Gray Concrete', buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:cyan_concrete',       name: 'Cyan Concrete',       buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:purple_concrete',     name: 'Purple Concrete',     buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:blue_concrete',       name: 'Blue Concrete',       buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:brown_concrete',      name: 'Brown Concrete',      buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:green_concrete',      name: 'Green Concrete',      buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:red_concrete',        name: 'Red Concrete',        buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:black_concrete',      name: 'Black Concrete',      buyAmount: 16, buyPrice: 6 },
            // Terracotta — semua warna
            { typeId: 'minecraft:terracotta',              name: 'Terracotta',            buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:white_terracotta',        name: 'White Terracotta',      buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:orange_terracotta',       name: 'Orange Terracotta',     buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:magenta_terracotta',      name: 'Magenta Terracotta',    buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:light_blue_terracotta',   name: 'Light Blue Terracotta', buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:yellow_terracotta',       name: 'Yellow Terracotta',     buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:lime_terracotta',         name: 'Lime Terracotta',       buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:pink_terracotta',         name: 'Pink Terracotta',       buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:gray_terracotta',         name: 'Gray Terracotta',       buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:light_gray_terracotta',   name: 'Light Gray Terracotta', buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:cyan_terracotta',         name: 'Cyan Terracotta',       buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:purple_terracotta',       name: 'Purple Terracotta',     buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:blue_terracotta',         name: 'Blue Terracotta',       buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:brown_terracotta',        name: 'Brown Terracotta',      buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:green_terracotta',        name: 'Green Terracotta',      buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:red_terracotta',          name: 'Red Terracotta',        buyAmount: 16, buyPrice: 5 },
            { typeId: 'minecraft:black_terracotta',        name: 'Black Terracotta',      buyAmount: 16, buyPrice: 5 },
        ]
    },
    {
        name: '§aCrops',
        items: [
            { typeId: 'minecraft:carrot',          name: 'Carrot',         buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:potato',          name: 'Potato',         buyAmount: 16, buyPrice: 6 },
            { typeId: 'minecraft:reeds',           name: 'Sugar Cane',     buyAmount: 16, buyPrice: 7 },
        ]
    },
    {
        name: '§eSpecial',
        items: [
            { typeId: 'minecraft:name_tag',        name: 'Name Tag',            buyAmount: 1, buyPrice: 90   },
            { typeId: 'minecraft:nether_star',     name: 'Nether Star',         buyAmount: 1, buyPrice: 1200 },
            { typeId: 'minecraft:villager_spawn_egg', name: 'Villager Spawn Egg', buyAmount: 1, buyPrice: 1200 },
        ]
    },
    // // Tambahkan kategori buy baru di sini:
    // {
    //     name: '§eNama Kategori',
    //     items: [
    //         { typeId: 'namespace:item_id', name: 'Item Name', buyAmount: 16, buyPrice: 10 },
    //     ]
    // },
]

export const GOLD_BUY_ITEMS = GOLD_BUY_CATEGORIES.flatMap(c => c.items);