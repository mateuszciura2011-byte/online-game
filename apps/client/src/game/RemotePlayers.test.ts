import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RemotePlayers, characterVariantFor } from './RemotePlayers.js';

describe('RemotePlayers', () => {
  it('faces armour and team identification in the same direction as its weapon', () => {
    const scene = new THREE.Scene(); const players = new RemotePlayers(scene);
    players.push('bot-1', { position: [0,0,0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });
    const model = scene.children[0]!;
    expect(model.getObjectByName('armour-plate')!.position.z).toBeLessThan(0);
    expect(model.getObjectByName('team-marker')!.position.z).toBeLessThan(0);
  });
  it('builds a readable low-poly character instead of a single cylinder', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('bot-1', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });
    expect(scene.children[0]?.children.length).toBeGreaterThan(2);
    expect(scene.children[0]?.getObjectByName('left-boot')?.parent?.name).toBe('left-leg');
    expect(scene.children[0]?.getObjectByName('right-glove')).toBeDefined();
    const model=scene.children[0]!;
    const gun=model.getObjectByName('held-weapon')!;
    const left=model.getObjectByName('left-glove')!;
    const right=model.getObjectByName('right-glove')!;
    expect(left.position.distanceTo(gun.position)).toBeLessThan(.4);
    expect(right.position.distanceTo(gun.position)).toBeLessThan(.4);
    const armour=new THREE.Box3().setFromObject(model.getObjectByName('armour-plate')!);
    const torso=new THREE.Box3().setFromObject(model.getObjectByName('skin-body')!);
    expect(armour.intersectsBox(torso)).toBe(true);
  });

  it('keeps team colours on compact patches instead of turning the enemy torso into a pink hitbox', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('enemy', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });
    players.setTeam('enemy', 'red');

    const colors = scene.children[0]!.children
      .map((child) => (child as THREE.Mesh).material)
      .filter((value): value is THREE.MeshStandardMaterial => value instanceof THREE.MeshStandardMaterial)
      .map((value) => value.color.getHexString());

    expect(colors).toContain('c33163');
    const patches=scene.children[0]!.children.filter(child=>{
      const material=(child as THREE.Mesh).material;
      return material instanceof THREE.MeshStandardMaterial&&material.color.getHexString()==='c33163';
    });
    for(const patch of patches) {
      const size=new THREE.Box3().setFromObject(patch).getSize(new THREE.Vector3());
      expect(size.x).toBeLessThan(.5);expect(size.y).toBeLessThan(.25);expect(size.z).toBeLessThan(.3);
    }
    expect(colors).toContain('425b6e');
  });

  it('shows the team colour on the overhead status bar', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('ally', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });
    players.setTeam('ally', 'blue');

    const healthBar = scene.children[0]!.children.find((child) => (child as THREE.Mesh).geometry?.type === 'PlaneGeometry') as THREE.Mesh;
    expect((healthBar.material as THREE.MeshBasicMaterial).color.getHexString()).toBe('247fc2');
  });

  it('keeps team colour on compact markers without a large overhead triangle', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('ally', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });
    players.setTeam('ally', 'ally');

    expect(scene.children[0]!.getObjectByName('team-chevron')).toBeUndefined();
    const marker = scene.children[0]!.getObjectByName('team-marker') as THREE.Mesh;
    expect((marker.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('247fc2');
  });

  it('adds an armour plate and held weapon to the readable character silhouette', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('bot-2', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });

    const names = scene.children[0]!.children.map((child) => child.name);
    expect(names).toEqual(expect.arrayContaining(['armour-plate', 'held-weapon']));
  });

  it('gives every remote soldier a readable weapon assembly and utility belt', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('bot-2', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });

    const names = scene.children[0]!.children.map((child) => child.name);
    expect(names).toEqual(expect.arrayContaining(['weapon-stock', 'weapon-magazine', 'utility-belt']));
  });

  it('animates a clear alternating step when a remote player moves', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('runner', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });
    players.push('runner', { position: [1, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 100, alive: true });

    players.render(150);

    const leftLeg = scene.children[0]!.getObjectByName('left-leg')!;
    const rightLeg = scene.children[0]!.getObjectByName('right-leg')!;
    expect(Math.abs(leftLeg.rotation.x)).toBeGreaterThan(0);
    expect(leftLeg.rotation.x).toBeCloseTo(-rightLeg.rotation.x);
  });

  it('assigns stable, varied low-poly character archetypes to players', () => {
    const variants = new Set(['bot-1', 'bot-2', 'bot-3', 'bot-4', 'bot-5', 'bot-6'].map(characterVariantFor));
    expect(variants.size).toBeGreaterThan(1);
    expect(characterVariantFor('bot-3')).toBe(characterVariantFor('bot-3'));
  });

  it('adds a visible archetype part to each remote player model', () => {
    const scene = new THREE.Scene();
    const players = new RemotePlayers(scene);
    players.push('bot-3', { position: [0, 0, 0], yaw: 0, pitch: 0, health: 100, serverTime: 0, alive: true });

    expect(scene.children[0]!.children.some((child) => child.name.startsWith('archetype-'))).toBe(true);
  });
});
