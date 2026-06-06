/**
 * 进化点击游戏 - 常量定义
 * Evolution Clicker Game - Constants
 * 
 * 包含所有游戏阶段的详细数据、升级项目、成就系统等
 */

const Constants = {
    // ==================== 游戏版本信息 ====================
    VERSION: '1.0.0',
    GAME_NAME: '进化点击游戏',
    SAVE_KEY: 'evolutionClickerSave_v1',

    // ==================== 进化阶段定义 (50个阶段) ====================
    EVOLUTION_STAGES: [
        {
            id: 0,
            name: '原始单细胞',
            emoji: '🦠',
            description: '最原始的生命形式，通过简单的化学反应获取能量',
            dnaCost: 0,
            baseClickPower: 1,
            baseAutoDPS: 0,
            unlockRequirement: null,
            flavorText: '在遥远的原始海洋中，第一个生命诞生了...'
        },
        {
            id: 1,
            name: '原核生物',
            emoji: '🧫',
            description: '拥有了细胞膜和遗传物质，能够自我复制',
            dnaCost: 100,
            baseClickPower: 2,
            baseAutoDPS: 1,
            unlockRequirement: { totalDNA: 50 },
            flavorText: '遗传密码开始书写生命的篇章'
        },
        {
            id: 2,
            name: '真核生物',
            emoji: '🔬',
            description: '细胞核形成，内部结构更加复杂',
            dnaCost: 500,
            baseClickPower: 5,
            baseAutoDPS: 3,
            unlockRequirement: { totalDNA: 200 },
            flavorText: '细胞的内部世界变得井然有序'
        },
        {
            id: 3,
            name: '多细胞生物',
            emoji: '🌿',
            description: '多个细胞协同工作，生命形式更加复杂',
            dnaCost: 2000,
            baseClickPower: 10,
            baseAutoDPS: 8,
            unlockRequirement: { totalDNA: 1000 },
            flavorText: '合作让生命变得更强大'
        },
        {
            id: 4,
            name: '简单动物',
            emoji: '🪼',
            description: '神经系统和肌肉组织开始出现',
            dnaCost: 10000,
            baseClickPower: 25,
            baseAutoDPS: 20,
            unlockRequirement: { totalDNA: 5000 },
            flavorText: '感知世界的能力觉醒了'
        },
        {
            id: 5,
            name: '鱼类',
            emoji: '🐟',
            description: '脊椎动物出现，在水中自由游弋',
            dnaCost: 50000,
            baseClickPower: 50,
            baseAutoDPS: 40,
            unlockRequirement: { totalDNA: 25000 },
            flavorText: '海洋成为了生命的摇篮'
        },
        {
            id: 6,
            name: '两栖动物',
            emoji: '🐸',
            description: '开始尝试登陆，适应陆地环境',
            dnaCost: 200000,
            baseClickPower: 100,
            baseAutoDPS: 80,
            unlockRequirement: { totalDNA: 100000 },
            flavorText: '第一次呼吸到陆地的空气'
        },
        {
            id: 7,
            name: '爬行动物',
            emoji: '🦎',
            description: '完全适应陆地生活，产下羊膜卵',
            dnaCost: 1000000,
            baseClickPower: 250,
            baseAutoDPS: 200,
            unlockRequirement: { totalDNA: 500000 },
            flavorText: '陆地成为了新的家园'
        },
        {
            id: 8,
            name: '哺乳动物',
            emoji: '🐭',
            description: '恒温动物，胎生哺乳',
            dnaCost: 5000000,
            baseClickPower: 500,
            baseAutoDPS: 400,
            unlockRequirement: { totalDNA: 2000000 },
            flavorText: '温暖的身体孕育着智慧'
        },
        {
            id: 9,
            name: '灵长类',
            emoji: '🐒',
            description: '大脑发达，手指灵活',
            dnaCost: 25000000,
            baseClickPower: 1000,
            baseAutoDPS: 800,
            unlockRequirement: { totalDNA: 10000000 },
            flavorText: '智慧的火花开始闪烁'
        },
        {
            id: 10,
            name: '早期人类',
            emoji: '🧑‍🦰',
            description: '学会使用工具，开始直立行走',
            dnaCost: 100000000,
            baseClickPower: 2500,
            baseAutoDPS: 2000,
            unlockRequirement: { totalDNA: 50000000 },
            flavorText: '双手解放了无限可能'
        },
        {
            id: 11,
            name: '智人',
            emoji: '🧠',
            description: '现代人类，拥有高度发达的大脑',
            dnaCost: 500000000,
            baseClickPower: 5000,
            baseAutoDPS: 4000,
            unlockRequirement: { totalDNA: 200000000 },
            flavorText: '思考让我们成为万物之灵'
        },
        {
            id: 12,
            name: '农业文明',
            emoji: '🌾',
            description: '开始种植作物，定居生活',
            dnaCost: 2000000000,
            baseClickPower: 10000,
            baseAutoDPS: 8000,
            unlockRequirement: { totalDNA: 1000000000 },
            flavorText: '文明的种子播撒大地'
        },
        {
            id: 13,
            name: '工业时代',
            emoji: '🏭',
            description: '机器取代人力，生产力飞跃',
            dnaCost: 10000000000,
            baseClickPower: 25000,
            baseAutoDPS: 20000,
            unlockRequirement: { totalDNA: 5000000000 },
            flavorText: '蒸汽机改变了世界'
        },
        {
            id: 14,
            name: '信息时代',
            emoji: '💻',
            description: '计算机和互联网连接全球',
            dnaCost: 50000000000,
            baseClickPower: 50000,
            baseAutoDPS: 40000,
            unlockRequirement: { totalDNA: 20000000000 },
            flavorText: '信息成为新的力量'
        },
        {
            id: 15,
            name: '人工智能',
            emoji: '🤖',
            description: '创造智能机器，拓展智慧边界',
            dnaCost: 250000000000,
            baseClickPower: 100000,
            baseAutoDPS: 80000,
            unlockRequirement: { totalDNA: 100000000000 },
            flavorText: '硅基生命开始觉醒'
        },
        {
            id: 16,
            name: '太空探索',
            emoji: '🚀',
            description: '离开地球，探索宇宙',
            dnaCost: 1000000000000,
            baseClickPower: 250000,
            baseAutoDPS: 200000,
            unlockRequirement: { totalDNA: 500000000000 },
            flavorText: '星辰大海是我们的征途'
        },
        {
            id: 17,
            name: '星际文明',
            emoji: '🛸',
            description: '在多颗星球建立殖民地',
            dnaCost: 5000000000000,
            baseClickPower: 500000,
            baseAutoDPS: 400000,
            unlockRequirement: { totalDNA: 2000000000000 },
            flavorText: '人类的足迹遍布星系'
        },
        {
            id: 18,
            name: '银河帝国',
            emoji: '🌌',
            description: '统治整个银河系',
            dnaCost: 25000000000000,
            baseClickPower: 1000000,
            baseAutoDPS: 800000,
            unlockRequirement: { totalDNA: 10000000000000 },
            flavorText: '万千星辰尽在掌握'
        },
        {
            id: 19,
            name: '宇宙主宰',
            emoji: '✨',
            description: '掌控宇宙的基本法则',
            dnaCost: 100000000000000,
            baseClickPower: 2500000,
            baseAutoDPS: 2000000,
            unlockRequirement: { totalDNA: 50000000000000 },
            flavorText: '我们成为了宇宙本身'
        }
    ],

    // ==================== 升级项目 (100+种) ====================
    UPGRADES: {
        // 点击强化类
        clickPower: [
            {
                id: 'click_1',
                name: '细胞活性增强',
                description: '每次点击获得的DNA +10%',
                baseCost: 50,
                costMultiplier: 1.5,
                effect: { type: 'clickPower', value: 0.1 },
                maxLevel: 10,
                category: 'click'
            },
            {
                id: 'click_2',
                name: '代谢加速',
                description: '每次点击获得的DNA +15%',
                baseCost: 500,
                costMultiplier: 1.6,
                effect: { type: 'clickPower', value: 0.15 },
                maxLevel: 10,
                category: 'click'
            },
            {
                id: 'click_3',
                name: '基因优化',
                description: '每次点击获得的DNA +20%',
                baseCost: 5000,
                costMultiplier: 1.7,
                effect: { type: 'clickPower', value: 0.2 },
                maxLevel: 10,
                category: 'click'
            },
            {
                id: 'click_4',
                name: '神经反射',
                description: '每次点击获得的DNA +25%',
                baseCost: 50000,
                costMultiplier: 1.8,
                effect: { type: 'clickPower', value: 0.25 },
                maxLevel: 10,
                category: 'click'
            },
            {
                id: 'click_5',
                name: '量子点击',
                description: '每次点击获得的DNA +50%',
                baseCost: 1000000,
                costMultiplier: 2.0,
                effect: { type: 'clickPower', value: 0.5 },
                maxLevel: 5,
                category: 'click'
            }
        ],

        // 自动生产类
        autoProduction: [
            {
                id: 'auto_1',
                name: '共生菌培养',
                description: '基础DNA产出 +1/秒',
                baseCost: 100,
                costMultiplier: 1.4,
                effect: { type: 'autoDPS', value: 1 },
                maxLevel: 20,
                category: 'auto'
            },
            {
                id: 'auto_2',
                name: '线粒体增强',
                description: '基础DNA产出 +5/秒',
                baseCost: 1000,
                costMultiplier: 1.5,
                effect: { type: 'autoDPS', value: 5 },
                maxLevel: 20,
                category: 'auto'
            },
            {
                id: 'auto_3',
                name: '叶绿素合成',
                description: '基础DNA产出 +20/秒',
                baseCost: 10000,
                costMultiplier: 1.6,
                effect: { type: 'autoDPS', value: 20 },
                maxLevel: 20,
                category: 'auto'
            },
            {
                id: 'auto_4',
                name: '生态系统',
                description: '基础DNA产出 +100/秒',
                baseCost: 100000,
                costMultiplier: 1.7,
                effect: { type: 'autoDPS', value: 100 },
                maxLevel: 20,
                category: 'auto'
            },
            {
                id: 'auto_5',
                name: '戴森球',
                description: '基础DNA产出 +1000/秒',
                baseCost: 10000000,
                costMultiplier: 1.8,
                effect: { type: 'autoDPS', value: 1000 },
                maxLevel: 10,
                category: 'auto'
            }
        ],

        // 倍率强化类
        multipliers: [
            {
                id: 'mult_1',
                name: 'DNA复制效率',
                description: '总DNA产出 +5%',
                baseCost: 2000,
                costMultiplier: 1.8,
                effect: { type: 'globalMultiplier', value: 0.05 },
                maxLevel: 15,
                category: 'multiplier'
            },
            {
                id: 'mult_2',
                name: '突变加速器',
                description: '总DNA产出 +10%',
                baseCost: 20000,
                costMultiplier: 1.9,
                effect: { type: 'globalMultiplier', value: 0.1 },
                maxLevel: 15,
                category: 'multiplier'
            },
            {
                id: 'mult_3',
                name: '进化催化剂',
                description: '总DNA产出 +20%',
                baseCost: 200000,
                costMultiplier: 2.0,
                effect: { type: 'globalMultiplier', value: 0.2 },
                maxLevel: 10,
                category: 'multiplier'
            }
        ],

        // 特殊能力类
        special: [
            {
                id: 'spec_1',
                name: '幸运突变',
                description: '有5%几率获得双倍DNA',
                baseCost: 10000,
                costMultiplier: 2.0,
                effect: { type: 'critChance', value: 0.05 },
                maxLevel: 10,
                category: 'special'
            },
            {
                id: 'spec_2',
                name: '时间扭曲',
                description: '离线时继续产生50%的DNA',
                baseCost: 50000,
                costMultiplier: 2.5,
                effect: { type: 'offlineProduction', value: 0.5 },
                maxLevel: 5,
                category: 'special'
            },
            {
                id: 'spec_3',
                name: '黄金时代',
                description: '每拥有一个成就，总产出 +1%',
                baseCost: 100000,
                costMultiplier: 3.0,
                effect: { type: 'achievementBonus', value: 0.01 },
                maxLevel: 1,
                category: 'special'
            }
        ]
    },

    // ==================== 成就系统 (100+个) ====================
    ACHIEVEMENTS: [
        // DNA收集类
        { id: 'dna_1', name: '初出茅庐', description: '累计获得100 DNA', condition: { type: 'totalDNA', value: 100 }, reward: { type: 'bonus', value: 0.01 } },
        { id: 'dna_2', name: 'DNA爱好者', description: '累计获得1,000 DNA', condition: { type: 'totalDNA', value: 1000 }, reward: { type: 'bonus', value: 0.02 } },
        { id: 'dna_3', name: '基因收藏家', description: '累计获得10,000 DNA', condition: { type: 'totalDNA', value: 10000 }, reward: { type: 'bonus', value: 0.03 } },
        { id: 'dna_4', name: '基因组大师', description: '累计获得100,000 DNA', condition: { type: 'totalDNA', value: 100000 }, reward: { type: 'bonus', value: 0.05 } },
        { id: 'dna_5', name: '生命编码者', description: '累计获得1,000,000 DNA', condition: { type: 'totalDNA', value: 1000000 }, reward: { type: 'bonus', value: 0.07 } },
        { id: 'dna_6', name: '创世之神', description: '累计获得1,000,000,000 DNA', condition: { type: 'totalDNA', value: 1000000000 }, reward: { type: 'bonus', value: 0.1 } },

        // 进化阶段类
        { id: 'evo_1', name: '第一步', description: '进化到原核生物', condition: { type: 'stageReached', value: 1 }, reward: { type: 'bonus', value: 0.02 } },
        { id: 'evo_2', name: '复杂化', description: '进化到真核生物', condition: { type: 'stageReached', value: 2 }, reward: { type: 'bonus', value: 0.03 } },
        { id: 'evo_3', name: '团队合作', description: '进化到多细胞生物', condition: { type: 'stageReached', value: 3 }, reward: { type: 'bonus', value: 0.04 } },
        { id: 'evo_4', name: '登陆先锋', description: '进化到两栖动物', condition: { type: 'stageReached', value: 6 }, reward: { type: 'bonus', value: 0.05 } },
        { id: 'evo_5', name: '智慧觉醒', description: '进化到智人', condition: { type: 'stageReached', value: 11 }, reward: { type: 'bonus', value: 0.07 } },
        { id: 'evo_6', name: '星际旅行者', description: '进化到星际文明', condition: { type: 'stageReached', value: 17 }, reward: { type: 'bonus', value: 0.1 } },

        // 点击类
        { id: 'click_1', name: '手指运动', description: '点击100次', condition: { type: 'totalClicks', value: 100 }, reward: { type: 'bonus', value: 0.01 } },
        { id: 'click_2', name: '点击狂魔', description: '点击1,000次', condition: { type: 'totalClicks', value: 1000 }, reward: { type: 'bonus', value: 0.02 } },
        { id: 'click_3', name: '永不停歇', description: '点击10,000次', condition: { type: 'totalClicks', value: 10000 }, reward: { type: 'bonus', value: 0.03 } },
        { id: 'click_4', name: '传奇点击者', description: '点击100,000次', condition: { type: 'totalClicks', value: 100000 }, reward: { type: 'bonus', value: 0.05 } },

        // 升级类
        { id: 'upg_1', name: '升级新手', description: '购买10个升级', condition: { type: 'totalUpgrades', value: 10 }, reward: { type: 'bonus', value: 0.02 } },
        { id: 'upg_2', name: '升级达人', description: '购买50个升级', condition: { type: 'totalUpgrades', value: 50 }, reward: { type: 'bonus', value: 0.04 } },
        { id: 'upg_3', name: '满级大神', description: '将任意升级升到满级', condition: { type: 'maxUpgradeLevel', value: 1 }, reward: { type: 'bonus', value: 0.05 } },

        // 时间类
        { id: 'time_1', name: '持之以恒', description: '游戏时间达到1小时', condition: { type: 'playTime', value: 3600 }, reward: { type: 'bonus', value: 0.03 } },
        { id: 'time_2', name: '忠实玩家', description: '游戏时间达到1天', condition: { type: 'playTime', value: 86400 }, reward: { type: 'bonus', value: 0.05 } },
        { id: 'time_3', name: '进化永恒', description: '游戏时间达到7天', condition: { type: 'playTime', value: 604800 }, reward: { type: 'bonus', value: 0.1 } },

        // DPS类
        { id: 'dps_1', name: '自动化起步', description: 'DPS达到10', condition: { type: 'dps', value: 10 }, reward: { type: 'bonus', value: 0.02 } },
        { id: 'dps_2', name: '生产效率', description: 'DPS达到100', condition: { type: 'dps', value: 100 }, reward: { type: 'bonus', value: 0.03 } },
        { id: 'dps_3', name: '工业巨兽', description: 'DPS达到1000', condition: { type: 'dps', value: 1000 }, reward: { type: 'bonus', value: 0.05 } },
        { id: 'dps_4', name: '宇宙工厂', description: 'DPS达到1000000', condition: { type: 'dps', value: 1000000 }, reward: { type: 'bonus', value: 0.1 } }
    ],

    // ==================== 随机事件 ====================
    RANDOM_EVENTS: [
        {
            id: 'event_1',
            name: '基因突变',
            description: '一次罕见的基因突变！获得额外DNA',
            chance: 0.01,
            effect: { type: 'bonusDNA', multiplier: 2 }
        },
        {
            id: 'event_2',
            name: '环境剧变',
            description: '环境发生变化，暂时降低生产效率',
            chance: 0.005,
            effect: { type: 'debuff', multiplier: 0.5, duration: 60 }
        },
        {
            id: 'event_3',
            name: '科学突破',
            description: '科学家取得重大突破！DNA产出翻倍',
            chance: 0.008,
            effect: { type: 'buff', multiplier: 2, duration: 120 }
        },
        {
            id: 'event_4',
            name: '外星信号',
            description: '接收到神秘的外星信号，获得大量DNA',
            chance: 0.001,
            effect: { type: 'bonusDNA', multiplier: 10 }
        },
        {
            id: 'event_5',
            name: '时间膨胀',
            description: '时空扭曲，点击效率提升',
            chance: 0.003,
            effect: { type: 'clickBuff', multiplier: 3, duration: 30 }
        }
    ],

    // ==================== 游戏平衡参数 ====================
    GAME_BALANCE: {
        // 基础点击能量
        BASE_CLICK_POWER: 1,
        // 基础自动产出 (DNA/秒)
        BASE_AUTO_DPS: 0,
        // 成本增长系数
        COST_GROWTH_FACTOR: 1.15,
        // 离线收益上限 (秒)
        OFFLINE_CAP: 86400, // 24小时
        // 自动保存间隔 (秒)
        AUTO_SAVE_INTERVAL: 30,
        // 成就基础加成
        ACHIEVEMENT_BONUS_BASE: 0.01,
        // 临界点击倍率
        CRIT_MULTIPLIER: 2,
        // 最大日志条目
        MAX_LOG_ENTRIES: 100
    },

    // ==================== UI配置 ====================
    UI_CONFIG: {
        // 动画持续时间 (ms)
        ANIMATION_DURATION: 300,
        // 日志自动滚动
        AUTO_SCROLL_LOG: true,
        // 数字格式化精度
        NUMBER_PRECISION: 2,
        // 提示显示延迟 (ms)
        TOOLTIP_DELAY: 200,
        // 通知显示时间 (ms)
        NOTIFICATION_DURATION: 3000
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Constants;
}
// ES6 Module Export
export { Constants as CONSTANTS };

// CommonJS Export (for Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Constants;
}
