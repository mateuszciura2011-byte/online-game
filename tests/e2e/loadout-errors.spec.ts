import { expect, test } from '@playwright/test';

test('failed weapon save leaves the old selection and allows retry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let fail = true;
  await page.route('**/profile/*/loadout?*', async route => {
    if (fail) await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' });
    else await route.continue();
  });
  await page.goto('/');
  await page.locator('[data-page="loadout"]').first().click();
  await page.locator('[data-weapon="shotgun"]').click();
  await expect(page.locator('#loadout-status')).toContainText('Nie udało się zapisać');
  await expect(page.locator('.weapon-card--equipped')).toHaveAttribute('data-weapon', 'rifle');
  fail = false;
  await page.locator('[data-weapon="shotgun"]').click();
  await expect(page.locator('.weapon-card--equipped')).toHaveAttribute('data-weapon', 'shotgun');
  expect(errors).toEqual([]);
});

test('closing loadout before its response arrives does not update another panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let arrived!: () => void;
  const requestArrived = new Promise<void>(resolve => { arrived = resolve; });
  await page.route('**/profile/*?token=*', async route => {
    arrived();
    await gate;
    await route.continue();
  });
  await page.locator('[data-page="loadout"]').first().click();
  await requestArrived;
  await page.locator('#close-panel').click();
  await page.locator('[data-page="settings"]').click();
  const response = page.waitForResponse(res => res.url().includes('/profile/') && res.request().method() === 'GET');
  release();
  await response;
  await page.waitForTimeout(200);
  await expect(page.locator('#music-volume')).toBeVisible();
  expect(errors).toEqual([]);
});
