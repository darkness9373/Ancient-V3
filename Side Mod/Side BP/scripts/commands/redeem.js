import * as mc from '@minecraft/server';
import { ModalFormData, ActionFormData } from '@minecraft/server-ui';
import { setRedeemData, getRedeemData, deleteRedeemCode, redeemCode, getAllRedeemCodes } from '../core/redeemManager';

mc.system.beforeEvents.startup.subscribe(data => {

    // ============================================================
    //  /as:mkredeem
    //  Admin buat redeem code baru — multi-step form
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:mkredeem',
        description: 'Create a new redeem code',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        mc.system.run(() => openRedeemMainForm(player));
    });

    // ============================================================
    //  /as:redeem <code>
    //  Player gunakan redeem code
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:redeem',
        description: 'Redeem a code for rewards',
        permissionLevel: mc.CommandPermissionLevel.Any,
        mandatoryParameters: [
            { name: 'code', type: mc.CustomCommandParamType.String }
        ]
    }, (origin, code) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        const result = redeemCode(player, code);
        player.sendMessage(result.message);
    });

    // ============================================================
    //  /as:redeeminfo
    //  Admin lihat detail redeem code — pilih via ActionFormData
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:redeeminfo',
        description: 'View redeem code info',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        mc.system.run(() => openRedeemInfoPicker(player));
    });

    // ============================================================
    //  /as:deleteredeem
    //  Admin hapus redeem code — pilih via ActionFormData
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:deleteredeem',
        description: 'Delete a redeem code',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        mc.system.run(() => openDeleteRedeemPicker(player));
    });

    // ============================================================
    //  /as:redeemlist
    //  Admin lihat semua redeem code yang ada
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:redeemlist',
        description: 'View all redeem codes',
        permissionLevel: mc.CommandPermissionLevel.GameDirectors
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;

        const codes = getAllRedeemCodes();
        if (codes.length === 0) return player.sendMessage('§c[!] No redeem codes found');

        const now = Date.now();
        let msg = `§e[Redeem Codes] §7Total: §f${codes.length}\n`;
        for (const code of codes) {
            const d = getRedeemData(code);
            if (!d) continue;
            const usageStr = d.limit > 0 ? `${d.usedBy.length}/${d.limit}` : `${d.usedBy.length}/∞`;
            const expiredStr = d.expiredAt
                ? (now > d.expiredAt ? '§cExpired§r' : `§a${Math.ceil((d.expiredAt - now) / 3600000)}h§r`)
                : '§7∞§r';
            msg += `§7- §e${d.code} §7| Used: §f${usageStr} §7| Exp: ${expiredStr}\n`;
        }

        player.sendMessage(msg.trim());
    });

});

// ============================================================
//  FORM STEP 1 — Info utama redeem code
// ============================================================
function openRedeemMainForm(player) {
    new ModalFormData()
        .title('§l§eCreate Redeem Code')
        .textField(
            '§fRedeem Code\n§7Kode yang akan digunakan player',
            'e.g. SERVERLAUNCH2025',
            { defaultValue: '' }
        )
        .textField(
            '§fJumlah Jenis Hadiah (Item)\n§7Berapa jenis item yang diberikan (0 jika tidak ada)',
            'e.g. 2',
            { defaultValue: '0' }
        )
        .textField(
            '§fLimit Penggunaan\n§7Maks berapa kali bisa digunakan (0 = unlimited)',
            'e.g. 100',
            { defaultValue: '0' }
        )
        .textField(
            '§fBatas Waktu (Jam)\n§7Berapa jam kode ini berlaku (0 = tidak ada batas)',
            'e.g. 24',
            { defaultValue: '0' }
        )
        .textField(
            '§fGold\n§7Jumlah gold yang diberikan (0 = tidak ada)',
            'e.g. 500',
            { defaultValue: '0' }
        )
        .textField(
            '§fFishcoin\n§7Jumlah fishcoin yang diberikan (0 = tidak ada)',
            'e.g. 100',
            { defaultValue: '0' }
        )
        .textField(
            '§fDungeoncoin\n§7Jumlah dungeoncoin yang diberikan (0 = tidak ada)',
            'e.g. 50',
            { defaultValue: '0' }
        )
        .submitButton('§a§lNext →')
        .show(player)
        .then(response => {
            if (response.canceled) return;

            const [code, itemCountStr, limitStr, hoursStr, goldStr, fishcoinStr, dungeoncoinStr] = response.formValues;

            // Validasi code
            const trimmedCode = code.trim();
            if (!trimmedCode) return player.sendMessage('§c[!] Redeem code cannot be empty');

            // Cek duplikat
            if (getRedeemData(trimmedCode)) {
                return player.sendMessage(`§c[!] Redeem code "§e${trimmedCode}§c" already exists`);
            }

            // Parse values
            const itemCount   = Math.max(0, parseInt(itemCountStr) || 0);
            const limit       = Math.max(0, parseInt(limitStr) || 0);
            const hours       = Math.max(0, parseInt(hoursStr) || 0);
            const gold        = Math.max(0, parseInt(goldStr) || 0);
            const fishcoin    = Math.max(0, parseInt(fishcoinStr) || 0);
            const dungeoncoin = Math.max(0, parseInt(dungeoncoinStr) || 0);

            // Hitung expiredAt
            const expiredAt = hours > 0 ? Date.now() + (hours * 60 * 60 * 1000) : null;

            // Buat draft redeem data
            const draft = {
                code: trimmedCode,
                limit,
                usedBy: [],
                expiredAt,
                rewards: {
                    gold,
                    fishcoin,
                    dungeoncoin,
                    items: []
                }
            };

            // Jika tidak ada item, langsung simpan
            if (itemCount === 0) {
                setRedeemData(trimmedCode, draft);
                return player.sendMessage(
                    `§a[!] Redeem code §e${trimmedCode} §acreated!\n` +
                    `§7Limit: §f${limit > 0 ? limit : '∞'} §7| Expired: §f${hours > 0 ? `${hours}h` : 'Never'}\n` +
                    `§7Gold: §f${gold} §7| Fishcoin: §f${fishcoin} §7| Dungeoncoin: §f${dungeoncoin}`
                );
            }

            // Ada item — buka form item step by step
            openItemForm(player, draft, 1, itemCount);
        });
}

// ============================================================
//  HELPER
// ============================================================

/**
 * Normalize item ID — tambahkan "minecraft:" jika tidak ada namespace
 * @param {string} id
 * @returns {string}
 */
function normalizeItemId(id) {
    const trimmed = id.trim();
    return trimmed.includes(':') ? trimmed : `minecraft:${trimmed}`;
}

// ============================================================
//  FORM STEP 2+ — Input item satu per satu
// ============================================================

/**
 * Form input item ke-n
 * @param {mc.Player} player
 * @param {object} draft - draft redeem data
 * @param {number} currentItem - item ke berapa sekarang (1-based)
 * @param {number} totalItems - total item yang harus diisi
 */
function openItemForm(player, draft, currentItem, totalItems) {
    new ModalFormData()
        .title(`§l§eItem Reward ${currentItem}/${totalItems}`)
        .textField(
            `§fItem ID §7(Item ke-${currentItem})\n§7Tanpa namespace = minecraft: (diamond → minecraft:diamond)`,
            'e.g. diamond atau minecraft:diamond',
            { defaultValue: '' }
        )
        .textField(
            `§fJumlah §7(Item ke-${currentItem})`,
            'e.g. 10',
            { defaultValue: '1' }
        )
        .submitButton(currentItem < totalItems ? '§a§lNext Item →' : '§a§lFinish ✔')
        .show(player)
        .then(response => {
            if (response.canceled) return;

            const [typeId, amountStr] = response.formValues;

            // Validasi item ID
            const trimmedId = typeId.trim();
            if (!trimmedId) {
                player.sendMessage(`§c[!] Item ID cannot be empty. Please re-open §e/as:mkredeem §cto try again.`);
                return;
            }

            // Normalize: tambah "minecraft:" jika tidak ada namespace
            const normalizedId = normalizeItemId(trimmedId);

            // Validasi jumlah
            const amount = Math.max(1, parseInt(amountStr) || 1);

            // Tambahkan item ke draft
            draft.rewards.items.push({ typeId: normalizedId, amount });

            // Lanjut ke item berikutnya atau selesai
            if (currentItem < totalItems) {
                openItemForm(player, draft, currentItem + 1, totalItems);
            } else {
                // Semua item sudah diisi — simpan
                setRedeemData(draft.code, draft);

                const itemList = draft.rewards.items
                    .map((i, idx) => `§7  ${idx + 1}. §f${i.typeId} §7x§f${i.amount}`)
                    .join('\n');

                player.sendMessage(
                    `§a[!] Redeem code §e${draft.code} §acreated!\n` +
                    `§7Limit: §f${draft.limit > 0 ? draft.limit : '∞'} §7| Expired: §f${draft.expiredAt ? `${Math.round((draft.expiredAt - Date.now()) / 3600000)}h` : 'Never'}\n` +
                    `§7Gold: §f${draft.rewards.gold} §7| Fishcoin: §f${draft.rewards.fishcoin} §7| Dungeoncoin: §f${draft.rewards.dungeoncoin}\n` +
                    `§7Items:\n${itemList}`
                );
            }
        });
}

// ============================================================
//  ACTION FORM — REDEEMINFO PICKER
// ============================================================

/**
 * Tampilkan list semua kode, pilih untuk lihat detail
 * @param {mc.Player} player
 */
function openRedeemInfoPicker(player) {
    const codes = getAllRedeemCodes();
    if (codes.length === 0) return player.sendMessage('§c[!] No redeem codes found');

    const now = Date.now();
    const form = new ActionFormData()
        .title('§l§eRedeem Info')
        .body('§7Pilih kode untuk melihat detail:');

    for (const code of codes) {
        const d = getRedeemData(code);
        if (!d) continue;
        const usageStr = d.limit > 0 ? `${d.usedBy.length}/${d.limit}` : `${d.usedBy.length}/∞`;
        const expiredStr = d.expiredAt
            ? (now > d.expiredAt ? '§cExpired' : `§a${Math.ceil((d.expiredAt - now) / 3600000)}h`)
            : '§7∞';
        form.button(`§e${d.code}\n§7Used: §f${usageStr} §7| Exp: ${expiredStr}`);
    }

    form.show(player).then(response => {
        if (response.canceled) return;

        const code = codes[response.selection];
        const d = getRedeemData(code);
        if (!d) return player.sendMessage('§c[!] Redeem code not found');

        const now2 = Date.now();
        const expired = d.expiredAt
            ? (now2 > d.expiredAt ? '§cExpired' : `§a${Math.ceil((d.expiredAt - now2) / 3600000)}h remaining`)
            : '§7No limit';
        const limit = d.limit > 0 ? `§f${d.usedBy.length}§7/§f${d.limit}` : `§f${d.usedBy.length}§7/§f∞`;
        const items = d.rewards.items.length > 0
            ? '\n' + d.rewards.items.map(i => `§7  - §f${i.typeId} §7x§f${i.amount}`).join('\n')
            : '§7None';

        player.sendMessage(
            `§e[Redeem: ${d.code}]\n` +
            `§7Usage      : ${limit}\n` +
            `§7Expired    : ${expired}\n` +
            `§7Gold       : §f${d.rewards.gold}\n` +
            `§7Fishcoin   : §f${d.rewards.fishcoin}\n` +
            `§7Dungeoncoin: §f${d.rewards.dungeoncoin}\n` +
            `§7Items      : ${items}`
        );
    });
}

// ============================================================
//  ACTION FORM — DELETEREDEEM PICKER
// ============================================================

/**
 * Tampilkan list semua kode, pilih untuk dihapus lalu konfirmasi
 * @param {mc.Player} player
 */
function openDeleteRedeemPicker(player) {
    const codes = getAllRedeemCodes();
    if (codes.length === 0) return player.sendMessage('§c[!] No redeem codes found');

    const now = Date.now();
    const form = new ActionFormData()
        .title('§l§cDelete Redeem Code')
        .body('§7Pilih kode yang ingin dihapus:');

    for (const code of codes) {
        const d = getRedeemData(code);
        if (!d) continue;
        const usageStr = d.limit > 0 ? `${d.usedBy.length}/${d.limit}` : `${d.usedBy.length}/∞`;
        const expiredStr = d.expiredAt
            ? (now > d.expiredAt ? '§cExpired' : `§a${Math.ceil((d.expiredAt - now) / 3600000)}h`)
            : '§7∞';
        form.button(`§c${d.code}\n§7Used: §f${usageStr} §7| Exp: ${expiredStr}`);
    }

    form.show(player).then(response => {
        if (response.canceled) return;

        const code = codes[response.selection];
        const d = getRedeemData(code);
        if (!d) return player.sendMessage('§c[!] Redeem code not found');

        // Konfirmasi hapus
        new ActionFormData()
            .title('§l§cConfirm Delete')
            .body(`§fApakah kamu yakin ingin menghapus kode:\n§e${d.code}§f?\n\n§7Tindakan ini tidak bisa dibatalkan.`)
            .button('§c§lYes, Delete')
            .button('§7Cancel')
            .show(player)
            .then(confirm => {
                if (confirm.canceled || confirm.selection === 1) return;

                deleteRedeemCode(code);
                player.sendMessage(`§a[!] Redeem code §e${code} §adeleted`);
            });
    });
}