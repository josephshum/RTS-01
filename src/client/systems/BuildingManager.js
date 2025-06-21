import { Building } from '../entities/Building.js';

export class BuildingManager {
    constructor() {
        this.buildings = [];
        this.constructionYards = [];
        
        // Building placement state
        this.isPlacementMode = false;
        this.selectedBuildingType = null;
        this.placementPreview = null;
        this.BuildingClasses = new Map();
        
        // Grid settings
        this.gridSize = 32;
        this.showGrid = false;
        
        // Building selection
        this.selectedBuilding = null;
        
        this.registerBuildingTypes();
    }
    
    registerBuildingTypes() {
        // Register available building types (will be populated by imports)
        // This allows dynamic building registration
    }
    
    registerBuildingType(name, BuildingClass) {
        this.BuildingClasses.set(name, BuildingClass);
        console.log(`🏗️ Registered building type: ${name}`);
    }
    
    update(deltaTime, gameState) {
        // Update all buildings
        for (const building of this.buildings) {
            building.update(deltaTime, {
                ...gameState,
                buildings: this.buildings
            });
        }
        
        // Update construction yards separately for build queue processing
        for (const yard of this.constructionYards) {
            yard.update(deltaTime, {
                ...gameState,
                buildings: this.buildings
            });
        }
        
        // Remove destroyed buildings
        this.buildings = this.buildings.filter(building => {
            if (building.currentHealth <= 0 && building.isConstructed) {
                this.removeBuilding(building);
                return false;
            }
            return true;
        });
    }
    
    addBuilding(building) {
        this.buildings.push(building);
        
        // Track construction yards separately
        if (building.type === 'ConstructionYard') {
            this.constructionYards.push(building);
        }
        
        console.log(`🏗️ Added ${building.type} at (${building.gridX}, ${building.gridY})`);
    }
    
    removeBuilding(building) {
        // Remove from construction yards if applicable
        if (building.type === 'ConstructionYard') {
            const index = this.constructionYards.indexOf(building);
            if (index > -1) {
                this.constructionYards.splice(index, 1);
            }
        }
        
        console.log(`💥 Removed ${building.type} from (${building.gridX}, ${building.gridY})`);
    }
    
    // Building placement system
    enterPlacementMode(buildingType) {
        const BuildingClass = this.BuildingClasses.get(buildingType);
        if (!BuildingClass) {
            console.error(`Unknown building type: ${buildingType}`);
            return false;
        }
        
        this.isPlacementMode = true;
        this.selectedBuildingType = buildingType;
        this.showGrid = true;
        
        // Create preview building (create temporary instance to get config)
        const tempInstance = new BuildingClass(0, 0);
        this.placementPreview = {
            type: buildingType,
            BuildingClass: BuildingClass,
            gridWidth: tempInstance.gridWidth || 2,
            gridHeight: tempInstance.gridHeight || 2,
            cost: BuildingClass.getCost ? BuildingClass.getCost() : { spice: 50 }
        };
        
        console.log(`🔨 Entering placement mode for ${buildingType}`);
        return true;
    }
    
    exitPlacementMode() {
        this.isPlacementMode = false;
        this.selectedBuildingType = null;
        this.placementPreview = null;
        this.showGrid = false;
        console.log('❌ Exited placement mode');
    }
    
    tryPlaceBuilding(worldX, worldY, terrain) {
        if (!this.isPlacementMode || !this.placementPreview) {
            return false;
        }
        
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        
        // Check if placement is valid
        if (!this.canPlaceBuildingAt(gridX, gridY, this.placementPreview, terrain)) {
            console.log('❌ Cannot place building here');
            return false;
        }
        
        // Check if we have a construction yard in range
        const constructionYard = this.findNearestConstructionYard(gridX, gridY);
        if (!constructionYard) {
            console.log('❌ No construction yard in range');
            return false;
        }
        
        // Queue the construction
        const success = constructionYard.queueConstruction(
            this.selectedBuildingType,
            gridX,
            gridY,
            this.placementPreview.BuildingClass
        );
        
        if (success) {
            console.log(`✅ Queued ${this.selectedBuildingType} for construction at (${gridX}, ${gridY})`);
            this.exitPlacementMode();
            return true;
        }
        
        return false;
    }
    
    canPlaceBuildingAt(gridX, gridY, buildingPreview, terrain) {
        // Use the static method from Building class
        return Building.canPlace(gridX, gridY, buildingPreview.gridWidth, buildingPreview.gridHeight, this.buildings, terrain);
    }
    
    findNearestConstructionYard(gridX, gridY) {
        let nearestYard = null;
        let nearestDistance = Infinity;
        
        for (const yard of this.constructionYards) {
            if (!yard.isActive || !yard.isConstructed) continue;
            
            if (yard.isInConstructionRange(gridX, gridY)) {
                const distance = Math.abs(gridX - yard.gridX) + Math.abs(gridY - yard.gridY);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestYard = yard;
                }
            }
        }
        
        return nearestYard;
    }
    
    // Building selection
    selectBuildingAt(worldX, worldY) {
        // Clear previous selection
        if (this.selectedBuilding) {
            this.selectedBuilding.isSelected = false;
            this.selectedBuilding.selectionTime = 0;
        }
        
        // Find building at position
        const building = this.getBuildingAt(worldX, worldY);
        
        if (building) {
            this.selectedBuilding = building;
            building.isSelected = true;
            building.selectionTime = 0;
            console.log(`🎯 Selected ${building.type} at (${building.gridX}, ${building.gridY})`);
            return building;
        } else {
            this.selectedBuilding = null;
        }
        
        return null;
    }
    
    getBuildingAt(worldX, worldY) {
        for (const building of this.buildings) {
            if (building.contains(worldX, worldY)) {
                return building;
            }
        }
        return null;
    }
    
    // Get buildings by type
    getBuildingsByType(type) {
        return this.buildings.filter(building => building.type === type);
    }
    
    // Get building statistics
    getBuildingStats() {
        const stats = {
            total: this.buildings.length,
            constructed: 0,
            underConstruction: 0,
            byType: {}
        };
        
        for (const building of this.buildings) {
            if (building.isConstructed) {
                stats.constructed++;
            } else {
                stats.underConstruction++;
            }
            
            if (!stats.byType[building.type]) {
                stats.byType[building.type] = 0;
            }
            stats.byType[building.type]++;
        }
        
        return stats;
    }
    
    // Get available building types that can be built
    getAvailableBuildingTypes(gameState) {
        const available = [];
        
        // Check prerequisites for each building type
        for (const [typeName, BuildingClass] of this.BuildingClasses) {
            if (this.canBuildType(typeName, gameState)) {
                available.push({
                    type: typeName,
                    cost: BuildingClass.getCost ? BuildingClass.getCost() : { spice: 50 },
                    class: BuildingClass
                });
            }
        }
        
        return available;
    }
    
    canBuildType(buildingType, gameState) {
        // For now, simple checks - can be expanded with tech trees
        if (buildingType === 'ConstructionYard') {
            return true; // Always available
        }
        
        // Other buildings require at least one construction yard
        return this.constructionYards.some(yard => yard.isActive && yard.isConstructed);
    }
    
    // Check if player can afford a building
    canAfford(buildingType, gameState) {
        const BuildingClass = this.BuildingClasses.get(buildingType);
        if (!BuildingClass) return false;
        
        const cost = BuildingClass.getCost ? BuildingClass.getCost() : { spice: 50 };
        const requiredSpice = cost.spice || 0;
        
        // Calculate total available spice (depot + refineries)
        let totalAvailableSpice = 0;
        
        if (gameState.depot) {
            totalAvailableSpice += gameState.depot.spiceStored;
        }
        
        // Add spice from refineries
        for (const building of this.buildings) {
            if (building.type === 'SpiceRefinery' && building.spiceStorage) {
                totalAvailableSpice += building.spiceStorage;
            }
        }
        
        return totalAvailableSpice >= requiredSpice;
    }
    
    // Get placement preview info for rendering
    getPlacementPreview(mouseWorldX, mouseWorldY) {
        if (!this.isPlacementMode || !this.placementPreview) {
            return null;
        }
        
        const gridX = Math.floor(mouseWorldX / this.gridSize);
        const gridY = Math.floor(mouseWorldY / this.gridSize);
        
        return {
            gridX: gridX,
            gridY: gridY,
            worldX: gridX * this.gridSize,
            worldY: gridY * this.gridSize,
            width: this.placementPreview.gridWidth * this.gridSize,
            height: this.placementPreview.gridHeight * this.gridSize,
            canPlace: this.canPlaceBuildingAt(gridX, gridY, this.placementPreview, null),
            inRange: !!this.findNearestConstructionYard(gridX, gridY),
            type: this.placementPreview.type,
            cost: this.placementPreview.cost
        };
    }
} 