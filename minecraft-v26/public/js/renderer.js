/**
 * 我的世界 v26.1 - 渲染引擎
 * 使用 Three.js 进行 3D 渲染
 */

class GameRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // 方块网格缓存
        this.blockMeshes = new Map();
        this.chunkMeshes = new Map();
        
        // 材质缓存
        this.materials = new Map();
        
        // 几何体缓存
        this.boxGeometry = null;
        
        // 渲染设置
        this.renderDistance = 4;
        this.fov = 75;
        this.near = 0.1;
        this.far = 1000;
        
        // 选择框
        this.highlightMesh = null;
        
        // 玩家标记（其他玩家）
        this.playerMarkers = new Map();
        
        // 性能统计
        this.stats = {
            meshes: 0,
            triangles: 0,
            fps: 0
        };
        
        // 时钟
        this.clock = new THREE.Clock();
    }

    /**
     * 初始化渲染器
     */
    init(container) {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // 天空蓝
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, this.renderDistance * 16);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            window.innerWidth / window.innerHeight,
            this.near,
            this.far
        );
        this.camera.position.set(0, 70, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 清空容器并添加渲染器
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // 创建基础几何体
        this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);

        // 创建材质
        this.createMaterials();

        // 添加光照
        this.setupLighting();

        // 创建选择框
        this.createHighlightBox();

        // 指针锁定控制
        this.setupPointerLock();

        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize(), false);

        console.log("渲染引擎初始化完成");
    }

    /**
     * 创建方块材质
     */
    createMaterials() {
        const materialConfigs = [
            { id: BlockTypes.GRASS, color: 0x5b8c38, name: "grass" },
            { id: BlockTypes.DIRT, color: 0x8b6a45, name: "dirt" },
            { id: BlockTypes.STONE, color: 0x808080, name: "stone" },
            { id: BlockTypes.LOG_OAK, color: 0x5c4033, name: "log" },
            { id: BlockTypes.LEAVES_OAK, color: 0x3a5f0b, transparent: true, opacity: 0.9, name: "leaves" },
            { id: BlockTypes.SAND, color: 0xe6e288, name: "sand" },
            { id: BlockTypes.BRICK, color: 0xb05c38, name: "brick" },
            { id: BlockTypes.GLASS, color: 0xffffff, transparent: true, opacity: 0.5, name: "glass" },
            { id: BlockTypes.PLANKS_OAK, color: 0xa0825a, name: "planks" },
            { id: BlockTypes.COBBLESTONE, color: 0x6b6b6b, name: "cobblestone" },
            { id: BlockTypes.MOSSY_COBBLESTONE, color: 0x5a7a5a, name: "mossy_cobble" },
            { id: BlockTypes.OBSIDIAN, color: 0x1a1a2e, name: "obsidian" },
            { id: BlockTypes.COAL_ORE, color: 0x808080, emissive: 0x2a2a2a, emissiveIntensity: 0.2, name: "coal_ore" },
            { id: BlockTypes.IRON_ORE, color: 0x808080, emissive: 0xd4a574, emissiveIntensity: 0.3, name: "iron_ore" },
            { id: BlockTypes.GOLD_ORE, color: 0x808080, emissive: 0xffd700, emissiveIntensity: 0.4, name: "gold_ore" },
            { id: BlockTypes.DIAMOND_ORE, color: 0x808080, emissive: 0x4deeea, emissiveIntensity: 0.5, name: "diamond_ore" },
            { id: BlockTypes.BEDROCK, color: 0x2a2a2a, name: "bedrock" },
            { id: BlockTypes.WATER, color: 0x3060a0, transparent: true, opacity: 0.6, name: "water" },
            { id: BlockTypes.SNOW, color: 0xffffff, name: "snow" },
            { id: BlockTypes.ICE, color: 0xa0c0e0, transparent: true, opacity: 0.7, name: "ice" },
            { id: BlockTypes.CLAY, color: 0xc0c0c0, name: "clay" },
            { id: BlockTypes.GRAVEL, color: 0x808080, name: "gravel" },
            { id: BlockTypes.NETHERRACK, color: 0x803030, name: "netherrack" },
            { id: BlockTypes.SOUL_SAND, color: 0x5a4a3a, name: "soul_sand" },
            { id: BlockTypes.GLOWSTONE, color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.8, name: "glowstone" },
            { id: BlockTypes.END_STONE, color: 0xe0e0a0, name: "end_stone" }
        ];

        for (const config of materialConfigs) {
            const material = new THREE.MeshLambertMaterial({
                color: config.color,
                transparent: config.transparent || false,
                opacity: config.opacity !== undefined ? config.opacity : 1.0,
                emissive: config.emissive || 0x000000,
                emissiveIntensity: config.emissiveIntensity || 0
            });
            
            this.materials.set(config.id, material);
        }
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 平行光（太阳）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // 半球光（天空和地面反射）
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x5b8c38, 0.3);
        this.scene.add(hemisphereLight);
    }

    /**
     * 创建选择框
     */
    createHighlightBox() {
        const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.highlightMesh = new THREE.LineSegments(edges, material);
        this.highlightMesh.visible = false;
        this.scene.add(this.highlightMesh);
    }

    /**
     * 设置指针锁定控制
     */
    setupPointerLock() {
        const canvas = this.renderer.domElement;
        
        // 简单的鼠标控制
        let isLocked = false;
        let yaw = 0;
        let pitch = 0;

        canvas.addEventListener('click', () => {
            if (!isLocked) {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            isLocked = document.pointerLockElement === canvas;
        });

        document.addEventListener('mousemove', (event) => {
            if (isLocked) {
                const sensitivity = 0.002;
                yaw -= event.movementX * sensitivity;
                pitch -= event.movementY * sensitivity;
                
                // 限制垂直视角
                pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
                
                // 触发视角更新事件
                const customEvent = new CustomEvent('playerLook', {
                    detail: { yaw: yaw * 180 / Math.PI, pitch: pitch * 180 / Math.PI }
                });
                document.dispatchEvent(customEvent);
            }
        });
    }

    /**
     * 获取或创建方块网格
     */
    getBlockMesh(blockId) {
        let mesh = this.blockMeshes.get(blockId);
        
        if (!mesh) {
            const material = this.materials.get(blockId);
            if (material) {
                mesh = new THREE.Mesh(this.boxGeometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.blockMeshes.set(blockId, mesh);
            }
        }
        
        return mesh;
    }

    /**
     * 渲染单个方块
     */
    renderBlock(x, y, z, blockId) {
        const mesh = this.getBlockMesh(blockId);
        if (!mesh) return null;
        
        const instance = mesh.clone();
        instance.position.set(x, y, z);
        instance.userData = { x, y, z, blockId };
        this.scene.add(instance);
        
        return instance;
    }

    /**
     * 批量渲染区块
     */
    renderChunk(chunkX, chunkZ, world) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // 如果已存在，先移除
        if (this.chunkMeshes.has(chunkKey)) {
            this.removeChunk(chunkKey);
        }

        const chunkSize = 16;
        const startX = chunkX * chunkSize;
        const startZ = chunkZ * chunkSize;
        
        // 创建 InstancedMesh 用于高效渲染
        const maxBlocks = chunkSize * chunkSize * world.worldHeight;
        const instances = [];
        
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                for (let y = 0; y < world.worldHeight; y++) {
                    const blockId = world.getBlock(startX + x, y, startZ + z);
                    
                    if (blockId !== BlockTypes.AIR) {
                        // 检查是否至少有一个面可见（简化：只检查上方）
                        const above = world.getBlock(startX + x, y + 1, startZ + z);
                        if (above === BlockTypes.AIR || BlockProperties[above]?.transparent) {
                            instances.push({ x: startX + x, y, z: startZ + z, blockId });
                        }
                    }
                }
            }
        }
        
        if (instances.length === 0) return;
        
        // 按方块类型分组
        const byType = new Map();
        for (const inst of instances) {
            if (!byType.has(inst.blockId)) {
                byType.set(inst.blockId, []);
            }
            byType.get(inst.blockId).push(inst);
        }
        
        const chunkGroup = new THREE.Group();
        
        for (const [blockId, blocks] of byType.entries()) {
            const material = this.materials.get(blockId);
            if (!material) continue;
            
            const instancedMesh = new THREE.InstancedMesh(
                this.boxGeometry,
                material,
                blocks.length
            );
            
            instancedMesh.castShadow = true;
            instancedMesh.receiveShadow = true;
            
            const matrix = new THREE.Matrix4();
            for (let i = 0; i < blocks.length; i++) {
                const b = blocks[i];
                matrix.setPosition(b.x, b.y, b.z);
                instancedMesh.setMatrixAt(i, matrix);
            }
            
            chunkGroup.add(instancedMesh);
        }
        
        this.scene.add(chunkGroup);
        this.chunkMeshes.set(chunkKey, chunkGroup);
        
        this.stats.meshes += byType.size;
        this.stats.triangles += instances.length * 2; // 每个方块约 2 个三角形（可见面）
    }

    /**
     * 移除区块
     */
    removeChunk(chunkKey) {
        const chunk = this.chunkMeshes.get(chunkKey);
        if (chunk) {
            this.scene.remove(chunk);
            
            // 清理内存
            chunk.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
            
            this.chunkMeshes.delete(chunkKey);
        }
    }

    /**
     * 更新选择框位置
     */
    updateHighlight(position) {
        if (position && position.hit) {
            this.highlightMesh.position.set(position.x, position.y, position.z);
            this.highlightMesh.visible = true;
        } else {
            this.highlightMesh.visible = false;
        }
    }

    /**
     * 更新/添加玩家标记
     */
    updatePlayerMarker(playerData) {
        let marker = this.playerMarkers.get(playerData.id);
        
        if (!marker) {
            // 创建玩家模型（简单的胶囊体）
            const group = new THREE.Group();
            
            // 身体
            const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
            const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3366cc });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.9;
            group.add(body);
            
            // 头部
            const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const headMat = new THREE.MeshLambertMaterial({ color: 0xffccaa });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 1.6;
            group.add(head);
            
            // 名称标签
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, 256, 64);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(playerData.username, 128, 42);
            
            const texture = new THREE.CanvasTexture(canvas);
            const labelMat = new THREE.SpriteMaterial({ map: texture });
            const label = new THREE.Sprite(labelMat);
            label.position.y = 2.2;
            label.scale.set(2, 0.5, 1);
            group.add(label);
            
            marker = group;
            this.scene.add(marker);
            this.playerMarkers.set(playerData.id, marker);
        }
        
        marker.position.set(playerData.x, playerData.y, playerData.z);
        
        // 更新名称
        const label = marker.children.find(c => c instanceof THREE.Sprite);
        if (label) {
            const canvas = label.material.map.image;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(playerData.username, canvas.width / 2, 42);
            label.material.map.needsUpdate = true;
        }
    }

    /**
     * 移除玩家标记
     */
    removePlayerMarker(playerId) {
        const marker = this.playerMarkers.get(playerId);
        if (marker) {
            this.scene.remove(marker);
            this.playerMarkers.delete(playerId);
        }
    }

    /**
     * 设置相机位置
     */
    setCameraPosition(x, y, z, yaw, pitch) {
        this.camera.position.set(x, y, z);
        
        // 计算观察点
        const yawRad = yaw * Math.PI / 180;
        const pitchRad = pitch * Math.PI / 180;
        
        const lookDist = 10;
        const lookX = x - Math.sin(yawRad) * Math.cos(pitchRad) * lookDist;
        const lookY = y - Math.sin(pitchRad) * lookDist;
        const lookZ = z - Math.cos(yawRad) * Math.cos(pitchRad) * lookDist;
        
        this.camera.lookAt(lookX, lookY, lookZ);
    }

    /**
     * 窗口大小调整
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 渲染帧
     */
    render() {
        const delta = this.clock.getDelta();
        
        // 更新 FPS
        this.stats.fps = Math.round(1 / delta);
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
        
        return delta;
    }

    /**
     * 清理资源
     */
    dispose() {
        // 清理所有网格
        for (const mesh of this.chunkMeshes.values()) {
            this.scene.remove(mesh);
            mesh.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }
        
        // 清理材质
        for (const material of this.materials.values()) {
            material.dispose();
        }
        
        // 清理几何体
        if (this.boxGeometry) this.boxGeometry.dispose();
        
        // 清理渲染器
        if (this.renderer) {
            this.renderer.dispose();
        }
    }

    /**
     * 获取渲染统计
     */
    getStats() {
        return {
            ...this.stats,
            loadedChunks: this.chunkMeshes.size,
            playerMarkers: this.playerMarkers.size
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameRenderer };
} else {
    window.GameRenderer = GameRenderer;
}

console.log("渲染引擎 v26.1 加载完成");
