export type HudSnapshot = {
  health: number;
  cash: number;
  weapon: string;
  ammo: number;
  reserve: number;
};

const weaponLabels: Record<string, string> = {
  knife: 'NÓŻ',
  pistol: 'PISTOLET',
  smg: 'PISTOLET MASZYNOWY',
  rifle: 'KARABIN',
  sniper: 'SNAJPERKA',
  shotgun: 'STRZELBA',
};

const safeInteger = (value: number) => Math.max(0, Math.round(Number.isFinite(value) ? value : 0));

export const shouldClearHudMessage = (phase: string) => phase !== 'countdown';

export function formatHud(snapshot: HudSnapshot) {
  return {
    health: `HP ${safeInteger(snapshot.health)}`,
    cash: `$${safeInteger(snapshot.cash)}`,
    weapon: weaponLabels[snapshot.weapon] ?? snapshot.weapon.toUpperCase(),
    ammo: `${safeInteger(snapshot.ammo)} / ${safeInteger(snapshot.reserve)}`,
  };
}

export class HudView {
  constructor(
    private readonly health: HTMLElement,
    private readonly cash: HTMLElement,
    private readonly weapon: HTMLElement,
    private readonly ammo: HTMLElement,
  ) {}

  render(snapshot: HudSnapshot) {
    const labels = formatHud(snapshot);
    this.health.textContent = labels.health;
    this.cash.textContent = labels.cash;
    this.weapon.textContent = labels.weapon;
    this.ammo.textContent = labels.ammo;
  }
}
