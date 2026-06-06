/**
 * Resource System - Manages all game resources
 * Handles resource generation, consumption, and balancing
 */

import { CONSTANTS } from '../data/constants.js';
import { GameEvents } from '../core/eventManager.js';

class ResourceSystem {
    constructor(gameState, eventManager) {
        this.gameState = gameState;
        this.eventManager = eventManager;
        
        this.resourceGenerators = new Map();
        this.resourceMultipliers = new Map();
        this.resourceCaps = new Map();
        
        this.clickCombo = 0;
        this.lastClickTime = 0;
        this.comboTimeout = null;
        
        this.passiveResources = {
            dna: 0,
            energy: 0,
            biessence: 0,
            cosmicEnergy: 0
        };
        
        console.log('💰 ResourceSystem initialized');
    }
    
    /**
     * Click to collect energy
     */
    clickCollect() {
        const now = Date.now();
        
        // Handle combo system
        if (now - this.lastClickTime < CONSTANTS.CLICK_COMBO_WINDOW) {
            this.clickCombo++;
        } else {
            this.clickCombo = 1;
        }
        
        this.lastClickTime = now;
        
        // Clear existing timeout
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        
        // Set new timeout
        this.comboTimeout = setTimeout(() => {
            this.clickCombo = 0;
        }, CONSTANTS.CLICK_COMBO_WINDOW);
        
        // Calculate base click value
        let clickValue = this.gameState.getClickDamage();
        
        // Apply combo bonus
        const comboMultiplier = 1 + (this.clickCombo - 1) * CONSTANTS.CLICK_COMBO_BONUS;
        clickValue *= comboMultiplier;
        
        // Apply critical click chance
        let isCritical = false;
        if (Math.random() < CONSTANTS.CRITICAL_CLICK_CHANCE) {
            clickValue *= CONSTANTS.CRITICAL_CLICK_MULTIPLIER;
            isCritical = true;
        }
        
        // Add resources
        const actualAmount = this.gameState.addEnergy(clickValue);
        this.gameState.incrementClicks();
        
        // Emit click event
        this.eventManager.emit(GameEvents.CLICK, {
            baseValue: this.gameState.getClickDamage(),
            finalValue: actualAmount,
            combo: this.clickCombo,
            isCritical,
            timestamp: now
        });
        
        return actualAmount;
    }
    
    /**
     * Update passive resource generation
     */
    update(deltaTime) {
        const deltaSeconds = deltaTime / 1000;
        
        // Generate DNA passively
        const dnaPerSecond = this.gameState.getDNAPerSecond();
        if (dnaPerSecond > 0) {
            const dnaGenerated = dnaPerSecond * deltaSeconds;
            this.gameState.addDNA(dnaGenerated);
            this.passiveResources.dna = dnaPerSecond;
        }
        
        // Generate energy passively
        const energyRegen = this.calculateEnergyRegen();
        if (energyRegen > 0 && this.gameState.energy < this.gameState.getMaxEnergy()) {
            this.gameState.addEnergy(energyRegen * deltaSeconds);
            this.passiveResources.energy = energyRegen;
        }
        
        // Generate bioessence (late game resource)
        if (this.gameState.currentStageIndex >= CONSTANTS.BIOESSENCE_UNLOCK_STAGE) {
            const biessencePerSecond = this.calculateBioessenceGeneration();
            if (biessencePerSecond > 0) {
                this.gameState.biessence += biessencePerSecond * deltaSeconds;
                this.passiveResources.biessence = biessencePerSecond;
            }
        }
        
        // Generate cosmic energy (end game resource)
        if (this.gameState.currentStageIndex >= CONSTANTS.COSMIC_ENERGY_UNLOCK_STAGE) {
            const cosmicPerSecond = this.calculateCosmicEnergyGeneration();
            if (cosmicPerSecond > 0) {
                this.gameState.cosmicEnergy += cosmicPerSecond * deltaSeconds;
                this.passiveResources.cosmicEnergy = cosmicPerSecond;
            }
        }
        
        // Update play time
        this.gameState.updatePlayTime(deltaTime);
        
        // Emit tick event
        this.eventManager.emit(GameEvents.TIME_TICK, {
            deltaTime,
            dnaPerSecond: this.passiveResources.dna,
            energyPerSecond: this.passiveResources.energy
        });
    }
    
    /**
     * Calculate energy regeneration rate
     */
    calculateEnergyRegen() {
        let baseRegen = CONSTANTS.BASE_ENERGY_REGEN;
        
        // Stage bonus
        const stageBonus = this.gameState.currentStage?.energyRegenBonus || 1;
        baseRegen *= stageBonus;
        
        // Upgrade bonuses
        for (const [upgradeId, level] of Object.entries(this.gameState.upgradeLevels)) {
            const upgrade = CONSTANTS.UPGRADES.find(u => u.id === upgradeId);
            if (upgrade && upgrade.affects === 'energyRegen') {
                baseRegen += upgrade.baseValue * level;
            }
        }
        
        // Mutation bonuses
        for (const mutation of this.gameState.activeMutations) {
            const mutData = CONSTANTS.MUTATIONS.find(m => m.id === mutation);
            if (mutData && mutData.bonus?.energyRegen) {
                baseRegen *= mutData.bonus.energyRegen;
            }
        }
        
        // Buff bonuses
        baseRegen *= this.gameState.getBuffMultiplier('energyRegen');
        
        return baseRegen;
    }
    
    /**
     * Calculate bioessence generation
     */
    calculateBioessenceGeneration() {
        let baseGen = CONSTANTS.BASE_BIOESSENCE_GEN;
        
        // Based on biodiversity
        baseGen *= (1 + this.gameState.biodiversity * 0.01);
        
        // Based on ecosystem balance
        baseGen *= (this.gameState.ecosystemBalance / 100);
        
        // Stage multiplier
        const stageIndex = this.gameState.currentStageIndex - CONSTANTS.BIOESSENCE_UNLOCK_STAGE + 1;
        baseGen *= Math.pow(2, Math.max(0, stageIndex));
        
        return baseGen;
    }
    
    /**
     * Calculate cosmic energy generation
     */
    calculateCosmicEnergyGeneration() {
        let baseGen = CONSTANTS.BASE_COSMIC_ENERGY_GEN;
        
        // Based on total evolutions
        baseGen *= (1 + this.gameState.totalEvolutions * 0.1);
        
        // Based on prestige
        baseGen *= (1 + this.gameState.prestigeData.prestigeCount * 0.5);
        
        return baseGen;
    }
    
    /**
     * Spend resources
     */
    spendResources(costs) {
        const result = {
            success: true,
            missing: []
        };
        
        for (const [resource, amount] of Object.entries(costs)) {
            let canSpend = false;
            
            switch (resource) {
                case 'dna':
                    canSpend = this.gameState.spendDNA(amount);
                    break;
                case 'energy':
                    if (this.gameState.energy >= amount) {
                        this.gameState.energy -= amount;
                        canSpend = true;
                    }
                    break;
                case 'biessence':
                    if (this.gameState.biessence >= amount) {
                        this.gameState.biessence -= amount;
                        canSpend = true;
                    }
                    break;
                case 'cosmicEnergy':
                    if (this.gameState.cosmicEnergy >= amount) {
                        this.gameState.cosmicEnergy -= amount;
                        canSpend = true;
                    }
                    break;
            }
            
            if (!canSpend) {
                result.success = false;
                result.missing.push({ resource, amount });
            }
        }
        
        if (result.success) {
            this.eventManager.emit(GameEvents.RESOURCE_SPEND, {
                costs,
                timestamp: Date.now()
            });
        }
        
        return result;
    }
    
    /**
     * Get resource production breakdown
     */
    getProductionBreakdown() {
        const breakdown = {
            dna: { base: 0, upgrades: 0, bonuses: 0, total: 0 },
            energy: { base: 0, upgrades: 0, bonuses: 0, total: 0 },
            biessence: { base: 0, upgrades: 0, bonuses: 0, total: 0 },
            cosmicEnergy: { base: 0, upgrades: 0, bonuses: 0, total: 0 }
        };
        
        // DNA breakdown
        breakdown.dna.base = this.gameState.currentStage?.baseDPS || 0;
        
        for (const [upgradeId, level] of Object.entries(this.gameState.upgradeLevels)) {
            const upgrade = CONSTANTS.UPGRADES.find(u => u.id === upgradeId);
            if (upgrade && upgrade.type === 'passive') {
                breakdown.dna.upgrades += upgrade.baseValue * level;
            }
        }
        
        breakdown.dna.bonuses = breakdown.dna.base * (this.gameState.passiveMultiplier - 1);
        breakdown.dna.total = this.gameState.getDNAPerSecond();
        
        // Energy breakdown
        breakdown.energy.base = CONSTANTS.BASE_ENERGY_REGEN;
        breakdown.energy.total = this.calculateEnergyRegen();
        breakdown.energy.bonuses = breakdown.energy.total - breakdown.energy.base;
        
        return breakdown;
    }
    
    /**
     * Get resource caps
     */
    getResourceCaps() {
        return {
            dna: Infinity,
            energy: this.gameState.getMaxEnergy(),
            biessence: CONSTANTS.MAX_BIOESSENCE,
            cosmicEnergy: CONSTANTS.MAX_COSMIC_ENERGY
        };
    }
    
    /**
     * Check if player has enough resources
     */
    canAfford(costs) {
        for (const [resource, amount] of Object.entries(costs)) {
            let available = 0;
            
            switch (resource) {
                case 'dna': available = this.gameState.dna; break;
                case 'energy': available = this.gameState.energy; break;
                case 'biessence': available = this.gameState.biessence; break;
                case 'cosmicEnergy': available = this.gameState.cosmicEnergy; break;
            }
            
            if (available < amount) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get formatted resource amounts
     */
    getFormattedResources() {
        return {
            dna: this.formatNumber(this.gameState.dna),
            energy: `${Math.floor(this.gameState.energy)}/${this.gameState.getMaxEnergy()}`,
            biessence: this.formatNumber(this.gameState.biessence),
            cosmicEnergy: this.formatNumber(this.gameState.cosmicEnergy),
            dnaPerSecond: this.formatNumber(this.passiveResources.dna),
            energyPerSecond: this.formatNumber(this.passiveResources.energy)
        };
    }
    
    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1e15) return (num / 1e15).toFixed(3) + 'Qa';
        if (num >= 1e12) return (num / 1e12).toFixed(3) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(3) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(3) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(3) + 'K';
        return Math.floor(num).toString();
    }
    
    /**
     * Reset resource system
     */
    reset() {
        this.clickCombo = 0;
        this.lastClickTime = 0;
        this.passiveResources = {
            dna: 0,
            energy: 0,
            biessence: 0,
            cosmicEnergy: 0
        };
        
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
            this.comboTimeout = null;
        }
    }
    
    /**
     * Serialize resource system state
     */
    toJSON() {
        return {
            clickCombo: this.clickCombo,
            passiveResources: this.passiveResources
        };
    }
    
    /**
     * Load resource system state
     */
    fromJSON(data) {
        if (!data) return;
        
        this.clickCombo = data.clickCombo || 0;
        this.passiveResources = data.passiveResources || {
            dna: 0,
            energy: 0,
            biessence: 0,
            cosmicEnergy: 0
        };
    }
    
    /**
     * Get resource statistics
     */
    getStats() {
        return {
            currentResources: {
                dna: this.gameState.dna,
                energy: this.gameState.energy,
                biessence: this.gameState.biessence,
                cosmicEnergy: this.gameState.cosmicEnergy
            },
            productionRates: {
                dnaPerSecond: this.passiveResources.dna,
                energyPerSecond: this.passiveResources.energy,
                biessencePerSecond: this.passiveResources.biessence,
                cosmicEnergyPerSecond: this.passiveResources.cosmicEnergy
            },
            clickCombo: this.clickCombo,
            totalCollected: this.gameState.stats.totalDnaCollected,
            totalSpent: this.gameState.stats.totalDnaSpent
        };
    }
}

export { ResourceSystem };
