import { ISLAND_SLOTS } from "./core/islandManager";
import { getData, setData } from "./core/database";

for (const slot of ISLAND_SLOTS) {
    if (!getData(`island:${slot.id}`)) {
        setData(`island:${slot.id}`, {
            id: slot.id,
            name: slot.id,
            host: null,
            members: [],
            status: null,
            pendingRequests: [],
            maxMembers: 5,
            createAt: null
        });
    }
}