import { system, Player, CommandPermissionLevel, world } from '@minecraft/server'
import { getRankActive } from '../core/database'

const warning1 = 500
const warning2 = 100

const flyCache = new Map()

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerEnum('as:fly', [
        'enable', 'disable'
    ])
    data.customCommandRegistry.registerCommand({
        name: 'as:fly',
        description: 'Enable or disable the fly ability',
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
        {
            name: 'as:fly',
            type: CustomCommandParamType.Enum
        }]
    }, (origin, fly) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        const config = getRankActive(player)
        if (!config || !config.command.includes('fly')) return player.sendMessage('§c[!] You do not have permission to use this command')
        if (fly === 'enable') {
            let data = loadFlyData(player, config.flyEnergy)
            if (data.locked) {
                return player.sendMessage('§c[!] Fly energy is used up, wait until it is full again')
            }
            data.enabled = true;
            player.runCommand('ability @s mayfly true')
            player.sendMessage('§c[!] Fly mode is enabled')
        }
        else if (fly === 'disable') {
            let data = loadFlyData(player, config.flyEnergy)
            data.enabled = false;
            player.runCommand('ability @s mayfly false')
            player.sendMessage('§c[!] Fly mode is disabled')
        }
    })
})

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (player.hasTag('admin')) continue;
        const config = getRankActive(player)
        if (!config) continue;
        if (!config.command.includes('fly')) continue;
        let data = loadFlyData(player, config.flyEnergy)
        if (!data) continue;
        const isFlying = player.isFlying
        if (data.enabled && isFlying && !data.locked) {
            data.energy--;
            let display = `§a${data.energy}/${config.flyEnergy}`
            if (data.energy <= 0) {
                data.energy = 0
                data.locked = true
                data.enabled = false
                display = '§4Fly energy is exhausted'
                player.runCommand('ability @s mayfly false')
                player.sendMessage('§c[!] Fly energy is exhausted')
            }
            if (data.energy < warning1 && data.warning === 0) {
                data.warning = 1
                player.sendMessage('§c[!] Fly energy is running low')
                display = `§e${data.energy}/${config.flyEnergy}`
            }
            if (data.energy < warning2 && data.warning === 1) {
                data.warning = 2
                player.sendMessage('§c[!] Fly energy is almost empty')
                display = `§c${data.energy}/${config.flyEnergy}`
            }
        }
        if (!isFlying) {
            if (system.currentTick % 4 === 0) {
                if (data.energy < config.flyEnergy) {
                    data.energy++
                }
                if (data.energy > warning2 && data.warning === 2) {
                    data.warning = 1
                }
                if (data.energy > warning1 && data.warning === 1) {
                    data.warning = 0
                }
                if ((data.energy === config.flyEnergy) && data.locked === true) {
                    data.locked = false
                    player.sendMessage('§a[!] Fly energy is full, use §g/fly enable §ato activate fly mode.')
                }
            }
        }
    }
}, 2)

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        saveFlyData(player)
    }
}, 200)

world.afterEvents.playerLeave.subscribe(data => {
    const playerId = data.playerId;
    const data = flyCache.get(playerId)
    if (!data) return;
    const player = [...world.getPlayers()].find(p => p.id === playerId)
    if (player) {
        player.setDynamicProperty('FlyData', JSON.stringify(data))
    }
    flyCache.delete(playerId)
})

function loadFlyData(player, maxEnergy) {
    if (flyCache.has(player.id)) return flyCache.get(player.id)
    const db = player.getDynamicProperty('FlyData')
    let data
    if (db) {
        try {
            data = JSON.parse(db)
        } catch {
            data = null
        }
    }
    if (!data) {
        data = {
            energy: maxEnergy,
            enabled: false,
            locked: false,
            warning: 0
        }
    }
    flyCache.set(player.id, data)
    return data
}

function saveFlyData(player) {
    const data = flyCache.get(player.id)
    if (!data) return
    player.setDynamicProperty('FlyData', JSON.stringify(data))
}