import { WEAPONS, type WeaponId } from '@polystrike/shared/weapons';

/** Authored inventory silhouettes; statistics come from the actual combat configuration. */
export function weaponPreview(id: WeaponId, showStats=true) {
  const weapon=WEAPONS[id];
  const barrel=id==='sniper'?115:id==='shotgun'?100:id==='smg'?45:80;
  const stock=id==='smg'?'M24 45h28v15H24z':'M12 37l42 9v16L12 74z';
  const accessory=id==='sniper'?'<rect x="87" y="23" width="57" height="13" rx="5"/><path d="M102 36v9m28-9v9"/>':id==='shotgun'?'<rect x="122" y="57" width="47" height="12" rx="3"/>':'<path d="M100 62l22 2-5 27-19-3z"/>';
  const silhouette=id==='pistol'?'<path d="M81 27h116v24H81zM86 51h32l-8 42H78zM119 52h25v22h-29"/><path d="M84 27h110v5H84z" fill="#44dce9"/>':`<path d="${stock}"/><path d="M53 43h100v21H53z"/><path d="M151 47h${barrel}v9H151z"/><path d="M76 62h17l-7 25H72z"/>${accessory}<path d="M56 42h83v5H56z" fill="#44dce9"/>`;
  return `<svg class="weapon-preview" viewBox="0 0 280 104" aria-hidden="true"><g fill="#a9c5ce" stroke="#304b5b" stroke-width="3" stroke-linejoin="round">${silhouette}</g></svg>`+(showStats?`<small class="weapon-stats">OBRAŻENIA ${weapon.damage}${weapon.pellets>1?' × '+weapon.pellets:''} · MAGAZYNEK ${weapon.magazine}<br>${Math.round(60000/weapon.fireIntervalMs)} STRZ./MIN · PRZEŁADOWANIE ${(weapon.reloadMs/1000).toFixed(1)} s</small>`:'');
}
