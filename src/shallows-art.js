// Docs: docs/places/shallows.md, docs/combat/stages.md
// The Shallows' art that isn't the room itself (src/shallows.js; atlas Phase 8, L0): its creatures (lantern moth, bog
// slime, mire frog, mudskipper; SHALLOWS_MOB_ART, called by drawMob in src/field.js) and its materials' icons
// (SHALLOWS_ICONS). Lantern Fen's register: peat browns, reed golds, still dark water, violet dusk and small warm lights;
// soft and rounded as ever, a little eerie.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2e2a3a';
const PEAT = '#5a4636', PEAT_D = '#3a2c22', PEAT_L = '#7e6450';
const MIRE = '#6e8a4e', MIRE_D = '#465e30', MIRE_L = '#a8c070';
const MOTH = '#d8cfe6', MOTH_D = '#9a8eb4';
const GLOW = '255,214,150';

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

// Lantern moth: a soft grey-violet moth as big as a cat, furred, with feathery antennae and a warm light glowing in its
// belly through the fur. It drifts over the reeds and never hurts anyone; the fen folk say they're the dead's lanterns
// learning to fly.
function drawLanternMoth(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const flap = live ? 0.55 + Math.sin(t * 5 + seed) * 0.45 : 0.1;
  const cy = -h * 0.55, bob = live ? Math.sin(t * 2 + seed) * 2 : 0;
  ctx.save();
  ctx.translate(0, bob);
  const glow = live ? 0.5 + 0.2 * Math.sin(t * 2.4 + seed) : 0.15;
  const g = ctx.createRadialGradient(0, cy + 4, 2, 0, cy + 4, w * 0.7);
  g.addColorStop(0, `rgba(${GLOW},${0.45 * glow})`);
  g.addColorStop(1, `rgba(${GLOW},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-w * 0.7, cy - w * 0.7, w * 1.4, w * 1.4);
  const wing = (back) => {
    const span = w * (back ? 0.42 : 0.52) * (0.35 + flap * 0.65);
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, cy);
    ctx.bezierCurveTo(-span * 0.3, cy - h * 0.6, -span * 1.15, cy - h * 0.5, -span, cy - h * 0.06);
    ctx.quadraticCurveTo(-span * 0.7, cy + h * 0.24, -w * 0.04, cy + h * 0.06);
    ctx.closePath();
  };
  ctx.fillStyle = MOTH_D;
  wing(true);
  ctx.fill();
  ctx.fillStyle = MOTH;
  ctx.strokeStyle = MOTH_D;
  ctx.lineWidth = 1.2;
  wing(false);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(122,104,158,0.55)'; // an eye-spot on the near wing
  circle(ctx, -w * 0.3 * (0.35 + flap * 0.65), cy - h * 0.18, 4);
  ctx.fillStyle = '#efe6f6'; // the furred body
  ellipse(ctx, w * 0.08, cy + 2, w * 0.2, h * 0.26);
  ctx.fillStyle = `rgba(${GLOW},${0.8 * glow + 0.15})`; // the light in its belly
  ellipse(ctx, w * 0.06, cy + h * 0.12, w * 0.1, h * 0.1);
  ctx.strokeStyle = MOTH_D; // feathery antennae
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.22, cy - h * 0.14);
    ctx.quadraticCurveTo(w * 0.34, cy - h * 0.46 + s * 4, w * 0.3 + s * 6, cy - h * 0.6);
    ctx.stroke();
  }
  eyes(ctx, w * 0.22, cy - 2, 3.5, t, seed, { dying, size: 0.55 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy + bob, w * 0.5, h * 0.5, 0, 0, TAU);
  };
}

// Bog slime: a slime of the fen's own peat gone to jelly, dark brown and lumpy, a sprig of bog cotton on top and a
// little mud always sliding off it. Slow and heavy; it leaves a trail of stinging muck.
function drawBogSlime(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const sq = live ? Math.sin(t * 3 + seed) * 0.05 : -0.25 * Math.min(1, dying * 2);
  const W2 = w * (0.5 + sq * 0.5), H2 = h * (1 - sq);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-W2, 0);
    ctx.bezierCurveTo(-W2 * 1.05, -H2 * 0.7, -W2 * 0.5, -H2, 0, -H2);
    ctx.bezierCurveTo(W2 * 0.5, -H2, W2 * 1.05, -H2 * 0.7, W2, 0);
    ctx.closePath();
  };
  ctx.save();
  const g = ctx.createLinearGradient(0, -H2, 0, 0);
  g.addColorStop(0, PEAT_L);
  g.addColorStop(1, PEAT_D);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = 'rgba(30,22,16,0.35)'; // lumps of peat inside
  for (const [lx, ly, r] of [[-0.3, 0.35, 5], [0.25, 0.55, 4], [-0.05, 0.75, 3.5], [0.4, 0.25, 3]]) circle(ctx, W2 * lx, -H2 * ly, r);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; // a wet shine
  ellipse(ctx, -W2 * 0.4, -H2 * 0.7, W2 * 0.1, H2 * 0.14, -0.5);
  ctx.strokeStyle = MIRE_D; // the bog cotton on top
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2, -H2 + 1);
  ctx.lineTo(-4, -H2 - 9);
  ctx.moveTo(3, -H2 + 1);
  ctx.lineTo(6, -H2 - 7);
  ctx.stroke();
  ctx.fillStyle = '#f4f2ea';
  circle(ctx, -4, -H2 - 11, 3.2);
  circle(ctx, 6, -H2 - 9, 2.6);
  const drip = live ? (t * 0.7 + seed) % 1 : 0; // mud sliding off
  ctx.fillStyle = PEAT_D;
  ellipse(ctx, W2 * 0.6, -H2 * (0.45 - drip * 0.4), 2.4, 3.4 + drip * 2);
  eyes(ctx, W2 * 0.3, -H2 * 0.55, 5, t, seed, { dying, size: 0.9, glow: '#ffd88a' });
  ctx.restore();
  return body;
}

// Mire frog: a fat green-gold frog with a dark back and a pale throat that swells before it spits a gobbet of mud
// (the `lob` brain: m.warn), sitting on the lily flats
function drawMireFrog(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const hop = live && m.walking ? Math.abs(Math.sin(t * 6 + seed)) : 0;
  ctx.save();
  ctx.translate(0, -hop * 8);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.48, 0);
    ctx.bezierCurveTo(-w * 0.56, -h * 0.6, -w * 0.1, -h * 0.86, w * 0.22, -h * 0.82);
    ctx.bezierCurveTo(w * 0.5, -h * 0.76, w * 0.54, -h * 0.3, w * 0.4, 0);
    ctx.closePath();
  };
  ctx.fillStyle = MIRE_D; // the back legs, folded
  ellipse(ctx, -w * 0.32, -h * 0.12, w * 0.2, h * 0.16);
  const g = ctx.createLinearGradient(0, -h * 0.86, 0, 0);
  g.addColorStop(0, MIRE_D);
  g.addColorStop(0.5, MIRE);
  g.addColorStop(1, '#c8b860');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = MIRE_D;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = 'rgba(40,52,28,0.45)'; // spots
  for (const [sx, sy] of [[-0.2, 0.62], [0.02, 0.7], [-0.32, 0.4]]) circle(ctx, w * sx, -h * sy, 3.4);
  const swell = warn ? 0.5 + 0.5 * Math.abs(Math.sin(t * 14)) : 0; // the throat
  ctx.fillStyle = '#ecdcae';
  ellipse(ctx, w * 0.34, -h * 0.26, w * (0.12 + swell * 0.1), h * (0.12 + swell * 0.1));
  ctx.fillStyle = MIRE_L; // the front foot
  ellipse(ctx, w * 0.3, -2, w * 0.1, 3);
  ctx.strokeStyle = MIRE_D; // the mouth
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, -h * 0.46);
  ctx.quadraticCurveTo(w * 0.3, -h * 0.38, w * 0.46, -h * 0.46);
  ctx.stroke();
  for (const ex of [w * 0.04, w * 0.28]) { // eyes up on top, gold
    ctx.fillStyle = MIRE;
    circle(ctx, ex, -h * 0.82, 6.5);
    ctx.fillStyle = '#e8c860';
    circle(ctx, ex, -h * 0.83, 4.6);
    ctx.fillStyle = INKC;
    if (dying > 0.05) ctx.fillRect(ex - 3, -h * 0.84, 6, 1.6);
    else ctx.fillRect(ex - 2.6, -h * 0.85, 5.2, 2.4);
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.rect(-w * 0.5, -h - hop * 8, w, h);
  };
}

// Mudskipper: a goggle-eyed fish that walks on its fins across the mud, low and quick, a fan of a fin on its back that
// flicks up when it runs at you
function drawMudskipper(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const run = live && m.walking;
  const step = run ? Math.sin(t * 18 + seed) : 0;
  ctx.save();
  ctx.translate(0, -Math.abs(step) * 3);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.3);
    ctx.quadraticCurveTo(-w * 0.2, -h * 0.62, w * 0.3, -h * 0.66);
    ctx.quadraticCurveTo(w * 0.54, -h * 0.6, w * 0.5, -h * 0.26);
    ctx.quadraticCurveTo(w * 0.3, -h * 0.02, -w * 0.1, -h * 0.12);
    ctx.quadraticCurveTo(-w * 0.36, -h * 0.18, -w * 0.5, -h * 0.3);
    ctx.closePath();
  };
  ctx.fillStyle = '#8a7a5a'; // the dorsal fin, up when it runs
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, -h * 0.56);
  ctx.quadraticCurveTo(-w * 0.04, -h * (run ? 1.16 : 0.86), w * 0.14, -h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4e4630';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-w * 0.08 + i * w * 0.05, -h * 0.58);
    ctx.lineTo(-w * 0.06 + i * w * 0.05, -h * (run ? 1.04 : 0.8));
  }
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -h * 0.66, 0, -h * 0.1);
  g.addColorStop(0, '#7a6c50');
  g.addColorStop(1, '#c8b890');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#4e4630';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,200,230,0.6)'; // blue speckles
  for (const [sx, sy] of [[-0.25, 0.36], [0, 0.46], [0.18, 0.4], [-0.1, 0.28]]) circle(ctx, w * sx, -h * sy, 1.6);
  ctx.fillStyle = '#9a8a62'; // the tail
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, -h * 0.3);
  ctx.lineTo(-w * 0.62, -h * 0.5 + step * 3);
  ctx.lineTo(-w * 0.6, -h * 0.1 - step * 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a7a5a'; // the walking fins
  ellipse(ctx, w * 0.18 + step * 4, -h * 0.06, w * 0.1, h * 0.08, 0.3);
  ellipse(ctx, -w * 0.06 - step * 4, -h * 0.06, w * 0.08, h * 0.07, -0.3);
  for (const ex of [w * 0.22, w * 0.38]) { // goggle eyes on top of the head
    ctx.fillStyle = '#c8b890';
    circle(ctx, ex, -h * 0.72, 5);
    ctx.fillStyle = '#fff';
    circle(ctx, ex, -h * 0.74, 3.6);
    ctx.fillStyle = INKC;
    if (dying > 0.05) ctx.fillRect(ex - 2.5, -h * 0.75, 5, 1.4);
    else circle(ctx, ex + 1, -h * 0.74, 1.8);
  }
  ctx.restore();
  return body;
}

export const SHALLOWS_MOB_ART = { lantern_moth: drawLanternMoth, bog_slime: drawBogSlime, mire_frog: drawMireFrog, mudskipper: drawMudskipper };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconLampDust(ctx) {
  ctx.save();
  ctx.fillStyle = '#e8dcc0'; // a twist of reed paper
  ctx.beginPath();
  ctx.moveTo(-9, 8);
  ctx.quadraticCurveTo(-11, -4, 0, -8);
  ctx.quadraticCurveTo(11, -4, 9, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a89a78';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = `rgba(${GLOW},0.9)`;
  for (const [x, y] of [[-3, 0], [2, -3], [4, 3], [-1, 4], [0, -1]]) circle(ctx, x, y, 1.3);
  ctx.fillStyle = 'rgba(255,214,150,0.25)';
  circle(ctx, 0, 0, 9);
  ctx.restore();
}
function iconBogJelly(ctx) {
  ctx.save();
  ctx.fillStyle = PEAT;
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-11, 8);
  ctx.bezierCurveTo(-13, -4, -6, -10, 0, -10);
  ctx.bezierCurveTo(6, -10, 13, -4, 11, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, -4, -4, 2.4, 3.4, -0.5);
  ctx.fillStyle = 'rgba(30,22,16,0.4)';
  circle(ctx, 3, 2, 2.6);
  ctx.restore();
}
function iconMireSkin(ctx) {
  ctx.save();
  ctx.fillStyle = MIRE;
  ctx.strokeStyle = MIRE_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.quadraticCurveTo(0, -12, 10, -6);
  ctx.lineTo(12, 4);
  ctx.quadraticCurveTo(0, 12, -12, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(40,52,28,0.45)';
  for (const [x, y] of [[-4, -2], [3, 1], [6, -4], [-6, 4]]) circle(ctx, x, y, 1.8);
  ctx.restore();
}
function iconSkipperFin(ctx) {
  ctx.save();
  ctx.fillStyle = '#9a8a62';
  ctx.beginPath();
  ctx.moveTo(-8, 9);
  ctx.quadraticCurveTo(-10, -8, 8, -10);
  ctx.quadraticCurveTo(6, 2, 8, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4e4630';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(-6 + i * 3, 8);
    ctx.lineTo(-7 + i * 3.6, -6 + i * 0.6);
  }
  ctx.stroke();
  ctx.restore();
}
export const SHALLOWS_ICONS = { lamp_dust: iconLampDust, bog_jelly: iconBogJelly, mire_skin: iconMireSkin, skipper_fin: iconSkipperFin };
