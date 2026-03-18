export const RANK_CONFIG = {
    Legend: {
        level: 1,
        show: '§l§eLegend§r',
        commands: ['fly'],
        prefix: '§e§l[Legend]§r',
        flyEnergy: 2400,
        rewards: [
            {
                item: 'diamond',
                amount: 2
            }
        ]
    },
    
    Mythic: {
        level: 2,
        show: '§l§5Mythic§r',
        commands: ['fly'],
        prefix: '§l§5[Mythic]§r',
        flyEnergy: 3600,
        rewards: [
            {
                item: 'diamond',
                amount: 3
            }
        ]
    },
    
    Ascended: {
        level: 3,
        show: '§l§9Ascended§r',
        commands: ['fly'],
        prefix: '§l§9[Ascended]§r',
        flyEnergy: 4200,
        rewards: [
            {
                item: 'diamond',
                amount: 4
            }
        ]
    },
    
    Immortal: {
        level: 4,
        show: '§l§cImmortal§r',
        commands: ['fly'],
        prefix: '§l§c[Immortal]§r',
        flyEnergy: 4800,
        rewards: [
            {
                item: 'diamond',
                amount: 5
            }
        ]
    }
}

export const RANK_CUSTOM = {
    level: 5,
    commands: ['fly'],
    flyEnergy: 6000,
    rewards: [
        {
            item: 'diamond',
            amount: 6
        }
    ]
}

export const PROGRESS_CONFIG = {}