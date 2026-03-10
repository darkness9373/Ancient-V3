import { Player } from "@minecraft/server";
import { arena } from "./arenaState";

/** @param {Player} player */
export function saveInventory(player) {
    const container = player.getComponent('minecraft:inventory').container;
    const items = [];
    for (let i = 0; i < cpntainer.size; i++) {
        items.push(container.getItem(i));
    }
    arena.savedInventory.set(player.id, items);
}

/** @param {Player} player */
export function restoreInventory(player) {
    const container = player.getComponent('minecraft:inventory').container;
    const items = arena.savedInventory.get(player.id);
    if (!items) return;
    container.clearAll();
    items.forEach(items, slot => {
        if (item) container.setItem(slot, item);
    });
}