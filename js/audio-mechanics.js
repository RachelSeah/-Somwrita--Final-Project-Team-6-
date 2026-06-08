// js/audio-mechanics.js — Nishant Reddy (Audio Mechanic)
// Claude was used to help structure the crossfade logic.

let _sndDay = null;
let _sndRain = null;
let _sndNight = null;
let _sndCollapse = null;
let _sndPop = null;

let _audioStarted = false;
let _lastSoundKey = null;
let _isMuted = false;

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

  if (_sndDay)      _sndDay.setVolume((!_isMuted && key === 'day')      ? VOL_DAY      : 0, FADE_TIME);
  if (_sndRain)     _sndRain.setVolume((!_isMuted && key === 'rain')     ? VOL_RAIN     : 0, FADE_TIME);
  if (_sndNight)    _sndNight.setVolume((!_isMuted && key === 'night')    ? VOL_NIGHT    : 0, FADE_TIME);
  if (_sndCollapse) _sndCollapse.setVolume((!_isMuted && key === 'collapse')? VOL_COLLAPSE : 0, FADE_TIME);
}

function playFlowerPop() {
  if (_audioStarted && !_isMuted && _sndPop) {
    _sndPop.setVolume(0.03);   // sound volume
    _sndPop.play();
  }
}

function isMuted() {
  return _isMuted;
}

function toggleMute() {
  _isMuted = !_isMuted;

  if (_isMuted) {
    // Silence everything right away
    if (_sndDay)      _sndDay.setVolume(0, 0.3);
    if (_sndRain)     _sndRain.setVolume(0, 0.3);
    if (_sndNight)    _sndNight.setVolume(0, 0.3);
    if (_sndCollapse) _sndCollapse.setVolume(0, 0.3);
  }

  // Force updateSound() to re-apply the correct volume on its next run
  _lastSoundKey = '__force__';

  // Make sure audio is unlocked if this is the first interaction
  if (typeof startAudio === 'function') startAudio();

  return _isMuted;
}
