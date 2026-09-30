import { expect, test } from '@playwright/test';

test('account code restores the same profile on another computer', async ({ browser }) => {
  const first = await browser.newPage();
  const secondContext = await browser.newContext();
  try {
  await first.goto('/');
  await first.locator('[data-page="settings"]').click();
  await first.locator('#show-account-code').click();
  const status = first.locator('#account-status');
  await expect(status).toContainText('kod konta');
  const accountCode = (await status.textContent())!.split(':').at(-1)!.trim();

  const second = await secondContext.newPage();
  await second.goto('/');
  await second.locator('[data-page="settings"]').click();
  await second.locator('#restore-account').fill(accountCode);
  await second.locator('#restore-account-button').click();
  await expect(second.locator('#account-status')).toContainText('przywrócone');
  await expect.poll(() => second.evaluate(() => localStorage.getItem('polystrike-account-code'))).toBe(accountCode);
  } finally { await Promise.all([first.close(),secondContext.close()]); }
});

test('coins buy a crate and an owned crate can be opened', async ({ page, request }) => {
  await page.goto('/');
  await page.locator('[data-page="settings"]').click();
  await page.locator('#show-account-code').click();
  const codeText = await page.locator('#account-status').textContent();
  const token = codeText!.split(':').at(-1)!.trim();
  const resumed = await request.post('http://127.0.0.1:2567/account/resume', { data: { token } });
  const { profile } = await resumed.json() as { profile: { id: string; coins: number } };
  for (let index = profile.coins; index < 300; index += 100) {
    await request.post(`http://127.0.0.1:2567/profile/${profile.id}/victory?token=${encodeURIComponent(token)}`, {
      data: { matchId: `e2e-crate-${token}-${index}` },
    });
  }

  await page.locator('#close-panel').click();
  await page.locator('[data-page="skins"]').first().click();
  await expect(page.locator('#buy-crate')).toBeEnabled();
  await page.locator('#buy-crate').click();
  await expect(page.locator('#open-owned-crate')).toBeEnabled();
  await page.locator('#open-owned-crate').click();
  await expect(page.locator('#crate-result')).not.toBeEmpty();
  await expect(page.locator('#skin-list [data-preview-skin]')).toHaveCount(4);
});

test('separate music and effects settings are persisted', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-page="settings"]').click();
  await page.locator('#music-volume').fill('23');
  await page.locator('#effects-volume').fill('67');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('polystrike.settings') ?? '{}'));
  expect(saved.musicVolume).toBe(23);
  expect(saved.effectsVolume).toBe(67);
});
