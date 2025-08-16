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
        // Add spice patches randomly across the map
        const spiceChance = Math.random();
        if (spiceChance < 0.08 && noise > 0.2 && noise < 0.7) { // 8% chance for spice in suitable terrain
            return 'spice';
        }
        
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
            case 'spice':
                return `rgb(${Math.floor(255 * brightness)}, ${Math.floor(200 * brightness)}, ${Math.floor(50 * brightness)})`;
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
        if (this.layers.ui) this.renderSelectionUI(gameState);
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
            
            // Special rendering for turrets
            if (building.type === 'GunTurret') {
                this.renderTurret(building, screenPos, width, height);
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
    
    renderTurret(turret, screenPos, width, height) {
        const centerX = screenPos.x + width / 2;
        const centerY = screenPos.y + height / 2;
        const time = Date.now() * 0.001;
        
        this.ctx.save();
        
        // Enhanced turret base
        const baseRadius = Math.min(width, height) * 0.4;
        
        // Base platform (dark gray)
        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, baseRadius + 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main turret base (orange)
        this.ctx.fillStyle = turret.isActive ? '#FF4500' : '#8B2500';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rotating cannon assembly
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(turret.rotation || 0);
        
        // Cannon barrel
        const barrelLength = width * 0.6;
        const barrelWidth = height * 0.15;
        
        // Barrel shadow/outline
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.fillRect(-barrelWidth/2, -barrelWidth/2 - 1, barrelLength + 2, barrelWidth + 2);
        
        // Main barrel
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(-barrelWidth/2, -barrelWidth/2, barrelLength, barrelWidth);
        
        // Barrel details
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(barrelLength * 0.1, -barrelWidth/2, 2, barrelWidth); // Band
        this.ctx.fillRect(barrelLength * 0.3, -barrelWidth/2, 1, barrelWidth); // Ring
        
        // Barrel tip
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(barrelLength, -barrelWidth/4, 3, barrelWidth/2);
        
        // Muzzle flash effect
        if (turret.muzzleFlash && turret.muzzleFlash > 0) {
            const flashSize = barrelWidth * (1 + turret.muzzleFlash);
            const flashLength = barrelLength * 0.3 * turret.muzzleFlash;
            
            this.ctx.fillStyle = `rgba(255, 255, 0, ${turret.muzzleFlash})`;
            this.ctx.fillRect(barrelLength, -flashSize/2, flashLength, flashSize);
            
            // Muzzle smoke
            this.ctx.fillStyle = `rgba(128, 128, 128, ${turret.muzzleFlash * 0.5})`;
            this.ctx.fillRect(barrelLength + flashLength, -flashSize/3, flashLength/2, flashSize/1.5);
        }
        
        this.ctx.restore();
        
        // Targeting indicator
        if (turret.currentTarget && turret.isActive) {
            const targetScreenPos = this.camera.worldToScreen(turret.currentTarget.x, turret.currentTarget.y);
            
            // Targeting line
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + 0.2 * Math.sin(time * 5)})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(targetScreenPos.x, targetScreenPos.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Target reticle
            const reticleSize = 8 * this.camera.zoom;
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${0.6 + 0.3 * Math.sin(time * 8)})`;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                targetScreenPos.x - reticleSize/2,
                targetScreenPos.y - reticleSize/2,
                reticleSize,
                reticleSize
            );
            
            // Crosshairs
            this.ctx.beginPath();
            this.ctx.moveTo(targetScreenPos.x - reticleSize, targetScreenPos.y);
            this.ctx.lineTo(targetScreenPos.x + reticleSize, targetScreenPos.y);
            this.ctx.moveTo(targetScreenPos.x, targetScreenPos.y - reticleSize);
            this.ctx.lineTo(targetScreenPos.x, targetScreenPos.y + reticleSize);
            this.ctx.stroke();
        }
        
        // Veterancy indicators around the base
        if (turret.veterancyLevel > 0) {
            const starRadius = baseRadius + 8;
            for (let i = 0; i < turret.veterancyLevel; i++) {
                const angle = (i * Math.PI * 2) / turret.maxVeterancyLevel;
                const starX = centerX + Math.cos(angle) * starRadius;
                const starY = centerY + Math.sin(angle) * starRadius;
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = `bold ${8 * this.camera.zoom}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText('★', starX, starY + 3);
            }
        }
        
        // Status indicators
        if (this.camera.zoom > 0.8) {
            // Activity status
            const statusY = screenPos.y + height + 15 * this.camera.zoom;
            this.ctx.fillStyle = turret.isActive ? '#00FF00' : '#FF0000';
            this.ctx.font = `${8 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                turret.isActive ? 'ONLINE' : 'OFFLINE',
                centerX,
                statusY
            );
            
            // Target status
            if (turret.currentTarget) {
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.fillText('TRACKING', centerX, statusY + 10 * this.camera.zoom);
            }
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
        // Render harvesters with enhanced visuals
        if (gameState.harvesters) {
            for (const harvester of gameState.harvesters) {
                if (!this.camera.isVisible(harvester.x, harvester.y, 50)) continue;
                
                this.renderHarvester(harvester);
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
        
        // Render player units
        if (gameState.playerUnits && gameState.playerUnits.length > 0) {
            for (const unit of gameState.playerUnits) {
                if (unit.state === 'destroyed' || !this.camera.isVisible(unit.x, unit.y, 50)) continue;
                
                this.renderPlayerUnit(unit);
            }
        }
        
        // Render enemies with enhanced visuals
        if (gameState.enemies) {
            for (const enemy of gameState.enemies) {
                if (enemy.state === 'dead' || !this.camera.isVisible(enemy.x, enemy.y, 50)) continue;
                
                this.renderEnemy(enemy);
            }
        }
    }
    
    renderHarvester(harvester) {
        const screenPos = this.camera.worldToScreen(harvester.x, harvester.y);
        const width = harvester.width * this.camera.zoom;
        const height = harvester.height * this.camera.zoom;
        const centerX = screenPos.x + width / 2;
        const centerY = screenPos.y + height / 2;
        const time = Date.now() * 0.001;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Rotate based on movement direction
        if (harvester.rotation !== undefined) {
            this.ctx.rotate(harvester.rotation);
        }
        
        // Main harvester body
        const bodyColor = this.getHarvesterBodyColor(harvester);
        
        // Body shadow/outline
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.fillRect(-width/2 - 1, -height/2 - 1, width + 2, height + 2);
        
        // Main body chassis
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(-width/2, -height/2, width, height);
        
        // Cabin (driver compartment)
        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.fillRect(-width/4, -height/2, width/2, height/3);
        
        // Windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(-width/5, -height/2 + 2, width/2.5, height/6);
        
        // Mining equipment based on state
        this.renderHarvesterEquipment(harvester, width, height, time);
        
        // Treads/wheels
        this.renderHarvesterTreads(harvester, width, height, time);
        
        // Exhaust and engine effects
        this.renderHarvesterExhaust(harvester, width, height, time);
        
        this.ctx.restore();
        
        // UI elements (rendered in world space, not rotated)
        this.renderHarvesterUI(harvester, screenPos, width, height);
    }
    
    getHarvesterBodyColor(harvester) {
        const baseColor = {
            'idle': { r: 180, g: 180, b: 60 },      // Yellow-brown
            'moving': { r: 100, g: 180, b: 100 },   // Green
            'harvesting': { r: 200, g: 130, b: 50 }, // Orange-brown  
            'returning': { r: 100, g: 150, b: 200 }  // Blue-gray
        };
        
        const color = baseColor[harvester.state] || baseColor['idle'];
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    
    renderHarvesterEquipment(harvester, width, height, time) {
        // Mining drill/collector at front
        if (harvester.state === 'harvesting') {
            // Animated drilling effect
            const drillRotation = time * 10;
            this.ctx.save();
            this.ctx.translate(width/2, 0);
            this.ctx.rotate(drillRotation);
            
            // Drill bit
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(-3, -6, 6, 12);
            this.ctx.fillRect(-6, -3, 12, 6);
            
            this.ctx.restore();
            
            // Spice collection particles
            for (let i = 0; i < 3; i++) {
                const particleX = width/2 + Math.cos(time * 5 + i) * 8;
                const particleY = Math.sin(time * 7 + i) * 4;
                this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + 0.3 * Math.sin(time * 8 + i)})`;
                this.ctx.fillRect(particleX - 1, particleY - 1, 2, 2);
            }
        } else {
            // Static mining equipment
            this.ctx.fillStyle = '#444444';
            this.ctx.fillRect(width/2 - 2, -height/4, 4, height/2);
        }
        
        // Cargo container
        const cargoHeight = height * 0.6;
        const cargoFillHeight = cargoHeight * harvester.getCargoPercentage();
        
        // Container outline
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-width/3, -cargoHeight/2, width/1.5, cargoHeight);
        
        // Cargo fill (spice)
        if (cargoFillHeight > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(-width/3 + 1, cargoHeight/2 - cargoFillHeight - 1, width/1.5 - 2, cargoFillHeight);
            
            // Sparkling spice effect
            if (harvester.currentCargo > 0) {
                for (let i = 0; i < 4; i++) {
                    const sparkleX = -width/3 + Math.random() * (width/1.5);
                    const sparkleY = cargoHeight/2 - cargoFillHeight + Math.random() * cargoFillHeight;
                    const sparkleAlpha = 0.3 + 0.4 * Math.sin(time * 15 + i);
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
                    this.ctx.fillRect(sparkleX - 0.5, sparkleY - 0.5, 1, 1);
                }
            }
        }
    }
    
    renderHarvesterTreads(harvester, width, height, time) {
        // Track movement animation
        const trackOffset = (harvester.state === 'moving') ? (time * 100) % 8 : 0;
        
        // Left tread
        this.ctx.fillStyle = '#2A2A2A';
        this.ctx.fillRect(-width/2, height/3, width, height/6);
        
        // Right tread  
        this.ctx.fillRect(-width/2, -height/2, width, height/6);
        
        // Tread details (moving segments)
        this.ctx.fillStyle = '#444444';
        for (let i = 0; i < width; i += 8) {
            const segmentX = -width/2 + i + trackOffset;
            if (segmentX < width/2) {
                this.ctx.fillRect(segmentX, height/3, 4, height/6);
                this.ctx.fillRect(segmentX, -height/2, 4, height/6);
            }
        }
    }
    
    renderHarvesterExhaust(harvester, width, height, time) {
        // Engine exhaust (back of harvester)
        if (harvester.state === 'moving' || harvester.state === 'harvesting') {
            const exhaustPulse = 0.4 + 0.3 * Math.sin(time * 6);
            this.ctx.fillStyle = `rgba(100, 100, 100, ${exhaustPulse})`;
            
            // Multiple exhaust pipes
            for (let i = 0; i < 2; i++) {
                const exhaustY = -height/4 + i * height/2;
                this.ctx.fillRect(-width/2 - 6, exhaustY - 2, 6, 4);
                
                // Smoke particles
                for (let j = 1; j <= 3; j++) {
                    const smokeX = -width/2 - 6 - j * 4;
                    const smokeY = exhaustY + Math.sin(time * 4 + j) * 2;
                    const smokeAlpha = exhaustPulse * (1 - j * 0.2);
                    this.ctx.fillStyle = `rgba(80, 80, 80, ${smokeAlpha})`;
                    this.ctx.fillRect(smokeX - 1, smokeY - 1, 2, 2);
                }
            }
        }
        
        // Status light
        const statusColor = harvester.state === 'idle' ? '#FF0000' : '#00FF00';
        this.ctx.fillStyle = statusColor;
        this.ctx.fillRect(-width/2 + 2, -height/2 + 2, 3, 3);
    }
    
    renderHarvesterUI(harvester, screenPos, width, height) {
        // Enhanced cargo bar
        if (harvester.currentCargo > 0) {
            const cargoPercent = harvester.getCargoPercentage();
            const cargoBarHeight = 6 * this.camera.zoom;
            const cargoBarWidth = width * 1.2;
            const cargoBarX = screenPos.x - (cargoBarWidth - width) / 2;
            const cargoBarY = screenPos.y - 12 * this.camera.zoom;
            
            // Background
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(cargoBarX, cargoBarY, cargoBarWidth, cargoBarHeight);
            
            // Cargo fill with gradient effect
            const gradient = this.ctx.createLinearGradient(cargoBarX, cargoBarY, cargoBarX + cargoBarWidth, cargoBarY);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(cargoBarX, cargoBarY, cargoBarWidth * cargoPercent, cargoBarHeight);
            
            // Cargo bar border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(cargoBarX, cargoBarY, cargoBarWidth, cargoBarHeight);
            
            // Cargo text
            if (this.camera.zoom > 0.6) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `${8 * this.camera.zoom}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    `${harvester.currentCargo.toFixed(1)}/${harvester.cargoCapacity}`,
                    screenPos.x + width/2,
                    cargoBarY - 2
                );
            }
        }
        
        // Health bar (only if damaged)
        if (harvester.currentHealth < harvester.maxHealth) {
            const healthPercent = harvester.getHealthPercentage();
            const healthBarHeight = 4 * this.camera.zoom;
            const healthBarWidth = width * 1.2;
            const healthBarX = screenPos.x - (healthBarWidth - width) / 2;
            const healthBarY = screenPos.y + height + 4 * this.camera.zoom;
            
            // Health background
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            
            // Health fill (color based on health level)
            const healthColor = healthPercent > 0.6 ? '#00FF00' : 
                              healthPercent > 0.3 ? '#FFFF00' : '#FF0000';
            this.ctx.fillStyle = healthColor;
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
            
            // Health border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        }
        
        // State indicator
        if (this.camera.zoom > 0.8) {
            this.ctx.fillStyle = harvester.getStateColor();
            this.ctx.font = `bold ${10 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                harvester.state.toUpperCase(),
                screenPos.x + width/2,
                screenPos.y + height + 20 * this.camera.zoom
            );
        }
        
        // Selection indicator
        if (harvester.isSelected) {
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 3]);
            this.ctx.strokeRect(screenPos.x - 4, screenPos.y - 4, width + 8, height + 8);
            this.ctx.setLineDash([]);
        }
        
        // ID number (for debugging/identification)
        if (this.layers.debug && this.camera.zoom > 0.5) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `${6 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `H${harvester.id}`,
                screenPos.x + width/2,
                screenPos.y - 15 * this.camera.zoom
            );
        }
    }
    
    renderEnemy(enemy) {
        const screenPos = this.camera.worldToScreen(enemy.x, enemy.y);
        const size = enemy.size * this.camera.zoom;
        const time = Date.now() * 0.001; // Time for animations
        
        // Save context for transformations
        this.ctx.save();
        this.ctx.translate(screenPos.x + size/2, screenPos.y + size/2);
        
        // Add rotation based on movement direction
        if (enemy.direction !== undefined) {
            this.ctx.rotate(enemy.direction);
        }
        
        // Damage flash effect
        let flashIntensity = 0;
        if (enemy.damageFlash && enemy.damageFlash > 0) {
            flashIntensity = enemy.damageFlash;
        }
        
        // Render based on enemy type
        switch (enemy.type) {
            case 'Raider':
                this.renderRaider(enemy, size, time, flashIntensity);
                break;
            case 'Heavy':
                this.renderHeavyUnit(enemy, size, time, flashIntensity);
                break;
            case 'Scout':
                this.renderScout(enemy, size, time, flashIntensity);
                break;
            default:
                this.renderRaider(enemy, size, time, flashIntensity);
                break;
        }
        
        this.ctx.restore();
        
        // Render UI elements (health bar, etc.) in world space
        this.renderEnemyUI(enemy, screenPos, size);
    }
    
    renderRaider(enemy, size, time, flashIntensity) {
        // Main body - angular armored look
        const bodyColor = flashIntensity > 0 ? 
            `rgb(255, ${Math.floor(128 * (1 - flashIntensity))}, ${Math.floor(128 * (1 - flashIntensity))})` : 
            '#8B0000';
        
        // Body outline
        this.ctx.fillStyle = '#2B0000';
        this.ctx.fillRect(-size/2 - 1, -size/2 - 1, size + 2, size + 2);
        
        // Main body
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(-size/2, -size/2, size, size);
        
        // Angular armor plates
        this.ctx.fillStyle = '#A50000';
        this.ctx.fillRect(-size/2, -size/2, size/3, size/3);
        this.ctx.fillRect(size/6, -size/2, size/3, size/3);
        this.ctx.fillRect(-size/2, size/6, size/3, size/3);
        
        // Weapon barrel
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(size/4, -size/8, size/2, size/4);
        
        // Engine glow (pulsing effect)
        const engineGlow = 0.5 + 0.3 * Math.sin(time * 8);
        this.ctx.fillStyle = `rgba(255, 100, 0, ${engineGlow})`;
        this.ctx.fillRect(-size/2, size/3, size, size/6);
        
        // Veterancy indicators
        if (enemy.veterancyLevel > 0) {
            this.ctx.fillStyle = '#FFD700';
            for (let i = 0; i < enemy.veterancyLevel; i++) {
                this.ctx.fillRect(-size/2 + i * 3, -size/2 - 6, 2, 4);
            }
        }
        
        // State-based effects
        if (enemy.state === 'attacking') {
            // Muzzle flash
            this.ctx.fillStyle = `rgba(255, 255, 0, ${0.8 + 0.2 * Math.sin(time * 20)})`;
            this.ctx.fillRect(size/2, -size/8, size/4, size/4);
            
            // Recoil effect
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
            this.ctx.fillRect(size/2 + size/4, -size/12, size/8, size/6);
        }
        
        // Movement dust trail
        if (enemy.state === 'seeking' || enemy.state === 'fleeing') {
            const dustAlpha = 0.2 + 0.1 * Math.sin(time * 6);
            this.ctx.fillStyle = `rgba(194, 178, 128, ${dustAlpha})`;
            for (let i = 1; i <= 2; i++) {
                this.ctx.fillRect(-size/2 - i * 6, size/4, size/4, size/8);
            }
        }
    }
    
    renderHeavyUnit(enemy, size, time, flashIntensity) {
        const bodyColor = flashIntensity > 0 ? 
            `rgb(255, ${Math.floor(75 * (1 - flashIntensity))}, ${Math.floor(75 * (1 - flashIntensity))})` : 
            '#4B0000';
        
        // Larger, bulkier design
        this.ctx.fillStyle = '#1B0000';
        this.ctx.fillRect(-size/2 - 2, -size/2 - 2, size + 4, size + 4);
        
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(-size/2, -size/2, size, size);
        
        // Heavy armor plating
        this.ctx.fillStyle = '#600000';
        this.ctx.fillRect(-size/3, -size/3, size/1.5, size/1.5);
        
        // Dual weapon systems
        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(size/3, -size/6, size/2, size/8);
        this.ctx.fillRect(size/3, size/12, size/2, size/8);
        
        // Heavy treads
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(-size/2, -size/2, size, size/4);
        this.ctx.fillRect(-size/2, size/4, size, size/4);
        
        // Engine exhaust
        const exhaustPulse = 0.4 + 0.3 * Math.sin(time * 6);
        this.ctx.fillStyle = `rgba(100, 100, 100, ${exhaustPulse})`;
        this.ctx.fillRect(-size/2 - size/4, -size/8, size/4, size/4);
        
        // Veterancy indicators (larger for heavy units)
        if (enemy.veterancyLevel > 0) {
            this.ctx.fillStyle = '#FFD700';
            for (let i = 0; i < enemy.veterancyLevel; i++) {
                this.ctx.fillRect(-size/2 + i * 4, -size/2 - 8, 3, 6);
            }
        }
    }
    
    renderScout(enemy, size, time, flashIntensity) {
        const bodyColor = flashIntensity > 0 ? 
            `rgb(255, ${Math.floor(200 * (1 - flashIntensity))}, ${Math.floor(69 * (1 - flashIntensity))})` : 
            '#FF4500';
        
        // Sleek, fast design
        this.ctx.fillStyle = '#8B2500';
        
        // Main body (diamond shape for speed)
        this.ctx.beginPath();
        this.ctx.moveTo(size/2, 0);
        this.ctx.lineTo(0, -size/3);
        this.ctx.lineTo(-size/2, 0);
        this.ctx.lineTo(0, size/3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath();
        this.ctx.moveTo(size/3, 0);
        this.ctx.lineTo(0, -size/4);
        this.ctx.lineTo(-size/3, 0);
        this.ctx.lineTo(0, size/4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Speed trail effect
        if (enemy.speed > 50) {
            this.ctx.fillStyle = `rgba(255, 69, 0, ${0.3 * Math.sin(time * 10)})`;
            for (let i = 1; i <= 3; i++) {
                this.ctx.fillRect(-size/2 - i * 4, -size/6, size/3, size/3);
            }
        }
        
        // Scout scanner effect (when seeking)
        if (enemy.state === 'seeking') {
            const scanPulse = 0.3 + 0.2 * Math.sin(time * 4);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${scanPulse})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Stealth shimmer effect
        if (enemy.veterancyLevel > 1) {
            const shimmer = 0.1 + 0.05 * Math.sin(time * 12);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
            this.ctx.fill();
        }
    }
    
    renderEnemyUI(enemy, screenPos, size) {
        // Health bar
        if (enemy.currentHealth < enemy.maxHealth) {
            const healthPercent = enemy.currentHealth / enemy.maxHealth;
            const healthBarHeight = 4 * this.camera.zoom;
            const healthBarWidth = size * 1.2;
            const healthBarX = screenPos.x - (healthBarWidth - size) / 2;
            const healthBarY = screenPos.y - 10 * this.camera.zoom;
            
            // Health bar background
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            
            // Health bar fill
            const healthColor = healthPercent > 0.6 ? '#00FF00' : 
                              healthPercent > 0.3 ? '#FFFF00' : '#FF0000';
            this.ctx.fillStyle = healthColor;
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
            
            // Health bar border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        }
        
        // Type indicator
        if (this.camera.zoom > 0.8) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `${8 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(enemy.type, screenPos.x + size/2, screenPos.y + size + 15 * this.camera.zoom);
        }
        
        // State indicator (for debugging/visual feedback)
        if (this.layers.debug) {
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = `${6 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(enemy.state, screenPos.x + size/2, screenPos.y + size + 25 * this.camera.zoom);
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
        
        // Render visual effects (tracers, muzzle flashes, impacts)
        if (gameState.visualEffects) {
            this.renderVisualEffects(gameState.visualEffects);
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

    renderPlayerUnit(unit) {
        const screenPos = this.camera.worldToScreen(unit.x, unit.y);
        const width = unit.width * this.camera.zoom;
        const height = unit.height * this.camera.zoom;
        const centerX = screenPos.x + width / 2;
        const centerY = screenPos.y + height / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Rotate based on unit facing direction
        if (unit.rotation !== undefined) {
            this.ctx.rotate(unit.rotation);
        }
        
        // Render based on unit type
        switch (unit.type) {
            case 'Infantry':
                this.renderInfantryUnit(unit, width, height);
                break;
            case 'Scout':
                this.renderScoutUnit(unit, width, height);
                break;
            case 'Heavy Infantry':
                this.renderHeavyInfantryUnit(unit, width, height);
                break;
            default:
                this.renderDefaultUnit(unit, width, height);
        }
        
        this.ctx.restore();
        
        // Render unit UI elements (health bar, selection indicator)
        this.renderUnitUI(unit, screenPos, width, height);
    }

    renderInfantryUnit(unit, width, height) {
        // Infantry body (blue soldier)
        this.ctx.fillStyle = '#4169E1';
        
        // Head
        this.ctx.beginPath();
        this.ctx.arc(0, -height * 0.25, width * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.fillRect(-width * 0.1, -height * 0.1, width * 0.2, height * 0.4);
        
        // Arms
        this.ctx.fillRect(-width * 0.25, -height * 0.05, width * 0.15, width * 0.08);
        this.ctx.fillRect(width * 0.1, -height * 0.05, width * 0.15, width * 0.08);
        
        // Legs
        this.ctx.fillRect(-width * 0.08, height * 0.25, width * 0.06, height * 0.2);
        this.ctx.fillRect(width * 0.02, height * 0.25, width * 0.06, height * 0.2);
        
        // Weapon (rifle)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(width * 0.15, -height * 0.1, width * 0.2, width * 0.04);
    }

    renderScoutUnit(unit, width, height) {
        // Lighter colored, more agile looking
        this.ctx.fillStyle = '#32CD32';
        
        // Smaller, more agile appearance
        this.ctx.beginPath();
        this.ctx.arc(0, -height * 0.2, width * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillRect(-width * 0.08, -height * 0.05, width * 0.16, height * 0.3);
        
        // Equipment pack
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(-width * 0.05, -height * 0.02, width * 0.1, height * 0.15);
    }

    renderHeavyInfantryUnit(unit, width, height) {
        // Heavier, more armored appearance
        this.ctx.fillStyle = '#B22222';
        
        // Larger head (helmet)
        this.ctx.beginPath();
        this.ctx.arc(0, -height * 0.3, width * 0.18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wider body (armor)
        this.ctx.fillRect(-width * 0.15, -height * 0.15, width * 0.3, height * 0.45);
        
        // Thicker arms
        this.ctx.fillRect(-width * 0.3, -height * 0.1, width * 0.18, width * 0.1);
        this.ctx.fillRect(width * 0.12, -height * 0.1, width * 0.18, width * 0.1);
        
        // Thicker legs
        this.ctx.fillRect(-width * 0.1, height * 0.25, width * 0.08, height * 0.25);
        this.ctx.fillRect(width * 0.02, height * 0.25, width * 0.08, height * 0.25);
        
        // Heavy weapon
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(width * 0.2, -height * 0.15, width * 0.25, width * 0.08);
    }

    renderDefaultUnit(unit, width, height) {
        // Generic unit appearance
        this.ctx.fillStyle = '#808080';
        
        this.ctx.beginPath();
        this.ctx.arc(0, -height * 0.25, width * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillRect(-width * 0.1, -height * 0.1, width * 0.2, height * 0.4);
        this.ctx.fillRect(-width * 0.08, height * 0.25, width * 0.06, height * 0.2);
        this.ctx.fillRect(width * 0.02, height * 0.25, width * 0.06, height * 0.2);
    }

    renderUnitUI(unit, screenPos, width, height) {
        // Health bar
        if (unit.currentHealth < unit.maxHealth) {
            const healthPercent = unit.currentHealth / unit.maxHealth;
            const barWidth = width;
            const barHeight = 4 * this.camera.zoom;
            
            // Background
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(screenPos.x, screenPos.y - 8 * this.camera.zoom, barWidth, barHeight);
            
            // Health
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(screenPos.x, screenPos.y - 8 * this.camera.zoom, barWidth * healthPercent, barHeight);
        }
        
        // Selection indicator
        if (unit.isSelected) {
            const pulse = 0.5 + 0.5 * Math.sin(unit.selectionTime * 5);
            this.ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x + width/2, screenPos.y + height/2, Math.max(width, height) * 0.7, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    renderSelectionUI(gameState) {
        if (!gameState.unitManager) return;

        // Render drag selection rectangle
        const selectionRect = gameState.unitManager.getSelectionRectangle();
        if (selectionRect) {
            const startScreen = this.camera.worldToScreen(selectionRect.x, selectionRect.y);
            const endScreen = this.camera.worldToScreen(
                selectionRect.x + selectionRect.width, 
                selectionRect.y + selectionRect.height
            );
            
            const screenWidth = endScreen.x - startScreen.x;
            const screenHeight = endScreen.y - startScreen.y;
            
            // Selection rectangle border
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(startScreen.x, startScreen.y, screenWidth, screenHeight);
            
            // Selection rectangle fill
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            this.ctx.fillRect(startScreen.x, startScreen.y, screenWidth, screenHeight);
        }

        // Render move order indicators
        if (gameState.playerUnits) {
            for (const unit of gameState.playerUnits) {
                if (unit.isSelected && unit.targetX !== undefined && unit.targetY !== undefined) {
                    // Only show target if unit is actually moving to a different location
                    const distance = Math.sqrt(
                        Math.pow(unit.targetX - unit.x, 2) + Math.pow(unit.targetY - unit.y, 2)
                    );
                    
                    if (distance > 5) {
                        const targetScreen = this.camera.worldToScreen(unit.targetX, unit.targetY);
                        
                        // Target indicator (crosshair)
                        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                        this.ctx.lineWidth = 2;
                        const size = 8;
                        
                        // Cross lines
                        this.ctx.beginPath();
                        this.ctx.moveTo(targetScreen.x - size, targetScreen.y);
                        this.ctx.lineTo(targetScreen.x + size, targetScreen.y);
                        this.ctx.moveTo(targetScreen.x, targetScreen.y - size);
                        this.ctx.lineTo(targetScreen.x, targetScreen.y + size);
                        this.ctx.stroke();
                        
                        // Circle around crosshair
                        this.ctx.beginPath();
                        this.ctx.arc(targetScreen.x, targetScreen.y, size * 1.5, 0, Math.PI * 2);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    renderVisualEffects(visualEffects) {
        const effects = visualEffects.getEffects();
        
        // Render tracers
        for (const tracer of effects.tracers) {
            this.renderTracer(tracer);
        }
        
        // Render muzzle flashes
        for (const flash of effects.muzzleFlashes) {
            this.renderMuzzleFlash(flash);
        }
        
        // Render impacts
        for (const impact of effects.impacts) {
            this.renderImpact(impact);
        }
    }

    renderTracer(tracer) {
        if (!this.camera.isVisible(tracer.currentX, tracer.currentY, 50)) return;
        
        const currentScreen = this.camera.worldToScreen(tracer.currentX, tracer.currentY);
        
        // Calculate tracer direction
        const dx = tracer.endX - tracer.startX;
        const dy = tracer.endY - tracer.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Calculate tracer tail position
        const tailLength = tracer.length * this.camera.zoom;
        const tailX = currentScreen.x - dirX * tailLength;
        const tailY = currentScreen.y - dirY * tailLength;
        
        // Draw tracer line
        this.ctx.strokeStyle = tracer.color;
        this.ctx.lineWidth = tracer.width * this.camera.zoom;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(tailX, tailY);
        this.ctx.lineTo(currentScreen.x, currentScreen.y);
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.shadowColor = tracer.color;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    renderMuzzleFlash(flash) {
        if (!this.camera.isVisible(flash.x, flash.y, 20)) return;
        
        const screenPos = this.camera.worldToScreen(flash.x, flash.y);
        const size = flash.size * this.camera.zoom * flash.intensity;
        
        this.ctx.save();
        this.ctx.translate(screenPos.x, screenPos.y);
        this.ctx.rotate(flash.rotation);
        
        // Main flash
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${flash.intensity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${flash.intensity * 0.7})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Flash streaks
        this.ctx.strokeStyle = `rgba(255, 255, 100, ${flash.intensity})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.5, 0);
        this.ctx.lineTo(size * 1.5, 0);
        this.ctx.moveTo(0, -size * 0.3);
        this.ctx.lineTo(0, size * 0.3);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderImpact(impact) {
        if (!this.camera.isVisible(impact.x, impact.y, impact.maxSize)) return;
        
        const screenPos = this.camera.worldToScreen(impact.x, impact.y);
        const size = impact.currentSize * this.camera.zoom;
        const alpha = 1.0 - impact.progress;
        
        // Main impact burst
        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, size
        );
        gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.7})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Render particles
        for (const particle of impact.particles) {
            const particleScreen = this.camera.worldToScreen(particle.x, particle.y);
            const particleAlpha = particle.life / particle.maxLife;
            
            this.ctx.fillStyle = `rgba(255, 100, 0, ${particleAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particleScreen.x, particleScreen.y, 2 * this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
} 