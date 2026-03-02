import { Player } from "@minecraft/server";
import { getData, setData } from "./database"
import { getPlayerData, savePlayerData } from "./playerManager";

/** @param {Player} player */
export function leaveIsland(player) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return { success: false, message: 'You are not in an island' };
    const islandKey = `island:${playerData.currentIsland}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: 'Island data corrupted' };

    // HOST
    if (playerData.role === 'host') {
        if (island.members.length > 1) {
            return { success: false, message: 'You cannot leave the island because you are the only member' };
        }
        island.host = null;
        island.members = [];
        island.status = 'abandoned';
        island.pendingRequests = [];
        setData(islandKey, island);
        playerData.currentIsland = null;
        playerData.role = null;
        savePlayerData(player.name, playerData);

        return { success: true, message: 'Your island was abandoned' };
    }

    // MEMBER
    island.members = island.members.filter(m => m !== player.name);
    setData(islandKey, island);
    playerData.currentIsland = null;
    playerData.role = null;
    savePlayerData(player.name, playerData);

    return { success: true, message: 'You left the island' };
}

/**
 * 
 * @param {Player} player 
 * @param {string} islandId
 */
export function takeIslandAsHost(player, islandId) {
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: 'Island not found' };
    if (island.host !== null || island.status !== null) return { success: false, message: 'Island is already taken' };
    const playerData = getPlayerData(player.name);
    if (playerData.currentIsland !== null) return { success: false, message: 'You are already in an island' };

    island.host = player.name;
    island.members = [player.name];
    island.status = 'active';
    island.createAt = Date.now();
    setData(islandKey, island);

    playerData.currentIsland = islandId;
    playerData.role = 'host';
    playerData.appliedTo = [];
    playerData.incomingApproval = [];
    savePlayerData(player.name, playerData);

    return { success: true, message: 'Island taken as host' };
}

export function getIsland(id) {
    return getData(id);
}

export function createIslandData(slot) {
    return {
        id: slot.id,
        name: slot.id,
        host: null,
        members: [],
        pendingRequests: [],
        maxMembers: 5,
        createAt: null
    }
}

export const ISLAND_SLOTS = [
    { id: 'island1', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island2', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island3', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island4', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island5', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island6', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island7', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island8', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island9', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island10', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island11', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island12', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island13', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island14', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island15', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island16', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island17', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island18', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island19', pos: { x: 100, y: 100, z: 100 } },
    { id: 'island20', pos: { x: 100, y: 100, z: 100 } }
]