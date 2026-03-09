import { Player, system, world } from "@minecraft/server";
import Score from "../extension/Score";
import { board } from "../config/board";

function getPlaceholder(text, data) {
    for (const item of data) {
        for (const key in item) {
            const holder = new RegExp('@' + key, 'g');
            text = text.replace(holder, item[key]);
        }
    }
    return text;
};

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const getBoard = player.getDynamicProperty('showBoard') ?? true;
        if (!getBoard) continue;
        player.onScreenDisplay.setTitle(
            getPlaceholder(board.Line.join('\n'), data(player))
        );
    };
}, 20);

function makeLine(text, length) {
    let line = '';
    for (let i = 0; i < length; i++) {
        line += text;
    }
    return line;
};

/**
 * 
 * @param {Player} player 
 * @returns 
 */
const data = (player) => {
    const ping = Score.get(player, 'ping') ?? 0;
    return [{
        NAME: player.name,
        PING: ping >= 100 ? '§e' + ping + 'ms' : '§a' + ping + 'ms',
        ONLINE: world.getPlayers().length,
        DEATH: Score.get(player, 'death') ?? 0,
        BLANK: ' ',
        BREAK: makeLine('—', 15),
        MONEY: Score.get(player, 'money') ?? 0,
        FISHCOIN: Score.get(player, 'fishcoin') ?? 0,
        DUNGEONCOIN: Score.get(player, 'dungeoncoin') ?? 0,
        GOLD: Score.get(player, 'gold') ?? 0
    }];
};