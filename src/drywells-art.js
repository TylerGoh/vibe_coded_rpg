// Docs: docs/places/drywells.md, docs/places/carapace.md, docs/combat/stages.md, docs/combat/items.md
// The Dry Wells' art that isn't the room itself (src/drywells.js; atlas Phase 9, A5 (b)): its creatures (dry strider, bucket
// mimic, tally wraith, dust drinker and the Seventh Digger; DRYW_MOB_ART, called by drawMob in src/field.js), the gear (the
// bucket mimic's rare Bucket Helm; Old Carapace's set from A5 (c): The Long Road and the Carapace Crown, DRYW_SWORDS,
// DRYW_HELMETS; the staves and the bow are src/staff-art.js's and src/bow-art.js's) and the materials' icons (DRYW_ICONS).
// Dry stone, old iron, dust, the tally marks; soft and rounded.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const INKC = '#2a1e16';
export const DUST = '#c8a882', DUST_D = '#7a644a', DUST_L = '#e6d2b0';
export const IRON = '#5a5450', IRON_D = '#2e2a28';
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
// tally marks: n groups of seven with a stroke through, from (x, y), each mark h tall
export function tally(ctx, x, y, n, h = 10, gap = 4) {
  ctx.beginPath();
  for (let g = 0; g < n; g++) {
    const gx = x + g * (gap * 8 + 6);
    for (let i = 0; i < 7; i++) {
      ctx.moveTo(gx + i * gap, y);
      ctx.lineTo(gx + i * gap + 0.6, y - h);
    }
    ctx.moveTo(gx - 2, y - h * 0.3);
    ctx.lineTo(gx + gap * 6 + 2, y - h * 0.7);
  }
  ctx.stroke();
}

// ——— the dry strider: a water strider from when there was water, a small dusty body slung between six long legs ———
function drawDryStrider(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, run = live ? Math.sin(t * 16 + seed) : 0, wk = m?.warn ? warnK(m.warn) : 0;
  const cy = -h * 0.6 - wk * 4;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.26, h * 0.16, 0, 0, TAU);
  };
  ctx.save();
  ctx.strokeStyle = DUST_D;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.4;
  for (const [s, k] of [[-1, 1], [-1, -1], [1, 1], [1, -1], [0.3, 1], [-0.3, -1]]) { // six long legs, the far ones behind
    const kx = s * w * 0.34, fx = s * w * 0.56 + run * k * 6;
    ctx.beginPath();
    ctx.moveTo(s * w * 0.1, cy);
    ctx.quadraticCurveTo(kx, cy - h * 0.34, fx, -1);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, cy - h * 0.2, 0, cy + h * 0.2);
  g.addColorStop(0, DUST_L);
  g.addColorStop(1, DUST_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 1.6;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; // the little pads of hair at its feet, for walking on water
  for (const s of [-1, 1]) ellipse(ctx, s * w * 0.56, -1, 4, 1.6);
  eyes(ctx, w * 0.18, cy - 2, 3.4, t, seed, { dying, size: 0.7 });
  ctx.restore();
  return body;
}

// ——— the bucket mimic: an old iron-bound well bucket gone hungry, its rope's end trailing, a mouth where the water went ———
function drawBucketMimic(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, hop = live ? Math.abs(Math.sin(t * 5 + seed)) * 3 : 0;
  const top = -h * 0.92 - wk * h * 0.12 - hop, bot = -hop;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, top);
    ctx.lineTo(w * 0.42, top);
    ctx.lineTo(w * 0.34, bot);
    ctx.lineTo(-w * 0.34, bot);
    ctx.closePath();
  };
  ctx.save();
  const g = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
  g.addColorStop(0, '#8a6a4a');
  g.addColorStop(0.5, '#b8946c');
  g.addColorStop(1, '#6a4e36');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a3220';
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.strokeStyle = 'rgba(74,50,32,0.5)'; // its staves
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(i * w * 0.12, top);
    ctx.lineTo(i * w * 0.1, bot);
  }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = IRON; // two iron bands, rivets bright
  for (const y of [top + h * 0.16, bot - h * 0.18]) {
    ctx.fillRect(-w * 0.43, y - 3, w * 0.86, 6);
    ctx.fillStyle = '#c8c0b0';
    for (const x of [-0.3, 0, 0.3]) circle(ctx, x * w, y, 1.4);
    ctx.fillStyle = IRON;
  }
  ctx.fillStyle = '#1a120c'; // the mouth where the water went
  ellipse(ctx, 0, top + 2, w * 0.4, 6 + wk * 4);
  if (live && wk > 0.3) { // teeth of old splinters round its rim
    ctx.fillStyle = '#d8c09a';
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w * 0.1 - 3, top + 1);
      ctx.lineTo(i * w * 0.1, top + 8);
      ctx.lineTo(i * w * 0.1 + 3, top + 1);
      ctx.fill();
    }
  }
  ctx.strokeStyle = IRON_D; // the handle up and over, and the rope's end trailing
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, top, w * 0.42, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, top - w * 0.42);
  ctx.quadraticCurveTo(-w * 0.4, top - w * 0.6 + Math.sin(t * 3) * 4, -w * 0.7, top - w * 0.2);
  ctx.stroke();
  eyes(ctx, w * 0.06, top + h * 0.4, 7, t, seed, { dying, size: 0.9, col: '#1a120c' });
  ctx.restore();
  return body;
}

// ——— the tally wraith: the dust of one of the seven diggers, a hooded shape with a pick, still scratching marks in the air;
// it fades and comes back (the phase brain's own fade is the mob's alpha) ———
function drawTallyWraith(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0;
  const cy = -h * 0.5 + (live ? Math.sin(t * 1.6 + seed) * 4 : 0);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, cy + h * 0.4);
    ctx.quadraticCurveTo(-w * 0.42, cy - h * 0.2, 0, cy - h * 0.44);
    ctx.quadraticCurveTo(w * 0.42, cy - h * 0.2, w * 0.32, cy + h * 0.4);
    for (let i = 0; i < 5; i++) ctx.lineTo(w * (0.24 - i * 0.12), cy + h * (0.48 - (i % 2) * 0.12));
    ctx.closePath();
  };
  ctx.save();
  const g = ctx.createLinearGradient(0, cy - h * 0.44, 0, cy + h * 0.48);
  g.addColorStop(0, 'rgba(214,194,160,0.95)');
  g.addColorStop(1, 'rgba(200,168,130,0.25)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.fillStyle = '#3a2a1e'; // under the hood
  ellipse(ctx, w * 0.04, cy - h * 0.16, w * 0.2, h * 0.14);
  ctx.fillStyle = live ? `rgba(255,${230 - wk * 80},190,0.9)` : '#7a6a5a';
  circle(ctx, -w * 0.02, cy - h * 0.16, 1.8);
  circle(ctx, w * 0.1, cy - h * 0.16, 1.8);
  ctx.strokeStyle = '#5a4a3a'; // the pick over its shoulder, raised on a warning
  ctx.lineWidth = 3;
  ctx.save();
  ctx.translate(w * 0.2, cy);
  ctx.rotate(-0.9 - wk * 1.2 + (live ? Math.sin(t * 2 + seed) * 0.1 : 0));
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -h * 0.5);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.moveTo(-12, -h * 0.5);
  ctx.quadraticCurveTo(0, -h * 0.58, 12, -h * 0.5);
  ctx.lineTo(0, -h * 0.47);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (live) { // tally marks it scratches, hanging in the air a moment
    ctx.strokeStyle = `rgba(232,214,180,${0.3 + 0.3 * Math.sin(t * 3 + seed)})`;
    ctx.lineWidth = 1.2;
    tally(ctx, -w * 0.7, cy - h * 0.2, 1, 9, 2.6);
  }
  ctx.restore();
  return body;
}

// ——— the dust drinker: an old goatskin water-bag gone alive and bone dry, cracked, its neck a mouth that spits grit ———
function drawDustDrinker(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, sw = live ? Math.sin(t * 2.2 + seed) : 0;
  const cy = -h * 0.42;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.4 * (1 + wk * 0.08), h * 0.4 * (1 - wk * 0.05), sw * 0.05, 0, TAU);
  };
  ctx.save();
  const g = ctx.createRadialGradient(-w * 0.1, cy - h * 0.14, 2, 0, cy, w * 0.44);
  g.addColorStop(0, '#d0a878');
  g.addColorStop(1, '#8a6040');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5a3a22';
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,58,34,0.6)'; // its cracks, dry as old leather
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = hash(seed + i) * TAU, r = w * 0.2;
    ctx.moveTo(Math.cos(a) * r * 0.4, cy + Math.sin(a) * r * 0.4);
    ctx.lineTo(Math.cos(a) * r, cy + Math.sin(a) * r * 0.9);
  }
  ctx.stroke();
  ctx.fillStyle = '#6a4428'; // the neck, a mouth, tied with an old cord, pointing at you
  ctx.save();
  ctx.translate(w * 0.34, cy - h * 0.2);
  ctx.rotate(-0.5 + wk * 0.4);
  ctx.beginPath();
  ctx.roundRect(-4, -12, 16, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#1a120c';
  ellipse(ctx, 12, -6, 3 + wk * 2, 4 + wk * 2);
  ctx.restore();
  eyes(ctx, w * 0.04, cy - h * 0.06, 6, t, seed, { dying, size: 0.85 });
  if (live && wk > 0.4) { // grit puffing off it
    ctx.fillStyle = 'rgba(232,200,150,0.5)';
    for (let i = 0; i < 4; i++) circle(ctx, w * 0.5 + i * 6, cy - h * 0.3 - i * 3, 2 - i * 0.3);
  }
  ctx.restore();
  return body;
}

// ——— the Seventh Digger: the last of the seven who went down, a tall dusty figure with a broad digger's hat and a great
// pick, still digging for water; he brings it down where you stand (stomp) ———
function drawSeventhDigger(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, charging = !!m?.charging && live;
  const cy = -h * 0.48;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -2);
    ctx.quadraticCurveTo(-w * 0.42, cy, -w * 0.18, -h * 0.84);
    ctx.lineTo(w * 0.18, -h * 0.84);
    ctx.quadraticCurveTo(w * 0.42, cy, w * 0.3, -2);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(60,40,30,0.25)';
  ellipse(ctx, 0, 0, w * 0.45, 6);
  const g = ctx.createLinearGradient(0, -h * 0.84, 0, 0);
  g.addColorStop(0, 'rgba(214,194,160,0.98)');
  g.addColorStop(1, 'rgba(170,140,104,0.7)');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(106,84,60,0.8)';
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6a4a'; // the broad hat
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.84, w * 0.4, h * 0.05, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.9, w * 0.2, h * 0.07, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#3a2a1e'; // the face under it
  ellipse(ctx, w * 0.04, -h * 0.74, w * 0.16, h * 0.07);
  ctx.fillStyle = live ? `rgba(255,${230 - wk * 90},190,0.95)` : '#7a6a5a';
  circle(ctx, -w * 0.02, -h * 0.74, 2.2);
  circle(ctx, w * 0.1, -h * 0.74, 2.2);
  // the great pick, up over his head on a warning, down as he strikes
  ctx.save();
  ctx.translate(w * 0.22, -h * 0.56);
  ctx.rotate(charging ? 0.6 : -0.8 - wk * 1.3 + (live ? Math.sin(t * 1.4 + seed) * 0.06 : 0));
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -h * 0.6);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-26, -h * 0.6);
  ctx.quadraticCurveTo(0, -h * 0.7, 26, -h * 0.6);
  ctx.lineTo(0, -h * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(232,214,180,0.4)'; // tally marks scratched on his coat, thousands
  ctx.lineWidth = 1;
  tally(ctx, -w * 0.24, -h * 0.3, 2, 8, 2.2);
  tally(ctx, -w * 0.2, -h * 0.16, 2, 8, 2.2);
  ctx.restore();
  return body;
}

export const DRYW_MOB_ART = { dry_strider: drawDryStrider, bucket_mimic: drawBucketMimic, tally_wraith: drawTallyWraith, dust_drinker: drawDustDrinker, seventh_digger: drawSeventhDigger };

// ——— swords (the blade up along -y from the grip at 0) ———
// The Long Road: a broad blade of shell-horn, plated like his back, worn smooth along its edge
function drawLongRoadBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,226,180,0.9)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-7, 0, 7, 0);
  g.addColorStop(0, '#c8a070');
  g.addColorStop(0.5, '#a07a54');
  g.addColorStop(1, '#6a4e36');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a3422';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6.5, -L * 0.22);
  ctx.lineTo(-5.5, -L * 0.86);
  ctx.quadraticCurveTo(0, -L * 1.06, 5.5, -L * 0.86);
  ctx.lineTo(6.5, -L * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(74,52,34,0.55)'; // its plates
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const y = -L * (0.32 + i * 0.15);
    ctx.beginPath();
    ctx.roundRect(-4.2, y - L * 0.06, 8.4, L * 0.12, 3);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,240,210,0.7)'; // the edge worn bright
  ctx.beginPath();
  ctx.moveTo(5.6, -L * 0.26);
  ctx.lineTo(4.8, -L * 0.86);
  ctx.stroke();
  ctx.fillStyle = '#d8a84a'; // the guard: a ring of caravan brass
  ctx.fillRect(-9, -L * 0.24, 18, 4);
  ctx.fillStyle = '#5a3a24';
  ctx.beginPath();
  ctx.roundRect(-2.8, -L * 0.21, 5.6, L * 0.2, 2);
  ctx.fill();
  ctx.fillStyle = '#3e5a9a';
  circle(ctx, 0, -L * 0.02, 3);
  ctx.restore();
}
export const DRYW_SWORDS = { long_road_blade: drawLongRoadBlade };
export const DRYW_SWORD_LEN = { long_road_blade: 70 };

// ——— helmets (on a slime w × h, its top near -h * 0.66) ———
// The Bucket Helm: an old iron-bound well bucket, upside down, the handle under the chin
function drawBucketHelm(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.5;
  ctx.fillStyle = '#a07a54';
  ctx.strokeStyle = '#4a3220';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.lineTo(-rx * 0.8, by - h * 0.5);
  ctx.lineTo(rx * 0.8, by - h * 0.5);
  ctx.lineTo(rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.fillRect(-rx * 0.96, by - 4, rx * 1.92, 5);
  ctx.fillRect(-rx * 0.84, by - h * 0.42, rx * 1.68, 5);
  ctx.strokeStyle = IRON_D; // the handle, down under the chin
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 2);
  ctx.quadraticCurveTo(0, by + h * 0.5, rx, by + 2);
  ctx.stroke();
}
// The Carapace Crown: a ring of worn shell plates, a tiny striped tent on top with its flap tied back
function drawCarapaceCrown(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.5;
  ctx.fillStyle = '#8a6a4a';
  ctx.strokeStyle = '#4e3a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.quadraticCurveTo(-rx * 1.04, by - h * 0.24, 0, by - h * 0.28);
  ctx.quadraticCurveTo(rx * 1.04, by - h * 0.24, rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,200,150,0.6)'; // its plates
  ctx.lineWidth = 1.2;
  for (const x of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.ellipse(x * rx, by - h * 0.12, rx * 0.22, h * 0.08, 0, 0, TAU);
    ctx.stroke();
  }
  const ty = by - h * 0.27; // the tiny tent
  ctx.fillStyle = '#e8d4b0';
  ctx.beginPath();
  ctx.moveTo(-9, ty);
  ctx.lineTo(0, ty - 14);
  ctx.lineTo(9, ty);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c8583a';
  ctx.fillRect(-4, ty - 8, 2.4, 8);
  ctx.fillRect(2, ty - 8, 2.4, 8);
  ctx.fillStyle = '#2a1a10';
  ctx.beginPath();
  ctx.moveTo(-2, ty);
  ctx.lineTo(0, ty - 6);
  ctx.lineTo(2, ty);
  ctx.closePath();
  ctx.fill();
}
export const DRYW_HELMETS = { bucket_helm: drawBucketHelm, carapace_crown: drawCarapaceCrown };

// ——— icons (centred, about 24 px across) ———
function iconStriderLeg(ctx) {
  ctx.save();
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.quadraticCurveTo(-2, -12, 10, 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, 10, 7, 3, 1.4);
  ctx.restore();
}
function iconBucketRivet(ctx) {
  ctx.save();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -2, 7, Math.PI, 0);
  ctx.lineTo(3, 8);
  ctx.lineTo(-3, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8d0c0';
  ellipse(ctx, -2, -5, 2.4, 1.4);
  ctx.restore();
}
function iconTallyStone(ctx) {
  ctx.save();
  ctx.fillStyle = DUST;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-11, 6);
  ctx.lineTo(-8, -7);
  ctx.lineTo(9, -8);
  ctx.lineTo(11, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#4a3422';
  ctx.lineWidth = 1;
  tally(ctx, -8, 4, 1, 9, 2.2);
  ctx.restore();
}
function iconDrinkerGrit(ctx) {
  ctx.save();
  const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 9);
  g.addColorStop(0, '#f4e0c0');
  g.addColorStop(1, '#8a6040');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(90,60,40,0.6)';
  for (let i = 0; i < 8; i++) circle(ctx, Math.cos(i * 2.1) * 5, Math.sin(i * 2.1) * 5, 0.9);
  ctx.restore();
}
export const DRYW_ICONS = { strider_leg: iconStriderLeg, bucket_rivet: iconBucketRivet, tally_stone: iconTallyStone, drinker_grit: iconDrinkerGrit };
