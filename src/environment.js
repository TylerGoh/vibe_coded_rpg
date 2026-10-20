// Docs: docs/art.md
// The look (and mood) of the world over a run, as keyframes along p = 0 (start) → 1 (the win).
// Stages: sunny day → golden afternoon → witchy dusk → storm night → crimson finale.
// Everything blends smoothly between neighbouring keyframes.

const P = [0, 0.2, 0.4, 0.62, 0.8, 1];

// Each field has one value per keyframe: numbers, '#rrggbb' colors, or [r, g, b, a] arrays.
const KEYS = {
  skyTop: ['#9fd8ff', '#8ec5ee', '#3b2d6b', '#262247', '#3a0d1f', '#24060f'],
  skyMid: ['#d9f0ff', '#ffe2b5', '#7a5ba8', '#4a4479', '#8a1f2e', '#6e0f1e'],
  skyBottom: ['#fff0e6', '#ffc394', '#e08fb8', '#85679a', '#ff6a4a', '#ff4a2a'],
  skyHaze: [2, 2, 1.5, 1, 0.4, 0.2], // pale atmospheric haze on the sky: soft by day, harsh and saturated at the end
  darken: [0, 0, 0.08, 0.18, 0.3, 0.42], // turns the scenery into dark silhouettes
  wash: [[0, 0, 0, 0], [255, 170, 90, 0.07], [55, 40, 105, 0.22], [40, 30, 90, 0.32], [150, 10, 35, 0.34], [130, 5, 25, 0.42]],
  groundTint: [0, 0.04, 0.12, 0.18, 0.24, 0.3], // the wash colour, lighter on the playfield so hazards stay readable
  vignette: [0, 0, 0.25, 0.35, 0.5, 0.65],
  vignetteColor: ['#2a1a4a', '#2a1a4a', '#2a1a4a', '#1a1438', '#3a0010', '#2a0008'],
  treeStage: [0, 1, 2, 3, 4, 4], // lush → autumn → witchy → dead → hellish (see background.js)
  grit: [0, 0.25, 0.5, 0.75, 1, 1], // how determined the slime looks
  // the playfield ground decays too
  grass: ['#7fd06e', '#b5c95a', '#6a8f7a', '#7d7a6a', '#3a1a1a', '#331414'],
  grassLight: ['#a3e48d', '#d6dd84', '#86a894', '#99958a', '#5a2a22', '#552420'],
  tuft: ['#5fb85a', '#9aa64a', '#4f7a66', '#6a6658', '#2a1010', '#240c0c'],
  dirt: ['#d4a77a', '#cf9a6a', '#8f7a8a', '#7a6a62', '#3a1612', '#331210'],
  dirtDark: ['#c4946a', '#bb8558', '#7d6878', '#675850', '#2a0e0c', '#240b09'],
  pebble: ['#b38259', '#a8754a', '#6d5a6a', '#5a4c46', '#ff5a2a', '#ff6a2a'], // pebbles become glowing embers
  mushroom: ['#ff7a7a', '#ff9a5a', '#b77aff', '#8a7a8a', '#ff3a2a', '#ff3a2a'],
  flowers: [1, 1, 0.6, 0.15, 0, 0], // flowers wilt away...
  flames: [0, 0, 0, 0, 1, 1], // ...and little flames take their place
  sunY: [95, 140, 230, 285, 250, 240],
  sunColor: ['#fff6c4', '#ffe39a', '#ffb38a', '#ff9f8a', '#ff4a3a', '#ff2a2a'],
  sunbeams: [0.1, 0.12, 0, 0, 0, 0],
  sad: [0, 0.15, 0.6, 1, 1, 1], // sun's sadness — also drives the music's darkness
  fury: [0, 0, 0, 0, 1, 1], // the sun's tears turn to rage at the end
  witch: [0, 0, 1, 0.5, 0, 0], // witchy music layer (theremin + bell)
  cloudColor: ['#ffffff', '#fff1dc', '#9c8cc4', '#6f6898', '#7a2a3a', '#5a1424'],
  storm: [0, 0, 0.3, 1, 1, 1],
  stormColor: ['#8d86b3', '#8d86b3', '#8d86b3', '#6f6898', '#5c1a2a', '#4a0f1c'],
  stars: [0, 0, 1, 0.3, 0, 0],
  moon: [0, 0, 1, 0.5, 1, 1],
  moonColor: ['#fff5d6', '#fff5d6', '#fff5d6', '#e6e0ff', '#ff5a4a', '#ff3a2a'],
  bats: [0, 0, 1, 0.4, 1, 1],
  mist: [0, 0, 0.7, 0.4, 0.2, 0.2],
  mistColor: ['#d8c8ff', '#d8c8ff', '#c9b3ff', '#a99be0', '#ff8a8a', '#ff6a6a'],
  fireflies: [0.15, 0.35, 1, 0.5, 0, 0],
  fireflyColor: ['#fffbd0', '#ffe08a', '#b8ff9a', '#b8ff9a', '#ff9a6a', '#ff9a6a'],
  embers: [0, 0, 0, 0, 1, 1],
  rain: [0, 0, 0, 1, 0.7, 1],
  rainColor: [[200, 210, 255, 0.7], [200, 210, 255, 0.7], [200, 210, 255, 0.7], [200, 210, 255, 0.7], [255, 160, 170, 0.7], [255, 140, 150, 0.75]],
  lightning: [0, 0, 0, 0.1, 0.25, 0.45], // flashes per second
  flashColor: [[250, 245, 255], [250, 245, 255], [250, 245, 255], [250, 245, 255], [255, 120, 110], [255, 90, 80]],
};

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbToHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

function blend(a, b, t) {
  if (typeof a === 'number') return a + (b - a) * t;
  if (typeof a === 'string') return rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));
  return a.map((v, i) => v + (b[i] - v) * t);
}

// The environment at progress p (0..1).
export function envAt(p) {
  p = Math.min(1, Math.max(0, p));
  let k = 0;
  while (k < P.length - 2 && p > P[k + 1]) k++;
  let t = (p - P[k]) / (P[k + 1] - P[k]);
  t = t * t * (3 - 2 * t); // ease between keyframes
  const env = {};
  for (const [name, values] of Object.entries(KEYS)) env[name] = blend(values[k], values[k + 1], t);
  return env;
}

// Mix two environments (used to fade back to a sunny day after a win).
export function mixEnv(a, b, t) {
  const env = {};
  for (const name of Object.keys(KEYS)) env[name] = blend(a[name], b[name], t);
  return env;
}

export const rgba = (c, alphaScale = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(c[3] ?? 1) * alphaScale})`;
