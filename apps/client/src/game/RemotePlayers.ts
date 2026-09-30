import * as THREE from 'three';
import { sampleSnapshot, type PlayerSnapshot } from './SnapshotBuffer.js';
import { barrelGeometry, chamferBox } from './ModelGeometry.js';

type View = { mesh: THREE.Group; teamMarker: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>; health: THREE.Mesh; leftLeg: THREE.Mesh; rightLeg: THREE.Mesh; snapshots: PlayerSnapshot[] };
const material = (color: string) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .78 });
export type CharacterVariant = 'scout' | 'assault' | 'heavy';
const variants: readonly CharacterVariant[] = ['scout', 'assault', 'heavy'];

export function characterVariantFor(id: string): CharacterVariant {
  const value = [...id].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return variants[value % variants.length]!;
}

function createCharacter(variant: CharacterVariant) {
  const mesh = new THREE.Group();
  const torsoGeometry = chamferBox(.78, 1.05, .62);
  const positions=torsoGeometry.attributes.position!;
  for(let i=0;i<positions.count;i++) if(positions.getY(i)<0) positions.setX(i,positions.getX(i)*.76);
  torsoGeometry.computeVertexNormals();
  const body = new THREE.Mesh(torsoGeometry, material('#425b6e'));
  body.name = 'skin-body';
  body.position.y = .88;
  const armourPlate = new THREE.Mesh(chamferBox(.64, .58, .09,.09), material('#183347'));
  armourPlate.name = 'armour-plate';
  armourPlate.position.set(0, .96, -.33);
  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(.33, 0), material('#f4c9a9'));
  head.position.y = 1.68;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.37, 8, 4, 0, Math.PI*2, 0, Math.PI/2), material('#152c3d'));
  helmet.name = 'skin-helmet';
  helmet.position.y = 1.78;
  const limb=(name:string,from:THREE.Vector3,to:THREE.Vector3)=>{
    const arm=new THREE.Mesh(chamferBox(.17,from.distanceTo(to),.18),material('#243f52'));
    arm.name=name; arm.position.copy(from).add(to).multiplyScalar(.5);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize()); return arm;
  };
  const leftElbow=new THREE.Vector3(-.42,.92,-.17),rightElbow=new THREE.Vector3(.46,.91,-.12);
  const leftHand=new THREE.Vector3(.07,1.04,-.68),rightHand=new THREE.Vector3(.28,1.02,-.36);
  const leftArm=limb('left-upper-arm',new THREE.Vector3(-.43,1.24,0),leftElbow);
  const rightArm=limb('right-upper-arm',new THREE.Vector3(.43,1.24,0),rightElbow);
  const forearms=[limb('left-forearm',leftElbow,leftHand),limb('right-forearm',rightElbow,rightHand)];
  const heldWeapon = new THREE.Mesh(chamferBox(.16, .15, .72), material('#142633'));
  heldWeapon.name = 'held-weapon';
  heldWeapon.position.set(.22, 1.12, -.52);
  const weaponStock = new THREE.Mesh(chamferBox(.18, .2, .32), material('#263f50'));
  weaponStock.name = 'weapon-stock';
  weaponStock.position.set(.22, 1.12, -.05);
  const weaponMagazine = new THREE.Mesh(chamferBox(.13, .26, .16), material('#1a2e3e'));
  weaponMagazine.name = 'weapon-magazine';
  weaponMagazine.position.set(.22, .94, -.51);
  weaponMagazine.rotation.z = -.36;
  const utilityBelt = new THREE.Mesh(chamferBox(.78, .13, .54), material('#213b4d'));
  utilityBelt.name = 'utility-belt';
  utilityBelt.position.y = .54;
  const legGeometry = chamferBox(.2, .65, .22);
  const leftLeg = new THREE.Mesh(legGeometry, material('#182b3b'));
  leftLeg.name = 'left-leg';
  leftLeg.position.set(-.19, .32, 0);
  const rightLeg = leftLeg.clone(); rightLeg.name = 'right-leg'; rightLeg.position.x = .19;
  for(const [side,leg] of [['left',leftLeg],['right',rightLeg]] as const) {
    const boot=new THREE.Mesh(chamferBox(.25,.18,.36),material('#101f29'));
    boot.name=side+'-boot'; boot.position.set(0,-.23,-.06); leg.add(boot);
    const knee=new THREE.Mesh(chamferBox(.22,.18,.055),material('#61778b'));
    knee.name=side+'-knee'; knee.position.set(0,.06,-.13);leg.add(knee);
  }
  const gloves: THREE.Mesh[]=[];
  for(const side of [-1,1]) {
    const glove=new THREE.Mesh(chamferBox(.18,.2,.2),material('#152c3d'));
    glove.name=side<0?'left-glove':'right-glove'; glove.position.copy(side<0?leftHand:rightHand);gloves.push(glove);
    const pouch=new THREE.Mesh(chamferBox(.17,.25,.14),material('#667f86'));
    pouch.name='vest-pouch-'+side;pouch.position.set(side*.19,.85,-.43);gloves.push(pouch);
  }
  const teamMarker = new THREE.Mesh(new THREE.BoxGeometry(.24, .12, .24), material('#d5a132'));
  teamMarker.name = 'team-marker';
  teamMarker.position.set(0, 1.3, -.35);
  // Cosmetic armour must never obscure team identity from a flank or the rear.
  const teamPatches:THREE.Mesh[]=[];
  const shoulderEdge=variant==='assault'?.65:.535;
  for(const [name,x,y,z,w,h,d] of [
    ['back',0,1.29,variant==='heavy'?.525:.325,.48,.16,.035],
    ['left',-shoulderEdge,1.25,0,.035,.18,.24],
    ['right',shoulderEdge,1.25,0,.035,.18,.24],
  ] as const) {
    const patch=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),teamMarker.material);
    patch.name='team-patch-'+name;patch.position.set(x,y,z);teamPatches.push(patch);
  }
  const health = new THREE.Mesh(new THREE.PlaneGeometry(1, .09), new THREE.MeshBasicMaterial({ color: '#5dff8a', depthTest: false }));
  health.position.y = 2.28;
  const archetypeParts: THREE.Mesh[] = [];
  if (variant === 'scout') {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .12), material('#36d7ed'));
    visor.name = 'archetype-scout-visor'; visor.position.set(0, 1.72, -.29);
    const radio = new THREE.Mesh(new THREE.BoxGeometry(.22, .36, .15), material('#294e63'));
    radio.name = 'archetype-scout-radio'; radio.position.set(-.34, 1.17, -.31);
    archetypeParts.push(visor, radio);
  } else if (variant === 'assault') {
    const leftPad = new THREE.Mesh(new THREE.DodecahedronGeometry(.19, 0), material('#61778b'));
    leftPad.name = 'archetype-assault-left-pad'; leftPad.position.set(-.48, 1.23, 0);
    const rightPad = leftPad.clone(); rightPad.name = 'archetype-assault-right-pad'; rightPad.position.x = .48;
    archetypeParts.push(leftPad, rightPad);
  } else {
    const chest = new THREE.Mesh(chamferBox(.78, .7, .13,.1), material('#607687'));
    chest.name = 'archetype-heavy-chest'; chest.position.set(0, 1.0, -.35);
    const pack = new THREE.Mesh(chamferBox(.58, .62, .24,.09), material('#243a4a'));
    pack.name = 'archetype-heavy-pack'; pack.position.set(0, 1.1, .39);
    archetypeParts.push(chest, pack);
  }
  mesh.add(body, armourPlate, head, helmet, leftArm, rightArm, ...forearms, heldWeapon, weaponStock, weaponMagazine, utilityBelt, leftLeg, rightLeg, ...gloves, ...archetypeParts, teamMarker, ...teamPatches, health);
  // Cosmetic details do not enlarge server-owned bullet targets.
  const detail=(name:string,geometry:THREE.BufferGeometry,color:string,x:number,y:number,z:number)=>{
    const part=new THREE.Mesh(geometry,material(color));part.name='cosmetic-'+name;
    part.position.set(x,y,z);mesh.add(part);return part;
  };
  detail('weapon-barrel',barrelGeometry(.045,.32),'#889da6',.22,1.12,-.99);
  detail('weapon-sight',chamferBox(.08,.08,.12),'#92bec2',.22,1.23,-.6);
  detail('goggles',chamferBox(.48,.12,.08),'#2e4855',0,1.73,-.295);
  detail('face-mask',chamferBox(.31,.19,.1),'#566873',0,1.55,-.275);
  for(const side of [-1,1]) {
    detail('earcup-'+side,barrelGeometry(.09,.075),'#243f52',side*.32,1.73,0).rotation.y=Math.PI/2;
    detail('vest-strap-'+side,chamferBox(.08,.37,.04),'#a2ac9c',side*.23,1.23,-.337);
  }
  mesh.traverse((object) => {
    if (object instanceof THREE.Mesh && object !== health) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return { mesh, teamMarker, health, leftLeg, rightLeg };
}

export class RemotePlayers {
  private views = new Map<string, View>();
  private cameraRotation = new THREE.Quaternion();
  private parentRotation = new THREE.Quaternion();
  constructor(private scene: THREE.Scene) {}
  retain(ids: readonly string[]) {
    const active = new Set(ids);
    for (const [id, view] of this.views) {
      if (active.has(id)) continue;
      this.scene.remove(view.mesh);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      view.mesh.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(item => materials.add(item));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      this.views.delete(id);
    }
  }
  shotTargets() { return [...this.views.values()].filter(view => view.mesh.visible).flatMap(view => view.mesh.children.filter(child => child !== view.health && child !== view.teamMarker && !child.name.startsWith('team-patch-') && !child.name.startsWith('cosmetic-'))); }
  push(id: string, snapshot: PlayerSnapshot) { let view = this.views.get(id); if (!view) { const character = createCharacter(characterVariantFor(id)); this.scene.add(character.mesh); view = { ...character, snapshots: [] }; this.views.set(id, view); } view.snapshots.push(snapshot); view.snapshots.splice(0, Math.max(0, view.snapshots.length - 8)); }
  setTeam(id: string, team?: string) { const view = this.views.get(id); if (!view) return; const color = team === 'blue' || team === 'ally' ? '#247fc2' : team === 'red' || team === 'enemy' ? '#c33163' : '#d5a132'; view.teamMarker.material.color.set(color); (view.health.material as THREE.MeshBasicMaterial).color.set(color); }
  setSkin(id: string, skinId: string) {
    const view = this.views.get(id); if (!view) return;
    const palettes: Record<string, [string, string]> = { neon: ['#33284d', '#c651e3'], frost: ['#bacfdd', '#567d9d'], gold: ['#b98b38', '#3d3428'] };
    const palette = palettes[skinId];
    const colors: Record<string, string> = { 'skin-body': palette?.[0] ?? '#425b6e', 'armour-plate': palette?.[0] ?? '#183347', 'skin-helmet': palette?.[1] ?? '#152c3d' };
    for (const [name, color] of Object.entries(colors)) {
      const mesh = view.mesh.getObjectByName(name) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
      mesh.material.color.set(color);
    }
  }
  render(time: number, camera?: THREE.Camera) {
    if (camera) camera.getWorldQuaternion(this.cameraRotation);
    for (const view of this.views.values()) {
      const state = sampleSnapshot(view.snapshots, time - 100);
      if (!state) continue;
      view.mesh.visible = state.alive;
      view.mesh.position.set(...state.position);
      view.mesh.rotation.y = state.yaw;
      // Animate the displayed interpolation window, not newer network packets.
      const previous = sampleSnapshot(view.snapshots, time - 150);
      const moving = Boolean(state.alive && previous?.alive && state.continuityKey === previous.continuityKey && Math.hypot(state.position[0] - previous.position[0], state.position[2] - previous.position[2]) > .02);
      const step = moving ? Math.sin(time * .014) * .52 : 0;
      view.leftLeg.rotation.x = step;
      view.rightLeg.rotation.x = -step;
      const ratio = Math.max(0, Math.min(1, (state.health ?? 100) / 100));
      view.health.scale.x = ratio;
      // Cancel the soldier's rotation so the status bar follows the viewer.
      view.mesh.getWorldQuaternion(this.parentRotation).invert();
      view.health.quaternion.copy(this.parentRotation).multiply(this.cameraRotation);
      // Shrink toward the same left edge in the bar's own screen-aligned frame.
      view.health.position.set(-(1 - ratio) / 2, 0, 0).applyQuaternion(view.health.quaternion);
      view.health.position.y += 2.28;
    }
  }
}
