import { CONFIG } from './config.js';

export class MazeUtils {
    static getIndex(x, y, cols, rows) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
        return x + y * cols;
    }

    static getAllNeighbors(cell, grid, cols, rows) {
        const { x, y } = cell;
        return [
            grid[MazeUtils.getIndex(x, y - 1, cols, rows)], // top
            grid[MazeUtils.getIndex(x + 1, y, cols, rows)], // right
            grid[MazeUtils.getIndex(x, y + 1, cols, rows)], // bottom
            grid[MazeUtils.getIndex(x - 1, y, cols, rows)]  // left
        ].filter(neighbor => neighbor !== undefined);
    }

    static canRemoveWall(a, b) {
        if (!a || !b) return false;
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    static removeWalls(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        
        if (dx === 1) { // b is left of a
            a.walls[3] = false;
            b.walls[1] = false;
        } else if (dx === -1) { // b is right of a
            a.walls[1] = false;
            b.walls[3] = false;
        }
        if (dy === 1) { // b is above a
            a.walls[0] = false;
            b.walls[2] = false;
        } else if (dy === -1) { // b is below a
            a.walls[2] = false;
            b.walls[0] = false;
        }
    }

    static heuristic(a, b) {
        // Manhattan distance - optimal for grid mazes with no diagonals
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    static euclideanHeuristic(a, b) {
        // Euclidean distance - optimal when diagonal movement is allowed
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static chebyshevHeuristic(a, b) {
        // Chebyshev distance - optimal when diagonal moves cost same as cardinal
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return Math.max(dx, dy);
    }

    static octileHeuristic(a, b) {
        // Octile distance - for 8-directional movement with different costs
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
    }

    static diagonalHeuristic(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
    }

    static tieBreakingHeuristic(a, b, start) {
        const h = MazeUtils.heuristic(a, b);
        
        if (CONFIG.ASTAR.USE_TIE_BREAKING) {
            const dx1 = a.x - b.x;
            const dy1 = a.y - b.y;
            const dx2 = start.x - b.x;
            const dy2 = start.y - b.y;
            const cross = Math.abs(dx1 * dy2 - dx2 * dy1);
            return h + cross * CONFIG.ASTAR.TIE_BREAKING_WEIGHT;
        }
        
        return h;
    }

    static optimizedHeuristic(current, goal, start) {
        let baseHeuristic = MazeUtils.heuristic(current, goal);
        
        if (CONFIG.ASTAR.USE_TIE_BREAKING) {
            const dx1 = current.x - goal.x;
            const dy1 = current.y - goal.y;
            const dx2 = start.x - goal.x;
            const dy2 = start.y - goal.y;
            const cross = Math.abs(dx1 * dy2 - dx2 * dy1);
            baseHeuristic += cross * CONFIG.ASTAR.TIE_BREAKING_WEIGHT;
        }
        
        return baseHeuristic;
    }

    static isNearGoal(current, goal, threshold = CONFIG.ASTAR.EARLY_EXIT_THRESHOLD) {
        const distance = MazeUtils.heuristic(current, goal);
        const totalDistance = MazeUtils.heuristic(goal, { x: 0, y: 0 });
        return distance / totalDistance < threshold;
    }
}
