export class AtreidesInfantry {
    constructor(x, y, ownerId = 2) {
        this.x = x;
        this.y = y;
        this.ownerId = ownerId;
        this.id = Math.random().toString(36).substr(2, 9);
        
        // Atreides Infantry stats
        this.health = 80;
        this.maxHealth = 80;
        this.damage = 20;
        this.speed = 60;
        this.range = 3;
        this.size = 8;
        
        // Combat properties
        this.armorType = 'light';
        this.damageType = 'kinetic';
        this.accuracy = 0.85;
        
        // Atreides-specific properties
        this.morale = 1.0;
        this.entrenched = false;
        this.entrenchTimer = 0;
        this.rallyBonus = 1.0;
        this.nearbyAllies = [];
        
        // Movement and targeting
        this.targetX = x;
        this.targetY = y;
        this.target = null;
        this.lastShotTime = 0;
        this.shotCooldown = 1200; // 1.2 seconds
        
        // Visual properties
        this.angle = 0;
        this.color = '#0066CC'; // Atreides blue
        this.selected = false;
        
        // States
        this.state = 'idle';
        this.lastStateChange = Date.now();
        
        console.log(`⚔️ Atreides Infantry deployed at (${x}, ${y})`);
    }
    
    update(deltaTime, gameState) {
        this.updateMorale(gameState);
        this.updateEntrenchment(deltaTime);
        this.updateRallyBonus(gameState);
        
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
            case 'entrenching':
                this.handleEntrenching(deltaTime);
                break;
            case 'rallying':
                this.handleRallying(deltaTime, gameState);
                break;
        }
    }
    
    // Faction-specific ability implementations
    updateMorale(gameState) {
        // Atreides units get morale bonus when near buildings
        let buildingBonus = 1.0;
        const nearbyBuildings = this.findNearbyBuildings(gameState, 5);
        
        if (nearbyBuildings.length > 0) {
            buildingBonus = 1.15; // +15% effectiveness near buildings
        }
        
        // Additional morale from nearby allies
        this.nearbyAllies = this.findNearbyAllies(gameState, 4);
        const allyBonus = Math.min(1.0 + (this.nearbyAllies.length * 0.05), 1.3); // Max +30%
        
        this.morale = buildingBonus * allyBonus;
    }
    
    updateEntrenchment(deltaTime) {
        if (this.state === 'entrenching') {
            this.entrenchTimer += deltaTime;
            
            if (this.entrenchTimer >= 3000) { // 3 seconds to entrench
                this.entrenched = true;
                this.state = 'idle';
                console.log(`🛡️ Atreides Infantry entrenched at (${this.x}, ${this.y})`);
            }
        } else if (this.state === 'moving') {
            // Lose entrenchment when moving
            if (this.entrenched) {
                this.entrenched = false;
                console.log(`🏃 Atreides Infantry left entrenchment`);
            }
        }
    }
    
    updateRallyBonus(gameState) {
        // Rally bonus from nearby Atreides units
        const rallyRange = 6;
        this.rallyBonus = 1.0;
        
        if (this.nearbyAllies.length >= 3) {
            this.rallyBonus = 1.25; // +25% when in formation
        }
    }
    
    // Enhanced combat with Atreides bonuses
    handleAttacking(deltaTime, gameState) {
        if (!this.target) {
            this.state = 'idle';
            return;
        }
        
        const distance = Math.sqrt((this.target.x - this.x) ** 2 + (this.target.y - this.y) ** 2);
        
        if (distance > this.range) {
            // Move closer to target
            this.moveTo(this.target.x, this.target.y);
            this.state = 'moving';
            return;
        }
        
        // Face target
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        
        // Check if can shoot
        const now = Date.now();
        if (now - this.lastShotTime >= this.shotCooldown) {
            this.fireAt(this.target, gameState);
            this.lastShotTime = now;
        }
    }
    
    fireAt(target, gameState) {
        // Calculate effective damage with bonuses
        let effectiveDamage = this.damage;
        effectiveDamage *= this.morale;
        effectiveDamage *= this.rallyBonus;
        
        // Entrenchment provides accuracy bonus
        let accuracy = this.accuracy;
        if (this.entrenched) {
            accuracy += 0.15; // +15% accuracy when entrenched
            effectiveDamage *= 1.1; // +10% damage when entrenched
        }
        
        // Apply hit chance
        if (Math.random() < accuracy) {
            const projectile = this.createProjectile(target, effectiveDamage);
            if (gameState.projectiles) {
                gameState.projectiles.push(projectile);
            }
            
            console.log(`🎯 Atreides Infantry fires (${Math.round(effectiveDamage)} dmg, ${Math.round(accuracy * 100)}% acc)`);
        } else {
            console.log(`❌ Atreides Infantry missed`);
        }
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
            speed: 200,
            ownerId: this.ownerId,
            color: '#FFD700', // Golden projectiles for Atreides
            size: 2
        };
    }
    
    // Special abilities
    entrench() {
        if (!this.entrenched && this.state === 'idle') {
            this.state = 'entrenching';
            this.entrenchTimer = 0;
            console.log(`🛡️ Atreides Infantry beginning entrenchment`);
            return true;
        }
        return false;
    }
    
    rally() {
        if (this.state !== 'rallying') {
            this.state = 'rallying';
            this.rallyTimer = 0;
            console.log(`📯 Atreides Infantry initiating rally`);
            return true;
        }
        return false;
    }
    
    handleEntrenching(deltaTime) {
        // Unit is stationary while entrenching
        // Progress tracked in updateEntrenchment
    }
    
    handleRallying(deltaTime, gameState) {
        this.rallyTimer = (this.rallyTimer || 0) + deltaTime;
        
        // Rally effect: boost nearby allies
        if (this.rallyTimer >= 5000) { // 5 seconds
            const nearbyAllies = this.findNearbyAllies(gameState, 6);
            
            for (const ally of nearbyAllies) {
                if (ally.applyRallyBoost) {
                    ally.applyRallyBoost(1.2, 10000); // +20% for 10 seconds
                }
            }
            
            console.log(`📯 Rally complete! Boosted ${nearbyAllies.length} allies`);
            this.state = 'idle';
        }
    }
    
    applyRallyBoost(multiplier, duration) {
        // Receive rally boost from other units
        this.rallyEffectMultiplier = multiplier;
        this.rallyEffectEnd = Date.now() + duration;
        
        console.log(`📯 Received rally boost: +${Math.round((multiplier - 1) * 100)}%`);
    }
    
    // Utility methods
    findNearbyBuildings(gameState, range) {
        const buildings = [];
        
        if (gameState.buildings) {
            for (const building of gameState.buildings) {
                if (building.ownerId === this.ownerId) {
                    const distance = Math.sqrt((building.x - this.x) ** 2 + (building.y - this.y) ** 2);
                    if (distance <= range) {
                        buildings.push(building);
                    }
                }
            }
        }
        
        return buildings;
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
    
    // Standard unit methods
    handleIdle(gameState) {
        // Look for enemies to attack
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
        
        const moveDistance = (this.speed * deltaTime) / 1000;
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
        let nearestDistance = this.range;
        
        // Check enemy units
        if (gameState.enemies) {
            for (const enemy of gameState.enemies) {
                const distance = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                if (distance <= nearestDistance) {
                    nearestEnemy = enemy;
                    nearestDistance = distance;
                }
            }
        }
        
        // Check enemy buildings
        if (gameState.buildings) {
            for (const building of gameState.buildings) {
                if (building.ownerId !== this.ownerId) {
                    const distance = Math.sqrt((building.x - this.x) ** 2 + (building.y - this.y) ** 2);
                    if (distance <= nearestDistance) {
                        nearestEnemy = building;
                        nearestDistance = distance;
                    }
                }
            }
        }
        
        return nearestEnemy;
    }
    
    takeDamage(amount, damageType) {
        let finalDamage = amount;
        
        // Entrenchment provides damage reduction
        if (this.entrenched) {
            finalDamage *= 0.7; // -30% damage when entrenched
        }
        
        this.health -= finalDamage;
        
        if (this.health <= 0) {
            console.log(`💀 Atreides Infantry eliminated`);
            return true; // Unit destroyed
        }
        
        return false;
    }
    
    // Getters for enhanced stats
    getEffectiveDamage() {
        let damage = this.damage * this.morale * this.rallyBonus;
        
        if (this.entrenched) {
            damage *= 1.1;
        }
        
        // Apply rally effect if active
        if (this.rallyEffectEnd && Date.now() < this.rallyEffectEnd) {
            damage *= this.rallyEffectMultiplier;
        }
        
        return damage;
    }
    
    getEffectiveAccuracy() {
        let accuracy = this.accuracy;
        
        if (this.entrenched) {
            accuracy += 0.15;
        }
        
        return Math.min(accuracy, 0.95); // Cap at 95%
    }
    
    // Status queries
    isEntrenched() {
        return this.entrenched;
    }
    
    canEntrench() {
        return !this.entrenched && this.state === 'idle';
    }
    
    canRally() {
        return this.state !== 'rallying' && this.nearbyAllies.length > 0;
    }
} 