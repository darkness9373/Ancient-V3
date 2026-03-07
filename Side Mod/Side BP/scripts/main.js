import { system, world } from '@minecraft/server';
import './island';
import './commands/_load'
import './core/_load'
import { getData, setData } from './core/database';

const EXPIRE_TIME = 60 * 1000;

system.runInterval(() => {
    const now = Date.now();
    for (const player of world.getPlayers()) {
        let request = getData(`tparequest:${player.name}`) ?? [];
        let filtered = request.filter(r => now - r.time < EXPIRE_TIME);
        if (filtered.length !== request.length) {
            setData(`tparequest:${player.name}`, filtered);
        }
    }
}, 200)