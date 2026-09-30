import { describe, expect, it, vi } from 'vitest';
import { aimSensitivity, loadSettings, qualityPixelRatio } from './Settings.js';
it('repairs invalid saved values rather than breaking controls and audio', () => {
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ sensitivity: -2, volume: 300, musicVolume: 'bad', quality: 'ultra' }) });
  try { expect(loadSettings()).toMatchObject({ sensitivity: 1, volume: 100, musicVolume: 70, quality: 'high' }); }
  finally { vi.unstubAllGlobals(); }
});
describe('settings', () => { it('provides default controls', () => expect(loadSettings()).toEqual({ sensitivity: 5, volume: 70, musicVolume: 70, effectsVolume: 70, quality: 'high',crosshairColor:'#ffffff',crosshairSize:32 })); it('maps the sensitivity slider to camera movement', () => { expect(aimSensitivity(1)).toBe(.0005); expect(aimSensitivity(10)).toBe(.005); }); it('reduces the pixel ratio on lower quality settings', () => { expect(qualityPixelRatio('low', 2)).toBe(1); expect(qualityPixelRatio('medium', 2)).toBe(1.5); expect(qualityPixelRatio('high', 3)).toBe(2); }); });
