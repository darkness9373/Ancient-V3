import { Player, world } from "@minecraft/server";
import { getData, setData } from "./database"
import { getPlayerData, savePlayerData } from "./playerManager";

export function kickMember(player, targetName) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    const islandKey = `island:${playerData.currentIsland}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.host !== player.name) return { success: false, message: '§c[!] You are not the island host' };
    if (!island.members.includes(targetName)) return { success: false, message: '§c[!] Target is not a member of the island' };
    island.members = island.members.filter(m => m !== targetName);
    setData(islandKey, island);

    const targetData = getPlayerData(targetName);
    targetData.currentIsland = null;
    targetData.role = null;
    savePlayerData(targetName, targetData);

    const onlineTarget = world.getPlayers().find(p => p.name === targetName);
    if (onlineTarget) onlineTarget.sendMessage(`§c[!] You were kicked from §e${island.name}`);

    return { success: true, message: `§a[!] You kicked §e${targetName}` };
}

export function rejectPlayer(islandId, playerName) {
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.host !== host.name) return { success: false, message: '§c[!] You are not the island host' };
    if (!island.pendingRequests.includes(playerName)) return { success: false, message: '§c[!] Player is not applying to this island' };

    island.pendingRequests = island.pendingRequests.filter(p => p !== playerName);
    setData(islandKey, island);

    const playerData = getPlayerData(playerName);
    if (!playerData) return { success: false, message: '§c[!] Player data corrupted' };
    playerData.appliedTo = playerData.appliedTo.filter(p => p !== island.id);
    playerData.incomingApproval = playerData.incomingApproval.filter(p => p !== island.id);
    savePlayerData(playerName, playerData);

    return { success: true, message: '§a[!] You rejected the player' };
}

export function cancelApply(player, islandId) {
    const playerData = getPlayerData(player.name);
    if (!playerData.appliedTo.includes(islandId)) return { success: false, message: '§c[!] You have not applied to this island' };
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };

    // Remove from Island Pending Requests
    island.pendingRequests = island.pendingRequests.filter(p => p !== player.name);
    setData(islandKey, island);

    // Remove from Player Data
    playerData.appliedTo = playerData.appliedTo.filter(p => p !== islandId);
    playerData.incomingApproval = playerData.incomingApproval.filter(p => p !== islandId);
    savePlayerData(player.name, playerData);

    return { success: true, message: '§c[!] You cancelled your application' };
}

/**
 * 
 * @param {Player} player 
 * @param {string} islandId 
 */
export function finalizeJoin(player, islandId) {
    const playerData = getPlayerData(player.name);

    // Validate Player State
    if (playerData.currentIsland !== null) return { success: false, message: '§c[!] You are already in an island' };
    if (!playerData.incomingApproval.includes(islandId)) return { success: false, message: '§c[!] You are not applying to this island' };
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.status !== 'active' && island.host !== null) return { success: false, message: '§c[!] Island is not available' };

    // Cek Full Island
    if (island.members.length >= island.maxMembers) return { success: false, message: '§c[!] Island is full' };

    // Join Island
    island.members.push(player.name);
    island.pendingRequests = island.pendingRequests.filter(p => p !== player.name);
    setData(islandKey, island);

    // Update Player Data
    playerData.currentIsland = islandId;
    playerData.role = 'member';
    playerData.appliedTo = [];
    playerData.incomingApproval = [];
    savePlayerData(player.name, playerData);

    return { success: true, message: `§a[!] You joined §e${island.name}` };
}

export function acceptPlayer(islandId, playerName) {
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };

    // Validate
    if (!island.pendingRequests.includes(playerName)) return { success: false, message: '§c[!] Player is not applying to this island' };
    const playerData = getPlayerData(playerName);
    if (playerData.currentIsland !== null) {
        island.pendingRequests = island.pendingRequests.filter(p => p !== playerName);
        setData(islandKey, island);
        playerData.appliedTo = playerData.appliedTo.filter(p => p !== islandId);
        savePlayerData(playerName, playerData);
        return { success: false, message: '§c[!] Player already joined another island' };
    }

    // Cek Full Island
    if (island.members.length >= island.maxMembers) return { success: false, message: '§c[!] Island is full' };

    // Remove from Pending Requests
    island.pendingRequests = island.pendingRequests.filter(p => p !== playerName);
    setData(islandKey, island);

    // Update Player Data
    playerData.incomingApproval.push(islandId);
    playerData.appliedTo = playerData.appliedTo.filter(p => p !== islandId);
    savePlayerData(playerName, playerData);

    return { success: true, message: `§a[!] You accepted §e${island.name}` };
}

/**
 * 
 * @param {Player} player 
 * @param {string} islandId 
 */
export function applyToIsland(player, islandId) {
    const playerData = getPlayerData(player.name);
    if (playerData.currentIsland) return { success: false, message: '§c[!] You are already in an island' };
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.status === 'abandoned') return { success: false, message: '§c[!] Island is abandoned' };
    if (island.host === null) return { success: false, message: '§c[!] Island is not taken' };
    if (island.members.length >= island.maxMembers) return { success: false, message: '§c[!] Island is full' };
    if (playerData.appliedTo.includes(islandId)) return { success: false, message: '§c[!] You have already applied to this island' };

    island.pendingRequests.push(player.name);
    setData(islandKey, island);

    playerData.appliedTo.push(islandId);
    savePlayerData(player.name, playerData);

    return { success: true, message: `§a[!] You applied to §e${island.name}` };
}

/**
 * 
 * @param {Player} player 
 * @param {string} targetName 
 */
export function transferHost(player, targetName) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    if (playerData.role !== 'host') return { success: false, message: '§c[!] You are not the island host' };
    if (player.name === targetName) return { success: false, message: '§c[!] You cannot transfer host to yourself' };

    const islandKey = `island:${playerData.currentIsland}`;
    const island = getData(islandKey);
    if (!island.members.includes(targetName)) return { success: false, message: '§c[!] Target is not a member of the island' };

    island.host = targetName;
    setData(islandKey, island);

    playerData.role = 'member';
    savePlayerData(player.name, playerData);

    const targetData = getPlayerData(targetName);
    targetData.role = 'host';
    savePlayerData(targetName, targetData);

    return { success: true, message: `§a[!] You transferred host to §e${targetName}` };
}

/** @param {Player} player */
export function leaveIsland(player) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    const islandKey = `island:${playerData.currentIsland}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island data corrupted' };

    // HOST
    if (playerData.role === 'host') {
        if (island.members.length > 1) {
            return { success: false, message: '§c[!] You cannot leave the island, transfer host to another player first' };
        }
        island.host = null;
        island.members = [];
        island.status = 'abandoned';
        island.pendingRequests = [];
        setData(islandKey, island);
        playerData.currentIsland = null;
        playerData.role = null;
        savePlayerData(player.name, playerData);

        return { success: true, message: '§c[!] Your island was abandoned' };
    }

    // MEMBER
    island.members = island.members.filter(m => m !== player.name);
    setData(islandKey, island);
    playerData.currentIsland = null;
    playerData.role = null;
    savePlayerData(player.name, playerData);

    return { success: true, message: '§a[!] You left the island' };
}

/**
 * 
 * @param {Player} player 
 * @param {string} islandId
 */
export function takeIslandAsHost(player, islandId) {
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.host !== null || island.status !== null) return { success: false, message: '§c[!] Island is already taken' };
    const playerData = getPlayerData(player.name);
    if (playerData.currentIsland !== null) return { success: false, message: '§c[!] You are already in an island' };

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

    return { success: true, message: '§a[!] Island taken as host' };
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