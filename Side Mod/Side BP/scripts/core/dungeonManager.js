import { getData, setData } from './database'
import * as mc from '@minecraft/server'

export function openDungeon() {
    const dataKey = `dungeon:status`
    const data = getData(dataKey)
    if (!data) return { success: false, message: '§c[!] Invalid dungeon data' }
    
    data.status = 'open'
    setData(dataKey, data)
    mc.world.sendMessage('§a[!] The Dungeon is now open!')
    return { success: true, message: '§a[!] Dungeon successfully opened' }
}

export function closeDungeon() {
    const dataKey = 'dungeon:status'
    const data = setData(dataKey)
    if (!data) return { success: false, message: '§c[!] Invalid dungeon data' }
    
    data.status = 'close'
    setData(dataKey, data)
    mc.world.sendMessage('§c[!] The dungeon is now closer!')
    return { success: true, message: '§a[!] Dungeon successfully closed' }
}

export function getDungeonStatus() {
    const dataKey = 'dungeon:status';
    const data = getData(dataKey);
    if (!data) return { success: false, message: '§c[!] Invalid dungeon data'};
    
    return data.status;
}

export function addNewDungeon(structureId, bossId, location, tpPos) {
    const dataKey = 'dungeon:levels';
    const data = getData(dataKey);
    if (!data) return { success: false, message: '§c[!] Invalid dungeon data'};
    
    const newNumber = Object.keys(data).length + 1
    data[newNumber] = {
        structure: structureId,
        level: newNumber,
        boss: bossId,
        location: location,
        teleport: tpPos
    }
    setData(dataKey, data);
    return { success: true, message: `§a[!] Dungeon level ${newNumber} added` };
}