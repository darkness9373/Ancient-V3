import * as mc from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { GOLD_SELL_CATEGORIES, GOLD_BUY_CATEGORIES } from '../config/shopConfig';
import { sellItemForGold, buyItemForGold, countItemInInventory } from '../core/shopManager';
import { getGold } from '../core/database';

mc.system.beforeEvents.startup.subscribe(data => {

    // ============================================================
    //  /as:sell — Gold sell shop
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:sell',
        description: 'Sell items for Gold',
        permissionLevel: mc.CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        mc.system.run(() => openSellCategory(player));
    });

    // ============================================================
    //  /as:buy — Gold buy shop
    // ============================================================
    data.customCommandRegistry.registerCommand({
        name: 'as:buy',
        description: 'Buy items with Gold',
        permissionLevel: mc.CommandPermissionLevel.Any
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof mc.Player)) return;
        mc.system.run(() => openBuyCategory(player));
    });

});

// ============================================================
//  SELL — STEP 1: Pilih kategori
// ============================================================

function openSellCategory(player) {
    const gold = getGold(player.name);
    const form = new ActionFormData()
        .title('§l§6Gold Sell Shop')
        .body(`§7Your Gold: §6${gold}\n§7Pilih kategori item:`);

    const availableCategories = [];
    for (const category of GOLD_SELL_CATEGORIES) {
        let totalOwned = 0;
        for (const item of category.items) {
            totalOwned += countItemInInventory(player, item.typeId);
        }
        form.button(
            totalOwned > 0
                ? `${category.name}\n§7${category.items.length} items | §fHave items`
                : `${category.name}\n§7${category.items.length} items | §8Nothing to sell`
        );
        availableCategories.push({ ...category, totalOwned });
    }

    form.show(player).then(response => {
        if (response.canceled) return;
        openSellShop(player, availableCategories[response.selection]);
    });
}

// ============================================================
//  SELL — STEP 2: Pilih item
// ============================================================

function openSellShop(player, category) {
    const gold = getGold(player.name);
    const form = new ActionFormData()
        .title(`§l§6${category.name.replace(/§./g, '')}`)
        .body(`§7Your Gold: §6${gold}\n§7Pilih item yang ingin dijual:`)
        .button('§7← Back');

    const available = [];
    for (const item of category.items) {
        const owned = countItemInInventory(player, item.typeId);
        const batches = Math.floor(owned / item.sellAmount);
        form.button(
            batches > 0
                ? `§f${item.name}\n§7${item.sellAmount}x → §6${item.sellPrice} Gold §8| §f${owned} owned`
                : `§8${item.name}\n§7${item.sellAmount}x → §6${item.sellPrice} Gold §8| §8Not enough`
        );
        available.push({ ...item, owned, batches });
    }

    form.show(player).then(response => {
        if (response.canceled) return;
        if (response.selection === 0) return openSellCategory(player);

        const selected = available[response.selection - 1];
        if (selected.batches < 1) {
            player.sendMessage(`§c[!] Not enough §f${selected.name}§c. Need §f${selected.sellAmount}`);
            return mc.system.runTimeout(() => openSellShop(player, category), 10);
        }
        openSellAmountForm(player, selected, category);
    });
}

// ============================================================
//  SELL — STEP 3: Input jumlah batch
// ============================================================

function openSellAmountForm(player, item, category) {
    const maxEarnable = item.batches * item.sellPrice;

    new ModalFormData()
        .title(`§l§6Sell ${item.name}`)
        .textField(
            `§fJumlah Batch\n` +
            `§7${item.sellAmount}x per batch → §6${item.sellPrice} Gold§7/batch\n` +
            `§7Kamu punya: §f${item.owned} §7(max §f${item.batches} §7batch = §6${maxEarnable} Gold§7)`,
            `1 - ${item.batches}`,
            { defaultValue: String(item.batches) }
        )
        .submitButton('§6§lSell')
        .show(player)
        .then(response => {
            if (response.canceled) return openSellShop(player, category);

            const batches = parseInt(response.formValues[0]);
            if (isNaN(batches) || batches < 1) {
                player.sendMessage('§c[!] Invalid amount. Must be 1 or more');
                return mc.system.runTimeout(() => openSellAmountForm(player, item, category), 10);
            }
            if (batches > item.batches) {
                player.sendMessage(`§c[!] Maximum §f${item.batches} §cbatch (you have §f${item.owned}§c ${item.name})`);
                return mc.system.runTimeout(() => openSellAmountForm(player, item, category), 10);
            }

            const result = sellItemForGold(player, item.typeId, batches);
            player.sendMessage(result.message);
            if (result.success) mc.system.runTimeout(() => openSellShop(player, category), 10);
        });
}

// ============================================================
//  BUY — STEP 1: Pilih kategori
// ============================================================

function openBuyCategory(player) {
    const gold = getGold(player.name);
    const form = new ActionFormData()
        .title('§l§6Gold Buy Shop')
        .body(`§7Your Gold: §6${gold}\n§7Pilih kategori item:`);

    for (const category of GOLD_BUY_CATEGORIES) {
        form.button(`${category.name}\n§7${category.items.length} items`);
    }

    form.show(player).then(response => {
        if (response.canceled) return;
        openBuyShop(player, GOLD_BUY_CATEGORIES[response.selection]);
    });
}

// ============================================================
//  BUY — STEP 2: Pilih item
// ============================================================

function openBuyShop(player, category) {
    const gold = getGold(player.name);
    const form = new ActionFormData()
        .title(`§l§6${category.name.replace(/§./g, '')}`)
        .body(`§7Your Gold: §6${gold}\n§7Pilih item yang ingin dibeli:`)
        .button('§7← Back');

    for (const item of category.items) {
        const canAfford = gold >= item.buyPrice;
        form.button(
            canAfford
                ? `§f${item.name}\n§7${item.buyAmount}x → §6${item.buyPrice} Gold`
                : `§8${item.name}\n§7${item.buyAmount}x → §6${item.buyPrice} Gold §c(Not enough)`
        );
    }

    form.show(player).then(response => {
        if (response.canceled) return;
        if (response.selection === 0) return openBuyCategory(player);

        const selected = category.items[response.selection - 1];
        const currentGold = getGold(player.name);

        if (currentGold < selected.buyPrice) {
            player.sendMessage(`§c[!] Not enough Gold. Need §6${selected.buyPrice}§c, have §6${currentGold}`);
            return mc.system.runTimeout(() => openBuyShop(player, category), 10);
        }

        openBuyAmountForm(player, selected, category);
    });
}

// ============================================================
//  BUY — STEP 3: Input jumlah batch
// ============================================================

function openBuyAmountForm(player, item, category) {
    const gold = getGold(player.name);
    const maxBatches = Math.floor(gold / item.buyPrice);

    new ModalFormData()
        .title(`§l§6Buy ${item.name}`)
        .textField(
            `§fJumlah Batch\n` +
            `§7${item.buyAmount}x per batch → §6${item.buyPrice} Gold§7/batch\n` +
            `§7Gold kamu: §6${gold} §7(max §f${maxBatches} §7batch = §f${maxBatches * item.buyAmount}§7 items§7)`,
            `1 - ${maxBatches}`,
            { defaultValue: '1' }
        )
        .submitButton('§6§lBuy')
        .show(player)
        .then(response => {
            if (response.canceled) return openBuyShop(player, category);

            const batches = parseInt(response.formValues[0]);
            if (isNaN(batches) || batches < 1) {
                player.sendMessage('§c[!] Invalid amount. Must be 1 or more');
                return mc.system.runTimeout(() => openBuyAmountForm(player, item, category), 10);
            }
            if (batches > maxBatches) {
                player.sendMessage(`§c[!] Maximum §f${maxBatches} §cbatch (you have §6${gold} §cGold)`);
                return mc.system.runTimeout(() => openBuyAmountForm(player, item, category), 10);
            }

            const result = buyItemForGold(player, item.typeId, batches);
            player.sendMessage(result.message);
            if (result.success) mc.system.runTimeout(() => openBuyShop(player, category), 10);
        });
}