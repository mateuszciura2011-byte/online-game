import {expect,test} from '@playwright/test';

test('inspect authored rooftops and weapon grip from fixed cameras',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/');
  await page.locator('#training').waitFor();
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  // Isolated visual fixture uses production builders, not replacement mock geometry.
  const result=await page.evaluate(async()=>{
    const threeUrl='/node_modules/.vite/deps/three.js';
    const remoteUrl='/src/game/RemotePlayers.ts';
    const arenaUrl='/src/maps/TacticalArena.ts';
    const THREE=await import(threeUrl);
    const {RemotePlayers}=await import(remoteUrl);
    const {buildTacticalArena}=await import(arenaUrl);
    const canvas=document.createElement('canvas');
    canvas.style.cssText='position:fixed;inset:0;z-index:999999;width:1280px;height:800px;cursor:default';
    document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
    renderer.setSize(1280,800); renderer.setScissorTest(true);
    const names=['depot','crossroads','foundry','alleyways','citadel','canal'];
    const counts:number[]=[];
    for(let i=0;i<8;i++) {
      const scene=new THREE.Scene();scene.background=new THREE.Color('#bbd0d8');
      scene.add(new THREE.HemisphereLight('#ffffff','#798077',2));
      const sun=new THREE.DirectionalLight('#fff4dd',2.3);sun.position.set(-25,40,-20);scene.add(sun);
      const camera=new THREE.PerspectiveCamera(48,320/400,.1,400);
      if(i<6) {
        buildTacticalArena(scene,names[i]);
        camera.position.set(95,92,115);camera.lookAt(0,0,0);
      } else {
        const players=new RemotePlayers(scene);
        players.push(i===6?'bot-1':'bot-2',{position:[0,0,0],yaw:0,pitch:0,health:100,serverTime:0,alive:true});
        camera.position.set(i===6?2.6:-2.6,2,-4);camera.lookAt(0,1.1,-.2);
      }
      const x=(i%4)*320,y=i<4?400:0;
      renderer.setViewport(x,y,320,400);renderer.setScissor(x,y,320,400);
      renderer.render(scene,camera);counts.push(renderer.info.render.calls);
      const label=document.createElement('div');label.textContent=names[i]??(i===6?'weapon grip / front right':'weapon grip / front left');
      label.style.cssText=`position:fixed;left:${x+12}px;top:${(i<4?0:400)+12}px;z-index:1000000;background:#132d3b;color:white;padding:6px;font:14px sans-serif`;
      document.body.append(label);
    }
    return counts;
  });
  expect(result).toHaveLength(8);
  expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/architecture-inspection.png'});
});

test('inspect route signs from both teams and streets at player eye height',async({page})=>{
  await page.setViewportSize({width:1280,height:960});
  await page.goto('/');await page.locator('#training').waitFor();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const calls=await page.evaluate(async()=>{
    const threeUrl='/node_modules/.vite/deps/three.js',arenaUrl='/src/maps/TacticalArena.ts';
    const THREE=await import(threeUrl),{buildTacticalArena}=await import(arenaUrl);
    const canvas=document.createElement('canvas');
    canvas.style.cssText='position:fixed;inset:0;z-index:999999;width:1280px;height:960px';document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(1280,960);renderer.setScissorTest(true);
    const counts:number[]=[];
    const names=['depot','crossroads','foundry','alleyways','citadel','canal','depot','depot'];
    for(let i=0;i<8;i++) {
      const scene=new THREE.Scene();scene.background=new THREE.Color('#bed4de');
      scene.add(new THREE.HemisphereLight('#e3f2ff','#6e7361',2));
      const sun=new THREE.DirectionalLight('#fff4dd',2);sun.position.set(-25,40,-20);scene.add(sun);
      buildTacticalArena(scene,names[i]);
      const camera=new THREE.PerspectiveCamera(65,640/240,.1,250);
      if(i<6) {camera.position.set(49,1.7,49);camera.lookAt(44,1.7,20);}
      else {const side=i===6?1:-1;camera.position.set(18,1.7,side*51);camera.lookAt(18,2.6,side*59);}
      const x=i%2*640,y=720-Math.floor(i/2)*240;
      renderer.setViewport(x,y,640,240);renderer.setScissor(x,y,640,240);renderer.render(scene,camera);
      counts.push(renderer.info.render.calls);
      const label=document.createElement('div');label.textContent=i<6?names[i]:'B / '+(i===6?'blue approach':'red approach');
      label.style.cssText=`position:fixed;left:${x+8}px;top:${960-y-232}px;z-index:1000000;background:#132d3b;color:white;padding:4px;font:13px sans-serif`;document.body.append(label);
    }
    return counts;
  });
  expect(Math.max(...calls)).toBeLessThan(45);
  expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/street-inspection.png'});
});
