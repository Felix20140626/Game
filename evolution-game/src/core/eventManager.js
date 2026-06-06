/**
 * Event Manager - Centralized event handling system
 * Manages game events, subscriptions, and dispatching
 */

class EventManager {
    constructor() {
        this.events = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
    }
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to subscribe to
     * @param {Function} callback - Function to call when event is triggered
     * @param {Object} context - Optional context for the callback
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        
        const wrappedCallback = context 
            ? callback.bind(context) 
            : callback;
        
        this.events.get(eventName).add(wrappedCallback);
        
        // Return unsubscribe function
        return () => {
            this.off(eventName, wrappedCallback);
        };
    }
    
    /**
     * Subscribe to an event once
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     * @param {Object} context - Optional context
     * @returns {Function} Unsubscribe function
     */
    once(eventName, callback, context = null) {
        const wrapper = (...args) => {
            this.off(eventName, wrapper);
            callback.apply(context, args);
        };
        
        return this.on(eventName, wrapper, context);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback to remove
     */
    off(eventName, callback) {
        if (!this.events.has(eventName)) {
            return;
        }
        
        this.events.get(eventName).delete(callback);
        
        // Clean up empty event sets
        if (this.events.get(eventName).size === 0) {
            this.events.delete(eventName);
        }
    }
    
    /**
     * Emit/trigger an event
     * @param {string} eventName - Name of the event to trigger
     * @param {*} data - Data to pass to callbacks
     */
    emit(eventName, data = {}) {
        // Add to history
        this.addToHistory(eventName, data);
        
        // Get all subscribers
        const subscribers = this.events.get(eventName);
        if (!subscribers) {
            return;
        }
        
        // Call all subscribers
        subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for "${eventName}":`, error);
            }
        });
    }
    
    /**
     * Add event to history
     * @param {string} eventName - Name of the event
     * @param {*} data - Event data
     */
    addToHistory(eventName, data) {
        const timestamp = Date.now();
        this.eventHistory.push({ eventName, data, timestamp });
        
        // Trim history if too large
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
    
    /**
     * Get event history
     * @param {number} limit - Maximum number of events to return
     * @returns {Array} Array of historical events
     */
    getHistory(limit = 50) {
        return this.eventHistory.slice(-limit);
    }
    
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }
    
    /**
     * Get all event names that have subscribers
     * @returns {Array} Array of event names
     */
    getEventNames() {
        return Array.from(this.events.keys());
    }
    
    /**
     * Get subscriber count for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of subscribers
     */
    getSubscriberCount(eventName) {
        const subscribers = this.events.get(eventName);
        return subscribers ? subscribers.size : 0;
    }
    
    /**
     * Remove all subscribers from an event
     * @param {string} eventName - Name of the event
     */
    removeAllListeners(eventName) {
        this.events.delete(eventName);
    }
    
    /**
     * Remove all events and subscribers
     */
    clearAll() {
        this.events.clear();
        this.clearHistory();
    }
    
    /**
     * Check if an event has subscribers
     * @param {string} eventName - Name of the event
     * @returns {boolean} True if event has subscribers
     */
    hasListeners(eventName) {
        return this.events.has(eventName) && this.events.get(eventName).size > 0;
    }
    
    /**
     * Create a promise that resolves when an event is emitted
     * @param {string} eventName - Name of the event to wait for
     * @param {Function} predicate - Optional predicate to filter events
     * @returns {Promise} Promise that resolves with event data
     */
    waitFor(eventName, predicate = null) {
        return new Promise((resolve) => {
            const unsubscribe = this.once(eventName, (data) => {
                if (!predicate || predicate(data)) {
                    resolve(data);
                } else {
                    // If predicate fails, wait again
                    this.waitFor(eventName, predicate).then(resolve);
                }
            });
        });
    }
    
    /**
     * Batch emit multiple events
     * @param {Array} events - Array of {eventName, data} objects
     */
    batchEmit(events) {
        events.forEach(({ eventName, data }) => {
            this.emit(eventName, data);
        });
    }
    
    /**
     * Debounce event emission
     * @param {string} eventName - Name of the event
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced emit function
     */
    debounceEmit(eventName, delay = 300) {
        let timeoutId = null;
        let lastData = null;
        
        return (data) => {
            lastData = data;
            
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = setTimeout(() => {
                this.emit(eventName, lastData);
                timeoutId = null;
                lastData = null;
            }, delay);
        };
    }
    
    /**
     * Throttle event emission
     * @param {string} eventName - Name of the event
     * @param {number} limit - Minimum time between emissions in ms
     * @returns {Function} Throttled emit function
     */
    throttleEmit(eventName, limit = 1000) {
        let lastEmitTime = 0;
        let pendingData = null;
        let timeoutId = null;
        
        return (data) => {
            const now = Date.now();
            const timeSinceLastEmit = now - lastEmitTime;
            
            if (timeSinceLastEmit >= limit) {
                this.emit(eventName, data);
                lastEmitTime = now;
            } else {
                pendingData = data;
                
                if (!timeoutId) {
                    timeoutId = setTimeout(() => {
                        if (pendingData) {
                            this.emit(eventName, pendingData);
                            lastEmitTime = Date.now();
                            pendingData = null;
                        }
                        timeoutId = null;
                    }, limit - timeSinceLastEmit);
                }
            }
        };
    }
    
    /**
     * Get statistics about event system
     * @returns {Object} Statistics object
     */
    getStats() {
        const totalSubscribers = Array.from(this.events.values())
            .reduce((sum, set) => sum + set.size, 0);
        
        return {
            totalEvents: this.events.size,
            totalSubscribers,
            historySize: this.eventHistory.length,
            eventNames: this.getEventNames()
        };
    }
    
    /**
     * Serialize event manager state for saving
     * @returns {Object} Serializable state
     */
    toJSON() {
        return {
            history: this.eventHistory,
            stats: this.getStats()
        };
    }
}

// Pre-defined game event constants
const GameEvents = {
    // Resource events
    RESOURCE_GAIN: 'resource:gain',
    RESOURCE_SPEND: 'resource:spend',
    RESOURCE_THRESHOLD: 'resource:threshold',
    
    // Evolution events
    EVOLUTION_START: 'evolution:start',
    EVOLUTION_COMPLETE: 'evolution:complete',
    EVOLUTION_FAIL: 'evolution:fail',
    STAGE_UNLOCK: 'stage:unlock',
    
    // Upgrade events
    UPGRADE_PURCHASE: 'upgrade:purchase',
    UPGRADE_MAX_LEVEL: 'upgrade:maxLevel',
    UPGRADE_AVAILABLE: 'upgrade:available',
    
    // Achievement events
    ACHIEVEMENT_UNLOCK: 'achievement:unlock',
    ACHIEVEMENT_PROGRESS: 'achievement:progress',
    
    // Quest events
    QUEST_ACCEPT: 'quest:accept',
    QUEST_COMPLETE: 'quest:complete',
    QUEST_FAIL: 'quest:fail',
    QUEST_CLAIM: 'quest:claim',
    
    // Mutation events
    MUTATION_ACTIVATE: 'mutation:activate',
    MUTATION_EXPIRE: 'mutation:expire',
    MUTATION_TRIGGER: 'mutation:trigger',
    
    // Ecosystem events
    SPECIES_DISCOVER: 'species:discover',
    SPECIES_EXTINCT: 'species:extinct',
    ECOSYSTEM_BALANCE: 'ecosystem:balance',
    
    // Click events
    CLICK: 'click',
    MULTI_CLICK: 'click:multi',
    GOLDEN_CLICK: 'click:golden',
    
    // Save/Load events
    GAME_SAVE: 'game:save',
    GAME_LOAD: 'game:load',
    GAME_RESET: 'game:reset',
    
    // UI events
    NOTIFICATION: 'ui:notification',
    TAB_CHANGE: 'ui:tabChange',
    THEME_CHANGE: 'ui:themeChange',
    
    // Time events
    TIME_TICK: 'time:tick',
    DAY_PASS: 'time:dayPass',
    ERA_CHANGE: 'time:eraChange'
};

export { EventManager, GameEvents };
