import { AUDIO_MANIFEST, type MusicMode, type SfxId } from './AudioManifest.js';
import type { WeaponId } from '@polystrike/shared/weapons';

type Channel = 'music' | 'effects' | 'ui';

export class AudioDirector {
  private volume = .7;
  private channels: Record<Channel, number> = { music: 1, effects: 1, ui: 1 };
  private context?: AudioContext;
  private musicMode: MusicMode = 'none';
  private music?: HTMLAudioElement;
  private unlocked = false;
  private countdownSecond?: number;
  private voices=new Set<{oscillator:OscillatorNode;gain:GainNode}>();

  setVolume(value: number) { this.volume = this.clamp(value); this.applyMusicVolume(); }
  getVolume() { return this.volume; }
  setChannelVolume(channel: Channel, value: number) { this.channels[channel] = this.clamp(value); this.applyMusicVolume(); }
  getChannelVolume(channel: Channel) { return this.channels[channel]; }
  async unlock() { this.unlocked = true; const context = this.audioContext(); if (context?.state === 'suspended') await context.resume().catch(() => undefined); if (this.music?.paused) await this.music.play().catch(() => undefined); }
  async transitionTo(mode: MusicMode) { if (mode === this.musicMode) return; const previous = this.music; this.musicMode = mode; this.music = undefined; if (previous) { previous.pause(); previous.currentTime = 0; } if (mode === 'none' || typeof Audio === 'undefined') return; const next = new Audio(AUDIO_MANIFEST.music[mode]); next.loop = true; next.preload = 'auto'; this.music = next; this.applyMusicVolume(); if (this.unlocked) await next.play().catch(() => undefined); }
  currentMusic() { return this.musicMode; }
  activeMusicTracks() { return this.musicMode === 'none' ? [] : [this.musicMode]; }
  playCountdownSecond(second: number) { if (this.countdownSecond === second) return false; this.countdownSecond = second; this.playSfx('countdown'); return true; }
  resetCountdown() { this.countdownSecond = undefined; }
  playWeaponShot(weaponId: WeaponId) {
    const context = this.audioContext();
    const level = this.volume * this.channels.effects;
    if (!context || level === 0) return level;
    void context.resume().catch(() => undefined);
    const [low, high, duration] = {
      knife: [280, 610, .045], pistol: [145, 790, .09], smg: [190, 1100, .055],
      rifle: [105, 920, .105], sniper: [65, 650, .22], shotgun: [75, 430, .18],
    }[weaponId];
    this.tone(context, low, duration, 0, level);
    this.tone(context, high, duration * .32, .004, level * .4);
    return level;
  }
  playSfx(id: SfxId) { const context = this.audioContext(); const channel: Channel = id === 'ui' ? 'ui' : 'effects'; const level = this.volume * this.channels[channel]; if (!context || level === 0) return level; void context.resume().catch(()=>undefined); const effectLevel = id === 'footstep' ? level * .38 : level; this.notesFor(id).forEach((frequency, index) => this.tone(context, frequency, id === 'shot' ? .055 : .13, index * .075, effectLevel)); return level; }
  play(id: 'menu' | 'match' | 'victory' | 'shot') { if (id === 'menu' || id === 'match') { void this.transitionTo(id); return this.volume * this.channels.music; } return this.playSfx(id); }
  setMusic(mode: 'menu' | 'match') { void this.transitionTo(mode); }
  stopMusic() { void this.transitionTo('none'); }
  stopEffects() {
    for(const voice of this.voices) {
      voice.oscillator.onended=null;voice.oscillator.stop();
      voice.oscillator.disconnect();voice.gain.disconnect();
    }
    this.voices.clear();this.resetCountdown();
  }
  stopAll() { this.stopEffects();this.stopMusic(); this.context?.close().catch(() => undefined); this.context = undefined; }
  private clamp(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
  private applyMusicVolume() { if (this.music) this.music.volume = this.clamp(this.volume * this.channels.music); }
  private audioContext() { if (!this.context && typeof AudioContext !== 'undefined') this.context = new AudioContext(); return this.context; }
  private notesFor(id: SfxId) { const notes: Record<SfxId, number[]> = { shot: [105], reload: [260, 330], empty: [180], hit: [720], damage: [95, 75], kill: [440, 660], countdown: [520], buy: [380, 570], ping: [820], crate: [330, 440, 660], victory: [523, 659, 784], defeat: [220, 174, 146], footstep: [155], ui: [460] }; return notes[id]; }
  private tone(context: AudioContext, frequency: number, duration: number, offset: number, level: number) {
    const oscillator=context.createOscillator(),gain=context.createGain(),voice={oscillator,gain};
    this.voices.add(voice);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.voices.delete(voice);};
    oscillator.type=frequency<150?'sawtooth':'triangle';oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(Math.max(.001,level*.07),context.currentTime+offset);
    gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+offset+duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime+offset);oscillator.stop(context.currentTime+offset+duration);
  }
}
