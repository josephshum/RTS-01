export class Harvester {
    constructor(x, y, id) {
        this.id = id;
        this.x = x;
        this.y = y;
        
        // Unit properties
        this.width = 24;
        this.height = 16;
        this.speed = 50; // pixels per second
        
        // State machine
        this.state = 'idle'; // idle, moving, harvesting, returning
        this.stateTimer = 0;
        
        // Pathfinding
        this.path = [];
        this.currentPathIndex = 0;
        this.targetX = x;
        this.targetY = y;
        
        // Resource collection
        this.cargoCapacity = 10;
        this.currentCargo = 0;
        this.harvestingSpeed = 2; // spice per second
        this.targetSpiceNode = null;
        
        // Health system
        this.maxHealth = 50;
        this.currentHealth = this.maxHealth;
        
        // Base/depot reference  
        this.homeDepot = null;
        
        // Animation and visual
        this.rotation = 0;
        this.animationFrame = 0;
        this.lastMoveTime = Date.now();
        
        // Selection
        this.isSelected = false;
    }
    
    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.stateTimer = 0;
            
            // State-specific initialization
            switch (newState) {
                case 'idle':
                    this.path = [];
                    this.targetSpiceNode = null;
                    break;
                case 'harvesting':
                    this.animationFrame = 0;
                    break;
            }
        }
    }
    
    update(deltaTime, spiceNodes, depot, pathfinder, refineries = []) {
        this.stateTimer += deltaTime;
        
        // Update animation
        this.animationFrame += deltaTime * 4;
        
        switch (this.state) {
            case 'idle':
                this.handleIdleState(spiceNodes, pathfinder, depot, refineries);
                break;
                
            case 'moving':
                this.handleMovingState(deltaTime);
                break;
                
            case 'harvesting':
                this.handleHarvestingState(deltaTime, spiceNodes);
                break;
                
            case 'returning':
                this.handleReturningState(deltaTime, depot, pathfinder, refineries);
                break;
        }
    }
    
    handleIdleState(spiceNodes, pathfinder, depot, refineries) {
        // Look for nearby spice if we have cargo space
        if (this.currentCargo < this.cargoCapacity) {
            const nearestSpice = this.findNearestSpice(spiceNodes);
            if (nearestSpice) {
                this.targetSpiceNode = nearestSpice;
                this.findPathTo(nearestSpice.x + 16, nearestSpice.y + 16, pathfinder);
                this.setState('moving');
            }
        } else {
            // Choose best return destination (refinery or depot)
            const returnTarget = this.chooseBestReturnTarget(depot, refineries);
            if (returnTarget) {
                this.findPathTo(returnTarget.x + returnTarget.width / 2, returnTarget.y + returnTarget.height / 2, pathfinder);
                this.setState('returning');
            }
        }
    }
    
    handleMovingState(deltaTime) {
        if (this.path.length === 0) {
            // Reached destination
            if (this.targetSpiceNode && this.currentCargo < this.cargoCapacity) {
                // Check if we're close enough to the spice node
                const dx = this.x - (this.targetSpiceNode.x + 16);
                const dy = this.y - (this.targetSpiceNode.y + 16);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 30 && this.targetSpiceNode.amount > 0) {
                    this.setState('harvesting');
                } else {
                    this.setState('idle');
                }
            } else {
                this.setState('idle');
            }
            return;
        }
        
        // Move along the path
        this.moveAlongPath(deltaTime);
    }
    
    handleHarvestingState(deltaTime, spiceNodes) {
        if (!this.targetSpiceNode || this.targetSpiceNode.amount <= 0 || this.currentCargo >= this.cargoCapacity) {
            this.setState('idle');
            return;
        }
        
        // Harvest spice
        const harvestAmount = this.harvestingSpeed * deltaTime;
        const actualHarvest = Math.min(harvestAmount, this.targetSpiceNode.amount, this.cargoCapacity - this.currentCargo);
        
        this.currentCargo += actualHarvest;
        this.targetSpiceNode.amount -= actualHarvest;
        
        // Remove depleted spice nodes
        if (this.targetSpiceNode.amount <= 0) {
            const index = spiceNodes.indexOf(this.targetSpiceNode);
            if (index > -1) {
                spiceNodes.splice(index, 1);
            }
            this.targetSpiceNode = null;
            this.setState('idle');
        }
    }
    
    handleReturningState(deltaTime, depot, pathfinder, refineries) {
        if (!depot && (!refineries || refineries.length === 0)) {
            this.setState('idle');
            return;
        }
        
        if (this.path.length === 0) {
            // Check if we're at any valid drop-off point
            let delivered = false;
            
            // Try refineries first (they give bonus)
            for (const refinery of refineries) {
                if (refinery.isActive && refinery.isConstructed && this.isNearBuilding(refinery)) {
                    const cargoAmount = this.currentCargo; // Store before processing
                    const processed = refinery.processHarvesterCargo(this);
                    if (processed > 0) {
                        console.log(`🚚 Harvester delivered ${cargoAmount} spice to refinery (+20% bonus = ${processed.toFixed(1)} processed)`);
                        this.setState('idle');
                        delivered = true;
                        break;
                    }
                }
            }
            
            // If no refinery worked, try depot
            if (!delivered && depot && this.isNearBuilding(depot)) {
                console.log(`🚚 Harvester delivered ${this.currentCargo} spice to depot`);
                depot.addSpice(this.currentCargo);
                this.currentCargo = 0;
                this.setState('idle');
                delivered = true;
            }
            
            if (!delivered) {
                // Recalculate path to best target
                const returnTarget = this.chooseBestReturnTarget(depot, refineries);
                if (returnTarget) {
                    this.findPathTo(returnTarget.x + returnTarget.width / 2, returnTarget.y + returnTarget.height / 2, pathfinder);
                }
            }
        } else {
            this.moveAlongPath(deltaTime);
        }
    }
    
    moveAlongPath(deltaTime) {
        if (this.path.length === 0) return;
        
        const target = this.path[this.currentPathIndex];
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            // Reached current waypoint, move to next
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length) {
                this.path = [];
                this.currentPathIndex = 0;
            }
            return;
        }
        
        // Move towards current waypoint
        const moveDistance = this.speed * deltaTime;
        const moveX = (dx / distance) * moveDistance;
        const moveY = (dy / distance) * moveDistance;
        
        this.x += moveX;
        this.y += moveY;
        
        // Update rotation based on movement direction
        this.rotation = Math.atan2(dy, dx);
        this.lastMoveTime = Date.now();
    }
    
    findNearestSpice(spiceNodes) {
        let nearestSpice = null;
        let nearestDistance = Infinity;
        
        for (const spice of spiceNodes) {
            if (spice.amount <= 0) continue;
            
            const dx = this.x - (spice.x + 16);
            const dy = this.y - (spice.y + 16);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestSpice = spice;
            }
        }
        
        return nearestSpice;
    }
    
    findPathTo(targetX, targetY, pathfinder) {
        if (!pathfinder) {
            // Simple direct path if no pathfinder available
            this.path = [{ x: targetX, y: targetY }];
            this.currentPathIndex = 0;
            return;
        }
        
        const startX = Math.floor(this.x / 32);
        const startY = Math.floor(this.y / 32);
        const endX = Math.floor(targetX / 32);
        const endY = Math.floor(targetY / 32);
        
        const pathTiles = pathfinder.findPath(startX, startY, endX, endY);
        
        // Convert tile coordinates to world coordinates
        this.path = pathTiles.map(tile => ({
            x: tile.x * 32 + 16,
            y: tile.y * 32 + 16
        }));
        
        this.currentPathIndex = 0;
        this.targetX = targetX;
        this.targetY = targetY;
    }
    
    // Utility methods
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
    
    contains(x, y) {
        const bounds = this.getBounds();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }
    
    getStateColor() {
        switch (this.state) {
            case 'idle': return '#FFFF00'; // Yellow
            case 'moving': return '#00FF00'; // Green
            case 'harvesting': return '#FF8C00'; // Orange
            case 'returning': return '#87CEEB'; // Sky blue
            default: return '#FFFFFF';
        }
    }
    
    getCargoPercentage() {
        return this.cargoCapacity > 0 ? (this.currentCargo / this.cargoCapacity) : 0;
    }
    
    // Health system methods
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0) {
            this.state = 'destroyed';
            console.log(`💥 Harvester ${this.id} destroyed`);
            return true;
        }
        
        return false;
    }
    
    getHealthPercentage() {
        return this.maxHealth > 0 ? (this.currentHealth / this.maxHealth) : 0;
    }
    
    // Choose the best return target (refinery vs depot) based on distance and efficiency
    chooseBestReturnTarget(depot, refineries) {
        let bestTarget = depot; // Default to depot
        let bestScore = depot ? this.calculateReturnScore(depot, false) : -1;
        
        // Check all active refineries
        for (const refinery of refineries) {
            if (refinery.isActive && refinery.isConstructed && refinery.spiceStorage < refinery.maxSpiceStorage * 0.9) {
                const score = this.calculateReturnScore(refinery, true);
                if (score > bestScore) {
                    bestTarget = refinery;
                    bestScore = score;
                }
            }
        }
        
        return bestTarget;
    }
    
    // Calculate a score for a return target (higher = better)
    calculateReturnScore(target, isRefinery) {
        if (!target) return -1;
        
        // Calculate distance
        const dx = this.x - (target.x + target.width / 2);
        const dy = this.y - (target.y + target.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Base score (closer = better)
        let score = 1000 - distance;
        
        // Bonus for refinery efficiency
        if (isRefinery) {
            score += 200; // Significant bonus for 20% efficiency gain
        }
        
        // Penalty if target is nearly full
        if (target.spiceStored && target.maxSpiceStorage) {
            const fullness = target.spiceStored / target.maxSpiceStorage;
            if (fullness > 0.9) {
                score -= 500; // Heavy penalty for nearly full storage
            }
        }
        
        return score;
    }
    
    // Check if harvester is near a building for delivery
    isNearBuilding(building) {
        const dx = this.x - (building.x + building.width / 2);
        const dy = this.y - (building.y + building.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use building's processing range if it's a refinery, otherwise use standard range
        const deliveryRange = building.processingRange ? building.processingRange * 32 : 60;
        
        return distance < deliveryRange;
    }
} 