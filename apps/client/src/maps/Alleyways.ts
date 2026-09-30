import * as THREE from 'three';
import { buildTacticalArena } from './TacticalArena.js';
export function buildAlleyways(scene: THREE.Object3D) { buildTacticalArena(scene, 'alleyways'); }
