import * as THREE from 'three';
import { chamferBox, profilePrism } from '../game/ModelGeometry.js';

/** A visible shooting-range silhouette, not an enemy's debug hitbox. */
export function createTrainingTarget(id:string) {
  const body=new THREE.Mesh(profilePrism([[-.42,-1],[.42,-1],[.5,.35],[.25,.55],[.22,.9],[0,1],[-.22,.9],[-.25,.55],[-.5,.35]],.18),
    new THREE.MeshStandardMaterial({color:'#d2cab3',roughness:.9,flatShading:true}));
  body.name='training-silhouette';
  const paint=new THREE.MeshStandardMaterial({color:'#b65739',roughness:.8});
  const steel=new THREE.MeshStandardMaterial({color:'#435763',roughness:.65,metalness:.35});
  for(const side of [-1,1]) {
    const ring=new THREE.Mesh(new THREE.RingGeometry(.17,.23,16),paint);
    ring.name='target-ring';ring.position.set(0,.05,side*.096);if(side<0)ring.rotation.y=Math.PI;body.add(ring);
    const bullseye=new THREE.Mesh(new THREE.CircleGeometry(.07,12),paint);
    bullseye.position.set(0,.05,side*.097);if(side<0)bullseye.rotation.y=Math.PI;body.add(bullseye);
  }
  const foot=new THREE.Mesh(chamferBox(.7,.08,.5),steel);foot.position.y=-1.46;body.add(foot);
  const pole=new THREE.Mesh(chamferBox(.09,.48,.09),steel);pole.position.y=-1.22;body.add(pole);
  body.traverse(part=>{part.userData.targetId=id;if(part instanceof THREE.Mesh){part.castShadow=true;part.receiveShadow=true;}});
  return body;
}
