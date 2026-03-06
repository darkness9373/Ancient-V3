import { BlockPermutation, Player, system, world } from "@minecraft/server";
import { getIsland, ISLAND_SLOTS } from "./islandManager";

/** @param {Player} player */
function isIslandMember(player, island) {
    if (player.hasTag('admin')) return true;
    if (!island) return false;
    if (island.host === player.name) return true;
    if (island.members.includes(player.name)) return true;
    return false;
}

function getIslandAtPosition(pos) {
    for (const slot of ISLAND_SLOTS) {
        const dx = Math.abs(pos.x - slot.pos.x);
        const dz = Math.abs(pos.z - slot.pos.z);
        if (dx <= 100 && dz <= 100) {
            return getIsland(`island:${slot.id}`);
        }
    }
    return null;
}

world.beforeEvents.playerBreakBlock.subscribe(data => {
    const player = data.player;
    const block = data.block;
    const island = getIslandAtPosition(block.location);
    if (!island) return;
    if (!isIslandMember(player, island)) {
        data.cancel = true;
        system.run(() => player.onScreenDisplay.setActionBar('§cYou cannot break blocks here'))
    }
})

world.afterEvents.playerPlaceBlock.subscribe(data => {
    const player = data.player
    const block = data.block
    const island = getIslandAtPosition(block.location)
    if (!island) return;
    if (!isIslandMember(player, island)) {
        block.setPermutation(BlockPermutation.resolve('minecraft:air'))
        system.run(() => player.onScreenDisplay.setActionBar('§cYou cannot place blocks here'))
    }
})

world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    const player = data.player;
    const block = data.block;
    const island = getIslandAtPosition(block.location);
    if (!island) return;
    if (!isIslandMember(player, island)) {
        data.cancel = true;
        system.run(() => player.onScreenDisplay.setActionBar('§cYou cannot interact with blocks here'))
    }
})