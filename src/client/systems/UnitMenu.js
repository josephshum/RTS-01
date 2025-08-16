export class UnitMenu {
    constructor(onUnitSelected) {
        this.onUnitSelected = onUnitSelected;
        this.isVisible = false;
        this.selectedBarracks = null;
        
        this.initializeMenu();
        this.setupEventListeners();
    }

    initializeMenu() {
        this.menuElement = document.getElementById('unit-menu');
        this.closeButton = document.getElementById('unit-menu-close');
        this.currentProductionElement = document.getElementById('current-production');
        this.productionBarElement = document.getElementById('production-bar');
        this.productionQueueElement = document.getElementById('production-queue');
        
        // Initialize unit icons
        this.initializeUnitIcons();
        
        // Hide menu initially
        this.hide();
    }

    initializeUnitIcons() {
        const unitItems = document.querySelectorAll('.unit-item');
        
        unitItems.forEach(item => {
            const unitType = item.getAttribute('data-unit-type');
            const canvas = item.querySelector('.unit-icon');
            
            if (canvas && unitType) {
                this.drawUnitIcon(canvas, unitType);
            }
        });
    }

    drawUnitIcon(canvas, unitType) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set background
        ctx.fillStyle = '#2F1B14';
        ctx.fillRect(0, 0, width, height);
        
        switch (unitType) {
            case 'Infantry':
                this.drawInfantry(ctx, width, height);
                break;
            case 'Scout':
                this.drawScout(ctx, width, height);
                break;
            case 'Heavy Infantry':
                this.drawHeavyInfantry(ctx, width, height);
                break;
            default:
                this.drawDefaultUnit(ctx, width, height);
        }
    }

    drawInfantry(ctx, width, height) {
        // Basic soldier silhouette
        ctx.fillStyle = '#4169E1';
        
        // Head
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.25, width * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillRect(width * 0.45, height * 0.35, width * 0.1, height * 0.4);
        
        // Arms
        ctx.fillRect(width * 0.35, height * 0.4, width * 0.1, height * 0.05);
        ctx.fillRect(width * 0.55, height * 0.4, width * 0.1, height * 0.05);
        
        // Legs
        ctx.fillRect(width * 0.42, height * 0.75, width * 0.06, height * 0.2);
        ctx.fillRect(width * 0.52, height * 0.75, width * 0.06, height * 0.2);
        
        // Weapon (rifle)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(width * 0.6, height * 0.35, width * 0.15, width * 0.03);
    }

    drawScout(ctx, width, height) {
        // Lighter, more agile-looking unit
        ctx.fillStyle = '#32CD32';
        
        // Head
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.3, width * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (smaller)
        ctx.fillRect(width * 0.46, height * 0.4, width * 0.08, height * 0.35);
        
        // Arms (positioned for running)
        ctx.fillRect(width * 0.36, height * 0.45, width * 0.08, width * 0.04);
        ctx.fillRect(width * 0.56, height * 0.5, width * 0.08, width * 0.04);
        
        // Legs (running position)
        ctx.fillRect(width * 0.44, height * 0.75, width * 0.05, height * 0.15);
        ctx.fillRect(width * 0.54, height * 0.8, width * 0.05, height * 0.12);
        
        // Equipment pack
        ctx.fillStyle = '#228B22';
        ctx.fillRect(width * 0.48, height * 0.42, width * 0.04, height * 0.1);
    }

    drawHeavyInfantry(ctx, width, height) {
        // Heavier, more armored unit
        ctx.fillStyle = '#B22222';
        
        // Head (with helmet)
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.22, width * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (wider/armored)
        ctx.fillRect(width * 0.42, height * 0.35, width * 0.16, height * 0.4);
        
        // Arms (thicker)
        ctx.fillRect(width * 0.32, height * 0.4, width * 0.12, width * 0.06);
        ctx.fillRect(width * 0.56, height * 0.4, width * 0.12, width * 0.06);
        
        // Legs (thicker)
        ctx.fillRect(width * 0.4, height * 0.75, width * 0.08, height * 0.2);
        ctx.fillRect(width * 0.52, height * 0.75, width * 0.08, height * 0.2);
        
        // Heavy weapon
        ctx.fillStyle = '#696969';
        ctx.fillRect(width * 0.65, height * 0.3, width * 0.2, width * 0.06);
        
        // Armor details
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(width * 0.44, height * 0.37, width * 0.12, width * 0.04);
    }

    drawDefaultUnit(ctx, width, height) {
        // Generic unit
        ctx.fillStyle = '#808080';
        
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.25, width * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillRect(width * 0.45, height * 0.35, width * 0.1, height * 0.4);
        ctx.fillRect(width * 0.42, height * 0.75, width * 0.06, height * 0.2);
        ctx.fillRect(width * 0.52, height * 0.75, width * 0.06, height * 0.2);
    }

    setupEventListeners() {
        // Close button
        this.closeButton.addEventListener('click', () => {
            this.hide();
        });

        // Unit selection buttons
        const unitItems = document.querySelectorAll('.unit-item');
        unitItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (item.classList.contains('disabled')) {
                    return; // Don't allow selection of disabled units
                }
                
                const unitType = item.getAttribute('data-unit-type');
                this.selectUnit(unitType);
            });
        });
    }

    selectUnit(unitType) {
        if (!this.selectedBarracks) {
            console.log('❌ No barracks selected');
            return;
        }

        // Try to queue unit production
        const gameState = window.game ? window.game.getGameState() : null;
        const success = this.selectedBarracks.queueUnitProduction(unitType, gameState);
        
        if (success && this.onUnitSelected) {
            this.onUnitSelected(unitType, this.selectedBarracks);
        }
        
        // Update display
        this.updateDisplay();
    }

    show(barracks = null) {
        this.selectedBarracks = barracks;
        this.isVisible = true;
        this.menuElement.classList.remove('hidden');
        this.updateDisplay();
        
        console.log(`📋 Unit menu opened for barracks at (${barracks?.gridX}, ${barracks?.gridY})`);
    }

    hide() {
        this.isVisible = false;
        this.selectedBarracks = null;
        this.menuElement.classList.add('hidden');
    }

    updateDisplay() {
        if (!this.selectedBarracks) {
            this.currentProductionElement.textContent = 'No barracks selected';
            this.productionBarElement.style.width = '0%';
            this.productionQueueElement.textContent = 'Queue: 0/0';
            return;
        }

        const productionInfo = this.selectedBarracks.getProductionInfo();
        
        // Update current production
        if (productionInfo.isProducing && productionInfo.currentProduction) {
            this.currentProductionElement.textContent = `Producing: ${productionInfo.currentProduction.type}`;
            this.productionBarElement.style.width = `${productionInfo.productionPercentage}%`;
        } else {
            this.currentProductionElement.textContent = 'No production active';
            this.productionBarElement.style.width = '0%';
        }
        
        // Update queue
        this.productionQueueElement.textContent = `Queue: ${productionInfo.queueLength}/${productionInfo.maxQueueSize}`;
        
        // Update unit availability based on resources
        this.updateUnitAvailability();
    }

    updateUnitAvailability() {
        if (!this.selectedBarracks) return;
        
        const gameState = window.game ? window.game.getGameState() : null;
        const currentSpice = gameState && gameState.depot ? gameState.depot.spiceStored : 0;
        
        const unitItems = document.querySelectorAll('.unit-item');
        const availableUnits = this.selectedBarracks.availableUnits;
        
        unitItems.forEach(item => {
            const unitType = item.getAttribute('data-unit-type');
            const unitConfig = availableUnits.find(unit => unit.type === unitType);
            const costElement = item.querySelector('.unit-cost');
            
            if (unitConfig) {
                const cost = unitConfig.cost.spice || 0;
                
                if (currentSpice >= cost) {
                    item.classList.remove('disabled');
                    if (costElement) {
                        costElement.classList.remove('insufficient');
                    }
                } else {
                    item.classList.add('disabled');
                    if (costElement) {
                        costElement.classList.add('insufficient');
                    }
                }
            }
        });
    }

    // Public methods for game integration
    isMenuVisible() {
        return this.isVisible;
    }

    getSelectedBarracks() {
        return this.selectedBarracks;
    }

    // Method to be called by game loop for updates
    update() {
        if (this.isVisible && this.selectedBarracks) {
            this.updateDisplay();
        }
    }
}
