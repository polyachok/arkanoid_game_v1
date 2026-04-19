/**
 * Утилиты: математика, градиенты, цвета, частицы
 */

const Utils = {
    // Генератор случайных чисел в диапазоне
    rand(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Случайный целый число в диапазоне
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Случайный элемент массива
    pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    // Проверка пересечения двух прямоугольников
    rectCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    },

    // Круг-прямоугольник коллизия
    circleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
    },

    // Нормализация вектора
    normalize(x, y) {
        const len = Math.sqrt(x * x + y * y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: x / len, y: y / len };
    },

    // Создание canvas градиента
    createLinearGradient(ctx, x1, y1, x2, y2, colors) {
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        colors.forEach((color, i) => {
            grad.addColorStop(i / (colors.length - 1), color);
        });
        return grad;
    },

    // Создание radial градиента
    createRadialGradient(ctx, cx, cy, r1, r2, colors) {
        const grad = ctx.createRadialGradient(cx, cy, r1, cx, cy, r2);
        colors.forEach((color, i) => {
            grad.addColorStop(i / (colors.length - 1), color);
        });
        return grad;
    },

    // Неоновое свечение
    drawGlow(ctx, drawFn, color, blur = 10) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        drawFn();
        ctx.shadowBlur = 0;
    },

    // HSL в hex конвертация
    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    },

    // Генерация неоновой палитры
    neonPalette(count = 8) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i / count) * 360;
            colors.push(`hsl(${hue}, 100%, 60%)`);
        }
        return colors;
    },

    // Интерполяция цвета
    lerpColor(hex1, hex2, t) {
        const r1 = parseInt(hex1.slice(1, 3), 16);
        const g1 = parseInt(hex1.slice(3, 5), 16);
        const b1 = parseInt(hex1.slice(5, 7), 16);
        const r2 = parseInt(hex2.slice(1, 3), 16);
        const g2 = parseInt(hex2.slice(3, 5), 16);
        const b2 = parseInt(hex2.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return `rgb(${r}, ${g}, ${b})`;
    },

    // Создание частиц взрыва
    createExplosion(x, y, color, count = 15) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, color));
        }
        return particles;
    },

    // Обновление частицы
    updateParticle(p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // гравитация
        p.vx *= 0.99;
        p.life -= p.decay;
        p.alpha = p.life;
        return p.life > 0;
    },

    // Плавная интерполяция
    lerp(current, target, factor) {
        return current + (target - current) * factor;
    },

    // Кламп значения
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Форматирование очков
    formatScore(score) {
        if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
        if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
        return score.toString();
    },
};
