// Docs: docs/places/escapement.md, docs/performance.md
// The Catch (room 96, theme 'catch'): the Escapement's den at the end of the Spoke (the Citadel's C6 (c), story/c6-plan.md),
// and the Escapement itself; the pallets' states, the Stopping's grey, and its three ultimates' effects. The hollow round the
// Wheel's hub: the hub's iron casing for walls, curving in overhead; the great escape wheel across the top, half in the dark,
// its teeth like a row of houses; riveted plates for a floor, worn into a groove where the bob once passed lower; bearing
// housings and brackets for ledges; no light but the shard and aether leaking up through the casing's seams. The Spoke
// comes in through the hub's door at the west end. dens.js imports this file (DEN_ART, BOSS_ART, FX2), so it must NOT import
// it. The den's static layer is baked (as the other final dens'); the wheel's teeth turn live (a tooth on every Tick).
// The anchor's art eases a handful of numbers between poses (POSES) so it moves between them instead of swapping.
import { H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { DEN_EXIT_X } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR } from './shared/final.js';
import { CATCH_PLATFORMS, ESC_MID, PALLETS, PALLET_R, HOLD_SAFE_R, haulX, HOUSING_W, HOUSING_E, HIGH_W, HIGH_E } from './shared/escapement.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIN_FLOOR;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
export const AETHER = '150,240,234', BRASSLIGHT = '253,214,150';
export function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35);
}
function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
const lerp = (a, b, k) => a + (b - a) * k;
const IRON = '#2a2732', IRON_D = '#15131b', IRON_L = '#4a4658', BRASS = '#9a6c36', BRASS_L = '#e0b066', BRASS_D = '#4e341a', INK = '#0c0a10';

// ——— what the client says it's doing (src/escapement.js), eased for the art ———
// clench: both pallets pulled in tight on the teeth · sw: a pallet swung down (−1 west, +1 east) · down: how far · shard: the
// shard's light · open: the arbor's plates apart (Rewound) · grey: stopped (phase 4) · lift: the anchor heaved up (an
// ultimate's wind-up)
const POSES = {
  hold: { clench: 0.4, sw: 0, down: 0, shard: 0.45, open: 0, grey: 0, lift: 0 },
  count: { clench: 0.4, sw: 0, down: 0, shard: 1, open: 0, grey: 0, lift: 0 },
  strikeW: { clench: 0.2, sw: -1, down: 0.25, shard: 0.7, open: 0, grey: 0, lift: 0 },
  strikeE: { clench: 0.2, sw: 1, down: 0.25, shard: 0.7, open: 0, grey: 0, lift: 0 },
  downW: { clench: 0.1, sw: -1, down: 1, shard: 0.6, open: 0, grey: 0, lift: 0 },
  downE: { clench: 0.1, sw: 1, down: 1, shard: 0.6, open: 0, grey: 0, lift: 0 },
  tock: { clench: 1, sw: 0, down: 0, shard: 0.8, open: 0, grey: 0, lift: 0.2 },
  locked: { clench: 1, sw: 0, down: 0, shard: 0.3, open: 0, grey: 0, lift: 0 },
  brake: { clench: 0.8, sw: 0, down: 0, shard: 0.35, open: 0, grey: 0, lift: 0 },
  teeth: { clench: 0.7, sw: 0, down: 0, shard: 0.7, open: 0, grey: 0, lift: 0.1 },
  haul: { clench: 1, sw: 0, down: 0, shard: 0.9, open: 0, grey: 0, lift: 0.5 },
  rewound: { clench: 0.6, sw: 0, down: 0, shard: 1, open: 1, grey: 0, lift: 0.6 },
  drop: { clench: 0.2, sw: 0, down: 0, shard: 0.5, open: 0.2, grey: 0, lift: 0 },
  stag: { clench: 0, sw: 0, down: 0, shard: 0.2, open: 0.3, grey: 0, lift: -0.2 },
  stopped: { clench: 0.6, sw: 0, down: 0, shard: 0.6, open: 0, grey: 1, lift: 0 },
  freed: { clench: 0, sw: 0, down: 0, shard: 0, open: 0, grey: 0, lift: -0.15 },
};
let look = { po: 'hold', ph: 0, enr: false, p: { ...POSES.hold }, t: 0, freedAt: -1, wheel: 0, wheelTo: 0, jam: [0, 0] };
export function setEscLook(o) {
  if (o.po === 'freed' && look.po !== 'freed') {
    look.freedAt = look.t;
    look.wheelTo += 1; // (the Wheel slips one tooth round)
  }
  Object.assign(look, o);
}
export const escLook = () => look;
// a Tick: the escape wheel jolts one tooth round
export const toothGo = () => (look.wheelTo += 1);
export function stepEscLook(dt, t) {
  look.t = t;
  const want = POSES[look.po] ?? POSES.hold, k = Math.min(1, dt * (look.po === 'downW' || look.po === 'downE' ? 9 : 3.5));
  for (const key of Object.keys(want)) look.p[key] = lerp(look.p[key] ?? want[key], want[key], k);
  look.wheel += (look.wheelTo - look.wheel) * Math.min(1, dt * (look.po === 'freed' ? 0.6 : 5));
}

// ——— the den's static layer (baked) ———
const BX0 = -60, BX1 = FIN_W + 60;
const r0 = mulberry32(9696);
const SEAMS = Array.from({ length: 14 }, () => ({ x: BX0 + r0() * (BX1 - BX0), w: 30 + r0() * 90, y: GROUND + 6 + r0() * 30 }));
const MOTES = Array.from({ length: 46 }, () => ({ x: r0() * FIN_W, y: r0() * GROUND, v: 6 + r0() * 12, s: 0.7 + r0() * 1.2, ph: r0() * TAU }));
// the escape wheel overhead: its middle far above, its rim across the top of the den
export const WHEEL = { x: ESC_MID, y: -1180, r: 1290, teeth: 140 };

let bake = null;
function denLayer(res) {
  if (bake && bake.res === res) return bake.c;
  const c = bake?.c ?? document.createElement('canvas');
  c.width = Math.ceil((BX1 - BX0) * res);
  c.height = Math.ceil(H * res);
  const g = c.getContext('2d');
  g.setTransform(res, 0, 0, res, -BX0 * res, 0);
  drawDenStatic(g);
  bake = { res, c };
  return c;
}
function drawDenStatic(ctx) {
  const r = mulberry32(9797); // (its own stream: a rebake draws the same den)
  ctx.save();
  let g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#05050a');
  g.addColorStop(0.55, '#0c0b14');
  g.addColorStop(1, '#16131e');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, 0, BX1 - BX0, GROUND);
  // the hub's casing: great curved iron walls leaning in from both ends, riveted bands
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? BX0 : BX1, xin = side < 0 ? 170 : FIN_W - 170;
    ctx.fillStyle = IRON_D;
    ctx.beginPath();
    ctx.moveTo(x0, -20);
    ctx.lineTo(x0, GROUND + 40);
    ctx.lineTo(xin - side * 40, GROUND + 40);
    ctx.quadraticCurveTo(xin + side * 30, 200, xin - side * 160, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,84,110,0.35)';
    ctx.lineWidth = 3;
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      const f = k / 5;
      ctx.moveTo(lerp(x0, xin - side * 160, f * 0.9), -20);
      ctx.quadraticCurveTo(lerp(x0, xin + side * 30, f), 200, lerp(x0, xin - side * 40, f), GROUND + 40);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(120,112,140,0.35)';
    for (let y = 30; y < GROUND; y += 34) circle(ctx, lerp(x0, xin, 0.82) + Math.sin(y * 0.02) * 30 * side, y, 2.4);
  }
  // the escape wheel's disc behind its teeth (the teeth turn live)
  ctx.fillStyle = '#0a0910';
  ctx.beginPath();
  ctx.arc(WHEEL.x, WHEEL.y, WHEEL.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,80,46,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(WHEEL.x, WHEEL.y, WHEEL.r - 30, 0, TAU);
  ctx.stroke();
  // its spokes, going up out of sight
  ctx.strokeStyle = 'rgba(40,36,52,0.9)';
  ctx.lineWidth = 34;
  for (const a of [-0.36, -0.12, 0.12, 0.36]) {
    ctx.beginPath();
    ctx.moveTo(WHEEL.x + Math.sin(a) * (WHEEL.r - 40), WHEEL.y + Math.cos(a) * (WHEEL.r - 40));
    ctx.lineTo(WHEEL.x + Math.sin(a) * 600, WHEEL.y + Math.cos(a) * 600);
    ctx.stroke();
  }
  // the hub's door at the west end (the Spoke comes in through it)
  const dx = DEN_EXIT_X + 10;
  ctx.fillStyle = '#0a0a0e';
  circle(ctx, dx, GROUND - 70, 72);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(dx, GROUND - 70, 72, 0, TAU);
  ctx.stroke();
  glow(ctx, dx, GROUND - 60, 60, 60, AETHER, 0.14);
  // the floor: the hub's casing, riveted plates, a worn groove in the middle where the bob passed lower once
  g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, '#3a3644');
  g.addColorStop(0.2, '#24212c');
  g.addColorStop(1, '#0e0c12');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, GROUND, BX1 - BX0, H - GROUND);
  ctx.fillStyle = 'rgba(160,150,190,0.22)';
  ctx.fillRect(BX0, GROUND, BX1 - BX0, 2.5);
  ctx.strokeStyle = 'rgba(8,6,12,0.7)';
  ctx.lineWidth = 2;
  for (let x = BX0; x < BX1; x += 110) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND + 2);
    ctx.lineTo(x - 14, H);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(150,140,170,0.4)';
  for (let x = BX0 + 10; x < BX1; x += 22) circle(ctx, x, GROUND + 9, 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ellipse(ctx, ESC_MID, GROUND + 22, 520, 12);
  ctx.strokeStyle = 'rgba(200,190,220,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(ESC_MID, GROUND + 18, 500, 9, 0, 0, Math.PI);
  ctx.stroke();
  // aether leaking up through the seams
  for (const s of SEAMS) {
    glow(ctx, s.x, s.y, s.w, 10, AETHER, 0.22);
    ctx.fillStyle = 'rgba(190,255,250,0.5)';
    ctx.fillRect(s.x - s.w * 0.4, s.y - 1, s.w * 0.8, 1.5);
  }
  // the ledges: bearing housings, brackets, the high bearing ledges
  CATCH_PLATFORMS.forEach((p) => drawLedge(ctx, p, r));
  ctx.restore();
}
function drawLedge(ctx, p, r) {
  const y = p.y, x0 = p.x, x1 = p.x + p.w, mid = (x0 + x1) / 2;
  if (p.kind === 'housing') { // a bearing housing: a drum of iron banded in brass, set in the floor
    ctx.fillStyle = IRON;
    ctx.beginPath();
    ctx.roundRect(x0 + 6, y, p.w - 12, GROUND - y + 6, 10);
    ctx.fill();
    ctx.fillStyle = BRASS_D;
    for (const yy of [y + 18, y + 60]) ctx.fillRect(x0 + 6, yy, p.w - 12, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x1 - 30, y, 24, GROUND - y + 6);
  } else { // a bracket off the casing: an iron shelf on a strut
    const wall = mid < FIN_W / 2 ? -1 : 1;
    ctx.strokeStyle = IRON_D;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(p.kind === 'high' ? (wall < 0 ? x0 : x1) : mid, y + 10);
    ctx.lineTo(p.kind === 'high' ? (wall < 0 ? x0 - 40 : x1 + 40) : mid + wall * 60, y + 120 + r() * 20);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a4658';
  ctx.beginPath();
  ctx.roundRect(x0, y - 2, p.w, 14, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,190,230,0.35)';
  ctx.fillRect(x0 + 4, y - 2, p.w - 8, 2.5);
  ctx.fillStyle = 'rgba(14,12,20,0.8)';
  for (let x = x0 + 10; x < x1 - 6; x += 18) circle(ctx, x, y + 6, 1.8);
}
function drawDenCatch(ctx, camX, viewW, time) {
  const L = camX - 80, R = camX + viewW + 80;
  const m = ctx.getTransform(), res = Math.round(Math.hypot(m.a, m.b) * 1000) / 1000;
  if (Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.a - m.d) < 1e-6 && res > 0) {
    const img = denLayer(res);
    const sx = clamp(Math.floor((L - BX0) * res), 0, img.width - 1), sw = Math.min(img.width - sx, Math.ceil((R - L) * res));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, 0, sw, img.height, Math.round(m.e + BX0 * res) + sx, Math.round(m.f), sw, img.height);
    ctx.restore();
  } else drawDenStatic(ctx);
  drawWheelTeeth(ctx, L, R);
  // aether motes drifting UP (time is wrong down here)
  ctx.fillStyle = 'rgba(190,255,250,0.5)';
  for (const d of MOTES) {
    const y = GROUND - ((d.y + time * d.v) % GROUND), x = d.x + Math.sin(time * 0.4 + d.ph) * 12;
    if (visible(x - 2, x + 2, L, R)) circle(ctx, x, y, d.s);
  }
}
// the escape wheel's teeth along its rim, each like a house; turned a tooth on each Tick (look.wheel)
function drawWheelTeeth(ctx, L, R) {
  const step = TAU / WHEEL.teeth, base = Math.PI / 2 + look.wheel * step;
  ctx.fillStyle = '#121019';
  ctx.strokeStyle = 'rgba(138,90,46,0.45)';
  ctx.lineWidth = 2;
  for (let i = -16; i <= 16; i++) {
    const a = base + i * step, x = WHEEL.x + Math.cos(a) * WHEEL.r, y = WHEEL.y + Math.sin(a) * WHEEL.r;
    if (y < -60 || !visible(x - 50, x + 50, L, R)) continue;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(-26, -6);
    ctx.lineTo(-12, 52);
    ctx.lineTo(18, 46);
    ctx.lineTo(26, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
export const DEN_ART = { catch: drawDenCatch };

// ——— the Escapement: the anchor on its arbor (BOSS_ART, drawn at the boss's x on the floor) ———
// local coords: (0, 0) the floor under the arbor; the arbor at (0, -ARBOR), the pallets at PALLETS less (ESC_MID, GROUND)
export const ARBOR = GROUND - 150;
function drawEscapement(ctx, w, h, st, m) {
  const P = look.p, t = st.t, dying = st.dying ?? 0, fl = m?.facing < 0 ? -1 : 1;
  const A = { x: 0, y: -ARBOR - P.lift * 24 };
  ctx.save();
  ctx.scale(fl, 1); // (it never turns: draw it the same either way)
  const grey = P.grey * 0.6;
  // the arms and the pallets: a broad arch of dark brass from the arbor out and down to each pallet
  const arm = (side) => {
    const pal = PALLETS[side < 0 ? 0 : 1], swing = P.sw === 0 ? 0 : Math.max(0, P.sw * side) * P.down;
    const px = pal.x - ESC_MID - side * P.clench * 10, py = pal.y - GROUND + swing * 110;
    return { px, py, cx: px * 0.55, cy: A.y + 30 + swing * 40 };
  };
  for (const side of [-1, 1]) {
    const a = arm(side);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.quadraticCurveTo(a.cx, a.cy, a.px, a.py - 20);
    ctx.stroke();
    ctx.strokeStyle = grey > 0.3 ? '#4a4652' : BRASS;
    ctx.lineWidth = 26;
    ctx.stroke();
    ctx.strokeStyle = `rgba(224,176,102,${0.35 * (1 - grey)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y - 8);
    ctx.quadraticCurveTo(a.cx, a.cy - 10, a.px, a.py - 30);
    ctx.stroke();
    // the pallet: a hooked fluke of brass, bright where it bites
    const jam = look.jam[side < 0 ? 0 : 1];
    ctx.save();
    ctx.translate(a.px, a.py);
    ctx.rotate(side * 0.2);
    ctx.fillStyle = grey > 0.3 ? '#55505e' : BRASS;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-PALLET_R, -26);
    ctx.lineTo(PALLET_R, -26);
    ctx.lineTo(PALLET_R * 0.7, 22);
    ctx.quadraticCurveTo(0, 38, -PALLET_R * 0.7, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    glow(ctx, 0, 24, 30, 16, jam ? '255,110,90' : BRASSLIGHT, (jam ? 0.5 : 0.35 + 0.3 * P.clench) * (1 - dying));
    ctx.fillStyle = jam ? 'rgba(255,140,110,0.9)' : `rgba(253,227,160,${0.8 * (1 - grey)})`;
    ctx.fillRect(-PALLET_R * 0.6, 20, PALLET_R * 1.2, 4);
    ctx.restore();
  }
  // the arbor: a great drum on the pivot, two plates over the shard (they part when it's Rewound)
  ctx.fillStyle = IRON_D;
  circle(ctx, A.x, A.y, 54);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(A.x, A.y, 54, 0, TAU);
  ctx.stroke();
  const sh = P.shard * (1 - dying) * (1 + 0.15 * Math.sin(t * 3));
  glow(ctx, A.x, A.y, 70 + 50 * P.open, 70 + 50 * P.open, AETHER, 0.25 + 0.45 * sh);
  ctx.fillStyle = `rgba(220,255,250,${0.3 + 0.65 * sh})`;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y - 22);
  ctx.lineTo(A.x + 12, A.y);
  ctx.lineTo(A.x, A.y + 22);
  ctx.lineTo(A.x - 12, A.y);
  ctx.closePath();
  ctx.fill();
  for (const side of [-1, 1]) { // the plates
    const off = P.open * 34 * side;
    ctx.fillStyle = grey > 0.3 ? '#3e3a46' : '#2c2834';
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(A.x + off, A.y - 46);
    ctx.quadraticCurveTo(A.x + off + side * 44, A.y, A.x + off, A.y + 46);
    ctx.lineTo(A.x + off + side * (6 - 6 * P.open), A.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the shard's light reaching for the counted slime is drawn by src/escapement.js (it knows who)
  ctx.restore();
  // its outline for the warn / hurt flash: the arbor and the arch
  return () => {
    ctx.moveTo(A.x + 56, A.y);
    ctx.arc(A.x, A.y, 56, 0, TAU);
    ctx.moveTo(-w * 1.2, A.y + 80);
    ctx.ellipse(0, A.y + 60, 380, 70, 0, Math.PI, TAU);
  };
}
// the bob and crutch, in world space (src/escapement.js gives where): the crutch comes down out of the dark from far above;
// the bob is a great bell of bronze. lit: the shard's light on it; grey: stopped
export function drawPendulum(ctx, bx, by, pivotY, t, lit = 0.5, grey = 0) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(ESC_MID, pivotY);
  ctx.lineTo(bx, by - 40);
  ctx.stroke();
  ctx.strokeStyle = grey > 0.5 ? '#4a4652' : '#2e2a36';
  ctx.lineWidth = 10;
  ctx.stroke();
  const a = Math.atan2(bx - ESC_MID, by - pivotY);
  ctx.translate(bx, by);
  ctx.rotate(-a);
  // the bob: a bronze bell as big as a house
  const g = ctx.createLinearGradient(-70, 0, 70, 0);
  g.addColorStop(0, grey > 0.5 ? '#5a5660' : '#5a4022');
  g.addColorStop(0.45, grey > 0.5 ? '#8a8690' : '#b0844a');
  g.addColorStop(1, grey > 0.5 ? '#3a3640' : '#3a2814');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-30, -52);
  ctx.quadraticCurveTo(-64, -30, -68, 30);
  ctx.quadraticCurveTo(0, 52, 68, 30);
  ctx.quadraticCurveTo(64, -30, 30, -52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(190,255,250,${0.15 + 0.3 * lit})`;
  ellipse(ctx, -24, -10, 10, 26, -0.2);
  ctx.strokeStyle = 'rgba(30,20,10,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-64, 18);
  ctx.quadraticCurveTo(0, 34, 64, 18);
  ctx.stroke();
  ctx.restore();
}
// freed, and the pet: a little anchor that rocks tick, tock, a tiny bob under it
export function drawSmallAnchor(ctx, t, s = 1, still = false) {
  const rock = still ? 0 : Math.sin(t * Math.PI) * 0.22;
  ctx.save();
  ctx.rotate(rock * 0.3);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22 * s, -6 * s);
  ctx.quadraticCurveTo(0, -30 * s, 22 * s, -6 * s);
  ctx.stroke();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 5 * s;
  ctx.stroke();
  ctx.fillStyle = BRASS_L;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * 18 * s, -8 * s);
    ctx.lineTo(d * 26 * s, -8 * s);
    ctx.lineTo(d * 22 * s, 2 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = IRON_D;
  circle(ctx, 0, -22 * s, 7 * s);
  glow(ctx, 0, -22 * s, 12 * s, 12 * s, AETHER, still ? 0.1 : 0.5);
  ctx.fillStyle = still ? 'rgba(120,140,140,0.8)' : 'rgba(220,255,250,0.95)';
  circle(ctx, 0, -22 * s, 2.5 * s);
  ctx.restore();
  ctx.save(); // the tiny bob, swinging the other way
  ctx.translate(0, -22 * s);
  ctx.rotate(-rock);
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 30 * s);
  ctx.stroke();
  ctx.fillStyle = '#a07a40';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 34 * s, 7 * s, 6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export const BOSS_ART = { escapement: drawEscapement };

// ——— its ultimates (FX2: dens.js spawns `${kind}Warn` / `${kind}Hit`) ———
function safeTag(ctx, x, y, time) {
  const bounce = Math.abs(Math.sin(time * 5)) * 4;
  ctx.fillStyle = 'rgba(120,240,160,0.95)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 24, y - 11 - bounce, 48, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'SAFE', x, y - 0.5 - bounce, 12, '#1e4a30');
}
function safeLedge(ctx, i, e, pulse) {
  const p = CATCH_PLATFORMS[i];
  glow(ctx, p.x + p.w / 2, p.y - 30, p.w, 60, '140,255,190', 0.45 + 0.2 * pulse);
  ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(p.x, p.y - 110, p.w, 110);
  ctx.setLineDash([]);
  safeTag(ctx, p.x + p.w / 2, p.y - 130, e.t);
}
// Hold: the casing reddens everywhere but under the hauled bob and that end's ledges
function holdWarn(ctx, e, k) {
  const side = e.side ?? 1, hx = haulX(side), pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  ctx.fillStyle = `rgba(255,130,100,${0.06 + 0.12 * k + 0.05 * pulse})`;
  ctx.fillRect(0, GROUND - 260, FIN_W, 264);
  glow(ctx, hx, GROUND - 60, HOLD_SAFE_R, 70, '140,255,190', 0.4 + 0.2 * pulse);
  ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(hx - HOLD_SAFE_R, GROUND - 200, HOLD_SAFE_R * 2, 200);
  ctx.setLineDash([]);
  safeTag(ctx, hx, GROUND - 220, e.t);
  safeLedge(ctx, side > 0 ? HOUSING_E : HOUSING_W, e, pulse);
  safeLedge(ctx, side > 0 ? HIGH_E : HIGH_W, e, pulse);
  // the shock gathering in the casing's seams
  ctx.strokeStyle = `rgba(253,214,150,${0.3 + 0.5 * k})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 20; x < FIN_W; x += 60) {
    if (Math.abs(x - hx) < HOLD_SAFE_R) continue;
    ctx.moveTo(x, GROUND + 4);
    ctx.lineTo(x + 10 * Math.sin(e.t * 20 + x), GROUND - 20 - 30 * k);
  }
  ctx.stroke();
}
function holdHit(ctx, e, k) {
  const up = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88, hx = haulX(e.side ?? 1);
  ctx.fillStyle = `rgba(253,226,170,${0.4 * up})`;
  ctx.fillRect(0, 0, hx - HOLD_SAFE_R, GROUND + 4);
  ctx.fillRect(hx + HOLD_SAFE_R, 0, FIN_W - hx - HOLD_SAFE_R, GROUND + 4);
}
// Counter-Swing: the bob hauled all the way back; the high ledge at the far end (the way it swings) is the one shelter
function counterWarn(ctx, e, k) {
  const dir = e.dir ?? 1, pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  ctx.fillStyle = `rgba(255,140,110,${0.05 + 0.1 * k})`;
  ctx.fillRect(0, 0, FIN_W, GROUND);
  ctx.fillStyle = `rgba(255,190,150,${0.4 + 0.3 * pulse})`;
  for (let x = 120; x < FIN_W; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x - dir * 14, GROUND - 160);
    ctx.lineTo(x + dir * 14, GROUND - 148);
    ctx.lineTo(x - dir * 14, GROUND - 136);
    ctx.lineTo(x - dir * 6, GROUND - 148);
    ctx.fill();
  }
  safeLedge(ctx, dir > 0 ? HIGH_E : HIGH_W, e, pulse);
}
function counterHit(ctx, e, k) {
  const flash = k < 0.08 ? k / 0.08 : clamp(1 - (k - 0.08) / 0.25, 0, 1);
  if (flash > 0.01) {
    ctx.fillStyle = `rgba(253,226,170,${0.15 * flash})`;
    ctx.fillRect(0, 0, FIN_W, GROUND + 4);
  }
}
// The Stopped Hour: the den greys and a clock hand sweeps round the whole of it
function stoppedWarn(ctx, e, k) {
  ctx.fillStyle = `rgba(150,150,170,${0.1 + 0.2 * k})`;
  ctx.fillRect(0, 0, FIN_W, GROUND + 4);
  const a = -Math.PI / 2 + k * TAU, R = 420;
  ctx.strokeStyle = `rgba(220,255,250,${0.35 + 0.4 * k})`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(ESC_MID, GROUND - 200, R, -Math.PI / 2, a);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ESC_MID, GROUND - 200);
  ctx.lineTo(ESC_MID + Math.cos(a) * R, GROUND - 200 + Math.sin(a) * R);
  ctx.stroke();
}
function stoppedHit(ctx, e, k) {
  const flash = k < 0.1 ? k / 0.1 : clamp(1 - (k - 0.1) / 0.5, 0, 1);
  ctx.fillStyle = `rgba(230,240,250,${0.35 * flash})`;
  ctx.fillRect(0, 0, FIN_W, GROUND + 4);
}
export const FX2 = {
  holdWarn: { dur: 4, draw: holdWarn },
  holdHit: { dur: 1.2, draw: holdHit },
  counterWarn: { dur: 4, draw: counterWarn },
  counterHit: { dur: 1.2, draw: counterHit },
  stoppedWarn: { dur: 4, draw: stoppedWarn },
  stoppedHit: { dur: 1.4, draw: stoppedHit },
};
