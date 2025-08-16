export class UnitManager {
    constructor() {
        this.selectedUnits = [];
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
    }

    // Select a unit at the given world coordinates
    selectUnitAt(worldX, worldY, playerUnits) {
        let selectedUnit = null;
        
        // Find the unit at the clicked position
        for (const unit of playerUnits) {
            const bounds = unit.getBounds();
            if (worldX >= bounds.left && worldX <= bounds.right &&
                worldY >= bounds.top && worldY <= bounds.bottom) {
                selectedUnit = unit;
                break;
            }
        }
        
        return selectedUnit;
    }

    // Clear all unit selections
    clearSelection() {
        for (const unit of this.selectedUnits) {
            unit.deselect();
        }
        this.selectedUnits = [];
    }

    // Select a single unit (clears previous selection)
    selectUnit(unit) {
        this.clearSelection();
        if (unit) {
            this.selectedUnits.push(unit);
            unit.select();
            console.log(`👤 Selected ${unit.type} at (${Math.round(unit.x)}, ${Math.round(unit.y)})`);
        }
    }

    // Add a unit to the current selection (multi-select)
    addToSelection(unit) {
        if (unit && !this.selectedUnits.includes(unit)) {
            this.selectedUnits.push(unit);
            unit.select();
            console.log(`👥 Added ${unit.type} to selection (${this.selectedUnits.length} total)`);
        }
    }

    // Remove a unit from the selection
    removeFromSelection(unit) {
        const index = this.selectedUnits.indexOf(unit);
        if (index !== -1) {
            this.selectedUnits.splice(index, 1);
            unit.deselect();
        }
    }

    // Get all currently selected units
    getSelectedUnits() {
        return [...this.selectedUnits];
    }

    // Check if any units are selected
    hasSelection() {
        return this.selectedUnits.length > 0;
    }

    // Issue a move command to all selected units
    issueMoveCommand(targetX, targetY) {
        if (this.selectedUnits.length === 0) {
            console.log('⚠️ No units selected for move command');
            return;
        }

        // If multiple units, spread them out in formation
        if (this.selectedUnits.length === 1) {
            // Single unit - move directly to target
            this.selectedUnits[0].moveTo(targetX, targetY);
        } else {
            // Multiple units - arrange in formation
            this.moveUnitsInFormation(targetX, targetY);
        }

        console.log(`🎯 Move command issued to ${this.selectedUnits.length} unit(s) to (${Math.round(targetX)}, ${Math.round(targetY)})`);
    }

    // Move multiple units in a formation around the target point
    moveUnitsInFormation(centerX, centerY) {
        const units = this.selectedUnits;
        const unitCount = units.length;
        
        if (unitCount === 1) {
            units[0].moveTo(centerX, centerY);
            return;
        }

        // Arrange units in a grid formation
        const unitsPerRow = Math.ceil(Math.sqrt(unitCount));
        const spacing = 24; // Space between units
        
        let unitIndex = 0;
        for (let row = 0; row < Math.ceil(unitCount / unitsPerRow); row++) {
            for (let col = 0; col < unitsPerRow && unitIndex < unitCount; col++) {
                const unit = units[unitIndex];
                
                // Calculate position in formation
                const offsetX = (col - (unitsPerRow - 1) / 2) * spacing;
                const offsetY = (row - (Math.ceil(unitCount / unitsPerRow) - 1) / 2) * spacing;
                
                const targetX = centerX + offsetX;
                const targetY = centerY + offsetY;
                
                unit.moveTo(targetX, targetY);
                unitIndex++;
            }
        }
    }

    // Start drag selection
    startSelection(worldX, worldY) {
        this.isSelecting = true;
        this.selectionStart.x = worldX;
        this.selectionStart.y = worldY;
        this.selectionEnd.x = worldX;
        this.selectionEnd.y = worldY;
    }

    // Update drag selection
    updateSelection(worldX, worldY) {
        if (this.isSelecting) {
            this.selectionEnd.x = worldX;
            this.selectionEnd.y = worldY;
        }
    }

    // Complete drag selection
    endSelection(playerUnits, addToExisting = false) {
        if (!this.isSelecting) return;

        const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);

        // Only do rectangle selection if the area is significant
        const selectionWidth = maxX - minX;
        const selectionHeight = maxY - minY;
        
        if (selectionWidth > 10 || selectionHeight > 10) {
            // Clear previous selection if not adding
            if (!addToExisting) {
                this.clearSelection();
            }

            // Select all units within the rectangle
            let selectedCount = 0;
            for (const unit of playerUnits) {
                if (unit.x >= minX && unit.x <= maxX &&
                    unit.y >= minY && unit.y <= maxY) {
                    this.addToSelection(unit);
                    selectedCount++;
                }
            }

            if (selectedCount > 0) {
                console.log(`📦 Rectangle selection: ${selectedCount} units selected`);
            }
        }

        this.isSelecting = false;
    }

    // Get selection rectangle for rendering
    getSelectionRectangle() {
        if (!this.isSelecting) return null;

        return {
            x: Math.min(this.selectionStart.x, this.selectionEnd.x),
            y: Math.min(this.selectionStart.y, this.selectionEnd.y),
            width: Math.abs(this.selectionEnd.x - this.selectionStart.x),
            height: Math.abs(this.selectionEnd.y - this.selectionStart.y)
        };
    }

    // Update method for any continuous operations
    update(deltaTime) {
        // Remove any destroyed units from selection
        this.selectedUnits = this.selectedUnits.filter(unit => unit.state !== 'destroyed');
    }

    // Get info about current selection
    getSelectionInfo() {
        if (this.selectedUnits.length === 0) {
            return null;
        }

        if (this.selectedUnits.length === 1) {
            return {
                type: 'single',
                unit: this.selectedUnits[0],
                count: 1
            };
        }

        // Group by unit type
        const typeGroups = {};
        for (const unit of this.selectedUnits) {
            if (!typeGroups[unit.type]) {
                typeGroups[unit.type] = 0;
            }
            typeGroups[unit.type]++;
        }

        return {
            type: 'multiple',
            units: this.selectedUnits,
            count: this.selectedUnits.length,
            typeGroups: typeGroups
        };
    }
}
