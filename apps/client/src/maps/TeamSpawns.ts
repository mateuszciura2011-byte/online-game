import * as THREE from 'three';
import { getMapDefinition } from '@polystrike/shared/maps';

/** Subtle floor markers make the two team sides readable without affecting collision. */
export function addTeamSpawnPads(scene: THREE.Object3D, mapId: string) {
  const spawns = getMapDefinition(mapId).spawns;
  for (const team of ['blue', 'red'] as const) {
    const group = new THREE.Group();
    group.name = `team-spawn-${team}`;
    const color = team === 'blue' ? '#247fc2' : '#c33163';
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .35, roughness: .7 });
    for (const point of spawns.filter((spawn) => spawn.team === team)) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .035, 6), material);
      pad.position.set(point.x, .02, point.z);
      pad.receiveShadow = true;
      group.add(pad);
    }
    // One flat chevron batch per team: direction without new solid obstacles.
    const shape=new THREE.Shape();shape.moveTo(-.85,0);shape.lineTo(0,1);
    shape.lineTo(.85,0);shape.lineTo(.85,-.32);shape.lineTo(0,.62);
    shape.lineTo(-.85,-.32);shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
    const points=spawns.filter(spawn=>spawn.team===team);
    const guides=new THREE.InstancedMesh(geometry,material,points.length);
    const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion();
    points.forEach((point,index)=>{
      rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),point.z>0?0:Math.PI);
      matrix.compose(new THREE.Vector3(point.x,.045,point.z-Math.sign(point.z)*1.9),rotation,new THREE.Vector3(1,1,1));
      guides.setMatrixAt(index,matrix);
    });
    guides.name='spawn-directions';guides.receiveShadow=true;group.add(guides);
    scene.add(group);
  }
}
