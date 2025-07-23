import { CONFIG } from './config.js';

// Cell Class with Enhanced Methods
export class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = [true, true, true, true]; // top, right, bottom, left
        this.visited = false;
        // A* algorithm properties
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.previous = null;
    }

    draw(ctx, cellSize) {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        const lineWidth = Math.max(1, cellSize * 0.05);
        
        ctx.strokeStyle = CONFIG.COLORS.WALL;
        ctx.lineWidth = lineWidth;
        
        // Draw walls efficiently
        ctx.beginPath();
        if (this.walls[0]) { // top
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellSize, y);
        }
        if (this.walls[1]) { // right
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x + cellSize, y + cellSize);
        }
        if (this.walls[2]) { // bottom
            ctx.moveTo(x + cellSize, y + cellSize);
            ctx.lineTo(x, y + cellSize);
        }
        if (this.walls[3]) { // left
            ctx.moveTo(x, y + cellSize);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    getWallCount() {
        return this.walls.filter(wall => wall).length;
    }

    isDeadEnd() {
        return this.getWallCount() === 3;
    }
}
