import {expect,test} from '@playwright/test';
test('crosshair settings persist and update the actual sight',async({page})=>{
  await page.goto('/');await page.locator('[data-page="settings"]').click();
  await expect(page.locator('#panel')).toContainText('1–6');
  await page.locator('#crosshair-color').selectOption('#64e9d6');
  await page.locator('#crosshair-size').fill('40');await page.locator('#crosshair-size').dispatchEvent('input');
  await page.reload();await page.locator('#training').click();
  await expect(page.locator('#crosshair')).toHaveCSS('color','rgb(100, 233, 214)');
  await expect(page.locator('#crosshair')).toHaveCSS('font-size','40px');
});
test('team scoreboard highlights the local player and separates teams',async({page})=>{
  await page.setViewportSize({width:1024,height:500});
  await page.goto('/');await page.locator('#quick').click();await page.locator('#start-quick-match').click();
  await expect(page.locator('#hud')).toBeVisible();await page.keyboard.down('Tab');
  await expect(page.locator('#scoreboard')).toBeVisible();
  await expect(page.locator('#scoreboard .score-row--local')).toHaveCount(1);
  await expect(page.locator('#scoreboard .score-team')).toHaveCount(2);
  await expect(page.locator('#scoreboard .score-row')).toHaveCount(10);
  expect(await page.locator('#scoreboard').evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
  await page.screenshot({path:'test-results/team-scoreboard.png'});await page.keyboard.up('Tab');
});
for(const map of ['depot','crossroads','foundry','alleyways','citadel','canal'])test(`training selects ${map}`,async({page})=>{
  await page.goto('/');await page.locator('#training-map').selectOption(map);
  await page.locator('#training').click();await page.keyboard.press('Escape');
  await expect(page.locator('#pause-context')).toContainText(map.toUpperCase());
});
