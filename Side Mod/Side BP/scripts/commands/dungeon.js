import * as mc from '@minecraft/server'
import { closeDungeon, getDungeonStatus, openDungeon } from '../core/dungeonManager'
import { getPlayerData } from '../core/playerManager';
import { getIsland } from '../core/islandManager';

mc.system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:dungeon',
        description: 'Doing a dungeon raid',
        permissionLevel: mc.CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        const dung = getDungeonStatus()
        if (dung === 'close') return player.sendMessage('§c[!] Dungeon is currently closed')
    })
    data.customCommandRegistry.registerCommand({
        name: 'as:opendungeon',
        description: 'Open dungeon',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        const result = openDungeon()
        player.sendMessage(result.message);
    })
    data.customCommandRegistry.registerCommand({
        name: 'as:closedungeon',
        description: 'Close dungeon',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        const result = closeDungeon()
        player.sendMessage(result.message);
    })
})

function dungeonHandler(player) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return player.sendMessage('§c[!] You are not in an island');
    const islandKey = `island:${playerData.currentIsland}`;
    const island = getIsland(islandKey);
    if (!island) return player.sendMessage('§c[!] Island not found');
    if (island.host !== player.name) return player.sendMessage('§c[!] You are not the island host');

    //Open Dungeon
}