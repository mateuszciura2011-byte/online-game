import {expect,test} from '@playwright/test';

test('quality selection explains the real graphics cost and equipment exposes the selected weapon',async({page})=>{
  await page.goto('/');await page.locator('[data-page="settings"]').click();
  await page.locator('#quality').selectOption('low');
  await expect(page.locator('#quality-description')).toContainText('bez cieni');
  await page.locator('#quality').selectOption('high');
  await expect(page.locator('#quality-description')).toContainText('2048');
  await page.reload();await page.getByRole('button',{name:'WYPOSAŻENIE',exact:true}).click();
  await expect(page.locator('.weapon-card[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('.weapon-card[aria-pressed="false"]')).toHaveCount(3);
  await page.setViewportSize({width:360,height:800});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.screenshot({path:'test-results/polish-equipment-mobile.png'});
});

test('stopping effects cancels scheduled sound but allows subsequent effects',async({page})=>{
  await page.goto('/');
  const energies=await page.evaluate(async()=>{
    const path='/src/audio/AudioDirector.ts';const {AudioDirector}=await import(path);
    const render=async(restart:boolean)=>{
      const context=new OfflineAudioContext(1,22050,44100),audio=new AudioDirector();
      audio.context=context;audio.playSfx('victory');audio.stopEffects();
      if(restart)audio.playWeaponShot('pistol');
      const samples=(await context.startRendering()).getChannelData(0);
      return samples.reduce((sum:number,v:number)=>sum+v*v,0);
    };
    return [await render(false),await render(true)];
  });
  expect(energies[0]).toBe(0);expect(energies[1]).toBeGreaterThan(0);
});

test('quality tiers change actual shadow rendering and free the old shadow target',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const threePath='/node_modules/.vite/deps/three.js',qualityPath='/src/ui/RenderQuality.ts';
    const THREE=await import(threePath),{applyRenderQuality}=await import(qualityPath);
    const renderer=new THREE.WebGLRenderer(),sun=new THREE.DirectionalLight();
    const scene=new THREE.Scene();scene.add(sun);
    const target=new THREE.WebGLRenderTarget(32,32);let released=false;target.addEventListener('dispose',()=>released=true);sun.shadow.map=target;
    applyRenderQuality(renderer,sun,scene,'low',2);
    const low={shadows:renderer.shadowMap.enabled,ratio:renderer.getPixelRatio(),released,map:sun.shadow.map};
    applyRenderQuality(renderer,sun,scene,'high',2);
    const high={shadows:renderer.shadowMap.enabled,ratio:renderer.getPixelRatio(),size:sun.shadow.mapSize.x};
    applyRenderQuality(renderer,sun,scene,'medium',2);
    const medium=sun.shadow.mapSize.x;renderer.dispose();return {low,high,medium};
  });
  expect(result.low).toEqual({shadows:false,ratio:1,released:true,map:null});
  expect(result.high).toEqual({shadows:true,ratio:2,size:2048});
  expect(result.medium).toBe(1024);
});
