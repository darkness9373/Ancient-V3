import { system, world } from '@minecraft/server'

system.runInterval(() => {
  world.getPlayers().forEach(player => {
    player
  })
}, 10)