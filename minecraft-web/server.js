const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// 游戏世界配置
const WORLD_SIZE = 100;
const CHUNK_SIZE = 16;
const VERSION = "26.1";

// 存储所有玩家
const players = new Map();
// 简单的世界数据 (x, y, z) -> blockType
const worldData = new Map();

// 初始化一些基础地形
function initializeWorld() {
    for (let x = -WORLD_SIZE/2; x < WORLD_SIZE/2; x++) {
        for (let z = -WORLD_SIZE/2; z < WORLD_SIZE/2; z++) {
            // 简单的平地地形
            const y = 0;
            worldData.set(`${x},${y},${z}`, 1); // 草地
            if (Math.random() > 0.95) {
                // 随机生成一些树
                worldData.set(`${x},${y+1},${z}`, 2); // 树干
                worldData.set(`${x},${y+2},${z}`, 2);
                worldData.set(`${x},${y+3},${z}`, 3); // 树叶
            }
        }
    }
}

initializeWorld();

io.on('connection', (socket) => {
    const playerId = uuidv4();
    console.log(`玩家连接: ${playerId}`);

    // 发送初始游戏数据
    socket.emit('init', {
        playerId: playerId,
        version: VERSION,
        worldSize: WORLD_SIZE
    });

    // 新玩家加入
    socket.on('join', (playerData) => {
        const player = {
            id: playerId,
            name: playerData.name || 'Player',
            x: playerData.x || 0,
            y: playerData.y || 5,
            z: playerData.z || 0,
            rotation: playerData.rotation || { yaw: 0, pitch: 0 }
        };
        
        players.set(playerId, player);
        
        // 通知所有玩家有新玩家加入
        io.emit('playerJoined', player);
        
        // 发送现有玩家列表给新玩家
        socket.emit('existingPlayers', Array.from(players.values()));
    });

    // 处理玩家移动
    socket.on('move', (data) => {
        const player = players.get(playerId);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.z = data.z;
            player.rotation = data.rotation;
            
            // 广播位置更新给其他玩家
            socket.broadcast.emit('playerMoved', {
                playerId: playerId,
                x: data.x,
                y: data.y,
                z: data.z,
                rotation: data.rotation
            });
        }
    });

    // 处理方块放置/破坏
    socket.on('blockAction', (data) => {
        const { action, x, y, z, blockType } = data;
        const key = `${x},${y},${z}`;
        
        if (action === 'place') {
            worldData.set(key, blockType);
        } else if (action === 'break') {
            worldData.delete(key);
        }
        
        // 广播方块变化
        io.emit('blockChanged', {
            action,
            x,
            y,
            z,
            blockType
        });
    });

    // 处理聊天消息
    socket.on('chatMessage', (message) => {
        const player = players.get(playerId);
        if (player) {
            io.emit('chatMessage', {
                player: player.name,
                message: message,
                timestamp: Date.now()
            });
        }
    });

    // 玩家断开连接
    socket.on('disconnect', () => {
        const player = players.get(playerId);
        if (player) {
            players.delete(playerId);
            io.emit('playerLeft', { playerId: playerId });
            console.log(`玩家断开: ${playerId}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Minecraft Web Server v${VERSION} running on port ${PORT}`);
    console.log(`访问 http://localhost:${PORT} 开始游戏`);
});
