import { expect, test } from '@playwright/test';

test('stable viewport does not reallocate the canvas on every frame', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();
  const changes = await page.locator('#game').evaluate(async canvas => {
    let count = 0;
    const observer = new MutationObserver(records => { count += records.length; });
    observer.observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] });
    await new Promise(resolve => setTimeout(resolve, 600));
    observer.disconnect();
    return count;
  });
  expect(changes).toBe(0);
  await page.setViewportSize({ width: 900, height: 650 });
  await expect.poll(() => page.locator('#game').evaluate(canvas => ({ width: canvas.clientWidth, height: canvas.clientHeight }))).toEqual({ width: 900, height: 650 });
});
