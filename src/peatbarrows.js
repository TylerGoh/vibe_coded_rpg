// Docs: docs/places/peatbarrows.md
// The Peat Barrows (room PEATBARROWS, a deep room on hard-pocket rules; data in src/shared/rpg.js; L5 (b)): the old peat
// workings under the bog, down the cuts at the Sunk Barrows' far end. Where the fen folk cut their fuel, and later carried
// their dead's lanterns down. The darkest, most closed-in place on the island: walls of black cut peat with spade marks in
// rows, black bog-oak trunks lying in them, roots thick overhead, and the only light the lanterns somebody carried down.
// You come in at the WEST end, down the cutters' ladder (the Cuttings, no mobs: spades left standing in the face, a peat
// barrow, a lantern on a hook), and go east: the Bog Roads (the old log trackways laid over the soft peat), the Carriers'
// Way (lanterns set on every ledge by the families who carried them down) and the Moth Cradle, where the Wickmother's
// brood is: silk thickening on the roots, cocoons hanging, and at the far end the root stair up to the Lamp Road (warm
// light coming down it). The child's lantern (last in PEATBARROWS_PLATFORMS), high on a root shelf over the Carriers' Way,
// is the find. drawPeatBarrowsFront: roots and silk hanging in front of the slimes.
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { PEATBARROWS_W, PEATBARROWS_EXIT_X, PEATBARROWS_END_X, PEATBARROWS_ZONES, PEATBARROWS_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const CUT_X1 = PEATBARROWS_ZONES[0].x1, ROADS = PEATBARROWS_ZONES[1], WAY = PEATBARROWS_ZONES[2], CRADLE = PEATBARROWS_ZONES[3];
const CHILD = PEATBARROWS_PLATFORMS.at(-1);
const PEAT = '#2a1e16', PEAT_D = '#140e09', PEAT_L = '#46342a', OAK = '#16120e', OAK_L = '#2e2620';
const LOG = '#5a4634', LOG_D = '#2e2218';
const LAMP = '255,214,150';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
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

// ——— seeded scenery ———
// the roof's lower edge: peat and root, lower the further in
const ROOF_Y = (x) => 56 + 12 * Math.sin(x / 260) + 7 * Math.sin(x / 83 + 1.3) + 26 * Math.min(1, Math.max(0, (x - WAY.x0) / 2400));
// black bog-oak trunks lying in the cut walls (the bog kept them)
const oaks = (() => {
  const r = mulberry32(8201), out = [];
  for (let x = CUT_X1 + 100; x < PEATBARROWS_W - 300; x += 380 + r() * 300) out.push({ x, y: 150 + r() * 150, len: 160 + r() * 180, tilt: (r() - 0.5) * 0.25 });
  return out;
})();
// lanterns set on ledges cut in the peat: a few along the Bog Roads, rows of them on the Carriers' Way, fewer in the Cradle
const lamps = (() => {
  const r = mulberry32(8211), out = [];
  for (let x = ROADS.x0 + 80; x < ROADS.x1; x += 220 + r() * 140) out.push({ x, y: 230 + r() * 60, p: r() * TAU, tag: r() < 0.7 });
  for (let x = WAY.x0 + 40; x < WAY.x1; x += 64 + r() * 40) for (const y of [190, 262]) if (r() < 0.8) out.push({ x: x + (y === 262 ? 30 : 0), y: y + r() * 10, p: r() * TAU, tag: r() < 0.9 });
  for (let x = CRADLE.x0 + 120; x < CRADLE.x1 - 400; x += 300 + r() * 200) out.push({ x, y: 240 + r() * 40, p: r() * TAU, tag: true });
  return out.filter((n) => !PEATBARROWS_PLATFORMS.some((p) => n.x > p.x - 30 && n.x < p.x + p.w + 30 && Math.abs(n.y - p.y) < 50));
})();
// lanterns left on the floor along the Carriers' Way, where someone set one down and went back for another
const floorLamps = (() => {
  const r = mulberry32(8221), out = [];
  for (let x = WAY.x0 + 100; x < WAY.x1; x += 260 + r() * 200) out.push({ x, p: r() * TAU });
  return out;
})();
// roots through the roof: thin everywhere, thick over the Cradle; some hang in front of the slimes
const roots = (() => {
  const r = mulberry32(8231);
  return Array.from({ length: 150 }, () => {
    const x = r() * PEATBARROWS_W, deep = x > CRADLE.x0 - 400;
    return { x, len: 40 + r() * (deep ? 190 : 100), w: deep && r() < 0.45 ? 4.5 : 1.8, p: r() * TAU, front: r() < 0.16, silk: deep && r() < 0.6 };
  });
})();
// the brood's cocoons, hanging from the roots of the Moth Cradle, a light moving in some
const cocoons = (() => {
  const r = mulberry32(8241), out = [];
  for (let x = CRADLE.x0 + 40; x < PEATBARROWS_END_X - 140; x += 70 + r() * 90) out.push({ x, len: 40 + r() * 120, s: 0.7 + r() * 0.6, p: r() * TAU, lit: r() < 0.5 });
  return out;
})();
// wing-dust turning in the lamplight
const motes = (() => {
  const r = mulberry32(8251);
  return Array.from({ length: 40 }, () => ({ x: r() * PEATBARROWS_W, y: 140 + r() * 260, p: r(), v: 0.02 + r() * 0.04 }));
})();

// Everything in the Peat Barrows behind the slimes. camX is the left edge of the view.
export function drawPeatBarrows(ctx, camX, viewW, time) {
  const L = camX - 160, R = camX + viewW + 160;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#060403'], [0.45, '#120c08'], [1, '#1e1610']]);
  ctx.fillRect(L, 0, R - L, GROUND);
  drawWall(ctx, L, R);
  for (const o of oaks) if (visible(o.x - 20, o.x + o.len + 20, L, R)) drawOak(ctx, o);
  if (visible(0, CUT_X1 + 200, L, R)) drawCuttings(ctx, time);
  for (const n of lamps) if (visible(n.x - 40, n.x + 40, L, R)) drawLedgeLamp(ctx, n, time);
  for (const rt of roots) if (!rt.front && visible(rt.x - 10, rt.x + 10, L, R)) drawRoot(ctx, rt, time);
  for (const c of cocoons) if (visible(c.x - 30, c.x + 30, L, R)) drawCocoon(ctx, c, time);
  if (visible(PEATBARROWS_END_X - 300, PEATBARROWS_W, L, R)) drawRootStair(ctx, time);
  drawRoof(ctx, L, R);
  drawFloor(ctx, Math.max(0, L), Math.min(PEATBARROWS_W, R), time);
  for (const f of floorLamps) if (visible(f.x - 30, f.x + 30, L, R)) drawFloorLamp(ctx, f, time);
  for (const p of PEATBARROWS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'trackway') drawTrackway(ctx, p);
    else if (p.kind === 'shelf') drawShelf(ctx, p, time);
    else if (p.kind === 'root') drawRootBeam(ctx, p);
    else if (p.kind === 'childlamp') drawChildLamp(ctx, p, time);
  }
  PEATBARROWS_ZONES.forEach((z) => {
    if (!z.lvl) return;
    const sx = z.x0 + 90; // (each zone's sign at its west edge: you walk in from the west)
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z);
  });
  if (visible(PEATBARROWS_EXIT_X - 40, PEATBARROWS_EXIT_X + 300, L, R)) drawExitSign(ctx, PEATBARROWS_EXIT_X + 130, time);
  for (const m of motes) {
    if (m.x < L || m.x > R) continue;
    const k = (time * m.v + m.p) % 1;
    ctx.fillStyle = `rgba(230,224,240,${0.22 * Math.sin(k * Math.PI)})`;
    circle(ctx, m.x + Math.sin(k * 6 + m.p * 9) * 10, m.y + k * 30, 1.2);
  }
  // the deeper (further east), the darker, until the stair's light at the very end
  const mid = camX + viewW / 2, dk = Math.min(1, Math.max(0, (mid - ROADS.x0) / 2200)) * (1 - Math.min(1, Math.max(0, (mid - (PEATBARROWS_END_X - 700)) / 700)) * 0.5);
  if (dk > 0) {
    ctx.fillStyle = `rgba(4,2,2,${0.34 * dk})`;
    ctx.fillRect(L, 0, R - L, H);
  }
  ctx.restore();
}

// Roots and the brood's silk hanging in front of everything (drawn over the slimes, so the workings close round you)
export function drawPeatBarrowsFront(ctx, camX, viewW, time) {
  const L = camX - 40, R = camX + viewW + 40;
  for (const rt of roots) if (rt.front && visible(rt.x - 10, rt.x + 10, L, R)) drawRoot(ctx, rt, time, true);
}

// The cut walls: black peat in layers, the cutters' spade marks in rows, a darker seam here and there
function drawWall(ctx, L, R) {
  ctx.fillStyle = PEAT_D;
  ctx.fillRect(L, 60, R - L, GROUND - 60);
  const a = Math.max(L, 0), b = Math.min(R, PEATBARROWS_W);
  ctx.fillStyle = PEAT;
  ctx.fillRect(a, 96, b - a, GROUND - 96);
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = 120; y < GROUND; y += 28) {
    ctx.moveTo(a, y);
    ctx.lineTo(b, y);
    for (let x = Math.floor(a / 56) * 56 + (y % 56 ? 28 : 0); x < b; x += 56) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4, y + 28);
    }
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,70,52,0.22)'; // the spade's bright cut on each block
  for (let x = Math.floor(a / 56) * 56; x < b; x += 56) for (let y = 124; y < GROUND; y += 56) ctx.fillRect(x + 8, y, 28, 3);
  ctx.fillStyle = 'rgba(8,5,3,0.5)'; // a darker seam of old bog, low down
  ctx.fillRect(a, GROUND - 70, b - a, 16);
}

// A black bog-oak trunk lying in the wall, its end showing the rings
function drawOak(ctx, o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.tilt);
  ctx.fillStyle = OAK;
  ctx.beginPath();
  ctx.roundRect(0, -16, o.len, 32, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,58,46,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(10, -16 + i * 8);
    ctx.lineTo(o.len - 10, -16 + i * 8 + (i % 2 ? 2 : -2));
  }
  ctx.stroke();
  ctx.fillStyle = OAK_L;
  ellipse(ctx, o.len, 0, 10, 16);
  ctx.strokeStyle = 'rgba(10,8,6,0.8)';
  ctx.beginPath();
  ctx.ellipse(o.len, 0, 5, 9, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// The Cuttings: the cutters' ladder down from the Barrows, a little lamplight from above, spades left standing in the
// face, a peat barrow with a few bricks still in it, a lantern on a hook
function drawCuttings(ctx, time) {
  radialGlow(ctx, 70, 90, 220, 180, LAMP, 0.28, 0.8, 0.3, 0.3);
  ctx.strokeStyle = LOG; // the ladder
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (const dx of [28, 70]) {
    ctx.moveTo(dx, 40);
    ctx.lineTo(dx + 8, GROUND);
  }
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = 60; y < GROUND; y += 30) {
    const k = (y - 40) / (GROUND - 40);
    ctx.moveTo(28 + 8 * k, y);
    ctx.lineTo(70 + 8 * k, y);
  }
  ctx.stroke();
  for (const [x, lean] of [[230, -0.12], [300, 0.08], [420, -0.05]]) { // spades left in the face
    ctx.save();
    ctx.translate(x, GROUND - 40);
    ctx.rotate(lean);
    ctx.fillStyle = LOG;
    ctx.fillRect(-2, -90, 4, 80);
    ctx.fillRect(-8, -92, 16, 4);
    ctx.fillStyle = '#4a4440';
    ctx.beginPath();
    ctx.moveTo(-9, -10);
    ctx.lineTo(9, -10);
    ctx.lineTo(7, 14);
    ctx.lineTo(-7, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // the peat barrow, a few bricks still in it
  const bx = 360;
  ctx.fillStyle = LOG_D;
  ctx.beginPath();
  ctx.moveTo(bx - 40, GROUND - 34);
  ctx.lineTo(bx + 30, GROUND - 34);
  ctx.lineTo(bx + 22, GROUND - 12);
  ctx.lineTo(bx - 32, GROUND - 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PEAT_L;
  for (let i = 0; i < 3; i++) ctx.fillRect(bx - 30 + i * 18, GROUND - 44, 16, 10);
  ctx.strokeStyle = LOG_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx + 26, GROUND - 30);
  ctx.lineTo(bx + 60, GROUND - 40);
  ctx.stroke();
  ctx.fillStyle = '#3a2c20';
  circle(ctx, bx - 30, GROUND - 8, 8);
  // a lantern on a hook in the face
  const lx = 160, ly = GROUND - 150, fl = 0.75 + 0.25 * Math.sin(time * 2.6);
  ctx.strokeStyle = '#2a2422';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx - 10, ly - 18);
  ctx.lineTo(lx, ly - 18);
  ctx.lineTo(lx, ly - 10);
  ctx.stroke();
  lantern(ctx, lx, ly, 1, fl, true, time);
}

// a lantern: a small dark cage with a warm light in it; tag: a paper name tag on a string
function lantern(ctx, x, y, s, fl, tag, time, p = 0) {
  ctx.fillStyle = `rgba(${LAMP},${0.12 * fl})`;
  circle(ctx, x, y + 4 * s, 26 * s);
  ctx.fillStyle = `rgba(255,226,168,${0.6 + 0.3 * fl})`;
  ctx.fillRect(x - 4 * s, y - 2 * s, 8 * s, 12 * s);
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 4.5 * s, y - 2.5 * s, 9 * s, 13 * s);
  ctx.beginPath();
  ctx.moveTo(x - 5 * s, y - 2.5 * s);
  ctx.lineTo(x, y - 6 * s);
  ctx.lineTo(x + 5 * s, y - 2.5 * s);
  ctx.stroke();
  if (tag) {
    ctx.fillStyle = '#d8ccb0';
    ctx.fillRect(x + 6 * s, y + 6 * s + Math.sin(time * 0.9 + p) * 0.8, 4 * s, 6 * s);
  }
}

// a lantern on a little ledge cut in the peat
function drawLedgeLamp(ctx, n, time) {
  ctx.fillStyle = '#0e0a06';
  ctx.fillRect(n.x - 14, n.y - 16, 28, 34);
  ctx.fillStyle = PEAT_L;
  ctx.fillRect(n.x - 18, n.y + 16, 36, 5);
  lantern(ctx, n.x, n.y, 1, 0.75 + 0.25 * Math.sin(time * 3 + n.p), n.tag, time, n.p);
}

// a lantern set down on the floor
function drawFloorLamp(ctx, f, time) {
  lantern(ctx, f.x, GROUND - 14, 0.9, 0.75 + 0.25 * Math.sin(time * 2.4 + f.p), true, time, f.p);
}

// a hanging root (front ones darker, over the slimes); in the Cradle, silk wound down it
function drawRoot(ctx, rt, time, front = false) {
  const y0 = ROOF_Y(rt.x), sw = Math.sin(time * 0.4 + rt.p) * 2, len = front ? rt.len * 0.8 : rt.len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = front ? 'rgba(18,12,8,0.85)' : 'rgba(66,50,36,0.75)';
  ctx.lineWidth = front ? rt.w + 1 : rt.w;
  ctx.beginPath();
  ctx.moveTo(rt.x, y0 - 4);
  ctx.bezierCurveTo(rt.x + 6 + sw, y0 + len * 0.3, rt.x - 6 + sw, y0 + len * 0.7, rt.x + sw * 1.5, y0 + len);
  ctx.stroke();
  if (rt.silk) {
    ctx.strokeStyle = front ? 'rgba(200,192,210,0.3)' : 'rgba(220,212,230,0.4)';
    ctx.lineWidth = rt.w + 3;
    ctx.beginPath();
    ctx.moveTo(rt.x + 1, y0 + len * 0.15);
    ctx.bezierCurveTo(rt.x + 7 + sw, y0 + len * 0.35, rt.x - 5 + sw, y0 + len * 0.55, rt.x + sw, y0 + len * 0.65);
    ctx.stroke();
  }
}

// a cocoon hanging on a strand from the Cradle's roots, swaying; a light moving inside some of them
function drawCocoon(ctx, c, time) {
  const y0 = ROOF_Y(c.x), sw = Math.sin(time * 0.5 + c.p) * 3, cx = c.x + sw, cy = y0 + c.len;
  ctx.strokeStyle = 'rgba(220,212,230,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(c.x, y0);
  ctx.lineTo(cx, cy - 22 * c.s);
  ctx.stroke();
  if (c.lit) radialGlow(ctx, cx, cy, 30 * c.s, 34 * c.s, LAMP, 0.25 + 0.15 * Math.sin(time * 1.3 + c.p), 0.85, 0.3, 0.3);
  ctx.fillStyle = '#c8c0cc';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 11 * c.s, 24 * c.s, Math.sin(time * 0.5 + c.p) * 0.06, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,110,124,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(cx - 10 * c.s, cy + i * 8 * c.s);
    ctx.quadraticCurveTo(cx, cy + i * 8 * c.s + 4 * c.s, cx + 10 * c.s, cy + i * 8 * c.s - 2 * c.s);
  }
  ctx.stroke();
}

// The root stair at the far east end: great willow roots climbing up and away to the right, and warm light coming down
// it from the Lamp Road
function drawRootStair(ctx, time) {
  const x = PEATBARROWS_END_X;
  radialGlow(ctx, x + 40, 120, 220, 240, LAMP, 0.4 + 0.05 * Math.sin(time * 0.9), 0.85, 0.3, 0.3);
  ctx.fillStyle = '#0a0606';
  ctx.beginPath();
  ctx.moveTo(x - 110, GROUND);
  ctx.quadraticCurveTo(x - 100, 80, x + 20, 50);
  ctx.lineTo(PEATBARROWS_W + 40, 50);
  ctx.lineTo(PEATBARROWS_W + 40, GROUND);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 8; i++) { // the steps: roots, climbing to the right
    const sx = x - 90 + i * 20, sy = GROUND - 12 - i * 30;
    ctx.fillStyle = i % 2 ? '#4a3a2e' : '#5a4838';
    ctx.beginPath();
    ctx.roundRect(sx, sy, 70, 11, 5);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(220,212,230,0.35)'; // silk strung over the top of it
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.moveTo(x - 80 + i * 10, 60 + i * 4);
    ctx.quadraticCurveTo(x + 10, 90 + i * 6, x + 90, 60 + i * 3);
  }
  ctx.stroke();
}

// the roof: peat and packed root, its lower edge coming down the further in
function drawRoof(ctx, L, R) {
  ctx.fillStyle = '#080504';
  ctx.beginPath();
  ctx.moveTo(L, 0);
  for (let x = L; x <= R; x += 20) ctx.lineTo(x, ROOF_Y(x));
  ctx.lineTo(R, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = L; x <= R; x += 20) (x === L ? ctx.moveTo : ctx.lineTo).call(ctx, x, ROOF_Y(x));
  ctx.stroke();
}

// the floor: soft wet peat, with the old log trackway laid along it through the Bog Roads
function drawFloor(ctx, a, b, time) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#241a12'], [1, '#0c0806']]);
  ctx.fillRect(a, GROUND, b - a, H - GROUND);
  const t0 = Math.max(a, ROADS.x0 - 100), t1 = Math.min(b, WAY.x1);
  if (t1 > t0) {
    ctx.fillStyle = LOG_D; // the corduroy road: logs laid side by side
    ctx.fillRect(t0, GROUND, t1 - t0, 8);
    ctx.strokeStyle = 'rgba(10,6,4,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = Math.floor(t0 / 14) * 14; x < t1; x += 14) {
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x, GROUND + 8);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,96,70,0.3)';
    ctx.fillRect(t0, GROUND, t1 - t0, 2);
  }
  ctx.fillStyle = 'rgba(30,26,20,0.8)'; // wet patches with a lamp shining in them
  for (let x = Math.floor(a / 330) * 330 + 120; x < b; x += 330) {
    ellipse(ctx, x, GROUND + 18, 36, 4);
    ctx.fillStyle = `rgba(${LAMP},${0.1 + 0.04 * Math.sin(time * 1.4 + x)})`;
    ellipse(ctx, x + 8, GROUND + 18, 10, 1.4);
    ctx.fillStyle = 'rgba(30,26,20,0.8)';
  }
}

// a stretch of old trackway raised on posts over the soft peat (a platform)
function drawTrackway(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = LOG_D;
  for (const px of [x + 14, x + w / 2 - 5, x + w - 24]) ctx.fillRect(px, y + 8, 10, GROUND - y - 8);
  ctx.fillStyle = LOG;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 2, w + 8, 12, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,14,10,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 1; i < w / 14; i++) {
    ctx.moveTo(x + i * 14, y - 2);
    ctx.lineTo(x + i * 14, y + 10);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,170,130,0.16)';
  ctx.fillRect(x, y - 2, w, 2);
}

// a shelf cut out of the peat face (a platform), lanterns set along it
function drawShelf(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = PEAT_L;
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 12, y + 16);
  ctx.lineTo(x + 12, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1e1610'; // the peat under it, cut back
  ctx.fillRect(x + 12, y + 16, w - 24, 20);
  for (let i = 0; i < 2; i++) lantern(ctx, x + 22 + i * (w - 44), y - 14, 1, 0.75 + 0.25 * Math.sin(time * 3 + x + i), true, time, x + i);
}

// a great root across the Cradle (a platform), flat along its top, silk wound round it
function drawRootBeam(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#3a2a1c';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 40, y - 120);
  ctx.quadraticCurveTo(x - 6, y + 4, x + w * 0.3, y + 6);
  ctx.lineTo(x + w, y + 6);
  ctx.quadraticCurveTo(x + w + 30, y + 8, x + w + 50, y - 90);
  ctx.stroke();
  ctx.strokeStyle = PEAT_L;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 1);
  ctx.lineTo(x + w - 6, y + 1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,212,230,0.35)'; // silk wound round it
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < w / 16; i++) {
    const rx = x + 8 + i * 16;
    ctx.moveTo(rx, y - 4);
    ctx.lineTo(rx + 10, y + 14);
  }
  ctx.stroke();
}

// The child's lantern: high on a root shelf over the Carriers' Way, a small lantern, smaller than all the others, its
// tag written in a child's big uneven hand (never readable). Somebody small carried it all the way down here
function drawChildLamp(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.strokeStyle = '#3a2a1c'; // the root it sits on
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 70);
  ctx.quadraticCurveTo(x - 4, y + 4, x + w * 0.4, y + 4);
  ctx.lineTo(x + w + 10, y + 4);
  ctx.stroke();
  ctx.fillStyle = PEAT_L;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 3, w + 4, 7, 3);
  ctx.fill();
  radialGlow(ctx, cx, y - 14, 50, 44, LAMP, 0.4 + 0.08 * Math.sin(time * 2.4), 0.85, 0.3, 0.3);
  ctx.fillStyle = `rgba(255,232,180,${0.85 + 0.1 * Math.sin(time * 2.4)})`;
  ctx.fillRect(cx - 3.5, y - 18, 7, 10);
  ctx.strokeStyle = '#6a3a4a'; // painted, once: a child's colours
  ctx.lineWidth = 1.6;
  ctx.strokeRect(cx - 4, y - 18.5, 8, 11);
  ctx.beginPath();
  ctx.moveTo(cx - 5, y - 18.5);
  ctx.lineTo(cx, y - 22);
  ctx.lineTo(cx + 5, y - 18.5);
  ctx.stroke();
  const sw = Math.sin(time * 0.8) * 1.2; // the tag, big for the lantern, scrawled on
  ctx.strokeStyle = 'rgba(200,190,160,0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + 4, y - 12);
  ctx.lineTo(cx + 9, y - 6 + sw);
  ctx.stroke();
  ctx.fillStyle = '#ece0c8';
  ctx.fillRect(cx + 5, y - 6 + sw, 10, 8);
  ctx.strokeStyle = 'rgba(90,60,70,0.7)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(cx + 6, y - 3 + sw);
  ctx.quadraticCurveTo(cx + 9, y - 6 + sw, cx + 11, y - 2 + sw);
  ctx.lineTo(cx + 14, y - 4 + sw);
  ctx.stroke();
}

function drawZoneMark(ctx, x, z) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = '#3a2c22'; // a slab of bog-oak set up on end
  ctx.strokeStyle = '#120c08';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -24);
  ctx.quadraticCurveTo(0, -34, tw / 2, -24);
  ctx.lineTo(tw / 2 + 4, 60);
  ctx.lineTo(-tw / 2 - 6, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#f2e6d8');
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.roundRect(-32, 4, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, '#fffaf0');
  ctx.restore();
}

// The way back up to the Sunk Barrows
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#5a4430';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#c8b48a';
  ctx.strokeStyle = '#6a5034';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(68, -12);
  ctx.lineTo(-62, -12);
  ctx.lineTo(-74, 0);
  ctx.lineTo(-62, 12);
  ctx.lineTo(68, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Up to the Barrows', -2, 1, 11, '#5b4a6b');
  ctx.restore();
}
