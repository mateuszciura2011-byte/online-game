import { expect, test } from '@playwright/test';

test('death shows a countdown without spectator cycling and respawns after 30 seconds', async ({ page }) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#death-screen')).toBeVisible({ timeout: 110000 });
  const started = Date.now();
  await expect(page.locator('#death-screen')).toContainText('ZGINĄŁEŚ');
  const initial = Number(await page.locator('#respawn-countdown').innerText());
  expect(initial).toBeGreaterThanOrEqual(29);
  expect(initial).toBeLessThanOrEqual(30);
  await page.keyboard.down('w');
  await page.keyboard.press('Space');
  await page.waitForTimeout(2100);
  await page.keyboard.up('w');
  expect(Number(await page.locator('#respawn-countdown').innerText())).toBeLessThan(initial);
  await expect(page.locator('#hud-message')).not.toContainText('OBSERWUJESZ');
  await page.screenshot({ path: 'test-results/death-countdown.png' });
  await expect(page.locator('#death-screen')).toBeHidden({ timeout: 33000 });
  expect(Date.now() - started).toBeGreaterThan(28000);
  await expect(page.locator('#hud-health')).toHaveText('HP 100');
  expect(errors).toEqual([]);
});
