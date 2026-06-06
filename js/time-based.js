// js/time-based.js
// ─────────────────────────────────────────────────────────────
// TIME-BASED MECHANICS — Person D
//
// AI ACKNOWLEDGEMENT:
// This file was developed with the assistance of Claude AI
// (Anthropic) as part of a vibe coding learning exercise.
// The logic, structure, and animation mechanics were designed
// collaboratively through natural language prompting.
//
// HOW THIS FILE WORKS:
// This file controls three separate time-based systems:
//
//   PART 1 — CLOUD DRIFT
//   Moves three cloud SVG layers horizontally across the scene
//   at different speeds using requestAnimationFrame.
//
//   PART 2 — DAY/NIGHT CYCLE
//   Runs a 4-state machine (DAY → DAY_TO_NIGHT → NIGHT →
//   NIGHT_TO_DAY) that loops forever using elapsed time and
//   easing functions to smoothly animate the scene.
//
//   PART 3 — BIRD ANIMATION
//   Draws a flock of birds using the HTML5 Canvas 2D API,
//   adapted from a p5.js sketch by Patt Vira.
//   Reference: https://www.youtube.com/watch?v=ttz05d8DSOs
//
// ┌─────────────────────────────────────────────────────────┐
// │  HOW TO ADD YOUR ANIMATIONS                             │
// │                                                         │
// │  1. Write your function in the section below            │
// │  2. Call it inside initTimeBased() at the bottom        │
// │  3. Use requestAnimationFrame for smooth loops          │
// │  4. Use setTimeout for timed delays                     │
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
// │                                                         │
// │  BACKGROUND COLOURS:                                    │
// │  Day:   #f8a779                                         │
// │  Night: #b2b1ff                                         │
// └─────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

export function initTimeBased() {

  // ── CALL YOUR ANIMATION FUNCTIONS HERE ───────────────────
  // Example:
  // animateClouds();
  // startDayNightCycle();
  // initBirds();

}

// ═════════════════════════════════════════════════════════════
// PART 1 — CLOUD DRIFT
// ─────────────────────────────────────────────────────────────
// Paste your cloud animation code here.
// ═════════════════════════════════════════════════════════════
const SCENE_WIDTH = 1455;

let cloud1X = 0;
let cloud2X = -400;
let cloud3X = -800;

const CLOUD1_SPEED = 0.4;
const CLOUD2_SPEED = 0.25;
const CLOUD3_SPEED = 0.15;

function animateClouds() {
  const c1 = document.getElementById('layer-cloud-1');
  const c2 = document.getElementById('layer-cloud-2');
  const c3 = document.getElementById('layer-cloud-3');

  cloud1X += CLOUD1_SPEED;
  cloud2X += CLOUD2_SPEED;
  cloud3X += CLOUD3_SPEED;

  if (cloud1X > SCENE_WIDTH + 200) cloud1X = -400;
  if (cloud2X > SCENE_WIDTH + 200) cloud2X = -400;
  if (cloud3X > SCENE_WIDTH + 200) cloud3X = -400;

  if (c1) c1.style.transform = `translateX(${cloud1X}px)`;
  if (c2) c2.style.transform = `translateX(${cloud2X}px)`;
  if (c3) c3.style.transform = `translateX(${cloud3X}px)`;

  requestAnimationFrame(animateClouds);
}


// ═════════════════════════════════════════════════════════════
// PART 2 — DAY/NIGHT CYCLE
// ─────────────────────────────────────────────────────────────
// Paste your day/night cycle code here.
// ═════════════════════════════════════════════════════════════



// ═════════════════════════════════════════════════════════════
// PART 3 — BIRD ANIMATION
// ─────────────────────────────────────────────────────────────
// Paste your bird animation code here.
// Reference: https://www.youtube.com/watch?v=ttz05d8DSOs
// Original p5.js sketch by Patt Vira
// ═════════════════════════════════════════════════════════════


