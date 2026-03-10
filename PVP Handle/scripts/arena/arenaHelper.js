import { Player, system, world } from "@minecraft/server";
import { ARENA, COUNTDOWN } from "./arenaConfig";

/**
 * 
 * @param {Player} player 
 * @param {any} pos 
 */
export function tpArena(player, pos) {
    const dim = world.getDimension(ARENA.dimendion)
    player.tryTeleport(pos, {
        dimension: dim
    })
}

export function startCountdown(callback) {
    for (let i = COUNTDOWN; i > 0; i--) {
        system.runTimeout(() => {
            for (const player of world.getPlayers()) {
                if (player.hasTag('on_arena')) {
                    player.sendMessage(`§a[!] The Duel is starting in ${i} seconds!`);
                }
            }
        }, (COUNTDOWN - i) * 20);
    }
    system.runTimeout(() => {
        for (const player of world.getPlayers()) {
            if (player.hasTag('on_arena')) {
                player.sendMessage('§c[!] The Duel has started!');
                callback();
            }
        }
    }, COUNTDOWN * 20);
}