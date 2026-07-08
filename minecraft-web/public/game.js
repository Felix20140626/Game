// Minecraft Web v26.1 - 客户端游戏逻辑

let scene, camera, renderer;
let socket;
let playerId;
let players = new Map();
let blocks = new Map();
let selectedBlockType = 1;

// 玩家状态
let playerPosition = { x: 0, y: 5, z: 0 };
let playerRotation = { yaw: 0, pitch: 0 };
let velocity = { x: 0, y: 0, z: 0 };
let isOnGround = false;

// 控制状态
const keys = {};
let isPointerLocked = false;

// 方块类型定义
const BLOCK_TYPES = {
    1: { name: 'Grass', color: 0x5C9E47 },
    2: { name: 'Dirt', color: 0x8B4513 },
    3: { name: 'Leaves', color: 0x228B22 },
    4: { name: 'Stone', color: 0x808080 },
    5: { name: 'Gold', color: 0xFFD700 }
};

// 初始化 Three.js 场景
function initScene() {
    const container = document.getElementById('canvas-container');
    
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // 窗口大小调整
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 初始化 Socket.IO 连接
function initSocket() {
    socket = io();
    
    socket.on('init', (data) => {
        playerId = data.playerId;
        console.log(`连接到服务器，版本：${data.version}`);
        addSystemMessage(`欢迎来到 Minecraft Web v${data.version}!`);
        
        // 加入游戏
        socket.emit('join', {
            name: 'Player_' + Math.floor(Math.random() * 1000),
            x: playerPosition.x,
            y: playerPosition.y,
            z: playerPosition.z
        });
    });
    
    socket.on('existingPlayers', (playerList) => {
        playerList.forEach(player => {
            if (player.id !== playerId) {
                addPlayer(player);
            }
        });
    });
    
    socket.on('playerJoined', (player) => {
        if (player.id !== playerId) {
            addPlayer(player);
            addSystemMessage(`${player.name} 加入了游戏`);
        }
    });
    
    socket.on('playerMoved', (data) => {
        const playerMesh = players.get(data.playerId);
        if (playerMesh) {
            playerMesh.position.set(data.x, data.y, data.z);
        }
    });
    
    socket.on('playerLeft', (data) => {
        const playerMesh = players.get(data.playerId);
        if (playerMesh) {
            scene.remove(playerMesh);
            players.delete(data.playerId);
            updatePlayerList();
        }
    });
    
    socket.on('blockChanged', (data) => {
        updateBlock(data.x, data.y, data.z, data.action === 'place' ? data.blockType : null);
    });
    
    socket.on('chatMessage', (data) => {
        addChatMessage(data.player, data.message);
    });
}

// 添加玩家模型
function addPlayer(playerData) {
    const geometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const playerMesh = new THREE.Mesh(geometry, material);
    playerMesh.position.set(playerData.x, playerData.y, playerData.z);
    playerMesh.castShadow = true;
    
    // 添加玩家名称标签
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'white';
    context.font = 'Bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(playerData.name, 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(3, 1, 1);
    sprite.position.set(0, 2.5, 0);
    playerMesh.add(sprite);
    
    scene.add(playerMesh);
    players.set(playerData.id, playerMesh);
    updatePlayerList();
}

// 创建方块
function createBlock(x, y, z, blockType) {
    const key = `${x},${y},${z}`;
    if (blocks.has(key)) return;
    
    const blockData = BLOCK_TYPES[blockType];
    if (!blockData) return;
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: blockData.color });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x + 0.5, y + 0.5, z + 0.5);
    block.castShadow = true;
    block.receiveShadow = true;
    block.userData = { blockType, x, y, z };
    
    scene.add(block);
    blocks.set(key, block);
}

// 更新方块
function updateBlock(x, y, z, blockType) {
    const key = `${x},${y},${z}`;
    
    // 移除现有方块
    const existingBlock = blocks.get(key);
    if (existingBlock) {
        scene.remove(existingBlock);
        blocks.delete(key);
    }
    
    // 放置新方块
    if (blockType !== null) {
        createBlock(x, y, z, blockType);
    }
}

// 初始化世界
function initializeWorld() {
    // 创建基础地形
    for (let x = -20; x < 20; x++) {
        for (let z = -20; z < 20; z++) {
            createBlock(x, 0, z, 1); // 草地
            
            // 随机生成一些树
            if (Math.random() > 0.95 && !(x === 0 && z === 0)) {
                createBlock(x, 1, z, 2); // 树干
                createBlock(x, 2, z, 2);
                createBlock(x, 3, z, 3); // 树叶
                createBlock(x+1, 3, z, 3);
                createBlock(x-1, 3, z, 3);
                createBlock(x, 3, z+1, 3);
                createBlock(x, 3, z-1, 3);
            }
        }
    }
}

// 设置指针锁定
function setupPointerLock() {
    const canvas = renderer.domElement;
    
    canvas.addEventListener('click', (event) => {
        if (!isPointerLocked) {
            canvas.requestPointerLock();
        } else {
            // 点击时放置/破坏方块
            interactWithBlock(event);
        }
    });
    
    // 添加 mousedown 事件监听器以区分左右键
    canvas.addEventListener('mousedown', (event) => {
        if (isPointerLocked && (event.button === 0 || event.button === 2)) {
            interactWithBlock(event);
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === canvas;
    });
    
    document.addEventListener('mousemove', (event) => {
        if (isPointerLocked) {
            playerRotation.yaw -= event.movementX * 0.002;
            playerRotation.pitch -= event.movementY * 0.002;
            
            // 限制垂直视角
            playerRotation.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, playerRotation.pitch));
        }
    });
}

// 与方块交互
function interactWithBlock(event) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const intersects = raycaster.intersectObjects(Array.from(blocks.values()));
    
    if (intersects.length > 0 && intersects[0].distance < 6) {
        const intersect = intersects[0];
        const block = intersect.object;
        
        // 使用 event.button 判断左右键，如果没有 event 则默认为左键
        const button = event ? event.button : 0;
        
        if (button === 0) { // 左键 - 破坏方块
            socket.emit('blockAction', {
                action: 'break',
                x: Math.floor(block.position.x - 0.5),
                y: Math.floor(block.position.y - 0.5),
                z: Math.floor(block.position.z - 0.5)
            });
        } else if (button === 2) { // 右键 - 放置方块
            const normal = intersect.face.normal;
            const newX = Math.floor(block.position.x - 0.5 + normal.x);
            const newY = Math.floor(block.position.y - 0.5 + normal.y);
            const newZ = Math.floor(block.position.z - 0.5 + normal.z);
            
            // 检查是否与玩家位置重叠
            const playerBox = new THREE.Box3();
            playerBox.setFromCenterAndSize(
                new THREE.Vector3(playerPosition.x, playerPosition.y - 0.9, playerPosition.z),
                new THREE.Vector3(0.6, 1.8, 0.6)
            );
            
            const newBlockBox = new THREE.Box3();
            newBlockBox.setFromMinAndMax(
                new THREE.Vector3(newX, newY, newZ),
                new THREE.Vector3(newX + 1, newY + 1, newZ + 1)
            );
            
            if (!playerBox.intersectsBox(newBlockBox)) {
                socket.emit('blockAction', {
                    action: 'place',
                    x: newX,
                    y: newY,
                    z: newZ,
                    blockType: selectedBlockType
                });
            }
        }
    }
}

// 键盘控制
function setupControls() {
    document.addEventListener('keydown', (event) => {
        keys[event.code] = true;
        
        // 数字键选择方块
        if (event.code >= 'Digit1' && event.code <= 'Digit5') {
            const slotIndex = parseInt(event.code.replace('Digit', '')) - 1;
            selectHotbarSlot(slotIndex);
        }
        
        // Enter 发送聊天消息
        if (event.code === 'Enter') {
            const chatInput = document.getElementById('chat-input');
            if (document.activeElement !== chatInput) {
                chatInput.focus();
            } else if (chatInput.value.trim()) {
                socket.emit('chatMessage', chatInput.value.trim());
                chatInput.value = '';
                chatInput.blur();
            }
        }
        
        // Escape 退出指针锁定
        if (event.code === 'Escape' && isPointerLocked) {
            document.exitPointerLock();
        }
    });
    
    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
    
    // 鼠标右键菜单
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
}

// 选择快捷栏槽位
function selectHotbarSlot(index) {
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((slot, i) => {
        if (i === index) {
            slot.classList.add('active');
            selectedBlockType = parseInt(slot.dataset.block);
        } else {
            slot.classList.remove('active');
        }
    });
}

// 处理聊天输入
function setupChat() {
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('blur', () => {
        if (isPointerLocked) {
            renderer.domElement.requestPointerLock();
        }
    });
}

// 更新玩家列表 UI
function updatePlayerList() {
    const playerList = document.getElementById('players');
    const playerCount = document.getElementById('player-count');
    
    playerList.innerHTML = '';
    players.forEach((mesh, id) => {
        const li = document.createElement('li');
        const sprite = mesh.children.find(child => child instanceof THREE.Sprite);
        if (sprite) {
            li.textContent = sprite.material.map.image.getContext('2d').measureText('').font;
        }
        li.textContent = `Player_${id.substring(0, 8)}`;
        playerList.appendChild(li);
    });
    
    playerCount.textContent = players.size + 1; // +1 为自己
}

// 添加系统消息
function addSystemMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message system-message';
    div.textContent = `[系统] ${message}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加聊天消息
function addChatMessage(player, message) {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message player-message';
    div.textContent = `<${player}> ${message}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 物理和移动
function updatePhysics(deltaTime) {
    const speed = 5.0;
    const jumpForce = 8.0;
    const gravity = 20.0;
    
    // 获取移动方向
    let moveX = 0;
    let moveZ = 0;
    
    if (keys['KeyW'] || keys['ArrowUp']) moveZ = -1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;
    
    // 根据朝向计算实际移动方向
    if (moveX !== 0 || moveZ !== 0) {
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= length;
        moveZ /= length;
        
        const sin = Math.sin(playerRotation.yaw);
        const cos = Math.cos(playerRotation.yaw);
        
        velocity.x = (moveX * cos - moveZ * sin) * speed;
        velocity.z = (moveX * sin + moveZ * cos) * speed;
    } else {
        velocity.x = 0;
        velocity.z = 0;
    }
    
    // 跳跃
    if ((keys['Space'] || keys['ArrowUp']) && isOnGround) {
        velocity.y = jumpForce;
        isOnGround = false;
    }
    
    // 应用重力
    velocity.y -= gravity * deltaTime;
    
    // 更新位置
    playerPosition.x += velocity.x * deltaTime;
    playerPosition.y += velocity.y * deltaTime;
    playerPosition.z += velocity.z * deltaTime;
    
    // 简单的地面碰撞检测
    if (playerPosition.y < 5) {
        playerPosition.y = 5;
        velocity.y = 0;
        isOnGround = true;
    }
    
    // 更新相机位置
    camera.position.set(playerPosition.x, playerPosition.y, playerPosition.z);
    
    // 更新相机旋转
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerRotation.yaw;
    camera.rotation.x = playerRotation.pitch;
    
    // 广播位置
    socket.emit('move', {
        x: playerPosition.x,
        y: playerPosition.y,
        z: playerPosition.z,
        rotation: playerRotation
    });
    
    // 更新 UI
    document.getElementById('coords').textContent = 
        `Position: ${playerPosition.x.toFixed(1)}, ${playerPosition.y.toFixed(1)}, ${playerPosition.z.toFixed(1)}`;
}

// FPS 计数器
let frameCount = 0;
let lastFpsUpdate = 0;

function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate >= 1000) {
        document.getElementById('fps').textContent = `FPS: ${frameCount}`;
        frameCount = 0;
        lastFpsUpdate = now;
    }
}

// 游戏主循环
let lastTime = performance.now();

function gameLoop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    updatePhysics(deltaTime);
    updateFPS();
    
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

// 初始化游戏
function init() {
    initScene();
    initSocket();
    setupPointerLock();
    setupControls();
    setupChat();
    initializeWorld();
    
    // 快捷栏点击事件
    document.querySelectorAll('.hotbar-slot').forEach((slot, index) => {
        slot.addEventListener('click', () => selectHotbarSlot(index));
    });
    
    addSystemMessage('WASD 移动，空格跳跃，鼠标查看，左键破坏方块，右键放置方块');
    addSystemMessage('按 1-5 选择方块类型，Enter 聊天，ESC 退出鼠标锁定');
    
    gameLoop();
}

// 启动游戏
window.addEventListener('load', init);
