import { world } from "@minecraft/server";
import { getData, setData } from "./database";

const EXPIRE_TIME = 60 * 1000;

export function sendTPA(sender, target) {
    const senderList = getData(`tpasend:${sender}`) ?? [];
    const targetList = getData(`tparequest:${target}`) ?? [];

    if (senderList.some(r => r.target === target)) return { status: 'already_sent' };
    const data = {
        target,
        time: Date.now()
    }
    senderList.push(data);
    targetList.push({
        sender,
        time: data.time
    });
    setData(`tpasend:${sender}`, senderList);
    setData(`tparequest:${target}`, targetList);

    return { status: 'sent' };
}

export function acceptTPA(receiver, sender) {
    let senderList = getData(`tpasend:${sender}`) ?? [];
    let receiverList = getData(`tparequest:${receiver}`) ?? [];

    senderList = senderList.filter(r => r.target !== receiver);
    receiverList = receiverList.filter(r => r.sender !== sender);
    setData(`tpasend:${sender}`, senderList);
    setData(`tparequest:${receiver}`, receiverList);
}

export function denyTPA(receiver, sender) {
    let senderList = getData(`tpasend:${sender}`) ?? [];
    let receiverList = getData(`tparequest:${receiver}`) ?? [];

    senderList = senderList.filter(r => r.target !== receiver);
    receiverList = receiverList.filter(r => r.sender !== sender);

    setData(`tpasend:${sender}`, senderList);
    setData(`tparequest:${receiver}`, receiverList);
}

export function cancelTPA(sender, target) {
    let senderList = getData(`tpasend:${sender}`) ?? [];
    let targetList = getData(`tparequest:${target}`) ?? [];

    senderList = senderList.filter(r => r.target !== target);
    targetList = targetList.filter(r => r.sender !== sender);
    setData(`tpasend:${sender}`, senderList);
    setData(`tparequest:${target}`, targetList);
}

export function getIncomingTPA(player) {
    return getData(`tparequest:${player}`) ?? [];
}

export function getOutgoingTPA(player) {
    return getData(`tpasend:${player}`) ?? [];
}


export function teleportSender(senderName, receiver) {
    const sender = world.getPlayers().find(p => p.name === senderName);
    if (!sender) return receiver.sendMessage('§c[!] Player not online');
    sender.tryTeleport(receiver.location, {
        dimension: receiver.dimension
    });

    sender.sendMessage(`§a[!] You teleported to §e${receiver.name}`);
    receiver.sendMessage(`§a[!] §e${sender.name} §ateleported to you`);
}