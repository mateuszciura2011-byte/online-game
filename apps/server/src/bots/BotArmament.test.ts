import { expect, it } from 'vitest';
import { BotArmament } from './BotArmament.js';
import type { CombatPlayer } from '../combat/CombatSystem.js';

const player = (): CombatPlayer => ({ id: 'bot', alive: true, health: 100, lastFireAt: 0,
  ammo: { knife: 0, pistol: 12, rifle: 0, smg: 30, sniper: 5, shotgun: 8 },
  reserve: { knife: 0, pistol: 48, rifle: 96, smg: 120, sniper: 20, shotgun: 32 } });

it('waits the full reload time and transfers only the available reserve', () => {
  const armament = new BotArmament(), bot = player(); bot.reserve.rifle = 3;
  expect(armament.update(bot, 'rifle', 1000).ready).toBe(false);
  expect(armament.update(bot, 'rifle', 3299).ready).toBe(false);
  expect(bot.ammo.rifle).toBe(0);
  expect(armament.update(bot, 'rifle', 3300).ready).toBe(true);
  expect(bot.ammo.rifle).toBe(3); expect(bot.reserve.rifle).toBe(0);
});

it('uses the pistol when the primary has no ammunition left', () => {
  const armament = new BotArmament(), bot = player(); bot.reserve.rifle = 0;
  expect(armament.update(bot, 'rifle', 1000)).toEqual({ weaponId: 'pistol', ready: true });
  bot.ammo.pistol = 0; bot.reserve.pistol = 0;
  expect(armament.update(bot, 'rifle', 2000).ready).toBe(false);
});

it('does not inherit a pending reload after respawn', () => {
  const armament = new BotArmament(), oldLife = player();
  armament.update(oldLife, 'rifle', 1000);
  const newLife = player(); newLife.ammo.rifle = 24;
  expect(armament.update(newLife, 'rifle', 1100).ready).toBe(true);
  expect(newLife.reserve.rifle).toBe(96);
});
