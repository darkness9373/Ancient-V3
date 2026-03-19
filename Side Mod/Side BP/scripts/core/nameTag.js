import { system, world } from "@minecraft/server";
import { getRankDisplay } from "./database";
import { PlayerDatabase } from "../extension/Database";

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const rank = getRankDisplay(player)
        let display = '[No Rank]'
        if (rank) {
            if (rank.type === 'exclusive' || rank.type === 'progress') {
                display = rank.config.prefix
            } else if (rank.type === 'custom') {
                display = `${new PlayerDatabase(player, 'RankCustomColor').get() ?? '§f'}[${new PlayerDatabase(player, 'RankCustom').get()}]§r`
            }
        }
        const hpCom = player.getComponent('minecraft:health')
        const hp = hpCom ? `${hpCom.currentValue}/${hpCom.effectiveMax}` : 'No HP';
        if (player.hasTag('admin')) {
            player.nameTag = `${display} §r${player.name}§r\n§g[Admin]§r ${hp}`
            continue;
        }
        player.nameTag = `${display} §r${player.name}§r\n${hp}`
    }
}, 20)