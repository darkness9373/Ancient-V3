import {
  world,
  system,
  Player,
  CommandPermissionLevel,
  CustomCommandStatus,
  CustomCommandParamType
} from "@minecraft/server";
import {
  ActionFormData,
  ModalFormData,
  MessageFormData
} from "@minecraft/server-ui";

world.afterEvents.worldLoad.subscribe(v => {
  import("main.js");
});