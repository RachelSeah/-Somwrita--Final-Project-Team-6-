// js/time-based.js
// ─────────────────────────────────────────────────────────────
// TIME-BASED MECHANICS — Person D
// This is where all time-driven animations live.
// Uses requestAnimationFrame and setTimeout for timing.
//
// ┌─────────────────────────────────────────────────────────┐
// │  HOW TO ADD AN ANIMATION                                │
// │                                                         │
// │  1. Write a function below (e.g. animateClouds)         │
// │  2. Call it inside initTimeBased() at the bottom        │
// │  3. Use requestAnimationFrame for smooth loops          │
// │  4. Use setTimeout for delays                           │
// │                                                         │
// │  TO GRAB A LAYER:                                       │
// │  const el = document.getElementById('layer-cloud-1')   │
// │  el.style.transform = 'translateX(100px)'               │
// │                                                         │
// │  AVAILABLE LAYER IDs:                                   │
// │  sky, sun, ocean, mountain, island                      │
// │  cloud-1, cloud-2, cloud-3                              │
// │  hills-1 through hills-8, first-hill                    │
// │  tree-1 through tree-8, tree-bush                       │
// │  bush-1, bush-2, bush-3                                 │
// │  flowers, moon, moon-reflection, dark-overlay           │
// │                                                         │
// │  DAY/NIGHT LAYERS:                                      │
// │  Each layer has two children:                           │
// │    .layer-day   — visible by default (opacity: 1)       │
// │    .layer-night — hidden by default  (opacity: 0)       │
// │  To crossfade:                                          │
// │    dayEl.style.opacity   = '0'  (hide day)              │
// │    nightEl.style.opacity = '1'  (show night)            │
// │                                                         │
// │  BACKGROUND COLOUR:                                     │
// │  Day colour:   #f8a779                                  │
// │  Night colour: #b2b1ff                                  │
// │  document.getElementById('scene').style.background = '' │
// │                                                         │
// │  EASING EXAMPLE:                                        │
// │  function easeInOutCubic(t) {                           │
// │    return t < 0.5                                       │
// │      ? 4 * t * t * t                                    │
// │      : 1 - Math.pow(-2 * t + 2, 3) / 2;                │
// │  }                                                      │
// └─────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

export function initTimeBased() {

  // ── ADD YOUR ANIMATIONS HERE ──────────────────────────────
  // Call your animation functions below, for example:
  //
  // animateClouds();
  // startDayNightCycle();

}

// ── WRITE YOUR ANIMATION FUNCTIONS BELOW ─────────────────────
//
// Example — cloud drift:
//
// let cloudX = 0;
// function animateClouds() {
//   const cloud = document.getElementById('layer-cloud-1');
//   cloudX += 0.5;
//   if (cloudX > 1655) cloudX = -400;
//   if (cloud) cloud.style.transform = `translateX(${cloudX}px)`;
//   requestAnimationFrame(animateClouds);
// }
//
// Example — day to night:
//
// function startDayNightCycle() {
//   setTimeout(() => {
//     const sky = document.getElementById('layer-sky');
//     const dayEl   = sky.querySelector('.layer-day');
//     const nightEl = sky.querySelector('.layer-night');
//     dayEl.style.opacity   = '0';
//     nightEl.style.opacity = '1';
//   }, 5000); // triggers after 5 seconds
// }
