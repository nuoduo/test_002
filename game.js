// 游戏常量
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 40;
const TANK_SIZE = 32;
const BULLET_SIZE = 8;
const TANK_SPEED = 2;
const BULLET_SPEED = 5;
const MAX_BULLETS = 3;

// 方向常量
const DIRECTIONS = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
};

// 游戏状态
const GAME_STATES = {
    START: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    LEVEL_SELECT: 4,
    SETTINGS: 5
};

// 游戏对象
class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw(ctx) {
        // 基类方法，子类重写
    }
    
    update() {
        // 基类方法，子类重写
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// 墙壁类
class Wall extends GameObject {
    constructor(x, y, type = 1) {
        super(x, y, TILE_SIZE, TILE_SIZE);
        this.type = type; // 1: 普通墙壁, 2: 钢铁墙壁, 3: 草地, 4: 河流
        this.destroyable = type === 1;
    }
    
    draw(ctx) {
        switch(this.type) {
            case 1: // 普通墙壁
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
            case 2: // 钢铁墙壁
                ctx.fillStyle = '#A9A9A9';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
            case 3: // 草地
                ctx.fillStyle = '#006400';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
            case 4: // 河流
                ctx.fillStyle = '#1E90FF';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
        }
    }
}

// 坦克类
class Tank extends GameObject {
    constructor(x, y, color, isPlayer = false) {
        super(x, y, TANK_SIZE, TANK_SIZE);
        this.color = color;
        this.isPlayer = isPlayer;
        this.direction = DIRECTIONS.UP;
        this.speed = TANK_SPEED;
        this.canShoot = true;
        this.shootCooldown = 0;
        this.alive = true;
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // 根据方向旋转
        switch(this.direction) {
            case DIRECTIONS.UP:
                ctx.rotate(0);
                break;
            case DIRECTIONS.DOWN:
                ctx.rotate(Math.PI);
                break;
            case DIRECTIONS.LEFT:
                ctx.rotate(-Math.PI / 2);
                break;
            case DIRECTIONS.RIGHT:
                ctx.rotate(Math.PI / 2);
                break;
        }
        
        // 绘制坦克车身
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 绘制坦克炮管
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-2, -this.height / 2 - 8, 4, 12);
        
        ctx.restore();
    }
    
    update() {
        if (!this.alive) return;
        
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        if (this.shootCooldown === 0) {
            this.canShoot = true;
        }
    }
    
    move(direction, walls, tanks) {
        if (!this.alive) return;
        
        this.direction = direction;
        let newX = this.x;
        let newY = this.y;
        
        switch(direction) {
            case DIRECTIONS.UP:
                newY -= this.speed;
                break;
            case DIRECTIONS.DOWN:
                newY += this.speed;
                break;
            case DIRECTIONS.LEFT:
                newX -= this.speed;
                break;
            case DIRECTIONS.RIGHT:
                newX += this.speed;
                break;
        }
        
        // 边界检测
        if (newX < 0 || newX + this.width > CANVAS_WIDTH || 
            newY < 0 || newY + this.height > CANVAS_HEIGHT) {
            return false;
        }
        
        // 墙壁碰撞检测
        for (let wall of walls) {
            if (this.checkCollision(newX, newY, wall)) {
                return false;
            }
        }
        
        // 坦克碰撞检测
        for (let tank of tanks) {
            if (tank !== this && this.checkCollision(newX, newY, tank)) {
                return false;
            }
        }
        
        this.x = newX;
        this.y = newY;
        return true;
    }
    
    shoot() {
        if (!this.alive || !this.canShoot) return null;
        
        this.canShoot = false;
        this.shootCooldown = 30; // 30帧冷却
        
        // 计算炮弹起始位置
        let bulletX = this.x + this.width / 2 - BULLET_SIZE / 2;
        let bulletY = this.y + this.height / 2 - BULLET_SIZE / 2;
        
        switch(this.direction) {
            case DIRECTIONS.UP:
                bulletY -= this.height / 2;
                break;
            case DIRECTIONS.DOWN:
                bulletY += this.height / 2;
                break;
            case DIRECTIONS.LEFT:
                bulletX -= this.width / 2;
                break;
            case DIRECTIONS.RIGHT:
                bulletX += this.width / 2;
                break;
        }
        
        return new Bullet(bulletX, bulletY, this.direction, this.isPlayer);
    }
    
    checkCollision(newX, newY, other) {
        return newX < other.x + other.width &&
               newX + this.width > other.x &&
               newY < other.y + other.height &&
               newY + this.height > other.y;
    }
    
    destroy() {
        this.alive = false;
    }
}

// 炮弹类
class Bullet extends GameObject {
    constructor(x, y, direction, isPlayerBullet) {
        super(x, y, BULLET_SIZE, BULLET_SIZE);
        this.direction = direction;
        this.isPlayerBullet = isPlayerBullet;
        this.active = true;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.fillStyle = this.isPlayerBullet ? '#00ff00' : '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    update() {
        if (!this.active) return;
        
        switch(this.direction) {
            case DIRECTIONS.UP:
                this.y -= BULLET_SPEED;
                break;
            case DIRECTIONS.DOWN:
                this.y += BULLET_SPEED;
                break;
            case DIRECTIONS.LEFT:
                this.x -= BULLET_SPEED;
                break;
            case DIRECTIONS.RIGHT:
                this.x += BULLET_SPEED;
                break;
        }
        
        // 边界检测
        if (this.x < 0 || this.x + this.width > CANVAS_WIDTH || 
            this.y < 0 || this.y + this.height > CANVAS_HEIGHT) {
            this.active = false;
        }
    }
    
    checkCollision(other) {
        return this.active &&
               this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    destroy() {
        this.active = false;
    }
}

// 爆炸效果类
class Explosion extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.frame = 0;
        this.maxFrames = 8;
        this.active = true;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.fillStyle = `hsl(${this.frame * 10}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.frame * 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    update() {
        if (!this.active) return;
        
        this.frame++;
        if (this.frame >= this.maxFrames) {
            this.active = false;
        }
    }
}

// 音效类
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        // 预加载音效
        this.loadSounds();
    }
    
    loadSounds() {
        // 这里使用Web Audio API或Audio元素实现音效
        // 简化实现，仅记录音效名称
        this.sounds = {
            move: 'move.mp3',
            shoot: 'shoot.mp3',
            explode: 'explode.mp3',
            levelUp: 'levelUp.mp3',
            gameOver: 'gameOver.mp3'
        };
    }
    
    play(soundName) {
        if (this.enabled && this.sounds[soundName]) {
            // 实际项目中这里会播放音效
            console.log(`Playing sound: ${soundName}`);
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// 关卡类
class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.walls = [];
        this.enemyTanks = [];
        this.playerStartX = TILE_SIZE;
        this.playerStartY = CANVAS_HEIGHT - TILE_SIZE * 2;
        this.initialize();
    }
    
    initialize() {
        // 根据关卡生成地图
        this.generateMap();
        // 根据关卡生成敌人坦克
        this.generateEnemies();
    }
    
    generateMap() {
        // 简化的地图生成，实际项目中可以使用更复杂的算法
        const map = [
            // 关卡1
            [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
                [1, 0, 3, 3, 0, 3, 3, 0, 3, 3, 3, 3, 0, 3, 3, 0, 3, 3, 0, 1],
                [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
                [1, 0, 3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 0, 1],
                [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
                [1, 0, 3, 3, 0, 3, 3, 0, 3, 3, 3, 3, 0, 3, 3, 0, 3, 3, 0, 1],
                [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ]
        ];
        
        // 如果关卡超出预设地图，使用默认地图
        const currentMap = map[this.levelNumber - 1] || map[0];
        
        for (let y = 0; y < currentMap.length; y++) {
            for (let x = 0; x < currentMap[y].length; x++) {
                const tileType = currentMap[y][x];
                if (tileType > 0) {
                    this.walls.push(new Wall(x * TILE_SIZE, y * TILE_SIZE, tileType));
                }
            }
        }
    }
    
    generateEnemies() {
        // 根据关卡生成敌人坦克数量
        const enemyCount = Math.min(3 + this.levelNumber, 8);
        
        for (let i = 0; i < enemyCount; i++) {
            const x = CANVAS_WIDTH - TILE_SIZE * 2;
            const y = TILE_SIZE * (i + 1);
            this.enemyTanks.push(new Tank(x, y, '#ff0000', false));
        }
    }
    
    getWalls() {
        return this.walls;
    }
    
    getEnemyTanks() {
        return this.enemyTanks;
    }
}

// 游戏主类
class TankGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = GAME_STATES.START;
        this.currentLevel = 1;
        this.maxLevel = 5;
        this.score = 0;
        this.lives = 3;
        this.enemiesLeft = 0;
        
        this.player = null;
        this.walls = [];
        this.enemyTanks = [];
        this.bullets = [];
        this.explosions = [];
        
        this.keys = {};
        this.touchControls = {};
        
        this.soundManager = new SoundManager();
        this.lastTime = 0;
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.setupTouchControls();
        this.loadGameData();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // 暂停游戏
            if (e.code === 'Escape') {
                if (this.gameState === GAME_STATES.PLAYING) {
                    this.pauseGame();
                } else if (this.gameState === GAME_STATES.PAUSED) {
                    this.resumeGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('levelSelectBtn').addEventListener('click', () => {
            this.showLevelSelect();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('quitBtn').addEventListener('click', () => {
            this.quitGame();
        });
        
        document.getElementById('restartGameBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.quitGame();
        });
        
        document.getElementById('backToStartBtn').addEventListener('click', () => {
            this.showStartScreen();
        });
        
        document.getElementById('backFromSettingsBtn').addEventListener('click', () => {
            this.showStartScreen();
        });
        
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });
    }
    
    setupTouchControls() {
        // 方向控制
        const controlBtns = document.querySelectorAll('.control-btn');
        controlBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.touchControls[direction] = true;
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.touchControls[direction] = false;
            });
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.touchControls[direction] = true;
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.touchControls[direction] = false;
            });
        });
        
        // 发射按钮
        const fireBtn = document.getElementById('fireBtn');
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.fire = true;
        });
        
        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.fire = false;
        });
        
        fireBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchControls.fire = true;
        });
        
        fireBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchControls.fire = false;
        });
    }
    
    startGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        this.loadLevel(this.currentLevel);
        this.gameState = GAME_STATES.PLAYING;
        this.updateUI();
        this.hideAllScreens();
    }
    
    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        const level = new Level(levelNumber);
        
        this.walls = level.getWalls();
        this.enemyTanks = level.getEnemyTanks();
        this.enemiesLeft = this.enemyTanks.length;
        
        // 创建玩家坦克
        this.player = new Tank(level.playerStartX, level.playerStartY, '#00ff00', true);
        
        this.bullets = [];
        this.explosions = [];
        
        this.updateUI();
    }
    
    update() {
        if (this.gameState !== GAME_STATES.PLAYING) return;
        
        // 处理玩家输入
        this.handleInput();
        
        // 更新玩家
        this.player.update();
        
        // 更新敌人坦克
        this.enemyTanks.forEach(tank => {
            tank.update();
            this.updateAI(tank);
        });
        
        // 更新炮弹
        this.bullets.forEach(bullet => {
            bullet.update();
        });
        
        // 更新爆炸效果
        this.explosions.forEach(explosion => {
            explosion.update();
        });
        
        // 移除无效对象
        this.bullets = this.bullets.filter(bullet => bullet.active);
        this.enemyTanks = this.enemyTanks.filter(tank => tank.alive);
        this.explosions = this.explosions.filter(explosion => explosion.active);
        
        // 更新敌人数量
        this.enemiesLeft = this.enemyTanks.length;
        
        // 碰撞检测
        this.handleCollisions();
        
        // 检查关卡完成
        if (this.enemiesLeft === 0) {
            this.nextLevel();
        }
        
        // 检查游戏结束
        if (this.lives <= 0) {
            this.gameOver();
        }
        
        this.updateUI();
    }
    
    handleInput() {
        // 键盘控制
        if (this.keys['ArrowUp'] || this.touchControls.up) {
            this.player.move(DIRECTIONS.UP, this.walls, [...this.enemyTanks, this.player]);
        } else if (this.keys['ArrowDown'] || this.touchControls.down) {
            this.player.move(DIRECTIONS.DOWN, this.walls, [...this.enemyTanks, this.player]);
        }
        
        if (this.keys['ArrowLeft'] || this.touchControls.left) {
            this.player.move(DIRECTIONS.LEFT, this.walls, [...this.enemyTanks, this.player]);
        } else if (this.keys['ArrowRight'] || this.touchControls.right) {
            this.player.move(DIRECTIONS.RIGHT, this.walls, [...this.enemyTanks, this.player]);
        }
        
        // 发射炮弹
        if ((this.keys['Space'] || this.touchControls.fire) && this.bullets.length < MAX_BULLETS) {
            const bullet = this.player.shoot();
            if (bullet) {
                this.bullets.push(bullet);
                this.soundManager.play('shoot');
            }
        }
    }
    
    updateAI(tank) {
        // 简化的AI逻辑，随机移动和射击
        if (Math.random() < 0.02) {
            // 随机改变方向
            const direction = Math.floor(Math.random() * 4);
            tank.move(direction, this.walls, [...this.enemyTanks, this.player]);
        }
        
        if (Math.random() < 0.01) {
            // 随机射击
            const bullet = tank.shoot();
            if (bullet) {
                this.bullets.push(bullet);
                this.soundManager.play('shoot');
            }
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // 绘制墙壁
        this.walls.forEach(wall => {
            if (wall.type > 0) {
                wall.draw(this.ctx);
            }
        });
        
        // 绘制玩家
        this.player.draw(this.ctx);
        
        // 绘制敌人坦克
        this.enemyTanks.forEach(tank => {
            tank.draw(this.ctx);
        });
        
        // 绘制炮弹
        this.bullets.forEach(bullet => {
            bullet.draw(this.ctx);
        });
        
        // 绘制爆炸效果
        this.explosions.forEach(explosion => {
            explosion.draw(this.ctx);
        });
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update();
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
            this.soundManager.play('levelUp');
        } else {
            // 游戏胜利
            this.gameOver(true);
        }
    }
    
    gameOver(victory = false) {
        this.gameState = GAME_STATES.GAME_OVER;
        this.showGameOverScreen(victory);
        this.saveGameData();
        this.soundManager.play('gameOver');
    }
    
    pauseGame() {
        this.gameState = GAME_STATES.PAUSED;
        this.showPauseScreen();
    }
    
    resumeGame() {
        this.gameState = GAME_STATES.PLAYING;
        this.hideAllScreens();
    }
    
    restartGame() {
        this.startGame();
    }
    
    quitGame() {
        this.gameState = GAME_STATES.START;
        this.showStartScreen();
    }
    
    // UI相关方法
    showStartScreen() {
        this.hideAllScreens();
        document.getElementById('startScreen').classList.remove('hidden');
    }
    
    showPauseScreen() {
        this.hideAllScreens();
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
    
    showGameOverScreen(victory = false) {
        this.hideAllScreens();
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScore = document.getElementById('finalScore');
        
        finalScore.textContent = `最终得分: ${this.score}`;
        
        if (victory) {
            document.querySelector('#gameOverScreen h2').textContent = '游戏胜利!';
        } else {
            document.querySelector('#gameOverScreen h2').textContent = '游戏结束';
        }
        
        gameOverScreen.classList.remove('hidden');
    }
    
    showLevelSelect() {
        this.gameState = GAME_STATES.LEVEL_SELECT;
        this.hideAllScreens();
        this.generateLevelGrid();
        document.getElementById('levelSelectScreen').classList.remove('hidden');
    }
    
    showSettings() {
        this.gameState = GAME_STATES.SETTINGS;
        this.hideAllScreens();
        document.getElementById('settingsScreen').classList.remove('hidden');
        
        // 加载当前设置
        const soundToggle = document.getElementById('soundToggle');
        soundToggle.checked = this.soundManager.enabled;
    }
    
    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.add('hidden');
        });
    }
    
    generateLevelGrid() {
        const levelGrid = document.getElementById('levelGrid');
        levelGrid.innerHTML = '';
        
        for (let i = 1; i <= this.maxLevel; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;
            
            // 检查关卡是否解锁
            const isUnlocked = i <= this.currentLevel || this.score > 0;
            if (!isUnlocked) {
                btn.classList.add('locked');
            }
            
            btn.addEventListener('click', () => {
                if (isUnlocked) {
                    this.startGameAtLevel(i);
                }
            });
            
            levelGrid.appendChild(btn);
        }
    }
    
    startGameAtLevel(level) {
        this.currentLevel = level;
        this.score = 0;
        this.lives = 3;
        this.loadLevel(level);
        this.gameState = GAME_STATES.PLAYING;
        this.hideAllScreens();
    }
    
    updateUI() {
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('score').textContent = this.score;
        document.getElementById('enemiesLeft').textContent = this.enemiesLeft;
        document.getElementById('currentLevel').textContent = this.currentLevel;
    }
    
    // 数据持久化
    saveGameData() {
        const gameData = {
            currentLevel: this.currentLevel,
            score: this.score,
            lives: this.lives,
            soundEnabled: this.soundManager.enabled
        };
        
        localStorage.setItem('tankGameData', JSON.stringify(gameData));
    }
    
    loadGameData() {
        const gameData = localStorage.getItem('tankGameData');
        if (gameData) {
            const data = JSON.parse(gameData);
            this.currentLevel = data.currentLevel || 1;
            this.score = data.score || 0;
            this.lives = data.lives || 3;
            this.soundManager.setEnabled(data.soundEnabled !== false);
        }
    }
    
    saveSettings() {
        const soundToggle = document.getElementById('soundToggle');
        this.soundManager.setEnabled(soundToggle.checked);
        this.saveGameData();
        this.showStartScreen();
    }
    
    // 触控控制
    setupTouchControls() {
        // 已在initialize中设置
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new TankGame();
});