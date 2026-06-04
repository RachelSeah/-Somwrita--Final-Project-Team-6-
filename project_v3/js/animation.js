// js/animation.js
// ─────────────────────────────────────────────────────────────
// PERSON D — Animation
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

// ─────────────────────────────────────────────────────────────
// CLOUD ANIMATION
// Each cloud moves at a different speed, resets on the left
// when it drifts off the right edge — just like the p5 example
// ─────────────────────────────────────────────────────────────

const SCENE_WIDTH = 1455;

// Starting x positions — staggered so they don't clump together
let cloud1X = 0;
let cloud2X = -400;
let cloud3X = -800;

// Speed of each cloud (px per frame) — different so they drift independently
const CLOUD1_SPEED = 0.4;
const CLOUD2_SPEED = 0.25;
const CLOUD3_SPEED = 0.15;

function animateClouds() {
  const cloud1 = document.getElementById('layer-cloud-1');
  const cloud2 = document.getElementById('layer-cloud-2');
  const cloud3 = document.getElementById('layer-cloud-3');

  // Move each cloud at its own speed
  cloud1X += CLOUD1_SPEED;
  cloud2X += CLOUD2_SPEED;
  cloud3X += CLOUD3_SPEED;

  // Reset to left when it goes off the right edge
  if (cloud1X > SCENE_WIDTH + 200) cloud1X = -400;
  if (cloud2X > SCENE_WIDTH + 200) cloud2X = -400;
  if (cloud3X > SCENE_WIDTH + 200) cloud3X = -400;

  // Apply position to each layer
  if (cloud1) cloud1.style.transform = `translateX(${cloud1X}px)`;
  if (cloud2) cloud2.style.transform = `translateX(${cloud2X}px)`;
  if (cloud3) cloud3.style.transform = `translateX(${cloud3X}px)`;

  requestAnimationFrame(animateClouds);
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
// INIT — starts everything once the scene is ready
// ─────────────────────────────────────────────────────────────

window.addEventListener('scene-ready', () => {
  const scene = document.getElementById('scene');
  if (!scene) return;

  // Start clouds
  animateClouds();

  // Start birds
  const birdLayer = createBirdLayer(scene);
  setTimeout(() => flyFlock(birdLayer, SCENE_WIDTH), 2000);
});

// ─────────────────────────────────────────────────────────────
// ADD YOUR OWN ANIMATIONS BELOW HERE
// ─────────────────────────────────────────────────────────────