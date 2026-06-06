// js/animation.js
// ─────────────────────────────────────────────────────────────
// PERSON D — Animation
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

const SCENE_WIDTH = 1455;

// ─────────────────────────────────────────────────────────────
// CLOUD ANIMATION
// ─────────────────────────────────────────────────────────────

let cloud1X = 0;
let cloud2X = -400;
let cloud3X = -800;

const CLOUD1_SPEED = 0.4;
const CLOUD2_SPEED = 0.25;
const CLOUD3_SPEED = 0.15;

function animateClouds() {
  const cloud1 = document.getElementById('layer-cloud-1');
  const cloud2 = document.getElementById('layer-cloud-2');
  const cloud3 = document.getElementById('layer-cloud-3');

  cloud1X += CLOUD1_SPEED;
  cloud2X += CLOUD2_SPEED;
  cloud3X += CLOUD3_SPEED;

  if (cloud1X > SCENE_WIDTH + 200) cloud1X = -400;
  if (cloud2X > SCENE_WIDTH + 200) cloud2X = -400;
  if (cloud3X > SCENE_WIDTH + 200) cloud3X = -400;

  if (cloud1) cloud1.style.transform = `translateX(${cloud1X}px)`;
  if (cloud2) cloud2.style.transform = `translateX(${cloud2X}px)`;
  if (cloud3) cloud3.style.transform = `translateX(${cloud3X}px)`;

  requestAnimationFrame(animateClouds);
}

// ─────────────────────────────────────────────────────────────
// SUN RISE — slides up into position over 60 seconds on load
// ─────────────────────────────────────────────────────────────

const SUN_DURATION = 60000; // 60 seconds
const SUN_START_Y  = 300;   // px below natural position it starts from

function animateSunRise() {
  const sun = document.getElementById('layer-sun');
  if (!sun) return;

  const base      = sun.dataset.baseTransform || 'translate(0px, 0px)';
  let startTime   = null;

  function rise(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed  = timestamp - startTime;
    const progress = Math.min(elapsed / SUN_DURATION, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const offsetY  = SUN_START_Y * (1 - eased);

    sun.style.transform = `${base} translateY(${offsetY}px)`;

    if (progress < 1) requestAnimationFrame(rise);
  }

  requestAnimationFrame(rise);
}

// ─────────────────────────────────────────────────────────────
// BIRD ANIMATION
// ─────────────────────────────────────────────────────────────

const BIRD_CONFIG = {
  countMin:  3,
  countMax:  9,
  speed:     0.15,
  yBase:     210,
  ySpread:   50,
  size:      8,
  color:     '#2a1a0e',
  pauseMin:  5000,
  pauseMax:  12000,
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function makeBird(size, color) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:absolute;width:${size*2.4}px;height:${size}px;`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width',   size * 2.4);
  svg.setAttribute('height',  size);
  svg.setAttribute('viewBox', `0 0 ${size * 2.4} ${size}`);
  svg.style.overflow = 'visible';
  const cx = size * 1.2;
  const cy = size * 0.5;
  const wl = size * 1.1;
  const leftWing = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  leftWing.setAttribute('fill', 'none');
  leftWing.setAttribute('stroke', color);
  leftWing.setAttribute('stroke-width', '1');
  leftWing.setAttribute('stroke-linecap', 'round');
  const rightWing = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  rightWing.setAttribute('fill', 'none');
  rightWing.setAttribute('stroke', color);
  rightWing.setAttribute('stroke-width', '1');
  rightWing.setAttribute('stroke-linecap', 'round');
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  body.setAttribute('cx', cx);
  body.setAttribute('cy', cy);
  body.setAttribute('r', '1.5');
  body.setAttribute('fill', color);
  svg.appendChild(leftWing);
  svg.appendChild(rightWing);
  svg.appendChild(body);
  wrap.appendChild(svg);
  wrap._leftWing  = leftWing;
  wrap._rightWing = rightWing;
  wrap._cx = cx;
  wrap._cy = cy;
  wrap._wl = wl;
  wrap._size = size;
  return wrap;
}

function setFlapAngle(bird, angle) {
  const { _cx: cx, _cy: cy, _wl: wl } = bird;
  const tipY = cy - Math.sin(angle) * wl * 0.25;
  const cpY  = cy - Math.sin(angle) * wl * 0.12;
  bird._leftWing.setAttribute('d',
    `M${cx},${cy} C${cx - wl*0.2},${cy - 1} ${cx - wl*0.8},${cpY} ${cx - wl},${tipY}`);
  bird._rightWing.setAttribute('d',
    `M${cx},${cy} C${cx + wl*0.2},${cy - 1} ${cx + wl*0.8},${cpY} ${cx + wl},${tipY}`);
}

function createBirdLayer(scene) {
  const layer = document.createElement('div');
  layer.id = 'layer-birds';
  layer.style.cssText = `
    position:absolute;inset:0;width:100%;height:100%;
    pointer-events:none;z-index:100;overflow:hidden;
  `;
  scene.appendChild(layer);
  return layer;
}

function flyFlock(layer, sceneWidth) {
  const cfg   = BIRD_CONFIG;
  const count = Math.round(rand(cfg.countMin, cfg.countMax));
  const birds = [];

  for (let i = 0; i < count; i++) {
    const size      = rand(cfg.size * 0.75, cfg.size * 1.25);
    const bird      = makeBird(size, cfg.color);
    const xOffset   = rand(0, size * 2.5) * i;
    const yOffset   = rand(-cfg.ySpread, cfg.ySpread);
    const flapSpeed = rand(0.004, 0.009);
    const flapPhase = rand(0, Math.PI * 2);
    const flapAmp   = rand(0.2, 0.5);
    bird.style.top  = (cfg.yBase + yOffset) + 'px';
    bird.style.left = (-size * 3 - xOffset) + 'px';
    layer.appendChild(bird);
    setFlapAngle(bird, 0);
    birds.push({ bird, xOffset, flapSpeed, flapPhase, flapAmp });
  }

  let startTime   = null;
  const totalDist = sceneWidth + cfg.size * count * 3;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const x = elapsed * cfg.speed;
    birds.forEach(b => {
      b.bird.style.left = (-b.bird._size * 3 - b.xOffset + x) + 'px';
      const angle = Math.sin(elapsed * b.flapSpeed + b.flapPhase) * b.flapAmp;
      setFlapAngle(b.bird, angle);
    });
    if (x < totalDist) {
      requestAnimationFrame(step);
    } else {
      birds.forEach(b => b.bird.remove());
      setTimeout(() => flyFlock(layer, sceneWidth), rand(cfg.pauseMin, cfg.pauseMax));
    }
  }

  requestAnimationFrame(step);
}

// ─────────────────────────────────────────────────────────────
// INIT — ONE listener starts everything
// ─────────────────────────────────────────────────────────────

window.addEventListener('scene-ready', () => {
  const scene = document.getElementById('scene');
  if (!scene) return;

  animateClouds();
  animateSunRise();

  const birdLayer = createBirdLayer(scene);
  setTimeout(() => flyFlock(birdLayer, SCENE_WIDTH), 2000);
});

// ─────────────────────────────────────────────────────────────
// ADD YOUR OWN ANIMATIONS BELOW HERE
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// AUDIO REACTIVITY
// ─────────────────────────────────────────────────────────────

// function animateAudio() {
//   const sun = document.getElementById('layer-sun');
//   if (sun) {
//     const pulse = 1 + state.audioBass * 0.25;
//     sun.style.transform       = `scale(${pulse})`;
//     sun.style.transformOrigin = '50% 50%';
//   }

//   const treeIds = ['layer-tree-1','layer-tree-2','layer-tree-3',
//                    'layer-tree-4','layer-tree-5','layer-tree-6'];
//   treeIds.forEach((id, i) => {
//     const el = document.getElementById(id);
//     if (el) {
//       const sway = state.audioMid * 4 * (i % 2 === 0 ? 1 : -1);
//       el.style.transform       = `rotate(${sway}deg)`;
//       el.style.transformOrigin = 'bottom center';
//     }
//   });

//   const flowers = document.getElementById('layer-flowers');
//   if (flowers) {
//     const pop = 1 + state.audioHigh * 0.15;
//     flowers.style.transform       = `scale(${pop})`;
//     flowers.style.transformOrigin = 'bottom center';
//   }

//   requestAnimationFrame(animateAudio);
// }

// window.addEventListener('scene-ready', () => {
//   animateAudio();
// });


// ─────────────────────────────────────────────────────────────
// day and night crossfade
// ─────────────────────────────────────────────────────────────

function animateDayNight() {
  const t = state.timeOfDay;
  
  // Fade day/night layers
  document.querySelectorAll('.layer-day').forEach(el   => el.style.opacity = 1 - t);
  document.querySelectorAll('.layer-night').forEach(el => el.style.opacity = t);

  // Sun moves down as day fades
  const sun = document.getElementById('layer-sun');
  if (sun) {
    const sunY = t * 300; // moves 300px down as night approaches
    sun.style.transform = `translateY(${sunY}px)`;
  }

  // Moon moves up as night comes
  const moon = document.getElementById('layer-moon');
  if (moon) {
    const moonY = (1 - t) * 300; // starts 300px below, rises as night comes
    moon.style.transform = `translateY(${moonY}px)`;
  }

  requestAnimationFrame(animateDayNight);
}