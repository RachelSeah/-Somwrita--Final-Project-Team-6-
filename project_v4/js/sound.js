// js/sound.js — Nishant
import { state } from './state.js';

let dayGain, nightGain, ctx;

window.addEventListener('scene-ready', () => {
  document.addEventListener('click', startAudio, { once: true });
});

async function startAudio() {
  ctx            = new AudioContext();
  dayGain        = ctx.createGain();
  nightGain      = ctx.createGain();
  dayGain.gain.value   = 1;
  nightGain.gain.value = 0;

  dayGain.connect(ctx.destination);
  nightGain.connect(ctx.destination);

  const [dayBuffer, nightBuffer] = await Promise.all([
    loadBuffer(ctx, 'assets/sound/ambient.mp3'),
    loadBuffer(ctx, 'assets/sound/night.mp3'),
  ]);

  const daySource   = ctx.createBufferSource();
  const nightSource = ctx.createBufferSource();
  daySource.buffer   = dayBuffer;
  nightSource.buffer = nightBuffer;
  daySource.loop     = true;
  nightSource.loop   = true;
  daySource.connect(dayGain);
  nightSource.connect(nightGain);
  daySource.start();
  nightSource.start();

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  daySource.connect(analyser);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function analyse() {
    analyser.getByteFrequencyData(dataArray);
    state.audioBass  = average(dataArray, 0, 10)   / 255;
    state.audioMid   = average(dataArray, 10, 60)  / 255;
    state.audioHigh  = average(dataArray, 60, 128) / 255;
    state.audioLevel = average(dataArray, 0, 128)  / 255;

    // Crossfade sounds with timeOfDay
    dayGain.gain.value   = 1 - state.timeOfDay;
    nightGain.gain.value = state.timeOfDay;

    requestAnimationFrame(analyse);
  }
  analyse();
}

window.toggleMute = function() {
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
    document.getElementById('mute-btn').textContent = '🔊';
  } else {
    ctx.suspend();
    document.getElementById('mute-btn').textContent = '🔇';
  }
};

async function loadBuffer(ctx, url) {
  const res    = await fetch(url);
  const buffer = await res.arrayBuffer();
  return ctx.decodeAudioData(buffer);
}

function average(arr, start, end) {
  let sum = 0;
  for (let i = start; i < end; i++) sum += arr[i];
  return sum / (end - start);
}