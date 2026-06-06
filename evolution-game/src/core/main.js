/**
 * Evolution Clicker Game - Main Entry Point
 * Initializes all game systems and starts the game loop
 */

import { GameState } from './gameState.js';
import { EvolutionSystem } from '../systems/evolutionSystem.js';
import { ResourceSystem } from '../systems/resourceSystem.js';
import { UpgradeSystem } from '../systems/upgradeSystem.js';
import { AchievementSystem } from '../systems/achievementSystem.js';
import { QuestSystem } from '../systems/questSystem.js';
import { MutationSystem } from '../systems/mutationSystem.js';
import { EcosystemSystem } from '../systems/ecosystemSystem.js';
import { Renderer } from '../ui/renderer.js';
import { EventManager } from '../core/eventManager.js';
import { SaveSystem } from '../core/saveSystem.js';
import { AudioController } from '../core/audioController.js';
import { CONSTANTS } from '../data/constants.js';
import { Utils } from '../utils/utils.js';

/**
 * Main Game Class
 * Orchestrates all game systems and manages the game loop
 */
class Game {
    constructor() {
        this.gameState = null;
        this.eventManager = null;
        this.evolutionSystem = null;
        this.resourceSystem = null;
        this.upgradeSystem = null;
        this.achievementSystem = null;
        this.questSystem = null;
        this.mutationSystem = null;
        this.ecosystemSystem = null;
        this.renderer = null;
        this.saveSystem = null;
        this.audioController = null;
        
        this.lastUpdateTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / 60; // 60 FPS
        this.isRunning = false;
        this.animationFrameId = null;
        
        console.log('🎮 Evolution Clicker Game Initializing...');
    }
    
    /**
     * Initialize all game systems
     */
    async init() {
        try {
            // Initialize core systems
            this.eventManager = new EventManager();
            this.gameState = new GameState(this.eventManager);
            this.saveSystem = new SaveSystem(this.gameState, this.eventManager);
            this.audioController = new AudioController();
            
            // Initialize game logic systems
            this.resourceSystem = new ResourceSystem(this.gameState, this.eventManager);
            this.evolutionSystem = new EvolutionSystem(this.gameState, this.eventManager);
            this.upgradeSystem = new UpgradeSystem(this.gameState, this.eventManager);
            this.achievementSystem = new AchievementSystem(this.gameState, this.eventManager);
            this.questSystem = new QuestSystem(this.gameState, this.eventManager);
            this.mutationSystem = new MutationSystem(this.gameState, this.eventManager);
            this.ecosystemSystem = new EcosystemSystem(this.gameState, this.eventManager);
            
            // Initialize UI
            this.renderer = new Renderer(
                this.gameState,
                this.evolutionSystem,
                this.resourceSystem,
                this.upgradeSystem,
                this.achievementSystem,
                this.questSystem,
                this.eventManager
            );
            
            // Load saved game if exists
            await this.saveSystem.load();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial state
            this.renderer.render();
            
            console.log('✅ Game initialized successfully!');
            console.log(`📊 Current Stage: ${this.gameState.currentStageName}`);
            console.log(`💾 DNA: ${Utils.formatNumber(this.gameState.dna)}`);
            console.log(`⚡ Energy: ${Utils.formatNumber(this.gameState.energy)}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            throw error;
        }
    }
    
    /**
     * Setup all event listeners for user interactions
     */
    setupEventListeners() {
        // Click events
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Visibility change (pause/resume)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Before unload (auto-save)
        window.addEventListener('beforeunload', () => this.saveSystem.save());
        
        console.log('🎯 Event listeners configured');
    }
    
    /**
     * Handle global click events
     */
    handleGlobalClick(e) {
        const target = e.target;
        
        // Check for evolution button
        if (target.matches('.evolve-btn') || target.closest('.evolve-btn')) {
            this.attemptEvolution();
            return;
        }
        
        // Check for upgrade buttons
        if (target.matches('.upgrade-btn') || target.closest('.upgrade-btn')) {
            const upgradeId = target.dataset?.upgradeId || target.closest('[data-upgrade-id]')?.dataset?.upgradeId;
            if (upgradeId) {
                this.purchaseUpgrade(upgradeId);
            }
            return;
        }
        
        // Check for mutation buttons
        if (target.matches('.mutation-btn') || target.closest('.mutation-btn')) {
            const mutationId = target.dataset?.mutationId || target.closest('[data-mutation-id]')?.dataset?.mutationId;
            if (mutationId) {
                this.activateMutation(mutationId);
            }
            return;
        }
        
        // Check for quest claim buttons
        if (target.matches('.claim-quest-btn') || target.closest('.claim-quest-btn')) {
            const questId = target.dataset?.questId || target.closest('[data-quest-id]')?.dataset?.questId;
            if (questId) {
                this.claimQuestReward(questId);
            }
            return;
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyPress(e) {
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'enter':
                // Space/Enter to collect energy
                e.preventDefault();
                this.collectEnergy();
                break;
            case 'e':
                // E to evolve
                e.preventDefault();
                this.attemptEvolution();
                break;
            case 's':
                // S to save
                e.preventDefault();
                this.saveSystem.save();
                this.renderer.showNotification('Game Saved!', 'success');
                break;
            case 'm':
                // M to toggle music
                e.preventDefault();
                this.audioController.toggleMusic();
                break;
            case 'p':
                // P to pause
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    /**
     * Handle visibility change (tab switch)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.renderer.onResize();
        }, 250);
    }
    
    /**
     * Collect energy from clicking
     */
    collectEnergy() {
        const amount = this.resourceSystem.clickCollect();
        this.renderer.updateResourceDisplay();
        this.renderer.createClickEffect(amount);
        
        // Check for achievements
        this.achievementSystem.checkClickAchievements();
    }
    
    /**
     * Attempt to evolve to next stage
     */
    attemptEvolution() {
        const result = this.evolutionSystem.tryEvolve();
        
        if (result.success) {
            this.renderer.showEvolutionAnimation(result.newStage);
            this.renderer.updateEvolutionDisplay();
            this.achievementSystem.checkEvolutionAchievements();
            
            console.log(`🧬 Evolved to: ${result.newStage.name}!`);
        } else {
            this.renderer.showNotification(result.reason, 'warning');
        }
    }
    
    /**
     * Purchase an upgrade
     */
    purchaseUpgrade(upgradeId) {
        const result = this.upgradeSystem.buyUpgrade(upgradeId);
        
        if (result.success) {
            this.renderer.updateUpgradeDisplay();
            this.renderer.updateResourceDisplay();
            this.achievementSystem.checkUpgradeAchievements();
            
            console.log(`⬆️ Purchased: ${result.upgrade.name} (Level ${result.newLevel})`);
        } else {
            this.renderer.showNotification(result.reason, 'warning');
        }
    }
    
    /**
     * Activate a mutation
     */
    activateMutation(mutationId) {
        const result = this.mutationSystem.activateMutation(mutationId);
        
        if (result.success) {
            this.renderer.updateMutationDisplay();
            this.renderer.showNotification(`Mutation activated: ${result.mutation.name}`, 'success');
        } else {
            this.renderer.showNotification(result.reason, 'warning');
        }
    }
    
    /**
     * Claim quest reward
     */
    claimQuestReward(questId) {
        const result = this.questSystem.claimReward(questId);
        
        if (result.success) {
            this.renderer.updateQuestDisplay();
            this.renderer.updateResourceDisplay();
            this.renderer.showNotification(`Quest completed: +${Utils.formatNumber(result.reward)} DNA`, 'success');
        } else {
            this.renderer.showNotification(result.reason, 'warning');
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.renderer.showOverlay('PAUSED', 'Press P to resume');
        console.log('⏸️ Game paused');
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        this.gameLoop();
        
        this.renderer.hideOverlay();
        console.log('▶️ Game resumed');
    }
    
    /**
     * Main game loop
     */
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        this.accumulator += deltaTime;
        
        // Update game systems at fixed time step
        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }
        
        // Render
        this.renderer.render(deltaTime);
        
        // Continue loop
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Update all game systems
     */
    update(deltaTime) {
        // Update resources (passive generation)
        this.resourceSystem.update(deltaTime);
        
        // Update ecosystem
        this.ecosystemSystem.update(deltaTime);
        
        // Update mutations
        this.mutationSystem.update(deltaTime);
        
        // Check quests
        this.questSystem.update(deltaTime);
        
        // Check achievements
        this.achievementSystem.update(deltaTime);
        
        // Auto-save every 30 seconds
        this.saveSystem.autoSave(deltaTime);
    }
    
    /**
     * Start the game
     */
    start() {
        if (this.isRunning) {
            console.warn('Game is already running');
            return;
        }
        
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        this.gameLoop();
        
        console.log('🚀 Game started!');
    }
    
    /**
     * Stop the game
     */
    stop() {
        this.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.saveSystem.save();
        console.log('🛑 Game stopped');
    }
    
    /**
     * Reset the game (with confirmation)
     */
    reset() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            this.stop();
            this.gameState.reset();
            this.saveSystem.clear();
            this.renderer.render();
            this.start();
            console.log('🔄 Game reset');
        }
    }
}

// Export singleton instance
const game = new Game();
export { game, Game };

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await game.init();
            game.start();
        } catch (error) {
            console.error('Failed to start game:', error);
            alert('Failed to initialize game. Please check the console for details.');
        }
    });
}
