/**
 * Сущности игры: Ball, Paddle, Block, Particle, Bonus
 */

// ===== МЯЧ =====
class Ball {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 5;
        this.dx = 0;
        this.dy = 0;
        this.baseSpeed = 5;
        this.trail = [];
        this.maxTrail = 8;
        this.color = '#00c8ff';
        this.glowColor = 'rgba(0, 200, 255, 0.6)';
        this.active = true;
        this.launched = false; // ждёт запуска от платформы
    }

    launch() {
        if (!this.launched) {
            const angle = Utils.rand(-Math.PI / 3, -Math.PI / 3 + Math.PI / 1.5);
            this.dx = Math.cos(angle + Math.PI / 2) * this.speed;
            this.dy = -this.speed;
            this.launched = true;
        }
    }

    attachToPaddle(paddle) {
        this.x = paddle.x + paddle.width / 2;
        this.y = paddle.y - this.radius;
        this.launched = false;
        this.dx = 0;
        this.dy = 0;
        this.trail = [];
    }

    update() {
        if (!this.launched) return;

        // Сохраняем след
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
        // Затухание следа
        for (const t of this.trail) {
            t.alpha -= 0.12;
        }
        this.trail = this.trail.filter(t => t.alpha > 0);

        this.x += this.dx;
        this.y += this.dy;
    }

    draw(ctx) {
        // Рисуем след
        for (const t of this.trail) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 200, 255, ${t.alpha * 0.3})`;
            ctx.fill();
        }

        // Рисуем мяч с неоном
        Utils.drawGlow(ctx, () => {
            const grad = ctx.createRadialGradient(
                this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
                this.x, this.y, this.radius
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, this.color);
            grad.addColorStop(1, 'rgba(0, 200, 255, 0.3)');

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }, this.glowColor, 15);
    }

    changeSpeed(factor) {
        const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        if (currentSpeed > 0) {
            this.baseSpeed *= factor;
            const ratio = this.baseSpeed / currentSpeed;
            this.dx *= ratio;
            this.dy *= ratio;
        } else {
            this.baseSpeed *= factor;
        }
    }

    reset() {
        this.speed = this.baseSpeed;
        this.dx = 0;
        this.dy = 0;
        this.launched = false;
        this.trail = [];
    }
}

// ===== ПЛАТФОРМА =====
class Paddle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.targetWidth = width;
        this.speed = 8;
        this.color = '#7b2fff';
        this.glowColor = 'rgba(120, 0, 255, 0.6)';
        this.expanded = false;
        this.shrunk = false;
        this.expandTimer = 0;
        this.shrinkTimer = 0;
        this.expandDuration = 600; // 10 сек при 60fps
    }

    expand() {
        this.targetWidth = this.width * 1.5;
        this.expanded = true;
        this.expandTimer = this.expandDuration;
    }

    shrink() {
        this.targetWidth = this.width * 0.6;
        this.shrunk = true;
        this.shrinkTimer = this.expandDuration;
    }

    update() {
        // Плавное изменение ширины
        if (Math.abs(this.width - this.targetWidth) > 1) {
            this.width = Utils.lerp(this.width, this.targetWidth, 0.1);
        }

        // Таймер расширения
        if (this.expanded) {
            this.expandTimer--;
            if (this.expandTimer <= 0) {
                this.targetWidth = 120; // Базовая ширина
                this.expanded = false;
            }
        }

        // Таймер сужения
        if (this.shrunk) {
            this.shrinkTimer--;
            if (this.shrinkTimer <= 0) {
                this.targetWidth = 120; // Базовая ширина
                this.shrunk = false;
            }
        }
    }

    moveLeft() {
        this.x -= this.speed;
    }

    moveRight() {
        this.x += this.speed;
    }

    constrain(canvasWidth) {
        this.x = Utils.clamp(this.x, 0, canvasWidth - this.width);
    }

    draw(ctx) {
        const radius = this.height / 2;

        Utils.drawGlow(ctx, () => {
            const grad = ctx.createLinearGradient(
                this.x, this.y, this.x, this.y + this.height
            );
            grad.addColorStop(0, '#9b5fff');
            grad.addColorStop(1, '#5a00d4');

            ctx.beginPath();
            ctx.moveTo(this.x + radius, this.y);
            ctx.lineTo(this.x + this.width - radius, this.y);
            ctx.arc(this.x + this.width - radius, this.y + radius, radius, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(this.x + radius, this.y + this.height);
            ctx.arc(this.x + radius, this.y + radius, radius, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Блик сверху
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.2, this.y + 2);
            ctx.lineTo(this.x + this.width * 0.8, this.y + 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }, this.glowColor, 12);
    }
}

// ===== БЛОК =====
class Block {
    constructor(x, y, width, height, hp, color, points) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.maxHp = hp;
        this.color = color;
        this.points = points || hp * 10;
        this.active = true;
        this.radius = 4;
        this.shakeOffset = 0;
    }

    hit() {
        this.hp--;
        this.shakeOffset = 3;
        if (this.hp <= 0) {
            this.active = false;
        }
    }

    getFillColor() {
        const healthRatio = this.hp / this.maxHp;
        if (healthRatio > 0.6) return this.color;
        if (healthRatio > 0.3) {
            return Utils.lerpColor(this.color, '#ff4444', 0.5);
        }
        return Utils.lerpColor(this.color, '#ff4444', 0.8);
    }

    draw(ctx) {
        if (!this.active) return;

        const shakeX = this.shakeOffset ? (Math.random() - 0.5) * this.shakeOffset : 0;
        const shakeY = this.shakeOffset ? (Math.random() - 0.5) * this.shakeOffset : 0;
        this.shakeOffset *= 0.8;
        if (Math.abs(this.shakeOffset) < 0.1) this.shakeOffset = 0;

        const drawX = this.x + shakeX;
        const drawY = this.y + shakeY;

        Utils.drawGlow(ctx, () => {
            const healthRatio = this.hp / this.maxHp;
            const grad = ctx.createLinearGradient(drawX, drawY, drawX, drawY + this.height);

            if (healthRatio > 0.6) {
                grad.addColorStop(0, this.color);
                grad.addColorStop(1, Utils.lerpColor(this.color, '#000000', 0.3));
            } else if (healthRatio > 0.3) {
                grad.addColorStop(0, Utils.lerpColor(this.color, '#ffaa00', 0.4));
                grad.addColorStop(1, Utils.lerpColor(this.color, '#ff4400', 0.3));
            } else {
                grad.addColorStop(0, '#ff6644');
                grad.addColorStop(1, '#cc2200');
            }

            ctx.beginPath();
            ctx.roundRect(drawX, drawY, this.width, this.height, this.radius);
            ctx.fillStyle = grad;
            ctx.fill();

            // Блик
            ctx.beginPath();
            ctx.roundRect(drawX + 2, drawY + 1, this.width - 4, this.height / 3, 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();

            // Индикатор HP (если > 1)
            if (this.maxHp > 1) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = 'bold 11px Segoe UI';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.hp, drawX + this.width / 2, drawY + this.height / 2);
            }
        }, this.color, 6);
    }
}

// ===== БОНУС =====
class Bonus {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.type = type; // 'multiBall', 'expandPaddle', 'slow', 'extraLife', 'shrinkPaddle', 'speedUp', 'stealLife'
        this.speed = 2;
        this.active = true;
        this.angle = 0;
        this.pulse = 0;
        this.revealed = false; // Скрыт ли тип бонуса
        
        // Цвета для скрытого состояния (загадочный серый/фиолетовый)
        this.hiddenColor = '#6a4a9c';
        this.hiddenGlowColor = 'rgba(106, 74, 156, 0.6)';
        this.hiddenSymbol = '?';

        switch (type) {
            case 'multiBall':
                this.color = '#ff2d95';
                this.symbol = '×3';
                this.glowColor = 'rgba(255, 45, 149, 0.6)';
                break;
            case 'expandPaddle':
                this.color = '#00ff88';
                this.symbol = '▬';
                this.glowColor = 'rgba(0, 255, 136, 0.6)';
                break;
            case 'slow':
                this.color = '#00c8ff';
                this.symbol = '◎';
                this.glowColor = 'rgba(0, 200, 255, 0.6)';
                break;
            case 'extraLife':
                this.color = '#ffaa00';
                this.symbol = '♥';
                this.glowColor = 'rgba(255, 170, 0, 0.6)';
                break;
            // Анти-бонусы
            case 'shrinkPaddle':
                this.color = '#ff2255';
                this.symbol = '▬';
                this.glowColor = 'rgba(255, 34, 85, 0.6)';
                break;
            case 'speedUp':
                this.color = '#cc22ff';
                this.symbol = '▶';
                this.glowColor = 'rgba(200, 34, 255, 0.6)';
                break;
            case 'stealLife':
                this.color = '#444444';
                this.symbol = '✕';
                this.glowColor = 'rgba(80, 80, 80, 0.7)';
                break;
        }
    }

    reveal() {
        this.revealed = true;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
        this.pulse = Math.sin(this.angle) * 0.15 + 1;
    }

    draw(ctx) {
        const scale = this.pulse;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        // Используем скрытые цвета пока бонус не раскрыт
        const displayColor = this.revealed ? this.color : this.hiddenColor;
        const displayGlow = this.revealed ? this.glowColor : this.hiddenGlowColor;
        const displaySymbol = this.revealed ? this.symbol : this.hiddenSymbol;

        Utils.drawGlow(ctx, () => {
            // Круглый фон
            ctx.beginPath();
            ctx.arc(cx, cy, (this.width / 2) * scale, 0, Math.PI * 2);
            ctx.fillStyle = displayColor;
            ctx.fill();

            // Внутреннее свечение
            const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, (this.width / 2) * scale);
            innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.beginPath();
            ctx.arc(cx, cy, (this.width / 2) * scale, 0, Math.PI * 2);
            ctx.fillStyle = innerGrad;
            ctx.fill();

            // Символ
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.floor(12 * scale)}px Segoe UI`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displaySymbol, cx, cy);
        }, displayGlow, 15);
    }
}

// ===== ЧАСТИЦА (взрыв) =====
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Utils.rand(0, Math.PI * 2);
        const speed = Utils.rand(1, 5);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Utils.rand(1.5, 4);
        this.color = color;
        this.alpha = 1;
        this.decay = Utils.rand(0.015, 0.04);
        this.life = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05;
        this.vx *= 0.99;
        this.life -= this.decay;
        this.alpha = this.life;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.life, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
