export class HarkonnenTrooper {
    constructor(x, y, ownerId = 3) {
        this.x = x;
        this.y = y;
        this.ownerId = ownerId;
        this.id = Math.random().toString(36).substr(2, 9);
        
        // Harkonnen Trooper stats - more aggressive, less health than Atreides
        this.health = 60;
        this.maxHealth = 60;
        this.damage = 25;
        this.speed = 70;
        this.range = 2; // Shorter range, close combat specialists
        this.size = 8;
        
        // Combat properties
        this.armorType = 'light';
        this.damageType = 'explosive';
        this.accuracy = 0.75; // Lower accuracy, but higher damage
        
        // Harkonnen-specific properties
        this.aggression = 1.0;
        this.berserkMode = false;
        this.berserkTimer = 0;
        this.suppressionRadius = 4;
        this.fear = 0; // Causes fear in enemies
        
        // Movement and targeting
        this.targetX = x;
        this.targetY = y;
        this.target = null;
        this.lastShotTime = 0;
        this.shotCooldown = 1000; // Faster shots than Atreides
        
        // Visual properties
        this.angle = 0;
        this.color = '#CC0000'; // Harkonnen red
        this.selected = false;
        
        // States
        this.state = 'idle';
        this.lastStateChange = Date.now();
        
        // Suppression tracking
        this.suppressionTargets = new Set();
        this.lastSuppressionTime = 0;
        
        console.log(`💀 Harkonnen Trooper deployed at (${x}, ${y})`);
    }
    
    update(deltaTime, gameState) {
        this.updateAggression(gameState);
        this.updateBerserk(deltaTime);
        this.updateSuppression(deltaTime, gameState);
        
        switch (this.state) {
            case 'idle':
                this.handleIdle(gameState);
                break;
            case 'moving':
                this.handleMoving(deltaTime);
                break;
            case 'attacking':
                this.handleAttacking(deltaTime, gameState);
                break;
            case 'berserking':
                this.handleBerserking(deltaTime, gameState);
                break;
            case 'suppressing':
                this.handleSuppressing(deltaTime, gameState);
                break;
        }
    }
    
    // Harkonnen-specific ability implementations
    updateAggression(gameState) {
        // Harkonnen troops get more aggressive when damaged
        const healthPercent = this.health / this.maxHealth;
        this.aggression = 1.0 + (1.0 - healthPercent) * 0.5; // Up to +50% when near death
        
        // Additional aggression when outnumbered
        const nearbyEnemies = this.findNearbyEnemies(gameState, 8);
        const nearbyAllies = this.findNearbyAllies(gameState, 6);
        
        if (nearbyEnemies.length > nearbyAllies.length + 1) {
            this.aggression *= 1.2; // +20% when outnumbered
        }
    }
    
    updateBerserk(deltaTime) {
        if (this.berserkMode) {
            this.berserkTimer += deltaTime;
            
            // Berserk lasts 8 seconds
            if (this.berserkTimer >= 8000) {
                this.berserkMode = false;
                this.berserkTimer = 0;
                console.log(`😡 Harkonnen Trooper berserk mode ended`);
                
                if (this.state === 'berserking') {
                    this.state = 'idle';
                }
            }
        }
    }
    
    updateSuppression(deltaTime, gameState) {
        // Apply suppression effects to nearby enemies
        const now = Date.now();
        if (now - this.lastSuppressionTime >= 2000) { // Every 2 seconds
            this.applySuppression(gameState);
            this.lastSuppressionTime = now;
        }
    }
    
    // Enhanced combat with Harkonnen aggression
    handleAttacking(deltaTime, gameState) {
        if (!this.target) {
            this.state = 'idle';
            return;
        }
        
        const distance = Math.sqrt((this.target.x - this.x) ** 2 + (this.target.y - this.y) ** 2);
        
        if (distance > this.range) {
            // Aggressively close distance
            this.moveTo(this.target.x, this.target.y);
            this.state = 'moving';
            return;
        }
        
        // Face target
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        
        // Check if can shoot
        const now = Date.now();
        let effectiveCooldown = this.shotCooldown;
        
        // Berserk mode increases fire rate
        if (this.berserkMode) {
            effectiveCooldown *= 0.5; // 2x fire rate
        }
        
        if (now - this.lastShotTime >= effectiveCooldown) {
            this.fireAt(this.target, gameState);
            this.lastShotTime = now;
        }
    }
    
    handleBerserking(deltaTime, gameState) {
        // In berserk mode, aggressively attack everything nearby
        const nearbyEnemies = this.findNearbyEnemies(gameState, this.range * 1.5);
        
        if (nearbyEnemies.length > 0) {
            // Attack closest enemy
            let closest = nearbyEnemies[0];
            let closestDist = Math.sqrt((closest.x - this.x) ** 2 + (closest.y - this.y) ** 2);
            
            for (const enemy of nearbyEnemies) {
                const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                if (dist < closestDist) {
                    closest = enemy;
                    closestDist = dist;
                }
            }
            
            this.target = closest;
            this.handleAttacking(deltaTime, gameState);
        } else {
            // No enemies nearby, move aggressively to find them
            this.seekEnemies(gameState);
        }
    }
    
    handleSuppressing(deltaTime, gameState) {
        // Continuous suppression fire
        const suppressionTime = 3000; // 3 seconds of suppression
        this.suppressionTimer = (this.suppressionTimer || 0) + deltaTime;
        
        // Fire rapidly during suppression
        const now = Date.now();
        if (now - this.lastShotTime >= 300) { // Very fast firing
            const enemies = this.findNearbyEnemies(gameState, this.suppressionRadius);
            if (enemies.length > 0) {
                const target = enemies[Math.floor(Math.random() * enemies.length)];
                this.fireSuppressionRound(target, gameState);
                this.lastShotTime = now;
            }
        }
        
        if (this.suppressionTimer >= suppressionTime) {
            this.state = 'idle';
            this.suppressionTimer = 0;
            console.log(`🎯 Harkonnen suppression fire complete`);
        }
    }
    
    fireAt(target, gameState) {
        // Calculate effective damage with aggression bonus
        let effectiveDamage = this.damage * this.aggression;
        
        // Berserk mode damage bonus
        if (this.berserkMode) {
            effectiveDamage *= 1.5; // +50% damage
        }
        
        // Explosive damage spreads fear
        if (Math.random() < 0.3) { // 30% chance to cause fear
            this.spreadFear(target, gameState);
        }
        
        // Accuracy affected by aggression (more aggressive = less accurate)
        let accuracy = this.accuracy;
        if (this.berserkMode) {
            accuracy *= 0.8; // -20% accuracy in berserk
        }
        
        if (Math.random() < accuracy) {
            const projectile = this.createProjectile(target, effectiveDamage);
            if (gameState.projectiles) {
                gameState.projectiles.push(projectile);
            }
            
            console.log(`💥 Harkonnen fires explosive round (${Math.round(effectiveDamage)} dmg)`);
        } else {
            console.log(`❌ Harkonnen missed (too aggressive)`);
        }
    }
    
    fireSuppressionRound(target, gameState) {
        // Suppression rounds cause fear but less damage
        const damage = this.damage * 0.6; // Reduced damage
        const projectile = this.createProjectile(target, damage);
        projectile.suppression = true;
        
        if (gameState.projectiles) {
            gameState.projectiles.push(projectile);
        }
        
        // Always spread fear during suppression
        this.spreadFear(target, gameState);
    }
    
    createProjectile(target, damage) {
        return {
            x: this.x,
            y: this.y,
            targetX: target.x,
            targetY: target.y,
            target: target,
            damage: damage,
            damageType: this.damageType,
            speed: 250,
            ownerId: this.ownerId,
            color: '#FF4444', // Red explosive projectiles
            size: 3,
            explosive: true
        };
    }
    
    // Special abilities
    berserk() {
        if (!this.berserkMode) {
            this.berserkMode = true;
            this.berserkTimer = 0;
            this.state = 'berserking';
            console.log(`😡 Harkonnen Trooper enters BERSERK mode!`);
            return true;
        }
        return false;
    }
    
    suppression() {
        if (this.state !== 'suppressing') {
            this.state = 'suppressing';
            this.suppressionTimer = 0;
            console.log(`🎯 Harkonnen Trooper beginning suppression fire`);
            return true;
        }
        return false;
    }
    
    spreadFear(target, gameState, radius = 3) {
        // Fear effect reduces enemy effectiveness
        const nearbyEnemies = this.findNearbyEnemies(gameState, radius);
        
        for (const enemy of nearbyEnemies) {
            if (enemy.applyFear) {
                enemy.applyFear(0.8, 5000); // -20% effectiveness for 5 seconds
            }
        }
        
        if (nearbyEnemies.length > 0) {
            console.log(`😨 Harkonnen spread fear to ${nearbyEnemies.length} enemies`);
        }
    }
    
    applySuppression(gameState) {
        // Suppression reduces enemy accuracy and movement speed
        const enemies = this.findNearbyEnemies(gameState, this.suppressionRadius);
        
        for (const enemy of enemies) {
            if (enemy.applySuppression) {
                enemy.applySuppression(0.7, 3000); // -30% effectiveness for 3 seconds
                this.suppressionTargets.add(enemy.id);
            }
        }
        
        if (enemies.length > 0) {
            console.log(`🎯 Harkonnen suppressing ${enemies.length} enemies`);
        }
    }
    
    // Auto-berserk when health is low
    checkAutoBerserk() {
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent <= 0.3 && !this.berserkMode) { // 30% health threshold
            this.berserk();
            console.log(`💀 Harkonnen auto-berserks at low health!`);
        }
    }
    
    // Utility methods
    findNearbyEnemies(gameState, range) {
        const enemies = [];
        
        // Check enemy units
        if (gameState.enemies) {
            for (const enemy of gameState.enemies) {
                const distance = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                if (distance <= range) {
                    enemies.push(enemy);
                }
            }
        }
        
        // Check enemy buildings
        if (gameState.buildings) {
            for (const building of gameState.buildings) {
                if (building.ownerId !== this.ownerId) {
                    const distance = Math.sqrt((building.x - this.x) ** 2 + (building.y - this.y) ** 2);
                    if (distance <= range) {
                        enemies.push(building);
                    }
                }
            }
        }
        
        return enemies;
    }
    
    findNearbyAllies(gameState, range) {
        const allies = [];
        
        if (gameState.units) {
            for (const unit of gameState.units) {
                if (unit !== this && unit.ownerId === this.ownerId) {
                    const distance = Math.sqrt((unit.x - this.x) ** 2 + (unit.y - this.y) ** 2);
                    if (distance <= range) {
                        allies.push(unit);
                    }
                }
            }
        }
        
        return allies;
    }
    
    seekEnemies(gameState) {
        // Aggressively seek out enemies when berserking
        const allEnemies = this.findNearbyEnemies(gameState, 15);
        if (allEnemies.length > 0) {
            const target = allEnemies[0];
            this.moveTo(target.x, target.y);
        }
    }
    
    // Standard unit methods
    handleIdle(gameState) {
        // Aggressively seek enemies
        const enemy = this.findNearestEnemy(gameState);
        if (enemy) {
            this.target = enemy;
            this.state = 'attacking';
        }
    }
    
    handleMoving(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.state = 'idle';
            return;
        }
        
        let effectiveSpeed = this.speed;
        
        // Berserk mode increases movement speed
        if (this.berserkMode) {
            effectiveSpeed *= 1.3; // +30% speed
        }
        
        const moveDistance = (effectiveSpeed * deltaTime) / 1000;
        const ratio = moveDistance / distance;
        
        this.x += dx * ratio;
        this.y += dy * ratio;
        this.angle = Math.atan2(dy, dx);
    }
    
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.state = 'moving';
    }
    
    findNearestEnemy(gameState) {
        let nearestEnemy = null;
        let nearestDistance = this.range * 2; // Harkonnen are more aggressive in seeking
        
        const enemies = this.findNearbyEnemies(gameState, nearestDistance);
        
        for (const enemy of enemies) {
            const distance = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
            if (distance <= nearestDistance) {
                nearestEnemy = enemy;
                nearestDistance = distance;
            }
        }
        
        return nearestEnemy;
    }
    
    takeDamage(amount, damageType) {
        let finalDamage = amount;
        
        // Harkonnen are tough but not as defensive as Atreides
        if (this.berserkMode) {
            finalDamage *= 0.9; // -10% damage reduction in berserk
        }
        
        this.health -= finalDamage;
        
        // Check for auto-berserk
        this.checkAutoBerserk();
        
        if (this.health <= 0) {
            // Death explosion
            this.deathExplosion();
            console.log(`💀 Harkonnen Trooper eliminated in glorious combat!`);
            return true; // Unit destroyed
        }
        
        return false;
    }
    
    deathExplosion() {
        // Harkonnen units explode when they die, damaging nearby enemies
        console.log(`💥 Harkonnen death explosion!`);
        // Would damage nearby units in actual implementation
    }
    
    // Status queries and effect applications
    applyFear(multiplier, duration) {
        // Harkonnen are immune to fear
        console.log(`😤 Harkonnen Trooper is immune to fear!`);
    }
    
    applySuppression(multiplier, duration) {
        // Harkonnen resist suppression better than others
        const resistance = 0.5; // 50% resistance
        this.suppressionEffect = multiplier + (1 - multiplier) * resistance;
        this.suppressionEnd = Date.now() + duration * resistance;
        
        console.log(`🎯 Harkonnen partially suppressed (${Math.round((1 - this.suppressionEffect) * 100)}%)`);
    }
    
    // Getters for enhanced stats
    getEffectiveDamage() {
        let damage = this.damage * this.aggression;
        
        if (this.berserkMode) {
            damage *= 1.5;
        }
        
        return damage;
    }
    
    getEffectiveSpeed() {
        let speed = this.speed;
        
        if (this.berserkMode) {
            speed *= 1.3;
        }
        
        // Apply suppression if active
        if (this.suppressionEnd && Date.now() < this.suppressionEnd) {
            speed *= this.suppressionEffect;
        }
        
        return speed;
    }
    
    // Status queries
    isBerserk() {
        return this.berserkMode;
    }
    
    canBerserk() {
        return !this.berserkMode;
    }
    
    canSuppression() {
        return this.state !== 'suppressing';
    }
    
    getAggressionLevel() {
        return this.aggression;
    }
} 