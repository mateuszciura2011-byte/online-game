import { expect, it } from 'vitest';
import { getMapDefinition } from '@polystrike/shared/maps';
import { nextWaypoint } from '../bots/Navigation.js';
import { simulatePlayer } from './World.js';

it.each(['depot','crossroads','foundry','alleyways','citadel','canal'])('%s has routes between every spawn and blocks high-speed wall crossings', id => {
  const map = getMapDefinition(id);
  for (const spawn of map.spawns) {
    const target = map.spawns.find(p => p.team !== spawn.team)!;
    expect(nextWaypoint(spawn,target,map.colliders)).toBeDefined();
  }
  for (const c of map.colliders) {
    const state = { x:c.minX-2,y:0,z:(c.minZ+c.maxZ)/2,verticalVelocity:0,grounded:true };
    const next = simulatePlayer(state,{sequence:1,clientTime:0,moveX:1,moveZ:0,yaw:0,pitch:0,jump:false,sprint:true},5,map.colliders);
    expect(next.x).toBe(state.x);
  }
});
