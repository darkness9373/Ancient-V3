import { world, system, ItemStack } from "@minecraft/server";

const ARENA = {
    pos1: { x: 100, y: 70, z: 100 },
    pos2: { x: 110, y: 70, z: 100 },
    spectator: { x: 105, y: 80, z: 100 },
    dimension: "overworld"
};

const REWARD = {
    coin: 100,
    item: "minecraft:diamond",
    amount: 3
};

export let arena = {
    state: "idle",
    player1: null,
    player2: null,
    wins: { p1: 0, p2: 0 },
    spectators: new Set()
};

const cache = new Map();

function savePlayer(player) {
    const inv = player.getComponent("inventory").container;
    const equip = player.getComponent("equippable");
    const items = [];
    for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        items.push(item ? item.clone() : null);
    }
    const equipment = {
        head: equip.getEquipment("Head")?.clone() ?? null,
        chest: equip.getEquipment("Chest")?.clone() ?? null,
        legs: equip.getEquipment("Legs")?.clone() ?? null,
        feet: equip.getEquipment("Feet")?.clone() ?? null,
        offhand: equip.getEquipment("Offhand")?.clone() ?? null
    };
    cache.set(player.id, {
        inventory: items,
        equipment: equipment,
        location: {
            x: player.location.x,
            y: player.location.y,
            z: player.location.z
        },
        dimension: player.dimension.id,
        tags: [...player.getTags()]
    });
}

function restorePlayer(player) {
    const data = cache.get(player.id);
    if (!data) return;
    const inv = player.getComponent("inventory").container;
    const equip = player.getComponent("equippable");
    inv.clearAll();
    data.inventory.forEach((item, slot) => {
        if (item) inv.setItem(slot, item);
    });
    equip.setEquipment("Head", data.equipment.head);
    equip.setEquipment("Chest", data.equipment.chest);
    equip.setEquipment("Legs", data.equipment.legs);
    equip.setEquipment("Feet", data.equipment.feet);
    equip.setEquipment("Offhand", data.equipment.offhand);
    player.teleport(data.location, {
        dimension: world.getDimension(data.dimension)
    });
    player.getTags().forEach(t => {
        system.run(() => player.removeTag(t))
    });
    data.tags.forEach(t => {
        system.run(() => player.addTag(t))
    });
    cache.delete(player.id);
}

function giveKit(player) {
    const inv = player.getComponent("inventory").container;
    const equip = player.getComponent("equippable");
    inv.clearAll();
    inv.setItem(0, new ItemStack("minecraft:diamond_sword", 1));
    inv.setItem(1, new ItemStack("minecraft:golden_apple", 5));
    inv.setItem(2, new ItemStack("minecraft:cooked_beef", 16));
    inv.setItem(3, new ItemStack("minecraft:totem_of_undying", 1));
    
    equip.setEquipment("Head", new ItemStack("minecraft:diamond_helmet", 1));
    equip.setEquipment("Chest", new ItemStack("minecraft:diamond_chestplate", 1));
    equip.setEquipment("Legs", new ItemStack("minecraft:diamond_leggings", 1));
    equip.setEquipment("Feet", new ItemStack("minecraft:diamond_boots", 1));
    equip.setEquipment("Offhand", new ItemStack("minecraft:shield"))
}

function countdown(startFight) {
    let time = 10;
    const run = system.runInterval(() => {
        if (time <= 0) {
            world.sendMessage("§aFIGHT!");
            system.clearRun(run);
            startFight();
            return;
        }
        world.sendMessage(`§eFight mulai dalam ${time}`);
        time--;
    }, 20);
}

function startRound() {
    giveKit(arena.player1);
    giveKit(arena.player2);
    arena.player1.runCommand("effect @s slowness 255 10 true");
    arena.player2.runCommand("effect @s slowness 255 10 true");
    countdown(() => {
        arena.player1.runCommand("effect @s clear");
        arena.player2.runCommand("effect @s clear");
    });
}

function checkWinner() {
    if (arena.wins.p1 >= 3) {
        endArena(arena.player1, arena.player2);
    }
    if (arena.wins.p2 >= 3) {
        endArena(arena.player2, arena.player1);
    }
}

function endArena(winner, loser) {
    world.sendMessage(`§6${winner.name} mengalahkan ${loser.name} di Arena`);
    winner.runCommand(`scoreboard players add @s coin ${REWARD.coin}`);
    winner.runCommand(`give @s ${REWARD.item} ${REWARD.amount}`);
    restorePlayer(winner);
    restorePlayer(loser);
    arena.spectators.forEach(id => {
        const p = [...world.getPlayers()].find(pl => pl.id === id);
        if (p) restorePlayer(p);
    });
    system.run(() => {
        arena.player1?.removeTag("on_arena");
        arena.player2?.removeTag("on_arena");
    })
    resetArena();
}

function resetArena() {
    arena.state = "idle";
    arena.player1 = null;
    arena.player2 = null;
    arena.wins = { p1: 0, p2: 0 };
    arena.spectators.clear();
}

export function joinArena(player) {
    if (arena.state === "idle") {
        savePlayer(player);
        arena.player1 = player;
        arena.state = "waiting";
        player.teleport(ARENA.pos1, {
            dimension: world.getDimension(ARENA.dimension)
        });
        world.sendMessage(`§e${player.name} menantang duel!`);
        system.run(() => player.addTag('on_arena'))
        return;
    }
    if (arena.state === "waiting") {
        if (player.id === arena.player1.id) return;
        savePlayer(player);
        arena.player2 = player;
        arena.state = "fighting";
        player.teleport(ARENA.pos2, {
            dimension: world.getDimension(ARENA.dimension)
        });
        world.sendMessage(`§a${arena.player1.name} vs ${arena.player2.name}`);
        system.run(() => player.addTag('on_arena'))
        startRound();
        return;
    }
    joinSpectator(player);
}

function joinSpectator(player) {
    savePlayer(player);
    arena.spectators.add(player.id);
    player.teleport(ARENA.spectator, {
        dimension: world.getDimension(ARENA.dimension)
    });
    player.sendMessage("§7Kamu menjadi spectator");
    system.run(() => player.addTag('on_arena'))
}

export function giveUp(player) {
    if (arena.player1?.id === player.id) {
        endArena(arena.player2, arena.player1);
    }
    if (arena.player2?.id === player.id) {
        endArena(arena.player1, arena.player2);
    }
}

export function exitArena(player) {
    // PLAYER1 WAITING (boleh keluar)
    if (arena.state === "waiting" && arena.player1?.id === player.id) {
        world.sendMessage(`§c${player.name} meninggalkan arena`);
        restorePlayer(player);
        resetArena();
        system.run(() => player.removeTag('on_arena'))
        return;
    }
    // PLAYER SEDANG DUEL
    if (arena.state === "fighting") {
        if (
            arena.player1?.id === player.id ||
            arena.player2?.id === player.id
        ) {
            player.sendMessage("§cTidak bisa keluar saat duel! Gunakan /giveup");
            return;
        }
    }
    // SPECTATOR
    if (arena.spectators.has(player.id)) {
        arena.spectators.delete(player.id);
        restorePlayer(player);
        player.sendMessage("§7Kamu keluar dari spectator.");
        system.run(() => player.removeTag('on_arena'))
        return;
    }
}

world.afterEvents.entityDie.subscribe(ev => {
    const dead = event.deadEntity;
    if (!dead || dead.typeId !== "minecraft:player") return;
    if (!dead.hasTag("on_arena")) return;
    if (arena.state !== "fighting") return;
    const isPlayer1 = arena.player1?.id === dead.id;
    const isPlayer2 = arena.player2?.id === dead.id;
    if (!isPlayer1 && !isPlayer2) return;
    const winner = isPlayer1 ? arena.player2 : arena.player1;
    if (!winner) return;
    arena.score[winner.id]++;
    world.sendMessage(`§e${winner.name} memenangkan round!`);
    system.runTimeout(() => {
        const p1 = arena.player1;
        const p2 = arena.player2;
        if (!p1 || !p2) return;
        p1.teleport(ARENA.pos1, {
            dimension: world.getDimension(ARENA.dimension)
        });
        p2.teleport(ARENA.pos2, {
            dimension: world.getDimension(ARENA.dimension)
        });
        startRound();
    }, 10);
});

world.afterEvents.playerLeave.subscribe(ev => {
    const id = ev.playerId;
    if (arena.player1?.id === id) {
        if (arena.player2)
            endArena(arena.player2, arena.player1);
    }
    if (arena.player2?.id === id) {
        if (arena.player1)
            endArena(arena.player1, arena.player2);
    }
    if (arena.spectators.has(id)) {
        arena.spectators.delete(id);
    }
});