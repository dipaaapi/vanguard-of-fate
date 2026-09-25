class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.currentTrack = null; // 'TITLE', 'SELECT', 'STORY', 'GAMEPLAY'
    this.bgmTimer = null;
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
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  // ========================================================
  // INTERACTIVE UI & COMBAT SOUND EFFECTS
  // ========================================================

  // ========================================================
  // EXPANDED ATMOSPHERE & COMBAT SOUND EFFECTS
  // ========================================================
  playGuardTalk() {
    this.playTone(523.25, "triangle", 0.09, 0.2);
    setTimeout(() => this.playTone(659.25, "sine", 0.12, 0.22), 60);
    setTimeout(() => this.playTone(783.99, "sine", 0.22, 0.25), 130);
  }

  playDashWhoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {}
  }

  playEnemyHurt() {
    this.playTone(160, "sawtooth", 0.08, 0.14);
  }

  playEnemyDeath() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
      setTimeout(() => this.playTone(110, "sine", 0.18, 0.16), 80);
    } catch (e) {}
  }

  playEquipSound() {
    this.playTone(740, "sine", 0.05, 0.18);
    setTimeout(() => this.playTone(980, "triangle", 0.08, 0.22), 40);
  }

  playUnequipSound() {
    this.playTone(400, "triangle", 0.06, 0.15);
  }

  playLevelUpFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "triangle", 0.28, 0.25), idx * 75);
    });
  }

  playOceanWaveAmbient() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 1.2);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 2.4);
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.4);
    } catch (e) {}
  }

  playSelectHover() {
    this.playTone(659.25, "sine", 0.04, 0.08); // Soft high chime
  }

  playSelectMove() {
    this.playTone(493.88, "triangle", 0.06, 0.14);
  }

  playSelectConfirm() {
    this.playTone(440, "sine", 0.08, 0.22);
    setTimeout(() => this.playTone(587.33, "sine", 0.1, 0.22), 50);
    setTimeout(() => this.playTone(880.00, "sine", 0.25, 0.25), 110);
  }

  playStoryChime() {
    this.playTone(392.00, "sine", 0.35, 0.18);
    setTimeout(() => this.playTone(523.25, "sine", 0.4, 0.2), 100);
    setTimeout(() => this.playTone(659.25, "sine", 0.45, 0.22), 200);
    setTimeout(() => this.playTone(1046.50, "triangle", 0.6, 0.25), 320);
  }

  playCriticalHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(340, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
      setTimeout(() => this.playTone(880, "triangle", 0.14, 0.22), 30);
    } catch (e) {}
  }

  playHitEnemy(isCritical = false) {
    if (isCritical) {
      this.playCriticalHit();
      return;
    }
    this.playTone(220, "square", 0.08, 0.18);
  }

  playHitPlayer() {
    this.init();
    this.playTone(130, "sawtooth", 0.2, 0.28);
  }

  playLootPickup() {
    this.init();
    this.playTone(784.00, "triangle", 0.08, 0.18);
    setTimeout(() => this.playTone(1046.50, "triangle", 0.18, 0.22), 50);
  }

  playSlash() {
    this.playTone(380, "sawtooth", 0.09, 0.18);
  }

  playDash() {
    this.playTone(240, "sine", 0.12, 0.18);
    setTimeout(() => this.playTone(360, "sine", 0.1, 0.14), 40);
  }

  playForceSphere() {
    this.playTone(320, "sine", 0.15, 0.2);
  }

  playMeteorExplosion() {
    this.playTone(95, "sawtooth", 0.55, 0.38);
    setTimeout(() => this.playTone(65, "triangle", 0.4, 0.3), 60);
  }

  playThunder() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    this.playTone(90 + Math.random() * 60, "sawtooth", 0.45, 0.3);
    setTimeout(() => this.playTone(55 + Math.random() * 40, "triangle", 0.6, 0.25), 80);
  }

  playArrowShoot() {
    this.playTone(680, "triangle", 0.08, 0.16);
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
    this.playTone(260, "sine", 0.2, 0.22);
  }

  // ========================================================
  // COMPREHENSIVE MULTI-TRACK PROCEDURAL BGM SYSTEM
  // ========================================================
  stopAllBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentTrack = null;
  }

  playForgeSuccess() {
    this.playTone(523.25, "sine", 0.15, 0.2);
    setTimeout(() => this.playTone(659.25, "sine", 0.18, 0.22), 80);
    setTimeout(() => this.playTone(783.99, "sine", 0.22, 0.25), 160);
    setTimeout(() => this.playTone(1046.50, "triangle", 0.45, 0.3), 240);
  }

  playForgeFail() {
    this.playTone(220.00, "sawtooth", 0.2, 0.25);
    setTimeout(() => this.playTone(185.00, "sawtooth", 0.35, 0.22), 100);
  }

  playQuestComplete() {
    this.playTone(440.00, "triangle", 0.12, 0.2);
    setTimeout(() => this.playTone(554.37, "triangle", 0.15, 0.22), 80);
    setTimeout(() => this.playTone(659.25, "triangle", 0.18, 0.24), 160);
    setTimeout(() => this.playTone(880.00, "sine", 0.4, 0.28), 240);
  }

  playItemSell() {
    this.playTone(880.00, "sine", 0.05, 0.18);
    setTimeout(() => this.playTone(1174.66, "triangle", 0.12, 0.22), 40);
  }

  startTitleBGM() {
    if (this.currentTrack === "TITLE" || this.isMuted) return;
    this.stopAllBGM();
    this.init();
    this.currentTrack = "TITLE";

    // Grand Cathedral of Destiny Theme (Multi-voice Polyphonic Polyphony)
    const chords = [
      { bass: 73.42, pad: [146.83, 220.00, 293.66], melody: [440.00, 523.25, 587.33, 659.25] }, // D-minor grand
      { bass: 65.41, pad: [130.81, 196.00, 261.63], melody: [392.00, 440.00, 523.25, 587.33] }, // C-major majesty
      { bass: 58.27, pad: [116.54, 174.61, 233.08], melody: [349.23, 392.00, 440.00, 523.25] }, // Bb-major depth
      { bass: 55.00, pad: [110.00, 164.81, 220.00], melody: [329.63, 369.99, 440.00, 493.88] }, // A-minor cathedral
      { bass: 73.42, pad: [146.83, 220.00, 349.23], melody: [587.33, 523.25, 440.00, 392.00] }, // D-minor cadence
      { bass: 87.31, pad: [174.61, 261.63, 349.23], melody: [523.25, 587.33, 659.25, 783.99] }, // F-major triumph
      { bass: 98.00, pad: [196.00, 293.66, 392.00], melody: [587.33, 659.25, 783.99, 880.00] }, // G-minor ethereal
      { bass: 55.00, pad: [110.00, 164.81, 220.00], melody: [440.00, 493.88, 554.37, 659.25] }  // A-major sanctuary resolve
    ];

    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.ctx || this.isMuted || this.currentTrack !== "TITLE") return;
      const barIdx = Math.floor((this.bgmStep / 4) % chords.length);
      const subIdx = this.bgmStep % 4;
      const chord = chords[barIdx];

      // Low resonant pipe organ bass pedal
      if (subIdx === 0) {
        this.playTone(chord.bass, "triangle", 1.4, 0.12, 0.001);
        chord.pad.forEach((pFreq, i) => {
          setTimeout(() => {
            if (this.currentTrack === "TITLE") this.playTone(pFreq, "sine", 1.1, 0.045, 0.001);
          }, i * 40);
        });
      }

      // Soaring high melodic bell arpeggio
      const melNote = chord.melody[subIdx];
      if (melNote) {
        this.playTone(melNote, "sine", 0.45, 0.065, 0.001);
      }

      this.bgmStep++;
    }, 280);
  }

  stopTitleBGM() {
    if (this.currentTrack === "TITLE") this.stopAllBGM();
  }

  startCharacterCreationBGM() {
    if (this.currentTrack === "SELECT" || this.isMuted) return;
    this.stopAllBGM();
    this.init();
    this.currentTrack = "SELECT";

    // Cosmic Portal of Destiny Theme (Atmospheric ethereal arpeggios)
    const portalChords = [
      { root: 164.81, arps: [329.63, 392.00, 493.88, 659.25] }, // Em
      { root: 130.81, arps: [261.63, 329.63, 392.00, 523.25] }, // C
      { root: 146.83, arps: [293.66, 369.99, 440.00, 587.33] }, // D
      { root: 123.47, arps: [246.94, 311.13, 369.99, 493.88] }  // Bm
    ];

    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.ctx || this.isMuted || this.currentTrack !== "SELECT") return;
      const chordIdx = Math.floor((this.bgmStep / 4) % portalChords.length);
      const arpIdx = this.bgmStep % 4;
      const chord = portalChords[chordIdx];

      if (arpIdx === 0) {
        this.playTone(chord.root, "sine", 0.8, 0.09, 0.001);
      }
      this.playTone(chord.arps[arpIdx], "sine", 0.35, 0.04, 0.001);
      this.bgmStep++;
    }, 280);
  }

  startStoryBGM() {
    if (this.currentTrack === "STORY" || this.isMuted) return;
    this.stopAllBGM();
    this.init();
    this.currentTrack = "STORY";

    // Reflective Isekai Rebirth Theme (Pensive low piano & glass bells)
    const notes = [220.00, 261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63];
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.ctx || this.isMuted || this.currentTrack !== "STORY") return;
      const n = notes[this.bgmStep % notes.length];
      this.playTone(n / 2, "sine", 0.6, 0.07, 0.001);
      this.playTone(n, "triangle", 0.45, 0.04, 0.001);
      this.bgmStep++;
    }, 380);
  }

  startGameplayBGM() {
    if (this.currentTrack === "GAMEPLAY" || this.isMuted) return;
    this.stopAllBGM();
    this.init();
    this.currentTrack = "GAMEPLAY";

    const bassNotes = [
      110.00, 110.00, 130.81, 146.83,
      110.00, 110.00, 164.81, 146.83,
      98.00,  98.00,  123.47, 130.81,
      82.41,  82.41,  110.00, 123.47
    ];

    const leadNotes = [
      440.00, 0, 523.25, 587.33,
      659.25, 0, 587.33, 523.25,
      392.00, 0, 440.00, 493.88,
      329.63, 0, 392.00, 440.00
    ];

    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.ctx || this.isMuted || this.currentTrack !== "GAMEPLAY") return;
      const bFreq = bassNotes[this.bgmStep % bassNotes.length];
      const lFreq = leadNotes[this.bgmStep % leadNotes.length];
      if (bFreq > 0) this.playTone(bFreq, "triangle", 0.16, 0.07, 0.001);
      if (lFreq > 0 && Math.random() > 0.22) this.playTone(lFreq, "sine", 0.2, 0.035, 0.001);
      this.bgmStep++;
    }, 200);
  }

  stopGameplayBGM() {
    if (this.currentTrack === "GAMEPLAY") this.stopAllBGM();
  }
}

export const Sound = new SoundEngine();