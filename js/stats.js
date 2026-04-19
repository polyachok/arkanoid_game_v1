/**
 * Система статистики игроков (без БД, localStorage)
 */

class StatsManager {
    constructor() {
        this.storageKey = 'arkanoid_stats_v1';
        this.maxRecords = 10; // Храним топ-10 результатов
    }

    // Получение текущей статистики
    getStats() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {
            gamesPlayed: 0,
            totalScore: 0,
            maxLevel: 1,
            bestScores: [],
            totalTime: 0
        };
    }

    // Сохранение статистики
    saveStats(stats) {
        localStorage.setItem(this.storageKey, JSON.stringify(stats));
    }

    // Добавление результата игры
    addGameResult(score, level, timeSeconds, maxCombo) {
        const stats = this.getStats();
        
        stats.gamesPlayed++;
        stats.totalScore += score;
        stats.maxLevel = Math.max(stats.maxLevel, level);
        stats.totalTime += timeSeconds;

        // Добавляем в таблицу рекордов
        const record = {
            score: score,
            level: level,
            time: timeSeconds,
            combo: maxCombo,
            date: new Date().toISOString()
        };

        stats.bestScores.push(record);
        
        // Сортируем по очкам и оставляем топ-10
        stats.bestScores.sort((a, b) => b.score - a.score);
        stats.bestScores = stats.bestScores.slice(0, this.maxRecords);

        this.saveStats(stats);
        return stats;
    }

    // Получение таблицы лидеров
    getLeaderboard() {
        const stats = this.getStats();
        return stats.bestScores;
    }

    // Очистка статистики
    clearStats() {
        localStorage.removeItem(this.storageKey);
    }

    // Форматирование времени
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Форматирование даты
    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Глобальный экземпляр
const Stats = new StatsManager();
