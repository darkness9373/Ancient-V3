export const arena = {
    state: 'idle',
    player1: null,
    player2: null,
    wins: {
        p1: 0,
        p2: 0
    },
    spectators: new Set(),
    savedInventory: new Map(),
    savedLocation: new Map()
}