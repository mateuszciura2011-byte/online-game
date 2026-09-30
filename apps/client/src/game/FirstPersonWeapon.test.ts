import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { FirstPersonWeapon, weaponVisualProfile } from './FirstPersonWeapon.js';

describe('first person weapon', () => {
  it('moves the shotgun pump and its gripping hand together after firing',()=>{
    const weapon=new FirstPersonWeapon(new THREE.PerspectiveCamera());weapon.equip('shotgun');
    const pump=weapon.group.getObjectByName('pump')!,hand=weapon.group.getObjectByName('support-hand')!;
    const start=pump.position.z,gap=hand.position.z-pump.position.z;
    weapon.fire();weapon.update(.12);
    expect(pump.position.z).toBeGreaterThan(start+.08);
    expect(hand.position.z-pump.position.z).toBeCloseTo(gap);
    weapon.update(1);expect(pump.position.z).toBeCloseTo(start);
  });
  it('removes a pistol magazine during reload and restores it when cancelled',()=>{
    const weapon=new FirstPersonWeapon(new THREE.PerspectiveCamera());
    const magazine=weapon.group.getObjectByName('magazine');expect(magazine).toBeDefined();
    const start=magazine!.position.clone();
    weapon.setReloadProgress(.5);weapon.update(0);expect(magazine!.position.y).toBeLessThan(start.y-.3);
    weapon.setReloadProgress(0);weapon.update(0);expect(magazine!.position.distanceTo(start)).toBeLessThan(.00001);
  });
  it('finishes reload with a gentle motion rather than a sudden stop',()=>{
    const weapon=new FirstPersonWeapon(new THREE.PerspectiveCamera());weapon.equip('rifle');
    weapon.setReloadProgress(1);weapon.update(0);const end=weapon.group.position.y;
    weapon.setReloadProgress(.999);weapon.update(0);
    expect(Math.abs(weapon.group.position.y-end)).toBeLessThan(.00001);
  });
  it('moves the magazine and support hand during reload, then restores their grip',()=>{
    const weapon=new FirstPersonWeapon(new THREE.PerspectiveCamera()); weapon.equip('rifle');
    const magazine=weapon.group.getObjectByName('magazine')!,hand=weapon.group.getObjectByName('support-hand')!;
    const original=magazine.position.clone(),grip=hand.position.clone();
    weapon.setReloadProgress(.5);weapon.update(0);
    expect(magazine.position.y).toBeLessThan(original.y-.15);
    expect(hand.position.distanceTo(grip)).toBeGreaterThan(.1);
    weapon.setReloadProgress(0);weapon.update(0);
    expect(magazine.position.distanceTo(original)).toBeLessThan(.00001);
    expect(hand.position.distanceTo(grip)).toBeLessThan(.00001);
  });
  it('cycles the pistol slide without moving the barrel and recovers after the shot',()=>{
    const weapon=new FirstPersonWeapon(new THREE.PerspectiveCamera());
    const body=weapon.group.getObjectByName('body')!,barrel=weapon.group.getObjectByName('barrel')!;
    const slideZ=body.position.z,barrelZ=barrel.position.z;
    weapon.fire();weapon.update(0);
    expect(body.position.z).toBeGreaterThan(slideZ+.02);
    expect(barrel.position.z).toBe(barrelZ);
    weapon.update(1);expect(body.position.z).toBeCloseTo(slideZ);
  });
  it('keeps gripping hands attached when firing and switching weapons',()=>{
    const weapon=new FirstPersonWeapon(new THREE.PerspectiveCamera());
    for(const id of ['pistol','rifle','sniper','shotgun','smg','knife'] as const) {
      weapon.equip(id); weapon.fire(); weapon.update(.01);
      const hand=weapon.group.getObjectByName('trigger-hand');
      expect(hand?.parent).toBe(weapon.group);
      const bounds=new THREE.Box3().setFromObject(hand!);
      expect(bounds.isEmpty()).toBe(false);
      expect(bounds.getSize(new THREE.Vector3()).length()).toBeLessThan(.6);
    }
  });
  it('adds mechanical detail without moving the tracer origin away from the barrel tip', () => {
    const weapon=new FirstPersonWeapon(new THREE.PerspectiveCamera());
    for(const id of ['pistol','smg','rifle','sniper','shotgun'] as const) {
      weapon.equip(id);
      expect(weapon.group.getObjectByName('trigger-guard')).toBeDefined();
      expect(weapon.group.getObjectByName('ejection-port')).toBeDefined();
      const barrel=weapon.group.getObjectByName('barrel') as THREE.Mesh;
      barrel.geometry.computeBoundingBox();
      const expected=weapon.group.localToWorld(new THREE.Vector3(0,.08,barrel.position.z+barrel.geometry.boundingBox!.min.z));
      expect(weapon.muzzleWorldPosition(new THREE.Vector3()).distanceTo(expected)).toBeLessThan(.00001);
    }
  });
  it('gives a sniper shot more kick than a submachine gun shot', () => {
    const weapon = new FirstPersonWeapon(new THREE.PerspectiveCamera());
    weapon.equip('smg'); weapon.fire(); weapon.update(0); const smg = weapon.group.position.z;
    weapon.equip('sniper'); weapon.fire(); weapon.update(0);
    expect(weapon.group.position.z).toBeGreaterThan(smg);
  });
  it('sets knife scale independently of the previously held weapon', () => {
    const weapon = new FirstPersonWeapon(new THREE.PerspectiveCamera());
    weapon.equip('sniper'); weapon.equip('knife'); const afterSniper = weapon.group.scale.x;
    weapon.equip('pistol'); weapon.equip('knife');
    expect(weapon.group.scale.x).toBe(afterSniper);
  });
  it('releases obsolete geometry when switching weapons', () => {
    const weapon = new FirstPersonWeapon(new THREE.PerspectiveCamera());
    const geometry = (weapon.group.children[0] as THREE.Mesh).geometry;
    const released = vi.fn(); geometry.addEventListener('dispose', released);
    weapon.equip('rifle');
    expect(released).toHaveBeenCalledOnce();
  });
  it('gives the rifle a visible body, barrel and muzzle position', () => {
    expect(weaponVisualProfile('rifle')).toMatchObject({
      name: 'KARABIN',
      parts: expect.arrayContaining(['body', 'barrel', 'stock']),
      muzzleZ: expect.any(Number),
    });
  });

  it('adds a short sideways kick when firing so recoil is visible', () => {
    const weapon = new FirstPersonWeapon(new THREE.PerspectiveCamera());
    weapon.fire();
    weapon.update(0);
    expect(weapon.group.rotation.z).toBeLessThan(-.04);
    weapon.update(1);
    expect(weapon.group.rotation.z).toBeCloseTo(-.04);
  });

  it('exposes the pistol muzzle in world space so tracers start at the barrel', () => {
    const camera = new THREE.PerspectiveCamera();
    const weapon = new FirstPersonWeapon(camera);
    camera.updateMatrixWorld(true);

    expect(weapon.muzzleWorldPosition(new THREE.Vector3()).z).toBeLessThan(-1);
  });
});
