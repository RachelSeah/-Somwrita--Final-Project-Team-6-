// js/audio-mechanics.js — Nishant Reddy (Audio Mechanic)
// Claude was used to help structure the crossfade logic.

let _sndDay = null;
let _sndRain = null;
let _sndNight = null;
let _sndCollapse = null;
let _sndPop = null;

let _audioStarted = false;
let _lastSoundKey = null;

const VOL_DAY = 0.7;
const VOL_RAIN = 0.8;
const VOL_NIGHT = 0.6;
const VOL_COLLAPSE = 0.6;
const FADE_TIME = 1.5;

function preloadSounds() {
  try { _sndDay = loadSound('assets/audio/ambient.mp3'); }
  catch (e) { console.warn('[audio] Could not load ambient.mp3'); }
  try { _sndRain = loadSound('assets/audio/ambient_rain.mp3'); }
  catch (e) { console.warn('[audio] Could not load ambient_rain.mp3'); }
  try { _sndNight = loadSound('assets/audio/night.mp3'); }
  catch (e) { console.warn('[audio] Could not load night.mp3'); }
  try { _sndCollapse = loadSound('assets/audio/ambient_collapse.mp3'); }
  catch (e) { console.warn('[audio] Could not load ambient_collapse.mp3'); }
  try { _sndPop = loadSound('assets/audio/flower_pop.mp3'); }
  catch (e) { console.warn('[audio] Could not load flower_pop.mp3'); }
}

function setupSounds() {
  if (_sndDay) { _sndDay.setLoop(true); _sndDay.setVolume(0); }
  if (_sndRain) { _sndRain.setLoop(true); _sndRain.setVolume(0); }
  if (_sndNight) { _sndNight.setLoop(true); _sndNight.setVolume(0); }
  if (_sndCollapse) { _sndCollapse.setLoop(true); _sndCollapse.setVolume(0); }

  let ctx = getAudioContext();

  if (ctx.state === 'running') {
    _beginPlayback();
  } else {
    ctx.onstatechange = function () {
      if (ctx.state === 'running' && !_audioStarted) _beginPlayback();
    };
  }

  function _unlockOnGesture() {
    if (_audioStarted) { _removeListeners(); return; }
    ctx.resume().then(() => { if (!_audioStarted) _beginPlayback(); });
    _removeListeners();
  }
  function _removeListeners() {
    window.removeEventListener('mousedown', _unlockOnGesture);
    window.removeEventListener('keydown', _unlockOnGesture);
    window.removeEventListener('touchstart', _unlockOnGesture);
  }
  window.addEventListener('mousedown', _unlockOnGesture);
  window.addEventListener('keydown', _unlockOnGesture);
  window.addEventListener('touchstart', _unlockOnGesture);
}

// Starts all tracks at volume 0 so crossfades work from the first state change.
// Does NOT check isLoaded() — sounds are guaranteed loaded after preload().
function _beginPlayback() {
  if (_audioStarted) return;
  if (_sndDay && !_sndDay.isPlaying()) _sndDay.play();
  if (_sndRain && !_sndRain.isPlaying()) _sndRain.play();
  if (_sndNight && !_sndNight.isPlaying()) _sndNight.play();
  if (_sndCollapse && !_sndCollapse.isPlaying()) _sndCollapse.play();
  _audioStarted = true;
  _lastSoundKey = '';    // empty string forces updateSound() to set volumes on next frame
}

function startAudio() {
  if (_audioStarted) return;
  getAudioContext().resume().then(() => { _beginPlayback(); });
}

function updateSound() {
  if (!_audioStarted) return;

  let key;
  if (STATE.rainActive) key = 'rain';
  else if (STATE.currentState === 'COLLAPSE') key = 'collapse';
  else if (STATE.currentState === 'FIREFLIES') key = 'night';
  else if (STATE.currentState === 'PASSIVE') key = 'day';
  else key = 'silence';

  if (key === _lastSoundKey) return;
  _lastSoundKey = key;

  // Ensure the target sound is actually playing before fading it in.
  // If _beginPlayback() ran before the file was ready, the sound may be stopped.
  if (key === 'day' && _sndDay && !_sndDay.isPlaying()) _sndDay.play();
  if (key === 'rain' && _sndRain && !_sndRain.isPlaying()) _sndRain.play();
  if (key === 'night' && _sndNight && !_sndNight.isPlaying()) _sndNight.play();
  if (key === 'collapse' && _sndCollapse && !_sndCollapse.isPlaying()) _sndCollapse.play();

  if (_sndDay) _sndDay.setVolume((key === 'day') ? VOL_DAY : 0, FADE_TIME);
  if (_sndRain) _sndRain.setVolume((key === 'rain') ? VOL_RAIN : 0, FADE_TIME);
  if (_sndNight) _sndNight.setVolume((key === 'night') ? VOL_NIGHT : 0, FADE_TIME);
  if (_sndCollapse) _sndCollapse.setVolume((key === 'collapse') ? VOL_COLLAPSE : 0, FADE_TIME);
}

function playFlowerPop() {
  if (_audioStarted && _sndPop) {
    _sndPop.setVolume(0.03);   // sound volume
    _sndPop.play();
  }
}

// ── MUTE STATE ────────────────────────────────────────────────────────────────
let _isMuted    = false;
let _muteButton = null;
 
// Icon colour — warm brown to match the frame / earthy palette.
const _ICON_COLOR = '#5c3d1e';
 
// ── SVG ICONS ──────────────────────────────────────────────────────────────────
// Two 24×24 icons: speaker with sound waves (unmuted) and speaker with an X
// (muted). Stroke uses currentColor so the colour is set once on the button.
const _ICON_UNMUTED = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 9 V15 H8 L13 19 V5 L8 9 Z" fill="currentColor" stroke="none"/>
  <path d="M16.5 8.5 a5 5 0 0 1 0 7"/>
  <path d="M19 6 a8.5 8.5 0 0 1 0 12"/>
</svg>`;
 
const _ICON_MUTED = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 9 V15 H8 L13 19 V5 L8 9 Z" fill="currentColor" stroke="none"/>
  <line x1="16" y1="9" x2="21" y2="14"/>
  <line x1="21" y1="9" x2="16" y2="14"/>
</svg>`;
 
 
// =============================================================================
// CREATE MUTE BUTTON
// Builds a small fixed button in the top-right corner using a p5 DOM element.
// Call this ONCE after setupSounds().
// =============================================================================
function createMuteButton() {
  if (_muteButton) return;            // guard against double-creation
 
  _muteButton = createButton('');
  _muteButton.mousePressed(toggleMute);
  _muteButton.attribute('title', 'Mute / unmute sound');
  _muteButton.attribute('aria-label', 'Mute or unmute sound');
 
  // Styling — fixed, top-right, above the canvas. Tweak freely.
  let el = _muteButton.elt;
  el.style.position       = 'fixed';
  el.style.top            = '16px';
  el.style.right          = '16px';
  el.style.zIndex         = '1000';
  el.style.width          = '44px';
  el.style.height         = '44px';
  el.style.display        = 'flex';
  el.style.alignItems     = 'center';
  el.style.justifyContent = 'center';
  el.style.padding        = '0';
  el.style.border         = 'none';
  el.style.borderRadius   = '50%';
  el.style.cursor         = 'pointer';
  el.style.background     = '#f5f2ee';     // soft cream, matches the label card
  el.style.boxShadow      = '0 2px 8px rgba(0,0,0,0.25)';
  el.style.color          = _ICON_COLOR;   // drives the SVG's currentColor
  el.style.userSelect     = 'none';
  el.style.transition     = 'background 0.15s ease';
 
  // Apply whatever the current state is (handles default / refresh).
  _applyMute();
}
 
 
// =============================================================================
// TOGGLE MUTE
// Flips the mute state. Also doubles as a user gesture that unlocks audio on
// browsers that block autoplay — so the very first tap both starts and unmutes.
// =============================================================================
function toggleMute() {
  if (typeof startAudio === 'function') startAudio();
 
  _isMuted = !_isMuted;
  _applyMute();
}
 
 
// =============================================================================
// APPLY MUTE
// Pushes the current _isMuted state to the master output and updates the icon.
// =============================================================================
function _applyMute() {
  // Scale the master output: 0 = silent, 1 = normal. Short ramp avoids clicks.
  if (typeof outputVolume === 'function') {
    outputVolume(_isMuted ? 0 : 1, 0.1);
  }
 
  // Mirror to shared STATE if your project uses it (optional, safe if absent).
  if (typeof STATE === 'object' && STATE) STATE.isMuted = _isMuted;
 
  // Swap the icon + give a subtle dimmed background when muted.
  if (_muteButton) {
    _muteButton.html(_isMuted ? _ICON_MUTED : _ICON_UNMUTED);
    _muteButton.elt.style.background = _isMuted ? '#e3ddd4' : '#f5f2ee';
    _muteButton.elt.style.color      = _isMuted ? '#8a7a66' : _ICON_COLOR;
  }
}