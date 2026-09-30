import { expect, test } from '@playwright/test';

test('two players join the same FFA quick match and reach the game HUD', async ({ browser, request }) => {
  const first = await browser.newPage();
  const second = await browser.newPage();
  try {
  await Promise.all([first.goto('/'), second.goto('/')]);
  await Promise.all([first.locator('#quick').click(), second.locator('#quick').click()]);
  await Promise.all([
    first.locator('#quick-mode').selectOption('free_for_all'),
    second.locator('#quick-mode').selectOption('free_for_all'),
  ]);
  await Promise.all([first.locator('#start-quick-match').click(), second.locator('#start-quick-match').click()]);
  await expect(first.locator('#hud')).not.toHaveClass(/hidden/, { timeout: 20_000 });
  await expect(second.locator('#hud')).not.toHaveClass(/hidden/, { timeout: 20_000 });
  const rooms = await (await request.get('http://127.0.0.1:2567/servers')).json() as Array<{ clients: number; metadata?: { mode?: string } }>;
  expect(rooms.some((room) => room.clients === 2 && room.metadata?.mode === 'free_for_all')).toBe(true);
  await expect(first.locator('#buy-panel')).toHaveClass(/hidden/);
  await expect(first.locator('#hud-timer')).not.toHaveText('10:00', { timeout: 20_000 });
  } finally { await Promise.all([first.close(),second.close()]); }
});

test('training uses a compact status card instead of a fullscreen instruction', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();
  const message = page.locator('#hud-message');
  await expect(message).toHaveText('TRENING: TRAF W CELE');
  await expect(message).toHaveClass(/hud-message--training/);
  const statusBounds=await message.boundingBox();
  expect(statusBounds!.height).toBeLessThan(60);
  expect(statusBounds!.width).toBeLessThan(page.viewportSize()!.width*.75);
  await expect(page.locator('#weapon-held')).toHaveText('TRZYMASZ: KARABIN');
  await page.locator('#game').click({ position: { x: 400, y: 300 } });
  await expect(page.locator('#hud-ammo')).toContainText('23/96');
  await expect(page.locator('#weapon-fire')).toHaveText('');
});

test('a lost mouse lock uses a small recovery control instead of covering the match', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();
  await page.locator('#game').click({ position: { x: 400, y: 300 } });
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id ?? 'unsupported')).toBe('game');

  await page.evaluate(() => document.exitPointerLock());

  const hint = page.locator('#input-hint');
  await expect(hint).not.toHaveClass(/hidden/);
  await expect(hint).toHaveClass(/input-hint--compact/);
});

test('Escape opens an in-game pause menu without leaving the match', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();
  await page.locator('#game').click({ position: { x: 400, y: 300 } });

  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id ?? 'unsupported')).toBe('game');
  await page.keyboard.press('Escape');

  await expect(page.locator('#pause-panel')).not.toHaveClass(/hidden/);
  await expect(page.locator('#pause-score')).toContainText('WYNIK 0');
  await expect(page.locator('#pause-context')).toContainText('TRENING · DEPOT');
  await expect(page.locator('#pause-panel')).toHaveCSS('cursor', /data:image\/svg\+xml/);
  await expect(page.locator('#menu')).toHaveClass(/hidden/);
  await expect(page.locator('#hud')).not.toHaveClass(/hidden/);
  await page.getByRole('button', { name: 'WZNÓW GRĘ' }).click();
  await expect(page.locator('#pause-panel')).toHaveClass(/hidden/);
});

test('team quick match reaches the server buy phase', async ({ page }) => {
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#quick-mode').selectOption('team_deathmatch');
  await page.locator('#quick-map').selectOption('foundry');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#hud')).not.toHaveClass(/hidden/);
  await expect(page.locator('#buy-panel')).not.toHaveClass(/hidden/, { timeout: 18_000 });
  await expect(page.locator('#buy-cash')).toHaveText('KREDYTY: 800');
  await expect(page.locator('#buy-panel')).toContainText('RAPTOR');
  await expect(page.locator('[data-buy-weapon="rifle"]')).toHaveClass(/buy-weapon-card/);
  await expect(page.locator('[data-buy-weapon="pistol"]')).toHaveClass(/buy-weapon-card--equipped/);
  await expect(page.locator('#hud-score')).toHaveText(/NIEBIESCY \d+ : \d+ CZERWONI/);
  await expect(page.locator('[data-buy-weapon="pistol"]')).toBeEnabled();
  await expect(page.locator('[data-buy-weapon="smg"]')).toBeDisabled();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id ?? null)).toBe(null);
  const ammoBeforePurchase = await page.locator('#hud-ammo').innerText();
  await page.locator('[data-buy-weapon="pistol"]').click();
  await expect(page.locator('#hud-ammo')).toHaveText(ammoBeforePurchase);
  await page.screenshot({ path: 'test-results/combat-buy.png' });
  await page.waitForTimeout(200);
  await expect(page.locator('#hud-message')).toHaveText('');
});

test('team quick match shows a compact team briefing before the round', async ({ page }) => {
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#quick-mode').selectOption('team_deathmatch');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#team-briefing')).not.toHaveClass(/hidden/, { timeout: 18_000 });
  await expect(page.locator('#team-briefing')).toContainText('NIEBIESCY');
  await expect(page.locator('#team-briefing')).toContainText('CZERWONI');
  await expect(page.locator('#team-briefing')).toContainText('5 NA 5');
});

test('payload quick match offers the objective HUD', async ({ page }) => {
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#quick-mode').selectOption('payload');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#hud')).not.toHaveClass(/hidden/);
  await expect(page.locator('#buy-panel')).not.toHaveClass(/hidden/, { timeout: 18_000 });
  await expect(page.locator('#payload-hud')).toContainText('ŁADUNEK 5 NA 5', { timeout: 18_000 });
});

test('a public server can be created and joined from the server browser', async ({ browser }) => {
  const host = await browser.newPage();
  const guest = await browser.newPage();
  try {
  await host.goto('/');
  await host.locator('[data-page="create"]').click();
  await host.locator('#room-name').fill('E2E PUBLIC ARENA');
  await host.locator('#map').selectOption('crossroads');
  await host.locator('#create-room').click();
  await expect(host.locator('#hud')).not.toHaveClass(/hidden/);

  await guest.goto('/');
  await guest.locator('[data-page="join"]').click();
  const server = guest.locator('.public-server', { hasText: 'E2E PUBLIC ARENA' });
  await expect(server).toBeVisible();
  await server.click();
  await expect(guest.locator('#hud')).not.toHaveClass(/hidden/);
  } finally { await Promise.all([host.close(),guest.close()]); }
});
