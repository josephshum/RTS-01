export class Enemy {
    constructor(x, y, type = 'Raider') {
        this.id = `enemy_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.x = x;
        this.y = y;
        
        // Movement
        this.targetX = x;
        this.targetY = y;
        this.speed = this.getTypeSpeed(type);
        this.direction = 0; // radians
        
        // Combat properties
        this.maxHealth = this.getTypeHealth(type);
        this.currentHealth = this.maxHealth;
        this.damage = this.getTypeDamage(type);
        this.attackRange = this.getTypeAttackRange(type);
        this.attackCooldown = this.getTypeAttackCooldown(type);
        this.lastAttackTime = 0;
        
        // AI state
        this.state = 'spawning'; // spawning, seeking, attacking, fleeing, dead
        this.target = null;
        this.lastStateChange = Date.now();
        this.stateTimer = 0;
        
        // Pathfinding
        this.path = [];
        this.pathIndex = 0;
        this.pathfindingCooldown = 0;
        this.lastPathfinding = 0;
        
        // Visual properties
        this.size = this.getTypeSize(type);
        this.color = this.getTypeColor(type);
        this.animationFrame = Math.random() * Math.PI * 2;
        
        // Behavior properties
        this.aggressionLevel = this.getTypeAggression(type);
        this.visionRange = this.getTypeVisionRange(type);
        this.preferredTargets = this.getTypeTargets(type);
        
        // Combat properties for enhanced combat system
        this.armorType = this.getTypeArmorType(type);
        this.damageType = this.getTypeDamageType(type);
        
        // Experience and veterancy
        this.experience = 0;
        this.veterancyLevel = 0;
        this.maxVeterancyLevel = 2; // Enemies have lower max level than player units
        this.experienceThresholds = [50, 150]; // XP needed for each level
        this.damageMultiplier = 1.0;
        
        // Effects
        this.damageFlash = 0;
        this.lastDamageTime = 0;
        this.deathAnimation = 0;
        
        console.log(`👹 ${type} enemy spawned at (${Math.round(x)}, ${Math.round(y)})`);
    }
    
    update(deltaTime, gameState) {
        this.animationFrame += deltaTime * 2;
        this.stateTimer += deltaTime;
        
        // Update effects
        this.updateEffects(deltaTime);
        
        if (this.state === 'dead') {
            this.updateDeathAnimation(deltaTime);
            return;
        }
        
        // Update AI state machine
        this.updateAI(deltaTime, gameState);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update combat
        this.updateCombat(deltaTime, gameState);
    }
    
    updateEffects(deltaTime) {
        // Fade damage flash
        if (this.damageFlash > 0) {
            this.damageFlash = Math.max(0, this.damageFlash - deltaTime * 3);
        }
    }
    
    updateDeathAnimation(deltaTime) {
        this.deathAnimation += deltaTime * 2;
        
        // Remove after death animation completes
        if (this.deathAnimation >= 1.0) {
            this.state = 'destroyed';
        }
    }
    
    updateAI(deltaTime, gameState) {
        switch (this.state) {
            case 'spawning':
                this.updateSpawning(deltaTime, gameState);
                break;
            case 'seeking':
                this.updateSeeking(deltaTime, gameState);
                break;
            case 'attacking':
                this.updateAttacking(deltaTime, gameState);
                break;
            case 'fleeing':
                this.updateFleeing(deltaTime, gameState);
                break;
        }
        
        // Always look for better targets
        this.scanForTargets(gameState);
    }
    
    updateSpawning(deltaTime, gameState) {
        // Brief spawning phase
        if (this.stateTimer > 1.0) {
            this.changeState('seeking');
        }
    }
    
    updateSeeking(deltaTime, gameState) {
        // Look for targets or move towards base
        if (!this.target) {
            this.findNearestTarget(gameState);
        }
        
        if (this.target) {
            this.setDestination(this.target.x, this.target.y);
            
            // Check if target is in attack range
            const distance = this.getDistanceTo(this.target);
            if (distance <= this.attackRange) {
                this.changeState('attacking');
            }
        } else {
            // Move towards enemy base (construction yard)
            const constructionYards = gameState.buildings?.filter(b => 
                b.type === 'ConstructionYard' && b.isConstructed) || [];
            
            if (constructionYards.length > 0) {
                const nearestYard = this.findNearest(constructionYards);
                this.setDestination(nearestYard.x + nearestYard.width/2, nearestYard.y + nearestYard.height/2);
            }
        }
    }
    
    updateAttacking(deltaTime, gameState) {
        if (!this.target || !this.isValidTarget(this.target)) {
            this.target = null;
            this.changeState('seeking');
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        if (distance > this.attackRange * 1.2) {
            // Target moved out of range
            this.changeState('seeking');
            return;
        }
        
        // Face the target
        this.faceTarget(this.target);
        
        // Attack if cooldown is ready
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.attackTarget(this.target);
            this.lastAttackTime = currentTime;
        }
    }
    
    updateFleeing(deltaTime, gameState) {
        // Simple fleeing behavior - move away from threats
        // For now, just transition back to seeking after a while
        if (this.stateTimer > 3.0) {
            this.changeState('seeking');
        }
    }
    
    updateMovement(deltaTime) {
        // Move towards target destination
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Normalize and apply speed
            const moveX = (dx / distance) * this.speed * deltaTime;
            const moveY = (dy / distance) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
            
            // Update direction for visual rotation
            this.direction = Math.atan2(dy, dx);
        }
    }
    
    updateCombat(deltaTime, gameState) {
        // Handle combat cooldowns and effects
        this.pathfindingCooldown = Math.max(0, this.pathfindingCooldown - deltaTime);
    }
    
    scanForTargets(gameState) {
        // Only scan periodically to save performance
        if (Date.now() - this.lastPathfinding < 500) return;
        
        this.lastPathfinding = Date.now();
        this.findNearestTarget(gameState);
    }
    
    findNearestTarget(gameState) {
        const potentialTargets = [];
        
        // Add harvesters as targets
        if (gameState.harvesters) {
            potentialTargets.push(...gameState.harvesters);
        }
        
        // Add buildings as targets
        if (gameState.buildings) {
            potentialTargets.push(...gameState.buildings.filter(b => b.isConstructed));
        }
        
        // Add depot as target
        if (gameState.depot) {
            potentialTargets.push(gameState.depot);
        }
        
        // Filter by vision range and preferences
        const visibleTargets = potentialTargets.filter(target => {
            const distance = this.getDistanceTo(target);
            return distance <= this.visionRange && this.isValidTarget(target);
        });
        
        if (visibleTargets.length > 0) {
            // Prioritize by target preference and distance
            this.target = this.selectBestTarget(visibleTargets);
        }
    }
    
    selectBestTarget(targets) {
        let bestTarget = null;
        let bestScore = -1;
        
        for (const target of targets) {
            let score = 0;
            const distance = this.getDistanceTo(target);
            
            // Distance factor (closer = better)
            score += Math.max(0, 100 - distance);
            
            // Target type preferences
            if (target.type === 'Harvester') score += 50;
            else if (target.type === 'GunTurret') score += 30;
            else if (target.type === 'ConstructionYard') score += 80;
            else if (target.type === 'SpiceRefinery') score += 60;
            else if (target.type === 'Depot') score += 70;
            
            // Health factor (weaker targets preferred)
            if (target.currentHealth !== undefined) {
                const healthPercent = target.currentHealth / (target.maxHealth || 100);
                score += (1 - healthPercent) * 20;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestTarget = target;
            }
        }
        
        return bestTarget;
    }
    
    isValidTarget(target) {
        if (!target) return false;
        
        // Check if target is alive/active
        if (target.currentHealth !== undefined && target.currentHealth <= 0) {
            return false;
        }
        
        if (target.state === 'destroyed' || target.state === 'dead') {
            return false;
        }
        
        return true;
    }
    
    attackTarget(target) {
        if (!target) return;
        
        // Use enhanced combat system if available
        if (window.game && window.game.combatManager) {
            const effectiveDamage = Math.round(this.damage * this.damageMultiplier);
            const destroyed = window.game.combatManager.dealDamage(
                target, 
                effectiveDamage, 
                this, 
                this.damageType
            );
            
            if (destroyed) {
                this.gainExperience(50); // Experience for destroying target
                this.target = null;
                this.changeState('seeking');
            } else {
                this.gainExperience(10); // Small experience for hitting target
            }
        } else {
            // Fallback to basic damage system
            console.log(`⚔️ ${this.type} attacks ${target.type || 'target'} for ${this.damage} damage`);
            
            if (target.takeDamage) {
                const destroyed = target.takeDamage(this.damage);
                if (destroyed) {
                    this.target = null;
                    this.changeState('seeking');
                }
            }
        }
        
        const levelText = this.veterancyLevel > 0 ? ` (Veteran Lv${this.veterancyLevel})` : '';
        console.log(`⚔️ ${this.type}${levelText} attacks ${target.type || 'target'}`);
    }
    
    // Gain experience and potentially level up
    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        while (this.veterancyLevel < this.maxVeterancyLevel && 
               this.experience >= this.experienceThresholds[this.veterancyLevel]) {
            this.levelUp();
        }
    }
    
    // Level up the enemy
    levelUp() {
        if (this.veterancyLevel >= this.maxVeterancyLevel) return;
        
        this.veterancyLevel++;
        
        // Apply veterancy bonuses
        switch (this.veterancyLevel) {
            case 1: // Experienced
                this.damageMultiplier = 1.3;
                this.maxHealth = Math.round(this.maxHealth * 1.2);
                this.currentHealth = this.maxHealth;
                this.speed *= 1.1;
                console.log(`🎖️ ${this.type} promoted to Experienced (Lv1)!`);
                break;
            case 2: // Veteran
                this.damageMultiplier = 1.5;
                this.maxHealth = Math.round(this.maxHealth * 1.1);
                this.currentHealth = this.maxHealth;
                this.speed *= 1.1;
                this.visionRange *= 1.2;
                console.log(`🎖️ ${this.type} promoted to Veteran (Lv2)!`);
                break;
        }
    }
    
    // Update veterancy-related systems
    updateVeterancy(deltaTime) {
        // Passive veterancy effects could go here
    }
    
    takeDamage(amount) {
        if (this.state === 'dead' || this.state === 'destroyed') return false;
        
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.damageFlash = 1.0;
        this.lastDamageTime = Date.now();
        
        console.log(`💥 ${this.type} takes ${amount} damage (${this.currentHealth}/${this.maxHealth} HP)`);
        
        if (this.currentHealth <= 0) {
            this.die();
            return true;
        }
        
        // Consider fleeing if heavily damaged
        if (this.currentHealth < this.maxHealth * 0.3 && Math.random() < 0.3) {
            this.changeState('fleeing');
        }
        
        return false;
    }
    
    die() {
        this.changeState('dead');
        this.deathAnimation = 0;
        console.log(`💀 ${this.type} destroyed`);
    }
    
    changeState(newState) {
        if (this.state !== newState) {
            console.log(`🤖 ${this.type} ${this.state} → ${newState}`);
            this.state = newState;
            this.stateTimer = 0;
            this.lastStateChange = Date.now();
        }
    }
    
    setDestination(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    faceTarget(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        this.direction = Math.atan2(dy, dx);
    }
    
    getDistanceTo(target) {
        const dx = (target.x + (target.width || 0) / 2) - this.x;
        const dy = (target.y + (target.height || 0) / 2) - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    findNearest(targets) {
        let nearest = null;
        let nearestDistance = Infinity;
        
        for (const target of targets) {
            const distance = this.getDistanceTo(target);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = target;
            }
        }
        
        return nearest;
    }
    
    getHealthPercentage() {
        return this.maxHealth > 0 ? (this.currentHealth / this.maxHealth) * 100 : 0;
    }
    
    // Type-specific properties
    getTypeSpeed(type) {
        switch (type) {
            case 'Raider': return 80;
            case 'Heavy': return 50;
            case 'Scout': return 120;
            default: return 80;
        }
    }
    
    getTypeHealth(type) {
        switch (type) {
            case 'Raider': return 60;
            case 'Heavy': return 120;
            case 'Scout': return 30;
            default: return 60;
        }
    }
    
    getTypeDamage(type) {
        switch (type) {
            case 'Raider': return 15;
            case 'Heavy': return 30;
            case 'Scout': return 8;
            default: return 15;
        }
    }
    
    getTypeAttackRange(type) {
        switch (type) {
            case 'Raider': return 40;
            case 'Heavy': return 50;
            case 'Scout': return 30;
            default: return 40;
        }
    }
    
    getTypeAttackCooldown(type) {
        switch (type) {
            case 'Raider': return 1.5;
            case 'Heavy': return 2.5;
            case 'Scout': return 1.0;
            default: return 1.5;
        }
    }
    
    getTypeSize(type) {
        switch (type) {
            case 'Raider': return 16;
            case 'Heavy': return 24;
            case 'Scout': return 12;
            default: return 16;
        }
    }
    
    getTypeColor(type) {
        switch (type) {
            case 'Raider': return '#8B0000';
            case 'Heavy': return '#4B0000';
            case 'Scout': return '#FF4500';
            default: return '#8B0000';
        }
    }
    
    getTypeAggression(type) {
        switch (type) {
            case 'Raider': return 0.8;
            case 'Heavy': return 0.6;
            case 'Scout': return 0.9;
            default: return 0.8;
        }
    }
    
    getTypeVisionRange(type) {
        switch (type) {
            case 'Raider': return 150;
            case 'Heavy': return 120;
            case 'Scout': return 200;
            default: return 150;
        }
    }
    
    getTypeTargets(type) {
        switch (type) {
            case 'Raider': return ['Harvester', 'Building'];
            case 'Heavy': return ['Building', 'GunTurret'];
            case 'Scout': return ['Harvester', 'SpiceRefinery'];
            default: return ['Harvester', 'Building'];
        }
    }
    
    getTypeArmorType(type) {
        switch (type) {
            case 'Scout': return 'light';   // Fast, lightly armored
            case 'Raider': return 'medium'; // Balanced armor
            case 'Heavy': return 'heavy';   // Heavily armored
            default: return 'light';
        }
    }
    
    getTypeDamageType(type) {
        switch (type) {
            case 'Scout': return 'kinetic';     // Standard weapons
            case 'Raider': return 'explosive';  // Explosive weapons
            case 'Heavy': return 'anti_armor';  // Armor-piercing weapons
            default: return 'kinetic';
        }
    }
} 