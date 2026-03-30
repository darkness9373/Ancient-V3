import { world, system } from "@minecraft/server";
import { getData, setData, deleteData } from "./database";
import { getPlayerData, savePlayerData } from "./playerManager";
import { teleportToIsland } from "./islandManager";

// ============================================================
//  DUNGEON GLOBAL STATUS
//  Key: dungeon:status => { status: 'open'|'close', level: number }
//  Diinisialisasi di worldLoad (index.js / main.js)
// ============================================================

/**
 * Buka dungeon (admin only)
 * @returns {{ success: boolean, message: string }}
 */
export function openDungeon() {
    const data = getData('dungeon:status');
    if (!data) return { success: false, message: '§c[!] Invalid dungeon data' };

    data.status = 'open';
    setData('dungeon:status', data);
    world.sendMessage('§a[!] The Dungeon is now open!');
    return { success: true, message: '§a[!] Dungeon successfully opened' };
}

/**
 * Tutup dungeon (admin only)
 * @returns {{ success: boolean, message: string }}
 */
export function closeDungeon() {
    const data = getData('dungeon:status');
    if (!data) return { success: false, message: '§c[!] Invalid dungeon data' };

    data.status = 'close';
    setData('dungeon:status', data);
    world.sendMessage('§c[!] The dungeon is now closed!');
    return { success: true, message: '§a[!] Dungeon successfully closed' };
}

/**
 * Ambil status dungeon global
 * @returns {'open' | 'close'}
 */
export function getDungeonStatus() {
    const data = getData('dungeon:status');
    if (!data) return 'close';
    return data.status ?? 'close';
}

/**
 * Ambil max level dungeon yang sudah ditambahkan admin
 * @returns {number}
 */
export function getMaxDungeonLevel() {
    const data = getData('dungeon:status');
    if (!data) return 0;
    return data.level ?? 0;
}

// ============================================================
//  DUNGEON LEVEL CONFIG MANAGEMENT
//  Key: dungeon:level:{level} => { level, structureId, bossId, location, teleport }
// ============================================================

/**
 * Ambil config dungeon untuk level tertentu
 * @param {number} level
 * @returns {{ level: number, structureId: string, bossId: string, location: {x,y,z}, teleport: {x,y,z} } | null}
 */
export function getDungeonLevel(level) {
    return getData(`dungeon:level:${level}`);
}

/**
 * Tambah atau update config dungeon untuk level tertentu.
 * Otomatis update dungeon:status.level jika level ini lebih tinggi dari sebelumnya.
 * @param {number} level
 * @param {{ structureId: string, bossId: string, location: {x,y,z}, teleport: {x,y,z} }} config
 */
export function setDungeonLevel(level, config) {
    setData(`dungeon:level:${level}`, { level, ...config });

    // Update max level jika level ini lebih tinggi
    const status = getData('dungeon:status');
    if (status && level > status.level) {
        status.level = level;
        setData('dungeon:status', status);
    }
}

/**
 * Update sebagian config dungeon (untuk /settingdungeon)
 * @param {number} level
 * @param {Partial<{ structureId: string, bossId: string, location: {x,y,z}, teleport: {x,y,z} }>} patch
 * @returns {{ success: boolean, message: string }}
 */
export function patchDungeonLevel(level, patch) {
    const config = getDungeonLevel(level);
    if (!config) return { success: false, message: `§c[!] Dungeon level ${level} not found` };

    const updated = { ...config, ...patch };
    setData(`dungeon:level:${level}`, updated);
    return { success: true, message: `§a[!] Dungeon level ${level} updated` };
}

/**
 * Hapus config dungeon level tertentu dan recalculate max level
 * @param {number} level
 */
export function deleteDungeonLevel(level) {
    deleteData(`dungeon:level:${level}`);

    const status = getData('dungeon:status');
    if (!status) return;

    // Recalculate max level jika level yang dihapus adalah max
    if (level === status.level) {
        let newMax = 0;
        for (let i = level - 1; i >= 1; i--) {
            if (getDungeonLevel(i)) { newMax = i; break; }
        }
        status.level = newMax;
        setData('dungeon:status', status);
    }
}

/**
 * Cek apakah level dungeon tersedia (config-nya ada)
 * @param {number} level
 * @returns {boolean}
 */
export function isDungeonLevelAvailable(level) {
    return !!getDungeonLevel(level);
}

// ============================================================
//  DUNGEON STATE PER LEVEL
//  Key: dungeon:state:{level}
//  status: 'idle' | 'active' | 'looting'
// ============================================================

/**
 * Ambil state dungeon untuk level tertentu
 * @param {number} level
 * @returns {{ level: number, status: string, currentIsland: string|null, raidPlayers: string[], queue: string[] }}
 */
export function getDungeonState(level) {
    return getData(`dungeon:state:${level}`) ?? {
        level,
        status: 'idle',
        currentIsland: null,
        raidPlayers: [],
        queue: []
    };
}

/**
 * Simpan state dungeon untuk level tertentu
 * @param {number} level
 * @param {object} state
 */
export function setDungeonState(level, state) {
    setData(`dungeon:state:${level}`, state);
}

/**
 * Reset state dungeon ke idle
 * @param {number} level
 */
export function resetDungeonState(level) {
    setDungeonState(level, {
        level,
        status: 'idle',
        currentIsland: null,
        raidPlayers: [],
        queue: []
    });
}

// ============================================================
//  ISLAND RAID DATA
//  Key: dungeon:raid:{islandId}
//  status: 'queued' | 'preparing' | 'raiding' | 'looting'
// ============================================================

/**
 * Ambil data raid island
 * @param {string} islandId
 * @returns {{
 *   islandId: string,
 *   currentLevel: number,
 *   status: 'queued'|'preparing'|'raiding'|'looting'|null,
 *   participants: string[],
 *   optedOut: string[],
 *   startedAt: number|null
 * } | null}
 */
export function getIslandRaidData(islandId) {
    return getData(`dungeon:raid:${islandId}`) ?? null;
}

/**
 * Simpan data raid island
 * @param {string} islandId
 * @param {object} data
 */
export function setIslandRaidData(islandId, data) {
    setData(`dungeon:raid:${islandId}`, data);
}

/**
 * Hapus data raid island setelah raid selesai
 * @param {string} islandId
 */
export function clearIslandRaidData(islandId) {
    deleteData(`dungeon:raid:${islandId}`);
}

// ============================================================
//  ISLAND RAID STATS
// ============================================================

/**
 * Catat raid gagal untuk island
 * @param {string} islandId
 * @param {number} level - Level dungeon saat gagal
 */
export function recordRaidFailed(islandId, level) {
    const key = `island:${islandId}`;
    const island = getData(key);
    if (!island) return;
    if (!island.raidFailed) island.raidFailed = [];
    island.raidFailed.push({ level, failedAt: Date.now() });
    setData(key, island);
}

/**
 * Catat raid berhasil untuk island
 * @param {string} islandId
 * @param {number} level
 */
export function recordRaidCleared(islandId, level) {
    const key = `island:${islandId}`;
    const island = getData(key);
    if (!island) return;
    if (!island.raidCleared) island.raidCleared = [];
    island.raidCleared.push({ level, clearedAt: Date.now() });
    setData(key, island);
}

// ============================================================
//  STRUCTURE & MOB MANAGEMENT
// ============================================================

/**
 * Spawn structure dungeon di lokasi yang dikonfigurasi admin
 * @param {number} level
 * @returns {boolean}
 */
export function spawnDungeonStructure(level) {
    const config = getDungeonLevel(level);
    if (!config) return false;

    const { x, y, z } = config.location;
    world.getDimension('overworld').runCommand(
        `structure load "${config.structureId}" ${x} ${y} ${z}`
    );
    return true;
}

/**
 * Bersihkan semua mob di area dungeon (kecuali player)
 * @param {number} level
 */
export function clearDungeonMobs(level) {
    const config = getDungeonLevel(level);
    if (!config) return;

    const { x, y, z } = config.location;
    // // Sesuaikan radius (default 100) sesuai ukuran dungeon kamu
    world.getDimension('overworld').runCommand(
        `kill @e[x=${x},y=${y},z=${z},r=100,type=!player]`
    );
}

/**
 * Reset dungeon: clear mob lalu spawn ulang structure.
 * Dipanggil setelah raid selesai (menang maupun kalah).
 * @param {number} level
 */
export function respawnDungeon(level) {
    clearDungeonMobs(level);
    // // Sesuaikan delay jika perlu (default 2 detik = 40 ticks)
    system.runTimeout(() => {
        spawnDungeonStructure(level);
    }, 40);
}

// ============================================================
//  PLAYER TAG MANAGEMENT
// ============================================================

/** @param {import("@minecraft/server").Player} player */
export function tagPlayerOnRaid(player) {
    player.addTag('on_raid');
}

/** @param {import("@minecraft/server").Player} player */
export function untagPlayerOnRaid(player) {
    player.removeTag('on_raid');
}

/**
 * @param {import("@minecraft/server").Player} player
 * @returns {boolean}
 */
export function isPlayerOnRaid(player) {
    return player.hasTag('on_raid');
}

// ============================================================
//  TELEPORT HELPERS
// ============================================================

/**
 * Teleport player ke titik masuk dungeon level tertentu
 * @param {import("@minecraft/server").Player} player
 * @param {number} level
 * @returns {boolean}
 */
export function teleportPlayerToDungeon(player, level) {
    const config = getDungeonLevel(level);
    if (!config) return false;

    const { x, y, z } = config.teleport;
    player.tryTeleport({ x, y, z }, { dimension: world.getDimension('overworld') });
    return true;
}

/**
 * Teleport semua player raid kembali ke island masing-masing & hapus tag on_raid
 * @param {string[]} playerNames
 */
export function teleportRaidPlayersToIsland(playerNames) {
    const online = world.getPlayers();
    for (const name of playerNames) {
        const player = online.find(p => p.name === name);
        if (!player) continue;
        untagPlayerOnRaid(player);
        teleportToIsland(player);
    }
}

// ============================================================
//  GLOBAL BROADCAST
// ============================================================

/**
 * Kirim notifikasi global ke semua player
 * @param {string} message
 */
export function broadcastDungeonMessage(message) {
    world.sendMessage(message);
}