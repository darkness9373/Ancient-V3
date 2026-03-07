import { CommandPermissionLevel, Player, system, world } from "@minecraft/server";
import { cancelTPA } from "../core/tpaManager";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:tpacancel',
        description: 'Cancel a TPA request',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => commandTPCancel(player));
    })
})

function TPCancel(sender, targetName) {
    cancelTPA(sender.name, targetName);
    sender.sendMessage(`§c[!] Canceled TPA request to §e${targetName}`);
    const target = world.getPlayers().find(p => p.name === targetName);
    if (target) target.sendMessage(`§c[!] §e${sender.name} §ccanceled TPA request`);
}

/** @param {Player} player */
function commandTPCancel(player) {
    const request = getIncomingTPA(player.name);
    if (request.length === 0) return player.sendMessage('§c[!] You have no request');
    if (request.length === 1) {
        const sender = request[0].sender;
        TPCancel(player, sender);
        return;
    }

    const form = new ActionFormData()
        .title('Cancel TPA Request')
        .body('Select a player you want to cancel\n')

    for (const req of request) {
        form.button(req.sender)
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const sender = request[r.selection].sender;
        TPCancel(player, sender);
    })
}