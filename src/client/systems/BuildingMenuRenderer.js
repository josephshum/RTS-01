export class BuildingMenuRenderer {
    constructor() {
        this.iconCache = new Map();
        this.buildingColors = {
            'ConstructionYard': '#8B4513',
            'SpiceRefinery': '#FFD700',
            'GunTurret': '#FF4500',
            'Barracks': '#2E8B57'
        };
        this.buildingCosts = {
            'SpiceRefinery': 80,
            'GunTurret': 40,
            'ConstructionYard': 100,
            'Barracks': 120
        };
    }

    // Draw a building icon on the given canvas
    drawBuildingIcon(canvas, buildingType) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set background
        ctx.fillStyle = '#2F1B14';
        ctx.fillRect(0, 0, width, height);
        
        switch (buildingType) {
            case 'SpiceRefinery':
                this.drawSpiceRefinery(ctx, width, height);
                break;
            case 'GunTurret':
                this.drawGunTurret(ctx, width, height);
                break;
            case 'ConstructionYard':
                this.drawConstructionYard(ctx, width, height);
                break;
            case 'Barracks':
                this.drawBarracks(ctx, width, height);
                break;
            default:
                this.drawDefaultBuilding(ctx, width, height, buildingType);
        }
    }

    drawSpiceRefinery(ctx, width, height) {
        const color = this.buildingColors['SpiceRefinery'];
        
        // Main building structure
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(8, 12, width - 16, height - 20);
        
        // Refinery body
        ctx.fillStyle = color;
        ctx.fillRect(10, 14, width - 20, height - 24);
        
        // Processing tanks (circles)
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(width * 0.3, height * 0.4, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width * 0.7, height * 0.4, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Pipes connecting tanks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * 0.3 + 8, height * 0.4);
        ctx.lineTo(width * 0.7 - 8, height * 0.4);
        ctx.stroke();
        
        // Chimney
        ctx.fillStyle = '#666666';
        ctx.fillRect(width * 0.8, 6, 6, height * 0.3);
        
        // Spice output area
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(12, height - 12, width - 24, 4);
    }

    drawGunTurret(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const color = this.buildingColors['GunTurret'];
        
        // Base platform
        ctx.fillStyle = '#2A2A2A';
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Main turret base
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Cannon barrel
        const barrelLength = width * 0.4;
        const barrelWidth = height * 0.1;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(centerX, centerY - barrelWidth/2, barrelLength, barrelWidth);
        
        // Turret details
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Targeting sensor
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(centerX + width * 0.25, centerY - height * 0.1, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawConstructionYard(ctx, width, height) {
        const color = this.buildingColors['ConstructionYard'];
        
        // Main building base
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(4, 8, width - 8, height - 12);
        
        // Construction yard body
        ctx.fillStyle = color;
        ctx.fillRect(6, 10, width - 12, height - 16);
        
        // Construction crane
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height - 6);
        ctx.lineTo(width * 0.2, height * 0.3);
        ctx.lineTo(width * 0.7, height * 0.3);
        ctx.stroke();
        
        // Crane hook
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.6, height * 0.3);
        ctx.lineTo(width * 0.6, height * 0.5);
        ctx.stroke();
        
        // Construction materials
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(width * 0.7, height - 16, 8, 8);
        ctx.fillRect(width * 0.8, height - 12, 6, 4);
        
        // Factory windows
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(width * 0.1, height * 0.6, 4, 6);
        ctx.fillRect(width * 0.3, height * 0.6, 4, 6);
        
        // Command center
        ctx.fillStyle = '#654321';
        ctx.fillRect(width * 0.4, height * 0.4, width * 0.2, height * 0.2);
    }

    drawBarracks(ctx, width, height) {
        const color = this.buildingColors['Barracks'];
        
        // Main building base
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(6, 8, width - 12, height - 12);
        
        // Barracks body
        ctx.fillStyle = color;
        ctx.fillRect(8, 10, width - 16, height - 16);
        
        // Training grounds (left side)
        ctx.fillStyle = '#654321';
        ctx.fillRect(10, 12, width * 0.3, height - 20);
        
        // Main building (right side)
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(width * 0.4, 12, width * 0.5, height - 20);
        
        // Entrance door
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(width * 0.45, height - 14, width * 0.15, 8);
        
        // Windows
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(width * 0.5, height * 0.3, 4, 6);
        ctx.fillRect(width * 0.7, height * 0.3, 4, 6);
        
        // Flag pole
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.15, height - 16);
        ctx.lineTo(width * 0.15, 8);
        ctx.stroke();
        
        // Flag
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(width * 0.15, 8, 8, 6);
        
        // Soldiers (small rectangles representing units)
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(12, height - 18, 3, 6);
        ctx.fillRect(17, height - 18, 3, 6);
        ctx.fillRect(22, height - 18, 3, 6);
    }

    drawDefaultBuilding(ctx, width, height, buildingType) {
        const color = this.buildingColors[buildingType] || '#666666';
        
        // Simple rectangular building
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(8, 8, width - 16, height - 16);
        
        ctx.fillStyle = color;
        ctx.fillRect(10, 10, width - 20, height - 20);
        
        // Simple details
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(12, 12, width - 24, 4);
        ctx.fillRect(12, height - 16, width - 24, 4);
    }

    // Initialize all building icons
    initializeBuildingIcons() {
        const buildingItems = document.querySelectorAll('.building-item');
        
        buildingItems.forEach(item => {
            const buildingType = item.getAttribute('data-building-type');
            const canvas = item.querySelector('.building-icon');
            
            if (canvas && buildingType) {
                this.drawBuildingIcon(canvas, buildingType);
            }
        });
    }

    // Update building availability based on resources
    updateBuildingAvailability(currentSpice) {
        const buildingItems = document.querySelectorAll('.building-item');
        
        buildingItems.forEach(item => {
            const buildingType = item.getAttribute('data-building-type');
            const cost = this.buildingCosts[buildingType] || 0;
            const costElement = item.querySelector('.building-cost');
            
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
        });
    }

    // Update selected building visual state
    updateSelectedBuilding(selectedBuildingType) {
        const buildingItems = document.querySelectorAll('.building-item');
        
        buildingItems.forEach(item => {
            const buildingType = item.getAttribute('data-building-type');
            
            if (buildingType === selectedBuildingType) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Clear all building selections
    clearSelection() {
        const buildingItems = document.querySelectorAll('.building-item');
        buildingItems.forEach(item => {
            item.classList.remove('selected');
        });
    }

    // Get building cost for display
    getBuildingCost(buildingType) {
        return this.buildingCosts[buildingType] || 0;
    }
}
