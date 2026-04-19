/**
 * Главная точка входа: инициализация, ввод, game loop
 */

// ===== Инициализация =====
const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

// ===== UI элементы =====
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const pauseBtn = document.getElementById('pauseBtn');

const menuOverlay = document.getElementById('menuOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const winOverlay = document.getElementById('winOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');

const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const restartFromWinBtn = document.getElementById('restartFromWinBtn');
const retryBtn = document.getElementById('retryBtn');
const restartFromLoseBtn = document.getElementById('restartFromLoseBtn');

const finalScoreWin = document.getElementById('finalScoreWin');
const finalScoreLose = document.getElementById('finalScoreLose');

// ===== Управление видимостью оверлеев =====
function showOverlay(overlay) {
    [menuOverlay, pauseOverlay, winOverlay, gameOverOverlay].forEach(o => o.classList.add('hidden'));
    if (overlay) overlay.classList.remove('hidden');
}

function updateHUD() {
    const hud = game.getHUD();
    scoreDisplay.textContent = hud.score;
    levelDisplay.textContent = hud.level;
    livesDisplay.textContent = hud.lives;
}

// ===== Состояния =====
function showMenu() {
    game.state = 'menu';
    showOverlay(menuOverlay);
}

function startGame() {
    game.startGame();
    showOverlay(null);
    updateHUD();
}

function pauseGame() {
    if (game.state !== 'playing') return;
    game.state = 'paused';
    showOverlay(pauseOverlay);
}

function resumeGame() {
    game.state = 'playing';
    showOverlay(null);
}

function showWin() {
    game.state = 'win';
    finalScoreWin.textContent = game.score;
    showOverlay(winOverlay);
}

function showGameOver() {
    game.state = 'gameover';
    finalScoreLose.textContent = game.score;
    showOverlay(gameOverOverlay);
}

// ===== Обработчики кнопок =====
startBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', resumeGame);
restartFromPauseBtn.addEventListener('click', () => {
    game.restart();
    showOverlay(null);
    updateHUD();
});
nextLevelBtn.addEventListener('click', () => {
    game.nextLevel();
    showOverlay(null);
    updateHUD();
});
restartFromWinBtn.addEventListener('click', showMenu);
retryBtn.addEventListener('click', () => {
    game.restart();
    showOverlay(null);
    updateHUD();
});
restartFromLoseBtn.addEventListener('click', showMenu);
pauseBtn.addEventListener('click', pauseGame);

// ===== Ввод =====
const keys = {};
let mouseX = 0;
let mouseActive = false;

// Клавиатура
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Space') {
        e.preventDefault();
        if (game.state === 'playing') {
            pauseGame();
        } else if (game.state === 'paused') {
            resumeGame();
        }
    }

    // Запуск мяча
    if (e.code === 'Space' && game.state === 'playing') {
        game.launchBall();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Мышь
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseActive = true;
});

canvas.addEventListener('click', () => {
    if (game.state === 'playing') {
        game.launchBall();
    }
});

// ===== Игровой цикл =====
function updateInput() {
    if (game.state !== 'playing') return;

    // Клавиатура
    if (keys['ArrowLeft'] || keys['KeyA']) {
        game.paddle.moveLeft();
        mouseActive = false;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        game.paddle.moveRight();
        mouseActive = false;
    }

    // Мышь
    if (mouseActive) {
        game.paddle.x = mouseX - game.paddle.width / 2;
    }

    game.paddle.constrain(canvas.width);
}

function gameLoop() {
    // Обновление ввода
    updateInput();

    // Обновление игры
    game.update();

    // Отрисовка
    game.draw();

    // HUD
    if (game.state === 'playing' || game.state === 'paused') {
        updateHUD();
    }

    // Переходы состояний
    if (game.state === 'win') showWin();
    if (game.state === 'gameover') showGameOver();

    requestAnimationFrame(gameLoop);
}

// ===== Старт =====
showMenu();
gameLoop();
