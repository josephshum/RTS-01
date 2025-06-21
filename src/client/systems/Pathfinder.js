export class Pathfinder {
    constructor(terrain, tileSize = 32) {
        this.terrain = terrain;
        this.tileSize = tileSize;
        this.mapWidth = terrain.length;
        this.mapHeight = terrain[0].length;
    }
    
    // A* pathfinding implementation
    findPath(startX, startY, endX, endY) {
        // Validate coordinates
        if (!this.isValidTile(startX, startY) || !this.isValidTile(endX, endY)) {
            return [];
        }
        
        // If start and end are the same, return empty path
        if (startX === endX && startY === endY) {
            return [];
        }
        
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        
        // Cost from start to current node
        const gScore = new Map();
        // Estimated total cost from start to goal through current node
        const fScore = new Map();
        
        const startKey = `${startX},${startY}`;
        const endKey = `${endX},${endY}`;
        
        openSet.push({ x: startX, y: startY, key: startKey });
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startX, startY, endX, endY));
        
        while (openSet.length > 0) {
            // Find node with lowest fScore
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(openSet[i].key) < fScore.get(current.key)) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            // Remove current from openSet
            openSet.splice(currentIndex, 1);
            closedSet.add(current.key);
            
            // Check if we reached the goal
            if (current.key === endKey) {
                return this.reconstructPath(cameFrom, current);
            }
            
            // Check all neighbors
            const neighbors = this.getNeighbors(current.x, current.y);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) {
                    continue;
                }
                
                const tentativeGScore = gScore.get(current.key) + this.getMoveCost(current, neighbor);
                
                const neighborInOpenSet = openSet.find(node => node.key === neighborKey);
                
                if (!neighborInOpenSet) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(neighborKey)) {
                    continue;
                }
                
                // This path to neighbor is better than any previous one
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, gScore.get(neighborKey) + this.heuristic(neighbor.x, neighbor.y, endX, endY));
            }
        }
        
        // No path found, return direct path as fallback
        return [{ x: endX, y: endY }];
    }
    
    // Get all valid neighbors of a tile
    getNeighbors(x, y) {
        const neighbors = [];
        
        // 8-directional movement (including diagonals)
        const directions = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 },                    { x: 1, y: 0 },
            { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
        ];
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (this.isValidTile(newX, newY) && this.isWalkable(newX, newY)) {
                neighbors.push({
                    x: newX,
                    y: newY,
                    key: `${newX},${newY}`
                });
            }
        }
        
        return neighbors;
    }
    
    // Check if a tile coordinate is valid
    isValidTile(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }
    
    // Check if a tile is walkable (not blocked by obstacles)
    isWalkable(x, y) {
        if (!this.isValidTile(x, y)) {
            return false;
        }
        
        const tile = this.terrain[x][y];
        
        // Most terrain types are walkable, only some rocks might block
        // For now, let's make most tiles walkable for harvesters
        switch (tile.type) {
            case 'rock':
                // Large rock formations might be impassable
                return Math.random() > 0.3; // 70% of rocks are passable
            case 'sand':
            case 'darkSand':
            case 'dune':
            case 'spice':
            default:
                return true;
        }
    }
    
    // Calculate movement cost between two adjacent tiles
    getMoveCost(from, to) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        
        // Diagonal movement costs more
        const isDiagonal = dx === 1 && dy === 1;
        let baseCost = isDiagonal ? 1.414 : 1.0; // √2 for diagonal
        
        // Terrain-based cost modifiers
        const toTile = this.terrain[to.x][to.y];
        switch (toTile.type) {
            case 'sand':
                baseCost *= 1.0; // Normal movement
                break;
            case 'darkSand':
                baseCost *= 1.1; // Slightly slower
                break;
            case 'dune':
                baseCost *= 1.3; // Harder to traverse
                break;
            case 'rock':
                baseCost *= 1.5; // Slow movement around rocks
                break;
            case 'spice':
                baseCost *= 0.9; // Spice areas are easier to move through
                break;
            default:
                baseCost *= 1.0;
        }
        
        return baseCost;
    }
    
    // Heuristic function for A* (Manhattan distance with diagonal adjustment)
    heuristic(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        
        // Octile distance (better for 8-directional movement)
        return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
    }
    
    // Reconstruct the path from the came_from map
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = current.key;
        
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = current.key;
        }
        
        // Remove the starting position from the path
        if (path.length > 1) {
            path.shift();
        }
        
        return path;
    }
    
    // Smooth the path to reduce unnecessary waypoints
    smoothPath(path) {
        if (path.length <= 2) {
            return path;
        }
        
        const smoothedPath = [path[0]];
        
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];
            
            // Check if we can skip the current waypoint by going directly from prev to next
            if (!this.hasLineOfSight(prev.x, prev.y, next.x, next.y)) {
                smoothedPath.push(current);
            }
        }
        
        smoothedPath.push(path[path.length - 1]);
        return smoothedPath;
    }
    
    // Check if there's a clear line of sight between two points
    hasLineOfSight(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const steps = Math.max(dx, dy);
        
        if (steps === 0) return true;
        
        const stepX = (x2 - x1) / steps;
        const stepY = (y2 - y1) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const checkX = Math.round(x1 + stepX * i);
            const checkY = Math.round(y1 + stepY * i);
            
            if (!this.isWalkable(checkX, checkY)) {
                return false;
            }
        }
        
        return true;
    }
    
    // Debug method to visualize pathfinding data
    getPathfindingInfo(x, y) {
        if (!this.isValidTile(x, y)) {
            return { walkable: false, cost: Infinity };
        }
        
        const tile = this.terrain[x][y];
        return {
            walkable: this.isWalkable(x, y),
            type: tile.type,
            cost: this.getMoveCost({ x: x, y: y }, { x: x, y: y })
        };
    }
} 