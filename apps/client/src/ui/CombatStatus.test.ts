import {expect,it} from 'vitest';
import {combatStatus} from './CombatStatus.js';

it('distinguishes an empty magazine from exhausted reserves',()=>{
  expect(combatStatus('rifle',0,24,false,0)).toContain('PUSTY MAGAZYNEK');
  expect(combatStatus('rifle',0,24,false,0)).toContain('R');
  expect(combatStatus('rifle',0,0,false,0)).toContain('BRAK AMUNICJI');
  expect(combatStatus('rifle',2,0,false,0)).not.toContain('PRZEŁADUJ');
});
it('does not suggest ammunition for the knife',()=>{
  expect(combatStatus('knife',0,0,false,0)).toContain('NÓŻ');
});
it('keeps pending server confirmation distinct from a completed reload',()=>{
  expect(combatStatus('pistol',1,10,true,0)).toContain('POTWIERDZENIE');
  expect(combatStatus('pistol',1,10,true,1.5)).toContain('1.5 s');
});
