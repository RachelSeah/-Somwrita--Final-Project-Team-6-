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
// │  const el = document.getElementById('layer-cloud-1')    │
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
// └─────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

const SCENE_WIDTH  = 1455;
const SCENE_HEIGHT = 1087;

export function initTimeBased() {

  // ── CALL YOUR ANIMATION FUNCTIONS HERE ───────────────────
  // Example:
  // animateClouds();
  // startDayNightCycle();
  // initBirds();
    animateClouds();
    startDayNightCycle();

}

// ═════════════════════════════════════════════════════════════
// PART 1 — CLOUD DRIFT
// ─────────────────────────────────────────────────────────────

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
const dayHoldDuration              = 30000;
const dayToNightTransitionDuration = 10000;
const nightHoldDuration            = 30000;
const nightToDayTransitionDuration = 10000;
const moonStartOpacityThreshold    = 0.8;
const sunDayPosition               = 0;
const sunSetPosition               = SCENE_HEIGHT * 0.7;
const moonHiddenPosition           = SCENE_HEIGHT * 0.5;
const moonNightPosition            = 0;
const dayBackgroundColor           = { r: 248, g: 167, b: 121 };
const nightBackgroundColor         = { r: 178, g: 177, b: 255 };

function easeInOutCubic(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  };
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const STATES = {
  DAY: 'day', DAY_TO_NIGHT: 'day_to_night',
  NIGHT: 'night', NIGHT_TO_DAY: 'night_to_day',
};
let currentState = STATES.DAY;
let stateStart   = null;

function applySun(yOffset, opacity) {
  const sun = document.getElementById('layer-sun');
  if (!sun) return;
  const base = sun.dataset.baseTransform || 'translate(0px, 0px)';
  sun.style.transform = `${base} translateY(${yOffset}px)`;
  sun.style.opacity   = String(clamp(opacity, 0, 1));
}
function applyMoon(yOffset, opacity) {
  const moon = document.getElementById('layer-moon');
  if (!moon) return;
  const base = moon.dataset.baseTransform || 'translate(0px, 0px)';
  moon.style.transform = `${base} translateY(${yOffset}px)`;
  moon.style.opacity   = String(clamp(opacity, 0, 1));
  const inner = moon.querySelector('.layer-night');
  if (inner) inner.style.opacity = '1';
}
function applyNightOpacity(opacity) {
  document.querySelectorAll('.layer-night').forEach(el => {
    if (el.closest('#layer-moon')) return;
    el.style.opacity = String(clamp(opacity, 0, 1));
  });
  document.querySelectorAll('.layer-day').forEach(el => {
    el.style.opacity = String(clamp(1 - opacity, 0, 1));
  });
}
function applyBackground(t) {
  const col = lerpColor(dayBackgroundColor, nightBackgroundColor, clamp(t, 0, 1));
  const scene = document.getElementById('scene');
  if (scene) scene.style.background = `rgb(${col.r},${col.g},${col.b})`;
}

function tickDay(elapsed) {
  const idleY = Math.sin((elapsed / 6000) * Math.PI * 2) * 4;
  applySun(sunDayPosition + idleY, 1);
  applyMoon(moonHiddenPosition, 0);
  applyNightOpacity(0);
  applyBackground(0);
  state.isDay = true;
}
function tickDayToNight(elapsed) {
  const t     = clamp(elapsed / dayToNightTransitionDuration, 0, 1);
  const eased = easeInOutCubic(t);
  applySun(lerp(sunDayPosition, sunSetPosition, eased), lerp(1, 0, easeInOutSine(t)));
  applyNightOpacity(eased);
  applyBackground(eased);
  const moonProgress = clamp((eased - moonStartOpacityThreshold) / (1 - moonStartOpacityThreshold), 0, 1);
  applyMoon(lerp(moonHiddenPosition, moonNightPosition, easeInOutSine(moonProgress)), moonProgress);
  state.isDay = false;
}
function tickNight(elapsed) {
  const idleY = Math.sin((elapsed / 7000) * Math.PI * 2) * 3;
  applyMoon(moonNightPosition + idleY, 1);
  applySun(sunSetPosition, 0);
  applyNightOpacity(1);
  applyBackground(1);
  state.isDay = false;
}
function tickNightToDay(elapsed) {
  const t     = clamp(elapsed / nightToDayTransitionDuration, 0, 1);
  const eased = easeInOutCubic(t);
  applyNightOpacity(1 - eased);
  applyBackground(1 - eased);
  applyMoon(lerp(moonNightPosition, moonHiddenPosition, easeInOutSine(t)), lerp(1, 0, eased));
  applySun(lerp(sunSetPosition, sunDayPosition, easeInOutSine(t)), lerp(0, 1, easeInOutSine(t)));
  state.isDay = t > 0.5;
}

function mainLoop(timestamp) {
  if (!stateStart) stateStart = timestamp;
  const elapsed = timestamp - stateStart;
  switch (currentState) {
    case STATES.DAY:
      tickDay(elapsed);
      if (elapsed >= dayHoldDuration) { currentState = STATES.DAY_TO_NIGHT; stateStart = timestamp; }
      break;
    case STATES.DAY_TO_NIGHT:
      tickDayToNight(elapsed);
      if (elapsed >= dayToNightTransitionDuration) {
        applyNightOpacity(1); applyBackground(1);
        applySun(sunSetPosition, 0); applyMoon(moonNightPosition, 1);
        currentState = STATES.NIGHT; stateStart = timestamp;
      }
      break;
    case STATES.NIGHT:
      tickNight(elapsed);
      if (elapsed >= nightHoldDuration) { currentState = STATES.NIGHT_TO_DAY; stateStart = timestamp; }
      break;
    case STATES.NIGHT_TO_DAY:
      tickNightToDay(elapsed);
      if (elapsed >= nightToDayTransitionDuration) {
        applyNightOpacity(0); applyBackground(0);
        applySun(sunDayPosition, 1); applyMoon(moonHiddenPosition, 0);
        currentState = STATES.DAY; stateStart = timestamp;
      }
      break;
  }
  requestAnimationFrame(mainLoop);
}

function startDayNightCycle() {
  applyNightOpacity(0);
  applyBackground(0);
  applySun(sunDayPosition, 1);
  applyMoon(moonHiddenPosition, 0);
  requestAnimationFrame(mainLoop);
}



// ═════════════════════════════════════════════════════════════
// PART 3 — BIRD ANIMATION
// ─────────────────────────────────────────────────────────────
// Paste your bird animation code here.
// Reference: https://www.youtube.com/watch?v=ttz05d8DSOs
// Original p5.js sketch by Patt Vira
// ═════════════════════════════════════════════════════════════


