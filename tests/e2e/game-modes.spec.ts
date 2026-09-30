import { expect, test } from '@playwright/test';

test('quick-match and server menus explain all four modes', async ({ page }) => {
  await page.goto('/'); await page.locator('#quick').click();
  await expect(page.locator('#quick-mode option')).toHaveCount(4);
  await page.locator('#quick-mode').selectOption('elimination');
  await expect(page.locator('#quick-mode-description')).toContainText('Jedno życie');
  await page.locator('#quick-mode').selectOption('team_deathmatch');
  await expect(page.locator('#quick-mode-description')).toContainText('przeciwnych końcach');
  await page.locator('#close-panel').click();
  await page.locator('[data-page="create"]').click();
  await expect(page.locator('#mode option')).toHaveCount(4);
  await page.locator('#mode').selectOption('free_for_all');
  await expect(page.locator('#mode-description')).toContainText('Bez drużyn');
});

test('elimination starts on a team base, counts two minutes and supports pause', async ({ page }) => {
  test.setTimeout(45000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.locator('#quick').click();
  await page.locator('#quick-mode').selectOption('elimination');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#mode-status')).toContainText('ELIMINACJA');
  await expect(page.locator('#mode-status')).toContainText('CZERWONI');
  await expect(page.locator('#hud-score')).toContainText('ŻYWI', { timeout: 18000 });
  await expect(page.locator('#hud-timer')).toHaveText('1:59', { timeout: 30000 });
  // Buying releases pointer lock; use the visible recovery button as a player would.
  await page.locator('#input-hint').click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('game');
  await page.keyboard.down('w'); await page.waitForTimeout(500); await page.keyboard.up('w');
  await page.screenshot({ path: 'test-results/elimination-playing.png' });
  await page.keyboard.press('Escape'); await expect(page.locator('#pause-panel')).toBeVisible();
  expect(errors).toEqual([]);
});
