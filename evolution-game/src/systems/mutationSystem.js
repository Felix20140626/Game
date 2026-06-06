/**
 * Mutation System - Genetic Mutation Mechanics
 * Handles random mutations, genetic drift, and evolutionary adaptations
 */

export class MutationSystem {
  constructor(gameState) {
    this.gameState = gameState;
    this.activeMutations = [];
    this.mutationHistory = [];
    this.mutationChance = 0.05;
    this.mutationTimer = 0;
    this.geneticDiversity = 0;
  }

  update(deltaTime) {
    this.mutationTimer += deltaTime;
    
    // Check for mutation every second
    if (this.mutationTimer >= 1000) {
      this.mutationTimer = 0;
      this.attemptMutation();
    }
    
    // Update active mutations
    this.activeMutations.forEach(mutation => {
      mutation.duration -= deltaTime;
      if (mutation.duration <= 0) {
        this.removeMutation(mutation.id);
      }
    });
  }

  attemptMutation() {
    const chance = this.calculateMutationChance();
    if (Math.random() < chance) {
      this.triggerRandomMutation();
    }
  }

  calculateMutationChance() {
    let chance = this.mutationChance;
    
    // Stage bonuses
    const stageBonus = this.gameState.currentStage * 0.001;
    chance += stageBonus;
    
    // Upgrade bonuses
    const upgradeBonus = this.gameState.getMultiplier('mutation_chance') - 1;
    chance += upgradeBonus;
    
    // Environmental factors
    const envBonus = this.calculateEnvironmentalBonus();
    chance += envBonus;
    
    return Math.min(chance, 0.5); // Cap at 50%
  }

  triggerRandomMutation() {
    const mutationPool = this.getAvailableMutations();
    if (mutationPool.length === 0) return;
    
    const mutation = mutationPool[Math.floor(Math.random() * mutationPool.length)];
    this.applyMutation(mutation);
  }

  getAvailableMutations() {
    return MUTATION_DATABASE.filter(m => 
      m.minStage <= this.gameState.currentStage &&
      !this.activeMutations.find(am => am.id === m.id)
    );
  }

  applyMutation(mutation) {
    const mutationInstance = {
      id: mutation.id,
      name: mutation.name,
      type: mutation.type,
      effect: mutation.effect,
      duration: mutation.duration,
      startTime: Date.now()
    };
    
    this.activeMutations.push(mutationInstance);
    this.mutationHistory.push({
      ...mutationInstance,
      endTime: null
    });
    
    this.activateMutationEffects(mutation);
    
    // Emit event
    this.gameState.emit('mutation_triggered', mutationInstance);
  }

  activateMutationEffects(mutation) {
    switch (mutation.effect.type) {
      case 'click_multiplier':
        this.gameState.addTemporaryMultiplier('click', mutation.effect.value, mutation.duration);
        break;
      case 'passive_multiplier':
        this.gameState.addTemporaryMultiplier('passive', mutation.effect.value, mutation.duration);
        break;
      case 'dna_boost':
        this.gameState.resources.dna += mutation.effect.value;
        break;
      case 'energy_boost':
        this.gameState.resources.energy += mutation.effect.value;
        break;
      case 'auto_click':
        this.startAutoClick(mutation.effect.value, mutation.duration);
        break;
    }
  }

  removeMutation(mutationId) {
    const index = this.activeMutations.findIndex(m => m.id === mutationId);
    if (index !== -1) {
      const mutation = this.activeMutations[index];
      this.deactivateMutationEffects(mutation);
      this.activeMutations.splice(index, 1);
      
      // Update history
      const historyEntry = this.mutationHistory.find(h => h.id === mutationId && !h.endTime);
      if (historyEntry) {
        historyEntry.endTime = Date.now();
      }
    }
  }

  deactivateMutationEffects(mutation) {
    // Remove temporary effects
    this.gameState.removeTemporaryMultiplier('click', mutation.effect.value);
    this.gameState.removeTemporaryMultiplier('passive', mutation.effect.value);
  }

  startAutoClick(clicksPerSecond, duration) {
    const interval = 1000 / clicksPerSecond;
    let elapsed = 0;
    
    const autoClickInterval = setInterval(() => {
      elapsed += interval;
      if (elapsed >= duration) {
        clearInterval(autoClickInterval);
        return;
      }
      this.gameState.handleClick();
    }, interval);
  }

  calculateEnvironmentalBonus() {
    // Based on current resources, stage, and time
    let bonus = 0;
    
    // More DNA = more mutations
    if (this.gameState.resources.dna > 1e6) bonus += 0.01;
    if (this.gameState.resources.dna > 1e9) bonus += 0.02;
    
    // Time played bonus
    const hoursPlayed = this.gameState.statistics.timePlayed / 3600000;
    bonus += Math.min(hoursPlayed * 0.001, 0.05);
    
    return bonus;
  }

  getGeneticDiversity() {
    return this.mutationHistory.length * 0.1 + this.activeMutations.length;
  }

  save() {
    return {
      activeMutations: this.activeMutations,
      mutationHistory: this.mutationHistory.slice(-100), // Last 100 mutations
      mutationChance: this.mutationChance,
      geneticDiversity: this.getGeneticDiversity()
    };
  }

  load(data) {
    if (data.activeMutations) this.activeMutations = data.activeMutations;
    if (data.mutationHistory) this.mutationHistory = data.mutationHistory;
    if (data.mutationChance) this.mutationChance = data.mutationChance;
  }
}

// Mutation Database
const MUTATION_DATABASE = [
  {
    id: 'rapid_growth',
    name: 'Rapid Growth',
    description: 'DNA production doubled for 30 seconds',
    minStage: 1,
    type: 'beneficial',
    effect: { type: 'passive_multiplier', value: 2.0 },
    duration: 30000
  },
  {
    id: 'click_frenzy',
    name: 'Click Frenzy',
    description: 'Click power tripled for 20 seconds',
    minStage: 2,
    type: 'beneficial',
    effect: { type: 'click_multiplier', value: 3.0 },
    duration: 20000
  },
  {
    id: 'dna_bloom',
    name: 'DNA Bloom',
    description: 'Instant gain of 1000 DNA',
    minStage: 1,
    type: 'beneficial',
    effect: { type: 'dna_boost', value: 1000 },
    duration: 0
  },
  {
    id: 'energy_surge',
    name: 'Energy Surge',
    description: 'Instant gain of 500 energy',
    minStage: 2,
    type: 'beneficial',
    effect: { type: 'energy_boost', value: 500 },
    duration: 0
  },
  {
    id: 'auto_evolution',
    name: 'Auto Evolution',
    description: 'Auto-clicks 10 times per second for 15 seconds',
    minStage: 5,
    type: 'beneficial',
    effect: { type: 'auto_click', value: 10 },
    duration: 15000
  },
  {
    id: 'genetic_drift',
    name: 'Genetic Drift',
    description: 'Random small bonuses for 60 seconds',
    minStage: 10,
    type: 'neutral',
    effect: { type: 'random_bonus', value: 1.5 },
    duration: 60000
  },
  {
    id: 'adaptive_radiation',
    name: 'Adaptive Radiation',
    description: 'All multipliers increased by 50% for 45 seconds',
    minStage: 15,
    type: 'beneficial',
    effect: { type: 'global_multiplier', value: 1.5 },
    duration: 45000
  },
  {
    id: 'punctuated_equilibrium',
    name: 'Punctuated Equilibrium',
    description: 'Evolution costs reduced by 25% for 120 seconds',
    minStage: 20,
    type: 'beneficial',
    effect: { type: 'cost_reduction', value: 0.75 },
    duration: 120000
  }
];

export default MutationSystem;
