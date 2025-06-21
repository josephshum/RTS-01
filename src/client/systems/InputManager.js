export class InputManager {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        
        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0,
            dragStartCameraX: 0,
            dragStartCameraY: 0,
            clickQueue: []
        };
        
        // Keyboard state
        this.keys = new Set();
        
        // Debouncing for single-press keys
        this.keyDebounce = new Map(); // key -> last triggered timestamp
        this.debounceDelay = 200; // milliseconds between triggers
        
        // Camera movement speed
        this.cameraSpeed = 300; // pixels per second
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        
        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        
        if (event.button === 0) { // Left mouse button
            this.mouse.isDragging = true;
            this.mouse.dragStartX = this.mouse.x;
            this.mouse.dragStartY = this.mouse.y;
            this.mouse.dragStartCameraX = this.camera.targetX;
            this.mouse.dragStartCameraY = this.camera.targetY;
            
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        
        if (this.mouse.isDragging) {
            const deltaX = this.mouse.x - this.mouse.dragStartX;
            const deltaY = this.mouse.y - this.mouse.dragStartY;
            
            // Move camera in opposite direction of drag
            this.camera.moveTo(
                this.mouse.dragStartCameraX - deltaX / this.camera.zoom,
                this.mouse.dragStartCameraY - deltaY / this.camera.zoom
            );
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) { // Left mouse button
            // Check if this was a click (not a drag)
            if (!this.mouse.isDragging || 
                (Math.abs(this.mouse.x - this.mouse.dragStartX) < 5 && 
                 Math.abs(this.mouse.y - this.mouse.dragStartY) < 5)) {
                
                // Add click to queue
                const worldPos = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
                this.mouse.clickQueue.push({
                    x: worldPos.x,
                    y: worldPos.y,
                    button: event.button,
                    timestamp: Date.now()
                });
            }
            
            this.mouse.isDragging = false;
            this.canvas.style.cursor = 'grab';
        }
    }
    
    onWheel(event) {
        event.preventDefault();
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        
        // Get mouse position in world coordinates before zoom
        const worldPos = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
        
        // Apply zoom
        this.camera.zoomBy(zoomFactor);
        
        // Get mouse position in world coordinates after zoom
        const newWorldPos = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
        
        // Adjust camera position to keep mouse over same world point
        this.camera.pan(
            newWorldPos.x - worldPos.x,
            newWorldPos.y - worldPos.y
        );
    }
    
    onKeyDown(event) {
        this.keys.add(event.code);
        
        // Handle special keys
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.camera.center();
                break;
        }
    }
    
    onKeyUp(event) {
        this.keys.delete(event.code);
        
        // Clear debounce state for immediate response keys when released
        const immediateKeys = ['Space', 'KeyI']; // Keys that should respond immediately on next press
        if (immediateKeys.includes(event.code)) {
            this.clearDebounce(event.code);
        }
    }
    
    // Update method to handle continuous key presses
    update(deltaTime) {
        const moveDistance = this.cameraSpeed * deltaTime / this.camera.zoom;
        
        // Arrow key camera movement
        if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
            this.camera.pan(-moveDistance, 0);
        }
        if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
            this.camera.pan(moveDistance, 0);
        }
        if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) {
            this.camera.pan(0, -moveDistance);
        }
        if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) {
            this.camera.pan(0, moveDistance);
        }
        
        // Zoom controls
        if (this.keys.has('Equal') || this.keys.has('NumpadAdd')) {
            this.camera.zoomBy(1 + deltaTime);
        }
        if (this.keys.has('Minus') || this.keys.has('NumpadSubtract')) {
            this.camera.zoomBy(1 - deltaTime);
        }
    }
    
    // Get current mouse position in world coordinates
    getWorldMousePos() {
        return this.camera.screenToWorld(this.mouse.x, this.mouse.y);
    }
    
    // Check if a key is currently pressed
    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }
    
    // Check if a key is pressed and not debounced (for single-action keys)
    isKeyPressedDebounced(keyCode) {
        if (!this.keys.has(keyCode)) {
            return false;
        }
        
        const now = Date.now();
        const lastTriggered = this.keyDebounce.get(keyCode) || 0;
        
        if (now - lastTriggered >= this.debounceDelay) {
            this.keyDebounce.set(keyCode, now);
            return true;
        }
        
        return false;
    }
    
    // Set custom debounce delay for specific keys
    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }
    
    // Clear debounce state for a specific key (useful for immediate response)
    clearDebounce(keyCode) {
        this.keyDebounce.delete(keyCode);
    }
    
    // Get and clear pending clicks
    getClicks() {
        const clicks = [...this.mouse.clickQueue];
        this.mouse.clickQueue = [];
        return clicks;
    }
} 