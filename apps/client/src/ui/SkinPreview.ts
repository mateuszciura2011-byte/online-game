import { SKINS } from '@polystrike/shared/config/skins';

const palettes: Record<string, { armour: string; trim: string; visor: string }> = {
  recruit: { armour: '#486577', trim: '#21394a', visor: '#36daef' },
  neon: { armour: '#33284d', trim: '#c651e3', visor: '#64ffe0' },
  frost: { armour: '#bacfdd', trim: '#567d9d', visor: '#73e6ff' },
  gold: { armour: '#b98b38', trim: '#3d3428', visor: '#fff0a2' },
};

export function skinPreview(skinId: string) {
  const skin = SKINS.find(item => item.id === skinId) ?? SKINS[0];
  const p = palettes[skin.id];
  return `<svg class="skin-portrait" viewBox="0 0 180 240" role="img" aria-label="Podgląd skina ${skin.name}">
    <ellipse cx="90" cy="225" rx="59" ry="9" fill="#020b14" opacity=".6"/>
    <path d="M61 152H85L82 211H57Z M95 152H119L123 211H98Z" fill="${p.trim}"/>
    <path d="M56 202H83V220H49V212Z M97 202H124L132 212V220H97Z" fill="#142431"/>
    <path d="M46 78L29 94L33 153L48 154L58 97 M132 78L151 94L147 153L132 154L122 97" fill="${p.armour}"/>
    <path d="M58 75L122 75L135 112L121 161H59L45 112Z" fill="${p.armour}"/>
    <path d="M64 84H116L122 130L108 146H72L58 130Z" fill="${p.trim}"/>
    <path d="M69 91H111V112H69Z M64 121H84V139H64Z M96 121H116V139H96Z" fill="${p.armour}"/>
    <path d="M58 147H122V159H58Z" fill="#172b39"/>
    <path d="M65 26L114 26L124 43L115 71H67L57 43Z" fill="${p.trim}"/>
    <path d="M67 17H111L124 32V44H57V32Z" fill="${p.armour}"/>
    <path d="M64 43H117L112 55H69Z" fill="${p.visor}"/>
    <path d="M76 61H105V70H76Z" fill="${p.armour}"/>
    <path d="M36 107L145 125L141 138L34 120Z M88 126L104 129L97 156L84 152Z" fill="#142431"/>
    <path d="M140 125L166 130L164 136L139 132Z" fill="#75909d"/>
    <path d="M34 94L46 89L49 98L36 103Z M135 89L147 94L145 103L132 98Z" fill="${p.visor}"/>
  </svg>`;
}
