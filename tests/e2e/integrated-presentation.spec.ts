import {expect,test} from '@playwright/test';

test('scrolled narrow menu keeps its close button away from explanatory text',async({page})=>{
  await page.setViewportSize({width:360,height:800});await page.goto('/');await page.locator('#quick').click();
  const overlaps=await page.evaluate(()=>{
    const panel=document.querySelector<HTMLElement>('#panel')!;
    const paragraph=panel.querySelector('p')!;
    panel.scrollTop=paragraph.offsetTop-32;
    const button=panel.querySelector('#close-panel')!.getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(paragraph);
    return Array.from(range.getClientRects()).some(r=>r.left<button.right&&r.right>button.left&&r.top<button.bottom&&r.bottom>button.top);
  });
  expect(overlaps).toBe(false);
  await page.locator('#close-panel').click();await expect(page.locator('#panel')).toHaveClass(/hidden/);
});

test('map cards show distinct playable layouts and team starts while preserving selection',async({page})=>{
  await page.goto('/');await page.locator('#quick').click();
  const cards=page.locator('[data-quick-map-card]');
  await expect(cards.locator('svg.map-preview')).toHaveCount(6);
  const layouts=await cards.locator('.map-preview').evaluateAll(nodes=>nodes.map(n=>n.innerHTML));
  expect(new Set(layouts).size).toBe(6);
  await expect(cards.first().locator('[data-spawn-team="blue"]')).toHaveCount(5);
  await expect(cards.first().locator('[data-spawn-team="red"]')).toHaveCount(5);
  await cards.filter({has:page.locator('[data-map-layout="canal"]')}).click();
  await expect(page.locator('#quick-map')).toHaveValue('canal');
  await expect(page.locator('[data-quick-map-card="canal"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.map-card--selected')).toHaveCount(1);
  await expect(page.locator('.map-card--selected')).toHaveAttribute('data-quick-map-card','canal');
  await page.locator('#quick-map').selectOption('citadel');
  await expect(page.locator('.map-card--selected')).toHaveAttribute('data-quick-map-card','citadel');
  await page.setViewportSize({width:360,height:800});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/map-catalog-mobile.png'});
});

test('all six skyline identities remain readable from fixed player-height and overview cameras',async({page})=>{
  await page.setViewportSize({width:1200,height:900});await page.goto('/');await page.locator('#training').waitFor();
  const metrics=await page.evaluate(async()=>{
    const threeUrl='/node_modules/.vite/deps/three.js',arenaUrl='/src/maps/TacticalArena.ts';
    const THREE=await import(threeUrl),{buildTacticalArena}=await import(arenaUrl);
    const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;z-index:999999';document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(1200,900);renderer.setScissorTest(true);
    const maps=['depot','crossroads','foundry','alleyways','citadel','canal'];const results=[];
    for(let i=0;i<12;i++) {
      const scene=new THREE.Scene();scene.background=new THREE.Color('#c4d8df');
      scene.add(new THREE.HemisphereLight('#ffffff','#848474',2));
      const sun=new THREE.DirectionalLight('#fff3df',2);sun.position.set(-25,40,20);scene.add(sun);
      buildTacticalArena(scene,maps[i%6]);
      const camera=new THREE.PerspectiveCamera(55,400/225,.1,400);
      if(i<6){camera.position.set(48,1.7,-20);camera.lookAt(0,20,-84);}
      else {camera.position.set(65,48,-15);camera.lookAt(0,18,-84);}
      const x=i%3*400,y=675-Math.floor(i/3)*225;
      renderer.setViewport(x,y,400,225);renderer.setScissor(x,y,400,225);renderer.render(scene,camera);
      results.push({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
      const label=document.createElement('div');label.textContent=maps[i%6]+(i<6?' / poziom gracza':' / sylwetka');
      label.style.cssText=`position:fixed;left:${x+6}px;top:${900-y-220}px;z-index:1000000;background:#102736;color:white;padding:4px;font:12px sans-serif`;document.body.append(label);
    }
    return results;
  });
  expect(Math.max(...metrics.map(m=>m.calls))).toBeLessThan(46);
  expect(Math.max(...metrics.map(m=>m.triangles))).toBeLessThan(20000);
  await page.screenshot({path:'test-results/skyline-inspection.png'});
});

test('buy catalog has weapon silhouettes and fits a short viewport',async({page})=>{
  await page.setViewportSize({width:1024,height:600});await page.goto('/');
  await page.locator('#quick').click();await page.locator('#quick-mode').selectOption('team_deathmatch');
  await page.locator('#start-quick-match').click();
  await expect(page.locator('#buy-panel')).toBeVisible({timeout:18000});
  await expect(page.locator('#buy-panel svg.weapon-preview')).toHaveCount(5);
  const bounds=await page.locator('#buy-panel').boundingBox();expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(600);
  await expect(page.locator('[data-buy-weapon="pistol"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-buy-weapon="rifle"]')).toBeDisabled();
  await page.screenshot({path:'test-results/buy-catalog.png'});
});
