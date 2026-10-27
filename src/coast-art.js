// Docs: docs/places/coast.md, docs/combat/stages.md
// The Smoking Coast's art that isn't the room itself (src/coast.js): its creatures (marine iguana, ashfoot booby,
// rock lobster, pumice crab and the crumbs it breaks into, steam ray; COAST_MOB_ART, called by drawMob in
// src/field.js), the gear dropped or sold there (COAST_SWORDS, COAST_SWORD_LEN, COAST_HELMETS, drawn by drawSword /
// drawHelmet in src/field.js; the Hatchkeeper's den drops the Black Crest Blade and the Clutchkeeper Helm; the
// staves and bows are data in src/staff-art.js and src/bow-art.js), its materials' icons (COAST_ICONS), and Liv: the thinned fjord-folk look (THIN_PALETTE, drawThinFolk: src/slime.js, folk
// 'thinned') and her dress (drawGlasscutterDress). Emberdeep's register: black glass, basalt, iron; wet black rock,
// white steam, the sea's grey-green, and red only where the lava is.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const ROCK = '#3a343e', ROCK_D = '#221e26', ROCK_L = '#5a5262';
const IRON = '#8a8490', IRON_D = '#4e4a56';
const GLASS = '#1e1c26', GLASS_L = '#9adce8';
const SALT = '#eeeae4';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, glow = null } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = glow ?? INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.6) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = glow ?? INKC;
    }
  }
}
// a few puffs of steam lifting off something hot and wet
function steam(ctx, x, y, spread, t, seed, n = 3, a = 0.45) {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.4 + i / n + seed * 0.13) % 1;
    ctx.fillStyle = `rgba(245,242,240,${a * Math.sin(k * Math.PI)})`;
    circle(ctx, x + Math.sin(k * 5 + i * 2 + seed) * spread, y - k * 30, 3 + k * 6);
  }
}

// Marine iguana: a black, blunt-faced lizard crusted white with salt on the head, a ragged crest of spines down its
// back, a reddish tinge on its flanks. Harmless: when it isn't walking it basks, flat on the warm rock with its chin
// up, and now and then sneezes a little puff of salt out of its nose.
function drawMarineIguana(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const step = walk ? Math.sin(t * 8 + seed) : 0;
  const bask = !walk;
  const cy = -h * (bask ? 0.32 : 0.42);
  // splayed legs
  ctx.fillStyle = ROCK_D;
  for (const [x, ph] of [[-0.22, 1], [0.18, -1]]) {
    ctx.beginPath();
    ctx.ellipse(w * x + step * ph * 3, -h * 0.08, w * 0.08, h * 0.12, ph * 0.4, 0, TAU);
    ctx.fill();
  }
  // the tail, long and flat, curling behind
  ctx.fillStyle = ROCK;
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy - h * 0.06);
  ctx.quadraticCurveTo(-w * 0.46, cy + h * 0.1, -w * 0.56, -h * 0.06 + Math.sin(t * 1.5 + seed) * 2);
  ctx.quadraticCurveTo(-w * 0.44, cy + h * 0.3, -w * 0.18, cy + h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const body = () => ctx.ellipse(-w * 0.02, cy, w * 0.26, h * (bask ? 0.26 : 0.3), 0, 0, TAU);
  ctx.fillStyle = ROCK;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(170,70,60,0.35)'; // the reddish flank
  ellipse(ctx, -w * 0.04, cy + h * 0.06, w * 0.16, h * 0.12);
  // the crest: ragged spines down the back
  ctx.fillStyle = '#6a6070';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const x = -w * 0.22 + i * w * 0.06, y = cy - h * (0.22 + Math.sin(i * 0.9) * 0.03);
    ctx.moveTo(x - 2.5, y + 3);
    ctx.lineTo(x, y - 6 - (i % 2) * 2);
    ctx.lineTo(x + 2.5, y + 3);
  }
  ctx.fill();
  // the head: blunt, chin up when basking, white with salt on top
  const hx = w * 0.3, hy = cy - h * (bask ? 0.12 : 0.02);
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(bask ? -0.3 : 0);
  ctx.fillStyle = ROCK;
  ctx.strokeStyle = ROCK_D;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.13, h * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SALT;
  ctx.beginPath();
  ctx.ellipse(w * 0.01, -h * 0.14, w * 0.1, h * 0.1, -0.2, 0, TAU);
  ctx.fill();
  for (const [x, y] of [[-w * 0.06, -h * 0.06], [w * 0.06, -h * 0.02]]) circle(ctx, x, y, 1.6);
  eyes(ctx, w * 0.03, -h * 0.02, 0.1, t, seed, { dying, size: 0.6, glow: '#8a2a2a' });
  ctx.restore();
  // a sneeze of salt now and then
  if (live) {
    const k = ((t + seed * 3) % 5) / 0.6;
    if (k < 1) {
      ctx.fillStyle = `rgba(250,248,244,${0.8 * (1 - k)})`;
      for (let i = 0; i < 4; i++) circle(ctx, hx + w * 0.14 + k * 14 + i * 2, hy - h * 0.1 - k * 10 + (i - 2) * 2, 1.4);
    }
  }
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(hx, hy, w * 0.13, h * 0.24, 0, 0, TAU);
  };
}

// Ashfoot booby: a white seabird with grey-brown wings, a long pointed bill and big webbed feet the colour of old
// ash, dangling. It hangs over the surf (fly), folds its wings back to aim (m.warn) and stoops like a dart
// (m.charging).
function drawAshfootBooby(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const flap = dive ? -0.9 : warn ? -0.6 : Math.sin(t * 6 + seed) * 0.5;
  const cy = -h * 0.55;
  ctx.save();
  if (dive || warn) {
    ctx.translate(0, cy);
    ctx.rotate(dive ? 0.9 : 0.35);
    ctx.translate(0, -cy);
  }
  // the ash-grey feet, dangling (tucked in a dive)
  ctx.fillStyle = '#8a8288';
  for (const dx of [-0.08, 0.04]) {
    ctx.beginPath();
    ctx.moveTo(w * dx, cy + h * 0.16);
    ctx.lineTo(w * dx - 5, cy + h * (dive ? 0.26 : 0.42));
    ctx.lineTo(w * dx + 5, cy + h * (dive ? 0.26 : 0.42));
    ctx.closePath();
    ctx.fill();
  }
  // far wing
  const wing = (s) => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.06, cy - h * 0.04);
    ctx.quadraticCurveTo(-w * 0.2, cy - s * h * 0.1 + flap * h * 0.5, -w * 0.46, cy + flap * h * 0.7 - s * 4);
    ctx.quadraticCurveTo(-w * 0.24, cy + h * 0.1, -w * 0.02, cy + h * 0.08);
    ctx.closePath();
  };
  ctx.fillStyle = '#6a5a52';
  wing(-1);
  ctx.fill();
  // the body: white, a dark tail
  const body = () => ctx.ellipse(0, cy, w * 0.3, h * 0.2, 0, 0, TAU);
  ctx.fillStyle = '#4a3e3a';
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, cy);
  ctx.lineTo(-w * 0.44, cy - h * 0.06);
  ctx.lineTo(-w * 0.42, cy + h * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6f2ee';
  ctx.strokeStyle = '#a8a0a0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // near wing
  ctx.fillStyle = '#7a6a60';
  ctx.strokeStyle = '#4a3e3a';
  wing(1);
  ctx.fill();
  ctx.stroke();
  // the head and long pointed bill
  ctx.fillStyle = '#f6f2ee';
  ctx.beginPath();
  ctx.ellipse(w * 0.3, cy - h * 0.12, w * 0.12, h * 0.15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9aa0a8';
  ctx.beginPath();
  ctx.moveTo(w * 0.38, cy - h * 0.16);
  ctx.lineTo(w * 0.6, cy - h * 0.08);
  ctx.lineTo(w * 0.38, cy - h * 0.04);
  ctx.closePath();
  ctx.fill();
  eyes(ctx, w * 0.32, cy - h * 0.16, 0.1, t, seed, { dying, size: 0.55 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(w * 0.3, cy - h * 0.12, w * 0.12, h * 0.15, 0, 0, TAU);
  };
}

// Rock lobster: a big spiny lobster, red-black like cooling rock, two heavy claws held in front and long whipping
// feelers. It turns that plated front and claws to you (the `shell` brain), lowers them (m.warn) and lunges
// (m.charging). Go round behind.
function drawRockLobster(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, ram = !!m.charging && live;
  const step = m.walking || ram ? Math.sin(t * 12) * 2 : 0;
  const cy = -h * 0.45 + (warn ? 3 : 0);
  const RED = '#7a2e2a', RED_D = '#3e1618', RED_L = '#a8504a';
  // legs
  ctx.strokeStyle = RED_D;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.18 + i * w * 0.1, lift = i % 2 ? step : -step;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.1);
    ctx.lineTo(x + 4, cy + h * 0.3 - lift);
    ctx.lineTo(x + 6, -1);
    ctx.stroke();
  }
  // the tail, in plated segments, ending in a fan
  ctx.fillStyle = RED;
  ctx.strokeStyle = RED_D;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(-w * 0.22 - i * w * 0.07, cy + i * 2, w * 0.07, h * (0.2 - i * 0.025), 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-w * 0.44, cy + 6);
  ctx.lineTo(-w * 0.54, cy - 2);
  ctx.lineTo(-w * 0.54, cy + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the carapace, spiny
  const shell = () => ctx.ellipse(w * 0.02, cy, w * 0.2, h * 0.26, 0, 0, TAU);
  ctx.fillStyle = RED;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = RED_L;
  ellipse(ctx, -w * 0.02, cy - h * 0.1, w * 0.1, h * 0.06);
  ctx.fillStyle = '#e8c8a0';
  for (const [x, y] of [[-0.06, -0.2], [0.04, -0.22], [0.12, -0.16]]) circle(ctx, w * x, cy + h * y, 1.3);
  // the claws, held out in front, lowered to lunge
  const cl = warn || ram ? 0.3 : -0.1 + Math.sin(t * 2 + seed) * 0.05;
  for (const [dy, s] of [[-h * 0.06, 1], [h * 0.1, 0.85]]) {
    ctx.save();
    ctx.translate(w * 0.2, cy + dy);
    ctx.rotate(cl);
    ctx.fillStyle = RED;
    ctx.strokeStyle = RED_D;
    ctx.beginPath();
    ctx.roundRect(0, -3, w * 0.14 * s, 6, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(w * 0.2 * s, 0, w * 0.09 * s, h * 0.12 * s, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = RED_D;
    ctx.beginPath(); // the pincer's split
    ctx.moveTo(w * 0.22 * s, 0);
    ctx.lineTo(w * 0.3 * s, 0);
    ctx.stroke();
    ctx.restore();
  }
  // feelers, long and whipping
  ctx.strokeStyle = RED_L;
  ctx.lineWidth = 1.2;
  for (const s of [0, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.18, cy - h * 0.16);
    ctx.quadraticCurveTo(w * 0.4, cy - h * (0.7 + s * 0.2), w * (0.6 + s * 0.06), cy - h * 0.5 + Math.sin(t * 3 + s + seed) * 4);
    ctx.stroke();
  }
  eyes(ctx, w * 0.17, cy - h * 0.12, 3, t, seed, { dying, size: 0.5 });
  if (live) steam(ctx, 0, cy - h * 0.3, 6, t, seed, 2, 0.3);
  return () => {
    ctx.beginPath();
    shell();
    ctx.ellipse(w * 0.36, cy, w * 0.12, h * 0.2, 0, 0, TAU);
  };
}

// Pumice crab (and the crumbs it breaks into): a crab whose shell is a lump of grey pumice, full of holes, with
// stalk eyes and little claws. When it breaks (the `split` brain) it crumbles into small crabs, each carrying a
// crumb of the shell.
function pumiceCrab(ctx, w, h, t, seed, m, dying, small) {
  const live = dying < 0.05;
  const step = m.walking ? Math.sin(t * (small ? 20 : 12) + seed) * 2 : 0;
  const cy = -h * 0.5;
  ctx.strokeStyle = '#4a4450';
  ctx.lineWidth = small ? 1.4 : 2;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = s * w * (0.16 + i * 0.08), lift = (i % 2 ? step : -step);
      ctx.beginPath();
      ctx.moveTo(s * w * 0.1, cy + h * 0.1);
      ctx.lineTo(x + s * 3, cy + h * 0.2 - lift);
      ctx.lineTo(x + s * 5, -1);
      ctx.stroke();
    }
  }
  const shell = () => {
    ctx.moveTo(-w * 0.4, cy + h * 0.16);
    ctx.bezierCurveTo(-w * 0.44, cy - h * 0.42, w * 0.44, cy - h * 0.42, w * 0.4, cy + h * 0.16);
    ctx.closePath();
  };
  ctx.fillStyle = '#9a949c';
  ctx.strokeStyle = '#5e5864';
  ctx.lineWidth = small ? 1.2 : 1.6;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  // the holes
  ctx.fillStyle = '#6a6470';
  const n = small ? 4 : 11;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + seed, r = (i % 4) / 4;
    circle(ctx, Math.cos(a) * w * 0.26 * r, cy - h * 0.06 + Math.sin(a) * h * 0.14 * r, small ? 1.2 : 1.6 + (i % 3) * 0.6);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ellipse(ctx, -w * 0.12, cy - h * 0.16, w * 0.12, h * 0.06, -0.3);
  // claws
  ctx.fillStyle = '#7a7480';
  for (const s of [0.8, 1]) {
    ctx.beginPath();
    ctx.ellipse(w * 0.36 * s + w * 0.08, cy + h * 0.06 * s, w * 0.09, h * 0.08, 0.4, 0, TAU);
    ctx.fill();
  }
  // stalk eyes
  ctx.strokeStyle = '#5e5864';
  ctx.lineWidth = small ? 1.2 : 1.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, cy - h * 0.2);
  ctx.lineTo(w * 0.1, cy - h * 0.42);
  ctx.moveTo(w * 0.26, cy - h * 0.16);
  ctx.lineTo(w * 0.28, cy - h * 0.38);
  ctx.stroke();
  const es = small ? 0.45 : 0.6;
  if (dying > 0.05) eyes(ctx, w * 0.19, cy - h * 0.42, w * 0.09, t, seed, { dying, size: es });
  else {
    ctx.fillStyle = INKC;
    circle(ctx, w * 0.1, cy - h * 0.44, 2.4 * es * 1.4);
    circle(ctx, w * 0.28, cy - h * 0.4, 2.4 * es * 1.4);
    ctx.fillStyle = '#fff';
    circle(ctx, w * 0.11, cy - h * 0.46, 0.9);
    circle(ctx, w * 0.29, cy - h * 0.42, 0.9);
  }
  if (live && !small) { // grit trickling off it
    ctx.fillStyle = 'rgba(160,154,162,0.7)';
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.8 + i / 2 + seed) % 1;
      circle(ctx, -w * 0.2 + i * w * 0.3, cy + h * 0.16 + k * h * 0.3, 1);
    }
  }
  return () => {
    ctx.beginPath();
    shell();
  };
}
const drawPumiceCrab = (ctx, w, h, t, seed, m, dying) => pumiceCrab(ctx, w, h, t, seed, m, dying, false);
const drawPumiceCrumb = (ctx, w, h, t, seed, m, dying) => pumiceCrab(ctx, w, h, t, seed, m, dying, true);

// Steam ray: a pale grey ray that glides low through the steam as if it were water, wingtips rippling, a long tail
// with a black barb, steam streaming off its back. It fades into the steam (m.special: nearly gone, can't be hurt)
// and pulses out of it.
function drawSteamRay(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.5 + Math.sin(t * 1.8 + seed) * 2;
  const rip = Math.sin(t * 4 + seed);
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.18 + 0.08 * Math.sin(t * 20);
  // the tail and its barb
  ctx.strokeStyle = '#6a6672';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy);
  ctx.quadraticCurveTo(-w * 0.45, cy + Math.sin(t * 2.4 + seed) * 6, -w * 0.62, cy - 2);
  ctx.stroke();
  ctx.fillStyle = '#1e1c26';
  ctx.beginPath();
  ctx.moveTo(-w * 0.6, cy - 5);
  ctx.lineTo(-w * 0.7, cy - 2);
  ctx.lineTo(-w * 0.6, cy + 2);
  ctx.closePath();
  ctx.fill();
  // the body: a flat diamond, wingtips rippling
  const body = () => {
    ctx.moveTo(w * 0.36, cy);
    ctx.quadraticCurveTo(w * 0.1, cy - h * 0.2, -w * 0.02, cy - h * 0.46 - rip * 4);
    ctx.quadraticCurveTo(-w * 0.12, cy - h * 0.1, -w * 0.24, cy);
    ctx.quadraticCurveTo(-w * 0.12, cy + h * 0.14, -w * 0.02, cy + h * 0.3 + rip * 3);
    ctx.quadraticCurveTo(w * 0.1, cy + h * 0.16, w * 0.36, cy);
    ctx.closePath();
  };
  ctx.fillStyle = '#b8b4bc';
  ctx.strokeStyle = '#6a6672';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, w * 0.04, cy - h * 0.12, w * 0.12, h * 0.08, -0.3);
  ctx.fillStyle = 'rgba(90,86,98,0.45)'; // spots
  for (const [x, y] of [[-0.06, 0.04], [0.06, 0.1], [0.1, -0.04]]) circle(ctx, w * x, cy + h * y, 2);
  // the little head-lobes in front
  ctx.fillStyle = '#a8a4ae';
  for (const s of [-1, 1]) ellipse(ctx, w * 0.36, cy + s * 4, 4, 2.5, s * 0.4);
  eyes(ctx, w * 0.24, cy - h * 0.06, 4, t, seed, { dying, size: 0.6 });
  if (dying < 0.05) steam(ctx, 0, cy - h * 0.1, 10, t, seed, 3, 0.5);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

export const COAST_MOB_ART = { marine_iguana: drawMarineIguana, ashfoot_booby: drawAshfootBooby, rock_lobster: drawRockLobster, pumice_crab: drawPumiceCrab, pumice_crumb: drawPumiceCrumb, steam_ray: drawSteamRay };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function ironGrip(ctx) {
  ctx.fillStyle = '#4a3a34';
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.fillStyle = IRON;
  ctx.fillRect(-7, -5, 14, 3.5);
  circle(ctx, 0, 12, 2.6);
}
// Glasscutter's Blade: one long flake of black glass in an iron back, its edge catching a cold blue light
function drawGlasscutterBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(170,225,240,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(-1, -5);
  ctx.lineTo(-1.5, -L * 0.9);
  ctx.lineTo(2, -L);
  ctx.quadraticCurveTo(7, -L * 0.6, 5, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = IRON_D; // the iron back
  ctx.fillRect(-3, -L * 0.88, 2.4, L * 0.84);
  ctx.strokeStyle = 'rgba(154,220,232,0.8)'; // the knapped edge
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(2, -L);
  ctx.quadraticCurveTo(7, -L * 0.6, 5, -6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(154,220,232,0.3)'; // conchoidal ripples in the glass
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let k = 0.2; k < 0.9; k += 0.14) {
    ctx.moveTo(0, -L * k);
    ctx.quadraticCurveTo(3, -L * k - 3, 5, -L * k + 1);
  }
  ctx.stroke();
  ironGrip(ctx);
  ctx.restore();
}
// Scaldbarb: a narrow iron blade with a steam ray's serrated black barb for its point, a thread of steam off it
function drawScaldbarb(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(235,240,245,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = '#b8b4c0';
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, -5);
  ctx.lineTo(-2.5, -L * 0.74);
  ctx.lineTo(2.5, -L * 0.74);
  ctx.lineTo(3, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = GLASS; // the barb, serrated
  ctx.beginPath();
  ctx.moveTo(-3.5, -L * 0.72);
  for (let i = 0; i < 4; i++) {
    const y = -L * (0.76 + i * 0.06);
    ctx.lineTo(-4.5 + i * 0.6, y);
    ctx.lineTo(-2 + i * 0.4, y - 3);
  }
  ctx.lineTo(0, -L);
  for (let i = 3; i >= 0; i--) {
    const y = -L * (0.76 + i * 0.06);
    ctx.lineTo(2 - i * 0.4, y - 3);
    ctx.lineTo(4.5 - i * 0.6, y);
  }
  ctx.lineTo(3.5, -L * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(245,242,240,0.35)'; // a thread of steam
  circle(ctx, 3, -L * 0.98, 3);
  circle(ctx, 6, -L * 1.06, 4);
  ironGrip(ctx);
  ctx.restore();
}
// Black Crest Blade (the Hatchkeeper's): a long basalt blade with a saw of crest spines down its back, warm in its seams
function drawCrestBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,160,110,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = ROCK;
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.lineTo(-4, -L * 0.82);
  ctx.quadraticCurveTo(-2, -L, 2, -L);
  ctx.quadraticCurveTo(5, -L * 0.7, 4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#8a8290'; // the crest spines along its back
  for (let k = 0.16; k < 0.84; k += 0.11) {
    ctx.beginPath();
    ctx.moveTo(-4, -L * k + 3);
    ctx.lineTo(-8, -L * k - 3);
    ctx.lineTo(-4, -L * k - 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,140,80,0.7)'; // the warm seam
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0.5, -L * 0.85);
  ctx.stroke();
  ironGrip(ctx);
  ctx.restore();
}
export const COAST_SWORDS = { glasscutter_blade: drawGlasscutterBlade, scaldbarb: drawScaldbarb, crest_blade: drawCrestBlade };
export const COAST_SWORD_LEN = { glasscutter_blade: 58, scaldbarb: 60, crest_blade: 64 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Smoked-Glass Visor: an iron brow band with a visor of smoked black glass, flipped up on the brow
function drawSmokedVisor(ctx, w, h) {
  const by = -h * 0.74, rx = w * 0.52;
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-rx, by - 2, rx * 2, 7, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,28,38,0.82)'; // the visor, up
  ctx.strokeStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.8, by - 1);
  ctx.quadraticCurveTo(0, by - h * 0.3, rx * 0.8, by - 1);
  ctx.quadraticCurveTo(0, by - h * 0.14, -rx * 0.8, by - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(154,220,232,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.4, by - h * 0.14);
  ctx.quadraticCurveTo(-rx * 0.1, by - h * 0.2, rx * 0.2, by - h * 0.18);
  ctx.stroke();
  ctx.fillStyle = IRON_D; // the hinge rivets
  circle(ctx, -rx * 0.8, by + 1.5, 2);
  circle(ctx, rx * 0.8, by + 1.5, 2);
}
// Pillow-Lava Helm: a round dome of pillow lava, lumpy the way the sea left it, rimmed in iron
function drawPillowHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = ROCK;
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.56, rx * 1.04, by - h * 0.56, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ROCK_L; // the pillows' rounded lumps
  for (const [x, y, r] of [[-0.4, 0.14, 0.2], [0, 0.3, 0.24], [0.42, 0.12, 0.18], [-0.14, 0.06, 0.14], [0.22, 0.04, 0.14]]) {
    ctx.beginPath();
    ctx.ellipse(rx * x, by - h * y, rx * r, h * r * 0.4, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.6, by - h * 0.12);
  ctx.quadraticCurveTo(-rx * 0.2, by - h * 0.2, 0, by - h * 0.1);
  ctx.moveTo(rx * 0.1, by - h * 0.22);
  ctx.quadraticCurveTo(rx * 0.4, by - h * 0.26, rx * 0.6, by - h * 0.14);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 1, rx * 2.04, 6, 3);
  ctx.fill();
  ctx.stroke();
}
// Clutchkeeper Helm (the Hatchkeeper's): a low iron cap with a row of basalt spines down the crown, black glass eyes
function drawClutchHelm(ctx, w, h) {
  const by = -h * 0.68, rx = w * 0.52;
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.4, rx, by - h * 0.4, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a8290'; // the spines, front to back
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const sx = -rx * 0.5 + i * rx * 0.25, top = by - h * 0.26 - Math.sin((i / 4) * Math.PI) * 4;
    ctx.beginPath();
    ctx.moveTo(sx - 4, top + 6);
    ctx.lineTo(sx + 1, top - 9);
    ctx.lineTo(sx + 5, top + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = GLASS; // the glass eyes
  for (const s of [-1, 1]) ellipse(ctx, s * rx * 0.55, by - h * 0.08, 4, 3);
  ctx.fillStyle = 'rgba(255,170,110,0.8)';
  for (const s of [-1, 1]) circle(ctx, s * rx * 0.55 + 1, by - h * 0.09, 1.2);
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 1, rx * 2.04, 6, 3);
  ctx.fill();
}
export const COAST_HELMETS = { smoked_visor: drawSmokedVisor, pillow_helm: drawPillowHelm, clutch_helm: drawClutchHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconIguanaSpine(ctx) {
  ctx.fillStyle = '#6a6070';
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, 14);
  ctx.quadraticCurveTo(-4, -2, 4, -15);
  ctx.quadraticCurveTo(4, 0, 6, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SALT;
  for (const [x, y, r] of [[-1, 4, 2], [1, -4, 1.6], [3, 8, 1.4], [-3, 10, 1.2]]) circle(ctx, x, y, r);
}
function iconAshfootFeather(ctx) {
  ctx.strokeStyle = '#8a8288';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 14);
  ctx.lineTo(10, -14);
  ctx.stroke();
  ctx.fillStyle = '#f6f2ee';
  ctx.strokeStyle = '#a8a0a0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, 9);
  ctx.quadraticCurveTo(-10, -4, 10, -14);
  ctx.quadraticCurveTo(8, 2, -8, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a7278'; // the grey tip
  ctx.beginPath();
  ctx.moveTo(10, -14);
  ctx.quadraticCurveTo(4, -12, 2, -8);
  ctx.quadraticCurveTo(7, -7, 10, -14);
  ctx.fill();
}
function iconLobsterClaw(ctx) {
  ctx.fillStyle = '#7a2e2a';
  ctx.strokeStyle = '#3e1618';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-2, 4, 10, 12, -0.5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -6);
  ctx.quadraticCurveTo(12, -16, 14, -6);
  ctx.lineTo(6, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -2);
  ctx.quadraticCurveTo(14, -2, 12, 6);
  ctx.lineTo(4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#a8504a';
  ellipse(ctx, -5, 0, 4, 6, -0.5);
}
function iconPumice(ctx) {
  ctx.fillStyle = '#9a949c';
  ctx.strokeStyle = '#5e5864';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, 4);
  ctx.quadraticCurveTo(-12, -12, 2, -12);
  ctx.quadraticCurveTo(14, -10, 13, 2);
  ctx.quadraticCurveTo(12, 12, -2, 12);
  ctx.quadraticCurveTo(-14, 12, -13, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a6470';
  for (const [x, y, r] of [[-6, -4, 2], [2, -6, 1.6], [7, 0, 2.2], [-2, 4, 1.8], [4, 7, 1.4], [-8, 5, 1.2], [8, -6, 1]]) circle(ctx, x, y, r);
}
function iconRayBarb(ctx) {
  ctx.strokeStyle = '#6a6672';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, 13);
  ctx.quadraticCurveTo(-6, 2, 0, -2);
  ctx.stroke();
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(-1 + i * 3, -2 - i * 3);
    ctx.lineTo(1 + i * 3, -1 - i * 3);
  }
  ctx.lineTo(14, -14);
  for (let i = 3; i >= 0; i--) {
    ctx.lineTo(3 + i * 3, -1 - i * 3 + 2);
    ctx.lineTo(2 + i * 3, 1 - i * 3 + 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(245,242,240,0.5)';
  circle(ctx, 12, -16, 3);
}
// a curl of leathery eggshell, split open
function iconHatchShell(ctx) {
  ctx.fillStyle = '#e8dcc4';
  ctx.strokeStyle = '#8a7a64';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, 8);
  ctx.quadraticCurveTo(-13, -10, -4, -12);
  ctx.lineTo(-1, -5);
  ctx.lineTo(3, -13);
  ctx.lineTo(6, -5);
  ctx.lineTo(10, -11);
  ctx.quadraticCurveTo(14, -4, 13, 8);
  ctx.quadraticCurveTo(0, 14, -13, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,40,36,0.3)';
  ellipse(ctx, 0, 2, 8, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -7, -2, 2, 4, 0.3);
}
export const COAST_ICONS = { hatch_shell: iconHatchShell, iguana_spine: iconIguanaSpine, ashfoot_feather: iconAshfootFeather, lobster_claw: iconLobsterClaw, pumice: iconPumice, ray_barb: iconRayBarb };

// ——— Liv: fjord folk thinned nearly clear by seven years of heat (src/slime.js, folk 'thinned') ———
// The fjord folk's palette, but see-through: you can make out the rock behind her
export const THIN_PALETTE = (hue) => ({
  top: `hsl(${hue} 60% 94% / 0.4)`,
  bottom: `hsl(${hue} 40% 80% / 0.5)`,
  line: `hsl(${hue} 30% 62% / 0.7)`,
  cheek: `hsl(${hue} 60% 86% / 0.55)`,
});
// inside the body (clipped): a faint cool sheen where the rime used to be, a ripple of heat haze, two glints
export function drawThinFolk(ctx, w, h, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.9, w * 0.5, h * 0.14, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const y = -h * (0.25 + i * 0.2);
    ctx.moveTo(-w * 0.5, y);
    for (let x = -w * 0.5; x <= w * 0.5; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.3 + t * 3 + i) * 1.2);
  }
  ctx.stroke();
  for (const [gx, gy, ph] of [[-0.3, 0.55, 0], [0.28, 0.32, 2.5]]) {
    const k = Math.max(0, Math.sin(t * 1.2 + ph));
    if (k < 0.05) continue;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * k})`;
    circle(ctx, w * gx, -h * gy, 1.6 * k + 0.6);
  }
}
// Her dress (accessory 'glasscutter'): a leather apron with a pocket of black-glass flakes, the smoked-glass visor
// pushed up on her head, a knapping hammer in her hand, and the other red mitten tucked into her apron string (the
// first one is up on Liv's Reach, on Frostpeak)
export function drawGlasscutterDress(ctx, w, h, fx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // the apron
  ctx.fillStyle = 'rgba(110,84,66,0.92)';
  ctx.strokeStyle = '#4a3428';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.34);
  ctx.lineTo(w * 0.34, -h * 0.34);
  ctx.quadraticCurveTo(w * 0.42, -h * 0.12, w * 0.36, -h * 0.02);
  ctx.lineTo(-w * 0.32, -h * 0.02);
  ctx.quadraticCurveTo(-w * 0.38, -h * 0.12, -w * 0.3, -h * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#4a3428'; // the apron string
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, -h * 0.3);
  ctx.lineTo(w * 0.46, -h * 0.3);
  ctx.stroke();
  // the pocket of glass flakes
  ctx.fillStyle = '#5a4234';
  ctx.beginPath();
  ctx.roundRect(-w * 0.06, -h * 0.22, w * 0.26, h * 0.14, 2);
  ctx.fill();
  ctx.fillStyle = GLASS;
  for (const [x, a] of [[0, -0.3], [0.06, 0.2], [0.12, -0.1]]) {
    ctx.save();
    ctx.translate(w * x, -h * 0.22);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(0, -7);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // the red mitten, tucked in the string on her back side
  ctx.fillStyle = '#d0485a';
  ctx.strokeStyle = '#8a2a3a';
  ctx.lineWidth = 1.2;
  ctx.save();
  ctx.translate(-w * 0.4, -h * 0.28);
  ctx.rotate(0.3 + Math.sin(t * 1.4) * 0.05);
  ctx.beginPath();
  ctx.roundRect(-4, 0, 9, 13, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-4, 6, 2.5, 3.5, -0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f2e8e0';
  ctx.fillRect(-4, 0, 9, 3);
  ctx.restore();
  // the smoked-glass visor, pushed up on her head
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.44, -h * 0.82, w * 0.88, 4, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,28,38,0.85)';
  ctx.beginPath();
  ctx.ellipse(fx * 0.4, -h * 0.88, w * 0.26, h * 0.07, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(154,220,232,0.6)';
  ctx.beginPath();
  ctx.moveTo(fx * 0.4 - w * 0.14, -h * 0.9);
  ctx.lineTo(fx * 0.4 + w * 0.02, -h * 0.92);
  ctx.stroke();
  // the knapping hammer, an iron head on an antler handle, in her front hand
  ctx.save();
  ctx.translate(w * 0.5, -h * 0.2);
  ctx.rotate(-0.5 + Math.sin(t * 2.2) * 0.12);
  ctx.strokeStyle = '#d8ccb8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -16);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.fillRect(-5, -20, 10, 5);
  ctx.restore();
  // heat shimmer rising off her
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.3 + i / 2) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.25 * Math.sin(k * Math.PI)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const y = -h * 1.0 - k * 22;
    ctx.moveTo(-w * 0.2 + i * 10, y);
    ctx.quadraticCurveTo(-w * 0.1 + i * 10, y - 4, i * 10, y);
    ctx.stroke();
  }
  ctx.restore();
}
