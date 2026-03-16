import { Player, system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

let event = null;
let nameEvent = null;

system.beforeEvents.startup.subscribe((data) => {
    data.customCommandRegistry.registerCommand({
        name: "as:mkevent",
        description: "Make an event",
        cheatsRequired: false,
        permissionLevel: 1
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return
        if (event) return player.sendMessage('§c[!] An event is already running');
        system.run(() => openEventForm(player))
    })
    data.customCommandRegistry.registerCommand({
        name: "as:cancelevent",
        description: "Cancel running event",
        cheatsRequired: false,
        permissionLevel: 1
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return
        system.run(() => cancelEvent(player))
    })
})

/** @param {Player} player */
function openEventForm(player) {
    const form = new ModalFormData()
    form.title('Make Event')
    form.textField('Event Name', 'Dungeon Raid')
    form.textField('Countdown (in seconds)', '300', { defaultValue: '300' })
    form.toggle('Teleport when countdown ends', { defaultValue: true })
    form.textField('Teleport Coordinates', '1000 1000 1000', { defaultValue: '1000 1000 1000' })
    form.textField('Dimension', 'overworld, nether, the_end', { defaultValue: 'overworld' })
    form.show(player).then((r) => {
        if (r.canceled) return
        const eventName = r.formValues[0].trim()
        if (!eventName || eventName.length < 3) return player.sendMessage('§c[!] Event name must be at least 3 characters')
        const countdown = Number(r.formValues[1].trim())
        if (isNaN(countdown) || countdown < 0) return player.sendMessage('§c[!] Countdown must be a positive number')
        const teleport = r.formValues[2]
        let coords = r.formValues[3].trim()
        if (!teleport) coords = null;
        let loc = null;
        if (coords) {
            loc = coords.split(' ');
            if (loc.length !== 3) return player.sendMessage('§c[!] Teleport coordinates must be in the format of x y z');
            if (isNaN(Number(loc[0])) || isNaN(Number(loc[1])) || isNaN(Number(loc[2]))) return player.sendMessage('§c[!] Teleport coordinates must be a number');
        }
        coords = loc ? {
            x: Number(loc[0]),
            y: Number(loc[1]),
            z: Number(loc[2])
        } : null;
        const dimension = r.formValues[5].trim()
        runEvent(eventName, countdown, coords, teleport, dimension);
    })
}

function runEvent(eventName, countdown, coords, teleport, dimension) {
    if (event) return player.sendMessage('§c[!] An event is already running');
    let cd = countdown;
    nameEvent = eventName;
    event = system.runInterval(() => {
        const min = Math.floor(cd / 60);
        const sec = cd % 60;
        const time = `${min}:${sec.toString().padStart(2, '0')}`;
        for (const p of world.getPlayers()) {
            p.onScreenDisplay.setActionBar(`§a${eventName} §estarts in ${time}`);
        }
        if (cd <= 0) {
            system.clearRun(event);
            event = null;
            nameEvent = null;
            for (const p of world.getPlayers()) {
                p.sendMessage(`§a[!] The ${eventName} event has started`);
                if (teleport && coords) {
                    p.teleport({
                        x: coords.x,
                        y: coords.y,
                        z: coords.z
                    }, {
                        dimension: world.getDimension(dimension)
                    });
                }
            }
        }
    }, 20)
}

function cancelEvent(player) {
    if (!event) return player.sendMessage('§c[!] No event is running');
    system.clearRun(event);
    event = null;
    for (const p of world.getPlayers()) {
        p.sendMessage(`§c[!] Event ${nameEvent} has been cancelled`);
    }
    player.sendMessage(`§c[!] Event ${nameEvent} has been cancelled`);
}