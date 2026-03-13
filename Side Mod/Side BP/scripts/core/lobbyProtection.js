import { GameMode, system, world } from "@minecraft/server";
import { LOBBY } from "../config/lobby";

function isInLobby(pos) {
    const minX = Math.min(LOBBY.POS1.x, LOBBY.POS2.x)
    const maxX = Math.max(LOBBY.POS1.x, LOBBY.POS2.x)

    const minY = Math.min(LOBBY.POS1.y, LOBBY.POS2.y)
    const maxY = Math.max(LOBBY.POS1.y, LOBBY.POS2.y)

    const minZ = Math.min(LOBBY.POS1.z, LOBBY.POS2.z)
    const maxZ = Math.max(LOBBY.POS1.z, LOBBY.POS2.z)

    return (
        pos.x >= minX && pos.x <= maxX &&
        pos.y >= minY && pos.y <= maxY &&
        pos.z >= minZ && pos.z <= maxZ
    )
}

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (player.hasTag('admin')) continue;
        if (isInLobby(player.location)) {
            if (player.getGameMode() === GameMode.Survival) {
                player.setGameMode(GameMode.Adventure);
                player.sendMessage('§c[!] You are now in adventure mode');
            }
        } else {
            if (player.getGameMode() === GameMode.Adventure) {
                player.setGameMode(GameMode.Survival);
                player.sendMessage('§a[!] You are now in survival mode');
            }
        }
    }
}, 20)