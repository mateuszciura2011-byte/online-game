import { expect, it } from 'vitest';
import { GameRoom } from './GameRoom.js';
import { getMapDefinition } from '@polystrike/shared/maps';

it.each(['depot','crossroads','foundry','alleyways','citadel','canal'])('%s spawns face the playable arena and the objective is not inside a wall', mapId => {
  const room = new GameRoom(); room.onCreate({mapId,mode:'payload'});
  const internal = room as unknown as {
    beginPlaying(now:number):void;
    players:Map<string,{yaw:number;state:{x:number;z:number}}>;
    payloadRound:{snapshot(now:number):{position:[number,number]}};
  };
  internal.beginPlaying(Date.now());
  for (const player of internal.players.values()) {
    const {x,z}=player.state;
    expect((Math.sin(player.yaw)*x+Math.cos(player.yaw)*z)/Math.hypot(x,z)).toBeCloseTo(1);
  }
  const map=getMapDefinition(mapId);
  expect(map.colliders.some(c => -48 >= c.minX-1.1 && -48 <= c.maxX+1.1 && -36 >= c.minZ-1.1 && -36 <= c.maxZ+1.1)).toBe(false);
});
