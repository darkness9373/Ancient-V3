import { getData, setData } from "./database"

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