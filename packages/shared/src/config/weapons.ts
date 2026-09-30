export const WEAPONS = {
  knife: { id: 'knife', damage: 50, magazine: 0, reserve: 0, fireIntervalMs: 500, reloadMs: 0, range: 2, pellets: 1 },
  pistol: { id: 'pistol', damage: 25, magazine: 12, reserve: 48, fireIntervalMs: 220, reloadMs: 1_500, range: 32, pellets: 1 },
  smg: { id: 'smg', damage: 16, magazine: 30, reserve: 120, fireIntervalMs: 85, reloadMs: 2_000, range: 28, pellets: 1 },
  rifle: { id: 'rifle', damage: 32, magazine: 24, reserve: 96, fireIntervalMs: 130, reloadMs: 2_300, range: 46, pellets: 1 },
  sniper: { id: 'sniper', damage: 95, magazine: 5, reserve: 20, fireIntervalMs: 900, reloadMs: 2_800, range: 90, pellets: 1 },
  shotgun: { id: 'shotgun', damage: 14, magazine: 8, reserve: 32, fireIntervalMs: 800, reloadMs: 2_600, range: 14, pellets: 8 },
} as const;

export type WeaponId = keyof typeof WEAPONS;

export const BUY_PRICES: Record<WeaponId, number> = {
  knife: 0,
  pistol: 0,
  smg: 1_200,
  rifle: 2_200,
  sniper: 4_750,
  shotgun: 1_600,
};
