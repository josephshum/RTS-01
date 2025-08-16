import { Building } from './Building.js';
import { Infantry } from './Infantry.js';

export class Barracks extends Building {
    constructor(x, y) {
        const config = {
            gridWidth: 2,
            gridHeight: 2,
            maxHealth: 150,
            constructionTime: 15,
            cost: { spice: 120 },
            provides: ['unit_production'],
            prerequisites: ['construction']
        };
        
        super(x, y, 'Barracks', config);
        
        // Unit production properties
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;
        this.maxQueueSize = 5;
        
        // Available units this barracks can produce
        this.availableUnits = [
            {
                type: 'Infantry',
                cost: { spice: 30 },
                productionTime: 8, // seconds
                description: 'Basic infantry unit'
            },
            {
                type: 'Scout',
                cost: { spice: 20 },
                productionTime: 5,
                description: 'Fast reconnaissance unit'
            },
            {
                type: 'Heavy Infantry',
                cost: { spice: 50 },
                productionTime: 12,
                description: 'Armored infantry unit'
            }
        ];
        
        // Production state
        this.isProducing = false;
        this.lastProductionTime = Date.now();
        
        console.log(`🏭 Barracks created at (${this.gridX}, ${this.gridY})`);
    }

    updateActive(deltaTime, gameState) {
        super.updateActive(deltaTime, gameState);
        
        if (this.isActive && this.isConstructed) {
            this.processProductionQueue(deltaTime, gameState);
        }
    }

    processProductionQueue(deltaTime, gameState) {
        // Start next production if not currently producing
        if (!this.isProducing && this.productionQueue.length > 0) {
            this.startNextProduction(gameState);
        }
        
        // Update current production
        if (this.isProducing && this.currentProduction) {
            this.productionProgress += deltaTime;
            
            // Check if production is complete
            if (this.productionProgress >= this.currentProduction.productionTime) {
                this.completeProduction(gameState);
            }
        }
    }

    startNextProduction(gameState) {
        if (this.productionQueue.length === 0) return;
        
        const unitOrder = this.productionQueue.shift();
        this.currentProduction = unitOrder;
        this.productionProgress = 0;
        this.isProducing = true;
        
        console.log(`🔨 Barracks started producing ${unitOrder.type}`);
    }

    completeProduction(gameState) {
        if (!this.currentProduction) return;
        
        // Spawn the unit near the barracks
        const spawnX = this.x + this.width + 10; // Spawn to the right of barracks
        const spawnY = this.y + this.height / 2; // Spawn at center height
        
        const unit = this.spawnUnit(this.currentProduction.type, spawnX, spawnY);
        
        if (unit) {
            // Ensure playerUnits array exists
            if (!gameState.playerUnits) {
                gameState.playerUnits = [];
                console.log('⚠️ Created playerUnits array');
            }
            
            gameState.playerUnits.push(unit);
            console.log(`✅ Barracks completed production: ${this.currentProduction.type} - Total units: ${gameState.playerUnits.length}`);
            console.log(`📍 Unit spawned at (${spawnX}, ${spawnY})`);
        } else {
            console.error('❌ Failed to spawn unit');
        }
        
        // Reset production state
        this.currentProduction = null;
        this.productionProgress = 0;
        this.isProducing = false;
    }

    spawnUnit(unitType, x, y) {
        let unit = null;
        
        switch (unitType) {
            case 'Infantry':
                unit = new Infantry(x, y, 1); // Player ID = 1
                break;
            case 'Scout':
                // For now, spawn as Infantry (can create Scout class later)
                unit = new Infantry(x, y, 1);
                unit.type = 'Scout';
                unit.speed = 80; // Faster
                unit.maxHealth = 30; // Less health
                unit.currentHealth = 30;
                break;
            case 'Heavy Infantry':
                unit = new Infantry(x, y, 1);
                unit.type = 'Heavy Infantry';
                unit.speed = 40; // Slower
                unit.maxHealth = 80; // More health
                unit.currentHealth = 80;
                unit.damage = 25; // More damage
                break;
            default:
                console.warn(`❌ Unknown unit type: ${unitType}`);
                return null;
        }
        
        if (unit) {
            console.log(`👥 Unit spawned: ${unitType} at (${x}, ${y})`);
        }
        
        return unit;
    }

    queueUnitProduction(unitType, gameState) {
        // Check if queue is full
        if (this.productionQueue.length >= this.maxQueueSize) {
            console.log('❌ Production queue is full');
            return false;
        }
        
        // Find unit configuration
        const unitConfig = this.availableUnits.find(unit => unit.type === unitType);
        if (!unitConfig) {
            console.log(`❌ Unknown unit type: ${unitType}`);
            return false;
        }
        
        // Check if player can afford the unit
        if (!this.canAffordUnit(unitConfig, gameState)) {
            console.log(`❌ Cannot afford ${unitType} - Need ${unitConfig.cost.spice} spice`);
            return false;
        }
        
        // Deduct resources
        this.deductResources(unitConfig, gameState);
        
        // Add to production queue
        this.productionQueue.push({
            type: unitType,
            cost: unitConfig.cost,
            productionTime: unitConfig.productionTime,
            queuedAt: Date.now()
        });
        
        console.log(`📋 Queued ${unitType} for production (Queue: ${this.productionQueue.length}/${this.maxQueueSize})`);
        return true;
    }

    canAffordUnit(unitConfig, gameState) {
        if (!gameState.depot) return false;
        
        const requiredSpice = unitConfig.cost.spice || 0;
        const availableSpice = gameState.depot.spiceStored || 0;
        
        return availableSpice >= requiredSpice;
    }

    deductResources(unitConfig, gameState) {
        if (!gameState.depot) return;
        
        const cost = unitConfig.cost.spice || 0;
        gameState.depot.spiceStored = Math.max(0, gameState.depot.spiceStored - cost);
        
        console.log(`💰 Deducted ${cost} spice for unit production`);
    }

    getProductionInfo() {
        return {
            isProducing: this.isProducing,
            currentProduction: this.currentProduction,
            productionProgress: this.productionProgress,
            productionPercentage: this.currentProduction ? 
                Math.round((this.productionProgress / this.currentProduction.productionTime) * 100) : 0,
            queueLength: this.productionQueue.length,
            maxQueueSize: this.maxQueueSize,
            availableUnits: this.availableUnits
        };
    }

    getInfo() {
        const baseInfo = super.getInfo();
        const productionInfo = this.getProductionInfo();
        
        return {
            ...baseInfo,
            production: productionInfo,
            description: 'Produces infantry units'
        };
    }

    // Static method to get construction cost
    static getCost() {
        return { spice: 120 };
    }
}
