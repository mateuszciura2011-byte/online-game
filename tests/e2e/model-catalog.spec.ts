import {expect,test} from '@playwright/test';

test('inspect all six production weapon models at close range and in the player view',async({page})=>{
  await page.setViewportSize({width:1200,height:1200});await page.goto('/');await page.locator('#training').waitFor();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const metrics=await page.evaluate(async()=>{
    const threePath='/node_modules/.vite/deps/three.js',weaponPath='/src/game/FirstPersonWeapon.ts';
    const THREE=await import(threePath),{FirstPersonWeapon}=await import(weaponPath);
    const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;z-index:999999';document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(1200,1200);renderer.setScissorTest(true);
    const ids=['knife','pistol','smg','rifle','sniper','shotgun'],samples=[];
    for(let i=0;i<12;i++) {
      const scene=new THREE.Scene();scene.background=new THREE.Color('#9eb4bf');scene.add(new THREE.HemisphereLight('#ffffff','#485865',2));
      const sun=new THREE.DirectionalLight('#fff3df',2);sun.position.set(2,4,-2);scene.add(sun);
      const holder=new THREE.PerspectiveCamera();scene.add(holder);const weapon=new FirstPersonWeapon(holder);weapon.equip(ids[i%6]);
      const camera=i<6?new THREE.PerspectiveCamera(45,4/3,.01,30):holder;
      if(i<6){weapon.group.position.set(0,0,0);weapon.group.rotation.set(0,0,0);weapon.group.scale.setScalar(1);camera.position.set(2,.75,.75);camera.lookAt(0,-.12,-.7);}
      else {holder.aspect=4/3;holder.fov=65;holder.updateProjectionMatrix();}
      const x=i%3*400,y=900-Math.floor(i/3)*300;renderer.setViewport(x,y,400,300);renderer.setScissor(x,y,400,300);renderer.render(scene,camera);
      samples.push({id:ids[i%6],calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
      const label=document.createElement('div');label.textContent=ids[i%6]+' / '+(i<6?'MODEL':'PLAYER');label.style.cssText=`position:fixed;left:${x+8}px;top:${1200-y-292}px;z-index:1000000;color:white;background:#132d3b;padding:5px;font:13px sans-serif`;document.body.append(label);
    }
    return samples;
  });
  for(const sample of metrics){expect(sample.calls).toBeLessThan(60);expect(sample.triangles).toBeLessThan(3000);}
  expect(errors).toEqual([]);console.log(JSON.stringify(metrics));await page.screenshot({path:'test-results/model-catalog.png'});
});
