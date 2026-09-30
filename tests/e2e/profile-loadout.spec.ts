import { expect, test } from '@playwright/test';

test('free-for-all starts with the primary weapon approved by the profile', async ({ page }) => {
  test.setTimeout(40000);
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#quick-mode').selectOption('free_for_all');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#hud-timer')).not.toHaveText('10:00', { timeout: 18000 });
  await expect(page.locator('#weapon-held')).toHaveText('TRZYMASZ: KARABIN');
  await expect(page.locator('#hud-ammo')).toContainText('24/96');
});
