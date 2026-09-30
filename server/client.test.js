import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('loads Three.js before creating the game renderer', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(source, /^import \* as THREE from '\/vendor\/three\.module\.js';/);
});
