// js/state.js
// ─────────────────────────────────────────────────────────────
// Shared state — all modules import from here.
// Agree on variable names before adding new ones so there are
// no conflicts between teammates.
// ─────────────────────────────────────────────────────────────

export const state = {
  // Scene mode
  isDay: true,
  timeOfDay: 0,       // 0 = full day, 1 = full night (drives animation.js)

  // Mouse position (updated by interaction.js)
  mouseX: 0,
  mouseY: 0,

  // Wind / noise (used by noise.js and animation.js)
  windStrength: 0.5,  // 0–1
  noiseT: 0,          // perlin time offset, incremented each frame

  // Audio (used by sound.js)
  isMuted: false,
  audioReady: false,
};

// Convenience: get a layer element by its asset name
// e.g. getLayer('Assets_Cloud-1') or getLayer('Assets Night_Moon')
export function getLayer(name) {
  const id = 'layer-' + name.replace(/\s+/g, '-');
  return document.getElementById(id);
}
