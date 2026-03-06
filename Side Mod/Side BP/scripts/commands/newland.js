import { Player, system, CommandPermissionLevel } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { ISLAND_SLOTS, getIsland, takeIslandAsHost, applyToIsland } from "../core/islandManager";
import { getPlayerData } from "../core/playerManager";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:newland',
        description: "Acquire a new island or join another player's island",
        cheatsRequired: true,
        permissionLevel: CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => openIslandList(player))
    })
})

/** @param {Player} player */
function openIslandList(player) {
    const form = new ActionFormData()
    form.title("Island List")
    form.body('Select an island you want to go\n')
    for (const slot of ISLAND_SLOTS) {
        const islandKey = `island:${slot.id}`
        const island = getIsland(islandKey)
        let buttonText = island.name ?? island.id
        if (island.host) {
            buttonText += `\n§o§b[ ${island.host} ]`
        } else if (island.host === null && island.status === 'abandoned') {
            buttonText += `\n§o§cAbandoned`
        } else if (island.host === null && island.status === null) {
            buttonText += `\n§oAvailable`
        }
        form.button(buttonText)
    }
    form.show(player).then(result => {
        if (result.canceled) return;
        const selectedSlot = ISLAND_SLOTS[result.selection]
        // Run
        handleIslandSelection(player, selectedSlot.id)
    })
}

/** @param {Player} player */
function handleIslandSelection(player, islandId) {
    const islandKey = `island:${islandId}`;
    const island = getIsland(islandKey);
    if (!island) return player.sendMessage('§c[!] Island not found');
    if (island.host === null && island.status === 'abandoned') return player.sendMessage('§c[!] Island is abandoned');

    const playerData = getPlayerData(player.name);
    if (playerData.currentIsland) return player.sendMessage('§c[!] You are already in an island');
    if (island.host === null && island.status === null) {
        const result = takeIslandAsHost(player, islandId);
        return player.sendMessage(result.message);
    }
    if (playerData.appliedTo.includes(islandId)) return player.sendMessage('§e[!] You have already applied to this island');

    const result = applyToIsland(player, islandId);
    player.sendMessage(result.message);
}