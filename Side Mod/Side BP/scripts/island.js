import { ISLAND_SLOTS } from "./core/islandManager";
import { getData, setData } from "./core/database";
import { CommandPermissionLevel, Player, system } from "@minecraft/server";
import { takeIslandAsHost } from "./core/islandManager";

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
})