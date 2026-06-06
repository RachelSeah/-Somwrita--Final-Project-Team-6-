// js/scene.js
import { state } from './state.js';

// ─────────────────────────────────────────────────────────────
// ADJUST POSITIONS HERE
// x: positive = right,  negative = left
// y: positive = down,   negative = up
// ─────────────────────────────────────────────────────────────
const POSITIONS = {
  'sky':             { x: 3, y: 0},
  'sun':             { x: 0, y: 0 },
  'ocean':           { x: 0, y: -58 },
  'mountain':        { x: 7, y: -63},
  'island':          { x: 0, y: -65 },
  'cloud-1':         { x: 0, y: 0 },
  'cloud-2':         { x: 0, y: 0 },
  'cloud-3':         { x: 0, y: 0 },
  'hills-7':         { x: 0, y: -64 },
  'hills-8':         { x: 0, y: -64},
  'hills-5':         { x: -2, y: -7},
  'hills-6':         { x: 0, y: -65 },
  'hills-1':         { x: 0, y: 0 },
  'hills-2':         { x: 0, y: -5 },
  'hills-3':         { x: 0, y: 0 },
  'hills-4':         { x: -3, y: 3 },
  'tree-8':          { x: 0, y: -64 },
  'tree-bush':       { x: 0, y: 0 },
  'tree-4':          { x: 0, y: 25 },
  'tree-2':          { x: 100, y: 20 },
  'tree-7':          { x: 0, y: 0 },
  'tree-1':          { x: -30, y: -120},
  'tree-3':          { x: -150, y: 100},
  'tree-5':          { x: 1250, y: -60 },
  'tree-6':          { x: -100, y: 65 },
  'bush-2':          { x: -70, y: 15 },
  'bush-3':          { x: 313, y: -95},
  'bush-1':          { x: 0, y: 0 },
  'flowers':         { x: 0, y: 0 },
  'first-hill':      { x: 0, y: 0 },
  'moon':            { x: 0, y: 0 },
  'moon-reflection': { x: 0, y: 0 },
  'dark-overlay':    { x: 0, y: 0 },
};

// ─────────────────────────────────────────────────────────────
// LAYER ORDER — top = furthest back, bottom = closest front
// To reorder: cut a block and paste it higher or lower
// ─────────────────────────────────────────────────────────────

const LAYERS = [

  { id: 'sky',
    day:   'Assets-25.svg',
    night: 'Assets Night-25.svg' },

  { id: 'sun',
    day:   'Assets_Sun.svg',
    night: null },

  // Moon at same depth as sun — sits behind hills and foreground
  { id: 'moon',
    day:   null,
    night: 'Assets Night_Moon.svg' },

  { id: 'ocean',
    day:   'Assets_Ocean-1.svg',
    night: 'Assets Night_Ocean-1.svg' },

  { id: 'mountain',
    day:   'Assets_Mountain-1.svg',
    night: 'Assets Night_Mountain-Background-1.svg' },

  { id: 'island',
    day:   'Assets_Island-1.svg',
    night: 'Assets Night_Island-1.svg' },

  { id: 'cloud-1',
    day:   'Assets_Cloud-1.svg',
    night: 'Assets Night_Cloud-1.svg' },

  { id: 'cloud-2',
    day:   'Assets_Cloud-2.svg',
    night: 'Assets Night_Cloud-2.svg' },

  { id: 'cloud-3',
    day:   'Assets_Cloud-3.svg',
    night: 'Assets Night_Cloud-3.svg' },

  { id: 'hills-7',
    day:   'Assets_Foreground-hills-7.svg',
    night: 'Assets Night_Foreground-hills-7.svg' },

  { id: 'hills-8',
    day:   'Assets_Foreground-hills-8.svg',
    night: 'Assets Night_Foreground-hills-8.svg' },

  { id: 'hills-6',
    day:   'Assets_Foreground-hills-6.svg',
    night: 'Assets Night_Foreground-hills-6.svg' },

  { id: 'hills-4',
    day:   'Assets_Foreground-hills-4.svg',
    night: 'Assets Night_Foreground-hills-4.svg' },

  { id: 'tree-8',
    day:   'Assets_Tree-8.svg',
    night: 'Assets Night_Tree-8.svg' },

  { id: 'bush-2',
    day:   'Assets_Bush-2.svg',
    night: 'Assets Night_Bush-2.svg' },

  { id: 'hills-5',
    day:   'Assets_Foreground-hills-5.svg',
    night: 'Assets Night_Foreground-hills-5.svg' },

  { id: 'tree-bush',
    day:   'Assets_Tree-bush 1.svg',
    night: 'Assets Night_Tree-bush 1.svg' },

  { id: 'tree-4',
    day:   'Assets_Tree-4.svg',
    night: 'Assets Night_Tree-4.svg' },

  { id: 'tree-6',
    day:   'Assets_Tree 6.svg',
    night: 'Assets Night_Tree 6.svg' },

  { id: 'hills-3',
    day:   'Assets_Foreground-hills 3.svg',
    night: 'Assets Night_Foreground-hills 3.svg' },

  { id: 'tree-7',
    day:   'Assets_Tree-7.svg',
    night: 'Assets Night_Tree-7.svg' },

  { id: 'tree-5',
    day:   'Assets_Tree 5.svg',
    night: 'Assets Night_Tree 5.svg' },

  { id: 'tree-2',
    day:   'Assets_Tree 2.svg',
    night: 'Assets Night_Tree 2.svg' },

  { id: 'bush-1',
    day:   'Assets_Bush-1.svg',
    night: 'Assets Night_Bush-1.svg' },

  { id: 'tree-1',
    day:   'Assets_Tree-1.svg',
    night: 'Assets Night_Tree-1.svg' },

  { id: 'tree-3',
    day:   'Assets_Tree 3.svg',
    night: 'Assets Night_Tree 3.svg' },

  { id: 'bush-3',
    day:   'Assets_Bush 3.svg',
    night: 'Assets Night_Bush 3.svg' },

  { id: 'hills-2',
    day:   'Assets_Foreground-hills-2.svg',
    night: 'Assets Night_Foreground-hills-2.svg' },
  
  { id: 'flowers',
    day:   'Assets_Foreground-flowers 1.svg',
    night: 'Assets Night_Foreground-flowers 1.svg' },

  { id: 'first-hill',
    day:   'First-hill.svg',
    night: null },

  { id: 'hills-1',
    day:   'Assets_Foreground-hills 1.svg',
    night: 'Assets Night_Foreground-hills 1.svg' },

  // Night-only layers — order matters:
  // dark-overlay darkens everything, moon appears over it,
  // moon-reflection appears over both
  { id: 'dark-overlay',
    day:   null,
    night: 'Assets Night_Dark overlay.svg' },

  { id: 'moon-reflection',
    day:   null,
    night: 'Assets Night_Moon-reflection-on-water.svg' },

];

// ─────────────────────────────────────────────────────────────
// No need to edit below this line
// ─────────────────────────────────────────────────────────────

async function fetchSVG(path) {
  const res = await fetch(path);
  if (!res.ok) {
    console.warn(`[scene.js] Failed to load: ${path}`);
    return null;
  }
  return res.text();
}

// Fix CSS class clashes by rewriting every class name to be unique per layer.
// Also fixes duplicate gradient/filter ids by scoping them with a prefix.
function isolateSVG(svgText, scope) {
  // Scope class names in <style> blocks and on elements
  let out = svgText.replace(/\.(cls-[\w-]+)/g, `.${scope}-$1`);
  out = out.replace(/class="([^"]*)"/g, (_, classes) => {
    const scoped = classes.trim().split(/\s+/)
      .map(c => c.startsWith('cls-') ? `${scope}-${c}` : c)
      .join(' ');
    return `class="${scoped}"`;
  });
  // Scope all ids and their references (gradients, filters, masks, etc.)
  // Step 1: collect all ids in this SVG
  const ids = [];
  out.replace(/\bid="([^"]+)"/g, (_, id) => ids.push(id));
  // Step 2: replace each id definition and every url(#id) / href="#id" reference
  ids.forEach(id => {
    const safe = `${scope}-${id}`;
    out = out.replace(new RegExp(`id="${id}"`, 'g'), `id="${safe}"`);
    out = out.replace(new RegExp(`url\\(#${id}\\)`, 'g'), `url(#${safe})`);
    out = out.replace(new RegExp(`href="#${id}"`, 'g'), `href="#${safe}"`);
    out = out.replace(new RegExp(`xlink:href="#${id}"`, 'g'), `xlink:href="#${safe}"`);
  });
  return out;
}

export async function buildScene(container) {
  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i];
    const pos   = POSITIONS[layer.id] || { x: 0, y: 0 };

    const wrapper = document.createElement('div');
    wrapper.id        = 'layer-' + layer.id;
    wrapper.className = 'scene-layer';
    wrapper.style.zIndex    = i;
    wrapper.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    wrapper.dataset.baseTransform = `translate(${pos.x}px, ${pos.y}px)`;

    // Day version — visible by default
    if (layer.day) {
      const raw = await fetchSVG(`assets/day/${layer.day}`);
      if (raw) {
        const dayEl = document.createElement('div');
        dayEl.className    = 'layer-day';
        dayEl.style.opacity = '1';
        dayEl.innerHTML    = isolateSVG(raw, `d${i}`);
        const svg = dayEl.querySelector('svg');
        if (svg) {
          svg.setAttribute('width',  '100%');
          svg.setAttribute('height', '100%');
          svg.style.position = 'absolute';
          svg.style.inset    = '0';
        }
        wrapper.appendChild(dayEl);
      }
    }

    // Night version — hidden by default
    if (layer.night) {
      const raw = await fetchSVG(`assets/night/${layer.night}`);
      if (raw) {
        const nightEl = document.createElement('div');
        nightEl.className    = 'layer-night';
        nightEl.style.opacity = '0';
        nightEl.innerHTML    = isolateSVG(raw, `n${i}`);
        const svg = nightEl.querySelector('svg');
        if (svg) {
          svg.setAttribute('width',  '100%');
          svg.setAttribute('height', '100%');
          svg.style.position = 'absolute';
          svg.style.inset    = '0';
        }
        wrapper.appendChild(nightEl);
      }
    }

    container.appendChild(wrapper);
  }
}
