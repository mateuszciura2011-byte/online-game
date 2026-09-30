import { expect, test } from '@playwright/test';

test('training still offers all weapon types', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();
  for (const [key, name] of [['3', 'PISTOLET MASZYNOWY'], ['5', 'SNAJPERKA'], ['6', 'STRZELBA'], ['4', 'KARABIN']]) {
    await page.keyboard.press(key);
    await expect(page.locator('#weapon-held')).toContainText(name);
  }
});

test('multiplayer ignores unowned weapons without cancelling pistol reload', async ({ page }) => {
  test.setTimeout(40000);
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#quick-mode').selectOption('free_for_all');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#hud-timer')).not.toHaveText('10:00', { timeout: 18000 });
  const held = page.locator('#weapon-held');
  await page.keyboard.press('2');
  await expect(held).toContainText('PISTOLET');
  await page.locator('#game').click({ position: { x: 400, y: 250 } });
  await expect(page.locator('#hud-ammo')).toContainText('11/48');
  await page.keyboard.press('r');
  for (const key of ['3', '5', '6', '2']) {
    await page.keyboard.press(key);
    await expect(held).toContainText('PISTOLET');
  }
  await expect(page.locator('#hud-ammo')).toContainText('12/47', { timeout: 5000 });
  await page.keyboard.press('4');
  await expect(held).toContainText('KARABIN');
  await page.keyboard.press('1');
  await expect(held).toContainText('NÓŻ');
});
