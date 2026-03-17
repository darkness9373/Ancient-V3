import * as mc from '@minecraft/server'
import { getDungeonStatus } from '../core/dungeonManager'

mc.system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:dungeon',
        description: 'Doing a dungeon raid',
        permissionLevel: mc.CommandPermissionLevel.Any
    }, (origin, board) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        const dung = getDungeonStatus()
        if (dung === 'close') return player.sendMessage('§c[!] Dungeon is currently closed')
    })
})