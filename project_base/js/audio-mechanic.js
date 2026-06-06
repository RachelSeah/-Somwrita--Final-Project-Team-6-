// js/audio-mechanic.js
// ─────────────────────────────────────────────────────────────
// AUDIO MECHANIC — Person A
// Add ambient sound and sound effects here.
//
// ┌─────────────────────────────────────────────────────────┐
// │  HOW TO ADD SOUND                                       │
// │                                                         │
// │  Web Audio must start after a user gesture (click)      │
// │                                                         │
// │  OPTION 1 — HTML5 Audio (simple):                       │
// │  const audio = new Audio('assets/sounds/birds.mp3');    │
// │  audio.loop = true;                                     │
// │  document.addEventListener('click', () => {             │
// │    audio.play();                                        │
// │  }, { once: true });                                    │
// │                                                         │
// │  OPTION 2 — Tone.js (advanced):                         │
// │  Add to index.html:                                     │
// │  <script src="https://cdnjs.cloudflare.com/ajax/        │
// │  libs/tone/14.7.77/Tone.js"></script>                   │
// │                                                         │
// │  REACT TO DAY/NIGHT:                                    │
// │  window.addEventListener('night-start', () => {         │
// │    // play night ambience                               │
// │  });                                                    │
// │  window.addEventListener('day-start', () => {           │
// │    // play day ambience                                 │
// │  });                                                    │
// └─────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

import { state } from './state.js';

window.addEventListener('scene-ready', () => {

  // Audio must start after a user click
  document.addEventListener('click', () => {

    // ── ADD YOUR SOUND HERE ────────────────────────────────

  }, { once: true });

});
