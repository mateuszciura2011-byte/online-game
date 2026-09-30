import type { WeaponId } from '@polystrike/shared/weapons';

export type CombatFeedbackInput = {
  movingSpeed: number;
  sprinting: boolean;
  firing: boolean;
};

export function crosshairScale(input: CombatFeedbackInput) {
  if (input.sprinting && input.movingSpeed > .5) return 1.58;
  if (input.movingSpeed > .5) return 1.26;
  if (input.firing) return 1.16;
  return 1;
}

export function recoilKick(weaponId: WeaponId) {
  const profiles: Record<WeaponId, { vertical: number; horizontal: number }> = {
    knife: { vertical: 0, horizontal: 0 },
    pistol: { vertical: .012, horizontal: .004 },
    smg: { vertical: .009, horizontal: .006 },
    rifle: { vertical: .018, horizontal: .006 },
    sniper: { vertical: .032, horizontal: .009 },
    shotgun: { vertical: .025, horizontal: .008 },
  };
  return profiles[weaponId];
}
