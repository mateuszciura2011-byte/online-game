import {expect,test} from '@playwright/test';

test('fixed views inspect every team archetype and weapon animation phase without post processing',async({page})=>{
  await page.setViewportSize({width:1200,height:900});await page.goto('/');await page.locator('#training').waitFor();
  const metrics=await page.evaluate(async()=>{
    const threePath='/node_modules/.vite/deps/three.js',playersPath='/src/game/RemotePlayers.ts',weaponPath='/src/game/FirstPersonWeapon.ts';
    const THREE=await import(threePath),{RemotePlayers}=await import(playersPath),{FirstPersonWeapon}=await import(weaponPath);
    const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;z-index:999999';document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(1200,900);renderer.setScissorTest(true);
    const metrics:{calls:number;triangles:number}[]=[];
    for(let i=0;i<9;i++) {
      const scene=new THREE.Scene();scene.background=new THREE.Color('#b9ced3');scene.add(new THREE.HemisphereLight('#ffffff','#637277',2));
      const light=new THREE.DirectionalLight('#ffffff',2);light.position.set(3,6,-4);scene.add(light);
      const camera=new THREE.PerspectiveCamera(i<6?45:65,4/3,.01,100);scene.add(camera);
      let label='';
      if(i<6) {
        const players=new RemotePlayers(scene),id=['a','b','c'][i%3];
        players.push(id,{position:[0,0,0],yaw:0,pitch:0,serverTime:0,alive:true,health:100});
        players.setTeam(id,i<3?'blue':'red');players.setSkin(id,i%3===0?'frost':'recruit');
        camera.position.set(i<3?3:1.7,1.7,i<3?0:3.4);camera.lookAt(0,1,0);
        label=['ASSAULT','HEAVY','SCOUT'][i%3]+(i<3?' / FLANK':' / BACK');
      } else {
        camera.position.set(0,1.7,0);
        const weapon=new FirstPersonWeapon(camera);weapon.equip(i===6?'pistol':'rifle');
        if(i===6)weapon.fire();if(i===7)weapon.setReloadProgress(.5);weapon.update(0);
        label=['PISTOL / SHOT','RIFLE / RELOAD','RIFLE / READY'][i-6];
      }
      const x=i%3*400,y=600-Math.floor(i/3)*300;
      renderer.setViewport(x,y,400,300);renderer.setScissor(x,y,400,300);renderer.render(scene,camera);
      metrics.push({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
      const labelElement=document.createElement('div');labelElement.textContent=label;
      labelElement.style.cssText=`position:fixed;left:${x+8}px;top:${900-y-292}px;z-index:1000000;background:#132d3b;color:white;padding:5px;font:12px sans-serif`;document.body.append(labelElement);
    }
    return metrics;
  });
  for(const sample of metrics) {expect(sample.calls).toBeLessThan(60);expect(sample.triangles).toBeLessThan(3000);}
  await page.screenshot({path:'test-results/polish-models.png'});
});
