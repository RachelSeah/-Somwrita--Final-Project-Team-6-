// =============================================================================
// sketch.js — MAIN FILE
// =============================================================================
//
// ARCHITECTURE (DOM + p5 hybrid):
//   SVG layers live in the HTML DOM — rendered as crisp vectors at any res.
//   p5 canvas is a transparent overlay — draws procedural effects only:
//     ocean waves, rain, fireflies, spawned flowers, spawned birds.
//
// WHAT THIS FILE DOES:
//   setup()               → creates transparent p5 canvas over the scene
//   draw()                → applies CSS to DOM layers + draws procedural effects
//   updateLayerTransforms → applies sway + cloud + sun offsets via CSS transform
//   updateDayNightCSS     → crossfades day/night SVG versions via CSS opacity
//   updateTintCSS         → applies health-based colour filter via CSS filter
//   updateFadingTreesCSS  → applies X-key tree fade via CSS opacity
//   drawRain              → rain particles on canvas (noise.js manages particles)
//   drawFireflies         → glowing dots on canvas (noise.js manages particles)
//
// =============================================================================


// Native scene dimensions — SVGs and all coordinates use these
const nativeW = 1455;
const nativeH = 1087;

// pg — offscreen buffer for rain, fireflies, flowers (composited onto main canvas)
let pg;

let _parallaxX = 0;   // smoothed mouse parallax offset X
let _parallaxY = 0;   // smoothed mouse parallax offset Y



// =============================================================================
// PRELOAD — runs once before setup()
// No SVG loading needed — scene.js handles that via the DOM.
// Sound loading is disabled until MP3 files are added to assets/sounds/.
// =============================================================================
function preload() {
  if (typeof preloadSounds === 'function') preloadSounds();
}


// =============================================================================
// SETUP — runs once after preload()
// =============================================================================
function setup() {

  // Create canvas at native scene size and parent it inside scene-container
  // It sits on top of the SVG DOM scene as a transparent overlay
  let cnv = createCanvas(nativeW, nativeH);
  cnv.parent('scene-container');

  // Graphics buffer for procedural effects — same size as scene
  pg = createGraphics(nativeW, nativeH);
  pg.noStroke();

  // Initialise Perlin noise systems — noise.js
  if (typeof initNoise === 'function') initNoise();

  if (typeof setupSounds === 'function') setupSounds();

  // intialise set up for birds
  if (typeof initBirds === 'function') initBirds();
}


// =============================================================================
// DRAW — runs ~60 times per second
//
// ORDER:
//   1. Wait for SVG scene to finish loading
//   2. Update all state values
//   3. Apply visual effects to DOM SVG layers (CSS)
//   4. Draw procedural effects to pg (canvas)
//   5. Render pg onto the transparent main canvas
// =============================================================================
function draw() {

  // ── 1. WAIT FOR SCENE ───────────────────────────────────────────────────────
  // scene.js builds the DOM asynchronously — don't animate until it's ready
  if (!window._sceneReady) {
    clear();
    return;
  }

  // ── 2. UPDATE STATE ─────────────────────────────────────────────────────────
  STATE.noiseT += 0.005;

  if (typeof updateClouds === 'function') updateClouds();
  if (typeof updateDayNight === 'function') updateDayNight();
  if (typeof updateCollapseTint === 'function') updateCollapseTint();
  if (typeof updateNoise === 'function') updateNoise();
  if (typeof updateSound === 'function') updateSound();
  _parallaxX = lerp(_parallaxX, map(mouseX, 0, nativeW, -1, 1), 0.05);
  _parallaxY = lerp(_parallaxY, map(mouseY, 0, nativeH, -1, 1), 0.05);
  // ── 3. APPLY CSS TO DOM LAYERS ──────────────────────────────────────────────
  // SVGs are in the DOM — we animate them via CSS, not by redrawing

  // Sway (Perlin noise), cloud drift, sun rise — CSS transform
  updateLayerTransforms();

  // Day / night crossfade — CSS opacity on .layer-day / .layer-night
  updateDayNightCSS();

  // Evening neon colour shift on night sky and mountains
  updateNightColorCSS();

  // Health-based colour degradation — CSS filter on tintable layers
  updateTintCSS();

  // X key tree fading — CSS opacity on individual tree layers
  updateFadingTreesCSS();

  // ── 4. DRAW PROCEDURAL EFFECTS TO pg ────────────────────────────────────────
  pg.clear();

  // Draw rain when active OR while still fading out (getRainOpacity > 0)
  let rOpacity = (typeof getRainOpacity === 'function') ? getRainOpacity() : 0;
  if (rOpacity > 0) drawRain(rOpacity);

  // Draw fish during rain (spawns only while rainActive; finishes existing arcs after)
  if (typeof drawFish === 'function') drawFish();

  // Draw fireflies when active OR while still fading out (_fireflyOpacity > 0)
  let fOpacity = (typeof getFireflyOpacity === 'function') ? getFireflyOpacity() : 0;
  if (fOpacity > 0) drawFireflies(fOpacity);

  if (typeof drawSpawnedFlowers === 'function') drawSpawnedFlowers();
  if (typeof drawSpawnedBirds === 'function') drawSpawnedBirds();

  // ── 5. RENDER pg ONTO TRANSPARENT MAIN CANVAS ───────────────────────────────
  // clear() makes the main canvas fully transparent so the DOM scene shows through
  clear();
  image(pg, 0, 0, nativeW, nativeH);

  // - RENDER birds
  clear();
  image(pg, 0, 0, nativeW, nativeH);
  if (typeof updateBirds === 'function') updateBirds(); // ← add this

  if (typeof updateOceanSway === 'function') updateOceanSway();
}


// =============================================================================
// UPDATE LAYER TRANSFORMS
// Applies sway, cloud drift, and sun rise to DOM layer elements via CSS transform.
// Only updates layers that actually move each frame — static layers are skipped.
// =============================================================================
function updateLayerTransforms() {

  for (let i = 0; i < LAYERS.length; i++) {
    let layer = LAYERS[i];

    let isCloud = STATE.cloudOffsets && STATE.cloudOffsets[layer.id] !== undefined;
    let isSun = layer.id === 'sun';
    let hasSway = layer.sway;

    // Skip layers that never move — no need to set their transform each frame
    if (!isCloud && !isSun && !hasSway && layer.id !== 'ocean') continue;

    let el = document.getElementById('layer-' + layer.id);
    if (!el) continue;

    let dx = layer.x;
    let dy = layer.y;

    // Add Perlin noise sway offset (from noise.js)
    if (hasSway && typeof getSwayOffset === 'function') {
      let sway = getSwayOffset(layer);
      dx += sway.dx;
      dy += sway.dy;
    }

    // Add cloud drift offset (updated by time.js each frame)
    if (isCloud) dx += STATE.cloudOffsets[layer.id];

    // Add sun rise offset (from time.js — approaches 0 over 60 seconds)
    if (isSun && typeof getSunRiseOffset === 'function') {
      dy += getSunRiseOffset();
    }

    if (layer.id === 'ocean') dx += sin(frameCount * 0.01) * 25;
    // Background layers (low i) move less, foreground (high i) move more
    let depth = i / (LAYERS.length - 1);
    dx += _parallaxX * map(depth, 0, 1, 2, 12);
    dy += _parallaxY * map(depth, 0, 1, 1, 15);
    el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
  }
}


// =============================================================================
// UPDATE DAY / NIGHT CSS
// Crossfades between day and night SVG versions by adjusting CSS opacity.
// STATE.dayNight (0=day, 1=night) is updated by time.js each frame.
// =============================================================================
function updateDayNightCSS() {

  for (let layer of LAYERS) {
    let el = document.getElementById('layer-' + layer.id);
    if (!el) continue;

    let dayEl = el.querySelector('.layer-day');
    let nightEl = el.querySelector('.layer-night');

    if (dayEl) dayEl.style.opacity = (1 - STATE.dayNight);

    if (nightEl) {
      // Cap the dark overlay at 0.5 so it darkens without flattening all detail.
      // All other night layers fade to full opacity as normal.
      let maxOpacity = (layer.id === 'dark-overlay') ? 0.55 : 1.0;
      nightEl.style.opacity = STATE.dayNight * maxOpacity;
    }
  }
}


// =============================================================================
// UPDATE NIGHT COLOR CSS
// Applies per-layer brightness adjustments at night to keep each element
// visually distinct. No hue changes — original colours are preserved.
//
// APPROACH:
//   The dark overlay alone flattens all layers to the same darkness.
//   By giving each layer a different brightness at night, we restore the
//   depth separation: background elements are darker, foreground elements
//   are slightly brighter, creating readable contrast between layers.
//
//   Values are the target brightness % at full night (t=1).
//   At t=0 (day) all filters are cleared.
// =============================================================================
function updateNightColorCSS() {

  let t = STATE.dayNight;

  // At full day, remove all filters and return
  if (t <= 0) {
    for (let layer of LAYERS) {
      let el = document.getElementById('layer-' + layer.id);
      if (!el) continue;
      let nightEl = el.querySelector('.layer-night');
      if (nightEl) nightEl.style.filter = '';
    }
    return;
  }

  // Per-layer brightness at full night (t=1).
  // Background = darker, midground = medium, foreground = brighter.
  // Clouds boosted so they stay readable against dark sky.
  const nightBrightness = {
    'sky': 55,   // darkest — deep background
    'ocean': 70,   // dark water
    'mountain': 65,   // dark but slightly lighter than sky
    'island': 75,
    'cloud-1': 160,  // clouds boosted — semi-transparent SVGs need this
    'cloud-2': 155,
    'cloud-3': 150,
    'hills-7': 72,
    'hills-8': 72,
    'hills-6': 76,
    'hills-4': 78,
    'tree-8': 85,
    'bush-2': 88,
    'hills-5': 80,
    'tree-bush': 90,
    'tree-4': 88,
    'tree-6': 88,
    'hills-3': 82,
    'tree-7': 90,
    'tree-5': 90,
    'tree-2': 92,
    'bush-1': 90,
    'tree-1': 95,   // foreground trees — brightest vegetation
    'tree-3': 95,
    'bush-3': 92,
    'hills-2': 85,
    'flowers': 100,
    'first-hill': 88,
    'hills-1': 90,   // closest foreground — most visible
  };

  for (let id in nightBrightness) {
    let el = document.getElementById('layer-' + id);
    if (!el) continue;
    let nightEl = el.querySelector('.layer-night');
    if (!nightEl) continue;

    // Lerp from 100% (normal) toward the target brightness as night deepens
    let b = Math.round(lerp(100, nightBrightness[id], t));
    nightEl.style.filter = 'brightness(' + b + '%)';
  }
}


// =============================================================================
// UPDATE TINT CSS
// Applies health-based colour degradation to tintable layers via CSS filter.
// STATE.collapseTint (0=healthy, 1=collapsed) is updated by state.js.
//
// tintGroup 'sky'        → darkens and desaturates (stormy sky)
// tintGroup 'vegetation' → sepia + darken (dead/dying plants)
// tintGroup 'water'      → sepia + darken (murky water)
// =============================================================================
function updateTintCSS() {

  let t = STATE.collapseTint;

  for (let layer of LAYERS) {
    if (!layer.tintable) continue;

    let el = document.getElementById('layer-' + layer.id);
    if (!el) continue;

    // When scene is healthy (t = 0), remove any filter entirely.
    // Even a "neutral" CSS filter like brightness(100%) changes rendering
    // compared to no filter at all — so we clear it when not needed.
    if (t <= 0.01) {
      el.style.filter = '';
      continue;
    }

    let f = '';

    if (layer.tintGroup === 'sky') {
      let brightness = Math.round(lerp(100, 40, t));
      let saturate = Math.round(lerp(100, 30, t));
      f = 'brightness(' + brightness + '%) saturate(' + saturate + '%)';

    } else if (layer.tintGroup === 'vegetation') {
      let sepia = Math.round(lerp(0, 60, t));
      let brightness = Math.round(lerp(100, 65, t));
      f = 'sepia(' + sepia + '%) brightness(' + brightness + '%)';

    } else if (layer.tintGroup === 'water') {
      let sepia = Math.round(lerp(0, 50, t));
      let brightness = Math.round(lerp(100, 55, t));
      f = 'sepia(' + sepia + '%) brightness(' + brightness + '%)';
    }

    if (f) el.style.filter = f;
  }
}


// =============================================================================
// UPDATE FADING TREES CSS
// Applies CSS opacity to tree layers that are currently fading (X key effect).
// _fadingTrees array is managed by user-input-mechanics.js.
// =============================================================================
function updateFadingTreesCSS() {
  if (typeof _fadingTrees === 'undefined') return;

  // Foreground trees that get the night opacity floor
  const foregroundTrees = ['tree-1', 'tree-3'];

  for (let ft of _fadingTrees) {
    let el = document.getElementById('layer-' + ft.layerId);
    if (!el) continue;

    let opacity = ft.opacity;

    // At night, foreground trees must stay at least 0.65 opacity
    // so they remain visible and don't disappear into the dark scene
    if (STATE.dayNight > 0 && foregroundTrees.includes(ft.layerId)) {
      opacity = max(opacity, 0.65);
    }

    el.style.opacity = opacity;
  }
}



// =============================================================================
// DRAW RAIN
// Draws rain as teardrop-shaped filled ellipses on pg.
//
// DEPTH + CLIPPING:
//   Rain is drawn in three passes, one per depth layer, each clipped to its
//   scene zone via the raw Canvas 2D API (pg.drawingContext):
//     depth 0 (BG)  → clipped to y < 640  (sky, mountains, ocean, BG hills)
//     depth 1 (MID) → clipped to y < 870  (stops before foreground ground)
//     depth 2 (FG)  → full scene, no clip
//   Clipping prevents background drops from appearing over foreground elements,
//   creating the visual illusion that rain is falling at all scene depths
//   even though technically all drops are on a single canvas overlay.
//
// SHAPE:
//   Narrow rotated ellipse (body) + larger circle at the leading tip = teardrop.
//   p.angle - HALF_PI maps fall direction to ellipse orientation.
//
// globalOpacity: 0–1 from getRainOpacity() — drives smooth fade in/out.
// =============================================================================
function drawRain(globalOpacity = 1.0) {

  let particles = (typeof getRainParticles === 'function')
    ? getRainParticles()
    : [];

  // Per-depth opacity multipliers — two faint BG layers, one mid, one FG.
  const depthOpacity = [0.20, 0.35, 0.65, 1.0];

  // Clip heights matching RAIN_DEPTH.clipY in noise.js
  const depthClipY = [640, 720, 870, 1100];

  pg.noStroke();

  // Helper — draws one teardrop drop, called inside each clipped pass
  function drawDrop(p, opacMult) {
    let r = lerp(190, 215, p.weight);
    let g = lerp(215, 232, p.weight);
    let b = lerp(255, 248, p.weight);

    let baseOpacity = lerp(55, 195, p.weight);
    let alpha = (p.opacity / 220) * baseOpacity * opacMult * globalOpacity;

    // Horizon fade — BG drops dissolve as y approaches 440 (horizon line).
    // Two BG layers each fade over different ranges, creating a layered dissolve.
    // MID gets a subtle version. FG (depth 3) is unaffected.
    if (p.depth === 0) {
      alpha *= constrain(map(p.y, 440, 600, 0, 1), 0, 1);  // BG1: long fade range
    } else if (p.depth === 1) {
      alpha *= constrain(map(p.y, 440, 560, 0, 1), 0, 1);  // BG2: shorter fade range
    } else if (p.depth === 2) {
      alpha *= constrain(map(p.y, 440, 510, 0, 1), 0, 1);  // MID: subtle fade
    }

    let dropLen = p.len;
    let dropW = lerp(1.2, 3.8, p.weight) * p.depthScale;

    // Centre the drop midway along its fall trajectory
    let cx = p.x + cos(p.angle) * dropLen * 0.5;
    let cy = p.y + sin(p.angle) * dropLen * 0.5;

    // pg.push/pop nests inside drawingContext.save/restore safely —
    // the inner save/restore pair preserves the clip while transforms change
    pg.push();
    pg.translate(cx, cy);
    pg.rotate(p.angle - HALF_PI);  // HALF_PI = vertical, tilts with wind

    // Elongated body
    pg.fill(r, g, b, alpha);
    pg.ellipse(0, 0, dropW, dropLen);

    // Round leading-edge head — wider circle at the bottom of the teardrop
    pg.fill(r, g, b, alpha * 1.2);
    pg.ellipse(0, dropLen * 0.45, dropW * 2.1, dropW * 2.1);

    pg.pop();
  }

  // ── Three clipped passes, back-to-front ──────────────────────────────────
  for (let d = 0; d < 4; d++) {

    if (d < 3) {
      // BG1, BG2, MID: clip to their zone so drops don't appear over foreground
      pg.drawingContext.save();
      pg.drawingContext.beginPath();
      pg.drawingContext.rect(0, 0, nativeW, depthClipY[d]);
      pg.drawingContext.clip();
    }

    for (let p of particles) {
      if (p.depth === d) drawDrop(p, depthOpacity[d]);
    }

    if (d < 3) {
      pg.drawingContext.restore();  // release clip before next pass
    }
  }
}


// =============================================================================
// DRAW FIREFLIES
// Draws glowing firefly dots on pg.
// Positions and brightness come from noise.js (getFireflies).
// =============================================================================
// opacity parameter (0–1) comes from noise.js getFireflyOpacity()
// and drives the global fade in/out effect
function drawFireflies(opacity = 1.0) {

  let fflies = (typeof getFireflies === 'function')
    ? getFireflies()
    : [];

  pg.noStroke();

  for (let f of fflies) {
    // Multiply per-firefly brightness by global fade opacity
    let b = f.brightness * opacity;

    // Soft outer glow
    pg.fill(200, 255, 150, b * 0.08);
    pg.ellipse(f.x, f.y, f.size * 4, f.size * 4);

    // Inner glow
    pg.fill(220, 255, 160, b * 0.25);
    pg.ellipse(f.x, f.y, f.size * 2, f.size * 2);

    // Bright core
    pg.fill(240, 255, 190, b);
    pg.ellipse(f.x, f.y, f.size, f.size);
  }
}
