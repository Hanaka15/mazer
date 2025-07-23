import { Cell } from './cell.js';
import { CONFIG } from './config.js';
import { MazeUtils } from './utils.js';

export class MazeGenerator {
    constructor(state) {
        this.state = state;
    }

    generate() {
        this.createGrid();
        this.generatePaths();
        this.addComplexity();
        this.setStartAndEnd();
    }

    createGrid() {
        this.state.grid = [];
        for (let y = 0; y < this.state.rows; y++) {
            for (let x = 0; x < this.state.cols; x++) {
                this.state.grid.push(new Cell(x, y));
            }
        }
    }

    generatePaths() {
        this.state.stack = [];
        const startIndex = 0;
        let current = this.state.grid[startIndex];
        current.visited = true;
        this.state.stack.push(current);

        while (this.state.stack.length > 0) {
            current = this.state.stack[this.state.stack.length - 1];
            const next = this.getUnvisitedNeighbor(current);
            
            if (next) {
                next.visited = true;
                this.state.stack.push(next);
                MazeUtils.removeWalls(current, next);
            } else {
                this.state.stack.pop();
            }
        }
    }

    getUnvisitedNeighbor(cell) {
        const neighbors = MazeUtils.getAllNeighbors(
            cell, 
            this.state.grid, 
            this.state.cols, 
            this.state.rows
        ).filter(neighbor => !neighbor.visited);

        return neighbors.length > 0 
            ? neighbors[Math.floor(Math.random() * neighbors.length)]
            : null;
    }

    addComplexity() {
        const elements = document.getElementsByTagName('input');
        const braidedCheckbox = Array.from(elements).find(el => el.id === 'braided');
        
        if (braidedCheckbox && braidedCheckbox.checked) {
            this.addBraiding();
        }
        this.addRandomConnections();
    }

    addBraiding() {
        const deadEnds = this.state.grid.filter(cell => cell.isDeadEnd());
        
        deadEnds.forEach(deadEnd => {
            if (Math.random() < CONFIG.MAZE.BRAIDING_CHANCE) {
                const neighbors = MazeUtils.getAllNeighbors(
                    deadEnd, 
                    this.state.grid, 
                    this.state.cols, 
                    this.state.rows
                );
                
                const validTargets = neighbors.filter(neighbor => 
                    MazeUtils.canRemoveWall(deadEnd, neighbor)
                );
                
                if (validTargets.length > 0) {
                    const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                    MazeUtils.removeWalls(deadEnd, target);
                }
            }
        });
    }

    addRandomConnections() {
        const connectionCount = Math.floor(
            (this.state.cols * this.state.rows) * CONFIG.MAZE.RANDOM_CONNECTIONS_RATIO
        );
        
        for (let i = 0; i < connectionCount; i++) {
            const randomCell = this.state.grid[Math.floor(Math.random() * this.state.grid.length)];
            const neighbors = MazeUtils.getAllNeighbors(
                randomCell, 
                this.state.grid, 
                this.state.cols, 
                this.state.rows
            );
            
            const validNeighbors = neighbors.filter(neighbor => 
                Math.random() < CONFIG.MAZE.RANDOM_CONNECTION_CHANCE
            );
            
            if (validNeighbors.length > 0) {
                const target = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                MazeUtils.removeWalls(randomCell, target);
            }
        }
    }

    setStartAndEnd() {
        this.state.startCell = this.state.grid[0];
        this.state.endCell = this.state.grid[this.state.grid.length - 1];
    }
}
