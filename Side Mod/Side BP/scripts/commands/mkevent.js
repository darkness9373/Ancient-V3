import { system, Player, CommandPermissionLevel, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:mkevent',
        description: 'Create a new event',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: false
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => openEventForm(player))
    })
})

let activeEvent = null;

/** @param {Player} player */
function openEventForm(player) {
    const dim = ['overworld', 'nether', 'the_end'];
    const form = new ModalFormData()
    form.title('Create Event')
    form.textField('Text Boss Bar', 'Dungeon started in :')
    form.textField('Duration (seconds)', '600')
    form.textField('Teleport X', '0')
    form.textField('Teleport Y', '0')
    form.textField('Teleport Z', '0')
    form.toggle('Teleport when event starts', true)
    form.dropdown('Dimension')
    form.show(player).then(r => {
        if (r.canceled) return;
        const text = r.formValues[0];
        const duration = Number(r.formValues[1]);
        const x = Number(r.formValues[2]);
        const y = Number(r.formValues[3]);
        const z = Number(r.formValues[4]);
        const teleport = r.formValues[5];
        const dimension = dim[r.formValues[6]];
        startEvent(player, text, duration, { x, y, z }, teleport, dimension);
    })
}

function startEvent(text, duration, tpPos, teleport, dimension) {
    const bossOverworld = world.getDimension('overworld').spawnEntity('as:event', { x: 0, y: 0, z: 0 });
    const bossNether = world.getDimension('nether').spawnEntity('as:event', { x: 0, y: 0, z: 0 });
    const bossEnd = world.getDimension('the_end').spawnEntity('as:event', { x: 0, y: 0, z: 0 });
    activeEvent = {
        time: duration,
        maxTime: duration,
        text: text,
        tpPos: tpPos,
        teleport: teleport,
        boss: {
            overworld: bossOverworld.getComponent('minecraft:health'),
            nether: bossNether,
            end: bossEnd
        },
        dimension: dimension
    }
    system.runInterval(eventTick, 20)
}

function eventTick() {
    if (!activeEvent) return;
    activeEvent.time--;
    const bossOverworld = activeEvent.boss.overworld;
    const bossNether = activeEvent.boss.nether;
    const bossEnd = activeEvent.boss.end;
    if (!bossOverworld || !bossNether || !bossEnd) return;
    const hpOverworld = bossOverworld.getComponent('minecraft:health');
    const hpNether = bossNether.getComponent('minecraft:health');
    const hpEnd = bossEnd.getComponent('minecraft:health');
    const percent = (activeEvent.time / activeEvent.maxTime) * 100;
    hpOverworld.setCurrentValue(percent);
    hpNether.setCurrentValue(percent);
    hpEnd.setCurrentValue(percent);
    const minutes = Math.floor(activeEvent.time / 60);
    const seconds = activeEvent.time % 60;
    const timeText = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    bossOverworld.nameTag = `${activeEvent.text} ${timeText}`;
    bossNether.nameTag = `${activeEvent.text} ${timeText}`;
    bossEnd.nameTag = `${activeEvent.text} ${timeText}`;
    if (activeEvent.time <= 0) {
        finishEvent();
    }
}

function finishEvent() {
    if (!activeEvent) return;
    if (activeEvent.teleport) {
        for (const player of world.getPlayers()) {
            player.teleport(activeEvent.tpPos, {
                dimension: world.getDimension(activeEvent.dimension)
            });
        }
    }
    activeEvent.boss = null;
    world.sendMessage(`§a[!] Event started!`);
    activeEvent = null;
}