import {
  world,
  Player,
  system,
  EquipmentSlot,
  ItemStack,
  EnchantmentTypes,
} from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import {
  any,
  armor,
  bow,
  crossbow,
  fishingrod,
  sword,
  axe,
  pickaxe,
  hoe,
  shovel,
} from "./modules/enchantments"; // Ensure this path is correct
import {
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
} from "./rewards.js"; // Ensure this path is correct

// --- Reward Sets ---
let rewardsSet;
let globalRewardMessage = true;
let rewardParticle = "minecraft:totem_particle"; 
let globalMessageFormat = " §f{player}§7 Get §e{item}§r§7 From Crates §f{crate}§r§7!";
let customParticles = [];

const rewardData = world.getDynamicProperty("rewards");
if (rewardData) {
  rewardsSet = JSON.parse(rewardData);
} else {
  rewardsSet = [set1, set2, set3, set4, set5, set6, set7, set8, set9, set10];
}

// --- Item Type to Enchantment Mapping ---
const translateType = {
  sword: sword,
  pickaxe: pickaxe,
  axe: axe,
  hoe: hoe,
  shovel: shovel,
  any: any,
  armor: armor,
  bow: bow,
  crossbow: crossbow,
  "fishing rod": fishingrod,
  fishing_rod: fishingrod,
  fishingrod: fishingrod,
};

const keys = new Map([
  ["je:key1", keynames.key1_name],
  ["je:key2", keynames.key2_name],
  ["je:key3", keynames.key3_name],
  ["je:key4", keynames.key4_name],
  ["je:key5", keynames.key5_name],
  ["je:key6", keynames.key6_name],
  ["je:key7", keynames.key7_name],
  ["je:key8", keynames.key8_name],
  ["je:key9", keynames.key9_name],
  ["je:key10", keynames.key10_name],
]);

try {
  system.events.beforeWatchdogTerminate.subscribe(
    (eventData) => (eventData.cancel = true)
  );
} catch (error) {
  system.beforeEvents.watchdogTerminate.subscribe((eventData) => {
    system.run(() => {
      eventData.cancel = true;
    });
  });
}

system.runTimeout(() => { 
  try { 
    const rewardData = world.getDynamicProperty("rewards"); 
    const keyData = world.getDynamicProperty("keynames");
    const rewardNameData = world.getDynamicProperty("rewardnames");
    const msgSetting = world.getDynamicProperty("globalRewardMessage");
    const particleSetting = world.getDynamicProperty("rewardParticle");
    const msgFormat = world.getDynamicProperty("globalMessageFormat");
    const customP = world.getDynamicProperty("customParticles");
    if (rewardData) rewardsSet = JSON.parse(rewardData);
    if (keyData) keynames = JSON.parse(keyData);
    if (rewardNameData) rewardnames = JSON.parse(rewardNameData);
    if (msgSetting !== undefined) globalRewardMessage = Boolean(msgSetting);
    if (particleSetting) rewardParticle = particleSetting;
    if (msgFormat) globalMessageFormat = msgFormat;
    if (customP) customParticles = JSON.parse(customP);
  } catch (e) { 
    console.warn("Gagal load dynamic properties:", e);
  }
}, 10);

function saveAll() {
  try {
    world.setDynamicProperty("rewards", JSON.stringify(rewardsSet));
    world.setDynamicProperty("keynames", JSON.stringify(keynames));
    world.setDynamicProperty("rewardnames", JSON.stringify(rewardnames));
    world.setDynamicProperty("globalRewardMessage", globalRewardMessage);
    world.setDynamicProperty("rewardParticle", rewardParticle);
    world.setDynamicProperty("globalMessageFormat", globalMessageFormat);
    world.setDynamicProperty("customParticles", JSON.stringify(customParticles));
  } catch (e) {
    console.warn("Gagal menyimpan dynamic properties:", e);
  }
}

world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
  if (!player.hasTag("admin")) return;
  if (itemStack?.typeId !== "minecraft:nether_star") return;
  showAdminUI(player);
});

function showAdminUI(player) {
  const form = new ActionFormData()
    .title("§l§6Admin Crate Panel")
    .body("Select management menu:")
    .button("Edit Name Key", "textures/ui/icon_best3")
    .button("Edit Name Reward Set", "textures/ui/icon_blackfriday")
    .button("Manage Reward Set Content", "textures/ui/icon_setting")
    .button("Manage Reward Set", "textures/ui/icon_armor")
    .button("Manage Global Message", "textures/ui/icon_agent")
    .button("Manage Reward Particle", "textures/ui/icon_expand")
    .button("❌ Exit", "textures/ui/redX1");

  form.show(player).then(res => {
    if (res.canceled) return showAdminUI(player);
    switch (res.selection) {
      case 0: 
        editKeyNames(player);
        break;
      case 1: 
        editRewardSetNames(player);
        break;
      case 2: 
        manageRewardSet(player);
        break;
      case 3:
        manageRewardSetStructure(player);
        break;
      case 4:
        manageGlobalChat(player);
        break;
      case 5:
        showParticleAdminTab(player);
        break;
      case 6:
        player.playSound("random.pop");
        break;
    }
  });
}

const defaultParticleOptions = [
  ["Totem Particle", "minecraft:totem_particle"],
  ["Dragon Destroy Block", "minecraft:dragon_destroy_block"],
  ["Happy Villager", "minecraft:villager_happy"],
  ["Critical Hit", "minecraft:crit"],
  ["Firework Spark", "minecraft:firework_spark"],
  ["End Rod Trail", "minecraft:end_rod"]
];

function manageGlobalChat(player) {
  const form = new ActionFormData()
  .title("Manage Global Chat")
  .body("Select What You Want Settings")
  .button(
        globalRewardMessage ? "📢 Pesan Global: §aAktif" : "📢 Pesan Global: §cNonaktif",
        globalRewardMessage ? "textures/ui/toggle_on" : "textures/ui/toggle_off"
  )
  .button("Form Global Message", "textures/ui/icon_setting");
  form.show(player).then(res => {
    if (res.canceled) return showAdminUI(player);
    switch (res.selection) {
      case 0:
        globalRewardMessage = !globalRewardMessage;
        saveAll();
        player.sendMessage(`§7Pesan global reward sekarang ${globalRewardMessage ? "§aAKTIF" : "§cNONAKTIF"}`);
        break;
      case 1:
        showEditGlobalMessage(player);
        break;
    }
  });
}

function showParticleSelector(player) {
  const options = [...defaultParticleOptions.map(p => p[1]), ...customParticles];
  const names = [...defaultParticleOptions.map(p => p[0]), ...customParticles.map(p => `Custom: ${p}`)];
  const form = new ModalFormData()
    .title("Pengaturan Partikel Reward")
    .dropdown("Pilih Particle Reward:", names, {
      defaultValueIndex: options.findIndex(p => p === rewardParticle)
    });

  form.show(player).then(res => {
    if (res.canceled) return;
    const selected = res.formValues[0];
    rewardParticle = options[selected];
    saveAll();
    player.sendMessage(`§aParticle reward diubah ke: §f${rewardParticle}`);
  });
}

function showAddCustomParticle(player) {
  const form = new ModalFormData()
    .title("Tambah Particle Custom")
    .textField("Masukkan ID Particle (contoh: minecraft:soul_flame)", "", {
      defaultValue: "minecraft:"
    });

  form.show(player).then(res => {
    if (res.canceled) return;
    const id = res.formValues[0].trim();
    if (customParticles.includes(id)) return player.sendMessage("§cParticle tersebut sudah ada dalam daftar.");
    customParticles.push(id);
    saveAll();
    player.sendMessage(`§aParticle §f${id}§a berhasil ditambahkan!`);
  });
}

function showDeleteCustomParticle(player) {
  if (customParticles.length === 0) return player.sendMessage("§cTidak ada particle custom yang bisa dihapus.");
  const form = new ModalFormData()
    .title("Hapus Particle Custom")
    .dropdown("Pilih particle yang ingin dihapus:", customParticles, {
      defaultValueIndex: 0
    });

  form.show(player).then(res => {
    if (res.canceled) return;
    const selected = res.formValues[0];
    const removed = customParticles.splice(selected, 1);
    saveAll();
    player.sendMessage(`§eParticle §f${removed[0]}§e telah dihapus.`);
  });
}

function showEditCustomParticle(player) {
  if (customParticles.length === 0) return player.sendMessage("§cTidak ada particle custom yang bisa diedit.");
  const form = new ModalFormData()
    .title("Edit Particle Custom")
    .dropdown("Pilih particle yang ingin diedit:", customParticles, {
      defaultValueIndex: 0
    });

  form.show(player).then(res => {
    if (res.canceled) return;
    const selected = res.formValues[0];
    const current = customParticles[selected];
    const editForm = new ModalFormData()
      .title("Edit Particle")
      .textField("Ganti ID Particle:", "minecraft:example", current);

    editForm.show(player).then(result => {
      if (result.canceled) return;
      const newId = result.formValues[0].trim();
      if (!newId.startsWith("minecraft:")) return player.sendMessage("§cID harus diawali dengan 'minecraft:'");
      customParticles[selected] = newId;
      saveAll();
      player.sendMessage(`§aParticle telah diubah menjadi: §f${newId}`);
    });
  });
}

function showParticleAdminTab(player) {
  const form = new ActionFormData()
    .title("⚙ Pengaturan Particle")
    .body("Kelola efek particle reward.")
    .button("✨ Pilih Particle Saat Reward", "textures/ui/icon_agent")
    .button("➕ Tambah Particle Custom", "textures/ui/color_plus")
    .button("✏ Edit Particle Custom", "textures/ui/icon_setting")
    .button("🗑 Hapus Particle Custom", "textures/ui/icon_trash")
    .button("❌ Kembali", "textures/ui/redX1");

  form.show(player).then(res => {
    if (res.canceled) return;
    switch (res.selection) {
      case 0: return showParticleSelector(player);
      case 1: return showAddCustomParticle(player);
      case 2: return showEditCustomParticle(player)
      case 3: return showDeleteCustomParticle(player);
      case 4: return showAdminUI(player);
    }
  });
}


function showEditGlobalMessage(player) {
  const form = new ModalFormData()
    .title("Kustom Pesan Global")
    .textField("Format Pesan:", "{player} dapat {item} dari {crate}", {
      defaultValue: globalMessageFormat
    });

  form.show(player).then(res => {
    if (res.canceled) return showEditGlobalMessage(player);
    const text = res.formValues[0].trim();
    if (!text.includes("{player}") || !text.includes("{item}")) {
      return player.sendMessage("§cFormat harus mengandung {player} dan {item}");
    }
    globalMessageFormat = text;
    saveAll();
    player.sendMessage("§aFormat pesan global berhasil diperbarui!");
  });
}


function manageRewardSetStructure(player) {
  new ActionFormData()
    .title("🗂 Manage Reward Set")
    .body("Select Action:")
    .button("➕ Add Reward Set", "textures/ui/color_plus")
    .button("✏ Edit Reward Set Name", "textures/ui/icon_setting")
    .button("🗑 Delete Empty Reward Set", "textures/ui/icon_trash")
    .button("⬅ Return", "textures/ui/redX1")
    .show(player).then(res => {
      if (res.canceled) return;
      switch (res.selection) {
        case 0: {
          const nextId = rewardsSet.length + 1;
          rewardsSet.push([]);
          rewardnames[`set${nextId}_name`] = `§fReward Set ${nextId}`;
          saveAll();
          player.sendMessage(` §b» §a✓ Reward set ${nextId} ditambahkan.`);
          break;
        }
        case 1:
          editRewardSetNames(player);
          break;
        case 2: {
          let removed = 0;
          for (let i = rewardsSet.length - 1; i >= 0; i--) {
            if (rewardsSet[i].length === 0) {
              rewardsSet.splice(i, 1);
              delete rewardnames[`set${i + 1}_name`];
              removed++;
            }
          }
          saveAll();
          player.sendMessage(` §b» §a✓ ${removed} reward set kosong telah dihapus.`);
          break;
        }
        case 3:
          showAdminUI(player);
      }
    });
}

function editKeyNames(player) {
  const keys = Object.keys(keynames);
  const form = new ModalFormData()
  .title("Edit Nama Key");
  for (let key of keys) {
    form.textField(key.replace("_name", "").toUpperCase(), "Nama Baru", {
      defaultValue: keynames[key]
    });
  }
  form.show(player).then(res => {
    if (res.canceled) return;
    keys.forEach((key, i) => {
      keynames[key] = res.formValues[i] || keynames[key];
    });
    saveAll();
    player.sendMessage(" §b» §a✓ Nama key berhasil diperbarui.");
  });
}

function editRewardSetNames(player) {
  const keys = Object.keys(rewardnames);
  const form = new ModalFormData().title("Edit Nama Reward Set");
  for (let key of keys) {
    form.textField(key.replace("_name", "Set "), "Nama Baru", {
      defaultValue: rewardnames[key]
    });
  }
  form.show(player).then(res => {
    if (res.canceled) return;
    keys.forEach((key, i) => {
      rewardnames[key] = res.formValues[i] || rewardnames[key];
    });
    saveAll();
    player.sendMessage(" §b» §a✓ Nama reward set berhasil diperbarui.");
  });
}

function editRewardItem(player, setIndex, itemIndex) {
  const isNew = itemIndex === null;
  const item = isNew ? {
    name: "",
    typeId: "minecraft:stone",
    amount: 1,
    data: 0,
    chance: 100,
    lore: [],
    hasEnchantment: false
  } : { ...rewardsSet[setIndex][itemIndex] };

  const allEnchants = EnchantmentTypes.getAll().map(e => e.id);
  const enchantList = ["Tidak Ada", ...allEnchants];

  const form = new ModalFormData()
    .title(isNew ? "➕ Add Reward" : "✏ Edit Reward")
    .textField("Name", "", { 
      defaultValue: item.name || ""
    })
    .textField("Type ID", "", {
      defaultValue: item.typeId || "minecraft:stone"
    })
    .textField("Amount", "", { 
      defaultValue: Array.isArray(item.amount) ? item.amount.join(",") : `${item.amount}`
    })
    .textField("Data", "", { 
      defaultValue: `${item.data || 0}`
    })
    .textField("Chance", "", { 
      defaultValue: `${item.chance || 100}`
    })
    .textField("Lore (pisah dengan |)", "", {
      defaultValue: item.lore?.join("|") || ""
    });

  for (let i = 0; i < 10; i++) {
    const ench = item.hasEnchantment?.enchantment?.[i]?.[0] || "There isn't any";
    const lvl = item.hasEnchantment?.enchantment?.[i]?.[1] || 1;
    form.dropdown(`Enchant #${i + 1}`, enchantList, {
      defaultValueIndex: 0
    })
    form.dropdown(`Level ${i + 1}`, Array.from({ length: 20 }, (_, n) => `${n + 1}`), {
      defaultValueIndex: lvl - 1
    });
  }

  form.show(player).then(res => {
    if (res.canceled) return;

    let [name, typeId, amount, data, chance, loreText, ...enchParts] = res.formValues;
    item.name = name;
    item.typeId = typeId;
    item.data = parseInt(data);
    item.chance = parseInt(chance);
    item.lore = loreText ? loreText.split("|") : [];

    item.amount = amount.includes(",") ? amount.split(",").map(n => parseInt(n)) : parseInt(amount);

    const enchList = [];
    for (let i = 0; i < enchParts.length; i += 2) {
      const enchId = enchantList[enchParts[i]];
      const lvl = parseInt(enchParts[i + 1]) + 1;
      if (enchId !== "Tidak Ada") enchList.push([enchId, lvl]);
    }

    if (enchList.length > 0) {
      item.hasEnchantment = {
        enchantment: enchList,
        enchantAmount: enchList.length,
        level: enchList.map(e => e[1])
      };
    } else {
      item.hasEnchantment = false;
    }

    if (isNew) rewardsSet[setIndex].push(item);
    else rewardsSet[setIndex][itemIndex] = item;

    saveAll();
    player.sendMessage(" §b» §a✓ Reward berhasil disimpan.");
    showRewardSetEditor(player, setIndex);
  });
}

function showRewardSetEditor(player, setIndex) {
  const rewardSet = rewardsSet[setIndex];
  const form = new ActionFormData()
    .title(`📦 ${rewardnames[`set${setIndex + 1}_name`] || `Set ${setIndex + 1}`}`)
    .body("Pilih reward yang ingin diedit atau tambahkan baru:");

  rewardSet.forEach((r, i) => {
    form.button(`${i + 1}. ${r.name || r.display?.name || "Unknown"}`);
  });

  form.button("➕ Tambah Reward Baru");
  form.button("⬅ Kembali");

  form.show(player).then(res => {
    if (res.canceled) return;
    if (res.selection === rewardSet.length) {
      return editRewardItem(player, setIndex, null);
    }
    if (res.selection === rewardSet.length + 1) {
      return manageRewardSet(player);
    }
    editRewardItem(player, setIndex, res.selection);
  });
}

function manageRewardSet(player) {
  const form = new ActionFormData()
    .title("📦 Pilih Reward Set")
    .body("Pilih reward set yang ingin dikelola:");

  for (let i = 0; i < rewardsSet.length; i++) {
    const name = rewardnames[`set${i + 1}_name`] || `Set ${i + 1}`;
    form.button(name);
  }

  form.show(player).then(res => {
    if (res.canceled) return;
    const index = res.selection;
    if (index < 0 || index >= rewardsSet.length) return;
    showRewardSetEditor(player, index);
  });
}

function showcaseItems(reward, total) {
  let choose = [];
  let lastItem = null;

  function shuffleArray(array) {
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  // If only one reward, repeat it 'total' times.
  if (reward.length === 1) {
    let item = reward[0];
    for (let i = 0; i < total; i++) {
      choose.push(item);
    }
    return choose;
  }

  // Fill 'choose' array with items, avoiding immediate repeats.
  while (choose.length < total) {
    let shuffled = shuffleArray(reward);
    for (let item of shuffled) {
      if (choose.length >= total) {
        break;
      }
      if (item !== lastItem) {
        choose.push(item);
        lastItem = item;
      } else {
        let alternate = reward.filter((x) => x !== item);
        if (alternate.length > 0) {
          choose.push(alternate[0]);
          lastItem = alternate[0];
        } else {
          choose.push(item);
          lastItem = item;
        }
      }
    }
  }
  return choose;
}

// --- Generic Array Shuffle Function ---
// Shuffles an array in place.
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showcaseAnim(entity, set) {
  let chosearr = showcaseItems(set, 30);
  let totalnumber = chosearr.length;
  let initialDelay = 2;
  let delay = initialDelay;
  let count = 0;
  let number = 0;

  system.run(function run() {
    if (count < delay) {
      count++;
    } else {
      count = 0;
      number++; // Move to the next item
      let num = number - 1; // Current item's actual index

      try {
        if (!chosearr[num]) {
          if (number >= totalnumber) return; // Exit if no more items
          system.run(run); // Continue to next item if possible
          return;
        }

        // Display item based on whether it's a command-based reward or a direct item.
        if (!chosearr[num].commands && chosearr[num].typeId) {
          let data = chosearr[num].data ? chosearr[num].data : 0;
          try {
            entity.runCommand(
              `replaceitem entity @s slot.weapon.mainhand 0 ${chosearr[num].typeId} 1 ${data}`
            );
          } catch (cmdErr) {
            console.error(
              `[SHOWCASE_ANIM_CMD_ERROR] Error replacing item for showcase: ${cmdErr.message}`
            );
          }
          entity.nameTag = `${chosearr[num].name}`;
          if (chosearr[num].hasEnchantment) {
            try {
              entity.runCommand(`enchant @s unbreaking`); // Generic enchant for visual glow
            } catch (cmdErr) {
              console.error(
                `[SHOWCASE_ANIM_CMD_ERROR] Error enchanting for showcase glow: ${cmdErr.message}`
              );
            }
          }
        } else {
          let data = chosearr[num].display.data
            ? chosearr[num].display.data
            : 0;
          let id = chosearr[num].display.item
            ? chosearr[num].display.item
            : "minecraft:command_block";
          let name = chosearr[num].display.name
            ? chosearr[num].display.name
            : "???";
          try {
            entity.runCommand(
              `replaceitem entity @s slot.weapon.mainhand 0 ${id} 1 ${data}`
            );
          } catch (cmdErr) {
            console.error(
              `[SHOWCASE_ANIM_CMD_ERROR] Error replacing item for showcase (command-based): ${cmdErr.message}`
            );
          }
          entity.nameTag = `${name}`;
          if (chosearr[num].display.foil) {
            try {
              entity.runCommand(`enchant @s unbreaking`); // Generic enchant for visual glow
            } catch (cmdErr) {
              console.error(
                `[SHOWCASE_ANIM_CMD_ERROR] Error enchanting for showcase glow (command-based): ${cmdErr.message}`
              );
            }
          }
        }
      } catch (error) {
        console.error("[SHOWCASE_ANIM] Error in try-catch block:", error);
      }
      try {
        entity.runCommand(`playsound note.banjo @a ~~~`); // Play a sound effect
      } catch (cmdErr) {
        console.error(
          `[SHOWCASE_ANIM_CMD_ERROR] Error playing sound: ${cmdErr.message}`
        );
      }

      // Adjust animation speed based on remaining items.
      let remaining = totalnumber - number;
      if (remaining >= (totalnumber * 2) / 3) {
        delay = initialDelay;
      } else if (remaining >= totalnumber / 3) {
        delay = initialDelay * 1.5;
      } else {
        delay = initialDelay * 3;
      }
    }
    if (number >= totalnumber) return;
    system.run(run); // Continue the animation
  });
}


function giveReward(rollRewards, crateSource, crateType, playername) {
  rollRewards = shuffle(rollRewards);
  let totalWeight = rollRewards.reduce((sum, reward) => sum + reward.chance, 0);
  let randomWeight = Math.floor(Math.random() * totalWeight) + 1;

  let chosenReward = null;
  for (let reward of rollRewards) {
    if (randomWeight <= reward.chance) {
      chosenReward = reward;
      break;
    }
    randomWeight -= reward.chance;
  }

  if (!chosenReward) return;
  const reward = chosenReward;
  let percentChance = Math.round(1000 * (reward.chance / totalWeight)) / 10;

  if (!reward.commands && reward.typeId) {
    let amount = 1;
    if (reward.amount) {
      if (Array.isArray(reward.amount)) {
        let [minAmount, maxAmount] = reward.amount;
        if (minAmount > maxAmount) [minAmount, maxAmount] = [maxAmount, minAmount];
        amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
      } else {
        amount = typeof reward.amount === "string" ? parseInt(reward.amount) : reward.amount;
        if (isNaN(amount) || amount < 1) amount = 1;
      }
    }

    try {
      crateSource.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${reward.typeId} ${amount} ${reward.data || 0}`);
    } catch (e) {}

    system.run(() => {
      let i = new ItemStack(reward.typeId, amount);
      if (!i) return;

      i.nameTag = `§r§f${reward.name}§r`;
      i.setLore(reward.lore || []);

      const enchantmentsToApply = [];
      if (reward.hasEnchantment?.enchantment?.length) {
        for (const [enchId, enchLevel] of reward.hasEnchantment.enchantment) {
          enchantmentsToApply.push({ id: enchId.toLowerCase(), level: enchLevel });
        }
      }

      const enchantableComp = i.getComponent("minecraft:enchantable");
      if (enchantableComp) {
        try {
          enchantableComp.removeAllEnchantments();
          for (const ench of enchantmentsToApply) {
            const enchType = EnchantmentTypes.get(ench.id);
            if (!enchType) continue;
            enchantableComp.addEnchantment({ type: enchType, level: ench.level });
          }
        } catch (e) {}
      }

      crateSource.nameTag = `§6${amount}§rx §e${reward.name}§r`;
      try {
        crateSource.runCommand(`particle ${rewardParticle || "minecraft:totem_particle"} ~ ~1.2 ~`);
      } catch (e) {}

      const resetTimer = system.runTimeout(() => {
        try { crateSource.runCommand(`playsound random.pop2 @a ~~~ 1.5`); } catch {}
        try { crateSource.runCommand(`particle minecraft:dragon_destroy_block ~ ~1.5 ~`); } catch {}
        crateSource.triggerEvent(`je:event2.5`);
        system.clearRun(intervalHandle);
      }, 12000);

      const intervalHandle = system.runInterval(() => {
        const player = world.getPlayers({ name: playername })[0];
        if (player) {
          const inv = player.getComponent("inventory")?.container;
          let added = false;
          if (inv) {
            for (let slot = 0; slot < inv.size; slot++) {
              if (!inv.getItem(slot)) {
                inv.setItem(slot, i);
                added = true;
                break;
              }
            }
          }

          if (!added) {
            player.dimension.spawnItem(i, player.location);
          }

          if (typeof globalRewardMessage === "undefined" || globalRewardMessage) {
            const safeName = player.name.replaceAll('"', '');
            const format = globalMessageFormat || " §f{player}§7 Get §e{item}§r§7 From Crates §f{crate}§r§7!";
            const finalMsg = format
              .replaceAll("{player}", safeName)
              .replaceAll("{item}", reward.name)
              .replaceAll("{crate}", crateType);

            player.runCommand(`tellraw @a {"rawtext":[{"text":"${finalMsg}"}]}`);
          }

          player.sendMessage(` Congratulations! You got §6${amount}§rx §e${reward.name}§r from ${crateType}!!! §7(Chance: §f${percentChance} %%§7)§r`);

          system.runTimeout(() => {
            try { crateSource.runCommand(`playsound random.pop2 @a ~~~ 1.5`); } catch {}
            try { crateSource.runCommand(`particle minecraft:dragon_destroy_block ~ ~1.5 ~`); } catch {}
            crateSource.triggerEvent(`je:event2.5`);
          }, 70);

          system.clearRun(intervalHandle);
          system.clearRun(resetTimer);
        }
      }, 10);
    });
  }
}


function getCrateType(entity, prefix, fallback = null) {
  const tag = entity.getTags().find((e) => e.startsWith(prefix));
  if (!tag) {
    return fallback;
  }
  return tag.substring(prefix.length);
}

// --- Function to Reset Reward Tags ---
// Removes all existing reward tags from a crate.
function retag(crate) {
  for (let i = 0; i <= 9; i++) {
    crate.removeTag(`reward:${i}`);
  }
}

// --- Player Inventory Key NameTag Update Loop ---
// Continuously updates the nameTag of keys in players' inventories.
system.runInterval(() => {
  for (const player of world.getPlayers({ tags: ["hk"] })) {
    const inv = player.getComponent("minecraft:inventory").container;
    if (!inv) continue;
    for (let i = 0; i < inv.size; i++) {
      const item = inv.getItem(i);
      if (item) {
        const keyName = keys.get(item.typeId);
        if (keyName && item.nameTag !== `§r§f${keyName}§r`) {
          item.nameTag = `§r§f${keyName}§r`;
          inv.setItem(i, item); // Re-set the item to apply changes
        }
      }
    }
  }
}, 20); // Run every 1 second (20 ticks)

// --- Player Interact With Block Event (for Crate Spawn Egg) ---
// Handles the use of the crate spawn egg to initiate crate setup.
world.afterEvents.playerInteractWithBlock.subscribe((ev) => {
  let player = ev.player;
  let itm = ev.itemStack;
  if (itm?.typeId === "je:keycrate_spawn_egg") {
    player.addTag(`wp`); // Tag player for crate setup process ("wp" likely stands for "waiting for setup")
  }
});

// --- Entity Hit Entity Event (for Crate Info and Admin Removal) ---
// Provides crate information on hit and allows admins to remove crates.
world.afterEvents.entityHitEntity.subscribe((e) => {
  const player = e.damagingEntity;
  const crates = e.hitEntity;

  if (!(player instanceof Player)) return;
  if (crates?.typeId !== "je:keycrate") return;

  let crateName = crates.hasTag("named")
    ? getCrateType(crates, "cname:")
    : "Crate";

  if (!crates.hasTag("named") && !crates.hasTag("noname")) {
    return;
  }

  const rewardTag = getCrateType(crates, "reward:");
  if (!rewardTag) {
    return;
  }

  const parse = parseInt(rewardTag);
  if (isNaN(parse)) {
    return;
  }

  const arr = rewardsSet[parse];
  if (!arr || !Array.isArray(arr)) {
    return;
  }

  // --- Display Rewards (on non-sneaking hit) ---
  if (!player.isSneaking) {
    const totalWeight = arr.reduce((sum, reward) => sum + reward.chance, 0);
    const list = arr
      .map((reward) => ({
        name: reward.name || reward.display?.name || "Unknown",
        percentChance: Math.round(1000 * (reward.chance / totalWeight)) / 10,
      }))
      .sort((a, b) => b.percentChance - a.percentChance) // Sort by highest chance first
      .map((r) => `  §e${r.percentChance}§f%% §7:§r ${r.name} `)
      .join("\n\n");

    const showReward = new ActionFormData()
      .title(`${crateName} §rRewards`)
      .body(
        `\n           ||  §lITEM CHANCES:§r  ||§r\n\n${
          list || "  §cNO REWARDS LISTED§r"
        }\n `
      )
      .button("Okay");
    showReward.show(player);
  }

  // --- Admin Crate Removal (on sneaking hit by admin) ---
  if (player.isSneaking && player.hasTag("admin")) {
    player.runCommand(`playsound note.cow_bell @s ~~~ 1 3`);
    const kill = new MessageFormData()
      .title(`Remove Crate ${crateName}`)
      .body(
        `\nAre you sure you want to remove this crate? This action cannot be undone.\n\n`
      )
      .button2(`§4§lDELETE§r`)
      .button1(`Cancel`);
    kill.show(player).then((r) => {
      if (r.canceled || r.selection === 0) {
        player.runCommand(`playsound note.bit @s ~~~ 1 3`);
        return;
      }
      try {
        crates.triggerEvent("je:despawn"); // Trigger despawn event
        player.runCommand(`playsound note.guitar @s ~~~ 1 3`);
        player.runCommand(`title @s actionbar Crate removed Successfully`);
      } catch (err) {
        console.error(
          `[CRATE_ADMIN] Error removing crate: ${err?.message || err}. Stack: ${
            err?.stack || "N/A"
          }`
        );
      }
    });
  }
});

// --- Data-Driven Entity Trigger Event (Main Crate Logic) ---
// Handles various events triggered by the crate's behavior pack.
world.afterEvents.dataDrivenEntityTrigger.subscribe((v) => {
  const { entity, eventId: event } = v;
  if (entity.typeId === "je:keycrate") {
    switch (event) {
      case "je:event2": {
        // Event for processing reward and cleanup after opening.
        try {
          const crateName = getCrateType(entity, "cname:", "Crate");
          const rewardTag = getCrateType(entity, "reward:");
          const playerName = getCrateType(entity, "opener:");

          if (!rewardTag || !playerName) {
            break;
          }

          const rewardIndex = parseInt(rewardTag);
          if (isNaN(rewardIndex)) {
            break;
          }

          const reward = rewardsSet[rewardIndex];
          if (!reward || !Array.isArray(reward)) {
            break;
          }

          // Find the player by name.
          const player = world.getPlayers({ name: playerName })[0];
          if (!player) {
          }

          // Remove opener tag & reset crate's nameTag.
          entity.removeTag(`opener:${playerName}`);
          entity.nameTag = ""; // Clear the temporary nameTag

          giveReward(reward, entity, crateName, playerName); // Pass the array of possible rewards
        } catch (e) {
          console.error(
            `[CRATE_EVENT2_ERROR] Error processing event: ${
              e?.message || e
            }. Stack: ${e?.stack || "N/A"}`
          );
        }
        break;
      }

      case "je:notkey": {
        // Event for notifying player they used the wrong key.
        // Retrieve the required key from dynamic property
        const requiredKeyTypeId = entity.getDynamicProperty("requiredKeyId");
        let keyopener = "the correct key"; // Default message

        if (requiredKeyTypeId && keys.has(requiredKeyTypeId)) {
          keyopener = keys.get(requiredKeyTypeId); // Get the human-readable name of the required key
        }

        const players = world.getPlayers({ tags: ["notkey"] }); // Players are tagged "notkey" by behavior pack animations.
        for (let i = players.length; i-- !== 0; ) {
          players[i].removeTag("notkey"); // Remove the temporary tag.
          players[i].onScreenDisplay.setActionBar(
            `You need to use ${keyopener}`
          ); // Display the message.
        }
        break;
      }

      case "je:event1": {
        // Event for triggering reward showcase animation.
        const variantComponent = entity.getComponent("variant");
        if (variantComponent && variantComponent.value === 2) {
          const rewardTag = getCrateType(entity, "reward:");
          const rewardIndex = parseInt(rewardTag || "0");
          const rewardSetForShowcase = rewardsSet[rewardIndex];

          if (!rewardSetForShowcase || !Array.isArray(rewardSetForShowcase)) {
            break;
          }

          entity.triggerEvent("je:showcasename"); // Trigger visual showcase event.
          showcaseAnim(entity, rewardSetForShowcase);
        }
        break;
      }

      case "je:event2.5": {
        // Event for simple nameTag reset and unlocking the crate.
        entity.nameTag = "";
        entity.setDynamicProperty("isOpening", false); // Unlock the crate
        break;
      }

      case "je:event3": {
        // Event for setting crate nameTag to initial display.
        if (!entity.hasTag("hasitem") && !entity.hasTag("idle")) {
          const crateName = getCrateType(entity, "cname:");
          const subName = getCrateType(entity, "csname:");
          entity.nameTag = `${crateName || "Crate"}§r\n${subName || ""}`; // Ensure fallback
          system.runTimeout(() => {
            entity.triggerEvent("je:refresh");
            entity.addTag("idle"); // Mark as idle
          }, 4);
        }
        break;
      }

      case "je:openevent": {
        // Event for initiating the crate opening process.
        const cratename = getCrateType(entity, "cname:", "Crate");
        world.sendMessage(`${cratename}`); // Sends the crate's name to all players

        entity.nameTag = ""; // Clear nameTag temporarily
        entity.setDynamicProperty("isOpening", true); // Lock the crate immediately

        system.run(() => {
          const players = world.getPlayers({ tags: ["opener"] });
          const player = players[0]; // Assuming only one player will have the "opener" tag at a time

          if (!player) {
            // If no player, ensure the crate is unlocked eventually to prevent permanent lock
            entity.setDynamicProperty("isOpening", false);
            return;
          }

          entity.addTag(`opener:${player.name}`); // Store the opener's name on the crate
          player.removeTag("opener"); // Remove the temporary "opener" tag from the player
          world.sendMessage(
            ` §o§f${player.name}§7 is opening a §r§o${cratename}§r§o§7!§r`
          );

          // --- BEGIN: Key removal moved here ---
          const inv = player.getComponent("minecraft:inventory")?.container;
          if (inv) {
            const slot = player.selectedSlotIndex; // Use selectedSlot
            const item = inv.getItem(slot);
            if (item && keys.has(item.typeId)) {
              // Check if it's a recognized key
              inv.setItem(slot, undefined); // Remove item by setting to undefined
            }
          }
          // --- END: Key removal moved here ---
        });
        break;
      }
      // Removed je:clearkey as dynamic properties are used instead of tags for key identification
      default:
        break;
    }
  }
});

// --- Crate Names (for setup form) ---
let random = 0; // Global variable for crateNames index
const crateNames = [
  `§l§eKey Crate§r`,
  `§l§fCommon Crate§r`,
  `§l§eRare Crate§r`,
  `§l§6Epic Crate§r`,
  `§l§bLegendary Crate§r`,
  `§l§dMythical Crate§r`,
];

// --- Player Interact With Entity Event (for Key Usage) ---
world.afterEvents.playerInteractWithEntity.subscribe((v) => {
  const { player, itemStack, target } = v;

  if (!itemStack || target?.typeId !== "je:keycrate") return; // Only process if interacting with keycrate and holding an item

  // --- NEW: Check if crate is already opening ---
  if (target.getDynamicProperty("isOpening")) {
    return; // Block interaction if crate is already opening
  }
  // --- END NEW ---

  // Add the 'opener' tag immediately. This tag is used later to identify the player.
  player.addTag("opener");

  // Retrieve the required key from dynamic property
  const correctKeyTypeId = target.getDynamicProperty("requiredKeyId");

  // Check if the player's held item is the correct key.
  if (correctKeyTypeId && itemStack.typeId === correctKeyTypeId) {
    target.triggerEvent("je:openevent"); // Trigger the crate opening process.
  } else {
    // If the player's held item is not the correct key (or not a key at all).
    // The je:notkey event will handle displaying the message to the player.
    target.triggerEvent("je:notkey");
  }
});

// --- Entity Spawn Event (for Crate Setup Form) ---
// Initiates the setup forms for a newly spawned keycrate.
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  // Check if it's a keycrate and not already configured.
  if (
    entity.typeId == "je:keycrate" &&
    !entity.hasTag("named") &&
    !entity.hasTag("noname")
  ) {
    // Initialize isOpening property to false when crate is spawned
    entity.setDynamicProperty("isOpening", false);

    // Find the player who spawned it (by 'wp' tag).
    let player = world.getAllPlayers().find((p) => p.hasTag(`wp`));
    if (player) {
      try {
        player.runCommand(`playsound note.cow_bell @s ~~~ 1`);
      } catch (cmdErr) {
        console.error(
          `[CRATE_SPAWN_CMD_ERROR] Error playing cow_bell sound: ${cmdErr.message}`
        );
      }
      const loot = rewardsSet.map((_, i) => rewardnames[`set${i + 1}_name`] || `Set ${i + 1}`);
      const skin = [
        "Ender Chest",
        "Normal Chest",
        "Custom Crate",
        "Dark Magma Crate",
        "Sunken Crate",
        "Angel Crate",
        "Ender Crate2",
        "Kitty Crate",
        "Miner Crate",
      ];
      const animation = ["Quick", "Vortex", "Showcase"];
      const halo = [
        "§fNo Halo",
        "§gFlame",
        "§bBlue Flame",
        "§aHappy Green",
        "§9Snow",
        "§dEnchant Characters",
        "§eStar Particle",
        "§cR§bG§dB §aSpiral",
        "§2Green Spiral",
        "§1Blue Spiral",
        "§cRed Spiral",
        "§eYellow Spiral",
        "§dPurple Spiral",
        "§gOrange Spiral",
        "§3Cyan Spiral",
        "§5Magenta Spiral",
        "§9Discord Spiral",
        "§cPink Spiral",
        "§1Snow Storm",
      ];

      // --- Crate Name and Loot Table Setup Form ---
      let setup = new ModalFormData();
      setup.title(`§lCrate Setup§r`);
      setup.textField("\nCrate Name", "Write crate name here", {
        defaultValue: crateNames[random],
        placeholderText: "Write crate name here",
      });
      setup.textField("\nCrate Sub-Name", "Write crate sub-name here", {
        defaultValue: "§r§7[Use Key to Open]§r",
        placeholderText: "Write crate sub-name here",
      });
      setup.dropdown("Loot Table", loot, {
        defaultValueIndex: 0,
      });

      setup
        .show(player)
        .then((r) => {
          if (r.canceled) {
            entity.triggerEvent(`je:despawn`);
            player.sendMessage(` §cCrate Creation Canceled§r`);
            return;
          }
          let [cratename, subname, rewardtable] = r.formValues;

          if (cratename && cratename.length > 0) {
            entity.nameTag = `${cratename}§r\n${subname}`;
            entity.addTag(`named`);
            entity.addTag(`cname:${cratename}`);
            entity.addTag(`csname:${subname}`);
          } else {
            entity.nameTag = `???\n${subname}`;
            entity.addTag(`noname`); // Mark as noname if no custom name
          }

          retag(entity);
          let chosenRewardIndex = rewardtable;
          if (chosenRewardIndex >= rewardsSet.length) {
            chosenRewardIndex = rewardsSet.length - 1;
          }
          entity.addTag(`reward:${chosenRewardIndex}`);

          let arr = rewardsSet[chosenRewardIndex]; // Get the actual reward array for display check.

          // --- Crate Display and Animation Setup Form ---
          let display = new ModalFormData();
          display.title(`§l${cratename} Display§r`);
          display.dropdown("\nCrate Skin", skin, {
            defaultValueIndex: 0,
          });
          display.dropdown("Animation", animation, {
            defaultValueIndex: 0,
          });
          display.dropdown("Halo Particle", halo, {
            defaultValueIndex: 0,
          });

          display.show(player).then((d) => {
            if (d.canceled) {
              entity.triggerEvent(`je:despawn`);
              player.sendMessage(` §cCrate Creation Canceled§r`);
              return;
            }
            let [crateskin, animationType, particle] = d.formValues;

            entity.triggerEvent(`je:skin${crateskin}`);
            entity.triggerEvent(`je:animation${animationType}`);
            entity.triggerEvent(`je:halo${particle}`);

            // --- Key Selection Form ---
            let keyForm = new ActionFormData();
            keyForm.title(`§l${cratename} Key§r`);
            keyForm.body("Choose Key for this Crate");
            keys.forEach((name, typeId) => {
              const keyNum = typeId.replace("key", ""); // Extract number from typeId for texture.
              keyForm.button(name, `textures/keys/${keyNum}`);
            });

            keyForm.show(player).then((k) => {
              if (k.canceled) {
                entity.triggerEvent(`je:despawn`);
                player.sendMessage(` §cCrate Creation Canceled§r`);
                return;
              }
              const selectedKeyIndex = k.selection;
              const selectedKeyTypeId = Array.from(keys.keys())[
                selectedKeyIndex
              ];
              entity.setDynamicProperty("requiredKeyId", selectedKeyTypeId);

              entity.triggerEvent(`je:interact`); // Trigger crate interaction event.

              // Final message to player.
              if (arr && arr.length >= 1) {
                player.sendMessage(
                  ` §eCrate is now configured\n§7Crate Name§r: ${cratename}`
                );
              } else {
                player.sendMessage(
                  ` §eCrate is now configured\n§7Crate Name§r: ${cratename}\n §cNO REWARDS LISTED§r`
                );
              }
            });
          });
        })
        .catch((e) => {
          console.error(
            `[CRATE_SETUP_ERROR] Error during crate setup forms: ${
              e?.message || e
            }. Stack: ${e?.stack || "N/A"}`
          );
          entity.triggerEvent(`je:despawn`);
          player?.sendMessage(
            ` §cCrate Creation Failed: An error occurred.§r`
          );
        });

      if (random < crateNames.length - 1) {
        random++;
      } else {
        random = 0;
      }
    }
  }
});
