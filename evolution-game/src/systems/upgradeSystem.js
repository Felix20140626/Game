/**
 * Upgrade System - Manages all game upgrades
 * Handles upgrade purchasing, effects, and progression
 */

import { CONSTANTS } from '../data/constants.js';
import { GameEvents } from '../core/eventManager.js';

class UpgradeSystem {
    constructor(gameState, eventManager) {
        this.gameState = gameState;
        this.eventManager = eventManager;
        
        this.availableUpgrades = [];
        this.purchasedUpgrades = new Set();
        this.upgradeCooldowns = new Map();
        
        console.log('⬆️ UpgradeSystem initialized');
    }
    
    /**
     * Get upgrade by ID
     */
    getUpgrade(upgradeId) {
        return CONSTANTS.UPGRADES.find(u => u.id === upgradeId) || null;
    }
    
    /**
     * Get all upgrades
     */
    getAllUpgrades() {
        return CONSTANTS.UPGRADES;
    }
    
    /**
     * Get available upgrades for current stage
     */
    getAvailableUpgrades() {
        return CONSTANTS.UPGRADES.filter(upgrade => {
            // Check if already purchased (for one-time upgrades)
            if (upgrade.oneTime && this.gameState.isUpgradeUnlocked(upgrade.id)) {
                return false;
            }
            
            // Check stage requirement
            if (upgrade.stageRequired && this.gameState.currentStageIndex < upgrade.stageRequired) {
                return false;
            }
            
            // Check DNA requirement
            if (upgrade.dnaRequired && this.gameState.dna < upgrade.dnaRequired) {
                return false;
            }
            
            // Check prerequisite upgrades
            if (upgrade.prerequisites) {
                for (const prereq of upgrade.prerequisites) {
                    if (!this.gameState.getUpgradeLevel(prereq)) {
                        return false;
                    }
                }
            }
            
            // Check cooldown
            if (this.upgradeCooldowns.has(upgrade.id)) {
                const cooldownEnd = this.upgradeCooldowns.get(upgrade.id);
                if (Date.now() < cooldownEnd) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    /**
     * Get upgrade cost
     */
    getUpgradeCost(upgradeId) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade) return 0;
        
        const currentLevel = this.gameState.getUpgradeLevel(upgradeId);
        
        if (upgrade.costScaling === 'exponential') {
            return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
        } else if (upgrade.costScaling === 'linear') {
            return Math.floor(upgrade.baseCost + (upgrade.costIncrement * currentLevel));
        } else if (upgrade.costScaling === 'quadratic') {
            return Math.floor(upgrade.baseCost * Math.pow(currentLevel + 1, 2));
        }
        
        return upgrade.baseCost;
    }
    
    /**
     * Buy an upgrade
     */
    buyUpgrade(upgradeId) {
        const upgrade = this.getUpgrade(upgradeId);
        
        if (!upgrade) {
            return { success: false, reason: 'Upgrade not found' };
        }
        
        // Check if one-time upgrade already purchased
        if (upgrade.oneTime && this.gameState.isUpgradeUnlocked(upgradeId)) {
            return { success: false, reason: 'Already purchased' };
        }
        
        // Get cost
        const cost = this.getUpgradeCost(upgradeId);
        
        // Check if player can afford
        if (this.gameState.dna < cost) {
            return { 
                success: false, 
                reason: `Need ${this.formatNumber(cost)} DNA`,
                missing: cost - this.gameState.dna
            };
        }
        
        // Check max level
        const currentLevel = this.gameState.getUpgradeLevel(upgradeId);
        if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) {
            return { success: false, reason: 'Max level reached' };
        }
        
        // Purchase upgrade
        this.gameState.spendDNA(cost);
        
        if (upgrade.oneTime) {
            this.gameState.unlockUpgrade(upgradeId);
        }
        
        this.gameState.setUpgradeLevel(upgradeId, currentLevel + 1);
        this.gameState.stats.totalUpgradesPurchased++;
        
        // Apply immediate effects
        this.applyUpgradeEffect(upgrade);
        
        // Set cooldown if applicable
        if (upgrade.cooldown) {
            this.upgradeCooldowns.set(upgrade.id, Date.now() + upgrade.cooldown);
        }
        
        // Emit purchase event
        this.eventManager.emit(GameEvents.UPGRADE_PURCHASE, {
            upgradeId,
            level: currentLevel + 1,
            cost,
            timestamp: Date.now()
        });
        
        // Check if max level reached
        if (upgrade.maxLevel && currentLevel + 1 >= upgrade.maxLevel) {
            this.eventManager.emit(GameEvents.UPGRADE_MAX_LEVEL, {
                upgradeId,
                timestamp: Date.now()
            });
        }
        
        console.log(`⬆️ Purchased ${upgrade.name} (Level ${currentLevel + 1})`);
        
        return {
            success: true,
            upgrade,
            newLevel: currentLevel + 1,
            cost
        };
    }
    
    /**
     * Apply upgrade effect
     */
    applyUpgradeEffect(upgrade) {
        switch (upgrade.affects) {
            case 'click':
                this.gameState.clickDamage += upgrade.baseValue;
                break;
            case 'passive':
                // Handled in DPS calculation
                break;
            case 'energyCapacity':
                // Handled in getMaxEnergy
                break;
            case 'energyRegen':
                // Handled in calculateEnergyRegen
                break;
            case 'global':
                this.gameState.globalMultiplier *= (1 + upgrade.baseValue);
                break;
            case 'unlock':
                // Unlock content handled separately
                break;
        }
    }
    
    /**
     * Get upgrade effect description
     */
    getUpgradeEffectDescription(upgrade) {
        const descriptions = {
            click: `+${upgrade.baseValue} click damage`,
            passive: `+${upgrade.baseValue} DNA/sec`,
            energyCapacity: `+${Math.round(upgrade.baseValue * 100)}% energy capacity`,
            energyRegen: `+${upgrade.baseValue} energy/sec`,
            global: `+${Math.round(upgrade.baseValue * 100)}% all production`,
            unlock: `Unlocks ${upgrade.unlockContent}`
        };
        
        return descriptions[upgrade.affects] || 'Unknown effect';
    }
    
    /**
     * Calculate total bonus from all upgrades
     */
    getTotalBonus(stat) {
        let total = 0;
        
        for (const [upgradeId, level] of Object.entries(this.gameState.upgradeLevels)) {
            const upgrade = this.getUpgrade(upgradeId);
            if (upgrade && upgrade.affects === stat) {
                total += upgrade.baseValue * level;
            }
        }
        
        return total;
    }
    
    /**
     * Get upgrade statistics
     */
    getUpgradeStats() {
        const stats = {
            totalPurchased: this.gameState.stats.totalUpgradesPurchased,
            totalSpent: 0,
            bonuses: {}
        };
        
        for (const [upgradeId, level] of Object.entries(this.gameState.upgradeLevels)) {
            const upgrade = this.getUpgrade(upgradeId);
            if (upgrade) {
                const cost = this.getUpgradeCost(upgradeId);
                stats.totalSpent += cost;
                
                if (!stats.bonuses[upgrade.affects]) {
                    stats.bonuses[upgrade.affects] = 0;
                }
                stats.bonuses[upgrade.affects] += upgrade.baseValue * level;
            }
        }
        
        return stats;
    }
    
    /**
     * Reset upgrade system
     */
    reset() {
        this.availableUpgrades = [];
        this.purchasedUpgrades.clear();
        this.upgradeCooldowns.clear();
    }
    
    /**
     * Serialize upgrade system state
     */
    toJSON() {
        return {
            purchasedUpgrades: Array.from(this.purchasedUpgrades),
            upgradeCooldowns: Object.fromEntries(this.upgradeCooldowns)
        };
    }
    
    /**
     * Load upgrade system state
     */
    fromJSON(data) {
        if (!data) return;
        
        this.purchasedUpgrades = new Set(data.purchasedUpgrades || []);
        
        if (data.upgradeCooldowns) {
            this.upgradeCooldowns = new Map(Object.entries(data.upgradeCooldowns));
        }
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
     * Get affordable upgrades
     */
    getAffordableUpgrades() {
        return this.getAvailableUpgrades().filter(upgrade => {
            const cost = this.getUpgradeCost(upgrade.id);
            return this.gameState.dna >= cost;
        });
    }
    
    /**
     * Get next affordable upgrade
     */
    getNextAffordableUpgrade() {
        const affordable = this.getAffordableUpgrades();
        
        if (affordable.length === 0) {
            return null;
        }
        
        // Sort by cost (ascending)
        affordable.sort((a, b) => {
            const costA = this.getUpgradeCost(a.id);
            const costB = this.getUpgradeCost(b.id);
            return costA - costB;
        });
        
        return affordable[0];
    }
    
    /**
     * Bulk purchase upgrades
     */
    bulkPurchase(count = 10) {
        let purchased = 0;
        
        for (let i = 0; i < count; i++) {
            const nextUpgrade = this.getNextAffordableUpgrade();
            if (!nextUpgrade) break;
            
            const result = this.buyUpgrade(nextUpgrade.id);
            if (result.success) {
                purchased++;
            } else {
                break;
            }
        }
        
        return purchased;
    }
    
    /**
     * Get upgrade recommendations
     */
    getRecommendations() {
        const recommendations = [];
        
        const available = this.getAvailableUpgrades();
        
        // Calculate value score for each upgrade
        for (const upgrade of available) {
            const cost = this.getUpgradeCost(upgrade.id);
            const valueScore = this.calculateValueScore(upgrade, cost);
            
            recommendations.push({
                upgrade,
                cost,
                valueScore,
                affordable: this.gameState.dna >= cost
            });
        }
        
        // Sort by value score
        recommendations.sort((a, b) => b.valueScore - a.valueScore);
        
        return recommendations.slice(0, 5);
    }
    
    /**
     * Calculate value score for an upgrade
     */
    calculateValueScore(upgrade, cost) {
        let baseScore = 0;
        
        switch (upgrade.affects) {
            case 'click':
                baseScore = upgrade.baseValue / cost;
                break;
            case 'passive':
                // ROI based on payback time
                baseScore = (upgrade.baseValue * 60) / cost;
                break;
            case 'global':
                baseScore = (upgrade.baseValue * 10) / cost;
                break;
            default:
                baseScore = 1 / cost;
        }
        
        // Bonus for unlocking new features
        if (upgrade.affects === 'unlock') {
            baseScore *= 2;
        }
        
        return baseScore;
    }
}

export { UpgradeSystem };
