import { Camera } from './Camera.js';
import { InputManager } from '../systems/InputManager.js';
import { Renderer } from '../systems/Renderer.js';
import { Pathfinder } from '../systems/Pathfinder.js';
import { ResourceManager } from '../systems/ResourceManager.js';
import { BuildingManager } from '../systems/BuildingManager.js';
import { BuildingMenu } from '../systems/BuildingMenu.js';
import { UnitMenu } from '../systems/UnitMenu.js';
import { UnitManager } from '../systems/UnitManager.js';
import { VisualEffects } from '../systems/VisualEffects.js';
import { ResourceBarManager } from '../systems/ResourceBarManager.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { CombatManager } from '../systems/CombatManager.js';
import { FactionManager } from '../systems/FactionManager.js';
import { AIPlayer } from '../systems/AIPlayer.js';
import { TechnologyTree } from '../systems/TechnologyTree.js';
import { Harvester } from '../entities/Harvester.js';
import { Depot } from '../entities/Depot.js';
import { ConstructionYard } from '../entities/ConstructionYard.js';
import { SpiceRefinery } from '../entities/SpiceRefinery.js';
import { GunTurret } from '../entities/GunTurret.js';
import { Barracks } from '../entities/Barracks.js';
import { Projectile } from '../entities/Projectile.js';
import { AtreidesInfantry } from '../entities/AtreidesInfantry.js';
import { HarkonnenTrooper } from '../entities/HarkonnenTrooper.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.isRunning = false;
        
        // Game timing
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Core systems
        this.camera = null;
        this.inputManager = null;
        this.renderer = null;
        this.pathfinder = null;
        this.resourceManager = null;
        this.buildingManager = null;
        this.buildingMenu = null;
        this.unitMenu = null;
        this.unitManager = null;
        this.visualEffects = null;
        this.resourceBarManager = null;
        this.enemyManager = null;
        this.combatManager = null;
        this.factionManager = null;
        this.technologyTree = null;
        
        // AI players
        this.aiPlayers = [];
        this.playerFaction = 'atreides'; // Player starts as Atreides
        
        // Game entities
        this.harvesters = [];
        this.playerUnits = [];
        this.depot = null;
        this.nextHarvesterId = 1;
        
        // UI elements
        this.fpsCounter = document.getElementById('fps-counter');
        this.cameraInfo = document.getElementById('camera-info');
        this.resourceInfo = document.getElementById('resource-info');
        this.depotInfo = document.getElementById('depot-info');
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Initializing RTS-01 Game Engine...');
        
        // Initialize core systems
        this.camera = new Camera(0, 0, 1.0);
        this.camera.setViewport(this.canvas.width, this.canvas.height);
        
        this.inputManager = new InputManager(this.canvas, this.camera);
        this.renderer = new Renderer(this.canvas, this.camera);
        this.pathfinder = new Pathfinder(this.renderer.terrain);
        this.resourceManager = new ResourceManager(this.renderer.terrain);
        this.buildingManager = new BuildingManager();
        this.enemyManager = new EnemyManager(this.renderer.mapWidth * 32, this.renderer.mapHeight * 32);
        this.combatManager = new CombatManager();
        this.factionManager = new FactionManager();
        this.technologyTree = new TechnologyTree(this.factionManager);
        
        // Initialize AI players
        this.initializeAIPlayers();
        
        // Initialize line-of-sight for combat after terrain is ready
        setTimeout(() => {
            if (this.renderer && this.renderer.terrain) {
                this.combatManager.initializeLineOfSight(
                    this.renderer.terrain, 
                    this.renderer.mapWidth, 
                    this.renderer.mapHeight
                );
            }
        }, 100);
        
        // Make combat manager and Projectile globally accessible for turrets
        window.game = this;
        window.Projectile = Projectile;
        
        // Register building types
        this.buildingManager.registerBuildingType('ConstructionYard', ConstructionYard);
        this.buildingManager.registerBuildingType('SpiceRefinery', SpiceRefinery);
        this.buildingManager.registerBuildingType('GunTurret', GunTurret);
        this.buildingManager.registerBuildingType('Barracks', Barracks);
        
        // Initialize building menu
        this.buildingMenu = new BuildingMenu(this.buildingManager, (buildingType) => {
            console.log(`🏗️ Building selected from menu: ${buildingType}`);
        });
        
        // Initialize unit menu
        this.unitMenu = new UnitMenu((unitType, barracks) => {
            console.log(`🎖️ Unit ordered: ${unitType} from barracks at (${barracks.gridX}, ${barracks.gridY})`);
        });
        
        // Initialize unit manager for selection and commands
        this.unitManager = new UnitManager();
        
        // Initialize visual effects system
        this.visualEffects = new VisualEffects();
        
        // Initialize resource bar manager
        this.resourceBarManager = new ResourceBarManager();
        
        // Create depot at world center
        this.depot = new Depot(0, 0);
        
        // Create initial construction yard
        const initialYard = new ConstructionYard(64, 64);
        initialYard.isConstructed = true; // Start pre-built
        initialYard.isActive = true;
        this.buildingManager.addBuilding(initialYard);
        
        console.log('📷 Camera system initialized');
        console.log('🎮 Input system initialized');
        console.log('🎨 Renderer system initialized');
        console.log('🗺️ Desert terrain generated');
        console.log('🛤️ Pathfinding system initialized');
        console.log('💎 Resource management system initialized');
        console.log('🏗️ Building management system initialized');
        console.log('👹 Enemy management system initialized');
        console.log('⚔️ Combat management system initialized');
        console.log('🏛️ Faction system initialized');
        console.log('🔬 Technology tree initialized');
        console.log('🏭 Depot created at world center');
        console.log('🏗️ Initial construction yard built');
        
        // Make game instance globally available for visual effects
        window.game = this;
        console.log('🌍 Game instance available globally');
        
        // Handle canvas resize
        this.setupResizeHandler();
        
        console.log('✅ Game engine ready!');
        
        // Start the game loop
        this.start();
    }
    
    setupResizeHandler() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            const containerRect = container.getBoundingClientRect();
            
            // Maintain aspect ratio while fitting in container
            const maxWidth = Math.min(1200, containerRect.width - 20);
            const maxHeight = Math.min(800, containerRect.height - 20);
            
            this.canvas.width = maxWidth;
            this.canvas.height = maxHeight;
            
            this.camera.setViewport(this.canvas.width, this.canvas.height);
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // Initial resize
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        console.log('🚀 Starting game loop...');
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        console.log('⏹️ Game loop stopped');
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        // Calculate delta time in seconds
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Cap delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 1/30);
        
        // Update all systems
        this.update(this.deltaTime);
        
        // Render the frame
        this.render();
        
        // Update performance counters
        this.updatePerformanceCounters(currentTime);
        
        // Continue the loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update input system (handles continuous key presses)
        this.inputManager.update(deltaTime);
        
        // Handle mouse clicks for harvester spawning
        this.handleInput();
        
        // Update camera (smooth interpolation)
        this.camera.update(deltaTime);
        
        // Update resource management
        this.resourceManager.update(deltaTime);
        
        // Update building management first
        this.buildingManager.update(deltaTime, {
            depot: this.depot,
            harvesters: this.harvesters,
            playerUnits: this.playerUnits,
            enemies: this.enemyManager ? this.enemyManager.enemies : []
        });
        
        // Update enemy management
        this.enemyManager.update(deltaTime, {
            depot: this.depot,
            harvesters: this.harvesters,
            buildings: this.buildingManager.buildings
        });
        
        // Update combat management
        this.combatManager.update(deltaTime, {
            enemies: this.enemyManager.enemies,
            buildings: this.buildingManager.buildings,
            harvesters: this.harvesters,
            depot: this.depot
        });
        
        // Update depot
        if (this.depot) {
            this.depot.update(deltaTime);
        }
        
        // Update harvesters
        for (const harvester of this.harvesters) {
            // Get active refineries for harvester decision making
            const activeRefineries = this.buildingManager.buildings.filter(building => 
                building.type === 'SpiceRefinery' && building.isActive && building.isConstructed
            );
            
            harvester.update(deltaTime, this.resourceManager.spiceNodes, this.depot, this.pathfinder, activeRefineries);
        }
        
        // Remove destroyed harvesters (none for now, but future-proofing)
        this.harvesters = this.harvesters.filter(h => h.state !== 'destroyed');
        
        // Update player units
        for (const unit of this.playerUnits) {
            unit.update(deltaTime, this.getGameState());
        }
        
        // Remove destroyed units
        this.playerUnits = this.playerUnits.filter(unit => unit.state !== 'destroyed');
        
        // Update technology tree
        this.technologyTree.update(deltaTime);
        
        // Update building menu
        if (this.buildingMenu) {
            this.buildingMenu.update(this.getGameState());
        }
        
        // Update resource bar
        if (this.resourceBarManager) {
            this.resourceBarManager.update(this.getGameState());
        }
        
        // Update unit menu
        if (this.unitMenu) {
            this.unitMenu.update();
        }
        
        // Update unit manager
        if (this.unitManager) {
            this.unitManager.update(deltaTime);
        }
        
        // Update visual effects
        if (this.visualEffects) {
            this.visualEffects.update(deltaTime);
        }
        
        // Update AI players
        this.updateAIPlayers(deltaTime);
        
        // Update UI information
        this.updateUI();
    }
    
    render() {
        const mouseWorldPos = this.inputManager.getWorldMousePos();
        
        // Create game state object for renderer
        const gameState = {
            spiceNodes: this.resourceManager.spiceNodes,
            harvesters: this.harvesters,
            playerUnits: this.playerUnits,
            depot: this.depot,
            pathfinder: this.pathfinder,
            buildings: this.buildingManager.buildings,
            enemies: this.enemyManager.enemies,
            combatManager: this.combatManager,
            buildingManager: this.buildingManager,
            unitManager: this.unitManager,
            visualEffects: this.visualEffects,
            mouseWorldPosition: mouseWorldPos
        };
        
        // Render the main game world
        this.renderer.render(gameState);
        
        // Toggle debug layer with I key (debounced)
        if (this.inputManager.isKeyPressedDebounced('KeyI')) {
            const currentDebugState = this.renderer.layers.debug;
            this.renderer.setLayerVisibility('debug', !currentDebugState);
        }
    }
    
    updatePerformanceCounters(currentTime) {
        this.frameCount++;
        
        // Update FPS counter every second
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    updateUI() {
        // Update FPS counter
        if (this.fpsCounter) {
            const fpsColor = this.fps >= 55 ? '#90EE90' : this.fps >= 30 ? '#FFD700' : '#FF6347';
            this.fpsCounter.innerHTML = `FPS: ${this.fps}`;
            this.fpsCounter.style.color = fpsColor;
        }
        
        // Update camera information
        if (this.cameraInfo) {
            this.cameraInfo.innerHTML = `Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}) Zoom: ${this.camera.zoom.toFixed(2)}x`;
        }
        
        // Update faction information
        const factionInfo = document.getElementById('faction-info');
        if (factionInfo) {
            const factionData = this.factionManager.getFaction(this.playerFaction);
            factionInfo.innerHTML = `Faction: ${factionData.name}`;
            factionInfo.style.color = factionData.color;
        }
        
        // Update resource information
        if (this.resourceInfo) {
            const spiceStats = this.resourceManager.getSpiceStats();
            const playerSpice = this.resourceManager.getTotalPlayerSpice(this.depot, this.buildingManager.buildings);
            this.resourceInfo.innerHTML = `Spice: ${playerSpice} | Deposits: ${spiceStats.totalSpice} | Harvesters: ${this.harvesters.length}`;
        }
        
        // Update depot information
        if (this.depotInfo && this.depot) {
            const depotInfo = this.depot.getInfo();
            this.depotInfo.innerHTML = `Depot: ${depotInfo.stored}/${depotInfo.capacity} (${depotInfo.percentage}%)`;
        }
        
        // Update building information
        const buildingInfo = document.getElementById('building-info');
        if (buildingInfo) {
            const buildingStats = this.buildingManager.getBuildingStats();
            buildingInfo.innerHTML = `Buildings: ${buildingStats.total} | Constructed: ${buildingStats.constructed}`;
        }
        
        // Update building mode information
        const buildModeInfo = document.getElementById('build-mode-info');
        if (buildModeInfo) {
            if (this.buildingManager.isPlacementMode) {
                buildModeInfo.innerHTML = `Build Mode: ${this.buildingManager.selectedBuildingType}`;
                buildModeInfo.style.color = '#00FF00'; // Green when in build mode
            } else {
                buildModeInfo.innerHTML = 'Build Mode: Off';
                buildModeInfo.style.color = '#FFFFFF'; // White when not building
            }
        }

        // Update combat information
        const combatInfo = document.getElementById('combat-info');
        if (combatInfo) {
            const enemyStats = this.enemyManager.getEnemyStats();
            combatInfo.innerHTML = `Enemies: ${enemyStats.alive} | Wave: ${enemyStats.currentWave}`;
        }
    }
    
    // Public methods for external control
    getCamera() {
        return this.camera;
    }
    
    getRenderer() {
        return this.renderer;
    }
    
    getInputManager() {
        return this.inputManager;
    }
    
    // Utility methods
    getMouseWorldPosition() {
        return this.inputManager.getWorldMousePos();
    }
    
    handleInput() {
        // Handle keyboard shortcuts (with debouncing for single-action keys)
        if (this.inputManager.isKeyPressedDebounced('KeyB')) {
            // Toggle build mode or cycle through buildings
            this.handleBuildModeToggle();
        }
        
        if (this.inputManager.isKeyPressedDebounced('Escape')) {
            // Exit build mode
            this.buildingManager.exitPlacementMode();
        }
        
        if (this.inputManager.isKeyPressedDebounced('KeyE')) {
            // Spawn enemy for testing
            const mousePos = this.inputManager.getWorldMousePos();
            this.enemyManager.spawnEnemyAt(mousePos.x, mousePos.y, 'Raider');
        }
        
        if (this.inputManager.isKeyPressedDebounced('KeyF')) {
            // Cycle through factions (F key)
            this.cycleFaction();
        }
        
        // Handle mouse clicks
        const clicks = this.inputManager.getClicks();
        
        for (const click of clicks) {
            if (click.button === 0) { // Left mouse button
                if (this.buildingManager.isPlacementMode) {
                    // Try to place building
                    this.buildingManager.tryPlaceBuilding(click.x, click.y, this.renderer.terrain);
                } else {
                    // Check if clicking on a unit first
                    const selectedUnit = this.unitManager.selectUnitAt(click.x, click.y, this.playerUnits);
                    
                    if (selectedUnit) {
                        // Handle unit selection
                        this.unitManager.selectUnit(selectedUnit);
                    } else {
                        // Check if clicking on a building
                        const building = this.buildingManager.selectBuildingAt(click.x, click.y);
                        if (building) {
                            // Clear unit selection when selecting buildings
                            this.unitManager.clearSelection();
                            this.handleBuildingClick(building);
                        } else {
                            // Clear unit selection and spawn harvester if not clicking on anything
                            this.unitManager.clearSelection();
                            this.spawnHarvester(click.x, click.y);
                        }
                    }
                }
            } else if (click.button === 2) { // Right mouse button
                console.log(`🎯 Processing right-click at (${Math.round(click.x)}, ${Math.round(click.y)})`);
                
                // Right click to exit build mode or issue move commands
                if (this.buildingManager.isPlacementMode) {
                    console.log('🚫 Exiting build mode');
                    this.buildingManager.exitPlacementMode();
                } else if (this.unitManager.hasSelection()) {
                    console.log(`📋 Issuing move command to ${this.unitManager.getSelectedUnits().length} units`);
                    // Issue move command to selected units
                    this.unitManager.issueMoveCommand(click.x, click.y);
                } else {
                    console.log('🔄 No units selected, clearing building selection');
                    // Clear selections if no units selected
                    this.buildingManager.selectedBuilding = null;
                }
            }
        }
    }
    
    handleBuildModeToggle() {
        // Toggle building menu instead of cycling through buildings
        if (this.buildingMenu) {
            this.buildingMenu.toggle();
        } else {
            // Fallback to old system if menu not available
            if (this.buildingManager.isPlacementMode) {
                this.buildingManager.exitPlacementMode();
            } else {
                const availableBuildings = ['SpiceRefinery', 'GunTurret', 'ConstructionYard', 'Barracks'];
                const currentIndex = this.currentBuildingIndex || 0;
                const buildingType = availableBuildings[currentIndex % availableBuildings.length];
                
                this.buildingManager.enterPlacementMode(buildingType);
                this.currentBuildingIndex = (currentIndex + 1) % availableBuildings.length;
            }
        }
    }

    handleBuildingClick(building) {
        console.log(`🏢 Clicked on ${building.type} at (${building.gridX}, ${building.gridY})`);
        
        // If clicking on a barracks, open the unit menu
        if (building.type === 'Barracks' && building.isConstructed && building.isActive) {
            this.unitMenu.show(building);
        } else {
            // For other buildings, just show info (future feature)
            console.log(`ℹ️ Building info: ${building.type} - Health: ${building.currentHealth}/${building.maxHealth}`);
        }
    }
    
    // Spawn a harvester at the given world position
    spawnHarvester(worldX, worldY) {
        const harvester = new Harvester(worldX, worldY, this.nextHarvesterId++);
        harvester.homeDepot = this.depot;
        this.harvesters.push(harvester);
        console.log(`🚗 Harvester ${harvester.id} spawned at (${Math.round(worldX)}, ${Math.round(worldY)})`);
        return harvester;
    }
    
    // Event handling for game state changes
    onVisibilityChange() {
        if (document.hidden) {
            console.log('🔇 Game paused (tab not visible)');
            // Could pause the game here if needed
        } else {
            console.log('🔊 Game resumed (tab visible)');
            // Reset timing to prevent large delta jumps
            this.lastFrameTime = performance.now();
        }
    }
    
    // AI Player Management
    initializeAIPlayers() {
        // Initialize technology tree for player
        this.technologyTree.initializePlayer(1, this.playerFaction);
        
        // Create AI opponents
        const aiFactions = ['harkonnen', 'ordos'];
        const difficulties = ['normal', 'hard'];
        
        for (let i = 0; i < aiFactions.length; i++) {
            const factionData = this.factionManager.getFaction(aiFactions[i]);
            const ai = new AIPlayer(factionData, difficulties[i], i + 2);
            ai.setFactionData(factionData);
            
            // Initialize AI tech tree
            this.technologyTree.initializePlayer(ai.playerNumber, aiFactions[i]);
            
            this.aiPlayers.push(ai);
            
            console.log(`🤖 AI Player ${ai.playerNumber} created: ${factionData.name} (${difficulties[i]})`);
        }
        
        console.log(`🏛️ Faction warfare initialized! Player: ${this.playerFaction.toUpperCase()}`);
    }
    
    updateAIPlayers(deltaTime) {
        const gameState = {
            buildings: this.buildingManager.buildings,
            enemies: this.enemyManager.enemies,
            harvesters: this.harvesters,
            depot: this.depot,
            spiceNodes: this.resourceManager.spiceNodes,
            projectiles: this.combatManager.projectiles || []
        };
        
        for (const ai of this.aiPlayers) {
            ai.update(deltaTime, gameState);
        }
    }
    
    // Faction and Technology methods
    getFactionManager() {
        return this.factionManager;
    }
    
    getTechnologyTree() {
        return this.technologyTree;
    }
    
    getPlayerFaction() {
        return this.playerFaction;
    }
    
    setPlayerFaction(factionId) {
        if (this.factionManager.getFaction(factionId)) {
            this.playerFaction = factionId;
            // Reinitialize technology tree for new faction
            this.technologyTree.initializePlayer(1, this.playerFaction);
            console.log(`🏛️ Player faction changed to ${factionId.toUpperCase()}`);
        }
    }
    
    // Cycle through available factions
    cycleFaction() {
        const availableFactions = ['atreides', 'harkonnen', 'ordos'];
        const currentIndex = availableFactions.indexOf(this.playerFaction);
        const nextIndex = (currentIndex + 1) % availableFactions.length;
        const nextFaction = availableFactions[nextIndex];
        
        this.setPlayerFaction(nextFaction);
        
        // Display faction change notification
        const factionData = this.factionManager.getFaction(nextFaction);
        console.log(`🏛️ Switched to ${factionData.name}: ${factionData.description}`);
    }
    
    // Research technology for player
    researchTechnology(techId) {
        return this.technologyTree.startResearch(1, techId, this.playerFaction);
    }
    
    // Get available technologies for player
    getAvailableTechnologies() {
        return this.technologyTree.getAvailableTechnologies(1, this.playerFaction);
    }
    
    // Get player's researched technologies
    getPlayerTechnologies() {
        return this.technologyTree.getResearchedTechnologies(1);
    }
    
    // Spawn faction-specific units
    spawnFactionUnit(unitType, x, y, factionId = null) {
        const faction = factionId || this.playerFaction;
        const factionData = this.factionManager.getFaction(faction);
        
        if (!factionData || !factionData.uniqueUnits[unitType]) {
            console.warn(`❌ Unit type ${unitType} not available for faction ${faction}`);
            return null;
        }
        
        let unit = null;
        const ownerId = factionId ? this.getAIPlayerByFaction(factionId)?.playerNumber || 1 : 1;
        
        switch (unitType) {
            case 'AtreidesInfantry':
                unit = new AtreidesInfantry(x, y, ownerId);
                break;
            case 'HarkonnenTrooper':
                unit = new HarkonnenTrooper(x, y, ownerId);
                break;
            // Add more faction units as they're implemented
            default:
                console.warn(`❌ Unit class not implemented: ${unitType}`);
                return null;
        }
        
        // Add to appropriate collection
        if (ownerId === 1) {
            // Player unit - add to appropriate player collection
            console.log(`⚔️ Player unit spawned: ${unitType}`);
        } else {
            // AI unit - add to AI player's collection
            const ai = this.aiPlayers.find(ai => ai.playerNumber === ownerId);
            if (ai) {
                ai.units.push(unit);
                console.log(`🤖 AI unit spawned: ${unitType} (Player ${ownerId})`);
            }
        }
        
        return unit;
    }
    
    getAIPlayerByFaction(factionId) {
        return this.aiPlayers.find(ai => ai.factionData && ai.factionData.name.toLowerCase().includes(factionId));
    }
    
    // Debug methods for testing faction system
    debugSpawnFactionUnits() {
        // Spawn test units for each faction
        this.spawnFactionUnit('AtreidesInfantry', 100, 100, 'atreides');
        this.spawnFactionUnit('HarkonnenTrooper', 150, 100, 'harkonnen');
        
        console.log('🧪 Debug: Faction units spawned for testing');
    }
    
    debugStartResearch() {
        // Start research for player and AIs
        this.researchTechnology('AdvancedShields');
        
        for (const ai of this.aiPlayers) {
            const availableTech = this.technologyTree.getAvailableTechnologies(ai.playerNumber, ai.factionData.name.toLowerCase());
            if (availableTech.length > 0) {
                this.technologyTree.startResearch(ai.playerNumber, availableTech[0].id, ai.factionData.name.toLowerCase());
            }
        }
        
        console.log('🔬 Debug: Research started for all players');
    }

    // Debug method to manually spawn a unit for testing
    debugSpawnUnit(unitType = 'Infantry', x = 200, y = 200) {
        // Import Infantry class dynamically
        import('../entities/Infantry.js').then(module => {
            const Infantry = module.Infantry;
            let unit = null;
            
            switch (unitType) {
                case 'Infantry':
                    unit = new Infantry(x, y, 1);
                    break;
                case 'Scout':
                    unit = new Infantry(x, y, 1);
                    unit.type = 'Scout';
                    unit.speed = 80;
                    unit.maxHealth = 30;
                    unit.currentHealth = 30;
                    break;
                case 'Heavy Infantry':
                    unit = new Infantry(x, y, 1);
                    unit.type = 'Heavy Infantry';
                    unit.speed = 40;
                    unit.maxHealth = 80;
                    unit.currentHealth = 80;
                    unit.damage = 25;
                    break;
                default:
                    console.warn(`❌ Unknown unit type: ${unitType}`);
                    return;
            }
            
            if (unit) {
                this.playerUnits.push(unit);
                console.log(`🧪 Debug: Spawned ${unitType} at (${x}, ${y}) - Total units: ${this.playerUnits.length}`);
            }
        }).catch(error => {
            console.error('Failed to import Infantry class:', error);
        });
    }

    // Debug method to test tracer effects
    debugTestTracer(startX = 100, startY = 100, endX = 300, endY = 200) {
        if (!this.visualEffects) {
            console.log('❌ Visual effects system not initialized');
            return;
        }
        
        // Create muzzle flash
        this.visualEffects.createMuzzleFlash(startX, startY, 0, {
            color: '#FFFF88',
            size: 8,
            duration: 0.12
        });
        
        // Create tracer
        this.visualEffects.createTracer(startX, startY, endX, endY, {
            color: '#FFD700',
            width: 3,
            length: 20,
            speed: 800
        });
        
        console.log(`🎯 Debug: Created tracer from (${startX}, ${startY}) to (${endX}, ${endY})`);
    }

    // Get current game state for UI updates
    getGameState() {
        return {
            harvesters: this.harvesters,
            playerUnits: this.playerUnits,
            buildings: this.buildingManager.buildings,
            depot: this.depot,
            enemies: this.enemyManager.enemies,
            spice: this.depot ? this.depot.spiceStored : 0,
            faction: this.playerFaction,
            camera: this.camera,
            isPlacementMode: this.buildingManager.isPlacementMode,
            selectedBuildingType: this.buildingManager.selectedBuildingType
        };
    }
}

// Initialize and start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 RTS-01: Desert Warfare - Milestone 6');
    console.log('🏛️ AI & Multiple Factions - House Atreides, Harkonnen & Ordos');
    
    // Create and start the game
    window.game = new Game();
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
        window.game.onVisibilityChange();
    });
    
    // Add some helpful console commands for debugging
    console.log('🔧 Debug Commands:');
    console.log('  game.getCamera().center() - Center camera');
    console.log('  game.getCamera().setZoom(2.0) - Set zoom level');
    console.log('  game.getCamera().moveTo(x, y) - Move camera to position');
    console.log('  game.spawnHarvester(x, y) - Spawn harvester at position');
            console.log('  game.debugSpawnFactionUnits() - Test faction units');
        console.log('  game.debugStartResearch() - Start technology research');
        console.log('  game.researchTechnology("AdvancedShields") - Research specific tech');
        console.log('  game.getAvailableTechnologies() - Show available research');
        console.log('  game.debugSpawnUnit("Infantry", 200, 200) - Spawn unit for testing');
        console.log('  game.debugTestTracer(100, 100, 300, 200) - Test tracer effects');
        console.log('  Hold "I" key to show debug information');
    console.log('');
    console.log('🎮 How to Play:');
    console.log('  • Left click to spawn harvesters or place buildings');
    console.log('  • Press B to cycle through building types');
    console.log('  • Press E to spawn enemy (testing)');
    console.log('  • Press Esc to exit build mode');
    console.log('  • Right click to cancel or deselect');
    console.log('  • Turrets automatically defend against enemies');
});

// Handle any unhandled errors gracefully
window.addEventListener('error', (event) => {
    console.error('🚨 Game Error:', event.error);
    // Could show user-friendly error message here
}); 