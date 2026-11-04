// Docs: docs/places/skydocks.md, docs/combat/stages.md
// The Skydocks' art that isn't the room itself (src/skydocks.js): its creatures (loose bolt, rigging moth, mooring hook;
// SKYDOCKS_MOB_ART, called by drawMob in src/field.js) and its materials' icons (SKYDOCKS_ICONS). The Citadel's
// register: old brass gone green at the seams, iron, pale sailcloth, cold blue light; soft and rounded still.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const BRASS = '#c9a24a', BRASS_D = '#8a6a2a', BRASS_L = '#ecd28a';
const VERD = '#5e9c88';
const IRON = '#6e6878', IRON_D = '#3e3a48', IRON_L = '#9a94a4';
const SILK = '#e8e2d4', SILK_D = '#b8ae9c';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, glow = null } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = glow ?? INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.4) < 0.12;
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

// Loose bolt: one of the city's brass bolts shaken free, hex head up, hopping about on its threaded shank with a nut
// still wound halfway down it like a belt. Its face is on the head. They come in swarms.
function drawLooseBolt(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const hop = live && m.walking ? Math.abs(Math.sin(t * 11 + seed)) : 0;
  const tilt = live ? Math.sin(t * 11 + seed) * 0.12 : 0.6;
  ctx.save();
  ctx.translate(0, -hop * 6);
  ctx.rotate(tilt);
  const sw = w * 0.22, top = -h, headH = h * 0.34;
  // the shank, threaded
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(-sw / 2, top + headH - 2, sw, h - headH + 2);
  ctx.strokeStyle = BRASS_L;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = top + headH + 4; y < -2; y += 4) {
    ctx.moveTo(-sw / 2, y + 1.5);
    ctx.lineTo(sw / 2, y - 1.5);
  }
  ctx.stroke();
  // the nut, halfway down
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.3, -h * 0.36, w * 0.6, h * 0.14, 2);
  ctx.fill();
  ctx.stroke();
  // the hex head
  const head = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, top + headH);
    ctx.lineTo(-w * 0.46, top + 4);
    ctx.quadraticCurveTo(0, top - 3, w * 0.46, top + 4);
    ctx.lineTo(w * 0.5, top + headH);
    ctx.closePath();
  };
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1.6;
  head();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,106,42,0.6)'; // the hex's flats
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const k of [-0.18, 0.18]) {
    ctx.moveTo(w * k, top + 2);
    ctx.lineTo(w * k, top + headH);
  }
  ctx.stroke();
  ctx.fillStyle = VERD; // verdigris at the rim
  ctx.fillRect(-w * 0.48, top + headH - 3, w * 0.96, 3);
  eyes(ctx, w * 0.08, top + headH * 0.55, 4.5, t, seed, { dying, size: 0.6 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.rect(-w * 0.5, -h - hop * 6, w, h);
  };
}

// Rigging moth: a great pale moth that lives in the old sailcloth, its wings the same patched canvas with rope-like
// veins, a furred body and feathery antennae. Drifts on the wind, then folds and drops on you (the `dive` brain).
function drawRiggingMoth(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const flap = dive ? 0.15 : warn ? 0.35 : 0.55 + Math.sin(t * 7 + seed) * 0.45;
  const cy = -h * 0.55;
  ctx.save();
  if (dive) {
    ctx.translate(0, cy);
    ctx.rotate(0.7);
    ctx.translate(0, -cy);
  }
  const wing = (s, back) => {
    const span = w * (back ? 0.38 : 0.5) * (0.35 + flap * 0.65);
    ctx.save();
    ctx.translate(-w * 0.02, cy);
    ctx.scale(1, s);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-span * 0.3, -h * 0.55, -span * 1.1, -h * 0.5, -span, -h * 0.1);
    ctx.quadraticCurveTo(-span * 0.7, h * 0.12, 0, h * 0.04);
    ctx.closePath();
    ctx.restore();
  };
  // the far wings, darker
  ctx.fillStyle = SILK_D;
  wing(1, true);
  ctx.fill();
  // the near wings: canvas with rope veins and a patch
  ctx.fillStyle = SILK;
  ctx.strokeStyle = '#8a7e6a';
  ctx.lineWidth = 1.4;
  wing(1, false);
  ctx.fill();
  ctx.stroke();
  wing(-0.55, false);
  ctx.fill();
  ctx.stroke();
  const span = w * 0.5 * (0.35 + flap * 0.65);
  ctx.strokeStyle = 'rgba(138,126,106,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const k of [0.35, 0.65]) {
    ctx.moveTo(-w * 0.02, cy);
    ctx.quadraticCurveTo(-span * k, cy - h * 0.35, -span * (k + 0.2), cy - h * 0.22);
  }
  ctx.stroke();
  ctx.fillStyle = '#c8b898'; // a sailcloth patch, stitched
  ctx.fillRect(-span * 0.55, cy - h * 0.28, 8, 7);
  ctx.fillStyle = 'rgba(80,110,160,0.55)'; // an eye-spot, cold blue
  circle(ctx, -span * 0.7, cy - h * 0.2, 3.4);
  // the body: furred, banded
  const body = () => ctx.ellipse(w * 0.06, cy, w * 0.17, h * 0.15, 0, 0, TAU);
  ctx.fillStyle = '#d8ccb4';
  ctx.strokeStyle = '#8a7e6a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,126,106,0.6)';
  ctx.beginPath();
  for (const x of [-0.04, 0.04]) {
    ctx.moveTo(w * x, cy - h * 0.12);
    ctx.lineTo(w * x, cy + h * 0.12);
  }
  ctx.stroke();
  // the head and its feathery antennae
  ctx.fillStyle = '#e8dcc4';
  circle(ctx, w * 0.24, cy - h * 0.04, h * 0.13);
  ctx.strokeStyle = '#8a7e6a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const s of [-1, 1]) {
    const ax = w * 0.3 + s * 3, ay = cy - h * 0.16;
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(ax + 6, ay - h * 0.3, ax + 12 + s * 3, ay - h * 0.34);
    for (let i = 1; i <= 3; i++) {
      const px = ax + i * 3.4, py = ay - h * 0.1 * i;
      ctx.moveTo(px, py);
      ctx.lineTo(px + 3, py + 2);
    }
  }
  ctx.stroke();
  eyes(ctx, w * 0.27, cy - h * 0.05, 2.4, t, seed, { dying, size: 0.5, glow: warn || dive ? '#4a7ac0' : null });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(-w * 0.15, cy - h * 0.15, w * 0.3, h * 0.3, 0, 0, TAU);
  };
}

// Mooring hook: a cargo winch come loose from its pier, a squat iron drum on two cast feet, chain wound round it, and a
// short jib arm off its back with a great hook swinging on the end. Its face is a brass plate on the drum. It heaves
// itself up its own chain and slams down (the `stomp` brain): the hook swings back high as it crouches.
function drawMooringHook(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, walk = !!m.walking && live;
  const step = walk ? Math.sin(t * 6 + seed) : 0;
  const crouch = warn ? 5 : 0;
  const dr = w * 0.3, dy = -h * 0.36 + crouch; // the drum
  // feet
  ctx.fillStyle = IRON_D;
  for (const [x, s] of [[-0.22, 1], [0.2, -1]]) {
    ctx.beginPath();
    ctx.roundRect(w * x - 9, -8 - Math.max(0, step * s) * 4, 18, 8, 3);
    ctx.fill();
  }
  // the jib, off its back, with the hook on its chain
  const swing = warn ? -1.1 : Math.sin(t * 1.6 + seed) * 0.35;
  const jx = -w * 0.18, jy = dy - dr * 0.6, tipX = jx - w * 0.16, tipY = dy - h * 0.62;
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(jx, jy);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(swing);
  ctx.strokeStyle = IRON_L; // the chain
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 6 + i * 7, 2.5, 4, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = IRON_D; // the hook
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(0, 40);
  ctx.arc(-7, 40, 7, 0, Math.PI * 0.95);
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(-14, 40);
  ctx.lineTo(-17, 34);
  ctx.lineTo(-11, 38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // the drum, chain wound round it
  const drum = () => ctx.ellipse(0, dy, dr, h * 0.3, 0, 0, TAU);
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  drum();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    const x = i * dr * 0.32;
    ctx.moveTo(x - 3, dy - h * 0.27);
    ctx.lineTo(x + 3, dy + h * 0.27);
  }
  ctx.stroke();
  // the axle caps, brass gone green
  ctx.fillStyle = BRASS_D;
  circle(ctx, -dr * 0.92, dy, 6);
  ctx.fillStyle = VERD;
  circle(ctx, -dr * 0.92, dy, 3);
  // the face plate
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(w * 0.02, dy - h * 0.16, w * 0.3, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  for (const [x, y] of [[0.06, -0.12], [0.28, -0.12], [0.06, 0.05], [0.28, 0.05]]) circle(ctx, w * x, dy + h * y, 1.4);
  eyes(ctx, w * 0.17, dy - h * 0.05, 5, t, seed, { dying, size: 0.7, glow: warn ? '#ff8a4a' : null });
  return () => {
    ctx.beginPath();
    drum();
  };
}

export const SKYDOCKS_MOB_ART = { loose_bolt: drawLooseBolt, rigging_moth: drawRiggingMoth, mooring_hook: drawMooringHook };

// ——— materials ———
function iconStrayBolt(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(-3, -4, 6, 16);
  ctx.strokeStyle = BRASS_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -1; y < 12; y += 3) {
    ctx.moveTo(-3, y + 1);
    ctx.lineTo(3, y - 1);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(-8, -12, 16, 8, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function iconRiggingSilk(ctx) {
  ctx.fillStyle = SILK;
  ctx.strokeStyle = SILK_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 8, -0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,126,106,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const k of [-5, 0, 5]) {
    ctx.moveTo(-10, k + 2);
    ctx.quadraticCurveTo(0, k - 4, 10, k - 2);
  }
  ctx.stroke();
}
function iconMooringLink(ctx) {
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 12, 0.5, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 12, 0.5, -1.2, 0.2);
  ctx.stroke();
}
export const SKYDOCKS_ICONS = { stray_bolt: iconStrayBolt, rigging_silk: iconRiggingSilk, mooring_link: iconMooringLink };
