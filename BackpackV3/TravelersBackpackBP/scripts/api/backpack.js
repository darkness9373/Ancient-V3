import * as mc from "@minecraft/server";
import * as tools from "../toolsUtils.js";
//Variables
const BackpackTimeouts = {}
const LiquidsAccept = {
    "minecraft:lava_bucket": {
        texture: "lava_liquid",
        soundFill: "bucket.fill_lava",
        soundRemove: "bucket.empty_lava",
        fizzResult: {
            type: "minecraft:water_bucket",
            result: "minecraft:stone"
        }
    },
    "minecraft:water_bucket": {
        texture: "water_liquid",
        soundFill: "bucket.fill_water",
        soundRemove: "bucket.empty_water",
        fizzResult: {
            type: "minecraft:lava_bucket",
            result: "minecraft:obsidian"
        }
    }
}
//Functions
function backpackSave(entity = mc.Entity.prototype) {
    entity.setProperty("travelers_backpack:in_block", false)
    mc.system.runTimeout(() => {
        BackpackTimeouts[entity.id] = false
        const sucess = entity.runCommand(`structure save "traveler_backpack:${entity.getDynamicProperty("travelers_backpack:id")}" ~~~ ~~~ true disk false`)
        entity.remove()
    }, 1)
}
function backpackLoad(player = mc.Entity.prototype, id, location, withEntity = false) {
    const sucess = player.runCommand(`structure load "traveler_backpack:${id}" ${location.x} ${location.y} ${location.z}`)
    if (withEntity) {
        const entity = player.dimension.getEntitiesAtBlockLocation(location).find((ent) => {
            if (ent.typeId == "travelers_backpack:backpack") {
                ent.setProperty("travelers_backpack:in_block", true)
                ent.teleport(location)
                return ent.typeId == "travelers_backpack:backpack"
            }

        })
        //console.warn(entity.nameTag)
        return entity
    }
    return (sucess.successCount == 1)
}
function playerBackpackOpen(player = mc.Player.prototype, equipment = mc.ContainerSlot.prototype) {
    const item = equipment.getItem()
    const BackpackID = item.getLore()[0] ? item.getLore()[0].replace("§7Backpack ID: ", "") : ""
    if (player.getDynamicProperty("travelers_backpack:backpack_active") == undefined && !player.isSneaking) {
        if (BackpackID == "") {
            item.lockMode = mc.ItemLockMode.slot
            const viewDirection = new tools.Vector3(player.getViewDirection()).mul(1.1, 1.1, 1.1)
            const locationStart = new tools.Vector3(0, -0.1, 0).add(player.getHeadLocation()).add(new tools.Vector3(0.1, 0, 0.1).mul(viewDirection))
            const backpack = player.dimension.spawnEntity("travelers_backpack:backpack", locationStart)
            backpack.nameTag = "travelers_backpack:backpack_default"
            backpack.setDynamicProperty("travelers_backpack:id", backpack.id)
            backpack.setDynamicProperty("travelers_backpack:owner", player.id)
            backpack.setDynamicProperty("travelers_backpack:type", item.typeId)
            item.setLore([
                `§7Backpack ID: ${backpack.id}`
            ])
            equipment.setItem(item)
            //console.warn("New Backpack")
            player.setDynamicProperty("travelers_backpack:backpack_active", backpack.id)
        } else {
            item.lockMode = mc.ItemLockMode.slot
            const viewDirection = new tools.Vector3(player.getViewDirection()).mul(1.1, 1.1, 1.1)
            const locationStart = new tools.Vector3(0, -0.1, 0).add(player.getHeadLocation()).add(new tools.Vector3(0.1, 0, 0.1).mul(viewDirection))
            let sucess = backpackLoad(player, BackpackID, locationStart)
            if (sucess) {
                equipment.setItem(item)
                player.setDynamicProperty("travelers_backpack:backpack_active", BackpackID)
            } else {
                item.setLore([])
                equipment.setItem(item)
                player.sendMessage("Backpack not Exist, new Backpack created")
            }
        }
    } else if (player.getDynamicProperty("travelers_backpack:backpack_active")) {
        let backpacks = player.dimension.getEntities({ type: "travelers_backpack:backpack" })
        backpacks.forEach((backpack) => {
            if (backpack.getDynamicProperty("travelers_backpack:id") == player.getDynamicProperty("travelers_backpack:backpack_active")) {
                if (!player.isSneaking) {
                    const viewDirection = new tools.Vector3(player.getViewDirection()).mul(1.1, 1.1, 1.1)
                    const locationStart = new tools.Vector3(0, -0.1, 0).add(player.getHeadLocation()).add(new tools.Vector3(0.1, 0, 0.1).mul(viewDirection))
                    backpack?.teleport(locationStart)
                    backpack.setDynamicProperty("travelers_backpack:type", item.typeId)
                } else {
                    item.lockMode = mc.ItemLockMode.none
                    equipment.setItem(item)
                    player.setDynamicProperty("travelers_backpack:backpack_active", undefined)
                }
            }
        })
    }
}
//Events
//console.warn("[Travelers Backpack API]: Backpack.js Loaded")

mc.system.runInterval(() => {
    const players = mc.world.getAllPlayers()
    players.map(player => {
        const hand = player.getComponent("equippable").getEquipmentSlot("Mainhand");
        const backpacks = player.dimension.getEntities({ type: "travelers_backpack:backpack" })
        const isBackpack = (hand.hasItem() && hand.hasTag("travelers_backpack:is_backpack"))
        backpacks.forEach((backpack) => {
            if ((backpack.getDynamicProperty("travelers_backpack:id") != player.getDynamicProperty("travelers_backpack:backpack_active"))) {
                if (!BackpackTimeouts[backpack.id]) {
                    BackpackTimeouts[backpack.id] = true
                    mc.system.runTimeout(() => {
                        if (backpack.isValid() && backpack.getProperty("travelers_backpack:in_block") == false) {
                            backpackSave(backpack)
                        }
                    }, 1)
                }
            }
        })
        if (isBackpack) {
            playerBackpackOpen(player, hand)
        }
        if ((!isBackpack || (isBackpack && player?.getDynamicProperty("travelers_backpack:backpack_active") != hand?.getLore()[0]?.replace("§7Backpack ID: ", "")))) {
            const slots = Array(8).fill("slot")
            slots.forEach((_, index) => {
                const inventory = player?.getComponent("inventory").container
                const slot = inventory?.getSlot(index)
                const item = slot?.getItem()
                if (slot?.hasItem() && item?.hasTag("travelers_backpack:is_backpack")) {
                    item.lockMode = "none"
                    slot.setItem(item)
                }
            })
            player?.setDynamicProperty("travelers_backpack:backpack_active", undefined)
        }
    })
}, 2)

mc.world.afterEvents.entityHitEntity.subscribe(data => {
    const entity = data.hitEntity
    const player = data.damagingEntity
    if (entity.typeId == "travelers_backpack:backpack" && entity.getProperty("travelers_backpack:in_block")) {
        const itemBlock = new mc.ItemStack(entity.getDynamicProperty("travelers_backpack:type"))
        const location = entity.location
        const dimension = entity.dimension
        itemBlock.setLore([`§7Backpack ID: ${entity.getDynamicProperty("travelers_backpack:id")}`])
        entity.runCommand(`setblock ~~~ air [] destroy`)
        mc.system.runTimeout(() => {
            dimension.spawnItem(itemBlock, location)
        }, 3)
    }
}, { "entityTypes": ["minecraft:player"] })

mc.world.afterEvents.dataDrivenEntityTrigger.subscribe(data => {
    const event = data.eventId
    const entity = data.entity
    if(entity){
        const inventory = entity.getComponent("inventory")?.container
        if (event == "travelers_backpack:backpack_destroy") {
            backpackSave(entity)
        } else if (event == "travelers_backpack:backpack_update") {
            const Tanks = [
                {
                    Inserter: inventory?.getSlot(54),
                    Drawer: inventory?.getSlot(55),
                    Display: inventory?.getSlot(58),
                    Prop: new tools.DynamicProperty(entity, "travelers_backpack:tank_1")
                },
                {
                    Inserter: inventory?.getSlot(56),
                    Drawer: inventory?.getSlot(57),
                    Display: inventory?.getSlot(59),
                    Prop: new tools.DynamicProperty(entity, "travelers_backpack:tank_2")
                }
            ]
            Tanks?.forEach(tank => {
                const tankData = tank.Prop.get() != undefined ? JSON.parse(tank.Prop.get()) : { quantity: 0, type: "" }
                if (tank.Inserter.hasItem() && tank.Inserter.typeId in LiquidsAccept && tankData.quantity < 45) {
                    if ((tankData.type == tank.Inserter.typeId && tankData.quantity > 0) || tankData.quantity == 0) {
                        if (tankData.quantity == 0) {
                            tankData.quantity += 1
                            tankData.type = tank.Inserter.typeId
    
                        } else if (tankData.quantity > 0) {
                            tankData.quantity += 1
                        }
                        entity.runCommand(`playsound ${LiquidsAccept[tank.Inserter.typeId].soundFill} @a ~~~`)
                        tank.Inserter.setItem(new mc.ItemStack("minecraft:bucket"))
                        tank.Prop.set(JSON.stringify(tankData))
                    } else if (tankData.type != tank.Inserter.typeId && tankData.quantity > 0) {
                        const LiquidData = LiquidsAccept[tank.Inserter.typeId]
                        if (tankData.type == LiquidData.fizzResult.type) {
                            if (!tank.Drawer.hasItem() || (tank.Drawer.hasItem() && tank.Drawer.typeId == LiquidData.fizzResult.result)) {
                                const newItem = new mc.ItemStack(LiquidData.fizzResult.result)
                                const amountCurrent = tank.Drawer.hasItem() ? tank.Drawer.amount : 0
                                const amountAdd = tools.InventoryUtils.CalculateAdd(tankData.quantity, amountCurrent, newItem.maxAmount)
                                newItem.amount = amountAdd.final_amount
                                tankData.quantity = amountAdd.remain_amount
                                tank.Drawer.setItem(newItem)
                                tank.Inserter.setItem(new mc.ItemStack("minecraft:bucket"))
                                entity.runCommand(`playsound random.fizz @a ~~~`)
                                tank.Prop.set(JSON.stringify(tankData))
                            }
                        }
    
                    }
                }
                if (tank.Drawer.hasItem() && tank.Drawer.typeId == "minecraft:bucket" && tank.Drawer.amount == 1) {
                    if (tankData.quantity > 0) {
                        tankData.quantity -= 1
                        tank.Drawer.setItem(new mc.ItemStack(tankData.type))
                        entity.runCommand(`playsound ${LiquidsAccept[tank.Drawer.typeId].soundRemove} @a ~~~`)
                        tank.Prop.set(JSON.stringify(tankData))
                    }
    
                }
                if (tankData.type != "") {
                    const DisplayItem = new mc.ItemStack("travelers_backpack:empty_item")
                    DisplayItem.nameTag = `b${(tankData.quantity / 45).toFixed(2)}${LiquidsAccept[tankData.type].texture}`
                    tank.Display.setItem(DisplayItem)
                }
            })
        }
    }
}, { "entityTypes": ["travelers_backpack:backpack"] })

mc.world.afterEvents.entityDie.subscribe(data => {
    mc.world.getEntity(data.deadEntity.getDynamicProperty("travelers_backpack:owner")).setDynamicProperty("travelers_backpack:backpack_active", undefined)
    data.deadEntity.runCommand(`structure delete "traveler_backpack:${data.deadEntity.getDynamicProperty("travelers_backpack:id")}"`)
}, { "entityTypes": ["travelers_backpack:backpack"] })
mc.world.beforeEvents.itemUseOn.subscribe(data=>{
    const item = data.itemStack
    const player = data.source
    if(item.hasTag("travelers_backpack:is_backpack") && item.getLore().length > 0 && !player.isSneaking){
        data.cancel = true
    }else if(item.hasTag("travelers_backpack:is_backpack") && item.getLore().length > 0 && player.isSneaking){
       mc.system.run(()=>{
        player.getComponent("equippable").setEquipment("Mainhand", item)
       })
    }
})
mc.world.afterEvents.playerPlaceBlock.subscribe(data => {
    const player = data.player
    const item = player.getComponent("equippable").getEquipmentSlot("Mainhand")
    const block = data.block
    if (item.hasItem() && item.hasTag("travelers_backpack:is_backpack")) {
        const BackpackID = item.getLore()[0] ? item.getLore()[0].replace("§7Backpack ID: ", "") : ""
        if (BackpackID) {
            const backpackEntity = backpackLoad(player, BackpackID, block.bottomCenter(), true)
            if (backpackEntity) {
                player.sendMessage(`[Backpack: ${BackpackID}]: loaded`)
                item.setItem()
            }
        }
    }
})
