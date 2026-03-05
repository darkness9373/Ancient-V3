import { Player, system, CommandPermissionLevel } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { getIsland } from "../core/islandManager";
import { finalizeJoin, cancelApply } from "../core/islandManager";
import { getPlayerData } from "../core/playerManager";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:myrequest',
        description: "View your island request",
        cheatsRequired: true,
        permissionLevel: CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => openMyRequest(player))
    })
})

/** @param {Player} player */
function openMyRequest(player) {
    const playerData = getPlayerData(player.name);
    const allRequest = new Set([
        ...playerData.appliedTo,
        ...playerData.incomingApproval
    ])
    if (allRequest.size === 0) return player.sendMessage('You have no request');

    const form = new ActionFormData()
    form.title('My Request')
    form.body('Your request list')
    const requestList = []
    for (const islandId of allRequest) {
        const island = getIsland(`island:${islandId}`);
        if (!island) continue;
        let status = '§ePending'
        if (playerData.incomingApproval.includes(islandId)) status = '§aApproved'
        form.button(`${island.name}\n${status}`)
        requestList.push(islandId)
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const selectedIslandId = requestList[r.selection]
        openRequestActionMenu(player, selectedIslandId)
    })
}

/** @param {Player} player */
function openRequestActionMenu(player, islandId) {
    const playerData = getPlayerData(player.name);
    const island = getIsland(`island:${islandId}`);
    if (!island) return player.sendMessage('Island not found');

    const form = new ActionFormData()
    form.title(island.name)
    const isApproved = playerData.incomingApproval.includes(islandId);
    if (isApproved) {
        form.body('You have already approved this request')
        form.button('Join Island')
    } else {
        form.body('Waiting for approval')
        form.button('Cancel Request')
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        if (isApproved) {
            const result = finalizeJoin(player, islandId);
            player.sendMessage(result.message);
        } else {
            const result = cancelApply(player, islandId);
            player.sendMessage(result.message);
        }
    })
}