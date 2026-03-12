import { system, world, Player, CommandPermissionLevel } from '@minecraft/server'
import { ActionFormData } from '@minecraft/server-ui'
import { arena, joinArena } from '../core/arenaManager'

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:arena',
        description: 'Enter the PVP Arena',
        permissionLevel: CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        system.run(() => openArenaForm(player))
    })
})

export function openArenaForm(player) {
    if (arena.player1.name === player.name || arena.player2.name === player.name) {
        player.sendMessage('§e/arena §ctidak dapat digunakan untuk saat ini')
    }
    const form = new ActionFormData()
        .title("§6PvP Arena")
        .body("Pilih aksi yang ingin dilakukan");
    // ARENA KOSONG
    if (arena.state === "idle") {
        form.button("Challenge Player Lain");
        form.show(player).then(res => {
            if (res.canceled) return;
            joinArena(player);
        });
        return;
    }
    // ARENA WAITING (player1 sudah ada)
    if (arena.state === "waiting") {
        const p1 = arena.player1?.name ?? "Unknown";
        form.body(`§a${p1} §rsedang menunggu lawan`);
        form.button(`Lawan §a${p1}`);
        form.button("Batal");
        form.show(player).then(res => {
            if (res.canceled) return;
            if (res.selection === 0) {
                joinArena(player);
            }
        });
        return;
    }
    // ARENA FIGHTING
    if (arena.state === "fighting") {
        const p1 = arena.player1?.name ?? "?";
        const p2 = arena.player2?.name ?? "?";
        form.body(`§f${p1} VS ${p2}`);
        form.button("Tonton Duel");
        form.button("Batal");
        form.show(player).then(res => {
            if (res.canceled) return;
            if (res.selection === 0) {
                joinArena(player); // otomatis spectator
            }
        });
    }
}