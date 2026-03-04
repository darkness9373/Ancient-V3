import { getData, setData } from "./database"
import { getIsland } from './islandManager'

export function getPlayerData(name) {
    let data = getData(`player:${name}`);
    if (!data) {
        data = {
            name,
            currentIsland: null,
            role: null,
            appliedTo: [],
            incomingApproval: []
        }
        setData(`player:${name}`, data);
    }
    return data;
}

export function savePlayerData(name, data) {
    setData(`player:${name}`, data);
}

export function normalizePlayerState(playerData) {
    if (!playerData) return;
    if (playerData.currentIsland) {
        const island = getIsland(`island:${playerData.currentIsland}`);
        if (!island || island.status === 'abandoned') {
            playerData.currentIsland = null;
            playerData.role = null;
        }
    }
    return playerData;
}