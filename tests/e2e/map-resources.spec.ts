import {expect,test} from '@playwright/test';

test('training to menu cycles do not accumulate live GPU buffers',async({page})=>{
  await page.addInitScript(()=>{
    const live=new Set<WebGLBuffer>();
    (window as any).__liveGameBuffers=()=>live.size;
    const prototype=WebGL2RenderingContext.prototype;
    const create=prototype.createBuffer,remove=prototype.deleteBuffer;
    prototype.createBuffer=function(){const buffer=create.call(this);if(buffer)live.add(buffer);return buffer;};
    prototype.deleteBuffer=function(buffer){if(buffer)live.delete(buffer);return remove.call(this,buffer);};
  });
  await page.goto('/');
  const counts:number[]=[];
  for(let i=0;i<4;i++) {
    await page.locator('#training').click();
    await expect(page.locator('#hud')).toBeVisible();
    // The training button captures the mouse. A second click would fire and
    // lazily upload another slot of the bounded VFX pool, skewing this check.
    await expect.poll(()=>page.evaluate(()=>document.pointerLockElement?.id)).toBe('game');
    // Wait for rendering/upload, not a fixed sleep.
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    await page.keyboard.press('Escape');
    await page.locator('[data-pause="leave"]').click();
    await expect(page.locator('#training')).toBeVisible();
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    counts.push(await page.evaluate(()=>(window as any).__liveGameBuffers()));
  }
  expect(counts.slice(1)).toEqual([counts[0],counts[0],counts[0]]);
});

test('repeated rendered map replacement releases GPU buffers in Chrome',async({page})=>{
  await page.goto('/');await page.locator('#training').waitFor();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const samples=await page.evaluate(async()=>{
    const threeUrl='/node_modules/.vite/deps/three.js',mapUrl='/src/maps/TacticalArena.ts',resourcesUrl='/src/maps/MapResources.ts';
    const THREE=await import(threeUrl),{buildTacticalArena}=await import(mapUrl),{disposeMap}=await import(resourcesUrl);
    const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setSize(320,180);
    const gl=renderer.getContext(),buffers=new Set<WebGLBuffer>();
    const create=gl.createBuffer.bind(gl),remove=gl.deleteBuffer.bind(gl);
    gl.createBuffer=()=>{const buffer=create();if(buffer) buffers.add(buffer);return buffer;};
    gl.deleteBuffer=(buffer:WebGLBuffer|null)=>{if(buffer) buffers.delete(buffer);remove(buffer);};
    renderer.shadowMap.enabled=true;
    const sun=new THREE.DirectionalLight();sun.castShadow=true;sun.position.set(30,50,20);
    const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root,sun,new THREE.HemisphereLight(0xffffff,0x445566,2));
    const camera=new THREE.PerspectiveCamera(60,320/180,.1,400);camera.position.set(90,100,90);camera.lookAt(0,0,0);
    renderer.render(scene,camera);
    const baseline=buffers.size,results:{map:string;allocated:number;remaining:number;geometries:number}[]=[];
    for(const map of ['depot','crossroads','foundry','alleyways','citadel','canal','depot']) {
      buildTacticalArena(root,map);root.traverse((object:any)=>{if(object.isMesh)object.castShadow=true;});renderer.render(scene,camera);
      const allocated=buffers.size-baseline;
      disposeMap(root);renderer.render(scene,camera);
      results.push({map,allocated,remaining:buffers.size-baseline,geometries:renderer.info.memory.geometries});
    }
    renderer.dispose();return results;
  });
  for(const sample of samples) {
    expect(sample.allocated,sample.map).toBeGreaterThan(20);
    expect(sample.remaining,sample.map).toBe(0);
    expect(sample.geometries,sample.map).toBe(0);
  }
  expect(errors).toEqual([]);
});
