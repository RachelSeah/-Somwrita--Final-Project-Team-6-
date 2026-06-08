// js/state.js

/* PURPOSE:
   This file is the single source of truth for the artwork's current
   condition. Every other file reads from STATE to know what's happening
   and what to draw.
 */

   /*
   Think of STATE as the "memory" of the artwork:
   - How healthy is the scene right now?
   - Is it day or night?
   - Has the user triggered collapse?
   - Are fireflies active?
*/

/*
 HOW OTHER FILES USE THIS:
   sketch.js        → reads STATE.health to calculate tint colours
                      reads STATE.dayNight to blend day/night layers
                      reads STATE.firefliesActive to draw fireflies
   user_interaction → calls addHealth() and subtractHealth()
                      increments STATE.xPressCount on X key press
   noise.js         → reads STATE.noiseT each frame for sway animation
   time.js          → updates STATE.dayNight and STATE.cloudOffsets
   sound.js         → reads STATE.currentState to play correct audio

 RULE: Only change values in this file through the functions below.
   Never write STATE.health = 50 directly from another file.
   Always use addHealth() or subtractHealth() so the state
   machine logic stays in one place.
*/


// ── CONSTANTS ────
// Fixed values that define the rules of the system.
// Change these to tune the feel of the artwork.

const HEALTH_START    = 50;   // health value at the beginning
const HEALTH_MAX      = 100;  // health cannot go above this
const HEALTH_MIN      = 0;    // health cannot go below this
const HEALTH_PER_GOOD = 10;   // points gained per positive action
const HEALTH_PER_BAD  = 10;   // points lost per negative action
const FLOWER_CLICK_THRESHOLD = 5;  // grass clicks needed to trigger night/fireflies
const X_PRESS_COLLAPSE       = 3;  // how many X presses trigger collapse


// ── STATE OBJECT ──────
// The single object every file imports to read the current scene condition.

const STATE = {

  // -- Health ------------------------------------------------------------------
  // Drives all visual degradation/improvement in the scene.
  // 0 = fully collapsed, 100 = fully thriving, 50 = neutral/passive.
  health: HEALTH_START,

  // -- Current scene state -----------------------------------------------------
  // One of: 'PASSIVE', 'COLLAPSE', 'FIREFLIES'
  // PASSIVE   = default idle state, soft breeze, normal colours
  // COLLAPSE  = triggered by X pressed 3 times, scene looks degraded
  // FIREFLIES = triggered when health >= FIREFLY_THRESHOLD, evening + fireflies
  currentState: 'PASSIVE',

  // -- Day / Night blend -------------------------------------------------------
  // 0.0 = fully day, 1.0 = fully night.
  // sketch.js uses this to crossfade between day and night SVG layers.
  // Transitions to 1.0 when currentState becomes 'FIREFLIES'.
  dayNight: 0.0,

  // -- Collapse tint -----------------------------------------------------------
  // 0.0 = normal colours, 1.0 = fully collapsed (brown/grey/dark).
  // Driven by health: low health = high collapseTint.
  // sketch.js uses this to lerp between normal and collapse tint colours.
  collapseTint: 0.0,

  // -- X key press counter -----------------------------------------------------
  // Tracks consecutive X presses. Resets to 0 when R is pressed (rain/recovery).
  // When this hits X_PRESS_COLLAPSE (3), currentState becomes 'COLLAPSE'.
  xPressCount: 0,

  // -- Noise time offset -------------------------------------------------------
  // Incremented every frame in sketch.js.
  // noise.js uses this as the time input for Perlin noise calculations,
  // so that sway, water ripples, and rain all evolve smoothly over time.
  noiseT: 0.0,

  // -- Flower click counter ----------------------------------------------------
  // Counts how many times the user has clicked grass to grow a flower.
  // When this reaches FLOWER_CLICK_THRESHOLD (5), night/fireflies state triggers.
  flowerClickCount: 0,

  // -- Fireflies ---------------------------------------------------------------
  firefliesActive: false,   // true when currentState === 'FIREFLIES'

  // -- Rain --------------------------------------------------------------------
  rainActive: false,        // true while R key rain shower is running

  // -- Cloud positions ---------------------------------------------------------
  // time.js updates these every frame to move clouds across the scene.
  // Each value is the current x offset in pixels for that cloud layer.
  cloudOffsets: {
    'cloud-1': 0,
    'cloud-2': -400,    // staggered start positions so clouds aren't bunched
    'cloud-3': -800
  }

};


// ── COLLAPSE TINT SMOOTHING ───────────────────────────────────────────────────
// _collapseTintTarget is the destination value driven by health changes.
// STATE.collapseTint is the DISPLAYED value — it lerps toward the target
// every frame via updateCollapseTint() called from sketch.js draw().
// This prevents snapping when health changes suddenly (e.g. X key × 3 collapse).
let _collapseTintTarget = 0;


// ── STATE FUNCTIONS ───────────────────────────────────────────────────────────
// Use these to change STATE values. Never set STATE.health directly elsewhere.

// Call this for every positive user action (click grass, double click tree, R key).
function addHealth(amount = HEALTH_PER_GOOD) {
  STATE.health = min(STATE.health + amount, HEALTH_MAX); // never exceeds HEALTH_MAX
  updateStateFromHealth();
}

// Call this for every negative user action (X key press).
function subtractHealth(amount = HEALTH_PER_BAD) {
  STATE.health = max(STATE.health - amount, HEALTH_MIN); // never goes below HEALTH_MIN
  updateStateFromHealth();
}

// Called automatically after every health change.
// Sets _collapseTintTarget — the actual STATE.collapseTint moves toward it
// gradually via updateCollapseTint() each frame (smooth transition).
function updateStateFromHealth() {
  _collapseTintTarget = constrain(map(STATE.health, 50, 0, 0, 1), 0, 1);

  // When recovering from COLLAPSE by growing flowers, return to PASSIVE
  // once health climbs back to 30 so the day sound resumes
  if (STATE.currentState === 'COLLAPSE' && STATE.health >= 30) {
    STATE.currentState = 'PASSIVE';
  }

  // Fireflies are NOT triggered by health — they are triggered by
  // flower click count reaching FLOWER_CLICK_THRESHOLD in user_interaction.js
}

// Called every frame from sketch.js draw().
// Lerps STATE.collapseTint toward _collapseTintTarget so colour changes
// are always gradual — no snapping on damage, collapse, or recovery.
// lerp factor 0.025 ≈ ~1.5 seconds for a full 0→1 transition at 60 fps.
function updateCollapseTint() {
  STATE.collapseTint = lerp(STATE.collapseTint, _collapseTintTarget, 0.025);
  // Snap to exact target once close enough to avoid floating-point drift
  if (abs(STATE.collapseTint - _collapseTintTarget) < 0.004) {
    STATE.collapseTint = _collapseTintTarget;
  }
}

// Triggered when X is pressed 3 times in a row.
function triggerCollapse() {
  STATE.currentState    = 'COLLAPSE';
  STATE.health          = 0;
  STATE.xPressCount     = 0;         // reset counter after collapse triggers
  STATE.firefliesActive = false;
  _collapseTintTarget   = 1.0;       // lerp will transition visuals smoothly
  // Note: STATE.collapseTint is NOT snapped — updateCollapseTint() handles it
}

// Triggered when flower click count reaches FLOWER_CLICK_THRESHOLD.
// Night/fireflies state lasts 5 seconds then returns to passive automatically.
function triggerFireflies() {
  STATE.currentState   = 'FIREFLIES';
  STATE.firefliesActive = true;
  // dayNight transitions to 1.0 gradually — time.js handles that animation

  // After 15 seconds, return to passive day state
  setTimeout(() => {
    returnToPassive();
  }, 15000);
}

// Resets the scene back to the starting passive state.
// Called automatically after the fireflies state ends.
function returnToPassive() {
  STATE.currentState    = 'PASSIVE';
  STATE.firefliesActive  = false;
  STATE.flowerClickCount = 0;  // reset counter so night can be triggered again
  // time.js gradually transitions dayNight back to 0 since firefliesActive is now false
}

// Triggered when R key is pressed — rain shower, partial recovery.
// Reverses collapse gradually. Does NOT instantly restore full health.
function triggerRain() {
  STATE.rainActive  = true;
  STATE.xPressCount = 0;           // reset X press counter — rain cancels collapse progress

  // If in COLLAPSE, return to PASSIVE
  if (STATE.currentState === 'COLLAPSE') {
    STATE.currentState = 'PASSIVE';
  }
}

// Call this when rain animation finishes (from time.js or sketch.js).
function stopRain() {
  STATE.rainActive = false;
}