import { CONFIG } from './config.js';

export class MazeRenderer {
    constructor(canvas, ctx, state) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.state = state;
        this.imageData = null;
        this.lastFrameTime = 0;
        this.frameSkipThreshold = 16; // Target 60fps
    }

    draw(openSet = [], closedSet = [], path = []) {
        // Frame rate throttling for smooth animation, but not for instant solving
        const currentTime = performance.now();
        const isInstantSolve = this.state.speed === CONFIG.ANIMATION.THRESHOLD_SPEED;
        
        if (!isInstantSolve && currentTime - this.lastFrameTime < this.frameSkipThreshold) {
            return;
        }
        this.lastFrameTime = currentTime;

        // Use requestAnimationFrame for smoother rendering, except for instant solve
        const renderFunction = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw maze walls with optimized batching
            this.drawWallsBatched();
            
            // Draw algorithm visualization
            this.drawCellSets(openSet, closedSet, path);
            
            // Draw start and end points
            this.drawStartAndEnd();
        };

        if (isInstantSolve) {
            // Render immediately for instant solve
            renderFunction();
        } else {
            // Use requestAnimationFrame for smooth animation
            requestAnimationFrame(renderFunction);
        }
    }

    drawWallsBatched() {
        const cellSize = this.state.cellSize;
        const lineWidth = Math.max(1, cellSize * 0.05);
        
        this.ctx.strokeStyle = CONFIG.COLORS.WALL;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        
        // Batch all wall drawing operations
        this.state.grid.forEach(cell => {
            const x = cell.x * cellSize;
            const y = cell.y * cellSize;
            
            if (cell.walls[0]) { // top
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + cellSize, y);
            }
            if (cell.walls[1]) { // right
                this.ctx.moveTo(x + cellSize, y);
                this.ctx.lineTo(x + cellSize, y + cellSize);
            }
            if (cell.walls[2]) { // bottom
                this.ctx.moveTo(x + cellSize, y + cellSize);
                this.ctx.lineTo(x, y + cellSize);
            }
            if (cell.walls[3]) { // left
                this.ctx.moveTo(x, y + cellSize);
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
    }

    drawCellSets(openSet, closedSet, path) {
        // Draw in order: closed set, open set, path (so path is on top)
        // All use + symbols but with different colors
        this.drawCellLines(closedSet, CONFIG.COLORS.CLOSED_SET, 'cross');
        this.drawCellLines(openSet, CONFIG.COLORS.OPEN_SET, 'cross');
        this.drawCellLines(path, CONFIG.COLORS.PATH_CURRENT, 'center');
    }

    drawCellLines(cells, color, lineType) {
        if (cells.length === 0 || color === '#00000000') return;
        
        const cellSize = this.state.cellSize;
        const lineWidth = Math.max(2, cellSize * 0.1);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        
        cells.forEach(cell => {
            const x = cell.x * cellSize;
            const y = cell.y * cellSize;
            const centerX = x + cellSize / 2;
            const centerY = y + cellSize / 2;
            
            switch (lineType) {
                case 'cross':
                    // Draw + symbol with padding (used for both open and closed sets)
                    const crossPadding = cellSize * 0.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, y + crossPadding);
                    this.ctx.lineTo(centerX, y + cellSize - crossPadding);
                    this.ctx.moveTo(x + crossPadding, centerY);
                    this.ctx.lineTo(x + cellSize - crossPadding, centerY);
                    this.ctx.stroke();
                    break;
                    
                case 'center':
                    // Draw L-shape or straight line for path (no padding)
                    this.drawPathLine(cell, centerX, centerY, cellSize, 0, cells);
                    break;
            }
        });
    }

    drawPathLine(cell, centerX, centerY, cellSize, padding, pathArray) {
        // Find this cell's position in the current path array
        const cellIndex = pathArray.findIndex(pathCell => pathCell.x === cell.x && pathCell.y === cell.y);
        
        if (cellIndex === -1) return; // Cell not in path
        
        this.ctx.beginPath();
        
        // Get connected cells (previous and next in the path direction)
        // Note: pathArray is in reverse order (end to start), so we flip the indices
        const prevCell = cellIndex < pathArray.length - 1 ? pathArray[cellIndex + 1] : null;
        const nextCell = cellIndex > 0 ? pathArray[cellIndex - 1] : null;
        
        // Calculate which segments to draw based on connections
        const segments = this.getPathSegments(cell, prevCell, nextCell, cellSize, padding);
        
        // If no segments (isolated cell), draw a dot
        if (segments.length === 0) {
            const dotSize = cellSize * 0.1;
            this.ctx.arc(centerX, centerY, dotSize, 0, 2 * Math.PI);
            this.ctx.fill();
        } else {
            // Draw all segments
            segments.forEach(segment => {
                this.ctx.moveTo(segment.startX, segment.startY);
                this.ctx.lineTo(segment.endX, segment.endY);
            });
        }
        
        this.ctx.stroke();
    }

    getPathSegments(cell, prevCell, nextCell, cellSize, padding) {
        const centerX = cell.x * cellSize + cellSize / 2;
        const centerY = cell.y * cellSize + cellSize / 2;
        const lineLength = cellSize / 2; // Full half-cell length (no padding reduction)
        const segments = [];
        
        // Define the four possible directions from center to edges
        const directions = {
            top: { x: centerX, y: centerY - lineLength },
            right: { x: centerX + lineLength, y: centerY },
            bottom: { x: centerX, y: centerY + lineLength },
            left: { x: centerX - lineLength, y: centerY }
        };
        
        // Determine which segments to "light up" based on connected cells
        if (prevCell) {
            const direction = this.getDirection(cell, prevCell);
            if (direction && directions[direction]) {
                segments.push({
                    startX: centerX,
                    startY: centerY,
                    endX: directions[direction].x,
                    endY: directions[direction].y
                });
            }
        }
        
        if (nextCell) {
            const direction = this.getDirection(cell, nextCell);
            if (direction && directions[direction]) {
                segments.push({
                    startX: centerX,
                    startY: centerY,
                    endX: directions[direction].x,
                    endY: directions[direction].y
                });
            }
        }
        
        return segments;
    }

    getDirection(fromCell, toCell) {
        const dx = toCell.x - fromCell.x;
        const dy = toCell.y - fromCell.y;
        
        if (dx === 1 && dy === 0) return 'right';
        if (dx === -1 && dy === 0) return 'left';
        if (dx === 0 && dy === 1) return 'bottom';
        if (dx === 0 && dy === -1) return 'top';
        
        return null; // Not adjacent
    }

    drawStartAndEnd() {
        if (this.state.startCell) {
            this.drawSpecialCell(this.state.startCell, CONFIG.COLORS.START, 'start');
        }
        if (this.state.endCell) {
            this.drawSpecialCell(this.state.endCell, CONFIG.COLORS.END, 'end');
        }
    }

    drawSpecialCell(cell, color, type) {
        const cellSize = this.state.cellSize;
        const x = cell.x * cellSize;
        const y = cell.y * cellSize;
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;
        
        // Small filled square for both start and end
        const squareSize = cellSize * 0.3; // Make it smaller
        const halfSize = squareSize / 2;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            centerX - halfSize, 
            centerY - halfSize, 
            squareSize, 
            squareSize
        );
    }

    drawFinalPath(path) {
        // Clear canvas and redraw everything with final path
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze walls
        this.drawWallsBatched();
        
        // Draw final path in orange
        this.drawCellLines(path, CONFIG.COLORS.PATH_CONFIRMED, 'center');
        
        // Draw start and end points
        this.drawStartAndEnd();
    }

    drawCleanSolution(path) {
        // Clear canvas and show only the solution path in orange
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze walls
        this.drawWallsBatched();
        
        // Draw only the solution path in bright orange
        this.drawCellLines(path, CONFIG.COLORS.PATH_CONFIRMED, 'center');
        
        // Draw start and end points
        this.drawStartAndEnd();
    }
}
