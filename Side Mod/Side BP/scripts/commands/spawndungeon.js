import * as mc from '@minecraft/server'
import { getData } from '../core/database';
import { ActionFormData } from '@minecraft/server-ui';

mc.system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:spawndungeon',
        description: 'Spawn dungeon',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        mc.system.run(() => spawnDungeon(player));
    })
})

/** @param {mc.Player} player */
function spawnDungeon(player) {
    let func = []
    const dataKey = 'dungeon:levels'
    const data = getData(dataKey)
    if (!data) return player.sendMessage('§c[!] Invalid dungeon data')
    if (Object.keys(data).length === 0) return player.sendMessage('§c[!] No dungeon level found')
    const form = new ActionFormData()
    form.title('Spawn Dungeon')
    form.body('Select a dungeon level you want to spawn\n')
    for (const key in data) {
        form.button(`Level ${key} Dungeon`)
        func.push(() => {
            spawnLevel(key)
        })
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        func[r.selection]()
    })
}

function spawnLevel(level) {
    const dataKey = 'dungeon:levels'
    const data = getData(dataKey)
    if (!data) return player.sendMessage('§c[!] Invalid dungeon data')
    if (Object.keys(data).length === 0) return player.sendMessage('§c[!] No dungeon level found')
    const selected = data[level]
    mc.world.structureManager.place(selected.structure, mc.world.getDimension(selected.dimension), selected.location)
}