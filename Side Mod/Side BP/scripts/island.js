import { ISLAND_SLOTS } from "./core/islandManager";
import { getData, setData } from "./core/database";
import { CommandPermissionLevel, CustomCommandParamType, Player, system } from "@minecraft/server";
import { takeIslandAsHost, leaveIsland, transferHost } from "./core/islandManager";

system.run(() => {
    for (const slot of ISLAND_SLOTS) {
        if (!getData(`island:${slot.id}`)) {
            setData(`island:${slot.id}`, {
                id: slot.id,
                name: slot.id,
                host: null,
                members: [],
                status: null,
                pendingRequests: [],
                maxMembers: 5,
                createAt: null
            });
        }
    }
})

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:island',
        description: 'Open the island List',
        cheatsRequired: true,
        permissionLevel: CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        const r = takeIslandAsHost(player, 'island1');
        player.sendMessage(r.message)
    })
    data.customCommandRegistry.registerCommand({
        name: 'as:leave',
        description: 'Leave the island',
        cheatsRequired: true,
        permissionLevel: CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        const r = leaveIsland(player);
        player.sendMessage(r.message)
    })
    try {
        data.customCommandRegistry.registerCommand({
            name: 'as:transfer',
            description: 'Transfer host to another player',
            cheatsRequired: true,
            permissionLevel: CommandPermissionLevel.Any,
            mandatoryParameters: [
                {
                    name: 'player',
                    type: CustomCommandParamType.PlayerSelector
                }
            ]
        }, (origin, plr) => {
            const player = origin.sourceEntity;
            if (!(player instanceof Player)) return;
            const r = transferHost(player, plr.name);
            player.sendMessage(r.message)
        })
    } catch (e) {
        console.warn(e);
    }
})