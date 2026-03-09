import { world } from '@minecraft/server';

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