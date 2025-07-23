export class MazeState {
    constructor() {
        this.cols = 0;
        this.rows = 0;
        this.cellSize = 20;
        this.speed = 30;
        this.grid = [];
        this.stack = [];
        this.startCell = null;
        this.endCell = null;
        this.path = [];
        this.solving = false;
        this.intervalId = null;
    }

    reset() {
        this.grid = [];
        this.stack = [];
        this.startCell = null;
        this.endCell = null;
        this.path = [];
        this.clearSolving();
    }

    clearSolving() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.solving = false;
    }

    clearPath() {
        this.path = [];
    }
}

// DOM Element References
export class DOMElements {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.sizeSlider = document.getElementById('sizeSlider');
        this.speedSlider = document.getElementById('speedSlider');
        this.sizeValue = document.getElementById('sizeValue');
        this.speedValue = document.getElementById('speedValue');
        this.generateBtn = document.getElementById('generateBtn');
        this.solveBtn = document.getElementById('solveBtn');
        this.braidedCheckbox = document.getElementById('braided');
        this.continuousCheckbox = document.getElementById('continuous');
    }
}
