/**
 * 我的世界 v26.1 - 主游戏逻辑
 * 整合所有系统，处理输入、更新、渲染循环
 */

class Game {
    constructor() {
        this.version = "26.1";
        this.isRunning = false;
        this.lastTime = 0;
        
        // 核心系统
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.network = null;
        
        // 游戏状态
        this.isPlaying = false;
        this.isPaused = false;
        this.isMultiplayer = false;
        
        // 输入状态
        this.keys = {};
        this.mouse = { left: false, right: false };
        
        // UI 元素
        this.ui = {
            crosshair: null,
            hotbar: null,
            chat: null,
            playerList: null,
            debug: null,
            menu: null
        };
        
        // 配置
        this.config = {
            renderDistance: 4,
            fov: 75,
            sensitivity: 1.0,
            showDebug: true,
            showChat: true
        };
        
        // 性能统计
        this.stats = {
            fps: 0,
            chunkUpdates: 0,
            blockUpdates: 0
        };
    }

    /**
     * 初始化游戏
     */
    async init(options = {}) {
        console.log(`正在初始化我的世界 v${this.version}...`);
        
        this.isMultiplayer = options.multiplayer || false;
        
        // 创建渲染器
        this.renderer = new GameRenderer();
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.error("未找到游戏容器 #game-container");
            return false;
        }
        this.renderer.init(gameContainer);
        
        // 创建世界生成器和世界
        const seed = options.seed || null;
        const generator = new WorldGenerator(seed);
        this.world = new World(generator);
        
        // 创建玩家
        const username = options.username || `Player${Math.floor(Math.random() * 1000)}`;
        this.player = new Player(1, username);
        
        // 如果是多人模式，初始化网络
        if (this.isMultiplayer) {
            this.network = new GameNetwork();
            await this.network.connect(options.serverUrl || window.location.origin);
        }
        
        // 初始化 UI
        this.initUI();
        
        // 设置输入监听
        this.setupInput();
        
        // 生成世界
        console.log("正在生成世界...");
        const spawnPoint = this.world.initialize(3);
        
        // 设置玩家出生点
        this.player.setSpawn(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        this.renderer.setCameraPosition(
            this.player.x, 
            this.player.y + this.player.eyeHeight, 
            this.player.z, 
            this.player.yaw, 
            this.player.pitch
        );
        
        // 初始区块加载
        this.world.updateLoadedChunks(this.player.x, this.player.z, this.config.renderDistance);
        this.updateChunkRendering();
        
        console.log("游戏初始化完成！");
        console.log(`出生点：${spawnPoint.x.toFixed(1)}, ${spawnPoint.y.toFixed(1)}, ${spawnPoint.z.toFixed(1)}`);
        
        return true;
    }

    /**
     * 初始化 UI
     */
    initUI() {
        // 准星
        this.ui.crosshair = document.createElement('div');
        this.ui.crosshair.className = 'crosshair';
        document.body.appendChild(this.ui.crosshair);
        
        // 快捷栏
        this.ui.hotbar = document.createElement('div');
        this.ui.hotbar.className = 'hotbar';
        this.ui.hotbar.innerHTML = `
            <div class="hotbar-slots">
                ${Array.from({ length: 9 }, (_, i) => `
                    <div class="hotbar-slot ${i === this.player.selectedSlot ? 'selected' : ''}" data-slot="${i}">
                        <span class="slot-number">${i + 1}</span>
                    </div>
                `).join('')}
            </div>
            <div class="selected-block-name" id="selected-block-name">石头</div>
        `;
        document.body.appendChild(this.ui.hotbar);
        
        // 聊天框
        this.ui.chat = document.createElement('div');
        this.ui.chat.className = 'chat-container';
        this.ui.chat.innerHTML = `
            <div class="chat-messages" id="chat-messages"></div>
            <input type="text" class="chat-input" id="chat-input" placeholder="按 Enter 聊天..." />
        `;
        document.body.appendChild(this.ui.chat);
        
        // 玩家列表（多人模式）
        if (this.isMultiplayer) {
            this.ui.playerList = document.createElement('div');
            this.ui.playerList.className = 'player-list';
            this.ui.playerList.innerHTML = '<h3>在线玩家</h3><ul id="player-list-items"></ul>';
            document.body.appendChild(this.ui.playerList);
        }
        
        // 调试信息
        this.ui.debug = document.createElement('div');
        this.ui.debug.className = 'debug-info';
        this.ui.debug.id = 'debug-info';
        document.body.appendChild(this.ui.debug);
        
        // 菜单
        this.ui.menu = document.createElement('div');
        this.ui.menu.className = 'game-menu';
        this.ui.menu.style.display = 'none';
        this.ui.menu.innerHTML = `
            <div class="menu-content">
                <h1>我的世界 v${this.version}</h1>
                <button id="resume-btn">继续游戏</button>
                <button id="options-btn">选项</button>
                <button id="disconnect-btn">断开连接</button>
            </div>
        `;
        document.body.appendChild(this.ui.menu);
        
        // 绑定菜单按钮事件
        document.getElementById('resume-btn')?.addEventListener('click', () => this.togglePause());
        
        // 更新快捷栏
        this.updateHotbar();
    }

    /**
     * 设置输入监听
     */
    setupInput() {
        // 键盘按下
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // 数字键选择方块槽
            if (e.code >= 'Digit1' && e.code <= 'Digit9') {
                const slot = parseInt(e.code.replace('Digit', '')) - 1;
                this.player.selectedSlot = slot;
                this.updateHotbar();
            }
            
            // E 键打开物品栏（暂未实现）
            if (e.code === 'KeyE') {
                console.log("物品栏功能开发中...");
            }
            
            // T 或 Enter 打开聊天
            if (e.code === 'KeyT' || e.code === 'Enter') {
                const chatInput = document.getElementById('chat-input');
                if (chatInput) {
                    chatInput.focus();
                    chatInput.select();
                }
            }
            
            // ESC 打开菜单
            if (e.code === 'Escape') {
                this.togglePause();
            }
            
            // F3 切换调试信息
            if (e.code === 'F3') {
                this.config.showDebug = !this.config.showDebug;
                this.ui.debug.style.display = this.config.showDebug ? 'block' : 'none';
            }
            
            // 阻止默认行为
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        // 键盘释放
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 鼠标点击
        document.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
                return;
            }
            
            if (e.button === 0) {
                this.mouse.left = true;
                this.handleLeftClick();
            } else if (e.button === 2) {
                this.mouse.right = true;
                this.handleRightClick();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });
        
        // 阻止右键菜单
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 视角控制事件
        document.addEventListener('playerLook', (e) => {
            this.player.yaw = e.detail.yaw;
            this.player.pitch = e.detail.pitch;
        });
        
        // 聊天输入
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('blur', () => {
                chatInput.value = '';
            });
            
            chatInput.addEventListener('keydown', (e) => {
                if (e.code === 'Enter' && chatInput.value.trim()) {
                    this.sendChatMessage(chatInput.value.trim());
                    chatInput.value = '';
                    chatInput.blur();
                }
            });
        }
    }

    /**
     * 处理左键点击（破坏方块）
     */
    handleLeftClick() {
        if (!this.isPlaying || this.isPaused) return;
        
        const hit = this.player.raycast(this.world);
        if (hit.hit) {
            if (this.world.breakBlock(hit.x, hit.y, hit.z)) {
                // 播放破坏音效（暂未实现）
                console.log(`破坏了方块：${BlockUtils.getName(hit.blockId)}`);
                
                // 同步到服务器
                if (this.network) {
                    this.network.sendBlockUpdate('break', hit.x, hit.y, hit.z);
                }
                
                // 重新渲染区块
                const chunkX = Math.floor(hit.x / 16);
                const chunkZ = Math.floor(hit.z / 16);
                this.renderer.removeChunk(`${chunkX},${chunkZ}`);
                this.renderer.renderChunk(chunkX, chunkZ, this.world);
            }
        }
    }

    /**
     * 处理右键点击（放置方块）
     */
    handleRightClick() {
        if (!this.isPlaying || this.isPaused) return;
        
        const hit = this.player.raycast(this.world);
        if (hit.hit && hit.face) {
            const placeX = hit.x + hit.face.x;
            const placeY = hit.y + hit.face.y;
            const placeZ = hit.z + hit.face.z;
            
            // 检查是否在玩家内部
            const playerBox = {
                minX: this.player.x - this.player.width / 2,
                maxX: this.player.x + this.player.width / 2,
                minY: this.player.y,
                maxY: this.player.y + this.player.height,
                minZ: this.player.z - this.player.width / 2,
                maxZ: this.player.z + this.player.width / 2
            };
            
            if (placeX >= playerBox.minX && placeX <= playerBox.maxX &&
                placeY >= playerBox.minY && placeY <= playerBox.maxY &&
                placeZ >= playerBox.minZ && placeZ <= playerBox.maxZ) {
                return; // 不能放置在玩家内部
            }
            
            const blockId = this.player.selectedBlock;
            if (this.world.placeBlock(placeX, placeY, placeZ, blockId)) {
                console.log(`放置了方块：${BlockUtils.getName(blockId)}`);
                
                // 同步到服务器
                if (this.network) {
                    this.network.sendBlockUpdate('place', placeX, placeY, placeZ, blockId);
                }
                
                // 重新渲染区块
                const chunkX = Math.floor(placeX / 16);
                const chunkZ = Math.floor(placeZ / 16);
                this.renderer.removeChunk(`${chunkX},${chunkZ}`);
                this.renderer.renderChunk(chunkX, chunkZ, this.world);
            }
        }
    }

    /**
     * 发送聊天消息
     */
    sendChatMessage(message) {
        console.log(`[聊天] ${this.player.username}: ${message}`);
        this.addChatMessage(this.player.username, message);
        
        if (this.network) {
            this.network.sendChat(message);
        }
    }

    /**
     * 添加聊天消息到 UI
     */
    addChatMessage(username, message) {
        const messagesDiv = document.getElementById('chat-messages');
        if (messagesDiv) {
            const msgEl = document.createElement('div');
            msgEl.className = 'chat-message';
            msgEl.innerHTML = `<span class="chat-username">${username}:</span> <span class="chat-text">${message}</span>`;
            messagesDiv.appendChild(msgEl);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            
            // 限制消息数量
            while (messagesDiv.children.length > 100) {
                messagesDiv.removeChild(messagesDiv.firstChild);
            }
        }
    }

    /**
     * 更新快捷栏
     */
    updateHotbar() {
        const slots = document.querySelectorAll('.hotbar-slot');
        slots.forEach((slot, index) => {
            if (index === this.player.selectedSlot) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
        
        // 更新选中方块名称
        const blockNameEl = document.getElementById('selected-block-name');
        if (blockNameEl) {
            blockNameEl.textContent = BlockUtils.getName(this.player.selectedBlock);
        }
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        this.ui.menu.style.display = this.isPaused ? 'flex' : 'none';
        
        if (this.isPaused) {
            document.exitPointerLock();
        } else {
            document.getElementById('game-container').requestPointerLock();
        }
    }

    /**
     * 更新区块渲染
     */
    updateChunkRendering() {
        const playerChunkX = Math.floor(this.player.x / 16);
        const playerChunkZ = Math.floor(this.player.z / 16);
        
        for (let dx = -this.config.renderDistance; dx <= this.config.renderDistance; dx++) {
            for (let dz = -this.config.renderDistance; dz <= this.config.renderDistance; dz++) {
                const chunkX = playerChunkX + dx;
                const chunkZ = playerChunkZ + dz;
                this.renderer.renderChunk(chunkX, chunkZ, this.world);
            }
        }
    }

    /**
     * 处理玩家移动输入
     */
    handleMovement(deltaTime) {
        // 重置移动状态
        this.player.moveForward = 0;
        this.player.moveStrafe = 0;
        this.player.jump = false;
        this.player.sneak = false;
        this.player.sprint = false;
        
        // WASD 移动
        if (this.keys['KeyW']) this.player.moveForward = 1;
        if (this.keys['KeyS']) this.player.moveForward = -1;
        if (this.keys['KeyA']) this.player.moveStrafe = -1;
        if (this.keys['KeyD']) this.player.moveStrafe = 1;
        
        // 空格跳跃
        if (this.keys['Space']) this.player.jump = true;
        
        // Shift 潜行
        if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
            this.player.sneak = true;
        }
        
        // Ctrl 奔跑
        if (this.keys['ControlLeft'] || this.keys['ControlRight']) {
            this.player.sprint = true;
        }
    }

    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;
        
        // 处理输入
        this.handleMovement(deltaTime);
        
        // 更新玩家
        this.player.update(deltaTime, this.world);
        
        // 更新相机位置
        this.renderer.setCameraPosition(
            this.player.x,
            this.player.y + this.player.eyeHeight,
            this.player.z,
            this.player.yaw,
            this.player.pitch
        );
        
        // 更新选择框
        const hit = this.player.raycast(this.world);
        this.renderer.updateHighlight(hit);
        
        // 动态加载/卸载区块
        const result = this.world.updateLoadedChunks(
            this.player.x, 
            this.player.z, 
            this.config.renderDistance
        );
        this.stats.chunkUpdates += result.loaded + result.unloaded;
        
        // 清理旧的更新记录
        this.world.clearOldUpdates();
        
        // 网络同步（多人模式）
        if (this.network) {
            this.network.updatePlayerPosition(
                this.player.x,
                this.player.y,
                this.player.z,
                this.player.yaw,
                this.player.pitch
            );
            
            // 接收并应用其他玩家位置
            const otherPlayers = this.network.getOtherPlayers();
            for (const playerData of otherPlayers) {
                if (playerData.id !== this.player.id) {
                    this.renderer.updatePlayerMarker(playerData);
                }
            }
        }
        
        // 更新调试信息
        this.updateDebugInfo();
    }

    /**
     * 更新调试信息
     */
    updateDebugInfo() {
        if (!this.config.showDebug || !this.ui.debug) return;
        
        const stats = this.renderer.getStats();
        const worldStats = this.world.getStats();
        
        this.ui.debug.innerHTML = `
            <div><strong>我的世界 v${this.version}</strong></div>
            <div>FPS: ${stats.fps}</div>
            <div>位置：${this.player.x.toFixed(2)}, ${this.player.y.toFixed(2)}, ${this.player.z.toFixed(2)}</div>
            <div>朝向：Yaw=${this.player.yaw.toFixed(1)}, Pitch=${this.player.pitch.toFixed(1)}</div>
            <div>区块：${worldStats.loadedChunks} 已加载</div>
            <div>方块：${worldStats.totalBlocks} 总数</div>
            <div>实体：${stats.meshes} 网格，${stats.triangles} 三角形</div>
            <div>在线玩家：${this.isMultiplayer ? this.network.getPlayerCount() : 1}</div>
        `;
    }

    /**
     * 渲染循环
     */
    render() {
        this.renderer.render();
    }

    /**
     * 游戏主循环
     */
    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 更新 FPS
        this.stats.fps = Math.round(1000 / deltaTime);
        
        // 更新逻辑
        this.update(deltaTime);
        
        // 渲染
        this.render();
        
        // 继续循环
        if (this.isRunning) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.isRunning) return;
        
        console.log("游戏开始！");
        this.isPlaying = true;
        this.isRunning = true;
        this.isPaused = false;
        
        // 请求指针锁定
        document.getElementById('game-container').requestPointerLock();
        
        // 启动游戏循环
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.isPlaying = false;
        document.exitPointerLock();
        console.log("游戏已停止");
    }

    /**
     * 清理资源
     */
    dispose() {
        this.stop();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.network) {
            this.network.disconnect();
        }
        
        // 清理 UI
        for (const element of Object.values(this.ui)) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
        
        console.log("游戏资源已清理");
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
} else {
    window.Game = Game;
}

console.log("游戏主逻辑 v26.1 加载完成");
