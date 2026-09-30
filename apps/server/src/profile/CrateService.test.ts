import { describe, expect, it } from 'vitest';
import { CrateService } from './CrateService.js'; import { ProfileStore } from './ProfileStore.js';
describe('crates', () => {
  it('buys a crate before opening it and consumes the owned crate only once', () => {
    const profiles = new ProfileStore();
    profiles.awardVictory('a', 'match-1'); profiles.awardVictory('a', 'match-2'); profiles.awardVictory('a', 'match-3');
    const crates = new CrateService(profiles, () => .1);

    crates.buyCrate('a', 'purchase-1');
    const first = crates.openCrate('a', 'open-1');
    const second = crates.openCrate('a', 'open-1');

    expect(second).toEqual(first);
    expect(profiles.get('a')).toMatchObject({ coins: first.coinsAfter, crateCount: 0 });
  });
});
