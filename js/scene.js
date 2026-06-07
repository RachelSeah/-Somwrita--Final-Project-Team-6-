// =============================================================================
// js/scene.js
// =============================================================================
//
// PURPOSE:
//   Builds the SVG scene by fetching each SVG file and inlining it as a
//   real DOM element. Because SVGs live in the DOM (not on a canvas),
//   they render as crisp vectors at any screen resolution.
//
// HOW IT WORKS:
//   - Loops through the LAYERS array from layers.js
//   - For each layer, fetches the day and/or night SVG file via HTTP
//   - Inlines the SVG markup directly into a div
//   - Stacks divs in z-order (index 0 = furthest back)
//   - Day versions start at opacity 1, night versions at opacity 0
//   - time.js crossfades between them by adjusting opacity
//
// CALLED FROM: index.html inline script — before sketch.js starts
//
// =============================================================================


// Fetches an SVG file and returns its text content
async function fetchSVG(path) {
  const res = await fetch(path);
  if (!res.ok) {
    console.warn('[scene.js] Failed to load: ' + path);
    return null;
  }
  return res.text();
}


// Rewrites all CSS class names and IDs in an SVG to be unique per layer.
// Prevents class name and gradient ID clashes when 60+ SVGs are inlined.
// e.g. cls-1 in layer 3 becomes d3-cls-1
function isolateSVG(svgText, scope) {
  // Scope class names in <style> blocks
  let out = svgText.replace(/\.(cls-[\w-]+)/g, '.' + scope + '-$1');
  // Scope class attributes on elements
  out = out.replace(/class="([^"]*)"/g, (_, classes) => {
    const scoped = classes.trim().split(/\s+/)
      .map(c => c.startsWith('cls-') ? scope + '-' + c : c)
      .join(' ');
    return 'class="' + scoped + '"';
  });
  // Collect all id attributes
  const ids = [];
  out.replace(/\bid="([^"]+)"/g, (_, id) => ids.push(id));
  // Rewrite each id definition and every reference to it
  ids.forEach(id => {
    const safe = scope + '-' + id;
    out = out.replace(new RegExp('id="' + id + '"', 'g'),      'id="' + safe + '"');
    out = out.replace(new RegExp('url\\(#' + id + '\\)', 'g'), 'url(#' + safe + ')');
    out = out.replace(new RegExp('href="#' + id + '"', 'g'),   'href="#' + safe + '"');
    out = out.replace(new RegExp('xlink:href="#' + id + '"', 'g'), 'xlink:href="#' + safe + '"');
  });
  return out;
}


// Builds the full SVG scene into the given container element.
// Returns a Promise that resolves when all SVGs are loaded and inserted.
async function buildScene(container) {

  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i];

    // Wrapper div — one per layer, stacked by z-index
    const wrapper = document.createElement('div');
    wrapper.id        = 'layer-' + layer.id;
    wrapper.className = 'scene-layer';
    wrapper.style.zIndex   = i;
    // Apply base x/y position from layers.js
    wrapper.style.transform = 'translate(' + layer.x + 'px, ' + layer.y + 'px)';

    // ── Day version — visible by default ──────────────────────────────────────
    if (layer.dayFile) {
      const raw = await fetchSVG('assets/day/' + layer.dayFile);
      if (raw) {
        const dayEl = document.createElement('div');
        dayEl.className   = 'layer-day';
        dayEl.style.opacity = '1';
        dayEl.innerHTML   = isolateSVG(raw, 'd' + i);
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

    // ── Night version — hidden by default ─────────────────────────────────────
    if (layer.nightFile) {
      const raw = await fetchSVG('assets/night/' + layer.nightFile);
      if (raw) {
        const nightEl = document.createElement('div');
        nightEl.className   = 'layer-night';
        nightEl.style.opacity = '0';
        nightEl.innerHTML   = isolateSVG(raw, 'n' + i);
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
