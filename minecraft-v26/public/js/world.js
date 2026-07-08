/**
 * 我的世界 v26.1 - 世界生成系统
 * 包含地形生成、洞穴、矿脉、树木等自然特征
 */

class WorldGenerator {
    constructor(seed = null) {
        this.seed = seed || Math.floor(Math.random() * 2147483647);
        this.worldWidth = 256;
        this.worldDepth = 256;
        this.worldHeight = 128;
        this.seaLevel = 64;
        
        // 初始化噪声生成器（简化版）
        this.noiseSeed = this.seed;
    }

    /**
     * 简化的伪随机数生成器
     */
    random() {
        this.noiseSeed = (this.noiseSeed * 1103515245 + 12345) & 0x7fffffff;
        return this.noiseSeed / 0x7fffffff;
    }

    /**
     * 重置种子
     */
    resetSeed(seed) {
        this.noiseSeed = seed;
    }

    /**
     * 2D 噪声函数（简化版 Perlin 噪声）
     */
    noise2D(x, z, scale = 0.01, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.smoothNoise(x * frequency, z * frequency);
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value / maxValue;
    }

    /**
     * 平滑噪声
     */
    smoothNoise(x, z) {
        const intX = Math.floor(x);
        const intZ = Math.floor(z);
        const fracX = x - intX;
        const fracZ = z - intZ;

        const v1 = this.randomAt(intX, intZ);
        const v2 = this.randomAt(intX + 1, intZ);
        const v3 = this.randomAt(intX, intZ + 1);
        const v4 = this.randomAt(intX + 1, intZ + 1);

        const i1 = this.lerp(v1, v2, fracX);
        const i2 = this.lerp(v3, v4, fracX);

        return this.lerp(i1, i2, fracZ);
    }

    /**
     * 线性插值
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * 在特定坐标生成确定性随机数
     */
    randomAt(x, z) {
        const n = x * 3713 + z * 7919;
        return ((n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    }

    /**
     * 获取地形高度
     */
    getTerrainHeight(x, z) {
        const baseHeight = this.seaLevel - 10;
        const noise = this.noise2D(x, z, 0.008, 4);
        const heightVariation = noise * 40;
        return Math.floor(baseHeight + heightVariation);
    }

    /**
     * 生成单个列的方块
     */
    generateColumn(x, z) {
        const column = [];
        const surfaceHeight = this.getTerrainHeight(x, z);

        for (let y = 0; y < this.worldHeight; y++) {
            let blockId = BlockTypes.AIR;

            if (y === 0) {
                // 基岩层
                blockId = BlockTypes.BEDROCK;
            } else if (y < surfaceHeight - 4) {
                // 深层石头
                blockId = BlockTypes.STONE;
                
                // 生成矿脉
                if (this.shouldGenerateOre(x, y, z)) {
                    blockId = this.getOreType(y);
                }
                
                // 生成洞穴
                if (this.isCave(x, y, z)) {
                    blockId = BlockTypes.AIR;
                }
            } else if (y < surfaceHeight) {
                // 浅层石头或泥土
                if (y < surfaceHeight - 2) {
                    blockId = BlockTypes.DIRT;
                } else {
                    blockId = BlockTypes.GRASS;
                }
                
                // 生成洞穴
                if (this.isCave(x, y, z)) {
                    blockId = BlockTypes.AIR;
                }
            } else if (y === surfaceHeight) {
                // 地表
                if (surfaceHeight < this.seaLevel - 2) {
                    blockId = BlockTypes.SAND;
                } else if (surfaceHeight >= this.seaLevel) {
                    blockId = BlockTypes.GRASS;
                } else {
                    blockId = BlockTypes.DIRT;
                }
            } else if (y < this.seaLevel) {
                // 水下
                blockId = BlockTypes.WATER;
            }

            if (blockId !== BlockTypes.AIR || y <= surfaceHeight) {
                column.push({ x, y, z, blockId });
            }
        }

        return column;
    }

    /**
     * 检查是否应该生成矿石
     */
    shouldGenerateOre(x, y, z) {
        // 基岩层不生成矿石
        if (y < 5) return false;
        
        const noise = this.randomAt(x * 7 + y * 13, z * 11 + y * 17);
        const chance = this.getOreChance(y);
        
        return noise < chance;
    }

    /**
     * 根据高度获取矿石类型
     */
    getOreType(y) {
        const rand = this.random();
        
        if (y < 16) {
            // 深层：钻石为主
            if (rand < 0.02) return BlockTypes.DIAMOND_ORE;
            if (rand < 0.06) return BlockTypes.GOLD_ORE;
            if (rand < 0.12) return BlockTypes.IRON_ORE;
            if (rand < 0.20) return BlockTypes.COAL_ORE;
        } else if (y < 32) {
            // 中层：金和铁为主
            if (rand < 0.01) return BlockTypes.DIAMOND_ORE;
            if (rand < 0.04) return BlockTypes.GOLD_ORE;
            if (rand < 0.10) return BlockTypes.IRON_ORE;
            if (rand < 0.18) return BlockTypes.COAL_ORE;
        } else {
            // 浅层：煤和铁为主
            if (rand < 0.08) return BlockTypes.IRON_ORE;
            if (rand < 0.20) return BlockTypes.COAL_ORE;
        }
        
        return BlockTypes.STONE;
    }

    /**
     * 获取矿石生成概率
     */
    getOreChance(y) {
        if (y < 16) return 0.008;
        if (y < 32) return 0.006;
        if (y < 64) return 0.004;
        return 0.002;
    }

    /**
     * 检查是否为洞穴
     */
    isCave(x, y, z) {
        if (y < 10) return false; // 接近基岩不生成洞穴
        
        const caveNoise = this.noise2D(x * 0.05, z * 0.05, 0.03, 2);
        const verticalNoise = Math.sin(y * 0.1) * 0.3 + 0.5;
        
        return caveNoise > 0.75 && verticalNoise > 0.5;
    }

    /**
     * 生成树木
     */
    generateTree(x, y, z) {
        const blocks = [];
        const treeHeight = 4 + Math.floor(this.random() * 3);
        
        // 树干
        for (let dy = 0; dy < treeHeight; dy++) {
            blocks.push({ x, y: y + dy, z, blockId: BlockTypes.LOG_OAK });
        }
        
        // 树叶
        const leafStart = y + treeHeight - 2;
        const leafEnd = y + treeHeight + 1;
        
        for (let ly = leafStart; ly <= leafEnd; ly++) {
            const radius = ly === leafEnd ? 1 : 2;
            for (let lx = -radius; lx <= radius; lx++) {
                for (let lz = -radius; lz <= radius; lz++) {
                    if (lx === 0 && lz === 0 && ly < y + treeHeight) continue;
                    
                    const dist = Math.abs(lx) + Math.abs(lz);
                    if (dist <= radius + 1) {
                        const worldX = x + lx;
                        const worldZ = z + lz;
                        
                        // 检查是否已经有方块
                        if (!blocks.some(b => b.x === worldX && b.y === ly && b.z === worldZ)) {
                            blocks.push({ x: worldX, y: ly, z: worldZ, blockId: BlockTypes.LEAVES_OAK });
                        }
                    }
                }
            }
        }
        
        return blocks;
    }

    /**
     * 检查是否可以生成树
     */
    canGenerateTree(x, y, z) {
        // 检查地面是否为草方块
        // 检查上方是否有足够空间
        for (let dy = 1; dy <= 6; dy++) {
            // 简化检查，实际游戏中需要检查世界数据
        }
        return this.random() < 0.02; // 2% 概率生成树
    }

    /**
     * 生成整个世界（分块）
     */
    generateChunk(chunkX, chunkZ, chunkSize = 16) {
        const blocks = [];
        
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                const worldX = chunkX * chunkSize + x;
                const worldZ = chunkZ * chunkSize + z;
                
                // 生成地形列
                const column = this.generateColumn(worldX, worldZ);
                blocks.push(...column);
                
                // 尝试生成树木
                const surfaceHeight = this.getTerrainHeight(worldX, worldZ);
                if (surfaceHeight >= this.seaLevel - 2 && this.canGenerateTree(worldX, surfaceHeight, worldZ)) {
                    const tree = this.generateTree(worldX, surfaceHeight + 1, worldZ);
                    blocks.push(...tree);
                }
            }
        }
        
        return blocks;
    }

    /**
     * 生成初始出生点区域
     */
    generateSpawnArea(radius = 3) {
        const blocks = [];
        const chunkSize = 16;
        const chunksNeeded = Math.ceil((radius * 2) / chunkSize);
        
        const centerChunk = Math.floor(this.worldWidth / 2 / chunkSize);
        
        for (let cx = centerChunk - chunksNeeded; cx <= centerChunk + chunksNeeded; cx++) {
            for (let cz = centerChunk - chunksNeeded; cz <= centerChunk + chunksNeeded; cz++) {
                const chunkBlocks = this.generateChunk(cx, cz, chunkSize);
                blocks.push(...chunkBlocks);
            }
        }
        
        return blocks;
    }

    /**
     * 获取安全的出生点
     */
    getSafeSpawnPoint() {
        const centerX = Math.floor(this.worldWidth / 2);
        const centerZ = Math.floor(this.worldDepth / 2);
        const surfaceY = this.getTerrainHeight(centerX, centerZ);
        
        // 确保出生点在地表以上
        return {
            x: centerX + 0.5,
            y: surfaceY + 2,
            z: centerZ + 0.5
        };
    }

    /**
     * 导出世界数据
     */
    exportWorldData(blocks) {
        const data = {
            seed: this.seed,
            width: this.worldWidth,
            depth: this.worldDepth,
            height: this.worldHeight,
            seaLevel: this.seaLevel,
            blocks: blocks.map(b => ({
                x: b.x,
                y: b.y,
                z: b.z,
                id: b.blockId
            }))
        };
        return JSON.stringify(data);
    }

    /**
     * 导入世界数据
     */
    importWorldData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.seed = data.seed;
            this.worldWidth = data.width;
            this.worldDepth = data.depth;
            this.worldHeight = data.height;
            this.seaLevel = data.seaLevel;
            
            return data.blocks.map(b => ({
                x: b.x,
                y: b.y,
                z: b.z,
                blockId: b.id
            }));
        } catch (e) {
            console.error("导入世界数据失败:", e);
            return null;
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorldGenerator };
} else {
    window.WorldGenerator = WorldGenerator;
}

console.log("世界生成系统 v26.1 加载完成");
