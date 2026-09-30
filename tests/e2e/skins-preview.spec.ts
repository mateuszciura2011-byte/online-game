import { test, expect } from '@playwright/test';

test('opening the collection has one owner and does not launch competing profile reads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.skin-preview b')).toContainText('REKRUT');
  let reads = 0;
  await page.route('**/profile/*?token=*', async route => {
    if (route.request().method() === 'GET') reads++;
    await route.continue();
  });
  await page.locator('[data-page="skins"]').click();
  await expect(page.locator('[data-preview-skin]')).toHaveCount(4);
  expect(reads).toBe(1);
});

test('locked skins can be previewed without equipping or buying them', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-page="skins"]').click();
  await page.locator('[data-preview-skin="gold"]').click();
  await expect(page.locator('#skin-inspect')).toContainText('Złoty Szturm');
  await expect(page.locator('#skin-inspect .skin-portrait')).toBeVisible();
  await expect(page.locator('.equip-skin[data-skin="gold"]')).toBeDisabled();
  await expect(page.locator('.skin-preview b')).toContainText('REKRUT');
  await page.screenshot({ path: 'test-results/skin-gallery.png' });
  await page.reload();
  await expect(page.locator('.skin-preview b')).toContainText('REKRUT');
});
