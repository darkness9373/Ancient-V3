import { world, system } from "@minecraft/server";
import { getData, setData, deleteData, getDungeoncoin, setDungeoncoin, getFishcoin, setFishcoin, getGold, setGold } from "./database";

// ============================================================
//  REDEEM LIST
//  Key: redeem:_list => string[] (semua code yang terdaftar)
// ============================================================

export function getAllRedeemCodes() {
    return getData('redeem:_list') ?? [];
}

function addToRedeemList(code) {
    const list = getAllRedeemCodes();
    const lower = code.toLowerCase();
    if (!list.includes(lower)) {
        list.push(lower);
        setData('redeem:_list', list);
    }
}

function removeFromRedeemList(code) {
    const list = getAllRedeemCodes().filter(c => c !== code.toLowerCase());
    setData('redeem:_list', list);
}

// ============================================================
//  CRUD
// ============================================================

export function setRedeemData(code, data) {
    setData(`redeem:${code.toLowerCase()}`, data);
    addToRedeemList(code);
}

export function getRedeemData(code) {
    return getData(`redeem:${code.toLowerCase()}`);
}

export function deleteRedeemCode(code) {
    deleteData(`redeem:${code.toLowerCase()}`);
    removeFromRedeemList(code);
}

// ============================================================
//  REDEEM LOGIC
// ============================================================

/**
 * Player menggunakan redeem code
 * @param {import("@minecraft/server").Player} player
 * @param {string} code
 * @returns {{ success: boolean, message: string }}
 */
export function redeemCode(player, code) {
    const data = getRedeemData(code);
    if (!data) return { success: false, message: '§c[!] Invalid redeem code' };

    // Cek expired
    if (data.expiredAt !== null && Date.now() > data.expiredAt) {
        return { success: false, message: '§c[!] This redeem code has expired' };
    }

    // Cek limit
    if (data.limit > 0 && data.usedBy.length >= data.limit) {
        return { success: false, message: '§c[!] This redeem code has reached its usage limit' };
    }

    // Cek sudah pernah redeem
    if (data.usedBy.includes(player.name)) {
        return { success: false, message: '§c[!] You have already used this redeem code' };
    }

    // Berikan reward currency
    if (data.rewards.gold > 0) setGold(player.name, getGold(player.name) + data.rewards.gold);
    if (data.rewards.fishcoin > 0) setFishcoin(player.name, getFishcoin(player.name) + data.rewards.fishcoin);
    if (data.rewards.dungeoncoin > 0) setDungeoncoin(player.name, getDungeoncoin(player.name) + data.rewards.dungeoncoin);

    // Berikan reward item via give command, dibungkus system.run
    const items = data.rewards.items;
    if (items.length > 0) {
        system.run(() => {
            for (const item of items) {
                try {
                    player.runCommand(`give @s ${item.typeId} ${item.amount}`);
                } catch (e) {
                    // Item ID tidak valid, skip
                }
            }
        });
    }

    // Catat penggunaan
    data.usedBy.push(player.name);
    setRedeemData(code, data);

    // Summary pesan
    const lines = [];
    if (data.rewards.gold > 0)        lines.push(`§6Gold: +${data.rewards.gold}`);
    if (data.rewards.fishcoin > 0)    lines.push(`§bFishcoin: +${data.rewards.fishcoin}`);
    if (data.rewards.dungeoncoin > 0) lines.push(`§eDungeoncoin: +${data.rewards.dungeoncoin}`);
    for (const item of items)         lines.push(`§fItem: ${item.typeId} x${item.amount}`);

    const summary = lines.length > 0 ? `\n${lines.join('\n')}` : '';
    return { success: true, message: `§a[!] Redeem successful!${summary}` };
}