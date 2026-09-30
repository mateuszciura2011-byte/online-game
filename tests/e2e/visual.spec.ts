import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test('industrial-neon menu fits the viewport and exposes the team palette', async ({ page }) => {
  await page.goto('/');

  const visual = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      blue: root.getPropertyValue('--blue-team').trim(),
      red: root.getPropertyValue('--red-team').trim(),
      reward: root.getPropertyValue('--reward').trim(),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });

  expect(visual).toEqual({ blue: '#27d8ff', red: '#ff8a3d', reward: '#ffd45b', horizontalOverflow: false });
  await expect(page.locator('#quick')).toBeInViewport();
});

test('quick match selects its arena from visual map cards', async ({ page }) => {
  await page.goto('/');
  await page.locator('#quick').click();

  await expect(page.locator('[data-quick-map-card="foundry"]')).toContainText('ODLEWNIA');
  await expect(page.locator('[data-quick-map-card="depot"]')).toHaveClass(/map-card--selected/);
  await page.locator('[data-quick-map-card="foundry"]').click();
  await expect(page.locator('#quick-map')).toHaveValue('foundry');
});

test('menu uses the custom cyan cursor while the match keeps aiming unobstructed', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('body').evaluate((body) => getComputedStyle(body).cursor)).toContain('data:image/svg+xml');

  await page.locator('#training').click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('game');
  await expect(page.locator('body')).toHaveCSS('cursor', 'none');
});

test('training HUD keeps the crosshair clear at 1280 by 720', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();

  const crosshair = await page.locator('#crosshair').boundingBox();
  const message = await page.locator('#hud-message').boundingBox();
  expect(crosshair).not.toBeNull();
  expect(message).not.toBeNull();
  expect(message!.y + message!.height).toBeLessThan(crosshair!.y - 40);
  await expect(page.locator('#buy-panel')).toHaveClass(/hidden/);
});

test('match HUD uses consistent data cards for health, score and weapon state', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();

  await expect(page.locator('#hud-health')).toHaveClass(/hud-card/);
  await expect(page.locator('#hud-score')).toHaveClass(/hud-card/);
  await expect(page.locator('#weapon-held')).toHaveClass(/hud-card/);
});

test('skin and crate panel stays inside the viewport', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-page="skins"]').first().click();

  await expect(page.locator('#panel')).not.toHaveClass(/hidden/);
  await expect(page.locator('#panel')).toBeInViewport();
  await expect(page.locator('#buy-crate')).toBeVisible();
  await expect(page.locator('#close-panel')).toBeVisible();
});

test('loadout opens a CS-style weapon catalog with categories and an active weapon', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-page="loadout"]').first().click();

  await expect(page.locator('#weapon-catalog')).toBeVisible();
  await expect(page.locator('[data-weapon-category="RIFLE"]')).toBeVisible();
  await expect(page.locator('.weapon-card--equipped')).toHaveCount(1);
});
