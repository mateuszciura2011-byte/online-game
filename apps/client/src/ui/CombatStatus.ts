import {WEAPONS,type WeaponId} from '@polystrike/shared/weapons';

export function combatStatus(id:WeaponId,ammo:number,reserve:number,reloading:boolean,seconds:number) {
  const low=ammo<=Math.ceil(WEAPONS[id].magazine*.25);
  if(id==='knife')return 'NÓŻ · LPM';
  if(reloading)return seconds>0?`PRZEŁADOWANIE · ${seconds.toFixed(1)} s`:'PRZEŁADOWANIE · POTWIERDZENIE SERWERA';
  if(ammo<=0)return reserve>0?'PUSTY MAGAZYNEK · R PRZEŁADUJ':'BRAK AMUNICJI · ZMIEŃ BROŃ';
  if(low)return reserve>0?'MAŁO AMUNICJI · R PRZEŁADUJ':'MAŁO AMUNICJI · BRAK ZAPASU';
  return id==='rifle'||id==='smg'?'AUTO · PRZYTRZYMAJ LPM':'POJEDYNCZY · LPM';
}
