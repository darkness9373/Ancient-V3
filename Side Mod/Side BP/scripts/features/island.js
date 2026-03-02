import { world, system, Player } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

system.beforeEvents.startup.subscribe(data => {
    data.customCommandRegistry.registerCommand({
        name: 'as:island',
        description: 'Open the island List',
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity;
        if (!(player instanceof Player)) return;
        const haveIsland = player.getDynamicProperty('haveIsland');
        if (!haveIsland) {
            islandList(player);
            return
        }
    })
})

/**
 * 
 * @param {Player} player 
 */
function islandList(player) {
    const form = new ActionFormData();
    form.title('Island List');
    form.body('');
    for (const land of island) {
        const dbname = world.getDynamicProperty(land.id);
        const name = dbname ?? land.name;
        form.button(name)
    }
}

const island = [
    {
        'name': 'Island 1',
        'id': 'island1',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 2',
        'id': 'island2',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 3',
        'id': 'island3',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 4',
        'id': 'island4',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 5',
        'id': 'island5',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 6',
        'id': 'island6',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 7',
        'id': 'island7',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 8',
        'id': 'island8',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 9',
        'id': 'island9',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 10',
        'id': 'island10',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 11',
        'id': 'island11',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 12',
        'id': 'island12',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 13',
        'id': 'island13',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 14',
        'id': 'island14',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 15',
        'id': 'island15',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 16',
        'id': 'island16',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 17',
        'id': 'island17',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 18',
        'id': 'island18',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 19',
        'id': 'island19',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    },
    {
        'name': 'Island 20',
        'id': 'island20',
        'pos': {
            'x': -100,
            'y': -100,
            'z': -100
        }
    }
]