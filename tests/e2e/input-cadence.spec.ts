import { expect, test } from '@playwright/test';

test('30 FPS still sends movement at the server simulation cadence', async ({ page }) => {
  test.setTimeout(35000);
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      const started = performance.now();
      const tick = (now: number) => { if (now - started >= 32) callback(now); else original(tick); };
      return original(tick);
    };
  });
  let inputCount = 0;
  page.on('websocket', socket => socket.on('framesent', frame => {
    if (Buffer.from(frame.payload).includes(Buffer.from('input'))) inputCount++;
  }));
  await page.goto('/');
  await page.locator('#quick').click();
  await page.locator('#start-quick-match').click();
  await expect.poll(() => inputCount, { timeout: 18000 }).toBeGreaterThan(5);
  const before = inputCount;
  await page.keyboard.down('d');
  await page.waitForTimeout(3000);
  await page.keyboard.up('d');
  const sent = inputCount - before;
  expect(sent).toBeGreaterThanOrEqual(54);
  expect(sent).toBeLessThanOrEqual(63);
});
