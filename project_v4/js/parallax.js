// js/parallax.js
// Portal immersion — scroll to fly inside the painting.
// As you go deeper:
//   1. Wire + label fade out immediately
//   2. Wooden frame shrinks and disappears
//   3. Gallery wall fades to nothing
//   4. Painting expands to fill the entire screen
//   5. You are inside. No frame. No wall. Just the world.
//
// Move your mouse while flying in to steer toward any element.
//
// AI Acknowledgement: developed with Claude AI (Anthropic).
// Portal transition concept and depth map by Nishant Reddy. IDEA9103 | Team 6.

// ─── Depth map ────────────────────────────────────────────────────────────────
// 0.00 = sky, infinitely far — stays still as you fly through
// 0.82 = flowers, right in front of you — rushes off-screen first
const DEPTHS = {
  'sky':             0.00,
  'sun':             0.04,
  'ocean':           0.08,
  'mountain':        0.10,
  'island':          0.15,
  'cloud-1':         0.05,
  'cloud-2':         0.05,
  'cloud-3':         0.05,
  'hills-7':         0.20,
  'hills-8':         0.20,
  'hills-6':         0.24,
  'hills-5':         0.28,
  'hills-4':         0.32,
  'hills-3':         0.38,
  'hills-2':         0.44,
  'hills-1':         0.72,
  'tree-8':          0.28,
  'tree-bush':       0.48,
  'tree-4':          0.52,
  'tree-7':          0.46,
  'tree-2':          0.50,
  'tree-6':          0.54,
  'tree-5':          0.52,
  'tree-1':          0.62,
  'tree-3':          0.66,
  'bush-2':          0.50,
  'bush-1':          0.60,
  'bush-3':          0.54,
  'flowers':         0.82,
  'first-hill':      0.76,
  'moon':            0.02,
  'moon-reflection': 0.08,
  'dark-overlay':    0.00,
};

import { state } from './state.js';

const SCENE_W   = 1455;
const SCENE_H   = 1087;
const MAX_SCALE = 3.2;
const MAX_DEPTH = 1.0;

let depth        = 0,  targetDepth  = 0;
let smoothMouseX = 0,  smoothMouseY = 0;
let rawMouseX    = 0,  rawMouseY    = 0;
let baseScale    = 1;  // scale that scaleFrame() set on load
let portalScale  = 1;  // scale needed to fill screen with no wall showing

const origPos = {};

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// // Smooth easing curve — prevents snapping at transition edges
// function smoothstep(edge0, edge1, x) {
//   const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
//   return t * t * (3 - 2 * t);
// }

window.addEventListener('scene-ready', () => {
  const scene     = document.getElementById('scene');
  const gallery   = document.getElementById('gallery');
  const frameWrap = document.getElementById('frame-wrap');
  const frame     = document.getElementById('frame');
  const wire      = document.getElementById('wire');
  const label     = document.getElementById('label');
  if (!scene) return;

  // Read the base scale that scaleFrame() (in index.html) already applied
  const sm = (frameWrap.style.transform || '').match(/scale\(([^)]+)\)/);
  baseScale = sm ? parseFloat(sm[1]) : 1;

  // The scale that makes the scene (1455×1087) fill the entire viewport
  // Math.max ensures no black bars — scene covers screen fully, slight crop ok
  portalScale = Math.max(
    window.innerWidth  / SCENE_W,
    window.innerHeight / SCENE_H
  ) * 1.02; // 2% extra insurance against any edge bleed

  // Capture original layer positions set by scene.js
  // (stored so we can add parallax offsets on top without overwriting layout)
  Object.keys(DEPTHS).forEach(id => {
    const el = document.getElementById('layer-' + id);
    if (!el) return;
    const m = (el.style.transform || '')
      .match(/translate\(\s*([^,]+)px\s*,\s*([^)]+)px\s*\)/);
    origPos[id] = { x: m ? parseFloat(m[1]) : 0, y: m ? parseFloat(m[2]) : 0 };
  });

  // // ── Input: scroll to fly in/out ────────────────────────────────────────────
  // // Works with: mouse scroll wheel, two-finger trackpad, pinch gesture (ctrl+wheel)
  // scene.addEventListener('wheel', (e) => {
  //   e.preventDefault();
  //   const delta = e.ctrlKey ? e.deltaY * 0.008 : e.deltaY * 0.003;
  //   targetDepth = Math.max(0, Math.min(MAX_DEPTH, targetDepth - delta));
  // }, { passive: false });

// Scroll controls day/night loop
let scrollProgress = 0;

window.addEventListener('wheel', (e) => {
  scrollProgress += e.deltaY * 0.0005;
  // Use sine wave to create smooth loop: 0=day, 1=night, 2=day again
  state.timeOfDay = (Math.sin(scrollProgress) + 1) / 2;
});


  // ── Input: mouse position = vanishing point (where you fly toward) ─────────
  document.addEventListener('mousemove', (e) => {
    const rect = scene.getBoundingClientRect();
    rawMouseX = Math.max(-0.5, Math.min(0.5,
      (e.clientX - rect.left  - rect.width  * 0.5) / rect.width));
    rawMouseY = Math.max(-0.5, Math.min(0.5,
      (e.clientY - rect.top   - rect.height * 0.5) / rect.height));
  });

  // ── Animation loop ─────────────────────────────────────────────────────────
  function tick() {

    // Smooth all movement — makes everything feel physical, not instant
    depth        += (targetDepth - depth)       * 0.025;
    smoothMouseX += (rawMouseX - smoothMouseX)  * 0.04;
    smoothMouseY += (rawMouseY - smoothMouseY)  * 0.04;

    // ── UI fade (wire + label disappear first, before frame) ──────────────
    const uiT = smoothstep(0, 0.25, depth);
    wire.style.opacity  = 1 - uiT;
    label.style.opacity = 1 - uiT;

    // ── Portal transition: wall + frame dissolve, scene fills screen ───────
    // envT goes 0→1 between depth 0.15 and 0.60
    const envT = smoothstep(0.15, 0.60, depth);

    // Frame-wrap scales from its starting size → full screen
    const fScale = baseScale + (portalScale - baseScale) * envT;
    frameWrap.style.transform = `scale(${fScale})`;

    // Wooden frame border + shadow dissolve
    const pad = Math.round(16 * (1 - envT));
    frame.style.padding = `${pad}px`;
    const shadowAlpha   = 0.45 * (1 - envT);
    frame.style.boxShadow = envT > 0.97 ? 'none' :
      `inset 2px 2px 0 rgba(122,82,48,${(1-envT).toFixed(2)}),
       inset -2px -2px 0 rgba(61,38,16,${(1-envT).toFixed(2)}),
       6px 12px 40px rgba(0,0,0,${shadowAlpha.toFixed(2)})`;
    frame.style.background = envT > 0.75 ? 'transparent' : '#5c3d1e';
    frame.classList.toggle('inside', envT > 0.3);

    // Gallery wall colour fades to transparent
    const wallAlpha = 1 - envT;
    gallery.style.backgroundColor = `rgba(217,208,195,${wallAlpha.toFixed(3)})`;
    gallery.classList.toggle('inside', envT > 0.1);

    // ── Parallax layers: fly toward vanishing point ────────────────────────
    // Vanishing point = where mouse is pointing, in scene pixels from centre
    const vpX = smoothMouseX * SCENE_W;
    const vpY = smoothMouseY * SCENE_H;

    Object.entries(DEPTHS).forEach(([id, d]) => {
      const el = document.getElementById('layer-' + id);
      if (!el) return;
      const orig = origPos[id] || { x: 0, y: 0 };

      // Each layer's scale: sky stays at 1×, flowers reach ~3.6× at max depth
      const s = 1 + depth * d * MAX_SCALE;

      // Pin vanishing point so you always fly toward where you're looking.
      // Without this correction, the VP drifts as layers scale.
      const zoomTX = -vpX * (s - 1);
      const zoomTY = -vpY * (s - 1);

      // Idle tilt parallax even without scrolling (fades as zoom takes over)
      const lookFade = 1 - depth * 0.9;
      const lookX    = -smoothMouseX * 60 * d * lookFade;
      const lookY    = -smoothMouseY * 45 * d * lookFade;

      el.style.transformOrigin = 'center center';
      el.style.transform =
        `translate(${orig.x + zoomTX + lookX}px, ` +
        `${orig.y + zoomTY + lookY}px) scale(${s})`;
    });

    requestAnimationFrame(tick);
  }
  tick();

  // Recalculate portal scale if window is resized
  window.addEventListener('resize', () => {
    const sm2 = (frameWrap.style.transform || '').match(/scale\(([^)]+)\)/);
    portalScale = Math.max(
      window.innerWidth  / SCENE_W,
      window.innerHeight / SCENE_H
    ) * 1.02;
  });
});