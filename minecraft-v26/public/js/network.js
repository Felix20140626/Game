/**
 * 我的世界 v26.1 - 网络系统
 * 使用 Socket.IO 实现多人联机功能
 */

class GameNetwork {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.players = new Map();
        this.serverUrl = null;
        
        // 回调函数
        this.callbacks = {
            connect: [],
            disconnect: [],
            playerJoin: [],
            playerLeave: [],
            playerMove: [],
            blockUpdate: [],
            chat: []
        };
    }

    /**
     * 连接到服务器
     */
    async connect(serverUrl) {
        return new Promise((resolve, reject) => {
            try {
                this.serverUrl = serverUrl;
                
                // 检查 Socket.IO 是否可用
                if (typeof io === 'undefined') {
                    console.warn("Socket.IO 未加载，使用模拟模式");
                    this.simulateConnection();
                    resolve(true);
                    return;
                }
                
                // 连接 Socket.IO 服务器
                this.socket = io(serverUrl, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000
                });

                // 连接成功
                this.socket.on('connect', () => {
                    console.log("已连接到服务器");
                    this.connected = true;
                    this.triggerCallback('connect');
                    resolve(true);
                });

                // 连接失败
                this.socket.on('connect_error', (error) => {
                    console.error("连接失败:", error);
                    this.connected = false;
                    reject(error);
                });

                // 断开连接
                this.socket.on('disconnect', (reason) => {
                    console.log("已断开连接:", reason);
                    this.connected = false;
                    this.triggerCallback('disconnect', reason);
                });

                // 接收玩家 ID
                this.socket.on('playerId', (id) => {
                    this.playerId = id;
                    console.log("我的玩家 ID:", id);
                });

                // 接收玩家列表
                this.socket.on('playerList', (players) => {
                    this.players.clear();
                    for (const player of players) {
                        this.players.set(player.id, player);
                    }
                    console.log(`在线玩家：${this.players.size}`);
                });

                // 玩家加入
                this.socket.on('playerJoin', (player) => {
                    console.log(`玩家加入：${player.username}`);
                    this.players.set(player.id, player);
                    this.triggerCallback('playerJoin', player);
                });

                // 玩家离开
                this.socket.on('playerLeave', (playerId) => {
                    const player = this.players.get(playerId);
                    if (player) {
                        console.log(`玩家离开：${player.username}`);
                        this.players.delete(playerId);
                        this.triggerCallback('playerLeave', player);
                    }
                });

                // 玩家位置更新
                this.socket.on('playerMove', (playerData) => {
                    if (this.players.has(playerData.id)) {
                        const existing = this.players.get(playerData.id);
                        Object.assign(existing, playerData);
                    } else {
                        this.players.set(playerData.id, playerData);
                    }
                    this.triggerCallback('playerMove', playerData);
                });

                // 方块更新
                this.socket.on('blockUpdate', (update) => {
                    console.log("方块更新:", update);
                    this.triggerCallback('blockUpdate', update);
                });

                // 聊天消息
                this.socket.on('chatMessage', (data) => {
                    console.log(`[聊天] ${data.username}: ${data.message}`);
                    this.triggerCallback('chat', data);
                });

            } catch (error) {
                console.error("网络初始化失败:", error);
                this.simulateConnection();
                resolve(true);
            }
        });
    }

    /**
     * 模拟连接（单机模式）
     */
    simulateConnection() {
        console.log("使用模拟网络模式（单机）");
        this.connected = true;
        this.playerId = 1;
        this.players.set(1, {
            id: 1,
            username: "Player1",
            x: 0, y: 70, z: 0,
            yaw: 0, pitch: 0
        });
    }

    /**
     * 注册回调
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * 触发回调
     */
    triggerCallback(event, ...args) {
        if (this.callbacks[event]) {
            for (const cb of this.callbacks[event]) {
                try {
                    cb(...args);
                } catch (e) {
                    console.error(`回调执行失败 [${event}]:`, e);
                }
            }
        }
    }

    /**
     * 发送玩家位置
     */
    updatePlayerPosition(x, y, z, yaw, pitch) {
        if (!this.connected) return;
        
        const data = { x, y, z, yaw, pitch };
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('playerMove', data);
        } else {
            // 模拟模式：直接更新本地玩家
            if (this.players.has(this.playerId)) {
                const player = this.players.get(this.playerId);
                Object.assign(player, data);
            }
        }
    }

    /**
     * 发送方块更新
     */
    sendBlockUpdate(action, x, y, z, blockId = null) {
        if (!this.connected) return;
        
        const data = { action, x, y, z };
        if (blockId !== null) data.blockId = blockId;
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('blockUpdate', data);
        } else {
            // 模拟模式：广播给所有客户端
            this.triggerCallback('blockUpdate', data);
        }
    }

    /**
     * 发送聊天消息
     */
    sendChat(message) {
        if (!this.connected) return;
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('chatMessage', { message });
        } else {
            // 模拟模式：显示在本地
            const player = this.players.get(this.playerId);
            this.triggerCallback('chat', {
                username: player ? player.username : 'Player',
                message
            });
        }
    }

    /**
     * 获取其他玩家
     */
    getOtherPlayers() {
        const others = [];
        for (const [id, player] of this.players.entries()) {
            if (id !== this.playerId) {
                others.push(player);
            }
        }
        return others;
    }

    /**
     * 获取玩家数量
     */
    getPlayerCount() {
        return this.players.size;
    }

    /**
     * 获取指定玩家
     */
    getPlayer(id) {
        return this.players.get(id);
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
        this.players.clear();
        console.log("已断开网络连接");
    }

    /**
     * 检查是否已连接
     */
    isConnected() {
        return this.connected && (this.socket ? this.socket.connected : true);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameNetwork };
} else {
    window.GameNetwork = GameNetwork;
}

console.log("网络系统 v26.1 加载完成");
