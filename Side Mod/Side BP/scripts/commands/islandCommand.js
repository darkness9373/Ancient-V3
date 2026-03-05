import { Player, system, CommandPermissionLevel, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { ISLAND_SLOTS, getIsland, takeIslandAsHost, applyToIsland, transferHost, leaveIsland, acceptPlayer, rejectPlayer, kickMember } from "../core/islandManager";
import { getPlayerData } from "../core/playerManager";
import { setData } from "../core/database";

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
    data.customCommandRegistry.registerCommand({
        name: 'as:myisland',
        description: "View your island",
        cheatsRequired: true,
        permissionLevel: CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => openMyIsland(player))
    })
})

/** @param {Player} player */
function openMyIsland(player) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return player.sendMessage('You are not have an island');
    const islandKey = `island:${playerData.currentIsland}`;
    const island = getIsland(islandKey);
    if (!island) return player.sendMessage('Island not found');

    const form = new ActionFormData()
    form.title('My Island')
    form.body(
        `§7Host: §o${island.host ?? 'None'}\n` +
        `§7Members: §o${island.members.length}/${island.maxMembers}\n` +
        `§7Status: §o${island.status ?? 'active'}`
    )
    form.button('§cLeave Island')
    form.button('§gMember List')
    if (island.host === player.name) {
        form.divider()
        form.button('Change Island Name')
        form.button('Transfer Host')
        form.button('Approval Requests')
    }
    form.show(player).then(result => {
        if (result.canceled) return;
        handleMyIslandSelection(player, result.selection, island)
    })
}

/** @param {Player} player */
function handleMyIslandSelection(player, selection, island) {
    const isHost = island.host === player.name;
    if (selection === 0) {
        const result = leaveIsland(player);
        player.sendMessage(result.message);
        return;
    }
    if (selection === 1) {
        openMemberList(player, island);
        return;
    }
    if (!isHost) return;
    switch (selection) {
        case 2:
            openChangeIslandName(player, island);
            break;
        case 3:
            openTransferHost(player, island);
            break;
        case 4:
            openHostApprovalMenu(player, island);
            break;
    }
}

/** @param {Player} player */
function openMemberList(player, island) {
    const isHost = island.host === player.name;
    const form = new ActionFormData()
    form.title('Member List')
    form.body('§bHost: ' + island.host + '\n')
    const memberList = []
    for (const member of island.members) {
        const status = world.getPlayers().find(p => p.name === member) ? '§aOnline' : '§cOffline';
        if (isHost && member !== player.name) {
            form.button(`${member}\n${status}`)
            memberList.push(member)
        }
    }
    if (!isHost) {
        let bodyText = `§bHost: ${island.host}\n\n`
        for (const member of island.members) {
            const status = world.getPlayers().find(p => p.name === member) ? '§aOnline' : '§cOffline';
            bodyText += `§b${member} - ${status}\n`
        }
        form.body(bodyText)
        form.show(player)
        return;
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const target = memberList[r.selection];
        openKickConfirm(player, island, target);
    })
}

/** @param {Player} player */
function openKickConfirm(player, island, targetName) {
    const form = new ActionFormData()
    form.title(`Kick ${targetName}`)
    form.body(`Are you sure you want to kick §e${targetName}§r?`)
    form.button('Kick')
    form.button('Cancel')
    form.show(player).then(r => {
        if (r.canceled) return;
        if (r.selection === 0) {
            const result = kickMember(player, targetName)
            player.sendMessage(result.message);
        }
    })
}

/** @param {Player} player */
function openHostApprovalMenu(player, island) {
    if (island.pendingRequests.length === 0) return player.sendMessage('§c[!] No pending requests');

    const form = new ActionFormData()
    form.title('Host Approval Requests')
    form.body('Select a player you want to approve\n')
    for (const name of island.pendingRequests) {
        form.button(name)
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const target = island.pendingRequests[r.selection];
        openApprovalActionMenu(player, island, target);
    })
}

/** @param {Player} player */
function openApprovalActionMenu(player, island, targetName) {
    const form = new ActionFormData()
    form.title('Host Approval Actions')
    form.body(`Select an action for §e${targetName}§r`)
    form.button('§aAccept')
    form.button('§cReject')
    form.show(player).then(r => {
        if (r.canceled) return;
        const action = r.selection;
        if (action === 0) {
            const result = acceptPlayer(island.id, targetName);
            player.sendMessage(result.message);
        } else {
            const result = rejectPlayer(island.id, targetName);
            player.sendMessage(result.message);
        }
    })
}

/** @param {Player} player */
function openTransferHost(player, island) {
    const form = new ActionFormData()
    form.title('Transfer Host')
    form.body('Select a new host you want to transfer\n')
    const memberList = []
    for (const member of island.members) {
        if (member === island.host) continue;
        form.button(member)
        memberList.push(member)
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const target = memberList[r.selection];
        const result = transferHost(player, target);
        player.sendMessage(result.message);
    })
}

/** @param {Player} player */
function openChangeIslandName(player, island) {
    const islandKey = `island:${island.id}`;
    const form = new ModalFormData()
    form.title('Change Island Name')
    form.textField('New Island Name', 'Island Name', { defaultValue: island.name })
    form.show(player).then(result => {
        if (result.canceled) return;
        const newName = result.formValues[0].trim();
        if (!newName || newName.length < 3) return player.sendMessage('§c[!] Island name must be at least 3 characters');
        island.name = newName;
        setData(islandKey, island);
        player.sendMessage(`§a[!] Island name changed to ${newName}`);
    })
}

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