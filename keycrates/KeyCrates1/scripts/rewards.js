const rewardnames = {
  set1_name: "§aCommon Rewards",
  set2_name: "§bRare Rewards",
  set3_name: "§eLegendary Rewards",
  set4_name: "§bAngel Rewards",
  set5_name: "§dEpic Rewards",
  set6_name: "§2Uncommon Rewards",
  set7_name: "§cMyhtic Rewards",
  set8_name: "§8Netherite Rewards",
  set9_name: "§eGold Rewards",
  set10_name: "§bDiamond Rewards",
};

const keynames = {
  key1_name: "§aCommon Crate Key",
  key2_name: "§bRare Crate Key",
  key3_name: "§eLegendary Crate Key",
  key4_name: "§dEpic Crate Key",
  key5_name: "§8Netherite Crate Key",
  key6_name: "§2Uncommon Crate Key",
  key7_name: "§eGold Crate Key",
  key8_name: "§bDiamond Crate Key",
  key9_name: "§cMyhtic Crate Key",
  key10_name: "§bAngel Crate Key",
};

// Ví dụ về một phần thưởng là vật phẩm
const set1 = [
  {
    // Example: Dirt Block - Basic item with fixed amount and lore
    name: "Dirt Block", // Display name of the item
    typeId: "minecraft:dirt", // Minecraft item ID (VERY IMPORTANT for item-based rewards)
    amount: 64, // Fixed amount of the item
    data: 0, // Data value of the item (usually 0)
    lore: ["§7A common block.", "§aVery useful for building!"], // Custom lore for the item (optional)
    hasEnchantment: false, // Set to false if no enchantment is applied
    chance: 100, // Chance of this item being selected (relative weight)
  },
  {
    // Example: Stone - Basic item with random amount
    name: "Stone",
    typeId: "minecraft:stone",
    amount: [32, 64], // Random amount between 32 and 64
    data: 0,
    lore: ["§7Foundation of many builds."],
    hasEnchantment: false,
    chance: 80,
  },
  {
    // Example: Iron Ingot - Item with no custom lore or enchantment
    name: "Iron Ingot",
    typeId: "minecraft:iron_ingot",
    amount: 10,
    data: 0,
    // No 'lore' property means default lore or no lore
    hasEnchantment: false,
    chance: 60,
  },
  {
    // New Example: Oak Log - Basic resource with random amount
    name: "Oak Log",
    typeId: "minecraft:log",
    amount: [16, 32],
    data: 0, // Data value for Oak Log (adjust if using different wood types)
    lore: ["§7Essential for crafting."],
    hasEnchantment: false,
    chance: 90,
  },
  {
    // New Example: Cobblestone - Common building block
    name: "Cobblestone",
    typeId: "minecraft:cobblestone",
    amount: [48, 64],
    data: 0,
    hasEnchantment: false,
    chance: 95,
  },
  {
    // New Example: Coal - Fuel and crafting material
    name: "Coal",
    typeId: "minecraft:coal",
    amount: [8, 24],
    data: 0,
    lore: ["§7Burns brightly."],
    hasEnchantment: false,
    chance: 75,
  },
];

// Set 2: Items with enchantments
const set2 = [
  {
    // Example: Sharpness Diamond Sword - Item with a specific enchantment
    name: "Sharpness Diamond Sword",
    typeId: "minecraft:diamond_sword",
    amount: 1,
    data: 0,
    lore: [
      "§r§7A powerful blade.",
      "§r§bSharp enough to cut through anything!",
    ],
    hasEnchantment: {
      enchantment: "sharpness", // Specific enchantment type (string)
      level: [3, 5], // Random level between 3 and 5
    },
    chance: 40,
  },
  {
    // Example: Efficiency Pickaxe - Item with a random enchantment from a category
    name: "Efficient Pickaxe",
    typeId: "minecraft:iron_pickaxe",
    amount: 1,
    data: 0,
    lore: ["§r§7Mines faster."],
    hasEnchantment: {
      enchantment: "fortune", // Category of enchantments (from modules/enchantments.js)
      enchantAmount: 1, // Number of enchantments from the category
      level: 3, // Fixed level for the enchantment
    },
    chance: 30,
  },
  {
    // New Example: Fortune Diamond Pickaxe - Specific enchantment with fixed level
    name: "Fortune Diamond Pickaxe",
    typeId: "minecraft:diamond_pickaxe",
    amount: 1,
    data: 0,
    lore: ["§r§7Increases block drops."],
    hasEnchantment: {
      enchantment: "fortune",
      level: 3,
    },
    chance: 25,
  },
  {
    // New Example: Protection Diamond Helmet - Armor with multiple enchantments
    name: "Protected Diamond Helmet",
    typeId: "minecraft:diamond_helmet",
    amount: 1,
    data: 0,
    lore: ["§r§7Shields from damage."],
    hasEnchantment: {
      enchantment: [
        ["protection", 4],
        ["respiration", 3],
      ],
      enchantAmount: 2,
      level: [2, 4],
    },
    chance: 20,
  },
  {
    // New Example: Punch Bow - Bow with a knockback enchantment
    name: "Punch Bow",
    typeId: "minecraft:bow",
    amount: 1,
    data: 0,
    lore: ["§r§7Knocks enemies back."],
    hasEnchantment: {
      enchantment: "punch",
      level: [1, 2],
    },
    chance: 18,
  },
  {
    // New Example: Unbreaking Axe - Tool with only unbreaking enchantment
    name: "Durable Iron Axe",
    typeId: "minecraft:iron_axe",
    amount: 1,
    data: 0,
    hasEnchantment: {
      enchantment: "unbreaking",
      level: [1, 3],
    },
    chance: 22,
  },
];

// Set 3: Items with multiple enchantments and foil effect
const set3 = [
  {
    // Example: Protected Diamond Armor - Item with multiple specific enchantments
    name: "Protected Diamond Chestplate",
    typeId: "minecraft:diamond_chestplate",
    amount: 1,
    data: 0,
    lore: ["§r§7Offers great defense.", "§r§dShines with power."],
    hasEnchantment: {
      enchantment: [
        ["protection", 4], // Protection enchantment, max level 4
        ["unbreaking", 3], // Unbreaking enchantment, max level 3
      ],
      enchantAmount: 2, // Apply 2 enchantments from the list
      level: [2, 4], // Random level for each applied enchantment between 2 and 4 (capped by max level per enchant)
    },
    chance: 20,
  },
  {
    // Example: Infinity Bow - Item with a single specific enchantment and foil
    name: "Infinity Bow",
    typeId: "minecraft:bow",
    amount: 1,
    data: 0,
    lore: ["§r§7Never runs out of arrows.", "§r§eA true archer's dream."],
    hasEnchantment: {
      enchantment: "infinity",
      level: 1,
    },
    chance: 15,
  },
];

//Rewards Set #4
const set4 = [
  // {
  //   name: "Example Format",
  //   id: "minecraft:id",
  //   chance: 50
  // },
  // {
  //   name: "This is an Example Format",
  //   id: "minecraft:id",
  //   data: 0,
  //   amount: [/*min, max*/],
  //   chance: 100,
  //   hasEnchantment: {
  //     enchantment: "any",
  //     enchantAmount: [/*min, max*/],
  //     level: [/*min, max*/]
  //   }
  // }
];

//Rewards Set #5
const set5 = [
  //put your items here
];

//Rewards Set #6
const set6 = [
  //put your items here
];

//Rewards Set #7
const set7 = [
  //put your items here
];

//Rewards Set #8
const set8 = [
  //put your items here
];

//Rewards Set #9
const set9 = [
  //put your items here
];

//Rewards Set #10
const set10 = [
  //put your items here
];

export {
  set1,
  set2,
  set3,
  set4,
  set5,
  set6,
  set7,
  set8,
  set9,
  set10,
  rewardnames,
  keynames,
};
