import type { Settings } from '../game/state';
import type { SfxId } from '../game/types';

type AmbienceKind = 'none' | 'rain' | 'indoor' | 'dawn';

/**
 * WebAudio だけで環境音・BGM・効果音を作る（音声ファイル無し）。
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private ambienceGain!: GainNode;
  private sfxGain!: GainNode;
  private noiseBuffer: AudioBuffer | null = null;
  private crackleSource: AudioBufferSourceNode | null = null;
  private ambienceNodes: AudioNode[] = [];
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private ambienceKind: AmbienceKind = 'none';
  private musicOn = false;
  ready = false;

  init(settings: Settings): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = settings.muted ? 0 : 1;
    this.master.connect(ctx.destination);
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = settings.music;
    this.musicGain.connect(this.master);
    this.ambienceGain = ctx.createGain();
    this.ambienceGain.gain.value = settings.ambient;
    this.ambienceGain.connect(this.master);
    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = settings.sfx;
    this.sfxGain.connect(this.master);
    this.noiseBuffer = this.makeNoise(3);
    this.ready = true;
    this.startCrackle();
  }

  applySettings(s: Settings): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : 1, t, 0.05);
    this.musicGain.gain.setTargetAtTime(s.music, t, 0.1);
    this.ambienceGain.gain.setTargetAtTime(s.ambient, t, 0.1);
    this.sfxGain.gain.setTargetAtTime(s.sfx, t, 0.1);
  }

  private makeNoise(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1;
      // 少しブラウン寄りにして耳あたりを良くする
      last = (last + 0.02 * white) / 1.02;
      data[i] = white * 0.6 + last * 3.2;
    }
    return buf;
  }

  private loopNoise(gainValue: number): { src: AudioBufferSourceNode; gain: GainNode } {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(gain);
    return { src, gain };
  }

  private startCrackle(): void {
    const ctx = this.ctx!;
    if (!this.noiseBuffer || this.crackleSource) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2600;
    const gain = ctx.createGain();
    gain.gain.value = 0.012;
    src.connect(filter).connect(gain).connect(this.ambienceGain);
    src.start();
    this.crackleSource = src;
  }

  setAmbience(kind: AmbienceKind): void {
    if (this.ambienceKind === kind) return;
    this.ambienceKind = kind;
    if (!this.ctx) return;
    const ctx = this.ctx;
    for (const node of this.ambienceNodes) {
      try {
        (node as AudioScheduledSourceNode).stop?.();
      } catch {
        /* noop */
      }
      node.disconnect();
    }
    this.ambienceNodes = [];
    if (kind === 'none') return;

    if (kind === 'rain' || kind === 'dawn') {
      const { src, gain } = this.loopNoise(kind === 'rain' ? 0.34 : 0.14);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 700;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = kind === 'rain' ? 7000 : 3200;
      gain.connect(hp).connect(lp).connect(this.ambienceGain);
      src.start();
      this.ambienceNodes.push(src, gain, hp, lp);
    }
    if (kind === 'indoor' || kind === 'dawn') {
      const { src, gain } = this.loopNoise(0.16);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 380;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain).connect(gain.gain);
      gain.connect(lp).connect(this.ambienceGain);
      src.start();
      lfo.start();
      this.ambienceNodes.push(src, gain, lp, lfo, lfoGain);
    }
    if (kind === 'indoor' || kind === 'dawn') {
      // 遠くの街の低いハム
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 56;
      const g = ctx.createGain();
      g.gain.value = 0.016;
      osc.connect(g).connect(this.ambienceGain);
      osc.start();
      this.ambienceNodes.push(osc, g);
    }
  }

  startMusic(): void {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.nextNoteTime = this.ctx.currentTime + 0.15;
    this.step = 0;
    this.musicTimer = window.setInterval(() => this.scheduler(), 90);
  }

  stopMusic(): void {
    this.musicOn = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private get chords(): number[][] {
    // Fmaj7 / Am7 / Dm7 / G7（夜の店内っぽい進行）
    return [
      [174.61, 220.0, 261.63, 329.63],
      [110.0, 164.81, 196.0, 246.94],
      [146.83, 174.61, 220.0, 261.63],
      [98.0, 146.83, 174.61, 220.0],
    ];
  }

  private scheduler(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicOn) return;
    const beat = 60 / 74;
    while (this.nextNoteTime < ctx.currentTime + 0.6) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += beat;
      this.step += 1;
    }
  }

  private scheduleStep(step: number, time: number): void {
    const ctx = this.ctx!;
    const bar = Math.floor(step / 4) % 4;
    const beat = step % 4;
    const chord = this.chords[bar];
    const t = time;

    // パッド（2拍ごとにゆっくり）
    if (beat % 2 === 0) {
      const dur = (60 / 74) * 4;
      chord.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.value = f * (i === 0 ? 0.5 : 1);
        const g = ctx.createGain();
        const peak = i === 0 ? 0.09 : 0.055;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.6);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(this.musicGain);
        osc.start(t);
        osc.stop(t + dur + 0.1);
      });
    }

    // ベース
    if (beat === 0 || beat === 2) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = chord[0] * 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.13, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      osc.connect(g).connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 1.2);
    }

    // メロディの滴（たまに）
    if (Math.random() < 0.3) {
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0];
      const f = scale[Math.floor(Math.random() * scale.length)];
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      osc.connect(g).connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 1.7);
    }
  }

  sfx(id: SfxId): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const tone = (freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.18, delay = 0) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.linearRampToValueAtTime(gain, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      osc.connect(g).connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.05);
    };
    const noise = (dur: number, filterType: BiquadFilterType, freq: number, gain = 0.15, delay = 0) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const f = ctx.createBiquadFilter();
      f.type = filterType;
      f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.linearRampToValueAtTime(gain, t + delay + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      src.connect(f).connect(g).connect(this.sfxGain);
      src.start(t + delay);
      src.stop(t + delay + dur + 0.05);
    };
    switch (id) {
      case 'bell':
        tone(1568, 0.9, 'sine', 0.12);
        tone(2093, 0.6, 'sine', 0.07, 0.02);
        noise(0.25, 'highpass', 3000, 0.04);
        break;
      case 'cup':
        noise(0.12, 'bandpass', 2400, 0.12);
        tone(880, 0.16, 'triangle', 0.05);
        break;
      case 'clink':
        tone(1046, 0.5, 'sine', 0.1);
        tone(1568, 0.4, 'sine', 0.05, 0.01);
        break;
      case 'pour':
        noise(1.1, 'bandpass', 900, 0.1);
        noise(0.9, 'highpass', 1800, 0.05, 0.1);
        break;
      case 'page':
        noise(0.09, 'highpass', 3200, 0.08);
        break;
      case 'whoosh':
        noise(0.8, 'lowpass', 500, 0.12);
        break;
      case 'heart':
        tone(659, 0.5, 'sine', 0.09);
        tone(988, 0.7, 'sine', 0.06, 0.12);
        break;
    }
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }
}

export const audio = new AudioEngine();

export function ambienceFor(bgId: string): AmbienceKind {
  switch (bgId) {
    case 'street-rain':
    case 'title':
      return 'rain';
    case 'cafe-dawn':
      return 'dawn';
    case 'cafe-night':
    case 'cafe-counter':
    case 'cafe-window':
    case 'kitchen':
      return 'indoor';
    default:
      return 'none';
  }
}