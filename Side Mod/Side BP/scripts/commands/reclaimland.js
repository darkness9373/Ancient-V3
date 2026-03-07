import { CommandPermissionLevel, Player, system } from "@minecraft/server";
import { getIsland, ISLAND_SLOTS } from "../core/islandManager";
import { ActionFormData } from "@minecraft/server-ui";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:reclaimland',
        description: 'Reclaim a island',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => commandReclaim(player));
    })
})

/** @param {Player} player */
function commandReclaim(player) {
    const abandoned = []
    for (const slot of ISLAND_SLOTS) {
        const islandKey = `island:${slot.id}`
        const island = getIsland(islandKey)
        if (island.status === 'abandoned') abandoned.push(islandKey)
    }
    if (abandoned.length === 0) return player.sendMessage('§c[!] No abandoned island');
    const form = new ActionFormData()
    form.title('Reclaim Island')
    form.body('Select an island you want to reclaim\n')
    for (const islandKey of abandoned) {
        const island = getIsland(islandKey);
        form.button(island.name)
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const selectedIslandKey = abandoned[r.selection]
        const island = getIsland(selectedIslandKey);
        const result = reclaimIsland(island.id);
        player.sendMessage(result.message);
    })
}