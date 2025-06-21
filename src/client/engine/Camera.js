export class Camera {
    constructor(x = 0, y = 0, zoom = 1.0) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
        
        // Target position for smooth movement
        this.targetX = x;
        this.targetY = y;
        this.targetZoom = zoom;
        
        // Camera constraints
        this.minZoom = 0.25;
        this.maxZoom = 3.0;
        
        // Smooth movement parameters
        this.smoothFactor = 0.1;
        this.zoomSmoothFactor = 0.15;
        
        // Viewport size
        this.viewportWidth = 1200;
        this.viewportHeight = 800;
    }
    
    setViewport(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom + this.viewportWidth / 2,
            y: (worldY - this.y) * this.zoom + this.viewportHeight / 2
        };
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.viewportWidth / 2) / this.zoom + this.x,
            y: (screenY - this.viewportHeight / 2) / this.zoom + this.y
        };
    }
    
    // Set target position for smooth movement
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    // Pan camera by delta amount
    pan(deltaX, deltaY) {
        this.targetX += deltaX / this.zoom;
        this.targetY += deltaY / this.zoom;
    }
    
    // Set target zoom level
    setZoom(zoom) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
    
    // Zoom in/out by factor
    zoomBy(factor) {
        this.setZoom(this.targetZoom * factor);
    }
    
    // Center camera at origin
    center() {
        this.moveTo(0, 0);
        this.setZoom(1.0);
    }
    
    // Update camera position with smooth interpolation
    update(deltaTime) {
        // Smooth position interpolation
        const positionDiff = {
            x: this.targetX - this.x,
            y: this.targetY - this.y
        };
        
        this.x += positionDiff.x * this.smoothFactor;
        this.y += positionDiff.y * this.smoothFactor;
        
        // Smooth zoom interpolation
        const zoomDiff = this.targetZoom - this.zoom;
        this.zoom += zoomDiff * this.zoomSmoothFactor;
    }
    
    // Get camera bounds in world coordinates
    getBounds() {
        const halfWidth = (this.viewportWidth / 2) / this.zoom;
        const halfHeight = (this.viewportHeight / 2) / this.zoom;
        
        return {
            left: this.x - halfWidth,
            right: this.x + halfWidth,
            top: this.y - halfHeight,
            bottom: this.y + halfHeight
        };
    }
    
    // Check if a point is visible in the current viewport
    isVisible(x, y, margin = 0) {
        const bounds = this.getBounds();
        return x >= bounds.left - margin &&
               x <= bounds.right + margin &&
               y >= bounds.top - margin &&
               y <= bounds.bottom + margin;
    }
} 