


/*

NAME: player.name,
PING: ping >= 100 ? '§e' + ping + 'ms' : '§a' + ping + 'ms',
ONLINE: world.getPlayers().length,
DEATH: Score.get(player, 'death') ?? 0,
BLANK: ' ',
BREAK: makeLine('—', 15),
MONEY: Score.get(player, 'money') ?? 0,
FISHCOIN: Score.get(player, 'fishcoin') ?? 0,
DUNGEONCOIN: Score.get(player, 'dungeoncoin') ?? 0,
GOLD: Score.get(player, 'gold') ?? 0,
GACHA: Score.get(player, 'gacha') ?? 0,
LOGIN: Score.get(player, 'login') ?? 0

*/
export const board = {
    Line: [
        '   §l§aAncient Survival§r',
        '',
        '§l§g@NAME§r',
        '§l§bRank: §r@RANK',
        '§l§bGold: §r@GOLD',
        '§l§bFishCoin: §r@FISHCOIN',
        '§l§bDungeonCoin: §r@DUNGEONCOIN',
        '§l§bPing: §r@PING',
        '§l§bTotal Gacha: §r@GACHA',
        '',
        '§l§bDaily Login: §r@LOGIN',
        '§l§bOnline: §r@ONLINE Players'
    ]
}