import { describe, expect, it } from 'vitest';
import { GameApp } from './GameApp.js';

describe('GameApp', () => {
  it('starts the game runtime once even when start is requested twice', () => {
    let starts = 0;
    const app = new GameApp(() => { starts += 1; });

    app.start();
    app.start();

    expect(starts).toBe(1);
  });
});
