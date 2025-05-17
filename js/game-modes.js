/**
 * 贪吃蛇游戏 - 游戏模式与道具系统
 */

// 游戏模式定义
const GameModes = {
    // 经典模式
    classic: {
        name: '经典模式',
        description: '传统贪吃蛇玩法，吃食物增长身体',
        icon: '🐍',
        setup: function(game) {
            // 重置为基本配置
            game.wallCollision = true;
            game.selfCollision = true;
            game.obstacleCount = game.config[game.difficulty].obstacleCount;
            game.specialFoodEnabled = true;
            game.itemsEnabled = false;
        }
    },
    
    // 时间挑战模式
    timeChallenge: {
        name: '时间挑战',
        description: '在限定时间内获得尽可能高的分数',
        icon: '⏱️',
        setup: function(game) {
            game.wallCollision = true;
            game.selfCollision = true;
            game.obstacleCount = Math.floor(game.config[game.difficulty].obstacleCount / 2);
            game.specialFoodEnabled = true;
            game.itemsEnabled = true;
            
            // 设置倒计时
            game.timeLimit = 60; // 60秒
            game.timeRemaining = game.timeLimit;
            game.timerId = setInterval(() => {
                game.timeRemaining--;
                if (game.timeRemaining <= 0) {
                    clearInterval(game.timerId);
                    game.gameOver('时间到!');
                }
                // 更新时间显示
                if (game.timerElement) {
                    game.timerElement.textContent = game.timeRemaining;
                }
            }, 1000);
        },
        cleanup: function(game) {
            if (game.timerId) {
                clearInterval(game.timerId);
                game.timerId = null;
            }
        }
    },
    
    // 迷宫模式
    maze: {
        name: '迷宫模式',
        description: '在复杂迷宫中穿行寻找食物',
        icon: '🧩',
        setup: function(game) {
            game.wallCollision = true;
            game.selfCollision = true;
            game.obstacleCount = game.config[game.difficulty].obstacleCount * 3;
            game.specialFoodEnabled = true;
            game.itemsEnabled = true;
            
            // 创建迷宫样式的障碍物
            game.generateMazeObstacles();
        }
    },
    
    // 无边界模式
    noBoundaries: {
        name: '无边界模式',
        description: '穿越边界继续游戏',
        icon: '🌀',
        setup: function(game) {
            game.wallCollision = false; // 关闭墙壁碰撞
            game.selfCollision = true;
            game.obstacleCount = game.config[game.difficulty].obstacleCount;
            game.specialFoodEnabled = true;
            game.itemsEnabled = true;
        }
    },
    
    // 疯狂模式
    crazy: {
        name: '疯狂模式',
        description: '食物会移动，障碍物会随机出现',
        icon: '🤪',
        setup: function(game) {
            game.wallCollision = true;
            game.selfCollision = true;
            game.obstacleCount = Math.floor(game.config[game.difficulty].obstacleCount / 2);
            game.specialFoodEnabled = true;
            game.itemsEnabled = true;
            game.foodMoving = true;
            
            // 设置食物移动计时器
            game.foodMoveTimer = setInterval(() => {
                if (!game.isPaused && !game.isGameOver && game.food) {
                    // 随机移动食物
                    const directions = [{x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}];
                    const dir = directions[Math.floor(Math.random() * directions.length)];
                    
                    const newX = game.food.x + dir.x;
                    const newY = game.food.y + dir.y;
                    
                    // 确保食物不会移出边界
                    if (newX >= 0 && newX < game.gridSize && newY >= 0 && newY < game.gridSize) {
                        game.food.x = newX;
                        game.food.y = newY;
                    }
                }
            }, 1000);
            
            // 随机生成障碍物计时器
            game.randomObstacleTimer = setInterval(() => {
                if (!game.isPaused && !game.isGameOver && Math.random() < 0.2) {
                    game.generateObstacles(1);
                }
            }, 5000);
        },
        cleanup: function(game) {
            if (game.foodMoveTimer) {
                clearInterval(game.foodMoveTimer);
                game.foodMoveTimer = null;
            }
            if (game.randomObstacleTimer) {
                clearInterval(game.randomObstacleTimer);
                game.randomObstacleTimer = null;
            }
        }
    }
};

// 道具系统
const GameItems = {
    // 减速道具
    slowDown: {
        name: '减速',
        description: '暂时减慢蛇的移动速度',
        icon: '🐢',
        color: 'rgba(0, 100, 255, 0.7)',
        duration: 5000, // 5秒
        probability: 0.15,
        apply: function(game) {
            const originalSpeed = game.speed;
            game.speed = game.speed * 1.5; // 减慢速度
            
            // 更新游戏循环
            if (game.gameInterval) {
                clearInterval(game.gameInterval);
                game.gameInterval = setInterval(game.gameLoop.bind(game), game.speed);
            }
            
            // 显示效果
            game.showEffectNotification('减速', '移动速度降低', '🐢');
            
            // 设置定时器恢复速度
            setTimeout(() => {
                game.speed = originalSpeed;
                if (game.gameInterval && !game.isPaused && !game.isGameOver) {
                    clearInterval(game.gameInterval);
                    game.gameInterval = setInterval(game.gameLoop.bind(game), game.speed);
                }
            }, this.duration);
        }
    },
    
    // 穿墙道具
    ghostMode: {
        name: '幽灵模式',
        description: '暂时可以穿过障碍物',
        icon: '👻',
        color: 'rgba(200, 200, 255, 0.7)',
        duration: 5000, // 5秒
        probability: 0.1,
        apply: function(game) {
            const originalWallCollision = game.wallCollision;
            const originalSelfCollision = game.selfCollision;
            
            // 关闭碰撞检测
            game.wallCollision = false;
            game.selfCollision = false;
            
            // 显示效果
            game.showEffectNotification('幽灵模式', '可穿越障碍物', '👻');
            
            // 设置蛇身半透明效果
            game.snakeGhostMode = true;
            
            // 设置定时器恢复
            setTimeout(() => {
                game.wallCollision = originalWallCollision;
                game.selfCollision = originalSelfCollision;
                game.snakeGhostMode = false;
            }, this.duration);
        }
    },
    
    // 磁铁道具
    magnet: {
        name: '磁铁',
        description: '吸引附近的食物',
        icon: '🧲',
        color: 'rgba(255, 50, 50, 0.7)',
        duration: 7000, // 7秒
        probability: 0.1,
        apply: function(game) {
            // 显示效果
            game.showEffectNotification('磁铁', '吸引附近食物', '🧲');
            
            // 启用磁铁效果
            game.magnetActive = true;
            
            // 设置定时器关闭磁铁效果
            setTimeout(() => {
                game.magnetActive = false;
            }, this.duration);
        }
    },
    
    // 双倍分数
    doubleScore: {
        name: '双倍分数',
        description: '暂时获得双倍分数',
        icon: '💰',
        color: 'rgba(255, 215, 0, 0.7)',
        duration: 10000, // 10秒
        probability: 0.1,
        apply: function(game) {
            // 显示效果
            game.showEffectNotification('双倍分数', '得分翻倍', '💰');
            
            // 启用双倍分数
            game.scoreMultiplier = 2;
            
            // 设置定时器恢复
            setTimeout(() => {
                game.scoreMultiplier = 1;
            }, this.duration);
        }
    },
    
    // 清除障碍物
    clearObstacles: {
        name: '清除障碍',
        description: '清除所有障碍物',
        icon: '💥',
        color: 'rgba(255, 100, 100, 0.7)',
        duration: 0, // 立即生效
        probability: 0.05,
        apply: function(game) {
            // 显示效果
            game.showEffectNotification('清除障碍', '所有障碍物已清除', '💥');
            
            // 清除所有障碍物
            game.obstacles = [];
            
            // 创建爆炸效果
            if (game.particleSystem) {
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * game.canvas.width;
                    const y = Math.random() * game.canvas.height;
                    game.particleSystem.createBurstEffect(x, y, 20, 'death');
                }
            }
        }
    }
};

// 导出游戏模式和道具
window.GameModes = GameModes;
window.GameItems = GameItems;