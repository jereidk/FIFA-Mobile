/**
 * FIFA Mobile - Audio System
 * Sistema de sonidos y música del juego
 */

class AudioManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.audioContext = null;
        this.sounds = {};
        this.init();
    }

    init() {
        // Crear contexto de audio
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    // Generar sonidos usando Web Audio API
    playSound(type) {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        switch(type) {
            case 'kick':
                this.playKick();
                break;
            case 'goal':
                this.playGoal();
                break;
            case 'whistle':
                this.playWhistle();
                break;
            case 'pass':
                this.playPass();
                break;
            case 'crowd':
                this.playCrowd();
                break;
            case 'foul':
                this.playFoul();
                break;
            case 'post':
                this.playPost();
                break;
            case 'button':
                this.playButton();
                break;
        }
    }

    playKick() {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    }

    playGoal() {
        const ctx = this.audioContext;
        
        // Explosion de celebración
        for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(200 + i * 100, ctx.currentTime);
            osc.frequency.setValueAtTime(400 + i * 100, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
            gain.gain.linearRampToValueAtTime(this.volume * 0.3, ctx.currentTime + i * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.3);
            
            osc.start(ctx.currentTime + i * 0.05);
            osc.stop(ctx.currentTime + i * 0.05 + 0.3);
        }
        
        // Añadir rugido de multitud
        this.playCrowd();
    }

    playWhistle() {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
    }

    playPass() {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    }

    playCrowd() {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generar ruido rosa para模拟 multitud
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        source.start(ctx.currentTime);
        source.stop(ctx.currentTime + 0.5);
    }

    playFoul() {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    }

    playPost() {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }

    playButton() {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        
        gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    }

    playCorner() {
        this.playWhistle();
        setTimeout(() => this.playWhistle(), 500);
    }

    playPenalty() {
        const ctx = this.audioContext;
        
        // Silbido largo para penalti
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        
        gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime + 1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
    }

    playHalfTime() {
        this.playWhistle();
        setTimeout(() => this.playWhistle(), 300);
        setTimeout(() => this.playWhistle(), 600);
    }

    playFinalWhistle() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.playWhistle(), i * 200);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

// Crear instancia global
window.audioManager = new AudioManager();