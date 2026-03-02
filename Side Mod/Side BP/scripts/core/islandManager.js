import { getData, setData } from "./database"

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
    { id: 'island1', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island2', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island3', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island4', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island5', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island6', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island7', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island8', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island9', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island10', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island11', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island12', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island13', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island14', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island15', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island16', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island17', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island18', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island19', pos: { x: -100, y: -100, z: -100 } },
    { id: 'island20', pos: { x: -100, y: -100, z: -100 } }
]