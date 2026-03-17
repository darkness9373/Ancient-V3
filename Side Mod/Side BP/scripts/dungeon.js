import { world } from '@minecraft/server'
import { setData, getData } from './core/database'

world.afterEvents.worldLoad.subscribe(() => {
    if (!getData('dungeon:status')) {
        setData('dungeon:status', {
            status: 'close',
            level: 0
        })
    }
})