import { world } from "@minecraft/server";
import { getRankDisplay } from "./database";
import { PlayerDatabase } from "../extension/Database";

const code = 'v3-ancient-admin'

world.beforeEvents.chatSend.subscribe(data => {
    const player = data.sender;
    const message = data.message;
    data.cancel = true;
    let display = '[No Rank]'
    const rank = getRankDisplay(player)
    if (rank) {
        if (rank.type === 'exclusive' || rank.type === 'progress') {
            display = rank.config.prefix
        } else if (rank.type === 'custom') {
            display = `${new PlayerDatabase(player, 'RankCustomColor').get() ?? '§f'}[${new PlayerDatabase(player, 'RankCustom').get()}]§r`
        }
    }

    if (player.hasTag('admin')) {
        world.sendMessage(`${display} §r§8>> §r${message}`)
        return;
    }
    world.sendMessage(`${display} §r§8>> §r${message}`)
})