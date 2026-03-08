import { system, world } from '@minecraft/server';
import { getData, setData } from './core/database';

const EXPIRE_TIME = 60 * 1000;

system.runInterval(() => {
    const now = Date.now();
    for (const player of world.getPlayers()) {
        const receiver = player.name;
        let requests = getData(`tparequest:${receiver}`) ?? [];
        const stillValid = [];
        for (const req of requests) {
            const expired = now - req.time >= EXPIRE_TIME;
            if (expired) {
                const sender = req.sender;
                let senderList = getData(`tpasend:${sender}`) ?? [];
                senderList = senderList.filter(r => r.target !== receiver);
                setData(`tpasend:${sender}`, senderList);

                const senderPlayer = world.getPlayers().find(p => p.name === sender);
                if (senderPlayer) senderPlayer.sendMessage(`§c[!] TPA to §e${receiver} §cwas expired`);
            } else {
                stillValid.push(req);
            }
        }
        if (stillValid.length !== requests.length) {
            setData(`tparequest:${receiver}`, stillValid);
        }
    }
}, 200)