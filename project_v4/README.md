# Project — Interactive Illustrated Scene

An interactive day/night landscape built with HTML, CSS, JavaScript and p5.js.

---

## Getting started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Run a local server
You must use a local server — browsers block file loading on `file://`.

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
| You | `main` | `js/scene.js` + `css/style.css` | Layers, positions, scene setup |
| A | `feature/sound` | `js/sound.js` | Ambient audio and sound effects |
| B | `feature/noise` | `js/noise.js` | Perlin noise on clouds, trees, hills |
| C | `feature/interaction` | `js/interaction.js` | Click, hover, drag events |
| D | `feature/animation` | `js/animation.js` | Day/night transition, animation loop |

**Rule: only edit your own file. Never touch someone else's.**

---

## Git workflow

### First time setup (each person does this once)
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Create your branch — replace 'sound' with your part
git checkout -b feature/sound
```

### Daily workflow
```bash
# Before starting — get latest changes from main
git checkout main
git pull origin main
git checkout feature/sound
git merge main

# After making changes — save and push your work
git add js/sound.js
git commit -m "add ambient birdsong"
git push origin feature/sound
```

### Merging into main
When your part is ready, open a Pull Request on GitHub from your branch into `main`.

---

## Folder structure

```
project/
├── index.html              ← entry point
├── css/
│   └── style.css           ← scene sizing and layout
├── js/
│   ├── scene.js            ← layer order and x/y positions ← EDIT HERE
│   ├── state.js            ← shared variables (ask before changing)
│   ├── sound.js            ← Person A
│   ├── noise.js            ← Person B
│   ├── interaction.js      ← Person C
│   ├── animation.js        ← Person D
│   └── sketch.js           ← optional p5 canvas
└── assets/
    ├── day/                ← all day SVG files (do not edit)
    └── night/              ← all night SVG files (do not edit)
```

---

## Adjusting the scene (scene.js)

### Move a layer (x/y position)
At the top of `scene.js`, find the `POSITIONS` block and change the numbers:
```js
'cloud-1': { x: -50, y: 20 },  // 50px left, 20px down
'sun':      { x: 0,  y: -30 }, // 30px up
```

### Change layer order (front/back)
In the `LAYERS` array, move a block higher (further back) or lower (closer front):
```js
// top of array = furthest back
// bottom of array = closest to viewer
```

### Shared state
```js
import { state } from './state.js';

state.isDay         // boolean
state.timeOfDay     // 0–1
state.mouseX/Y      // 0–1
state.windStrength  // 0–1
state.noiseT        // incremented each frame
```
