/**
 * 我的世界 v26.1 - 世界管理系统
 * 管理方块数据、区块加载、物理更新等
 */

class World {
    constructor(generator = null) {
        this.generator = generator || new WorldGenerator();
        this.worldWidth = this.generator.worldWidth;
        this.worldDepth = this.generator.worldDepth;
        this.worldHeight = this.generator.worldHeight;
        
        // 方块数据存储：Map<"x,y,z", blockId>
        this.blocks = new Map();
        
        // 已加载的区块
        this.loadedChunks = new Set();
        this.chunkSize = 16;
        
        // 修改历史（用于网络同步）
        this.pendingUpdates = [];
        
        // 出生点
        this.spawnPoint = null;
    }

    /**
     * 生成世界坐标键
     */
    makeKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    /**
     * 解析坐标键
     */
    parseKey(key) {
        const parts = key.split(',');
        return {
            x: parseInt(parts[0]),
            y: parseInt(parts[1]),
            z: parseInt(parts[2])
        };
    }

    /**
     * 设置方块
     */
    setBlock(x, y, z, blockId, notify = true) {
        const key = this.makeKey(x, y, z);
        
        if (blockId === BlockTypes.AIR) {
            this.blocks.delete(key);
        } else {
            this.blocks.set(key, blockId);
        }
        
        if (notify) {
            this.pendingUpdates.push({
                type: 'set',
                x, y, z,
                blockId,
                timestamp: Date.now()
            });
        }
        
        return true;
    }

    /**
     * 获取方块
     */
    getBlock(x, y, z) {
        const key = this.makeKey(x, y, z);
        return this.blocks.get(key) || BlockTypes.AIR;
    }

    /**
     * 检查方块是否存在
     */
    hasBlock(x, y, z) {
        const key = this.makeKey(x, y, z);
        return this.blocks.has(key);
    }

    /**
     * 获取方块属性
     */
    getBlockProperties(x, y, z) {
        const blockId = this.getBlock(x, y, z);
        return BlockProperties[blockId];
    }

    /**
     * 破坏方块
     */
    breakBlock(x, y, z) {
        const blockId = this.getBlock(x, y, z);
        
        // 检查是否可破坏
        if (!BlockUtils.isBreakable(blockId)) {
            return false;
        }
        
        this.setBlock(x, y, z, BlockTypes.AIR);
        return true;
    }

    /**
     * 放置方块
     */
    placeBlock(x, y, z, blockId) {
        // 检查该位置是否为空
        const currentBlock = this.getBlock(x, y, z);
        if (currentBlock !== BlockTypes.AIR) {
            return false;
        }
        
        // 检查方块是否有效
        if (!BlockUtils.isSolid(blockId)) {
            return false;
        }
        
        this.setBlock(x, y, z, blockId);
        return true;
    }

    /**
     * 初始化世界（生成初始区域）
     */
    initialize(radius = 3) {
        console.log("开始生成世界...");
        
        const blocks = this.generator.generateSpawnArea(radius);
        
        for (const block of blocks) {
            this.setBlock(block.x, block.y, block.z, block.blockId, false);
        }
        
        // 设置出生点
        this.spawnPoint = this.generator.getSafeSpawnPoint();
        
        console.log(`世界生成完成，共 ${this.blocks.size} 个方块`);
        console.log(`出生点：${this.spawnPoint.x.toFixed(1)}, ${this.spawnPoint.y.toFixed(1)}, ${this.spawnPoint.z.toFixed(1)}`);
        
        return this.spawnPoint;
    }

    /**
     * 加载区块
     */
    loadChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        if (this.loadedChunks.has(chunkKey)) {
            return false; // 已加载
        }
        
        const blocks = this.generator.generateChunk(chunkX, chunkZ, this.chunkSize);
        
        for (const block of blocks) {
            this.setBlock(block.x, block.y, block.z, block.blockId, false);
        }
        
        this.loadedChunks.add(chunkKey);
        return true;
    }

    /**
     * 卸载区块
     */
    unloadChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        if (!this.loadedChunks.has(chunkKey)) {
            return false;
        }
        
        // 移除该区块的所有方块
        const startX = chunkX * this.chunkSize;
        const startZ = chunkZ * this.chunkSize;
        const endX = startX + this.chunkSize;
        const endZ = startZ + this.chunkSize;
        
        for (let x = startX; x < endX; x++) {
            for (let z = startZ; z < endZ; z++) {
                for (let y = 0; y < this.worldHeight; y++) {
                    const key = this.makeKey(x, y, z);
                    this.blocks.delete(key);
                }
            }
        }
        
        this.loadedChunks.delete(chunkKey);
        return true;
    }

    /**
     * 根据玩家位置加载/卸载区块
     */
    updateLoadedChunks(playerX, playerZ, renderDistance = 4) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);
        
        const chunksToLoad = new Set();
        const chunksToUnload = new Set();
        
        // 计算需要加载的区块
        for (let dx = -renderDistance; dx <= renderDistance; dx++) {
            for (let dz = -renderDistance; dz <= renderDistance; dz++) {
                const chunkX = playerChunkX + dx;
                const chunkZ = playerChunkZ + dz;
                const chunkKey = `${chunkX},${chunkZ}`;
                
                if (!this.loadedChunks.has(chunkKey)) {
                    chunksToLoad.add(chunkKey);
                }
            }
        }
        
        // 计算需要卸载的区块
        for (const chunkKey of this.loadedChunks) {
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            const dx = Math.abs(chunkX - playerChunkX);
            const dz = Math.abs(chunkZ - playerChunkZ);
            
            if (dx > renderDistance || dz > renderDistance) {
                chunksToUnload.add(chunkKey);
            }
        }
        
        // 加载新区块
        for (const chunkKey of chunksToLoad) {
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            this.loadChunk(chunkX, chunkZ);
        }
        
        // 卸载远处区块
        for (const chunkKey of chunksToUnload) {
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            this.unloadChunk(chunkX, chunkZ);
        }
        
        return {
            loaded: chunksToLoad.size,
            unloaded: chunksToUnload.size
        };
    }

    /**
     * 获取指定区域内的所有方块
     */
    getBlocksInRegion(minX, minY, minZ, maxX, maxY, maxZ) {
        const result = [];
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const blockId = this.getBlock(x, y, z);
                    if (blockId !== BlockTypes.AIR) {
                        result.push({ x, y, z, blockId });
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * 获取待同步的更新
     */
    getPendingUpdates(sinceTimestamp = 0) {
        return this.pendingUpdates.filter(u => u.timestamp > sinceTimestamp);
    }

    /**
     * 清除旧的更新记录
     */
    clearOldUpdates(maxAge = 60000) {
        const now = Date.now();
        this.pendingUpdates = this.pendingUpdates.filter(u => now - u.timestamp < maxAge);
    }

    /**
     * 应用来自网络的更新
     */
    applyUpdate(update) {
        if (update.type === 'set') {
            this.setBlock(update.x, update.y, update.z, update.blockId, false);
            return true;
        }
        return false;
    }

    /**
     * 导出世界数据
     */
    exportData() {
        const data = {
            seed: this.generator.seed,
            width: this.worldWidth,
            depth: this.worldDepth,
            height: this.worldHeight,
            seaLevel: this.generator.seaLevel,
            spawnPoint: this.spawnPoint,
            blocks: []
        };
        
        for (const [key, blockId] of this.blocks.entries()) {
            const { x, y, z } = this.parseKey(key);
            data.blocks.push({ x, y, z, id: blockId });
        }
        
        return JSON.stringify(data);
    }

    /**
     * 导入世界数据
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            this.generator.resetSeed(data.seed);
            this.worldWidth = data.width;
            this.worldDepth = data.depth;
            this.worldHeight = data.height;
            this.generator.seaLevel = data.seaLevel;
            this.spawnPoint = data.spawnPoint;
            
            this.blocks.clear();
            
            for (const block of data.blocks) {
                this.setBlock(block.x, block.y, block.z, block.id, false);
            }
            
            return true;
        } catch (e) {
            console.error("导入世界数据失败:", e);
            return false;
        }
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalBlocks: this.blocks.size,
            loadedChunks: this.loadedChunks.size,
            pendingUpdates: this.pendingUpdates.length,
            spawnPoint: this.spawnPoint
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { World };
} else {
    window.World = World;
}

console.log("世界管理系统 v26.1 加载完成");
