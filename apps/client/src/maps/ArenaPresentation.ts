import * as THREE from 'three';

const skies: Record<string,[string,string]>={
  depot:['#6c9eb7','#d6ded2'],
  crossroads:['#719cb6','#dbe6e8'],
  foundry:['#8996a6','#dbc3a4'],
  alleyways:['#697590','#c0becd'],
  citadel:['#79a6b6','#e8dec4'],
  canal:['#6babbc','#cce7e3'],
};

/** Cheap static sky: two authored colours, no extra geometry or post-processing. */
export function applyArenaPresentation(scene:THREE.Scene,id:string) {
  if(scene.background instanceof THREE.Texture) scene.background.dispose();
  const [zenith,horizon]=skies[id]??skies.depot!;
  const data=new Uint8Array(4*128);
  const top=new THREE.Color(zenith).convertLinearToSRGB();
  const bottom=new THREE.Color(horizon).convertLinearToSRGB();
  for(let y=0;y<128;y++) {
    const c=bottom.clone().lerp(top,y/127);
    data.set([Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255),255],y*4);
  }
  const sky=new THREE.DataTexture(data,1,128,THREE.RGBAFormat);
  sky.colorSpace=THREE.SRGBColorSpace; sky.magFilter=THREE.LinearFilter; sky.minFilter=THREE.LinearFilter; sky.needsUpdate=true;
  scene.background=sky;
  // The entire playable arena remains before dense fog; distant wall silhouettes stay readable.
  scene.fog=new THREE.Fog(horizon,90,230);
}
