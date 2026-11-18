// Docs: docs/places/buried.md
// The Buried Caravanserai (room BURIED, src/shared/rpg.js; atlas Phase 9, A3): a hard pocket, the caravan's first town,
// swallowed by a dune an age ago, down the stair under the Buried Observatory's dial ring. Its streets are dark and close
// under ceilings of packed sand held up on the old roof beams, its tents stiff as boards, its lamps out but where the
// lamplighters still go their rounds; sand sifts down from the ceiling in threads, and it gets darker going east. West to
// east: the Sand Stair (no mobs, no waystone: a hard pocket), Lantern Street, the Stiff Tents, and the Drovers' Yard with
// the old well (BURIED_WELL_X), where the Last Drover walks his string. The find: up on the well's windlass beam (last in
// BURIED_PLATFORMS), the rope cut and the bucket still on it. No sky: the ceiling is sand.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { BURIED_W, FIELD_GROUND, BURIED_PLATFORMS, BURIED_ZONES, BURIED_EXIT_X, BURIED_WELL_X } from './shared/rpg.js';
import { drawDuneSign } from './glassdunes.js';
import { lantern, STRIPE } from './buried-art.js';

const GROUND = FIELD_GROUND;
const CEIL = 120; // the sand ceiling's underside
const STAIR_END = BURIED_ZONES[0].x1;
const WINDLASS = BURIED_PLATFORMS.find((p) => p.kind === 'windlass');
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

// the old roof beams under the ceiling, every so often a post down to the floor
const BEAMS = (() => {
  const r = mulberry32(1061);
  const out = [];
  for (let x = 200; x < BURIED_W; x += 260 + r() * 160) out.push({ x, post: r() < 0.55, sag: 4 + r() * 8 });
  return out;
})();
// the old town's tents and walls in the background: x, width, height, stripe, kind
const TOWN = (() => {
  const r = mulberry32(1063);
  const out = [];
  for (let x = 560; x < BURIED_W - 200; x += 150 + r() * 140) {
    if (Math.abs(x - BURIED_WELL_X) < 240) continue;
    out.push({ x, w: 110 + r() * 80, h: 120 + r() * 70, col: STRIPE[Math.floor(r() * STRIPE.length)], kind: r() < 0.65 ? 'tent' : 'wall', lamp: r() < 0.3 });
  }
  return out;
})();
// threads of sand sifting down from the ceiling
const SIFT = (() => {
  const r = mulberry32(1069);
  return Array.from({ length: 40 }, () => ({ x: r() * BURIED_W, p: r() * 10, s: 0.6 + r() * 0.8 }));
})();
const ROPE_MARKS = 9; // the knots marked on the cut rope, Asra's way (one a morning)

// Everything in the Buried Caravanserai behind the slimes
export function drawBuried(ctx, camX, viewW, time) {
  const L = camX - 200, R = camX + viewW + 200;
  ctx.save();
  ctx.translate(camX, 0);
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#2a2018');
  g.addColorStop(0.4, '#4a3a2a');
  g.addColorStop(1, '#6a5640');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  for (const b of TOWN) if (visible(b.x - b.w, b.x + b.w, L, R)) (b.kind === 'tent' ? drawFarTent : drawFarWall)(ctx, b, time);
  if (visible(BURIED_WELL_X - 260, BURIED_WELL_X + 260, L, R)) drawWell(ctx, time);
  drawCeiling(ctx, Math.max(0, L), Math.min(BURIED_W, R), time);
  drawGround(ctx, Math.max(0, L), Math.min(BURIED_W, R));
  if (visible(0, STAIR_END + 60, L, R)) drawSandStair(ctx, time);
  for (const p of BURIED_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'stall') drawStall(ctx, p, time);
    else if (p.kind === 'beam') drawBeamLedge(ctx, p);
    else if (p.kind === 'tent') drawTentTop(ctx, p);
  }
  for (const s of SIFT) {
    if (!visible(s.x - 4, s.x + 4, L, R)) continue;
    const k = ((time * 0.4 * s.s + s.p) % 4) / 4; // a thread of sand falling, then stopping a while
    if (k > 0.5) continue;
    ctx.fillStyle = 'rgba(216,192,150,0.35)';
    ctx.fillRect(s.x, CEIL + 10, 1.4, (GROUND - CEIL - 10) * (k * 2));
  }
  if (visible(BURIED_EXIT_X, BURIED_EXIT_X + 220, L, R)) drawDuneSign(ctx, BURIED_EXIT_X + 110, 'Observatory', -1, time);
  // the dark, deepening east (a hard pocket: the far end is the darkest)
  ctx.save();
  ctx.translate(camX, 0);
  const dark = Math.min(1, Math.max(0, (camX + viewW / 2 - 600) / (BURIED_W - 1200)));
  ctx.fillStyle = `rgba(16,10,6,${0.18 + 0.3 * dark})`;
  ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, GROUND - 80, 120, W / 2, GROUND - 80, W * 0.7);
  v.addColorStop(0, 'rgba(16,10,6,0)');
  v.addColorStop(1, `rgba(16,10,6,${0.35 + 0.2 * dark})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  for (const b of TOWN) if (b.lamp && visible(b.x - 40, b.x + 40, L, R)) lantern(ctx, b.x, GROUND - b.h - 4, 1, time); // (a few lamps still lit, over the dark)
}

// the sand ceiling: packed sand, lumpy, held up on the old roof beams, threads of it sifting down
function drawCeiling(ctx, L, R, time) {
  if (R <= L) return;
  ctx.fillStyle = '#8a7258';
  ctx.beginPath();
  ctx.moveTo(L - 10, 0);
  ctx.lineTo(L - 10, CEIL);
  for (let x = Math.floor(L / 30) * 30; x <= R + 30; x += 30) ctx.lineTo(x, CEIL + Math.sin(x * 0.04) * 6 + Math.sin(x * 0.11) * 4);
  ctx.lineTo(R + 10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(184,154,120,0.4)';
  for (let x = Math.floor(L / 70) * 70; x < R; x += 70) ellipse(ctx, x + 20, CEIL - 20 + (x % 3) * 6, 26, 8);
  for (const b of BEAMS) {
    if (!visible(b.x - 200, b.x + 200, L, R)) continue;
    ctx.strokeStyle = '#4a3424';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(b.x - 180, CEIL + 4);
    ctx.quadraticCurveTo(b.x, CEIL + 4 + b.sag, b.x + 180, CEIL + 4);
    ctx.stroke();
    if (b.post) {
      ctx.fillStyle = '#4a3424';
      ctx.fillRect(b.x - 6, CEIL + 4, 12, GROUND - CEIL - 4);
      ctx.fillStyle = 'rgba(184,154,120,0.4)';
      ellipse(ctx, b.x, GROUND - 4, 24, 6);
    }
  }
}

function drawGround(ctx, L, R) {
  if (R <= L) return;
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, '#9a8060');
  g.addColorStop(1, '#5a4430');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = '#b89a78';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 10, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(74,56,40,0.5)'; // the old street's paving showing through
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) {
    ctx.moveTo(x, GROUND + 8);
    ctx.lineTo(x + 6, GROUND + 30);
  }
  ctx.moveTo(L, GROUND + 18);
  ctx.lineTo(R, GROUND + 18);
  ctx.stroke();
}

// the Sand Stair: the steps coming down from the Observatory, sand heaped on them, the daylight at the top
function drawSandStair(ctx, time) {
  const lg = ctx.createRadialGradient(60, CEIL + 30, 10, 60, CEIL + 30, 260);
  lg.addColorStop(0, `rgba(255,226,170,${0.4 + 0.05 * Math.sin(time)})`);
  lg.addColorStop(1, 'rgba(255,226,170,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, 340, GROUND);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? '#a88c68' : '#b89a78';
    ctx.fillRect(0, CEIL + 20 + i * 44, 260 - i * 34, 44);
    ctx.fillStyle = 'rgba(232,200,138,0.6)';
    ctx.fillRect(0, CEIL + 20 + i * 44, 260 - i * 34, 5);
  }
  ctx.fillStyle = '#c8aa82';
  ellipse(ctx, 230, GROUND - 4, 120, 18);
}

// a tent of the old town, behind: gone stiff as boards, its stripes faded to nothing, its door-flap open on the dark
function drawFarTent(ctx, b) {
  const { x, w, h, col } = b, y = GROUND;
  ctx.fillStyle = '#7a6448';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.08, y - h);
  ctx.lineTo(x + w * 0.08, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.25;
  for (let i = -2; i <= 2; i += 2) {
    ctx.beginPath();
    ctx.moveTo(x + i * w * 0.06, y - h);
    ctx.lineTo(x + i * w * 0.16 - 10, y);
    ctx.lineTo(x + i * w * 0.16 + 10, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1e140c';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.12, y);
  ctx.lineTo(x, y - h * 0.5);
  ctx.lineTo(x + w * 0.12, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(184,154,120,0.6)'; // sand drifted against it
  ellipse(ctx, x + w * 0.3, y - 4, w * 0.3, 12);
}
// a mud-brick wall of the old town, a doorway, a little window
function drawFarWall(ctx, b) {
  const { x, w, h } = b, y = GROUND;
  ctx.fillStyle = '#8a7052';
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = 'rgba(58,42,28,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let yy = y - h + 16; yy < y; yy += 16) {
    ctx.moveTo(x - w / 2, yy);
    ctx.lineTo(x + w / 2, yy);
  }
  ctx.stroke();
  ctx.fillStyle = '#1e140c';
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 60, 32, 60, [14, 14, 0, 0]);
  ctx.fill();
  ctx.fillRect(x + w * 0.24, y - h + 24, 12, 14);
  ctx.fillStyle = 'rgba(184,154,120,0.6)';
  ellipse(ctx, x - w * 0.3, y - 4, w * 0.3, 12);
}

// the old well in the Drovers' Yard: a ring of dressed stone, its windlass frame, and on the windlass beam (the find) the
// rope cut short, the bucket still tied on it, knots marked down it one a morning; a ring worn in the floor round it
// where the string has walked round and round
function drawWell(ctx, time) {
  const x = BURIED_WELL_X, y = GROUND;
  ctx.strokeStyle = 'rgba(58,42,28,0.55)'; // the ring worn round it
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 220, 14, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#9a8262'; // the well's stone ring
  ctx.strokeStyle = '#5a4430';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 60, y - 56, 120, 56, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(58,42,28,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    ctx.moveTo(x - 60 + i * 24, y - 56);
    ctx.lineTo(x - 60 + i * 24, y);
  }
  ctx.moveTo(x - 60, y - 28);
  ctx.lineTo(x + 60, y - 28);
  ctx.stroke();
  ctx.fillStyle = '#1e140c';
  ellipse(ctx, x, y - 56, 54, 7);
  const top = WINDLASS.y; // the windlass frame and its beam (the beam is the platform)
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 56, top, 8, y - 56 - top);
  ctx.fillRect(x + 48, top, 8, y - 56 - top);
  ctx.fillStyle = '#6a4a30';
  ctx.beginPath();
  ctx.roundRect(WINDLASS.x, top - 4, WINDLASS.w, 10, 4);
  ctx.fill();
  ctx.fillStyle = '#8a6a42'; // the drum, rope wound on it
  ctx.beginPath();
  ctx.roundRect(x - 20, top + 6, 40, 12, 5);
  ctx.fill();
  const sw = Math.sin(time * 0.7) * 2; // the rope, cut short, the bucket on it
  ctx.strokeStyle = '#a8865a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, top + 18);
  ctx.lineTo(x + sw, top + 74);
  ctx.stroke();
  ctx.fillStyle = '#5a3a24';
  for (let k = 0; k < ROPE_MARKS; k++) circle(ctx, x + (sw * (k + 1)) / ROPE_MARKS * 0.9, top + 22 + k * 5.6, 1.6);
  ctx.fillStyle = '#7a5a3a';
  ctx.strokeStyle = '#4a3020';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + sw - 11, top + 74);
  ctx.lineTo(x + sw + 11, top + 74);
  ctx.lineTo(x + sw + 8, top + 94);
  ctx.lineTo(x + sw - 8, top + 94);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#d8c8a0'; // the cut end, frayed, hanging off the drum on the other side
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 14, top + 18);
  ctx.lineTo(x + 16, top + 30);
  ctx.moveTo(x + 15, top + 30);
  ctx.lineTo(x + 12, top + 34);
  ctx.moveTo(x + 15, top + 30);
  ctx.lineTo(x + 18, top + 34);
  ctx.stroke();
}

// a market stall buried to its counter, a striped awning stiff over it, a few dry pots on the counter
function drawStall(ctx, p, time) {
  const { x, y, w } = p, col = STRIPE[Math.floor(x / 131) % STRIPE.length];
  ctx.fillStyle = '#6a5038';
  ctx.fillRect(x + 8, y + 6, 8, GROUND - y - 6);
  ctx.fillRect(x + w - 16, y + 6, 8, GROUND - y - 6);
  ctx.fillStyle = '#8a6a48'; // the counter
  ctx.fillRect(x + 4, y + 50, w - 8, GROUND - y - 50);
  ctx.fillStyle = '#c8b090'; // the awning, gone stiff: it's what you stand on
  ctx.strokeStyle = '#7a6448';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 12);
  ctx.lineTo(x, y - 4);
  ctx.lineTo(x + w, y - 4);
  ctx.lineTo(x + w + 8, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.5;
  for (let k = 0; k < w; k += 28) ctx.fillRect(x + k, y - 3, 14, 14);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#a07a52'; // dry pots on the counter
  for (let k = 0; k < 3; k++) ellipse(ctx, x + 30 + k * (w - 60) / 2, y + 42, 9, 10);
  ctx.fillStyle = 'rgba(184,154,120,0.7)';
  ellipse(ctx, x + w / 2, GROUND - 4, w * 0.6, 12);
}
// an old roof beam come down at a slant and caught on a post, flat enough on top to stand on
function drawBeamLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#4a3424';
  ctx.fillRect(x + w * 0.4, y + 8, 12, GROUND - y - 8);
  ctx.fillStyle = '#6a4a30';
  ctx.strokeStyle = '#3a2618';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(58,38,24,0.6)'; // its grain
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 2);
  ctx.lineTo(x + w - 6, y + 3);
  ctx.stroke();
  ctx.fillStyle = 'rgba(184,154,120,0.7)'; // sand on top
  ellipse(ctx, x + w * 0.3, y - 4, w * 0.18, 3);
}
// the ridge of a tent gone stiff as boards, sand caked on it: its top is flat enough to stand on
function drawTentTop(ctx, p) {
  const { x, y, w } = p, col = STRIPE[Math.floor(x / 173) % STRIPE.length];
  ctx.fillStyle = '#b89a78';
  ctx.strokeStyle = '#7a6448';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w + 30, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.35;
  for (let k = 0; k < 4; k++) {
    const sx = x + (k + 0.5) * (w / 4);
    ctx.beginPath();
    ctx.moveTo(sx - 8, y);
    ctx.lineTo(sx + 8, y);
    ctx.lineTo(sx + 8 + (k - 1.5) * 16, GROUND);
    ctx.lineTo(sx - 8 + (k - 1.5) * 16, GROUND);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1e140c'; // its door
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 18, GROUND);
  ctx.lineTo(x + w / 2, GROUND - 60);
  ctx.lineTo(x + w / 2 + 18, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a7a5a'; // the ridge pole
  ctx.fillRect(x - 6, y - 4, w + 12, 7);
  ctx.fillStyle = 'rgba(216,192,160,0.6)';
  ellipse(ctx, x + w * 0.6, y - 3, w * 0.2, 3);
}
