import { Building } from './Building.js';

export class GunTurret extends Building {
    constructor(x, y) {
        const config = {
            gridWidth: 1,
            gridHeight: 1,
            maxHealth: 100,
            constructionTime: 8,
            cost: { spice: 40 },
            provides: ['defense'],
            prerequisites: ['construction']
        };
        
        super(x, y, 'GunTurret', config);
        
        // Turret specific properties
        this.attackRange = 8; // grid tiles (doubled from 4)
        this.damage = 25;
        this.attackCooldown = 2.0; // seconds between attacks
        this.lastAttackTime = 0;
        this.rotationSpeed = Math.PI * 1.5; // radians per second (increased for responsiveness)
        
        // Targeting
        this.currentTarget = null;
        this.rotation = 0; // current rotation
        this.targetRotation = 0; // desired rotation
        
        // Visual effects
        this.muzzleFlash = 0;
        this.lastShotTime = 0;
        
        // Detection
        this.detectionRange = this.attackRange + 1; // 9 grid tiles
        this.hostileTargets = [];
        
        // Veterancy and Experience System
        this.experience = 0;
        this.veterancyLevel = 0;
        this.maxVeterancyLevel = 3;
        this.experienceThresholds = [100, 300, 600]; // XP needed for each level
        this.damageMultiplier = 1.0;
        
        // Armor Type for damage calculations
        this.armorType = 'medium'; // Buildings have medium armor
    }
    
    updateActive(deltaTime, gameState) {
        super.updateActive(deltaTime, gameState);
        
        if (this.isActive) {
            this.updateTargeting(deltaTime, gameState);
            this.updateRotation(deltaTime);
            this.updateAttack(deltaTime);
            this.updateEffects(deltaTime);
        }
    }
    
    updateTargeting(deltaTime, gameState) {
        // Find hostile targets in range
        this.hostileTargets = this.findHostileTargets(gameState);
        
        // Select best target
        if (!this.currentTarget || !this.isValidTarget(this.currentTarget)) {
            this.currentTarget = this.selectBestTarget();
        }
        
        // Update target rotation
        if (this.currentTarget) {
            const dx = this.currentTarget.x - (this.x + this.width / 2);
            const dy = this.currentTarget.y - (this.y + this.height / 2);
            this.targetRotation = Math.atan2(dy, dx);
        }
    }
    
    updateRotation(deltaTime) {
        if (this.currentTarget) {
            // Smoothly rotate towards target
            let rotationDiff = this.targetRotation - this.rotation;
            
            // Normalize rotation difference to [-π, π]
            while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
            while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
            
            const maxRotation = this.rotationSpeed * deltaTime;
            if (Math.abs(rotationDiff) <= maxRotation) {
                this.rotation = this.targetRotation;
            } else {
                this.rotation += Math.sign(rotationDiff) * maxRotation;
            }
            
            // Normalize rotation
            if (this.rotation > Math.PI) this.rotation -= 2 * Math.PI;
            if (this.rotation < -Math.PI) this.rotation += 2 * Math.PI;
        }
    }
    
    updateAttack(deltaTime) {
        const currentTime = Date.now() / 1000;
        
        if (this.currentTarget && 
            this.isInAttackRange(this.currentTarget) && 
            this.isAimedAtTarget() &&
            currentTime - this.lastAttackTime >= this.attackCooldown) {
            
            this.attack(this.currentTarget);
            this.lastAttackTime = currentTime;
        }
    }
    
    updateEffects(deltaTime) {
        // Fade muzzle flash
        if (this.muzzleFlash > 0) {
            this.muzzleFlash = Math.max(0, this.muzzleFlash - deltaTime * 5);
        }
    }
    
    findHostileTargets(gameState) {
        const targets = [];
        
        // Add enemies as targets
        if (gameState.enemies) {
            for (const enemy of gameState.enemies) {
                if (enemy.state !== 'dead' && enemy.state !== 'destroyed') {
                    const distance = this.getDistanceToTarget(enemy);
                    if (distance <= this.detectionRange) {
                        targets.push(enemy);
                    }
                }
            }
        }
        
        return targets;
    }
    
    selectBestTarget() {
        if (this.hostileTargets.length === 0) return null;
        
        // Select closest target
        let bestTarget = null;
        let bestDistance = Infinity;
        
        for (const target of this.hostileTargets) {
            const distance = this.getDistanceToTarget(target);
            if (distance < bestDistance && distance <= this.detectionRange) {
                bestDistance = distance;
                bestTarget = target;
            }
        }
        
        return bestTarget;
    }
    
    isValidTarget(target) {
        if (!target) return false;
        
        // Check if target still exists and is in range
        const distance = this.getDistanceToTarget(target);
        return distance <= this.detectionRange && target.currentHealth > 0;
    }
    
    isInAttackRange(target) {
        const distance = this.getDistanceToTarget(target);
        return distance <= this.attackRange;
    }
    
    isAimedAtTarget() {
        if (!this.currentTarget) return false;
        
        const rotationDiff = Math.abs(this.targetRotation - this.rotation);
        return rotationDiff < 0.1; // Within ~6 degrees
    }
    
    getDistanceToTarget(target) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const dx = target.x - centerX;
        const dy = target.y - centerY;
        return Math.sqrt(dx * dx + dy * dy) / 32; // Convert to grid units
    }
    
    attack(target) {
        if (!target) return;
        
        // Create projectile instead of instant damage
        const barrelEndX = this.x + this.width / 2 + Math.cos(this.rotation) * (this.width * 0.4);
        const barrelEndY = this.y + this.height / 2 + Math.sin(this.rotation) * (this.width * 0.4);
        
        // Create projectile (will import at module level)
        if (window.game && window.game.combatManager && window.Projectile) {
            const effectiveDamage = Math.round(this.damage * this.damageMultiplier);
            const projectile = window.Projectile.createBullet(
                barrelEndX,
                barrelEndY,
                target.x,
                target.y,
                effectiveDamage,
                this
            );
            
            // Set damage type based on veterancy level
            if (this.veterancyLevel >= 2) {
                projectile.damageType = 'anti_armor'; // Elite turrets get armor-piercing rounds
            } else {
                projectile.damageType = 'kinetic'; // Standard rounds
            }
            
            window.game.combatManager.addProjectile(projectile);
        }
        
        // Visual effects
        this.muzzleFlash = 1.0;
        this.lastShotTime = Date.now();
        
        const levelText = this.veterancyLevel > 0 ? ` (Veteran Lv${this.veterancyLevel})` : '';
        console.log(`🔫 Turret${levelText} fired projectile at ${target.type || 'target'}`);
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
    
    // Level up the turret
    levelUp() {
        if (this.veterancyLevel >= this.maxVeterancyLevel) return;
        
        this.veterancyLevel++;
        
        // Apply veterancy bonuses
        switch (this.veterancyLevel) {
            case 1: // Experienced
                this.damageMultiplier = 1.2;
                this.attackCooldown *= 0.9; // 10% faster firing
                console.log(`🎖️ Turret promoted to Experienced (Lv1)!`);
                break;
            case 2: // Veteran
                this.damageMultiplier = 1.4;
                this.attackCooldown *= 0.8; // 20% faster firing total
                this.attackRange += 1; // Increased range
                this.detectionRange = this.attackRange + 1;
                console.log(`🎖️ Turret promoted to Veteran (Lv2)!`);
                break;
            case 3: // Elite
                this.damageMultiplier = 1.6;
                this.attackCooldown *= 0.7; // 30% faster firing total
                this.attackRange += 1; // Further increased range
                this.detectionRange = this.attackRange + 1;
                console.log(`🎖️ Turret promoted to Elite (Lv3)!`);
                break;
        }
    }
    
    // Update veterancy-related systems
    updateVeterancy(deltaTime) {
        // Veterancy systems are mostly event-driven (gainExperience)
        // but we could add passive bonuses here if needed
    }
    
    // Get turret status information
    getTurretInfo() {
        const baseInfo = this.getInfo();
        return {
            ...baseInfo,
            combat: {
                attackRange: this.attackRange,
                damage: this.damage,
                attackCooldown: this.attackCooldown,
                detectionRange: this.detectionRange,
                rotation: this.rotation,
                targetRotation: this.targetRotation
            },
            targeting: {
                hasTarget: !!this.currentTarget,
                targetsInRange: this.hostileTargets.length,
                lastAttackTime: this.lastAttackTime,
                isReady: Date.now() / 1000 - this.lastAttackTime >= this.attackCooldown
            }
        };
    }
    
    // Static method to get construction cost
    static getCost() {
        return { spice: 40 };
    }
} 