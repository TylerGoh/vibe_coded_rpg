// Docs: docs/places/skydocks.md, docs/art.md
// The Skydocks camp's art that isn't the room itself (src/skycamp.js): what its three visitors wear (drawCampDress,
// called by src/slime.js for their NPCS `accessory`: Pilot Kestrel's 'aeronaut', Pilgrim Ione's 'pilgrim', Tamp's
// 'tinker', and the Dockwarden's 'porter' out on the Skydocks, Phase 6 (c)) and Kestrel's own gear for players (CAMP_HELMETS: the Aeronaut's Goggles, through field.js).
// Slime space: the body sits on y = 0 and reaches up to -h, facing right; fx is the face's centre x.
import { TAU, circle, ellipse } from './util.js';

const LEATHER = '#7a5038', LEATHER_D = '#4e3222', BRASS = '#c9a24a', BRASS_D = '#8a6a2a';

// A padded leather flying cap with ear-flaps and brass goggles pushed up on it (shared by Kestrel and the item)
function flyingCap(ctx, w, h) {
  const by = -h * 0.7, rx = w * 0.52;
  ctx.fillStyle = LEATHER;
  ctx.strokeStyle = LEATHER_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.04, by + 10);
  ctx.bezierCurveTo(-rx * 1.08, by - h * 0.5, rx * 1.08, by - h * 0.5, rx * 1.04, by + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#9a6a4a'; // the padding's seams
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const k of [-0.5, 0, 0.5]) {
    ctx.moveTo(rx * k, by + 6);
    ctx.quadraticCurveTo(rx * k * 0.8, by - h * 0.2, rx * k * 0.3, by - h * 0.34);
  }
  ctx.stroke();
  for (const s of [-1, 1]) { // ear-flaps and their ties
    ctx.fillStyle = LEATHER;
    ctx.beginPath();
    ctx.roundRect(s * rx * 0.98 - 6, by + 4, 12, 18, 6);
    ctx.fill();
    ctx.strokeStyle = LEATHER_D;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.98, by + 22);
    ctx.lineTo(s * rx * 0.9, by + 30);
    ctx.stroke();
  }
  // the goggles, pushed up on the cap
  const gy = by - 4;
  ctx.strokeStyle = LEATHER_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.02, gy);
  ctx.lineTo(rx * 1.02, gy);
  ctx.stroke();
  for (const x of [-rx * 0.34, rx * 0.34]) {
    ctx.fillStyle = BRASS_D;
    circle(ctx, x, gy, 7.5);
    ctx.fillStyle = BRASS;
    circle(ctx, x, gy, 6.2);
    ctx.fillStyle = '#9fd0e8';
    circle(ctx, x, gy, 4.4);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circle(ctx, x - 1.6, gy - 1.6, 1.4);
  }
}

// ——— the camp's people ———
export function drawCampDress(ctx, kind, w, h, fx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'aeronaut') {
    // Pilot Kestrel: the flying cap, a long red scarf streaming off behind in the wind, a brass whistle on a cord
    const sw = Math.sin(t * 5) * 3;
    ctx.fillStyle = '#c84a4a';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.28);
    ctx.quadraticCurveTo(-w * 0.8, -h * 0.4 + sw, -w * 1.2, -h * 0.3 + sw * 1.5);
    ctx.lineTo(-w * 1.16, -h * 0.2 + sw * 1.5);
    ctx.quadraticCurveTo(-w * 0.8, -h * 0.26 + sw, -w * 0.2, -h * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e06060';
    ctx.beginPath();
    ctx.roundRect(-w * 0.46, -h * 0.3, w * 0.92, 9, 4);
    ctx.fill();
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx - 6, -h * 0.22);
    ctx.lineTo(fx + 2, -h * 0.1);
    ctx.stroke();
    ctx.fillStyle = BRASS;
    ctx.fillRect(fx, -h * 0.12, 8, 3);
    flyingCap(ctx, w, h);
  } else if (kind === 'pilgrim') {
    // Pilgrim Ione: a deep violet hood and a travel-worn cloak, and a small lantern held out in front, always lit
    ctx.fillStyle = '#5e4a7a';
    ctx.strokeStyle = '#3a2c4e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, -h * 0.2);
    ctx.bezierCurveTo(-w * 0.7, -h * 1.15, w * 0.7, -h * 1.15, w * 0.62, -h * 0.2);
    ctx.quadraticCurveTo(w * 0.4, -h * 0.62, 0, -h * 0.7);
    ctx.quadraticCurveTo(-w * 0.4, -h * 0.62, -w * 0.62, -h * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a6498'; // the hood's lining at the rim
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.66, w * 0.46, h * 0.12, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#c8b8d8'; // a wooden pilgrim's token on a cord
    circle(ctx, fx - 2, -h * 0.16, 3.4);
    // the lantern, out front, swaying a touch
    const lx = fx + w * 0.62, ly = -h * 0.34 + Math.sin(t * 1.6) * 1.5;
    ctx.strokeStyle = '#4a3c40';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(lx, ly - 14);
    ctx.lineTo(lx, ly - 8);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,220,150,${0.25 + 0.1 * Math.sin(t * 3)})`;
    circle(ctx, lx, ly, 14);
    ctx.fillStyle = '#4a3c40';
    ctx.beginPath();
    ctx.roundRect(lx - 6, ly - 8, 12, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#ffe2a0';
    ctx.beginPath();
    ctx.roundRect(lx - 4, ly - 5, 8, 10, 2);
    ctx.fill();
  } else if (kind === 'tinker') {
    // Tamp: an old forge hand's leather apron with a hammer in its loop, a jeweller's loupe in one eye, grey whiskers
    ctx.fillStyle = '#6a4a36';
    ctx.strokeStyle = '#3e2a1e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.34);
    ctx.lineTo(w * 0.42, -h * 0.34);
    ctx.lineTo(w * 0.5, -2);
    ctx.lineTo(-w * 0.5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a8490'; // the hammer in its loop
    ctx.fillRect(w * 0.18, -h * 0.26, 12, 5);
    ctx.fillStyle = '#9a7048';
    ctx.fillRect(w * 0.23, -h * 0.26, 3, 16);
    ctx.fillStyle = '#d0ccc8'; // whiskers
    for (const s of [-1, 1]) ellipse(ctx, fx + s * 9, -h * 0.4, 6, 2.6, s * 0.3);
    ctx.fillStyle = '#2e2a30'; // the loupe, in the eye nearer us
    circle(ctx, fx + 7, -h * 0.52, 6);
    ctx.fillStyle = '#a8c8d8';
    circle(ctx, fx + 7, -h * 0.52, 4);
    ctx.fillStyle = '#6a6470'; // a flat cap, soot-dark
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.9, w * 0.5, h * 0.14, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(0, -h * 0.92, w * 0.62, 4);
  } else if (kind === 'porter') {
    // The Dockwarden: a brass porter automaton (a brass-hued slime): rivets round its middle and verdigris at the seams,
    // one lens over the eye nearer us glowing pale blue, a navy porter's cap with a brass badge bolted on, and a fat
    // ledger held open in front, a pen ticking down its columns
    ctx.strokeStyle = 'rgba(70,140,120,0.55)'; // the seams, gone green
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.42, w * 0.47, h * 0.1, 0, 0.1, Math.PI - 0.1);
    ctx.stroke();
    ctx.fillStyle = BRASS_D; // rivets
    for (let i = -3; i <= 3; i++) circle(ctx, i * w * 0.13, -h * 0.34 + Math.abs(i) * 1.6, 2);
    ctx.fillStyle = '#2e2a30'; // the lens
    circle(ctx, fx + 7, -h * 0.55, 7.5);
    ctx.fillStyle = `rgba(150,220,255,${0.75 + 0.2 * Math.sin(t * 2)})`;
    circle(ctx, fx + 7, -h * 0.55, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, fx + 5.5, -h * 0.57, 1.5);
    // the cap: a navy crown, a stiff black peak to the front, a brass badge
    ctx.fillStyle = '#2e3a5e';
    ctx.strokeStyle = '#1c2440';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-w * 0.4, -h * 1.02, w * 0.8, h * 0.2, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1c1c24';
    ctx.beginPath();
    ctx.ellipse(w * 0.3, -h * 0.82, w * 0.24, 4, 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = BRASS;
    circle(ctx, w * 0.06, -h * 0.92, 4.2);
    ctx.fillStyle = BRASS_D;
    circle(ctx, w * 0.06, -h * 0.92, 2);
    // the ledger, held open in front, and the pen
    const lx = fx + w * 0.34, ly = -h * 0.26;
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath();
    ctx.roundRect(lx - 16, ly - 9, 32, 18, 2);
    ctx.fill();
    ctx.fillStyle = '#efe6cc';
    ctx.fillRect(lx - 14, ly - 7, 13, 14);
    ctx.fillRect(lx + 1, ly - 7, 13, 14);
    ctx.strokeStyle = 'rgba(80,70,90,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let r = 0; r < 4; r++) {
      ctx.moveTo(lx - 12, ly - 4 + r * 3.4);
      ctx.lineTo(lx - 3, ly - 4 + r * 3.4);
      ctx.moveTo(lx + 3, ly - 4 + r * 3.4);
      ctx.lineTo(lx + 12, ly - 4 + r * 3.4);
    }
    ctx.stroke();
    const pk = (t * 1.5) % 1; // the pen, ticking down a column
    ctx.strokeStyle = '#2e2a30';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(lx + 6, ly - 4 + pk * 10);
    ctx.lineTo(lx + 14, ly - 14 + pk * 10);
    ctx.stroke();
  }
  ctx.restore();
}

// ——— Kestrel's gear for players ———
function drawAeronautGoggles(ctx, w, h) {
  ctx.save();
  flyingCap(ctx, w, h);
  ctx.restore();
}
export const CAMP_HELMETS = { aeronaut_goggles: drawAeronautGoggles };
