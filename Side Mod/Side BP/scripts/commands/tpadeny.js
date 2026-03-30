import { CommandPermissionLevel, Player, system, world } from "@minecraft/server";
import { denyTPA, getIncomingTPA } from "../core/tpaManager";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:tpadeny',
        description: 'Deny a TPA request',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
		if (player.hasTag('on_raid')) return player.sendMessage("§c[!] Can't use this command on dungeon raid")
        system.run(() => commandTPDeny(player));
    })
})

function commandTPDeny(player) {
    const request = getIncomingTPA(player.name);
    if (request.length === 0) return player.sendMessage('§c[!] You have no request');
    if (request.length === 1) {
        const sender = request[0].sender;
        TPDeny(player, sender);
        return;
    }

    const form = new ActionFormData()
        .title('Deny TPA Request')
        .body('Select a player you want to deny\n')

    for (const req of request) {
        form.button(req.sender)
    }
    form.show(player).then(r => {
        if (r.canceled) return;
        const sender = request[r.selection].sender;
        TPDeny(player, sender);
    })
}

function TPDeny(receiver, senderName) {
    const sender = world.getPlayers().find(p => p.name === senderMane);
    denyTPA(receiver.name, senderName);
    receiver.sendMessage(`§c[!] Denied TPA request from §e${sender.name}`);
    if (sender) sender.sendMessage(`§c[!] §e${receiver.name} §cdenied your TPA request`);
}