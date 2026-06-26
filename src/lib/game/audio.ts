// PRISM SMASH — synthesized sound engine (Web Audio API, no asset files)
// Created lazily on first user gesture (browser autoplay policy).

type SfxName = "tap" | "crit" | "smash" | "upgrade" | "prestige" | "combo" | "error" | "reward" | "surge" | "achievement";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicTimer: number | null = null;
  private muted = false;
  public musicEnabled = true;

  init() {
    if (typeof window === "undefined") return;
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.master);
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  isMuted() {
    return this.muted;
  }

  private blip(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.4, slideTo?: number) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.now ? this.ctx.now() : this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.3, hp = 800) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
  }

  play(name: SfxName) {
    if (!this.ctx || this.muted) return;
    this.resume();
    switch (name) {
      case "tap":
        this.blip(420 + Math.random() * 80, 0.08, "triangle", 0.25, 300);
        break;
      case "crit":
        this.blip(880, 0.12, "sawtooth", 0.35, 1600);
        this.blip(1320, 0.1, "sine", 0.25, 2200);
        break;
      case "smash":
        this.noise(0.25, 0.4, 400);
        this.blip(180, 0.3, "sawtooth", 0.3, 60);
        this.blip(520, 0.2, "triangle", 0.2, 120);
        break;
      case "upgrade":
        this.blip(523, 0.08, "sine", 0.3);
        this.blip(659, 0.08, "sine", 0.3);
        this.blip(784, 0.12, "sine", 0.3);
        break;
      case "prestige":
        this.blip(392, 0.15, "sine", 0.35);
        this.blip(523, 0.15, "sine", 0.35);
        this.blip(659, 0.15, "sine", 0.35);
        this.blip(784, 0.4, "sine", 0.4);
        break;
      case "combo":
        this.blip(660 + Math.random() * 200, 0.05, "square", 0.15, 880);
        break;
      case "error":
        this.blip(180, 0.15, "sawtooth", 0.3, 120);
        break;
      case "reward":
        this.blip(659, 0.1, "sine", 0.3);
        this.blip(880, 0.1, "sine", 0.3);
        this.blip(1047, 0.18, "sine", 0.35);
        break;
      case "surge":
        this.blip(220, 0.5, "sawtooth", 0.3, 880);
        this.blip(440, 0.5, "sine", 0.3, 1760);
        break;
      case "achievement":
        this.blip(784, 0.1, "triangle", 0.3);
        this.blip(988, 0.1, "triangle", 0.3);
        this.blip(1319, 0.25, "triangle", 0.35);
        break;
    }
  }

  // simple ambient arpeggio loop
  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicTimer !== null) return;
    const scale = [220, 261.63, 329.63, 392, 440, 523.25, 659.25];
    let step = 0;
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      const note = scale[step % scale.length] * (step % 14 < 7 ? 1 : 0.5);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = note;
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.5, this.ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
      step++;
    };
    this.musicTimer = window.setInterval(tick, 280);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  setMusicEnabled(on: boolean) {
    this.musicEnabled = on;
    if (on) this.startMusic();
    else this.stopMusic();
  }
}

// singleton (client only)
let engine: AudioEngine | null = null;
export function getAudio(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
