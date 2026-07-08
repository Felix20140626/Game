/**
 * 我的世界 v26.1 - 方块定义系统
 * 包含所有方块的属性、纹理和物理特性
 */

const BlockTypes = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    LOG_OAK: 4,
    LEAVES_OAK: 5,
    SAND: 6,
    BRICK: 7,
    GLASS: 8,
    PLANKS_OAK: 9,
    COBBLESTONE: 10,
    MOSSY_COBBLESTONE: 11,
    OBSIDIAN: 12,
    COAL_ORE: 13,
    IRON_ORE: 14,
    GOLD_ORE: 15,
    DIAMOND_ORE: 16,
    BEDROCK: 17,
    WATER: 18,
    SNOW: 19,
    ICE: 20,
    CLAY: 21,
    GRAVEL: 22,
    NETHERRACK: 23,
    SOUL_SAND: 24,
    GLOWSTONE: 25,
    END_STONE: 26
};

const BlockProperties = {
    [BlockTypes.AIR]: {
        name: "空气",
        transparent: true,
        solid: false,
        hardness: -1,
        color: null,
        texture: null
    },
    [BlockTypes.GRASS]: {
        name: "草方块",
        transparent: false,
        solid: true,
        hardness: 0.6,
        color: 0x5b8c38,
        topColor: 0x7cbb4f,
        sideColor: 0x8b6a45,
        bottomColor: 0x8b6a45,
        texture: "grass"
    },
    [BlockTypes.DIRT]: {
        name: "泥土",
        transparent: false,
        solid: true,
        hardness: 0.5,
        color: 0x8b6a45,
        texture: "dirt"
    },
    [BlockTypes.STONE]: {
        name: "石头",
        transparent: false,
        solid: true,
        hardness: 1.5,
        color: 0x808080,
        texture: "stone"
    },
    [BlockTypes.LOG_OAK]: {
        name: "橡木原木",
        transparent: false,
        solid: true,
        hardness: 2.0,
        color: 0x5c4033,
        sideColor: 0x5c4033,
        topColor: 0x8b6a45,
        bottomColor: 0x8b6a45,
        texture: "log_oak"
    },
    [BlockTypes.LEAVES_OAK]: {
        name: "橡树树叶",
        transparent: true,
        solid: true,
        hardness: 0.2,
        color: 0x3a5f0b,
        texture: "leaves_oak"
    },
    [BlockTypes.SAND]: {
        name: "沙子",
        transparent: false,
        solid: true,
        hardness: 0.5,
        color: 0xe6e288,
        texture: "sand"
    },
    [BlockTypes.BRICK]: {
        name: "砖块",
        transparent: false,
        solid: true,
        hardness: 2.0,
        color: 0xb05c38,
        texture: "brick"
    },
    [BlockTypes.GLASS]: {
        name: "玻璃",
        transparent: true,
        solid: true,
        hardness: 0.3,
        color: 0xffffff,
        opacity: 0.5,
        texture: "glass"
    },
    [BlockTypes.PLANKS_OAK]: {
        name: "橡木木板",
        transparent: false,
        solid: true,
        hardness: 2.0,
        color: 0xa0825a,
        texture: "planks_oak"
    },
    [BlockTypes.COBBLESTONE]: {
        name: "圆石",
        transparent: false,
        solid: true,
        hardness: 2.0,
        color: 0x6b6b6b,
        texture: "cobblestone"
    },
    [BlockTypes.MOSSY_COBBLESTONE]: {
        name: "苔石",
        transparent: false,
        solid: true,
        hardness: 2.0,
        color: 0x5a7a5a,
        texture: "mossy_cobblestone"
    },
    [BlockTypes.OBSIDIAN]: {
        name: "黑曜石",
        transparent: false,
        solid: true,
        hardness: 50.0,
        color: 0x1a1a2e,
        texture: "obsidian"
    },
    [BlockTypes.COAL_ORE]: {
        name: "煤矿石",
        transparent: false,
        solid: true,
        hardness: 3.0,
        color: 0x808080,
        oreColor: 0x2a2a2a,
        texture: "coal_ore"
    },
    [BlockTypes.IRON_ORE]: {
        name: "铁矿石",
        transparent: false,
        solid: true,
        hardness: 3.0,
        color: 0x808080,
        oreColor: 0xd4a574,
        texture: "iron_ore"
    },
    [BlockTypes.GOLD_ORE]: {
        name: "金矿石",
        transparent: false,
        solid: true,
        hardness: 3.0,
        color: 0x808080,
        oreColor: 0xffd700,
        texture: "gold_ore"
    },
    [BlockTypes.DIAMOND_ORE]: {
        name: "钻石矿",
        transparent: false,
        solid: true,
        hardness: 3.0,
        color: 0x808080,
        oreColor: 0x4deeea,
        texture: "diamond_ore"
    },
    [BlockTypes.BEDROCK]: {
        name: "基岩",
        transparent: false,
        solid: true,
        hardness: -1, // 不可破坏
        color: 0x2a2a2a,
        texture: "bedrock"
    },
    [BlockTypes.WATER]: {
        name: "水",
        transparent: true,
        solid: false,
        hardness: 100.0,
        color: 0x3060a0,
        opacity: 0.6,
        liquid: true,
        texture: "water"
    },
    [BlockTypes.SNOW]: {
        name: "雪",
        transparent: false,
        solid: true,
        hardness: 0.1,
        color: 0xffffff,
        texture: "snow"
    },
    [BlockTypes.ICE]: {
        name: "冰",
        transparent: true,
        solid: true,
        hardness: 0.5,
        color: 0xa0c0e0,
        opacity: 0.7,
        texture: "ice"
    },
    [BlockTypes.CLAY]: {
        name: "粘土",
        transparent: false,
        solid: true,
        hardness: 0.6,
        color: 0xc0c0c0,
        texture: "clay"
    },
    [BlockTypes.GRAVEL]: {
        name: "沙砾",
        transparent: false,
        solid: true,
        hardness: 0.6,
        color: 0x808080,
        texture: "gravel"
    },
    [BlockTypes.NETHERRACK]: {
        name: "地狱岩",
        transparent: false,
        solid: true,
        hardness: 0.4,
        color: 0x803030,
        texture: "netherrack"
    },
    [BlockTypes.SOUL_SAND]: {
        name: "灵魂沙",
        transparent: false,
        solid: true,
        hardness: 0.5,
        color: 0x5a4a3a,
        texture: "soul_sand"
    },
    [BlockTypes.GLOWSTONE]: {
        name: "荧石",
        transparent: false,
        solid: true,
        hardness: 0.3,
        color: 0xffd700,
        emissive: true,
        texture: "glowstone"
    },
    [BlockTypes.END_STONE]: {
        name: "末地石",
        transparent: false,
        solid: true,
        hardness: 3.0,
        color: 0xe0e0a0,
        texture: "end_stone"
    }
};

// 方块工具类
class BlockUtils {
    /**
     * 获取方块名称
     */
    static getName(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? prop.name : "未知方块";
    }

    /**
     * 检查方块是否为固体
     */
    static isSolid(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? prop.solid : false;
    }

    /**
     * 检查方块是否透明
     */
    static isTransparent(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? prop.transparent : false;
    }

    /**
     * 检查方块是否可破坏
     */
    static isBreakable(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? prop.hardness >= 0 : false;
    }

    /**
     * 获取方块硬度
     */
    static getHardness(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? prop.hardness : 0;
    }

    /**
     * 获取方块颜色
     */
    static getColor(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? prop.color : 0xff00ff;
    }

    /**
     * 获取方块透明度
     */
    static getOpacity(blockId) {
        const prop = BlockProperties[blockId];
        return prop && prop.opacity !== undefined ? prop.opacity : 1.0;
    }

    /**
     * 检查方块是否为液体
     */
    static isLiquid(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? (prop.liquid || false) : false;
    }

    /**
     * 检查方块是否发光
     */
    static isEmissive(blockId) {
        const prop = BlockProperties[blockId];
        return prop ? (prop.emissive || false) : false;
    }

    /**
     * 根据名称获取方块ID
     */
    static getIdByName(name) {
        for (const [id, prop] of Object.entries(BlockProperties)) {
            if (prop.name === name) {
                return parseInt(id);
            }
        }
        return BlockTypes.AIR;
    }

    /**
     * 获取所有固体方块列表（用于建造）
     */
    static getSolidBlocks() {
        const solidBlocks = [];
        for (const [id, prop] of Object.entries(BlockProperties)) {
            if (prop.solid && parseInt(id) !== BlockTypes.AIR) {
                solidBlocks.push({
                    id: parseInt(id),
                    name: prop.name,
                    color: prop.color
                });
            }
        }
        return solidBlocks;
    }

    /**
     * 序列化方块数据
     */
    static serialize(blockId, x, y, z) {
        return {
            id: blockId,
            x: x,
            y: y,
            z: z
        };
    }

    /**
     * 反序列化方块数据
     */
    static deserialize(data) {
        return {
            blockId: data.id,
            x: data.x,
            y: data.y,
            z: data.z
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BlockTypes,
        BlockProperties,
        BlockUtils
    };
} else {
    window.BlockTypes = BlockTypes;
    window.BlockProperties = BlockProperties;
    window.BlockUtils = BlockUtils;
}

console.log("方块系统 v26.1 加载完成，共 26 种方块");
