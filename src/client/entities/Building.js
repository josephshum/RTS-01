export class Building {
    constructor(x, y, type, config) {
        this.id = `building_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.x = x;
        this.y = y;
        
        // Grid positioning (buildings snap to grid)
        this.gridX = Math.floor(x / 32);
        this.gridY = Math.floor(y / 32);
        this.gridWidth = config.gridWidth || 2;
        this.gridHeight = config.gridHeight || 2;
        
        // Building properties
        this.width = this.gridWidth * 32;
        this.height = this.gridHeight * 32;
        this.maxHealth = config.maxHealth || 100;
        this.currentHealth = this.maxHealth;
        
        // Construction
        this.isConstructed = false;
        this.constructionProgress = 0;
        this.constructionTime = config.constructionTime || 10; // seconds
        this.constructionCost = config.cost || { spice: 50 };
        
        // Status
        this.isActive = false;
        this.isPowered = true; // For future power system
        this.lastActivity = Date.now();
        
        // Visual
        this.animationFrame = 0;
        this.isSelected = false;
        this.selectionTime = 0;
        
        // Prerequisites and dependencies
        this.prerequisites = config.prerequisites || [];
        this.provides = config.provides || [];
        
        // Building-specific properties
        this.config = config;
        
        // Combat properties for enhanced combat system
        this.armorType = this.getArmorType();
    }
    
    update(deltaTime, gameState) {
        this.animationFrame += deltaTime * 2;
        
        if (this.isSelected) {
            this.selectionTime += deltaTime;
        }
        
        if (!this.isConstructed) {
            this.updateConstruction(deltaTime, gameState);
        } else {
            this.updateActive(deltaTime, gameState);
        }
    }
    
    updateConstruction(deltaTime, gameState) {
        if (this.constructionProgress < 1.0) {
            const constructionSpeed = 1.0 / this.constructionTime; // progress per second
            this.constructionProgress = Math.min(1.0, this.constructionProgress + constructionSpeed * deltaTime);
            
            if (this.constructionProgress >= 1.0) {
                this.completeConstruction();
            }
        }
    }
    
    updateActive(deltaTime, gameState) {
        // Override in subclasses for building-specific behavior
        this.isActive = this.isPowered && this.currentHealth > 0;
    }
    
    completeConstruction() {
        this.isConstructed = true;
        this.isActive = true;
        this.constructionProgress = 1.0;
        console.log(`🏗️ ${this.type} construction completed at (${this.gridX}, ${this.gridY})`);
    }
    
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0 && this.isConstructed) {
            this.destroy();
        }
        
        return this.currentHealth <= 0;
    }
    
    repair(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
    
    destroy() {
        this.isActive = false;
        this.isConstructed = false;
        console.log(`💥 ${this.type} destroyed at (${this.gridX}, ${this.gridY})`);
    }
    
    // Grid and positioning
    getGridBounds() {
        return {
            left: this.gridX,
            right: this.gridX + this.gridWidth - 1,
            top: this.gridY,
            bottom: this.gridY + this.gridHeight - 1
        };
    }
    
    getWorldBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
    
    contains(x, y) {
        const bounds = this.getWorldBounds();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }
    
    // Utility methods
    getHealthPercentage() {
        return this.maxHealth > 0 ? (this.currentHealth / this.maxHealth) * 100 : 0;
    }
    
    getConstructionPercentage() {
        return this.constructionProgress * 100;
    }
    
    getStatusColor() {
        if (!this.isConstructed) {
            return '#FFFF00'; // Yellow - under construction
        } else if (!this.isActive) {
            return '#FF0000'; // Red - inactive/damaged
        } else {
            return '#00FF00'; // Green - active
        }
    }
    
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            position: { x: this.gridX, y: this.gridY },
            size: { width: this.gridWidth, height: this.gridHeight },
            health: {
                current: Math.round(this.currentHealth),
                max: this.maxHealth,
                percentage: Math.round(this.getHealthPercentage())
            },
            construction: {
                isConstructed: this.isConstructed,
                progress: Math.round(this.getConstructionPercentage())
            },
            status: {
                isActive: this.isActive,
                isPowered: this.isPowered
            },
            cost: this.constructionCost
        };
    }
    
    // Check if this building can be placed at the given position
    static canPlace(gridX, gridY, gridWidth, gridHeight, existingBuildings, terrain) {
        // Check bounds
        if (gridX < 0 || gridY < 0) return false;
        
        // Check for overlaps with existing buildings
        for (const building of existingBuildings) {
            const buildingBounds = building.getGridBounds();
            
            // Check if rectangles overlap
            if (!(gridX + gridWidth - 1 < buildingBounds.left ||
                  gridX > buildingBounds.right ||
                  gridY + gridHeight - 1 < buildingBounds.top ||
                  gridY > buildingBounds.bottom)) {
                return false; // Overlap detected
            }
        }
        
        // Check terrain suitability (optional)
        for (let x = gridX; x < gridX + gridWidth; x++) {
            for (let y = gridY; y < gridY + gridHeight; y++) {
                if (terrain && terrain[x] && terrain[x][y]) {
                    const tile = terrain[x][y];
                    // Some terrain types might not be suitable for building
                    if (tile.type === 'spice') {
                        return false; // Can't build on spice deposits
                    }
                }
            }
        }
        
        return true;
    }
    
    // Get armor type for buildings based on their type
    getArmorType() {
        switch (this.type) {
            case 'GunTurret': return 'medium';        // Defensive structures
            case 'SpiceRefinery': return 'heavy';     // Industrial buildings are heavily armored
            case 'ConstructionYard': return 'heavy';  // Command centers are heavily protected
            case 'Depot': return 'medium';            // Storage buildings
            default: return 'medium';                 // Default building armor
        }
    }
} 