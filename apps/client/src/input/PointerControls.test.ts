import { describe, expect, it, vi } from 'vitest';
import { PointerControls } from './PointerControls.js';

describe('PointerControls', () => {
  it('reports a refused capture instead of silently leaving the game unplayable', async () => {
    const pointer = new PointerControls();
    const failed = vi.fn();
    pointer.attach({ focus() {}, requestPointerLock: () => Promise.reject(new Error('denied')) } as unknown as HTMLCanvasElement);
    pointer.capture(failed);
    await Promise.resolve();
    await Promise.resolve();
    expect(failed).toHaveBeenCalledOnce();
  });
  it('captures the pointer only while an active round is playable', () => {
    const pointer = new PointerControls();

    expect(pointer.shouldCapture({ phase: 'playing', menuOpen: false })).toBe(true);
    expect(pointer.shouldCapture({ phase: 'buy', menuOpen: false })).toBe(false);
    expect(pointer.shouldCapture({ phase: 'playing', menuOpen: true })).toBe(false);
  });
});
