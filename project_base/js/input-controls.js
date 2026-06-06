// js/input-controls.js
// ─────────────────────────────────────────────────────────────
// INPUT CONTROLS — Person C
// Handle all user interactions: click, hover, drag, scroll.
//
// ┌─────────────────────────────────────────────────────────┐
// │  HOW TO ADD INTERACTIONS                                │
// │                                                         │
// │  1. Listen for scene-ready                              │
// │  2. Get the layer element by id                         │
// │  3. Add event listeners (click, mousemove, etc.)        │
// │  4. Write to state.js to share values with other files  │
// │                                                         │
// │  EXAMPLE — click on sun:                                │
// │  const sun = document.getElementById('layer-sun');      │
// │  sun.style.pointerEvents = 'auto';                      │
// │  sun.addEventListener('click', () => {                  │
// │    console.log('sun clicked!');                         │
// │  });                                                    │
// │                                                         │
// │  EXAMPLE — mouse position:                              │
// │  document.addEventListener('mousemove', (e) => {        │
// │    state.mouseX = e.clientX / window.innerWidth;        │
// │    state.mouseY = e.clientY / window.innerHeight;       │
// │  });                                                    │
// └─────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

window.addEventListener('scene-ready', () => {

  // ── ADD YOUR INTERACTIONS HERE ────────────────────────────

});
