import { world, system } from "@minecraft/server";
import { getGold, getFishcoin, getDungeoncoin } from "./database";

// ============================================================
//  CURRENCY OBSERVER
//  Deteksi perubahan gold, fishcoin, dungeoncoin tiap player.
//  Jika nilai berubah → tampilkan actionbar + sync scoreboard.
//
//  Cache disimpan in-memory per player ID.
// ============================================================

const cache = new Map(); // key: playerId, value: { gold, fishcoin, dungeoncoin }

// ============================================================
//  CONFIG
// ============================================================

const CURRENCIES = [
    { key: 'gold',        label: 'Gold',        color: '§6', objective: 'gold'        },
    { key: 'fishcoin',    label: 'Fishcoin',    color: '§b', objective: 'fishcoin'    },
    { key: 'dungeoncoin', label: 'Dungeoncoin', color: '§e', objective: 'dungeoncoin' },
];

const GETTERS = {
    gold:        (name) => getGold(name),
    fishcoin:    (name) => getFishcoin(name),
    dungeoncoin: (name) => getDungeoncoin(name),
};

// ============================================================
//  HELPERS
// ============================================================

/**
 * Tampilkan notifikasi actionbar perubahan currency
 * @param {import("@minecraft/server").Player} player
 * @param {number} oldValue
 * @param {number} newValue
 * @param {string} label
 * @param {string} color
 */
function showCurrencyNotif(player, oldValue, newValue, label, color) {
    const diff  = newValue - oldValue;
    const sign  = diff > 0 ? '§a+' : '§c';
    const arrow = diff > 0 ? '▲' : '▼';
    player.onScreenDisplay.setActionBar(
        `${color}${label} ${sign}${diff} ${arrow}§r  ${color}${label}: §f${newValue}`
    );
}

/**
 * Sync nilai ke scoreboard objective
 * @param {import("@minecraft/server").Player} player
 * @param {string} objective
 * @param {number} value
 */
function syncScoreboard(player, objective, value) {
    try {
        player.runCommand(`scoreboard players set @s ${objective} ${value}`);
    } catch (e) {
        // Player tidak valid atau scoreboard belum ada
    }
}

// ============================================================
//  OBSERVER INTERVAL
//  Cek setiap 2 tick (ringan, tidak perlu terlalu sering)
// ============================================================

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (!player.isValid) continue;

        const id   = player.id;
        const name = player.name;
        const prev = cache.get(id) ?? { gold: null, fishcoin: null, dungeoncoin: null };
        const updated = { ...prev };
        let hasNotif = false;

        for (const currency of CURRENCIES) {
            const current = GETTERS[currency.key](name);

            // Inisialisasi cache pertama kali (jangan notif)
            if (prev[currency.key] === null) {
                updated[currency.key] = current;
                // Tetap sync scoreboard saat pertama kali login
                syncScoreboard(player, currency.objective, current);
                continue;
            }

            // Tidak ada perubahan
            if (current === prev[currency.key]) continue;

            // Ada perubahan — notif hanya untuk currency pertama yang berubah
            // (hindari tumpuk actionbar jika beberapa currency berubah sekaligus)
            if (!hasNotif) {
                showCurrencyNotif(player, prev[currency.key], current, currency.label, currency.color);
                hasNotif = true;
            }

            // Selalu sync scoreboard meski tidak menampilkan notif
            syncScoreboard(player, currency.objective, current);
            updated[currency.key] = current;
        }

        cache.set(id, updated);
    }
}, 2);

// ============================================================
//  CLEANUP — Hapus cache saat player keluar
// ============================================================

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    cache.delete(playerId);
});