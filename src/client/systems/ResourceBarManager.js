export class ResourceBarManager {
    constructor() {
        this.spiceBar = document.getElementById('spice-bar');
        this.spiceAmount = document.getElementById('spice-amount');
        this.spiceCapacity = document.getElementById('spice-capacity');
        
        this.energyBar = document.getElementById('energy-bar');
        this.energyAmount = document.getElementById('energy-amount');
        this.energyCapacity = document.getElementById('energy-capacity');
        
        this.populationBar = document.getElementById('population-bar');
        this.populationAmount = document.getElementById('population-amount');
        this.populationCapacity = document.getElementById('population-capacity');
        
        // Initialize with default values
        this.updateSpice(0, 1000);
        this.updateEnergy(100, 100);
        this.updatePopulation(0, 50);
    }

    updateSpice(current, max) {
        if (this.spiceBar && this.spiceAmount && this.spiceCapacity) {
            const percentage = Math.min((current / max) * 100, 100);
            this.spiceBar.style.width = `${percentage}%`;
            this.spiceAmount.textContent = Math.floor(current);
            this.spiceCapacity.textContent = max;
            
            // Add visual warning when storage is nearly full
            if (percentage > 90) {
                this.spiceBar.style.animation = 'pulse 1s infinite';
            } else {
                this.spiceBar.style.animation = 'none';
            }
        }
    }

    updateEnergy(current, max) {
        if (this.energyBar && this.energyAmount && this.energyCapacity) {
            const percentage = Math.min((current / max) * 100, 100);
            this.energyBar.style.width = `${percentage}%`;
            this.energyAmount.textContent = Math.floor(current);
            this.energyCapacity.textContent = max;
            
            // Add visual warning when energy is low
            if (percentage < 20) {
                this.energyBar.style.animation = 'pulse 0.5s infinite';
            } else {
                this.energyBar.style.animation = 'none';
            }
        }
    }

    updatePopulation(current, max) {
        if (this.populationBar && this.populationAmount && this.populationCapacity) {
            const percentage = Math.min((current / max) * 100, 100);
            this.populationBar.style.width = `${percentage}%`;
            this.populationAmount.textContent = Math.floor(current);
            this.populationCapacity.textContent = max;
            
            // Add visual warning when population limit is reached
            if (percentage >= 100) {
                this.populationBar.style.animation = 'pulse 1s infinite';
            } else {
                this.populationBar.style.animation = 'none';
            }
        }
    }

    // Update all resources based on game state
    update(gameState) {
        if (gameState.depot) {
            // Update spice storage
            const spiceStored = gameState.depot.spiceStored || 0;
            const spiceCapacity = gameState.depot.capacity || 1000;
            this.updateSpice(spiceStored, spiceCapacity);
        }

        // Calculate total population (harvesters + player units)
        const harvesterCount = gameState.harvesters ? gameState.harvesters.length : 0;
        const playerUnitCount = gameState.playerUnits ? gameState.playerUnits.length : 0;
        const totalPopulation = harvesterCount + playerUnitCount;
        this.updatePopulation(totalPopulation, 50);

        // Energy is always full for now (future power system)
        this.updateEnergy(100, 100);
    }

    // Method to calculate total storage across all refineries
    getTotalSpiceCapacity(gameState) {
        let totalCapacity = gameState.depot ? gameState.depot.capacity : 1000;
        
        if (gameState.buildings) {
            const refineries = gameState.buildings.filter(building => 
                building.type === 'SpiceRefinery' && building.isConstructed
            );
            
            // Each refinery adds storage capacity
            totalCapacity += refineries.length * 500; // 500 per refinery
        }
        
        return totalCapacity;
    }

    // Method to calculate total spice across all storage
    getTotalSpiceStored(gameState) {
        let totalSpice = gameState.depot ? gameState.depot.spiceStored : 0;
        
        if (gameState.buildings) {
            const refineries = gameState.buildings.filter(building => 
                building.type === 'SpiceRefinery' && building.isConstructed
            );
            
            // Add spice stored in refineries
            refineries.forEach(refinery => {
                if (refinery.spiceStorage) {
                    totalSpice += refinery.spiceStorage;
                }
            });
        }
        
        return totalSpice;
    }
}
