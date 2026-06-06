/**
 * 进化点击游戏 - 工具函数库
 * Evolution Clicker Game - Utility Functions
 */

const Utils = {
    /**
     * 格式化数字，添加逗号分隔符
     * @param {number} num - 要格式化的数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    /**
     * 计算百分比
     * @param {number} current - 当前值
     * @param {number} total - 总值
     * @returns {number} 百分比 (0-100)
     */
    calculatePercentage(current, total) {
        if (total === 0) return 0;
        return Math.min(100, Math.max(0, (current / total) * 100));
    },

    /**
     * 随机整数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 随机浮点数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机浮点数
     */
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间 (ms)
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间 (ms)
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 本地存储操作
     */
    storage: {
        /**
         * 保存数据到localStorage
         * @param {string} key - 键
         * @param {any} value - 值
         */
        save(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage save error:', e);
                return false;
            }
        },

        /**
         * 从localStorage加载数据
         * @param {string} key - 键
         * @param {any} defaultValue - 默认值
         * @returns {any} 加载的值
         */
        load(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage load error:', e);
                return defaultValue;
            }
        },

        /**
         * 从localStorage移除数据
         * @param {string} key - 键
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },

        /**
         * 清空所有数据
         */
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    },

    /**
     * 时间格式化
     * @param {number} ms - 毫秒数
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}天 ${hours % 24}小时`;
        if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
        if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`;
        return `${seconds}秒`;
    },

    /**
     * 获取当前时间戳
     * @returns {number} 时间戳
     */
    timestamp() {
        return Date.now();
    },

    /**
     * 计算指数增长的成本
     * @param {number} baseCost - 基础成本
     * @param {number} multiplier - 倍增系数
     * @param {number} level - 当前等级
     * @returns {number} 计算后的成本
     */
    calculateExponentialCost(baseCost, multiplier, level) {
        return Math.floor(baseCost * Math.pow(multiplier, level));
    },

    /**
     * 计算线性增长的成本
     * @param {number} baseCost - 基础成本
     * @param {number} increment - 每次增加的量
     * @param {number} level - 当前等级
     * @returns {number} 计算后的成本
     */
    calculateLinearCost(baseCost, increment, level) {
        return baseCost + (increment * level);
    },

    /**
     * 概率检测
     * @param {number} chance - 概率 (0-1)
     * @returns {boolean} 是否成功
     */
    checkProbability(chance) {
        return Math.random() < chance;
    },

    /**
     * 数组洗牌
     * @param {Array} array - 要洗牌的数组
     * @returns {Array} 洗牌后的数组
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * 日志输出 (带时间戳)
     * @param {string} message - 日志消息
     * @param {string} type - 日志类型
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        
        switch (type) {
            case 'error':
                console.error(`${prefix} [ERROR]`, message);
                break;
            case 'warn':
                console.warn(`${prefix} [WARN]`, message);
                break;
            case 'success':
                console.log(`${prefix} [SUCCESS]`, message);
                break;
            default:
                console.log(`${prefix} [INFO]`, message);
        }
    },

    /**
     * 睡眠函数 (Promise版本)
     * @param {number} ms - 毫秒数
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 重试函数
     * @param {Function} fn - 要执行的函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试间隔 (ms)
     * @returns {Promise}
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await this.sleep(delay);
            }
        }
    }
};

// ES6 Module Export
export { Utils };

// CommonJS Export (for Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
