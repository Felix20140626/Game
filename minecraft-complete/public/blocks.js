// 方块类型定义 - Minecraft v26.1
const BlockTypes = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    SAND: 6,
    WATER: 7,
    BRICK: 8,
    GLASS: 9,
    COAL_ORE: 10,
    IRON_ORE: 11,
    GOLD_ORE: 12,
    DIAMOND_ORE: 13,
    BEDROCK: 14,
    PLANKS: 15,
    COBBLESTONE: 16,
    MOSSY_COBBLESTONE: 17,
    OBSIDIAN: 18,
    SNOW: 19,
    ICE: 20,
    CLAY: 21,
    GRAVEL: 22,
    NETHERRACK: 23,
    SOUL_SAND: 24,
    GLOWSTONE: 25,
    END_STONE: 26
};

// 方块属性配置
const BlockProperties = {
    [BlockTypes.AIR]: { name: '空气', transparent: true, solid: false, hardness: 0 },
    [BlockTypes.GRASS]: { name: '草方块', transparent: false, solid: true, hardness: 0.6 },
    [BlockTypes.DIRT]: { name: '泥土', transparent: false, solid: true, hardness: 0.5 },
    [BlockTypes.STONE]: { name: '石头', transparent: false, solid: true, hardness: 1.5 },
    [BlockTypes.WOOD]: { name: '原木', transparent: false, solid: true, hardness: 2.0 },
    [BlockTypes.LEAVES]: { name: '树叶', transparent: true, solid: true, hardness: 0.2 },
    [BlockTypes.SAND]: { name: '沙子', transparent: false, solid: true, hardness: 0.5 },
    [BlockTypes.WATER]: { name: '水', transparent: true, solid: false, hardness: 100 },
    [BlockTypes.BRICK]: { name: '砖块', transparent: false, solid: true, hardness: 2.0 },
    [BlockTypes.GLASS]: { name: '玻璃', transparent: true, solid: true, hardness: 0.3 },
    [BlockTypes.COAL_ORE]: { name: '煤矿石', transparent: false, solid: true, hardness: 3.0 },
    [BlockTypes.IRON_ORE]: { name: '铁矿石', transparent: false, solid: true, hardness: 3.0 },
    [BlockTypes.GOLD_ORE]: { name: '金矿石', transparent: false, solid: true, hardness: 3.0 },
    [BlockTypes.DIAMOND_ORE]: { name: '钻石矿', transparent: false, solid: true, hardness: 3.0 },
    [BlockTypes.BEDROCK]: { name: '基岩', transparent: false, solid: true, hardness: -1 }, // 不可破坏
    [BlockTypes.PLANKS]: { name: '木板', transparent: false, solid: true, hardness: 2.0 },
    [BlockTypes.COBBLESTONE]: { name: '圆石', transparent: false, solid: true, hardness: 2.0 },
    [BlockTypes.MOSSY_COBBLESTONE]: { name: '苔石', transparent: false, solid: true, hardness: 2.0 },
    [BlockTypes.OBSIDIAN]: { name: '黑曜石', transparent: false, solid: true, hardness: 50 },
    [BlockTypes.SNOW]: { name: '雪', transparent: false, solid: true, hardness: 0.2 },
    [BlockTypes.ICE]: { name: '冰', transparent: true, solid: true, hardness: 0.5 },
    [BlockTypes.CLAY]: { name: '粘土', transparent: false, solid: true, hardness: 0.6 },
    [BlockTypes.GRAVEL]: { name: '沙砾', transparent: false, solid: true, hardness: 0.6 },
    [BlockTypes.NETHERRACK]: { name: '地狱岩', transparent: false, solid: true, hardness: 0.4 },
    [BlockTypes.SOUL_SAND]: { name: '灵魂沙', transparent: false, solid: true, hardness: 0.5 },
    [BlockTypes.GLOWSTONE]: { name: '荧石', transparent: false, solid: true, hardness: 0.3, light: 15 },
    [BlockTypes.END_STONE]: { name: '末地石', transparent: false, solid: true, hardness: 3.0 }
};

// 方块颜色配置（用于简单渲染）
const BlockColors = {
    [BlockTypes.AIR]: null,
    [BlockTypes.GRASS]: 0x567d46,
    [BlockTypes.DIRT]: 0x8b5a2b,
    [BlockTypes.STONE]: 0x808080,
    [BlockTypes.WOOD]: 0x654321,
    [BlockTypes.LEAVES]: 0x228b22,
    [BlockTypes.SAND]: 0xf4e4bc,
    [BlockTypes.WATER]: 0x4169e1,
    [BlockTypes.BRICK]: 0xb22222,
    [BlockTypes.GLASS]: 0xadd8e6,
    [BlockTypes.COAL_ORE]: 0x2f2f2f,
    [BlockTypes.IRON_ORE]: 0xd2b48c,
    [BlockTypes.GOLD_ORE]: 0xffd700,
    [BlockTypes.DIAMOND_ORE]: 0x00ffff,
    [BlockTypes.BEDROCK]: 0x1a1a1a,
    [BlockTypes.PLANKS]: 0xa0522d,
    [BlockTypes.COBBLESTONE]: 0x696969,
    [BlockTypes.MOSSY_COBBLESTONE]: 0x556b2f,
    [BlockTypes.OBSIDIAN]: 0x0f0f0f,
    [BlockTypes.SNOW]: 0xfffafa,
    [BlockTypes.ICE]: 0xafeeee,
    [BlockTypes.CLAY]: 0xe0c0a0,
    [BlockTypes.GRAVEL]: 0x808080,
    [BlockTypes.NETHERRACK]: 0x8b0000,
    [BlockTypes.SOUL_SAND]: 0x5c4033,
    [BlockTypes.GLOWSTONE]: 0xffff99,
    [BlockTypes.END_STONE]: 0xf5deb3
};

// 方块纹理 UV 坐标（简化版，实际项目中可以使用真实纹理）
const BlockTextures = {
    [BlockTypes.GRASS]: { top: 'grass_top', side: 'grass_side', bottom: 'dirt' },
    [BlockTypes.DIRT]: { all: 'dirt' },
    [BlockTypes.STONE]: { all: 'stone' },
    [BlockTypes.WOOD]: { side: 'log_side', top: 'log_top', bottom: 'log_top' },
    [BlockTypes.LEAVES]: { all: 'leaves' },
    [BlockTypes.SAND]: { all: 'sand' },
    [BlockTypes.BRICK]: { all: 'brick' },
    [BlockTypes.GLASS]: { all: 'glass' },
    [BlockTypes.COAL_ORE]: { all: 'coal_ore' },
    [BlockTypes.IRON_ORE]: { all: 'iron_ore' },
    [BlockTypes.GOLD_ORE]: { all: 'gold_ore' },
    [BlockTypes.DIAMOND_ORE]: { all: 'diamond_ore' },
    [BlockTypes.BEDROCK]: { all: 'bedrock' },
    [BlockTypes.PLANKS]: { all: 'planks' },
    [BlockTypes.COBBLESTONE]: { all: 'cobblestone' },
    [BlockTypes.MOSSY_COBBLESTONE]: { all: 'mossy_cobblestone' },
    [BlockTypes.OBSIDIAN]: { all: 'obsidian' },
    [BlockTypes.SNOW]: { all: 'snow' },
    [BlockTypes.ICE]: { all: 'ice' },
    [BlockTypes.CLAY]: { all: 'clay' },
    [BlockTypes.GRAVEL]: { all: 'gravel' },
    [BlockTypes.NETHERRACK]: { all: 'netherrack' },
    [BlockTypes.SOUL_SAND]: { all: 'soul_sand' },
    [BlockTypes.GLOWSTONE]: { all: 'glowstone' },
    [BlockTypes.END_STONE]: { all: 'end_stone' }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BlockTypes,
        BlockProperties,
        BlockColors,
        BlockTextures
    };
}
