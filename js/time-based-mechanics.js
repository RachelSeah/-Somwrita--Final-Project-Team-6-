// Claude helped debug the cloud drift and day/night transition timing functions in this file — the mechanic concept, animation values, and overall structure were developed independently.
// =============================================================================
// js/time-based-mechanics.js
// =============================================================================
//
// PURPOSE:
//   Handles all time-based animations in the scene.
//   These are animations that run continuously on their own — not triggered
//   by user input, and not driven by Perlin noise.
//
// WHAT LIVES HERE:
//   - Cloud movement (horizontal drift across the scene at different speeds)
//   - Day/night blend transition (smooth fade between day and night layers)
//   - Sun rise animation (sun slides up into position on load)
//
// WHAT SKETCH.JS CALLS FROM HERE:
//   updateClouds()    → called every frame in draw()
//   updateDayNight()  → called every frame in draw()
//
// HOW CLOUD POSITIONS REACH SKETCH.JS:
//   updateClouds() writes to STATE.cloudOffsets.
//   drawLayer() in sketch.js reads STATE.cloudOffsets to offset each cloud's x.
//
// =============================================================================


// ── CLOUD CONFIG ──────────────────────────────────────────────────────────────
// Each cloud moves at a different speed to create a parallax depth effect.
// cloud-1 is the closest (fastest), cloud-3 is the furthest (slowest).
// These speeds are in pixels per frame.

const CLOUD_SPEEDS = {
  'cloud-1': 0.9,    // closest cloud  — moves fastest
  'cloud-2': 0.6,    // middle cloud
  'cloud-3': 0.35    // furthest cloud — moves slowest
};

// How far right a cloud travels before wrapping back to the left.
// 1455 (scene width) + 200 buffer so cloud fully exits before resetting.
const CLOUD_EXIT_X = 1655;

// X position clouds reset to when they wrap — negative so they enter smoothly
const CLOUD_RESET_X = -500;


// ── DAY / NIGHT TRANSITION CONFIG ─────────────────────────────────────────────
// How fast STATE.dayNight changes per frame.
// 0.002 per frame at 60fps = ~500 frames = ~8 seconds for a full transition.
// Increase this value for a faster transition, decrease for slower.
const DAY_NIGHT_SPEED = 0.002;


// ── SUN RISE CONFIG ───────────────────────────────────────────────────────────
// On load, the sun starts below its natural position and slowly rises up.
// This gives the scene a gentle "morning arriving" feel at the start.
const SUN_RISE_DURATION = 20000;  // milliseconds (20 seconds for full rise)
const SUN_RISE_OFFSET   = 300;    // pixels below natural position at start

// Internal variables — not exported, only used inside time.js
let _sunRiseStartTime = null;   // timestamp of when rise began (set on first call)
let _sunRiseComplete  = false;  // true once sun has fully risen — stops updating


// =============================================================================
// UPDATE CLOUDS
// Called every frame from draw() in sketch.js.
// Advances each cloud's x offset and wraps it back when it exits the scene.
// Writes directly to STATE.cloudOffsets — sketch.js reads from there.
// =============================================================================
function updateClouds() {

  for (let id in STATE.cloudOffsets) {

    // Move this cloud rightward by its speed
    STATE.cloudOffsets[id] += CLOUD_SPEEDS[id];

    // Once the cloud has fully exited the right side, reset it to the left
    // This creates a seamless infinite loop
    if (STATE.cloudOffsets[id] > CLOUD_EXIT_X) {
      STATE.cloudOffsets[id] = CLOUD_RESET_X;
    }
  }
}


// =============================================================================
// UPDATE DAY / NIGHT
// Called every frame from draw() in sketch.js.
// Smoothly transitions STATE.dayNight toward 1.0 (night) when fireflies
// are active, and back toward 0.0 (day) when they are not.
//
// STATE.dayNight is read by drawLayer() in sketch.js to set the opacity
// of day and night SVG versions of each layer.
// =============================================================================
function updateDayNight() {

  if (STATE.firefliesActive) {
    // Health has reached the threshold — transition toward night
    // min() ensures value never exceeds 1.0
    STATE.dayNight = min(STATE.dayNight + DAY_NIGHT_SPEED, 1.0);

  } else {
    // Not in fireflies state — transition back toward full day
    // max() ensures value never goes below 0.0
    STATE.dayNight = max(STATE.dayNight - DAY_NIGHT_SPEED, 0.0);
  }
}


// =============================================================================
// UPDATE SUN RISE
// Called every frame from draw() in sketch.js.
// On load, returns a y offset that decreases from SUN_RISE_OFFSET to 0
// over SUN_RISE_DURATION milliseconds, making the sun slowly rise up.
// Once complete, always returns 0 so there is no ongoing cost.
//
// Uses cubic ease-out: starts fast, decelerates as it reaches final position.
// =============================================================================
function getSunRiseOffset() {

  // Once the rise is done, return 0 immediately — no more calculation needed
  if (_sunRiseComplete) return 0;

  // Record the start time on the very first call
  if (_sunRiseStartTime === null) {
    _sunRiseStartTime = millis(); // millis() = time in ms since sketch started
  }

  let elapsed  = millis() - _sunRiseStartTime;
  let progress = constrain(elapsed / SUN_RISE_DURATION, 0, 1);

  // Cubic ease-out: 1 - (1 - progress)^3
  // At progress=0 → eased=0 (just started)
  // At progress=1 → eased=1 (fully risen)
  let eased = 1 - pow(1 - progress, 3);

  // Current y offset: starts at SUN_RISE_OFFSET, approaches 0 as eased → 1
  let offsetY = SUN_RISE_OFFSET * (1 - eased);

  // Mark as complete once fully risen so this function becomes a no-op
  if (progress >= 1) _sunRiseComplete = true;

  return offsetY;
}