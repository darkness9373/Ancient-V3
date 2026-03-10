import { system, world } from "@minecraft/server";

const INVENITEM = 'as:inventory_item'
const INVENENTITY = 'as:inventory'

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const equip = player.getComponent('equippable');
        const item = equip.getEquipment('MainHand');
        if (!item) continue;
        if (item.typeId === INVENITEM) {
            if (!player.hasTag('extra_inventory_active')) {
                player.addTag('extra_inventory_active');
                const entity = player.dimension.spawnEntity(INVENENTITY, player.location);
                entity.addTag(`owner:${player.name}`);
                entity.addEffect('invisibility', 999999, {
                    showParticles: false
                })
            }
            const entities = player.dimension.getEntities({
                type: INVENENTITY,
                tags: [`owner:${player.name}`]
            })
            for (const e of entities) {
                const view = player.getViewDirection();
                const pos = {
                    x: player.location.x + view.x * 1.3,
                    y: player.location.y + 1.2,
                    z: player.location.z + view.z * 1.3
                }
                e.tryTeleport(pos, {
                    dimension: player.dimension
                })
            }
        } else {
            if (player.hasTag('extra_inventory_active')) {
                player.removeTag('extra_inventory_active');
                const entities = player.dimension.getEntities({
                    type: INVENENTITY,
                    tags: [`owner:${player.name}`]
                })
                for (const e of entities) {
                    e.remove();
                }
            }
        }
    }
}, 5)