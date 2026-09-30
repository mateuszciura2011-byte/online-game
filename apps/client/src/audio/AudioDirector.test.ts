import { describe, expect, it, vi } from 'vitest';
import { AudioDirector } from './AudioDirector.js';

describe('AudioDirector', () => {
  it('keeps volume in a safe range', () => { const audio = new AudioDirector(); audio.setVolume(2); expect(audio.getVolume()).toBe(1); audio.setVolume(-1); expect(audio.getVolume()).toBe(0); });
  it('does not repeat the match-start sound', () => { const setIntervalMock = vi.fn(); vi.stubGlobal('window', { setInterval: setIntervalMock }); const audio = new AudioDirector(); audio.setMusic('match'); expect(setIntervalMock).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
  it('keeps separate music, effects and UI channel volumes', () => { const audio = new AudioDirector(); audio.setChannelVolume('music', .2); audio.setChannelVolume('effects', .8); audio.setChannelVolume('ui', .5); expect(audio.getChannelVolume('music')).toBe(.2); expect(audio.getChannelVolume('effects')).toBe(.8); expect(audio.getChannelVolume('ui')).toBe(.5); });
  it('keeps exactly one active music track while transitioning', async () => {
    const audio = new AudioDirector();
    await audio.transitionTo('menu');
    expect(audio.currentMusic()).toBe('menu');
    await audio.transitionTo('match');
    expect(audio.currentMusic()).toBe('match');
    expect(audio.activeMusicTracks()).toHaveLength(1);
  });
  it('clamps new channel values to the supported range', () => {
    const audio = new AudioDirector();
    audio.setChannelVolume('music', 2);
    expect(audio.getChannelVolume('music')).toBe(1);
  });
  it('plays each countdown number once and resets for the next round', () => {
    const audio = new AudioDirector();
    const play = vi.spyOn(audio, 'playSfx');
    audio.playCountdownSecond(3);
    audio.playCountdownSecond(3);
    audio.playCountdownSecond(2);
    audio.resetCountdown();
    audio.playCountdownSecond(3);
    expect(play).toHaveBeenCalledTimes(3);
    expect(play).toHaveBeenCalledWith('countdown');
  });
  it('keeps footsteps on the effects channel', () => {
    const audio = new AudioDirector();
    audio.setChannelVolume('effects', .4);
    expect(audio.playSfx('footstep')).toBeCloseTo(.28);
  });
});
