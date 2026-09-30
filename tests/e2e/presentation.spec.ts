import {expect,test} from '@playwright/test';

for(const width of [320,768,1280]) {
  test(`menu and training HUD fit ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.locator('#training').click();
    await expect(page.locator('#hud')).toBeVisible();
    const overlap=await page.evaluate(()=>{
      const ids=['hud-score','hud-timer','minimap','hud-message','hud-health','hud-ammo','weapon-held'];
      const boxes=ids.map(id=>({id,r:document.getElementById(id)!.getBoundingClientRect()}));
      return boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>a.r.width&&b.r.width&&a.r.left<b.r.right&&a.r.right>b.r.left&&a.r.top<b.r.bottom&&a.r.bottom>b.r.top).map(b=>a.id+'/'+b.id));
    });
    expect(overlap).toEqual([]);
    await page.screenshot({path:`test-results/presentation-${width}.png`});
  });
}

test('equipment shows recognizable weapon previews',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'WYPOSAŻENIE',exact:true}).click();
  await expect(page.locator('.weapon-card')).toHaveCount(4);
  await expect(page.locator('.weapon-card svg')).toHaveCount(4);
  await expect(page.locator('.weapon-card').first()).toContainText('OBRAŻENIA');
  await page.screenshot({path:'test-results/equipment-preview.png'});
});

test('compact objective HUD separates objective, briefing, feedback and recent kills',async({page})=>{
  await page.setViewportSize({width:320,height:900});
  await page.goto('/'); await page.locator('#training').click();
  // Deterministic presentation fixture for simultaneous short-lived network messages.
  await page.evaluate(()=>{
    const set=(id:string,text:string)=>{const element=document.getElementById(id)!;element.classList.remove('hidden');element.textContent=text;};
    set('payload-hud','BROŃ · Nie pozwól przeciwnikom podłożyć ładunku');
    set('team-briefing','CZERWONI · PRZYGOTOWANIE DO RUNDY');
    set('hud-message','TRAFIENIE +32');
    document.getElementById('kill-feed')!.innerHTML='<div>Gracz → Bot · KARABIN</div>';
  });
  await expect(page.locator('#hud-message')).toHaveClass('hud-message--default');
  const overlaps=await page.evaluate(()=>{
    const ids=['payload-hud','team-briefing','hud-message','kill-feed'];
    return ids.flatMap((id,i)=>ids.slice(i+1).filter(other=>{
      const a=document.getElementById(id)!.getBoundingClientRect(), b=document.getElementById(other)!.getBoundingClientRect();
      return a.width&&b.width&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    }).map(other=>id+'/'+other));
  });
  expect(overlaps).toEqual([]);
});
