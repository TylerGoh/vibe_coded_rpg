// Docs: docs/places/rim.md, docs/combat/stages.md
// The Caldera Rim's art that isn't the room itself (src/rim.js): its creatures (rim goat, pumice puff and the pumice
// bits it breaks into, glass scorpion, heat shimmer, crag roc; RIM_MOB_ART, called by drawMob in src/field.js), the gear
// dropped there and in Brenna's den (the Bearer's Edge and Cap, E4b; RIM_SWORDS, RIM_SWORD_LEN, RIM_HELMETS, drawn by drawSword / drawHelmet in src/field.js; the staff and
// bow are rows in src/staff-art.js and src/bow-art.js) and its materials' icons (RIM_ICONS).
// Emberdeep's register at its harshest: basalt, black glass, iron, grey pumice, a little ember; soft and rounded still.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const BAS = '#3a3438', BAS_D = '#221e22', BAS_L = '#5a5258';
const GLASS = '#1c1a22', GLASS_M = '#34324a', GLASS_L = '#8a8aa8';
const PUM = '#b0a8a4', PUM_D = '#7a726e', PUM_L = '#d8d0cc';
const IRON = '#8a8490', IRON_D = '#4e4a56';
const EMBER = '#ff8a4a';

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

// Rim goat: a stocky dark-grey goat with a shaggy, grit-blown coat, a pale muzzle and one ridged black horn curled
// round each side. Harmless: it skips about the lip and bleats into the wind.
function drawRimGoat(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const kick = walk ? Math.max(0, Math.sin(t * 9 + seed)) : 0;
  const cy = -h * 0.5 - kick * 3;
  // legs: thin, hard little hooves
  ctx.strokeStyle = BAS_D;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x, s] of [[-0.22, 1], [-0.1, -1], [0.14, -1], [0.26, 1]]) {
    const sw = walk ? Math.sin(t * 9 + seed) * 3 * s : 0;
    ctx.moveTo(w * x, cy + h * 0.14);
    ctx.lineTo(w * x + sw, -2);
  }
  ctx.stroke();
  // the body, shaggy
  const body = () => ctx.ellipse(0, cy, w * 0.36, h * 0.24, 0, 0, TAU);
  ctx.fillStyle = '#5a5458';
  ctx.strokeStyle = '#2e2a2e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6e686c'; // the shag, blown back
  for (let i = 0; i < 6; i++) {
    const x = -w * 0.3 + i * w * 0.11, k = Math.sin(t * 4 + i + seed) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.12);
    ctx.quadraticCurveTo(x - 4 + k, cy + h * 0.26, x - 7 + k, cy + h * 0.3);
    ctx.lineTo(x + 3, cy + h * 0.14);
    ctx.fill();
  }
  // a stub of a tail
  ctx.fillStyle = '#4a4448';
  ellipse(ctx, -w * 0.36, cy - h * 0.12, 4, 6, -0.5);
  // the head, with a pale muzzle and a little beard
  const hx = w * 0.34, hy = cy - h * 0.2;
  ctx.fillStyle = '#5a5458';
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.14, h * 0.17, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8c0bc';
  ellipse(ctx, hx + w * 0.08, hy + h * 0.06, w * 0.07, h * 0.08, 0.3);
  ctx.fillStyle = '#4a4448';
  ctx.beginPath();
  ctx.moveTo(hx + w * 0.04, hy + h * 0.14);
  ctx.lineTo(hx + w * 0.06, hy + h * 0.3);
  ctx.lineTo(hx + w * 0.1, hy + h * 0.14);
  ctx.fill();
  // the horn, curled back once round
  ctx.strokeStyle = GLASS;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(hx - w * 0.06, hy - h * 0.1, h * 0.14, -0.4, Math.PI * 1.3, true);
  ctx.stroke();
  ctx.strokeStyle = GLASS_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(hx - w * 0.06, hy - h * 0.1, h * 0.14, -0.2, -1.4, true);
  ctx.stroke();
  eyes(ctx, hx + w * 0.02, hy - h * 0.04, 0.1, t, seed, { dying, size: 0.55 });
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(hx, hy, w * 0.14, h * 0.17, 0.3, 0, TAU);
  };
}

// Pumice puff: a light grey lump of hardened froth, round and full of holes, bobbing as if it might blow away, with an
// ember glowing deep inside it. Break it and it comes apart into bits (the `split` brain).
function drawPumicePuff(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const bob = Math.sin(t * (walk ? 6 : 2) + seed) * 3;
  const cy = -h * 0.48 + bob;
  const body = () => {
    ctx.moveTo(w * 0.4, cy);
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * TAU, r = 1 + 0.08 * Math.sin(i * 2.7 + seed);
      ctx.lineTo(Math.cos(a) * w * 0.4 * r, cy + Math.sin(a) * h * 0.42 * r);
    }
    ctx.closePath();
  };
  ctx.fillStyle = PUM;
  ctx.strokeStyle = PUM_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PUM_L;
  ellipse(ctx, -w * 0.12, cy - h * 0.18, w * 0.16, h * 0.1, -0.3);
  // the ember inside, through the biggest holes
  const glow = 0.5 + 0.3 * Math.sin(t * 3 + seed);
  ctx.fillStyle = `rgba(255,138,74,${glow})`;
  circle(ctx, w * 0.02, cy + h * 0.1, 4);
  ctx.fillStyle = PUM_D;
  for (const [x, y, r] of [[-0.24, 0.06, 3], [0.18, 0.2, 2.4], [-0.08, 0.26, 2], [0.26, -0.08, 2.2], [-0.28, -0.16, 1.8], [0.08, -0.28, 1.6]]) circle(ctx, w * x, cy + h * y, r);
  eyes(ctx, w * 0.12, cy - h * 0.04, 0.09 * w, t, seed, { dying, size: 0.6 });
  return () => {
    ctx.beginPath();
    body();
  };
}
// Pumice bit: a fist of the same froth, skittering (small: the split minion)
function drawPumiceBit(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.5 + Math.abs(Math.sin(t * 10 + seed)) * -3;
  ctx.fillStyle = PUM;
  ctx.strokeStyle = PUM_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, cy, w * 0.46, h * 0.44, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PUM_D;
  for (const [x, y] of [[-0.2, 0.1], [0.14, 0.2], [0.0, -0.2]]) circle(ctx, w * x, cy + h * y, 1.6);
  ctx.fillStyle = `rgba(255,138,74,${0.5 + 0.3 * Math.sin(t * 5 + seed)})`;
  circle(ctx, w * 0.1, cy + h * 0.06, 1.8);
  eyes(ctx, w * 0.12, cy - h * 0.06, 3, t, seed, { dying, size: 0.4 });
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.46, h * 0.44, 0.2, 0, TAU);
  };
}

// Glass scorpion: a low black-glass scorpion, its back plates glossy as obsidian, claws held up in front, a curled
// sting with a glint at its tip. Hard in front (the `shell` brain): it turns the plates and claws to you and lunges.
function drawGlassScorpion(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, ram = !!m.charging && live;
  const step = m.walking || ram ? Math.sin(t * 12) * 2 : 0;
  const cy = -h * 0.36;
  // legs
  ctx.strokeStyle = GLASS;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.22 + i * w * 0.13, s = (i % 2 ? 1 : -1) * step;
    ctx.moveTo(x, cy + h * 0.1);
    ctx.lineTo(x - w * 0.06, cy + h * 0.24 + s);
    ctx.lineTo(x - w * 0.1, 0);
  }
  ctx.stroke();
  // the back: glossy plates
  const back = () => ctx.ellipse(-w * 0.02, cy, w * 0.3, h * 0.2, 0, 0, TAU);
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = '#0e0c12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  back();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = GLASS_M;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const x of [-0.18, -0.06, 0.06, 0.16]) {
    ctx.moveTo(w * x, cy - h * 0.18);
    ctx.lineTo(w * x, cy + h * 0.16);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,206,240,0.5)'; // the gloss
  ellipse(ctx, -w * 0.08, cy - h * 0.12, w * 0.14, h * 0.04, -0.1);
  // the tail and sting, curled up over the back (raised higher on the warn)
  const lift = warn ? 0.14 : 0;
  ctx.strokeStyle = GLASS;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, cy);
  ctx.quadraticCurveTo(-w * 0.5, cy - h * (0.6 + lift), -w * 0.2, cy - h * (0.9 + lift));
  ctx.stroke();
  ctx.fillStyle = GLASS_M;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy - h * (0.98 + lift));
  ctx.quadraticCurveTo(-w * 0.06, cy - h * (0.96 + lift), -w * 0.06, cy - h * (0.78 + lift));
  ctx.lineTo(-w * 0.16, cy - h * (0.82 + lift));
  ctx.closePath();
  ctx.fill();
  if (live) {
    ctx.fillStyle = `rgba(255,138,74,${warn ? 0.9 : 0.5})`;
    circle(ctx, -w * 0.06, cy - h * (0.78 + lift), 2);
  }
  // the claws, held up in front (raised on the warn, thrust forward in the lunge)
  const up = warn ? -h * 0.18 : 0, reach = ram ? w * 0.12 : 0;
  for (const [dy, s] of [[-0.04, 1], [0.1, 0.85]]) {
    const x = w * 0.36 + reach, y = cy + h * dy + up;
    ctx.fillStyle = s === 1 ? GLASS_M : GLASS;
    ctx.strokeStyle = '#0e0c12';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.12 * s, h * 0.12 * s, -0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = GLASS_L;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.04, y - h * 0.02);
    ctx.lineTo(x + w * 0.13 * s, y - h * 0.06);
    ctx.stroke();
  }
  eyes(ctx, w * 0.2, cy - h * 0.12, 0.06 * w, t, seed, { dying, size: 0.55, glow: live ? '#ff9a5a' : null });
  return () => {
    ctx.beginPath();
    back();
  };
}

// Heat shimmer: the air gone wrong over a hot crack: a wavering column of warp, faintly orange at its heart, with two
// dark eyes in it. It fades out (the `phase` brain) and comes back hot.
function drawHeatShimmer(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.5 + Math.sin(t * 2 + seed) * 3;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.16 + 0.08 * Math.sin(t * 20);
  // wavering bands of warped air
  for (let i = 0; i < 7; i++) {
    const y = cy - h * 0.42 + i * h * 0.13, k = Math.sin(t * 6 + i * 1.3 + seed);
    ctx.fillStyle = `rgba(255,${200 - i * 6},${150 - i * 8},${0.16 + 0.06 * Math.sin(t * 3 + i)})`;
    ellipse(ctx, k * 4, y, w * (0.32 - Math.abs(i - 3) * 0.04), h * 0.08);
  }
  ctx.strokeStyle = 'rgba(255,236,210,0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * w * 0.14;
    ctx.moveTo(x, cy + h * 0.4);
    for (let j = 1; j <= 6; j++) ctx.lineTo(x + Math.sin(t * 7 + j + i * 2 + seed) * 3, cy + h * 0.4 - j * h * 0.14);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,150,90,0.55)'; // the hot heart
  circle(ctx, 0, cy + h * 0.04, w * 0.14);
  ctx.fillStyle = 'rgba(255,220,180,0.6)';
  circle(ctx, -w * 0.03, cy, w * 0.06);
  eyes(ctx, w * 0.04, cy - h * 0.12, 4, t, seed, { dying, size: 0.55 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.36, h * 0.46, 0, 0, TAU);
  };
}

// Crag roc: a big dark eagle of the rim, ash-grey above, a pale barred breast and a heavy hooked bill; it hangs on the
// wind over the High Rim, tilts (m.warn), folds up and falls (m.charging).
function drawCragRoc(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const flap = dive ? -0.9 : warn ? -0.6 : Math.sin(t * 2.6 + seed) * 0.3;
  const cy = -h * 0.55;
  ctx.save();
  if (dive || warn) {
    ctx.translate(0, cy);
    ctx.rotate(dive ? 0.9 : 0.35);
    ctx.translate(0, -cy);
  }
  const wing = (s) => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, cy - h * 0.04);
    ctx.quadraticCurveTo(-w * 0.18, cy - s * h * 0.12 + flap * h * 0.5, -w * 0.5, cy + flap * h * 0.7 - s * 4);
    ctx.lineTo(-w * 0.46, cy + flap * h * 0.56 + h * 0.08); // the fingered tip
    ctx.lineTo(-w * 0.42, cy + flap * h * 0.46 + h * 0.04);
    ctx.lineTo(-w * 0.38, cy + flap * h * 0.4 + h * 0.1);
    ctx.quadraticCurveTo(-w * 0.2, cy + h * 0.14, -w * 0.0, cy + h * 0.08);
    ctx.closePath();
  };
  ctx.fillStyle = '#3a343a';
  wing(-1);
  ctx.fill();
  // the tail, broad and square
  ctx.fillStyle = '#4a4248';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy - h * 0.04);
  ctx.lineTo(-w * 0.44, cy - h * 0.08);
  ctx.lineTo(-w * 0.44, cy + h * 0.12);
  ctx.lineTo(-w * 0.2, cy + h * 0.08);
  ctx.closePath();
  ctx.fill();
  // the body: ash-grey back, pale barred breast
  const body = () => ctx.ellipse(0, cy, w * 0.26, h * 0.2, 0, 0, TAU);
  ctx.fillStyle = '#d8d0c4';
  ctx.strokeStyle = '#4a4248';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a5258';
  ellipse(ctx, -w * 0.04, cy - h * 0.08, w * 0.22, h * 0.1);
  ctx.strokeStyle = 'rgba(90,82,88,0.6)';
  ctx.beginPath();
  for (const x of [0.02, 0.1, 0.18]) {
    ctx.moveTo(w * x, cy + h * 0.02);
    ctx.lineTo(w * x - 3, cy + h * 0.14);
  }
  ctx.stroke();
  // the near wing
  ctx.fillStyle = '#4e464c';
  ctx.strokeStyle = '#26222a';
  wing(1);
  ctx.fill();
  ctx.stroke();
  // the head and heavy hooked bill
  ctx.fillStyle = '#6a6268';
  ctx.beginPath();
  ctx.ellipse(w * 0.26, cy - h * 0.12, w * 0.1, h * 0.15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8b890';
  ctx.beginPath();
  ctx.moveTo(w * 0.33, cy - h * 0.16);
  ctx.quadraticCurveTo(w * 0.47, cy - h * 0.16, w * 0.44, cy + h * 0.0);
  ctx.lineTo(w * 0.33, cy - h * 0.05);
  ctx.closePath();
  ctx.fill();
  eyes(ctx, w * 0.28, cy - h * 0.17, 0.1, t, seed, { dying, size: 0.55, glow: live ? '#e8a040' : null });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(w * 0.26, cy - h * 0.12, w * 0.1, h * 0.15, 0, 0, TAU);
  };
}

export const RIM_MOB_ART = { rim_goat: drawRimGoat, pumice_puff: drawPumicePuff, pumice_bit: drawPumiceBit, glass_scorpion: drawGlassScorpion, heat_shimmer: drawHeatShimmer, crag_roc: drawCragRoc };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function ironGrip(ctx, c = '#4a3a34') {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.fillStyle = IRON;
  ctx.fillRect(-7, -5, 14, 3.5);
  circle(ctx, 0, 12, 2.4);
}
// Cragbeak: a heavy black-iron blade hooked at the end like a roc's beak, its edge chipped
function drawCragbeak(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(220,226,255,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(-4.5, -5);
  ctx.lineTo(-5, -L * 0.8);
  ctx.quadraticCurveTo(-4, -L * 1.0, 6, -L * 0.98);
  ctx.quadraticCurveTo(10, -L * 0.92, 7, -L * 0.82);
  ctx.quadraticCurveTo(4, -L * 0.86, 3, -L * 0.78);
  ctx.lineTo(4.5, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = IRON; // the edge, with chips out of it
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.lineTo(-5, -L * 0.3);
  ctx.moveTo(-5, -L * 0.36);
  ctx.lineTo(-5, -L * 0.62);
  ctx.moveTo(-5, -L * 0.68);
  ctx.lineTo(-5, -L * 0.8);
  ctx.stroke();
  ctx.fillStyle = BAS_L;
  ellipse(ctx, 0, -L * 0.5, 1.4, L * 0.22);
  ironGrip(ctx);
  ctx.restore();
}
// Bearer's Edge (Brenna's, E4b): a long straight blade of dark forge iron, a gear-tooth's notch cut in its spine, a
// strap wound round the grip
function drawBearerEdge(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(214,232,255,0.85)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(-5, -5);
  ctx.lineTo(-5, -L * 0.92);
  ctx.lineTo(0, -L * 1.02);
  ctx.lineTo(5, -L * 0.92);
  ctx.lineTo(5, -L * 0.62);
  ctx.lineTo(1.5, -L * 0.58); // the notch, a tooth's shape
  ctx.lineTo(1.5, -L * 0.48);
  ctx.lineTo(5, -L * 0.44);
  ctx.lineTo(5, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.lineTo(-5, -L * 0.9);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,242,255,0.9)'; // a fleck of the shard's light in the notch
  circle(ctx, 2.6, -L * 0.53, 1.4);
  ironGrip(ctx, '#4a3428');
  ctx.strokeStyle = '#6e5040';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-3, -1 + i * 4);
    ctx.lineTo(3, 1 + i * 4);
  }
  ctx.stroke();
  ctx.restore();
}
export const RIM_SWORDS = { cragbeak: drawCragbeak, bearer_blade: drawBearerEdge };
export const RIM_SWORD_LEN = { cragbeak: 64, bearer_blade: 66 };

// ——— helmets: (ctx, w, h), the slime's size; drawn over its top ———
// Glassback Helm: an iron helm plated in a glass scorpion's black scutes, a curled sting for a crest
function drawGlassbackHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.04, by + 6);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.56, rx * 1.04, by - h * 0.56, rx * 1.04, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the scutes, overlapping, glossy
  for (const [x, y] of [[-0.56, -0.12], [-0.2, -0.3], [0.2, -0.3], [0.56, -0.12], [0, -0.06]]) {
    ctx.fillStyle = GLASS;
    ellipse(ctx, rx * x, by + h * y, rx * 0.3, h * 0.12);
    ctx.fillStyle = 'rgba(200,206,240,0.45)';
    ellipse(ctx, rx * x - 3, by + h * y - 2, rx * 0.12, h * 0.03);
  }
  // the sting crest, curled forward over the brow
  ctx.strokeStyle = GLASS;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.2, by - h * 0.4);
  ctx.quadraticCurveTo(rx * 0.1, by - h * 0.82, rx * 0.5, by - h * 0.62);
  ctx.stroke();
  ctx.fillStyle = EMBER;
  circle(ctx, rx * 0.54, by - h * 0.6, 2.2);
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.08, by + 1, rx * 2.16, 6, 3);
  ctx.fill();
  ctx.stroke();
}
// Bearer's Cap (Brenna's, E4b): a plain round cap of dark iron, a strap buckled under the chin, its crown worn flat
// and bright where something very heavy rested on it
function drawBearerCap(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.52;
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#24202a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.44, rx, by - h * 0.44, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b8b2bc'; // the worn-flat crown
  ellipse(ctx, 0, by - h * 0.3, rx * 0.42, h * 0.04);
  ctx.strokeStyle = '#4a3428'; // the chin strap, down each side
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.9, by + 6);
  ctx.lineTo(-rx * 0.8, by + h * 0.24);
  ctx.moveTo(rx * 0.9, by + 6);
  ctx.lineTo(rx * 0.8, by + h * 0.24);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.04, by + 1, rx * 2.08, 6, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  for (const dx of [-0.6, -0.2, 0.2, 0.6]) circle(ctx, rx * dx, by + 4, 1.3);
}
export const RIM_HELMETS = { glassback_helm: drawGlassbackHelm, bearer_helm: drawBearerCap };

// ——— material icons: (ctx), centred, about 30 px ———
function iconRimHorn(ctx) {
  ctx.strokeStyle = GLASS;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 9, -0.6, Math.PI * 1.25);
  ctx.stroke();
  ctx.strokeStyle = GLASS_L;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 9, -0.4, 0.8);
  ctx.stroke();
}
function iconPuffPumice(ctx) {
  ctx.fillStyle = PUM;
  ctx.strokeStyle = PUM_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 10, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PUM_D;
  for (const [x, y, r] of [[-5, -2, 2], [3, 3, 1.8], [5, -4, 1.4], [-2, 5, 1.2], [-6, 4, 1]]) circle(ctx, x, y, r);
  ctx.fillStyle = PUM_L;
  ellipse(ctx, -3, -6, 4, 1.6);
}
function iconScorpionGlass(ctx) {
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = '#0e0c12';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.quadraticCurveTo(-8, -10, 4, -11);
  ctx.lineTo(12, -2);
  ctx.quadraticCurveTo(6, 8, -12, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,206,240,0.6)';
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(-2, -8, 4, -8);
  ctx.stroke();
}
function iconShimmerBead(ctx) {
  ctx.fillStyle = 'rgba(255,170,110,0.35)';
  circle(ctx, 0, 0, 13);
  ctx.fillStyle = '#e8eef8';
  ctx.strokeStyle = '#8a92a8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,150,90,0.7)';
  circle(ctx, 1, 1, 3.4);
  ctx.fillStyle = '#fff';
  circle(ctx, -3, -3, 1.6);
}
function iconRocFeather(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = '#4a4248';
  ctx.beginPath();
  ctx.ellipse(0, -2, 5, 13, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6a6268';
  ellipse(ctx, 1.4, -4, 2, 9);
  ctx.strokeStyle = '#d8d0c4';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, -14);
  ctx.stroke();
  ctx.restore();
}
// a length of old carrying strap, gone hard as iron, with its buckle
function iconBearerStrap(ctx) {
  ctx.strokeStyle = '#4a3428';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.quadraticCurveTo(-2, -10, 10, -4);
  ctx.stroke();
  ctx.strokeStyle = '#8a6a54';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-11, 6);
  ctx.quadraticCurveTo(-2, -11, 9, -6);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(6, -9, 9, 9, 2);
  ctx.fill();
  ctx.stroke();
}
export const RIM_ICONS = { bearer_strap: iconBearerStrap, rim_horn: iconRimHorn, puff_pumice: iconPuffPumice, scorpion_glass: iconScorpionGlass, shimmer_bead: iconShimmerBead, roc_feather: iconRocFeather };
