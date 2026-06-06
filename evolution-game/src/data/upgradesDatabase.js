/**
 * Complete Upgrades Database - All Evolution Upgrades
 * Contains 500+ unique upgrades across all evolution stages
 * Each upgrade has detailed effects, costs, scaling, and prerequisites
 */

export const upgradesDatabase = [
  // ==================== TIER 1: BASIC ABSORPTION UPGRADES (1-50) ====================
  {
    id: "basic_absorption",
    name: "Basic Absorption",
    description: "Learn to absorb nutrients from the environment more efficiently.",
    category: "absorption",
    tier: 1,
    baseCost: { dna: 50, energy: 20 },
    costScaling: "linear",
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: {
      type: "click_multiplier",
      value: 0.1,
      scaling: "additive"
    },
    prerequisites: [],
    unlockStage: 1,
    icon: "absorption_basic",
    flavorText: "Even the simplest organisms can learn to eat better."
  },
  {
    id: "membrane_efficiency",
    name: "Membrane Efficiency",
    description: "Improve cell membrane permeability for better nutrient uptake.",
    category: "absorption",
    tier: 1,
    baseCost: { dna: 100, energy: 40 },
    costScaling: "linear",
    costMultiplier: 1.6,
    maxLevel: 10,
    effect: {
      type: "passive_multiplier",
      value: 0.15,
      scaling: "additive"
    },
    prerequisites: ["basic_absorption"],
    unlockStage: 2,
    icon: "membrane_efficiency",
    flavorText: "A better membrane means a better life."
  },
  {
    id: "enzyme_production",
    name: "Enzyme Production",
    description: "Produce enzymes to break down complex molecules.",
    category: "metabolism",
    tier: 1,
    baseCost: { dna: 200, energy: 80 },
    costScaling: "exponential",
    costMultiplier: 1.8,
    maxLevel: 15,
    effect: {
      type: "energy_regen",
      value: 0.2,
      scaling: "multiplicative"
    },
    prerequisites: ["membrane_efficiency"],
    unlockStage: 3,
    icon: "enzyme_production",
    flavorText: "Chemistry becomes biology."
  },
  
  // Continue generating 500+ upgrades programmatically
];

// Generate comprehensive upgrade database
export function generateCompleteUpgrades() {
  const upgrades = [];
  const categories = [
    "absorption", "metabolism", "reproduction", "defense", 
    "mobility", "sensation", "cognition", "specialization",
    "symbiosis", "adaptation", "mutation", "efficiency"
  ];
  
  const upgradePrefixes = [
    "Basic", "Improved", "Advanced", "Superior", "Master",
    "Expert", "Elite", "Ultimate", "Perfect", "Divine",
    "Cosmic", "Transcendent", "Ethereal", "Quantum", "Dimensional"
  ];
  
  const upgradeSuffixes = [
    "Absorption", "Digestion", "Replication", "Protection",
    "Movement", "Detection", "Processing", "Adaptation",
    "Synthesis", "Conversion", "Storage", "Distribution",
    "Regulation", "Optimization", "Amplification"
  ];
  
  const effectTypes = [
    "click_multiplier", "passive_multiplier", "energy_regen",
    "mutation_chance", "dna_bonus", "energy_capacity",
    "evolution_speed", "resource_efficiency", "critical_chance",
    "combo_bonus", "stage_bonus", "global_multiplier"
  ];
  
  let upgradeId = 0;
  
  // Generate upgrades for each tier and category
  for (let tier = 1; tier <= 15; tier++) {
    for (let catIndex = 0; catIndex < categories.length; catIndex++) {
      const category = categories[catIndex];
      
      // Generate 3-5 upgrades per category per tier
      const upgradesPerCategory = 3 + (tier % 3);
      
      for (let i = 0; i < upgradesPerCategory; i++) {
        upgradeId++;
        const prefixIndex = (tier + i) % upgradePrefixes.length;
        const suffixIndex = (catIndex + i) % upgradeSuffixes.length;
        const effectIndex = (upgradeId) % effectTypes.length;
        
        const baseDnaCost = Math.floor(50 * Math.pow(2.5, tier - 1) * (1 + i * 0.5));
        const baseEnergyCost = Math.floor(20 * Math.pow(2.3, tier - 1) * (1 + i * 0.5));
        const maxLevel = 5 + (tier % 10);
        const costMultiplier = 1.3 + (category === "specialization" ? 0.3 : 0);
        
        upgrades.push({
          id: `upgrade_${upgradeId}`,
          name: `${upgradePrefixes[prefixIndex]} ${upgradeSuffixes[suffixIndex]}`,
          description: `Tier ${tier} ${category} upgrade level ${i + 1}. Enhances ${category} capabilities significantly.`,
          category: category,
          tier: tier,
          baseCost: {
            dna: baseDnaCost,
            energy: baseEnergyCost
          },
          costScaling: tier > 10 ? "exponential" : tier > 5 ? "quadratic" : "linear",
          costMultiplier: costMultiplier,
          maxLevel: maxLevel,
          effect: {
            type: effectTypes[effectIndex],
            value: parseFloat((0.05 * tier * (1 + i * 0.2)).toFixed(3)),
            scaling: effectIndex % 2 === 0 ? "additive" : "multiplicative"
          },
          prerequisites: upgradeId > 1 ? [`upgrade_${upgradeId - 1}`] : [],
          unlockStage: Math.min(tier * 5, 100),
          icon: `icon_upgrade_${upgradeId}`,
          flavorText: `Evolution finds a way. Upgrade ${upgradeId} in the endless journey of life.`
        });
      }
    }
  }
  
  // Add special unique upgrades
  const uniqueUpgrades = [
    {
      id: "endosymbiosis_event",
      name: "Endosymbiosis Event",
      description: "Engulf another organism to gain mitochondria - a once-in-evolution opportunity.",
      category: "special",
      tier: 7,
      baseCost: { dna: 1000000, energy: 500000 },
      costScaling: "fixed",
      costMultiplier: 1,
      maxLevel: 1,
      effect: {
        type: "unlock_eukaryotic",
        value: 10,
        scaling: "unique"
      },
      prerequisites: ["basic_absorption", "enzyme_production", "membrane_efficiency"],
      unlockStage: 7,
      icon: "endosymbiosis",
      flavorText: "Some mergers change everything."
    },
    {
      id: "oxygen_catastrophe",
      name: "Oxygen Catastrophe",
      description: "Trigger global oxygenation - devastating for anaerobes, revolutionary for the future.",
      category: "global_event",
      tier: 6,
      baseCost: { dna: 500000, energy: 250000 },
      costScaling: "fixed",
      costMultiplier: 1,
      maxLevel: 1,
      effect: {
        type: "atmosphere_change",
        value: 5,
        scaling: "unique"
      },
      prerequisites: ["enzyme_production"],
      unlockStage: 6,
      icon: "oxygen_event",
      flavorText: "Pollution becomes progress."
    },
    {
      id: "cambrian_explosion",
      name: "Cambrian Explosion",
      description: "Accelerate evolution dramatically - new body plans emerge rapidly.",
      category: "global_event",
      tier: 11,
      baseCost: { dna: 5000000, energy: 2000000 },
      costScaling: "fixed",
      costMultiplier: 1,
      maxLevel: 1,
      effect: {
        type: "evolution_acceleration",
        value: 10,
        scaling: "unique"
      },
      prerequisites: ["upgrade_45", "upgrade_46", "upgrade_47"],
      unlockStage: 11,
      icon: "cambrian_explosion",
      flavorText: "Life explodes in diversity."
    },
    {
      id: "mass_extinction_survival",
      name: "Mass Extinction Survival",
      description: "Develop traits to survive global catastrophes - persistence over perfection.",
      category: "survival",
      tier: 19,
      baseCost: { dna: 5000000000, energy: 2000000000 },
      costScaling: "fixed",
      costMultiplier: 1,
      maxLevel: 1,
      effect: {
        type: "extinction_resistance",
        value: 100,
        scaling: "unique"
      },
      prerequisites: ["upgrade_180", "upgrade_181"],
      unlockStage: 19,
      icon: "extinction_proof",
      flavorText: "It's not the strongest who survive, but the most adaptable."
    },
    {
      id: "intelligence_awakening",
      name: "Intelligence Awakening",
      description: "The spark of consciousness - self-awareness emerges.",
      category: "cognition",
      tier: 75,
      baseCost: { dna: 1e15, energy: 5e14 },
      costScaling: "fixed",
      costMultiplier: 1,
      maxLevel: 1,
      effect: {
        type: "consciousness_unlock",
        value: 1000,
        scaling: "unique"
      },
      prerequisites: ["upgrade_400", "upgrade_401", "upgrade_402"],
      unlockStage: 75,
      icon: "intelligence",
      flavorText: "The universe becomes aware of itself."
    }
  ];
  
  upgrades.push(...uniqueUpgrades);
  
  return upgrades;
}

export const completeUpgradesDatabase = generateCompleteUpgrades();

export default completeUpgradesDatabase;
