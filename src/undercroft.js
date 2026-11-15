// Docs: docs/places/undercroft.md
// The Undercroft (room UNDERCROFT, src/shared/rpg.js; the Citadel's depth pass, C6 (b)): the Citadel's deep room, down the
// Tooth Stair cut beside the fallen tooth at the Keel's far end. The floor of the city's underside right under the Wheel:
// overhead the Wheel's rim fills the sky, its teeth as big as houses, and its spokes go off into the dark toward the hub
// in the east; no light but the aether leaking from cracks, and darker going east (the Weight Pit is nearly black). The
// Wheel strains on a slow, heavy beat (UC_BEAT, slower than the Keel's): on each one the teeth overhead shudder and the
// dust comes down. West to east: the Tooth Stair (no mobs), the Sump (leaked aether standing in pools), the Wrights'
// Gallery (the wheelwrights' scaffold still hung against the Wheel's face, their tools left on it) and the Weight Pit (the
// clock's drive weights hanging in the dark on chains), with the foot of the Spoke at the far end (UNDERCROFT_END_X). The
// find, last in UNDERCROFT_PLATFORMS: high on the scaffold, the Wheel's brake lever chained at HOLD.
import { H, W, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { UNDERCROFT_W, UNDERCROFT_PLATFORMS, UNDERCROFT_EXIT_X, UNDERCROFT_END_X, FIELD_GROUND } from './shared/rpg.js';
import { link } from './keel-art.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const BRASS = '#f0c470', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON = '#3a3644', IRON_D = '#1e1c26', IRON_L = '#5a566a';
const LEAD = '#56565e', LEAD_D = '#2e2e36';
const TIMBER = '#4a3a2c', TIMBER_D = '#2a2018';
const AETHER = '150,240,234';
const BRAKE = UNDERCROFT_PLATFORMS.find((p) => p.kind === 'brake');
const UC_BEAT = 2.4; // seconds between the Wheel's heaves: slow and heavy, the Spoke's heartbeat starts from it
const SUMP = [520, 1900], GALLERY = [1900, 3300], PIT = [3300, UNDERCROFT_W];

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
// the heave: 0 most of the beat, a long slow strain at the end of it
export function heave(time) {
  const b = (time / UC_BEAT) % 1;
  return b > 0.78 ? Math.sin(((b - 0.78) / 0.22) * Math.PI) : 0;
}
// how dark it is at world x: 0 at the stair, 1 at the Spoke's foot
const darkAt = (x) => clamp((x - 400) / (UNDERCROFT_W - 600), 0, 1);

// seeded scenery: the Wheel's teeth overhead (parallax 0.35), the spokes' feet, the sump pools, cracks, hanging weights
const R = mulberry32(9401);
const TEETH = (() => {
  const out = [];
  for (let x = 60; x < UNDERCROFT_W * 0.35 + W + 300; x += 300 + R() * 90) out.push({ x, w: 170 + R() * 60, d: 130 + R() * 70 });
  return out;
})();
const SPOKES = [380, 1500, 2700, 3900].map((x) => ({ x, lean: 0.55 + R() * 0.2 }));
const POOLS = Array.from({ length: 9 }, () => ({ x: SUMP[0] + 60 + R() * (SUMP[1] - SUMP[0] - 120), w: 60 + R() * 110, ph: R() * TAU }));
const CRACKS = Array.from({ length: 20 }, () => ({ x: 560 + R() * (UNDERCROFT_W - 760), w: 20 + R() * 46, ph: R() * TAU }));
const WEIGHTS = Array.from({ length: 7 }, (_, i) => ({ x: PIT[0] + 90 + i * 170 + R() * 60, y: 120 + R() * 120, s: 0.7 + R() * 0.5, ph: R() * TAU }));
const POLES = (() => {
  const out = [];
  for (let x = GALLERY[0] + 40; x < GALLERY[1] - 20; x += 150 + R() * 40) out.push(x);
  return out;
})();
const MOTES = Array.from({ length: 36 }, () => ({ x: R() * W, ph: R(), v: 0.03 + R() * 0.05, s: 0.8 + R() * 1.2 }));

// Everything in the Undercroft behind the slimes
export function drawUndercroft(ctx, camX, viewW, time) {
  const hv = heave(time), dk = darkAt(camX + W / 2);
  ctx.save();
  ctx.translate(camX, 0);
  ctx.fillStyle = vgrad(ctx, 'uc-dark', 0, H, [[0, '#040406'], [0.5, '#0a0a10'], [1, '#121018']]);
  ctx.fillRect(0, 0, W, H);
  drawHub(ctx, camX, time);
  drawWheel(ctx, camX, hv);
  ctx.restore();
  const L = camX - 160, Rr = camX + viewW + 160;
  for (const s of SPOKES) if (visible(s.x - 300, s.x + 400, L, Rr)) drawSpokeFoot(ctx, s, dk);
  if (visible(GALLERY[0] - 80, GALLERY[1] + 80, L, Rr)) drawScaffold(ctx, L, Rr, time, hv);
  if (visible(PIT[0] - 100, PIT[1], L, Rr)) drawWeights(ctx, L, Rr, time, hv);
  drawFloor(ctx, L, Rr, time);
  if (visible(SUMP[0] - 60, SUMP[1] + 60, L, Rr)) drawPools(ctx, L, Rr, time);
  if (visible(-60, 560, L, Rr)) drawToothStair(ctx, time);
  for (const p of UNDERCROFT_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, Rr)) continue;
    if (p.kind === 'housing') drawHousing(ctx, p, time);
    else if (p.kind === 'scaffold') drawPlank(ctx, p);
    else if (p.kind === 'cradle') drawCradle(ctx, p, time, hv);
  }
  if (BRAKE && visible(BRAKE.x - 80, BRAKE.x + BRAKE.w + 80, L, Rr)) drawBrake(ctx, BRAKE, time);
  if (visible(UNDERCROFT_END_X - 300, UNDERCROFT_W + 40, L, Rr)) drawSpokeWay(ctx, time, hv);
  // dust coming down on the heave, and aether motes drifting UP (time is wrong down here too), in screen space
  ctx.save();
  ctx.translate(camX, 0);
  for (const m of MOTES) {
    const x = ((m.x - camX * 0.25) % W + W) % W;
    const y = GROUND - ((m.ph + time * m.v) % 1) * (GROUND - 40);
    ctx.fillStyle = `rgba(${AETHER},${0.18 + 0.12 * Math.sin(time * 2 + m.ph * 9)})`;
    circle(ctx, x, y, m.s);
    if (hv > 0.05) {
      ctx.fillStyle = `rgba(200,190,170,${0.3 * hv})`;
      ctx.fillRect((x * 1.7) % W, ((m.ph * 400 + time * 80) % (GROUND - 40)) + 20, 1.4, 1.4);
    }
  }
  ctx.restore();
}

// Far off east, through the spokes: the hub, a great dark drum with a faint pale-blue light at its heart (the Escapement's
// shard, seen from a long way off), getting nearer as you go
function drawHub(ctx, camX, time) {
  const k = clamp(camX / (UNDERCROFT_W - W), 0, 1);
  const hx = W * 0.92 - camX * 0.06 + 120 * (1 - k), hy = 210, r = 110 + 60 * k;
  ctx.fillStyle = '#08080c';
  circle(ctx, hx, hy, r);
  ctx.strokeStyle = 'rgba(138,90,46,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hx, hy, r, 0, TAU);
  ctx.stroke();
  const p = 0.6 + 0.4 * Math.sin(time * (TAU / UC_BEAT));
  glow(ctx, hx, hy + r * 0.3, 60 + 40 * k, 60 + 40 * k, AETHER, (0.1 + 0.16 * k) * p);
}

// Overhead: the Wheel's rim, a great dark band across the top, its teeth as big as houses hanging down; each one shudders
// on the heave and settles back (it strains, it doesn't turn)
function drawWheel(ctx, camX, hv) {
  const px = camX * 0.35;
  ctx.fillStyle = '#0e0c14';
  ctx.fillRect(0, 0, W, 62);
  ctx.strokeStyle = 'rgba(138,90,46,0.32)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 62);
  ctx.lineTo(W, 62);
  ctx.stroke();
  ctx.fillStyle = 'rgba(94,90,110,0.35)';
  for (let x = -((px * 1) % 60); x < W; x += 60) circle(ctx, x, 30, 2.2);
  for (const t of TEETH) {
    const x = t.x - px;
    if (x < -t.w || x > W + t.w) continue;
    const y = 60 + hv * 4;
    ctx.fillStyle = '#16141e';
    ctx.beginPath();
    ctx.moveTo(x - t.w / 2, y);
    ctx.lineTo(x - t.w * 0.34, y + t.d);
    ctx.quadraticCurveTo(x, y + t.d + 22, x + t.w * 0.34, y + t.d);
    ctx.lineTo(x + t.w / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(138,90,46,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(253,227,160,0.06)'; // the worn working face
    ctx.fillRect(x + t.w * 0.18, y + 10, 5, t.d - 14);
  }
}

// The foot of one of the Wheel's spokes: a beam of black iron as wide as a road, coming down out of the dark overhead at a
// slant and going off east toward the hub, riveted, its edge picked out by the aether below
function drawSpokeFoot(ctx, s, dk) {
  const x = s.x, top = 60, foot = GROUND - 30;
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(x - 60, top);
  ctx.lineTo(x + 40, top);
  ctx.lineTo(x + 40 + (foot - top) * s.lean, foot);
  ctx.lineTo(x - 60 + (foot - top) * s.lean, foot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${AETHER},${0.14 * (1 - dk * 0.6)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 40, top);
  ctx.lineTo(x + 40 + (foot - top) * s.lean, foot);
  ctx.stroke();
  ctx.fillStyle = 'rgba(94,90,110,0.45)';
  for (let y = top + 24; y < foot; y += 30) circle(ctx, x - 10 + (y - top) * s.lean, y, 1.8);
}

// The wheelwrights' scaffold, still hung against the Wheel's face over the Wrights' Gallery: timber poles going up into
// the dark, cross-braces, ropes, a few tools left hanging (a spanner, a lamp gone out, a bucket)
function drawScaffold(ctx, L, Rr, time, hv) {
  ctx.lineCap = 'round';
  for (const x of POLES) {
    if (x < L - 40 || x > Rr + 40) continue;
    ctx.strokeStyle = TIMBER_D;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x + hv * 1.2, 60);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,96,70,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, GROUND);
    ctx.lineTo(x - 3, 60);
    ctx.stroke();
    ctx.strokeStyle = TIMBER_D; // a cross-brace to the next
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 60);
    ctx.lineTo(x + 140, 180);
    ctx.stroke();
    const i = Math.round(x) % 3;
    const hy = 210 + (Math.round(x) % 70), sw = Math.sin(time * 0.7 + x) * 3;
    ctx.strokeStyle = 'rgba(150,130,100,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 20, 140);
    ctx.lineTo(x + 20 + sw, hy);
    ctx.stroke();
    if (i === 0) { // a spanner
      ctx.fillStyle = IRON_L;
      ctx.fillRect(x + 18 + sw, hy, 4, 26);
      circle(ctx, x + 20 + sw, hy + 30, 6);
      ctx.fillStyle = IRON_D;
      circle(ctx, x + 20 + sw, hy + 30, 2.5);
    } else if (i === 1) { // a lamp, out
      ctx.fillStyle = BRASS_E;
      ctx.fillRect(x + 15 + sw, hy, 10, 14);
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(x + 17 + sw, hy + 2, 6, 9);
    } else { // a bucket
      ctx.fillStyle = TIMBER;
      ctx.beginPath();
      ctx.moveTo(x + 12 + sw, hy);
      ctx.lineTo(x + 28 + sw, hy);
      ctx.lineTo(x + 25 + sw, hy + 16);
      ctx.lineTo(x + 15 + sw, hy + 16);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// The Weight Pit's weights: the clock's drive weights, great bells of lead hanging in the dark on chains that go up out of
// sight, each swaying a little and dropping a hair on the heave
function drawWeights(ctx, L, Rr, time, hv) {
  for (const w of WEIGHTS) {
    if (w.x < L - 60 || w.x > Rr + 60) continue;
    const sw = Math.sin(time * 0.4 + w.ph) * 4, y = w.y + hv * 3;
    for (let cy = 60; cy < y - 30 * w.s; cy += 12) link(ctx, w.x + sw * ((cy - 60) / (y - 60)), cy, Math.PI / 2, 12, 2.2, (cy / 12) % 2 < 1, '#1a0e0a');
    ctx.save();
    ctx.translate(w.x + sw, y);
    ctx.scale(w.s, w.s);
    ctx.fillStyle = LEAD_D;
    ctx.beginPath();
    ctx.moveTo(-14, -34);
    ctx.quadraticCurveTo(-34, 10, -40, 40);
    ctx.lineTo(40, 40);
    ctx.quadraticCurveTo(34, 10, 14, -34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,130,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(160,160,170,0.18)';
    ctx.fillRect(-24, 4, 6, 30);
    ctx.fillStyle = LEAD;
    ctx.fillRect(-42, 38, 84, 6);
    ctx.restore();
  }
}

// The floor: the city's underside, iron plates over the dark, worn into ruts by things dragged; aether leaking up through
// cracks, dimmer going east
function drawFloor(ctx, L, Rr, time) {
  ctx.fillStyle = vgrad(ctx, 'uc-floor', GROUND, H, [[0, '#26222e'], [1, '#0c0a10']]);
  ctx.fillRect(L, GROUND, Rr - L, H - GROUND + 10);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(L, GROUND - 3, Rr - L, 7);
  ctx.strokeStyle = 'rgba(6,6,10,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 110) * 110; x < Rr; x += 110) {
    ctx.moveTo(x, GROUND + 4);
    ctx.lineTo(x + 10, H);
  }
  ctx.moveTo(L, GROUND + 40);
  ctx.lineTo(Rr, GROUND + 40);
  ctx.stroke();
  ctx.fillStyle = 'rgba(94,90,110,0.5)';
  for (let x = Math.floor(L / 55) * 55 + 8; x < Rr; x += 55) circle(ctx, x, GROUND + 12, 1.5);
  for (const c of CRACKS) {
    if (c.x < L - 60 || c.x > Rr + 60) continue;
    const k = (0.6 + 0.4 * Math.sin(time * 1.1 + c.ph)) * (1 - 0.6 * darkAt(c.x));
    glow(ctx, c.x, GROUND + 4, c.w, 16, AETHER, 0.2 * k);
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

// The Sump's pools: leaked aether standing on the plates, blue-black and thick, a pale light moving in it slowly
function drawPools(ctx, L, Rr, time) {
  for (const p of POOLS) {
    if (p.x < L - 120 || p.x > Rr + 120) continue;
    const k = 0.6 + 0.4 * Math.sin(time * 0.7 + p.ph);
    glow(ctx, p.x, GROUND, p.w * 0.9, 24, AETHER, 0.16 * k);
    ctx.fillStyle = '#0e2a30';
    ellipse(ctx, p.x, GROUND + 2, p.w / 2, 5);
    ctx.fillStyle = `rgba(${AETHER},${0.22 * k})`;
    ellipse(ctx, p.x - p.w * 0.12 + Math.sin(time * 0.3 + p.ph) * p.w * 0.1, GROUND + 1, p.w * 0.18, 1.6);
  }
}

// The Tooth Stair: steps cut down out of the dark at the top left (the Keel's shaft), a little of the Keel's aether light
// coming down, and the fallen tooth's point showing over the stairhead
function drawToothStair(ctx, time) {
  const x = UNDERCROFT_EXIT_X + 30, b = GROUND;
  ctx.fillStyle = `rgba(${AETHER},0.05)`;
  ctx.beginPath();
  ctx.moveTo(x - 40, 0);
  ctx.lineTo(x - 70, b);
  ctx.lineTo(x + 170, b);
  ctx.lineTo(x + 70, 0);
  ctx.fill();
  for (let i = 0; i < 10; i++) {
    const sx = x - 30 + i * 22, sy = 70 + i * 38;
    ctx.fillStyle = i % 2 ? IRON : IRON_L;
    ctx.fillRect(sx, sy, 40, 8);
    ctx.fillStyle = IRON_D;
    ctx.fillRect(sx, sy + 8, 40, 30);
  }
  ctx.fillStyle = '#24202c'; // the tooth's point, over the stairhead
  ctx.beginPath();
  ctx.moveTo(x + 50, 0);
  ctx.lineTo(x + 140, 0);
  ctx.quadraticCurveTo(x + 130, 50, x + 90, 64);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  const k = 0.75 + 0.25 * Math.sin(time * 2);
  glow(ctx, x + 10, b - 40, 60, 40, AETHER, 0.14 * k);
}

// A broken gear-housing (the Sump's ledges): half of a great brass casing lying on its side, its rim flat on top
function drawHousing(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 4);
  ctx.quadraticCurveTo(cx, y + 90, x + w - 10, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(x, y - 2, w, 9);
  ctx.fillStyle = 'rgba(253,227,160,0.25)';
  ctx.fillRect(x + 4, y - 2, w - 8, 2);
  ctx.fillStyle = BRASS_E; // its teeth, broken off short round the rim
  for (let tx = x + 12; tx < x + w - 8; tx += 22) ctx.fillRect(tx, y + 7, 8, 6);
  const k = 0.5 + 0.5 * Math.sin(time * 1.2 + x);
  glow(ctx, cx, y + 40, w * 0.3, 26, AETHER, 0.1 * k);
}

// A scaffold plank: two boards on iron brackets, a rope lashing
function drawPlank(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = TIMBER;
  ctx.fillRect(x, y - 1, w, 8);
  ctx.fillStyle = TIMBER_D;
  ctx.fillRect(x, y + 7, w, 3);
  ctx.fillStyle = 'rgba(160,130,96,0.4)';
  ctx.fillRect(x, y - 1, w, 2);
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 10);
  ctx.lineTo(x + 30, y + 40);
  ctx.moveTo(x + w - 14, y + 10);
  ctx.lineTo(x + w - 30, y + 40);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,150,110,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const lx of [x + 8, x + w - 8]) {
    ctx.moveTo(lx - 3, y - 1);
    ctx.lineTo(lx + 3, y + 9);
  }
  ctx.stroke();
}

// A weight's cradle (the Weight Pit's ledges): an iron cradle that once carried a weight, hung on two chains from the dark
function drawCradle(ctx, p, time, hv) {
  const { x, y, w } = p, dy = hv * 2;
  for (const cx of [x + 16, x + w - 16]) for (let cy = 60; cy < y - 4; cy += 12) link(ctx, cx, cy + dy * ((cy - 60) / (y - 60)), Math.PI / 2, 12, 2.2, (cy / 12) % 2 < 1, '#1a0e0a');
  ctx.fillStyle = IRON;
  ctx.fillRect(x, y - 1 + dy, w, 8);
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 7 + dy);
  ctx.quadraticCurveTo(x + w / 2, y + 34 + dy, x + w - 6, y + 7 + dy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(94,90,110,0.8)';
  for (let rx = x + 10; rx < x + w; rx += 20) circle(ctx, rx, y + 3 + dy, 1.4);
}

// The find: high on the scaffold, the Wheel's brake lever, a great iron handle on a quadrant, pulled all the way to HOLD
// and chained there, a padlock on the chain stamped with an hourglass. Beside it on the beam, a wheelwright's chalk tally,
// strokes in fives, the last one stopped halfway. Nothing says whose hourglass
function drawBrake(ctx, p, time) {
  const x = p.x + p.w / 2, y = p.y;
  ctx.fillStyle = TIMBER;
  ctx.fillRect(p.x, y - 1, p.w, 8);
  ctx.fillStyle = IRON_D; // the quadrant
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.arc(x, y - 2, 34, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = IRON_L;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i / 5) * (Math.PI / 2);
    circle(ctx, x + Math.cos(a) * 30, y - 2 + Math.sin(a) * 30, 1.4);
  }
  ctx.strokeStyle = IRON; // the lever, hard over at HOLD
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x - 30, y - 30);
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  circle(ctx, x - 31, y - 31, 4);
  ctx.strokeStyle = '#3a1a12'; // the chain round it to a ring in the beam
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 24, y - 24);
  ctx.quadraticCurveTo(x - 30, y - 6, x - 36, y - 1);
  ctx.stroke();
  ctx.fillStyle = BRASS; // the padlock, an hourglass stamped on it
  ctx.beginPath();
  ctx.roundRect(x - 33, y - 14, 10, 9, 2);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 31, y - 12);
  ctx.lineTo(x - 25, y - 12);
  ctx.lineTo(x - 31, y - 7);
  ctx.lineTo(x - 25, y - 7);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,236,226,0.7)'; // the chalk tally on the beam: strokes in fives, the last stopped halfway
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let g = 0; g < 3; g++) {
    const gx = x + 10 + g * 14;
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(gx + i * 2.4, y + 1);
      ctx.lineTo(gx + i * 2.4, y + 6);
    }
    ctx.moveTo(gx - 1, y + 5);
    ctx.lineTo(gx + 9, y + 2);
  }
  ctx.moveTo(x + 52, y + 1);
  ctx.lineTo(x + 52, y + 3.5);
  ctx.stroke();
  const k = 0.5 + 0.5 * Math.sin(time * 1.5);
  glow(ctx, x - 28, y - 10, 20, 14, '253,227,160', 0.12 * k);
}

// The foot of the Spoke at the far east end: a spoke's root coming down out of the dark onto the floor, a ramp of iron
// going up and away east into the black, its rivets catching the shard's light far ahead, which beats with the Wheel
function drawSpokeWay(ctx, time, hv) {
  const x = UNDERCROFT_END_X, b = GROUND;
  const p = 0.6 + 0.4 * Math.sin(time * (TAU / UC_BEAT));
  glow(ctx, x + 40, b - 140, 160, 150, AETHER, 0.12 * p + 0.06 * hv);
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(x - 140, b);
  ctx.lineTo(x + 100, b - 210);
  ctx.lineTo(x + 200, b - 210);
  ctx.lineTo(x + 200, b);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${AETHER},${0.3 * p})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 140, b);
  ctx.lineTo(x + 100, b - 210);
  ctx.stroke();
  ctx.fillStyle = 'rgba(94,90,110,0.6)';
  for (let i = 1; i < 8; i++) circle(ctx, x - 140 + i * 30, b - i * 26 + 10, 1.8);
}

// Over the slimes: the dark closing in at the edges, heavier going east (nearly black in the Weight Pit). Baked once and
// drawn with globalAlpha (docs/performance.md: big gradients)
let vignette = null;
export function drawUndercroftFront(ctx, camX, viewW, time) {
  const dk = darkAt(camX + W / 2);
  if (!vignette || vignette.ctx !== ctx) {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 140, W / 2, H * 0.55, W * 0.7);
    g.addColorStop(0, 'rgba(4,4,8,0)');
    g.addColorStop(1, 'rgba(4,4,8,1)');
    vignette = { ctx, g };
  }
  ctx.save();
  ctx.translate(camX, 0);
  ctx.globalAlpha = 0.35 + 0.4 * dk;
  ctx.fillStyle = vignette.g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
