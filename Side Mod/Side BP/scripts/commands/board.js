import { CommandPermissionLevel, CustomCommandParamType, Player, system, world } from "@minecraft/server";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerEnum('as:Board', [
        'enable', 'disable'
    ])
    data.customCommandRegistry.registerCommand({
        name: 'as:board',
        description: 'Enable or disable the scoreboard',
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
            {
                name: 'as:Board',
                type: CustomCommandParamType.Enum
            }
        ]
    }, (origin, board) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        if (board === 'enable') {
            player.setDynamicProperty('showBoard', true);
            player.sendMessage('§a[!] Scoreboard enabled');
        }
        else if (board === 'disable') {
            player.setDynamicProperty('showBoard', false);
            player.sendMessage('§c[!] Scoreboard disabled');
			system.run(() => player.onScreenDisplay.setTitle(''))
        }
    })
})