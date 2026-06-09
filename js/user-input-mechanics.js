// Claude helped structure the keyboard/mouse event handlers and the spawned-object array management in this file — the interaction design and all creative choices were developed independently.
// =============================================================================
// js/user-input-mechanics.js
// =============================================================================
//
// PURPOSE:
//   Handles all user input — mouse and keyboard events.
//   Detects what the user did, updates STATE via state.js functions,
//   and manages arrays of spawned objects (flowers, birds, seed trails).
//
// WHAT SKETCH.JS CALLS FROM HERE:
//   drawSpawnedFlowers() → draws all active spawned flower objects
//   drawSpawnedBirds()   → draws all active spawned bird objects
//
// WHAT THIS FILE CALLS:
//   addHealth()          → from state.js, for every positive action
//   subtractHealth()     → from state.js, for every negative action
//   triggerCollapse()    → from state.js, when X pressed 3 times
//   triggerRain()        → from state.js, when R key pressed
//   stopRain()           → from state.js, when rain duration ends
//
// USER ACTIONS AND THEIR EFFECTS:
//   Click on grass area    → flower grows (+10 health)
//   Click + drag on grass  → seed trail → wildflower path blooms (+10 health)
//   Double click a tree    → bird nest forms, 1-2 birds arrive (+10 health)
//   Press R key            → rain shower, flowers + trees grow (+10 health)
//   Press X key            → 1-2 trees fade, flowers fade, water darkens (-10 health)
//   Press X key 3 times    → collapse state triggers
//
// =============================================================================

const TRAIL_POINT_SPACING = 30;   // min px between recorded drag points
const FLOWER_SPACING = 55;   // target px between blooms along the trail
const FLOWER_MIN_GAP = 42;   // reject a bloom closer than this to another
const TRAIL_MIN_LENGTH = 80;   // total drag must exceed this to bloom a trail
const TRAIL_JITTER = 26;   // sideways scatter off the path centre-line
const CLICK_MIN_GAP = 50;   // min px between a new clicked flower and any other

// ── VALID FLOWER ZONES ────────────────────────────────────────────────────────
// Each zone is the visible bounding box of one hill/ground SVG asset,
// derived from path coordinate analysis (scene coordinates).
//
// smallFlowers: true → flowers spawn at half size (hills-6, 7, 8 are more
//               distant in the scene so smaller flowers look more natural)
//
const FLOWER_ZONES = [
  // ── Background hills (small flowers — these are further away) ──────────────
  { id: 'hills-8', xMin: 1018, xMax: 1450, yMin: 421, yMax: 530, smallFlowers: true },
  { id: 'hills-6', xMin: 879, xMax: 1449, yMin: 485, yMax: 634, smallFlowers: true },

  // ── Mid-ground hills (normal flowers) ──────────────────────────────────────
  { id: 'hills-5', xMin: 35, xMax: 743, yMin: 720, yMax: 799, smallFlowers: false },
  { id: 'hills-4', xMin: 594, xMax: 1158, yMin: 880, yMax: 959, smallFlowers: false },
  { id: 'hills-3', xMin: 9, xMax: 1425, yMin: 880, yMax: 959, smallFlowers: false },

  // ── Foreground hills (normal flowers) ──────────────────────────────────────
  { id: 'hills-2', xMin: 0, xMax: 391, yMin: 960, yMax: 1076, smallFlowers: false },
  { id: 'first-hill', xMin: 0, xMax: 391, yMin: 960, yMax: 1081, smallFlowers: false },
  { id: 'hills-1', xMin: 14, xMax: 1448, yMin: 960, yMax: 1087, smallFlowers: false },
];

// ── OVERLAP HELPERS ─────────────────────────────────────────────────────────
// True if (x, y) is within `gap` of any already-spawned flower.
function isTooCloseToFlower(x, y, gap = CLICK_MIN_GAP) {
  return _spawnedFlowers.some(f => dist(x, y, f.x, f.y) < gap);
}

// Returns a plantable point near (x, y) that isn't clustered, or null if the
// area is too crowded. Tries the exact point first, then rings outward.
function findFreePlantSpot(x, y, gap = CLICK_MIN_GAP) {
  // 1. Exact click point is clear → use it.
  if (!isTooCloseToFlower(x, y, gap)) return { x, y };

  // 2. Try positions on expanding rings around the click.
  for (let attempt = 0; attempt < 12; attempt++) {
    let radius = gap * (1 + attempt * 0.25);     // grows each attempt
    let ang = random(0, TWO_PI);
    let nx = x + cos(ang) * radius;
    let ny = y + sin(ang) * radius;

    // Must stay on a valid flower zone AND be clear of other flowers.
    if (getFlowerZone(nx, ny) && !isTooCloseToFlower(nx, ny, gap)) {
      return { x: nx, y: ny };
    }
  }

  // 3. No room nearby → skip this click.
  return null;
}

// ── SPAWNED FLOWERS ───────────────────────────────────────────────────────────
// Array of flower objects spawned by clicking or dragging on grass.
// Each flower grows from a bud to full size over its lifetime.
let _spawnedFlowers = [];

// ── SEED TRAIL ────────────────────────────────────────────────────────────────
// Tracks drag state for seed trail mechanic.
let _isDragging = false;
let _dragPoints = [];       // array of {x, y} points collected during drag
let _trailFlowers = [];       // flowers that bloom along the drag trail

// ── BIRD NESTS ────────────────────────────────────────────────────────────────
// Array of bird nest + bird objects spawned by double clicking a tree.
let _birdNests = [];

// ── FADING TREES ─────────────────────────────────────────────────────────────
// Tracks which tree layers are currently fading or recovering (X key / R key).
// Each entry: { layerId, opacity, recovering }
//   recovering: false → opacity decreasing (X key damage)
//   recovering: true  → opacity increasing back to 1.0 (R key rain recovery)
//   Entry is removed and DOM opacity cleared once recovery reaches 1.0.
let _fadingTrees = [];

// ── RAIN TIMER ────────────────────────────────────────────────────────────────
// Rain runs for a fixed duration then stops automatically.
const RAIN_DURATION = 8000;   // milliseconds (8 seconds of rain)
let _rainStartTime = null;


// =============================================================================
// COORDINATE CONVERSION
// The p5 canvas is fixed at nativeW x nativeH (1455 x 1087) and positioned
// directly over the scene — no scaling. So p5's mouseX/mouseY are already
// in scene coordinates. No conversion needed.
// =============================================================================
function screenToScene(screenX, screenY) {
  return { x: screenX, y: screenY };
}

// Returns the matching flower zone if the point is on a valid hill area,
// or null if the point is not on any valid zone.
function getFlowerZone(sceneX, sceneY) {
  for (let zone of FLOWER_ZONES) {
    if (sceneX >= zone.xMin && sceneX <= zone.xMax &&
      sceneY >= zone.yMin && sceneY <= zone.yMax) {
      return zone;
    }
  }
  return null;
}

// Returns true if the point is on any valid flower zone
function isOnGrass(sceneX, sceneY) {
  return getFlowerZone(sceneX, sceneY) !== null;
}

// ── NEST ZONES ────────────────────────────────────────────────────────────────
// Two specific areas where a double-click forms a nest.
const NEST_ZONES = [
  { xMin: 80,   xMax: 180,  yMin: 680, yMax: 780 },
  { xMin: 1191, xMax: 1300, yMin: 615, yMax: 715 }
];

// Returns true if the click lands inside a nest zone.
function isOnTree(sceneX, sceneY) {
  return NEST_ZONES.some(zone =>
    sceneX >= zone.xMin && sceneX <= zone.xMax &&
    sceneY >= zone.yMin && sceneY <= zone.yMax
  );
}

// =============================================================================
// MOUSE PRESSED
// p5 calls this automatically on every mouse click.
// Detects single click on grass → spawn flower.
// =============================================================================
function mousePressed() {
  if (typeof startAudio === 'function') startAudio();
  let scene = screenToScene(mouseX, mouseY);

  let zone = getFlowerZone(scene.x, scene.y);
  if (zone) {
    // Find a free, non-overlapping spot near the click.
    let spot = findFreePlantSpot(scene.x, scene.y);

    if (spot) {
      // Re-check the zone at the (possibly nudged) spot so size matches the
      // hill it actually lands on.
      let spotZone = getFlowerZone(spot.x, spot.y) || zone;
      spawnFlower(spot.x, spot.y, spotZone.smallFlowers ? 0.5 : 1.0);
      addHealth();

      // Count this flower click — night/fireflies triggers after 5
      STATE.flowerClickCount++;
      if (STATE.flowerClickCount >= FLOWER_CLICK_THRESHOLD &&
        STATE.currentState !== 'COLLAPSE') {
        triggerFireflies();
      }
    }
    // else: area too crowded → no flower, no health. Click simply does nothing.
  }

  // Start drag tracking — only seed the first point if it's on valid grass.
  _isDragging = true;
  _dragPoints = zone ? [{ x: scene.x, y: scene.y, small: zone.smallFlowers }] : [];
}

// =============================================================================
// MOUSE DRAGGED
// p5 calls this every frame while mouse button is held and moving.
// Collects drag points to form the seed trail.
// =============================================================================
function mouseDragged() {
  let scene = screenToScene(mouseX, mouseY);

  let zone = getFlowerZone(scene.x, scene.y);
  if (_isDragging && zone) {
    let last = _dragPoints[_dragPoints.length - 1];
    if (!last || dist(scene.x, scene.y, last.x, last.y) >= TRAIL_POINT_SPACING) {
      _dragPoints.push({ x: scene.x, y: scene.y, small: zone.smallFlowers });
    }
  }
}


// =============================================================================
// MOUSE RELEASED
// p5 calls this when the mouse button is released.
// If the user dragged far enough on grass, bloom wildflowers along the trail.
// =============================================================================
function mouseReleased() {
  if (_isDragging && pathLength(_dragPoints) > TRAIL_MIN_LENGTH) {
    bloomTrailFlowers(_dragPoints);
    addHealth();  // +10 health for planting a wildflower trail
  }

  _isDragging = false;
  _dragPoints = [];
}

// Helper — total length of a polyline of {x, y} points.
function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += dist(points[i].x, points[i].y, points[i - 1].x, points[i - 1].y);
  }
  return total;
}


// =============================================================================
// DOUBLE CLICK
// p5 calls this on double click.
// If over a tree area → spawn bird nest with birds.
// =============================================================================
function doubleClicked() {
  let scene = screenToScene(mouseX, mouseY);

  if (isOnTree(scene.x, scene.y)) {
    spawnBirdNest(scene.x, scene.y);
    addHealth();  // +10 health
  }
}


// =============================================================================
// KEY PRESSED
// p5 calls this on every key press.
// X → negative action (trees fall, health drops)
// R → rain shower (recovery)
// =============================================================================
function keyPressed() {
  if (typeof startAudio === 'function') startAudio();

  if (key === 'x' || key === 'X') {

    STATE.xPressCount++;
    subtractHealth();   // -10 health

    if (STATE.xPressCount >= X_PRESS_COLLAPSE) {
      // Third X press — full collapse: fade 3 trees, wipe ~50% of flowers
      triggerCollapse();
      fadeRandomTrees(3);
      fadeSomeFlowers(max(1, floor(0.50 * _spawnedFlowers.length)));
    } else {
      // First / second X press — fade 1-2 trees, eliminate 20-30% of flowers.
      // max(1, ...) ensures at least one flower dies if any exist.
      fadeRandomTrees(floor(random(1, 3)));
      fadeSomeFlowers(max(1, floor(random(0.20, 0.31) * _spawnedFlowers.length)));
    }
  }

  if (key === 'r' || key === 'R') {
    triggerRain();
    addHealth();          // rain is a positive recovery action
    restoreAllTrees();    // fading trees fade back in when rain comes
    _rainStartTime = millis();

    // Rain also grows some flowers and trees after a delay
    setTimeout(() => {
      // Pick 3 random zones and spawn a flower in each
      for (let i = 0; i < 3; i++) {
        let zone = FLOWER_ZONES[floor(random(FLOWER_ZONES.length))];
        spawnFlower(
          random(zone.xMin, zone.xMax),
          random(zone.yMin, zone.yMax),
          zone.smallFlowers ? 0.5 : 1.0
        );
      }
    }, 3000);
  }
}


// =============================================================================
// SPAWN FLOWER
// Creates a single flower object at the given scene coordinates.
// The flower grows from size 0 to full size over its grow duration.
// =============================================================================
// sizeMult: 1.0 = normal, 0.5 = half size (for distant hills: hills-6, 7, 8)
//
// FLOWER STYLES:
//   style 0 (60%) — rounded ellipse petals, 5 petals. Current look.
//   style 1 (25%) — triangular petals (4–6), Perlin-noise angle wobble.
//   style 2 (15%) — dandelion: many thin spokes with seed-head tips,
//                   each spoke length and angle varied by noise each frame.
//
// All styles share the same grow/fade lifecycle and state-driven tinting.
function spawnFlower(x, y, sizeMult = 1.0) {

  // for pop flower sound
  if (typeof playFlowerPop === 'function') playFlowerPop();

  // Pick style — rarer styles appear less often
  let roll = random(1);
  let style = roll < 0.60 ? 0 : roll < 0.85 ? 1 : 2;

  // Colour palette per style — all muted naturals that suit the landscape
  let r, g, b;
  if (style === 0) {
    // Warm pinks, reds, soft oranges (existing style)
    r = random(200, 255); g = random(80, 175); b = random(60, 120);
  } else if (style === 1) {
    // Cooler purples, lavenders, soft pinks
    r = random(175, 225); g = random(65, 115); b = random(155, 220);
  } else {
    // Pale yellows, creams, whites — dandelion look
    r = random(235, 255); g = random(220, 250); b = random(185, 230);
  }

  _spawnedFlowers.push({
    x, y,
    spawnTime: millis(),   // used for z-order sorting with nests
    size: 2 * sizeMult,
    targetSize: random(18, 30) * sizeMult,
    growSpeed: random(0.5, 1.0),
    r, g, b,
    opacity: 255,
    alive: true,

    // Style metadata — used in drawSpawnedFlowers()
    style: style,
    petalOffset: random(TWO_PI),          // random rotation so no two flowers align
    petalCount: style === 1             // triangular: 4–6 petals
      ? floor(random(4, 7))             //  dandelion: 14–20 spokes
      : floor(random(14, 21)),
    petalSeed: random(10000),           // noise seed for per-petal organic wobble
    swayT: random(10000),           // unique noise seed for stem sway animation
    stemCurve: random(-3.5, 3.5),       // natural lean offset for the bezier control point
  });
}


// =============================================================================
// BLOOM TRAIL FLOWERS
// Takes the array of drag points and spawns flowers along the path,
// each with a staggered delay so they appear to bloom sequentially.
// =============================================================================
function bloomTrailFlowers(points) {
  if (points.length < 2) return;

  let placed = [];   // {x, y} of blooms accepted so far (overlap test)
  let distSoFar = 0;   // distance walked along the path
  let nextAt = 0;   // distance at which to drop the next bloom
  let order = 0;   // sequence index → staggers the bloom timing

  for (let i = 1; i < points.length; i++) {
    let a = points[i - 1];
    let b = points[i];
    let segLen = dist(a.x, a.y, b.x, b.y);
    if (segLen === 0) continue;

    // Unit vector along this segment, and its perpendicular (for sideways jitter)
    let ux = (b.x - a.x) / segLen;
    let uy = (b.y - a.y) / segLen;
    let px = -uy;   // perpendicular
    let py = ux;

    // Step along the segment dropping a bloom each time we pass `nextAt`.
    while (nextAt <= distSoFar + segLen) {
      let t = (nextAt - distSoFar) / segLen;   // 0..1 along this segment
      let bx = a.x + ux * segLen * t;
      let by = a.y + uy * segLen * t;

      // Sideways scatter, perpendicular to the drag direction.
      let off = random(-TRAIL_JITTER, TRAIL_JITTER);
      let fx = bx + px * off + random(-6, 6);
      let fy = by + py * off + random(-6, 6);

      // Reject if too close to a bloom already placed (kills clustering).
      let tooClose = placed.some(q => dist(fx, fy, q.x, q.y) < FLOWER_MIN_GAP);

      // Only bloom if the jittered point is still on valid grass.
      let zone = getFlowerZone(fx, fy);

      if (!tooClose && zone) {
        placed.push({ x: fx, y: fy });
        let small = zone.smallFlowers;
        let delay = order * 120;   // staggered sequential bloom
        order++;
        setTimeout(() => {
          spawnFlower(fx, fy, small ? 0.5 : 1.0);
        }, delay);
      }

      // Vary the gap a little so spacing isn't mechanically perfect.
      nextAt += FLOWER_SPACING + random(-10, 12);
    }

    distSoFar += segLen;
  }
}


// =============================================================================
// FADE SOME FLOWERS
// Removes a random selection of spawned flowers (X key negative action).
// =============================================================================
function fadeSomeFlowers(count) {
  for (let i = 0; i < count; i++) {
    if (_spawnedFlowers.length > 0) {
      // Pick a random flower and start fading it
      let idx = floor(random(_spawnedFlowers.length));
      _spawnedFlowers[idx].alive = false;
    }
  }
}


// =============================================================================
// FADE RANDOM TREES
// Reduces the opacity of randomly chosen tree SVG layers (X key effect).
// Creates the visual of trees "falling and disappearing".
// =============================================================================
function fadeRandomTrees(count) {
  const treeIds = ['tree-1', 'tree-2', 'tree-3', 'tree-4',
    'tree-5', 'tree-6', 'tree-7', 'tree-8'];

  // Shuffle and pick `count` trees
  let shuffled = treeIds.sort(() => random() - 0.5);
  let chosen = shuffled.slice(0, count);

  for (let id of chosen) {
    // Only add if not already fading
    if (!_fadingTrees.find(t => t.layerId === id)) {
      _fadingTrees.push({ layerId: id, opacity: 1.0, recovering: false });
    }
  }
}


// =============================================================================
// RESTORE ALL TREES
// Called when R key is pressed. Flips all currently fading trees into recovery
// mode — their opacity increases each frame until back to 1.0, then they're
// removed from _fadingTrees and the DOM element opacity is cleared.
// =============================================================================
function restoreAllTrees() {
  for (let ft of _fadingTrees) {
    ft.recovering = true;
  }
}


// =============================================================================
// SPAWN NEST
// Creates a nest at the given position. Nest grows from 0 to targetSize,
// stays visible for ~20 seconds, then fades out.
// =============================================================================
function spawnBirdNest(x, y) {
  _birdNests.push({
    x,
    y,
    spawnTime:  millis(),      // used for z-order sorting with flowers
    size:       0,
    targetSize: 18,
    opacity:    255,
    age:        0,
    noiseSeed:  random(10000),
    numEggs:    floor(random(1, 3))  // 1 or 2 eggs, fixed at spawn
  });
}


// =============================================================================
// UPDATE SPAWNED FLOWERS
// Handles rain timer, tree fading, and flower lifecycle (grow/fade/remove).
// Drawing is handled separately by drawOneFlower() so z-order can be respected.
// =============================================================================
function drawSpawnedFlowers() {   // kept as original name so sketch.js call still works

  // Check rain timer — stop rain after RAIN_DURATION
  if (STATE.rainActive && _rainStartTime !== null) {
    if (millis() - _rainStartTime > RAIN_DURATION) {
      stopRain();
      _rainStartTime = null;
    }
  }

  // Update fading trees — fade out on damage, fade back in on recovery
  for (let i = _fadingTrees.length - 1; i >= 0; i--) {
    let ft = _fadingTrees[i];

    if (ft.recovering) {
      ft.opacity += 0.005;
      if (ft.opacity >= 1.0) {
        ft.opacity = 1.0;
        let el = document.getElementById('layer-' + ft.layerId);
        if (el) el.style.opacity = '';
        _fadingTrees.splice(i, 1);
      }
    } else {
      ft.opacity -= 0.005;
      ft.opacity = max(ft.opacity, 0);
    }
  }

  // Flower lifecycle — grow, fade, remove (no drawing here)
  for (let i = _spawnedFlowers.length - 1; i >= 0; i--) {
    let f = _spawnedFlowers[i];
    if (f.alive && f.size < f.targetSize) f.size += f.growSpeed;
    if (!f.alive) f.opacity -= 4;
    if (f.opacity <= 0) { _spawnedFlowers.splice(i, 1); }
  }

  // Nest lifecycle — grow, fade, remove (no drawing here)
  for (let i = _birdNests.length - 1; i >= 0; i--) {
    let nest = _birdNests[i];
    nest.age++;
    if (nest.size < nest.targetSize) nest.size += 0.4;
    const LIFE = 900, FADE = 120;   // 15 seconds at 60fps
    if (nest.age > LIFE - FADE) nest.opacity = map(nest.age, LIFE - FADE, LIFE, 255, 0);
    if (nest.age > LIFE) { _birdNests.splice(i, 1); }
  }
}


// =============================================================================
// DRAW ONE FLOWER  (extracted from the old draw loop)
// =============================================================================
function _drawOneFlower(f) {
  if (f.opacity <= 0) return;

  pg.noStroke();

    // ── State-driven colour tinting ───────────────────────────────────────────
    // Both STATE.collapseTint and STATE.dayNight are smooth lerped values
    // (updated every frame in sketch.js), so colour changes are never snapped.
    //
    // Collapse: petals desaturate and darken toward a dull brown/grey.
    //   Red channel stays relatively high (warm dead-plant look).
    //   Green and blue drain more aggressively.
    //   Opacity drops to 40% of original at full collapse.
    //
    // Night: overall brightness dims to 45% and opacity to 70%.
    //   Blue channels drop less (cool moonlit tint on surviving petals).
    let ct = STATE.collapseTint;   // 0 = healthy, 1 = collapsed
    let dn = STATE.dayNight;       // 0 = day,     1 = full night

    // Collapse tint
    let colR = lerp(f.r, lerp(f.r * 0.7, 100, 0.5), ct);
    let colG = lerp(f.g, 55, ct);
    let colB = lerp(f.b, 40, ct);
    let colA = lerp(f.opacity, f.opacity * 0.35, ct);

    // Night tint (applied on top of collapse tint)
    colR = lerp(colR, colR * 0.40, dn);
    colG = lerp(colG, colG * 0.40, dn);
    colB = lerp(colB, colB * 0.55, dn);   // blue drops less — moonlit look
    colA = lerp(colA, colA * 0.65, dn);   // still somewhat visible at night

    // Stem colour also tints with collapse
    let stemG = lerp(120, 60, ct);
    let stemA = lerp(colA, colA * 0.5, ct);

    // Flower centre colour — yellows shift brown in collapse, dim at night
    let centreR = lerp(255, 140, ct);
    let centreG = lerp(220, 90, ct);
    let centreB = lerp(80, 40, ct);
    centreR = lerp(centreR, centreR * 0.45, dn);
    centreG = lerp(centreG, centreG * 0.45, dn);
    centreB = lerp(centreB, centreB * 0.55, dn);

    // Safe fallbacks for old flower objects that lack new style properties
    let style = f.style !== undefined ? f.style : 0;
    let petalOffset = f.petalOffset !== undefined ? f.petalOffset : 0;
    let petalSeed = f.petalSeed !== undefined ? f.petalSeed : 0;
    let petalCount = f.petalCount !== undefined ? f.petalCount : 16;

    // ── Sway — Perlin noise, base pinned to ground ───────────────────────────────
    // (f.x, f.y) is the fixed stem base — it never moves.
    // The flower head (cx, cy) drifts laterally with noise, and the quadratic
    // bezier stem below stretches naturally between the two points.
    // Sway amplitude scales with targetSize so small/distant flowers sway less.
    // Sway range 8–18 px so the movement is clearly visible.
    // Noise runs at 0.8× noiseT so the breeze feels lively but not jittery.
    let maxSway = map(f.targetSize, 9, 30, 8, 18);
    let swayX = map(noise(f.swayT || 0, STATE.noiseT * 0.8), 0, 1, -maxSway, maxSway);
    let swayY = map(noise((f.swayT || 0) + 500, STATE.noiseT * 0.7), 0, 1, -1.5, 1.5);

    // Swayed flower head — used as draw origin for all petal styles
    let pOffX = (typeof _parallaxX !== 'undefined') ? _parallaxX * 8 : 0;
    let pOffY = (typeof _parallaxY !== 'undefined') ? _parallaxY * 3 : 0;
    let cx = f.x + swayX + pOffX;
    let cy = f.y - f.size + swayY + pOffY;

    // Bass pulse — slightly enlarges flowers on the beat
    let pulse = (typeof getBassPulse === 'function') ? getBassPulse() * 5 : 0;

    // ── Stem — quadratic bezier, base fixed, head follows sway ──────────────────
    // Control point sits at ~55% of stem height with half the sway offset plus
    // the flower's stored stemCurve lean, giving each stem a slightly unique bend
    // even when there is no wind.
    let stemW = (style === 2) ? 0.8 : 1.5;
    pg.stroke(80, stemG, 60, stemA);
    pg.strokeWeight(stemW);
    pg.noFill();
    pg.beginShape();
    pg.vertex(f.x, f.y);                            // fixed ground base — never moves
    pg.quadraticVertex(
      f.x + swayX * 0.5 + (f.stemCurve || 0),      // control x: mid sway + natural lean
      f.y - f.size * 0.55,                           // control y: slightly above midpoint
      cx, cy                                          // swayed flower head
    );
    pg.endShape();
    pg.noStroke();

    // ── Style 0: rounded ellipse petals (5 petals) ──────────────────────────────
    if (style === 0) {
      for (let p = 0; p < 5; p++) {
        let angle = (TWO_PI / 5) * p + petalOffset;
        let petalX = cx + cos(angle) * (f.size + pulse) * 0.5;
        let petalY = cy + sin(angle) * (f.size + pulse) * 0.5;
        pg.fill(colR, colG, colB, colA);
        pg.ellipse(petalX, petalY, (f.size + pulse) * 0.55, (f.size + pulse) * 0.55);
      }
      pg.fill(centreR, centreG, centreB, colA);
      pg.ellipse(cx, cy, f.size * 0.4, f.size * 0.4);

      // ── Style 1: triangular petals (4–6) ────────────────────────────────────────
      // Each petal is a triangle with its tip pointing outward.
      // Perlin noise adds a subtle per-petal angle wobble that changes over time —
      // so petals appear to breathe gently without visible repetition.
    } else if (style === 1) {
      for (let p = 0; p < petalCount; p++) {
        // noise(petalSeed + p*0.4, noiseT) gives each petal its own slow wobble
        let wobble = map(noise(petalSeed + p * 0.4, STATE.noiseT * 0.4), 0, 1, -0.09, 0.09);
        let angle = (TWO_PI / petalCount) * p + petalOffset + wobble;

        // Tip at petalDist from centre
        let tipX = cx + cos(angle) * f.size * 0.88;
        let tipY = cy + sin(angle) * f.size * 0.88;

        // Base of triangle: two points perpendicular at the flower centre
        let spread = f.size * 0.22;
        let b1x = cx + cos(angle + HALF_PI) * spread;
        let b1y = cy + sin(angle + HALF_PI) * spread;
        let b2x = cx - cos(angle + HALF_PI) * spread;
        let b2y = cy - sin(angle + HALF_PI) * spread;

        pg.fill(colR, colG, colB, colA * 0.92);
        pg.triangle(b1x, b1y, b2x, b2y, tipX, tipY);
      }
      // Small centre dot — slightly darker purple tone
      pg.fill(centreR * 0.75, centreG * 0.6, centreB, colA);
      pg.ellipse(cx, cy, f.size * 0.28, f.size * 0.28);

      // ── Style 2: dandelion — thin spokes with tiny seed-head tips ───────────────
      // Perlin noise independently varies each spoke's angle and length each frame,
      // giving the dandelion head a living, breathing quality.
    } else {
      for (let s = 0; s < petalCount; s++) {
        let aWobble = map(noise(petalSeed + s * 0.30, STATE.noiseT * 0.35), 0, 1, -0.13, 0.13);
        let lenMult = map(noise(petalSeed + s * 0.30 + 500, STATE.noiseT * 0.25), 0, 1, 0.75, 1.0);
        let angle = (TWO_PI / petalCount) * s + petalOffset + aWobble;
        // ↓ Reduced to ~75% of previous size (0.68 vs 0.9)
        let spokeLen = f.size * 0.68 * lenMult;

        let x2 = cx + cos(angle) * spokeLen;
        let y2 = cy + sin(angle) * spokeLen;

        // Thin spoke
        pg.stroke(colR, colG, colB, colA * 0.58);
        pg.strokeWeight(0.7);
        pg.line(cx, cy, x2, y2);

        // Tiny seed-head dot at tip — proportionally reduced
        pg.noStroke();
        pg.fill(colR, colG, colB, colA);
        pg.ellipse(x2, y2, max(1.0, f.size * 0.08), max(1.0, f.size * 0.08));
      }
      pg.noStroke();

      // Tiny centre hub — proportionally reduced
      pg.fill(centreR, centreG, centreB, colA * 0.85);
      pg.ellipse(cx, cy, f.size * 0.14, f.size * 0.14);
    }
}   // end _drawOneFlower


// =============================================================================
// DRAW ONE NEST + COMBINED Z-SORTED DRAW
// =============================================================================

// Draws a single nest. Called from drawAllSpawnablesSorted().
function _drawOneNest(nest) {
  let s  = nest.size;
  let op = nest.opacity;
  if (op <= 0) return;

  let dn = STATE.dayNight;
  let ns = nest.noiseSeed;
  let nt = STATE.noiseT;

  let owR = lerp(98,  60, dn), owG = lerp(60, 38, dn), owB = lerp(22, 14, dn);
  let ihR = lerp(52,  32, dn), ihG = lerp(30, 19, dn), ihB = lerp(10,  6, dn);
  let tgR = lerp(62,  38, dn), tgG = lerp(36, 22, dn), tgB = lerp(12,  7, dn);
  let rmR = lerp(120, 75, dn), rmG = lerp(78, 50, dn), rmB = lerp(28, 18, dn);
  let egR = lerp(238, 170, dn), egG = lerp(228, 162, dn), egB = lerp(210, 148, dn);

  const RX = s * 0.75, RY = s * 0.54;
  const IX = s * 0.44, IY = s * 0.32;

  pg.push();
  pg.translate(nest.x, nest.y);

  // Drop shadow
  pg.noStroke();
  pg.fill(20, 10, 3, op * 0.25);
  pg.ellipse(1.5, 3.5, RX * 2.1, RY * 0.6);

  // Outer ring — noisy filled oval
  pg.fill(owR, owG, owB, op * 0.97);
  pg.noStroke();
  pg.beginShape();
  for (let j = 0; j <= 28; j++) {
    let a  = (j / 28) * TWO_PI;
    let nr = map(noise(ns + j * 0.38, nt * 0.14), 0, 1, -s * 0.07, s * 0.07);
    pg.vertex(cos(a) * (RX + nr), sin(a) * (RY + nr * 0.72));
  }
  pg.endShape(CLOSE);

  // Inner hollow — noisy darker oval
  pg.fill(ihR, ihG, ihB, op * 0.92);
  pg.beginShape();
  for (let j = 0; j <= 22; j++) {
    let a  = (j / 22) * TWO_PI;
    let nr = map(noise(ns + 10 + j * 0.42, nt * 0.16), 0, 1, -s * 0.05, s * 0.05);
    pg.vertex(cos(a) * (IX + nr), sin(a) * (IY + nr * 0.72));
  }
  pg.endShape(CLOSE);

  // Radial twig strokes — 12 paths from hollow edge to outer rim
  pg.noFill();
  pg.strokeWeight(0.8);
  for (let k = 0; k < 12; k++) {
    let a  = (k / 12) * TWO_PI + map(noise(ns + k * 1.3), 0, 1, -0.22, 0.22);
    pg.stroke(tgR, tgG, tgB, op * 0.48);
    pg.beginShape();
    for (let j = 0; j <= 7; j++) {
      let t  = j / 7;
      let px = cos(a) * lerp(IX * 0.88, RX * 0.95, t);
      let py = sin(a) * lerp(IY * 0.88, RY * 0.95, t);
      let perp = map(noise(ns + k * 20 + j * 0.6, nt * 0.22), 0, 1, -s * 0.055, s * 0.055);
      pg.vertex(px + (-sin(a) * perp), py + (cos(a) * perp * 0.72));
    }
    pg.endShape();
  }

  // Outer rim stroke
  pg.stroke(rmR, rmG, rmB, op * 0.85);
  pg.strokeWeight(1.6);
  pg.noFill();
  pg.beginShape();
  for (let j = 0; j <= 28; j++) {
    let a  = (j / 28) * TWO_PI;
    let nr = map(noise(ns + 50 + j * 0.38, nt * 0.14), 0, 1, -s * 0.055, s * 0.055);
    pg.vertex(cos(a) * (RX + nr), sin(a) * (RY + nr * 0.72));
  }
  pg.endShape(CLOSE);

  // Eggs — 1 or 2 cream ellipses settled in the hollow.
  // Single egg: centred, slightly larger.
  // Two eggs: smaller and placed left/right so they don't overlap.
  pg.noStroke();
  let numEggs = nest.numEggs || 1;
  // Small noise jitter on y so eggs sit naturally in the cup
  let eJY = map(noise(ns + 300), 0, 1, IY * 0.10, IY * 0.45);

  if (numEggs === 1) {
    let ex = map(noise(ns + 200), 0, 1, -IX * 0.18, IX * 0.18);  // near centre
    pg.fill(egR, egG, egB, op * 0.93);
    pg.ellipse(ex, eJY, s * 0.24, s * 0.17);
    pg.fill(ihR * 0.55, ihG * 0.55, ihB * 0.55, op * 0.28);
    pg.ellipse(ex + 0.5, eJY + s * 0.045, s * 0.20, s * 0.065);
  } else {
    // Two smaller eggs side by side
    let spread = IX * 0.38;
    let offsets = [-spread, spread];
    for (let e = 0; e < 2; e++) {
      let ex = offsets[e] + map(noise(ns + 210 + e * 83), 0, 1, -IX * 0.10, IX * 0.10);
      let ey = eJY   + map(noise(ns + 310 + e * 83), 0, 1, -IY * 0.10, IY * 0.10);
      pg.fill(egR, egG, egB, op * 0.93);
      pg.ellipse(ex, ey, s * 0.18, s * 0.13);
      pg.fill(ihR * 0.55, ihG * 0.55, ihB * 0.55, op * 0.25);
      pg.ellipse(ex + 0.5, ey + s * 0.04, s * 0.15, s * 0.05);
    }
  }

  pg.pop();
}

// Merges flowers and nests sorted by spawnTime so the newest always draws on top.
// Called from sketch.js instead of the old separate draw calls.
function drawAllSpawnablesSorted() {
  // Build combined list (skip fully faded items)
  let list = [];
  for (let f of _spawnedFlowers) {
    if (f.opacity > 0) list.push({ type: 'flower', item: f, t: f.spawnTime || 0 });
  }
  for (let n of _birdNests) {
    if (n.opacity > 0) list.push({ type: 'nest', item: n, t: n.spawnTime || 0 });
  }
  // Oldest first → drawn first → lowest z. Newest last → drawn last → on top.
  list.sort((a, b) => a.t - b.t);
  for (let entry of list) {
    if (entry.type === 'flower') _drawOneFlower(entry.item);
    else                         _drawOneNest(entry.item);
  }
}


// drawSpawnedBirds kept as a no-op stub so sketch.js call doesn't error.
// All drawing is now handled by drawAllSpawnablesSorted() via sketch.js.
function drawSpawnedBirds() {}



