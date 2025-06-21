import { Building } from './Building.js';

export class ConstructionYard extends Building {
    constructor(x, y) {
        const config = {
            gridWidth: 3,
            gridHeight: 3,
            maxHealth: 200,
            constructionTime: 15,
            cost: { spice: 100 },
            provides: ['construction'],
            prerequisites: []
        };
        
        super(x, y, 'ConstructionYard', config);
        
        // Construction yard specific properties
        this.buildQueue = [];
        this.maxQueueSize = 5;
        this.constructionRange = Infinity; // unlimited range
        
        // Start as the main base - could be pre-constructed or not
        this.isMainBase = true;
    }
    
    updateActive(deltaTime, gameState) {
        super.updateActive(deltaTime, gameState);
        
        if (this.isActive) {
            this.processBuildQueue(deltaTime, gameState);
        }
    }
    
    processBuildQueue(deltaTime, gameState) {
        // Process any queued construction orders
        if (this.buildQueue.length > 0) {
            const currentOrder = this.buildQueue[0];
            
            // Check if we can afford the construction
            if (this.canAffordConstruction(currentOrder, gameState)) {
                // Deduct resources and start construction
                this.deductResources(currentOrder, gameState);
                this.startConstruction(currentOrder, gameState);
                this.buildQueue.shift(); // Remove from queue
            }
        }
    }
    
    canAffordConstruction(buildingConfig, gameState) {
        if (!gameState.depot) return false;
        
        const cost = buildingConfig.cost;
        const requiredSpice = cost.spice || 0;
        
        // Calculate total available spice (depot + refineries)
        let totalAvailableSpice = gameState.depot.spiceStored;
        
        // Add spice from refineries
        if (gameState.buildings) {
            for (const building of gameState.buildings) {
                if (building.type === 'SpiceRefinery' && building.spiceStorage) {
                    totalAvailableSpice += building.spiceStorage;
                }
            }
        }
        
        return totalAvailableSpice >= requiredSpice;
    }
    
    deductResources(buildingConfig, gameState) {
        if (!gameState.depot) return;
        
        const cost = buildingConfig.cost;
        let remainingCost = cost.spice || 0;
        
        // First, try to deduct from depot
        const fromDepot = Math.min(remainingCost, gameState.depot.spiceStored);
        if (fromDepot > 0) {
            gameState.depot.getSpice(fromDepot);
            remainingCost -= fromDepot;
        }
        
        // If still need more spice, deduct from refineries
        if (remainingCost > 0 && gameState.buildings) {
            for (const building of gameState.buildings) {
                if (building.type === 'SpiceRefinery' && building.spiceStorage > 0 && remainingCost > 0) {
                    const fromRefinery = Math.min(remainingCost, building.spiceStorage);
                    building.getSpice(fromRefinery);
                    remainingCost -= fromRefinery;
                    console.log(`💰 Deducted ${fromRefinery} spice from refinery for construction`);
                }
            }
        }
        
        if (remainingCost > 0) {
            console.warn(`⚠️ Could not deduct full cost: ${remainingCost} spice remaining`);
        }
    }
    
    startConstruction(buildingConfig, gameState) {
        // Create the building instance and add it to the game
        const BuildingClass = buildingConfig.class;
        const building = new BuildingClass(
            buildingConfig.gridX * 32,
            buildingConfig.gridY * 32
        );
        
        gameState.buildings.push(building);
        console.log(`🏗️ Started construction of ${building.type} at (${building.gridX}, ${building.gridY})`);
    }
    
    // Add a building to the construction queue
    queueConstruction(buildingType, gridX, gridY, BuildingClass) {
        if (this.buildQueue.length >= this.maxQueueSize) {
            console.log('❌ Build queue is full');
            return false;
        }
        
        // Create a construction order
        const buildOrder = {
            type: buildingType,
            gridX: gridX,
            gridY: gridY,
            class: BuildingClass,
            cost: BuildingClass.getCost ? BuildingClass.getCost() : { spice: 50 },
            queueTime: Date.now()
        };
        
        this.buildQueue.push(buildOrder);
        console.log(`📋 Queued construction of ${buildingType} at (${gridX}, ${gridY})`);
        return true;
    }
    
    // Check if a position is within construction range
    isInConstructionRange(gridX, gridY) {
        // With unlimited range, always return true
        if (this.constructionRange === Infinity) {
            return true;
        }
        
        const dx = Math.abs(gridX - this.gridX);
        const dy = Math.abs(gridY - this.gridY);
        const distance = Math.max(dx, dy);
        return distance <= this.constructionRange;
    }
    
    // Cancel a queued construction order
    cancelConstruction(index) {
        if (index >= 0 && index < this.buildQueue.length) {
            const cancelled = this.buildQueue.splice(index, 1)[0];
            console.log(`❌ Cancelled construction of ${cancelled.type}`);
            return cancelled;
        }
        return null;
    }
    
    // Get construction yard information
    getConstructionInfo() {
        return {
            ...this.getInfo(),
            buildQueue: this.buildQueue.map(order => ({
                type: order.type,
                position: { x: order.gridX, y: order.gridY },
                cost: order.cost,
                queueTime: order.queueTime
            })),
            queueLength: this.buildQueue.length,
            maxQueueSize: this.maxQueueSize,
            constructionRange: this.constructionRange,
            isMainBase: this.isMainBase
        };
    }
    
    // Static method to get construction cost
    static getCost() {
        return { spice: 100 };
    }
} 