import { Enemy } from '../entities/Enemy.js';

export class EnemyManager {
    constructor(gameWidth = 6400, gameHeight = 4800) {
        this.enemies = [];
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // Spawning system
        this.spawnTimer = 0;
        this.spawnInterval = 15; // seconds between spawns
        this.spawnCount = 1; // enemies per spawn
        this.maxEnemies = 5; // maximum enemies at once
        
        // Wave system
        this.currentWave = 1;
        this.waveTimer = 0;
        this.waveInterval = 60; // seconds between waves
        this.enemiesSpawnedThisWave = 0;
        this.enemiesPerWave = 3;
        
        // Difficulty scaling
        this.difficultyScaling = 1.0;
        this.waveMultiplier = 1.1; // increase per wave
        
        // Spawn locations (edges of map)
        this.spawnZones = this.generateSpawnZones();
        
        // Enemy type probabilities
        this.enemyTypeWeights = {
            'Raider': 0.6,
            'Scout': 0.3,
            'Heavy': 0.1
        };
        
        console.log('👹 Enemy management system initialized');
    }
    
    update(deltaTime, gameState) {
        // Update spawn timers
        this.spawnTimer += deltaTime;
        this.waveTimer += deltaTime;
        
        // Update all enemies
        this.updateEnemies(deltaTime, gameState);
        
        // Handle spawning
        this.handleSpawning(deltaTime, gameState);
        
        // Handle wave progression
        this.handleWaves(deltaTime);
        
        // Remove destroyed enemies
        this.cleanupEnemies();
    }
    
    updateEnemies(deltaTime, gameState) {
        if (!gameState) {
            console.error('EnemyManager: gameState is undefined');
            return;
        }
        
        const combatGameState = {
            ...gameState,
            enemies: this.enemies
        };
        
        for (const enemy of this.enemies) {
            if (enemy && enemy.update) {
                try {
                    enemy.update(deltaTime, combatGameState);
                } catch (error) {
                    console.error('Error updating enemy:', error);
                    enemy.state = 'destroyed'; // Mark for cleanup
                }
            }
        }
    }
    
    handleSpawning(deltaTime, gameState) {
        // Check if we should spawn enemies
        if (this.shouldSpawn()) {
            this.spawnEnemyWave(gameState);
            this.spawnTimer = 0;
        }
    }
    
    shouldSpawn() {
        return (
            this.spawnTimer >= this.spawnInterval &&
            this.enemies.length < this.maxEnemies &&
            this.enemiesSpawnedThisWave < this.enemiesPerWave
        );
    }
    
    spawnEnemyWave(gameState) {
        const enemyType = this.selectEnemyType();
        const spawnLocation = this.selectSpawnLocation(gameState);
        
        for (let i = 0; i < this.spawnCount; i++) {
            const offset = this.getSpawnOffset(i);
            const enemy = new Enemy(
                spawnLocation.x + offset.x,
                spawnLocation.y + offset.y,
                enemyType
            );
            
            // Scale enemy stats based on difficulty
            this.scaleDifficulty(enemy);
            
            this.enemies.push(enemy);
            this.enemiesSpawnedThisWave++;
            
            console.log(`👹 Wave ${this.currentWave}: Spawned ${enemyType} (${this.enemiesSpawnedThisWave}/${this.enemiesPerWave})`);
        }
    }
    
    selectEnemyType() {
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const [type, weight] of Object.entries(this.enemyTypeWeights)) {
            cumulativeProbability += weight;
            if (random <= cumulativeProbability) {
                return type;
            }
        }
        
        return 'Raider'; // fallback
    }
    
    selectSpawnLocation(gameState) {
        // Find player's main base location
        let baseX = 0, baseY = 0;
        if (gameState.buildings) {
            const constructionYards = gameState.buildings.filter(b => b.type === 'ConstructionYard');
            if (constructionYards.length > 0) {
                baseX = constructionYards[0].x;
                baseY = constructionYards[0].y;
            }
        }
        
        // Select spawn zone furthest from base
        let bestZone = this.spawnZones[0];
        let maxDistance = 0;
        
        for (const zone of this.spawnZones) {
            const distance = Math.sqrt(
                Math.pow(zone.x - baseX, 2) + Math.pow(zone.y - baseY, 2)
            );
            
            if (distance > maxDistance) {
                maxDistance = distance;
                bestZone = zone;
            }
        }
        
        // Add some randomness within the zone
        return {
            x: bestZone.x + (Math.random() - 0.5) * 200,
            y: bestZone.y + (Math.random() - 0.5) * 200
        };
    }
    
    getSpawnOffset(index) {
        // Spread multiple enemies in formation
        const angle = (index / this.spawnCount) * Math.PI * 2;
        const radius = 30;
        
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    }
    
    scaleDifficulty(enemy) {
        // Scale enemy stats based on current difficulty
        const scaling = this.difficultyScaling;
        
        enemy.maxHealth = Math.round(enemy.maxHealth * scaling);
        enemy.currentHealth = enemy.maxHealth;
        enemy.damage = Math.round(enemy.damage * scaling);
        
        // Slightly increase speed and vision range
        enemy.speed *= (1 + (scaling - 1) * 0.3);
        enemy.visionRange *= (1 + (scaling - 1) * 0.2);
    }
    
    handleWaves(deltaTime) {
        // Check if wave should advance
        if (this.waveTimer >= this.waveInterval || this.allEnemiesDefeated()) {
            this.advanceWave();
        }
    }
    
    allEnemiesDefeated() {
        const aliveEnemies = this.enemies.filter(e => e.state !== 'dead' && e.state !== 'destroyed');
        return aliveEnemies.length === 0 && this.enemiesSpawnedThisWave >= this.enemiesPerWave;
    }
    
    advanceWave() {
        this.currentWave++;
        this.waveTimer = 0;
        this.enemiesSpawnedThisWave = 0;
        
        // Increase difficulty
        this.difficultyScaling *= this.waveMultiplier;
        
        // Increase enemies per wave
        this.enemiesPerWave = Math.min(8, Math.floor(this.enemiesPerWave * 1.2));
        
        // Decrease spawn interval (faster spawning)
        this.spawnInterval = Math.max(8, this.spawnInterval * 0.9);
        
        // Increase max enemies on field
        this.maxEnemies = Math.min(12, this.maxEnemies + 1);
        
        // Update enemy type probabilities (more heavy units later)
        if (this.currentWave >= 3) {
            this.enemyTypeWeights.Heavy = Math.min(0.3, this.enemyTypeWeights.Heavy + 0.05);
            this.enemyTypeWeights.Raider = Math.max(0.4, this.enemyTypeWeights.Raider - 0.03);
        }
        
        console.log(`🌊 Wave ${this.currentWave} begins! Difficulty: ${this.difficultyScaling.toFixed(2)}x`);
        console.log(`📊 Enemies per wave: ${this.enemiesPerWave}, Max on field: ${this.maxEnemies}`);
    }
    
    cleanupEnemies() {
        // Remove destroyed enemies
        const aliveCount = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => enemy.state !== 'destroyed');
        
        const destroyedCount = aliveCount - this.enemies.length;
        if (destroyedCount > 0) {
            console.log(`🧹 Cleaned up ${destroyedCount} destroyed enemies`);
        }
    }
    
    generateSpawnZones() {
        const zones = [];
        const margin = 200;
        
        // Top edge
        zones.push({ x: this.gameWidth / 2, y: margin });
        
        // Bottom edge
        zones.push({ x: this.gameWidth / 2, y: this.gameHeight - margin });
        
        // Left edge
        zones.push({ x: margin, y: this.gameHeight / 2 });
        
        // Right edge
        zones.push({ x: this.gameWidth - margin, y: this.gameHeight / 2 });
        
        // Corners
        zones.push({ x: margin, y: margin });
        zones.push({ x: this.gameWidth - margin, y: margin });
        zones.push({ x: margin, y: this.gameHeight - margin });
        zones.push({ x: this.gameWidth - margin, y: this.gameHeight - margin });
        
        return zones;
    }
    
    // Manual enemy spawning for testing
    spawnEnemyAt(x, y, type = 'Raider') {
        const enemy = new Enemy(x, y, type);
        this.scaleDifficulty(enemy);
        this.enemies.push(enemy);
        
        console.log(`🧪 Manually spawned ${type} at (${Math.round(x)}, ${Math.round(y)})`);
        return enemy;
    }
    
    // Force spawn next wave (for testing)
    forceNextWave() {
        this.advanceWave();
        console.log('🧪 Forced next wave');
    }
    
    // Get enemy statistics
    getEnemyStats() {
        const stats = {
            total: this.enemies.length,
            alive: 0,
            dead: 0,
            byType: {},
            byState: {},
            currentWave: this.currentWave,
            enemiesThisWave: this.enemiesSpawnedThisWave,
            enemiesPerWave: this.enemiesPerWave,
            difficulty: this.difficultyScaling,
            nextSpawnIn: Math.max(0, this.spawnInterval - this.spawnTimer),
            nextWaveIn: Math.max(0, this.waveInterval - this.waveTimer)
        };
        
        for (const enemy of this.enemies) {
            // Count by type
            if (!stats.byType[enemy.type]) {
                stats.byType[enemy.type] = 0;
            }
            stats.byType[enemy.type]++;
            
            // Count by state
            if (!stats.byState[enemy.state]) {
                stats.byState[enemy.state] = 0;
            }
            stats.byState[enemy.state]++;
            
            // Count alive/dead
            if (enemy.state === 'dead' || enemy.state === 'destroyed') {
                stats.dead++;
            } else {
                stats.alive++;
            }
        }
        
        return stats;
    }
    
    // Check if any enemy is near a position (for threat detection)
    isEnemyNear(x, y, radius = 100) {
        for (const enemy of this.enemies) {
            if (enemy.state === 'dead' || enemy.state === 'destroyed') continue;
            
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                return true;
            }
        }
        return false;
    }
    
    // Get nearest enemy to a position
    getNearestEnemyTo(x, y, maxRange = Infinity) {
        let nearest = null;
        let nearestDistance = maxRange;
        
        for (const enemy of this.enemies) {
            if (enemy.state === 'dead' || enemy.state === 'destroyed') continue;
            
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = enemy;
            }
        }
        
        return nearest;
    }
} 