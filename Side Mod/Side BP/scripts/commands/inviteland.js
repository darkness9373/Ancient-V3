import { ModalFormData } from "@minecraft/server-ui";
import { invitePlayer } from "../core/islandManager";
import { CommandPermissionLevel, Player, system, world } from "@minecraft/server";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:inviteland',
        description: 'Invite a player to an island',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => inviteForm(player));
    })
})

/** @param {Player} player */
function inviteForm(player) {
    const online = world.getPlayers().filter(p => p.name !== player.name);
    const players = online.map(p => ({ name: p.name }));
    const form = new ModalFormData();
    form.title('Invite Player');
    form.dropdown('Select Player', players)
    form.show(player).then(r => {
        if (r.canceled) return;
        const target = players[r.formValues[0]]
        const result = invitePlayer(player, target);
        player.sendMessage(result.message);
    })
}