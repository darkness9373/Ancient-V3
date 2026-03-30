import { world, system } from "@minecraft/server";
import { handleRaidPlayerDeath, handleBossDeath } from "./dungeonQueue";
import { getDungeonStatus, getDungeonLevel, getMaxDungeonLevel, getDungeonState } from "./dungeonManager";

// ============================================================
//  PLAYER DEATH HANDLER
//  Saat player mati dalam dungeon (punya tag on_raid),
//  set spawn point ke island lalu biarkan respawn normal
// ============================================================
world.afterEvents.entityDie.subscribe((data) => {
    const entity = data.deadEntity;

    // Filter hanya player
    if (entity.typeId !== 'minecraft:player') return;

    /** @type {import("@minecraft/server").Player} */
    const player = entity;

    // Cek apakah player sedang dalam raid
    if (!player.hasTag('on_raid')) return;

    // Handle logic raid (remove dari peserta, cek semua mati)
    system.run(() => {
        handleRaidPlayerDeath(player);
    });
});

// ============================================================
//  BOSS DEATH HANDLER
//  Deteksi boss dungeon mati berdasarkan typeId yang cocok
//  dengan bossId yang dikonfigurasi admin per level
// ============================================================
world.afterEvents.entityDie.subscribe((data) => {
    const entity = data.deadEntity;

    // Skip player
    if (entity.typeId === 'minecraft:player') return;

    // Cek dungeon sedang buka
    if (getDungeonStatus() === 'close') return;

    const maxLevel = getMaxDungeonLevel();
    if (maxLevel === 0) return;

    // Cek tiap level aktif apakah entity ini adalah boss-nya
    for (let level = 1; level <= maxLevel; level++) {
        const state = getDungeonState(level);

        // Level ini tidak sedang aktif raid
        if (state.status !== 'active') continue;

        const config = getDungeonLevel(level);
        if (!config) continue;

        // Cocokkan typeId entity dengan bossId config
        if (entity.typeId !== config.bossId) continue;

        // Pastikan boss ini berada di area dungeon (radius 100 dari location)
        const loc = entity.location;
        const dungeonLoc = config.location;
        const dx = Math.abs(loc.x - dungeonLoc.x);
        const dy = Math.abs(loc.y - dungeonLoc.y);
        const dz = Math.abs(loc.z - dungeonLoc.z);

        // // Sesuaikan radius deteksi boss sesuai ukuran dungeon kamu (default 100)
        if (dx > 100 || dy > 100 || dz > 100) continue;

        // Boss valid — handle kemenangan
        system.run(() => {
            handleBossDeath(level);
        });

        break;
    }
});