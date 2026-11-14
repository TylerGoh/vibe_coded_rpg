// Docs: docs/places/keel.md
// The Keel (room KEEL, src/shared/rpg.js; the Citadel's depth pass, C5): a hard pocket, the hollow under the city among the
// Wheel's lowest teeth, down the ladder under the Grand Foundry's maintenance hatch. Dark and closed in: the keel's great
// iron ribs curving up into the dark, chains hanging, and overhead the underside of the jammed Wheel, its teeth as big as
// houses coming down out of the black; no light but the aether leaking up through cracks in the deck and a little through
// the hatch. Everything ticks, one beat slow (KEEL_BEAT). West to east: the Hatch Ladder (no mobs), the Bilge Walk, the
// Chain Locker and the Lowest Teeth, the Undercroft's way at its far end (a gate: src/citadel-gates.js, `fallentooth`). The
// grinds (GRINDS) heave a tooth up through slots in the deck on the server tick (grindAt), drawn here. The find, last in
// KEEL_PLATFORMS: high on a rib, the snapped tooth's empty socket.
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { KEEL_W, FIELD_GROUND, KEEL_PLATFORMS, KEEL_EXIT_X, GRINDS, grindAt } from './shared/rpg.js';
import { link } from './keel-art.js';

const GROUND = FIELD_GROUND;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const BRASS = '#f0c470', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON = '#3e3a48', IRON_D = '#22202a', IRON_L = '#5e5a6e';
const RUST = '#9a4a2a', RUST_E = '#3a1a12';
const AETHER = '150,240,234';
const SOCKET = KEEL_PLATFORMS.find((p) => p.kind === 'socket');
const KEEL_BEAT = 1.3; // seconds between ticks; each tick lands late in its beat (the clock is one beat slow)

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
function aetherGlow(ctx, x, y, r, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${AETHER},${a})`);
  g.addColorStop(1, `rgba(${AETHER},0)`);
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
}
// the tick: 0 most of the beat, a short jolt late in it
function tickJolt(time) {
  const b = (time / KEEL_BEAT) % 1;
  return b > 0.86 ? Math.sin(((b - 0.86) / 0.14) * Math.PI) : 0;
}

// the Wheel's teeth hanging overhead (world x, parallax 0.5), the ribs (world x), the cracks of aether in the deck
const TEETH = (() => {
  const r = mulberry32(9301);
  const out = [];
  for (let x = 120; x < KEEL_W * 0.5 + 700; x += 260 + r() * 120) out.push({ x, w: 120 + r() * 70, d: 90 + r() * 90 });
  return out;
})();
const RIBS = (() => {
  const out = [];
  for (let x = 300; x < KEEL_W; x += 560) out.push(x);
  return out;
})();
const CRACKS = (() => {
  const r = mulberry32(9311);
  return Array.from({ length: 22 }, () => ({ x: 620 + r() * (KEEL_W - 800), w: 20 + r() * 50, ph: r() * TAU }));
})();
const DUST = (() => {
  const r = mulberry32(9321);
  return Array.from({ length: 30 }, () => ({ x: r() * W, ph: r(), v: 0.05 + r() * 0.08 }));
})();

// Everything in the Keel behind the slimes
export function drawKeel(ctx, camX, viewW, time, tick) {
  const jolt = tickJolt(time);
  ctx.save();
  ctx.translate(camX, 0);
  ctx.fillStyle = vgrad(ctx, 'kl-dark', 0, H, [[0, '#06060a'], [0.55, '#0e0e16'], [1, '#16141e']]);
  ctx.fillRect(0, 0, W, H);
  drawWheelUnderside(ctx, camX, time, jolt);
  ctx.restore();
  const L = camX - 160, R = camX + viewW + 160;
  for (const x of RIBS) if (visible(x - 120, x + 120, L, R)) drawRib(ctx, x);
  drawHangingChains(ctx, L, R, time);
  drawDeck(ctx, L, R, time);
  GRINDS.forEach((g, i) => {
    if (visible(g.x - g.w / 2 - 40, g.x + g.w / 2 + 40, L, R)) drawGrind(ctx, g, tick == null ? { k: 0, up: false, warn: false } : grindAt(i, Math.floor(tick)), time);
  });
  if (visible(-60, 520, L, R)) drawHatchLadder(ctx, time);
  for (const p of KEEL_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'rib') drawGirder(ctx, p);
    else if (p.kind === 'stage') drawStage(ctx, p, time);
    else if (p.kind === 'tooth') drawToothLedge(ctx, p);
  }
  if (SOCKET && visible(SOCKET.x - 80, SOCKET.x + SOCKET.w + 80, L, R)) drawSocket(ctx, SOCKET, time);
  // dust sifting down on each tick, in screen space
  ctx.save();
  ctx.translate(camX, 0);
  for (const d of DUST) {
    const y = ((d.ph + time * d.v) % 1) * (GROUND - 40) + 20;
    ctx.fillStyle = `rgba(200,190,170,${0.12 + 0.25 * jolt})`;
    ctx.fillRect(((d.x - camX * 0.2) % W + W) % W, y, 1.4, 1.4);
  }
  ctx.restore();
}

// Overhead: the jammed Wheel's underside, its rim a dark band across the top, its teeth as big as houses coming down out of
// the black, each one twitching on the late tick and settling back (it strains, it doesn't turn)
function drawWheelUnderside(ctx, camX, time, jolt) {
  const px = camX * 0.5;
  ctx.fillStyle = '#121018';
  ctx.fillRect(0, 0, W, 46);
  ctx.strokeStyle = 'rgba(138,90,46,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 46);
  ctx.lineTo(W, 46);
  ctx.stroke();
  for (const t of TEETH) {
    const x = t.x - px;
    if (x < -t.w || x > W + t.w) continue;
    const y = 44 + jolt * 3;
    ctx.fillStyle = '#1a1822';
    ctx.beginPath();
    ctx.moveTo(x - t.w / 2, y);
    ctx.lineTo(x - t.w * 0.36, y + t.d);
    ctx.quadraticCurveTo(x, y + t.d + 16, x + t.w * 0.36, y + t.d);
    ctx.lineTo(x + t.w / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(138,90,46,0.3)'; // worn brass on the working faces
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // one tooth missing from the row: the gap the Bearers' tooth came out of, far overhead, a little light through it
  const gx = 1240 - px;
  if (gx > -100 && gx < W + 100) {
    ctx.fillStyle = 'rgba(150,240,234,0.05)';
    ctx.beginPath();
    ctx.moveTo(gx - 40, 46);
    ctx.lineTo(gx - 90, H);
    ctx.lineTo(gx + 90, H);
    ctx.lineTo(gx + 40, 46);
    ctx.fill();
  }
}

// One of the keel's great iron ribs, curving up out of the deck into the dark, riveted, rust bleeding down it
function drawRib(ctx, x) {
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(x - 34, GROUND);
  ctx.quadraticCurveTo(x - 50, GROUND - 220, x - 10, 40);
  ctx.lineTo(x + 18, 40);
  ctx.quadraticCurveTo(x - 18, GROUND - 220, x + 2, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(94,90,110,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(94,90,110,0.7)';
  for (let y = GROUND - 30; y > 60; y -= 36) {
    const k = (GROUND - y) / (GROUND - 40), rx = x - 16 - Math.sin(k * Math.PI) * 18 + k * 10;
    circle(ctx, rx, y, 2);
  }
  ctx.fillStyle = 'rgba(154,74,42,0.35)';
  ctx.fillRect(x - 22, GROUND - 160, 3, 120);
}

// Chains hanging down out of the dark here and there, swaying a little, the odd one ending in a hook
function drawHangingChains(ctx, L, R, time) {
  for (let x = Math.floor(L / 330) * 330 + 160; x < R; x += 330) {
    const len = 140 + ((x * 7) % 160), sw = Math.sin(time * 0.6 + x) * 0.04;
    for (let i = 0; i < len / 12; i++) {
      const y = 46 + i * 12;
      link(ctx, x + Math.sin(sw * i) * i, y, Math.PI / 2, 12, 2.4, i % 2 === 0, RUST_E);
    }
  }
}

// The deck: riveted iron plates, grease stains, cracks where aether leaks up from far below
function drawDeck(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'kl-deck', GROUND, H, [[0, '#2e2a36'], [1, '#121018']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(L, GROUND - 3, R - L, 7);
  ctx.strokeStyle = 'rgba(10,10,14,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    ctx.moveTo(x, GROUND + 4);
    ctx.lineTo(x, H);
  }
  ctx.moveTo(L, GROUND + 36);
  ctx.lineTo(R, GROUND + 36);
  ctx.stroke();
  ctx.fillStyle = 'rgba(94,90,110,0.6)';
  for (let x = Math.floor(L / 90) * 90 + 8; x < R; x += 45) circle(ctx, x, GROUND + 10, 1.6);
  ctx.fillStyle = 'rgba(10,8,6,0.5)'; // grease stains
  for (let x = Math.floor(L / 230) * 230 + 70; x < R; x += 230) ellipse(ctx, x + ((x * 13) % 60), GROUND + 2, 26 + ((x * 3) % 20), 3);
  for (const c of CRACKS) {
    if (c.x < L - 60 || c.x > R + 60) continue;
    const k = 0.6 + 0.4 * Math.sin(time * 1.4 + c.ph);
    aetherGlow(ctx, c.x, GROUND + 4, c.w * 0.9, 0.12 * k);
    ctx.strokeStyle = `rgba(${AETHER},${0.5 * k})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(c.x - c.w / 2, GROUND + 6);
    ctx.lineTo(c.x - c.w / 6, GROUND + 3);
    ctx.lineTo(c.x + c.w / 6, GROUND + 8);
    ctx.lineTo(c.x + c.w / 2, GROUND + 5);
    ctx.stroke();
  }
}

// A grind: a slot in the deck with a hazard stripe either side, the Wheel's tooth passing under it. On the warn the deck
// over it shudders, dust sifts down and the slot glows with the aether below; then a tooth heaves up through it, worn brass
// on its face, and sinks back
function drawGrind(ctx, g, st, time) {
  const x0 = g.x - g.w / 2, x1 = g.x + g.w / 2, b = GROUND;
  const shake = st.warn ? Math.sin(time * 50) * st.k * 1.6 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = '#060608';
  ctx.fillRect(x0, b - 2, g.w, 10);
  for (const sx of [x0 - 14, x1]) {
    ctx.fillStyle = '#c8a438';
    ctx.fillRect(sx, b - 2, 14, 6);
    ctx.fillStyle = IRON_D;
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + i * 5, b - 2, 2, 6);
  }
  if (st.warn) {
    ctx.fillStyle = `rgba(${AETHER},${0.12 + 0.3 * st.k})`;
    ctx.fillRect(x0, b - 3, g.w, 5);
    aetherGlow(ctx, g.x, b, g.w * 0.55, 0.18 * st.k);
    ctx.fillStyle = `rgba(200,190,170,${0.5 * st.k})`; // dust shaken off
    for (let i = 0; i < 6; i++) ctx.fillRect(x0 + ((i * 37 + time * 40) % g.w), b - 6 - ((time * 30 + i * 11) % 20), 1.6, 1.6);
  }
  if (st.k > 0 && !st.warn) { // the tooth, up through the slot
    const th = 120 * st.k, tw = g.w * 0.8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 10, b - 160, g.w + 20, 162);
    ctx.clip();
    ctx.fillStyle = '#2a2632';
    ctx.beginPath();
    ctx.moveTo(g.x - tw / 2, b + 4);
    ctx.lineTo(g.x - tw * 0.32, b - th);
    ctx.quadraticCurveTo(g.x, b - th - 12, g.x + tw * 0.32, b - th);
    ctx.lineTo(g.x + tw / 2, b + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(253,227,160,0.25)'; // the worn working face
    ctx.fillRect(g.x + tw * 0.1, b - th + 8, 6, th - 10);
    ctx.restore();
  }
  ctx.restore();
}

// The Hatch Ladder: the round hatch high in the dark overhead, a little of the Bastion's light coming down through it, an
// iron ladder from it to the deck; the jammed gear that held it lies on the deck beside the ladder's foot
function drawHatchLadder(ctx, time) {
  const x = KEEL_EXIT_X + 20, b = GROUND;
  ctx.fillStyle = 'rgba(255,232,190,0.06)'; // the light from above
  ctx.beginPath();
  ctx.moveTo(x - 30, 30);
  ctx.lineTo(x - 80, b);
  ctx.lineTo(x + 80, b);
  ctx.lineTo(x + 30, 30);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,232,190,0.4)';
  ellipse(ctx, x, 32, 34, 7);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, 32, 36, 8, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const rx of [x - 16, x + 16]) {
    ctx.moveTo(rx, 34);
    ctx.lineTo(rx, b);
  }
  for (let y = 60; y < b; y += 22) {
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x + 16, y);
  }
  ctx.stroke();
  // the jammed gear, freed, lying on its side by the ladder's foot, a broken tooth
  const gx = x + 120;
  ctx.fillStyle = BRASS_E;
  ctx.beginPath();
  ctx.ellipse(gx, b - 8, 40, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.ellipse(gx, b - 12, 36, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = BRASS_E;
  for (let i = 0; i < 12; i++) {
    if (i === 4) continue; // the broken tooth
    const a = (i / 12) * TAU;
    ctx.fillRect(gx + Math.cos(a) * 38 - 3, b - 12 + Math.sin(a) * 9 - 3, 6, 5);
  }
  ctx.fillStyle = IRON_D;
  ellipse(ctx, gx, b - 12, 8, 2);
  // a lamp left hanging on the ladder, lit
  const k = 0.75 + 0.25 * Math.sin(time * 2.2);
  ctx.fillStyle = `rgba(255,214,150,${0.15 * k})`;
  circle(ctx, x + 26, b - 150, 30);
  ctx.fillStyle = BRASS;
  ctx.fillRect(x + 22, b - 158, 8, 12);
  ctx.fillStyle = `rgba(255,230,180,${k})`;
  circle(ctx, x + 26, b - 150, 3);
}

// A rib girder: a riveted I-beam bolted across between two ribs
function drawGirder(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = IRON_D;
  ctx.fillRect(x, y - 4, w, 4);
  ctx.fillRect(x, y + 8, w, 4);
  ctx.fillStyle = IRON;
  ctx.fillRect(x, y - 1, w, 10);
  ctx.fillStyle = 'rgba(94,90,110,0.8)';
  for (let rx = x + 8; rx < x + w; rx += 18) circle(ctx, rx, y + 4, 1.5);
  ctx.fillStyle = 'rgba(154,74,42,0.5)';
  ctx.fillRect(x + w * 0.3, y + 8, 3, 12);
  ctx.strokeStyle = IRON_D; // brackets down into the dark
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 12);
  ctx.lineTo(x - 10, y + 50);
  ctx.moveTo(x + w - 10, y + 12);
  ctx.lineTo(x + w + 10, y + 50);
  ctx.stroke();
}

// A chain-stage: a platform of iron-shod planks hung on four chains from the dark, swinging very slightly
function drawStage(ctx, p, time) {
  const { x, y, w } = p;
  for (const cx of [x + 10, x + w - 10]) for (let i = 0; i < y / 12; i++) link(ctx, cx, y - 6 - i * 12, Math.PI / 2, 12, 2.2, i % 2 === 0, RUST_E);
  ctx.fillStyle = '#3a2e26';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,14,10,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let px = x + 24; px < x + w; px += 24) {
    ctx.moveTo(px, y - 3);
    ctx.lineTo(px, y + 5);
  }
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  ctx.fillRect(x, y - 4, w, 2);
}

// A tooth ledge: the flat top of one of the Wheel's lowest teeth, come down far enough to stand on, its sides going down
// into the dark under the deck's broken edge
function drawToothLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#24202c';
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + w + 6, y);
  ctx.lineTo(x + w - 16, GROUND);
  ctx.lineTo(x + 16, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(138,90,46,0.6)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(x - 6, y - 4, w + 12, 6);
  ctx.fillStyle = 'rgba(253,227,160,0.3)';
  ctx.fillRect(x + 4, y - 3, w - 8, 2);
}

// The find: high on a rib, the snapped tooth's empty socket: a deep square hole in a great brass boss, the stumps of sheared
// bolts round it, a tooth's root-mark worn into it, nothing in it. (The tooth is on the Bearer's Seat in Emberdeep; shown,
// not said.)
function drawSocket(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = IRON_D; // the ledge
  ctx.fillRect(x, y - 3, w, 8);
  ctx.fillStyle = BRASS_E;
  ctx.beginPath();
  ctx.roundRect(cx - 34, y - 78, 68, 72, 8);
  ctx.fill();
  ctx.strokeStyle = '#5a3a1e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#060608'; // the empty socket
  ctx.fillRect(cx - 18, y - 64, 36, 46);
  ctx.strokeStyle = 'rgba(253,227,160,0.5)'; // the worn mark where the tooth's root sat
  ctx.lineWidth = 1.4;
  ctx.strokeRect(cx - 16, y - 62, 32, 42);
  ctx.fillStyle = '#c8b090'; // sheared bolt stumps, bright where they broke
  for (const [bx, by] of [[-26, -70], [26, -70], [-26, -12], [26, -12], [0, -74]]) circle(ctx, cx + bx, y + by, 2.4);
  ctx.fillStyle = `rgba(150,240,234,${0.05 + 0.04 * Math.sin(time * 1.1)})`; // a faint light, so it can be found
  ellipse(ctx, cx, y - 40, w * 0.6, 40);
}
