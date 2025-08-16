export class Depot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        
        // Resource storage
        this.spiceStored = 200;
        this.maxStorage = 1000;
        
        // Health system
        this.maxHealth = 200;
        this.currentHealth = this.maxHealth;
        
        // Visual and animation
        this.animationFrame = 0;
        this.isActive = true;
        
        // Activity tracking
        this.lastDeliveryTime = 0;
        this.totalDeliveries = 0;
        this.deliveryAnimation = 0;
    }
    
    update(deltaTime) {
        this.animationFrame += deltaTime * 2;
        
        // Fade delivery animation
        if (this.deliveryAnimation > 0) {
            this.deliveryAnimation = Math.max(0, this.deliveryAnimation - deltaTime * 3);
        }
    }
    
    addSpice(amount) {
        if (amount <= 0) return 0;
        
        const spaceAvailable = this.maxStorage - this.spiceStored;
        const actualAmount = Math.min(amount, spaceAvailable);
        
        this.spiceStored += actualAmount;
        this.lastDeliveryTime = Date.now();
        this.totalDeliveries++;
        
        // Trigger delivery animation
        this.deliveryAnimation = 1.0;
        
        return actualAmount;
    }
    
    getSpice(amount) {
        if (amount <= 0) return 0;
        
        const actualAmount = Math.min(amount, this.spiceStored);
        this.spiceStored -= actualAmount;
        
        return actualAmount;
    }
    
    getStoragePercentage() {
        return this.maxStorage > 0 ? (this.spiceStored / this.maxStorage) : 0;
    }
    
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
    
    contains(x, y) {
        const bounds = this.getBounds();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }
    
    isNearby(x, y, distance = 50) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= distance;
    }
    
    getInfo() {
        return {
            stored: Math.round(this.spiceStored),
            capacity: this.maxStorage,
            percentage: Math.round(this.getStoragePercentage()),
            deliveries: this.totalDeliveries,
            lastDelivery: this.lastDeliveryTime,
            health: {
                current: Math.round(this.currentHealth),
                max: this.maxHealth,
                percentage: Math.round(this.getHealthPercentage())
            }
        };
    }
    
    // Health system methods
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0) {
            this.isActive = false;
            console.log(`💥 Depot destroyed`);
            return true;
        }
        
        return false;
    }
    
    getHealthPercentage() {
        return this.maxHealth > 0 ? (this.currentHealth / this.maxHealth) : 0;
    }
} 