import {Mesh,type DirectionalLight,type Object3D,type WebGLRenderer} from 'three';
import {qualityPixelRatio,type PlayerSettings} from './Settings.js';

export const qualityDescription={
  low:'Większa płynność: bez cieni dynamicznych, skala obrazu do 1×.',
  medium:'Równowaga: cienie 1024 px, skala obrazu do 1,5×.',
  high:'Dokładniejsze cienie 2048 px, skala obrazu do 2×.',
};

export function applyRenderQuality(renderer:WebGLRenderer,sun:DirectionalLight,scene:Object3D,quality:PlayerSettings['quality'],deviceRatio:number) {
  const enabled=quality!=='low',size=quality==='high'?2048:1024;
  const changed=renderer.shadowMap.enabled!==enabled;
  if(!enabled||sun.shadow.mapSize.x!==size) {
    sun.shadow.map?.dispose();sun.shadow.map=null;
    sun.shadow.mapPass?.dispose();sun.shadow.mapPass=null;
  }
  renderer.setPixelRatio(qualityPixelRatio(quality,deviceRatio));
  renderer.shadowMap.enabled=enabled;sun.castShadow=enabled;
  sun.shadow.mapSize.set(size,size);sun.shadow.needsUpdate=true;
  if(changed)scene.traverse(object=>{
    if(object instanceof Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])material.needsUpdate=true;
  });
}
