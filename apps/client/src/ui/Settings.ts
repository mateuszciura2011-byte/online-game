export interface PlayerSettings { sensitivity: number; volume: number; musicVolume: number; effectsVolume: number; quality: 'low' | 'medium' | 'high'; crosshairColor:string; crosshairSize:number; }
const key = 'polystrike.settings';
const defaults: PlayerSettings = { sensitivity: 5, volume: 70, musicVolume: 70, effectsVolume: 70, quality: 'high',crosshairColor:'#ffffff',crosshairSize:32 };
export function loadSettings(): PlayerSettings {
  if (typeof localStorage === 'undefined') return { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
    const number = (name: keyof PlayerSettings, min: number, max: number) => typeof saved[name] === 'number' && Number.isFinite(saved[name]) ? Math.max(min, Math.min(max, saved[name])) : defaults[name] as number;
    return { sensitivity: number('sensitivity', 1, 10), volume: number('volume', 0, 100), musicVolume: number('musicVolume', 0, 100), effectsVolume: number('effectsVolume', 0, 100), quality: ['low', 'medium', 'high'].includes(saved.quality) ? saved.quality : defaults.quality,crosshairColor:['#ffffff','#64e9d6','#ffd166'].includes(saved.crosshairColor)?saved.crosshairColor:defaults.crosshairColor,crosshairSize:number('crosshairSize',20,48) };
  } catch { return { ...defaults }; }
}
export function saveSettings(settings: PlayerSettings) { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(settings)); }
export function aimSensitivity(sliderValue: number) { return Math.max(1, Math.min(10, sliderValue)) * .0005; }
export function qualityPixelRatio(quality: PlayerSettings['quality'], deviceRatio: number) { const cap = quality === 'low' ? 1 : quality === 'medium' ? 1.5 : 2; return Math.min(deviceRatio, cap); }
