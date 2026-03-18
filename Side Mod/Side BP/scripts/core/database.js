import { Player, world } from '@minecraft/server';
import { PROGRESS_CONFIG, RANK_CONFIG, RANK_CUSTOM } from '../config/rank';

export function getData(key) {
    const raw = world.getDynamicProperty(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

export function setData(key, value) {
    world.setDynamicProperty(key, JSON.stringify(value));
}

export function deleteData(key) {
    world.setDynamicProperty(key, undefined);
}

export function getFishcoin(playerName) {
    const db = world.getDynamicProperty(`fishcoin:${playerName}`);
    return db ?? 0;
}

export function setFishcoin(playerName, value) {
    world.setDynamicProperty(`fishcoin:${playerName}`, value)
}

export function getDungeoncoin(playerName) {
    const db = world.getDynamicProperty(`dungeoncoin:${playerName}`);
    return db ?? 0;
}

export function setDungeoncoin(playerName, value) {
    world.setDynamicProperty(`dungeoncoin:${playerName}`, value)
}

export function getGold(playerName) {
    const db = world.getDynamicProperty(`gold:${playerName}`);
    return db ?? 0;
}

export function setGold(playerName, value) {
    world.setDynamicProperty(`gold:${playerName}`, value)
}

/** 
 * Get rank displayed in the player chat, scoreboard, etc.
 * @param {Player} player
 */
export function getRankDisplay(player) {
    const type = player.getDynamicProperty('RankDisplay') || 'progress'
    if (type === 'exclusive') {
        const rank = player.getDynamicProperty('Rank')
        return {
            type: 'exclusive',
            config: RANK_CONFIG[rank]
        } || null;
    }
    if (type === 'progress') {
        const rank = player.getDynamicProperty('RankProgress')
        return {
            type: 'progress',
            config: PROGRESS_CONFIG[rank]
        } || null;
    }
    if (type === 'custom') {
        const rank = player.getDynamicProperty('RankCustom')
        if (!rank) return null;
        return {
            type: 'custom',
            config: RANK_CUSTOM
        } || null;
    }

    return null;
}

/**
 * Get active player rank to maintain rank feature like fly mode, etc.
 * @param {Player} player 
 */
export function getRankActive(player) {
    const customRank = player.getDynamicProperty('RankCustom')
    const rank = player.getDynamicProperty('Rank')
    if (customRank) {
        return RANK_CUSTOM || null;
    }
    return RANK_CONFIG[rank] || null;
}