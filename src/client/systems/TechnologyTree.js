export class TechnologyTree {
    constructor(factionManager) {
        this.factionManager = factionManager;
        this.playerTechnologies = new Map(); // playerId -> Set of researched tech
        this.researchQueue = new Map(); // playerId -> array of research in progress
        this.researchProgress = new Map(); // playerId -> Map of tech -> progress
        
        console.log('🔬 Technology Tree system initialized');
    }
    
    // Initialize tech tree for a player
    initializePlayer(playerId, factionId) {
        this.playerTechnologies.set(playerId, new Set());
        this.researchQueue.set(playerId, []);
        this.researchProgress.set(playerId, new Map());
        
        console.log(`🔬 Technology tree initialized for player ${playerId} (${factionId})`);
    }
    
    // Start researching a technology
    startResearch(playerId, techId, factionId) {
        const faction = this.factionManager.getFaction(factionId);
        if (!faction || !faction.technologies[techId]) {
            console.warn(`❌ Technology ${techId} not available for faction ${factionId}`);
            return false;
        }
        
        // Check prerequisites
        if (!this.hasPrerequisites(playerId, techId, faction)) {
            console.warn(`❌ Prerequisites not met for ${techId}`);
            return false;
        }
        
        // Check if already researched
        if (this.hasTechnology(playerId, techId)) {
            console.warn(`❌ Technology ${techId} already researched`);
            return false;
        }
        
        // Check if already in queue
        const queue = this.researchQueue.get(playerId) || [];
        if (queue.some(research => research.techId === techId)) {
            console.warn(`❌ Technology ${techId} already in research queue`);
            return false;
        }
        
        const tech = faction.technologies[techId];
        const researchTime = this.calculateResearchTime(tech, factionId);
        
        // Add to queue
        const research = {
            techId,
            factionId,
            tech,
            startTime: Date.now(),
            researchTime,
            progress: 0
        };
        
        queue.push(research);
        this.researchQueue.set(playerId, queue);
        
        console.log(`🔬 Started researching ${tech.name} (${researchTime}ms)`);
        return true;
    }
    
    // Update research progress
    update(deltaTime) {
        for (const [playerId, queue] of this.researchQueue.entries()) {
            if (queue.length === 0) continue;
            
            // Process first item in queue
            const research = queue[0];
            research.progress += deltaTime;
            
            // Update progress tracking
            const progressMap = this.researchProgress.get(playerId) || new Map();
            progressMap.set(research.techId, research.progress / research.researchTime);
            this.researchProgress.set(playerId, progressMap);
            
            // Check if research is complete
            if (research.progress >= research.researchTime) {
                this.completeResearch(playerId, research);
                queue.shift(); // Remove from queue
            }
        }
    }
    
    // Complete a research
    completeResearch(playerId, research) {
        const technologies = this.playerTechnologies.get(playerId) || new Set();
        technologies.add(research.techId);
        this.playerTechnologies.set(playerId, technologies);
        
        // Remove from progress tracking
        const progressMap = this.researchProgress.get(playerId) || new Map();
        progressMap.delete(research.techId);
        
        console.log(`✅ Research complete: ${research.tech.name}`);
        
        // Apply technology effects
        this.applyTechnologyEffects(playerId, research);
        
        // Trigger research complete event
        this.onResearchComplete(playerId, research);
    }
    
    // Apply technology effects
    applyTechnologyEffects(playerId, research) {
        const effects = research.tech.effects || {};
        
        for (const [effectType, value] of Object.entries(effects)) {
            console.log(`🔬 Applying ${effectType}: ${value} to player ${playerId}`);
            
            switch (effectType) {
                case 'shieldStrength':
                    this.applyShieldUpgrade(playerId, value);
                    break;
                case 'energyDamage':
                    this.applyDamageUpgrade(playerId, 'energy', value);
                    break;
                case 'damageVsBuildings':
                    this.applySiegeUpgrade(playerId, value);
                    break;
                case 'productionSpeed':
                    this.applyProductionUpgrade(playerId, value);
                    break;
                case 'stealthDuration':
                    this.applyStealthUpgrade(playerId, value);
                    break;
                case 'penetration':
                    this.applyPenetrationUpgrade(playerId, value);
                    break;
                default:
                    console.warn(`Unknown effect type: ${effectType}`);
            }
        }
    }
    
    // Technology effect implementations
    applyShieldUpgrade(playerId, multiplier) {
        // Would enhance shield generators and shield-capable units
        console.log(`🛡️ Shield technology upgraded for player ${playerId}`);
    }
    
    applyDamageUpgrade(playerId, damageType, multiplier) {
        // Would enhance weapons of specified damage type
        console.log(`⚔️ ${damageType} damage upgraded by ${multiplier}x for player ${playerId}`);
    }
    
    applySiegeUpgrade(playerId, multiplier) {
        // Would enhance damage against buildings
        console.log(`🏗️ Siege capability upgraded by ${multiplier}x for player ${playerId}`);
    }
    
    applyProductionUpgrade(playerId, multiplier) {
        // Would speed up unit/building production
        console.log(`⚙️ Production speed upgraded by ${multiplier}x for player ${playerId}`);
    }
    
    applyStealthUpgrade(playerId, multiplier) {
        // Would enhance stealth systems
        console.log(`👻 Stealth technology upgraded by ${multiplier}x for player ${playerId}`);
    }
    
    applyPenetrationUpgrade(playerId, multiplier) {
        // Would improve armor penetration
        console.log(`🎯 Armor penetration upgraded by ${multiplier}x for player ${playerId}`);
    }
    
    // Check prerequisites
    hasPrerequisites(playerId, techId, faction) {
        const tech = faction.technologies[techId];
        if (!tech.prerequisites || tech.prerequisites.length === 0) {
            return true;
        }
        
        const playerTech = this.playerTechnologies.get(playerId) || new Set();
        
        return tech.prerequisites.every(prereq => {
            // Check if prerequisite is a technology
            if (faction.technologies[prereq]) {
                return playerTech.has(prereq);
            }
            
            // Check if prerequisite is a building (would need building manager integration)
            return this.hasBuilding(playerId, prereq);
        });
    }
    
    // Check if player has a specific building (placeholder)
    hasBuilding(playerId, buildingType) {
        // Would integrate with building manager
        return true; // Simplified for now
    }
    
    // Calculate research time based on faction bonuses
    calculateResearchTime(tech, factionId) {
        const baseTime = tech.cost.spice * 100; // Base time proportional to cost
        const faction = this.factionManager.getFaction(factionId);
        
        // Apply faction bonuses
        let multiplier = 1.0;
        if (faction.bonuses.techCostReduction) {
            multiplier *= faction.bonuses.techCostReduction;
        }
        
        return Math.floor(baseTime * multiplier);
    }
    
    // Query methods
    hasTechnology(playerId, techId) {
        const technologies = this.playerTechnologies.get(playerId) || new Set();
        return technologies.has(techId);
    }
    
    getResearchedTechnologies(playerId) {
        return Array.from(this.playerTechnologies.get(playerId) || new Set());
    }
    
    getAvailableTechnologies(playerId, factionId) {
        const faction = this.factionManager.getFaction(factionId);
        if (!faction) return [];
        
        const available = [];
        
        for (const [techId, tech] of Object.entries(faction.technologies)) {
            if (!this.hasTechnology(playerId, techId) && 
                this.hasPrerequisites(playerId, techId, faction)) {
                available.push({
                    id: techId,
                    ...tech
                });
            }
        }
        
        return available;
    }
    
    getResearchQueue(playerId) {
        return this.researchQueue.get(playerId) || [];
    }
    
    getResearchProgress(playerId, techId) {
        const progressMap = this.researchProgress.get(playerId) || new Map();
        return progressMap.get(techId) || 0;
    }
    
    getCurrentResearch(playerId) {
        const queue = this.researchQueue.get(playerId) || [];
        return queue.length > 0 ? queue[0] : null;
    }
    
    // Cancel research
    cancelResearch(playerId, techId) {
        const queue = this.researchQueue.get(playerId) || [];
        const index = queue.findIndex(research => research.techId === techId);
        
        if (index !== -1) {
            const cancelled = queue.splice(index, 1)[0];
            console.log(`❌ Cancelled research: ${cancelled.tech.name}`);
            
            // Remove from progress tracking
            const progressMap = this.researchProgress.get(playerId) || new Map();
            progressMap.delete(techId);
            
            return true;
        }
        
        return false;
    }
    
    // Get technology tree visualization data
    getTechnologyTreeData(factionId) {
        const faction = this.factionManager.getFaction(factionId);
        if (!faction) return null;
        
        const tree = {
            faction: faction.name,
            technologies: []
        };
        
        for (const [techId, tech] of Object.entries(faction.technologies)) {
            tree.technologies.push({
                id: techId,
                name: tech.name,
                description: tech.description,
                cost: tech.cost,
                effects: tech.effects,
                prerequisites: tech.prerequisites || [],
                category: this.getTechnologyCategory(techId, tech)
            });
        }
        
        return tree;
    }
    
    getTechnologyCategory(techId, tech) {
        // Categorize technologies for UI organization
        if (techId.includes('Shield') || techId.includes('Defense')) {
            return 'defense';
        } else if (techId.includes('Weapon') || techId.includes('Damage')) {
            return 'weapons';
        } else if (techId.includes('Production') || techId.includes('Economy')) {
            return 'economy';
        } else if (techId.includes('Stealth') || techId.includes('Advanced')) {
            return 'special';
        }
        return 'general';
    }
    
    // Event callback for research completion
    onResearchComplete(playerId, research) {
        // Override this method to handle research completion events
        // Could trigger UI updates, unlock new buildings/units, etc.
    }
    
    // Get technology effectiveness bonus
    getTechnologyBonus(playerId, bonusType) {
        const technologies = this.playerTechnologies.get(playerId) || new Set();
        let totalBonus = 1.0;
        
        // Check each researched technology for relevant bonuses
        for (const techId of technologies) {
            // This would need to map technology effects to bonus types
            // Simplified implementation
            if (techId.includes('Damage') && bonusType === 'damage') {
                totalBonus *= 1.2;
            } else if (techId.includes('Shield') && bonusType === 'defense') {
                totalBonus *= 1.3;
            } else if (techId.includes('Production') && bonusType === 'production') {
                totalBonus *= 1.25;
            }
        }
        
        return totalBonus;
    }
    
    // Reset player technologies (for testing/debugging)
    resetPlayerTechnologies(playerId) {
        this.playerTechnologies.set(playerId, new Set());
        this.researchQueue.set(playerId, []);
        this.researchProgress.set(playerId, new Map());
        
        console.log(`🔄 Reset technologies for player ${playerId}`);
    }
} 