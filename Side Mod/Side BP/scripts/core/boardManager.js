import { system, world } from "@minecraft/server"
import Score from "../extension/Score"
import { board } from "../config/board"

function getPlaceholder(text, data) {
    for (const item of data) {
        for (const key in item) {
            const holder = new RegExp('@' + key, 'g')
            text = text.replace(holder, item[key])
        }
    }
    return text
}

system.runInterval(() => {
    const online = world.getPlayers().length
    
    for (const player of world.getPlayers()) {
        const ping = Score.get(player, 'ping') ?? 0
        const pingShow = ping >= 100 ? '§e' + ping + 'ms' : '§a' + ping + 'ms'
        const data = [{
            NAME: player.name,
            PING: pingShow,
            ONLINE: online,
            DEATH: Score.get(player, 'death') ?? 0,
            BLANK: ' ',
            BREAK: makeLine('—', 15)
        }]
        player.onScreenDisplay.setTitle(
            getPlaceholder(board.Line.join('\n'), data)
        )
    }
}, 20)