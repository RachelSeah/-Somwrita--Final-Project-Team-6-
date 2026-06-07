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


