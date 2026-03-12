import { CommandPermissionLevel, CustomCommandParamType, Player, system, world } from "@minecraft/server";
import Tag from './extension/Tag'
import './commands/_load'
import './core/arenaManager'

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerEnum('as:pvp',
        ['enable', 'disable']
    )
    data.customCommandRegistry.registerCommand({
        name: 'as:pvp',
        description: 'Enables/Disables PVP',
        permissionLevel: CommandPermissionLevel.Any,
        optionalParameters: [
            {
                name: 'as:pvp',
                type: CustomCommandParamType.Enum
            }
        ],
        cheatsRequired: false
    }, (origin, pvp) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        if (player.hasTag('on_arena_pvp')) return player.sendMessage('§c[!] You cannot use this command in the arena!')
        if (pvp === 'enable') {
            if (player.hasTag('pvp_enabled')) {
                player.sendMessage('§c[!] You are already in PVP mode!');
                return;
            } else {
                Tag.add(player, 'pvp_enabled');
                player.sendMessage('§a[!] You are now in PVP mode!');
                return;
            }
        } else if (pvp === 'disable') {
            if (!player.hasTag('pvp_enabled')) {
                player.sendMessage('§c[!] You are not in PVP mode!');
                return;
            } else {
                Tag.remove(player, 'pvp_enabled');
                player.sendMessage('§a[!] You are no longer in PVP mode!');
                return;
            }
        }
    })
})

world.beforeEvents.entityHurt.subscribe(data => {
    const attacker = data.damageSource.damagingEntity;
    const victim = data.hurtEntity;
    if (!(attacker instanceof Player)) return;
    if (!(victim instanceof Player)) return;
    if (!attacker.hasTag('pvp_enabled')) return data.cancel = true;
    if (!victim.hasTag('pvp_enabled')) return data.cancel = true;
})