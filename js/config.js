// Configuration Constants
export const CONFIG = {
    PADDING: {
        CONTROLS: 120,
        CANVAS_TOP: 100,
        CANVAS_BOTTOM: 20
    },
    MAZE: {
        BASE_CELL_SIZE: 20,
        MIN_SIZE: 5,
        SIZE_RATIO: 30,
        BRAIDING_CHANCE: 0.7,
        RANDOM_CONNECTIONS_RATIO: 0.05,
        RANDOM_CONNECTION_CHANCE: 0.3
    },
    ANIMATION: {
        MIN_INTERVAL: 1,
        MAX_INTERVAL: 200,
        SPEED_MULTIPLIER: 2,
        THRESHOLD_SPEED: 100,
        FRAME_SKIP_MS: 16
    },
    COLORS: {
        WALL: '#999',
        PATH: '#21ff21',
        PATH_CURRENT: '#ffff00',
        PATH_CONFIRMED: '#ff2100',
        OPEN_SET: '#9999ff',
        CLOSED_SET: '#55555550',
        START: '#4caf50',
        END: '#f44336'
    },
    ASTAR: {
        USE_TIE_BREAKING: true,
        TIE_BREAKING_WEIGHT: 0.001,
        USE_JUMP_POINT_SEARCH: true,
        EARLY_EXIT_THRESHOLD: 0.1,
        BEAM_SEARCH_WIDTH: 50
    }
};
