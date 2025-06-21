import { Building } from './Building.js';

export class SpiceRefinery extends Building {
    constructor(x, y) {
        const config = {
            gridWidth: 2,
            gridHeight: 2,
            maxHealth: 150,
            constructionTime: 12,
            cost: { spice: 80 },
            provides: ['spice_processing'],
            prerequisites: ['construction']
        };
        
        super(x, y, 'SpiceRefinery', config);
        
        // Refinery specific properties
        this.spiceStorage = 0;
        this.maxSpiceStorage = 500;
        this.processingRate = 1.2; // multiplier for spice efficiency
        this.processingRange = 5; // grid tiles
        
        // Processing tracking
        this.totalProcessed = 0;
        this.lastProcessTime = 0;
        this.processingAnimation = 0;
    }
    
    updateActive(deltaTime, gameState) {
        super.updateActive(deltaTime, gameState);
        
        if (this.isActive) {
            this.processSpice(deltaTime, gameState);
            this.updateAnimation(deltaTime);
        }
    }
    
    updateAnimation(deltaTime) {
        // Fade processing animation
        if (this.processingAnimation > 0) {
            this.processingAnimation = Math.max(0, this.processingAnimation - deltaTime * 2);
        }
    }
    
    processSpice(deltaTime, gameState) {
        // Auto-transfer excess spice to depot if available
        if (this.spiceStorage > this.maxSpiceStorage * 0.8 && gameState.depot) {
            const transferAmount = Math.min(this.spiceStorage * 0.1, 10); // Transfer 10% or 10 units max per call
            const transferred = gameState.depot.addSpice(transferAmount);
            this.spiceStorage -= transferred;
        }
    }
    
    canProcessHarvester(harvester) {
        // Check if harvester is in range and has cargo
        if (harvester.currentCargo <= 0 || harvester.state !== 'returning') {
            return false;
        }
        
        const dx = Math.abs(harvester.x / 32 - this.gridX);
        const dy = Math.abs(harvester.y / 32 - this.gridY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.processingRange && this.spiceStorage < this.maxSpiceStorage;
    }
    
    processHarvesterCargo(harvester) {
        if (harvester.currentCargo <= 0) return 0;
        
        // Apply processing efficiency bonus
        const processedAmount = harvester.currentCargo * this.processingRate;
        const actualStored = this.addSpice(processedAmount);
        
        // Clear harvester cargo
        harvester.currentCargo = 0;
        
        // Trigger processing animation
        this.processingAnimation = 1.0;
        this.lastProcessTime = Date.now();
        
        console.log(`⚙️ Refinery processed ${Math.round(actualStored)} spice (${Math.round(this.processingRate * 100)}% efficiency)`);
        
        return actualStored;
    }
    
    addSpice(amount) {
        if (amount <= 0) return 0;
        
        const spaceAvailable = this.maxSpiceStorage - this.spiceStorage;
        const actualAmount = Math.min(amount, spaceAvailable);
        
        this.spiceStorage += actualAmount;
        this.totalProcessed += actualAmount;
        
        return actualAmount;
    }
    
    transferToDepot(depot) {
        if (!depot || this.spiceStorage <= 0) return 0;
        
        const transferAmount = depot.addSpice(this.spiceStorage);
        this.spiceStorage -= transferAmount;
        
        console.log(`📦 Refinery transferred ${Math.round(transferAmount)} spice to depot`);
        return transferAmount;
    }
    
    getSpice(amount) {
        if (amount <= 0) return 0;
        
        const actualAmount = Math.min(amount, this.spiceStorage);
        this.spiceStorage -= actualAmount;
        
        return actualAmount;
    }
    
    getStoragePercentage() {
        return this.maxSpiceStorage > 0 ? (this.spiceStorage / this.maxSpiceStorage) * 100 : 0;
    }
    
    // Check if harvester should go to this refinery instead of depot
    isMoreEfficient(depot, harvester) {
        if (!this.isActive || !this.isConstructed) return false;
        
        // Calculate distance to this refinery vs depot
        const refineryDistance = this.getDistanceToHarvester(harvester);
        const depotDistance = depot ? depot.getDistanceToHarvester(harvester) : Infinity;
        
        // Prefer refinery if it's closer and has storage space
        return refineryDistance < depotDistance && this.spiceStorage < this.maxSpiceStorage * 0.9;
    }
    
    getDistanceToHarvester(harvester) {
        const dx = harvester.x - (this.x + this.width / 2);
        const dy = harvester.y - (this.y + this.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Override getInfo to include refinery-specific data
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            storage: {
                current: Math.round(this.spiceStorage),
                max: this.maxSpiceStorage,
                percentage: Math.round(this.getStoragePercentage())
            },
            processing: {
                rate: this.processingRate,
                range: this.processingRange,
                totalProcessed: Math.round(this.totalProcessed),
                lastProcessTime: this.lastProcessTime
            }
        };
    }
    
    // Static method to get construction cost
    static getCost() {
        return { spice: 80 };
    }
} 