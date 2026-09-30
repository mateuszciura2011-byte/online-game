import { test, expect } from '@playwright/test';

test('settings show live values, persist changes and fit a narrow screen', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('[data-page="settings"]').click();
  await page.locator('#effects-volume').fill('35');
  await expect(page.locator('[data-value-for="effects-volume"]')).toHaveText('35%');
  await page.locator('#test-audio').click();
  await page.screenshot({ path: 'test-results/settings-desktop.png' });
  await page.reload(); await page.locator('[data-page="settings"]').click();
  await expect(page.locator('#effects-volume')).toHaveValue('35');
  await page.setViewportSize({ width: 600, height: 850 });
  await expect(page.locator('#test-audio')).toBeVisible();
  const overflow = await page.locator('.settings-grid').evaluate(element => element.scrollWidth > element.clientWidth + 1);
  expect(overflow).toBe(false);
  await page.screenshot({ path: 'test-results/settings-narrow.png' });
  expect(errors).toEqual([]);
});

test('weapon sounds render distinct audible signals and respect mute', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const modulePath = '/src/audio/AudioDirector.ts';
    const { AudioDirector } = await import(modulePath);
    const render = async (weapon: string, volume: number) => {
      const context = new OfflineAudioContext(1, 22050, 44100);
      const director = new AudioDirector();
      director.context = context;
      director.setVolume(volume); director.playWeaponShot(weapon);
      const buffer = await context.startRendering();
      const samples = buffer.getChannelData(0);
      return Array.from(samples).reduce((sum, value) => sum + value * value, 0);
    };
    return { pistol: await render('pistol', .7), sniper: await render('sniper', .7), muted: await render('rifle', 0) };
  });
  expect(result.pistol).toBeGreaterThan(0);
  expect(result.sniper).toBeGreaterThan(result.pistol);
  expect(result.muted).toBe(0);
});
