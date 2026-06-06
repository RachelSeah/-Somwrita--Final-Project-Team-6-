// js/sketch.js
// ─────────────────────────────────────────────────────────────
// MAIN ENTRY POINT — brings all mechanics together.
// Do not add mechanic code here. Each mechanic has its own file:
//
//   scene.js          — loads and stacks all SVG layers
//   time-based.js     — day/night cycle, sun, moon, clouds
//   bird-mechanic.js  — birds flying across the scene
//   perlin-layer.js   — perlin noise on trees/bushes (Person B)
//   input-controls.js — click, hover, drag interactions (Person C)
//   audio-mechanic.js — ambient sound and effects (Person A)
//   state.js          — shared variables, read by all modules
// ─────────────────────────────────────────────────────────────

import { buildScene }    from './scene.js';
import { initTimeBased } from './time-based.js';
import './perlin-layer.js';
import './input-controls.js';
import './audio-mechanic.js';

// 1. Build the scene first
const scene = document.getElementById('scene');
await buildScene(scene);

// 2. Start all mechanics
initTimeBased();

// 3. Signal other modules that scene is ready
window.dispatchEvent(new Event('scene-ready'));
