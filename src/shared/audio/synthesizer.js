// src/shared/audio/synthesizer.js
// Procedural additive sound synthesis matching SoundSynthesizer.swift.

const SoundSynthesizer = {
  sampleRate: 44100,

  voices: {
    bell: {
      fundamental: 1046,
      partials: [
        { ratio: 1.00, amplitude: 1.00, decay: 1.30 },
        { ratio: 2.00, amplitude: 0.55, decay: 0.90 },
        { ratio: 2.41, amplitude: 0.40, decay: 0.70 },
        { ratio: 3.00, amplitude: 0.30, decay: 0.50 },
        { ratio: 4.52, amplitude: 0.18, decay: 0.35 },
        { ratio: 5.19, amplitude: 0.10, decay: 0.25 }
      ],
      duration: 1.5,
      attack: 0.003,
      peak: 0.85
    },
    glass: {
      fundamental: 2600,
      partials: [
        { ratio: 1.00, amplitude: 1.00, decay: 0.28 },
        { ratio: 1.90, amplitude: 0.50, decay: 0.20 },
        { ratio: 2.75, amplitude: 0.30, decay: 0.14 }
      ],
      duration: 0.35,
      attack: 0.001,
      peak: 0.70
    },
    metal: {
      fundamental: 1800,
      partials: [
        { ratio: 1.00, amplitude: 1.00, decay: 0.45 },
        { ratio: 1.56, amplitude: 0.60, decay: 0.32 },
        { ratio: 2.31, amplitude: 0.35, decay: 0.22 },
        { ratio: 3.10, amplitude: 0.20, decay: 0.15 }
      ],
      duration: 0.55,
      attack: 0.001,
      peak: 0.75
    },
    wood: {
      fundamental: 190,
      partials: [
        { ratio: 1.00, amplitude: 1.00, decay: 0.03 },
        { ratio: 1.70, amplitude: 0.40, decay: 0.02 }
      ],
      duration: 0.06,
      attack: 0.001,
      noise: { duration: 0.07, decay: 0.012, smoothing: 0.25, gain: 0.7 },
      peak: 0.80
    },
    soft: {
      fundamental: 120,
      partials: [
        { ratio: 1.00, amplitude: 1.00, decay: 0.04 }
      ],
      duration: 0.08,
      attack: 0.002,
      noise: { duration: 0.09, decay: 0.006, smoothing: 0.08, gain: 0.15 },
      peak: 0.50
    }
  },

  // Generates Float32Array PCM samples
  generateSamples(soundType) {
    const voice = this.voices[soundType] || this.voices.glass;
    const totalDuration = Math.max(voice.duration, voice.noise ? voice.noise.duration : 0);
    const sampleCount = Math.floor(totalDuration * this.sampleRate);
    const samples = new Float32Array(sampleCount);

    // Additive sine partials
    for (const partial of voice.partials) {
      const freq = voice.fundamental * partial.ratio;
      const omega = 2 * Math.PI * freq / this.sampleRate;
      const decayCoeff = 1.0 / (partial.decay * this.sampleRate);
      const attackSamples = Math.floor(voice.attack * this.sampleRate);

      for (let i = 0; i < sampleCount; i++) {
        const t = i / this.sampleRate;
        if (t > voice.duration) break;

        const envelope = Math.exp(-i * decayCoeff);
        const attackScale = attackSamples > 0 ? Math.min(1.0, i / attackSamples) : 1.0;
        samples[i] += Math.sin(omega * i) * partial.amplitude * envelope * attackScale;
      }
    }

    // Add noise burst if voice has noise
    if (voice.noise) {
      const noise = voice.noise;
      const noiseSamples = Math.floor(noise.duration * this.sampleRate);
      const decayCoeff = 1.0 / (noise.decay * this.sampleRate);
      let filterState = 0;

      // Deterministic PRNG seed
      let seed = 123456789;
      function random() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return (seed / 4294967296) * 2 - 1;
      }

      for (let i = 0; i < noiseSamples && i < sampleCount; i++) {
        const rawNoise = random();
        filterState = filterState + (rawNoise - filterState) * noise.smoothing;
        const envelope = Math.exp(-i * decayCoeff);
        samples[i] += filterState * envelope * noise.gain;
      }
    }

    // Peak normalise
    let maxAmp = 0;
    for (let i = 0; i < sampleCount; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > maxAmp) maxAmp = abs;
    }

    if (maxAmp > 0) {
      const scale = voice.peak / maxAmp;
      for (let i = 0; i < sampleCount; i++) {
        samples[i] *= scale;
      }
    }

    return samples;
  }
};

class SoundPlayer {
  constructor() {
    this.audioCtx = null;
    this.buffers = {};
    this.volume = 1.0;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext({ sampleRate: SoundSynthesizer.sampleRate });
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  preload() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    for (const key of Object.keys(SoundSynthesizer.voices)) {
      if (!this.buffers[key]) {
        const pcm = SoundSynthesizer.generateSamples(key);
        const buffer = ctx.createBuffer(1, pcm.length, SoundSynthesizer.sampleRate);
        buffer.copyToChannel(pcm, 0);
        this.buffers[key] = buffer;
      }
    }
  }

  play(soundType, velocityScale = 1.0) {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.buffers[soundType]) {
      this.preload();
    }

    const buffer = this.buffers[soundType] || this.buffers.glass;
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    const gain = Math.min(1.0, Math.max(0.1, velocityScale)) * this.volume;
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundSynthesizer, SoundPlayer };
}
