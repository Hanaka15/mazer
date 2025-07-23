import { CONFIG } from './config.js';
import { MazeUtils } from './utils.js';
import { BinaryHeap } from './heap.js';

export class MazeSolver {
    constructor(state, renderer) {
        this.state = state;
        this.renderer = renderer;
        this.openSet = null;
        this.closedSet = new Set();
        this.cameFrom = new Map();
        this.gScore = new Map();
        this.fScore = new Map();
        this.animationId = null;
        
        // Optimization tracking
        this.nodeExpansions = 0;
        this.totalComputations = 0;
    }

    solve() {
        this.state.solving = true;
        this.state.clearPath();
        this.nodeExpansions = 0;
        this.totalComputations = 0;
        
        this.initializePathfinding();
        
        if (this.state.speed >= CONFIG.ANIMATION.THRESHOLD_SPEED) {
            this.solveInstantly();
        } else {
            this.solveAnimated();
        }
    }

    solveInstantly() {
        let result = { finished: false };
        
        while (!result.finished) {
            const batchSize = 100;
            
            for (let i = 0; i < batchSize && !result.finished; i++) {
                result = this.solvingStepOptimized();
            }
        }
        
        this.finishSolving(result.path);
        console.log(`Optimized A*: ${this.nodeExpansions} node expansions, ${this.totalComputations} total computations`);
    }

    solveAnimated() {
        const processSteps = () => {
            if (!this.state.solving) return;
            
            const batchSize = this.calculateBatchSize();
            let result = { finished: false };
            
            // Process multiple steps per frame for performance
            for (let i = 0; i < batchSize && !result.finished; i++) {
                result = this.solvingStepOptimized();
            }
            
            // Update visualization with simple path
            const openSetArray = this.getOpenSetArray();
            const closedSetArray = Array.from(this.closedSet);
            
            this.renderer.draw(openSetArray, closedSetArray, result.path);
            
            if (result.finished) {
                this.finishSolving(result.path);
                console.log(`Optimized A*: ${this.nodeExpansions} node expansions, ${this.totalComputations} total computations`);
            } else {
                const interval = this.calculateInterval();
                this.animationId = setTimeout(processSteps, interval);
            }
        };

        processSteps();
    }

    finishSolving(path) {
        this.state.solving = false;
        this.state.path = path;
        
        // Clear animation state
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
        
        // Final render with clean solution - only path and start/end points
        this.renderer.drawCleanSolution(path);
        
        // Update button states
        const app = window.mazeApp;
        if (app) {
            app.updateButtonStates();
        }
        
        // Check if continuous mode is enabled
        const continuousCheckbox = document.getElementById('continuous');
        if (continuousCheckbox && continuousCheckbox.checked) {
            // Wait a moment to show the solved maze, then generate a new one
            setTimeout(() => {
                if (!this.state.solving) {
                    this.generateNewMazeAndSolve();
                }
            }, 1500); // 1.5 second delay to appreciate the solution
        }
    }
    
    generateNewMazeAndSolve() {
        // Reset state and generate new maze
        this.state.reset();
        
        // Import and use the maze generator (we need to get this from app)
        // For now, we'll trigger this through the app's generate method
        const generateEvent = new CustomEvent('generateNewMaze');
        document.dispatchEvent(generateEvent);
        
        // Wait a bit for generation to complete, then solve
        setTimeout(() => {
            if (this.state.grid.length > 0) {
                this.solve();
            }
        }, 100);
    }

    initializePathfinding() {
        // Optimized heap with better scoring function
        this.openSet = new BinaryHeap(node => this.fScore.get(node) || Infinity);
        this.closedSet.clear();
        this.cameFrom.clear();
        this.gScore.clear();
        this.fScore.clear();
        
        const start = this.state.startCell;
        const end = this.state.endCell;
        
        this.gScore.set(start, 0);
        this.fScore.set(start, MazeUtils.optimizedHeuristic(start, end, start));
        this.openSet.push(start);
    }

    // Optimized A* step based on research paper improvements
    solvingStepOptimized() {
        if (this.openSet.size() === 0) {
            return { finished: true, path: [] };
        }

        const current = this.openSet.pop();
        this.nodeExpansions++;

        // Check if we reached the end
        if (current === this.state.endCell) {
            const finalPath = this.reconstructPathOptimized(current);
            return { finished: true, path: finalPath };
        }

        this.closedSet.add(current);

        // Get valid neighbors using optimized strategy
        const neighbors = this.getValidNeighborsOptimized(current);
        
        // Sort neighbors by heuristic to prioritize better directions
        neighbors.sort((a, b) => {
            const hA = MazeUtils.optimizedHeuristic(a, this.state.endCell, this.state.startCell);
            const hB = MazeUtils.optimizedHeuristic(b, this.state.endCell, this.state.startCell);
            return hA - hB;
        });
        
        for (const neighbor of neighbors) {
            this.totalComputations++;
            
            if (this.closedSet.has(neighbor)) continue;
            
            const tentativeGScore = this.gScore.get(current) + 1;
            const neighborGScore = this.gScore.get(neighbor) || Infinity;
            
            if (tentativeGScore < neighborGScore) {
                this.cameFrom.set(neighbor, current);
                this.gScore.set(neighbor, tentativeGScore);
                
                // Use optimized heuristic with direction bias
                const hScore = MazeUtils.optimizedHeuristic(neighbor, this.state.endCell, this.state.startCell);
                this.fScore.set(neighbor, tentativeGScore + hScore);
                
                if (!this.isInOpenSet(neighbor)) {
                    this.openSet.push(neighbor);
                } else {
                    this.openSet.rescoreElement(neighbor);
                }
            }
        }

        // Beam search optimization: limit open set size to prevent exploring too many false paths
        if (CONFIG.ASTAR.BEAM_SEARCH_WIDTH && this.openSet.size() > CONFIG.ASTAR.BEAM_SEARCH_WIDTH) {
            this.pruneOpenSet();
        }

        // Return current best path for visualization
        const visualPath = this.reconstructPathOptimized(current);
        return { finished: false, path: visualPath, currentNode: current };
    }

    getValidNeighborsOptimized(cell) {
        const neighbors = [];
        const { x, y } = cell;
        const { cols, rows, grid } = this.state;
        
        // Check each direction only if wall is open
        const directions = [
            { wall: 0, dx: 0, dy: -1 }, // top
            { wall: 1, dx: 1, dy: 0 },  // right
            { wall: 2, dx: 0, dy: 1 },  // bottom
            { wall: 3, dx: -1, dy: 0 }  // left
        ];
        
        for (const dir of directions) {
            if (!cell.walls[dir.wall]) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                    const neighborIndex = nx + ny * cols;
                    neighbors.push(grid[neighborIndex]);
                }
            }
        }
        
        return neighbors;
    }

    reconstructPathOptimized(current) {
        const path = [];
        let node = current;
        
        while (node) {
            path.push(node);
            node = this.cameFrom.get(node);
        }
        
        return path;
    }

    isInOpenSet(node) {
        return this.openSet.content.includes(node);
    }

    getOpenSetArray() {
        return this.openSet.content.slice();
    }

    pruneOpenSet() {
        // Beam search: keep only the most promising nodes
        const nodes = this.openSet.content.slice();
        nodes.sort((a, b) => (this.fScore.get(a) || Infinity) - (this.fScore.get(b) || Infinity));
        
        // Keep only the best nodes
        const keepNodes = nodes.slice(0, CONFIG.ASTAR.BEAM_SEARCH_WIDTH);
        
        // Rebuild the heap with only the best nodes
        this.openSet = new BinaryHeap(node => this.fScore.get(node) || Infinity);
        keepNodes.forEach(node => this.openSet.push(node));
    }

    calculateBatchSize() {
        // More conservative batch sizes to prevent rendering issues
        const speed = this.state.speed;
        if (speed >= 95) return 25;  // Reduced from 50
        if (speed >= 80) return 15;  // Reduced from 20
        if (speed >= 60) return 8;   // Reduced from 10
        if (speed >= 40) return 4;   // Reduced from 5
        if (speed >= 20) return 2;
        return 1;
    }

    calculateInterval() {
        const speed = this.state.speed;
        if (speed === CONFIG.ANIMATION.THRESHOLD_SPEED) {
            return CONFIG.ANIMATION.MIN_INTERVAL;
        }
        
        // Smoother speed scaling
        const normalizedSpeed = speed / 100;
        const interval = CONFIG.ANIMATION.MAX_INTERVAL * (1 - normalizedSpeed);
        return Math.max(CONFIG.ANIMATION.MIN_INTERVAL + 4, interval);
    }

    splitPathByConfidence(fullPath, currentNode) {
        if (!fullPath || fullPath.length === 0) {
            return { confirmedPath: [], explorationPath: [] };
        }

        // More stable confidence calculation
        const confirmedPath = [];
        const explorationPath = [];
        
        // Use a more stable split calculation that doesn't jump around
        const splitIndex = this.getStableSplitIndex(fullPath, currentNode);
        
        // Everything before split point is "confirmed" (orange)
        for (let i = fullPath.length - 1; i >= splitIndex; i--) {
            confirmedPath.push(fullPath[i]);
        }
        
        // Everything after split point is "exploration" (yellow)
        // Include the split point in both paths to ensure connection
        for (let i = splitIndex; i >= 0; i--) {
            explorationPath.push(fullPath[i]);
        }
        
        return { confirmedPath, explorationPath };
    }

    getStableSplitIndex(path, currentNode) {
        if (path.length <= 2) return Math.floor(path.length / 2);
        
        // Calculate a split based on path stability and progress toward goal
        const pathLength = path.length;
        const progressToGoal = this.calculateProgressToGoal(path);
        
        // Base split at around 60-70% of the path (more confident portion)
        let baseSplit = Math.floor(pathLength * 0.65);
        
        // Adjust based on how direct the path is toward the goal
        const directnessBonus = progressToGoal * 0.2; // Up to 20% more confident
        const adjustedSplit = Math.floor(baseSplit + (pathLength * directnessBonus));
        
        // Smooth the split changes to prevent jumping
        const smoothedSplit = this.smoothSplitIndex(adjustedSplit, pathLength);
        
        // Store for next iteration
        this.lastSplitIndex = smoothedSplit;
        
        return Math.max(1, Math.min(smoothedSplit, pathLength - 1));
    }

    calculateProgressToGoal(path) {
        if (path.length < 2) return 0;
        
        const start = path[path.length - 1]; // Start is at the end of reversed path
        const end = this.state.endCell;
        const current = path[0]; // Current is at beginning of reversed path
        
        // Calculate how much closer we are to the goal
        const initialDistance = MazeUtils.heuristic(start, end);
        const currentDistance = MazeUtils.heuristic(current, end);
        
        if (initialDistance === 0) return 1;
        
        const progress = Math.max(0, (initialDistance - currentDistance) / initialDistance);
        return Math.min(1, progress);
    }

    smoothSplitIndex(newSplit, pathLength) {
        // Prevent rapid changes in split point
        if (this.lastSplitIndex === 0) {
            return newSplit;
        }
        
        // Only allow gradual changes (max 10% of path length per step)
        const maxChange = Math.max(1, Math.floor(pathLength * 0.1));
        const difference = newSplit - this.lastSplitIndex;
        
        if (Math.abs(difference) <= maxChange) {
            return newSplit;
        }
        
        // Gradually move toward the new split point
        const direction = difference > 0 ? 1 : -1;
        return this.lastSplitIndex + (direction * maxChange);
    }

}
