import { CONFIG } from './config.js';
import { MazeGenerator } from './generator.js';
import { MazeRenderer } from './renderer.js';

export class CanvasManager {
    constructor(elements, state) {
        this.elements = elements;
        this.state = state;
    }

    updateCanvas() {
        this.resizeCanvas();
        this.calculateMazeDimensions();
        this.updateDisplayValues();
        this.generateAndRender();
    }

    resizeCanvas() {
        this.elements.canvas.width = window.innerWidth - CONFIG.PADDING.CONTROLS;
        this.elements.canvas.height = window.innerHeight - CONFIG.PADDING.CONTROLS;
    }

    calculateMazeDimensions() {
        const size = parseInt(this.elements.sizeSlider.value);
        this.state.speed = parseInt(this.elements.speedSlider.value);
        
        // Calculate maze dimensions based on screen size and size slider
        this.state.cols = Math.floor(
            (this.elements.canvas.width / CONFIG.MAZE.BASE_CELL_SIZE) * (size / CONFIG.MAZE.SIZE_RATIO)
        );
        this.state.rows = Math.floor(
            (this.elements.canvas.height / CONFIG.MAZE.BASE_CELL_SIZE) * (size / CONFIG.MAZE.SIZE_RATIO)
        );
        
        // Ensure minimum maze size
        this.state.cols = Math.max(CONFIG.MAZE.MIN_SIZE, this.state.cols);
        this.state.rows = Math.max(CONFIG.MAZE.MIN_SIZE, this.state.rows);
        
        // Calculate final cell size to fit the canvas perfectly
        const maxCellWidth = this.elements.canvas.width / this.state.cols;
        const maxCellHeight = this.elements.canvas.height / this.state.rows;
        this.state.cellSize = Math.min(maxCellWidth, maxCellHeight);
    }

    updateDisplayValues() {
        this.elements.sizeValue.textContent = this.elements.sizeSlider.value;
        this.elements.speedValue.textContent = this.elements.speedSlider.value;
    }

    generateAndRender() {
        this.state.reset();
        const generator = new MazeGenerator(this.state);
        generator.generate();
        
        const renderer = new MazeRenderer(this.elements.canvas, this.elements.ctx, this.state);
        renderer.draw();
    }
}
