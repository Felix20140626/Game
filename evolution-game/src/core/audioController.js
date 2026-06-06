/**
 * Audio Controller - Manages game audio
 * Handles sound effects, music, and audio settings
 */

import { CONSTANTS } from '../data/constants.js';

class AudioController {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.7;
        
        this.currentMusic = null;
        this.musicPlaylist = [];
        this.musicIndex = 0;
        
        this.soundCache = new Map();
        this.initialized = false;
        
        // Audio mood tracking
        this.currentMood = 'neutral';
        this.moodTransitions = [];
        
        console.log('🔊 AudioController initialized');
    }
    
    /**
     * Initialize audio system
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
            
            this.initialized = true;
            console.log('✅ Audio system initialized');
        } catch (error) {
            console.warn('⚠️ Audio initialization failed:', error);
        }
    }
    
    /**
     * Ensure audio context is running (browser autoplay policy)
     */
    ensureRunning() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * Play a sound effect
     */
    playSFX(soundName, options = {}) {
        if (!this.sfxEnabled || !this.initialized) return;
        
        this.ensureRunning();
        
        const config = CONSTANTS.SOUND_EFFECTS[soundName];
        if (!config) {
            console.warn(`Sound effect not found: ${soundName}`);
            return;
        }
        
        const { type, frequency, duration, envelope, variation } = config;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            // Apply variation
            const freqVar = variation || 0;
            const actualFreq = frequency * (1 + (Math.random() - 0.5) * freqVar);
            
            oscillator.type = type || 'sine';
            oscillator.frequency.setValueAtTime(actualFreq, this.audioContext.currentTime);
            
            // Apply envelope
            const now = this.audioContext.currentTime;
            const env = envelope || { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 };
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(1, now + env.attack);
            gainNode.gain.linearRampToValueAtTime(env.sustain, now + env.attack + env.decay);
            gainNode.gain.linearRampToValueAtTime(0, now + env.attack + env.decay + env.release);
            
            oscillator.start(now);
            oscillator.stop(now + env.attack + env.decay + env.release);
            
            // Cleanup
            setTimeout(() => {
                oscillator.disconnect();
                gainNode.disconnect();
            }, (env.attack + env.decay + env.release) * 1000 + 100);
            
        } catch (error) {
            console.warn('Failed to play SFX:', error);
        }
    }
    
    /**
     * Play click sound
     */
    playClick(variation = 0) {
        const sounds = ['click1', 'click2', 'click3'];
        const sound = sounds[Math.floor(Math.random() * sounds.length)];
        this.playSFX(sound);
    }
    
    /**
     * Play evolution sound
     */
    playEvolution() {
        this.playSFX('evolution');
        this.playSFX('unlock');
    }
    
    /**
     * Play achievement sound
     */
    playAchievement() {
        this.playSFX('achievement');
    }
    
    /**
     * Play purchase sound
     */
    playPurchase() {
        this.playSFX('purchase');
    }
    
    /**
     * Generate procedural ambient music
     */
    generateAmbient(mood = 'neutral') {
        if (!this.musicEnabled || !this.initialized) return;
        
        this.ensureRunning();
        
        const moodConfig = CONSTANTS.MUSIC_MOODS[mood] || CONSTANTS.MUSIC_MOODS.neutral;
        const { scale, tempo, baseFreq, notes } = moodConfig;
        
        // Simple ambient drone
        const oscillators = [];
        const now = this.audioContext.currentTime;
        
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            osc.type = 'sine';
            osc.frequency.value = baseFreq * Math.pow(2, i * 0.5);
            
            filter.type = 'lowpass';
            filter.frequency.value = 400 + i * 200;
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 2);
            gain.gain.linearRampToValueAtTime(0.1, now + 4);
            
            osc.start(now);
            oscillators.push({ osc, gain });
        }
        
        // Schedule LFO for modulation
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(this.musicGain.gain);
        
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 0.05;
        lfo.start(now);
        
        // Stop after duration
        const duration = 60;
        setTimeout(() => {
            oscillators.forEach(({ osc, gain }) => {
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
                osc.stop(this.audioContext.currentTime + 2);
            });
            lfo.stop(this.audioContext.currentTime + 2);
        }, duration * 1000);
    }
    
    /**
     * Toggle music
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicGain) {
            this.musicGain.gain.linearRampToValueAtTime(
                this.musicEnabled ? this.musicVolume : 0,
                this.audioContext.currentTime + 0.5
            );
        }
        
        console.log(`🎵 Music ${this.musicEnabled ? 'enabled' : 'disabled'}`);
        return this.musicEnabled;
    }
    
    /**
     * Toggle SFX
     */
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        
        if (this.sfxGain) {
            this.sfxGain.gain.linearRampToValueAtTime(
                this.sfxEnabled ? this.sfxVolume : 0,
                this.audioContext.currentTime + 0.1
            );
        }
        
        console.log(`🔊 SFX ${this.sfxEnabled ? 'enabled' : 'disabled'}`);
        return this.sfxEnabled;
    }
    
    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));
        
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                volume,
                this.audioContext.currentTime + 0.1
            );
        }
    }
    
    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));
        this.musicVolume = volume;
        
        if (this.musicGain && this.musicEnabled) {
            this.musicGain.gain.linearRampToValueAtTime(
                volume,
                this.audioContext.currentTime + 0.5
            );
        }
    }
    
    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));
        this.sfxVolume = volume;
        
        if (this.sfxGain && this.sfxEnabled) {
            this.sfxGain.gain.linearRampToValueAtTime(
                volume,
                this.audioContext.currentTime + 0.1
            );
        }
    }
    
    /**
     * Set audio mood
     */
    setMood(mood) {
        if (this.currentMood === mood) return;
        
        this.currentMood = mood;
        console.log(`🎭 Audio mood changed to: ${mood}`);
        
        // Fade out current music
        if (this.currentMusic) {
            this.currentMusic.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + 2
            );
        }
        
        // Start new ambient
        setTimeout(() => {
            this.generateAmbient(mood);
        }, 2000);
    }
    
    /**
     * Mute all audio
     */
    mute() {
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + 0.1
            );
        }
    }
    
    /**
     * Unmute audio
     */
    unmute() {
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                1,
                this.audioContext.currentTime + 0.1
            );
        }
    }
    
    /**
     * Play synthesized voice (simple text-to-speech alternative)
     */
    speak(text, pitch = 1, rate = 1) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = pitch;
            utterance.rate = rate;
            speechSynthesis.speak(utterance);
        }
    }
    
    /**
     * Get audio statistics
     */
    getStats() {
        return {
            initialized: this.initialized,
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            currentMood: this.currentMood,
            contextState: this.audioContext?.state || 'not_initialized'
        };
    }
    
    /**
     * Serialize audio settings
     */
    toJSON() {
        return {
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            currentMood: this.currentMood
        };
    }
    
    /**
     * Load audio settings
     */
    fromJSON(data) {
        if (!data) return;
        
        this.musicEnabled = data.musicEnabled ?? true;
        this.sfxEnabled = data.sfxEnabled ?? true;
        this.musicVolume = data.musicVolume ?? 0.3;
        this.sfxVolume = data.sfxVolume ?? 0.7;
        this.currentMood = data.currentMood || 'neutral';
        
        // Apply settings
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
        }
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
        }
    }
    
    /**
     * Cleanup audio resources
     */
    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.soundCache.clear();
        this.initialized = false;
        
        console.log('🔇 Audio system disposed');
    }
}

export { AudioController };
