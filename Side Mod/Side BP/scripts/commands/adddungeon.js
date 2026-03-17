import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { addNewDungeon } from '../core/dungeonManager';

mc.system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:newdungeon',
        description: 'Add new dungeon',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        mc.system.run(() => addDungeonForm(player));
    })
})

/** @param {mc.Player} player */
function addDungeonForm(player) {
    const form = new ui.ModalFormData()
    form.title('Add Dungeon')
    form.textField('Structure ID', 'xxx')
    form.textField('Boss ID', 'xxx')
    form.textField('Location', '100 100 100', { defaultValue: '100 100 100' })
    form.textField('Spawn', '100 100 100', { defaultValue: '100 100 100' })
    form.textField('Dimension', 'overworld, nether, the_end', { defaultValue: 'overworld' })
    form.show(player).then(r => {
        if (r.canceled) return;
        const structureId = r.formValues[0].trim()
        const bossId = r.formValues[1].trim()
        const locationRaw = r.formValues[2].trim()
        const spawnRaw = r.formValues[3].trim()
        let location = null;
        let spawn = null;
        if (locationRaw) {
            location = locationRaw.split(' ');
            if (location.length !== 3) return player.sendMessage('§c[!] Location must be in the format of x y z');
            if (isNaN(Number(location[0])) || isNaN(Number(location[1])) || isNaN(Number(location[2]))) return player.sendMessage('§c[!] Location must be a number');
        }
        if (spawnRaw) {
            spawn = spawnRaw.split(' ');
            if (spawn.length !== 3) return player.sendMessage('§c[!] Spawn must be in the format of x y z');
            if (isNaN(Number(spawn[0])) || isNaN(Number(spawn[1])) || isNaN(Number(spawn[2]))) return player.sendMessage('§c[!] Spawn must be a number');
        }
        const dimension = r.formValues[4].trim()
        const result = addNewDungeon(structureId, bossId, location, spawn, dimension);
        player.sendMessage(result.message);
    })
}