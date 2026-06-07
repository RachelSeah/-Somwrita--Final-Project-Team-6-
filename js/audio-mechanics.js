// Claude was used to help structure the audio crossfade and track-switching logic in this file — the overall mechanic design, sound selection, and integration were done independently.
// =============================================================================
// js/audio-mechanics.js  (Nishant Reddy — Audio Mechanic)
// =============================================================================
//
// PURPOSE:
//   Manages all audio for the Living Landscape artwork.
//   Exactly one track plays at any moment — transitions are smooth crossfades.
//
// SOUND FILES (assets/audio/):
//   ambient_day.wav       → morning birdsong, plays during daytime PASSIVE state
//   ambient_rain.wav      → river/wildlife environment, plays whenever rain is active
//   ambient_collapse.mp3  → horror piano drone, plays during COLLAPSE state
//
// PRIORITY ORDER (highest to lowest):
//   1. Rain active        → ambient_rain   (overrides everything)
//   2. COLLAPSE state     → ambient_collapse
//   3. PASSIVE state      → ambient_day
//   4. FIREFLIES / night  → silence  (morning birds stop, nothing replaces them)
//
// NOTE ON BROWSER AUTOPLAY POLICY:
//   Browsers block audio until the user interacts with the page.
//   startAudio() is called on the first mouse/key event from user_interaction.js.
//   All tracks start at volume 0 and are faded in by updateSound().
//
// =============================================================================


// ── SOUND OBJECTS ─────────────────────────────────────────────────────────────
// Loaded in preloadSounds(), configured in setupSounds().
let _sndDay      = null;   // ambient_day.wav      — daytime birdsong (looping)
let _sndRain     = null;   // ambient_rain.wav     — rain/river sound (looping)
let _sndNight    = null;  // ambient_collapse.mp3 — collapse drone    (looping)


// ── INTERNAL STATE ────────────────────────────────────────────────────────────
let _audioStarted = false;   // true once tracks are playing (autoplay or first interaction)
let _lastSoundKey = null;    // which track was playing last frame — avoids redundant calls


// ── VOLUME CONFIG ─────────────────────────────────────────────────────────────
const VOL_DAY      = 0.7;   // daytime birdsong volume
const VOL_RAIN     = 0.8;   // rain/river volume — slightly louder, immersive
const VOL_COLLAPSE = 0.6;   // collapse drone — present but not overwhelming
const FADE_TIME    = 1.5;   // crossfade duration in seconds — smooth, not abrupt


// =============================================================================
// PRELOAD SOUNDS
// Called inside p5's preload() in sketch.js.
// p5 waits for all loadSound() calls before setup() runs.
// try/catch means a missing file logs a warning but never crashes the sketch.
// =============================================================================
function preloadSounds() {
  try { _sndDay   = loadSound('assets/audio/ambient.mp3'); }
catch(e) { console.warn('[sound.js] Could not load ambient.mp3'); }

try { _sndRain  = loadSound('assets/audio/ambient_rain.mp3'); }
catch(e) { console.warn('[sound.js] Could not load ambient_rain.mp3'); }

try { _sndNight = loadSound('assets/audio/night.mp3'); }
catch(e) { console.warn('[sound.js] Could not load night.mp3'); }
}


// =============================================================================
// SETUP SOUNDS
// Called inside p5's setup() in sketch.js.
// Configures all tracks to loop at volume 0, then sets up two unlock paths:
//
//   Path A — Immediate autoplay:
//     Checks if the Web Audio context is already 'running' (happens on
//     localhost or when the user has previously interacted with the site).
//     Also watches onstatechange so the moment the context becomes 'running'
//     (for any reason), audio starts without waiting for a canvas event.
//
//   Path B — First-gesture fallback:
//     Attaches listeners to the WINDOW (not just the p5 canvas) for
//     mousedown, keydown, and touchstart. These fire on any interaction
//     with the browser — including clicking outside the canvas or pressing
//     a key — so audio is never gated behind a specific canvas click.
//
// Either path calls _beginPlayback() once and then cleans itself up.
// =============================================================================
function setupSounds() {
  if (_sndDay)      { _sndDay.setLoop(true);      _sndDay.setVolume(0); }
  if (_sndRain)     { _sndRain.setLoop(true);     _sndRain.setVolume(0); }
  if (_sndCollapse) { _sndCollapse.setLoop(true); _sndCollapse.setVolume(0); }

  let ctx = getAudioContext();

  // ── Path A: check immediately, then watch for state change ──────────────────
  if (ctx.state === 'running') {
    // Context already running (e.g. localhost, or returning visitor) — go now
    _beginPlayback();
  } else {
    // Watch for the context to become 'running' on its own
    ctx.onstatechange = function () {
      if (ctx.state === 'running' && !_audioStarted) {
        _beginPlayback();
      }
    };
  }

  // ── Path B: window-level gesture listeners ───────────────────────────────────
  // These fire before p5's mousePressed, and catch interactions anywhere on
  // the page — not just the canvas. Removed once audio has started.
  function _unlockOnGesture() {
    if (_audioStarted) { _removeGestureListeners(); return; }
    // Resume the audio context then start playback
    ctx.resume().then(() => {
      if (!_audioStarted) _beginPlayback();
    });
    _removeGestureListeners();
  }

  function _removeGestureListeners() {
    window.removeEventListener('mousedown',  _unlockOnGesture);
    window.removeEventListener('keydown',    _unlockOnGesture);
    window.removeEventListener('touchstart', _unlockOnGesture);
  }

  window.addEventListener('mousedown',  _unlockOnGesture);
  window.addEventListener('keydown',    _unlockOnGesture);
  window.addEventListener('touchstart', _unlockOnGesture);
}


// =============================================================================
// _beginPlayback  (internal — do not call directly)
// Starts all three tracks at volume 0, then fades day audio in.
// Guarded by _audioStarted so it only ever runs once.
// =============================================================================
function _beginPlayback() {
  if (_audioStarted) return;   // already running — nothing to do

  if (_sndDay      && !_sndDay.isPlaying())      _sndDay.play();
  if (_sndRain     && !_sndRain.isPlaying())     _sndRain.play();
  if (_sndCollapse && !_sndCollapse.isPlaying()) _sndCollapse.play();

  // Scene always opens as daytime PASSIVE — fade day audio in immediately
  if (_sndDay) _sndDay.setVolume(VOL_DAY, FADE_TIME);
  _audioStarted = true;
  _lastSoundKey = 'day';
}


// =============================================================================
// START AUDIO  (kept for compatibility with user_interaction.js)
// user_interaction.js calls this on mousePressed / keyPressed.
// _beginPlayback()'s guard means it is safe to call multiple times.
// =============================================================================
function startAudio() {
  if (_audioStarted) return;
  getAudioContext().resume().then(() => {
    _beginPlayback();
  });
}


// =============================================================================
// UPDATE SOUND
// Called every frame from draw() in sketch.js.
//
// Computes a single "sound key" from the current STATE, then only acts when
// the key changes — avoids calling setVolume() 60 times per second.
//
// When the key changes, ALL three tracks are given their new target volumes
// in one call. Only the active track gets a non-zero volume, so crossfades
// happen naturally: old track fades out as new track fades in.
//
// Priority:
//   'rain'     → STATE.rainActive is true (overrides everything else)
//   'collapse' → STATE.currentState === 'COLLAPSE' and rain is not active
//   'day'      → STATE.currentState === 'PASSIVE' (daytime birdsong)
//   'silence'  → STATE.currentState === 'FIREFLIES' (night — no audio)
// =============================================================================
function updateSound() {
  if (!_audioStarted) return;

  // ── Determine what should be playing right now ──────────────────────────────
  let key;
  if (STATE.rainActive) {
    key = 'rain';                              // rain overrides everything
  } else if (STATE.currentState === 'FIREFLIES') {
    key = 'night';
  } else if (STATE.currentState === 'PASSIVE') {
    key = 'day';
  } else {
    key = 'silence';                           // FIREFLIES / night — no audio
  }

  // ── Only act when state changes ─────────────────────────────────────────────
  if (key === _lastSoundKey) return;
  _lastSoundKey = key;

  // ── Set target volumes for all three tracks ──────────────────────────────────
  // Only the active track gets a non-zero value.
  // FADE_TIME seconds crossfade — old track fades out, new track fades in.
  let volDay      = (key === 'day')      ? VOL_DAY      : 0;
  let volRain     = (key === 'rain')     ? VOL_RAIN     : 0;
  let volCollapse = (key === 'collapse') ? VOL_COLLAPSE : 0;

  if (_sndDay)      _sndDay.setVolume(volDay,           FADE_TIME);
  if (_sndRain)     _sndRain.setVolume(volRain,         FADE_TIME);
  if (_sndCollapse) _sndCollapse.setVolume(volCollapse, FADE_TIME);
}
