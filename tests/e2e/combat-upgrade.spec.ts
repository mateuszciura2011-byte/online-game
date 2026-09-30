import { expect, test } from '@playwright/test';

test('held rifle fires repeatedly, reload takes time, pause stops combat', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#training').click();
  await expect(page.locator('#combat-status')).toContainText('AUTO');
  await page.locator('#game').click({ position: { x: 400, y: 300 } });
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
  const ammo = () => page.locator('#hud-ammo').innerText();
  const beforeReload = await ammo();
  expect(Number(beforeReload.match(/(\d+)\//)![1])).toBeLessThanOrEqual(19);
  await page.keyboard.press('r');
  await expect(page.locator('#combat-status')).toContainText('PRZEŁADOWANIE');
  await page.waitForTimeout(500);
  expect(await ammo()).toBe(beforeReload);
  await expect(page.locator('#hud-ammo')).toContainText('24/', { timeout: 4000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-panel')).toBeVisible();
  const pausedAmmo = await ammo();
  await page.locator('#pause-score').click();
  await page.keyboard.press('r');
  expect(await ammo()).toBe(pausedAmmo);
  await page.screenshot({ path: 'test-results/combat-pause.png' });
  await page.locator('[data-pause="resume"]').click();
  await expect(page.locator('#pause-panel')).toBeHidden();
  await page.screenshot({ path: 'test-results/combat-training.png' });
  expect(errors).toEqual([]);
});

test('pistol is semiautomatic and leaving training stops hidden firing', async ({ page }) => {
  await page.goto('/'); await page.locator('#training').click();
  await page.locator('#game').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('2');
  await expect(page.locator('#combat-status')).toContainText('POJEDYNCZY');
  await page.waitForTimeout(250);
  await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
  await expect(page.locator('#hud-ammo')).toContainText('11/48');
  await page.keyboard.press('Escape');
  await page.locator('[data-pause="leave"]').click();
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#buy-panel')).toBeHidden();
  await page.locator('[data-page="loadout"]').click();
  await page.waitForTimeout(200);
  await expect(page.locator('#hud-ammo')).toContainText('11/48');
  await page.locator('#close-panel').click();
  await page.locator('#training').click();
  await expect(page.locator('#hud-ammo')).toContainText('24/96');
  await expect(page.locator('#hud-message')).toHaveText('TRENING: TRAF W CELE');
});

test('sprint moves visibly farther than walking in the same time', async ({ browser }) => {
  const measure = async (sprint: false | 'ShiftLeft' | 'ShiftRight') => {
    const page = await browser.newPage(); await page.goto('/'); await page.locator('#training').click();
    await expect(page.locator('#combat-status')).toContainText('AUTO');
    const radarY = () => page.locator('#minimap').evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, 150, 150).data;
      let total = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 230 && pixels[i + 1] > 230 && pixels[i + 2] > 230) { total += Math.floor(i / 4 / 150); count++; }
      }
      return count ? total / count : null;
    });
    await expect.poll(radarY).not.toBeNull(); const initial = (await radarY())!;
    if (sprint) await page.keyboard.down(sprint);
    await page.keyboard.down('w'); await page.waitForTimeout(850);
    await page.keyboard.up('w'); if (sprint) await page.keyboard.up(sprint);
    const distance = initial - (await radarY())!;
    await page.keyboard.press('Space'); await page.waitForTimeout(220);
    await page.screenshot({ path: `test-results/combat-${sprint ? 'sprint' : 'walk'}-jump.png` });
    await page.close(); return distance;
  };
  const walk = await measure(false), sprint = await measure('ShiftLeft'), rightSprint = await measure('ShiftRight');
  expect(walk).toBeGreaterThan(3);
  expect(sprint).toBeGreaterThan(walk * 1.25);
  expect(rightSprint).toBeGreaterThan(walk * 1.25);
  expect(rightSprint / sprint).toBeGreaterThan(.8);
  expect(rightSprint / sprint).toBeLessThan(1.2);
});
