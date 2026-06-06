# Code Documentation — Karma
## Interactive Illustrated Landscape Scene

---

## AI Acknowledgement

This project was developed with the assistance of **Claude AI** (Anthropic) as part of a vibe coding learning exercise. Vibe coding is a practice where you collaborate with an AI using natural language to build and iterate on code, focusing on the outcome and learning by doing rather than writing every line manually.

All mechanics, file structure, and animation logic were designed through natural language prompting and reviewed by the team. Each team member worked within their designated file, using Claude AI as a coding collaborator.

---

## Project Structure

```
project/
├── index.html               ← Entry point. Loads the scene and scales the frame.
├── css/
│   └── style.css            ← Gallery wall, frame, and scene layout.
├── js/
│   ├── sketch.js            ← Main entry. Imports and starts all mechanics.
│   ├── scene.js             ← Loads and stacks all SVG layers in depth order.
│   ├── state.js             ← Shared variables accessible by all modules.
│   ├── time-based.js        ← Cloud drift + day/night cycle. (Person D)
│   ├── bird-mechanic.js     ← Bird animation. (Person D)
│   ├── perlin-layer.js      ← Perlin noise on trees and clouds. (Person B)
│   ├── input-controls.js    ← Click, hover, drag interactions. (Person C)
│   └── audio-mechanic.js    ← Ambient sound and effects. (Person A)
└── assets/
    ├── day/                 ← All daytime SVG files
    └── night/               ← All nighttime SVG files
```

---

## How Each File Works

---

### `sketch.js` — Main Entry Point

**What it does:**
Imports all mechanic files and starts them in the correct order after the scene has loaded.

**How it works:**
1. Imports `buildScene` from `scene.js` and calls it to load all SVG layers
2. Calls `initTimeBased()` and `initBirds()` to start animations
3. Dispatches a `scene-ready` event so other modules know the scene is built

**Key concept:** ES Modules — each file uses `import` / `export` so they can share functions without polluting the global scope.

---

### `scene.js` — SVG Layer Loader

**What it does:**
Fetches all SVG files from the `assets/` folder and stacks them as absolutely-positioned `<div>` layers inside `#scene`.

**How it works:**
1. A `POSITIONS` object at the top defines the `x` and `y` offset for each layer
2. A `LAYERS` array defines the depth order (top = furthest back, bottom = closest front) and maps each layer to its day and night SVG filenames
3. Each layer gets two children: `.layer-day` (visible) and `.layer-night` (hidden at `opacity: 0`)
4. CSS class names inside each SVG are scoped with a unique prefix using `isolateSVG()` to prevent colour clashes between files

**Key concept:** SVG inline loading via `fetch()` — the SVGs are fetched as text and inserted into the DOM so JavaScript can control them directly.

**To adjust a layer position:**
```js
const POSITIONS = {
  'cloud-1': { x: -50, y: 20 },  // 50px left, 20px down
};
```

**To change layer order:**
Move a block higher in the `LAYERS` array to push it further back, or lower to bring it forward.

---

### `state.js` — Shared Variables

**What it does:**
Holds shared variables that any module can read or write.

**How it works:**
Any file that imports `state` can read or update its values. This is how modules communicate without directly importing each other.

```js
import { state } from './state.js';

state.isDay      // true or false — updated by time-based.js
state.mouseX     // 0–1 — updated by input-controls.js
state.mouseY     // 0–1
state.windStrength // 0–1 — can be used by perlin-layer.js
state.noiseT     // incremented over time — used by perlin-layer.js
```

---

### `time-based.js` — Time-Based Mechanics (Person D)

**AI Assistance:** Developed with Claude AI. The state machine structure, easing functions, and interpolation logic were designed through collaborative prompting.

**What it does:**
Controls two separate time-based systems — cloud drift and the day/night cycle.

---

#### Part 1 — Cloud Drift

**How it works:**
Three cloud SVG layers are moved horizontally across the scene at different speeds using `requestAnimationFrame`. Each cloud has its own X position variable that increases every frame. When a cloud exits the right edge of the scene it resets to the left, creating a seamless loop.

```
cloud1X += 0.4 px per frame  (fastest)
cloud2X += 0.25 px per frame (medium)
cloud3X += 0.15 px per frame (slowest)
```

The different speeds create a **parallax effect** — closer clouds appear to move faster.

Each frame the layer's `transform` is updated:
```js
cloud.style.transform = `translateX(${cloudX}px)`;
```

---

#### Part 2 — Day/Night Cycle

**How it works:**
A **4-state machine** loops forever:

```
DAY (30s) → DAY_TO_NIGHT (10s) → NIGHT (30s) → NIGHT_TO_DAY (10s) → repeat
```

`stateStart` stores the timestamp when the current state began. Each frame, `elapsed = timestamp - stateStart` gives the time spent in the current state. When `elapsed >= duration` the state advances to the next one.

During transitions, a progress value `t` is calculated:
```js
const t = elapsed / transitionDuration; // 0 to 1
```

`t` is passed through an **easing function** to make the animation feel natural:
- `easeInOutCubic` — starts slow, speeds up in middle, slows at end (used for most transitions)
- `easeInOutSine` — softer version used for moon rise/set

`lerp(a, b, t)` (linear interpolation) maps `t` to a value between any two numbers:
```js
const sunY = lerp(0, 762, t); // sun Y moves from 0px to 762px
```

`lerpColor` does the same for the background colour between `#f8a779` and `#b2b1ff`.

**State breakdown:**
- **DAY** — sun idles with a gentle sine float (±4px). Night layers hidden at opacity 0.
- **DAY_TO_NIGHT** — sun drops and fades. Night layers fade in. Moon rises once night opacity reaches 80%.
- **NIGHT** — moon idles. Sun hidden. Night fully visible.
- **NIGHT_TO_DAY** — moon sets. Sun rises. Night fades out.

---

### `bird-mechanic.js` — Bird Animation (Person D)

**AI Assistance:** Adapted from an original p5.js sketch by Patt Vira (https://www.youtube.com/watch?v=ttz05d8DSOs), ported to vanilla Canvas 2D API with assistance from Claude AI.

**What it does:**
Draws a flock of small birds flying across the scene using the HTML5 Canvas 2D API.

**How it works:**
A `<canvas>` element is placed over the scene at `z-index: 500`. Each bird is stored as an object with `x`, `y`, `angle`, `velocity`, and `flap` properties.

Each frame:
1. The canvas is cleared
2. Each bird's position is updated by moving forward along its angle
3. A flapping cycle is incremented: `b.flap += b.vel * 0.05`
4. Each bird is drawn as a **triangle** (body) + **ellipse** (torso)
5. The wing tip point oscillates using `Math.sin(b.flap)` to simulate flapping
6. When a bird exits the right edge it resets to a random position on the left

---

### `perlin-layer.js` — Perlin Noise (Person B)

**AI Assistance:** Developed with Claude AI.

**What it does:**
Applies organic, wind-like movement to trees and bushes using Perlin noise from p5.js.

**How it works:**
p5.js is loaded globally and exposes a `noise(t)` function. Perlin noise returns smooth pseudo-random values between 0 and 1 — unlike `Math.random()` which jumps unpredictably, noise values flow smoothly from one to the next.

Each tree layer gets a unique `offset` value so they sway independently:
```js
const noiseVal = noise(t + tree.offset); // 0–1
const angle    = (noiseVal - 0.5) * 2 * amplitude; // remap to -amp → +amp
el.style.transform = `rotate(${angle}deg)`;
```

`transformOrigin: 'bottom center'` makes each tree rotate from its base, like a real tree swaying in wind.

---

### `input-controls.js` — Input Controls (Person C)

**AI Assistance:** Developed with Claude AI.

**What it does:**
Handles all user interactions — clicks, hovers, and mouse movement.

**How it works:**
The scene layers have `pointer-events: none` by default. To make a layer interactive its `pointer-events` must be set to `auto` first. Event listeners are then added to respond to user input.

Mouse position is stored in `state.mouseX` and `state.mouseY` (both 0–1) so other modules like `perlin-layer.js` can use them to drive effects like wind strength.

---

### `audio-mechanic.js` — Audio (Person A)

**AI Assistance:** Developed with Claude AI.

**What it does:**
Manages ambient sound and sound effects for the scene.

**How it works:**
Web Audio API (and Tone.js if used) requires a user gesture before sound can play — this is a browser security rule. All audio is therefore initialised inside a `click` event listener with `{ once: true }` so it only fires on the first click.

Day/night transitions dispatch custom events (`night-start`, `day-start`) that the audio module can listen to in order to swap ambience tracks.

---

## How to Add Your Own Animation

1. Open the relevant file (e.g. `time-based.js` for timed effects)
2. Write a function below the existing code
3. Call it inside the `init` function (`initTimeBased()`, etc.)
4. Use `requestAnimationFrame` for smooth per-frame updates
5. Use `setTimeout` for one-off delays

**Example — make the sun pulse:**
```js
function pulseSun() {
  const sun = document.getElementById('layer-sun');
  const scale = 1 + Math.sin(Date.now() * 0.001) * 0.05;
  sun.style.transform = `scale(${scale})`;
  requestAnimationFrame(pulseSun);
}
```

---

## References

- Claude AI (Anthropic) — https://claude.ai — used for code generation and architecture
- p5.js — https://p5js.org — used for Perlin noise
- Patt Vira — Bird animation reference — https://www.youtube.com/watch?v=ttz05d8DSOs
- MDN Web Docs — Canvas API, requestAnimationFrame, ES Modules
