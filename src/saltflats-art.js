// Docs: docs/places/saltflats.md, docs/combat/stages.md, docs/combat/items.md
// The Salt Flats' art that isn't the room itself (src/saltflats.js; atlas Phase 9, A2): its creatures (salt crab, brine
// slime, flat gull, wreck hermit; SFLATS_MOB_ART, called by drawMob in src/field.js), the gear of the place (Kesh's Skiff
// Gaff and Sailcloth Hood off her jetty, the wreck hermit's rare Prow Helm, the Netwife's Needle and her Saltnet Veil:
// SFLATS_SWORDS, SFLATS_HELMETS; the staves and bows are src/staff-art.js's and src/bow-art.js's) and its materials' icons,
// the Netwife's Knot among them (SFLATS_ICONS). Salt white, bleached boat-wood, old paint, tarred twine; soft and rounded.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const INKC = '#3a2e2a';
const SALT = '#f6f2ea', SALT_D = '#cfc6b4', SALT_S = '#a89c86';
const WOOD = '#b89a76', WOOD_D = '#7a5e44', WOOD_L = '#d8c2a0';
const PAINT = ['#3e6a8a', '#b8583a', '#4a7a5a', '#d8a84a'];
const TWINE = '#c8b48a', TWINE_D = '#8a7a5a';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC } = {}) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.8) < 0.12;
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
      ctx.fillStyle = col;
    }
  }
}
// salt crystals crusted on a shape: little white cubes scattered over a region
function crust(ctx, x0, y0, x1, y1, n, seed) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < n; i++) {
    const a = Math.sin(seed * 12.9 + i * 78.2) * 43758.5, b = Math.sin(seed * 39.3 + i * 11.7) * 24634.6;
    const fx = x0 + (a - Math.floor(a)) * (x1 - x0), fy = y0 + (b - Math.floor(b)) * (y1 - y0), s = 1.3 + ((a * 7) % 1) * 1.6;
    ctx.fillRect(fx - s / 2, fy - s / 2, s, s);
  }
}

// Salt crab: an old harbour crab left high and dry, its shell crusted white with salt so thick it squeaks, scuttling
// sideways on its toes, claws up
function drawSaltCrab(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = live && m?.walking;
  const sc = walk ? Math.sin(t * 14 + seed) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.46, w * 0.4, h * 0.3, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(40,30,20,0.25)';
  ellipse(ctx, 0, 0, w * 0.42, 4);
  ctx.strokeStyle = '#c87a5a'; // legs, four a side, scuttling
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const k = i % 2 ? sc : -sc;
    for (const s of [-1, 1]) {
      const bx = s * w * (0.18 + i * 0.05), lx = s * w * (0.34 + i * 0.06);
      ctx.moveTo(bx, -h * 0.34);
      ctx.quadraticCurveTo(lx, -h * 0.5 + k * 3, lx + s * 6, -1 + k * 2);
    }
  }
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -h * 0.8, 0, -h * 0.16);
  g.addColorStop(0, '#f0c0a0');
  g.addColorStop(1, '#c86a4a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#8a4a32';
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save(); // the salt crusted over its back
  body();
  ctx.clip();
  ctx.fillStyle = 'rgba(246,242,234,0.85)';
  ellipse(ctx, -w * 0.04, -h * 0.66, w * 0.34, h * 0.18);
  crust(ctx, -w * 0.34, -h * 0.76, w * 0.3, -h * 0.5, 14, seed);
  ctx.restore();
  // claws, up and snapping
  const snap = live ? Math.abs(Math.sin(t * 5 + seed)) : 0;
  for (const s of [-1, 1]) {
    const cx = s * w * 0.42, cy = -h * 0.78;
    ctx.fillStyle = '#d87a5a';
    ctx.strokeStyle = '#8a4a32';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 8, 6, s * 0.4, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SALT;
    ctx.beginPath();
    ctx.moveTo(cx + s * 4, cy - 2);
    ctx.lineTo(cx + s * 12, cy - 6 - snap * 4);
    ctx.lineTo(cx + s * 8, cy + 1);
    ctx.closePath();
    ctx.fill();
  }
  // eyes on stalks
  ctx.strokeStyle = '#8a4a32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, -h * 0.7);
  ctx.lineTo(w * 0.1, -h * 0.9);
  ctx.moveTo(w * 0.22, -h * 0.68);
  ctx.lineTo(w * 0.24, -h * 0.88);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  circle(ctx, w * 0.1, -h * 0.92, 3.4);
  circle(ctx, w * 0.24, -h * 0.9, 3.4);
  eyes(ctx, w * 0.17, -h * 0.91, 7, t, seed, { dying, size: 0.6 });
  ctx.restore();
  return body;
}

// Brine slime: the last of the sea gone thick and bitter, a squat pink-grey slime with salt drying white round its rim and
// little cubes of it standing up on top; it leaves a stinging crust behind it (`trail`)
function drawBrineSlime(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const sq = live ? Math.sin(t * 4 + seed) * 0.05 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, 0);
    ctx.bezierCurveTo(-w * 0.5, -h * (1.05 + sq), w * 0.5, -h * (1.05 + sq), w * 0.46, 0);
    ctx.closePath();
  };
  ctx.save();
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, 'rgba(232,206,206,0.95)');
  g.addColorStop(1, 'rgba(176,140,150,0.95)');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#8a6a72';
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; // the sheen
  ellipse(ctx, -w * 0.16, -h * 0.66, w * 0.14, h * 0.12);
  ctx.fillStyle = 'rgba(246,242,234,0.9)'; // salt drying white round its rim
  ctx.fillRect(-w * 0.5, -h * 0.14, w, h * 0.16);
  crust(ctx, -w * 0.42, -h * 0.2, w * 0.42, -h * 0.04, 10, seed + 3);
  ctx.restore();
  crust(ctx, -w * 0.22, -h * 0.84, w * 0.22, -h * 0.74, 6, seed); // cubes standing on top
  eyes(ctx, w * 0.12, -h * 0.5, 6, t, seed, { dying, col: '#4a2e36' });
  if (live) { // a bitter little frown
    ctx.strokeStyle = '#4a2e36';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(w * 0.12, -h * 0.26, 4, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// Flat gull: a big grey-and-white gull with long flat wings, gliding on the hot air over the flats, head down, watching; it
// tucks its wings and drops (`dive`: m.warn, then m.charging)
function drawFlatGull(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, dive = !!m?.charging && live;
  const flap = live ? (dive ? -0.6 : Math.sin(t * 2.4 + seed) * 0.25 - wk * 0.4) : 0.5;
  const cy = -h * 0.5;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.3, h * 0.2, dive ? 0.5 : 0, 0, TAU);
  };
  ctx.save();
  for (const s of [-1, 1]) { // the long flat wings, grey on top, black at the tips
    ctx.save();
    ctx.translate(-w * 0.02, cy - h * 0.04);
    ctx.rotate(flap * s * 0.6);
    ctx.fillStyle = s < 0 ? '#b8bcc4' : '#d0d4da';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.2, -h * 0.4 * (dive ? 0.3 : 1), -w * 0.62, -h * 0.1 * s);
    ctx.lineTo(-w * 0.5, h * 0.06);
    ctx.quadraticCurveTo(-w * 0.2, h * 0.04, 0, h * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a2a30';
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.07 * s);
    ctx.lineTo(-w * 0.62, -h * 0.1 * s);
    ctx.lineTo(-w * 0.52, h * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#f6f6f2';
  ctx.strokeStyle = '#8a8e96';
  ctx.lineWidth = 1.6;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f6f6f2'; // head
  circle(ctx, w * 0.26, cy - h * 0.12 + (dive ? 8 : 0), h * 0.16);
  ctx.fillStyle = '#e8b840'; // the yellow bill with its red spot
  ctx.beginPath();
  const bx = w * 0.36, by = cy - h * 0.1 + (dive ? 10 : 0);
  ctx.moveTo(bx, by - 3);
  ctx.lineTo(bx + 12, by + (dive ? 6 : 1));
  ctx.lineTo(bx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c83a2a';
  circle(ctx, bx + 6, by + 1.6, 1.4);
  eyes(ctx, w * 0.28, cy - h * 0.16 + (dive ? 8 : 0), 0, t, seed, { dying, size: 0.7 });
  ctx.fillStyle = '#8a8e96'; // tail
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, cy - 3);
  ctx.lineTo(-w * 0.44, cy - 6);
  ctx.lineTo(-w * 0.42, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return body;
}

// Wreck hermit: a hermit crab grown huge, wearing the prow of a beached boat for its shell, old paint and an eye painted
// on each side of it; it holds the prow's point toward you (`shell`: get round behind it), and on the strike it lunges
// with it (m.warn, m.charging)
function drawWreckHermit(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, ram = !!m?.charging && live;
  const step = live && m?.walking ? Math.sin(t * 6 + seed) * 2 : 0;
  const paint = PAINT[Math.floor(seed * 7) % PAINT.length];
  const lean = ram ? 0.08 : -wk * 0.08;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -h * 0.1);
    ctx.quadraticCurveTo(-w * 0.4, -h * 0.98, w * 0.1, -h * 0.94);
    ctx.lineTo(w * 0.48, -h * 0.3);
    ctx.lineTo(w * 0.2, -h * 0.08);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(40,30,20,0.25)';
  ellipse(ctx, 0, 0, w * 0.44, 4);
  ctx.strokeStyle = '#a85a3a'; // legs out from under the prow
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const bx = -w * 0.2 + i * w * 0.18, k = (i % 2 ? step : -step);
    ctx.moveTo(bx, -h * 0.16);
    ctx.quadraticCurveTo(bx + w * 0.06, -h * 0.06, bx + w * 0.1, -1 + k);
  }
  ctx.stroke();
  ctx.save();
  ctx.rotate(lean);
  // the prow: bleached planks curving up to a point, a band of old paint, a painted eye
  const g = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
  g.addColorStop(0, WOOD_D);
  g.addColorStop(0.5, WOOD_L);
  g.addColorStop(1, WOOD);
  ctx.fillStyle = g;
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.strokeStyle = 'rgba(122,94,68,0.55)'; // the planks
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    ctx.moveTo(-w * 0.5, -h * (0.1 + i * 0.17));
    ctx.quadraticCurveTo(0, -h * (0.18 + i * 0.17), w * 0.5, -h * (0.08 + i * 0.12));
  }
  ctx.stroke();
  ctx.fillStyle = paint; // a band of old paint, flaking
  ctx.globalAlpha = 0.75;
  ctx.fillRect(-w * 0.5, -h * 0.42, w, h * 0.1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(246,242,234,0.7)'; // salt crust on the planks
  ellipse(ctx, -w * 0.2, -h * 0.84, w * 0.18, h * 0.06);
  crust(ctx, -w * 0.36, -h * 0.9, w * 0.1, -h * 0.7, 10, seed);
  ctx.restore();
  // the painted eye on its side, to see the way home
  ctx.fillStyle = '#f6f2ea';
  ellipse(ctx, w * 0.18, -h * 0.6, 9, 6);
  ctx.fillStyle = '#26303e';
  circle(ctx, w * 0.2, -h * 0.6, 3.4);
  ctx.strokeStyle = '#b8583a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(w * 0.18, -h * 0.6, 10, 7, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  // the hermit itself peeping out under the prow: a red claw and a pair of eyes
  ctx.fillStyle = '#c86a4a';
  ctx.beginPath();
  ctx.ellipse(w * 0.3, -h * 0.16, 10, 7, -0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  circle(ctx, w * 0.16, -h * 0.2, 3.6);
  circle(ctx, w * 0.26, -h * 0.22, 3.6);
  eyes(ctx, w * 0.21, -h * 0.21, 5, t, seed, { dying, size: 0.6 });
  if (wk > 0 && live) { // its eyes narrow on the wind-up
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.12, -h * 0.25);
    ctx.lineTo(w * 0.3, -h * 0.27);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}
export const SFLATS_MOB_ART = { salt_crab: drawSaltCrab, brine_slime: drawBrineSlime, flat_gull: drawFlatGull, wreck_hermit: drawWreckHermit };

// ——— swords (the blade up along -y from the grip at 0) ———
// The Skiff Gaff: a boat-hook's iron gaff on a short ash haft, the curve filed to an edge
function drawSkiffGaff(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(220,240,255,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.strokeStyle = '#c8aa78'; // the ash haft
  ctx.lineWidth = 4.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.02);
  ctx.lineTo(0, -L * 0.72);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#6a6e78'; // the iron hook, filed bright along its inside curve
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.7);
  ctx.lineTo(0, -L * 0.9);
  ctx.quadraticCurveTo(1, -L * 1.02, 10, -L * 0.98);
  ctx.quadraticCurveTo(14, -L * 0.9, 8, -L * 0.82);
  ctx.stroke();
  ctx.strokeStyle = '#e8ecf0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(2, -L * 0.92);
  ctx.quadraticCurveTo(4, -L * 0.98, 10, -L * 0.95);
  ctx.stroke();
  ctx.fillStyle = '#3e4a7a'; // a lashing of tarred line and a blue bead
  ctx.fillRect(-3, -L * 0.72, 6, 6);
  circle(ctx, 3.4, -L * 0.66, 2.2);
  ctx.fillStyle = '#5a3a24';
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.24, 5.2, L * 0.22, 2);
  ctx.fill();
  ctx.restore();
}
// The Netwife's Needle: a netting needle as long as a sword, salt-white bone, the twine wound on it, a fork at the tip
function drawNetNeedle(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,250,236,0.9)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = SALT;
  ctx.strokeStyle = SALT_S;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4, -L * 0.24);
  ctx.lineTo(-4.4, -L * 0.86);
  ctx.quadraticCurveTo(0, -L * 1.04, 4.4, -L * 0.86);
  ctx.lineTo(4, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = SALT_S; // the tongue in the needle's eye
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.94);
  ctx.lineTo(0, -L * 0.72);
  ctx.stroke();
  ctx.strokeStyle = TWINE; // twine wound on it
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const y = -L * (0.36 + i * 0.035);
    ctx.moveTo(-4.2, y);
    ctx.lineTo(4.2, y - 2);
  }
  ctx.stroke();
  ctx.fillStyle = TWINE_D; // the fork at the butt and a grip of tarred line
  ctx.fillRect(-6, -L * 0.25, 12, 3);
  ctx.fillStyle = '#3a2e2a';
  ctx.beginPath();
  ctx.roundRect(-2.4, -L * 0.23, 4.8, L * 0.21, 2);
  ctx.fill();
  ctx.fillStyle = SALT;
  circle(ctx, 0, -L * 0.02, 3.4);
  ctx.restore();
}
export const SFLATS_SWORDS = { skiff_gaff: drawSkiffGaff, net_needle: drawNetNeedle };
export const SFLATS_SWORD_LEN = { skiff_gaff: 62, net_needle: 68 };

// ——— helmets (on a slime w × h, its top near -h * 0.66) ———
// The Sailcloth Hood: a hood cut from an ochre sail, an eyelet or two still in it, salt-stiff at the brim
function drawSailclothHood(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.56;
  ctx.fillStyle = '#d88a3a';
  ctx.strokeStyle = '#8a4a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 10);
  ctx.bezierCurveTo(-rx * 1.05, by - h * 0.56, rx * 0.9, by - h * 0.6, rx, by + 6);
  ctx.quadraticCurveTo(rx * 0.9, by + 14, rx * 0.4, by + 4);
  ctx.quadraticCurveTo(0, by - 2, -rx * 0.5, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,74,30,0.6)'; // a seam
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(-rx * 0.2, by - h * 0.4);
  ctx.quadraticCurveTo(0, by - h * 0.2, rx * 0.2, by);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#d8a84a'; // brass eyelets
  ctx.lineWidth = 1.6;
  for (const [x, y] of [[-rx * 0.6, by - h * 0.1], [-rx * 0.3, by - h * 0.34]]) {
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(246,242,234,0.8)'; // salt at the brim
  crust(ctx, -rx * 0.5, by - 1, rx * 0.8, by + 5, 8, 5);
}
// The Prow Helm: a fishing boat's carved prow hollowed out to fit, a painted eye on each side, a band of old paint
function drawProwHelm(ctx, w, h) {
  const by = -h * 0.64, rx = w * 0.54;
  const g = ctx.createLinearGradient(-rx, 0, rx, 0);
  g.addColorStop(0, WOOD_D);
  g.addColorStop(0.5, WOOD_L);
  g.addColorStop(1, WOOD);
  ctx.fillStyle = g;
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.quadraticCurveTo(-rx * 0.9, by - h * 0.5, rx * 0.3, by - h * 0.56);
  ctx.lineTo(rx * 1.2, by - h * 0.2);
  ctx.lineTo(rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3e6a8a';
  ctx.fillRect(-rx, by - h * 0.06, rx * 2.1, 5);
  ctx.fillStyle = '#f6f2ea';
  ellipse(ctx, rx * 0.4, by - h * 0.28, 6, 4);
  ctx.fillStyle = '#26303e';
  circle(ctx, rx * 0.44, by - h * 0.28, 2.4);
  ctx.strokeStyle = '#b8583a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(rx * 0.4, by - h * 0.28, 7, 5, 0, 0, TAU);
  ctx.stroke();
}
// The Saltnet Veil: a cap of the Netwife's finest mesh, stiff with salt, falling to the shoulders behind, a bone bead at
// every corner of the hem
function drawSaltnetVeil(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.58;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-rx, by + 14);
  ctx.bezierCurveTo(-rx * 1.06, by - h * 0.56, rx * 1.06, by - h * 0.56, rx, by + 14);
  ctx.closePath();
  ctx.fillStyle = 'rgba(246,242,234,0.25)';
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(232,224,204,0.95)'; // the mesh, diamonds
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let i = -6; i <= 6; i++) {
    ctx.moveTo(i * 7, by - h * 0.6);
    ctx.lineTo(i * 7 + 40, by + 20);
    ctx.moveTo(i * 7, by - h * 0.6);
    ctx.lineTo(i * 7 - 40, by + 20);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = SALT_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.quadraticCurveTo(0, by - 2, rx, by + 6);
  ctx.stroke();
  ctx.fillStyle = SALT;
  for (let i = 0; i < 7; i++) circle(ctx, -rx + (i / 6) * rx * 2, by + 8 - Math.sin((i / 6) * Math.PI) * 6, 2);
  ctx.fillStyle = '#9ad8d8'; // a sea-glass bead at the brow
  circle(ctx, 0, by - 4, 3);
}
export const SFLATS_HELMETS = { sailcloth_hood: drawSailclothHood, prow_helm: drawProwHelm, saltnet_veil: drawSaltnetVeil };

// ——— icons (centred, about 24 px across) ———
function iconSaltClaw(ctx) {
  ctx.save();
  ctx.fillStyle = '#d87a5a';
  ctx.strokeStyle = '#8a4a32';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-2, 2, 8, 6, -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -2);
  ctx.lineTo(10, -9);
  ctx.lineTo(7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SALT;
  ellipse(ctx, -3, 0, 5, 3);
  crust(ctx, -8, -2, 4, 5, 8, 2);
  ctx.restore();
}
function iconBrineCrust(ctx) {
  ctx.save();
  ctx.fillStyle = '#e8cccc';
  ctx.strokeStyle = '#a88a8a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-7, -5);
  ctx.lineTo(4, -7);
  ctx.lineTo(10, -1);
  ctx.lineTo(7, 7);
  ctx.lineTo(-5, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  crust(ctx, -7, -5, 7, 5, 10, 4);
  ctx.restore();
}
function iconGullQuill(ctx) {
  ctx.save();
  ctx.rotate(-0.7);
  ctx.fillStyle = '#d0d4da';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.quadraticCurveTo(6, -2, 1, 10);
  ctx.quadraticCurveTo(-5, -2, 0, -12);
  ctx.fill();
  ctx.fillStyle = '#2a2a30';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.quadraticCurveTo(3, -8, 3, -5);
  ctx.lineTo(-2, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a8e96';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(1, 12);
  ctx.stroke();
  ctx.restore();
}
function iconProwSplinter(ctx) {
  ctx.save();
  ctx.rotate(0.3);
  ctx.fillStyle = WOOD_L;
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-9, -6);
  ctx.lineTo(10, -3);
  ctx.lineTo(8, 5);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3e6a8a';
  ctx.fillRect(-9, -1, 18, 3);
  ctx.fillStyle = '#f6f2ea'; // half a letter
  ctx.fillRect(2, -5, 1.6, 4);
  ctx.fillRect(2, -5, 4, 1.4);
  ctx.restore();
}
function iconNetKnot(ctx) {
  ctx.save();
  ctx.strokeStyle = TWINE;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, -9);
  ctx.lineTo(-2, 0);
  ctx.moveTo(11, -9);
  ctx.lineTo(2, 0);
  ctx.moveTo(-11, 10);
  ctx.lineTo(-2, 2);
  ctx.moveTo(11, 10);
  ctx.lineTo(2, 2);
  ctx.stroke();
  ctx.fillStyle = SALT;
  ctx.strokeStyle = TWINE_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 1, 5, 4.4, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, -1);
  ctx.quadraticCurveTo(0, 4, 3, -1);
  ctx.stroke();
  crust(ctx, -9, -7, 9, 8, 6, 9);
  ctx.restore();
}
export const SFLATS_ICONS = { salt_claw: iconSaltClaw, brine_crust: iconBrineCrust, gull_quill: iconGullQuill, prow_splinter: iconProwSplinter, net_knot: iconNetKnot };
export { SALT, SALT_D, SALT_S, WOOD, WOOD_D, WOOD_L, PAINT, TWINE, TWINE_D, crust };
