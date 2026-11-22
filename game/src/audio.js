// Emberlight Heist — tiny synthesized sounds (Web Audio, no audio files):
// a soft pickup chime, a pebble tick, a rising alarm sting, a win arpeggio.
// Everything is generated, so the game needs no network and no assets.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext ?? window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  blip(freq, durMs, type = 'sine', gain = 0.08, whenMs = 0) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + whenMs / 1000;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durMs / 1000 + 0.02);
  }

  pickup() {
    this.blip(660, 120);
    this.blip(990, 180, 'sine', 0.07, 90);
  }

  pebble() {
    this.blip(220, 70, 'triangle', 0.06);
  }

  alarm() {
    this.blip(392, 160, 'square', 0.05);
    this.blip(311, 220, 'square', 0.05, 150);
  }

  caught() {
    this.blip(196, 300, 'sawtooth', 0.06);
    this.blip(131, 420, 'sawtooth', 0.06, 200);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.blip(f, 200, 'sine', 0.07, i * 110));
  }

  unlock() {
    this.blip(784, 140);
    this.blip(1047, 220, 'sine', 0.07, 120);
  }
}
