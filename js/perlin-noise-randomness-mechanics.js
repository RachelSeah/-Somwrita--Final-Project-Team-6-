// Claude was used to help design the rain particle system architecture and the Perlin noise sampling approach used in this file.
// Claude was used to write detailed comments for easier code understanding.
// The mechanic concept, tuning and creative decisions were made independently.
// js/perlin-noise-randomness-mechanics.js
// =============================================================================
//
/* PURPOSE:
   Includes ALL Perlin noise and randomness logic for the artwork.
   This file calculates, gives logic - it never draws anything directly.
   Other js files like user-input-mechanics.js, state.js, time-based-mechanics.js, etc use the logic and functions from this file.
   sketch.js calls functions from this file to get values and then draws with them.
*/


// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const FIREFLY_COUNT    = 60;   // background/mid fireflies
const FIREFLY_COUNT_FG = 75;   // foreground fireflies — 25 cols × 3 rows covering y=875–1065

// Rain is split into three depth layers to create a parallax/depth illusion.
// BG = far (small, faint, slow), MID = midground, FG = close (large, bright, fast).
// All render on the same canvas but visual differences sell the depth effect.
const RAIN_COUNT_BG1 = 1450;  // farthest background layer
const RAIN_COUNT_BG2 = 1100;  // second background layer — slightly closer
const RAIN_COUNT_MID = 1800;  // midground
const RAIN_COUNT_FG  = 1250;  // single foreground layer
// Total: 5600 particles


// ── INTERNAL PARTICLE ARRAYS ──────────────────────────────────────────────────
// Prefixed with _ to signal these are private to noise.js.
// sketch.js accesses them only through the getter functions below.
let _fireflies      = [];
let _rainParticles  = [];

// Global opacity multiplier for all fireflies — drives fade in/out.
// 0.0 = invisible, 1.0 = fully visible.
// Incremented when STATE.firefliesActive is true, decremented when false.
let _fireflyOpacity = 0.0;



// =============================================================================
// INIT NOISE
// Called once from setup() in sketch.js.
// Assigns each swayable layer a unique noise seed so they sway independently,
// then creates all particle objects with random initial positions.
// =============================================================================
function initNoise() {

  // Give every layer in the scene its own unique random noise seed.
  // Stored directly on the layer object so getSwayOffset() can use it.
  // Without unique seeds, all trees would sway in perfect unison.
  for (let layer of LAYERS) {
    layer.noiseSeed = random(10000);
  }

  initFireflies();
  initRain();
  initFish();
}


// =============================================================================
// UPDATE NOISE
// Called every frame from draw() in sketch.js.
// Advances all time-based noise animations.
// =============================================================================
function updateNoise() {

  // Update all particle systems
  updateFireflies();

  // updateRain runs whenever there is any visible rain (active OR fading out).
  // It handles its own early-exit once _rainOpacity fully reaches 0.
  if (STATE.rainActive || _rainOpacity > 0) updateRain();

  // updateFish is called every frame (not just during rain) so that
  // _prevRainActive always tracks STATE.rainActive correctly.
  // Without this, _prevRainActive gets stuck at true when rain ends while
  // _fishArr is empty — causing the next R press to never detect the transition.
  updateFish();
}


// =============================================================================
// SWAY — Perlin noise lateral drift for trees, bushes, hills, flowers
//
// HOW IT WORKS:
//   Each layer has a unique noiseSeed assigned in initNoise().
//   noise(seed, time) gives a unique smoothly changing value per layer.
//   map() converts that 0–1 value to a pixel offset centred around 0.
//   layer.swayAmount (from layers.js) scales how far each element moves —
//   foreground trees sway more than distant hills.
// =============================================================================
function getSwayOffset(layer) {

  // Non-swaying layers return zero offset immediately
  if (!layer.sway) return { dx: 0, dy: 0 };

  // Maximum pixel offset driven by swayAmount
  // swayAmount 0.1 (distant hills) → max 1.2px
  // swayAmount 0.5 (foreground trees) → max 6px
  let maxSway = layer.swayAmount * 12;

  // Horizontal sway — noise(unique seed, slowly advancing time)
  // Each layer's unique seed places it at a different position in noise space,
  // so no two layers sway in sync with each other
  let dx = map(
    noise(layer.noiseSeed, STATE.noiseT),
    0, 1,
    -maxSway, maxSway
  );

  // Vertical sway — much smaller than horizontal (elements mostly sway sideways)
  // Offset seed by 500 so vertical noise is independent of horizontal noise
  let dy = map(
    noise(layer.noiseSeed + 500, STATE.noiseT),
    0, 1,
    -maxSway * 0.3, maxSway * 0.3
  );

  return { dx, dy };
}



// =============================================================================
// FIREFLIES — Perlin noise position drift and brightness flicker
//
// HOW IT WORKS:
//   Each firefly has three independent noise streams (noiseX, noiseY, noiseB),
//   seeded randomly in initFireflies() so every firefly behaves differently.
//   Position drifts slowly using noise — smoother and more organic than random().
//   Brightness flickers using a third noise stream at a different speed.
// =============================================================================
function initFireflies() {
  _fireflies = [];

  // ── General fireflies (FIREFLY_COUNT = 60) ─────────────────────────────────
  // Grid: 10 cols × 6 rows across x=200–1255, y=475–750.
  // Starting BELOW the soft boundary top (y > 470) so the spring keeps them
  // safely in the free-drift zone. Random jitter breaks the rigid grid look.
  // homeX/homeY act as the spring target, preventing cumulative noise drift.
  const G_COLS = 10, G_ROWS = 6;
  const G_X_MIN = 200,  G_X_MAX = 1255;
  const G_Y_MIN = 475,  G_Y_MAX = 750;
  const gCellW  = (G_X_MAX - G_X_MIN) / G_COLS;
  const gCellH  = (G_Y_MAX - G_Y_MIN) / G_ROWS;

  for (let row = 0; row < G_ROWS; row++) {
    for (let col = 0; col < G_COLS; col++) {
      let hx = G_X_MIN + (col + 0.5) * gCellW + random(-gCellW * 0.35, gCellW * 0.35);
      let hy = G_Y_MIN + (row + 0.5) * gCellH + random(-gCellH * 0.35, gCellH * 0.35);
      hx = constrain(hx, G_X_MIN, G_X_MAX);
      hy = constrain(hy, G_Y_MIN, G_Y_MAX);

      _fireflies.push({
        x: hx, y: hy,
        homeX: hx, homeY: hy,   // spring pulls back here to prevent drift clustering
        noiseX: random(10000), noiseY: random(10000), noiseB: random(10000),
        size:   random(3, 6),
        brightness: 0
      });
    }
  }

  // ── Foreground fireflies (FIREFLY_COUNT_FG = 75) ───────────────────────────
  // Grid: 25 cols × 3 rows across x=9–1425, y=875–1065.
  // Extended y range fills the bottom of the artwork that was previously empty.
  // Slightly larger size — they're closest to the viewer.
  const F_COLS = 25, F_ROWS = 3;
  const F_X_MIN = 9,    F_X_MAX = 1425;
  const F_Y_MIN = 875,  F_Y_MAX = 1065;
  const fCellW  = (F_X_MAX - F_X_MIN) / F_COLS;
  const fCellH  = (F_Y_MAX - F_Y_MIN) / F_ROWS;

  for (let row = 0; row < F_ROWS; row++) {
    for (let col = 0; col < F_COLS; col++) {
      let hx = F_X_MIN + (col + 0.5) * fCellW + random(-fCellW * 0.35, fCellW * 0.35);
      let hy = F_Y_MIN + (row + 0.5) * fCellH + random(-fCellH * 0.35, fCellH * 0.35);
      hx = constrain(hx, F_X_MIN, F_X_MAX);
      hy = constrain(hy, F_Y_MIN, F_Y_MAX);

      _fireflies.push({
        x: hx, y: hy,
        homeX: hx, homeY: hy,
        noiseX: random(10000), noiseY: random(10000), noiseB: random(10000),
        size:   random(4, 7),
        brightness: 0
      });
    }
  }
}

function updateFireflies() {

  // Fade in when fireflies are active, fade out when they're not.
  // 0.008 per frame ≈ ~2 seconds for a full fade in or out at 60fps.
  if (STATE.firefliesActive) {
    _fireflyOpacity = min(_fireflyOpacity + 0.008, 1.0);
  } else {
    _fireflyOpacity = max(_fireflyOpacity - 0.008, 0.0);
  }

  for (let f of _fireflies) {

    // Drift: ±1.8 px/frame gives clearly visible, random-feeling movement.
    // Noise time at 0.5 changes direction faster for a more organic, less
    // predictable path — closer to how a real firefly wanders.
    let dx = map(noise(f.noiseX, STATE.noiseT * 0.5), 0, 1, -1.8, 1.8);
    let dy = map(noise(f.noiseY, STATE.noiseT * 0.5), 0, 1, -1.8, 1.8);

    // ── Weak spring toward home — prevents permanent migration, not felt otherwise
    // At 1.8 px drift, the spring (0.003/px) only meaningfully pulls at 300+ px
    // from home, so everyday movement looks completely free and random.
    const SPRING = 0.003;
    dx += (f.homeX - f.x) * SPRING;
    dy += (f.homeY - f.y) * SPRING;

    // ── Upper boundary — three zones ────────────────────────────────────────
    //
    // y < 420      HARD FLOOR: full stop on horizontal, strong push straight down.
    //              Firefly never crosses y=420 upward.
    //
    // y 420–470    SOFT ZONE: horizontal drift suppressed proportionally,
    //              a diminishing downward push eases them back toward y>470.
    //              At y=420: 0% horizontal, max push. At y=470: 100% horizontal, 0 push.
    //              The lerp makes the transition completely smooth — no snapping.
    //
    // y > 470      FREE ZONE: normal random drift in both axes.
    //
    const FLOOR_Y = 420;
    const SOFT_TOP = 470;

    if (f.y < FLOOR_Y) {
      // Hard floor — zero horizontal, push firmly down until clear of floor
      f.x += 0;
      f.y += 3.0;

    } else if (f.y < SOFT_TOP) {
      // Soft zone — lerp factor 0 at floor, 1 at SOFT_TOP
      let t = (f.y - FLOOR_Y) / (SOFT_TOP - FLOOR_Y);   // 0→1 as y rises from 420 to 470

      // Horizontal: fully suppressed at floor, smoothly restored toward SOFT_TOP
      f.x += dx * t;

      // Downward push: strong near floor, tapers to zero at SOFT_TOP
      // This ensures the firefly is always moving toward the free zone,
      // not just hovering in the suppression band.
      let pushDown = (1 - t) * 1.5;
      f.y += dy + pushDown;

    } else {
      // Free zone — full noise drift
      f.x += dx;
      f.y += dy;
    }

    // Keep fireflies inside horizontal scene bounds
    f.x = constrain(f.x, 10, 1445);

    // Soft bottom boundary — gentle push back up if drifting below scene bottom.
    // Mirrors the top boundary logic: gradual rather than abrupt.
    if (f.y > 1075) {
      f.y -= (f.y - 1075) * 0.15 + 0.8;  // stronger push the further below 1075
    }

    // Flicker brightness — slightly brighter range than before
    f.brightness = map(noise(f.noiseB, STATE.noiseT), 0, 1, 90, 220);

    // Advance brightness noise seed independently of position
    f.noiseB += 0.003;
  }
}

// Returns the firefly array to sketch.js for drawing
function getFireflies() {
  return _fireflies;
}

// Returns current fade opacity (0–1) for all fireflies
function getFireflyOpacity() {
  return _fireflyOpacity;
}


// =============================================================================
// RAIN — fully Perlin noise driven, natural movement
//
// HOW IT WORKS:
//
// WIND LAYER (global, shared):
//   A slow Perlin noise value (_rainWindT) drives a wind direction that
//   shifts gradually over time — like a real gust rolling through.
//   All particles are pushed by the same wind so they move coherently,
//   the way rain in a storm does (all drops lean the same way at once).
//
// TURBULENCE LAYER (per-particle):
//   Each particle has a unique noise seed (noiseTurb) that adds small
//   individual micro-variations on top of the wind. This breaks the
//   lock-step uniformity so no two drops look identical.
//
// WEIGHT + DEPTH:
//   Particles have a random weight (0–1). Heavier drops fall faster,
//   are longer, and less affected by wind. Lighter drops are shorter,
//   slower and blow around more — just like real rain.
//
// OPACITY:
//   Each particle has its own noise-driven opacity that slowly pulses,
//   giving the rain a soft, illustrated quality rather than a harsh uniform sheet.
// =============================================================================

// Slow-moving wind time — advances in updateRain(), shared across all drops
let _rainWindT = 0;

// Global rain opacity multiplier — lerps to 1 when rain starts, back to 0 when
// rain stops. Prevents rain from snapping on/off when STATE.rainActive changes.
// sketch.js reads this via getRainOpacity() and passes it into drawRain().
let _rainOpacity = 0.0;


// =============================================================================
// RAIN DEPTH CONFIG
// Each depth layer (0=BG, 1=mid, 2=FG) has its own visual scale multipliers.
//
// depthScale  — scales drop size (len, width) and speed. 0.4 = very small/slow.
// yStagger    — y range used when staggering particles on first load, so rain
//               is visible at all scene depths from frame 1. BG particles are
//               spread across the full scene height; FG starts a bit lower.
// =============================================================================
// clipY  — canvas clip rect height used in drawRain(); drops invisible below this
// maxY   — particle reset threshold; BG/MID reset early so they don't waste
//           cycles falling through areas they're clipped out of anyway.
// yStaggerMax — max y for the initial scatter on load, kept within the clip zone
//               so rain is visible at all depths from frame 1.
const RAIN_DEPTH = [
  { depth: 0, scale: 0.40, yStaggerMin: -200, yStaggerMax: 630,  clipY: 640,  maxY: 650  }, // BG1 — farthest
  { depth: 1, scale: 0.55, yStaggerMin: -300, yStaggerMax: 710,  clipY: 720,  maxY: 730  }, // BG2 — second background
  { depth: 2, scale: 0.75, yStaggerMin: -400, yStaggerMax: 860,  clipY: 870,  maxY: 880  }, // MID
  { depth: 3, scale: 1.00, yStaggerMin: -600, yStaggerMax: 1087, clipY: 1100, maxY: 1100 }, // FG — single foreground
];

function initRain() {
  _rainParticles = [];

  // Create particles for each depth layer
  let counts = [RAIN_COUNT_BG1, RAIN_COUNT_BG2, RAIN_COUNT_MID, RAIN_COUNT_FG];
  for (let d = 0; d < 4; d++) {
    for (let i = 0; i < counts[d]; i++) {
      _rainParticles.push(createRainParticle(true, d));
    }
  }
}

// depth: 0 = background (far), 1 = midground, 2 = foreground (close)
function createRainParticle(staggered, depth = 1) {
  let cfg    = RAIN_DEPTH[depth];
  let weight = random(0, 1);  // 0 = light drizzle, 1 = heavy drop

  // Base len and speed before depth scaling
  let baseLen   = lerp(10, 30, weight);
  let baseSpeed = lerp(2,  22, weight);  // wider range — slow drizzle to fast heavy drop

  // Stagger y across full scene on init so rain is visible everywhere on load.
  // After reset (off-screen) particles always enter from the top.
  let initY = staggered
    ? random(cfg.yStaggerMin, cfg.yStaggerMax)
    : random(-150, 0);

  return {
    x:          random(0, 1455),
    y:          initY,
    weight:     weight,
    depth:      depth,               // 0 BG / 1 mid / 2 FG — used by drawRain()
    depthScale: cfg.scale,           // visual size multiplier
    speed:      baseSpeed * cfg.scale,
    len:        baseLen   * cfg.scale,
    noiseTurb:  random(10000),       // unique seed for micro-turbulence
    noiseOpac:  random(10000),       // unique seed for opacity pulse
    opacity:    0,                   // set each frame in updateRain
    angle:      0                    // set each frame from wind
  };
}

function updateRain() {

  // Fade rain opacity in/out smoothly — prevents snap when rainActive toggles.
  // 0.04/frame fade-in ≈ ~0.4s, 0.025/frame fade-out ≈ ~0.7s (slower exit feels natural)
  if (STATE.rainActive) {
    _rainOpacity = min(_rainOpacity + 0.04, 1.0);
  } else {
    _rainOpacity = max(_rainOpacity - 0.025, 0.0);
  }

  // Once fully faded out, skip all particle physics (save computation)
  if (_rainOpacity <= 0) return;

  // Advance wind time — slow so gusts feel natural, not jittery
  _rainWindT += 0.003;

  // Global wind: noise gives a smooth gust value that all particles share.
  // Range: -2.5 (blowing left) to +1.5 (slight right lean) — asymmetric
  // like a storm front coming from one side
  let windStrength = map(noise(_rainWindT), 0, 1, -2.5, 1.5);

  // Global angle follows wind — heavier rain stays more vertical
  let baseAngle = map(noise(_rainWindT + 50), 0, 1, PI/2 - 0.35, PI/2 + 0.08);

  for (let p of _rainParticles) {

    // ── Angle ───────────────────────────────────────────────────────────────
    // Each particle's angle = global base + small individual turbulence.
    // Light drops (low weight) deviate more from the base angle.
    let turbAngle = map(noise(p.noiseTurb, STATE.noiseT * 0.4), 0, 1, -0.12, 0.12);
    p.angle = baseAngle + turbAngle * (1 - p.weight * 0.6);

    // ── Movement ────────────────────────────────────────────────────────────
    // Per-drop noise multiplier makes each drop's speed pulse independently —
    // some drops accelerate in gusts, others slow briefly, no two in sync.
    // Light drops (low weight) vary more; heavy drops are more stable.
    let speedMult = map(
      noise(p.noiseTurb + 1000, STATE.noiseT * 0.3),
      0, 1,
      lerp(0.60, 0.82, p.weight),   // min speed mult: light drops slow more
      lerp(1.40, 1.18, p.weight)    // max speed mult: light drops gust more
    );
    p.y += p.speed * speedMult;
    p.x += windStrength * (1 - p.weight * 0.5)   // global wind (less on heavy drops)
         + map(noise(p.noiseTurb + 500, STATE.noiseT * 0.6), 0, 1, -0.4, 0.4); // turbulence

    // ── Opacity pulse ────────────────────────────────────────────────────────
    // Noise-driven opacity makes each drop subtly pulse — gives soft,
    // illustrated quality rather than a solid uniform sheet.
    p.opacity = map(noise(p.noiseOpac, STATE.noiseT * 0.5), 0, 1, 80, 220);

    // ── Reset when past clip boundary or off-screen sides ───────────────────
    // BG and MID particles reset at their clipY so they don't waste cycles
    // falling through areas they'll never be drawn in.
    let depthMaxY = RAIN_DEPTH[p.depth].maxY;
    if (p.y > depthMaxY || p.x < -50 || p.x > 1505) {
      let r        = createRainParticle(false, p.depth);  // keep same depth
      p.x          = r.x;
      p.y          = r.y;
      p.weight     = r.weight;
      p.speed      = r.speed;
      p.len        = r.len;
      p.depthScale = r.depthScale;
    }
  }
}

// Returns the rain particle array to sketch.js for drawing
function getRainParticles() {
  return _rainParticles;
}

// Returns global rain opacity (0–1) — sketch.js uses this to draw rain
// even while it's fading out after STATE.rainActive becomes false.
function getRainOpacity() {
  return _rainOpacity;
}



// =============================================================================
// FISH — jump from ocean surface during rain
//
// HOW IT WORKS:
//   Each R press queues 2 or 3 fish for that rain event, staggered in time.
//   Each fish spawns from one of two open-water zones (different x and y ranges),
//   follows a sin(PI*t) parabola from surface to peak and back, then splashes.
//
//   TWO ZONES (each stores its own surface y and canvas clip range):
//     Zone 1: x=400–700,  y=500–650  (surfaceY=635)
//     Zone 2: x=800–950,  y=700–850  (surfaceY=835)
//
//   COLOURS: blue, orange-yellow, or light-red — picked randomly per fish.
//
//   CLIPPING: per-fish drawingContext clip keeps each fish inside its zone's
//   y range so it never overlaps foreground hills, trees, or far sky.
//
//   BUG FIX — always call updateFish every frame (not only during rain):
//   If called only when STATE.rainActive or _fishArr.length > 0, _prevRainActive
//   gets stuck at true when rain ends with no fish left — the next R press then
//   never sees the false→true transition and no fish spawn.
//
// p5.js functions used: sin(), PI, cos(), random(), millis(), map(), HALF_PI
// =============================================================================

// Spawn zones — each carries its own surface y, clip bounds, group limit, and size scale.
// sizeScale < 1 makes fish smaller to convey distance.
// maxGroupSize caps how many fish can appear at once from that zone.
// jumpHMin/Max controls the arc height for each zone.
const FISH_ZONES = [
  { xMin: 400, xMax: 700, surfaceY: 635, clipTop: 500, clipBot: 655, maxGroupSize: 3, sizeScale: 1.0,  jumpHMin: 60, jumpHMax: 125 },
  { xMin: 800, xMax: 950, surfaceY: 835, clipTop: 700, clipBot: 855, maxGroupSize: 3, sizeScale: 1.0,  jumpHMin: 60, jumpHMax: 125 },
  { xMin: 750, xMax: 850, surfaceY: 545, clipTop: 500, clipBot: 555, maxGroupSize: 2, sizeScale: 0.52, jumpHMin: 20, jumpHMax: 40  }  // far/distant zone — y=500–550
];

let _fishArr        = [];
let _spawnSchedule  = [];    // pre-calculated [{size, zoneIdx, time}, ...] for this rain event
let _scheduleIdx    = 0;     // next group index in _spawnSchedule to spawn
let _prevRainActive = false; // tracks rain state each frame to detect R press transition
let _ambientFishTime = 0;    // next millis() at which to spawn ambient fish (no rain)

// Called once from initNoise() — resets fish system on load
function initFish() {
  _fishArr         = [];
  _spawnSchedule   = [];
  _scheduleIdx     = 0;
  _prevRainActive  = false;
  _ambientFishTime = 0;
}

// Builds a spawn schedule: 6–10 fish total, in zone-aware groups spread across rain duration.
// Each group is assigned a zone first so maxGroupSize per zone is respected.
function _buildFishSchedule(now) {
  let totalFish = floor(random(6, 11));  // 6–10 total fish this rain
  let remaining = totalFish;
  let groups    = [];
  while (remaining > 0) {
    let zoneIdx = floor(random(FISH_ZONES.length));
    let maxG    = min(FISH_ZONES[zoneIdx].maxGroupSize, remaining);
    let g       = floor(random(1, maxG + 1));  // 1 to maxGroupSize inclusive
    groups.push({ size: g, zoneIdx });
    remaining -= g;
  }
  // Spread groups evenly across 7 s of the 8 s rain (leave 1 s buffer at end)
  let rainSpan = 7000;
  _spawnSchedule = groups.map((grp, i) => {
    let winStart = (i / groups.length) * rainSpan;
    let winEnd   = ((i + 1) / groups.length) * rainSpan;
    return { size: grp.size, zoneIdx: grp.zoneIdx,
             time: now + winStart + random(0, winEnd - winStart) };
  });
  _scheduleIdx = 0;
}

// Spawns one fish with all properties. swimAngle drives diagonal jump direction.
function _spawnOneFish(zone) {
  let colStyle = floor(random(3));
  let r, g2, b;
  if      (colStyle === 0) { r = random(130,190); g2 = random(185,225); b = random(210,245); }
  else if (colStyle === 1) { r = random(220,255); g2 = random(150,200); b = random(50, 100); }
  else                     { r = random(220,255); g2 = random(100,150); b = random(100,150); }

  _fishArr.push({
    x:        random(zone.xMin, zone.xMax),
    surfaceY: zone.surfaceY,
    clipTop:  zone.clipTop,
    clipBot:  zone.clipBot,
    t:        0,
    speed:    STATE.dayNight > 0.5
               ? random(0.007, 0.018)   // night — fish move slower
               : random(0.010, 0.030),  // day — normal speed
    jumpH:    random(zone.jumpHMin, zone.jumpHMax),          // zone-specific arc height
    tiltMult: random(0.25, 0.85),
    facing:   random() < 0.5 ? 1 : -1,
    fishType: floor(random(3)),
    size:     random(18, 30) * zone.sizeScale,               // smaller for distant zone
    r, g: g2, b,
    phase:    'jumping',
    splashT:  0,
    drops:    []
  });
}

// Called EVERY frame from updateNoise() — must run even when no rain/fish
// so _prevRainActive always reflects the last known STATE.rainActive.
function updateFish() {
  let now = millis();

  // Detect fresh rain press (false → true transition) → build this event's schedule
  if (STATE.rainActive && !_prevRainActive) {
    _buildFishSchedule(now);
  }
  _prevRainActive = STATE.rainActive;  // always updated — fixes stuck-state bug

  // Fire any scheduled groups whose time has arrived (rain fish)
  while (_scheduleIdx < _spawnSchedule.length &&
         now >= _spawnSchedule[_scheduleIdx].time) {
    let grp = _spawnSchedule[_scheduleIdx];
    for (let g = 0; g < grp.size; g++) {
      _spawnOneFish(FISH_ZONES[grp.zoneIdx]);  // use the pre-assigned zone
    }
    _scheduleIdx++;
  }

  // Ambient fish — appear when not raining and health is good (≥50).
  // Day: 1 or 2 fish every 4–5 s. Night: same count but every 6–9 s (quieter).
  if (!STATE.rainActive && STATE.health >= 50 && now >= _ambientFishTime) {
    let count = floor(random(1, 3));  // 1 or 2
    for (let i = 0; i < count; i++) {
      _spawnOneFish(FISH_ZONES[floor(random(FISH_ZONES.length))]);
    }
    let interval = STATE.dayNight > 0.5
      ? random(6000, 9000)   // night — fish appear less frequently
      : random(4000, 5000);  // day — normal frequency
    _ambientFishTime = now + interval;
  }

  // Advance each fish's animation
  for (let i = _fishArr.length - 1; i >= 0; i--) {
    let f = _fishArr[i];

    if (f.phase === 'jumping') {
      f.t += f.speed;

      if (f.t >= 1.0) {
        f.phase   = 'splashing';
        f.splashT = 0;
        if (typeof playFishSplash === 'function') playFishSplash(f.x);
        f.drops   = [];
        for (let d = 0; d < 8; d++) {
          let ang = random(-PI + 0.4, -0.4);
          let spd = random(1.2, 3.5);
          f.drops.push({
            x: f.x, y: f.surfaceY,
            vx: cos(ang) * spd,
            vy: sin(ang) * spd,
            life: 1.0
          });
        }
      }

    } else if (f.phase === 'splashing') {
      f.splashT += 0.05;
      for (let d of f.drops) {
        d.x  += d.vx;
        d.y  += d.vy;
        d.vy += 0.18;
        d.life -= 0.06;
      }
      if (f.splashT >= 1.0) _fishArr.splice(i, 1);
    }
  }
}

// Called every frame from sketch.js — draws fish and splashes onto pg
function drawFish() {
  if (_fishArr.length === 0) return;

  for (let f of _fishArr) {

    if (f.phase === 'jumping') {
      let arcY = f.surfaceY - sin(PI * f.t) * f.jumpH;
      if (arcY >= f.surfaceY) continue;

      // Tilt: lean forward going up, backward coming down.
      // tiltMult is unique per fish so each jump has a different lean angle.
      // For left-facing fish, negate tilt — scale(-1,1) reverses rotation direction,
      // so without negation the nose dips down on ascent instead of pointing up.
      let tilt = map(f.t, 0, 1, -HALF_PI * f.tiltMult, HALF_PI * f.tiltMult);
      if (f.facing === -1) tilt = -tilt;

      // Per-fish clip — keeps fish inside its zone's y range
      pg.drawingContext.save();
      pg.drawingContext.beginPath();
      pg.drawingContext.rect(0, f.clipTop, nativeW, f.clipBot - f.clipTop);
      pg.drawingContext.clip();

      // Night tint — matches the same approach used for spawned flowers.
      // STATE.dayNight: 0=full day, 1=full night.
      // Red and green dim strongly; blue drops less (cool moonlit look);
      // alpha reduces so fish are still faintly visible at night.
      let dn  = STATE.dayNight;
      let cr  = lerp(f.r, f.r * 0.35, dn);
      let cg  = lerp(f.g, f.g * 0.35, dn);
      let cb  = lerp(f.b, f.b * 0.55, dn);   // blue drops less
      let ca  = lerp(225,  225 * 0.60, dn);   // body alpha
      let ct  = lerp(210,  210 * 0.60, dn);   // tail alpha
      let cf  = lerp(185,  185 * 0.55, dn);   // fin alpha

      pg.push();
      pg.translate(f.x, arcY);
      pg.rotate(tilt);
      pg.scale(f.facing, 1);  // mirrors horizontally for left-facing fish
      pg.noStroke();

      if (f.fishType === 0) {
        // ── Type 0: Standard streamlined fish — forked V-tail + dorsal fin ──────
        // Body
        pg.fill(cr, cg, cb, ca);
        pg.ellipse(0, 0, f.size, f.size * 0.42);
        // Forked tail — two separate triangles forming a V
        pg.fill(cr * 0.75, cg * 0.75, cb, ct);
        pg.triangle(-f.size*0.44,  0,  -f.size*0.84, -f.size*0.36,  -f.size*0.60,  0);
        pg.triangle(-f.size*0.44,  0,  -f.size*0.84,  f.size*0.36,  -f.size*0.60,  0);
        // Dorsal fin
        pg.fill(cr * 0.85, cg * 0.85, cb, cf);
        pg.triangle(-f.size*0.05, -f.size*0.20,  -f.size*0.26, -f.size*0.44,  f.size*0.18, -f.size*0.20);
        // Eye
        pg.fill(15, 15, 35, 230);
        pg.ellipse(f.size*0.26, -f.size*0.05, f.size*0.12, f.size*0.12);

      } else if (f.fishType === 1) {
        // ── Type 1: Chubby round fish — wide body, big fan tail, large eye ──────
        // Body — rounder proportions
        pg.fill(cr, cg, cb, ca);
        pg.ellipse(0, 0, f.size * 0.88, f.size * 0.72);
        // Big fan tail (single wide triangle)
        pg.fill(cr * 0.75, cg * 0.75, cb, ct);
        pg.triangle(-f.size*0.40, 0,  -f.size*0.84, -f.size*0.44,  -f.size*0.84, f.size*0.44);
        // Top dorsal fin
        pg.fill(cr * 0.85, cg * 0.85, cb, cf);
        pg.triangle(-f.size*0.08, -f.size*0.35,  f.size*0.18, -f.size*0.56,  f.size*0.10, -f.size*0.35);
        // Large eye with white highlight — gives it a cute character
        pg.fill(15, 15, 35, 230);
        pg.ellipse(f.size*0.20, -f.size*0.10, f.size*0.19, f.size*0.19);
        pg.fill(lerp(255, 180, dn), lerp(255, 180, dn), lerp(255, 220, dn), lerp(200, 120, dn));
        pg.ellipse(f.size*0.24, -f.size*0.15, f.size*0.07, f.size*0.07);

      } else {
        // ── Type 2: Slim dart fish — long thin body, small tail, tiny eye ───────
        // Long thin body
        pg.fill(cr, cg, cb, ca);
        pg.ellipse(0, 0, f.size * 1.28, f.size * 0.26);
        // Small pointed tail
        pg.fill(cr * 0.75, cg * 0.75, cb, ct);
        pg.triangle(-f.size*0.58,  0,  -f.size*0.94, -f.size*0.20,  -f.size*0.94, f.size*0.20);
        // Small dorsal fin
        pg.fill(cr * 0.85, cg * 0.85, cb, cf);
        pg.triangle(f.size*0.05, -f.size*0.12,  -f.size*0.12, -f.size*0.28,  f.size*0.22, -f.size*0.12);
        // Tiny eye
        pg.fill(15, 15, 35, 230);
        pg.ellipse(f.size*0.40, -f.size*0.03, f.size*0.09, f.size*0.09);
      }

      pg.pop();
      pg.drawingContext.restore();
    }

    // Splash drops — tinted to match night (cooler, dimmer at night)
    if (f.drops.length > 0) {
      let dn2 = STATE.dayNight;
      pg.drawingContext.save();
      pg.drawingContext.beginPath();
      pg.drawingContext.rect(0, f.clipTop, nativeW, f.clipBot - f.clipTop);
      pg.drawingContext.clip();
      pg.noStroke();
      for (let d of f.drops) {
        if (d.life <= 0) continue;
        // Splash stays blue-white in day, dims to a faint moonlit blue at night
        let dr = lerp(190, 120, dn2);
        let dg = lerp(220, 150, dn2);
        let db = lerp(255, 210, dn2);
        pg.fill(dr, dg, db, d.life * lerp(185, 100, dn2));
        pg.ellipse(d.x, d.y, 3.5, 3.5);
      }
      pg.drawingContext.restore();
    }
  }
}



