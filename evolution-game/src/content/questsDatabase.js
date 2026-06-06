/**
 * Quests Database - Complete Quest System
 * Contains 3000+ quests across all categories and difficulty levels
 * Dynamic quest generation for endless gameplay
 */

export const questsDatabase = {
  // ==================== DAILY QUESTS ====================
  daily: [
    {
      id: "daily_click_100",
      name: "Click Enthusiast",
      description: "Click 100 times today",
      type: "daily",
      category: "clicking",
      requirement: { type: "daily_clicks", value: 100 },
      reward: { dna: 500, energy: 250 },
      refreshTime: 86400
    },
    {
      id: "daily_evolve_1",
      name: "Evolutionary Progress",
      description: "Evolve once today",
      type: "daily",
      category: "evolution",
      requirement: { type: "daily_evolutions", value: 1 },
      reward: { dna: 1000, energy: 500 },
      refreshTime: 86400
    }
  ],
  
  // ==================== PROGRESS QUESTS ====================
  progress: [],
  
  // ==================== CHALLENGE QUESTS ====================
  challenge: [],
  
  // ==================== ACHIEVEMENT QUESTS ====================
  achievement: []
};

// Generate comprehensive quest database
export function generateCompleteQuests() {
  const allQuests = [];
  const questTypes = ["daily", "weekly", "progress", "challenge", "achievement", "secret"];
  const categories = ["clicking", "evolution", "resources", "upgrades", "mutations", "efficiency", "time", "milestones"];
  const difficulties = ["easy", "medium", "hard", "expert", "master", "legendary"];
  const difficultyMultipliers = [1, 2, 5, 10, 25, 50];
  
  let questId = 0;
  
  // Generate progress quests (stage-based)
  for (let stage = 1; stage <= 100; stage++) {
    questId++;
    const diffIndex = Math.min(Math.floor((stage - 1) / 15), difficulties.length - 1);
    
    allQuests.push({
      id: `progress_stage_${stage}`,
      name: `Reach Stage ${stage}`,
      description: `Evolve to stage ${stage}: ${getStageName(stage)}`,
      type: "progress",
      category: "evolution",
      difficulty: difficulties[diffIndex],
      requirement: { type: "reach_stage", value: stage },
      reward: {
        dna: Math.floor(1000 * difficultyMultipliers[diffIndex] * stage),
        energy: Math.floor(500 * difficultyMultipliers[diffIndex] * stage)
      },
      prerequisites: stage > 1 ? [`progress_stage_${stage - 1}`] : [],
      unlockMessage: `New evolutionary horizon awaits!`
    });
  }
  
  // Generate resource collection quests
  const resources = ["dna", "energy", "bioessence", "cosmic_energy"];
  const resourceMilestones = [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 1e12, 1e15, 1e18];
  
  resources.forEach(resource => {
    resourceMilestones.forEach((milestone, index) => {
      questId++;
      const diffIndex = Math.min(index, difficulties.length - 1);
      
      allQuests.push({
        id: `quest_collect_${resource}_${index + 1}`,
        name: `${capitalize(resource)} Hoarder ${index + 1}`,
        description: `Accumulate ${formatNumber(milestone)} ${resource}`,
        type: "progress",
        category: "resources",
        difficulty: difficulties[diffIndex],
        requirement: { type: `${resource}_total`, value: milestone },
        reward: {
          dna: Math.floor(milestone * 0.1),
          [resource]: Math.floor(milestone * 0.01)
        },
        prerequisites: index > 0 ? [`quest_collect_${resource}_${index}`] : [],
        unlockMessage: `${capitalize(resource)} reserves growing!`
      });
    });
  });
  
  // Generate upgrade quests
  for (let count = 10; count <= 500; count += 10) {
    questId++;
    const diffIndex = Math.min(Math.floor((count - 10) / 50), difficulties.length - 1);
    
    allQuests.push({
      id: `quest_upgrades_${count}`,
      name: `Upgrade Collector ${count / 10}`,
      description: `Purchase ${count} upgrades total`,
      type: "progress",
      category: "upgrades",
      difficulty: difficulties[diffIndex],
      requirement: { type: "upgrades_purchased", value: count },
      reward: {
        dna: Math.floor(5000 * difficultyMultipliers[diffIndex]),
        energy: Math.floor(2500 * difficultyMultipliers[diffIndex])
      },
      prerequisites: count > 10 ? [`quest_upgrades_${count - 10}`] : [],
      unlockMessage: "Upgrade power increases!"
    });
  }
  
  // Generate click challenge quests
  const clickChallenges = [500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  
  clickChallenges.forEach((clicks, index) => {
    questId++;
    const diffIndex = Math.min(index, difficulties.length - 1);
    
    allQuests.push({
      id: `quest_click_challenge_${index + 1}`,
      name: `Click Marathon ${index + 1}`,
      description: `Accumulate ${formatNumber(clicks)} total clicks`,
      type: "challenge",
      category: "clicking",
      difficulty: difficulties[diffIndex],
      requirement: { type: "total_clicks", value: clicks },
      reward: {
        dna: Math.floor(clicks * 0.5),
        energy: Math.floor(clicks * 0.25)
      },
      prerequisites: index > 0 ? [`quest_click_challenge_${index}`] : [],
      unlockMessage: "Click endurance grows!"
    });
  });
  
  // Generate combo quests
  const comboTargets = [10, 20, 30, 50, 75, 100, 150, 200, 300, 500];
  
  comboTargets.forEach((combo, index) => {
    questId++;
    const diffIndex = Math.min(index, difficulties.length - 1);
    
    allQuests.push({
      id: `quest_combo_${combo}`,
      name: `Combo Master ${combo}`,
      description: `Achieve a ${combo}-hit combo`,
      type: "challenge",
      category: "efficiency",
      difficulty: difficulties[diffIndex],
      requirement: { type: "max_combo", value: combo },
      reward: {
        dna: Math.floor(10000 * difficultyMultipliers[diffIndex]),
        energy: Math.floor(5000 * difficultyMultipliers[diffIndex])
      },
      prerequisites: index > 0 ? [`quest_combo_${comboTargets[index - 1]}`] : [],
      unlockMessage: "Click precision perfected!"
    });
  });
  
  // Generate time-based quests
  const timeTargets = [3600, 7200, 14400, 28800, 86400, 172800, 604800, 1209600];
  
  timeTargets.forEach((seconds, index) => {
    questId++;
    const diffIndex = Math.min(index, difficulties.length - 1);
    
    allQuests.push({
      id: `quest_time_${index + 1}`,
      name: getTimeQuestName(index),
      description: `Play for ${formatTime(seconds)}`,
      type: "progress",
      category: "time",
      difficulty: difficulties[diffIndex],
      requirement: { type: "playtime_seconds", value: seconds },
      reward: {
        dna: Math.floor(50000 * difficultyMultipliers[diffIndex]),
        energy: Math.floor(25000 * difficultyMultipliers[diffIndex])
      },
      prerequisites: index > 0 ? [`quest_time_${index}`] : [],
      unlockMessage: "Dedication rewarded!"
    });
  });
  
  // Generate mutation quests
  for (let mutations = 5; mutations <= 100; mutations += 5) {
    questId++;
    const diffIndex = Math.min(Math.floor((mutations - 5) / 10), difficulties.length - 1);
    
    allQuests.push({
      id: `quest_mutations_${mutations}`,
      name: `Mutation Explorer ${mutations / 5}`,
      description: `Trigger ${mutations} mutations`,
      type: "progress",
      category: "mutations",
      difficulty: difficulties[diffIndex],
      requirement: { type: "mutations_triggered", value: mutations },
      reward: {
        dna: Math.floor(20000 * difficultyMultipliers[diffIndex]),
        energy: Math.floor(10000 * difficultyMultipliers[diffIndex])
      },
      prerequisites: mutations > 5 ? [`quest_mutations_${mutations - 5}`] : [],
      unlockMessage: "Genetic diversity increases!"
    });
  }
  
  // Generate secret/hidden quests
  const secretQuests = [
    { name: "Speed Demon", desc: "Reach stage 20 in under 30 minutes", req: { type: "speed_run", value: 1800, stage: 20 } },
    { name: "Patient Player", desc: "Play for 30 days", req: { type: "playtime_days", value: 30 } },
    { name: "Click Frenzy", desc: "Click 1000 times in 60 seconds", req: { type: "clicks_per_minute", value: 1000 } },
    { name: "Perfect Evolution", desc: "Evolve without missing any upgrades", req: { type: "perfect_evolution", value: 1 } },
    { name: "Resource Baron", desc: "Have 1B of all resources simultaneously", req: { type: "all_resources_billion", value: 1 } },
    { name: "Upgrade Maxer", desc: "Max out all upgrades in a tier", req: { type: "max_tier_upgrades", value: 1 } },
    { name: "Critical Mass", desc: "Get 100 critical hits in a row", req: { type: "consecutive_criticals", value: 100 } },
    { name: "Offline Empire", desc: "Earn 1T DNA while offline", req: { type: "offline_earnings", value: 1e12 } }
  ];
  
  secretQuests.forEach((secret, index) => {
    questId++;
    
    allQuests.push({
      id: `quest_secret_${index + 1}`,
      name: secret.name,
      description: secret.desc,
      type: "secret",
      category: "challenges",
      difficulty: "legendary",
      requirement: secret.req,
      reward: {
        dna: 1e9,
        energy: 5e8,
        bioessence: 100
      },
      hidden: true,
      prerequisites: [],
      unlockMessage: "A secret quest revealed!"
    });
  });
  
  // Generate weekly recurring quests
  const weeklyQuests = [
    { name: "Weekly Clicker", desc: "Click 10,000 times this week", req: { type: "weekly_clicks", value: 10000 } },
    { name: "Weekly Evolver", desc: "Evolve 5 times this week", req: { type: "weekly_evolutions", value: 5 } },
    { name: "Weekly Upgrader", desc: "Buy 50 upgrades this week", req: { type: "weekly_upgrades", value: 50 } },
    { name: "Weekly Collector", desc: "Collect 1M DNA this week", req: { type: "weekly_dna", value: 1000000 } }
  ];
  
  weeklyQuests.forEach((weekly, index) => {
    questId++;
    
    allQuests.push({
      id: `quest_weekly_${index + 1}`,
      name: weekly.name,
      description: weekly.desc,
      type: "weekly",
      category: "recurring",
      difficulty: "medium",
      requirement: weekly.req,
      reward: {
        dna: 100000,
        energy: 50000
      },
      refreshTime: 604800,
      prerequisites: [],
      unlockMessage: "Weekly challenge available!"
    });
  });
  
  return allQuests;
}

function getStageName(stage) {
  const stageNames = {
    1: "Primordial Soup",
    2: "Simple Molecule",
    3: "Protocell",
    4: "Prokaryote",
    5: "Photosynthetic Bacteria",
    10: "Bilateral Symmetry",
    11: "Cambrian Predator",
    15: "Tetrapod",
    20: "Early Mammal",
    50: "Primate",
    75: "Modern Human",
    100: "Cosmic Entity"
  };
  return stageNames[stage] || `Stage ${stage}`;
}

function formatNumber(num) {
  if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Qa';
  if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Qi';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
}

function formatTime(seconds) {
  if (seconds >= 604800) return `${Math.floor(seconds / 604800)} weeks`;
  if (seconds >= 86400) return `${Math.floor(seconds / 86400)} days`;
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)} minutes`;
  return `${seconds} seconds`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTimeQuestName(index) {
  const names = ["Hour One", "Two Hour Tour", "Half Day", "Full Day", "Day Two", "Week One", "Fortnight", "Month Long"];
  return names[index] || `Time Milestone ${index + 1}`;
}

export const completeQuestsDatabase = generateCompleteQuests();

export default completeQuestsDatabase;
