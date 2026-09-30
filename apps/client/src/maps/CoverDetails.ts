import * as THREE from 'three';

/** Thin panels follow authored cover dimensions, without changing navigation. */
export function addCoverDetails(root: THREE.Group, mapId: string) {
  if (mapId === 'depot') return; // Depot owns its cargo-panel kit.
  const frame = new THREE.MeshStandardMaterial({ color: '#243b49', roughness: .72, metalness: .35 });
  const accent = new THREE.MeshStandardMaterial({ color: mapId === 'alleyways' ? '#d69feb' : mapId === 'canal' ? '#d9bf70' : '#91abb7', roughness: .65 });
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const group = new THREE.Group(); group.name = 'cover-detail-kit';
  const add = (x: number, y: number, z: number, width: number, height: number, depth: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(unit, material); mesh.position.set(x,y,z); mesh.scale.set(width,height,depth); group.add(mesh);
  };
  for (const cover of root.children) {
    if (!(cover instanceof THREE.Mesh) || !cover.name.endsWith('-cover') || !(cover.geometry instanceof THREE.BoxGeometry)) continue;
    const { width, height, depth } = cover.geometry.parameters;
    const { x, y, z } = cover.position;
    for (const side of [-1, 1]) {
      const face = z + side * (depth / 2 + .012);
      add(x,y - height / 2 + .14,face,width,.22,.035,frame);
      add(x,y + height / 2 - .14,face,width,.22,.035,frame);
      for (const edge of [-1, 1]) add(x + edge * (width / 2 - .12),y,face,.16,height,.035,frame);
      add(x + width * .25,y + height * .2,face + side * .018,Math.min(.8,width * .2),.23,.035,accent);
    }
  }
  if (group.children.length) root.add(group);
  else { unit.dispose(); frame.dispose(); accent.dispose(); }
}
