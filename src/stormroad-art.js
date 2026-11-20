// Docs: docs/places/stormroad.md, docs/combat/stages.md, docs/combat/items.md
// The Storm Road's art that isn't the room itself (src/stormroad.js; atlas Phase 9, A4): its creatures (sand jackal, storm
// rider, sand golem, red wisp and the Sirocco, its field boss; STORM_MOB_ART, called by drawMob in src/field.js), the gear of
// the place (the sand golem's rare Sandstone Mask, the Sirocco's Dust-Devil Scimitar and Sirocco Wrap, the Red Wall's Long
// Wind and Storm Veil: STORM_SWORDS, STORM_HELMETS; the staves and bows are src/staff-art.js's and src/bow-art.js's) and its
// materials' icons (STORM_ICONS). Red sand, rust, dust and old caravan cloth; soft and rounded.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const INKC = '#3a221a';
export const RED = '#c8583a', RED_D = '#7a2e1e', RED_L = '#e88a5a';
export const DUST = '#d89a6a', DUST_D = '#9a5a3a';
export const STONE = '#b8684a', STONE_D = '#6a3424', STONE_L = '#d88e66';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC } = {}) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.6) < 0.12;
  for (const ex of gap ? [fx - gap, fx + gap] : [fx]) {
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
      ctx.fillStyle = col;
    }
  }
}
// grit blowing off something, streaming back (-x) from (x, y)
function grit(ctx, x, y, n, t, seed, len = 30, a = 0.6) {
  ctx.fillStyle = `rgba(216,154,106,${a})`;
  for (let i = 0; i < n; i++) {
    const k = (t * 1.6 + hash(seed + i) ) % 1;
    circle(ctx, x - k * len, y + (hash(seed + i * 3) - 0.5) * 14 - k * 4, 1.4 * (1 - k) + 0.4);
  }
}

// ——— the sand jackal: lean and red-gold, long legs, big ears laid flat when it runs, a brush of a tail ———
function drawSandJackal(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, run = live ? Math.sin(t * 14 + seed) : 0, wk = m?.warn ? warnK(m.warn) : 0;
  const cy = -h * 0.52, bob = Math.abs(run) * 2;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(-w * 0.04, cy - bob, w * 0.34, h * 0.22, 0, 0, TAU);
    ctx.moveTo(w * 0.42, cy - h * 0.2 - bob);
    ctx.ellipse(w * 0.3, cy - h * 0.2 - bob, w * 0.14, h * 0.16, 0, 0, TAU);
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = DUST_D; // legs, the far pair darker
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (const [x, ph] of [[-w * 0.24, 1], [w * 0.16, -1]]) {
    ctx.moveTo(x, cy + h * 0.1);
    ctx.lineTo(x + run * ph * 8, -2);
  }
  ctx.stroke();
  ctx.fillStyle = '#d88a52'; // the tail, a brush, up when it's after you
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, cy - bob);
  ctx.quadraticCurveTo(-w * 0.56, cy - h * (0.1 + wk * 0.3) + run * 3, -w * 0.6, cy + h * 0.1);
  ctx.quadraticCurveTo(-w * 0.46, cy + h * 0.06, -w * 0.32, cy + h * 0.08 - bob);
  ctx.fill();
  const g = ctx.createLinearGradient(0, cy - h * 0.3, 0, cy + h * 0.2);
  g.addColorStop(0, '#e8a46a');
  g.addColorStop(1, '#b8683a');
  ctx.fillStyle = g;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 1.8;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,236,200,0.6)'; // its pale belly
  ellipse(ctx, -w * 0.04, cy + h * 0.1 - bob, w * 0.22, h * 0.07);
  ctx.strokeStyle = '#c87a46'; // near legs
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  for (const [x, ph] of [[-w * 0.18, -1], [w * 0.22, 1]]) {
    ctx.moveTo(x, cy + h * 0.12 - bob);
    ctx.lineTo(x + run * ph * 9, -2);
  }
  ctx.stroke();
  const hx = w * 0.3, hy = cy - h * 0.2 - bob;
  ctx.fillStyle = '#e8a46a'; // ears, laid flat when it runs, up on a warning
  for (const [dx, k] of [[-6, 0.8], [3, 1]]) {
    ctx.beginPath();
    ctx.moveTo(hx + dx - 4, hy - h * 0.1);
    ctx.lineTo(hx + dx - (live && !wk ? 10 : 2), hy - h * (0.2 + 0.22 * k * (wk || !live ? 1 : 0.4)));
    ctx.lineTo(hx + dx + 4, hy - h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#d8945e'; // the long snout
  ctx.beginPath();
  ctx.ellipse(hx + w * 0.14, hy + 4, w * 0.1, h * 0.07, 0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = INKC;
  circle(ctx, hx + w * 0.23, hy + 3, 2);
  eyes(ctx, hx + 3, hy - 2, 0, t, seed, { dying, size: 0.8 });
  if (live && m?.charging) grit(ctx, -w * 0.4, -6, 6, t, seed, 40);
  ctx.restore();
  return body;
}

// ——— the storm rider: a hooded shape of red dust riding the gusts on ragged cloth wings ———
function drawStormRider(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, dive = !!m?.charging && live;
  const flap = live ? (dive ? -0.7 : Math.sin(t * 3 + seed) * 0.3 - wk * 0.5) : 0.4;
  const cy = -h * 0.55;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, cy + h * 0.32);
    ctx.quadraticCurveTo(-w * 0.2, cy - h * 0.1, 0, cy - h * 0.34);
    ctx.quadraticCurveTo(w * 0.22, cy - h * 0.1, w * 0.12, cy + h * 0.32);
    ctx.closePath();
  };
  ctx.save();
  for (const s of [-1, 1]) { // the wings: rags of old caravan cloth, red and ochre, tattered at the edge
    ctx.save();
    ctx.translate(0, cy - h * 0.06);
    ctx.rotate(flap * s * 0.7);
    ctx.fillStyle = s < 0 ? '#8a3a26' : '#b8583a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.36 * (dive ? 0.3 : 1), -w * 0.66, -h * 0.06 * s);
    for (let i = 0; i < 4; i++) ctx.lineTo(-w * (0.6 - i * 0.14), h * (0.04 + (i % 2) * 0.1));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,170,90,0.6)'; // an ochre stripe across the cloth
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, -h * 0.02);
    ctx.lineTo(-w * 0.5, -h * 0.02 * s);
    ctx.stroke();
    ctx.restore();
  }
  const g = ctx.createLinearGradient(0, cy - h * 0.34, 0, cy + h * 0.32);
  g.addColorStop(0, '#d8704a');
  g.addColorStop(1, 'rgba(200,110,70,0.35)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.fillStyle = '#5a2418'; // the dark under its hood
  ellipse(ctx, w * 0.04, cy - h * 0.12, w * 0.1, h * 0.12);
  ctx.fillStyle = live ? `rgba(255,${200 - wk * 80},120,0.95)` : '#8a6a5a'; // two ember points for eyes
  circle(ctx, w * 0.0, cy - h * 0.12, 1.8);
  circle(ctx, w * 0.08, cy - h * 0.12, 1.8);
  if (live) grit(ctx, -w * 0.1, cy + h * 0.2, 7, t, seed, 46, 0.45);
  ctx.restore();
  return body;
}

// ——— the sand golem: an old marker cairn of red stone and packed sand got up on two stumps of legs, eyes worn through ———
function drawSandGolem(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, walk = live ? Math.sin(t * 3 + seed) : 0;
  const rise = wk * h * 0.08;
  const STONES = [[0, 0.16, 0.42, 0.18], [0.02, 0.4, 0.36, 0.16], [-0.02, 0.62, 0.3, 0.14], [0.02, 0.82, 0.2, 0.12]];
  const body = () => {
    ctx.beginPath();
    for (const [dx, y, rw, rh] of STONES) {
      const cx = w * dx, cy = -h * y - rise;
      ctx.moveTo(cx + w * rw, cy);
      ctx.ellipse(cx, cy, w * rw, h * rh, 0, 0, TAU);
    }
  };
  ctx.save();
  ctx.fillStyle = STONE_D; // the legs, two stumps of packed sand
  for (const [x, ph] of [[-w * 0.18, 1], [w * 0.16, -1]]) {
    ctx.beginPath();
    ctx.roundRect(x - 9, -h * 0.12 - rise + walk * ph * 2, 18, h * 0.12 + rise, 6);
    ctx.fill();
  }
  STONES.forEach(([dx, y, rw, rh], i) => { // the cairn's stones, each a little off the last
    const cx = w * dx + (i % 2 ? 1 : -1) * walk * 1.5, cy = -h * y - rise;
    const g = ctx.createRadialGradient(cx - w * rw * 0.4, cy - h * rh * 0.5, 2, cx, cy, w * rw);
    g.addColorStop(0, STONE_L);
    g.addColorStop(1, STONE);
    ctx.fillStyle = g;
    ctx.strokeStyle = STONE_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * rw, h * rh, (i % 2 ? 0.05 : -0.05), 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(122,52,36,0.45)'; // its wind-cut grain
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - w * rw * 0.7, cy + 2);
    ctx.quadraticCurveTo(cx, cy - 3, cx + w * rw * 0.7, cy + 1);
    ctx.stroke();
  });
  ctx.fillStyle = 'rgba(232,180,130,0.8)'; // sand packed between the stones
  for (let i = 1; i < STONES.length; i++) ellipse(ctx, w * STONES[i][0], -h * (STONES[i][1] - STONES[i][3] * 0.9) - rise, w * STONES[i][2] * 0.8, 3);
  ctx.strokeStyle = STONE_D; // the arms, two long stones
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const ay = -h * 0.4 - rise;
  ctx.moveTo(w * 0.3, ay);
  ctx.lineTo(w * 0.42, ay + h * 0.22 - wk * h * 0.5);
  ctx.moveTo(-w * 0.3, ay);
  ctx.lineTo(-w * 0.4, ay + h * 0.22 - wk * h * 0.5);
  ctx.stroke();
  const fy = -h * 0.62 - rise; // the face on the third stone: two holes the wind wore through, light behind them
  ctx.fillStyle = live ? `rgba(255,${190 - wk * 90},110,0.9)` : '#4a2418';
  ellipse(ctx, w * 0.04, fy, 3.2, 4);
  ellipse(ctx, w * 0.16, fy, 3.2, 4);
  if (live && wk > 0.3) grit(ctx, w * 0.1, -h * 0.9 - rise, 6, t, seed, 30);
  ctx.restore();
  return body;
}

// ——— the red wisp: a knot of red dust round a spark of the storm's own lightning, crackling brighter as it aims ———
function drawRedWisp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0;
  const cy = -h * 0.6 + (live ? Math.sin(t * 2 + seed) * 4 : 0), r = w * 0.36;
  const body = () => {
    ctx.beginPath();
    ctx.arc(0, cy, r, 0, TAU);
  };
  ctx.save();
  const g = ctx.createRadialGradient(0, cy, 2, 0, cy, r * 1.6);
  g.addColorStop(0, `rgba(255,${160 + wk * 60},120,${0.5 + wk * 0.4})`);
  g.addColorStop(1, 'rgba(200,90,58,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  for (let i = 0; i < 3; i++) { // the knot of dust turning round it
    ctx.strokeStyle = `rgba(${i % 2 ? '216,140,96' : '184,90,60'},0.75)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, cy, r * (1 - i * 0.16), r * (0.42 + i * 0.12), t * (1.6 + i * 0.4) + i, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = live ? '#fff0e0' : '#8a6a5a'; // the spark
  circle(ctx, 0, cy, r * (0.28 + wk * 0.12));
  if (live) {
    ctx.strokeStyle = `rgba(255,236,220,${0.5 + wk * 0.5})`; // crackles off it
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 3 + Math.round(wk * 3); i++) {
      const a = hash(seed + Math.floor(t * 8) + i) * TAU, l = r * (0.8 + hash(i + seed) * 0.6);
      ctx.moveTo(Math.cos(a) * r * 0.3, cy + Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a + 0.3) * l * 0.6, cy + Math.sin(a + 0.3) * l * 0.6);
      ctx.lineTo(Math.cos(a) * l, cy + Math.sin(a) * l);
    }
    ctx.stroke();
  }
  eyes(ctx, r * 0.1, cy - 1, r * 0.22, t, seed, { dying, size: 0.6, col: '#5a1e12' });
  ctx.restore();
  return body;
}

// ——— the Sirocco: a great dust devil as tall as a tower, red sand going round an eye of still hot air, a few lost things
// caught up in it going round (a pack, a lantern, a scrap of tent); on a warning it spins faster and draws in ———
function drawSirocco(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, spin = t * (2.4 + wk * 3) + seed;
  const sway = live ? Math.sin(t * 0.9 + seed) * w * 0.06 : 0;
  const cx = (y) => sway * (y / h); // the funnel leans with its sway, more at the top
  const half = (y) => w * (0.12 + 0.4 * (y / h) ** 1.3) * (1 - wk * 0.12); // its width at height y (y from the ground up)
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-half(4), -4);
    for (let y = 0; y <= h; y += h / 8) ctx.lineTo(cx(y) - half(y), -y);
    for (let y = h; y >= 0; y -= h / 8) ctx.lineTo(cx(y) + half(y), -y);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(120,60,40,0.22)';
  ellipse(ctx, 0, 0, w * 0.4, 8);
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, 'rgba(232,150,100,0.5)');
  g.addColorStop(0.5, 'rgba(200,96,62,0.85)');
  g.addColorStop(1, 'rgba(150,64,40,0.95)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  for (let i = 0; i < 12; i++) { // bands of sand going round
    const y = (i + 0.5) * (h / 12), ph = spin * (1 + i * 0.05);
    ctx.strokeStyle = `rgba(${i % 2 ? '240,170,120' : '150,60,40'},0.55)`;
    ctx.lineWidth = 3 + (i % 3);
    ctx.beginPath();
    ctx.ellipse(cx(y), -y, half(y), 5 + y * 0.03, 0, (ph % TAU), (ph % TAU) + Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.restore();
  const ey = -h * 0.56; // the eye: a pocket of still hot air in the middle, two dark hollows in it
  const eg = ctx.createRadialGradient(cx(h * 0.56), ey, 2, cx(h * 0.56), ey, w * 0.2);
  eg.addColorStop(0, `rgba(255,230,180,${0.75 + wk * 0.2})`);
  eg.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = eg;
  circle(ctx, cx(h * 0.56), ey, w * 0.2);
  ctx.fillStyle = live ? (wk > 0.5 ? '#5a0e08' : '#4a1e12') : '#8a6a5a';
  ellipse(ctx, cx(h * 0.56) - 9, ey - 2, 4.4, 6 - wk * 2);
  ellipse(ctx, cx(h * 0.56) + 9, ey - 2, 4.4, 6 - wk * 2);
  // lost things going round it: a pack, a lantern, a scrap of tent stripe (in front on one half of the turn)
  const THINGS = [[0.3, 0, '#7a4a2a'], [0.62, 2.1, '#e8a040'], [0.82, 4.2, '#c8583a']];
  for (const [yk, off, col] of THINGS) {
    const a = spin * 0.8 + off, y = h * yk, x = cx(y) + Math.cos(a) * half(y) * 1.05, front = Math.sin(a) > 0;
    ctx.globalAlpha = front ? 1 : 0.45;
    ctx.fillStyle = col;
    ctx.save();
    ctx.translate(x, -y + Math.sin(a) * 6);
    ctx.rotate(a);
    if (col === '#e8a040') ctx.fillRect(-4, -5, 8, 10);
    else ctx.fillRect(-8, -4, 16, 8);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (live) { // the skirt of dust whipping round its foot
    ctx.fillStyle = 'rgba(216,140,96,0.5)';
    for (let i = 0; i < 8; i++) {
      const a = spin * 1.6 + i * 0.8;
      ellipse(ctx, Math.cos(a) * w * 0.42, -6 - Math.abs(Math.sin(a)) * 10, 14, 6);
    }
  }
  ctx.restore();
  return body;
}

export const STORM_MOB_ART = { sand_jackal: drawSandJackal, storm_rider: drawStormRider, sand_golem: drawSandGolem, red_wisp: drawRedWisp, sirocco: drawSirocco };

// ——— swords (the blade up along -y from the grip at 0) ———
// The Dust-Devil Scimitar: a curved blade of red storm-glass, the sand's grain going round inside it
function drawDevilScimitar(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,170,120,0.8)';
    ctx.shadowBlur = 10;
  }
  const g = ctx.createLinearGradient(-6, 0, 10, 0);
  g.addColorStop(0, '#e88a5a');
  g.addColorStop(1, '#a83a22');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6a2416';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.2);
  ctx.quadraticCurveTo(-6, -L * 0.7, 6, -L * 1.0);
  ctx.quadraticCurveTo(10, -L * 0.62, 4, -L * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,220,190,0.6)'; // the grain going round inside the glass
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const y = -L * (0.3 + i * 0.13);
    ctx.moveTo(-2, y);
    ctx.quadraticCurveTo(2, y - 5, 5 - i * 0.4, y - 2);
  }
  ctx.stroke();
  ctx.fillStyle = '#d8a84a'; // a brass guard and a wrap of drover's leather
  ctx.fillRect(-7, -L * 0.22, 15, 3.5);
  ctx.fillStyle = '#5a3420';
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.2, 5.2, L * 0.19, 2);
  ctx.fill();
  ctx.restore();
}
// The Long Wind: a long straight blade of red storm-glass, sand still blowing inside it
function drawLongWind(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,150,100,0.9)';
    ctx.shadowBlur = 14;
  }
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, '#f0a070');
  g.addColorStop(0.5, '#d8603a');
  g.addColorStop(1, '#8a2e1c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5a1e12';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4.4, -L * 0.22);
  ctx.lineTo(-3.6, -L * 0.92);
  ctx.lineTo(0, -L * 1.04);
  ctx.lineTo(3.6, -L * 0.92);
  ctx.lineTo(4.4, -L * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,230,200,0.7)'; // grains blowing up the blade
  const now = performance.now() / 1000;
  for (let i = 0; i < 7; i++) {
    const k = (now * 0.7 + i / 7) % 1;
    circle(ctx, Math.sin(i * 2.3 + now * 3) * 2, -L * (0.26 + k * 0.7), 0.9);
  }
  ctx.fillStyle = '#d8a84a'; // the guard, a ring of caravan brass with a blue bead
  ctx.fillRect(-8, -L * 0.24, 16, 4);
  ctx.fillStyle = '#3e5a9a';
  circle(ctx, 0, -L * 0.22, 2.4);
  ctx.fillStyle = '#7a2e1c'; // red cloth wound on the grip, an end blowing
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.21, 5.2, L * 0.2, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -L * 0.1);
  ctx.quadraticCurveTo(10, -L * 0.08 + Math.sin(now * 6) * 2, 14, -L * 0.02);
  ctx.lineTo(3, -L * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
export const STORM_SWORDS = { devil_scimitar: drawDevilScimitar, long_wind: drawLongWind };
export const STORM_SWORD_LEN = { devil_scimitar: 66, long_wind: 70 };

// ——— helmets (on a slime w × h, its top near -h * 0.66) ———
// The Sandstone Mask: a slab of red sandstone, two eyeholes the wind wore through, tied on with a drover's cord
function drawSandstoneMask(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.46;
  ctx.strokeStyle = '#5a3420'; // the cord round the back
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by - h * 0.12);
  ctx.quadraticCurveTo(-w * 0.62, by - h * 0.1, -w * 0.56, by + 4);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, by - h * 0.5, 0, by + 6);
  g.addColorStop(0, STONE_L);
  g.addColorStop(1, STONE);
  ctx.fillStyle = g;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.9, by + 6);
  ctx.quadraticCurveTo(-rx * 1.1, by - h * 0.46, 0, by - h * 0.52);
  ctx.quadraticCurveTo(rx * 1.1, by - h * 0.46, rx * 0.9, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,52,36,0.4)'; // its grain
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-rx * 0.8, by - h * (0.1 + i * 0.12));
    ctx.quadraticCurveTo(0, by - h * (0.14 + i * 0.12), rx * 0.8, by - h * (0.08 + i * 0.12));
  }
  ctx.stroke();
}
// The Sirocco Wrap: a drover's wrap gone red with the Sirocco's dust, a tail of it blowing out behind
function drawSiroccoWrap(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.56;
  const now = performance.now() / 1000;
  ctx.fillStyle = '#b8583a';
  ctx.beginPath(); // the tail, blowing back
  ctx.moveTo(-rx * 0.6, by - h * 0.18);
  ctx.quadraticCurveTo(-rx * 1.4, by - h * 0.3 + Math.sin(now * 5) * 4, -rx * 1.7, by - h * 0.08 + Math.sin(now * 4) * 5);
  ctx.quadraticCurveTo(-rx * 1.2, by - h * 0.06, -rx * 0.7, by - h * 0.02);
  ctx.fill();
  ctx.fillStyle = '#c8603e';
  ctx.strokeStyle = '#7a2e1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.58, rx * 1.04, by - h * 0.58, rx, by + 6);
  ctx.quadraticCurveTo(0, by - 6, -rx, by + 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,170,110,0.75)'; // its wound folds
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-rx * 0.94, by - h * (0.06 + i * 0.13));
    ctx.quadraticCurveTo(0, by - h * (0.18 + i * 0.13), rx * 0.94, by - h * (0.04 + i * 0.13));
  }
  ctx.stroke();
}
// The Storm Veil: a veil of red silk off a lost caravan, beaded at the brow, stirring on a wind of its own
function drawStormVeil(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.58;
  const now = performance.now() / 1000, st = Math.sin(now * 2.6) * 3;
  ctx.fillStyle = 'rgba(200,64,48,0.85)';
  ctx.strokeStyle = '#7a1e14';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.bezierCurveTo(-rx * 1.06, by - h * 0.6, rx * 1.06, by - h * 0.6, rx, by + 8);
  ctx.quadraticCurveTo(rx * 0.7, by + 20 + st, rx * 0.2, by + 12);
  ctx.quadraticCurveTo(-rx * 0.4, by + 22 - st, -rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,170,130,0.35)'; // the silk's sheen
  ellipse(ctx, -rx * 0.3, by - h * 0.3, rx * 0.3, h * 0.08);
  ctx.fillStyle = '#d8a84a'; // a band of brass beads across the brow, a blue one in the middle
  for (let i = -4; i <= 4; i++) circle(ctx, i * rx * 0.2, by - h * 0.08 - Math.abs(i) * 0.6, 2);
  ctx.fillStyle = '#3e5a9a';
  circle(ctx, 0, by - h * 0.08, 3);
}
export const STORM_HELMETS = { sandstone_mask: drawSandstoneMask, sirocco_wrap: drawSiroccoWrap, storm_veil: drawStormVeil };

// ——— icons (centred, about 24 px across) ———
function iconJackalFang(ctx) {
  ctx.save();
  ctx.rotate(0.5);
  ctx.fillStyle = '#f4e4b8';
  ctx.strokeStyle = '#a8905a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4, -9);
  ctx.quadraticCurveTo(5, -8, 4, -2);
  ctx.quadraticCurveTo(2, 6, -1, 11);
  ctx.quadraticCurveTo(-4, 2, -4, -9);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function iconRiderRag(ctx) {
  ctx.save();
  ctx.fillStyle = '#b8583a';
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(9, -10);
  ctx.lineTo(10, 2);
  for (let i = 0; i < 4; i++) ctx.lineTo(7 - i * 5, 6 + (i % 2) * 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8aa5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.lineTo(9, -4);
  ctx.stroke();
  ctx.restore();
}
function iconRedSandstone(ctx) {
  ctx.save();
  ctx.fillStyle = STONE;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-10, 5);
  ctx.lineTo(-7, -6);
  ctx.lineTo(5, -8);
  ctx.lineTo(10, 0);
  ctx.lineTo(6, 8);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,160,120,0.7)';
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(0, -3, 8, 1);
  ctx.moveTo(-6, 4);
  ctx.quadraticCurveTo(0, 2, 6, 5);
  ctx.stroke();
  ctx.restore();
}
function iconStormGlass(ctx) {
  ctx.save();
  const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10);
  g.addColorStop(0, '#ffd0b0');
  g.addColorStop(1, '#a83a22');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#fff4e8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(0, 1);
  ctx.lineTo(-1, 3);
  ctx.lineTo(4, 5);
  ctx.stroke();
  ctx.restore();
}
function iconDevilGrit(ctx) {
  ctx.save();
  ctx.strokeStyle = '#c8583a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -2, 9, 4, 0, 0.3, TAU - 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(1, 4, 6, 3, 0, 0.6, TAU - 0.4);
  ctx.stroke();
  ctx.fillStyle = '#e8a070';
  for (let i = 0; i < 9; i++) circle(ctx, Math.cos(i * 0.7) * (3 + i), Math.sin(i * 0.7) * 3 + 1, 1.1);
  ctx.restore();
}
function iconCaughtBead(ctx) {
  ctx.save();
  ctx.fillStyle = '#8aa4c8';
  ctx.strokeStyle = '#4a5a7a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8eef8';
  circle(ctx, -3, -3, 2.2);
  ctx.fillStyle = '#4a5a7a'; // its hole, and the little scratch like a name
  circle(ctx, 0, 0, 2);
  ctx.strokeStyle = 'rgba(232,238,248,0.8)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(2, 4);
  ctx.lineTo(4, 3);
  ctx.lineTo(5, 5);
  ctx.stroke();
  ctx.restore();
}
export const STORM_ICONS = { jackal_fang: iconJackalFang, rider_rag: iconRiderRag, red_sandstone: iconRedSandstone, storm_glass: iconStormGlass, devil_grit: iconDevilGrit, caught_bead: iconCaughtBead };
