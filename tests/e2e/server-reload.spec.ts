import { expect, test } from '@playwright/test';

test('multiplayer pistol reload waits for server ammunition and can be cancelled', async ({ page }) => {
  test.setTimeout(40000);
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#quick-mode').selectOption('free_for_all');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#hud-timer')).not.toHaveText('10:00', { timeout: 18000 });
  await page.keyboard.press('2');
  await page.locator('#game').click({ position: { x: 400, y: 250 } });
  const ammo = page.locator('#hud-ammo');
  await expect(ammo).toContainText('11/48');
  await page.keyboard.press('r');
  await expect(ammo).toContainText('11/48');
  await expect(ammo).toContainText('12/47', { timeout: 5000 });
  await page.mouse.click(400, 250);
  await expect(ammo).toContainText('11/47');
  await page.keyboard.press('r');
  await page.keyboard.press('1');
  await page.keyboard.press('2');
  await expect(ammo).toContainText('11/47');
});
