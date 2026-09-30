import { describe, expect, it } from 'vitest';
import { sampleSnapshot } from './SnapshotBuffer.js';

it('uses the latest update when multiple packets share the render timestamp', () => {
  const a = { serverTime: 100, position: [1,0,2] as [number,number,number], yaw: 0, pitch: 0, alive: true, health: 100 };
  const b = { ...a, position: [2,0,3] as [number,number,number], health: 60 };
  expect(sampleSnapshot([a,b], 100)).toMatchObject({ position: [2,0,3], health: 60, yaw: 0 });
});

it('does not interpolate a live player across a round spawn reset', () => {
  const a = { serverTime: 0, position: [15,0,12] as [number,number,number], yaw: 1, pitch: .2, alive: true, continuityKey: '1:finished' };
  const b = { ...a, serverTime: 100, position: [-15,0,-12] as [number,number,number], yaw: 0, pitch: 0, continuityKey: '2:lobby' };
  expect(sampleSnapshot([a,b], 50)).toMatchObject({ position: [15,0,12], yaw: 1, pitch: .2 });
  expect(sampleSnapshot([a,b], 100)).toMatchObject({ position: [-15,0,-12], continuityKey: '2:lobby' });
});

it('holds the old pose until the respawn timestamp', () => {
  const a = { serverTime: 0, position: [8,0,4] as [number,number,number], yaw: 1, pitch: 0, alive: false, health: 0 };
  const b = { ...a, serverTime: 100, position: [-8,0,-4] as [number,number,number], alive: true, health: 100 };
  expect(sampleSnapshot([a,b], 50)).toMatchObject({ position: [8,0,4], alive: false });
  expect(sampleSnapshot([a,b], 100)).toMatchObject({ position: [-8,0,-4], alive: true, health: 100 });
});

it('preserves discrete health and alive state until the next server timestamp', () => {
  const a = { serverTime: 0, position: [0,0,0] as [number,number,number], yaw: 0, pitch: 0, alive: true, health: 25 };
  const b = { ...a, serverTime: 100, alive: false, health: 0 };
  expect(sampleSnapshot([a,b], 75)).toMatchObject({ health: 25, alive: true });
  expect(sampleSnapshot([a,b], 100)).toMatchObject({ health: 0, alive: false });
});

it('turns across the angle boundary by the shortest arc', () => {
  const a = { serverTime: 0, position: [0,0,0] as [number,number,number], yaw: Math.PI - .1, pitch: 0, alive: true };
  const b = { ...a, serverTime: 100, yaw: -Math.PI + .1 };
  expect(Math.abs(sampleSnapshot([a,b], 50)!.yaw)).toBeCloseTo(Math.PI);
});
describe('snapshot interpolation', () => { it('samples halfway between snapshots', () => { const snapshot = sampleSnapshot([{ serverTime: 0, position: [0, 0, 0], yaw: 0, pitch: 0, alive: true }, { serverTime: 100, position: [10, 0, 0], yaw: 1, pitch: 0, alive: true }], 50); expect(snapshot?.position[0]).toBe(5); }); });
