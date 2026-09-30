import {expect,test} from '@playwright/test';

test('keyboard focus stays in a menu panel and returns to its opener',async({page})=>{
  await page.goto('/');await page.locator('#quick').focus();await page.keyboard.press('Enter');
  await expect(page.locator('#close-panel')).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.locator('#start-quick-match')).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.locator('#close-panel')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#panel')).toBeHidden();await expect(page.locator('#quick')).toBeFocused();
  await page.locator('#training').click();await expect(page.locator('#hud')).toBeVisible();
});

for(const viewport of [{width:1280,height:800},{width:375,height:812},{width:1024,height:500}]) {
  test(`every menu panel stays usable at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
    await page.screenshot({path:`test-results/interface-menu-${viewport.width}.png`});
    for(const selector of ['#quick','[data-page="loadout"]','[data-page="skins"]','[data-page="settings"]','[data-page="create"]','[data-page="join"]','#account','#stats']) {
      await page.locator(selector).click();await expect(page.locator('#panel')).toBeVisible();
      if(selector.includes('loadout'))await expect(page.locator('.weapon-card')).toHaveCount(4);
      if(selector.includes('skins'))await expect(page.locator('.skin-tile')).toHaveCount(4);
      const geometry=await page.locator('#panel').evaluate(el=>{
        const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,overflow:el.scrollWidth-el.clientWidth};
      });
      expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(viewport.width);expect(geometry.bottom).toBeLessThanOrEqual(viewport.height);
      expect(geometry.overflow).toBeLessThanOrEqual(1);
      if(selector.includes('loadout')||selector.includes('settings')||selector==='#quick')await page.screenshot({path:`test-results/interface-${selector==='#quick'?'quick':selector.includes('loadout')?'equipment':'settings'}-${viewport.width}.png`});
      await page.locator('#close-panel').click();await expect(page.locator('#panel')).toBeHidden();
    }
    await page.locator('#training').click();await page.keyboard.press('Escape');await expect(page.locator('#pause-panel')).toBeVisible();
    const fits=await page.locator('#pause-panel').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;});
    expect(fits).toBe(true);await page.screenshot({path:`test-results/interface-pause-${viewport.width}.png`});expect(errors).toEqual([]);
  });
}

for(const width of [1280,375])test(`round shop and death overlay fit ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:800});await page.goto('/');await page.locator('#training').click();
  // Presentation-only fixture: not a simulated death or a claim about respawn logic.
  await page.evaluate(()=>document.querySelector('#death-screen')!.classList.remove('hidden'));
  const deathFits=await page.locator('#death-screen>div').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});
  expect(deathFits).toBe(true);await page.screenshot({path:`test-results/interface-death-${width}.png`});
  await page.keyboard.press('Escape');await page.locator('[data-pause="leave"]').click();
  await page.locator('#quick').click();await page.locator('#start-quick-match').click();
  await expect(page.locator('#buy-panel')).toBeVisible({timeout:20000});
  const shop=await page.locator('#buy-panel').evaluate(el=>{const r=el.getBoundingClientRect();return {fits:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,overflow:el.scrollWidth-el.clientWidth};});
  expect(shop.fits).toBe(true);expect(shop.overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('#buy-panel .buy-weapon-card')).toHaveCount(5);await page.screenshot({path:`test-results/interface-shop-${width}.png`});
});
