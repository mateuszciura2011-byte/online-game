import { describe, expect, it } from 'vitest';
import { PerformancePanel } from './PerformancePanel.js';
describe('performance panel', () => { it('calculates frame time and rolling FPS', () => { const panel = new PerformancePanel(); const sample = panel.sample(1 / 60); expect(sample.frameMs).toBeCloseTo(16.67, 1); expect(sample.fps).toBe(60); expect(panel.label(sample)).toContain('FPS'); }); });
