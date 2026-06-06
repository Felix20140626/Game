/**
 * Evolution System - Manages evolution mechanics
 * Handles stage progression, evolution requirements, and transformations
 */

import { CONSTANTS } from '../data/constants.js';
import { GameEvents } from '../core/eventManager.js';

class EvolutionSystem {
    constructor(gameState, eventManager) {
        this.gameState = gameState;
        this.eventManager = eventManager;
        
        this.evolutionQueue = [];
        this.isEvolving = false;
        this.evolutionProgress = 0;
        this.totalEvolutionsPerformed = 0;
        
        console.log('🧬 EvolutionSystem initialized');
    }
    
    /**
     * Get current evolution stage
     */
    getCurrentStage() {
        return CONSTANTS.EVOLUTION_STAGES[this.gameState.currentStageIndex] || null;
    }
    
    /**
     * Get next evolution stage
     */
    getNextStage() {
        const nextIndex = this.gameState.currentStageIndex + 1;
        return CONSTANTS.EVOLUTION_STAGES[nextIndex] || null;
    }
    
    /**
     * Check if evolution is available
     */
    canEvolve() {
        const currentStage = this.getCurrentStage();
        const nextStage = this.getNextStage();
        
        if (!nextStage) {
            return { can: false, reason: 'Maximum evolution reached!' };
        }
        
        // Check DNA requirement
        if (this.gameState.dna < nextStage.dnaRequired) {
            return { 
                can: false, 
                reason: `Need ${this.formatNumber(nextStage.dnaRequired)} DNA`,
                missing: nextStage.dnaRequired - this.gameState.dna
            };
        }
        
        // Check energy requirement
        if (this.gameState.energy < nextStage.energyRequired) {
            return { 
                can: false, 
                reason: `Need ${nextStage.energyRequired} Energy`,
                missing: nextStage.energyRequired - this.gameState.energy
            };
        }
        
        // Check prerequisite stages
        if (nextStage.prerequisites) {
            for (const prereq of nextStage.prerequisites) {
                if (!this.gameState.isStageUnlocked(prereq)) {
                    return { 
                        can: false, 
                        reason: `Unlock previous stages first`
                    };
                }
            }
        }
        
        // Check upgrade requirements
        if (nextStage.requiredUpgrades) {
            for (const upgradeId of nextStage.requiredUpgrades) {
                if (!this.gameState.isUpgradeUnlocked(upgradeId)) {
                    const upgrade = CONSTANTS.UPGRADES.find(u => u.id === upgradeId);
                    return { 
                        can: false, 
                        reason: `Need upgrade: ${upgrade?.name || upgradeId}`
                    };
                }
            }
        }
        
        return { can: true };
    }
    
    /**
     * Attempt to evolve
     */
    tryEvolve() {
        const check = this.canEvolve();
        
        if (!check.can) {
            this.eventManager.emit(GameEvents.EVOLUTION_FAIL, {
                reason: check.reason,
                stageIndex: this.gameState.currentStageIndex
            });
            
            return {
                success: false,
                reason: check.reason
            };
        }
        
        const nextStage = this.getNextStage();
        
        // Consume resources
        this.gameState.spendDNA(nextStage.dnaRequired);
        this.gameState.energy -= nextStage.energyRequired;
        
        // Start evolution
        this.startEvolution(nextStage);
        
        return {
            success: true,
            newStage: nextStage
        };
    }
    
    /**
     * Start evolution process
     */
    startEvolution(stage) {
        this.isEvolving = true;
        this.evolutionQueue.push(stage);
        
        this.eventManager.emit(GameEvents.EVOLUTION_START, {
            stage: stage,
            timestamp: Date.now()
        });
        
        // Evolution animation duration
        const evolutionTime = stage.evolutionTime || 3000;
        
        setTimeout(() => {
            this.completeEvolution();
        }, evolutionTime);
    }
    
    /**
     * Complete evolution
     */
    completeEvolution() {
        if (this.evolutionQueue.length === 0) {
            this.isEvolving = false;
            return;
        }
        
        const stage = this.evolutionQueue.shift();
        
        // Update game state
        this.gameState.currentStageIndex++;
        this.gameState.stagesUnlocked.push(this.gameState.currentStageIndex);
        this.gameState.totalEvolutions++;
        this.totalEvolutionsPerformed++;
        
        // Apply stage bonuses
        this.applyStageBonuses(stage);
        
        // Unlock mutations if available
        if (stage.unlockedMutations) {
            for (const mutationId of stage.unlockedMutations) {
                if (!this.gameState.unlockedMutations.includes(mutationId)) {
                    this.gameState.unlockedMutations.push(mutationId);
                }
            }
        }
        
        // Unlock upgrades if available
        if (stage.unlockedUpgrades) {
            for (const upgradeId of stage.unlockedUpgrades) {
                this.gameState.unlockUpgrade(upgradeId);
            }
        }
        
        // Grant initial resources
        if (stage.initialDNA) {
            this.gameState.addDNA(stage.initialDNA);
        }
        if (stage.initialEnergy) {
            this.gameState.addEnergy(stage.initialEnergy);
        }
        
        this.isEvolving = false;
        
        this.eventManager.emit(GameEvents.EVOLUTION_COMPLETE, {
            stage: stage,
            stageIndex: this.gameState.currentStageIndex,
            timestamp: Date.now()
        });
        
        console.log(`🧬 Evolved to ${stage.name}!`);
    }
    
    /**
     * Apply stage bonuses
     */
    applyStageBonuses(stage) {
        if (stage.clickBonus) {
            this.gameState.clickMultiplier *= stage.clickBonus;
        }
        
        if (stage.passiveBonus) {
            this.gameState.passiveMultiplier *= stage.passiveBonus;
        }
        
        if (stage.globalBonus) {
            this.gameState.globalMultiplier *= stage.globalBonus;
        }
        
        if (stage.energyCapacityBonus) {
            // Handled in GameState.getMaxEnergy()
        }
    }
    
    /**
     * Get evolution progress percentage
     */
    getEvolutionProgress() {
        const currentStage = this.getCurrentStage();
        const nextStage = this.getNextStage();
        
        if (!nextStage) {
            return 100;
        }
        
        // Calculate based on DNA collected vs required
        const dnaProgress = Math.min(1, this.gameState.dna / nextStage.dnaRequired);
        const energyProgress = Math.min(1, this.gameState.energy / nextStage.energyRequired);
        
        // Weighted average
        const progress = (dnaProgress * 0.7 + energyProgress * 0.3) * 100;
        
        return Math.floor(progress);
    }
    
    /**
     * Get all stages
     */
    getAllStages() {
        return CONSTANTS.EVOLUTION_STAGES;
    }
    
    /**
     * Get unlocked stages
     */
    getUnlockedStages() {
        return CONSTANTS.EVOLUTION_STAGES.filter((_, index) => 
            this.gameState.isStageUnlocked(index)
        );
    }
    
    /**
     * Get locked stages
     */
    getLockedStages() {
        return CONSTANTS.EVOLUTION_STAGES.filter((_, index) => 
            !this.gameState.isStageUnlocked(index)
        );
    }
    
    /**
     * Get stage by index
     */
    getStageByIndex(index) {
        return CONSTANTS.EVOLUTION_STAGES[index] || null;
    }
    
    /**
     * Get stage by name
     */
    getStageByName(name) {
        return CONSTANTS.EVOLUTION_STAGES.find(s => s.name === name) || null;
    }
    
    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }
    
    /**
     * Reset evolution system
     */
    reset() {
        this.evolutionQueue = [];
        this.isEvolving = false;
        this.evolutionProgress = 0;
        this.totalEvolutionsPerformed = 0;
    }
    
    /**
     * Serialize evolution system state
     */
    toJSON() {
        return {
            evolutionQueue: this.evolutionQueue,
            isEvolving: this.isEvolving,
            totalEvolutionsPerformed: this.totalEvolutionsPerformed
        };
    }
    
    /**
     * Load evolution system state
     */
    fromJSON(data) {
        if (!data) return;
        
        this.evolutionQueue = data.evolutionQueue || [];
        this.isEvolving = data.isEvolving || false;
        this.totalEvolutionsPerformed = data.totalEvolutionsPerformed || 0;
    }
    
    /**
     * Get evolution statistics
     */
    getStats() {
        return {
            currentStage: this.getCurrentStage()?.name,
            currentStageIndex: this.gameState.currentStageIndex,
            totalStages: CONSTANTS.EVOLUTION_STAGES.length,
            unlockedStages: this.gameState.stagesUnlocked.length,
            totalEvolutions: this.totalEvolutionsPerformed,
            canEvolve: this.canEvolve().can,
            evolutionProgress: this.getEvolutionProgress()
        };
    }
}

export { EvolutionSystem };
