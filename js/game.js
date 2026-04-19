/**
 * Игровой движок: коллизии, бонусы, управление уровнями
 */

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Размеры
        this.width = 800;
        this.height = 600;
        canvas.width = this.width;
        canvas.height = this.height;

        // Состояние
        this.state = 'menu'; // menu, playing, paused, win, gameover
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.maxCombo = 0;
        
        // Время раунда
        this.roundStartTime = 0;
        this.roundTime = 0; // в секундах

        // Сущности
        this.balls = [];
        this.paddle = null;
        this.blocks = [];
        this.bonuses = [];
        this.particles = [];
        this.activeBalls = 1;

        // Фон
        this.bgHue = 0;
        this.bgTargetHue = 0;

        // Экранная тряска
        this.shakeAmount = 0;

        // Комбо-индикатор (массив для нескольких текстов)
        this.comboTexts = [];

        // Таймер ускорения мяча
        this.speedUpTimer = 0;
        this.speedUpDuration = 480; // 8 сек

        // Настройка canvas
        this.setupCanvas();

        // Создание сущностей
        this.createPaddle();
        this.createBall();
    }

    setupCanvas() {
        // Адаптивное масштабирование под экран
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        // Внутреннее разрешение canvas (логическое)
        const logicalWidth = 800;
        const logicalHeight = 600;
        
        // Физические размеры экрана
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        
        // Вычисляем масштаб для сохранения пропорций
        const scale = Math.min(
            displayWidth / logicalWidth,
            displayHeight / logicalHeight
        );
        
        // Устанавливаем физические размеры canvas
        this.canvas.width = logicalWidth;
        this.canvas.height = logicalHeight;
        
        // Масштабируем через CSS
        this.canvas.style.width = `${logicalWidth * scale}px`;
        this.canvas.style.height = `${logicalHeight * scale}px`;
        
        // Сохраняем масштаб для преобразования координат
        this.scale = scale;
        this.displayWidth = logicalWidth * scale;
        this.displayHeight = logicalHeight * scale;
    }

    createPaddle() {
        const paddleWidth = 120;
        const paddleHeight = 14;
        const paddleX = (this.width - paddleWidth) / 2;
        const paddleY = this.height - 40;
        this.paddle = new Paddle(paddleX, paddleY, paddleWidth, paddleHeight);
    }

    createBall() {
        this.balls = [];
        this.activeBalls = 1;
        const ballRadius = 8;
        const ball = new Ball(
            this.paddle.x + this.paddle.width / 2,
            this.paddle.y - ballRadius - 1,
            ballRadius
        );
        ball.attachToPaddle(this.paddle);
        this.balls.push(ball);
    }

    startLevel(levelNum) {
        this.level = levelNum;
        const levelData = Levels.generate(levelNum);
        this.blocks = levelData.blocks;
        this.bgTargetHue = (levelNum - 1) * 40;

        // Сброс сущностей
        this.createPaddle();
        this.createBall();
        this.bonuses = [];
        this.particles = [];
        this.combo = 0;
        this.comboTexts = []; // Очищаем тексты бонусов
        
        // Запуск таймера раунда
        this.roundStartTime = Date.now();
        this.roundTime = 0;
    }

    startGame() {
        this.score = 0;
        this.lives = 3;
        this.startLevel(1);
        this.state = 'playing';
    }

    // Запуск мяча
    launchBall() {
        for (const ball of this.balls) {
            if (!ball.launched) {
                ball.launch();
                return;
            }
        }
    }

    // Обработка бонуса
    applyBonus(bonus) {
        switch (bonus.type) {
            case 'multiBall':
                this.splitBall();
                this.showComboText('+Множитель мячей!', bonus.revealedColor);
                break;
            case 'expandPaddle':
                this.paddle.expand();
                this.showComboText('+Расширение!', bonus.revealedColor);
                break;
            case 'slow':
                for (const ball of this.balls) {
                    ball.changeSpeed(0.7);
                }
                this.showComboText('+Замедление!', bonus.revealedColor);
                break;
            case 'extraLife':
                this.lives = Math.min(this.lives + 1, 5);
                this.showComboText('+Жизнь!', bonus.revealedColor);
                break;
            // Анти-бонусы
            case 'shrinkPaddle':
                this.paddle.shrinkPaddle();
                this.showComboText('-Уменьшение!', bonus.revealedColor);
                break;
            case 'speedUp':
                this.speedUpTimer = this.speedUpDuration;
                for (const ball of this.balls) {
                    ball.changeSpeed(1.4);
                }
                this.showComboText('-Ускорение!', bonus.revealedColor);
                break;
            case 'stealLife':
                this.lives = Math.max(this.lives - 1, 1);
                this.showComboText('-Потеря жизни!', bonus.revealedColor);
                break;
        }
    }

    // Разделение мяча
    splitBall() {
        const existingBall = this.balls.find(b => b.launched);
        if (existingBall && this.balls.length < 5) {
            const newBall = new Ball(existingBall.x, existingBall.y, 8);
            newBall.speed = existingBall.speed;
            newBall.baseSpeed = existingBall.baseSpeed;
            const angle = Utils.rand(-Math.PI / 4, -Math.PI / 4 + Math.PI / 2);
            newBall.dx = Math.cos(angle) * newBall.speed;
            newBall.dy = -Math.abs(Math.sin(angle) * newBall.speed);
            newBall.launched = true;
            this.balls.push(newBall);
        }
    }

    // Комбо-индикатор (теперь добавляет в массив, не заменяет)
    showComboText(text, color) {
        this.comboTexts.push({
            text,
            color,
            alpha: 1,
            y: this.height / 2 + (this.comboTexts.length * 30), // Смещение для каждого нового
            timer: 180, // Увеличено с 90 до 180 (3 секунды вместо 1.5)
        });
    }

    // Коллизия мяча с блоками
    checkBlockCollisions(ball) {
        for (const block of this.blocks) {
            if (!block.active) continue;

            if (Utils.circleRectCollision(ball, block)) {
                // Определяем сторону столкновения
                const ballCenterX = ball.x;
                const ballCenterY = ball.y;
                const blockCenterX = block.x + block.width / 2;
                const blockCenterY = block.y + block.height / 2;

                const overlapLeft = Math.abs(ballCenterX - block.x) - ball.radius;
                const overlapRight = Math.abs(ballCenterX - (block.x + block.width)) - ball.radius;
                const overlapTop = Math.abs(ballCenterY - block.y) - ball.radius;
                const overlapBottom = Math.abs(ballCenterY - (block.y + block.height)) - ball.radius;

                const minOverlapX = Math.min(Math.abs(overlapLeft), Math.abs(overlapRight));
                const minOverlapY = Math.min(Math.abs(overlapTop), Math.abs(overlapBottom));

                if (minOverlapX < minOverlapY) {
                    ball.dx = -ball.dx;
                } else {
                    ball.dy = -ball.dy;
                }

                block.hit();
                this.combo++;
                this.maxCombo = Math.max(this.maxCombo, this.combo);

                // Очки с бонусом за комбо (повышающий коэффициент)
                const comboMultiplier = 1 + (this.combo - 1) * 0.1; // +10% за каждый удар в комбо
                const pointsEarned = Math.floor(block.points * comboMultiplier);
                this.score += pointsEarned;

                // Частицы
                const blockCenterX_pos = block.x + block.width / 2;
                const blockCenterY_pos = block.y + block.height / 2;
                this.particles.push(...Utils.createExplosion(
                    blockCenterX_pos, blockCenterY_pos, block.color, 12
                ));

                // Тряска экрана
                this.shakeAmount = 3;

                // Шанс положительного бонуса (проверяем ДО того, как блок станет неактивным)
                const bonusChance = Math.random();
                const antibonusChance = Math.random();
                
                if (bonusChance < Levels.getBonusDropChance()) {
                    this.bonuses.push(new Bonus(
                        blockCenterX_pos - 12,
                        blockCenterY_pos - 12,
                        Levels.getBonusType()
                    ));
                }

                // Шанс анти-бонуса (отдельный, реже)
                if (antibonusChance < Levels.getAntibonusDropChance()) {
                    this.bonuses.push(new Bonus(
                        blockCenterX_pos - 12,
                        blockCenterY_pos - 12,
                        Levels.getAntibonusType()
                    ));
                }

                // Удаляем мёртвые блоки (очки уже начислены выше с комбо-множителем)
                // Дополнительное начисление очков убираем, чтобы не дублировать

                break; // Один блок за кадр
            }
        }
    }

    // Коллизия мяча с платформой
    checkPaddleCollision(ball) {
        if (!ball.launched) return;

        if (ball.y + ball.radius >= this.paddle.y &&
            ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
            ball.x >= this.paddle.x &&
            ball.x <= this.paddle.x + this.paddle.width &&
            ball.dy > 0) {

            // Угол отскока зависит от точки удара
            const hitPos = (ball.x - this.paddle.x) / this.paddle.width; // 0..1
            const angle = (hitPos - 0.5) * (Math.PI / 2.5); // -36°..+36°

            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = Math.sin(angle) * speed;
            ball.dy = -Math.cos(angle) * speed;

            // Убедимся, что мяч не застрял
            ball.y = this.paddle.y - ball.radius - 1;

            // Частицы от платформы — комбо сбрасывается!
            this.combo = 0;
            this.particles.push(...Utils.createExplosion(
                ball.x, ball.y, '#7b2fff', 5
            ));
        }
    }

    // Коллизия мяча со стенами
    checkWallCollisions(ball) {
        // Левая/правая стены
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
        }
        if (ball.x + ball.radius >= this.width) {
            ball.x = this.width - ball.radius;
            ball.dx = -Math.abs(ball.dx);
        }
        // Верхняя стена
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.dy = Math.abs(ball.dy);
        }
    }

    // Обновление игры
    update() {
        if (this.state !== 'playing') return;

        // Фон — плавная смена
        this.bgHue = Utils.lerp(this.bgHue, this.bgTargetHue, 0.01);
        
        // Обновление времени раунда
        this.roundTime = Math.floor((Date.now() - this.roundStartTime) / 1000);

        // Платформа
        this.paddle.update();

        // Мячи
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            ball.update();

            if (ball.launched) {
                this.checkWallCollisions(ball);
                this.checkBlockCollisions(ball);
                this.checkPaddleCollision(ball);

                // Мяч упал
                if (ball.y - ball.radius > this.height) {
                    this.balls.splice(i, 1);
                }
            }
        }

        // Проверка жизней
        if (this.balls.length === 0) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = 'gameover';
            } else {
                this.createBall();
                this.combo = 0;
            }
        }

        // Бонусы
        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            const bonus = this.bonuses[i];
            bonus.update();

            // Коллизия с платформой
            if (Utils.rectCollision(
                { x: bonus.x, y: bonus.y, width: bonus.width, height: bonus.height },
                { x: this.paddle.x, y: this.paddle.y, width: this.paddle.width, height: this.paddle.height }
            )) {
                // Раскрываем бонус и применяем эффект
                bonus.reveal();
                this.applyBonus(bonus);
                
                // Визуальный эффект при поимке бонуса
                this.particles.push(...Utils.createExplosion(
                    bonus.x + bonus.width / 2,
                    bonus.y + bonus.height / 2,
                    bonus.revealedColor,
                    20
                ));
                
                // Удаляем бонус сразу после применения (визуально показываем в комбо-тексте)
                this.bonuses.splice(i, 1);
                continue;
            }

            // Упал за экран
            if (bonus.y > this.height) {
                this.bonuses.splice(i, 1);
            }
        }

        // Частицы
        this.particles = this.particles.filter(p => Utils.updateParticle(p));

        // Сброс скорости мяча после окончания ускорения
        if (this.speedUpTimer > 0) {
            this.speedUpTimer--;
            if (this.speedUpTimer <= 0) {
                for (const ball of this.balls) {
                    ball.changeSpeed(1 / 1.4);
                }
            }
        }

        // Тряска экрана
        if (this.shakeAmount > 0.1) {
            this.shakeAmount *= 0.85;
        } else {
            this.shakeAmount = 0;
        }

        // Комбо-тексты (массив - все активные тексты)
        for (let i = this.comboTexts.length - 1; i >= 0; i--) {
            const ct = this.comboTexts[i];
            ct.timer--;
            ct.y -= 0.8; // Плывут вверх
            ct.alpha = ct.timer / 180;
            if (ct.timer <= 0) {
                this.comboTexts.splice(i, 1);
            }
        }

        // Проверка победы
        if (this.blocks.every(b => !b.active)) {
            this.state = 'win';
        }
    }

    // Отрисовка
    draw() {
        const ctx = this.ctx;

        // Тряска экрана
        ctx.save();
        if (this.shakeAmount > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.shakeAmount,
                (Math.random() - 0.5) * this.shakeAmount
            );
        }

        // Фон с градиентом
        const hue = this.bgHue;
        const bgGrad = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width * 0.7
        );
        bgGrad.addColorStop(0, `hsl(${hue}, 40%, 10%)`);
        bgGrad.addColorStop(0.5, `hsl(${(hue + 30) % 360}, 35%, 6%)`);
        bgGrad.addColorStop(1, `hsl(${(hue + 60) % 360}, 30%, 3%)`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Сетка на фоне
        ctx.strokeStyle = `hsla(${hue}, 30%, 20%, 0.05)`;
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        if (this.state === 'menu') {
            ctx.restore();
            return;
        }

        // Блоки
        for (const block of this.blocks) {
            block.draw(ctx);
        }

        // Платформа
        this.paddle.draw(ctx);

        // Мячи
        for (const ball of this.balls) {
            ball.draw(ctx);
        }

        // Бонусы
        for (const bonus of this.bonuses) {
            bonus.draw(ctx);
        }

        // Частицы
        for (const particle of this.particles) {
            particle.draw(ctx);
        }

        // Комбо-индикаторы (рисуем все активные тексты)
        for (const ct of this.comboTexts) {
            ctx.globalAlpha = ct.alpha;
            ctx.fillStyle = ct.color;
            ctx.font = 'bold 28px Segoe UI';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = ct.color;
            ctx.shadowBlur = 15;
            ctx.fillText(ct.text, this.width / 2, ct.y);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;

        // Индикатор комбо
        if (this.combo > 2) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
            ctx.font = '14px Segoe UI';
            ctx.textAlign = 'right';
            ctx.fillText(`Комбо: x${this.combo}`, this.width - 20, this.height - 20);
        }

        // Подсказка "нажмите для запуска"
        const unlaunchedBall = this.balls.find(b => !b.launched);
        if (unlaunchedBall && this.state === 'playing') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '16px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText('Нажмите для запуска мяча', this.width / 2, this.height / 2 + 60);
        }

        ctx.restore();
    }

    // Получить данные для HUD
    getHUD() {
        return {
            score: this.score,
            level: this.level,
            lives: '❤'.repeat(Math.max(0, this.lives)),
            time: this.formatTime(this.roundTime),
            combo: this.combo,
            maxCombo: this.maxCombo
        };
    }
    
    // Форматирование времени (мм:сс)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Следующий уровень
    nextLevel() {
        this.startLevel(this.level + 1);
        this.state = 'playing';
    }

    // Рестарт
    restart() {
        this.startGame();
    }
}
