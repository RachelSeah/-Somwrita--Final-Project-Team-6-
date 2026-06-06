// js/sound.js by Nishant
import { state } from './state.js';

let gainNode;  // ← add this

window.addEventListener('scene-ready', () => {
  document.addEventListener('click', startAudio, { once: true });
});

async function startAudio() {
  const ctx      = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  gainNode = ctx.createGain();  // ← add this

  const response    = await fetch('assets/sound/ambient.mp3');
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const source  = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop   = true;
  source.connect(analyser);
  analyser.connect(gainNode);       // ← changed
  gainNode.connect(ctx.destination); // ← changed
  source.start();

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  function analyse() {
    analyser.getByteFrequencyData(dataArray);
    state.audioBass  = average(dataArray, 0, 10)   / 255;
    state.audioMid   = average(dataArray, 10, 60)  / 255;
    state.audioHigh  = average(dataArray, 60, 128) / 255;
    state.audioLevel = average(dataArray, 0, 128)  / 255;
    requestAnimationFrame(analyse);
  }
  analyse();
}

// ← add this function
window.toggleMute = function() {
  if (!gainNode) return;
  const muted = gainNode.gain.value === 0;
  gainNode.gain.value = muted ? 1 : 0;
  state.isMuted = !muted;
  document.getElementById('mute-btn').textContent = muted ? '🔊' : '🔇';
};

function average(arr, start, end) {
  let sum = 0;
  for (let i = start; i < end; i++) sum += arr[i];
  return sum / (end - start);
}