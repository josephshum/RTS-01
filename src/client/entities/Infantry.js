export class Infantry {
    constructor(x, y, ownerId = 1) {
        this.id = `infantry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = 'Infantry';
        this.x = x;
        this.y = y;
        this.ownerId = ownerId;
        
        // Unit properties
        this.width = 16;
        this.height = 16;
        this.speed = 60; // pixels per second
        this.maxHealth = 50;
        this.currentHealth = this.maxHealth;
        
        // Combat properties
        this.damage = 15;
        this.attackRange = 4; // grid tiles
        this.attackCooldown = 1.5; // seconds
        this.lastAttackTime = 0;
        
        // Movement and AI
        this.state = 'idle'; // idle, moving, attacking, patrol
        this.targetX = x;
        this.targetY = y;
        this.path = [];
        this.currentPathIndex = 0;
        
        // Selection
        this.isSelected = false;
        this.selectionTime = 0;
        
        // Visual
        this.rotation = 0;
        this.animationFrame = 0;
        
        console.log(`👤 Infantry unit created at (${x}, ${y})`);
    }

    update(deltaTime, gameState) {
        this.animationFrame += deltaTime * 2;
        
        if (this.isSelected) {
            this.selectionTime += deltaTime;
        }
        
        // Basic AI and movement logic will be added later
        this.updateMovement(deltaTime);
        this.updateCombat(deltaTime, gameState);
    }

    updateMovement(deltaTime) {
        // Simple movement toward target
        if (Math.abs(this.x - this.targetX) > 5 || Math.abs(this.y - this.targetY) > 5) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const moveX = (dx / distance) * this.speed * deltaTime;
                const moveY = (dy / distance) * this.speed * deltaTime;
                
                this.x += moveX;
                this.y += moveY;
                
                // Update rotation to face movement direction
                this.rotation = Math.atan2(dy, dx);
                this.state = 'moving';
            }
        } else {
            this.state = 'idle';
        }
    }

    updateCombat(deltaTime, gameState) {
        // Simple combat against enemies
        if (!gameState.enemies) return;
        
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastAttackTime < this.attackCooldown) return;
        
        // Find nearest enemy within range
        let nearestEnemy = null;
        let nearestDistance = this.attackRange * 32; // Convert to pixels
        
        for (const enemy of gameState.enemies) {
            const distance = Math.sqrt(
                Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2)
            );
            
            if (distance < nearestDistance) {
                nearestEnemy = enemy;
                nearestDistance = distance;
            }
        }
        
        if (nearestEnemy) {
            this.attackTarget(nearestEnemy);
            this.lastAttackTime = currentTime;
        }
    }

    attackTarget(target) {
        // Face the target
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        this.rotation = Math.atan2(dy, dx);
        
        // Calculate muzzle position (tip of weapon)
        const weaponLength = 16;
        const muzzleX = this.x + Math.cos(this.rotation) * weaponLength;
        const muzzleY = this.y + Math.sin(this.rotation) * weaponLength;
        
        // Create visual effects
        if (window.game && window.game.visualEffects) {
            // Create muzzle flash
            window.game.visualEffects.createMuzzleFlash(muzzleX, muzzleY, this.rotation, {
                color: '#FFFF88',
                size: 6,
                duration: 0.08
            });
            
            // Create tracer round
            window.game.visualEffects.createTracer(muzzleX, muzzleY, target.x, target.y, {
                color: '#FFD700',
                width: 2,
                length: 15,
                speed: 1200
            });
        }
        
        // Deal damage
        if (target.takeDamage) {
            target.takeDamage(this.damage);
            console.log(`⚔️ Infantry attacked ${target.type} for ${this.damage} damage`);
        }
        
        this.state = 'attacking';
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        console.log(`🎯 Infantry moving to (${Math.round(x)}, ${Math.round(y)})`);
    }

    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0) {
            this.state = 'destroyed';
            console.log(`💀 Infantry unit destroyed`);
            return true; // Unit is destroyed
        }
        
        return false;
    }

    getInfo() {
        return {
            id: this.id,
            type: this.type,
            health: `${this.currentHealth}/${this.maxHealth}`,
            state: this.state,
            position: { x: Math.round(this.x), y: Math.round(this.y) },
            damage: this.damage,
            range: this.attackRange,
            ownerId: this.ownerId
        };
    }

    // Check if unit is within screen bounds for rendering
    isVisible(camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        return screenPos.x > -50 && screenPos.x < camera.viewportWidth + 50 &&
               screenPos.y > -50 && screenPos.y < camera.viewportHeight + 50;
    }

    // Selection methods
    select() {
        this.isSelected = true;
        this.selectionTime = 0;
    }

    deselect() {
        this.isSelected = false;
    }

    // Get bounding box for selection
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}
