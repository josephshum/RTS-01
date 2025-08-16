export class VisualEffects {
    constructor() {
        this.tracers = [];
        this.muzzleFlashes = [];
        this.impacts = [];
        this.nextEffectId = 1;
    }

    // Create a tracer round effect
    createTracer(startX, startY, endX, endY, options = {}) {
        const tracer = {
            id: this.nextEffectId++,
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            currentX: startX,
            currentY: startY,
            
            // Visual properties
            color: options.color || '#FFD700',
            width: options.width || 2,
            length: options.length || 20,
            speed: options.speed || 800, // pixels per second
            
            // Animation
            progress: 0,
            duration: 0,
            createdAt: Date.now(),
            isActive: true,
            
            // Trail effect
            trail: []
        };
        
        // Calculate duration based on distance and speed
        const distance = Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        );
        tracer.duration = distance / tracer.speed;
        
        this.tracers.push(tracer);
        
        console.log(`💥 Tracer created from (${Math.round(startX)}, ${Math.round(startY)}) to (${Math.round(endX)}, ${Math.round(endY)})`);
        return tracer;
    }

    // Create a muzzle flash effect
    createMuzzleFlash(x, y, rotation, options = {}) {
        const muzzleFlash = {
            id: this.nextEffectId++,
            x: x,
            y: y,
            rotation: rotation || 0,
            
            // Visual properties
            color: options.color || '#FFFF00',
            size: options.size || 8,
            duration: options.duration || 0.1, // seconds
            
            // Animation
            intensity: 1.0,
            createdAt: Date.now(),
            isActive: true
        };
        
        this.muzzleFlashes.push(muzzleFlash);
        return muzzleFlash;
    }

    // Create an impact effect
    createImpact(x, y, options = {}) {
        const impact = {
            id: this.nextEffectId++,
            x: x,
            y: y,
            
            // Visual properties
            color: options.color || '#FF4500',
            maxSize: options.maxSize || 12,
            currentSize: 0,
            duration: options.duration || 0.3,
            
            // Animation
            progress: 0,
            createdAt: Date.now(),
            isActive: true,
            
            // Particles
            particles: []
        };
        
        // Create small particles for impact
        for (let i = 0; i < 6; i++) {
            impact.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: Math.random() * 0.5 + 0.2,
                maxLife: Math.random() * 0.5 + 0.2
            });
        }
        
        this.impacts.push(impact);
        return impact;
    }

    // Update all visual effects
    update(deltaTime) {
        this.updateTracers(deltaTime);
        this.updateMuzzleFlashes(deltaTime);
        this.updateImpacts(deltaTime);
        
        // Clean up finished effects
        this.cleanup();
    }

    updateTracers(deltaTime) {
        for (const tracer of this.tracers) {
            if (!tracer.isActive) continue;
            
            tracer.progress += deltaTime / tracer.duration;
            
            if (tracer.progress >= 1.0) {
                // Tracer reached target
                tracer.progress = 1.0;
                tracer.isActive = false;
                
                // Create impact effect at target
                this.createImpact(tracer.endX, tracer.endY);
            }
            
            // Update current position
            tracer.currentX = tracer.startX + (tracer.endX - tracer.startX) * tracer.progress;
            tracer.currentY = tracer.startY + (tracer.endY - tracer.startY) * tracer.progress;
            
            // Add to trail
            tracer.trail.push({
                x: tracer.currentX,
                y: tracer.currentY,
                time: Date.now()
            });
            
            // Limit trail length
            const trailDuration = 100; // milliseconds
            const now = Date.now();
            tracer.trail = tracer.trail.filter(point => now - point.time < trailDuration);
        }
    }

    updateMuzzleFlashes(deltaTime) {
        for (const flash of this.muzzleFlashes) {
            if (!flash.isActive) continue;
            
            const elapsed = (Date.now() - flash.createdAt) / 1000;
            flash.intensity = 1.0 - (elapsed / flash.duration);
            
            if (flash.intensity <= 0) {
                flash.isActive = false;
            }
        }
    }

    updateImpacts(deltaTime) {
        for (const impact of this.impacts) {
            if (!impact.isActive) continue;
            
            const elapsed = (Date.now() - impact.createdAt) / 1000;
            impact.progress = elapsed / impact.duration;
            
            if (impact.progress >= 1.0) {
                impact.isActive = false;
                continue;
            }
            
            // Update impact size (expand then contract)
            if (impact.progress < 0.3) {
                impact.currentSize = (impact.progress / 0.3) * impact.maxSize;
            } else {
                impact.currentSize = impact.maxSize * (1.0 - (impact.progress - 0.3) / 0.7);
            }
            
            // Update particles
            for (const particle of impact.particles) {
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.life -= deltaTime;
                
                // Add gravity
                particle.vy += 100 * deltaTime;
            }
            
            // Remove dead particles
            impact.particles = impact.particles.filter(p => p.life > 0);
        }
    }

    cleanup() {
        this.tracers = this.tracers.filter(t => t.isActive);
        this.muzzleFlashes = this.muzzleFlashes.filter(m => m.isActive);
        this.impacts = this.impacts.filter(i => i.isActive);
    }

    // Get all active effects for rendering
    getEffects() {
        return {
            tracers: this.tracers.filter(t => t.isActive),
            muzzleFlashes: this.muzzleFlashes.filter(m => m.isActive),
            impacts: this.impacts.filter(i => i.isActive)
        };
    }

    // Clear all effects
    clear() {
        this.tracers = [];
        this.muzzleFlashes = [];
        this.impacts = [];
    }

    // Get effect count for debugging
    getEffectCount() {
        return {
            tracers: this.tracers.length,
            muzzleFlashes: this.muzzleFlashes.length,
            impacts: this.impacts.length
        };
    }
}
