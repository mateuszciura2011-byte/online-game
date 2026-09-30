import {expect,it} from 'vitest';
import {scoreboardMarkup} from './Scoreboard.js';
it('groups teams, sorts scores and marks the local player without interpreting names as HTML',()=>{
  const html=scoreboardMarkup([{id:'a',score:1},{id:'b',score:9},{id:'c',score:5}],new Map([['a','<img src=x>'],['b','Beta'],['c','Gamma']]),new Map([['a','blue'],['b','blue'],['c','red']]),'a',false);
  expect(html).toContain('NIEBIESCY');expect(html).toContain('CZERWONI');
  expect(html.indexOf('Beta')).toBeLessThan(html.indexOf('&lt;img'));
  expect(html).not.toContain('<img');expect(html).toContain('TY');
});
it('does not show team groups in free for all',()=>{
  expect(scoreboardMarkup([{id:'a',score:1}],new Map(),new Map([['a','blue']]),'a',true)).not.toContain('NIEBIESCY');
});
