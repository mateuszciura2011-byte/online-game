import { expect, test } from '@playwright/test';

test('a delayed statistics response cannot replace settings after closing the loading panel', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/profile/*/stats?*', async route => {
    await gate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ matchesPlayed: 17, wins: 3, kills: 20, deaths: 10, shotsFired: 100, shotsHit: 20, playTimeSeconds: 600 }) });
  });
  await page.goto('/');
  await page.locator('#stats').click();
  await expect(page.getByText('Ładowanie statystyk…')).toBeVisible();
  await page.locator('#close-panel').click();
  await page.locator('[data-page="settings"]').click();
  const response = page.waitForResponse(res => res.url().includes('/stats?'));
  release();
  await response;
  await page.waitForTimeout(200);
  await expect(page.locator('#music-volume')).toBeVisible();
  await expect(page.locator('#stats-content')).toHaveCount(0);
});

test('statistics report a server error and recover when reopened', async ({ page }) => {
  let unavailable = true;
  await page.route('**/profile/*/stats?*', async route => {
    if (unavailable) await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) });
    else await route.continue();
  });
  await page.goto('/');
  await page.locator('#stats').click();
  await expect(page.getByText('Nie udało się pobrać statystyk.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
  unavailable = false;
  await page.locator('#close-panel').click();
  await page.locator('#stats').click();
  await expect(page.getByText('Mecze:', { exact: false })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('undefined');
});
