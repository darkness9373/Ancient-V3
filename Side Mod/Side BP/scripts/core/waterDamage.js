import { world, system } from "@minecraft/server";

const blockList = [
    "minecraft:water",
    "minecraft:flowing_water"
];

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const block = world.getDimension(player.dimension.id).getBlock(player.location);
        if (!block) continue;
        if (blockList.includes(block.typeId)) {
            player.onScreenDisplay.setActionBar('§cThe water are poisonous');
            player.applyDamage(1, { cause: 'drowning' });
        }
    };
    for (const boat of world.getDimension('overworld').getEntities()) {
		if (boat.typeId.includes('boat')) {
			const block = boat.dimension.getBlock(boat.location) || null;
			if (block) {
				if (block.typeId !== 'minecraft:water' && block.typeId !== 'minecraft:flowing_water') continue;
				const age = boat.getDynamicProperty('age') ?? 0;
				boat.setDynamicProperty('age', age + 1);
				if (age >= 3) boat.remove();
			}
		}
    }
}, 20);