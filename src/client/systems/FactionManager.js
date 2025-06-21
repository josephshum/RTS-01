export class FactionManager {
    constructor() {
        this.factions = new Map();
        this.initializeFactions();
        
        console.log('🏛️ Faction system initialized with 3 houses');
    }
    
    initializeFactions() {
        // House Atreides - Balanced faction with strong defense
        this.factions.set('atreides', {
            name: 'House Atreides',
            description: 'Noble house known for honor, strong defenses, and balanced military',
            color: '#0066CC', // Blue
            philosophy: 'defensive',
            
            // Faction bonuses
            bonuses: {
                buildingHealth: 1.2,        // +20% building health
                defenseBonus: 1.3,          // +30% defensive structure effectiveness
                resourceEfficiency: 1.1,    // +10% resource processing
                unitMorale: 1.15            // +15% unit effectiveness when near buildings
            },
            
            // Unique buildings
            uniqueBuildings: {
                'ShieldGenerator': {
                    name: 'Shield Generator',
                    description: 'Provides energy shields to nearby units and buildings',
                    cost: { spice: 120 },
                    gridSize: { width: 2, height: 2 },
                    health: 180,
                    range: 6,
                    provides: ['shields', 'defense']
                },
                'Barracks': {
                    name: 'Atreides Barracks',
                    description: 'Trains elite infantry units',
                    cost: { spice: 100 },
                    gridSize: { width: 2, height: 2 },
                    health: 160,
                    trainSpeed: 1.2,
                    provides: ['infantry']
                }
            },
            
            // Unique units
            uniqueUnits: {
                'AtreidesInfantry': {
                    name: 'Atreides Soldier',
                    description: 'Elite infantry with advanced training',
                    cost: { spice: 30 },
                    health: 80,
                    damage: 20,
                    speed: 60,
                    range: 3,
                    armorType: 'light',
                    damageType: 'kinetic',
                    abilities: ['entrench', 'rally']
                },
                'SonicTank': {
                    name: 'Sonic Tank',
                    description: 'Advanced tank with sonic weaponry',
                    cost: { spice: 200 },
                    health: 300,
                    damage: 80,
                    speed: 40,
                    range: 6,
                    armorType: 'heavy',
                    damageType: 'energy',
                    abilities: ['sonic_blast']
                }
            },
            
            // Technologies
            technologies: {
                'AdvancedShields': {
                    name: 'Advanced Shield Technology',
                    cost: { spice: 150 },
                    effects: { shieldStrength: 2.0 },
                    prerequisites: ['ShieldGenerator']
                },
                'SonicWeapons': {
                    name: 'Sonic Weaponry',
                    cost: { spice: 200 },
                    effects: { energyDamage: 1.5 },
                    prerequisites: ['Barracks']
                }
            },
            
            // AI personality
            aiPersonality: {
                aggression: 0.4,
                expansionRate: 0.6,
                defensePreference: 0.8,
                economyFocus: 0.7,
                techFocus: 0.6,
                unitComposition: {
                    infantry: 0.4,
                    vehicles: 0.4,
                    defenses: 0.2
                }
            }
        });
        
        // House Harkonnen - Aggressive faction with heavy units
        this.factions.set('harkonnen', {
            name: 'House Harkonnen',
            description: 'Brutal house focused on overwhelming firepower and aggression',
            color: '#CC0000', // Red
            philosophy: 'aggressive',
            
            // Faction bonuses
            bonuses: {
                damageBonus: 1.3,           // +30% damage output
                productionSpeed: 1.2,       // +20% unit production speed
                heavyUnitDiscount: 0.8,     // -20% cost for heavy units
                intimidation: 1.25          // +25% damage vs light armor
            },
            
            // Unique buildings
            uniqueBuildings: {
                'HeavyFactory': {
                    name: 'Heavy Factory',
                    description: 'Produces massive siege units and heavy vehicles',
                    cost: { spice: 180 },
                    gridSize: { width: 3, height: 2 },
                    health: 220,
                    productionBonus: 1.5,
                    provides: ['heavy_units']
                },
                'SlaveBarracks': {
                    name: 'Slave Barracks',
                    description: 'Mass produces expendable infantry',
                    cost: { spice: 80 },
                    gridSize: { width: 2, height: 2 },
                    health: 120,
                    massProduction: true,
                    provides: ['mass_infantry']
                }
            },
            
            // Unique units
            uniqueUnits: {
                'HarkonnenTrooper': {
                    name: 'Harkonnen Trooper',
                    description: 'Brutal infantry with enhanced aggression',
                    cost: { spice: 25 },
                    health: 60,
                    damage: 25,
                    speed: 70,
                    range: 2,
                    armorType: 'light',
                    damageType: 'explosive',
                    abilities: ['berserk', 'suppression']
                },
                'Devastator': {
                    name: 'Devastator Tank',
                    description: 'Massive siege tank with dual cannons',
                    cost: { spice: 280 },
                    health: 450,
                    damage: 120,
                    speed: 25,
                    range: 8,
                    armorType: 'heavy',
                    damageType: 'anti_armor',
                    abilities: ['siege_mode', 'dual_cannons']
                }
            },
            
            // Technologies
            technologies: {
                'BrutalWarfare': {
                    name: 'Brutal Warfare Doctrine',
                    cost: { spice: 120 },
                    effects: { damageVsBuildings: 1.8 },
                    prerequisites: ['HeavyFactory']
                },
                'MassProduction': {
                    name: 'Mass Production',
                    cost: { spice: 100 },
                    effects: { productionSpeed: 1.5 },
                    prerequisites: ['SlaveBarracks']
                }
            },
            
            // AI personality
            aiPersonality: {
                aggression: 0.9,
                expansionRate: 0.8,
                defensePreference: 0.3,
                economyFocus: 0.5,
                techFocus: 0.4,
                unitComposition: {
                    infantry: 0.3,
                    vehicles: 0.6,
                    defenses: 0.1
                }
            }
        });
        
        // House Ordos - Technology-focused faction with stealth units
        this.factions.set('ordos', {
            name: 'House Ordos',
            description: 'Mysterious house specializing in advanced technology and stealth',
            color: '#00CC66', // Green
            philosophy: 'technological',
            
            // Faction bonuses
            bonuses: {
                techCostReduction: 0.7,     // -30% technology costs
                stealthDetection: 2.0,      // +100% stealth detection range
                energyWeapons: 1.4,         // +40% energy damage
                advancedTargeting: 1.2      // +20% accuracy and range
            },
            
            // Unique buildings
            uniqueBuildings: {
                'ResearchLab': {
                    name: 'Advanced Research Lab',
                    description: 'Unlocks cutting-edge technologies',
                    cost: { spice: 150 },
                    gridSize: { width: 2, height: 2 },
                    health: 140,
                    researchSpeed: 1.8,
                    provides: ['advanced_tech']
                },
                'StealthGenerator': {
                    name: 'Stealth Generator',
                    description: 'Cloaks nearby units and buildings',
                    cost: { spice: 200 },
                    gridSize: { width: 1, height: 1 },
                    health: 100,
                    stealthRadius: 8,
                    provides: ['stealth']
                }
            },
            
            // Unique units
            uniqueUnits: {
                'OrdosRaider': {
                    name: 'Stealth Raider',
                    description: 'Fast attack unit with cloaking capability',
                    cost: { spice: 60 },
                    health: 90,
                    damage: 35,
                    speed: 90,
                    range: 4,
                    armorType: 'light',
                    damageType: 'energy',
                    abilities: ['stealth', 'hit_and_run']
                },
                'Deviator': {
                    name: 'Deviator Tank',
                    description: 'Advanced tank that can temporarily control enemy units',
                    cost: { spice: 250 },
                    health: 280,
                    damage: 60,
                    speed: 45,
                    range: 7,
                    armorType: 'medium',
                    damageType: 'energy',
                    abilities: ['mind_control', 'disruption_field']
                }
            },
            
            // Technologies
            technologies: {
                'AdvancedStealth': {
                    name: 'Advanced Stealth Technology',
                    cost: { spice: 180 },
                    effects: { stealthDuration: 2.0, stealthRadius: 1.5 },
                    prerequisites: ['StealthGenerator']
                },
                'EnergyWeaponry': {
                    name: 'Advanced Energy Weapons',
                    cost: { spice: 220 },
                    effects: { energyDamage: 1.8, penetration: 1.4 },
                    prerequisites: ['ResearchLab']
                }
            },
            
            // AI personality
            aiPersonality: {
                aggression: 0.6,
                expansionRate: 0.5,
                defensePreference: 0.5,
                economyFocus: 0.8,
                techFocus: 0.9,
                unitComposition: {
                    infantry: 0.2,
                    vehicles: 0.5,
                    defenses: 0.3
                }
            }
        });
    }
    
    // Get faction data
    getFaction(factionId) {
        return this.factions.get(factionId);
    }
    
    // Get all available factions
    getAllFactions() {
        return Array.from(this.factions.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }
    
    // Get faction bonuses applied to a value
    applyFactionBonus(factionId, bonusType, baseValue) {
        const faction = this.getFaction(factionId);
        if (!faction || !faction.bonuses[bonusType]) {
            return baseValue;
        }
        
        return baseValue * faction.bonuses[bonusType];
    }
    
    // Check if faction has access to a building/unit/tech
    hasAccess(factionId, itemType, itemId) {
        const faction = this.getFaction(factionId);
        if (!faction) return false;
        
        switch (itemType) {
            case 'building':
                return faction.uniqueBuildings.hasOwnProperty(itemId);
            case 'unit':
                return faction.uniqueUnits.hasOwnProperty(itemId);
            case 'technology':
                return faction.technologies.hasOwnProperty(itemId);
            default:
                return false;
        }
    }
    
    // Get faction-specific color for UI elements
    getFactionColor(factionId) {
        const faction = this.getFaction(factionId);
        return faction ? faction.color : '#FFFFFF';
    }
    
    // Get AI personality settings for a faction
    getAIPersonality(factionId) {
        const faction = this.getFaction(factionId);
        return faction ? faction.aiPersonality : null;
    }
} 