import { Player, system, world } from "@minecraft/server";
import Score from "../extension/Score";
import { board } from "../config/board";
import { getRankDisplay } from "./database";
import { PlayerDatabase } from "../extension/Database";

const boardTemplate = board.Line.join('\n')
const regexCache = new Map()

function getPlaceholder(text, data) {
    for (const item of data) {
        for (const key in item) {
            if (!regexCache.has(key)) {
                regexCache.set(key, new RegExp('@' + key, 'g'))
            }
            text = text.replace(regexCache.get(key), item[key]);
        }
    }
    return text;
};

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const getBoard = player.getDynamicProperty('showBoard') ?? true;
        if (!getBoard) continue;
        player.onScreenDisplay.setTitle(
            getPlaceholder(boardTemplate, data(player))
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
    const ping = Score.get(player, 'ping') ?? 0
    const rank = getRankDisplay(player)
    let rankDisplay = 'No Rank'
    if (rank) {
        if (rank.type === 'exclusive' || rank.type === 'progress') {
            rankDisplay = rank.config.show
        }
        else if (rank.type === 'custom') {
            rankDisplay = `${new PlayerDatabase(player, 'RankCustomColor').get() ?? '§f'}${new PlayerDatabase(player, 'RankCustom').get()}§r`
        }
    }
    return [{
        NAME: player.name,
        PING: ping >= 100 ? '§e' + ping + 'ms' : '§a' + ping + 'ms',
        ONLINE: world.getPlayers().length,
        BLANK: ' ',
        BREAK: makeLine('—', 15),
        FISHCOIN: Score.get(player, 'fishcoin') ?? 0,
        DUNGEONCOIN: Score.get(player, 'dungeoncoin') ?? 0,
        GOLD: Score.get(player, 'gold') ?? 0,
        GACHA: Score.get(player, 'gacha') ?? 0,
        LOGIN: Score.get(player, 'login') ?? 0,
        RANK: rankDisplay
    }];
};