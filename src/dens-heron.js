// Docs: docs/combat/bosses.md, docs/places/grove.md
// The Drowned Grove's boss den (the Stone Nest, atlas Phase 8 L1), its way in at the Heronry (a gap between two great
// drowned willow roots, nest stones heaped in it, and now and then a long grey neck rising over the reeds behind), and
// Long-Neck herself: a great grey heron, older than the willows, a shard in her breast, standing guard over a nest of
// stones with one egg in it that is a stone. The plan: story/phase8-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT
// import dens.js: the few helpers it needs are copied below. The shared boss effects take her theme ('heron': FXPAL in
// dens.js). Her The Long Wait is the shared `lanes` ult as it is (ULT_LOOKS is empty). Her freeing (drawHeronFreed, run
// from the den's bossDie): she opens her wings and flies off east over the mere, and the stone is left in the nest.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';

const GROUND = FIELD_GROUND;
const NEST_X = 820; // the nest of stones, on a hummock in the middle of the hollow
export const HERON_FREED_S = 7; // how long the freeing plays (the den's bossDie lasts this long)
const BARK = '#2e2a26', BARK_D = '#181614', BARK_L = '#4a443c';
const HERON = '#a8acb4', HERON_D = '#6e727c', HERON_L = '#e4e6ea', INKC = '#2e2a3a';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);

// ——— small helpers (copies of the ones in dens.js) ———
function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35); // src/glow.js
}
const gradCache = new WeakMap();
function vgrad(ctx, key, y0, y1, stops) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [k, col] of stops) g.addColorStop(k, col);
    c[key] = g;
  }
  return c[key];
}

// Freed: the nest shows only the stone (and a grey feather) until she's back (set from drawHeronFreed)
let freedPending = false, freedAt = -1e9;

// ——— the den: a hollow inside a ring of huge drowned willows, the light green and dim through their fronds, still
// black water over the floor, the nest of stones on a hummock in the middle ———
const trunks = (() => {
  const r = mulberry32(7601);
  const out = [];
  for (let x = -60; x < DEN_W + 80; x += 150 + r() * 90) out.push({ x, w: 46 + r() * 40, lean: (r() - 0.5) * 0.12, far: r() < 0.5 });
  return out;
})();
const fronds = (() => {
  const r = mulberry32(7611);
  return Array.from({ length: 70 }, () => ({ x: r() * DEN_W, len: 80 + r() * 160, p: r() * TAU, far: r() < 0.5 }));
})();
const motes = (() => {
  const r = mulberry32(7621);
  return Array.from({ length: 26 }, () => ({ x: r() * DEN_W, y: 120 + r() * 260, p: r() * TAU, s: 0.6 + r() * 0.6 }));
})();
const STONES = [[-40, 0, 13], [-18, -3, 15], [8, -1, 14], [32, 1, 12], [-28, -16, 11], [0, -18, 13], [24, -14, 11], [-10, -30, 10], [14, -30, 9]];

function drawDenHeron(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freed = time - freedAt < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // the light, green and dim, coming down through the willows
  ctx.fillStyle = vgrad(ctx, 'bg-heron', 0, GROUND, [[0, '#1e2a22'], [0.5, '#34463a'], [0.85, '#4e6450'], [1, '#5a6e58']]);
  ctx.fillRect(L, 0, R - L, H);
  for (let i = 0; i < 5; i++) { // shafts of light
    const x = 180 + i * 290;
    if (!visible(x - 80, x + 120, L, R)) continue;
    ctx.fillStyle = `rgba(214,236,190,${0.05 + 0.02 * Math.sin(time * 0.5 + i)})`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 50, 0);
    ctx.lineTo(x + 130, GROUND);
    ctx.lineTo(x + 30, GROUND);
    ctx.closePath();
    ctx.fill();
  }
  for (const tr of trunks) if (tr.far && visible(tr.x - tr.w, tr.x + tr.w, L, R)) drawTrunk(ctx, tr, true);
  for (const f of fronds) if (f.far && visible(f.x - 30, f.x + 30, L, R)) drawFrond(ctx, f, time, true);
  for (const tr of trunks) if (!tr.far && visible(tr.x - tr.w, tr.x + tr.w, L, R)) drawTrunk(ctx, tr, false);
  // the floor: black still water over peat, a sheen on top
  ctx.fillStyle = vgrad(ctx, 'floor-heron', GROUND, H, [[0, '#2a3228'], [0.25, '#1a1e18'], [1, '#0e100c']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = 'rgba(200,214,190,0.22)';
  ctx.beginPath();
  ctx.moveTo(L, GROUND - 2);
  for (let x = Math.floor(L / 24) * 24; x <= R + 24; x += 24) ctx.lineTo(x, GROUND - 2 + Math.sin(x * 0.03 + time) * 0.8);
  ctx.lineTo(R, GROUND + 1);
  ctx.lineTo(L, GROUND + 1);
  ctx.closePath();
  ctx.fill();
  for (let x = Math.floor(L / 140) * 140; x < R; x += 140) { // slow rings where something drips
    const k = (time * 0.35 + x * 0.013) % 1;
    ctx.strokeStyle = `rgba(200,214,190,${0.25 * (1 - k)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + 40, GROUND + 14 + (x % 3) * 8, 6 + k * 30, 1.5 + k * 4, 0, 0, TAU);
    ctx.stroke();
  }
  for (const mo of motes) { // drifting seed fluff, catching the light
    if (!visible(mo.x - 10, mo.x + 10, L, R)) continue;
    const y = mo.y + Math.sin(time * 0.6 * mo.s + mo.p) * 14, x = mo.x + Math.sin(time * 0.3 + mo.p) * 20;
    ctx.fillStyle = `rgba(240,244,226,${0.35 + 0.25 * Math.sin(time + mo.p)})`;
    circle(ctx, x, y, 1.6);
  }
  if (visible(NEST_X - 140, NEST_X + 140, L, R)) drawNest(ctx, time, freed);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Stone Nest', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: a boss's moving arena, src/challenge.js)
  for (const f of fronds) if (!f.far && visible(f.x - 30, f.x + 30, L, R)) drawFrond(ctx, f, time, false);
  ctx.restore();
}

// a great willow trunk, furrowed, standing in the water; far ones dimmer and greener
function drawTrunk(ctx, tr, far) {
  ctx.save();
  ctx.translate(tr.x, GROUND);
  ctx.rotate(tr.lean);
  ctx.fillStyle = far ? '#2a342a' : BARK;
  ctx.beginPath();
  ctx.moveTo(-tr.w * 0.7, 4);
  ctx.quadraticCurveTo(-tr.w * 0.4, -30, -tr.w * 0.36, -120);
  ctx.lineTo(-tr.w * 0.3, -H);
  ctx.lineTo(tr.w * 0.3, -H);
  ctx.lineTo(tr.w * 0.36, -120);
  ctx.quadraticCurveTo(tr.w * 0.4, -30, tr.w * 0.7, 4);
  ctx.closePath();
  ctx.fill();
  if (!far) {
    ctx.strokeStyle = BARK_D;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(i * tr.w * 0.12, 0);
      ctx.bezierCurveTo(i * tr.w * 0.14 + 4, -120, i * tr.w * 0.1 - 4, -240, i * tr.w * 0.12, -H);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(110,138,78,0.45)'; // a tide line of weed where the water's been
    ctx.fillRect(-tr.w * 0.5, -40, tr.w, 8);
  }
  ctx.restore();
}

// a willow frond hanging from above, swaying (front ones in front of everything, darker)
function drawFrond(ctx, f, time, far) {
  const sw = Math.sin(time * 0.6 + f.p) * 6;
  ctx.strokeStyle = far ? 'rgba(90,110,74,0.5)' : 'rgba(46,58,38,0.85)';
  ctx.lineWidth = far ? 1.4 : 2;
  ctx.beginPath();
  ctx.moveTo(f.x, -4);
  ctx.quadraticCurveTo(f.x + sw * 0.5, f.len * 0.5, f.x + sw, f.len);
  ctx.stroke();
  ctx.fillStyle = far ? 'rgba(122,138,90,0.5)' : 'rgba(58,72,46,0.9)';
  for (let k = 0.2; k < 1; k += 0.14) ellipse(ctx, f.x + sw * k + (k * 10 % 2 ? 2 : -2), f.len * k, 1.6, 4, sw * 0.02);
}

// The nest: a low hummock of peat out of the water, stones heaped round in a ring, and in the middle one grey egg-shaped
// stone, smooth from being turned. Freed: the stone alone, and one grey feather
function drawNest(ctx, time, freed) {
  const x = NEST_X, b = GROUND;
  ctx.fillStyle = '#3a3226';
  ctx.beginPath();
  ctx.ellipse(x, b + 2, 120, 22, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#4e4434';
  ctx.beginPath();
  ctx.ellipse(x, b - 2, 104, 14, 0, Math.PI, 0);
  ctx.fill();
  for (const [dx, dy, r] of STONES) {
    ctx.fillStyle = (dx * 7 + dy) % 3 ? '#7a7e78' : '#8a8e86';
    ctx.strokeStyle = '#3e423c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x + dx * 1.7, b - 8 + dy * 0.6, r, r * 0.7, dx * 0.01, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // the egg (a stone): pale, smooth, a little shine
  const ex = x + 4, ey = b - 26;
  if (!freed) glow(ctx, ex, ey, 34, 26, '214,224,236', 0.18 + 0.06 * Math.sin(time * 1.2));
  ctx.fillStyle = '#c4c8cc';
  ctx.strokeStyle = '#6e727c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(ex, ey, 13, 17, 0.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, ex - 4, ey - 6, 3, 5, 0.2);
  if (freed) { // a feather left on the stones
    ctx.save();
    ctx.translate(x + 44, b - 18);
    ctx.rotate(0.4);
    ctx.fillStyle = HERON_L;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.quadraticCurveTo(0, -5, 16, 0);
    ctx.quadraticCurveTo(0, 4, -16, 0);
    ctx.fill();
    ctx.strokeStyle = HERON_D;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(17, 0);
    ctx.stroke();
    ctx.restore();
  }
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '214,236,190', 0.35);
  ctx.fillStyle = '#4e5e48'; // a gap between two roots, daylight beyond
  ctx.beginPath();
  ctx.moveTo(x - 40, b + 2);
  ctx.quadraticCurveTo(x - 46, b - 120, x, b - 130);
  ctx.quadraticCurveTo(x + 46, b - 120, x + 40, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(214,236,190,0.35)';
  ellipse(ctx, x, b - 56, 22, 44);
  ctx.strokeStyle = BARK;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(x - 46, b + 4);
  ctx.quadraticCurveTo(x - 54, b - 124, x, b - 136);
  ctx.quadraticCurveTo(x + 54, b - 124, x + 46, b + 4);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 158, 13, '#f0f4e6');
}

// The name, cut into a slab of grey stone propped on two willow stakes
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 70);
  ctx.rotate(Math.sin(time * 0.5) * 0.01);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = 'rgba(122,138,90,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -70);
    ctx.quadraticCurveTo(sx + 4, -44, sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = '#8a8e86';
  ctx.strokeStyle = '#3e423c';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.55)'; // moss along its top
  for (let i = 0; i < 8; i++) ellipse(ctx, -tw / 2 + 20 + i * (tw - 40) / 7, -19, 10, 3);
  text(ctx, name, 0, 3, 18, '#22261e');
  ctx.restore();
}

// The ledges: great willow roots arching up out of the water
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = BARK;
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 20, GROUND);
  ctx.quadraticCurveTo(x - 6, y + 10, x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.quadraticCurveTo(x + w + 6, y + 10, x + w + 20, GROUND);
  ctx.lineTo(x + w - 6, GROUND);
  ctx.quadraticCurveTo(x + w - 10, y + 20, x + w - 24, y + 14);
  ctx.lineTo(x + 24, y + 14);
  ctx.quadraticCurveTo(x + 10, y + 20, x + 6, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BARK_L;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(110,138,78,0.6)';
  for (let k = 0; k < 5; k++) ellipse(ctx, x + 18 + (k * (w - 36)) / 4, y - 3, 7, 2);
}

export const DEN_ART = { heron: drawDenHeron };

// ——— the way in at the Grove's Heronry (feet at groundY) ———
// A gap between two great drowned willow roots, arched over each other, nest stones heaped in the mouth, grey feathers
// caught on the bark; behind, now and then, a long grey neck rises over the reeds, looks, and sinks again.
function drawEntranceHeron(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  glow(ctx, x, b - 70, 110, 90, '200,215,235', 0.25);
  // the neck over the reeds (she looks out, slowly, every so often)
  const k = clamp(Math.sin(time * 0.35) * 2 - 0.6, 0, 1);
  if (k > 0) {
    const hy = b - 120 - 90 * k;
    ctx.strokeStyle = HERON;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 30, b - 90);
    ctx.quadraticCurveTo(x + 48, (b - 90 + hy) / 2, x + 34, hy);
    ctx.stroke();
    ctx.fillStyle = HERON_L;
    circle(ctx, x + 34, hy, 8);
    ctx.fillStyle = '#e8b040';
    ctx.beginPath();
    ctx.moveTo(x + 40, hy - 2);
    ctx.lineTo(x + 66, hy + 2);
    ctx.lineTo(x + 40, hy + 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 30, hy - 5);
    ctx.quadraticCurveTo(x + 20, hy - 10, x + 10, hy - 6);
    ctx.stroke();
    ctx.fillStyle = '#f4d84a';
    circle(ctx, x + 37, hy - 2, 2);
  }
  // reeds behind
  ctx.strokeStyle = '#5a6650';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const rx = x - 80 + i * 12, hh = 70 + ((i * 37) % 40);
    ctx.moveTo(rx, b);
    ctx.quadraticCurveTo(rx + Math.sin(time * 0.7 + i) * 2, b - hh * 0.5, rx + Math.sin(time * 0.7 + i) * 4, b - hh);
  }
  ctx.stroke();
  // the two roots, arched over the gap
  ctx.fillStyle = BARK;
  ctx.strokeStyle = BARK_D;
  ctx.lineWidth = 3;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * 80, b + 2);
    ctx.quadraticCurveTo(x + s * 70, b - 110, x - s * 10, b - 130);
    ctx.quadraticCurveTo(x + s * 40, b - 100, x + s * 46, b + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(14,16,12,0.85)'; // the dark under the arch
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.quadraticCurveTo(x - 40, b - 96, x, b - 108);
  ctx.quadraticCurveTo(x + 40, b - 96, x + 44, b + 2);
  ctx.closePath();
  ctx.fill();
  // nest stones heaped in the mouth
  for (const [dx, r] of [[-30, 11], [-12, 13], [8, 12], [26, 10], [-20, 9], [16, 9]]) {
    ctx.fillStyle = '#7a7e78';
    ctx.strokeStyle = '#3e423c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x + dx, b - 6 - (Math.abs(dx) < 20 && r < 10 ? 12 : 0), r, r * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // grey feathers caught on the bark
  ctx.fillStyle = HERON_L;
  for (const [fx, fy, a] of [[-58, -70, 0.6], [62, -54, -0.5], [-30, -112, 1.1]]) {
    ctx.save();
    ctx.translate(x + fx, b + fy);
    ctx.rotate(a);
    ellipse(ctx, 0, 0, 9, 2.4);
    ctx.restore();
  }
  ctx.restore();
}
export const ENTRANCE_ART = { heron: drawEntranceHeron };

// ——— Long-Neck (ctx, w, h, st) => sil, origin at her feet on the floor, +x = facing ———
// A great grey heron, tall as a willow's first branch: long yellow legs in the water, a heavy grey body with the
// wings folded, a white breast streaked black, the long neck in an S, a white head with a black plume swept back, a
// yellow dagger of a bill, a yellow eye. The shard glints in her breast feathers (where `weak` puts the weak point).
// Standing she's very still (her breathing is the only movement); m.warn: the neck draws back into a tight S, ready
// to strike; charging: the neck out level, bill first, wings half open, running.
function drawLongNeck(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying, walking } = st;
  const live = dying < 0.02;
  const breathe = Math.sin(t * 1.1 + seed) * 0.015;
  const step = walking || charging ? Math.sin(t * (charging ? 14 : 5)) : 0;
  const by = -h * 0.52; // the body's middle
  const body = () => {
    ctx.moveTo(-w * 0.36, by + h * 0.02);
    ctx.bezierCurveTo(-w * 0.34, by - h * 0.16, w * 0.06, by - h * 0.2, w * 0.24, by - h * 0.1);
    ctx.quadraticCurveTo(w * 0.32, by + h * 0.04, w * 0.18, by + h * 0.12);
    ctx.quadraticCurveTo(-w * 0.1, by + h * 0.16, -w * 0.36, by + h * 0.02);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    body();
  };
  const grey = rageCol(HERON, enr, 0.18), dark = rageCol(HERON_D, enr, 0.18);
  ctx.save();
  // legs: long and yellow, a knee bent backward
  ctx.strokeStyle = '#c8a050';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const [lx, ph] of [[-w * 0.04, 1], [w * 0.08, -1]]) {
    const sw = step * ph * 14;
    ctx.moveTo(lx, by + h * 0.1);
    ctx.lineTo(lx + 6 + sw * 0.5, -h * 0.24);
    ctx.lineTo(lx + sw, -2);
  }
  ctx.stroke();
  ctx.lineWidth = 3; // toes
  ctx.beginPath();
  for (const [lx, ph] of [[-w * 0.04, 1], [w * 0.08, -1]]) {
    const fx = lx + step * ph * 14;
    ctx.moveTo(fx - 12, 0); ctx.lineTo(fx + 14, 0);
    ctx.moveTo(fx, -1); ctx.lineTo(fx - 6, 2);
  }
  ctx.stroke();
  // the body, wings folded (half open when she runs)
  ctx.save();
  ctx.translate(0, by);
  ctx.rotate(charging ? 0.12 : breathe);
  ctx.translate(0, -by);
  ctx.fillStyle = grey;
  ctx.strokeStyle = '#3e424a';
  ctx.lineWidth = 3;
  sil();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = dark; // the folded wing
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, by - h * 0.02);
  ctx.bezierCurveTo(-w * 0.2, by - h * 0.14, w * 0.1, by - h * 0.14, w * 0.18, by - h * 0.04);
  ctx.quadraticCurveTo(w * 0.0, by + h * 0.06, -w * 0.3, by - h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e3238'; // the dark flight feathers at the back, trailing
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, by - h * 0.02);
  ctx.lineTo(-w * 0.5, by + h * 0.06);
  ctx.lineTo(-w * 0.44, by + h * 0.09);
  ctx.lineTo(-w * 0.22, by + h * 0.05);
  ctx.closePath();
  ctx.fill();
  if (charging) { // a wing half opened, for balance
    ctx.fillStyle = grey;
    ctx.strokeStyle = '#3e424a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, by - h * 0.1);
    ctx.quadraticCurveTo(-w * 0.2, by - h * 0.34, -w * 0.5, by - h * 0.3);
    ctx.lineTo(-w * 0.42, by - h * 0.18);
    ctx.quadraticCurveTo(-w * 0.2, by - h * 0.1, w * 0.06, by - h * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = HERON_L; // the white breast, streaked
  ctx.beginPath();
  ctx.ellipse(w * 0.16, by + h * 0.02, w * 0.1, h * 0.09, 0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(46,42,58,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(w * 0.1 + i * 5, by - h * 0.04);
    ctx.lineTo(w * 0.08 + i * 5, by + h * 0.07);
  }
  ctx.stroke();
  ctx.restore();
  // the neck: an S (standing), a tight S (warn), straight out level (charging)
  const nx = w * 0.2, ny = by - h * 0.08;
  let hx, hy, c1x, c1y, c2x, c2y, ang;
  if (charging) {
    hx = w * 0.62; hy = by - h * 0.06; c1x = w * 0.34; c1y = by - h * 0.1; c2x = w * 0.5; c2y = by - h * 0.08; ang = 0.05;
  } else if (warn) {
    hx = w * 0.16; hy = by - h * 0.36; c1x = w * 0.42; c1y = by - h * 0.12; c2x = w * 0.02; c2y = by - h * 0.24; ang = 0.15;
  } else {
    hx = w * 0.3; hy = by - h * 0.44 + breathe * 40; c1x = w * 0.38; c1y = by - h * 0.18; c2x = w * 0.12; c2y = by - h * 0.32; ang = 0.12;
  }
  ctx.strokeStyle = '#3e424a';
  ctx.lineWidth = 17;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, hx, hy);
  ctx.stroke();
  ctx.strokeStyle = HERON_L;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, hx, hy);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(46,42,58,0.6)'; // the black streak down the front of the neck
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(nx + 5, ny);
  ctx.bezierCurveTo(c1x + 5, c1y, c2x + 5, c2y, hx + 4, hy + 4);
  ctx.stroke();
  // the head
  ctx.save();
  ctx.translate(hx, hy);
  ctx.fillStyle = HERON_L;
  ctx.strokeStyle = '#3e424a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 10, ang, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INKC; // the black stripe and plume
  ctx.beginPath();
  ctx.moveTo(4, -5);
  ctx.quadraticCurveTo(-6, -10, -14, -4);
  ctx.lineTo(-10, -2);
  ctx.quadraticCurveTo(-4, -6, 4, -3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INKC;
  ctx.lineWidth = 2.5;
  const pl = live ? Math.sin(t * 0.9 + seed) * 3 : 0;
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.quadraticCurveTo(-26, -8 + pl, -42, -2 + pl);
  ctx.moveTo(-10, -2);
  ctx.quadraticCurveTo(-24, -2 + pl, -38, 6 + pl);
  ctx.stroke();
  // the bill: a long yellow dagger
  ctx.rotate(ang);
  ctx.fillStyle = rageCol('#e8b040', enr, 0.25);
  ctx.strokeStyle = '#8a6420';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(9, -4);
  ctx.lineTo(54, 1);
  ctx.lineTo(9, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,100,32,0.7)';
  ctx.beginPath();
  ctx.moveTo(10, 1);
  ctx.lineTo(48, 1);
  ctx.stroke();
  ctx.rotate(-ang);
  // the eye: yellow, unblinking
  ctx.fillStyle = '#f4d84a';
  circle(ctx, 4, -1, 3.6);
  if (live) {
    ctx.fillStyle = INKC;
    circle(ctx, 5, -1, 1.8);
  } else {
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(1, -4); ctx.lineTo(7, 2);
    ctx.moveTo(7, -4); ctx.lineTo(1, 2);
    ctx.stroke();
  }
  ctx.restore();
  // the shard (every great beast carries one), lodged among her breast feathers
  const shx = w * 0.22, shy = -h * 0.42; // (MOBS.long_neck.weak)
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, shx, shy, 22, 18, '200,215,235', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#eef2f8' : '#b8bcc4';
  ctx.strokeStyle = '#7a8aa8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shx - 1, shy - 10);
  ctx.lineTo(shx + 7, shy - 1);
  ctx.lineTo(shx + 1, shy + 7);
  ctx.lineTo(shx - 6, shy - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // rings round her legs in the water (she has been standing there a long time)
  if (live && !walking && !charging) {
    const k = (t * 0.4 + seed) % 1;
    ctx.strokeStyle = `rgba(200,214,190,${0.4 * (1 - k)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(w * 0.02, 2, 10 + k * 26, 2 + k * 4, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  return sil;
}
export const BOSS_ART = { long_neck: drawLongNeck };
export const ULT_LOOKS = {}; // (The Long Wait is the shared `lanes` ult as drawn in dens.js)

// ——— freed: she opens her wings and flies off east over the mere; the stone stays in the nest (the den's bossDie,
// HERON_FREED_S long) ———
export function drawHeronFreed(ctx, e) {
  const tt = e.t;
  if (tt > 2) freedPending = true;
  const k = clamp((tt - 0.8) / (HERON_FREED_S - 1.6), 0, 1);
  const x0 = e.x ?? NEST_X, y0 = GROUND - 120;
  const x = x0 + k * k * (DEN_W + 400 - x0), y = y0 - k * 260 - Math.sin(k * Math.PI) * 30;
  const flap = Math.sin(tt * 5);
  const a = tt < 0.8 ? tt / 0.8 : 1;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  const s = 1.3 - k * 0.6;
  ctx.scale(s, s);
  for (const far of [true, false]) { // the wings, rowing slow
    const up = flap * (far ? 0.8 : 1);
    ctx.fillStyle = far ? HERON_D : HERON;
    ctx.strokeStyle = '#3e424a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-10, -40 * up - 6, -54, -50 * up);
    ctx.lineTo(-60, -40 * up + 8);
    ctx.quadraticCurveTo(-24, -14 * up + 8, 10, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (far) {
      ctx.fillStyle = HERON;
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 11, -0.1, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = HERON_L; // neck folded back, head and bill forward
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(22, -2);
      ctx.quadraticCurveTo(34, 4, 30, -10);
      ctx.stroke();
      ctx.fillStyle = HERON_L;
      circle(ctx, 32, -12, 6);
      ctx.fillStyle = '#e8b040';
      ctx.beginPath();
      ctx.moveTo(36, -14);
      ctx.lineTo(58, -10);
      ctx.lineTo(36, -9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c8a050'; // legs trailing
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-26, 4);
      ctx.lineTo(-62, 10);
      ctx.stroke();
    }
  }
  ctx.restore();
  // a few grey feathers drifting down where she rose
  for (let i = 0; i < 4; i++) {
    const j = clamp((tt - 0.6 - i * 0.3) / 3, 0, 1);
    if (j <= 0 || j >= 1) continue;
    ctx.save();
    ctx.globalAlpha *= 1 - j;
    ctx.translate(x0 + (i - 1.5) * 26 + Math.sin(tt * 2 + i) * 14, y0 - 40 + j * 150);
    ctx.rotate(Math.sin(tt * 3 + i) * 0.8);
    ctx.fillStyle = HERON_L;
    ellipse(ctx, 0, 0, 9, 2.4);
    ctx.restore();
  }
}
