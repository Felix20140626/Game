/**
 * Save System - Handles game persistence
 * Manages saving, loading, and auto-save functionality
 */

import { CONSTANTS } from '../data/constants.js';
import { GameEvents } from './eventManager.js';

class SaveSystem {
    constructor(gameState, eventManager) {
        this.gameState = gameState;
        this.eventManager = eventManager;
        
        this.saveKey = 'evolutionClickerSave';
        this.backupKey = 'evolutionClickerBackup';
        this.autoSaveTimer = 0;
        this.lastSaveTime = 0;
        this.saveCount = 0;
        this.pendingSave = false;
        
        // Compression settings
        this.useCompression = true;
        this.compressionThreshold = 10000;
        
        console.log('💾 SaveSystem initialized');
    }
    
    /**
     * Save game to localStorage
     */
    async save(force = false) {
        if (this.pendingSave && !force) {
            return false;
        }
        
        try {
            this.pendingSave = true;
            
            // Validate game state before saving
            const validation = this.gameState.validate();
            if (!validation.valid) {
                console.warn('⚠️ Game state validation failed:', validation.errors);
                // Continue with save anyway, but log warnings
            }
            
            // Prepare save data
            const saveData = {
                version: CONSTANTS.GAME_VERSION,
                timestamp: Date.now(),
                saveCount: this.saveCount + 1,
                playTime: this.gameState.stats.totalTimePlayed,
                state: this.gameState.toJSON()
            };
            
            // Serialize
            let serialized = JSON.stringify(saveData);
            
            // Compress if large enough and compression enabled
            if (this.useCompression && serialized.length > this.compressionThreshold) {
                serialized = await this.compress(serialized);
                saveData.compressed = true;
            }
            
            // Create backup of existing save
            const existingSave = localStorage.getItem(this.saveKey);
            if (existingSave) {
                localStorage.setItem(this.backupKey, existingSave);
            }
            
            // Save to localStorage
            localStorage.setItem(this.saveKey, serialized);
            
            // Update metadata
            this.saveCount++;
            this.lastSaveTime = Date.now();
            this.gameState.stats.lastSaveTime = this.lastSaveTime;
            
            // Emit save event
            this.eventManager.emit(GameEvents.GAME_SAVE, {
                saveCount: this.saveCount,
                timestamp: this.lastSaveTime,
                size: serialized.length
            });
            
            console.log(`✅ Game saved (#${this.saveCount}) - ${serialized.length} bytes`);
            
            this.pendingSave = false;
            return true;
        } catch (error) {
            console.error('❌ Failed to save game:', error);
            this.pendingSave = false;
            
            // Try to restore from backup
            await this.restoreFromBackup();
            
            return false;
        }
    }
    
    /**
     * Load game from localStorage
     */
    async load() {
        try {
            let serialized = localStorage.getItem(this.saveKey);
            
            if (!serialized) {
                console.log('📭 No save found, starting new game');
                return false;
            }
            
            // Parse save data
            let saveData;
            try {
                saveData = JSON.parse(serialized);
            } catch (parseError) {
                console.error('❌ Failed to parse save data:', parseError);
                
                // Try backup
                console.log('🔄 Attempting to load from backup...');
                return await this.loadFromBackup();
            }
            
            // Decompress if needed
            if (saveData.compressed) {
                serialized = await this.decompress(serialized);
                saveData = JSON.parse(serialized);
            }
            
            // Version check
            const saveVersion = saveData.version || '0.0.0';
            if (!this.isVersionCompatible(saveVersion)) {
                console.warn(`⚠️ Save version ${saveVersion} may not be compatible with game version ${CONSTANTS.GAME_VERSION}`);
                
                // Apply migrations if needed
                saveData = await this.migrateSave(saveData, saveVersion);
            }
            
            // Load game state
            this.gameState.fromJSON(saveData.state);
            
            // Update metadata
            this.saveCount = saveData.saveCount || 0;
            this.lastSaveTime = saveData.timestamp || Date.now();
            
            // Emit load event
            this.eventManager.emit(GameEvents.GAME_LOAD, {
                version: saveVersion,
                saveCount: this.saveCount,
                timestamp: this.lastSaveTime
            });
            
            console.log(`✅ Game loaded (#${this.saveCount}) from ${new Date(this.lastSaveTime).toLocaleString()}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to load game:', error);
            
            // Try backup
            return await this.loadFromBackup();
        }
    }
    
    /**
     * Load from backup
     */
    async loadFromBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (!backup) {
                console.log('📭 No backup available');
                return false;
            }
            
            const saveData = JSON.parse(backup);
            this.gameState.fromJSON(saveData.state);
            
            console.log('✅ Loaded from backup');
            return true;
        } catch (error) {
            console.error('❌ Failed to load from backup:', error);
            return false;
        }
    }
    
    /**
     * Restore from backup
     */
    async restoreFromBackup() {
        const backup = localStorage.getItem(this.backupKey);
        if (backup) {
            localStorage.setItem(this.saveKey, backup);
            console.log('🔄 Restored from backup');
            return true;
        }
        return false;
    }
    
    /**
     * Auto-save based on delta time
     */
    autoSave(deltaTime) {
        if (!this.gameState.settings.autoSaveEnabled) {
            return;
        }
        
        this.autoSaveTimer += deltaTime;
        
        if (this.autoSaveTimer >= this.gameState.settings.autoSaveInterval) {
            this.save();
            this.autoSaveTimer = 0;
        }
    }
    
    /**
     * Clear all saves
     */
    clear() {
        localStorage.removeItem(this.saveKey);
        localStorage.removeItem(this.backupKey);
        
        this.saveCount = 0;
        this.lastSaveTime = 0;
        this.autoSaveTimer = 0;
        
        console.log('🗑️ All saves cleared');
    }
    
    /**
     * Export save to file
     */
    async exportToFile() {
        try {
            const serialized = localStorage.getItem(this.saveKey);
            if (!serialized) {
                throw new Error('No save to export');
            }
            
            const blob = new Blob([serialized], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `evolution-clicker-save-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('💾 Save exported to file');
            return true;
        } catch (error) {
            console.error('❌ Failed to export save:', error);
            return false;
        }
    }
    
    /**
     * Import save from file
     */
    async importFromFile(file) {
        try {
            const text = await file.text();
            const saveData = JSON.parse(text);
            
            // Validate save data
            if (!saveData.state) {
                throw new Error('Invalid save file format');
            }
            
            // Create backup before importing
            await this.save(true);
            
            // Import
            localStorage.setItem(this.saveKey, text);
            await this.load();
            
            console.log('💾 Save imported from file');
            return true;
        } catch (error) {
            console.error('❌ Failed to import save:', error);
            alert('Failed to import save file: ' + error.message);
            return false;
        }
    }
    
    /**
     * Check if save exists
     */
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    /**
     * Get save info
     */
    getSaveInfo() {
        const serialized = localStorage.getItem(this.saveKey);
        if (!serialized) {
            return null;
        }
        
        try {
            const saveData = JSON.parse(serialized);
            return {
                version: saveData.version,
                timestamp: saveData.timestamp,
                saveCount: saveData.saveCount,
                playTime: saveData.playTime,
                size: serialized.length,
                compressed: saveData.compressed || false,
                stageName: saveData.state?.currentStageIndex 
                    ? CONSTANTS.EVOLUTION_STAGES[saveData.state.currentStageIndex]?.name 
                    : 'Unknown'
            };
        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }
    
    /**
     * Check version compatibility
     */
    isVersionCompatible(saveVersion) {
        const [saveMajor] = saveVersion.split('.').map(Number);
        const [gameMajor] = CONSTANTS.GAME_VERSION.split('.').map(Number);
        
        // Major version mismatch is incompatible
        return saveMajor === gameMajor;
    }
    
    /**
     * Migrate save from old version
     */
    async migrateSave(saveData, fromVersion) {
        console.log(`🔄 Migrating save from ${fromVersion} to ${CONSTANTS.GAME_VERSION}`);
        
        const migrations = [
            { version: '1.0.0', migrate: this.migrateToV1 },
            { version: '1.1.0', migrate: this.migrateToV1_1 },
            { version: '2.0.0', migrate: this.migrateToV2 }
        ];
        
        let currentVersion = fromVersion;
        
        for (const migration of migrations) {
            if (this.compareVersions(currentVersion, migration.version) < 0) {
                saveData = await migration.migrate.call(this, saveData);
                saveData.version = migration.version;
                currentVersion = migration.version;
            }
        }
        
        saveData.version = CONSTANTS.GAME_VERSION;
        return saveData;
    }
    
    /**
     * Compare version strings
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            
            if (p1 !== p2) {
                return p1 - p2;
            }
        }
        
        return 0;
    }
    
    /**
     * Migration functions (placeholders)
     */
    async migrateToV1(saveData) {
        console.log('Migrating to v1.0.0...');
        // Add any v1 migration logic here
        return saveData;
    }
    
    async migrateToV1_1(saveData) {
        console.log('Migrating to v1.1.0...');
        // Add any v1.1 migration logic here
        return saveData;
    }
    
    async migrateToV2(saveData) {
        console.log('Migrating to v2.0.0...');
        // Add any v2 migration logic here
        return saveData;
    }
    
    /**
     * Compress string (simple implementation)
     */
    async compress(str) {
        // In a real implementation, you'd use a library like LZString
        // This is a placeholder that just base64 encodes
        return btoa(unescape(encodeURIComponent(str)));
    }
    
    /**
     * Decompress string
     */
    async decompress(str) {
        // Placeholder decompression
        return decodeURIComponent(escape(atob(str)));
    }
    
    /**
     * Get storage usage
     */
    getStorageUsage() {
        let total = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('evolutionClicker')) {
                total += localStorage[key].length + key.length;
            }
        }
        
        // Estimate bytes (roughly 2 bytes per character for UTF-16)
        return total * 2;
    }
    
    /**
     * Get storage quota info
     */
    async getStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return null;
    }
    
    /**
     * Clean up old saves
     */
    cleanup() {
        const keys = Object.keys(localStorage);
        const oldSaves = keys.filter(k => k.startsWith('evolutionClicker') && k !== this.saveKey && k !== this.backupKey);
        
        oldSaves.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed old save: ${key}`);
        });
        
        return oldSaves.length;
    }
    
    /**
     * Create manual backup
     */
    async createBackup(name = null) {
        const serialized = localStorage.getItem(this.saveKey);
        if (!serialized) {
            return false;
        }
        
        const backupKey = name 
            ? `${this.backupKey}_${name}_${Date.now()}`
            : `${this.backupKey}_${Date.now()}`;
        
        localStorage.setItem(backupKey, serialized);
        console.log(`💾 Backup created: ${backupKey}`);
        
        return backupKey;
    }
    
    /**
     * List all backups
     */
    listBackups() {
        const keys = Object.keys(localStorage);
        return keys
            .filter(k => k.startsWith(this.backupKey))
            .map(k => ({
                key: k,
                size: localStorage[k].length,
                timestamp: parseInt(k.split('_').pop()) || 0
            }))
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * Delete specific backup
     */
    deleteBackup(key) {
        if (key.startsWith(this.backupKey)) {
            localStorage.removeItem(key);
            console.log(`🗑️ Backup deleted: ${key}`);
            return true;
        }
        return false;
    }
    
    /**
     * Get save statistics
     */
    getStats() {
        return {
            saveCount: this.saveCount,
            lastSaveTime: this.lastSaveTime,
            autoSaveTimer: this.autoSaveTimer,
            storageUsage: this.getStorageUsage(),
            backupsCount: this.listBackups().length
        };
    }
}

export { SaveSystem };
