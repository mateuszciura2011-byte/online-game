import { describe, expect, it } from 'vitest';
import { mapColliders } from './Maps.js';
import { getMapDefinition } from '@polystrike/shared/maps';

describe('map colliders', () => {
  it('uses the same collision plan as the client on all six maps', () => {
    for (const id of ['depot','crossroads','foundry','alleyways','citadel','canal']) expect(mapColliders(id)).toEqual(getMapDefinition(id).colliders);
    expect(mapColliders('depot')).not.toEqual(mapColliders('crossroads'));
  });
});
