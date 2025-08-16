import { BuildingMenuRenderer } from './BuildingMenuRenderer.js';

export class BuildingMenu {
    constructor(buildingManager, onBuildingSelected) {
        this.buildingManager = buildingManager;
        this.onBuildingSelected = onBuildingSelected;
        this.renderer = new BuildingMenuRenderer();
        this.isVisible = false;
        this.selectedBuildingType = null;
        
        this.initializeMenu();
        this.setupEventListeners();
    }

    initializeMenu() {
        this.menuElement = document.getElementById('building-menu');
        this.closeButton = document.getElementById('building-menu-close');
        this.cancelButton = document.getElementById('cancel-build-btn');
        
        // Initialize building icons
        this.renderer.initializeBuildingIcons();
        
        // Show menu by default
        this.show();
    }

    setupEventListeners() {
        // Close button
        this.closeButton.addEventListener('click', () => {
            this.hide();
            this.cancelBuildMode();
        });

        // Cancel build button
        this.cancelButton.addEventListener('click', () => {
            this.cancelBuildMode();
        });

        // Building selection buttons
        const buildingItems = document.querySelectorAll('.building-item');
        buildingItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (item.classList.contains('disabled')) {
                    return; // Don't allow selection of disabled buildings
                }
                
                const buildingType = item.getAttribute('data-building-type');
                this.selectBuilding(buildingType);
            });
        });

        // Show menu on B key press (integrate with existing system)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyB' && !e.repeat) {
                e.preventDefault();
                this.toggle();
            }
        });

        // Hide menu on Escape
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.isVisible) {
                this.hide();
                this.cancelBuildMode();
            }
        });
    }

    show() {
        this.isVisible = true;
        this.menuElement.classList.remove('hidden');
        this.updateDisplay();
    }

    hide() {
        this.isVisible = false;
        this.menuElement.classList.add('hidden');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
            this.cancelBuildMode();
        } else {
            this.show();
        }
    }

    selectBuilding(buildingType) {
        // Don't allow selection if building is disabled
        const buildingItem = document.querySelector(`[data-building-type="${buildingType}"]`);
        if (buildingItem && buildingItem.classList.contains('disabled')) {
            return;
        }

        this.selectedBuildingType = buildingType;
        this.renderer.updateSelectedBuilding(buildingType);
        
        // Enter placement mode through building manager
        this.buildingManager.enterPlacementMode(buildingType);
        
        // Notify callback
        if (this.onBuildingSelected) {
            this.onBuildingSelected(buildingType);
        }
        
        // Update display
        this.updateDisplay();
        
        console.log(`📐 Selected building: ${buildingType}`);
    }

    cancelBuildMode() {
        this.selectedBuildingType = null;
        this.renderer.clearSelection();
        this.buildingManager.exitPlacementMode();
        this.updateDisplay();
        
        console.log('❌ Cancelled build mode');
    }

    updateDisplay() {
        // Update building availability based on current resources
        // This will be called by the game loop
        const gameState = window.game ? window.game.getGameState() : null;
        if (gameState && gameState.depot) {
            const currentSpice = gameState.depot.spiceStored;
            this.renderer.updateBuildingAvailability(currentSpice);
        }

        // Update cancel button state
        if (this.buildingManager.isPlacementMode) {
            this.cancelButton.textContent = 'Cancel Build';
            this.cancelButton.disabled = false;
        } else {
            this.cancelButton.textContent = 'No Build Active';
            this.cancelButton.disabled = true;
        }

        // Update build mode info in the main UI
        this.updateBuildModeInfo();
    }

    updateBuildModeInfo() {
        const buildModeInfo = document.getElementById('build-mode-info');
        if (buildModeInfo) {
            if (this.buildingManager.isPlacementMode && this.selectedBuildingType) {
                buildModeInfo.textContent = `Build Mode: ${this.selectedBuildingType}`;
                buildModeInfo.style.color = '#FFD700';
            } else {
                buildModeInfo.textContent = 'Build Mode: Off';
                buildModeInfo.style.color = '#f0f0f0';
            }
        }
    }

    // Public methods for game integration
    getSelectedBuildingType() {
        return this.selectedBuildingType;
    }

    isMenuVisible() {
        return this.isVisible;
    }

    // Method to be called by game loop for updates
    update(gameState) {
        if (this.isVisible) {
            this.updateDisplay();
        }
    }

    // Handle building placement success
    onBuildingPlaced() {
        // Keep the building selected for multiple placements
        // User can manually cancel or select a different building
        console.log(`✅ Building placed: ${this.selectedBuildingType}`);
    }

    // Handle building placement failure
    onBuildingPlacementFailed(reason) {
        console.log(`❌ Building placement failed: ${reason}`);
        // Could show a temporary error message in the future
    }
}
