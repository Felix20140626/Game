/**
 * GameState - Manages all game state data
 * Handles persistence, validation, and state transitions
 */

import { CONSTANTS } from '../data/constants.js';
import { GameEvents } from './eventManager.js';

/**
 * GameState Class
 * Central repository for all game state data
 */
class GameState {
    constructor(eventManager) {
        this.eventManager = eventManager;
        
        // Core resources
        this.dna = 0;
        this.energy = 0;
        this.biessence = 0;
        this.cosmicEnergy = 0;
        
        // Evolution state
        this.currentStageIndex = 0;
        this.evolutionProgress = 0;
        this.totalEvolutions = 0;
        this.stagesUnlocked = [0];
        
        // Click stats
        this.totalClicks = 0;
        this.clickDamage = 1;
        this.autoClickRate = 0;
        
        // Multipliers
        this.globalMultiplier = 1;
        this.clickMultiplier = 1;
        this.passiveMultiplier = 1;
        
        // Upgrades
        this.upgrades = {};
        this.upgradeLevels = {};
        
        // Achievements
        this.achievements = {};
        this.achievementProgress = {};
        
        // Quests
        this.activeQuests = [];
        this.completedQuests = [];
        this.failedQuests = [];
        
        // Mutations
        this.activeMutations = [];
        this.unlockedMutations = [];
        this.mutationPoints = 0;
        
        // Ecosystem
        this.discoveredSpecies = [];
        this.ecosystemBalance = 100;
        this.biodiversity = 0;
        
        // Statistics
        this.stats = {
            totalTimePlayed: 0,
            totalDnaCollected: 0,
            totalDnaSpent: 0,
            totalUpgradesPurchased: 0,
            totalAchievementsUnlocked: 0,
            highestDps: 0,
            highestClickDamage: 0,
            sessionsPlayed: 0,
            lastSaveTime: Date.now(),
            createdAt: Date.now()
        };
        
        // Settings
        this.settings = {
            soundEnabled: true,
            musicEnabled: true,
            notificationsEnabled: true,
            autoSaveEnabled: true,
            autoSaveInterval: 30000,
            theme: 'dark',
            language: 'en',
            showFloatingText: true,
            particlesEnabled: true
        };
        
        // Prestige/Rebirth data
        this.prestigeData = {
            prestigeCount: 0,
            prestigeCurrency: 0,
            prestigeMultipliers: {}
        };
        
        // Temporary buffs
        this.buffs = [];
        
        // Tutorial state
        this.tutorialComplete = false;
        this.tutorialStep = 0;
        
        // Milestones
        this.milestones = [];
        
        console.log('📦 GameState initialized');
    }
    
    /**
     * Get current stage name
     */
    get currentStageName() {
        const stage = CONSTANTS.EVOLUTION_STAGES[this.currentStageIndex];
        return stage ? stage.name : 'Unknown';
    }
    
    /**
     * Get current stage data
     */
    get currentStage() {
        return CONSTANTS.EVOLUTION_STAGES[this.currentStageIndex] || null;
    }
    
    /**
     * Check if a stage is unlocked
     */
    isStageUnlocked(index) {
        return this.stagesUnlocked.includes(index);
    }
    
    /**
     * Get upgrade level
     */
    getUpgradeLevel(upgradeId) {
        return this.upgradeLevels[upgradeId] || 0;
    }
    
    /**
     * Set upgrade level
     */
    setUpgradeLevel(upgradeId, level) {
        this.upgradeLevels[upgradeId] = level;
    }
    
    /**
     * Check if upgrade is unlocked
     */
    isUpgradeUnlocked(upgradeId) {
        return this.upgrades[upgradeId] === true;
    }
    
    /**
     * Unlock upgrade
     */
    unlockUpgrade(upgradeId) {
        this.upgrades[upgradeId] = true;
    }
    
    /**
     * Check if achievement is unlocked
     */
    isAchievementUnlocked(achievementId) {
        return this.achievements[achievementId] === true;
    }
    
    /**
     * Unlock achievement
     */
    unlockAchievement(achievementId) {
        if (!this.achievements[achievementId]) {
            this.achievements[achievementId] = true;
            this.stats.totalAchievementsUnlocked++;
            
            this.eventManager.emit(GameEvents.ACHIEVEMENT_UNLOCK, {
                achievementId,
                timestamp: Date.now()
            });
            
            return true;
        }
        return false;
    }
    
    /**
     * Update achievement progress
     */
    updateAchievementProgress(achievementId, progress) {
        if (!this.achievementProgress[achievementId]) {
            this.achievementProgress[achievementId] = 0;
        }
        
        const oldProgress = this.achievementProgress[achievementId];
        this.achievementProgress[achievementId] = Math.max(oldProgress, progress);
        
        if (progress > oldProgress) {
            this.eventManager.emit(GameEvents.ACHIEVEMENT_PROGRESS, {
                achievementId,
                progress,
                oldProgress
            });
        }
    }
    
    /**
     * Add DNA
     */
    addDNA(amount) {
        const actualAmount = amount * this.globalMultiplier;
        this.dna += actualAmount;
        this.stats.totalDnaCollected += actualAmount;
        
        this.eventManager.emit(GameEvents.RESOURCE_GAIN, {
            type: 'dna',
            amount: actualAmount,
            total: this.dna
        });
        
        return actualAmount;
    }
    
    /**
     * Spend DNA
     */
    spendDNA(amount) {
        if (this.dna >= amount) {
            this.dna -= amount;
            this.stats.totalDnaSpent += amount;
            
            this.eventManager.emit(GameEvents.RESOURCE_SPEND, {
                type: 'dna',
                amount,
                remaining: this.dna
            });
            
            return true;
        }
        return false;
    }
    
    /**
     * Add energy
     */
    addEnergy(amount) {
        const actualAmount = amount * this.globalMultiplier;
        this.energy += actualAmount;
        
        // Cap energy at max
        const maxEnergy = this.getMaxEnergy();
        if (this.energy > maxEnergy) {
            this.energy = maxEnergy;
        }
        
        return actualAmount;
    }
    
    /**
     * Get max energy capacity
     */
    getMaxEnergy() {
        let baseMax = CONSTANTS.BASE_MAX_ENERGY;
        
        // Add bonuses from upgrades
        const energyUpgrade = this.getUpgradeLevel('energy_capacity');
        if (energyUpgrade) {
            baseMax *= (1 + energyUpgrade * 0.1);
        }
        
        // Add bonuses from stages
        const stageBonus = this.currentStage?.energyBonus || 1;
        baseMax *= stageBonus;
        
        return Math.floor(baseMax);
    }
    
    /**
     * Increment click count
     */
    incrementClicks(amount = 1) {
        this.totalClicks += amount;
        
        this.eventManager.emit(GameEvents.CLICK, {
            count: this.totalClicks,
            increment: amount
        });
        
        // Check for multi-click achievements
        if (amount > 1) {
            this.eventManager.emit(GameEvents.MULTI_CLICK, {
                count: amount
            });
        }
    }
    
    /**
     * Calculate clicks per second
     */
    getClicksPerSecond() {
        return this.autoClickRate + (this.clickDamage * this.clickMultiplier);
    }
    
    /**
     * Calculate DNA per second
     */
    getDNAPerSecond() {
        let dps = 0;
        
        // Base passive generation from stage
        dps += this.currentStage?.baseDPS || 0;
        
        // Add upgrade bonuses
        for (const [upgradeId, level] of Object.entries(this.upgradeLevels)) {
            const upgrade = CONSTANTS.UPGRADES.find(u => u.id === upgradeId);
            if (upgrade && upgrade.type === 'passive') {
                dps += upgrade.baseValue * level * (upgrade.scaling || 1);
            }
        }
        
        // Apply multipliers
        dps *= this.passiveMultiplier * this.globalMultiplier;
        
        // Update highest DPS stat
        if (dps > this.stats.highestDps) {
            this.stats.highestDps = dps;
        }
        
        return dps;
    }
    
    /**
     * Calculate click damage
     */
    getClickDamage() {
        let damage = this.clickDamage;
        
        // Add upgrade bonuses
        for (const [upgradeId, level] of Object.entries(this.upgradeLevels)) {
            const upgrade = CONSTANTS.UPGRADES.find(u => u.id === upgradeId);
            if (upgrade && upgrade.type === 'click') {
                damage += upgrade.baseValue * level * (upgrade.scaling || 1);
            }
        }
        
        // Apply multipliers
        damage *= this.clickMultiplier * this.globalMultiplier;
        
        // Update highest click damage stat
        if (damage > this.stats.highestClickDamage) {
            this.stats.highestClickDamage = damage;
        }
        
        return damage;
    }
    
    /**
     * Add buff
     */
    addBuff(buff) {
        this.buffs.push({
            ...buff,
            startTime: Date.now(),
            endTime: Date.now() + buff.duration
        });
        
        // Sort by end time
        this.buffs.sort((a, b) => a.endTime - b.endTime);
    }
    
    /**
     * Remove expired buffs
     */
    removeExpiredBuffs() {
        const now = Date.now();
        const expired = this.buffs.filter(b => b.endTime <= now);
        this.buffs = this.buffs.filter(b => b.endTime > now);
        
        return expired;
    }
    
    /**
     * Get active buff multiplier
     */
    getBuffMultiplier(type) {
        const now = Date.now();
        let multiplier = 1;
        
        this.buffs.forEach(buff => {
            if (buff.endTime > now && buff.type === type) {
                multiplier *= buff.multiplier;
            }
        });
        
        return multiplier;
    }
    
    /**
     * Unlock milestone
     */
    unlockMilestone(milestoneId) {
        if (!this.milestones.includes(milestoneId)) {
            this.milestones.push(milestoneId);
            return true;
        }
        return false;
    }
    
    /**
     * Check if milestone is unlocked
     */
    isMilestoneUnlocked(milestoneId) {
        return this.milestones.includes(milestoneId);
    }
    
    /**
     * Update play time
     */
    updatePlayTime(deltaTime) {
        this.stats.totalTimePlayed += deltaTime;
    }
    
    /**
     * Get formatted play time
     */
    getFormattedPlayTime() {
        const totalSeconds = Math.floor(this.stats.totalTimePlayed / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    
    /**
     * Serialize game state for saving
     */
    toJSON() {
        return {
            dna: this.dna,
            energy: this.energy,
            biessence: this.biessence,
            cosmicEnergy: this.cosmicEnergy,
            currentStageIndex: this.currentStageIndex,
            evolutionProgress: this.evolutionProgress,
            totalEvolutions: this.totalEvolutions,
            stagesUnlocked: this.stagesUnlocked,
            totalClicks: this.totalClicks,
            clickDamage: this.clickDamage,
            autoClickRate: this.autoClickRate,
            globalMultiplier: this.globalMultiplier,
            clickMultiplier: this.clickMultiplier,
            passiveMultiplier: this.passiveMultiplier,
            upgrades: this.upgrades,
            upgradeLevels: this.upgradeLevels,
            achievements: this.achievements,
            achievementProgress: this.achievementProgress,
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            failedQuests: this.failedQuests,
            activeMutations: this.activeMutations,
            unlockedMutations: this.unlockedMutations,
            mutationPoints: this.mutationPoints,
            discoveredSpecies: this.discoveredSpecies,
            ecosystemBalance: this.ecosystemBalance,
            biodiversity: this.biodiversity,
            stats: this.stats,
            settings: this.settings,
            prestigeData: this.prestigeData,
            buffs: this.buffs,
            tutorialComplete: this.tutorialComplete,
            tutorialStep: this.tutorialStep,
            milestones: this.milestones,
            version: CONSTANTS.GAME_VERSION
        };
    }
    
    /**
     * Load game state from save data
     */
    fromJSON(data) {
        if (!data) return;
        
        // Basic resources
        this.dna = data.dna || 0;
        this.energy = data.energy || 0;
        this.biessence = data.biessence || 0;
        this.cosmicEnergy = data.cosmicEnergy || 0;
        
        // Evolution state
        this.currentStageIndex = data.currentStageIndex || 0;
        this.evolutionProgress = data.evolutionProgress || 0;
        this.totalEvolutions = data.totalEvolutions || 0;
        this.stagesUnlocked = data.stagesUnlocked || [0];
        
        // Click stats
        this.totalClicks = data.totalClicks || 0;
        this.clickDamage = data.clickDamage || 1;
        this.autoClickRate = data.autoClickRate || 0;
        
        // Multipliers
        this.globalMultiplier = data.globalMultiplier || 1;
        this.clickMultiplier = data.clickMultiplier || 1;
        this.passiveMultiplier = data.passiveMultiplier || 1;
        
        // Upgrades
        this.upgrades = data.upgrades || {};
        this.upgradeLevels = data.upgradeLevels || {};
        
        // Achievements
        this.achievements = data.achievements || {};
        this.achievementProgress = data.achievementProgress || {};
        
        // Quests
        this.activeQuests = data.activeQuests || [];
        this.completedQuests = data.completedQuests || [];
        this.failedQuests = data.failedQuests || [];
        
        // Mutations
        this.activeMutations = data.activeMutations || [];
        this.unlockedMutations = data.unlockedMutations || [];
        this.mutationPoints = data.mutationPoints || 0;
        
        // Ecosystem
        this.discoveredSpecies = data.discoveredSpecies || [];
        this.ecosystemBalance = data.ecosystemBalance || 100;
        this.biodiversity = data.biodiversity || 0;
        
        // Statistics
        if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
        }
        
        // Settings
        if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
        }
        
        // Prestige data
        if (data.prestigeData) {
            this.prestigeData = { ...this.prestigeData, ...data.prestigeData };
        }
        
        // Buffs
        this.buffs = data.buffs || [];
        
        // Tutorial
        this.tutorialComplete = data.tutorialComplete || false;
        this.tutorialStep = data.tutorialStep || 0;
        
        // Milestones
        this.milestones = data.milestones || [];
        
        // Remove expired buffs on load
        this.removeExpiredBuffs();
        
        console.log('📥 GameState loaded from save');
    }
    
    /**
     * Reset game state to initial values
     */
    reset() {
        const preservedSettings = { ...this.settings };
        const preservedPrestige = { ...this.prestigeData };
        
        // Create new instance with default values
        Object.assign(this, new GameState(this.eventManager));
        
        // Restore preserved data
        this.settings = preservedSettings;
        this.prestigeData = preservedPrestige;
        
        this.eventManager.emit(GameEvents.GAME_RESET, {
            timestamp: Date.now()
        });
        
        console.log('🔄 GameState reset');
    }
    
    /**
     * Validate game state
     */
    validate() {
        const errors = [];
        
        // Check resource values
        if (this.dna < 0) errors.push('Negative DNA');
        if (this.energy < 0) errors.push('Negative energy');
        
        // Check stage index
        if (this.currentStageIndex < 0 || this.currentStageIndex >= CONSTANTS.EVOLUTION_STAGES.length) {
            errors.push('Invalid stage index');
        }
        
        // Check for NaN values
        if (isNaN(this.dna)) errors.push('DNA is NaN');
        if (isNaN(this.energy)) errors.push('Energy is NaN');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export { GameState };
