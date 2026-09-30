import { describe, expect, it } from 'vitest';
import { VfxPool } from './VfxPool.js';
describe('VfxPool', () => { it('reduces particle budget and lifetime on lower quality', () => { const low = new VfxPool('low'); const high = new VfxPool('high'); expect(low.capacity()).toBeLessThan(high.capacity()); expect(low.spawn(2).life).toBeLessThan(high.spawn(2).life); }); });
