import { system, Player, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { sendTPA } from "../core/tpaManager";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:tpa',
        description: 'Request teleport to other player',
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => commandTPA(player));
    })
})

/** @param {Player} player */
function commandTPA(player) {
    const online = world.getPlayers().filter(p => p.id !== player.id);
    if (!online.length) return player.sendMessage('§c[!] No player online');
    const players = online.map(p => p.name);
    const form = new ModalFormData();
    form.title('Request Teleport')
    form.dropdown('Select Player', players)
    form.show(player).then(r => {
        if (r.canceled) return;
        const target = world.getPlayers().find(p => p.name === players[r.formValues[0]]);
        if (!target) return player.sendMessage('§c[!] Player not found');
        const result = sendTPA(player.name, target.name);
        if (result.status === 'already_sent') return player.sendMessage('§c[!] You have already sent a request');

        player.sendMessage(`§a[!] You sent a TPA request to §e${target.name}`);
        target.sendMessage(`§a[!] You received a TPA request from §e${player.name}`);
        target.sendMessage(`§a[!] Type §e/tpaaccept §aor §e/tpadeny §ato accept or deny the request`);
    })
}