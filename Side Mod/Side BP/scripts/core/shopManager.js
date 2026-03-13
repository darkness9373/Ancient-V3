import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";


export function goldShop(player) {
    const form = new ActionFormData()
    form.title('Shop UI')
    form.body('')
    form.button('Buy Item')
    form.button('Sell Item')
    form.show(player).then(r => {
        if (r.canceled) return;
        if (r.selection === 0) {
            //Buy
        } else {
            //Sell
        }
    })
}