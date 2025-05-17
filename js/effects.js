/**
 * 贪吃蛇游戏 - 视觉效果
 */

class ParticleSystem {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.options = {
            maxParticles: options.maxParticles || 50,
            particleColor: options.particleColor || 'rgba(0, 255, 169, 0.6)',
            particleSize: options.particleSize || { min: 1, max: 3 },
            speed: options.speed || { min: 0.2, max: 1 },
            duration: options.duration || { min: 1000, max: 3000 }
        };
    }

    createParticle(x, y, type = 'normal') {
        const size = Math.random() * (this.options.particleSize.max - this.options.particleSize.min) + this.options.particleSize.min;
        const speed = Math.random() * (this.options.speed.max - this.options.speed.min) + this.options.speed.min;
        const duration = Math.random() * (this.options.duration.max - this.options.duration.min) + this.options.duration.min;
        
        let color = this.options.particleColor;
        let velocityX = (Math.random() - 0.5) * speed * 2;
        let velocityY = (Math.random() - 0.5) * speed * 2;
        
        // 特殊粒子类型
        if (type === 'food') {
            color = 'rgba(255, 215, 0, 0.7)';
            velocityY = -Math.random() * speed * 2; // 向上飘
        } else if (type === 'death') {
            color = 'rgba(255, 0, 0, 0.7)';
            velocityX = (Math.random() - 0.5) * speed * 4;
            velocityY = (Math.random() - 0.5) * speed * 4;
        }
        
        this.particles.push({
            x,
            y,
            size,
            color,
            velocityX,
            velocityY,
            life: 1, // 生命值，从1递减到0
            duration,
            timestamp: Date.now()
        });
        
        // 限制粒子数量
        if (this.particles.length > this.options.maxParticles) {
            this.particles.shift();
        }
    }
    
    createBurstEffect(x, y, count, type = 'normal') {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, type);
        }
    }

    update() {
        const now = Date.now();
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // 更新生命值
            p.life = 1 - (now - p.timestamp) / p.duration;
            
            // 移除死亡粒子
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // 更新位置
            p.x += p.velocityX;
            p.y += p.velocityY;
            
            // 轻微的重力效果
            p.velocityY += 0.01;
        }
    }

    draw() {
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
}

class BackgroundEffect {
    constructor(canvas, theme) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = theme;
        this.time = 0;
        this.gridLines = [];
        this.initGridLines();
    }
    
    initGridLines() {
        const cellSize = 20;
        const gridSize = this.canvas.width / cellSize;
        
        // 创建水平线
        for (let i = 0; i <= gridSize; i++) {
            this.gridLines.push({
                x1: 0,
                y1: i * cellSize,
                x2: this.canvas.width,
                y2: i * cellSize,
                pulse: Math.random() * 2 * Math.PI // 随机初始相位
            });
        }
        
        // 创建垂直线
        for (let i = 0; i <= gridSize; i++) {
            this.gridLines.push({
                x1: i * cellSize,
                y1: 0,
                x2: i * cellSize,
                y2: this.canvas.height,
                pulse: Math.random() * 2 * Math.PI // 随机初始相位
            });
        }
    }
    
    updateTheme(theme) {
        this.theme = theme;
    }
    
    update() {
        this.time += 0.01;
    }
    
    draw() {
        // 绘制脉冲网格
        for (const line of this.gridLines) {
            const alpha = 0.05 + Math.sin(this.time + line.pulse) * 0.05;
            this.ctx.strokeStyle = this.theme.grid.replace(/[\d.]+(?=\))/, alpha);
            this.ctx.lineWidth = 0.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(line.x1, line.y1);
            this.ctx.lineTo(line.x2, line.y2);
            this.ctx.stroke();
        }
        
        // 绘制边框光晕效果
        const glowSize = 3 + Math.sin(this.time) * 2;
        this.ctx.strokeStyle = this.theme.grid.replace(/[\d.]+(?=\))/, 0.3);
        this.ctx.lineWidth = glowSize;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// 导出效果类
window.ParticleSystem = ParticleSystem;
window.BackgroundEffect = BackgroundEffect;