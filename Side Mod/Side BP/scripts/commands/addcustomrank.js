import { system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:addcustomrank',
        description: 'Add a custom rank',
        permissionLevel: 1,
        cheatsRequired: false
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => {
            addCustomRankForm(player)
        })
    })
})

/** @param {Player} player */
function addCustomRankForm(player) {
    const form = new ModalFormData()
    form.title('Add Custom Rank')
    form.textField('Player Name', player.name)
    form.textField('Rank Name', 'Custom')
    form.show(player).then(r => {
        if (r.canceled) return;
        const playerName = r.formValues[0].trim().toLowerCase()
        const rankName = r.formValues[1].trim()
        if (!playerName) return player.sendMessage('Player name is required');
        if (!rankName) return player.sendMessage('Rank name is required');
        const data = {
            name: playerName,
            rank: rankName
        }
        let db = world.getDynamicProperty('AddCustomRank')
        try {
            db = JSON.parse(db)
        } catch (e) {
            db = []
        }
        if (db.find(x => x.name === playerName)) return player.sendMessage('Player already exists')
        db.push(data)
        world.setDynamicProperty('AddCustomRank', JSON.stringify(db))
        player.sendMessage(`Added ${playerName} to the rank list`)
    })
}

system.runInterval(() => {
    let db = world.getDynamicProperty('AddCustomRank')
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
        player.setDynamicProperty('RankCustom', db[i].rank)
        player.sendMessage(`§g${db[i].rank} §ahas been added to your custom rank`)
        db.splice(i, 1)
        changed = true;
    }
    if (changed) {
        world.setDynamicProperty('AddCustomRank', JSON.stringify(db))
    }
}, 100)