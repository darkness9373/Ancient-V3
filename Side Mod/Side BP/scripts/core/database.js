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