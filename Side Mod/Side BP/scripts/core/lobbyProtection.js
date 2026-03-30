import { world, system, GameMode } from "@minecraft/server";
import { LOBBY } from "../config/lobby";

// ============================================================
//  HELPER
// ============================================================

// Hitung min/max dari POS1 & POS2 (tidak perlu urut)
const MIN = {
    x: Math.min(LOBBY.POS1.x, LOBBY.POS2.x),
    y: Math.min(LOBBY.POS1.y, LOBBY.POS2.y),
    z: Math.min(LOBBY.POS1.z, LOBBY.POS2.z),
};
const MAX = {
    x: Math.max(LOBBY.POS1.x, LOBBY.POS2.x),
    y: Math.max(LOBBY.POS1.y, LOBBY.POS2.y),
    z: Math.max(LOBBY.POS1.z, LOBBY.POS2.z),
};

/**
 * Cek apakah posisi berada di dalam area lobby
 * @param {{ x: number, y: number, z: number }} pos
 * @returns {boolean}
 */
function isInLobby(pos) {
    return (
        pos.x >= MIN.x && pos.x <= MAX.x &&
        pos.y >= MIN.y && pos.y <= MAX.y &&
        pos.z >= MIN.z && pos.z <= MAX.z
    );
}

// Entity yang TIDAK dihapus di lobby (selain minecraft:player)
// // Tambahkan entity ID yang ingin dibiarkan di lobby
const ALLOWED_ENTITIES = [
    'minecraft:item',
    'drk:npccustom',
    'minecraft:armor_stand',
    // 'namespace:custom_entity',
];

// ============================================================
//  BLOCK PROTECTION — No break & no place
// ============================================================

world.beforeEvents.playerBreakBlock.subscribe(data => {
    if (!isInLobby(data.block.location)) return;
    if (data.player.hasTag('admin')) return;
    data.cancel = true;
    system.run(() => data.player.onScreenDisplay.setActionBar('§cYou cannot break blocks in the lobby'));
});

world.afterEvents.playerPlaceBlock.subscribe(data => {
    if (!isInLobby(data.block.location)) return;
    if (data.player.hasTag('admin')) return;
    system.run(() => {
        data.block.setType('minecraft:air');
        data.player.onScreenDisplay.setActionBar('§cYou cannot place blocks in the lobby');
    });
});

// ============================================================
//  NO DAMAGE — Blokir semua damage di lobby
// ============================================================

world.beforeEvents.entityHurt.subscribe(data => {
    const entity = data.hurtEntity;
    if (entity.typeId !== 'minecraft:player') return;
    if (!isInLobby(entity.location)) return;
    data.cancel = true;
});

// ============================================================
//  MOB REMOVAL — Hapus mob yang bukan player atau whitelist
// ============================================================

system.runInterval(() => {
    const dimension = world.getDimension(LOBBY.dimension);
    const center = LOBBY.pos;
    const maxDist = Math.max(MAX.x - MIN.x, MAX.y - MIN.y, MAX.z - MIN.z);

    const entities = dimension.getEntities({
        location: center,
        maxDistance: maxDist
    });

    for (const entity of entities) {
        if (entity.typeId === 'minecraft:player') continue;
        if (ALLOWED_ENTITIES.includes(entity.typeId)) continue;
        if (!isInLobby(entity.location)) continue;
        try {
            entity.remove();
        } catch (e) {}
    }
}, 40); // Cek setiap 2 detik

// ============================================================
//  ADVENTURE MODE — Paksa adventure saat di lobby
// ============================================================

world.afterEvents.playerSpawn.subscribe(data => {
    const player = data.player;
    system.run(() => {
        if (isInLobby(player.location)) {
            player.setGameMode(GameMode.adventure);
        }
    });
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (player.hasTag('admin')) continue;
        if (isInLobby(player.location)) {
            // Di dalam lobby → adventure
            if (player.getGameMode() === GameMode.Survival) {
                player.setGameMode(GameMode.Adventure);
            }
        } else {
            // Di luar lobby → survival
            if (player.getGameMode() === GameMode.Adventure) {
                player.setGameMode(GameMode.Survival);
            }
        }
    }
}, 20); // Cek setiap 1 detik