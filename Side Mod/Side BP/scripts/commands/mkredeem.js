import { Player, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:mkredeem',
        description: 'Make a redeem code',
        permissionLevel: 1,
        cheatsRequired: false
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => {
            makeRedeemCode(player)
        })
    })
})

function makeRedeemCode(player) {
    const form = new ModalFormData()
    form.title('Make Redeem Code')
    form.textField('Code', 'atminhytam')
}