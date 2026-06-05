/* 
File - js/layers.js

 PURPOSE:
   This file is the "scene recipe". It defines every SVG element in the
   scene as a data table — what files to load, where each element sits 
   and how it behaves (does it sway? does it change colour with health?).

 How sketch.js uses this:
   1. In preload()  → loops through LAYERS to load every SVG file into memory
   2. In draw()     → loops through LAYERS again to paint each one on screen
                      in the correct order (index 0 = furthest back)

 How other files use this:
   noise.js         → checks layer.sway and layer.swayAmount to know
                      which elements move in the breeze, and by how much
   sketch.js        → checks layer.tintable and layer.tintGroup to know
                      which elements change colour when health drops

 TO ADJUST A POSITION: change the x/y values for that layer.
   x: positive = right,  negative = left
   y: positive = down,   negative = up

 TO REORDER LAYERS: cut an entry and paste it higher (more back) or
   lower (more front) in the array.
*/
// =============================================================================


const LAYERS = [

  // ── SKY ──────────────────────────────────────────────────────────────────────
  // The sky gradient background. Drawn first = furthest back.
  // In collapse state, sky darkens — so tintable: true, tintGroup: 'sky'.
  {
    id:         'sky',            // unique name used to identify this layer
    dayFile:    'Assets-25.svg',              // filename inside assets/day/
    nightFile:  'Assets Night-25.svg',        // filename inside assets/night/
    x: 3,   y: 0,                // position offset in pixels from top-left
    sway:       false,            // does this element sway in the breeze?
    swayAmount: 0,                // intensity of sway: 0 = none, 1 = maximum
    tintable:   true,             // does this change colour based on health?
    tintGroup:  'sky'             // which colour group: 'sky' darkens/greys
  },

  // ── SUN ──────────────────────────────────────────────────────────────────────
  // The sun. No night version — it simply disappears at night (opacity → 0).
  // Not tintable — the sun stays its natural colour regardless of health.
  {
    id:         'sun',
    dayFile:    'Assets_Sun.svg',
    nightFile:  null,             // null means no night version exists
    x: 0,   y: 0,
    sway:       false,
    swayAmount: 0,
    tintable:   false,
    tintGroup:  null
  },

  // ── OCEAN ────────────────────────────────────────────────────────────────────
  // The ocean/water. This acts as our "river" for the health system —
  // it gets darker/browner as health drops (tintGroup: 'water').
  {
    id:         'ocean',
    dayFile:    'Assets_Ocean-1.svg',
    nightFile:  'Assets Night_Ocean-1.svg',
    x: 0,   y: -58,
    sway:       false,
    swayAmount: 0,
    tintable:   true,
    tintGroup:  'water'           // 'water' gets a brownish/murky tint in collapse
  },

  // ── MOUNTAIN ─────────────────────────────────────────────────────────────────
  // Background mountain range. Turns brown in collapse state to show
  // deforestation (loss of tree cover on the mountains).
  {
    id:         'mountain',
    dayFile:    'Assets_Mountain-1.svg',
    nightFile:  'Assets Night_Mountain-Background-1.svg',
    x: 7,   y: -63,
    sway:       false,
    swayAmount: 0,
    tintable:   true,
    tintGroup:  'vegetation'      // 'vegetation' turns brown/grey in collapse
  },

  // ── ISLAND ───────────────────────────────────────────────────────────────────
  // Small island in the water. Not tintable — stays neutral.
  {
    id:         'island',
    dayFile:    'Assets_Island-1.svg',
    nightFile:  'Assets Night_Island-1.svg',
    x: 0,   y: -65,
    sway:       false,
    swayAmount: 0,
    tintable:   false,
    tintGroup:  null
  },

  // ── CLOUDS ───────────────────────────────────────────────────────────────────
  // Three cloud layers at different visual depths.
  // Clouds do NOT sway — they move horizontally via time.js (cloud drift).
  // In collapse state, clouds turn grey (tintGroup: 'sky').
  {
    id:         'cloud-1',
    dayFile:    'Assets_Cloud-1.svg',
    nightFile:  'Assets Night_Cloud-1.svg',
    x: 0,   y: 0,
    sway:       false,            // time.js handles cloud movement, not noise.js
    swayAmount: 0,
    tintable:   true,
    tintGroup:  'sky'
  },
  {
    id:         'cloud-2',
    dayFile:    'Assets_Cloud-2.svg',
    nightFile:  'Assets Night_Cloud-2.svg',
    x: 0,   y: 0,
    sway:       false,
    swayAmount: 0,
    tintable:   true,
    tintGroup:  'sky'
  },
  {
    id:         'cloud-3',
    dayFile:    'Assets_Cloud-3.svg',
    nightFile:  'Assets Night_Cloud-3.svg',
    x: 0,   y: 0,
    sway:       false,
    swayAmount: 0,
    tintable:   true,
    tintGroup:  'sky'
  },

  // ── BACKGROUND HILLS ─────────────────────────────────────────────────────────
  // Multiple hill layers creating a sense of depth (parallax).
  // Drawn back to front (hills-7 is furthest back, hills-1 is closest).
  // Background hills sway very subtly — they're distant so movement is minimal.
  {
    id:         'hills-7',
    dayFile:    'Assets_Foreground-hills-7.svg',
    nightFile:  'Assets Night_Foreground-hills-7.svg',
    x: 0,   y: -64,
    sway:       true,
    swayAmount: 0.1,              // 0.1 = very subtle — far away hills barely move
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'hills-8',
    dayFile:    'Assets_Foreground-hills-8.svg',
    nightFile:  'Assets Night_Foreground-hills-8.svg',
    x: 0,   y: -64,
    sway:       true,
    swayAmount: 0.1,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'hills-6',
    dayFile:    'Assets_Foreground-hills-6.svg',
    nightFile:  'Assets Night_Foreground-hills-6.svg',
    x: 0,   y: -65,
    sway:       true,
    swayAmount: 0.15,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'hills-4',
    dayFile:    'Assets_Foreground-hills-4.svg',
    nightFile:  'Assets Night_Foreground-hills-4.svg',
    x: -3,  y: 3,
    sway:       true,
    swayAmount: 0.15,
    tintable:   true,
    tintGroup:  'vegetation'
  },

  // ── MID-GROUND TREES AND BUSHES ──────────────────────────────────────────────
  // These are further back so they sway less than foreground trees.
  // swayAmount increases as elements get closer to the viewer.
  {
    id:         'tree-8',
    dayFile:    'Assets_Tree-8.svg',
    nightFile:  'Assets Night_Tree-8.svg',
    x: 0,   y: -64,
    sway:       true,
    swayAmount: 0.3,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'bush-2',
    dayFile:    'Assets_Bush-2.svg',
    nightFile:  'Assets Night_Bush-2.svg',
    x: -70,  y: 15,
    sway:       true,
    swayAmount: 0.2,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'hills-5',
    dayFile:    'Assets_Foreground-hills-5.svg',
    nightFile:  'Assets Night_Foreground-hills-5.svg',
    x: -2,  y: -7,
    sway:       true,
    swayAmount: 0.15,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'tree-bush',
    dayFile:    'Assets_Tree-bush 1.svg',
    nightFile:  'Assets Night_Tree-bush 1.svg',
    x: 0,   y: 0,
    sway:       true,
    swayAmount: 0.25,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'tree-4',
    dayFile:    'Assets_Tree-4.svg',
    nightFile:  'Assets Night_Tree-4.svg',
    x: 0,   y: 25,
    sway:       true,
    swayAmount: 0.35,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'tree-6',
    dayFile:    'Assets_Tree 6.svg',
    nightFile:  'Assets Night_Tree 6.svg',
    x: -100, y: 65,
    sway:       true,
    swayAmount: 0.35,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'hills-3',
    dayFile:    'Assets_Foreground-hills 3.svg',
    nightFile:  'Assets Night_Foreground-hills 3.svg',
    x: 0,   y: 0,
    sway:       true,
    swayAmount: 0.15,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'tree-7',
    dayFile:    'Assets_Tree-7.svg',
    nightFile:  'Assets Night_Tree-7.svg',
    x: 0,   y: 0,
    sway:       true,
    swayAmount: 0.35,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'tree-5',
    dayFile:    'Assets_Tree 5.svg',
    nightFile:  'Assets Night_Tree 5.svg',
    x: 1250, y: -60,
    sway:       true,
    swayAmount: 0.35,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'tree-2',
    dayFile:    'Assets_Tree 2.svg',
    nightFile:  'Assets Night_Tree 2.svg',
    x: 100,  y: 20,
    sway:       true,
    swayAmount: 0.4,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'bush-1',
    dayFile:    'Assets_Bush-1.svg',
    nightFile:  'Assets Night_Bush-1.svg',
    x: 0,   y: 0,
    sway:       true,
    swayAmount: 0.2,
    tintable:   true,
    tintGroup:  'vegetation'
  },

  // ── FOREGROUND TREES ─────────────────────────────────────────────────────────
  // Closest trees to the viewer — they sway the most (swayAmount: 0.5).
  // These are the trees that "fall and disappear" when X is pressed.
  {
    id:         'tree-1',
    dayFile:    'Assets_Tree-1.svg',
    nightFile:  'Assets Night_Tree-1.svg',
    x: -30,  y: -120,
    sway:       true,
    swayAmount: 0.5,              // 0.5 = most visible sway, closest to viewer
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'tree-3',
    dayFile:    'Assets_Tree 3.svg',
    nightFile:  'Assets Night_Tree 3.svg',
    x: -150, y: 100,
    sway:       true,
    swayAmount: 0.5,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'bush-3',
    dayFile:    'Assets_Bush-3.svg',
    nightFile:  'Assets Night_Bush-3.svg',
    x: 313,  y: -95,
    sway:       true,
    swayAmount: 0.2,
    tintable:   true,
    tintGroup:  'vegetation'
  },

  // ── FOREGROUND HILLS AND FLOWERS ─────────────────────────────────────────────
  // The closest ground layers. Drawn near last so they sit in front of trees.
  {
    id:         'hills-2',
    dayFile:    'Assets_Foreground-hills-2.svg',
    nightFile:  'Assets Night_Foreground-hills-2.svg',
    x: 0,   y: -5,
    sway:       true,
    swayAmount: 0.2,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'flowers',
    dayFile:    'Assets_Foreground-flowers 1.svg',
    nightFile:  'Assets Night_Foreground-flowers 1.svg',
    x: 0,   y: 0,
    sway:       true,
    swayAmount: 0.4,              // flowers sway visibly — light and delicate
    tintable:   false,            // flowers don't tint — they fade in/out via opacity
    tintGroup:  null
  },
  {
    id:         'first-hill',
    dayFile:    'First-hill.svg',
    nightFile:  null,             // no night version
    x: 0,   y: 0,
    sway:       false,
    swayAmount: 0,
    tintable:   true,
    tintGroup:  'vegetation'
  },
  {
    id:         'hills-1',
    dayFile:    'Assets_Foreground-hills 1.svg',
    nightFile:  'Assets Night_Foreground-hills 1.svg',
    x: 0,   y: 0,
    sway:       true,
    swayAmount: 0.2,
    tintable:   true,
    tintGroup:  'vegetation'
  },

  // ── NIGHT-ONLY LAYERS ────────────────────────────────────────────────────────
  // These have no day version. Their opacity is 0 during the day and
  // transitions to 1 as health reaches 50 (fireflies/evening state).
  {
    id:         'moon',
    dayFile:    null,
    nightFile:  'Assets Night_Moon.svg',
    x: 0,   y: 0,
    sway:       false,
    swayAmount: 0,
    tintable:   false,
    tintGroup:  null
  },
  {
    id:         'moon-reflection',
    dayFile:    null,
    nightFile:  'Assets Night_Moon-reflection-on-water.svg',
    x: 0,   y: 0,
    sway:       false,
    swayAmount: 0,
    tintable:   false,
    tintGroup:  null
  },
  {
    id:         'dark-overlay',
    dayFile:    null,
    nightFile:  'Assets Night_Dark overlay.svg',
    x: 0,   y: 0,
    sway:       false,
    swayAmount: 0,
    tintable:   false,
    tintGroup:  null
  }

];