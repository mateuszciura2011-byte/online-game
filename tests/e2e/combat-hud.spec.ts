import {expect,test} from '@playwright/test';

test('reload progress freezes on pause and clears on weapon switch',async({page})=>{
  await page.goto('/');await page.locator('#training').click();
  await page.locator('#game').click({position:{x:400,y:300}});
  await page.keyboard.press('r');
  const bar=page.locator('#reload-bar');
  await expect(bar).toHaveAttribute('role','progressbar');
  await page.waitForTimeout(400);
  const progress=()=>bar.getAttribute('aria-valuenow').then(Number);
  expect(await progress()).toBeGreaterThan(5);
  await page.keyboard.press('Escape');await expect(page.locator('#pause-panel')).toBeVisible();
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const paused=await progress();await page.waitForTimeout(500);
  expect(Math.abs((await progress())-paused)).toBeLessThan(2);
  await page.screenshot({path:'test-results/combat-hud-paused.png'});
  await page.locator('[data-pause="resume"]').click();
  await page.keyboard.press('2');
  await expect(bar).not.toHaveClass(/reload-bar--active/);
  await expect.poll(progress).toBe(0);
});

test('firing changes ammunition without a flashing shot label',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto('/');await page.locator('#training').click();
  await page.evaluate(()=>{
    const node=document.querySelector('#weapon-fire')!;
    node.setAttribute('data-flashed','false');
    new MutationObserver(()=>{if(node.textContent)node.setAttribute('data-flashed','true');}).observe(node,{childList:true,characterData:true,subtree:true});
  });
  await page.locator('#game').click({position:{x:180,y:300}});
  await page.mouse.down();await page.waitForTimeout(250);
  await expect(page.locator('#weapon-fire')).toHaveText('');await page.mouse.up();
  await expect(page.locator('#weapon-fire')).toHaveAttribute('data-flashed','false');
  await expect(page.locator('#hud-ammo')).not.toContainText('24/96');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('empty magazine automatically reloads and returns to normal after ammunition arrives',async({page})=>{
  await page.goto('/');await page.locator('#training').click();
  await page.locator('#game').click({position:{x:400,y:300}});
  await page.mouse.down();
  await expect(page.locator('#hud-ammo')).toHaveText('AMUNICJA: 0/96',{timeout:5000});
  await page.mouse.up();
  await expect(page.locator('#combat-status')).toContainText('PRZEŁADOWANIE');
  await page.screenshot({path:'test-results/combat-hud-empty.png'});
  await expect(page.locator('#hud-ammo')).toContainText('24/72',{timeout:4000});
  await expect(page.locator('#combat-status')).toContainText('AUTO');
  await expect(page.locator('#reload-bar')).not.toHaveClass(/reload-bar--active/);
});
