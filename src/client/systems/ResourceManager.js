export class ResourceManager {
    constructor(terrain, tileSize = 32) {
        this.terrain = terrain;
        this.tileSize = tileSize;
        this.spiceNodes = [];
        
        // Spice generation parameters
        this.spiceNodeSize = 32;
        this.minSpiceAmount = 20;
        this.maxSpiceAmount = 100;
        this.spiceRegenerationRate = 0.5; // spice per second
        
        this.generateSpiceNodes();
    }
    
    generateSpiceNodes() {
        this.spiceNodes = [];
        
        // Find all spice tiles in the terrain and convert them to resource nodes
        for (let x = 0; x < this.terrain.length; x++) {
            for (let y = 0; y < this.terrain[x].length; y++) {
                const tile = this.terrain[x][y];
                
                if (tile.type === 'spice') {
                    const spiceNode = {
                        id: `spice_${x}_${y}`,
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        width: this.spiceNodeSize,
                        height: this.spiceNodeSize,
                        amount: this.minSpiceAmount + Math.random() * (this.maxSpiceAmount - this.minSpiceAmount),
                        maxAmount: this.maxSpiceAmount,
                        isBeingHarvested: false,
                        harvesters: [],
                        regenerationTimer: 0,
                        lastHarvestTime: 0,
                        totalHarvested: 0,
                        animationPhase: Math.random() * Math.PI * 2
                    };
                    
                    this.spiceNodes.push(spiceNode);
                }
            }
        }
        
        console.log(`🌟 Generated ${this.spiceNodes.length} spice deposits`);
    }
    
    update(deltaTime) {
        for (const node of this.spiceNodes) {
            this.updateSpiceNode(node, deltaTime);
        }
        
        // Remove depleted nodes
        this.spiceNodes = this.spiceNodes.filter(node => node.amount > 0);
    }
    
    updateSpiceNode(node, deltaTime) {
        // Update animation
        node.animationPhase += deltaTime * 3;
        
        // Regenerate spice slowly over time (if not at max capacity)
        if (node.amount < node.maxAmount) {
            node.regenerationTimer += deltaTime;
            
            if (node.regenerationTimer >= 1.0) { // Regenerate every second
                const regenAmount = this.spiceRegenerationRate;
                node.amount = Math.min(node.maxAmount, node.amount + regenAmount);
                node.regenerationTimer = 0;
            }
        }
        
        // Update harvester tracking
        node.isBeingHarvested = node.harvesters.length > 0;
    }
    
    // Find spice nodes within a given radius
    findSpiceNodesInRadius(x, y, radius) {
        const nearbyNodes = [];
        
        for (const node of this.spiceNodes) {
            if (node.amount <= 0) continue;
            
            const dx = (node.x + node.width / 2) - x;
            const dy = (node.y + node.height / 2) - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                nearbyNodes.push({
                    node: node,
                    distance: distance
                });
            }
        }
        
        // Sort by distance
        nearbyNodes.sort((a, b) => a.distance - b.distance);
        return nearbyNodes.map(item => item.node);
    }
    
    // Get the nearest spice node to a position
    getNearestSpiceNode(x, y, maxDistance = Infinity) {
        let nearestNode = null;
        let nearestDistance = maxDistance;
        
        for (const node of this.spiceNodes) {
            if (node.amount <= 0) continue;
            
            const dx = (node.x + node.width / 2) - x;
            const dy = (node.y + node.height / 2) - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestNode = node;
            }
        }
        
        return nearestNode;
    }
    
    // Register a harvester as working on a spice node
    addHarvesterToNode(harvester, spiceNode) {
        if (!spiceNode.harvesters.includes(harvester)) {
            spiceNode.harvesters.push(harvester);
        }
    }
    
    // Remove a harvester from a spice node
    removeHarvesterFromNode(harvester, spiceNode) {
        const index = spiceNode.harvesters.indexOf(harvester);
        if (index > -1) {
            spiceNode.harvesters.splice(index, 1);
        }
    }
    
    // Harvest spice from a node
    harvestSpice(spiceNode, amount, harvester = null) {
        if (!spiceNode || spiceNode.amount <= 0) {
            return 0;
        }
        
        const actualAmount = Math.min(amount, spiceNode.amount);
        spiceNode.amount -= actualAmount;
        spiceNode.totalHarvested += actualAmount;
        spiceNode.lastHarvestTime = Date.now();
        
        // Track harvester
        if (harvester && !spiceNode.harvesters.includes(harvester)) {
            this.addHarvesterToNode(harvester, spiceNode);
        }
        
        return actualAmount;
    }
    
    // Check if a position overlaps with any spice node
    getSpiceNodeAt(x, y) {
        for (const node of this.spiceNodes) {
            if (x >= node.x && x <= node.x + node.width &&
                y >= node.y && y <= node.y + node.height) {
                return node;
            }
        }
        return null;
    }
    
    // Get visible spice nodes within camera bounds
    getVisibleSpiceNodes(cameraBounds) {
        return this.spiceNodes.filter(node => {
            return !(node.x + node.width < cameraBounds.left ||
                    node.x > cameraBounds.right ||
                    node.y + node.height < cameraBounds.top ||
                    node.y > cameraBounds.bottom);
        });
    }
    
    // Get total spice statistics
    getSpiceStats() {
        const totalNodes = this.spiceNodes.length;
        const totalSpice = this.spiceNodes.reduce((sum, node) => sum + node.amount, 0);
        const totalMaxSpice = this.spiceNodes.reduce((sum, node) => sum + node.maxAmount, 0);
        const totalHarvested = this.spiceNodes.reduce((sum, node) => sum + node.totalHarvested, 0);
        const activeNodes = this.spiceNodes.filter(node => node.amount > 0).length;
        const harvestedNodes = this.spiceNodes.filter(node => node.isBeingHarvested).length;
        
        return {
            totalNodes,
            activeNodes,
            harvestedNodes,
            totalSpice: Math.round(totalSpice),
            totalMaxSpice: Math.round(totalMaxSpice),
            totalHarvested: Math.round(totalHarvested),
            averageAmount: totalNodes > 0 ? Math.round(totalSpice / totalNodes) : 0,
            fillPercentage: totalMaxSpice > 0 ? Math.round((totalSpice / totalMaxSpice) * 100) : 0
        };
    }
    
    // Get total spice owned by the player (from depot and buildings)
    getTotalPlayerSpice(depot, buildings = []) {
        let totalSpice = 0;
        
        // Add spice from depot
        if (depot && depot.getInfo) {
            totalSpice += depot.getInfo().stored;
        }
        
        // Add spice from buildings that can store spice (like refineries)
        for (const building of buildings) {
            if (building.spiceStored && typeof building.spiceStored === 'number') {
                totalSpice += building.spiceStored;
            }
        }
        
        return Math.round(totalSpice);
    }

    // Debug method to add a spice node at a specific location
    addSpiceNode(x, y, amount = null) {
        const spiceAmount = amount || (this.minSpiceAmount + Math.random() * (this.maxSpiceAmount - this.minSpiceAmount));
        
        const spiceNode = {
            id: `spice_manual_${Date.now()}`,
            x: x,
            y: y,
            width: this.spiceNodeSize,
            height: this.spiceNodeSize,
            amount: spiceAmount,
            maxAmount: this.maxSpiceAmount,
            isBeingHarvested: false,
            harvesters: [],
            regenerationTimer: 0,
            lastHarvestTime: 0,
            totalHarvested: 0,
            animationPhase: Math.random() * Math.PI * 2
        };
        
        this.spiceNodes.push(spiceNode);
        return spiceNode;
    }
} 