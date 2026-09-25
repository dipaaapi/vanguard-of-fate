class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmInterval = null;
    this.titleBgmInterval = null;
    this.bgmStep = 0;
    this.titleStep = 0;
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
    } catch (e) {}
  }

  playSelectMove() {
    this.playTone(520, "square", 0.05, 0.15);
  }

  playSelectConfirm() {
    this.playTone(440, "sine", 0.08, 0.22);
    setTimeout(() => this.playTone(587.33, "sine", 0.1, 0.22), 50);
    setTimeout(() => this.playTone(880.00, "sine", 0.22, 0.25), 110);
  }

  playCriticalHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
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
    } catch (e) {}
  }

  playHitEnemy(isCritical = false) {
    if (isCritical) {
      this.playCriticalHit();
      return;
    }
    this.playTone(220, "square", 0.08, 0.2);
  }

  playHitPlayer() {
    this.init();
    this.playTone(140, "sawtooth", 0.18, 0.28);
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
    this.playTone(240, "sawtooth", 0.1, 0.15);
  }

  playForceSphere() {
    this.playTone(320, "sine", 0.15, 0.2);
  }

  playMeteorExplosion() {
    this.playTone(110, "sawtooth", 0.45, 0.35);
  }

  playThunder() {
    this.playTone(180 + Math.random() * 180, "sawtooth", 0.12, 0.22);
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

  startTitleBGM() {
    if (this.titleBgmInterval || this.isMuted) return;
    this.init();
    this.stopGameplayBGM();

    const titleNotes = [
      146.83, 220.00, 261.63, 293.66,
      130.81, 196.00, 261.63, 329.63,
      116.54, 174.61, 233.08, 293.66,
      110.00, 164.81, 220.00, 261.63
    ];

    this.titleStep = 0;
    this.titleBgmInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const note = titleNotes[this.titleStep % titleNotes.length];
      if (note > 0) {
        this.playTone(note, "sine", 0.45, 0.07, 0.001);
      }
      if (this.titleStep % 4 === 0) {
        this.playTone(note * 2, "triangle", 0.35, 0.03, 0.001);
      }
      this.titleStep++;
    }, 320);
  }

  stopTitleBGM() {
    if (this.titleBgmInterval) {
      clearInterval(this.titleBgmInterval);
      this.titleBgmInterval = null;
    }
  }

  startGameplayBGM() {
    if (this.bgmInterval || this.isMuted) return;
    this.init();
    this.stopTitleBGM();

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
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const bFreq = bassNotes[this.bgmStep % bassNotes.length];
      const lFreq = leadNotes[this.bgmStep % leadNotes.length];
      if (bFreq > 0) this.playTone(bFreq, "triangle", 0.16, 0.08, 0.001);
      if (lFreq > 0 && Math.random() > 0.25) this.playTone(lFreq, "sine", 0.2, 0.035, 0.001);
      this.bgmStep++;
    }, 220);
  }

  stopGameplayBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  stopAllBGM() {
    this.stopTitleBGM();
    this.stopGameplayBGM();
  }
}

export const Sound = new SoundEngine();