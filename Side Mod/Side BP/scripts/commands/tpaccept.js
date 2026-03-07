import { system, Player, CommandPermissionLevel } from "@minecraft/server";
import { acceptTPA, getIncomingTPA, teleportSender } from "../core/tpaManager";
import { ActionFormData } from "@minecraft/server-ui";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:tpaccept',
        description: 'Accept a TPA request',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => commandTPAccept(player));
    })
})

/** @param {Player} player */
function commandTPAccept(player) {
    const request = getIncomingTPA(player.name);
    if (request.length === 0) return player.sendMessage('§c[!] You have no request');

    if (request.length === 1) {
        const sender = request[0].sender;
        teleportSender(sender, player)
        acceptTPA(player.name, sender);
        return;
    }
    const form = new ActionFormData()
        .title('TPA Request')
        .body('Select a player you want to accept\n')
    
    for (const req of request) {
        form.button(req.sender)
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const sender = request[r.selection].sender;
        teleportSender(sender, player)
        acceptTPA(player.name, sender);
    })
}