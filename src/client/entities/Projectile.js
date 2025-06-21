export class Projectile {
    constructor(x, y, targetX, targetY, config = {}) {
        this.id = `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        
        // Target and movement
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = config.speed || 300;
        this.direction = Math.atan2(targetY - y, targetX - x);
        
        // Movement calculation
        const dx = targetX - x;
        const dy = targetY - y;
        this.distance = Math.sqrt(dx * dx + dy * dy);
        this.travelTime = this.distance / this.speed;
        this.currentTime = 0;
        
        // Combat properties
        this.damage = config.damage || 25;
        this.explosionRadius = config.explosionRadius || 20;
        this.piercing = config.piercing || false;
        this.source = config.source || null;
        this.damageType = config.damageType || 'kinetic';
        
        // Visual properties
        this.type = config.type || 'bullet';
        this.color = config.color || '#FFFF00';
        this.size = config.size || 3;
        this.trail = [];
        this.maxTrailLength = config.trailLength || 8;
        
        // State
        this.isActive = true;
        this.hasHit = false;
        this.hitTarget = null;
        
        // Effects
        this.explosionAnimation = 0;
        this.explosionDuration = 0.3;
        
        console.log(`🚀 Projectile fired from (${Math.round(x)}, ${Math.round(y)}) to (${Math.round(targetX)}, ${Math.round(targetY)})`);
    }
    
    update(deltaTime, gameState) {
        if (!this.isActive) return;
        
        if (!this.hasHit) {
            this.updateMovement(deltaTime, gameState);
            this.updateTrail();
            this.checkCollisions(gameState);
        } else {
            this.updateExplosion(deltaTime);
        }
    }
    
    updateMovement(deltaTime, gameState) {
        this.currentTime += deltaTime;
        
        // Calculate position based on travel time
        const progress = Math.min(this.currentTime / this.travelTime, 1.0);
        
        this.x = this.startX + (this.targetX - this.startX) * progress;
        this.y = this.startY + (this.targetY - this.startY) * progress;
        
        // Check if we've reached the target
        if (progress >= 1.0) {
            this.hit(null, gameState);
        }
    }
    
    updateTrail() {
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y, time: Date.now() });
        
        // Remove old trail segments
        while (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    updateExplosion(deltaTime) {
        this.explosionAnimation += deltaTime / this.explosionDuration;
        
        if (this.explosionAnimation >= 1.0) {
            this.isActive = false;
        }
    }
    
    checkCollisions(gameState) {
        // Check collision with enemies
        if (gameState.enemies) {
            for (const enemy of gameState.enemies) {
                if (this.isCollidingWith(enemy)) {
                    this.hit(enemy, gameState);
                    return;
                }
            }
        }
    }
    
    isCollidingWith(target) {
        if (!target || target.state === 'dead' || target.state === 'destroyed') {
            return false;
        }
        
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const targetRadius = (target.size || target.width || 16) / 2;
        return distance <= targetRadius + this.size;
    }
    
    hit(target, gameState) {
        if (this.hasHit) return;
        
        this.hasHit = true;
        this.hitTarget = target;
        this.explosionAnimation = 0;
        
        if (target) {
            console.log(`💥 Projectile hit ${target.type || 'target'}`);
            
            // Deal damage to direct hit target
            if (target.takeDamage) {
                target.takeDamage(this.damage);
            }
        }
        
        // Handle area damage if explosion radius > 0
        if (this.explosionRadius > 0 && gameState) {
            this.dealAreaDamage(gameState);
        }
        
        // Create explosion effect
        this.createExplosionEffect();
    }
    
    dealAreaDamage(gameState) {
        const targets = [];
        
        // Add enemies to potential targets
        if (gameState.enemies) {
            targets.push(...gameState.enemies);
        }
        
        // Apply damage to all targets in radius
        for (const target of targets) {
            if (target === this.hitTarget) continue; // Already damaged
            if (target.state === 'dead' || target.state === 'destroyed') continue;
            
            const dx = this.x - target.x;
            const dy = this.y - target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                // Calculate damage falloff
                const damageMultiplier = 1.0 - (distance / this.explosionRadius) * 0.5;
                const areaDamage = Math.round(this.damage * damageMultiplier);
                
                if (target.takeDamage && areaDamage > 0) {
                    target.takeDamage(areaDamage);
                    console.log(`🔥 Area damage: ${areaDamage} to ${target.type} at distance ${Math.round(distance)}`);
                }
            }
        }
    }
    
    createExplosionEffect() {
        // This could create visual particles or other effects
        // For now, we'll just use the explosion animation
        console.log(`💥 Explosion at (${Math.round(this.x)}, ${Math.round(this.y)})`);
    }
    
    // Factory methods for different projectile types
    static createBullet(x, y, targetX, targetY, damage = 25, source = null) {
        return new Projectile(x, y, targetX, targetY, {
            type: 'bullet',
            speed: 400,
            damage: damage,
            color: '#FFFF00',
            size: 3,
            trailLength: 6,
            explosionRadius: 0,
            source: source
        });
    }
    
    static createShell(x, y, targetX, targetY, damage = 40, source = null) {
        return new Projectile(x, y, targetX, targetY, {
            type: 'shell',
            speed: 250,
            damage: damage,
            color: '#FFA500',
            size: 5,
            trailLength: 10,
            explosionRadius: 30,
            source: source
        });
    }
    
    static createMissile(x, y, targetX, targetY, damage = 60, source = null) {
        return new Projectile(x, y, targetX, targetY, {
            type: 'missile',
            speed: 200,
            damage: damage,
            color: '#FF0000',
            size: 4,
            trailLength: 15,
            explosionRadius: 50,
            source: source
        });
    }
    
    // Get projectile info for rendering
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            position: { x: this.x, y: this.y },
            target: { x: this.targetX, y: this.targetY },
            progress: this.currentTime / this.travelTime,
            isActive: this.isActive,
            hasHit: this.hasHit,
            explosion: {
                isExploding: this.hasHit,
                progress: this.explosionAnimation,
                radius: this.explosionRadius
            },
            visual: {
                color: this.color,
                size: this.size,
                trail: this.trail,
                direction: this.direction
            }
        };
    }
} 