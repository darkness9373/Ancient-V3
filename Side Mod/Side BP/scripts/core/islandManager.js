import { Player, world } from "@minecraft/server";
import { getData, setData } from "./database"
import { getPlayerData, savePlayerData } from "./playerManager";

export function removePermission(host, targetName) {
    const hostData = getPlayerData(host.name);
    if (!hostData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    if (hostData.role !== 'host') return { success: false, message: '§c[!] You are not the island host' };
    const islandKey = `island:${hostData.currentIsland}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (!island.allowed.includes(targetName)) return { success: false, message: '§c[!] Target is not have permission' };

    island.allowed = island.allowed.filter(m => m !== targetName);
    setData(islandKey, island);

    return { success: true, message: '§a[!] You removed permission from §e${targetName}' };
}

export function addPermission(host, targetName) {
    const hostData = getPlayerData(host.name);
    if (!hostData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    if (hostData.role !== 'host') return { success: false, message: '§c[!] You are not the island host' };
    const islandKey = `island:${hostData.currentIsland}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.allowed.includes(targetName)) return { success: false, message: '§c[!] Target is already have permission' };

    island.allowed.push(targetName);
    setData(islandKey, island);

    return { success: true, message: '§a[!] You added permission to §e${targetName}' };
}

export function reclaimIsland(islandId) {
    const islandKey = `island:${islandId}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.members && island.members.length !== 0) return { success: false, message: '§c[!] Island is not empty' };

    island.host = null;
    island.members = [];
    island.status = null;
    island.pendingRequests = [];
    setData(islandKey, island);

    return { success: true, message: '§a[!] Island reclaimed' };
}

/** @param {Player} player */
export function teleportToIsland(player) {
    const playerData = getPlayerData(player.name);
    if (!playerData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    const islandId = playerData.currentIsland;
    const slot = ISLAND_SLOTS.find(s => s.id === islandId);
    if (!slot) return { success: false, message: '§c[!] Island not found' };
    const dimension = world.getDimension('overworld');
    const base = slot.pos;
    let safePos = null;
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            const x = base.x + dx;
            const z = base.z + dz;
            for (let y = 109 + 5; y >= 109 - 5; y--) {
                const block = dimension.getBlock({ x, y, z });
                const blockAbove = dimension.getBlock({ x, y: y + 1, z });
                const blockBelow = dimension.getBlock({ x, y: y - 1, z });
                if (!block || !blockAbove || !blockBelow) continue;
                const isAir =
                    block.typeId === 'minecraft:air' &&
                    blockAbove.typeId === 'minecraft:air';
                const safeGround =
                    blockBelow.typeId !== 'minecraft:air' &&
                    blockBelow.typeId !== 'minecraft:lava';
                if (isAir && safeGround) {
                    safePos = { x, y, z };
                    break;
                }
            }
            if (safePos) break;
        }
        if (safePos) break;
    }
    if (!safePos) {
        safePos = {
            x: base.x + 0.5,
            y: 109 + 2,
            z: base.z + 0.5
        }
    }
    player.tryTeleport(safePos, { dimension: dimension });
    player.addEffect('resistance', 100, { showParticles: true, amplifier: 254 });

    return { success: true, message: '§a[!] You teleported to the island' };
}

/**
 * @param {Player} host
 * @param {string} targetName
 */
export function invitePlayer(host, targetName) {
    const hostData = getPlayerData(host.name);
    if (!hostData.currentIsland) return { success: false, message: '§c[!] You are not in an island' };
    if (hostData.role !== 'host') return { success: false, message: '§c[!] You are not the island host' };
    const islandKey = `island:${hostData.currentIsland}`;
    const island = getData(islandKey);
    if (!island) return { success: false, message: '§c[!] Island not found' };
    if (island.members.includes(targetName)) return { success: false, message: '§c[!] Target is already a member of the island' };
    if (island.members.length >= island.maxMembers) return { success: false, message: '§c[!] Island is full' };
    const targetData = getPlayerData(targetName);
    if (targetData.currentIsland) return { success: false, message: '§c[!] Target is already in an island' };
    if (targetData.incomingApproval.includes(island.id)) return { success: false, message: '§c[!] Target is already applying to this island' };
    targetData.incomingApproval.push(island.id);
    savePlayerData(targetName, targetData);

    return { success: true, message: `§a[!] You invited §e${targetName}` };
}

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

export function rejectPlayer(host, islandId, playerName) {
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
    { id: 'island1', pos: { x: 1000, z: 970 } },
    { id: 'island2', pos: { x: -1000, z: -1030 } },
    { id: 'island3', pos: { x: 2000, z: 1970 } },
    { id: 'island4', pos: { x: -2000, z: -2030 } },
    { id: 'island5', pos: { x: 3000, z: 2970 } },
    { id: 'island6', pos: { x: -3000, z: -3030 } },
    { id: 'island7', pos: { x: 4000, z: 3970 } },
    { id: 'island8', pos: { x: -4000, z: -4030 } },
    { id: 'island9', pos: { x: 5000, z: 4970 } },
    { id: 'island10', pos: { x: -5000, z: -5030 } },
    { id: 'island11', pos: { x: 6000, z: 5970 } },
    { id: 'island12', pos: { x: -6000, z: -6030 } },
    { id: 'island13', pos: { x: 7000, z: 6970 } },
    { id: 'island14', pos: { x: -7000, z: -7030 } },
    { id: 'island15', pos: { x: 8000, z: 7970 } },
    { id: 'island16', pos: { x: -8000, z: -8030 } },
    { id: 'island17', pos: { x: 9000, z: 8970 } },
    { id: 'island18', pos: { x: -9000, z: -9030 } },
    { id: 'island19', pos: { x: 10000, z: 9970 } },
    { id: 'island20', pos: { x: -10000, z: -10030 } }
]