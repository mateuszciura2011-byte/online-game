import { expect, test } from '@playwright/test';

test('lost pointer capture stops firing and offers a visible menu-style cursor', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('game');
  const ammo = await page.locator('#hud-ammo').textContent();
  await page.evaluate(() => document.exitPointerLock());
  await expect(page.locator('#input-hint')).toBeVisible();
  await page.locator('#game').dispatchEvent('mousedown', { button: 0 });
  await page.waitForTimeout(250);
  await page.locator('#game').dispatchEvent('mouseup');
  await expect(page.locator('#hud-ammo')).toHaveText(ammo!);
  await expect(page.locator('#game')).not.toHaveCSS('cursor', 'none');
  await page.waitForTimeout(1300);
  await page.locator('#input-hint').click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('game');
  await expect(page.locator('#game')).toHaveCSS('cursor', 'none');
});

test('menu buttons use the same cyan palette as the normal cursor', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#quick')).toHaveCSS('cursor', /27d8ff/i);
  await expect(page.locator('#player-name')).toHaveCSS('cursor', /27d8ff/i);
});
