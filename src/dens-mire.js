// Docs: docs/combat/bosses.md, docs/places/causeway.md
// The Lantern Causeway's party den (Grandfather's Pool, atlas Phase 8 L4), its way in beside the causeway at MIRE_DEN_X
// (stone steps going down off the road's edge into a pool ringed with reeds, lily pads thick on it, and just above the
// water two great gold eyes that blink, slowly), and Grandfather Mire himself: a toad as big as a boathouse, older than
// the causeway, who sits across the way to the Hall because the Mother asked him to, and has never been told he may
// stop. The plan: story/phase8-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT
// import dens.js: the few helpers it needs are copied below. The shared boss effects take his theme ('mire': FXPAL in
// dens.js); The Long Promise is the shared `wave` ult drawn with the pool's water (dens.js waterMass). His freeing
// (drawMireFreed, run from the den's bossDie): he heaves himself up and steps aside, off the stones into the reeds, and
// sits down there with his eyes shut; the den keeps him there until he's back (the shard pulls him back, like every boss).
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';
import { drawLantern } from './stillmere-art.js';

const GROUND = FIELD_GROUND;
export const MIRE_FREED_S = 6; // how long the freeing plays (the den's bossDie lasts this long)
const TOAD = '#5a6a3a', TOAD_D = '#3a4626', TOAD_L = '#7e8e52', BELLY = '#c8c09a';
const STONE = '#6e6878', STONE_D = '#44404e', STONE_L = '#8e889a';
const INKC = '#2e2a3a';
const SIDE_X = DEN_W - 170; // where he sits down in the reeds once freed
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

// Freed: he sits off in the reeds until the den has him back (set from drawMireFreed)
let freedPending = false, freedAt = -1e9;

// ——— the den: the pool beside the causeway, wide and still, ringed with reeds; the causeway runs across the back on its
// arches, every lamp lit, and on toward the Hall in the mist; lily pads thick on the water; the stones he sits on are the
// causeway's own, fallen off its edge into the pool long ago ———
const arches = [60, 360, 660, 960, 1260]; // the causeway's arches across the back
const pads = (() => {
  const r = mulberry32(8101);
  return Array.from({ length: 40 }, () => ({ x: r() * DEN_W, y: GROUND + 10 + r() * 70, s: 0.6 + r() * 0.8, a: r() * TAU, bloom: r() < 0.2 }));
})();
const reeds = (() => {
  const r = mulberry32(8111);
  return Array.from({ length: 70 }, () => ({ x: r() * DEN_W, h: 50 + r() * 90, p: r() * TAU, front: r() < 0.25 }));
})();
const lights = (() => {
  const r = mulberry32(8121);
  return Array.from({ length: 16 }, () => ({ x: r() * DEN_W, y: GROUND + 30 + r() * 60, p: r() * TAU, s: 0.6 + r() * 0.3 }));
})();

function drawDenMire(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freedT = time - freedAt, freed = freedT < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-mire', 0, GROUND, [[0, '#2a2646'], [0.5, '#5e4e84'], [1, '#a898bc']]);
  ctx.fillRect(L, 0, R - L, H);
  ctx.fillStyle = 'rgba(214,204,232,0.25)'; // mist low over the far water
  for (let i = 0; i < 6; i++) ellipse(ctx, 120 + i * 260 + Math.sin(time * 0.2 + i) * 40, GROUND - 160 + (i % 2) * 14, 220, 26);
  // the causeway across the back, on its arches, lamps lit all along it
  const cy = GROUND - 210;
  ctx.fillStyle = STONE_D;
  ctx.fillRect(L, cy, R - L, 22);
  ctx.fillStyle = STONE_L;
  ctx.fillRect(L, cy - 3, R - L, 4);
  for (const x of arches) {
    if (!visible(x - 160, x + 160, L, R)) continue;
    ctx.fillStyle = STONE_D;
    ctx.fillRect(x - 14, cy + 20, 28, GROUND - cy - 40);
    ctx.fillStyle = 'rgba(42,38,70,0.9)'; // the arch's opening
    ctx.beginPath();
    ctx.moveTo(x + 14, GROUND - 20);
    ctx.lineTo(x + 14, cy + 50);
    ctx.quadraticCurveTo(x + 150, cy + 10, x + 286, cy + 50);
    ctx.lineTo(x + 286, GROUND - 20);
    ctx.closePath();
    ctx.fill();
  }
  for (let x = Math.floor(L / 100) * 100 + 30; x < R; x += 100) { // its lamps
    ctx.fillStyle = '#3e3650';
    ctx.fillRect(x - 2, cy - 44, 4, 42);
    drawLantern(ctx, x - 10, cy - 34, 0.8, 1, time + x);
  }
  ctx.fillStyle = 'rgba(214,204,232,0.18)';
  ctx.fillRect(L, GROUND - 40, R - L, 40);
  for (const rd of reeds) if (!rd.front && visible(rd.x - 10, rd.x + 10, L, R)) drawReed(ctx, rd, time, true);
  // the pool: black-green and still, lily pads on it, a few of the dead's lights drifted in
  ctx.fillStyle = vgrad(ctx, 'floor-mire', GROUND, H, [[0, '#3a4430'], [0.3, '#1e2418'], [1, '#0e120c']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  for (const pd of pads) if (visible(pd.x - 20, pd.x + 20, L, R)) drawPad(ctx, pd, time);
  for (const l of lights) if (visible(l.x - 20, l.x + 20, L, R)) drawLantern(ctx, l.x + Math.sin(time * 0.3 + l.p) * 10, l.y + Math.sin(time + l.p) * 1.4, l.s, 1, time);
  ctx.fillStyle = 'rgba(214,220,200,0.25)';
  ctx.beginPath();
  ctx.moveTo(L, GROUND - 2);
  for (let x = Math.floor(L / 24) * 24; x <= R + 24; x += 24) ctx.lineTo(x, GROUND - 2 + Math.sin(x * 0.03 + time) * 0.8);
  ctx.lineTo(R, GROUND + 1);
  ctx.lineTo(L, GROUND + 1);
  ctx.closePath();
  ctx.fill();
  for (const rd of reeds) if (rd.front && visible(rd.x - 10, rd.x + 10, L, R)) drawReed(ctx, rd, time, false); // (reeds at the pool's edge)
  if (freed && visible(SIDE_X - 160, SIDE_X + 160, L, R)) drawSitting(ctx, time); // (after a freeing: off in the reeds, eyes shut)
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? "Grandfather's Pool", 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: the sinking stones, src/challenge.js)
  ctx.restore();
}

function drawReed(ctx, rd, time, back) {
  const lean = Math.sin(time * 0.7 + rd.p) * 3;
  ctx.strokeStyle = back ? '#4e5a48' : '#6a7a50';
  ctx.lineWidth = back ? 1.6 : 2.2;
  ctx.beginPath();
  ctx.moveTo(rd.x, GROUND + (back ? 0 : 8));
  ctx.quadraticCurveTo(rd.x + lean * 0.5, GROUND - rd.h * 0.5, rd.x + lean, GROUND - rd.h);
  ctx.stroke();
  ctx.fillStyle = back ? '#4a3a2c' : '#6a4a32';
  ellipse(ctx, rd.x + lean, GROUND - rd.h - 5, 2.4, 7);
}
function drawPad(ctx, pd, time) {
  const y = pd.y + Math.sin(time * 0.8 + pd.x) * 0.6;
  ctx.fillStyle = '#4e6e52';
  ctx.beginPath();
  ctx.ellipse(pd.x, y, 18 * pd.s, 5 * pd.s, 0, pd.a, pd.a + TAU - 0.5);
  ctx.lineTo(pd.x, y);
  ctx.fill();
  if (pd.bloom) {
    ctx.fillStyle = '#f2d8ec';
    for (let i = 0; i < 5; i++) ellipse(ctx, pd.x + Math.cos(i * 1.26) * 3 * pd.s, y - 3 * pd.s + Math.sin(i * 1.26) * 1.4, 2.6 * pd.s, 1.6 * pd.s, i * 1.26);
  }
}

// The way out: stone steps back up to the causeway
function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 80, 100, 110, '214,212,226', 0.3);
  ctx.fillStyle = STONE; // the steps back up to the causeway
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x - 34 + i * 4, b - i * 26 - 10, 68 - i * 8, 12);
    ctx.fillStyle = i % 2 ? STONE : STONE_L;
  }
  text(ctx, 'OUT', x, b - 180, 13, '#f0eef8');
}

// The name, on an old toll board hung high on two chains
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 70);
  ctx.rotate(Math.sin(time * 0.5) * 0.012);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = 'rgba(46,42,58,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -70);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = '#4e5a3a';
  ctx.strokeStyle = '#2a3020';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, name, 0, 3, 18, '#f0ead4');
  ctx.restore();
}

// The ledges: big dressed stones fallen off the causeway into the pool, weed on them (they sink: the moving arena)
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE_D;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 2);
  ctx.lineTo(x + w - 4, y + 2);
  ctx.lineTo(x + w - 14, y + 30);
  ctx.quadraticCurveTo(x + w / 2, y + 40, x + 14, y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.roundRect(x, y - 5, w, 9, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,36,48,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.4, y - 4);
  ctx.lineTo(x + w * 0.4, y + 4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.7)';
  for (let k = 0; k < 4; k++) ellipse(ctx, x + 16 + (k * (w - 32)) / 3, y - 4, 7, 2);
}

// After a freeing: he sits off in the reeds at the far end, eyes shut, very still, his cap's flower open
function drawSitting(ctx, time) {
  ctx.save();
  ctx.translate(SIDE_X, GROUND + 6);
  ctx.scale(-0.8, 0.8); // (facing back into the den, smaller: further off)
  drawGrandfatherMire(ctx, 210, 170, { t: time, seed: 0, enr: false, warn: false, charging: false, dying: 0, asleep: true });
  ctx.restore();
}

export const DEN_ART = { mire: drawDenMire };

// ——— the way in beside the causeway (feet at groundY) ———
// Stone steps going down off the road's edge into a pool ringed with reeds, lily pads thick on it; just above the water,
// two great gold eyes that blink, slowly, and a hump of warty back behind them like a small island
function drawEntranceMire(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  ctx.fillStyle = 'rgba(30,36,24,0.85)'; // the pool, below the road's edge
  ctx.beginPath();
  ctx.ellipse(x + 20, b + 22, 130, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = TOAD_D; // the hump of his back
  ctx.beginPath();
  ctx.ellipse(x + 50, b + 14, 70, 18, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(58,70,38,0.8)';
  for (const dx of [20, 44, 70, 92]) circle(ctx, x + dx, b + 4 + (dx % 3), 4);
  ctx.fillStyle = '#5e7a44'; // his lily-pad cap, just showing
  ellipse(ctx, x + 50, b - 2, 30, 6);
  ctx.fillStyle = '#f2d8ec';
  circle(ctx, x + 56, b - 6, 3);
  const blink = (time % 6) < 0.3;
  for (const dx of [10, 34]) { // the eyes
    ctx.fillStyle = TOAD;
    circle(ctx, x + dx, b + 4, 11);
    if (blink) {
      ctx.strokeStyle = TOAD_D;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + dx - 8, b + 4);
      ctx.lineTo(x + dx + 8, b + 4);
      ctx.stroke();
    } else {
      glow(ctx, x + dx, b + 2, 18, 14, '232,184,74', 0.35);
      ctx.fillStyle = '#e8b84a';
      circle(ctx, x + dx, b + 2, 8);
      ctx.fillStyle = INKC;
      ctx.fillRect(x + dx - 7, b + 1, 14, 3);
    }
  }
  ctx.fillStyle = STONE; // the steps down off the road's edge
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 90 + i * 14, b + 4 + i * 6, 40, 6);
  for (let i = 0; i < 9; i++) { // reeds round it
    const rx = x - 110 + i * 30, hh = 40 + (i * 13) % 40, lean = Math.sin(time * 0.7 + i) * 3;
    ctx.strokeStyle = i % 2 ? '#6a7a50' : '#7a8a58';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, b + 26);
    ctx.quadraticCurveTo(rx + lean * 0.5, b + 26 - hh * 0.5, rx + lean, b + 26 - hh);
    ctx.stroke();
  }
  ctx.restore();
}
export const ENTRANCE_ART = { mire: drawEntranceMire };

// ——— Grandfather Mire (ctx, w, h, st) => sil, origin under him on the floor, +x = facing ———
// A toad as big as a boathouse: a broad warty dome of green-brown with darker blotches, a pale creased belly, his back legs
// folded under, his front feet planted wide; a lily pad grown on his head like a cap, a flower on it; eyes like two gold
// lamps up on top, half-lidded and kind; a wide, sad mouth; and under his chin a throat sac that puffs out to croak, the
// shard glinting inside it (where `weak` puts the weak point). m.warn: the sac blown out full, his head up; charging:
// he lunges, flat and low, mouth open; st.asleep: freed, sitting in the reeds with his eyes shut.
function drawGrandfatherMire(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying, asleep } = st;
  const live = dying < 0.02 && !asleep;
  const breathe = live ? Math.sin(t * 1.4 + seed) : Math.sin(t * 0.6) * 0.4;
  const low = charging ? 0.82 : 1, up = warn ? 1.06 : 1;
  const skin = rageCol(TOAD, enr, 0.22), skinD = rageCol(TOAD_D, enr, 0.22);
  const dome = () => {
    ctx.moveTo(-w * 0.5, -4);
    ctx.bezierCurveTo(-w * 0.56, -h * 0.72 * low, -w * 0.18, -h * (0.98 + breathe * 0.01) * low * up, w * 0.14, -h * 0.9 * low * up);
    ctx.bezierCurveTo(w * 0.42, -h * 0.84 * low * up, w * 0.52, -h * 0.5 * low, w * 0.48, -h * 0.3);
    ctx.quadraticCurveTo(w * 0.42, -h * 0.06, w * 0.24, -4);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    dome();
  };
  ctx.save();
  // ripples in the pool round him
  ctx.strokeStyle = 'rgba(214,220,200,0.3)';
  ctx.lineWidth = 1.5;
  const k = (t * 0.4 + seed) % 1;
  ctx.beginPath();
  ctx.ellipse(0, 2, w * 0.5 + k * 50, 6 + k * 4, 0, 0, TAU);
  ctx.stroke();
  // back leg folded at his side
  ctx.fillStyle = skinD;
  ellipse(ctx, -w * 0.3, -h * 0.18, w * 0.22, h * 0.17);
  ctx.fillStyle = skin;
  ctx.strokeStyle = skinD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  dome();
  ctx.fill();
  ctx.stroke();
  // blotches and warts
  ctx.fillStyle = `rgba(58,70,38,${live ? 0.7 : 0.55})`;
  const r = mulberry32(8131);
  for (let i = 0; i < 16; i++) {
    const u = r(), v = r();
    circle(ctx, -w * 0.42 + u * w * 0.7, -h * (0.3 + v * 0.55) * low, 5 + r() * 9);
  }
  ctx.fillStyle = TOAD_L;
  for (let i = 0; i < 14; i++) {
    const u = r(), v = r();
    circle(ctx, -w * 0.4 + u * w * 0.66, -h * (0.28 + v * 0.58) * low, 2.5 + r() * 2.5);
  }
  // the pale creased belly
  ctx.fillStyle = BELLY;
  ctx.beginPath();
  ctx.ellipse(w * 0.14, -h * 0.16, w * 0.28, h * 0.16, 0, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,130,96,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-w * 0.08 + i * 18, -h * 0.06);
    ctx.quadraticCurveTo(-w * 0.04 + i * 18, -h * 0.2, w * 0.02 + i * 18, -h * 0.26);
  }
  ctx.stroke();
  // the front feet, planted wide
  ctx.fillStyle = skinD;
  for (const fx of [w * 0.02, w * 0.3]) {
    ctx.beginPath();
    ctx.ellipse(fx, -6, 22, 8, 0, 0, TAU);
    ctx.fill();
    for (const dx of [-14, 0, 14]) circle(ctx, fx + dx, -1, 4.5);
  }
  // the throat sac under his chin, puffing; the shard in it (MOBS.grandfather_mire.weak)
  const sx = w * 0.34, sy = -h * 0.22;
  const sr = (warn ? 1.35 : 0.8 + 0.15 * (0.5 + 0.5 * breathe)) * h * 0.13;
  ctx.fillStyle = warn ? 'rgba(232,224,186,0.95)' : 'rgba(214,206,170,0.92)';
  ctx.strokeStyle = 'rgba(140,130,96,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(sx, sy, sr * 1.1, sr, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, sx, sy, sr * 1.3, sr * 1.2, '255,236,190', live ? (warn ? 0.7 : 0.4) * sh : 0.08);
  ctx.fillStyle = live ? '#fff4d8' : '#b8b0a0';
  ctx.strokeStyle = '#a88a50';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sx - 1, sy - 8);
  ctx.lineTo(sx + 6, sy - 1);
  ctx.lineTo(sx + 1, sy + 6);
  ctx.lineTo(sx - 5, sy - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the wide, sad mouth (open when he lunges)
  const my = -h * 0.42 * low * up;
  ctx.strokeStyle = '#26301a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.47, my + h * 0.04);
  ctx.quadraticCurveTo(w * 0.24, my + h * (charging ? 0.14 : 0.1), -w * 0.06, my - h * 0.01);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(214,206,170,0.5)'; // the lip
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.44, my + h * 0.07);
  ctx.quadraticCurveTo(w * 0.24, my + h * (charging ? 0.17 : 0.13), -w * 0.02, my + h * 0.02);
  ctx.stroke();
  if (charging) {
    ctx.fillStyle = '#6a2e3a';
    ctx.beginPath();
    ctx.moveTo(w * 0.46, my + h * 0.05);
    ctx.quadraticCurveTo(w * 0.24, my + h * 0.16, 0, my);
    ctx.quadraticCurveTo(w * 0.24, my + h * 0.06, w * 0.46, my + h * 0.05);
    ctx.fill();
  }
  // the eyes: two gold lamps up on top, half-lidded
  const ey = -h * 0.84 * low * up;
  for (const ex of [w * 0.02, w * 0.24]) {
    ctx.fillStyle = skin;
    circle(ctx, ex, ey, h * 0.1);
    if (live) {
      glow(ctx, ex, ey, h * 0.14, h * 0.12, '232,184,74', 0.3);
      ctx.fillStyle = '#e8b84a';
      circle(ctx, ex, ey + 1, h * 0.07);
      ctx.fillStyle = INKC;
      ctx.fillRect(ex - h * 0.06, ey, h * 0.12, 3);
      ctx.fillStyle = skin; // the heavy lid
      ctx.beginPath();
      ctx.ellipse(ex, ey - h * 0.03, h * 0.085, h * (warn ? 0.02 : 0.045), 0, Math.PI, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = skinD;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(ex, ey, h * 0.05, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  // the lily-pad cap, with its flower
  const cx = w * 0.1, cy = -h * 0.94 * low * up;
  ctx.fillStyle = '#5e7a44';
  ctx.strokeStyle = '#3a4a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.3, h * 0.07, -0.08, -Math.PI * 0.92, Math.PI * 0.86);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2d8ec';
  for (let i = 0; i < 6; i++) ellipse(ctx, cx + w * 0.06 + Math.cos(i * 1.05) * 8, cy - 8 + Math.sin(i * 1.05) * 3.4, 7, 3.6, i * 1.05);
  ctx.fillStyle = '#ffe28a';
  circle(ctx, cx + w * 0.06, cy - 9, 3.4);
  ctx.restore();
  return sil;
}
export const BOSS_ART = { grandfather_mire: drawGrandfatherMire };
export const ULT_LOOKS = {}; // (The Long Promise is the shared `wave` ult with the pool's water: dens.js)

// ——— freed: he heaves himself up, steps aside off the stones into the reeds, and sits down there (the den's bossDie,
// MIRE_FREED_S long) ———
export function drawMireFreed(ctx, e) {
  const tt = e.t;
  if (tt > MIRE_FREED_S - 0.5) freedPending = true;
  const k = clamp((tt - 0.8) / (MIRE_FREED_S - 1.8), 0, 1);
  const x0 = e.x ?? 750;
  const x = x0 + (SIDE_X - x0) * (k * k * (3 - 2 * k)), hop = Math.abs(Math.sin(k * Math.PI * 3)) * 26 * (1 - k);
  ctx.save();
  ctx.globalAlpha *= tt < 0.6 ? tt / 0.6 : 1;
  ctx.translate(x, GROUND + 6 - hop);
  const s = 1 - k * 0.2;
  ctx.scale(s, s);
  drawGrandfatherMire(ctx, 210, 170, { t: tt, seed: 0, enr: false, warn: false, charging: false, dying: 0, asleep: k >= 1 });
  ctx.restore();
}
