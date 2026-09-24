class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmInterval = null;
        this.bgmStep = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, startVol = 0.15, endVol = 0.001) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(endVol, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { }
    }

    // 1. SELECT CHARACTER (Menu Bip / Cursor Move)
    playSelectMove() {
        this.playTone(440, "square", 0.05, 0.12);
    }

    // Confirm Character Selection (Game Start Gong/Fanfare)
    playSelectConfirm() {
        this.playTone(523.25, "sine", 0.1, 0.2); // C5
        setTimeout(() => this.playTone(659.25, "sine", 0.12, 0.2), 60); // E5
        setTimeout(() => this.playTone(783.99, "sine", 0.25, 0.25), 120); // G5
    }

    // 2. HIT BY CHARACTER (Tinamaan ang Kalaban / Slime squish hit)
    playHitEnemy(isCritical = false) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        try {
            if (isCritical) {
                // Malakas na pagsabog + CRT crunch
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(320, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

                gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.25);

                setTimeout(() => this.playTone(880, "triangle", 0.12, 0.2), 30);
            } else {
                // Normal na sapak / hiwa sound
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "square";
                osc.frequency.setValueAtTime(220, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.08);
            }
        } catch (e) { }
    }

    // 3. HIT BY ENEMY (Nakatanggap ng damage ang Player mula sa kalaban)
    playHitPlayer() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        try {
            // Malalim at masakit na impact thud
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(160, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        } catch (e) { }
    }

    // 4. LOOT ITEM PICKUP (Chime ng Kristal o Dahon)
    playLootPickup() {
        this.playTone(784.00, "triangle", 0.08, 0.18); // G5
        setTimeout(() => this.playTone(1046.50, "triangle", 0.18, 0.22), 50); // C6
    }

    // ATTACK SKILLS
    playSlash() {
        this.playTone(380, "sawtooth", 0.09, 0.18);
    }

    playForceSphere() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(260, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        } catch (e) { }
    }

    playMeteorExplosion() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(120, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.45);
            gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.45);
        } catch (e) { }
    }

    playThunder() {
        this.playTone(160 + Math.random() * 180, "sawtooth", 0.12, 0.22);
    }

    playArrowShoot() {
        this.playTone(650, "triangle", 0.08, 0.15);
    }

    playFalconScreech() {
        this.playTone(1350, "sawtooth", 0.2, 0.12);
    }

    playHolyBurst() {
        this.playTone(523.25, "sine", 0.25, 0.18);
        setTimeout(() => this.playTone(659.25, "sine", 0.25, 0.18), 60);
        setTimeout(() => this.playTone(783.99, "sine", 0.35, 0.2), 120);
    }

    playEnemyDeath() {
        this.playTone(280, "sine", 0.2, 0.25);
    }

    // ==================== BGM ====================
    startBGM() {
        if (this.bgmInterval || this.isMuted) return;
        this.init();

        const bassNotes = [
            110.00, 110.00, 130.81, 146.83,
            110.00, 110.00, 164.81, 146.83,
            98.00, 98.00, 123.47, 130.81,
            82.41, 82.41, 110.00, 123.47
        ];

        const leadNotes = [
            440.00, 0, 523.25, 587.33,
            659.25, 0, 587.33, 523.25,
            392.00, 0, 440.00, 493.88,
            329.63, 0, 392.00, 440.00
        ];

        this.bgmStep = 0;
        this.bgmInterval = setInterval(() => {
            if (!this.ctx || this.isMuted) return;

            const bFreq = bassNotes[this.bgmStep % bassNotes.length];
            const lFreq = leadNotes[this.bgmStep % leadNotes.length];

            if (bFreq > 0) {
                this.playTone(bFreq, "triangle", 0.16, 0.08, 0.001);
            }
            if (lFreq > 0 && Math.random() > 0.25) {
                this.playTone(lFreq, "sine", 0.2, 0.035, 0.001);
            }

            this.bgmStep++;
        }, 220);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

export const Sound = new SoundEngine();