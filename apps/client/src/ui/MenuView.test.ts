import { describe, expect, it } from 'vitest';
import { MenuView } from './MenuView.js';

describe('MenuView', () => {
  it('opens the requested menu page and reveals its panel', () => {
    const menu = { hidden: false, dataset: {} } as unknown as HTMLElement;
    const panel = { hidden: true, dataset: {} } as unknown as HTMLElement;
    const view = new MenuView(menu, panel);

    view.open('skins');

    expect(panel.hidden).toBe(false);
    expect(panel.dataset.page).toBe('skins');
  });
});
