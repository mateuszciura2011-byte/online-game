import {InstancedMesh,Mesh,type Object3D,type BufferGeometry,type Material} from 'three';

/** Clears resources owned exclusively by a generated map. */
export function disposeMap(root:Object3D) {
  const geometries=new Set<BufferGeometry>(),materials=new Set<Material>();
  root.traverse(object=>{
    if(!(object instanceof Mesh)) return;
    // Geometry disposal alone does not release per-instance GPU attributes.
    if(object instanceof InstancedMesh) object.dispose();
    geometries.add(object.geometry);
    for(const material of Array.isArray(object.material)?object.material:[object.material]) materials.add(material);
  });
  geometries.forEach(geometry=>geometry.dispose());
  materials.forEach(material=>material.dispose());
  root.clear();
}
