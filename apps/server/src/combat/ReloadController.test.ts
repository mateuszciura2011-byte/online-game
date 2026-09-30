import { expect, it } from 'vitest';
import { ReloadController } from './ReloadController.js';
import { WEAPONS } from '@polystrike/shared/weapons';
import type { CombatPlayer } from './CombatSystem.js';

const player = () => ({ alive: true, ammo: { pistol: 2 }, reserve: { pistol: 24 } } as CombatPlayer);
it('waits the weapon reload duration and ignores repeated requests', () => {
  const reload = new ReloadController(); const p = player();
  expect(reload.start(p, 'pistol', 100)).toBe(true);
  expect(reload.start(p, 'pistol', 200)).toBe(false);
  expect(reload.update(p, 100 + WEAPONS.pistol.reloadMs - 1)).toBeUndefined();
  expect(p.ammo.pistol).toBe(2); expect(reload.active(p)).toBe(true);
  expect(reload.update(p, 100 + WEAPONS.pistol.reloadMs)).toBe('pistol');
  expect(p.ammo.pistol).toBe(WEAPONS.pistol.magazine); expect(reload.active(p)).toBe(false);
});
it('cancels without transferring ammunition and rejects dead players', () => {
  const reload = new ReloadController(); const p = player();
  reload.start(p, 'pistol', 0); reload.cancel(p);
  expect(reload.update(p, 99999)).toBeUndefined(); expect(p.ammo.pistol).toBe(2);
  reload.start(p, 'pistol', 0); p.alive = false;
  expect(reload.update(p, 99999)).toBeUndefined(); expect(p.ammo.pistol).toBe(2);
  expect(reload.start(p, 'pistol', 0)).toBe(false);
});
