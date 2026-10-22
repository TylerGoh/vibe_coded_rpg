// Docs: docs/performance.md
// The Graphics setting in the Esc menu: how sharp the canvas renders.
// High draws up to 2 device px per canvas px (sharp on big and retina screens); Low draws 1 (a quarter of
// the pixels on a 1080p screen, the biggest single saving on a slow machine). Auto starts High and drops
// to Low for the rest of the session if frames keep coming slowly. The choice is kept in localStorage.

const KEY = 'slimeville-gfx';
const MODES = ['auto', 'high', 'low'];
const HIGH_CAP = 2, LOW_CAP = 1;
const WINDOW_S = 3; // Auto judges the frame rate over this long…
const SLOW_MS = 22; // …and a window averaging slower than this per frame (under ~45 fps) counts as slow
const SLOW_WINDOWS = 2; // this many slow windows in a row and Auto drops to Low
const SETTLE_S = 4; // ignore the first seconds (and after a room change): caches are being built

let mode = 'auto';
try {
  const saved = localStorage.getItem(KEY);
  if (MODES.includes(saved)) mode = saved;
} catch {}
let autoLow = false; // Auto's decision, for this session only
let sum = 0, frames = 0, slow = 0, settle = SETTLE_S;
let onChange = () => {};

export const gfx = {
  get mode() {
    return mode;
  },
  get low() {
    return mode === 'low' || (mode === 'auto' && autoLow);
  },
  // the most device px per canvas px to render at
  get cap() {
    return this.low ? LOW_CAP : HIGH_CAP;
  },
  label() {
    return `Graphics: ${mode === 'auto' ? `auto (${autoLow ? 'low' : 'high'})` : mode}`;
  },
  cycle() {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
    slow = 0;
    settle = SETTLE_S;
    onChange();
  },
  onChange(f) {
    onChange = f;
  },
  // a room change or a resize: the next frames are slow while caches fill, so don't judge them
  settle() {
    settle = SETTLE_S;
    sum = frames = 0;
  },
  // called every frame with the real time since the last one (seconds)
  sample(gap) {
    if (mode !== 'auto' || autoLow) return;
    if (gap > 0.25 || document.hidden) return; // a stall or a background tab, not a slow machine
    if (settle > 0) {
      settle -= gap;
      return;
    }
    sum += gap;
    frames++;
    if (sum < WINDOW_S) return;
    slow = (sum / frames) * 1000 > SLOW_MS ? slow + 1 : 0;
    sum = frames = 0;
    if (slow >= SLOW_WINDOWS) {
      autoLow = true;
      onChange();
    }
  },
};
