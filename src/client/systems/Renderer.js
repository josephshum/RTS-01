export class Renderer {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = camera;
        
        // Map settings
        this.mapWidth = 100;
        this.mapHeight = 100;
        this.tileSize = 32;
        
        // Terrain generation
        this.terrain = this.generateTerrain();
        
        // Rendering layers
        this.layers = {
            terrain: true,
            spice: true,
            buildings: true,
            units: true,
            effects: true,
            ui: true,
            debug: false
        };
        
        // Performance tracking
        this.frameCount = 0;
        this.lastRenderTime = 0;
        
        console.log('🎨 Renderer initialized with desert terrain');
    }
    
    generateTerrain() {
        const terrain = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            terrain[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // Generate varied desert terrain
                const noise = this.simplerNoise(x * 0.1, y * 0.1);
                const terrainType = this.getTerrainType(noise);
                
                terrain[y][x] = {
                    type: terrainType,
                    elevation: noise,
                    passable: terrainType !== 'rock',
                    color: this.getTerrainColor(terrainType, noise)
                };
            }
        }
        
        return terrain;
    }
    
    simplerNoise(x, y) {
        return (Math.sin(x * 2.1) + Math.cos(y * 1.7) + Math.sin((x + y) * 0.8)) * 0.3 + 0.5;
    }
    
    getTerrainType(noise) {
        if (noise < 0.3) return 'sand';
        if (noise < 0.6) return 'dune';
        if (noise < 0.8) return 'hardpan';
        return 'rock';
    }
    
    getTerrainColor(type, noise) {
        const brightness = 0.7 + noise * 0.3;
        
        switch (type) {
            case 'sand':
                return `rgb(${Math.floor(194 * brightness)}, ${Math.floor(178 * brightness)}, ${Math.floor(128 * brightness)})`;
            case 'dune':
                return `rgb(${Math.floor(218 * brightness)}, ${Math.floor(165 * brightness)}, ${Math.floor(32 * brightness)})`;
            case 'hardpan':
                return `rgb(${Math.floor(160 * brightness)}, ${Math.floor(140 * brightness)}, ${Math.floor(100 * brightness)})`;
            case 'rock':
                return `rgb(${Math.floor(120 * brightness)}, ${Math.floor(100 * brightness)}, ${Math.floor(80 * brightness)})`;
            default:
                return '#C2B280';
        }
    }
    
    render(gameState) {
        this.frameCount++;
        const startTime = performance.now();
        
        // Clear canvas
        this.ctx.fillStyle = '#2B1B0F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get camera bounds for culling
        const bounds = this.camera.getBounds();
        
        // Render layers in order
        if (this.layers.terrain) this.renderTerrain(bounds);
        if (this.layers.spice) this.renderSpice(gameState.spiceNodes || [], bounds);
        if (this.layers.buildings) this.renderBuildings(gameState.buildings || [], bounds);
        if (this.layers.units) this.renderUnits(gameState, bounds);
        if (this.layers.effects) this.renderEffects(gameState, bounds);
        if (this.layers.ui) this.renderUI(gameState);
        if (this.layers.debug) this.renderDebug(gameState, bounds);
        
        this.lastRenderTime = performance.now() - startTime;
    }
    
    renderTerrain(bounds) {
        const startX = Math.max(0, Math.floor(bounds.left / this.tileSize));
        const endX = Math.min(this.mapWidth, Math.ceil(bounds.right / this.tileSize));
        const startY = Math.max(0, Math.floor(bounds.top / this.tileSize));
        const endY = Math.min(this.mapHeight, Math.ceil(bounds.bottom / this.tileSize));
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.terrain[y][x];
                const worldX = x * this.tileSize;
                const worldY = y * this.tileSize;
                
                const screenPos = this.camera.worldToScreen(worldX, worldY);
                const size = this.tileSize * this.camera.zoom;
                
                this.ctx.fillStyle = tile.color;
                this.ctx.fillRect(screenPos.x, screenPos.y, size, size);
            }
        }
    }
    
    renderSpice(spiceNodes, bounds) {
        for (const spice of spiceNodes) {
            if (!this.camera.isVisible(spice.x, spice.y, 50)) continue;
            
            const screenPos = this.camera.worldToScreen(spice.x, spice.y);
            const size = 32 * this.camera.zoom;
            
            // Spice glow effect
            const gradient = this.ctx.createRadialGradient(
                screenPos.x + size/2, screenPos.y + size/2, 0,
                screenPos.x + size/2, screenPos.y + size/2, size/2
            );
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.7, '#FF8C00');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(screenPos.x, screenPos.y, size, size);
            
            // Amount indicator
            if (this.camera.zoom > 0.5) {
                this.ctx.fillStyle = '#FFF';
                this.ctx.font = `${Math.max(10, 12 * this.camera.zoom)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    Math.ceil(spice.amount), 
                    screenPos.x + size/2, 
                    screenPos.y + size/2 + 4
                );
            }
        }
    }
    
    renderBuildings(buildings, bounds) {
        // First, render queued building placeholders
        this.renderQueuedBuildings(buildings, bounds);
        
        // Then render actual buildings
        for (const building of buildings) {
            if (!this.camera.isVisible(building.x, building.y, 100)) continue;
            
            const screenPos = this.camera.worldToScreen(building.x, building.y);
            const width = building.width * this.camera.zoom;
            const height = building.height * this.camera.zoom;
            
            // Building base
            this.ctx.fillStyle = building.isConstructed ? '#4A4A4A' : '#2A2A2A';
            this.ctx.fillRect(screenPos.x, screenPos.y, width, height);
            
            // Building type indicator
            this.ctx.fillStyle = this.getBuildingColor(building.type);
            this.ctx.fillRect(screenPos.x + 2, screenPos.y + 2, width - 4, height - 4);
            
            // Construction progress
            if (!building.isConstructed) {
                const progress = building.getConstructionPercentage() / 100; // Convert percentage to decimal
                const progressBarHeight = 4 * this.camera.zoom;
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(screenPos.x, screenPos.y + height - progressBarHeight, width * progress, progressBarHeight);
            }
            
            // Health bar
            if (building.currentHealth < building.maxHealth) {
                const healthPercent = building.currentHealth / building.maxHealth;
                const healthBarHeight = 4 * this.camera.zoom;
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(screenPos.x, screenPos.y - 8 * this.camera.zoom, width, healthBarHeight);
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(screenPos.x, screenPos.y - 8 * this.camera.zoom, width * healthPercent, healthBarHeight);
            }
            
            // Selection indicator
            if (building.isSelected) {
                this.ctx.strokeStyle = '#00FFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(screenPos.x - 2, screenPos.y - 2, width + 4, height + 4);
            }
            
            // Turret range indicator (when selected or in debug mode)
            if (building.type === 'GunTurret' && (building.isSelected || this.layers.debug)) {
                this.renderTurretRange(building, screenPos, width, height);
            }
            
            // Construction Yard range indicator (when selected or in debug mode)
            if (building.type === 'ConstructionYard' && (building.isSelected || this.layers.debug)) {
                this.renderConstructionRange(building, screenPos, width, height);
            }
        }
    }
    
    renderQueuedBuildings(buildings, bounds) {
        // Find all construction yards and render their queued buildings
        for (const building of buildings) {
            if (building.type === 'ConstructionYard' && building.buildQueue) {
                for (let i = 0; i < building.buildQueue.length; i++) {
                    const queuedBuilding = building.buildQueue[i];
                    const worldX = queuedBuilding.gridX * 32;
                    const worldY = queuedBuilding.gridY * 32;
                    
                    if (!this.camera.isVisible(worldX, worldY, 100)) continue;
                    
                    const screenPos = this.camera.worldToScreen(worldX, worldY);
                    // Assume standard building size if not specified
                    const width = 64 * this.camera.zoom; // 2x2 grid default
                    const height = 64 * this.camera.zoom;
                    
                    // Render placeholder as dashed outline
                    this.ctx.strokeStyle = '#FFFF00'; // Yellow for queued
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]); // Dashed line
                    this.ctx.strokeRect(screenPos.x, screenPos.y, width, height);
                    
                    // Semi-transparent fill
                    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)'; // Transparent yellow
                    this.ctx.fillRect(screenPos.x, screenPos.y, width, height);
                    
                    // Building type indicator (smaller, centered)
                    const innerSize = Math.min(width, height) * 0.6;
                    const centerX = screenPos.x + width / 2 - innerSize / 2;
                    const centerY = screenPos.y + height / 2 - innerSize / 2;
                    this.ctx.fillStyle = this.getBuildingColor(queuedBuilding.type);
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.fillRect(centerX, centerY, innerSize, innerSize);
                    this.ctx.globalAlpha = 1.0;
                    
                    // Queue position indicator
                    if (this.camera.zoom > 0.5) {
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.font = `bold ${Math.max(12, 16 * this.camera.zoom)}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(
                            `#${i + 1}`, 
                            screenPos.x + width / 2, 
                            screenPos.y + height / 2 + 6
                        );
                    }
                    
                    // Reset line dash
                    this.ctx.setLineDash([]);
                }
            }
        }
    }
    
    getBuildingColor(type) {
        switch (type) {
            case 'ConstructionYard': return '#8B4513';
            case 'SpiceRefinery': return '#FFD700';
            case 'GunTurret': return '#FF4500';
            default: return '#666666';
        }
    }
    
    renderTurretRange(turret, screenPos, width, height) {
        if (!turret.attackRange) return;
        
        // Calculate turret center in world coordinates
        const turretCenterX = turret.x + turret.width / 2;
        const turretCenterY = turret.y + turret.height / 2;
        
        // Convert to screen coordinates
        const centerScreenPos = this.camera.worldToScreen(turretCenterX, turretCenterY);
        
        // Calculate range radius in pixels (convert grid tiles to world pixels, then scale by zoom)
        const rangeInPixels = turret.attackRange * 32 * this.camera.zoom;
        
        // Render attack range circle
        this.ctx.strokeStyle = turret.isActive ? '#FF4500' : '#888888'; // Orange if active, gray if inactive
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]); // Dashed line for range
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.arc(centerScreenPos.x, centerScreenPos.y, rangeInPixels, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Render detection range circle (slightly larger, fainter)
        if (turret.detectionRange && turret.detectionRange > turret.attackRange) {
            const detectionRangeInPixels = turret.detectionRange * 32 * this.camera.zoom;
            this.ctx.strokeStyle = turret.isActive ? '#FFAA00' : '#666666'; // Lighter orange if active
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 8]); // Different dash pattern
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(centerScreenPos.x, centerScreenPos.y, detectionRangeInPixels, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Reset drawing state
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
        
        // Show range text when zoomed in enough
        if (this.camera.zoom > 0.7) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `${Math.max(10, 12 * this.camera.zoom)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `Range: ${turret.attackRange}`, 
                centerScreenPos.x, 
                centerScreenPos.y + rangeInPixels + 20
            );
        }
    }
    
    renderConstructionRange(constructionYard, screenPos, width, height) {
        if (!constructionYard.constructionRange) return;
        
        // Calculate construction yard center in world coordinates
        const centerX = constructionYard.x + constructionYard.width / 2;
        const centerY = constructionYard.y + constructionYard.height / 2;
        
        // Convert to screen coordinates
        const centerScreenPos = this.camera.worldToScreen(centerX, centerY);
        
        // Handle unlimited range
        if (constructionYard.constructionRange === Infinity) {
            // Show a special indicator for unlimited range
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `bold ${Math.max(12, 14 * this.camera.zoom)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                'UNLIMITED BUILD RANGE', 
                centerScreenPos.x, 
                centerScreenPos.y - 60
            );
            
            // Draw a special unlimited range symbol (infinity-like shape)
            this.ctx.strokeStyle = constructionYard.isActive ? '#FFD700' : '#888888'; // Gold if active
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([8, 4]);
            this.ctx.globalAlpha = 0.6;
            
            // Draw expanding circles to indicate unlimited range
            for (let i = 1; i <= 3; i++) {
                const radius = i * 50 * this.camera.zoom;
                this.ctx.beginPath();
                this.ctx.arc(centerScreenPos.x, centerScreenPos.y, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 1.0;
            return;
        }
        
        // Calculate range radius in pixels (convert grid tiles to world pixels, then scale by zoom)
        const rangeInPixels = constructionYard.constructionRange * 32 * this.camera.zoom;
        
        // Render construction range as a circle
        this.ctx.strokeStyle = constructionYard.isActive ? '#8B4513' : '#555555'; // Brown if active, gray if inactive
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([12, 6]); // Longer dashes for construction range
        this.ctx.globalAlpha = 0.4;
        this.ctx.beginPath();
        this.ctx.arc(centerScreenPos.x, centerScreenPos.y, rangeInPixels, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add a subtle fill to show the construction area
        this.ctx.fillStyle = constructionYard.isActive ? 'rgba(139, 69, 19, 0.1)' : 'rgba(85, 85, 85, 0.1)'; // Very light brown
        this.ctx.fill();
        
        // Reset drawing state
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
        
        // Show range text when zoomed in enough
        if (this.camera.zoom > 0.7) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `bold ${Math.max(10, 12 * this.camera.zoom)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `Build Range: ${constructionYard.constructionRange}`, 
                centerScreenPos.x, 
                centerScreenPos.y + rangeInPixels + 20
            );
        }
    }
    
    renderUnits(gameState, bounds) {
        // Render harvesters
        if (gameState.harvesters) {
            for (const harvester of gameState.harvesters) {
                if (!this.camera.isVisible(harvester.x, harvester.y, 50)) continue;
                
                const screenPos = this.camera.worldToScreen(harvester.x, harvester.y);
                const width = harvester.width * this.camera.zoom;
                const height = harvester.height * this.camera.zoom;
                
                // Harvester body
                this.ctx.fillStyle = harvester.getStateColor();
                this.ctx.fillRect(screenPos.x, screenPos.y, width, height);
                
                // Cargo indicator
                if (harvester.currentCargo > 0) {
                    const cargoPercent = harvester.getCargoPercentage();
                    const cargoBarHeight = 4 * this.camera.zoom;
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(screenPos.x, screenPos.y - 6 * this.camera.zoom, width * cargoPercent, cargoBarHeight);
                }
                
                // Health bar
                if (harvester.currentHealth < harvester.maxHealth) {
                    const healthPercent = harvester.getHealthPercentage();
                    const healthBarHeight = 4 * this.camera.zoom;
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(screenPos.x, screenPos.y + height + 2 * this.camera.zoom, width, healthBarHeight);
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(screenPos.x, screenPos.y + height + 2 * this.camera.zoom, width * healthPercent, healthBarHeight);
                }
                
                // Selection indicator
                if (harvester.isSelected) {
                    this.ctx.strokeStyle = '#00FFFF';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(screenPos.x - 2, screenPos.y - 2, width + 4, height + 4);
                }
            }
        }
        
        // Render depot
        if (gameState.depot) {
            const depot = gameState.depot;
            if (this.camera.isVisible(depot.x, depot.y, 100)) {
                const screenPos = this.camera.worldToScreen(depot.x, depot.y);
                const size = 64 * this.camera.zoom;
                
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(screenPos.x - size/2, screenPos.y - size/2, size, size);
                
                // Storage indicator
                const storagePercent = depot.getStoragePercentage();
                const storageBarHeight = 6 * this.camera.zoom;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(screenPos.x - size/2, screenPos.y + size/2 - 8 * this.camera.zoom, size * storagePercent, storageBarHeight);
            }
        }
        
        // Render enemies
        if (gameState.enemies) {
            for (const enemy of gameState.enemies) {
                if (enemy.state === 'dead' || !this.camera.isVisible(enemy.x, enemy.y, 50)) continue;
                
                const screenPos = this.camera.worldToScreen(enemy.x, enemy.y);
                const size = enemy.size * this.camera.zoom;
                
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(screenPos.x, screenPos.y, size, size);
                
                // Health bar
                if (enemy.currentHealth < enemy.maxHealth) {
                    const healthPercent = enemy.currentHealth / enemy.maxHealth;
                    const healthBarHeight = 4 * this.camera.zoom;
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(screenPos.x, screenPos.y - 8 * this.camera.zoom, size, healthBarHeight);
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(screenPos.x, screenPos.y - 8 * this.camera.zoom, size * healthPercent, healthBarHeight);
                }
            }
        }
    }
    
    renderEffects(gameState, bounds) {
        const combatManager = gameState.combatManager;
        if (!combatManager) return;
        
        // Render projectiles
        for (const projectile of combatManager.projectiles) {
            if (!this.camera.isVisible(projectile.x, projectile.y, 10)) continue;
            
            const screenPos = this.camera.worldToScreen(projectile.x, projectile.y);
            
            this.ctx.fillStyle = projectile.color || '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 3 * this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Render explosions
        for (const explosion of combatManager.explosions) {
            if (!this.camera.isVisible(explosion.x, explosion.y, explosion.radius)) continue;
            
            const screenPos = this.camera.worldToScreen(explosion.x, explosion.y);
            const radius = explosion.radius * this.camera.zoom;
            
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, radius
            );
            gradient.addColorStop(0, `rgba(255, 255, 0, ${explosion.intensity})`);
            gradient.addColorStop(0.5, `rgba(255, 165, 0, ${explosion.intensity * 0.7})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Render damage numbers
        for (const damageNumber of combatManager.damageNumbers) {
            const screenPos = this.camera.worldToScreen(damageNumber.x, damageNumber.y);
            
            this.ctx.fillStyle = `rgba(255, 0, 0, ${damageNumber.opacity})`;
            this.ctx.font = `bold ${16 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(damageNumber.damage.toString(), screenPos.x, screenPos.y);
        }
    }
    
    renderUI(gameState) {
        // Building placement preview
        const buildingManager = gameState.buildingManager;
        if (buildingManager && buildingManager.isPlacementMode) {
            const mousePos = gameState.mouseWorldPosition || { x: 0, y: 0 };
            const preview = buildingManager.getPlacementPreview(mousePos.x, mousePos.y);
            
            if (preview) {
                const screenPos = this.camera.worldToScreen(preview.x, preview.y);
                const width = preview.width * this.camera.zoom;
                const height = preview.height * this.camera.zoom;
                
                this.ctx.fillStyle = preview.canPlace ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                this.ctx.fillRect(screenPos.x, screenPos.y, width, height);
                
                this.ctx.strokeStyle = preview.canPlace ? '#00FF00' : '#FF0000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(screenPos.x, screenPos.y, width, height);
            }
        }
    }
    
    renderDebug(gameState, bounds) {
        // Grid overlay
        if (this.camera.zoom > 0.5) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            
            const gridSize = 32;
            const startX = Math.floor(bounds.left / gridSize) * gridSize;
            const endX = Math.ceil(bounds.right / gridSize) * gridSize;
            const startY = Math.floor(bounds.top / gridSize) * gridSize;
            const endY = Math.ceil(bounds.bottom / gridSize) * gridSize;
            
            for (let x = startX; x <= endX; x += gridSize) {
                const screenX = this.camera.worldToScreen(x, 0).x;
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, 0);
                this.ctx.lineTo(screenX, this.canvas.height);
                this.ctx.stroke();
            }
            
            for (let y = startY; y <= endY; y += gridSize) {
                const screenY = this.camera.worldToScreen(0, y).y;
                this.ctx.beginPath();
                this.ctx.moveTo(0, screenY);
                this.ctx.lineTo(this.canvas.width, screenY);
                this.ctx.stroke();
            }
        }
        
        // Performance info
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Render: ${this.lastRenderTime.toFixed(2)}ms`, 10, this.canvas.height - 20);
    }
    
    toggleLayer(layerName) {
        if (this.layers.hasOwnProperty(layerName)) {
            this.layers[layerName] = !this.layers[layerName];
            console.log(`🎨 Toggled ${layerName} layer: ${this.layers[layerName]}`);
        }
    }
    
    setLayerVisibility(layerName, visible) {
        if (this.layers.hasOwnProperty(layerName)) {
            this.layers[layerName] = visible;
        }
    }
} 