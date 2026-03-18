import { system, world, CommandPermissionLevel, Player } from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui';
import { RANK_CONFIG } from '../config/rank';

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:addrank',
        description: 'Adds a rank to the player',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: false
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => {
            addRankForm(player)
        })
    })
})

function addRankForm(player) {
    const rankList = Object.keys(RANK_CONFIG)
    const form = new ModalFormData()
    form.title('Add Rank')
    form.textField('Player Name', player.name)
    form.dropdown('Rank', rankList)
    form.show(player).then(r => {
        if (r.canceled) return;
        const playerName = r.formValues[0].trim().toLowerCase()
        const rank = rankList[r.formValues[1]]
        if (!playerName) return player.sendMessage('Player name is required');
        const data = {
            name: playerName,
            rank: rank
        }
        let db = world.getDynamicProperty('AddRank')
        try {
            db = JSON.parse(db)
        } catch (e) {
            db = []
        }
        if (db.find(x => x.name === playerName)) return player.sendMessage('Player already exists')
        db.push(data)
        world.setDynamicProperty('AddRank', JSON.stringify(db))
        player.sendMessage(`Added ${playerName} to the rank list`)
    })
}

system.runInterval(() => {
    let db = world.getDynamicProperty('AddRank')
    try {
        db = JSON.parse(db)
    } catch (e) {
        db = []
    }
    if (db.length === 0) return;
    let changed = false;
    for (let i = db.length - 1; i >= 0; i--) {
        const player = world.getPlayers().find(x => x.name.toLowerCase() === db[i].name.toLowerCase())
        if (!player) continue;
        let rankList = player.getDynamicProperty('RankList')
        try {
            rankList = JSON.parse(rankList)
        } catch (e) {
            rankList = []
        }
        if (!Array.isArray(rankList)) rankList = []
        if (rankList.includes(db[i].rank)) {
            db.splice(i, 1)
            changed = true;
            continue;
        }
        rankList.push(db[i].rank)
        player.setDynamicProperty('RankList', JSON.stringify(rankList))
        player.setDynamicProperty('Rank', db[i].rank)
        player.sendMessage(`§g${db[i].rank} §ahas been added to your rank list`)

        const rankData = RANK_CONFIG[db[i].rank]
        if (rankData?.rewards) {
            for (let i = 0; i < rankData.rewards.length; i++) {
                giveItem(player, rankData.rewards[i].item, rankData.rewards[i].amount)
            }
        }

        db.splice(i, 1)
        changed = true;
    }
    if (changed) {
        world.setDynamicProperty('AddRank', JSON.stringify(db))
    }
}, 100)

function giveItem(player, itemId, amount = 1) {
    try {
        player.runCommand(`give ${player.name} ${itemId} ${amount}`)
    } catch (error) {
        player.sendMessage(`§cError: ${error.message}`)
    }
}