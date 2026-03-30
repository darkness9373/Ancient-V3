import { system } from "@minecraft/server";
import { getGold, setGold } from "./database";
import { GOLD_SELL_ITEMS, GOLD_BUY_ITEMS } from "../config/shopConfig";

// ============================================================
//  INVENTORY HELPERS
// ============================================================

/**
 * Hitung jumlah item tertentu di inventory player
 * @param {import("@minecraft/server").Player} player
 * @param {string} typeId
 * @returns {number}
 */
export function countItemInInventory(player, typeId) {
    const inventory = player.getComponent('minecraft:inventory');
    if (!inventory) return 0;
    const container = inventory.container;
    let total = 0;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && item.typeId === typeId) total += item.amount;
    }
    return total;
}

/**
 * Hapus sejumlah item dari inventory player
 * @param {import("@minecraft/server").Player} player
 * @param {string} typeId
 * @param {number} amount
 * @returns {boolean}
 */
export function removeItemFromInventory(player, typeId, amount) {
    const inventory = player.getComponent('minecraft:inventory');
    if (!inventory) return false;
    const container = inventory.container;

    let remaining = amount;
    for (let i = 0; i < container.size; i++) {
        if (remaining <= 0) break;
        const item = container.getItem(i);
        if (!item || item.typeId !== typeId) continue;

        if (item.amount <= remaining) {
            remaining -= item.amount;
            container.setItem(i, undefined);
        } else {
            item.amount -= remaining;
            container.setItem(i, item);
            remaining = 0;
        }
    }
    return remaining === 0;
}

// ============================================================
//  SELL LOGIC
// ============================================================

/**
 * Jual item ke gold shop
 * @param {import("@minecraft/server").Player} player
 * @param {string} typeId
 * @param {number} batches
 * @returns {{ success: boolean, message: string, earned?: number }}
 */
export function sellItemForGold(player, typeId, batches) {
    const config = GOLD_SELL_ITEMS.find(i => i.typeId === typeId);
    if (!config) return { success: false, message: '§c[!] Item is not sellable' };
    if (batches < 1) return { success: false, message: '§c[!] Invalid amount' };

    const totalNeeded = config.sellAmount * batches;
    const totalOwned  = countItemInInventory(player, typeId);

    if (totalOwned < totalNeeded) {
        return {
            success: false,
            message: `§c[!] Not enough §f${config.name}§c. Need §f${totalNeeded}§c, have §f${totalOwned}`
        };
    }

    const removed = removeItemFromInventory(player, typeId, totalNeeded);
    if (!removed) return { success: false, message: '§c[!] Failed to remove items from inventory' };

    const earned = config.sellPrice * batches;
    setGold(player.name, getGold(player.name) + earned);

    return {
        success: true,
        earned,
        message: `§a[!] Sold §f${totalNeeded}x ${config.name} §afor §6${earned} Gold§a!`
    };
}

// ============================================================
//  BUY LOGIC
// ============================================================

/**
 * Beli item dari gold shop
 * @param {import("@minecraft/server").Player} player
 * @param {string} typeId
 * @param {number} batches
 * @returns {{ success: boolean, message: string }}
 */
export function buyItemForGold(player, typeId, batches) {
    const config = GOLD_BUY_ITEMS.find(i => i.typeId === typeId);
    if (!config) return { success: false, message: '§c[!] Item is not buyable' };
    if (batches < 1) return { success: false, message: '§c[!] Invalid amount' };

    const totalCost = config.buyPrice * batches;
    const currentGold = getGold(player.name);

    if (currentGold < totalCost) {
        return {
            success: false,
            message: `§c[!] Not enough Gold. Need §6${totalCost}§c, have §6${currentGold}`
        };
    }

    // Kurangi gold
    setGold(player.name, currentGold - totalCost);

    // Berikan item via give command (support item dari addon manapun)
    const totalAmount = config.buyAmount * batches;
    system.run(() => {
        player.runCommand(`give @s ${typeId} ${totalAmount}`);
    });

    return {
        success: true,
        message: `§a[!] Bought §f${totalAmount}x ${config.name} §afor §6${totalCost} Gold§a!`
    };
}