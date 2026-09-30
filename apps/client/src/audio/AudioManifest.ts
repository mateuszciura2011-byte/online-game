export type MusicMode = 'menu' | 'buy' | 'match' | 'none';
export type SfxId = 'shot' | 'reload' | 'empty' | 'hit' | 'damage' | 'kill' | 'countdown' | 'buy' | 'ping' | 'crate' | 'victory' | 'defeat' | 'footstep' | 'ui';

export const AUDIO_MANIFEST = {
  music: {
    menu: '/audio/music/menu.ogg',
    buy: '/audio/music/buy.mp3',
    match: '/audio/music/match.ogg',
  },
} as const;
