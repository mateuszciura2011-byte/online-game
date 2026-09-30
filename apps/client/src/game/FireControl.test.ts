import { describe, it, expect } from 'vitest';
import { FireControl } from './FireControl.js';

describe('trigger handling', () => {
  it('fires a rifle continuously at its configured cadence, without catching up after a stall', () => {
    const trigger = new FireControl(); trigger.press();
    expect(trigger.poll('rifle', 0, true)).toBe(true);
    expect(trigger.poll('rifle', 129, true)).toBe(false);
    expect(trigger.poll('rifle', 130, true)).toBe(true);
    expect(trigger.poll('rifle', 2000, true)).toBe(true);
    expect(trigger.poll('rifle', 2001, true)).toBe(false);
    trigger.release(); expect(trigger.poll('rifle', 3000, true)).toBe(false);
  });
  it('requires a fresh press for a pistol and drops held input when paused', () => {
    const trigger = new FireControl(); trigger.press();
    expect(trigger.poll('pistol', 0, true)).toBe(true);
    expect(trigger.poll('pistol', 1000, true)).toBe(false);
    trigger.release(); trigger.press(); expect(trigger.poll('pistol', 1000, true)).toBe(true);
    expect(trigger.poll('rifle', 2000, false)).toBe(false);
    expect(trigger.poll('rifle', 2200, true)).toBe(false);
  });
});
