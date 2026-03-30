import * as mc from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui';
import {
    openDungeon, closeDungeon, getDungeonStatus,
    getDungeonLevel, setDungeonLevel, patchDungeonLevel, deleteDungeonLevel,
    getMaxDungeonLevel, isDungeonLevelAvailable
} from '../core/dungeonManager';
import { joinDungeonQueue, optOutRaid } from '../core/dungeonQueue';

mc.system.beforeEvents.startup.subscribe(data => {

    // ============================================================
    //  /as:dungeon
    //  Host island mulai dungeon raid — masuk ke queue level 1
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:dungeon',
        description: 'Start a dungeon raid for your island',
        permissionLevel: mc.CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        if (getDungeonStatus() === 'close') {
            return player.sendMessage('§c[!] Dungeon is currently closed');
        }

        if (player.hasTag('on_raid')) {
            return player.sendMessage('§c[!] You are already in a dungeon raid');
        }

        const result = joinDungeonQueue(player);
        player.sendMessage(result.message);
    });

    // ============================================================
    //  /as:optout
    //  Anggota island opt-out dari raid saat fase preparing
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:optout',
        description: 'Opt out from the upcoming dungeon raid',
        permissionLevel: mc.CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        const result = optOutRaid(player);
        player.sendMessage(result.message);
    });

    // ============================================================
    //  /as:opendungeon
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:opendungeon',
        description: 'Open the dungeon',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        const result = openDungeon();
        mc.system.run(() => player.sendMessage(result.message));
    });

    // ============================================================
    //  /as:closedungeon
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:closedungeon',
        description: 'Close the dungeon',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        const result = closeDungeon();
        mc.system.run(() => player.sendMessage(result.message));
    });

    // ============================================================
    //  /as:addnewdungeon
    //  Admin tambah level dungeon baru via ModalFormData
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:addnewdungeon',
        description: 'Add a new dungeon level',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        mc.system.run(() => {
            const maxLevel = getMaxDungeonLevel();
            const nextLevel = maxLevel + 1;

            new ModalFormData()
                .title(`§lAdd New Dungeon Level`)
                .textField(
                    `§fLevel Number\n§7Next available: §e${nextLevel}`,
                    `e.g. ${nextLevel}`,
					{ defaultValue: String(nextLevel)}
                )
                .textField(
                    '§fStructure ID\n§7ID structure dari dungeon',
                    'e.g. mypack:dungeon_floor_1'
                )
                .textField(
                    '§fBoss Entity ID\n§7Entity type ID boss dungeon',
                    'e.g. minecraft:wither'
                )
                .textField(
                    '§fLocation (X Y Z)\n§7Koordinat structure akan di-spawn',
                    'e.g. 100 64 200'
                )
                .textField(
                    '§fTeleport (X Y Z)\n§7Koordinat player masuk dungeon',
                    'e.g. 105 65 205'
                )
                .submitButton('§a§lAdd Dungeon Level')
                .show(player)
                .then(response => {
                    if (response.canceled) return;

                    const [levelStr, structureId, bossId, locationStr, teleportStr] = response.formValues;

                    // Validasi level
                    const level = parseInt(levelStr);
                    if (isNaN(level) || level < 1) {
                        return player.sendMessage('§c[!] Invalid level number. Must be 1 or higher.');
                    }

                    // Cek level tidak loncat
                    if (level > 1 && !isDungeonLevelAvailable(level - 1)) {
                        return player.sendMessage(`§c[!] Cannot add level ${level} — level ${level - 1} does not exist yet.`);
                    }

                    // Validasi structureId
                    if (!structureId || structureId.trim() === '') {
                        return player.sendMessage('§c[!] Structure ID cannot be empty.');
                    }

                    // Validasi bossId
                    if (!bossId || bossId.trim() === '') {
                        return player.sendMessage('§c[!] Boss ID cannot be empty.');
                    }

                    // Parse location "x y z"
                    const locParts = locationStr.trim().split(/\s+/);
                    if (locParts.length !== 3 || locParts.some(v => isNaN(parseInt(v)))) {
                        return player.sendMessage('§c[!] Invalid location format. Use: §fX Y Z §7(e.g. 100 64 200)');
                    }
                    const location = {
                        x: parseInt(locParts[0]),
                        y: parseInt(locParts[1]),
                        z: parseInt(locParts[2])
                    };

                    // Parse teleport "x y z"
                    const tpParts = teleportStr.trim().split(/\s+/);
                    if (tpParts.length !== 3 || tpParts.some(v => isNaN(parseInt(v)))) {
                        return player.sendMessage('§c[!] Invalid teleport format. Use: §fX Y Z §7(e.g. 105 65 205)');
                    }
                    const teleport = {
                        x: parseInt(tpParts[0]),
                        y: parseInt(tpParts[1]),
                        z: parseInt(tpParts[2])
                    };

                    // Simpan config
                    setDungeonLevel(level, {
                        structureId: structureId.trim(),
                        bossId: bossId.trim(),
                        location,
                        teleport
                    });

                    player.sendMessage(
                        `§a[!] Dungeon level §e${level} §aadded successfully!\n` +
                        `§7Structure : §f${structureId.trim()}\n` +
                        `§7Boss      : §f${bossId.trim()}\n` +
                        `§7Location  : §f${location.x}, ${location.y}, ${location.z}\n` +
                        `§7Teleport  : §f${teleport.x}, ${teleport.y}, ${teleport.z}`
                    );
                });
        });
    });

    // ============================================================
    //  /as:settingdungeon
    //  Admin edit config dungeon level tertentu via ModalFormData
    //  Nilai field yang tidak diubah tetap menggunakan nilai lama
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:settingdungeon',
        description: 'Edit a dungeon level config',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
            { name: 'level', type: mc.CustomCommandParamType.Integer }
        ]
    }, (origin, level) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        mc.system.run(() => {
            const config = getDungeonLevel(level);
            if (!config) {
                return player.sendMessage(`§c[!] Dungeon level ${level} not found`);
            }

            const locDefault = `${config.location.x} ${config.location.y} ${config.location.z}`;
            const tpDefault  = `${config.teleport.x} ${config.teleport.y} ${config.teleport.z}`;

            new ModalFormData()
                .title(`§lEdit Dungeon Level ${level}`)
                .textField(
                    '§fStructure ID\n§7Kosongkan untuk tidak mengubah',
                    'e.g. mypack:dungeon_floor_1',
                    { defaultValue: config.structureId }
                )
                .textField(
                    '§fBoss Entity ID\n§7Kosongkan untuk tidak mengubah',
                    'e.g. minecraft:wither',
                    { defaultValue: config.bossId }
                )
                .textField(
                    '§fLocation (X Y Z)\n§7Kosongkan untuk tidak mengubah',
                    'e.g. 100 64 200',
                    { defaultValue: locDefault }
                )
                .textField(
                    '§fTeleport (X Y Z)\n§7Kosongkan untuk tidak mengubah',
                    'e.g. 105 65 205',
                    { defaultValue: tpDefault }
                )
                .submitButton('§e§lSave Changes')
                .show(player)
                .then(response => {
                    if (response.canceled) return;

                    const [structureId, bossId, locationStr, teleportStr] = response.formValues;
                    const patch = {};

                    // Structure ID
                    if (structureId.trim() !== '' && structureId.trim() !== config.structureId) {
                        patch.structureId = structureId.trim();
                    }

                    // Boss ID
                    if (bossId.trim() !== '' && bossId.trim() !== config.bossId) {
                        patch.bossId = bossId.trim();
                    }

                    // Location
                    if (locationStr.trim() !== '' && locationStr.trim() !== locDefault) {
                        const parts = locationStr.trim().split(/\s+/);
                        if (parts.length !== 3 || parts.some(v => isNaN(parseInt(v)))) {
                            return player.sendMessage('§c[!] Invalid location format. Use: §fX Y Z');
                        }
                        patch.location = {
                            x: parseInt(parts[0]),
                            y: parseInt(parts[1]),
                            z: parseInt(parts[2])
                        };
                    }

                    // Teleport
                    if (teleportStr.trim() !== '' && teleportStr.trim() !== tpDefault) {
                        const parts = teleportStr.trim().split(/\s+/);
                        if (parts.length !== 3 || parts.some(v => isNaN(parseInt(v)))) {
                            return player.sendMessage('§c[!] Invalid teleport format. Use: §fX Y Z');
                        }
                        patch.teleport = {
                            x: parseInt(parts[0]),
                            y: parseInt(parts[1]),
                            z: parseInt(parts[2])
                        };
                    }

                    // Tidak ada yang diubah
                    if (Object.keys(patch).length === 0) {
                        return player.sendMessage('§7[!] No changes were made.');
                    }

                    const result = patchDungeonLevel(level, patch);
                    player.sendMessage(result.message);

                    // Tampilkan ringkasan perubahan
                    const changed = Object.entries(patch)
                        .map(([k, v]) => `§7  ${k}: §f${typeof v === 'object' ? `${v.x}, ${v.y}, ${v.z}` : v}`)
                        .join('\n');
                    player.sendMessage(`§7Changes applied:\n${changed}`);
                });
        });
    });

    // ============================================================
    //  /as:dungeoninfo
    //  Lihat config dungeon level tertentu
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:dungeoninfo',
        description: 'View dungeon level config',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
            { name: 'level', type: mc.CustomCommandParamType.Integer }
        ]
    }, (origin, level) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        const config = getDungeonLevel(level);
        if (!config) {
            return player.sendMessage(`§c[!] Dungeon level ${level} not found`);
        }

        player.sendMessage(
            `§e[Dungeon Level ${level}]\n` +
            `§7Structure ID : §f${config.structureId}\n` +
            `§7Boss ID      : §f${config.bossId}\n` +
            `§7Location     : §f${config.location.x}, ${config.location.y}, ${config.location.z}\n` +
            `§7Teleport     : §f${config.teleport.x}, ${config.teleport.y}, ${config.teleport.z}`
        );
    });

    // ============================================================
    //  /as:dungeonlist
    //  Lihat semua level dungeon yang sudah ditambahkan
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:dungeonlist',
        description: 'View all configured dungeon levels',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        const maxLevel = getMaxDungeonLevel();
        if (maxLevel === 0) {
            return player.sendMessage('§c[!] No dungeon levels configured yet');
        }

        let msg = `§e[Dungeon Levels] §7Max Level: §e${maxLevel}\n`;
        for (let i = 1; i <= maxLevel; i++) {
            msg += isDungeonLevelAvailable(i)
                ? `§a  ✔ Level ${i}\n`
                : `§c  ✘ Level ${i} §7(missing!)\n`;
        }

        player.sendMessage(msg.trim());
    });

    // ============================================================
    //  /as:deletedungeon
    //  Admin hapus config dungeon level tertentu
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:deletedungeon',
        description: 'Delete a dungeon level config',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
            { name: 'level', type: mc.CustomCommandParamType.Integer }
        ]
    }, (origin, level) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        if (!isDungeonLevelAvailable(level)) {
            return player.sendMessage(`§c[!] Dungeon level ${level} not found`);
        }

        deleteDungeonLevel(level);
        player.sendMessage(`§a[!] Dungeon level §e${level} §adeleted`);
    });

});