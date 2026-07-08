/**
 * 我的世界 v26.1 - 玩家系统
 * 包含玩家移动、物理、碰撞检测等
 */

class Player {
    constructor(id, username = "Player") {
        this.id = id;
        this.username = username;
        
        // 位置
        this.x = 0;
        this.y = 0;
        this.z = 0;
        
        // 速度
        this.velocityX = 0;
        this.velocityY = 0;
        this.velocityZ = 0;
        
        // 旋转
        this.yaw = 0;   // 水平旋转（度）
        this.pitch = 0; // 垂直旋转（度）
        
        // 物理属性
        this.width = 0.6;
        this.height = 1.8;
        this.eyeHeight = 1.62;
        
        // 状态
        this.onGround = false;
        this.isFlying = false;
        this.canFly = false;
        
        // 移动控制
        this.moveForward = 0;
        this.moveStrafe = 0;
        this.jump = false;
        this.sneak = false;
        this.sprint = false;
        
        // 游戏设置
        this.walkSpeed = 4.317;
        this.sprintSpeed = 5.612;
        this.flySpeed = 10.0;
        this.jumpForce = 8.0;
        this.gravity = 20.0;
        
        // 物品栏
        this.inventory = new Array(36).fill(BlockTypes.AIR);
        this.selectedSlot = 0;
        
        // 生命值
        this.health = 20;
        this.maxHealth = 20;
        this.hunger = 20;
        this.maxHunger = 20;
        
        // 选中方块
        this.selectedBlock = BlockTypes.STONE;
        
        // 最后更新时间
        this.lastUpdate = Date.now();
    }

    /**
     * 设置出生点
     */
    setSpawn(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.velocityX = 0;
        this.velocityY = 0;
        this.velocityZ = 0;
    }

    /**
     * 更新玩家状态
     */
    update(deltaTime, world) {
        const dt = Math.min(deltaTime / 1000, 0.1); // 限制最大时间步长
        
        // 应用重力
        if (!this.isFlying && !this.onGround) {
            this.velocityY -= this.gravity * dt;
        }
        
        // 计算移动速度
        let speed = this.sprint ? this.sprintSpeed : this.walkSpeed;
        if (this.isFlying) {
            speed = this.flySpeed;
        }
        
        // 计算移动方向
        const yawRad = this.yaw * Math.PI / 180;
        const forwardX = -Math.sin(yawRad);
        const forwardZ = -Math.cos(yawRad);
        const strafeX = -Math.cos(yawRad);
        const strafeZ = Math.sin(yawRad);
        
        // 合成移动向量
        let moveX = 0;
        let moveZ = 0;
        
        if (this.moveForward !== 0) {
            moveX += forwardX * this.moveForward;
            moveZ += forwardZ * this.moveForward;
        }
        if (this.moveStrafe !== 0) {
            moveX += strafeX * this.moveStrafe;
            moveZ += strafeZ * this.moveStrafe;
        }
        
        // 归一化移动向量
        const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (moveLength > 0) {
            moveX /= moveLength;
            moveZ /= moveLength;
        }
        
        // 应用水平移动
        const targetVelocityX = moveX * speed;
        const targetVelocityZ = moveZ * speed;
        
        // 平滑加速度
        const acceleration = 40.0;
        this.velocityX += (targetVelocityX - this.velocityX) * acceleration * dt;
        this.velocityZ += (targetVelocityZ - this.velocityZ) * acceleration * dt;
        
        // 飞行模式垂直移动
        if (this.isFlying) {
            if (this.jump) {
                this.velocityY = this.flySpeed * 0.5;
            } else if (this.sneak) {
                this.velocityY = -this.flySpeed * 0.5;
            } else {
                // 悬停时缓慢停止垂直移动
                this.velocityY *= 0.9;
            }
        } else if (this.jump && this.onGround) {
            // 跳跃
            this.velocityY = this.jumpForce;
            this.onGround = false;
        }
        
        // 应用移动并检测碰撞
        this.moveAndCollide(dt, world);
        
        // 更新最后时间
        this.lastUpdate = Date.now();
    }

    /**
     * 移动并检测碰撞
     */
    moveAndCollide(dt, world) {
        // X 轴移动
        this.x += this.velocityX * dt;
        if (this.checkCollision(world)) {
            this.x -= this.velocityX * dt;
            this.velocityX = 0;
        }
        
        // Z 轴移动
        this.z += this.velocityZ * dt;
        if (this.checkCollision(world)) {
            this.z -= this.velocityZ * dt;
            this.velocityZ = 0;
        }
        
        // Y 轴移动
        this.y += this.velocityY * dt;
        if (this.checkCollision(world)) {
            this.y -= this.velocityY * dt;
            
            // 检查是否落地
            if (this.velocityY < 0) {
                this.onGround = true;
            }
            
            this.velocityY = 0;
        } else {
            this.onGround = false;
        }
        
        // 边界检查
        this.checkBounds(world);
    }

    /**
     * 检测碰撞
     */
    checkCollision(world) {
        const minX = this.x - this.width / 2;
        const maxX = this.x + this.width / 2;
        const minY = this.y;
        const maxY = this.y + this.height;
        const minZ = this.z - this.width / 2;
        const maxZ = this.z + this.width / 2;
        
        // 检查周围的方块
        const startX = Math.floor(minX);
        const endX = Math.floor(maxX);
        const startY = Math.floor(minY);
        const endY = Math.floor(maxY);
        const startZ = Math.floor(minZ);
        const endZ = Math.floor(maxZ);
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                for (let z = startZ; z <= endZ; z++) {
                    const block = world.getBlock(x, y, z);
                    if (block && BlockUtils.isSolid(block)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * 边界检查
     */
    checkBounds(world) {
        const maxY = world ? world.worldHeight : 256;
        const minY = 0;
        
        if (this.y < minY) {
            this.y = minY;
            this.velocityY = 0;
            this.onGround = true;
        }
        
        if (this.y > maxY) {
            this.y = maxY;
            this.velocityY = 0;
        }
    }

    /**
     * 获取视线方向
     */
    getLookDirection() {
        const yawRad = this.yaw * Math.PI / 180;
        const pitchRad = this.pitch * Math.PI / 180;
        
        const x = -Math.sin(yawRad) * Math.cos(pitchRad);
        const y = -Math.sin(pitchRad);
        const z = -Math.cos(yawRad) * Math.cos(pitchRad);
        
        return { x, y, z };
    }

    /**
     * 射线追踪获取选中的方块
     */
    raycast(world, maxDistance = 6) {
        const look = this.getLookDirection();
        const eyeY = this.y + this.eyeHeight;
        
        let x = this.x;
        let y = eyeY;
        let z = this.z;
        
        const step = 0.1;
        let distance = 0;
        
        let lastBlockX = Math.floor(x);
        let lastBlockY = Math.floor(y);
        let lastBlockZ = Math.floor(z);
        
        while (distance < maxDistance) {
            x += look.x * step;
            y += look.y * step;
            z += look.z * step;
            distance += step;
            
            const blockX = Math.floor(x);
            const blockY = Math.floor(y);
            const blockZ = Math.floor(z);
            
            // 检查是否进入新方块
            if (blockX !== lastBlockX || blockY !== lastBlockY || blockZ !== lastBlockZ) {
                const block = world.getBlock(blockX, blockY, blockZ);
                
                if (block && BlockUtils.isSolid(block)) {
                    return {
                        hit: true,
                        x: blockX,
                        y: blockY,
                        z: blockZ,
                        blockId: block,
                        face: this.getHitFace(lastBlockX, lastBlockY, lastBlockZ, blockX, blockY, blockZ),
                        distance: distance
                    };
                }
                
                lastBlockX = blockX;
                lastBlockY = blockY;
                lastBlockZ = blockZ;
            }
        }
        
        return { hit: false };
    }

    /**
     * 获取击中的面
     */
    getHitFace(lx, ly, lz, hx, hy, hz) {
        const dx = hx - lx;
        const dy = hy - ly;
        const dz = hz - lz;
        
        if (dx === 1) return { x: 1, y: 0, z: 0, name: "west" };
        if (dx === -1) return { x: -1, y: 0, z: 0, name: "east" };
        if (dy === 1) return { x: 0, y: 1, z: 0, name: "bottom" };
        if (dy === -1) return { x: 0, y: -1, z: 0, name: "top" };
        if (dz === 1) return { x: 0, y: 0, z: 1, name: "north" };
        if (dz === -1) return { x: 0, y: 0, z: -1, name: "south" };
        
        return { x: 0, y: 0, z: 0, name: "unknown" };
    }

    /**
     * 序列化玩家数据
     */
    serialize() {
        return {
            id: this.id,
            username: this.username,
            x: this.x,
            y: this.y,
            z: this.z,
            yaw: this.yaw,
            pitch: this.pitch,
            health: this.health,
            hunger: this.hunger,
            selectedSlot: this.selectedSlot,
            selectedBlock: this.selectedBlock,
            inventory: this.inventory,
            isFlying: this.isFlying,
            onGround: this.onGround
        };
    }

    /**
     * 反序列化玩家数据
     */
    deserialize(data) {
        if (data.id) this.id = data.id;
        if (data.username) this.username = data.username;
        if (data.x !== undefined) this.x = data.x;
        if (data.y !== undefined) this.y = data.y;
        if (data.z !== undefined) this.z = data.z;
        if (data.yaw !== undefined) this.yaw = data.yaw;
        if (data.pitch !== undefined) this.pitch = data.pitch;
        if (data.health !== undefined) this.health = data.health;
        if (data.hunger !== undefined) this.hunger = data.hunger;
        if (data.selectedSlot !== undefined) this.selectedSlot = data.selectedSlot;
        if (data.selectedBlock !== undefined) this.selectedBlock = data.selectedBlock;
        if (data.inventory) this.inventory = data.inventory;
        if (data.isFlying !== undefined) this.isFlying = data.isFlying;
        if (data.onGround !== undefined) this.onGround = data.onGround;
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    /**
     * 治疗
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * 设置饥饿值
     */
    setHunger(amount) {
        this.hunger = Math.min(this.maxHunger, Math.max(0, amount));
    }
}

// 玩家管理器（用于多人游戏）
class PlayerManager {
    constructor() {
        this.players = new Map();
        this.nextId = 1;
    }

    /**
     * 添加玩家
     */
    addPlayer(username) {
        const id = this.nextId++;
        const player = new Player(id, username);
        this.players.set(id, player);
        return player;
    }

    /**
     * 移除玩家
     */
    removePlayer(id) {
        return this.players.delete(id);
    }

    /**
     * 获取玩家
     */
    getPlayer(id) {
        return this.players.get(id);
    }

    /**
     * 获取所有玩家
     */
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    /**
     * 获取玩家数量
     */
    getPlayerCount() {
        return this.players.size;
    }

    /**
     * 更新所有玩家
     */
    updateAll(deltaTime, world) {
        for (const player of this.players.values()) {
            player.update(deltaTime, world);
        }
    }

    /**
     * 广播玩家位置
     */
    broadcastPositions(callback) {
        for (const player of this.players.values()) {
            callback(player.serialize());
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player, PlayerManager };
} else {
    window.Player = Player;
    window.PlayerManager = PlayerManager;
}

console.log("玩家系统 v26.1 加载完成");
