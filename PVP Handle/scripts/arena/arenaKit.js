import { Player } from "@minecraft/server";

/**
 * 
 * @param {Player} player 
 */
export function giveKit(player) {
    const inv = player.getComponent('minecraft:inventory').container;
    inv.clearAll();

    // Give Kit
    player.runCommand('give @s diamond_sword')
}