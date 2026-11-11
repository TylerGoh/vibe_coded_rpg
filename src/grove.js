// Docs: docs/places/grove.md
// The Drowned Grove (room GROVE, src/shared/rpg.js; atlas Phase 8, L1): the Fen's main trail on east from the Shallows'
// far end. A willow wood the mere came up into long ago: grey trunks standing in black water, their roots arched up out
// of it like ribs, fronds hanging to the surface, the light green and dim. West to east: the Drowned Gate (the end of
// the Shallows' boardwalk between two leaning willows, a waystone; no mobs), the Weeping Rows (willows in rows, as if
// someone once planted them; the Sunk Stone, a Keeper stone sunk to its shoulders: src/ruins.js), the Root Halls
// (roots in great arches; the Sunk Barrows' flooded passage, a gate: src/branch-gates.js), the Heronry (nest rocks and
// dead trees white with herons' droppings; Long-Neck's den door at HERON_DEN_X, drawn by dens.js), and at the far end
// the Lantern Causeway's sunk near end (a gate). The high crook of the oldest willow (last in GROVE_PLATFORMS) is the
// hidden spot: a heron's moulted feathers in it. The sky is Wickmere's (drawFenSky), dimmed green under the canopy.
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { GROVE_W, FIELD_GROUND, GROVE_PLATFORMS, GROVE_ZONES } from './shared/rpg.js';
import { drawFenSky } from './wickmere.js';
import { drawWater, drawReeds, drawOldBoardwalk } from './shallows.js';

const GROUND = FIELD_GROUND;
const GATE_END = GROVE_ZONES[0].x1, HERONRY = GROVE_ZONES[3];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const CROOK = GROVE_PLATFORMS.find((p) => p.kind === 'crook');
const BARK = '#3a3632', BARK_D = '#22201c', BARK_L = '#56504a';

const trunks = (() => {
  const r = mulberry32(7501);
  const out = [];
  for (let x = 40; x < GROVE_W; x += 180 + r() * 150) out.push({ x, w: 36 + r() * 30, lean: (r() - 0.5) * 0.14, back: r() < 0.55, p: r() * TAU });
  return out;
})();
const ribs = (() => { // root arches standing up out of the water between the trunks
  const r = mulberry32(7511);
  return Array.from({ length: 34 }, () => ({ x: GATE_END + r() * (GROVE_W - GATE_END - 200), w: 60 + r() * 90, h: 30 + r() * 60 }));
})();
const fronds = (() => {
  const r = mulberry32(7521);
  return Array.from({ length: 120 }, () => ({ x: r() * GROVE_W, len: 90 + r() * 200, p: r() * TAU, front: r() < 0.3 }));
})();
const clumps = (() => {
  const r = mulberry32(7531);
  return Array.from({ length: 40 }, () => ({ x: GATE_END + r() * (GROVE_W - GATE_END), h: 50 + r() * 60, n: 3 + Math.floor(r() * 5), back: r() < 0.6 }));
})();
const snags = (() => { // dead trees in the Heronry, white with droppings, a heron's nest of sticks in some
  const r = mulberry32(7541);
  return Array.from({ length: 6 }, (_, i) => ({ x: HERONRY.x0 + 200 + i * 260 + r() * 80, h: 180 + r() * 100, nest: r() < 0.6 }));
})();
const motes = (() => {
  const r = mulberry32(7551);
  return Array.from({ length: 70 }, () => ({ x: r() * GROVE_W, y: 120 + r() * 300, p: r() * TAU, v: 0.2 + r() * 0.4 }));
})();

// Everything in the Drowned Grove behind the slimes
export function drawGrove(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawFenSky(ctx, camX, time, GROVE_W, { causeway: false });
  const g = ctx.createLinearGradient(0, 0, 0, H); // under the canopy: green and dim
  g.addColorStop(0, 'rgba(22,34,26,0.82)');
  g.addColorStop(0.6, 'rgba(40,58,44,0.55)');
  g.addColorStop(1, 'rgba(30,40,32,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(30,44,34,0.8)'; // far trunks, in parallax
  for (let i = 0; i < 14; i++) {
    const x = ((((i * 173 - camX * 0.3) % 1400) + 1400) % 1400) - 200;
    ctx.fillRect(x, 0, 22 + (i % 3) * 8, GROUND - 20);
  }
  ctx.restore();
  const L = camX - 140, R = camX + viewW + 140;
  for (let i = 0; i < 6; i++) { // shafts of light
    const x = 300 + i * 870;
    if (!visible(x - 60, x + 160, L, R)) continue;
    ctx.fillStyle = `rgba(214,236,190,${0.05 + 0.02 * Math.sin(time * 0.5 + i)})`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 46, 0);
    ctx.lineTo(x + 140, GROUND);
    ctx.lineTo(x + 40, GROUND);
    ctx.closePath();
    ctx.fill();
  }
  for (const t of trunks) if (t.back && visible(t.x - 80, t.x + 80, L, R)) drawTrunk(ctx, t, true);
  for (const s of snags) if (visible(s.x - 80, s.x + 80, L, R)) drawSnag(ctx, s, time);
  for (const f of fronds) if (!f.front && visible(f.x - 20, f.x + 20, L, R)) drawFrond(ctx, f, time, false);
  for (const c of clumps) if (c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, true);
  drawWater(ctx, Math.max(0, L), Math.min(GROVE_W, R), time);
  ctx.fillStyle = 'rgba(40,58,44,0.35)'; // the water greener here, under the willows
  ctx.fillRect(Math.max(0, L), GROUND - 4, Math.min(GROVE_W, R) - Math.max(0, L), 60);
  if (visible(0, GATE_END, L, R)) drawGateEnd(ctx);
  for (const rb of ribs) if (visible(rb.x - 10, rb.x + rb.w + 10, L, R)) drawRib(ctx, rb);
  for (const t of trunks) if (!t.back && visible(t.x - 80, t.x + 80, L, R)) drawTrunk(ctx, t, false);
  for (const p of GROVE_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'root') drawRootArch(ctx, p);
    else if (p.kind === 'bough') drawBough(ctx, p, time);
    else if (p.kind === 'boardwalk') drawOldBoardwalk(ctx, p);
    else if (p.kind === 'nestrock') drawNestRock(ctx, p);
    else if (p.kind === 'crook') drawCrook(ctx);
  }
  for (const c of clumps) if (!c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, false);
  for (const mo of motes) { // seed fluff drifting in the shafts
    const x = mo.x + Math.sin(time * mo.v + mo.p) * 30, y = mo.y + Math.sin(time * mo.v * 1.4 + mo.p) * 16;
    if (x < L || x > R) continue;
    ctx.fillStyle = `rgba(240,244,226,${0.3 + 0.25 * Math.sin(time + mo.p)})`;
    circle(ctx, x, y, 1.4);
  }
}

// Fronds hanging in front of everything (drawn over the slimes, so the wood closes round you)
export function drawGroveFront(ctx, camX, viewW, time) {
  const L = camX - 40, R = camX + viewW + 40;
  for (const f of fronds) if (f.front && visible(f.x - 20, f.x + 20, L, R)) drawFrond(ctx, f, time, true);
}

// a grey willow trunk standing in the water, furrowed, a weed line where the water was higher once
function drawTrunk(ctx, t, back) {
  ctx.save();
  ctx.translate(t.x, GROUND);
  ctx.rotate(t.lean);
  ctx.fillStyle = back ? '#34403a' : BARK;
  ctx.beginPath();
  ctx.moveTo(-t.w * 0.8, 6);
  ctx.quadraticCurveTo(-t.w * 0.45, -24, -t.w * 0.4, -110);
  ctx.lineTo(-t.w * 0.34, -GROUND);
  ctx.lineTo(t.w * 0.34, -GROUND);
  ctx.lineTo(t.w * 0.4, -110);
  ctx.quadraticCurveTo(t.w * 0.45, -24, t.w * 0.8, 6);
  ctx.closePath();
  ctx.fill();
  if (!back) {
    ctx.strokeStyle = BARK_D;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(i * t.w * 0.13, 2);
      ctx.bezierCurveTo(i * t.w * 0.15 + 4, -120, i * t.w * 0.11 - 4, -260, i * t.w * 0.13, -GROUND);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(110,138,78,0.45)';
    ctx.fillRect(-t.w * 0.5, -54, t.w, 7);
    ctx.fillStyle = 'rgba(232,224,204,0.7)'; // a bracket of pale fungus
    ellipse(ctx, t.w * 0.3, -150, 10, 3);
    ellipse(ctx, t.w * 0.26, -142, 7, 2.4);
  }
  ctx.restore();
}

// a root arched up out of the water like a rib (not a platform: scenery)
function drawRib(ctx, rb) {
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rb.x, GROUND + 4);
  ctx.quadraticCurveTo(rb.x + rb.w * 0.5, GROUND - rb.h * 2, rb.x + rb.w, GROUND + 4);
  ctx.stroke();
  ctx.strokeStyle = BARK_L;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rb.x + 4, GROUND);
  ctx.quadraticCurveTo(rb.x + rb.w * 0.5, GROUND - rb.h * 2 + 4, rb.x + rb.w - 4, GROUND);
  ctx.stroke();
}

// a great root arching out of the water, flat along its top (a platform)
function drawRootArch(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = BARK;
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 24, GROUND + 4);
  ctx.quadraticCurveTo(x - 8, y + 6, x + 12, y);
  ctx.lineTo(x + w - 12, y);
  ctx.quadraticCurveTo(x + w + 8, y + 6, x + w + 24, GROUND + 4);
  ctx.lineTo(x + w - 2, GROUND + 4);
  ctx.quadraticCurveTo(x + w - 8, y + 22, x + w - 26, y + 16);
  ctx.lineTo(x + 26, y + 16);
  ctx.quadraticCurveTo(x + 8, y + 22, x + 2, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BARK_L;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(110,138,78,0.7)';
  for (let k = 0; k < 5; k++) ellipse(ctx, x + 16 + (k * (w - 32)) / 4, y - 3, 8, 2.4);
}

// a low bough out over the water (a platform), fronds hanging off it
function drawBough(ctx, p, time) {
  const { x, y, w } = p;
  ctx.strokeStyle = BARK;
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 50, y - 80);
  ctx.quadraticCurveTo(x - 4, y + 8, x + w * 0.4, y + 3);
  ctx.lineTo(x + w, y + 2);
  ctx.stroke();
  ctx.strokeStyle = BARK_L;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 1);
  ctx.lineTo(x + w - 4, y - 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(96,120,80,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < w / 14; i++) {
    const fx = x + 8 + i * 14, sw = Math.sin(time * 0.7 + i) * 3;
    ctx.moveTo(fx, y + 6);
    ctx.quadraticCurveTo(fx + sw, y + 34, fx + sw * 1.5, y + 56 + (i % 3) * 14);
  }
  ctx.stroke();
}

// a nest rock in the Heronry: a grey boulder out of the water, flat-topped, streaked white, a few sticks on it
function drawNestRock(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#6a6e68';
  ctx.strokeStyle = '#3e423c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 14, GROUND + 4);
  ctx.quadraticCurveTo(x - 10, y + 14, x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.quadraticCurveTo(x + w + 10, y + 14, x + w + 14, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,240,232,0.6)'; // streaked white
  for (let k = 0; k < 6; k++) {
    const sx = x + 12 + k * (w - 24) / 5;
    ctx.fillRect(sx, y + 2, 2.4, 10 + (k * 7) % 14);
  }
  ctx.strokeStyle = '#5a4a36'; // a few sticks
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y - 2); ctx.lineTo(x + w * 0.55, y - 6);
  ctx.moveTo(x + w * 0.45, y - 1); ctx.lineTo(x + w * 0.7, y - 4);
  ctx.stroke();
}

// a dead tree in the Heronry, bare and white with droppings, maybe a heron's nest of sticks up in its fork
function drawSnag(ctx, s, time) {
  ctx.strokeStyle = '#6a6862';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s.x, GROUND);
  ctx.lineTo(s.x + 6, GROUND - s.h);
  ctx.moveTo(s.x + 4, GROUND - s.h * 0.6);
  ctx.lineTo(s.x + 50, GROUND - s.h * 0.86);
  ctx.moveTo(s.x + 5, GROUND - s.h * 0.75);
  ctx.lineTo(s.x - 36, GROUND - s.h * 0.95);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,240,232,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x + 2, GROUND - s.h * 0.4);
  ctx.lineTo(s.x + 5, GROUND - s.h * 0.9);
  ctx.stroke();
  if (s.nest) {
    ctx.fillStyle = '#4a3e30';
    ellipse(ctx, s.x + 6, GROUND - s.h * 0.62, 26, 9);
    ctx.strokeStyle = '#6a5a44';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.moveTo(s.x - 20 + i * 8, GROUND - s.h * 0.62 - 4);
      ctx.lineTo(s.x - 12 + i * 8, GROUND - s.h * 0.62 + 6);
    }
    ctx.stroke();
  }
}

// a frond hanging from above, swaying (front ones dark, over the slimes)
function drawFrond(ctx, f, time, front) {
  const sw = Math.sin(time * 0.6 + f.p) * 6, len = front ? f.len * 0.7 : f.len;
  ctx.strokeStyle = front ? 'rgba(30,40,30,0.8)' : 'rgba(96,120,80,0.55)';
  ctx.lineWidth = front ? 2.4 : 1.4;
  ctx.beginPath();
  ctx.moveTo(f.x, -4);
  ctx.quadraticCurveTo(f.x + sw * 0.5, len * 0.5, f.x + sw, len);
  ctx.stroke();
  ctx.fillStyle = front ? 'rgba(36,48,34,0.85)' : 'rgba(110,134,90,0.55)';
  for (let k = 0.2; k < 1; k += 0.13) ellipse(ctx, f.x + sw * k, len * k, 1.8, 4.4, sw * 0.02);
}

// The Drowned Gate: the Shallows' boardwalk coming in under two leaning willows whose crowns meet over it, its last
// boards just above the water (the water let down: the weed line on the posts shows where it stood till lately)
function drawGateEnd(ctx) {
  ctx.fillStyle = '#5a5070';
  ctx.fillRect(0, GROUND - 2, 300, 12);
  ctx.fillStyle = '#7a6e8a';
  ctx.fillRect(0, GROUND - 4, 300, 4);
  ctx.fillStyle = '#3e3650';
  for (let x = 20; x < 300; x += 90) ctx.fillRect(x - 4, GROUND + 10, 8, H - GROUND - 10);
  ctx.fillStyle = 'rgba(110,138,78,0.7)'; // where the water stood until lately, high on the posts
  for (let x = 20; x < 300; x += 90) ctx.fillRect(x - 6, GROUND - 40, 12, 5);
  ctx.strokeStyle = '#5a5070';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, GROUND - 4);
  ctx.lineTo(10, GROUND - 28);
  ctx.lineTo(260, GROUND - 28);
  ctx.moveTo(140, GROUND - 4);
  ctx.lineTo(140, GROUND - 28);
  ctx.moveTo(260, GROUND - 4);
  ctx.lineTo(260, GROUND - 28);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.6)'; // weed hanging off the rail
  for (let x = 20; x < 260; x += 24) ellipse(ctx, x, GROUND - 22, 2, 6);
}

// The high crook of the oldest willow: a fork far up its trunk, a heron's moulted feathers lodged in it
function drawCrook(ctx) {
  const { x, y, w } = CROOK;
  ctx.fillStyle = BARK;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 4);
  ctx.quadraticCurveTo(x + w / 2, y + 34, x + w + 10, y + 4);
  ctx.lineTo(x + w + 34, y - 50);
  ctx.lineTo(x + w + 4, y - 4);
  ctx.lineTo(x - 4, y - 4);
  ctx.lineTo(x - 30, y - 54);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BARK_L;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#e4e6ea'; // the feathers
  for (const [fx, a] of [[0.25, -0.4], [0.5, 0.2], [0.7, -0.7]]) {
    ctx.save();
    ctx.translate(x + w * fx, y - 6);
    ctx.rotate(a);
    ellipse(ctx, 0, 0, 11, 2.6);
    ctx.restore();
  }
}
