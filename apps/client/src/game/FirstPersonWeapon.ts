import * as THREE from 'three';
import type { WeaponId } from '@polystrike/shared/weapons';
import { barrelGeometry, chamferBox, profilePrism } from './ModelGeometry.js';

type VisualProfile = { name: string; color: string; parts: string[]; muzzleZ: number; scale: number };

const profiles: Record<WeaponId, VisualProfile> = {
  knife: { name: 'NÓŻ', color: '#d5ecff', parts: ['handle', 'blade'], muzzleZ: -.9, scale: .72 },
  pistol: { name: 'PISTOLET', color: '#93a7ba', parts: ['body', 'barrel', 'grip'], muzzleZ: -1.02, scale: .8 },
  smg: { name: 'PISTOLET MASZYNOWY', color: '#4c6576', parts: ['body', 'barrel', 'stock', 'magazine'], muzzleZ: -1.32, scale: .92 },
  rifle: { name: 'KARABIN', color: '#557184', parts: ['body', 'barrel', 'stock', 'magazine'], muzzleZ: -1.54, scale: 1 },
  sniper: { name: 'SNAJPERKA', color: '#3d5669', parts: ['body', 'barrel', 'stock', 'scope'], muzzleZ: -1.86, scale: 1.08 },
  shotgun: { name: 'STRZELBA', color: '#795a42', parts: ['body', 'barrel', 'stock', 'pump'], muzzleZ: -1.72, scale: 1.02 },
};

export function weaponVisualProfile(weaponId: WeaponId) { return profiles[weaponId]; }

export class FirstPersonWeapon {
  readonly group = new THREE.Group();
  private recoil = 0;
  private reloadProgress = 0;
  private weaponId: WeaponId = 'pistol';
  private shotElapsed = 1;
  private animatedParts: {part:THREE.Object3D;rest:THREE.Vector3;kind:'magazine'|'support'|'slide'|'pump'}[]=[];

  constructor(camera: THREE.Camera) {
    this.group.position.set(.36, -.38, -.95);
    this.group.rotation.set(-.16, -.34, -.04);
    camera.add(this.group);
    this.equip('pistol');
  }

  equip(weaponId: WeaponId) {
    this.weaponId = weaponId;
    this.animatedParts=[];
    const materials = new Set<THREE.Material>();
    this.group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      }
    });
    materials.forEach(material => material.dispose());
    this.group.clear();
    const profile = weaponVisualProfile(weaponId);
    this.group.scale.setScalar(profile.scale * .65);
    this.recoil = 0;
    this.reloadProgress = 0;
    this.shotElapsed = 1;
    const material = new THREE.MeshStandardMaterial({ color: profile.color, roughness: .55, metalness: .42 });
    const glow = new THREE.MeshStandardMaterial({ color: '#31d8ff', emissive: '#0d7f9e', emissiveIntensity: 1.2 });
    const add = (name: string, size: [number, number, number], position: [number, number, number], accent = false) => {
      const part = new THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>(chamferBox(...size), accent ? glow : material);
      part.name = name; part.position.set(...position); this.group.add(part); return part;
    };
    const gloveMaterial=new THREE.MeshStandardMaterial({color:'#293e49',roughness:.96,flatShading:true});
    const sleeveMaterial=new THREE.MeshStandardMaterial({color:'#607a80',roughness:.9,flatShading:true});
    const hand=(name:string,x:number,y:number,z:number)=>{
      const palm=add(name,[.25,.22,.25],[x,y,z]); palm.material=gloveMaterial;
      const thumb=add(name+'-thumb',[.1,.14,.16],[x-.12,y+.05,z-.04]); thumb.material=gloveMaterial;
      const sleeve=add(name+'-sleeve',[.25,.25,.43],[x+.035,y-.09,z+.27]); sleeve.material=sleeveMaterial; sleeve.rotation.x=-.3;
      for(let i=0;i<3;i++) {
        const finger=add(name+'-finger-'+i,[.07,.045,.24],[x+.11,y-.065+i*.065,z-.025]);
        finger.material=gloveMaterial;
      }
    };
    hand('trigger-hand',.03,weaponId==='knife'?-.1:-.23,-.12);
    if (weaponId === 'knife') {
      const handle=add('handle', [.16, .18, .52], [0, -.04, -.28]);handle.material=gloveMaterial;
      const blade=add('blade',[.16,.035,.76],[0,.055,-.82]);
      blade.geometry.dispose();
      blade.geometry=profilePrism([[-.09,.3],[.09,.3],[.09,-.12],[0,-.46],[-.055,-.23]],.035).rotateX(Math.PI/2);
      blade.material=new THREE.MeshStandardMaterial({color:'#cad5dc',metalness:.8,roughness:.3,flatShading:true});
      add('knife-guard',[.28,.08,.07],[0,.025,-.52]);
      for(let i=0;i<4;i++)add('handle-wrap-'+i,[.175,.19,.025],[0,-.04,-.12-i*.095]).material=sleeveMaterial;
      return;
    }
    if(weaponId!=='pistol') hand('support-hand',-.16,-.13,-.84);
    const receiverSizes:Record<string,[number,number,number]>={pistol:[.28,.2,.69],smg:[.3,.26,.65],rifle:[.32,.25,.86],sniper:[.24,.18,.94],shotgun:[.27,.23,.76]};
    add('body', receiverSizes[weaponId]!, [0, .03, -.36]);
    const barrel=add('barrel', [.13, .12, weaponId === 'pistol' ? .55 : weaponId === 'sniper' ? 1.25 : .86], [0, .08, profile.muzzleZ + .32]);
    const length=weaponId==='pistol'?.55:weaponId==='sniper'?1.25:.86;
    barrel.geometry.dispose();barrel.geometry=barrelGeometry(weaponId==='shotgun'?.078:.055,length);
    add('sight-front', [.05, .055, .07], [0, .2, -.64], true);
    add('sight-rear', [.12, .065, .05], [0, .2, -.12]);
    add('receiver-accent', [.345, .035, .34], [0, .04, -.3], true);
    if (weaponId !== 'pistol') {
      add('handguard', [.25, .2, .36], [0, .02, -.91]);
      for (let rib = 0; rib < 4; rib++) add(`handguard-rib-${rib}`, [.28, .23, .025], [0, .02, -.78 - rib * .085]);
    }
    add('grip', [.2, .36, .22], [0, -.25, -.16]);
    if (profile.parts.includes('stock')) {
      const stock=add('stock', [weaponId==='sniper'?.24:.2, weaponId==='smg'?.09:.24, .44], [0, -.055, .12]);
      if(weaponId==='shotgun')stock.material=sleeveMaterial;
    }
    if (profile.parts.includes('magazine')) {
      const magazine=add('magazine', [.17, weaponId==='smg'?.48:.36, weaponId==='smg'?.14:.24], [0, -.25, -.4]);
      magazine.rotation.x=weaponId==='rifle'?-.22:.06;
    }
    if (weaponId==='pistol') add('magazine',[.15,.17,.18],[0,-.37,-.16]);
    if (profile.parts.includes('scope')) add('scope', [.15, .14, .48], [0, .24, -.42], true);
    if (profile.parts.includes('pump')) add('pump', [.24, .18, .42], [0, -.12, -.72], true);
    const rubber = new THREE.MeshStandardMaterial({color:'#192b35',roughness:.94});
    const steel = new THREE.MeshStandardMaterial({color:'#b6c4cc',roughness:.32,metalness:.7});
    barrel.material=steel;
    const detail=(name:string,size:[number,number,number],position:[number,number,number],metal=false)=>{
      const part=add(name,size,position); part.material=metal?steel:rubber; return part;
    };
    detail('ejection-port',[.015,.09,.2],[receiverSizes[weaponId]![0]/2+.004,.08,-.33]);
    detail('trigger-guard',[.12,.035,.29],[0,-.26,-.39]);
    detail('trigger-guard-front',[.12,.15,.035],[0,-.2,-.52]);
    detail('trigger',[.04,.13,.035],[0,-.17,-.31],true).rotation.x=-.3;
    detail('grip-insert',[.207,.24,.12],[0,-.27,-.13]);
    if(weaponId==='pistol') {
      for(let i=0;i<5;i++) detail('slide-groove-'+i,[.35,.11,.016],[0,.08,-.08-i*.035]);
    } else {
      detail('stock-pad',[.22,.24,.045],[0,-.055,.3625]);
      for(let i=0;i<6;i++) detail('rail-'+i,[.18,.04,.035],[0,.17,-.25-i*.09]);
      detail('charging-handle',[.14,.06,.055],[.2,.1,-.23],true);
    }
    if(weaponId==='sniper') {
      const scope=this.group.getObjectByName('scope') as THREE.Mesh;
      scope.material=rubber;scope.geometry.dispose();scope.geometry=barrelGeometry(.105,.5);
      const lens=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.07,10),steel);
      lens.rotation.x=Math.PI/2; lens.position.set(0,.24,-.67); lens.name='scope-objective'; this.group.add(lens);
      detail('scope-mount',[.19,.1,.08],[0,.17,-.3]);
      detail('bolt-handle',[.22,.04,.055],[.2,.065,-.19],true);
    }
    if(weaponId==='shotgun') {
      const pump=this.group.getObjectByName('pump') as THREE.Mesh; pump.material=rubber;
      for(let i=0;i<5;i++) detail('pump-rib-'+i,[.26,.2,.025],[0,-.12,-.55-i*.07]);
      const tube=detail('shell-tube',[.11,.11,.95],[0,-.055,-1.06],true);
      tube.geometry.dispose();tube.geometry=barrelGeometry(.045,.95);
    }
    this.group.scale.setScalar(profile.scale * .65);
    this.group.traverse(part=>{
      const kind=part.name==='magazine'?'magazine':part.name.startsWith('support-hand')?'support':part.name==='pump'||part.name.startsWith('pump-rib-')?'pump':
        weaponId==='pistol'&&(part.name==='body'||part.name.startsWith('sight-')||part.name.startsWith('slide-groove')||part.name==='ejection-port'||part.name==='receiver-accent')?'slide':undefined;
      if(kind)this.animatedParts.push({part,rest:part.position.clone(),kind});
    });
  }

  fire() { this.shotElapsed=0;this.recoil = { knife: .06, pistol: .12, smg: .075, rifle: .14, sniper: .23, shotgun: .21 }[this.weaponId]; }
  setReloadProgress(progress: number) { this.reloadProgress = Math.max(0, Math.min(1, progress)); }
  update(deltaSeconds: number) {
    const dt=Math.max(0,Number.isFinite(deltaSeconds)?deltaSeconds:0);
    this.shotElapsed+=dt;
    this.recoil *= Math.exp(-18*dt);
    if(this.recoil<.00001)this.recoil=0;
    const lowering = Math.sin(this.reloadProgress * Math.PI)**2;
    const cycle=this.weaponId==='shotgun'?Math.sin(Math.PI*Math.min(1,this.shotElapsed/.32))**2*.22:0;
    this.group.position.z = -.95 + this.recoil;
    this.group.position.y = -.38 - lowering * .23;
    this.group.rotation.x = -.16 - this.recoil * .8 + lowering * .35;
    this.group.rotation.z = -.04 - this.recoil * .35 - lowering * .28;
    for(const {part,rest,kind} of this.animatedParts) {
      part.position.copy(rest);
      if(kind==='magazine')part.position.y-=lowering*.42;
      if(kind==='support') {part.position.y-=lowering*.35;part.position.z+=lowering*.22+cycle;}
      if(kind==='pump')part.position.z+=cycle;
      if(kind==='slide')part.position.z+=this.recoil*.7;
    }
  }
  muzzleWorldPosition(target: THREE.Vector3) {
    this.group.updateWorldMatrix(true, false);
    const barrel = this.group.getObjectByName('barrel') as THREE.Mesh | undefined;
    barrel?.geometry.computeBoundingBox();
    const tip = barrel ? barrel.position.z + barrel.geometry.boundingBox!.min.z : this.muzzleZ;
    return this.group.localToWorld(target.set(0, .08, tip));
  }
  get muzzleZ() { return weaponVisualProfile(this.weaponId).muzzleZ; }
  get name() { return weaponVisualProfile(this.weaponId).name; }
}
