/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio API sound synthesizer with Cairo & Egyptian musical nuances
class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private initialized: boolean = false;

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch {
      // Audio not supported in this environment
    }
  }

  public ensureAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) {
      this.ensureAudio();
    }
    return this.muted;
  }

  // Wing flap with subtle Darbuka / Doum resonance
  public playFlap() {
    if (this.muted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Low percussive flap "whuff"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    // 2. Feather rustle burst (filtered white noise)
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.09);
    } catch {
      // Fallback if buffer creation fails
    }
  }

  // Oud-like golden piastre chime
  public playCoin() {
    if (this.muted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 880, 1174.66]; // E5, A5, D6 Egyptian melodic arpeggio

    notes.forEach((freq, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.22, now + index * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.04 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + index * 0.04);
      osc.stop(now + index * 0.04 + 0.3);
    });
  }

  // Spicy Koshary power-up sound (fiery sizzle + celebratory flourish)
  public playKoshary() {
    if (this.muted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Ascending arpeggio with rich harmonic overtone
    const frequencies = [392.0, 493.88, 587.33, 783.99, 987.77, 1174.66]; // G major flourish
    frequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now + idx * 0.05);

      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  }

  // Point scoring chime when passing through pillars
  public playScore() {
    if (this.muted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Impact crash with a soft pigeon "coo-whump"
  public playHit() {
    if (this.muted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);

    // Muffled coo
    const cooOsc = this.ctx.createOscillator();
    const cooGain = this.ctx.createGain();
    cooOsc.type = 'triangle';
    cooOsc.frequency.setValueAtTime(400, now + 0.05);
    cooOsc.frequency.linearRampToValueAtTime(320, now + 0.15);
    cooOsc.frequency.linearRampToValueAtTime(260, now + 0.3);

    cooGain.gain.setValueAtTime(0.001, now);
    cooGain.gain.setValueAtTime(0.25, now + 0.05);
    cooGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    cooOsc.connect(cooGain);
    cooGain.connect(this.ctx.destination);
    cooOsc.start(now + 0.05);
    cooOsc.stop(now + 0.33);
  }

  // Game over melodic flourish
  public playGameOver() {
    if (this.muted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Egyptian Hijaz/Nahawand cadence
    const notes = [440, 415.3, 370, 329.63, 293.66]; // Descending oriental motif
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0.2, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.36);
    });
  }
}

export const audioEngine = new AudioEngine();
