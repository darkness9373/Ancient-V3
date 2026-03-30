import * as mc from "@minecraft/server";
//console.warn("[Travelers Backpack API]: Loading")
mc.world.afterEvents.worldInitialize.subscribe(data=>{
    //mc.world.sendMessage("§6[Travelers Backpack]§r: §2Loaded")
    const backpackAPI = import("./api/backpack.js");
})