export class AIPlayer {
    constructor(faction, difficulty = 'normal', playerNumber = 2) {
        this.faction = faction;
        this.difficulty = difficulty;
        this.playerNumber = playerNumber;
        this.factionData = null;
        
        // AI State Machine
        this.state = 'initializing';
        this.stateTimer = 0;
        this.stateTransitions = new Map();
        
        // Resources and economy
        this.spice = 1000; // Starting resources
        this.buildings = [];
        this.units = [];
        this.technologies = new Set();
        
        // Strategic data
        this.basePosition = null;
        this.expansionSites = [];
        this.threats = [];
        this.priorities = new Map();
        
        // Decision timers
        this.buildTimer = 0;
        this.attackTimer = 0;
        this.scoutTimer = 0;
        this.expansionTimer = 0;
        
        // Difficulty scaling
        this.difficultyModifiers = this.getDifficultyModifiers(difficulty);
        
        this.initializeStateMachine();
        console.log(`🤖 AI Player ${playerNumber} initialized as ${faction.name} (${difficulty})`);
    }
    
    getDifficultyModifiers(difficulty) {
        const modifiers = {
            easy: {
                resourceBonus: 0.8,      // -20% resources
                buildSpeed: 0.7,         // -30% build speed
                unitProduction: 0.6,     // -40% unit production
                decisionDelay: 1.5,      // +50% decision time
                aggression: 0.6,         // -40% aggression
                micromanagement: 0.3     // Poor unit control
            },
            normal: {
                resourceBonus: 1.0,      // Normal resources
                buildSpeed: 1.0,         // Normal build speed
                unitProduction: 1.0,     // Normal production
                decisionDelay: 1.0,      // Normal decision time
                aggression: 1.0,         // Normal aggression
                micromanagement: 0.7     // Good unit control
            },
            hard: {
                resourceBonus: 1.3,      // +30% resources
                buildSpeed: 1.4,         // +40% build speed
                unitProduction: 1.5,     // +50% unit production
                decisionDelay: 0.7,      // -30% decision time
                aggression: 1.4,         // +40% aggression
                micromanagement: 0.9     // Excellent unit control
            },
            nightmare: {
                resourceBonus: 1.8,      // +80% resources
                buildSpeed: 2.0,         // +100% build speed
                unitProduction: 2.2,     // +120% unit production
                decisionDelay: 0.4,      // -60% decision time
                aggression: 1.8,         // +80% aggression
                micromanagement: 1.0     // Perfect unit control
            }
        };
        
        return modifiers[difficulty] || modifiers.normal;
    }
    
    initializeStateMachine() {
        // Define state transitions
        this.stateTransitions.set('initializing', ['early_game']);
        this.stateTransitions.set('early_game', ['expanding', 'defending']);
        this.stateTransitions.set('expanding', ['mid_game', 'defending']);
        this.stateTransitions.set('defending', ['early_game', 'attacking']);
        this.stateTransitions.set('mid_game', ['attacking', 'teching', 'mass_producing']);
        this.stateTransitions.set('attacking', ['mid_game', 'late_game']);
        this.stateTransitions.set('teching', ['late_game', 'attacking']);
        this.stateTransitions.set('mass_producing', ['attacking', 'late_game']);
        this.stateTransitions.set('late_game', ['victory_push', 'defending']);
        this.stateTransitions.set('victory_push', ['late_game']);
    }
    
    update(deltaTime, gameState) {
        this.stateTimer += deltaTime;
        
        // Update AI based on current state
        switch (this.state) {
            case 'initializing':
                this.handleInitializing(gameState);
                break;
            case 'early_game':
                this.handleEarlyGame(gameState);
                break;
            case 'expanding':
                this.handleExpanding(gameState);
                break;
            case 'defending':
                this.handleDefending(gameState);
                break;
            case 'mid_game':
                this.handleMidGame(gameState);
                break;
            case 'attacking':
                this.handleAttacking(gameState);
                break;
            case 'teching':
                this.handleTeching(gameState);
                break;
            case 'mass_producing':
                this.handleMassProducing(gameState);
                break;
            case 'late_game':
                this.handleLateGame(gameState);
                break;
            case 'victory_push':
                this.handleVictoryPush(gameState);
                break;
        }
        
        // Update timers
        this.buildTimer += deltaTime;
        this.attackTimer += deltaTime;
        this.scoutTimer += deltaTime;
        this.expansionTimer += deltaTime;
        
        // Check for state transitions
        this.checkStateTransitions(gameState);
    }
    
    handleInitializing(gameState) {
        if (this.stateTimer > 2000) { // 2 seconds
            this.transitionToState('early_game');
            this.establishBase(gameState);
        }
    }
    
    handleEarlyGame(gameState) {
        const personality = this.factionData.aiPersonality;
        
        // Build essential buildings
        if (this.buildTimer > 3000 * this.difficultyModifiers.decisionDelay) {
            this.considerBuilding(gameState, 'essential');
            this.buildTimer = 0;
        }
        
        // Start basic unit production
        if (this.buildings.length >= 2) {
            this.considerUnitProduction(gameState, 'basic');
        }
        
        // Transition conditions
        if (this.spice > 500 && this.buildings.length >= 3) {
            if (personality.expansionRate > 0.6) {
                this.transitionToState('expanding');
            } else {
                this.transitionToState('mid_game');
            }
        }
    }
    
    handleExpanding(gameState) {
        // Look for expansion opportunities
        if (this.expansionTimer > 5000 * this.difficultyModifiers.decisionDelay) {
            this.findExpansionSites(gameState);
            this.buildExpansionBase(gameState);
            this.expansionTimer = 0;
        }
        
        // Build defensive structures
        this.considerBuilding(gameState, 'defensive');
        
        // Transition after establishing expansion
        if (this.stateTimer > 20000) {
            this.transitionToState('mid_game');
        }
    }
    
    handleDefending(gameState) {
        // Assess threats
        this.assessThreats(gameState);
        
        // Build defensive units and structures
        this.considerBuilding(gameState, 'defensive');
        this.considerUnitProduction(gameState, 'defensive');
        
        // Transition when threat is neutralized
        if (this.threats.length === 0 && this.stateTimer > 10000) {
            this.transitionToState('early_game');
        }
    }
    
    handleMidGame(gameState) {
        const personality = this.factionData.aiPersonality;
        
        // Balanced approach - economy, military, tech
        this.considerBuilding(gameState, 'economy');
        this.considerUnitProduction(gameState, 'balanced');
        
        // Research technologies
        if (personality.techFocus > 0.5) {
            this.considerTechnology(gameState);
        }
        
        // Transition based on personality
        if (this.stateTimer > 30000) {
            if (personality.aggression > 0.7) {
                this.transitionToState('attacking');
            } else if (personality.techFocus > 0.7) {
                this.transitionToState('teching');
            } else {
                this.transitionToState('mass_producing');
            }
        }
    }
    
    handleAttacking(gameState) {
        // Launch attacks
        if (this.attackTimer > 8000 * this.difficultyModifiers.decisionDelay) {
            this.planAttack(gameState);
            this.executeAttack(gameState);
            this.attackTimer = 0;
        }
        
        // Continue unit production
        this.considerUnitProduction(gameState, 'aggressive');
        
        // Transition based on success
        if (this.stateTimer > 45000) {
            this.transitionToState('late_game');
        }
    }
    
    handleTeching(gameState) {
        // Focus on research and advanced units
        this.considerTechnology(gameState);
        this.considerBuilding(gameState, 'advanced');
        this.considerUnitProduction(gameState, 'advanced');
        
        if (this.technologies.size >= 3) {
            this.transitionToState('late_game');
        }
    }
    
    handleMassProducing(gameState) {
        // Mass produce units
        this.considerUnitProduction(gameState, 'mass');
        this.considerBuilding(gameState, 'production');
        
        // Transition when we have enough units
        if (this.units.length >= 20) {
            this.transitionToState('attacking');
        }
    }
    
    handleLateGame(gameState) {
        // Advanced strategies
        this.considerBuilding(gameState, 'late_game');
        this.considerUnitProduction(gameState, 'elite');
        this.planComplexAttacks(gameState);
        
        if (this.isReadyForVictory(gameState)) {
            this.transitionToState('victory_push');
        }
    }
    
    handleVictoryPush(gameState) {
        // All-out assault
        this.launchFinalAttack(gameState);
    }
    
    transitionToState(newState) {
        const validTransitions = this.stateTransitions.get(this.state);
        if (validTransitions && validTransitions.includes(newState)) {
            console.log(`🤖 AI ${this.playerNumber}: ${this.state} → ${newState}`);
            this.state = newState;
            this.stateTimer = 0;
        }
    }
    
    checkStateTransitions(gameState) {
        // Emergency transitions
        if (this.isUnderSevereAttack(gameState)) {
            this.transitionToState('defending');
        }
    }
    
    // Strategic decision methods
    establishBase(gameState) {
        // Find a good starting position
        this.basePosition = this.findBaseLocation(gameState);
        console.log(`🏗️ AI ${this.playerNumber}: Establishing base at ${this.basePosition?.x},${this.basePosition?.y}`);
    }
    
    findBaseLocation(gameState) {
        // Simple implementation - find empty space away from player
        const mapSize = 32;
        const playerBase = { x: 5, y: 5 }; // Assume player starts here
        
        // Try different positions
        for (let attempts = 0; attempts < 10; attempts++) {
            const x = Math.floor(Math.random() * (mapSize - 10)) + 5;
            const y = Math.floor(Math.random() * (mapSize - 10)) + 5;
            
            // Check distance from player
            const distance = Math.sqrt((x - playerBase.x) ** 2 + (y - playerBase.y) ** 2);
            if (distance > 15) {
                return { x, y };
            }
        }
        
        return { x: mapSize - 8, y: mapSize - 8 }; // Fallback position
    }
    
    considerBuilding(gameState, buildType) {
        const buildings = this.getBuildingPriorityByType(buildType);
        
        for (const buildingType of buildings) {
            if (this.canAffordBuilding(buildingType) && this.shouldBuildBuilding(buildingType, gameState)) {
                this.queueBuilding(buildingType);
                break;
            }
        }
    }
    
    getBuildingPriorityByType(buildType) {
        const priorities = {
            essential: ['ConstructionYard', 'SpiceRefinery', 'Depot'],
            defensive: ['GunTurret', 'ShieldGenerator'],
            economy: ['SpiceRefinery', 'Harvester'],
            production: ['Barracks', 'HeavyFactory'],
            advanced: ['ResearchLab', 'AdvancedFactory'],
            late_game: ['SuperWeapon', 'CommandCenter']
        };
        
        return priorities[buildType] || [];
    }
    
    considerUnitProduction(gameState, unitType) {
        const units = this.getUnitPriorityByType(unitType);
        
        for (const unitTypeName of units) {
            if (this.canAffordUnit(unitTypeName) && this.shouldProduceUnit(unitTypeName, gameState)) {
                this.queueUnit(unitTypeName);
                break;
            }
        }
    }
    
    getUnitPriorityByType(unitType) {
        const personality = this.factionData.aiPersonality;
        
        const priorities = {
            basic: ['Harvester', 'AtreidesInfantry'],
            defensive: ['GunTurret', 'AtreidesInfantry'],
            balanced: ['Harvester', 'AtreidesInfantry', 'SonicTank'],
            aggressive: ['HarkonnenTrooper', 'Devastator'],
            advanced: ['SonicTank', 'Deviator'],
            elite: ['Devastator', 'SonicTank'],
            mass: ['HarkonnenTrooper', 'AtreidesInfantry']
        };
        
        return priorities[unitType] || [];
    }
    
    // Utility methods
    canAffordBuilding(buildingType) {
        // Simplified cost check
        const baseCost = 100; // Would look up actual costs
        return this.spice >= baseCost;
    }
    
    canAffordUnit(unitType) {
        // Simplified cost check
        const baseCost = 50; // Would look up actual costs
        return this.spice >= baseCost;
    }
    
    shouldBuildBuilding(buildingType, gameState) {
        // AI logic for whether to build this building type
        return true; // Simplified
    }
    
    shouldProduceUnit(unitType, gameState) {
        // AI logic for whether to produce this unit type
        return true; // Simplified
    }
    
    queueBuilding(buildingType) {
        console.log(`🏗️ AI ${this.playerNumber}: Queuing ${buildingType}`);
        // Would integrate with actual building system
    }
    
    queueUnit(unitType) {
        console.log(`⚔️ AI ${this.playerNumber}: Producing ${unitType}`);
        // Would integrate with actual unit production
    }
    
    // Threat assessment
    assessThreats(gameState) {
        this.threats = [];
        // Would analyze enemy units near AI bases
    }
    
    isUnderSevereAttack(gameState) {
        return this.threats.length > 3; // Simplified
    }
    
    // Attack planning
    planAttack(gameState) {
        console.log(`⚔️ AI ${this.playerNumber}: Planning attack`);
        // Would analyze enemy weaknesses and plan assault
    }
    
    executeAttack(gameState) {
        console.log(`⚔️ AI ${this.playerNumber}: Executing attack`);
        // Would coordinate unit movements and attacks
    }
    
    planComplexAttacks(gameState) {
        // Advanced multi-pronged attacks
    }
    
    launchFinalAttack(gameState) {
        console.log(`💥 AI ${this.playerNumber}: FINAL ASSAULT!`);
        // Coordinate all units for victory
    }
    
    // Technology research
    considerTechnology(gameState) {
        // Research faction-specific technologies
        const availableTech = Object.keys(this.factionData.technologies);
        for (const tech of availableTech) {
            if (!this.technologies.has(tech) && this.canAffordTechnology(tech)) {
                this.researchTechnology(tech);
                break;
            }
        }
    }
    
    canAffordTechnology(techName) {
        const techCost = 150; // Would look up actual cost
        return this.spice >= techCost;
    }
    
    researchTechnology(techName) {
        console.log(`🔬 AI ${this.playerNumber}: Researching ${techName}`);
        this.technologies.add(techName);
        this.spice -= 150; // Deduct cost
    }
    
    // Expansion
    findExpansionSites(gameState) {
        // Find good locations for expansion bases
        this.expansionSites = []; // Would populate with actual sites
    }
    
    buildExpansionBase(gameState) {
        if (this.expansionSites.length > 0) {
            console.log(`🏗️ AI ${this.playerNumber}: Building expansion base`);
        }
    }
    
    // Victory conditions
    isReadyForVictory(gameState) {
        return this.units.length >= 30 && this.spice >= 2000;
    }
    
    // Resource management
    addSpice(amount) {
        this.spice += amount * this.difficultyModifiers.resourceBonus;
    }
    
    spendSpice(amount) {
        this.spice = Math.max(0, this.spice - amount);
    }
    
    // Faction integration
    setFactionData(factionData) {
        this.factionData = factionData;
    }
    
    getFactionColor() {
        return this.factionData ? this.factionData.color : '#FFFFFF';
    }
} 