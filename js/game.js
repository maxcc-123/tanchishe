/**
 * 贪吃蛇游戏 - 核心逻辑
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const speedElement = document.getElementById('speed');
    const foodCountElement = document.getElementById('food-count');
    const startBtn = document.getElementById('start-game-btn');
    const pauseBtn = document.getElementById('pause-game-btn');
    const resetBtn = document.getElementById('reset-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const gameModeSelect = document.getElementById('game-mode-select');
    const gameOverModal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');
    
    // 添加计时器元素（用于时间挑战模式）
    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-container';
    timerContainer.innerHTML = '<div class="timer-icon">⏱️</div><div id="timer">60</div>';
    canvas.parentNode.appendChild(timerContainer);
    const timerElement = document.getElementById('timer');
    
    // 添加游戏模式信息显示
    const gameModeInfo = document.createElement('div');
    gameModeInfo.className = 'game-mode-info';
    gameModeInfo.innerHTML = `
        <div class="game-mode-icon">🐍</div>
        <div class="game-mode-details">
            <div class="game-mode-name">经典模式</div>
            <div class="game-mode-description">传统贪吃蛇玩法，吃食物增长身体</div>
        </div>
    `;
    canvas.parentNode.insertBefore(gameModeInfo, canvas);
    
    // 创建主题切换和音效控制按钮
    const controlsContainer = document.querySelector('.game-controls');
    
    // 添加主题切换按钮
    const themeBtn = document.createElement('button');
    themeBtn.id = 'theme-btn';
    themeBtn.innerHTML = '<i class="fas fa-palette"></i> 主题';
    themeBtn.title = '切换主题';
    controlsContainer.appendChild(themeBtn);
    
    // 添加音效控制按钮
    const soundBtn = document.createElement('button');
    soundBtn.id = 'sound-btn';
    soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    soundBtn.title = '关闭音效';
    controlsContainer.appendChild(soundBtn);
    
    // 添加成就按钮
    const achievementBtn = document.createElement('button');
    achievementBtn.id = 'achievement-btn';
    achievementBtn.innerHTML = '<i class="fas fa-trophy"></i> 成就';
    achievementBtn.title = '查看成就';
    controlsContainer.appendChild(achievementBtn);
    
    // 游戏配置
    const config = {
        easy: { speed: 150, speedIncrement: 2, obstacleCount: 0 },
        normal: { speed: 100, speedIncrement: 3, obstacleCount: 3 },
        hard: { speed: 70, speedIncrement: 5, obstacleCount: 5 }
    };
    
    // 游戏主题
    const themes = {
        classic: {
            background: '#0a0a0a',
            grid: 'rgba(0, 255, 169, 0.1)',
            snake: 'rgba(0, 255, 169, 0.7)',
            snakeHead: 'rgba(0, 255, 169, 0.9)',
            food: 'rgba(0, 255, 169, 0.7)',
            obstacle: 'rgba(255, 50, 50, 0.7)'
        },
        dark: {
            background: '#000000',
            grid: 'rgba(100, 100, 255, 0.1)',
            snake: 'rgba(100, 100, 255, 0.7)',
            snakeHead: 'rgba(100, 100, 255, 0.9)',
            food: 'rgba(255, 100, 100, 0.7)',
            obstacle: 'rgba(255, 200, 50, 0.7)'
        },
        light: {
            background: '#f0f0f0',
            grid: 'rgba(50, 50, 50, 0.1)',
            snake: 'rgba(50, 150, 50, 0.7)',
            snakeHead: 'rgba(50, 150, 50, 0.9)',
            food: 'rgba(200, 50, 50, 0.7)',
            obstacle: 'rgba(100, 100, 100, 0.7)'
        }
    };
    
    // 音效
    const sounds = {
        eat: new Audio('./sounds/eat.mp3'),
        gameOver: new Audio('./sounds/game-over.mp3'),
        specialFood: new Audio('./sounds/special-food.mp3'),
        levelUp: new Audio('./sounds/level-up.mp3')
    };
    
    // 尝试预加载音效（防止音效文件不存在导致错误）
    function preloadSounds() {
        for (const sound in sounds) {
            sounds[sound].volume = 0.5;
            sounds[sound].addEventListener('error', function() {
                console.warn(`音效文件 ${sound} 加载失败`);
                sounds[sound] = null; // 设置为null以便后续检查
            });
        }
    }
    
    // 播放音效的函数
    function playSound(soundName) {
        if (sounds[soundName] && soundEnabled) {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play().catch(e => console.warn('音效播放失败:', e));
        }
    }
    
    // 游戏状态
    let snake = [];
    let food = {x: 0, y: 0}; // 初始化食物坐标，确保有默认值
    let specialFood = null; // 特殊食物
    let obstacles = []; // 障碍物
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let foodCount = 0;
    let speed = config.normal.speed;
    let speedLevel = 1;
    let gameInterval = null;
    let isPaused = false;
    let isGameOver = false;
    let cellSize = 20; // 每个格子的大小
    let gridSize = canvas.width / cellSize; // 网格大小
    let currentTheme = 'classic'; // 当前主题
    let soundEnabled = true; // 音效开关
    let specialFoodTimer = null; // 特殊食物计时器
    let achievements = []; // 成就系统
    let level = 1; // 当前关卡
    
    // 游戏模式和道具系统相关状态
    let currentGameMode = 'classic'; // 当前游戏模式
    let wallCollision = true; // 是否开启墙壁碰撞
    let selfCollision = true; // 是否开启自身碰撞
    let obstacleCount = config.normal.obstacleCount; // 障碍物数量
    let specialFoodEnabled = true; // 是否启用特殊食物
    let itemsEnabled = false; // 是否启用道具系统
    let activeItems = []; // 当前激活的道具
    let foodMoving = false; // 食物是否移动（疯狂模式）
    let foodMoveTimer = null; // 食物移动计时器
    let randomObstacleTimer = null; // 随机生成障碍物计时器
    let timerId = null; // 时间挑战模式计时器
    let timeLimit = 60; // 时间限制（秒）
    let timeRemaining = timeLimit; // 剩余时间
    let scoreMultiplier = 1; // 分数倍数
    let magnetActive = false; // 磁铁效果是否激活
    let snakeGhostMode = false; // 蛇是否处于幽灵模式
    
    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        snake = [
            {x: 5, y: 10},
            {x: 4, y: 10},
            {x: 3, y: 10}
        ];
        obstacles = [];
        specialFood = null;
        activeItems = [];
        
        // 清除所有计时器
        if (specialFoodTimer) {
            clearTimeout(specialFoodTimer);
            specialFoodTimer = null;
        }
        if (foodMoveTimer) {
            clearInterval(foodMoveTimer);
            foodMoveTimer = null;
        }
        if (randomObstacleTimer) {
            clearInterval(randomObstacleTimer);
            randomObstacleTimer = null;
        }
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
        
        // 重置游戏状态变量
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        foodCount = 0;
        speedLevel = 1;
        level = 1;
        isGameOver = false;
        scoreMultiplier = 1;
        magnetActive = false;
        snakeGhostMode = false;
        foodMoving = false;
        
        // 设置难度
        const difficulty = difficultySelect.value;
        speed = config[difficulty].speed;
        
        // 设置游戏模式
        currentGameMode = gameModeSelect.value;
        setupGameMode();
        
        // 生成食物和障碍物
        generateFood(); // 确保食物被正确生成
        if (currentGameMode === 'maze') {
            generateMazeObstacles();
        } else {
            generateObstacles();
        }
        
        // 预加载音效
        preloadSounds();
        
        // 更新UI
        updateUI();
        updateGameModeInfo();
        
        // 初始化成就系统
        initAchievements();
        
        // 隐藏计时器（除非是时间挑战模式）
        timerContainer.classList.remove('active');
        
        // 立即绘制游戏，确保食物显示
        drawGame();
        console.log('游戏初始化完成，食物位置:', food);
    }
    
    // 初始化成就系统
    function initAchievements() {
        achievements = [
            { id: 'first_food', name: '初尝甜头', description: '吃到第一个食物', unlocked: false, icon: '🍎' },
            { id: 'score_50', name: '小有成就', description: '得分达到50分', unlocked: false, icon: '🥈' },
            { id: 'score_100', name: '蛇王之路', description: '得分达到100分', unlocked: false, icon: '🥇' },
            { id: 'special_food', name: '美食家', description: '吃到特殊食物', unlocked: false, icon: '🌟' },
            { id: 'level_5', name: '高手', description: '达到5级速度', unlocked: false, icon: '🚀' },
            { id: 'snake_10', name: '长龙', description: '蛇的长度达到10', unlocked: false, icon: '🐉' }
        ];
    }
    
    // 检查并解锁成就
    function checkAchievements() {
        for (let achievement of achievements) {
            if (!achievement.unlocked) {
                let unlocked = false;
                
                switch(achievement.id) {
                    case 'first_food':
                        unlocked = foodCount > 0;
                        break;
                    case 'score_50':
                        unlocked = score >= 50;
                        break;
                    case 'score_100':
                        unlocked = score >= 100;
                        break;
                    case 'special_food':
                        unlocked = achievements.find(a => a.id === 'special_food').unlocked || 
                                  (specialFood === null && foodCount > 0 && Math.random() < 0.3);
                        break;
                    case 'level_5':
                        unlocked = speedLevel >= 5;
                        break;
                    case 'snake_10':
                        unlocked = snake.length >= 10;
                        break;
                }
                
                if (unlocked) {
                    achievement.unlocked = true;
                    showAchievementNotification(achievement);
                }
            }
        }
    }
    
    // 显示成就通知
    function showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">成就解锁: ${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 动画效果
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 3秒后移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    // 开始游戏
    function startGame() {
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        
        if (isGameOver) {
            initGame();
        }
        
        isPaused = false;
        gameInterval = setInterval(gameLoop, speed);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
    
    // 暂停游戏
    function pauseGame() {
        if (!isPaused && !isGameOver) {
            clearInterval(gameInterval);
            isPaused = true;
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
        } else {
            gameInterval = setInterval(gameLoop, speed);
            isPaused = false;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }
    }
    
    // 重置游戏
    function resetGame() {
        clearInterval(gameInterval);
        initGame();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        drawGame();
    }
    
    // 游戏主循环
    function gameLoop() {
        direction = nextDirection;
        moveSnake();
        
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // 检查是否吃到普通食物
        if (eatFood()) {
            playSound('eat');
            generateFood();
            increaseScore(10 * scoreMultiplier);
            
            // 随机生成特殊食物
            if (specialFoodEnabled && !specialFood && Math.random() < 0.2) {
                generateSpecialFood();
            }
            
            // 随机生成道具
            if (itemsEnabled && Math.random() < 0.15) {
                generateItem();
            }
        }
        
        // 检查是否吃到特殊食物
        if (specialFood && eatSpecialFood()) {
            playSound('specialFood');
            specialFood = null;
            if (specialFoodTimer) {
                clearTimeout(specialFoodTimer);
                specialFoodTimer = null;
            }
            increaseScore(30 * scoreMultiplier); // 特殊食物给予更多分数
        }
        
        // 检查是否吃到道具
        checkItemCollision();
        
        // 磁铁效果：吸引食物
        if (magnetActive) {
            attractFood();
        }
        
        // 检查成就
        checkAchievements();
        
        // 检查是否升级
        checkLevelUp();
        
        drawGame();
    }
    
    // 检查是否升级
    function checkLevelUp() {
        // 每50分升一级
        const newLevel = Math.floor(score / 50) + 1;
        if (newLevel > level) {
            level = newLevel;
            playSound('levelUp');
            
            // 增加障碍物
            if (level > 1) {
                generateObstacles(1); // 每升一级增加一个障碍物
            }
            
            // 显示升级通知
            showLevelUpNotification();
        }
    }
    
    // 显示升级通知
    function showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-icon">🏆</div>
            <div class="level-up-info">
                <div class="level-up-title">升级!</div>
                <div class="level-up-description">当前等级: ${level}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 动画效果
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 2秒后移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }
    
    // 生成特殊食物
    function generateSpecialFood() {
        // 创建一个包含所有可能位置的数组
        const availablePositions = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                // 检查该位置是否被蛇、普通食物或障碍物占用
                let isOccupied = false;
                
                // 检查蛇
                for (let segment of snake) {
                    if (segment.x === x && segment.y === y) {
                        isOccupied = true;
                        break;
                    }
                }
                
                // 检查普通食物
                if (food.x === x && food.y === y) {
                    isOccupied = true;
                }
                
                // 检查障碍物
                for (let obstacle of obstacles) {
                    if (obstacle.x === x && obstacle.y === y) {
                        isOccupied = true;
                        break;
                    }
                }
                
                if (!isOccupied) {
                    availablePositions.push({x, y});
                }
            }
        }
        
        // 从可用位置中随机选择一个
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            specialFood = availablePositions[randomIndex];
            
            // 设置特殊食物的计时器，10秒后消失
            specialFoodTimer = setTimeout(() => {
                specialFood = null;
                specialFoodTimer = null;
            }, 10000);
        }
    }
    
    // 检查是否吃到特殊食物
    function eatSpecialFood() {
        const head = snake[0];
        return specialFood && head.x === specialFood.x && head.y === specialFood.y;
    }
    
    // 生成障碍物
    function generateObstacles(count) {
        const difficulty = difficultySelect.value;
        const obstacleCount = count || config[difficulty].obstacleCount;
        
        // 清空现有障碍物
        if (!count) obstacles = [];
        
        // 如果简单模式或不需要障碍物，直接返回
        if (obstacleCount <= 0) return;
        
        for (let i = 0; i < obstacleCount; i++) {
            // 创建一个包含所有可能位置的数组
            const availablePositions = [];
            
            for (let x = 0; x < gridSize; x++) {
                for (let y = 0; y < gridSize; y++) {
                    // 检查该位置是否被蛇、食物或其他障碍物占用
                    let isOccupied = false;
                    
                    // 检查蛇
                    for (let segment of snake) {
                        if (segment.x === x && segment.y === y) {
                            isOccupied = true;
                            break;
                        }
                    }
                    
                    // 检查食物
                    if (food.x === x && food.y === y) {
                        isOccupied = true;
                    }
                    
                    // 检查特殊食物
                    if (specialFood && specialFood.x === x && specialFood.y === y) {
                        isOccupied = true;
                    }
                    
                    // 检查其他障碍物
                    for (let obstacle of obstacles) {
                        if (obstacle.x === x && obstacle.y === y) {
                            isOccupied = true;
                            break;
                        }
                    }
                    
                    // 避免在蛇头周围生成障碍物
                    const head = snake[0];
                    const distance = Math.abs(head.x - x) + Math.abs(head.y - y);
                    if (distance < 3) {
                        isOccupied = true;
                    }
                    
                    if (!isOccupied) {
                        availablePositions.push({x, y});
                    }
                }
            }
            
            // 从可用位置中随机选择一个
            if (availablePositions.length > 0) {
                const randomIndex = Math.floor(Math.random() * availablePositions.length);
                obstacles.push(availablePositions[randomIndex]);
            }
        }
    }
    
    // 移动蛇
    function moveSnake() {
        const head = {x: snake[0].x, y: snake[0].y};
        
        // 根据方向移动蛇头
        switch(direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // 添加新的蛇头
        snake.unshift(head);
        
        // 如果没有吃到食物，移除蛇尾
        if (head.x !== food.x || head.y !== food.y) {
            snake.pop();
        }
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞墙（如果启用了墙壁碰撞）
        if (wallCollision) {
            if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
                return true;
            }
        } else {
            // 无边界模式：穿越边界
            if (head.x < 0) head.x = gridSize - 1;
            if (head.x >= gridSize) head.x = 0;
            if (head.y < 0) head.y = gridSize - 1;
            if (head.y >= gridSize) head.y = 0;
        }
        
        // 检查是否撞到自己的身体（如果启用了自身碰撞）
        if (selfCollision) {
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    return true;
                }
            }
        }
        
        // 检查是否撞到障碍物
        for (let obstacle of obstacles) {
            if (head.x === obstacle.x && head.y === obstacle.y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查是否吃到食物
    function eatFood() {
        const head = snake[0];
        return head.x === food.x && head.y === food.y;
    }
    
    // 生成食物
    function generateFood() {
        // 创建一个包含所有可能位置的数组
        const availablePositions = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                // 检查该位置是否被蛇、障碍物占用
                let isOccupied = false;
                
                // 检查蛇
                for (let segment of snake) {
                    if (segment.x === x && segment.y === y) {
                        isOccupied = true;
                        break;
                    }
                }
                
                // 检查障碍物
                if (!isOccupied) {
                    for (let obstacle of obstacles) {
                        if (obstacle.x === x && obstacle.y === y) {
                            isOccupied = true;
                            break;
                        }
                    }
                }
                
                if (!isOccupied) {
                    availablePositions.push({x, y});
                }
            }
        }
        
        // 从可用位置中随机选择一个
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            food = availablePositions[randomIndex];
            foodCount++;
            console.log('食物已生成:', food); // 添加调试信息
        } else {
            console.warn('无法生成食物：没有可用位置'); // 添加错误提示
        }
    }
    
    // 增加分数
    function increaseScore() {
        score += 10;
        
        // 每吃5个食物增加速度
        if (foodCount % 5 === 0) {
            const difficulty = difficultySelect.value;
            speed -= config[difficulty].speedIncrement;
            speedLevel++;
            
            // 更新游戏速度
            if (gameInterval) {
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, speed);
            }
        }
        
        updateUI();
    }
    
    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        isGameOver = true;
        startBtn.disabled = false;
        
        // 显示游戏结束弹窗
        finalScoreElement.textContent = score;
        gameOverModal.style.display = 'flex';
    }
    
    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 应用当前主题的背景色
        ctx.fillStyle = themes[currentTheme].background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景网格
        drawGrid();
        
        // 绘制障碍物
        drawObstacles();
        
        // 绘制食物
        drawFood();
        
        // 绘制特殊食物
        if (specialFood) {
            drawSpecialFood();
        }
        
        // 绘制道具
        drawItems();
        
        // 绘制蛇
        drawSnake();
    }
    
    // 绘制道具
    function drawItems() {
        for (const item of activeItems) {
            const itemConfig = GameItems[item.type];
            if (!itemConfig) continue;
            
            const x = item.x * cellSize + cellSize / 2;
            const y = item.y * cellSize + cellSize / 2;
            const radius = cellSize / 2 - 3;
            
            // 绘制道具外圈
            ctx.beginPath();
            ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = itemConfig.color.replace(/[^,]+(?=\))/, '1');
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制道具内部
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = itemConfig.color;
            ctx.fill();
            
            // 绘制道具图标
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(itemConfig.icon, x, y);
        }
    }
    
    // 绘制网格
    function drawGrid() {
        ctx.strokeStyle = themes[currentTheme].grid;
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= gridSize; i++) {
            // 绘制垂直线
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();
            
            // 绘制水平线
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }
        
        // 添加科技感边框效果
        ctx.strokeStyle = themes[currentTheme].grid.replace('0.1', '0.3');
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
    
    // 绘制食物
    function drawFood() {
        // 确保food对象有x和y属性
        if (food && typeof food.x === 'number' && typeof food.y === 'number') {
            const x = food.x * cellSize + cellSize / 2;
            const y = food.y * cellSize + cellSize / 2;
            const radius = cellSize / 2 - 2;
            
            // 获取当前主题的食物颜色
            const foodColor = themes[currentTheme].food;
            const strokeColor = foodColor.replace(/[^,]+(?=\))/, '1');
            
            // 绘制霓虹效果的外圈
            ctx.beginPath();
            ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // 绘制内部填充
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = foodColor;
            ctx.fill();
            
            // 添加内部图案
            ctx.beginPath();
            ctx.arc(x, y, radius / 2, 0, Math.PI * 2);
            ctx.fillStyle = themes[currentTheme].background;
            ctx.fill();
        } else {
            console.warn('食物对象不完整，无法绘制');
        }
    }
    
    // 绘制蛇
    function drawSnake() {
        // 获取当前主题的蛇颜色
        let snakeColor = themes[currentTheme].snake;
        let snakeHeadColor = themes[currentTheme].snakeHead;
        let strokeColor = snakeColor.replace(/[^,]+(?=\))/, '1');
        
        // 如果处于幽灵模式，调整蛇的透明度
        if (snakeGhostMode) {
            snakeColor = snakeColor.replace(/[^,]+(?=\))/, '0.3');
            snakeHeadColor = snakeHeadColor.replace(/[^,]+(?=\))/, '0.5');
            strokeColor = strokeColor.replace(/[^,]+(?=\))/, '0.5');
        }
        
        // 绘制蛇身
        for (let i = 1; i < snake.length; i++) {
            const segment = snake[i];
            
            // 创建渐变色效果
            const segmentX = segment.x * cellSize;
            const segmentY = segment.y * cellSize;
            
            // 绘制边框
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(
                segmentX + 1,
                segmentY + 1,
                cellSize - 2,
                cellSize - 2
            );
            
            // 填充主体 - 交替颜色创建视觉效果
            const opacity = snakeGhostMode ? '0.3' : (i % 2 === 0 ? '0.5' : '0.7');
            ctx.fillStyle = snakeColor.replace(/[^,]+(?=\))/, opacity);
            ctx.fillRect(
                segmentX + 2,
                segmentY + 2,
                cellSize - 4,
                cellSize - 4
            );
        }
        
        // 绘制蛇头
        const head = snake[0];
        const headX = head.x * cellSize;
        const headY = head.y * cellSize;
        
        // 头部外框
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            headX + 1,
            headY + 1,
            cellSize - 2,
            cellSize - 2
        );
        
        // 头部填充
        ctx.fillStyle = snakeHeadColor;
        ctx.fillRect(
            headX + 2,
            headY + 2,
            cellSize - 4,
            cellSize - 4
        );
        
        // 绘制蛇眼睛 - 更科技感的设计
        const eyeSize = 3;
        const eyeOffset = 6;
        
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        switch(direction) {
            case 'up':
                leftEyeX = headX + eyeOffset;
                leftEyeY = headY + eyeOffset;
                rightEyeX = headX + cellSize - eyeOffset - eyeSize;
                rightEyeY = headY + eyeOffset;
                break;
            case 'down':
                leftEyeX = headX + eyeOffset;
                leftEyeY = headY + cellSize - eyeOffset - eyeSize;
                rightEyeX = headX + cellSize - eyeOffset - eyeSize;
                rightEyeY = headY + cellSize - eyeOffset - eyeSize;
                break;
            case 'left':
                leftEyeX = headX + eyeOffset;
                leftEyeY = headY + eyeOffset;
                rightEyeX = headX + eyeOffset;
                rightEyeY = headY + cellSize - eyeOffset - eyeSize;
                break;
            case 'right':
                leftEyeX = headX + cellSize - eyeOffset - eyeSize;
                leftEyeY = headY + eyeOffset;
                rightEyeX = headX + cellSize - eyeOffset - eyeSize;
                rightEyeY = headY + cellSize - eyeOffset - eyeSize;
                break;
        }
        
        // 绘制眼睛外框
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 1;
        
        // 左眼
        ctx.beginPath();
        ctx.arc(leftEyeX + eyeSize/2, leftEyeY + eyeSize/2, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#0088ff';
        ctx.fill();
        
        // 右眼
        ctx.beginPath();
        ctx.arc(rightEyeX + eyeSize/2, rightEyeY + eyeSize/2, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#0088ff';
        ctx.fill();
    }
    
    // 更新UI
    function updateUI() {
        scoreElement.textContent = score;
        speedElement.textContent = speedLevel;
        foodCountElement.textContent = foodCount;
    }
    
    // 更新游戏模式信息
    function updateGameModeInfo() {
        const mode = GameModes[currentGameMode];
        if (mode) {
            gameModeInfo.innerHTML = `
                <div class="game-mode-icon">${mode.icon}</div>
                <div class="game-mode-details">
                    <div class="game-mode-name">${mode.name}</div>
                    <div class="game-mode-description">${mode.description}</div>
                </div>
            `;
        }
    }
    
    // 设置游戏模式
    function setupGameMode() {
        // 清理之前模式的计时器和效果
        if (GameModes[currentGameMode] && GameModes[currentGameMode].cleanup) {
            GameModes[currentGameMode].cleanup({
                timerId,
                foodMoveTimer,
                randomObstacleTimer,
                gameOver
            });
        }
        
        // 应用新模式的设置
        if (GameModes[currentGameMode] && GameModes[currentGameMode].setup) {
            GameModes[currentGameMode].setup({
                wallCollision,
                selfCollision,
                obstacleCount,
                specialFoodEnabled,
                itemsEnabled,
                config,
                difficulty: difficultySelect.value,
                timerElement,
                gameOver,
                generateMazeObstacles,
                generateObstacles,
                isPaused,
                isGameOver,
                food,
                gridSize,
                showEffectNotification,
                particleSystem
            });
        }
        
        // 更新时间挑战模式的计时器显示
        if (currentGameMode === 'timeChallenge') {
            timerContainer.classList.add('active');
        } else {
            timerContainer.classList.remove('active');
        }
    }
    
    // 生成迷宫样式的障碍物
    function generateMazeObstacles() {
        obstacles = [];
        const difficulty = difficultySelect.value;
        const mazeComplexity = config[difficulty].obstacleCount * 3;
        
        // 创建迷宫边界
        for (let i = 0; i < gridSize; i++) {
            // 跳过某些位置作为通道
            if (i % 5 !== 0) continue;
            
            for (let j = 0; j < gridSize; j++) {
                // 创建水平和垂直的墙
                if (i % 10 === 0 || j % 10 === 0) {
                    // 避免在蛇的初始位置附近生成障碍物
                    const distanceFromSnake = Math.min(
                        Math.abs(i - snake[0].x) + Math.abs(j - snake[0].y),
                        Math.abs(i - snake[1].x) + Math.abs(j - snake[1].y),
                        Math.abs(i - snake[2].x) + Math.abs(j - snake[2].y)
                    );
                    
                    if (distanceFromSnake > 3) {
                        obstacles.push({x: i, y: j});
                    }
                }
            }
        }
        
        // 随机移除一些障碍物以创建更多通道
        const removalCount = Math.floor(obstacles.length * 0.4);
        for (let i = 0; i < removalCount; i++) {
            const index = Math.floor(Math.random() * obstacles.length);
            obstacles.splice(index, 1);
        }
    }
    
    // 生成道具
    function generateItem() {
        // 创建一个包含所有可能位置的数组
        const availablePositions = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                // 检查该位置是否被蛇、食物、特殊食物或障碍物占用
                let isOccupied = false;
                
                // 检查蛇
                for (let segment of snake) {
                    if (segment.x === x && segment.y === y) {
                        isOccupied = true;
                        break;
                    }
                }
                
                // 检查食物
                if (food.x === x && food.y === y) {
                    isOccupied = true;
                }
                
                // 检查特殊食物
                if (specialFood && specialFood.x === x && specialFood.y === y) {
                    isOccupied = true;
                }
                
                // 检查障碍物
                for (let obstacle of obstacles) {
                    if (obstacle.x === x && obstacle.y === y) {
                        isOccupied = true;
                        break;
                    }
                }
                
                // 检查其他道具
                for (let item of activeItems) {
                    if (item.x === x && item.y === y) {
                        isOccupied = true;
                        break;
                    }
                }
                
                if (!isOccupied) {
                    availablePositions.push({x, y});
                }
            }
        }
        
        // 从可用位置中随机选择一个
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            const position = availablePositions[randomIndex];
            
            // 随机选择一个道具类型
            const itemTypes = Object.keys(GameItems);
            const itemWeights = [];
            
            // 根据概率权重选择道具
            for (const type of itemTypes) {
                const probability = GameItems[type].probability || 0.1;
                itemWeights.push(probability);
            }
            
            const selectedType = weightedRandomSelect(itemTypes, itemWeights);
            const item = {
                ...position,
                type: selectedType
            };
            
            activeItems.push(item);
            
            // 设置道具消失计时器（20秒后消失）
            setTimeout(() => {
                const index = activeItems.findIndex(i => i.x === item.x && i.y === item.y);
                if (index !== -1) {
                    activeItems.splice(index, 1);
                }
            }, 20000);
        }
    }
    
    // 根据权重随机选择元素
    function weightedRandomSelect(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[0]; // 默认返回第一个
    }
    
    // 检查是否吃到道具
    function checkItemCollision() {
        const head = snake[0];
        
        for (let i = 0; i < activeItems.length; i++) {
            const item = activeItems[i];
            if (head.x === item.x && head.y === item.y) {
                // 应用道具效果
                applyItemEffect(item.type);
                
                // 移除道具
                activeItems.splice(i, 1);
                break;
            }
        }
    }
    
    // 应用道具效果
    function applyItemEffect(itemType) {
        const item = GameItems[itemType];
        if (item && item.apply) {
            item.apply({
                speed,
                gameInterval,
                gameLoop,
                showEffectNotification,
                wallCollision,
                selfCollision,
                obstacles,
                particleSystem,
                canvas
            });
        }
    }
    
    // 显示效果通知
    function showEffectNotification(title, description, icon) {
        const notification = document.createElement('div');
        notification.className = 'item-notification';
        notification.innerHTML = `
            <div class="item-icon">${icon}</div>
            <div class="item-info">
                <div class="item-title">${title}</div>
                <div class="item-description">${description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 动画效果
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 3秒后移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    // 磁铁效果：吸引食物
    function attractFood() {
        const head = snake[0];
        const attractionRange = 5; // 吸引范围
        
        // 计算食物与蛇头的距离
        const dx = food.x - head.x;
        const dy = food.y - head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果食物在吸引范围内，向蛇头移动
        if (distance < attractionRange) {
            // 计算移动方向
            const moveX = dx === 0 ? 0 : (dx > 0 ? -1 : 1);
            const moveY = dy === 0 ? 0 : (dy > 0 ? -1 : 1);
            
            // 移动食物
            const newX = food.x + moveX;
            const newY = food.y + moveY;
            
            // 确保食物不会移到障碍物或蛇身上
            let canMove = true;
            
            // 检查障碍物
            for (let obstacle of obstacles) {
                if (obstacle.x === newX && obstacle.y === newY) {
                    canMove = false;
                    break;
                }
            }
            
            // 检查蛇身（除了头部）
            for (let i = 1; i < snake.length; i++) {
                if (snake[i].x === newX && snake[i].y === newY) {
                    canMove = false;
                    break;
                }
            }
            
            if (canMove) {
                food.x = newX;
                food.y = newY;
            }
        }
    }
    
    // 键盘事件处理
    function handleKeyDown(e) {
        // 如果游戏结束或暂停，忽略按键
        if (isGameOver || isPaused) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ': // 空格键暂停/继续
                pauseGame();
                break;
        }
    }
    
    // 绘制障碍物
    function drawObstacles() {
        // 获取当前主题的障碍物颜色
        const obstacleColor = themes[currentTheme].obstacle;
        
        for (let obstacle of obstacles) {
            const obstacleX = obstacle.x * cellSize;
            const obstacleY = obstacle.y * cellSize;
            
            // 绘制障碍物外框
            ctx.strokeStyle = obstacleColor.replace(/[^,]+(?=\))/, '1');
            ctx.lineWidth = 1;
            ctx.strokeRect(
                obstacleX + 1,
                obstacleY + 1,
                cellSize - 2,
                cellSize - 2
            );
            
            // 填充障碍物
            ctx.fillStyle = obstacleColor;
            ctx.fillRect(
                obstacleX + 2,
                obstacleY + 2,
                cellSize - 4,
                cellSize - 4
            );
            
            // 添加交叉图案
            ctx.beginPath();
            ctx.moveTo(obstacleX + 4, obstacleY + 4);
            ctx.lineTo(obstacleX + cellSize - 4, obstacleY + cellSize - 4);
            ctx.moveTo(obstacleX + cellSize - 4, obstacleY + 4);
            ctx.lineTo(obstacleX + 4, obstacleY + cellSize - 4);
            ctx.strokeStyle = themes[currentTheme].background;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    
    // 绘制特殊食物
    function drawSpecialFood() {
        if (!specialFood) return;
        
        const x = specialFood.x * cellSize + cellSize / 2;
        const y = specialFood.y * cellSize + cellSize / 2;
        const radius = cellSize / 2 - 2;
        
        // 特殊食物的闪烁效果
        const time = Date.now() / 200;
        const pulseSize = Math.sin(time) * 2 + radius;
        
        // 绘制外部光环
        ctx.beginPath();
        ctx.arc(x, y, pulseSize + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制内部填充
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fill();
        
        // 添加星形图案
        const starPoints = 5;
        const innerRadius = radius / 2.5;
        const outerRadius = radius / 1.5;
        
        ctx.beginPath();
        for (let i = 0; i < starPoints * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / starPoints;
            const starX = x + r * Math.sin(angle);
            const starY = y + r * Math.cos(angle);
            
            if (i === 0) {
                ctx.moveTo(starX, starY);
            } else {
                ctx.lineTo(starX, starY);
            }
        }
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
    }
    
    // 切换主题
    function switchTheme(themeName) {
        if (themes[themeName]) {
            currentTheme = themeName;
            drawGame();
        }
    }
    
    // 切换音效
    function toggleSound() {
        soundEnabled = !soundEnabled;
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            if (soundEnabled) {
                soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                soundBtn.title = '关闭音效';
            } else {
                soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                soundBtn.title = '开启音效';
            }
        }
    }
    
    // 添加触摸控制支持
    function setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        canvas.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, false);
        
        canvas.addEventListener('touchmove', function(e) {
            if (!touchStartX || !touchStartY || isGameOver || isPaused) {
                return;
            }
            
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // 确定滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                if (dx > 0 && direction !== 'left') {
                    nextDirection = 'right';
                } else if (dx < 0 && direction !== 'right') {
                    nextDirection = 'left';
                }
            } else {
                // 垂直滑动
                if (dy > 0 && direction !== 'up') {
                    nextDirection = 'down';
                } else if (dy < 0 && direction !== 'down') {
                    nextDirection = 'up';
                }
            }
            
            // 重置起始点
            touchStartX = touchEndX;
            touchStartY = touchEndY;
            
            e.preventDefault();
        }, false);
    }
    
    // 事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', resetGame);
    restartBtn.addEventListener('click', function() {
        gameOverModal.style.display = 'none';
        resetGame();
        startGame();
    });
    
    // 游戏模式选择事件
    gameModeSelect.addEventListener('change', function() {
        currentGameMode = this.value;
        updateGameModeInfo();
        if (!isGameOver && !isPaused) {
            // 如果游戏正在进行中，需要重置游戏以应用新模式
            resetGame();
        }
    });
    
    document.addEventListener('keydown', handleKeyDown);
    
    // 设置触摸控制
    setupTouchControls();
    
    // 绑定主题和音效按钮事件
    themeBtn.addEventListener('click', function() {
        // 循环切换主题
        const themeNames = Object.keys(themes);
        const currentIndex = themeNames.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        switchTheme(themeNames[nextIndex]);
    });
    
    soundBtn.addEventListener('click', toggleSound);
    
    // 绑定成就按钮事件
    achievementBtn.addEventListener('click', function() {
        showAchievementsModal();
    });
    
    // 显示成就弹窗
    function showAchievementsModal() {
        // 创建成就弹窗
        const achievementsModal = document.createElement('div');
        achievementsModal.className = 'modal';
        achievementsModal.id = 'achievements-modal';
        achievementsModal.style.display = 'flex';
        
        // 创建弹窗内容
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // 添加标题
        const title = document.createElement('h2');
        title.textContent = '成就列表';
        modalContent.appendChild(title);
        
        // 添加成就列表
        const achievementsList = document.createElement('div');
        achievementsList.className = 'achievements-list';
        
        for (let achievement of achievements) {
            const achievementItem = document.createElement('div');
            achievementItem.className = 'achievement-item' + (achievement.unlocked ? ' unlocked' : '');
            
            achievementItem.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
                <div class="achievement-status">${achievement.unlocked ? '已解锁' : '未解锁'}</div>
            `;
            
            achievementsList.appendChild(achievementItem);
        }
        
        modalContent.appendChild(achievementsList);
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(achievementsModal);
        });
        modalContent.appendChild(closeBtn);
        
        achievementsModal.appendChild(modalContent);
        document.body.appendChild(achievementsModal);
    }
    
    // 初始化游戏
    initGame();
    drawGame();
    pauseBtn.disabled = true;
});