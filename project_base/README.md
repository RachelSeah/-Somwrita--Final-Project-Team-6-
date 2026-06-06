# Karma — Interactive Illustrated Scene

An interactive day/night landscape built with HTML, CSS, JavaScript and p5.js.

---

## Getting started

### 1. Clone the repo
```bash
git clone https://github.com/RachelSeah/-Somwrita--Final-Project-Team-6-.git
cd -Somwrita--Final-Project-Team-6-
```

### 2. Run a local server
Browsers block file loading on `file://` — you must use a local server.

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080`

---

## Team — who owns what

| Person | Branch | File | Role |
|--------|--------|------|------|
| You | `main` | `js/scene.js` | Layers, positions, scene setup |
| A | `feature/sound` | `js/audio-mechanic.js` | Ambient audio and sound effects |
| B | `feature/noise` | `js/perlin-layer.js` | Perlin noise on trees, clouds, hills |
| C | `feature/interaction` | `js/input-controls.js` | Click, hover, drag events |
| D | `feature/animation` | `js/time-based.js` + `js/bird-mechanic.js` | Day/night cycle, birds |

**Rule: only edit your own file. Never touch someone else's.**

---

## File structure

```
project/
├── index.html               ← entry point (do not edit)
├── css/
│   └── style.css            ← gallery frame and layout
├── js/
│   ├── sketch.js            ← main entry, imports everything
│   ├── scene.js             ← SVG layer order and positions
│   ├── state.js             ← shared variables
│   ├── time-based.js        ← day/night cycle, sun, moon, clouds
│   ├── bird-mechanic.js     ← bird animation
│   ├── perlin-layer.js      ← Person B: perlin noise
│   ├── input-controls.js    ← Person C: interactions
│   └── audio-mechanic.js    ← Person A: sound
└── assets/
    ├── day/                 ← day SVG files (do not edit)
    └── night/               ← night SVG files (do not edit)
```

---

## Git workflow

```bash
# First time — create your branch
git checkout -b feature/sound

# Daily — pull latest then push your changes
git pull origin main
git add js/audio-mechanic.js
git commit -m "add ambient birdsong"
git push origin feature/sound
```

When ready, open a Pull Request into `main`.

---

## Adjusting the scene (scene.js)

### Move a layer
```js
const POSITIONS = {
  'cloud-1': { x: -50, y: 20 },  // 50px left, 20px down
  'sun':     { x: 0,  y: -30 },  // 30px up
};
```

### Change layer order
Top of `LAYERS` array = furthest back. Bottom = closest front.

### Timing (time-based.js)
```js
const dayHoldDuration              = 30000; // ms
const dayToNightTransitionDuration = 10000; // ms
const nightHoldDuration            = 30000; // ms
const nightToDayTransitionDuration = 10000; // ms
```
