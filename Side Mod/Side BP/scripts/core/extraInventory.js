import { system, world } from '@minecraft/server'

const ENTITY = 'as:inventory'
const ITEM = 'as:inventory_item'

function findInventory(player) {
    const tag = `owner:${player.id}`
    const dims = [
        world.getDimension('overworld'),
        world.getDimension('nether'),
        world.getDimension('the_end')
    ]
    for (const dim of dims) {
        const entity = dim.getEntities({
            type: ENTITY,
            tags: [tag]
        })[0]
        if (entity) return entity
    }
    return null
}


/* spawn sekali saja */
world.afterEvents.playerSpawn.subscribe(ev => {
    if (!ev.initialSpawn) return
    const player = ev.player
    let entity = findInventory(player)
    if (!entity) {
        entity = player.dimension.spawnEntity(
            ENTITY,
            player.location
        )
        entity.addTag(`owner:${player.id}`)
        const tameable = entity.getComponent('minecraft:tameable')
        if (tameable) tameable.tame(player)
    }
})

/* loop utama */
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const equip = player.getComponent('minecraft:equippable')
        if (!equip) continue
        const mainhand = equip.getEquipment('Mainhand')
        const entity = findInventory(player)
        if (!entity) continue
        if (mainhand && mainhand.typeId === ITEM) {
            const view = player.getViewDirection()
            entity.tryTeleport({
                x: player.location.x + view.x,
                y: player.location.y + 1.2,
                z: player.location.z + view.z
            }, {
                dimension: player.dimension
            })
        } else {
            entity.tryTeleport({
                x: player.location.x,
                y: -64,
                z: player.location.z
            }, {
                dimension: player.dimension
            })
        }
    }
}, 5)