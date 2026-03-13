import { Player, system, world } from "@minecraft/server";
import { LOBBY } from "../config/lobby";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:lobby',
        description: 'Teleport to lobby',
        permissionLevel: 0,
        cheatsRequired: false
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        player.tryTeleport(LOBBY.pos, {
            dimension: world.getDimension(LOBBY.dimension)
        })
        player.sendMessage('§a[!] Teleported to lobby')
    })
})