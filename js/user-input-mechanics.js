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
const FLOWER_SPACING      = 55;   // target px between blooms along the trail
const FLOWER_MIN_GAP      = 42;   // reject a bloom closer than this to another
const TRAIL_MIN_LENGTH    = 80;   // total drag must exceed this to bloom a trail
const TRAIL_JITTER        = 26;   // sideways scatter off the path centre-line
const CLICK_MIN_GAP       = 50;   // min px between a new clicked flower and any other

// ── VALID FLOWER ZONES ────────────────────────────────────────────────────────
// Each zone is the visible bounding box of one hill/ground SVG asset,
// derived from path coordinate analysis (scene coordinates).
//
// smallFlowers: true → flowers spawn at half size (hills-6, 7, 8 are more
//               distant in the scene so smaller flowers look more natural)
//
const FLOWER_ZONES = [
  // ── Background hills (small flowers — these are further away) ──────────────
  { id: 'hills-8', xMin: 1018, xMax: 1450, yMin: 421, yMax: 530, smallFlowers: true  },
  { id: 'hills-6', xMin:  879, xMax: 1449, yMin: 485, yMax: 634, smallFlowers: true  },

  // ── Mid-ground hills (normal flowers) ──────────────────────────────────────
  { id: 'hills-5', xMin:   35, xMax:  743, yMin: 720, yMax: 799, smallFlowers: false },
  { id: 'hills-4', xMin:  594, xMax: 1158, yMin: 880, yMax: 959, smallFlowers: false },
  { id: 'hills-3', xMin:    9, xMax: 1425, yMin: 880, yMax: 959, smallFlowers: false },

  // ── Foreground hills (normal flowers) ──────────────────────────────────────
  { id: 'hills-2',    xMin:   0, xMax:  391, yMin: 960, yMax: 1076, smallFlowers: false },
  { id: 'first-hill', xMin:   0, xMax:  391, yMin: 960, yMax: 1081, smallFlowers: false },
  { id: 'hills-1',    xMin:  14, xMax: 1448, yMin: 960, yMax: 1087, smallFlowers: false },
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
    let ang    = random(0, TWO_PI);
    let nx     = x + cos(ang) * radius;
    let ny     = y + sin(ang) * radius;
 
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
let _isDragging      = false;
let _dragPoints      = [];       // array of {x, y} points collected during drag
let _trailFlowers    = [];       // flowers that bloom along the drag trail

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
const RAIN_DURATION   = 8000;   // milliseconds (8 seconds of rain)
let   _rainStartTime  = null;


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

// ── TREE HIT ZONES ────────────────────────────────────────────────────────────
// Approximate bounding boxes for each tree's visible canopy area.
// Derived from layer x/y offsets in layers.js and the scene layout:
//   - Sky occupies y ≈ 0–350
//   - Ocean strip:  y ≈ 360–440 (no trees here)
//   - Tree canopies: y ≈ 280–820
//   - Foreground ground starts at y ≈ 860
//
// These don't need to be pixel-perfect — they just prevent clicks on sky,
// ocean, or pure ground from triggering a bird nest.
const TREE_ZONES = [
  // tree-1  — large foreground tree, left side   (layer x=-30,  y=-120)
  { id: 'tree-1',    xMin:   0, xMax:  500, yMin: 280, yMax: 820 },
  // tree-2  — mid-ground, left-centre             (layer x=100,  y=20)
  { id: 'tree-2',    xMin:  50, xMax:  600, yMin: 300, yMax: 760 },
  // tree-3  — foreground, far left                (layer x=-150, y=100)
  { id: 'tree-3',    xMin:   0, xMax:  400, yMin: 300, yMax: 820 },
  // tree-4  — mid-ground, centre                  (layer x=0,    y=25)
  { id: 'tree-4',    xMin: 200, xMax:  900, yMin: 300, yMax: 760 },
  // tree-5  — mid-ground, far right               (layer x=1250, y=-60)
  { id: 'tree-5',    xMin: 1050, xMax: 1455, yMin: 280, yMax: 720 },
  // tree-6  — mid-ground, left                    (layer x=-100, y=65)
  { id: 'tree-6',    xMin:   0, xMax:  600, yMin: 320, yMax: 780 },
  // tree-7  — mid-ground, centre-right            (layer x=0,    y=0)
  { id: 'tree-7',    xMin: 300, xMax: 1200, yMin: 300, yMax: 760 },
  // tree-8  — background, spread across scene     (layer x=0,    y=-64)
  { id: 'tree-8',    xMin: 100, xMax: 1350, yMin: 280, yMax: 680 },
  // tree-bush — mid-ground shrub/tree cluster     (layer x=0,    y=0)
  { id: 'tree-bush', xMin: 100, xMax:  900, yMin: 320, yMax: 760 },
];

// Returns true if the click lands inside any tree's bounding zone.
// Also rejects clicks in the ocean strip (y ≈ 360–440) where no trees grow.
function isOnTree(sceneX, sceneY) {
  // Hard-reject the ocean strip — no trees visible there
  if (sceneY >= 360 && sceneY <= 440) return false;

  return TREE_ZONES.some(zone =>
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

  // Pick style — rarer styles appear less often
  let roll  = random(1);
  let style = roll < 0.60 ? 0 : roll < 0.85 ? 1 : 2;

  // Colour palette per style — all muted naturals that suit the landscape
  let r, g, b;
  if (style === 0) {
    // Warm pinks, reds, soft oranges (existing style)
    r = random(200, 255); g = random(80,  175); b = random(60,  120);
  } else if (style === 1) {
    // Cooler purples, lavenders, soft pinks
    r = random(175, 225); g = random(65,  115); b = random(155, 220);
  } else {
    // Pale yellows, creams, whites — dandelion look
    r = random(235, 255); g = random(220, 250); b = random(185, 230);
  }

  _spawnedFlowers.push({
    x, y,
    size:       2 * sizeMult,
    targetSize: random(18, 30) * sizeMult,
    growSpeed:  random(0.5, 1.0),
    r, g, b,
    opacity:    255,
    alive:      true,

    // Style metadata — used in drawSpawnedFlowers()
    style:       style,
    petalOffset: random(TWO_PI),          // random rotation so no two flowers align
    petalCount:  style === 1             // triangular: 4–6 petals
      ? floor(random(4, 7))             //  dandelion: 14–20 spokes
      : floor(random(14, 21)),
    petalSeed:   random(10000),           // noise seed for per-petal organic wobble
    swayT:       random(10000),           // unique noise seed for stem sway animation
    stemCurve:   random(-3.5, 3.5),       // natural lean offset for the bezier control point
  });
}


// =============================================================================
// BLOOM TRAIL FLOWERS
// Takes the array of drag points and spawns flowers along the path,
// each with a staggered delay so they appear to bloom sequentially.
// =============================================================================
function bloomTrailFlowers(points) {
  if (points.length < 2) return;
 
  let placed   = [];   // {x, y} of blooms accepted so far (overlap test)
  let distSoFar = 0;   // distance walked along the path
  let nextAt    = 0;   // distance at which to drop the next bloom
  let order     = 0;   // sequence index → staggers the bloom timing
 
  for (let i = 1; i < points.length; i++) {
    let a = points[i - 1];
    let b = points[i];
    let segLen = dist(a.x, a.y, b.x, b.y);
    if (segLen === 0) continue;
 
    // Unit vector along this segment, and its perpendicular (for sideways jitter)
    let ux = (b.x - a.x) / segLen;
    let uy = (b.y - a.y) / segLen;
    let px = -uy;   // perpendicular
    let py =  ux;
 
    // Step along the segment dropping a bloom each time we pass `nextAt`.
    while (nextAt <= distSoFar + segLen) {
      let t  = (nextAt - distSoFar) / segLen;   // 0..1 along this segment
      let bx = a.x + ux * segLen * t;
      let by = a.y + uy * segLen * t;
 
      // Sideways scatter, perpendicular to the drag direction.
      let off = random(-TRAIL_JITTER, TRAIL_JITTER);
      let fx  = bx + px * off + random(-6, 6);
      let fy  = by + py * off + random(-6, 6);
 
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
  let chosen   = shuffled.slice(0, count);

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
// SPAWN BIRD NEST
// Creates a bird nest object at the given position with 1-2 birds that
// fly in and settle near the nest.
// =============================================================================
function spawnBirdNest(x, y) {
  let birdCount = floor(random(1, 3)); // 1 or 2 birds
  let birds     = [];

  for (let i = 0; i < birdCount; i++) {
    birds.push({
      // Birds start off-screen to the left and fly toward the nest
      x:       -50,
      y:       random(150, 400),
      targetX: x + random(-40, 40),
      targetY: y - random(20, 60),
      speed:   random(2, 4),
      arrived: false,
      flapT:   random(1000)    // offset so birds don't flap in sync
    });
  }

  _birdNests.push({
    x:      x,
    y:      y,
    size:   0,             // nest grows from 0
    targetSize: 30,
    birds:  birds,
    age:    0              // incremented each frame, used for lifetime
  });
}


// =============================================================================
// DRAW SPAWNED FLOWERS
// Called every frame from draw() in sketch.js.
// Grows each flower toward its target size, fades dead ones, removes gone ones.
// =============================================================================
function drawSpawnedFlowers() {

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
      // R key triggered recovery — fade back in
      ft.opacity += 0.005;  // same speed as fade-out
      if (ft.opacity >= 1.0) {
        ft.opacity = 1.0;
        // Reset DOM element opacity and remove from tracking array
        let el = document.getElementById('layer-' + ft.layerId);
        if (el) el.style.opacity = '';
        _fadingTrees.splice(i, 1);
      }
    } else {
      // X key damage — continue fading out
      ft.opacity -= 0.005;
      ft.opacity  = max(ft.opacity, 0);
    }
  }

  pg.noStroke();

  // Draw and update each spawned flower
  for (let i = _spawnedFlowers.length - 1; i >= 0; i--) {
    let f = _spawnedFlowers[i];

    // Grow toward target size
    if (f.alive && f.size < f.targetSize) {
      f.size += f.growSpeed;
    }

    // Fade out dead flowers
    if (!f.alive) {
      f.opacity -= 4;
    }

    // Remove fully faded flowers
    if (f.opacity <= 0) {
      _spawnedFlowers.splice(i, 1);
      continue;
    }

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
    let colG = lerp(f.g, 55,  ct);
    let colB = lerp(f.b, 40,  ct);
    let colA = lerp(f.opacity, f.opacity * 0.35, ct);

    // Night tint (applied on top of collapse tint)
    colR = lerp(colR, colR * 0.40, dn);
    colG = lerp(colG, colG * 0.40, dn);
    colB = lerp(colB, colB * 0.55, dn);   // blue drops less — moonlit look
    colA = lerp(colA, colA * 0.65, dn);   // still somewhat visible at night

    // Stem colour also tints with collapse
    let stemG = lerp(120, 60,  ct);
    let stemA = lerp(colA, colA * 0.5, ct);

    // Flower centre colour — yellows shift brown in collapse, dim at night
    let centreR = lerp(255, 140, ct);
    let centreG = lerp(220, 90,  ct);
    let centreB = lerp(80,  40,  ct);
    centreR = lerp(centreR, centreR * 0.45, dn);
    centreG = lerp(centreG, centreG * 0.45, dn);
    centreB = lerp(centreB, centreB * 0.55, dn);

    // Safe fallbacks for old flower objects that lack new style properties
    let style       = f.style       !== undefined ? f.style       : 0;
    let petalOffset = f.petalOffset !== undefined ? f.petalOffset : 0;
    let petalSeed   = f.petalSeed   !== undefined ? f.petalSeed   : 0;
    let petalCount  = f.petalCount  !== undefined ? f.petalCount  : 16;

    // ── Sway — Perlin noise, base pinned to ground ───────────────────────────────
    // (f.x, f.y) is the fixed stem base — it never moves.
    // The flower head (cx, cy) drifts laterally with noise, and the quadratic
    // bezier stem below stretches naturally between the two points.
    // Sway amplitude scales with targetSize so small/distant flowers sway less.
    // Sway range 8–18 px so the movement is clearly visible.
    // Noise runs at 0.8× noiseT so the breeze feels lively but not jittery.
    let maxSway = map(f.targetSize, 9, 30, 8, 18);
    let swayX   = map(noise(f.swayT        || 0, STATE.noiseT * 0.8),  0, 1, -maxSway, maxSway);
    let swayY   = map(noise((f.swayT || 0) + 500, STATE.noiseT * 0.7), 0, 1, -1.5, 1.5);

    // Swayed flower head — used as draw origin for all petal styles
    let cx = f.x + swayX;
    let cy = f.y - f.size + swayY;

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
        let angle  = (TWO_PI / 5) * p + petalOffset;
        let petalX = cx + cos(angle) * f.size * 0.5;
        let petalY = cy + sin(angle) * f.size * 0.5;
        pg.fill(colR, colG, colB, colA);
        pg.ellipse(petalX, petalY, f.size * 0.55, f.size * 0.55);
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
        let angle  = (TWO_PI / petalCount) * p + petalOffset + wobble;

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
        let aWobble = map(noise(petalSeed + s * 0.30,       STATE.noiseT * 0.35), 0, 1, -0.13, 0.13);
        let lenMult = map(noise(petalSeed + s * 0.30 + 500, STATE.noiseT * 0.25), 0, 1, 0.75, 1.0);
        let angle    = (TWO_PI / petalCount) * s + petalOffset + aWobble;
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
  }
}


// =============================================================================
// DRAW SPAWNED BIRDS
// Called every frame from draw() in sketch.js.
// Moves birds toward their target (nest), draws them as simple wing shapes.
// =============================================================================
function drawSpawnedBirds() {

  pg.noFill();
  pg.strokeWeight(1.2);

  for (let i = _birdNests.length - 1; i >= 0; i--) {
    let nest = _birdNests[i];
    nest.age++;

    // Grow nest
    if (nest.size < nest.targetSize) nest.size += 0.5;

    // Draw nest — simple arc shape
    pg.stroke(100, 70, 40, 200);
    pg.strokeWeight(2);
    pg.noFill();
    pg.arc(nest.x, nest.y, nest.size * 2, nest.size, 0, PI);

    // Draw and move each bird
    for (let bird of nest.birds) {

      if (!bird.arrived) {
        // Move bird toward its target position
        bird.x += (bird.targetX - bird.x) * bird.speed * 0.02;
        bird.y += (bird.targetY - bird.y) * bird.speed * 0.02;

        // Check if close enough to nest
        if (dist(bird.x, bird.y, bird.targetX, bird.targetY) < 5) {
          bird.arrived = true;
        }
      }

      // Draw bird as two curved wing strokes (same approach as project_v4)
      let flapAngle = sin(frameCount * 0.1 + bird.flapT) * 0.4;
      let wl        = 12;  // wing length

      pg.stroke(40, 30, 20, 220);
      pg.strokeWeight(1);

      // Left wing
      pg.beginShape();
      pg.vertex(bird.x, bird.y);
      pg.quadraticVertex(
        bird.x - wl * 0.5, bird.y - sin(flapAngle) * wl * 0.3,
        bird.x - wl,       bird.y - sin(flapAngle) * wl * 0.6
      );
      pg.endShape();

      // Right wing
      pg.beginShape();
      pg.vertex(bird.x, bird.y);
      pg.quadraticVertex(
        bird.x + wl * 0.5, bird.y - sin(flapAngle) * wl * 0.3,
        bird.x + wl,       bird.y - sin(flapAngle) * wl * 0.6
      );
      pg.endShape();
    }

    // Remove nest after 30 seconds (birds eventually fly away)
    if (nest.age > 1800) {
      _birdNests.splice(i, 1);
    }
  }
}



