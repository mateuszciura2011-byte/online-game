import { expect, test } from '@playwright/test';

test('pausing a sprint immediately stops movement and clears held movement keys', async ({ page }) => {
  await page.goto('/');
  await page.locator('#training').click();
  const position = () => page.locator('#minimap').evaluate(element => {
    const pixels = (element as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 150, 150).data;
    let sum = 0, count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 230 && pixels[i + 1] > 230 && pixels[i + 2] > 230) { sum += Math.floor(i / 4 / 150); count++; }
    }
    return count ? sum / count : null;
  });
  await expect.poll(position).not.toBeNull();
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  const stopped = (await position())!;
  await page.waitForTimeout(400);
  expect(Math.abs((await position())! - stopped)).toBeLessThan(.3);
  await page.locator('[data-pause="resume"]').click();
  await page.waitForTimeout(300);
  expect(Math.abs((await position())! - stopped)).toBeLessThan(.3);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
});
