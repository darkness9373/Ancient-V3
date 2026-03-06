import { world, system } from "@minecraft/server";

const blockList = [
    "minecraft:water",
    "minecraft:flowing_water"
];

system.runInterval(() => {
    world.getPlayers().forEach(player => {
        const block = world.getDimension(player.dimension.id).getBlock(player.location);
        if (!block) return;
        if (blockList.includes(block.typeId)) {
            player.applyDamage(1, { cause: 'drowning' });
            player.onScreenDisplay.setActionBar('§cThe water are poisonous');
        }
    });
    world.getDimension('overworld').getEntities({ type: 'minecraft:boat' }).forEach(boat => {
        const age = boat.getDynamicProperty('age') ?? 0;
        boat.setDynamicProperty('age', age + 1);
        if (age >= 3) boat.remove();
    });
}, 20);