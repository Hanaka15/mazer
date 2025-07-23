import { MazeState, DOMElements } from './state.js';
import { CanvasManager } from './canvas-manager.js';
import { MazeRenderer } from './renderer.js';
import { MazeSolver } from './solver.js';

export class MazeApp {
    constructor() {
        this.state = new MazeState();
        this.elements = new DOMElements();
        this.canvasManager = new CanvasManager(this.elements, this.state);
        this.renderer = new MazeRenderer(this.elements.canvas, this.elements.ctx, this.state);
        this.solver = new MazeSolver(this.state, this.renderer);
        
        // Give renderer access to solver for path direction information
        this.renderer.solver = this.solver;
        
        this.initializeEventListeners();
        this.handleInitialLoad();
    }

    initializeEventListeners() {
        // Canvas updates with improved resize handling
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        this.elements.sizeSlider.addEventListener('input', () => this.canvasManager.updateCanvas());
        
        // Speed updates
        this.elements.speedSlider.addEventListener('input', () => {
            this.state.speed = parseInt(this.elements.speedSlider.value);
            this.elements.speedValue.textContent = this.state.speed;
        });
        
        // Button controls
        this.elements.generateBtn.addEventListener('click', () => this.generateNewMaze());
        this.elements.solveBtn.addEventListener('click', () => this.solveMaze());
        
        // Keyboard accessibility
        document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
        
        // Listen for continuous mode events
        document.addEventListener('generateNewMaze', () => this.generateNewMaze());
    }

    handleWindowResize() {
        // Stop any current solving
        if (this.state.solving) {
            this.state.clearSolving();
        }
        
        // Update canvas and generate new maze
        this.canvasManager.updateCanvas();
        
        // Update button states
        this.updateButtonStates();
        
        // If continuous mode is enabled, start solving the new maze
        const continuousCheckbox = document.getElementById('continuous');
        if (continuousCheckbox && continuousCheckbox.checked) {
            setTimeout(() => {
                if (!this.state.solving && this.state.grid.length > 0) {
                    this.solveMaze();
                }
            }, 200); // Small delay to ensure maze generation is complete
        }
    }

    handleKeyboardInput(event) {
        switch(event.key) {
            case 'g':
            case 'G':
                event.preventDefault();
                this.generateNewMaze();
                break;
            case 's':
            case 'S':
                event.preventDefault();
                this.solveMaze();
                break;
            case 'Escape':
                event.preventDefault();
                this.state.clearSolving();
                this.updateButtonStates();
                break;
        }
    }

    generateNewMaze() {
        this.state.clearSolving();
        this.canvasManager.generateAndRender();
        this.updateButtonStates();
    }

    solveMaze() {
        if (!this.state.solving && this.state.grid.length > 0) {
            this.solver.solve();
            this.updateButtonStates();
        }
    }

    updateButtonStates() {
        // Only disable solve button when actively solving
        this.elements.solveBtn.disabled = this.state.solving;
        // Don't disable generate button - allow generating new maze while solving
        this.elements.generateBtn.disabled = false;
        
        if (this.state.solving) {
            this.elements.solveBtn.textContent = 'Solving...';
            // Remove the loading class that darkens the screen
        } else {
            this.elements.solveBtn.textContent = 'Solve';
        }
    }

    handleInitialLoad() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.canvasManager.updateCanvas());
        } else {
            this.canvasManager.updateCanvas();
        }
    }
}
