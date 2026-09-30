import {getMapDefinition,type MapId} from '@polystrike/shared/maps';

const maps:ReadonlyArray<readonly [MapId,string,string]>=[
  ['depot','DEPOT','MAGAZYNY · SUWNICA'],['crossroads','CROSSROADS','MIASTO · SKRZYŻOWANIE'],
  ['foundry','ODLEWNIA','HUTA · KOMINY'],['alleyways','NEONOWE ZAUŁKI','ZABUDOWA · BOCZNE TRASY'],
  ['citadel','CYTADELA','TWIERDZA · BASZTY'],['canal','KANAŁ','PORT · DŹWIG'],
];

/** The overview uses the same walls and spawns as gameplay, not a decorative thumbnail. */
export function mapPreview(id:MapId) {
  const map=getMapDefinition(id);
  const blocks=map.blocks.map(b=>`<rect x="${b.x-b.width/2}" y="${b.z-b.depth/2}" width="${b.width}" height="${b.depth}"/>`).join('');
  const spawns=map.spawns.map(p=>`<circle data-spawn-team="${p.team}" cx="${p.x}" cy="${p.z}" r="2.3" fill="${p.team==='blue'?'#62c9ff':'#ff8ea9'}"/>`).join('');
  return `<svg class="map-preview" data-map-layout="${id}" viewBox="-66 -66 132 132" aria-hidden="true"><rect x="-64" y="-64" width="128" height="128" rx="4" fill="#0a1b27"/><g fill="#7896a1" stroke="#b6c8ca" stroke-width=".4">${blocks}</g>${spawns}</svg>`;
}

export function mountMapCards(select:HTMLSelectElement) {
  if(select.parentElement?.querySelector('#quick-map-cards'))return;
  const cards=document.createElement('div');cards.id='quick-map-cards';
  cards.innerHTML=maps.map(([id,name,description])=>`<button data-quick-map-card="${id}" type="button">${mapPreview(id)}<strong>${name}</strong><small>${description}</small></button>`).join('');
  const update=()=>cards.querySelectorAll<HTMLButtonElement>('[data-quick-map-card]').forEach(card=>{
    const active=card.dataset.quickMapCard===select.value;
    card.classList.toggle('map-card--selected',active);card.setAttribute('aria-pressed',String(active));
  });
  cards.querySelectorAll<HTMLButtonElement>('[data-quick-map-card]').forEach(card=>card.addEventListener('click',()=>{
    select.value=card.dataset.quickMapCard!;select.dispatchEvent(new Event('change',{bubbles:true}));
  }));
  select.addEventListener('change',update);select.insertAdjacentElement('afterend',cards);update();
}
