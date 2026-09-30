import { BUY_PRICES, type WeaponId } from '@polystrike/shared/weapons';

export const weaponPrices = BUY_PRICES;

export function buyWeapon(cash: number, weaponId: WeaponId) {
  const price = weaponPrices[weaponId];
  if (cash < price) return undefined;
  return { cash: cash - price, weaponId };
}
