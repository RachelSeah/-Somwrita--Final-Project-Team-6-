// js/perlin-layer.js
// ─────────────────────────────────────────────────────────────
// PERLIN NOISE — Person B
// Use p5.js noise() to add organic movement to trees and clouds.
//
// ┌─────────────────────────────────────────────────────────┐
// │  HOW TO ADD PERLIN NOISE                                │
// │                                                         │
// │  p5.js is loaded globally — use noise() directly        │
// │                                                         │
// │  1. Listen for scene-ready event                        │
// │  2. Grab the layer you want to move                     │
// │  3. Use noise(t) to get a smooth 0–1 value              │
// │  4. Map it to a rotation or translation                  │
// │  5. Increment t each frame                              │
// │                                                         │
// │  EXAMPLE — tree sway:                                   │
// │  let t = 0;                                             │
// │  function sway() {                                      │
// │    const el = document.getElementById('layer-tree-1');  │
// │    const angle = (noise(t) - 0.5) * 6;                 │
// │    el.style.transformOrigin = 'bottom center';          │
// │    el.style.transform = `rotate(${angle}deg)`;          │
// │    t += 0.003;                                          │
// │    requestAnimationFrame(sway);                         │
// │  }                                                      │
// └─────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

window.addEventListener('scene-ready', () => {

  // ── ADD YOUR PERLIN NOISE ANIMATIONS HERE ────────────────

});
