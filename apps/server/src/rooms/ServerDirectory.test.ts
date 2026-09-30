import { describe, expect, it } from 'vitest';
import { ServerDirectory } from './ServerDirectory.js';
describe('server directory', () => { it('hides private server from public list', () => { const directory = new ServerDirectory(); directory.add({ roomId: 'a', name: 'Public', mode: 'free_for_all', players: 1, maxPlayers: 10, isPrivate: false }); directory.add({ roomId: 'b', name: 'Private', mode: 'free_for_all', players: 1, maxPlayers: 10, isPrivate: true, code: 'SECRET' }); expect(directory.listPublic()).toHaveLength(1); expect(directory.byCode('SECRET')?.roomId).toBe('b'); }); });
