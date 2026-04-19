/**
 * Генераторы паттернов уровней
 */

const Levels = {
    // Базовые параметры
    blockRows: 5,
    blockCols: 10,
    blockPadding: 4,
    blockTopOffset: 100,

    // Палитры для уровней
    palettes: [
        ['#ff2d95', '#ff6b35', '#ffaa00', '#00ff88', '#00c8ff', '#7b2fff'],
        ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06ffa5'],
        ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3'],
        ['#ff595e', '#ffca3c', '#8ac926', '#1982c4', '#42a5f5', '#f77042'],
        ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#f0a500'],
    ],

    // Генерация уровня по номеру
    generate(levelNum) {
        const patterns = [
            this.patternGrid.bind(this),
            this.patternPyramid.bind(this),
            this.patternDiamond.bind(this),
            this.patternCheckerboard.bind(this),
            this.patternWalls.bind(this),
            this.patternStairs.bind(this),
            this.patternCircle.bind(this),
            this.patternRandom.bind(this),
        ];

        const patternIndex = (levelNum - 1) % patterns.length;
        const hpMultiplier = Math.min(Math.ceil(levelNum / 3), 3); // макс 3 HP

        const paletteIndex = (levelNum - 1) % this.palettes.length;
        const palette = this.palettes[paletteIndex];

        const blocks = patterns[patternIndex](palette, hpMultiplier, levelNum);

        return {
            blocks,
            palette,
            levelNum,
            bgGradient: this.getBackgroundGradient(levelNum),
        };
    },

    // Сетка — классический прямоугольник
    patternGrid(palette, hpMult, levelNum) {
        const blocks = [];
        const rows = Math.min(3 + Math.floor(levelNum / 2), 8);
        const cols = Math.min(8 + Math.floor(levelNum / 3), 12);
        const blockWidth = 60;
        const blockHeight = 24;
        const totalWidth = cols * blockWidth + (cols - 1) * this.blockPadding;
        const startX = (800 - totalWidth) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (blockWidth + this.blockPadding);
                const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                const hp = row < 2 ? hpMult : 1;
                const color = palette[(row + col) % palette.length];
                blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
            }
        }
        return blocks;
    },

    // Пирамида
    patternPyramid(palette, hpMult, levelNum) {
        const blocks = [];
        const baseCols = 12;
        const blockWidth = 55;
        const blockHeight = 22;
        const totalWidth = baseCols * blockWidth + (baseCols - 1) * this.blockPadding;
        const startX = (800 - totalWidth) / 2;
        let row = 0;
        let cols = baseCols;

        while (cols >= 3) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (blockWidth + this.blockPadding);
                const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                const hp = row < hpMult ? hpMult : 1;
                const color = palette[row % palette.length];
                blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
            }
            row++;
            cols -= 2;
            startX += blockWidth + this.blockPadding;
        }
        return blocks;
    },

    // Алмаз
    patternDiamond(palette, hpMult, levelNum) {
        const blocks = [];
        const midRow = 5;
        const blockWidth = 50;
        const blockHeight = 22;
        const totalWidth = 12 * blockWidth + 11 * this.blockPadding;
        const startX = (800 - totalWidth) / 2;

        for (let row = 0; row < midRow * 2 + 1; row++) {
            const distFromMid = Math.abs(row - midRow);
            const cols = 12 - distFromMid * 2;
            const offset = distFromMid;
            for (let col = 0; col < cols; col++) {
                const x = startX + (offset + col) * (blockWidth + this.blockPadding);
                const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                const hp = distFromMid < hpMult ? hpMult : 1;
                const color = palette[row % palette.length];
                blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
            }
        }
        return blocks;
    },

    // Шахматная доска
    patternCheckerboard(palette, hpMult, levelNum) {
        const blocks = [];
        const rows = 7;
        const cols = 12;
        const blockWidth = 52;
        const blockHeight = 22;
        const totalWidth = cols * blockWidth + (cols - 1) * this.blockPadding;
        const startX = (800 - totalWidth) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row + col) % 2 === 0) {
                    const x = startX + col * (blockWidth + this.blockPadding);
                    const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                    const hp = row < hpMult ? hpMult : 1;
                    const color = palette[(row * cols + col) % palette.length];
                    blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
                }
            }
        }
        return blocks;
    },

    // Стены (дырчатый паттерн)
    patternWalls(palette, hpMult, levelNum) {
        const blocks = [];
        const rows = 8;
        const cols = 12;
        const blockWidth = 52;
        const blockHeight = 22;
        const totalWidth = cols * blockWidth + (cols - 1) * this.blockPadding;
        const startX = (800 - totalWidth) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Создаём "стены" с пропусками
                const isWallRow = row % 3 !== 2;
                const isWallCol = col % 3 !== 2;
                if (isWallRow && isWallCol) {
                    const x = startX + col * (blockWidth + this.blockPadding);
                    const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                    const hp = row < hpMult ? hpMult : 1;
                    const color = palette[row % palette.length];
                    blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
                }
            }
        }
        return blocks;
    },

    // Лестница
    patternStairs(palette, hpMult, levelNum) {
        const blocks = [];
        const rows = 8;
        const cols = 12;
        const blockWidth = 52;
        const blockHeight = 22;
        const totalWidth = cols * blockWidth + (cols - 1) * this.blockPadding;
        const startX = (800 - totalWidth) / 2;

        for (let row = 0; row < rows; row++) {
            const offset = Math.floor(row / 2);
            const activeCols = cols - offset * 2;
            if (activeCols <= 0) continue;
            for (let col = 0; col < activeCols; col++) {
                const x = startX + offset + col * (blockWidth + this.blockPadding);
                const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                const hp = row < hpMult ? hpMult : 1;
                const color = palette[(row + col) % palette.length];
                blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
            }
        }
        return blocks;
    },

    // Круг (округлый блок)
    patternCircle(palette, hpMult, levelNum) {
        const blocks = [];
        const centerX = 6;
        const centerY = 4;
        const blockWidth = 48;
        const blockHeight = 20;
        const totalWidth = 12 * blockWidth + 11 * this.blockPadding;
        const startX = (800 - totalWidth) / 2;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 12; col++) {
                const dx = (col - centerX) / centerX;
                const dy = (row - centerY) / centerY;
                const dist = dx * dx + dy * dy;
                if (dist <= 1.0) {
                    const x = startX + col * (blockWidth + this.blockPadding);
                    const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                    const hp = dist < 0.4 ? hpMult : 1;
                    const color = palette[Math.floor(dist * palette.length) % palette.length];
                    blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
                }
            }
        }
        return blocks;
    },

    // Случайный разброс
    patternRandom(palette, hpMult, levelNum) {
        const blocks = [];
        const blockWidth = 50;
        const blockHeight = 22;
        const totalWidth = 12 * blockWidth + 11 * this.blockPadding;
        const startX = (800 - totalWidth) / 2;
        const rows = 7;
        const density = 0.55 + levelNum * 0.03;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 12; col++) {
                if (Math.random() < Math.min(density, 0.9)) {
                    const x = startX + col * (blockWidth + this.blockPadding);
                    const y = this.blockTopOffset + row * (blockHeight + this.blockPadding);
                    const hp = Math.random() < 0.3 ? hpMult : 1;
                    const color = Utils.pick(palette);
                    blocks.push(new Block(x, y, blockWidth, blockHeight, hp, color));
                }
            }
        }
        return blocks;
    },

    // Градиент фона для уровня
    getBackgroundGradient(levelNum) {
        const hue1 = (levelNum * 40) % 360;
        const hue2 = (hue1 + 60) % 360;
        return {
            color1: `hsl(${hue1}, 30%, 5%)`,
            color2: `hsl(${hue2}, 40%, 8%)`,
            color3: `hsl(${(hue1 + 120) % 360}, 25%, 4%)`,
        };
    },

    // Шанс выпадения бонуса из блока (положительного) - теперь хаотично
    getBonusDropChance() {
        // Базовый шанс 15%, но с рандомизацией для хаотичности
        const baseChance = 0.15;
        const variance = Math.random() * 0.1; // +0-10%
        return baseChance + variance; // 15-25%
    },

    // Шанс выпадения анти-бонуса - тоже хаотично
    getAntibonusDropChance() {
        // Базовый шанс 6%, реже положительных
        const baseChance = 0.06;
        const variance = Math.random() * 0.04; // +0-4%
        return baseChance + variance; // 6-10%
    },

    // Тип бонуса (положительного)
    getBonusType() {
        const types = ['multiBall', 'expandPaddle', 'slow', 'extraLife'];
        const weights = [0.22, 0.30, 0.23, 0.25];
        const rand = Math.random();
        let sum = 0;
        for (let i = 0; i < types.length; i++) {
            sum += weights[i];
            if (rand < sum) return types[i];
        }
        return types[0];
    },

    // Тип анти-бонуса
    getAntibonusType() {
        const types = ['shrinkPaddle', 'speedUp', 'stealLife'];
        const weights = [0.45, 0.35, 0.20];
        const rand = Math.random();
        let sum = 0;
        for (let i = 0; i < types.length; i++) {
            sum += weights[i];
            if (rand < sum) return types[i];
        }
        return types[0];
    },
};
