import { expect, test } from '@playwright/test';

for (const map of ['depot','crossroads','foundry','alleyways','citadel','canal']) {
  test(map + ' loads the enlarged arena and supports movement and pause', async ({ page }) => {
    test.setTimeout(35000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.locator('#quick').click();
    await page.locator('#quick-mode').selectOption('free_for_all');
    await page.locator('#quick-map').selectOption(map);
    await page.locator('#start-quick-match').click();
    await expect(page.locator('#hud')).toBeVisible();
    await expect(page.locator('#hud-timer')).not.toHaveText('10:00', { timeout: 18000 });
    await page.locator('#game').click({position:{x:640,y:360}});
    await expect.poll(()=>page.evaluate(()=>document.pointerLockElement?.id)).toBe('game');
    await page.keyboard.down('w'); await page.waitForTimeout(800); await page.keyboard.up('w');
    await page.screenshot({path:'test-results/map-'+map+'.png'});
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-panel')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
