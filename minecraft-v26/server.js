/**
 * 我的世界 v26.1 - 服务器端
 * Node.js + Express + Socket.IO 实现多人联机服务器
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 服务静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 游戏状态
const gameState = {
    players: new Map(),
    world: {
        blocks: new Map(),
        seed: Math.floor(Math.random() * 2147483647)
    },
    nextPlayerId: 1
};

// 玩家类
class ServerPlayer {
    constructor(id, username, socket) {
        this.id = id;
        this.username = username;
        this.socket = socket;
        this.x = 0;
        this.y = 70;
        this.z = 0;
        this.yaw = 0;
        this.pitch = 0;
        this.connected = true;
        this.lastUpdate = Date.now();
    }

    serialize() {
        return {
            id: this.id,
            username: this.username,
            x: this.x,
            y: this.y,
            z: this.z,
            yaw: this.yaw,
            pitch: this.pitch
        };
    }
}

// Socket.IO 连接处理
io.on('connection', (socket) => {
    console.log(`新玩家连接：${socket.id}`);

    // 分配玩家 ID
    const playerId = gameState.nextPlayerId++;
    const player = new ServerPlayer(playerId, `Player${playerId}`, socket);
    gameState.players.set(playerId, player);

    // 发送玩家 ID
    socket.emit('playerId', playerId);

    // 发送当前玩家列表
    const playerList = Array.from(gameState.players.values()).map(p => p.serialize());
    socket.emit('playerList', playerList);

    // 广播新玩家加入
    socket.broadcast.emit('playerJoin', player.serialize());

    // 处理玩家移动
    socket.on('playerMove', (data) => {
        const player = gameState.players.get(playerId);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.z = data.z;
            player.yaw = data.yaw;
            player.pitch = data.pitch;
            player.lastUpdate = Date.now();

            // 广播给其他玩家
            socket.broadcast.emit('playerMove', player.serialize());
        }
    });

    // 处理方块更新
    socket.on('blockUpdate', (data) => {
        const key = `${data.x},${data.y},${data.z}`;
        
        if (data.action === 'break') {
            gameState.world.blocks.delete(key);
        } else if (data.action === 'place' && data.blockId) {
            gameState.world.blocks.set(key, data.blockId);
        }

        // 广播给所有玩家
        io.emit('blockUpdate', {
            ...data,
            playerId: playerId
        });
    });

    // 处理聊天消息
    socket.on('chatMessage', (data) => {
        const player = gameState.players.get(playerId);
        if (player) {
            // 广播聊天消息
            io.emit('chatMessage', {
                username: player.username,
                message: data.message,
                playerId: playerId
            });
        }
    });

    // 处理断开连接
    socket.on('disconnect', () => {
        console.log(`玩家断开：${playerId} (${player.username})`);
        
        const player = gameState.players.get(playerId);
        if (player) {
            gameState.players.delete(playerId);
            
            // 广播玩家离开
            io.emit('playerLeave', playerId);
        }
    });

    // 错误处理
    socket.on('error', (error) => {
        console.error(`玩家 ${playerId} 错误:`, error);
    });
});

// 定期清理不活跃的玩家
setInterval(() => {
    const now = Date.now();
    for (const [id, player] of gameState.players.entries()) {
        if (now - player.lastUpdate > 60000) { // 1 分钟无活动
            console.log(`踢出不活跃玩家：${player.username}`);
            player.socket.disconnect();
            gameState.players.delete(id);
            io.emit('playerLeave', id);
        }
    }
}, 30000);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('==========================================');
    console.log('  我的世界 v26.1 服务器已启动');
    console.log(`  监听端口：${PORT}`);
    console.log(`  访问地址：http://localhost:${PORT}`);
    console.log('==========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('服务器正在关闭...');
    io.close();
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('服务器正在关闭...');
    io.close();
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
