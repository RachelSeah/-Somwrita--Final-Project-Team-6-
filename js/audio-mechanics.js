// js/audio-mechanics.js — Nishant Reddy (Audio Mechanic)
// Claude was used to help structure the crossfade logic, FFT bass pulse, and pan mechanic.

let _sndDay = null;
let _sndRain = null;
let _sndNight = null;
let _sndCollapse = null;
let _sndPop = null;
let _sndFishSplash = null;

let _audioStarted = false;
let _lastSoundKey = null;

// p5.FFT — analyses bass energy of the master output each frame
// Used by getBassPulse() which drawSpawnedFlowers() reads to pulse flower size
let _fft = null;
let _bassPulse = 0;   // 0.0 (silent) → 1.0 (loud bass)

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
  try { _sndFishSplash = loadSound('assets/audio/fish_splash.mp3'); }
  catch (e) { console.warn('[audio] Could not load fish_splash.mp3'); }
}

function setupSounds() {
  if (_sndDay) { _sndDay.setLoop(true); _sndDay.setVolume(0); }
  if (_sndRain) { _sndRain.setLoop(true); _sndRain.setVolume(0); }
  if (_sndNight) { _sndNight.setLoop(true); _sndNight.setVolume(0); }
  if (_sndCollapse) { _sndCollapse.setLoop(true); _sndCollapse.setVolume(0); }

  // FFT with no setInput() analyses the master output — picks up whatever track is playing
  _fft = new p5.FFT(0.8, 64);

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

function _beginPlayback() {
  if (_audioStarted) return;
  if (_sndDay && !_sndDay.isPlaying()) _sndDay.play();
  if (_sndRain && !_sndRain.isPlaying()) _sndRain.play();
  if (_sndNight && !_sndNight.isPlaying()) _sndNight.play();
  if (_sndCollapse && !_sndCollapse.isPlaying()) _sndCollapse.play();
  _audioStarted = true;
  _lastSoundKey = '';
}

function startAudio() {
  if (_audioStarted) return;
  getAudioContext().resume().then(() => { _beginPlayback(); });
}

// Returns bass energy 0.0–1.0 — read by drawSpawnedFlowers() to pulse flower size
function getBassPulse() {
  return _bassPulse;
}

function updateSound() {
  if (!_audioStarted) return;

  // ── Pan: map mouseX across canvas width → left (-1) to right (+1) speaker 
  let panVal = constrain(map(mouseX, 0, nativeW, -1, 1), -1, 1);
  if (_sndDay) _sndDay.pan(panVal);
  if (_sndRain) _sndRain.pan(panVal);
  if (_sndNight) _sndNight.pan(panVal);
  if (_sndCollapse) _sndCollapse.pan(panVal);

  // ── FFT bass pulse — update every frame 
  if (_fft) {
    _fft.analyze();
    let bassEnergy = _fft.getEnergy('bass');   // 0–255
    _bassPulse = map(bassEnergy, 0, 255, 0, 1);
  }

  // ── Crossfade logic — only acts when state changes
  let key;
  if (STATE.rainActive) key = 'rain';
  else if (STATE.currentState === 'COLLAPSE') key = 'collapse';
  else if (STATE.currentState === 'FIREFLIES') key = 'night';
  else if (STATE.currentState === 'PASSIVE') key = 'day';
  else key = 'silence';

  if (key === _lastSoundKey) return;
  _lastSoundKey = key;

  if (key === 'day' && _sndDay && !_sndDay.isPlaying()) _sndDay.play();
  if (key === 'rain' && _sndRain && !_sndRain.isPlaying()) _sndRain.play();
  if (key === 'night' && _sndNight && !_sndNight.isPlaying()) _sndNight.play();
  if (key === 'collapse' && _sndCollapse && !_sndCollapse.isPlaying()) _sndCollapse.play();

  if (_sndDay) _sndDay.setVolume((key === 'day') ? VOL_DAY : 0, FADE_TIME);
  if (_sndRain) _sndRain.setVolume((key === 'rain') ? VOL_RAIN : 0, FADE_TIME);
  if (_sndNight) _sndNight.setVolume((key === 'night') ? VOL_NIGHT : 0, FADE_TIME);
  if (_sndCollapse) _sndCollapse.setVolume((key === 'collapse') ? VOL_COLLAPSE : 0, FADE_TIME);
}

// flower pop sound 
function playFlowerPop() {
  if (_audioStarted && _sndPop) {
    _sndPop.setVolume(0.03);
    _sndPop.play();
  }
}


// fish jump sound
function playFishSplash(fishX) {
  if (!_audioStarted || !_sndFishSplash) return;
  let panVal = constrain(map(fishX, 0, nativeW, -1, 1), -1, 1);
  _sndFishSplash.pan(panVal);
  _sndFishSplash.setVolume(0.35);
  _sndFishSplash.play();
}