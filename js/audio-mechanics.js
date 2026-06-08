// js/audio-mechanics.js — Nishant Reddy (Audio Mechanic)
// Claude was used to help structure the crossfade logic.

let _sndDay   = null;
let _sndRain  = null;
let _sndNight = null;

let _audioStarted = false;
let _lastSoundKey = null;

const VOL_DAY   = 0.7;
const VOL_RAIN  = 0.8;
const VOL_NIGHT = 0.6;
const FADE_TIME = 1.5;

function preloadSounds() {
  try { _sndDay   = loadSound('assets/audio/ambient.mp3'); }
  catch(e) { console.warn('[audio] Could not load ambient.mp3'); }

  try { _sndRain  = loadSound('assets/audio/ambient_rain.mp3'); }
  catch(e) { console.warn('[audio] Could not load ambient_rain.mp3'); }

  try { _sndNight = loadSound('assets/audio/night.mp3'); }
  catch(e) { console.warn('[audio] Could not load night.mp3'); }
}

function setupSounds() {
  if (_sndDay)   { _sndDay.setLoop(true);   _sndDay.setVolume(0); }
  if (_sndRain)  { _sndRain.setLoop(true);  _sndRain.setVolume(0); }
  if (_sndNight) { _sndNight.setLoop(true); _sndNight.setVolume(0); }

  let ctx = getAudioContext();
  if (ctx.state === 'running') {
    _beginPlayback();
  } else {
    ctx.onstatechange = function() {
      if (ctx.state === 'running' && !_audioStarted) _beginPlayback();
    };
  }

  function _unlockOnGesture() {
    if (_audioStarted) { _removeListeners(); return; }
    ctx.resume().then(() => { if (!_audioStarted) _beginPlayback(); });
    _removeListeners();
  }
  function _removeListeners() {
    window.removeEventListener('mousedown',  _unlockOnGesture);
    window.removeEventListener('keydown',    _unlockOnGesture);
    window.removeEventListener('touchstart', _unlockOnGesture);
  }
  window.addEventListener('mousedown',  _unlockOnGesture);
  window.addEventListener('keydown',    _unlockOnGesture);
  window.addEventListener('touchstart', _unlockOnGesture);
}

function _beginPlayback() {
  if (_audioStarted) return;
  if (_sndDay   && _sndDay.isLoaded()   && !_sndDay.isPlaying())   _sndDay.play();
  if (_sndRain  && _sndRain.isLoaded()  && !_sndRain.isPlaying())  _sndRain.play();
  if (_sndNight && _sndNight.isLoaded() && !_sndNight.isPlaying()) _sndNight.play();
  if (_sndDay) _sndDay.setVolume(VOL_DAY, FADE_TIME);
  _audioStarted = true;
  _lastSoundKey = 'day';
}

function startAudio() {
  if (_audioStarted) return;
  getAudioContext().resume().then(() => { _beginPlayback(); });
}

function updateSound() {
  if (!_audioStarted) return;

  let key;
  if (STATE.rainActive)                        key = 'rain';
  else if (STATE.currentState === 'FIREFLIES') key = 'night';
  else if (STATE.currentState === 'PASSIVE')   key = 'day';
  else                                         key = 'silence';

  if (key === _lastSoundKey) return;
  _lastSoundKey = key;

  if (_sndDay)   _sndDay.setVolume(  (key === 'day')   ? VOL_DAY   : 0, FADE_TIME);
  if (_sndRain)  _sndRain.setVolume( (key === 'rain')  ? VOL_RAIN  : 0, FADE_TIME);
  if (_sndNight) _sndNight.setVolume((key === 'night') ? VOL_NIGHT : 0, FADE_TIME);
}