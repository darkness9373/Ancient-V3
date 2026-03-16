import { Player, system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

let event = null;

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:mkevent',
        description: "Make an event",
        cheatsRequired: false,
        permissionLevel: 1
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => makeEventForm(player))
    })
})

/** @param {Player} player */
function makeEventForm(player) {
    const form = new ModalFormData()
    form.title('Make Event')
    form.textField('Event Name', 'Dungeon raid')
    form.textField('Countdown (in seconds)', '300')
    form.toggle('Teleport when countdown ends', { defaultValue: true })
    form.textField('Teleport Coordinates', '1000 1000 1000')
    form.textField('Tag added to boss bar', 'DungeonRaid')
    form.textField('Dimension', 'overworld, nether, the_end')
    form.show(player).then(r => {
        if (r.canceled) return;
        const eventName = r.formValues[0].trim();
        if (!eventName || eventName.length < 3) return player.sendMessage('§c[!] Event name must be at least 3 characters');
        const countdown = Number(r.formValues[1].trim());
        if (isNaN(countdown) || countdown < 0) return player.sendMessage('§c[!] Countdown must be a positive number');
        const teleport = r.formValues[2];
        let coords = r.formValues[3].trim();
        const tag = r.formValues[4].trim();
        if (!teleport) coords = null;
        let loc = null;
        if (coords) {
            loc = coords.split(' ');
            if (loc.length !== 3) return player.sendMessage('§c[!] Teleport coordinates must be in the format of x y z');
            if (isNaN(Number(loc[0])) || isNaN(Number(loc[1])) || isNaN(Number(loc[2]))) return player.sendMessage('§c[!] Teleport coordinates must be a number');
        }
        coords = loc ? `${loc[0]} ${loc[1]} ${loc[2]}` : null;
        spawnEvent(eventName, countdown, coords, tag, r.formValues[5].trim());
    })
}

function spawnEvent(eventName, countdown, coords, tag, dimension) {
    const dim = [
        world.getDimension('overworld'),
        world.getDimension('the_nether'),
        world.getDimension('the_end')
    ]
    for (const d of dim) {
        const entity = d.spawnEntity('as:event', {
            x: 0,
            y: -64,
            z: 0
        })
        entity.addTag(tag)
        entity.setDynamicProperty(tag, countdown)
        entity.setDynamicProperty('name', eventName)
        entity.setDynamicProperty('coords', coords)
    }
    runEvent(eventName, countdown, coords, tag, dimension);
}

function runEvent(eventName, countdown, coords, tag, dimension) {
    event = system.runInterval(() => {
        const dim = [
            world.getDimension('overworld'),
            world.getDimension('the_nether'),
            world.getDimension('the_end')
        ]
        for (const d of dim) {
            const entities = d.getEntities({
                type: 'as:event',
                tags: [tag]
            })[0]
            const cdMax = countdown;
            const cd = entities.getDynamicProperty(tag);
            entities.setDynamicProperty(tag, cd - 1)
            const health = (cd / cdMax) * 100;
            const hpCom = entities.getComponent('minecraft:health');
            hpCom.setCurrentValue(health);

            const min = Math.floor(cd / 60);
            let sec = cd % 60;
            entities.nameTag = `${eventName} (${min}:${sec.toString().padStart(2, '0')})`;
            if (cd <= 0) {
                system.clearRun(event);
                event = null;
                entities.remove();
                const loc = coords.split(' ');
                if (loc) {
                    for (const p of world.getPlayers()) {
                        p.teleport({
                            x: Number(loc[0]),
                            y: Number(loc[1]),
                            z: Number(loc[2])
                        }, {
                            dimension: world.getDimension(dimension)
                        });
                        p.sendMessage(`§a[!] The ${eventName} event has started`);
                    }
                } else {
                    for (const p of world.getPlayers()) {
                        p.sendMessage(`§a[!] The ${eventName} event has started`);
                    }
                }
            }
        }
    }, 20)
}