import { world, system } from "@minecraft/server";
import {
    getDungeonState, setDungeonState, resetDungeonState,
    getDungeonLevel, getMaxDungeonLevel, isDungeonLevelAvailable,
    getIslandRaidData, setIslandRaidData, clearIslandRaidData,
    recordRaidFailed, recordRaidCleared,
    tagPlayerOnRaid, untagPlayerOnRaid,
    teleportPlayerToDungeon, teleportRaidPlayersToIsland,
    broadcastDungeonMessage, respawnDungeon, spawnDungeonStructure
} from "./dungeonManager";
import { getData, setData } from "./database";
import { getPlayerData, savePlayerData } from "./playerManager";

// ============================================================
//  CONSTANTS
//  // Sesuaikan durasi timer sesuai kebutuhan
// ============================================================
const PREPARE_SECONDS = 60;   // Jeda persiapan sebelum masuk dungeon (detik)
const LOOTING_SECONDS = 60;   // Jeda looting setelah boss mati (detik)
const TICKS_PER_SECOND = 20;

// ============================================================
//  QUEUE MANAGEMENT
// ============================================================

/**
 * Masukkan island ke antrian dungeon level 1.
 * Dipanggil saat host menggunakan /as:dungeon
 * @param {import("@minecraft/server").Player} host
 * @returns {{ success: boolean, message: string }}
 */
export function joinDungeonQueue(host) {
    const playerData = getPlayerData(host.name);
    if (!playerData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    if (playerData.role !== 'host') return { success: false, message: '§c[!] Only the island host can start a dungeon raid' };

    const islandId = playerData.currentIsland;

    // Cek apakah island sudah dalam raid / antrian
    const existingRaid = getIslandRaidData(islandId);
    if (existingRaid) return { success: false, message: '§c[!] Your island is already in a dungeon raid or queue' };

    // Cek apakah level 1 tersedia
    if (!isDungeonLevelAvailable(1)) return { success: false, message: '§c[!] Dungeon level 1 has not been configured yet' };

    // Buat raid data untuk island ini, mulai dari level 1
    setIslandRaidData(islandId, {
        islandId,
        currentLevel: 1,
        status: 'queued',
        participants: [],  // akan diisi saat preparing
        optedOut: [],
        startedAt: null
    });

    // Masukkan ke queue level 1
    const state = getDungeonState(1);
    state.queue.push(islandId);
    setDungeonState(1, state);

    // Coba proses queue level 1
    tryProcessQueue(1);

    return { success: true, message: '§a[!] Your island has joined the dungeon queue!' };
}

/**
 * Coba proses antrian untuk level tertentu.
 * Jika dungeon idle dan ada island di queue, mulai preparing.
 * @param {number} level
 */
export function tryProcessQueue(level) {
    const state = getDungeonState(level);

    // Dungeon sedang dipakai, tunggu
    if (state.status !== 'idle') return;

    // Tidak ada yang antri
    if (state.queue.length === 0) return;

    // Ambil island pertama di queue
    const islandId = state.queue.shift();
    state.status = 'active';
    state.currentIsland = islandId;
    setDungeonState(level, state);

    // Update raid data island ke 'preparing'
    const raidData = getIslandRaidData(islandId);
    if (!raidData) {
        // Data rusak, reset
        resetDungeonState(level);
        tryProcessQueue(level);
        return;
    }

    raidData.status = 'preparing';
    raidData.currentLevel = level;

    // Ambil semua anggota island sebagai calon peserta
    const island = getData(`island:${islandId}`);
    if (!island) {
        resetDungeonState(level);
        tryProcessQueue(level);
        return;
    }

    raidData.participants = [...island.members];
    raidData.optedOut = [];
    setIslandRaidData(islandId, raidData);

    startPreparePhase(islandId, level);
}

// ============================================================
//  PREPARE PHASE
//  Countdown 1 menit, anggota bisa opt-out
// ============================================================

/**
 * Mulai fase persiapan: broadcast countdown, buka opt-out window
 * @param {string} islandId
 * @param {number} level
 */
export function startPreparePhase(islandId, level) {
    const island = getData(`island:${islandId}`);
    const islandName = island?.name ?? islandId;

    broadcastDungeonMessage(`§e[Dungeon] §fIsland §e${islandName} §fwill enter §bDungeon Level ${level} §fin §a${PREPARE_SECONDS} seconds§f! Members can type §c/as:optout §fto leave the raid.`);

    // Notif ke semua anggota island
    notifyIslandMembers(islandId, `§e[Dungeon] §fDungeon Level §b${level} §fstarting in §a${PREPARE_SECONDS}s§f! Use §c/as:optout §fif you don't want to join.`);

    let secondsLeft = PREPARE_SECONDS;

    // // Kamu bisa tambahkan countdown interval di sini jika ingin notif tiap X detik
    // Contoh: notif di detik 30 dan 10
    system.runTimeout(() => {
        notifyIslandMembers(islandId, `§e[Dungeon] §a30 seconds §funtil dungeon starts!`);
    }, 30 * TICKS_PER_SECOND);

    system.runTimeout(() => {
        notifyIslandMembers(islandId, `§e[Dungeon] §c10 seconds §funtil dungeon starts!`);
    }, 50 * TICKS_PER_SECOND);

    // Setelah PREPARE_SECONDS, mulai raid
    system.runTimeout(() => {
        startRaidPhase(islandId, level);
    }, PREPARE_SECONDS * TICKS_PER_SECOND);
}

// ============================================================
//  OPT-OUT
// ============================================================

/**
 * Player opt-out dari raid yang sedang preparing
 * Dipanggil dari command /as:optout
 * @param {import("@minecraft/server").Player} player
 * @returns {{ success: boolean, message: string }}
 */
export function optOutRaid(player) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };

    const islandId = playerData.currentIsland;
    const raidData = getIslandRaidData(islandId);

    if (!raidData) return { success: false, message: '§c[!] Your island is not in a dungeon queue' };
    if (raidData.status !== 'preparing') return { success: false, message: '§c[!] You can only opt-out during the preparation phase' };
    if (!raidData.participants.includes(player.name)) return { success: false, message: '§c[!] You are already opted out' };

    // Pindahkan dari participants ke optedOut
    raidData.participants = raidData.participants.filter(p => p !== player.name);
    raidData.optedOut.push(player.name);
    setIslandRaidData(islandId, raidData);

    return { success: true, message: '§a[!] You have opted out of the dungeon raid' };
}

// ============================================================
//  RAID PHASE
// ============================================================

/**
 * Mulai raid: teleport semua peserta ke dungeon
 * @param {string} islandId
 * @param {number} level
 */
export function startRaidPhase(islandId, level) {
    const raidData = getIslandRaidData(islandId);
    if (!raidData) return;

    // Jika tidak ada peserta sama sekali, batalkan
    if (raidData.participants.length === 0) {
        broadcastDungeonMessage(`§c[Dungeon] §fIsland raid cancelled — no participants.`);
        endRaid(islandId, level, 'cancelled');
        return;
    }

    raidData.status = 'raiding';
    raidData.startedAt = Date.now();

    // Update state dungeon
    const state = getDungeonState(level);
    state.raidPlayers = [...raidData.participants];
    setDungeonState(level, state);
    setIslandRaidData(islandId, raidData);

    const island = getData(`island:${islandId}`);
    broadcastDungeonMessage(`§e[Dungeon] §fIsland §e${island?.name ?? islandId} §fhas entered §bDungeon Level ${level}§f!`);

    // Spawn structure dungeon terlebih dahulu
    spawnDungeonStructure(level);

    // Jeda agar structure selesai di-load sebelum player di-teleport
    // // Sesuaikan delay jika structure kamu besar (default 3 detik = 60 ticks)
    system.runTimeout(() => {
        const currentRaidData = getIslandRaidData(islandId);
        if (!currentRaidData || currentRaidData.status !== 'raiding') return;

        const online = world.getPlayers();
        for (const name of currentRaidData.participants) {
            const player = online.find(p => p.name === name);
            if (!player) continue;
            tagPlayerOnRaid(player);
            teleportPlayerToDungeon(player, level);
            player.sendMessage(`§e[Dungeon] §fYou have entered §bDungeon Level ${level}§f! Good luck!`);
        }
    }, 60); // 3 detik
}

// ============================================================
//  PLAYER DEATH HANDLER
//  Dipanggil dari dungeonEvents.js saat player mati
// ============================================================

/**
 * Handle player mati saat dalam raid.
 * Player akan respawn di island (via spawnPoint).
 * Jika semua peserta mati, raid gagal.
 * @param {import("@minecraft/server").Player} player
 */
export function handleRaidPlayerDeath(player) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return;

    const islandId = playerData.currentIsland;
    const raidData = getIslandRaidData(islandId);
    if (!raidData || raidData.status !== 'raiding') return;
    if (!raidData.participants.includes(player.name)) return;

    // Hapus player dari peserta aktif
    raidData.participants = raidData.participants.filter(p => p !== player.name);
    setIslandRaidData(islandId, raidData);

    // Hapus tag on_raid
    untagPlayerOnRaid(player);

    // Update raidPlayers di state
    const state = getDungeonState(raidData.currentLevel);
    state.raidPlayers = state.raidPlayers.filter(p => p !== player.name);
    setDungeonState(raidData.currentLevel, state);

    player.sendMessage(`§c[Dungeon] §fYou died and have been removed from the raid!`);

    // // Respawn ke island ditangani oleh spawnPoint player yang di-set ke island
    // // Kamu bisa set player.setSpawnPoint() saat player join dungeon jika perlu

    // Cek apakah semua peserta sudah mati
    if (raidData.participants.length === 0) {
        system.run(() => handleRaidFailed(islandId, raidData.currentLevel));
    }
}

// ============================================================
//  BOSS DEATH HANDLER
//  Dipanggil dari dungeonEvents.js saat boss mati
// ============================================================

/**
 * Handle boss dungeon level tertentu mati.
 * @param {number} level
 */
export function handleBossDeath(level) {
    const state = getDungeonState(level);
    if (state.status !== 'active') return;

    const islandId = state.currentIsland;
    if (!islandId) return;

    const raidData = getIslandRaidData(islandId);
    if (!raidData || raidData.status !== 'raiding') return;

    const island = getData(`island:${islandId}`);
    const islandName = island?.name ?? islandId;
    const maxLevel = getMaxDungeonLevel();

    // Notif global kemenangan level
    broadcastDungeonMessage(`§e[Dungeon] §fIsland §e${islandName} §fdefeated the boss of §bDungeon Level ${level}§f!`);

    // Catat clear
    recordRaidCleared(islandId, level);

    // Masuk fase looting
    raidData.status = 'looting';
    setIslandRaidData(islandId, raidData);

    const state2 = getDungeonState(level);
    state2.status = 'looting';
    setDungeonState(level, state2);

    notifyRaidPlayers(raidData.participants, `§e[Dungeon] §fBoss defeated! You have §a${LOOTING_SECONDS} seconds §fto loot.`);

    system.runTimeout(() => {
        handlePostLoot(islandId, level, maxLevel);
    }, LOOTING_SECONDS * TICKS_PER_SECOND);
}

// ============================================================
//  POST LOOT: lanjut ke level berikutnya atau selesai
// ============================================================

/**
 * Setelah fase looting selesai, tentukan lanjut atau raid clear total
 * @param {string} islandId
 * @param {number} currentLevel
 * @param {number} maxLevel
 */
export function handlePostLoot(islandId, currentLevel, maxLevel) {
    const raidData = getIslandRaidData(islandId);
    if (!raidData) return;

    const island = getData(`island:${islandId}`);
    const islandName = island?.name ?? islandId;

    // Teleport peserta kembali ke island
    teleportRaidPlayersToIsland(raidData.participants);

    // Reset & respawn dungeon level ini
    resetDungeonState(currentLevel);
    respawnDungeon(currentLevel);

    // Proses queue berikutnya untuk level ini
    system.runTimeout(() => tryProcessQueue(currentLevel), 60 * TICKS_PER_SECOND);

    const nextLevel = currentLevel + 1;

    // Tidak ada level berikutnya — raid selesai total!
    if (!isDungeonLevelAvailable(nextLevel) || currentLevel >= maxLevel) {
        broadcastDungeonMessage(`§6[Dungeon] §fIsland §e${islandName} §fhas §6CLEARED ALL DUNGEON LEVELS§f! Congratulations!`);
        clearIslandRaidData(islandId);
        return;
    }

    // Ada level berikutnya — masuk queue level berikutnya
    broadcastDungeonMessage(`§e[Dungeon] §fIsland §e${islandName} §fis moving to §bDungeon Level ${nextLevel}§f!`);

    raidData.currentLevel = nextLevel;
    raidData.status = 'queued';
    // participants tetap, optedOut bisa ditambah lagi di fase preparing berikutnya
    setIslandRaidData(islandId, raidData);

    const nextState = getDungeonState(nextLevel);
    nextState.queue.push(islandId);
    setDungeonState(nextLevel, nextState);

    tryProcessQueue(nextLevel);
}

// ============================================================
//  RAID FAILED
// ============================================================

/**
 * Handle raid gagal: semua peserta mati
 * @param {string} islandId
 * @param {number} level
 */
export function handleRaidFailed(islandId, level) {
    const raidData = getIslandRaidData(islandId);
    const island = getData(`island:${islandId}`);
    const islandName = island?.name ?? islandId;

    broadcastDungeonMessage(`§c[Dungeon] §fIsland §e${islandName} §cfailed the dungeon at §bLevel ${level}§c!`);

    // Catat gagal
    recordRaidFailed(islandId, level);

    // Cleanup
    clearIslandRaidData(islandId);
    resetDungeonState(level);
    respawnDungeon(level);

    // // Kamu bisa tambahkan penalti lain di sini (cooldown, dll)

    // Proses queue berikutnya
    system.runTimeout(() => tryProcessQueue(level), 60 * TICKS_PER_SECOND);
}

/**
 * Handle raid cancelled (tidak ada peserta)
 * @param {string} islandId
 * @param {number} level
 * @param {'cancelled'} reason
 */
export function endRaid(islandId, level, reason) {
    clearIslandRaidData(islandId);
    resetDungeonState(level);
    respawnDungeon(level);
    system.runTimeout(() => tryProcessQueue(level), 60 * TICKS_PER_SECOND);
}

// ============================================================
//  HELPERS
// ============================================================

/**
 * Kirim pesan ke semua anggota island yang online
 * @param {string} islandId
 * @param {string} message
 */
function notifyIslandMembers(islandId, message) {
    const island = getData(`island:${islandId}`);
    if (!island) return;
    const online = world.getPlayers();
    for (const name of island.members) {
        const player = online.find(p => p.name === name);
        if (player) player.sendMessage(message);
    }
}

/**
 * Kirim pesan ke semua peserta raid yang online
 * @param {string[]} participants
 * @param {string} message
 */
function notifyRaidPlayers(participants, message) {
    const online = world.getPlayers();
    for (const name of participants) {
        const player = online.find(p => p.name === name);
        if (player) player.sendMessage(message);
    }
}