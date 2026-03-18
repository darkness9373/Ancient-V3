import { Player, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:rankdisplay',
        description: 'Change the rank display type',
        permissionLevel: 0,
        cheatsRequired: false
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => {
            rankDisplayForm(player)
        })
    })
})

/** @param {Player} player */
function rankDisplayForm(player) {
    const list = [
        'Exclusive',
        'Progress',
        'Custom'
    ]
    const form = new ModalFormData()
    form.title('Rank Display')
    form.dropdown('Select rank type you want to display', list)
    form.show(player).then(r => {
        if (r.canceled) return;
        const type = list[r.formValues[0]].toLowerCase()
        player.setDynamicProperty('RankDisplay', type)
        player.sendMessage(`Rank display type is set to ${list[r.formValues[0]]}`)
    })
}