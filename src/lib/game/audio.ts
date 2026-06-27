// REALMFORGE — synthesized retro chiptune sound engine (Web Audio, no assets)
type SfxName = "hammer" | "crit" | "build" | "complete" | "upgrade" | "ascend" | "combo" | "error" | "reward" | "surge" | "achievement" | "coin";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
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
      this.master.gain.value = 0.45;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.1;
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
    if (this.master) this.master.gain.value = m ? 0 : 0.45;
  }
  isMuted() {
    return this.muted;
  }

  private blip(freq: number, dur: number, type: OscillatorType = "square", vol = 0.4, slideTo?: number) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.004);
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
      case "hammer":
        this.blip(180 + Math.random() * 40, 0.05, "square", 0.18, 120);
        this.noise(0.04, 0.12, 1200);
        break;
      case "crit":
        this.blip(660, 0.08, "square", 0.3, 1320);
        this.blip(990, 0.1, "square", 0.25, 1980);
        break;
      case "build":
        this.blip(440, 0.04, "triangle", 0.12);
        break;
      case "complete":
        this.blip(523, 0.08, "square", 0.3);
        this.blip(659, 0.08, "square", 0.3);
        this.blip(784, 0.12, "square", 0.3);
        this.blip(1047, 0.18, "square", 0.3);
        break;
      case "coin":
        this.blip(988, 0.05, "square", 0.18, 1319);
        break;
      case "upgrade":
        this.blip(659, 0.07, "square", 0.28);
        this.blip(880, 0.1, "square", 0.28);
        break;
      case "ascend":
        this.blip(392, 0.12, "square", 0.3);
        this.blip(523, 0.12, "square", 0.3);
        this.blip(659, 0.12, "square", 0.3);
        this.blip(784, 0.3, "square", 0.3);
        this.blip(1047, 0.5, "square", 0.35);
        break;
      case "combo":
        this.blip(700 + Math.random() * 200, 0.04, "square", 0.12, 900);
        break;
      case "error":
        this.blip(140, 0.12, "sawtooth", 0.25, 90);
        break;
      case "reward":
        this.blip(659, 0.08, "square", 0.28);
        this.blip(880, 0.08, "square", 0.28);
        this.blip(1047, 0.14, "square", 0.32);
        break;
      case "surge":
        this.blip(220, 0.4, "sawtooth", 0.25, 880);
        this.blip(440, 0.4, "square", 0.25, 1760);
        break;
      case "achievement":
        this.blip(784, 0.08, "square", 0.28);
        this.blip(988, 0.08, "square", 0.28);
        this.blip(1319, 0.2, "square", 0.32);
        break;
    }
  }

  // gentle chiptune arpeggio
  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicTimer !== null) return;
    const scale = [220, 277.18, 329.63, 369.99, 440, 523.25, 587.33, 659.25];
    let step = 0;
    const bass = [110, 110, 146.83, 146.83];
    let b = 0;
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      // melody
      const note = scale[step % scale.length];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.value = note;
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
      // bass every 4 steps
      if (step % 4 === 0) {
        const bn = bass[b % bass.length];
        b++;
        const bo = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        bo.type = "triangle";
        bo.frequency.value = bn;
        bg.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        bg.gain.exponentialRampToValueAtTime(0.6, this.ctx.currentTime + 0.02);
        bg.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.9);
        bo.connect(bg);
        bg.connect(this.musicGain);
        bo.start();
        bo.stop(this.ctx.currentTime + 0.95);
      }
      step++;
    };
    this.musicTimer = window.setInterval(tick, 260);
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

let engine: AudioEngine | null = null;
export function getAudio(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
