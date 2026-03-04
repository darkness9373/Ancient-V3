import { ISLAND_SLOTS } from "./core/islandManager";
import { getData, setData } from "./core/database";
import { CommandPermissionLevel, CustomCommandParamType, Player, system } from "@minecraft/server";
import { takeIslandAsHost, leaveIsland, transferHost } from "./core/islandManager";
import { world } from "@minecraft/server";
import { getPlayerData, savePlayerData, normalizePlayerState } from "./core/playerManager";

world.afterEvents.playerSpawn.subscribe(event => {
    if (event.initialSpawn) {
        const player = event.player;
        let data = getPlayerData(player.name);
        data = normalizePlayerState(data);
        savePlayerData(player.name, data);
    }
});


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