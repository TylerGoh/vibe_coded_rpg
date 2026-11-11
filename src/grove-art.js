// Docs: docs/places/grove.md, docs/places/firefly.md, docs/combat/stages.md
// Firefly Hollow's and the Drowned Grove's art that isn't the rooms themselves (src/firefly.js, src/grove.js; atlas
// Phase 8, L1): their creatures (fen newt; will-o'-wisp, reed stalker, willow wight, marsh heron: GROVE_MOB_ART, called
// by drawMob in src/field.js), their materials' icons (GROVE_ICONS), the willow wight's rare crown and Long-Neck's gear
// for players (GROVE_SWORDS, GROVE_SWORD_LEN, GROVE_HELMETS; her staff and bow are in src/staff-art.js and
// src/bow-art.js). Lantern Fen's register: peat browns, reed golds, still dark water, a dim green under the willows,
// violet dusk and small warm or cold lights; soft and rounded as ever, a little eerie.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2e2a3a';
const PEAT = '#5a4636', PEAT_D = '#3a2c22';
const BARK = '#3a3430', BARK_D = '#221e1c', BARK_L = '#5a524a';
const WILLOW = '#7a8a5a', WILLOW_D = '#4e5a3a';
const HERON = '#a8acb4', HERON_D = '#6e727c', HERON_L = '#e4e6ea';
const REEDG = '#b8a070', REEDG_D = '#7a6440';
const WISP = '150,220,255';

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

// a bird's eye: a yellow ring with a black pupil (herons and bitterns stare)
function birdEye(ctx, x, y, r, dying) {
  ctx.fillStyle = '#f4d84a';
  circle(ctx, x, y, r);
  ctx.strokeStyle = INKC;
  ctx.lineWidth = 1.2;
  if (dying > 0.05) {
    ctx.beginPath();
    ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
    ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = INKC;
  circle(ctx, x + r * 0.15, y, r * 0.5);
  ctx.fillStyle = '#fff';
  circle(ctx, x + r * 0.35, y - r * 0.3, r * 0.2);
}

// Fen newt: a little dark-olive newt with a pale belly and orange spots, a frilly crest along its back and a long flat
// tail it waves when it walks. Potters about Firefly Hollow's glade and nips
function drawFenNewt(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const step = live && m.walking ? Math.sin(t * 14 + seed) : 0;
  const tailSw = live ? Math.sin(t * 4 + seed) * 4 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.18, -h * 0.12);
    ctx.bezierCurveTo(-w * 0.2, -h * 0.6, w * 0.24, -h * 0.66, w * 0.4, -h * 0.4);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.2, w * 0.36, -h * 0.08);
    ctx.lineTo(-w * 0.16, -h * 0.06);
    ctx.closePath();
  };
  ctx.save();
  // the tail, long and flat, a frill along its top
  ctx.fillStyle = '#4a5636';
  ctx.strokeStyle = '#2a321e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -h * 0.4);
  ctx.quadraticCurveTo(-w * 0.36, -h * 0.5 + tailSw * 0.3, -w * 0.52, -h * 0.26 + tailSw);
  ctx.quadraticCurveTo(-w * 0.38, -h * 0.2, -w * 0.14, -h * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // legs: four little splayed ones
  ctx.strokeStyle = '#3a4428';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [lx, ph] of [[-w * 0.08, 1], [w * 0.26, -1]]) {
    ctx.moveTo(lx, -h * 0.14);
    ctx.lineTo(lx + step * ph * 4 - 3, -1);
  }
  ctx.stroke();
  ctx.fillStyle = '#5a6a40';
  body();
  ctx.fill();
  ctx.strokeStyle = '#2a321e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = '#e8c88a'; // the pale belly
  ellipse(ctx, w * 0.12, -h * 0.08, w * 0.3, h * 0.12);
  ctx.fillStyle = '#ff9a3a'; // orange spots
  for (const [sx, sy] of [[-0.06, 0.42], [0.1, 0.5], [0.24, 0.4], [0.02, 0.3]]) circle(ctx, w * sx, -h * sy, 2.2);
  ctx.restore();
  ctx.strokeStyle = '#3a4428'; // the crest frill
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const x = -w * 0.12 + i * w * 0.07, y = -h * (0.52 + Math.sin(i * 0.9) * 0.04);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y - 4 - (i % 2) * 2);
  }
  ctx.stroke();
  eyes(ctx, w * 0.3, -h * 0.42, 3.2, t, seed, { dying, size: 0.7 });
  ctx.restore();
  return body;
}

// Will-o'-wisp: a cold blue-white flame with a soft core and two dark eyes, trailing wisps of mist, a little lantern
// glow round it. It fades out (`phase`: m.special) and comes back with a pulse
function drawWillWisp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const faded = live && m.special;
  const bob = live ? Math.sin(t * 2.4 + seed) * 3 : 0;
  const cy = -h * 0.55 + bob;
  const flick = (i) => Math.sin(t * 8 + seed + i * 1.7);
  const flame = () => {
    ctx.beginPath();
    ctx.moveTo(0, cy - h * 0.48 - flick(0) * 3);
    ctx.bezierCurveTo(w * 0.42, cy - h * 0.18, w * 0.5, cy + h * 0.24, 0, cy + h * 0.34);
    ctx.bezierCurveTo(-w * 0.5, cy + h * 0.24, -w * 0.42, cy - h * 0.18, 0, cy - h * 0.48 - flick(0) * 3);
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha *= faded ? 0.22 : 0.92;
  const g = ctx.createRadialGradient(0, cy, 2, 0, cy, w * 1.1);
  g.addColorStop(0, `rgba(${WISP},0.4)`);
  g.addColorStop(1, `rgba(${WISP},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-w * 1.1, cy - w * 1.1, w * 2.2, w * 2.2);
  ctx.strokeStyle = `rgba(${WISP},0.35)`; // trailing mist
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const x0 = (i - 1) * w * 0.18;
    ctx.moveTo(x0, cy + h * 0.3);
    ctx.quadraticCurveTo(x0 - 6 + flick(i) * 3, cy + h * 0.5, x0 - 12, cy + h * 0.62 + i * 2);
  }
  ctx.stroke();
  const fg = ctx.createLinearGradient(0, cy - h * 0.5, 0, cy + h * 0.34);
  fg.addColorStop(0, '#dff4ff');
  fg.addColorStop(0.6, '#8ec8f0');
  fg.addColorStop(1, '#5a86c8');
  ctx.fillStyle = fg;
  flame();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; // the white core
  ellipse(ctx, 0, cy + h * 0.06, w * 0.18, h * 0.16);
  eyes(ctx, w * 0.08, cy - h * 0.02, 5, t, seed, { dying, size: 0.9, glow: '#2a3a5a' });
  ctx.restore();
  return flame;
}

// Reed stalker: a great bittern as tall as a slime and a half, streaked reed-gold and brown so it vanishes in the reeds,
// neck drawn up stiff and bill pointed at the sky (how bitterns hide). It stands stock still, then the bill comes down
// level (m.warn) and it lunges (the `shell` brain's lunge, m.charging)
function drawReedStalker(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const step = live && (m.walking || lunge) ? Math.sin(t * (lunge ? 18 : 8) + seed) : 0;
  const by = -h * 0.42; // the body's middle
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, by, w * 0.34, h * 0.2, -0.2, 0, TAU);
  };
  ctx.save();
  // legs: long, greenish, knees backward
  ctx.strokeStyle = '#7a8a4a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [lx, ph] of [[-w * 0.06, 1], [w * 0.08, -1]]) {
    ctx.moveTo(lx, by + h * 0.12);
    ctx.lineTo(lx + 4 + step * ph * 5, -h * 0.14);
    ctx.lineTo(lx + step * ph * 8, 0);
    ctx.lineTo(lx + step * ph * 8 + 8, 0);
  }
  ctx.stroke();
  // the body, streaked
  ctx.fillStyle = REEDG;
  body();
  ctx.fill();
  ctx.strokeStyle = REEDG_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.strokeStyle = 'rgba(90,64,34,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -4; i <= 4; i++) {
    ctx.moveTo(i * 7, by - h * 0.22);
    ctx.lineTo(i * 7 - 4, by + h * 0.22);
  }
  ctx.stroke();
  ctx.restore();
  // the neck and head: up and stiff (hiding), level and out (about to strike)
  const ang = lunge ? 0.1 : warn ? -0.1 : -1.25; // bill angle from horizontal
  const nx = w * 0.18, ny = by - h * 0.12;
  const hx = nx + Math.cos(ang - 0.35) * h * 0.34, hy = ny + Math.sin(ang - 0.35) * h * 0.34 - (warn || lunge ? 0 : h * 0.06);
  ctx.strokeStyle = REEDG;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.quadraticCurveTo(nx + 4, (ny + hy) / 2, hx, hy);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,64,34,0.6)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(nx + 2, ny - 2);
  ctx.quadraticCurveTo(nx + 6, (ny + hy) / 2, hx + 2, hy + 2);
  ctx.stroke();
  ctx.fillStyle = REEDG;
  circle(ctx, hx, hy, 7);
  ctx.fillStyle = '#3a2e20'; // a dark cap
  ellipse(ctx, hx - 1, hy - 4, 6, 3);
  ctx.save(); // the bill
  ctx.translate(hx + 4, hy);
  ctx.rotate(ang);
  ctx.fillStyle = '#d8c060';
  ctx.strokeStyle = '#7a6430';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(22, 0);
  ctx.lineTo(0, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  birdEye(ctx, hx + 2, hy - 1, 2.4, dying);
  // a couple of reed stems in front of it (it hides behind anything)
  if (!lunge) {
    ctx.strokeStyle = 'rgba(122,138,88,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, 0);
    ctx.quadraticCurveTo(w * 0.34, -h * 0.5, w * 0.28, -h * 0.9);
    ctx.moveTo(-w * 0.32, 0);
    ctx.quadraticCurveTo(-w * 0.28, -h * 0.4, -w * 0.34, -h * 0.72);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// Willow wight: a stump of drowned willow got up and walking, black bark streaming wet, its roots for feet, a few long
// pale fronds hanging off its crown, two hollow knots for eyes with a green glow in them. It heaves itself up (the
// `stomp` brain: m.warn) and its roots come up round it when it lands
function drawWillowWight(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const sway = live ? Math.sin(t * 1.4 + seed) * 0.04 : 0;
  const lift = warn ? -h * 0.05 : 0;
  const trunk = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, -h * 0.08 + lift);
    ctx.bezierCurveTo(-w * 0.42, -h * 0.5, -w * 0.3, -h * 0.82, -w * 0.08, -h * 0.9 + lift);
    ctx.quadraticCurveTo(w * 0.1, -h * 0.98 + lift, w * 0.26, -h * 0.86 + lift);
    ctx.bezierCurveTo(w * 0.4, -h * 0.6, w * 0.44, -h * 0.3, w * 0.36, -h * 0.08 + lift);
    ctx.closePath();
  };
  ctx.save();
  ctx.rotate(sway);
  // roots: splayed feet, gripping
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const x0 = -w * 0.3 + i * w * 0.15, x1 = x0 + (i - 2) * 9;
    ctx.moveTo(x0, -h * 0.12 + lift);
    ctx.quadraticCurveTo(x0 + (i - 2) * 4, -h * 0.02, x1, 0);
  }
  ctx.stroke();
  const g = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
  g.addColorStop(0, BARK_D);
  g.addColorStop(0.45, BARK_L);
  g.addColorStop(1, BARK);
  ctx.fillStyle = g;
  trunk();
  ctx.fill();
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.save();
  trunk();
  ctx.clip();
  ctx.strokeStyle = 'rgba(20,16,14,0.55)'; // furrowed bark
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = -w * 0.3 + i * w * 0.1;
    ctx.moveTo(x, -h * 0.1);
    ctx.bezierCurveTo(x + 4, -h * 0.4, x - 4, -h * 0.6, x + 2, -h * 0.92);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.5)'; // moss and weed at the waterline it walked out of
  for (let i = 0; i < 6; i++) ellipse(ctx, -w * 0.32 + i * w * 0.13, -h * 0.2, 7, 3);
  ctx.restore();
  // the eye knots: hollow, a green glow deep in
  const glo = live ? 0.6 + 0.3 * Math.sin(t * 2 + seed) : 0.1;
  for (const ex of [-w * 0.06, w * 0.16]) {
    ctx.fillStyle = '#120e0c';
    ellipse(ctx, ex, -h * 0.62 + lift, 6, 8);
    ctx.fillStyle = `rgba(170,240,150,${glo})`;
    circle(ctx, ex + 1, -h * 0.61 + lift, 2.4);
  }
  ctx.strokeStyle = '#120e0c'; // a split for a mouth
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, -h * 0.44 + lift);
  ctx.quadraticCurveTo(w * 0.06, -h * 0.4 + lift, w * 0.16, -h * 0.45 + lift);
  ctx.stroke();
  // pale fronds hanging off the crown, swinging
  ctx.strokeStyle = WILLOW;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const x = -w * 0.2 + i * w * 0.06, y = -h * 0.9 + lift + Math.abs(i - 4) * 2, sw = live ? Math.sin(t * 1.6 + i + seed) * 4 : 0;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sw + (i - 4) * 3, y + h * 0.25, x + sw * 1.5 + (i - 4) * 5, y + h * (0.4 + (i % 3) * 0.08));
  }
  ctx.stroke();
  ctx.fillStyle = WILLOW_D;
  for (let i = 0; i < 9; i += 2) ellipse(ctx, -w * 0.2 + i * w * 0.06 + (i - 4) * 5, -h * 0.5 + lift + (i % 3) * 6, 2, 5);
  if (live) { // water dripping off it
    const d = (t * 0.9 + seed) % 1;
    ctx.fillStyle = 'rgba(150,170,200,0.6)';
    ellipse(ctx, w * 0.3, -h * (0.5 - d * 0.42), 1.6, 2.6);
  }
  ctx.restore();
  return trunk;
}

// Marsh heron: a grey heron, long neck folded back in an S when it flies, a black plume off its crown, broad wings
// rowing slow. It hangs over the water (fly), draws its neck back (m.warn) and stabs down (the `dive` brain, m.charging)
function drawMarshHeron(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const flap = live ? Math.sin(t * (dive ? 2 : 5) + seed) : 0;
  const cy = -h * 0.55;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.3, h * 0.17, dive ? 0.5 : 0, 0, TAU);
  };
  ctx.save();
  // legs trailing behind
  ctx.strokeStyle = '#c8a050';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy + 2);
  ctx.lineTo(-w * 0.55, cy + 8);
  ctx.moveTo(-w * 0.2, cy + 5);
  ctx.lineTo(-w * 0.54, cy + 12);
  ctx.stroke();
  // the far wing
  const wing = (far) => {
    const up = (dive ? -0.6 : flap) * (far ? 0.8 : 1);
    ctx.fillStyle = far ? HERON_D : HERON;
    ctx.strokeStyle = '#4e525a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.12, cy - 2);
    ctx.quadraticCurveTo(-w * 0.1, cy - h * 0.55 * up - 6, -w * 0.46, cy - h * 0.7 * up - 2);
    ctx.lineTo(-w * 0.5, cy - h * 0.6 * up + 6);
    ctx.quadraticCurveTo(-w * 0.2, cy - h * 0.2 * up + 6, w * 0.12, cy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a3e46'; // dark flight feathers at the tip
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, cy - h * 0.62 * up);
    ctx.lineTo(-w * 0.5, cy - h * 0.7 * up - 2);
    ctx.lineTo(-w * 0.5, cy - h * 0.6 * up + 6);
    ctx.lineTo(-w * 0.38, cy - h * 0.48 * up + 4);
    ctx.closePath();
    ctx.fill();
  };
  wing(true);
  ctx.fillStyle = HERON;
  body();
  ctx.fill();
  ctx.strokeStyle = '#4e525a';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = HERON_L; // the pale breast
  ellipse(ctx, w * 0.12, cy + h * 0.06, w * 0.14, h * 0.08);
  // neck and head: folded back (flying), drawn back further (warn), shot out (dive)
  const reach = dive ? 1.4 : warn ? 0.55 : 0.8;
  const hx = w * 0.18 + w * 0.22 * reach, hy = cy - h * (dive ? -0.05 : 0.18);
  ctx.strokeStyle = HERON_L;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, cy - 2);
  if (dive) ctx.lineTo(hx, hy);
  else ctx.bezierCurveTo(w * 0.36, cy - h * 0.02, w * 0.1, cy - h * 0.24, hx, hy);
  ctx.stroke();
  ctx.fillStyle = HERON_L;
  circle(ctx, hx, hy, 6);
  ctx.strokeStyle = INKC; // the black plume
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx - 2, hy - 4);
  ctx.quadraticCurveTo(hx - 10, hy - 8, hx - 18, hy - 4 + flap * 2);
  ctx.stroke();
  ctx.fillStyle = '#e8b040'; // the bill
  ctx.beginPath();
  ctx.moveTo(hx + 4, hy - 2);
  ctx.lineTo(hx + 24, hy + (dive ? 6 : 1));
  ctx.lineTo(hx + 4, hy + 2.5);
  ctx.closePath();
  ctx.fill();
  birdEye(ctx, hx + 1, hy - 1, 2.1, dying);
  wing(false);
  ctx.restore();
  return body;
}

export const GROVE_MOB_ART = { fen_newt: drawFenNewt, will_wisp: drawWillWisp, reed_stalker: drawReedStalker, willow_wight: drawWillowWight, marsh_heron: drawMarshHeron };

// ——— gear for players ———
// Long-Neck's Bill: a long straight blade of grey bog-iron drawn to a point like a heron's bill, a grip wrapped in grey
// feathers' quills
function drawHeronBill(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(200,215,235,0.85)';
    ctx.shadowBlur = 10;
  }
  const g = ctx.createLinearGradient(-4, 0, 4, 0);
  g.addColorStop(0, '#6e727c');
  g.addColorStop(0.5, '#c8ccd4');
  g.addColorStop(1, '#8a8e98');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3.6, -L * 0.28);
  ctx.lineTo(-1.6, -L * 0.9);
  ctx.lineTo(0, -L * 1.02); // the bill's point
  ctx.lineTo(1.6, -L * 0.9);
  ctx.lineTo(3.6, -L * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.3);
  ctx.lineTo(0, -L * 0.96);
  ctx.stroke();
  ctx.fillStyle = '#e8b040'; // a yellow band near the point, the bill's colour
  ctx.fillRect(-1.8, -L * 0.86, 3.6, 3);
  ctx.fillStyle = '#4e525a'; // the guard, swept like folded wings
  ctx.beginPath();
  ctx.moveTo(-10, -L * 0.26);
  ctx.quadraticCurveTo(0, -L * 0.32, 10, -L * 0.26);
  ctx.lineTo(8, -L * 0.24);
  ctx.quadraticCurveTo(0, -L * 0.28, -8, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HERON_D; // the grip, wound with quills
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.25, 5.2, L * 0.25, 2);
  ctx.fill();
  ctx.strokeStyle = HERON_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.23; y < 0; y += 3.2) {
    ctx.moveTo(-2.6, y);
    ctx.lineTo(2.6, y + 1.4);
  }
  ctx.stroke();
  ctx.restore();
}
export const GROVE_SWORDS = { heron_bill: drawHeronBill };
export const GROVE_SWORD_LEN = { heron_bill: 68 };

// The Wight Crown: drowned willow root grown round and round itself, black and slick, a pale frond or two hanging
function drawWightCrown(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.5;
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.quadraticCurveTo(0, by - 6, rx, by + 4);
  ctx.stroke();
  ctx.strokeStyle = BARK_L;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const x = -rx * 0.8 + i * rx * 0.4;
    ctx.moveTo(x, by + 2);
    ctx.quadraticCurveTo(x + (i % 2 ? 6 : -6), by - 14, x + (i - 2) * 2, by - 18 - (i % 2) * 6);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(170,240,150,0.7)';
  for (let i = 0; i < 5; i++) circle(ctx, -rx * 0.8 + i * rx * 0.4 + (i - 2) * 2, by - 19 - (i % 2) * 6, 1.6);
  ctx.strokeStyle = WILLOW;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(rx * 0.7, by + 2);
  ctx.quadraticCurveTo(rx * 0.95, by + 14, rx * 0.9, by + 22);
  ctx.moveTo(-rx * 0.6, by + 3);
  ctx.quadraticCurveTo(-rx * 0.85, by + 12, -rx * 0.8, by + 18);
  ctx.stroke();
}
// The Heron Crest: a close grey cap with two long black plumes swept back from the crown
function drawHeronCrest(ctx, w, h) {
  const by = -h * 0.64, rx = w * 0.52;
  ctx.fillStyle = HERON;
  ctx.strokeStyle = '#4e525a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.5, rx * 1.04, by - h * 0.5, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = HERON_L; // a white band over the brow
  ctx.beginPath();
  ctx.roundRect(-rx * 0.96, by - 2, rx * 1.92, 7, 3);
  ctx.fill();
  ctx.strokeStyle = INKC; // the plumes
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.1, by - h * 0.32);
  ctx.quadraticCurveTo(-rx * 0.8, by - h * 0.5, -rx * 1.7, by - h * 0.3);
  ctx.moveTo(-rx * 0.2, by - h * 0.28);
  ctx.quadraticCurveTo(-rx * 0.9, by - h * 0.4, -rx * 1.6, by - h * 0.16);
  ctx.stroke();
}
export const GROVE_HELMETS = { wight_crown: drawWightCrown, heron_crest: drawHeronCrest };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconNewtTail(ctx) {
  ctx.save();
  ctx.fillStyle = '#5a6a40';
  ctx.strokeStyle = '#2a321e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.quadraticCurveTo(2, -10, 11, 6);
  ctx.quadraticCurveTo(0, -2, -10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff9a3a';
  for (const [x, y] of [[-5, -2], [0, -3], [5, 0]]) circle(ctx, x, y, 1.5);
  ctx.restore();
}
function iconWispLight(ctx) {
  ctx.save();
  ctx.fillStyle = `rgba(${WISP},0.3)`;
  circle(ctx, 0, 0, 12);
  ctx.fillStyle = '#c8b890'; // a stoppered reed
  ctx.beginPath();
  ctx.roundRect(-4, -10, 8, 20, 3);
  ctx.fill();
  ctx.fillStyle = '#dff4ff';
  ellipse(ctx, 0, 1, 2.6, 5);
  ctx.fillStyle = '#7a6440';
  ctx.fillRect(-4.5, -12, 9, 3);
  ctx.restore();
}
function iconStalkerPlume(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = REEDG;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(6, -2, 0, 13);
  ctx.quadraticCurveTo(-6, -2, 0, -13);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,64,34,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -9; y < 10; y += 4) {
    ctx.moveTo(-4, y);
    ctx.lineTo(4, y + 2);
  }
  ctx.moveTo(0, -13);
  ctx.lineTo(0, 14);
  ctx.stroke();
  ctx.restore();
}
function iconWightBark(ctx) {
  ctx.save();
  ctx.fillStyle = BARK;
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-11, 6);
  ctx.quadraticCurveTo(-8, -10, 6, -10);
  ctx.quadraticCurveTo(12, -4, 9, 8);
  ctx.quadraticCurveTo(0, 4, -11, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20,16,14,0.6)';
  ctx.beginPath();
  ctx.moveTo(-6, 4); ctx.lineTo(-2, -7);
  ctx.moveTo(0, 4); ctx.lineTo(3, -8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.7)';
  ellipse(ctx, -2, 5, 5, 2);
  ctx.restore();
}
function iconHeronFeather(ctx) {
  ctx.save();
  ctx.rotate(0.6);
  ctx.fillStyle = HERON;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(6, -2, 1, 13);
  ctx.quadraticCurveTo(-5, -2, 0, -14);
  ctx.fill();
  ctx.fillStyle = HERON_L;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(5, -2, 1, 13);
  ctx.lineTo(1, -2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4e525a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(1, 14);
  ctx.stroke();
  ctx.restore();
}
function iconNestStone(ctx) {
  ctx.save();
  ctx.fillStyle = '#8a8e96';
  ctx.strokeStyle = '#4e525a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 1, 11, 8, -0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, -4, -2, 4, 2, -0.3);
  ctx.fillStyle = 'rgba(200,215,235,0.2)';
  circle(ctx, 0, 1, 14);
  ctx.restore();
}
export const GROVE_ICONS = { newt_tail: iconNewtTail, wisp_light: iconWispLight, stalker_plume: iconStalkerPlume, wight_bark: iconWightBark, heron_feather: iconHeronFeather, nest_stone: iconNestStone };
