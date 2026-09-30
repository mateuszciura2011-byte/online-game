const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function scoreboardMarkup(players:readonly {id:string;score:number}[],names:ReadonlyMap<string,string|undefined>,teams:ReadonlyMap<string,string|undefined>,localId:string,ffa:boolean):string {
  const sorted=[...players].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  const rows=(items:typeof sorted)=>items.map(p=>`<div class="score-row${p.id===localId?' score-row--local':''}"><span>${escape(names.get(p.id)??'Gracz')}${p.id===localId?' <b>TY</b>':''}</span><strong>${p.score}</strong></div>`).join('');
  if(ffa)return `<h3>KAŻDY NA KAŻDEGO · PUNKTY</h3>${rows(sorted)}`;
  return (['blue','red'] as const).map(team=>`<section class="score-team score-team--${team}"><h3>${team==='blue'?'NIEBIESCY':'CZERWONI'} · PUNKTY</h3>${rows(sorted.filter(p=>teams.get(p.id)===team))}</section>`).join('');
}
