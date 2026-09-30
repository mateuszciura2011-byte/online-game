import * as THREE from 'three';

export function configureMapShadows(root:THREE.Object3D) {
  root.traverse(object=>{
    if(object instanceof THREE.Mesh) {
      object.castShadow=object.userData.excludeMapShadows!==true;
      object.receiveShadow=object.userData.excludeMapShadows!==true;
    }
  });
}
