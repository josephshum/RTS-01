export class CombatManager {
    constructor() {
        this.projectiles = [];
        this.explosions = [];
        this.damageNumbers = [];
        
        // Combat statistics
        this.totalDamageDealt = 0;
        this.totalProjectilesFired = 0;
        this.totalExplosions = 0;
        
        // Armor/Damage Type System
        this.damageTypes = {
            KINETIC: 'kinetic',      // Bullets, shells
            EXPLOSIVE: 'explosive',   // Rockets, grenades
            ENERGY: 'energy',        // Lasers, plasma
            ANTI_ARMOR: 'anti_armor' // Specialized armor-piercing
        };
        
        this.armorTypes = {
            LIGHT: 'light',          // Infantry, light vehicles
            MEDIUM: 'medium',        // Tanks, heavy units
            HEAVY: 'heavy',          // Structures, super-heavy units
            SHIELD: 'shield'         // Energy shields
        };
        
        // Damage Effectiveness Matrix (damageType vs armorType)
        // Values > 1.0 = more effective, < 1.0 = less effective
        this.damageMatrix = {
            [this.damageTypes.KINETIC]: {
                [this.armorTypes.LIGHT]: 1.2,
                [this.armorTypes.MEDIUM]: 1.0,
                [this.armorTypes.HEAVY]: 0.7,
                [this.armorTypes.SHIELD]: 0.5
            },
            [this.damageTypes.EXPLOSIVE]: {
                [this.armorTypes.LIGHT]: 1.5,
                [this.armorTypes.MEDIUM]: 1.2,
                [this.armorTypes.HEAVY]: 1.0,
                [this.armorTypes.SHIELD]: 0.8
            },
            [this.damageTypes.ENERGY]: {
                [this.armorTypes.LIGHT]: 0.8,
                [this.armorTypes.MEDIUM]: 0.9,
                [this.armorTypes.HEAVY]: 0.6,
                [this.armorTypes.SHIELD]: 1.8
            },
            [this.damageTypes.ANTI_ARMOR]: {
                [this.armorTypes.LIGHT]: 0.8,
                [this.armorTypes.MEDIUM]: 1.3,
                [this.armorTypes.HEAVY]: 1.6,
                [this.armorTypes.SHIELD]: 1.1
            }
        };
        
        // Line of sight grid for combat calculations
        this.losGrid = null;
        this.losGridSize = 32; // pixels per cell
        
        console.log('⚔️ Enhanced combat management system initialized');
    }
    
    // Initialize line-of-sight grid based on terrain
    initializeLineOfSight(terrain, mapWidth, mapHeight) {
        this.losGrid = {
            width: Math.ceil(mapWidth / this.losGridSize),
            height: Math.ceil(mapHeight / this.losGridSize),
            blocked: []
        };
        
        // Initialize blocked cells array
        for (let x = 0; x < this.losGrid.width; x++) {
            this.losGrid.blocked[x] = [];
            for (let y = 0; y < this.losGrid.height; y++) {
                // Check terrain at this position to determine if it blocks line of sight
                const terrainX = Math.floor(x * this.losGridSize / 32);
                const terrainY = Math.floor(y * this.losGridSize / 32);
                
                if (terrain && terrain[terrainX] && terrain[terrainX][terrainY]) {
                    const tile = terrain[terrainX][terrainY];
                    // Only large rock formations block line of sight
                    this.losGrid.blocked[x][y] = tile.type === 'rock' && Math.random() > 0.7;
                } else {
                    this.losGrid.blocked[x][y] = false;
                }
            }
        }
        
        console.log(`📡 Line-of-sight grid initialized: ${this.losGrid.width}x${this.losGrid.height}`);
    }
    
    // Check if there's clear line of sight between two world positions
    hasLineOfSight(x1, y1, x2, y2) {
        if (!this.losGrid) return true; // No LOS grid = no blocking
        
        const startX = Math.floor(x1 / this.losGridSize);
        const startY = Math.floor(y1 / this.losGridSize);
        const endX = Math.floor(x2 / this.losGridSize);
        const endY = Math.floor(y2 / this.losGridSize);
        
        // Use Bresenham's line algorithm to check cells along the line
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const stepX = startX < endX ? 1 : -1;
        const stepY = startY < endY ? 1 : -1;
        let err = dx - dy;
        
        let currentX = startX;
        let currentY = startY;
        
        while (true) {
            // Check if current cell is blocked
            if (currentX >= 0 && currentX < this.losGrid.width && 
                currentY >= 0 && currentY < this.losGrid.height &&
                this.losGrid.blocked[currentX][currentY]) {
                return false;
            }
            
            // Reached destination
            if (currentX === endX && currentY === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                currentX += stepX;
            }
            if (e2 < dx) {
                err += dx;
                currentY += stepY;
            }
        }
        
        return true;
    }
    
    update(deltaTime, gameState) {
        // Update all projectiles
        this.updateProjectiles(deltaTime, gameState);
        
        // Update explosions
        this.updateExplosions(deltaTime);
        
        // Update damage numbers
        this.updateDamageNumbers(deltaTime);
        
        // Update unit experience and veterancy
        this.updateVeterancy(deltaTime, gameState);
        
        // Clean up finished effects
        this.cleanup();
    }
    
    updateProjectiles(deltaTime, gameState) {
        if (!gameState) {
            console.error('CombatManager: gameState is undefined');
            return;
        }
        
        const combatGameState = {
            ...gameState,
            projectiles: this.projectiles
        };
        
        for (const projectile of this.projectiles) {
            if (projectile && projectile.update) {
                projectile.update(deltaTime, combatGameState);
                
                // Check if projectile hit and needs explosion
                if (projectile.hasHit && !projectile.explosionCreated) {
                    this.createExplosion(projectile);
                    projectile.explosionCreated = true;
                }
            }
        }
    }
    
    updateExplosions(deltaTime) {
        for (const explosion of this.explosions) {
            explosion.update(deltaTime);
        }
    }
    
    updateDamageNumbers(deltaTime) {
        for (const damageNumber of this.damageNumbers) {
            damageNumber.update(deltaTime);
        }
    }
    
    // Update veterancy and experience for combat units
    updateVeterancy(deltaTime, gameState) {
        // Update experience for turrets
        if (gameState.buildings) {
            for (const building of gameState.buildings) {
                if (building.type === 'GunTurret' && building.isActive) {
                    building.updateVeterancy(deltaTime);
                }
            }
        }
        
        // Update experience for other combat units if they exist
        if (gameState.enemies) {
            for (const enemy of gameState.enemies) {
                if (enemy.state !== 'dead') {
                    enemy.updateVeterancy(deltaTime);
                }
            }
        }
    }
    
    cleanup() {
        // Remove inactive projectiles
        const activeProjectilesCount = this.projectiles.length;
        this.projectiles = this.projectiles.filter(p => p.isActive);
        
        // Remove finished explosions
        const activeExplosionsCount = this.explosions.length;
        this.explosions = this.explosions.filter(e => e.isActive);
        
        // Remove finished damage numbers
        const activeDamageNumbersCount = this.damageNumbers.length;
        this.damageNumbers = this.damageNumbers.filter(d => d.isActive);
        
        // Log cleanup if significant
        const projectilesRemoved = activeProjectilesCount - this.projectiles.length;
        const explosionsRemoved = activeExplosionsCount - this.explosions.length;
        const damageNumbersRemoved = activeDamageNumbersCount - this.damageNumbers.length;
        
        if (projectilesRemoved > 0 || explosionsRemoved > 0 || damageNumbersRemoved > 0) {
            console.log(`🧹 Combat cleanup: ${projectilesRemoved} projectiles, ${explosionsRemoved} explosions, ${damageNumbersRemoved} damage numbers`);
        }
    }
    
    // Projectile management
    addProjectile(projectile) {
        this.projectiles.push(projectile);
        this.totalProjectilesFired++;
        console.log(`🚀 Added projectile (${this.projectiles.length} active)`);
    }
    
    createExplosion(projectile) {
        if (projectile.explosionRadius <= 0) return;
        
        const explosion = {
            id: `explosion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: projectile.x,
            y: projectile.y,
            radius: projectile.explosionRadius,
            maxRadius: projectile.explosionRadius,
            duration: 0.5,
            currentTime: 0,
            isActive: true,
            color: this.getExplosionColor(projectile.type),
            intensity: 1.0,
            
            update(deltaTime) {
                this.currentTime += deltaTime;
                const progress = this.currentTime / this.duration;
                
                if (progress >= 1.0) {
                    this.isActive = false;
                } else {
                    // Explosion grows then fades
                    if (progress < 0.3) {
                        this.radius = this.maxRadius * (progress / 0.3);
                        this.intensity = 1.0;
                    } else {
                        this.radius = this.maxRadius;
                        this.intensity = 1.0 - ((progress - 0.3) / 0.7);
                    }
                }
            }
        };
        
        this.explosions.push(explosion);
        this.totalExplosions++;
        
        console.log(`💥 Created explosion at (${Math.round(projectile.x)}, ${Math.round(projectile.y)}) radius ${projectile.explosionRadius}`);
    }
    
    getExplosionColor(projectileType) {
        switch (projectileType) {
            case 'bullet': return '#FFFF00';
            case 'shell': return '#FFA500';
            case 'missile': return '#FF4500';
            default: return '#FFD700';
        }
    }
    
    // Damage number system
    createDamageNumber(x, y, damage, color = '#FF0000') {
        const damageNumber = {
            id: `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            startY: y,
            damage: Math.round(damage),
            color: color,
            duration: 1.5,
            currentTime: 0,
            isActive: true,
            velocity: -30, // moves upward
            opacity: 1.0,
            
            update(deltaTime) {
                this.currentTime += deltaTime;
                const progress = this.currentTime / this.duration;
                
                if (progress >= 1.0) {
                    this.isActive = false;
                } else {
                    // Move upward
                    this.y += this.velocity * deltaTime;
                    
                    // Fade out
                    this.opacity = 1.0 - progress;
                }
            }
        };
        
        this.damageNumbers.push(damageNumber);
    }
    
    // Enhanced damage calculation with armor effectiveness
    calculateAdvancedDamage(baseDamage, damageType, armorType, source = null) {
        let finalDamage = baseDamage;
        
        // Apply damage type vs armor type effectiveness
        const effectiveness = this.getDamageEffectiveness(damageType, armorType);
        finalDamage *= effectiveness;
        
        // Apply source bonuses (veterancy, upgrades)
        if (source) {
            if (source.damageMultiplier) {
                finalDamage *= source.damageMultiplier;
            }
            
            // Veterancy bonus
            if (source.veterancyLevel) {
                const veterancyBonus = 1 + (source.veterancyLevel * 0.1); // 10% per level
                finalDamage *= veterancyBonus;
            }
        }
        
        // Add some randomness (±10%)
        const variance = 0.1;
        const randomMultiplier = 1 + (Math.random() - 0.5) * variance * 2;
        finalDamage *= randomMultiplier;
        
        return Math.round(Math.max(1, finalDamage));
    }
    
    // Get damage effectiveness multiplier
    getDamageEffectiveness(damageType, armorType) {
        if (this.damageMatrix[damageType] && this.damageMatrix[damageType][armorType]) {
            return this.damageMatrix[damageType][armorType];
        }
        return 1.0; // Default effectiveness
    }
    
    // Enhanced damage dealing with armor calculations
    dealDamage(target, damage, source = null, damageType = 'kinetic') {
        if (!target || !target.takeDamage) return 0;
        
        const actualDamage = this.calculateAdvancedDamage(damage, damageType, target.armorType, source);
        const wasDestroyed = target.takeDamage(actualDamage);
        
        // Create visual feedback
        this.createDamageNumber(
            target.x + (target.width || target.size || 16) / 2,
            target.y,
            actualDamage,
            this.getDamageColor(damageType, actualDamage)
        );
        
        // Update statistics
        this.totalDamageDealt += actualDamage;
        
        console.log(`⚔️ ${actualDamage} ${damageType} damage dealt to ${target.type || 'target'}`);
        
        return wasDestroyed;
    }
    
    getDamageColor(damageType, damage) {
        // Color based on damage type and amount
        if (damage >= 50) return '#FFD700'; // Critical damage - gold
        
        switch (damageType) {
            case this.damageTypes.KINETIC: return '#FF0000';      // Red
            case this.damageTypes.EXPLOSIVE: return '#FF8C00';    // Orange
            case this.damageTypes.ENERGY: return '#00BFFF';       // Blue
            case this.damageTypes.ANTI_ARMOR: return '#9932CC';   // Purple
            default: return '#FF0000';
        }
    }
    
    // Check if position is under fire (for AI)
    isPositionUnderFire(x, y, radius = 50) {
        for (const projectile of this.projectiles) {
            if (projectile.hasHit) continue;
            
            // Check if projectile will pass near this position
            const dx = projectile.targetX - x;
            const dy = projectile.targetY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                return true;
            }
        }
        return false;
    }
    
    // Get combat statistics
    getCombatStats() {
        return {
            projectiles: {
                active: this.projectiles.length,
                totalFired: this.totalProjectilesFired
            },
            explosions: {
                active: this.explosions.length,
                total: this.totalExplosions
            },
            damageNumbers: {
                active: this.damageNumbers.length
            },
            damage: {
                totalDealt: this.totalDamageDealt
            },
            lineOfSight: {
                enabled: !!this.losGrid,
                gridSize: this.losGridSize
            }
        };
    }
    
    // Testing methods
    createTestExplosion(x, y, radius = 50) {
        const explosion = {
            id: `test_explosion_${Date.now()}`,
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            duration: 0.5,
            currentTime: 0,
            isActive: true,
            color: '#FFD700',
            intensity: 1.0,
            
            update(deltaTime) {
                this.currentTime += deltaTime;
                const progress = this.currentTime / this.duration;
                
                if (progress >= 1.0) {
                    this.isActive = false;
                } else {
                    if (progress < 0.3) {
                        this.radius = this.maxRadius * (progress / 0.3);
                        this.intensity = 1.0;
                    } else {
                        this.radius = this.maxRadius;
                        this.intensity = 1.0 - ((progress - 0.3) / 0.7);
                    }
                }
            }
        };
        
        this.explosions.push(explosion);
        console.log(`🧪 Created test explosion at (${x}, ${y})`);
    }
} 