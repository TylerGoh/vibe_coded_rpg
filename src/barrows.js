// Docs: docs/places/barrows.md
// The Sunk Barrows (room BARROWS, a hard pocket; data in src/shared/rpg.js; atlas Phase 8, L3): the fen folk's old burial
// mounds off the Drowned Grove, flooded to the lintel until L3 let the water down out of them. Dark and closed in: walls
// of dry stone and cut peat under a turf roof with roots through it, a niche in every wall with a lantern in it, each
// with its name tag, and a line of grey silt and dried weed high on every wall where the water stood. You come in at
// the WEST end, down the Lintel Steps (no mobs: wet steps down from the Grove, puddles), and go east, deeper and darker:
// the Niches (row on row of them, the most lanterns), the Long Barrow (a long chamber of standing kerb stones and fallen
// capstones, fewer lights) and the Peat Hall (cut down into the peat itself, roots thick overhead, the Sleeper's bed in
// the floor and its grave goods; at the far end the old peat cuts going on down, caved in: src/branch-gates.js). The
// nameless niche (last in BARROWS_PLATFORMS), high in the Long Barrow's wall, no name cut over it and its lantern
// untagged, still lit, is the find. drawBarrowsFront: roots hanging in front of the slimes.
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { BARROWS_W, BARROWS_EXIT_X, BARROWS_ZONES, BARROWS_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const STEPS_X1 = BARROWS_ZONES[0].x1, NICHES = BARROWS_ZONES[1], LONG = BARROWS_ZONES[2], HALL = BARROWS_ZONES[3];
const NAMELESS = BARROWS_PLATFORMS.at(-1);
const STONE = '#4e4a44', STONE_D = '#24221e', STONE_L = '#6a6660';
const PEAT = '#2e2218', PEAT_D = '#1a130c', PEAT_L = '#4a3828';
const LAMP = '255,214,150';
const SILT_Y = 128; // where the water stood until L3 (just under the lintel)
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
// the roof's lower edge: turf and stone, sagging between the roots
const ROOF_Y = (x) => 62 + 14 * Math.sin(x / 300) + 8 * Math.sin(x / 97 + 0.7) + (x > HALL.x0 ? 10 : 0);
// dry-stone courses in the back wall (the Niches and the Long Barrow; the Peat Hall is cut peat)
const stones = (() => {
  const r = mulberry32(7901), out = [];
  for (let row = 0; row < 9; row++) {
    const y = 110 + row * 38;
    for (let x = STEPS_X1 - 200 + (row % 2) * 30; x < HALL.x0 + 60; x += 46 + r() * 30) out.push({ x, y: y + r() * 6, w: 38 + r() * 26, h: 26 + r() * 8, s: r() });
  }
  return out;
})();
// burial niches, each with a lantern and its name tag (a few gone dark); thickest in the Niches, a few in the Peat Hall
const niches = (() => {
  const r = mulberry32(7911), out = [];
  for (let x = NICHES.x0 + 40; x < NICHES.x1; x += 92 + r() * 30) for (const y of [196, 292]) if (r() < 0.9) out.push({ x: x + (y === 292 ? 40 : 0), y, lit: r() < 0.92, p: r() * TAU });
  for (let x = LONG.x0 + 60; x < LONG.x1; x += 190 + r() * 90) out.push({ x, y: 220 + r() * 40, lit: r() < 0.85, p: r() * TAU });
  for (let x = HALL.x0 + 160; x < HALL.x1 - 300; x += 420 + r() * 200) out.push({ x, y: 240 + r() * 30, lit: true, p: r() * TAU, peat: true });
  return out.filter((n) => !BARROWS_PLATFORMS.some((p) => n.x > p.x - 30 && n.x < p.x + p.w + 30 && Math.abs(n.y - p.y) < 50));
})();
// standing kerb stones along the Long Barrow's back wall
const kerbs = (() => {
  const r = mulberry32(7921), out = [];
  for (let x = LONG.x0 + 30; x < LONG.x1 - 40; x += 120 + r() * 80) out.push({ x, w: 30 + r() * 16, h: 70 + r() * 50, lean: (r() - 0.5) * 0.08 });
  return out;
})();
// roots through the roof: thin ones everywhere, thick ones over the Peat Hall; some hang in front of the slimes
const roots = (() => {
  const r = mulberry32(7931);
  return Array.from({ length: 140 }, () => {
    const x = r() * BARROWS_W, deep = x > HALL.x0;
    return { x, len: 30 + r() * (deep ? 170 : 90), w: deep && r() < 0.4 ? 4 : 1.6, p: r() * TAU, front: r() < 0.16 };
  });
})();
// water still dripping off the roof
const drips = (() => {
  const r = mulberry32(7941);
  return Array.from({ length: 40 }, () => ({ x: r() * BARROWS_W, p: r(), v: 0.4 + r() * 0.5 }));
})();
// puddles on the floor (most at the west end, where the water went out last)
const puddles = (() => {
  const r = mulberry32(7951), out = [];
  for (let x = 120; x < BARROWS_W - 200; x += (x < STEPS_X1 + 400 ? 90 : 300) + r() * 160) out.push({ x, w: 30 + r() * 60 });
  return out;
})();
const motes = (() => {
  const r = mulberry32(7961);
  return Array.from({ length: 36 }, () => ({ x: r() * BARROWS_W, y: 140 + r() * 260, p: r(), v: 0.02 + r() * 0.04 }));
})();

// Everything in the Sunk Barrows behind the slimes. camX is the left edge of the view.
export function drawBarrows(ctx, camX, viewW, time) {
  const L = camX - 160, R = camX + viewW + 160;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#0a0806'], [0.45, '#18120e'], [1, '#261c14']]);
  ctx.fillRect(L, 0, R - L, GROUND);
  if (visible(0, STEPS_X1 + 200, L, R)) drawSteps(ctx, time);
  drawWall(ctx, L, R);
  for (const k of kerbs) if (visible(k.x - 40, k.x + k.w + 40, L, R)) drawKerb(ctx, k);
  for (const n of niches) if (visible(n.x - 40, n.x + 40, L, R)) drawNiche(ctx, n, time);
  if (visible(HALL.x0 + 200, HALL.x1, L, R)) drawSleeperBed(ctx, time);
  ctx.fillStyle = 'rgba(150,150,130,0.35)'; // the silt line, where the water stood till lately
  ctx.fillRect(L, SILT_Y, R - L, 3);
  ctx.strokeStyle = 'rgba(110,128,80,0.5)'; // dried weed hanging off it
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = Math.floor(L / 34) * 34; x < R; x += 34) {
    const len = 8 + ((x * 7919) % 13);
    ctx.moveTo(x, SILT_Y + 2);
    ctx.lineTo(x + 2, SILT_Y + 2 + len);
  }
  ctx.stroke();
  for (const rt of roots) if (!rt.front && visible(rt.x - 10, rt.x + 10, L, R)) drawRoot(ctx, rt, time);
  drawRoof(ctx, L, R);
  drawFloor(ctx, Math.max(0, L), Math.min(BARROWS_W, R), time);
  for (const p of BARROWS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'capstone') drawCapstone(ctx, p);
    else if (p.kind === 'shelf') drawShelf(ctx, p, time);
    else if (p.kind === 'root') drawRootBeam(ctx, p);
    else if (p.kind === 'nameless') drawNameless(ctx, p, time);
  }
  BARROWS_ZONES.forEach((z) => {
    if (!z.lvl) return;
    const sx = z.x0 + 90; // (each zone's stone at its west edge: you walk in from the west)
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z);
  });
  if (visible(BARROWS_EXIT_X - 40, BARROWS_EXIT_X + 300, L, R)) drawExitSign(ctx, BARROWS_EXIT_X + 120, time);
  for (const d of drips) { // drops falling off the roof
    if (d.x < L || d.x > R) continue;
    const k = (time * d.v + d.p) % 1, y0 = ROOF_Y(d.x) + 4;
    ctx.fillStyle = `rgba(200,210,200,${0.5 * (1 - k)})`;
    ellipse(ctx, d.x, y0 + k * (GROUND - y0), 1.2, 2.4);
  }
  for (const m of motes) { // dust turning slowly in the lamplight
    if (m.x < L || m.x > R) continue;
    const k = (time * m.v + m.p) % 1;
    ctx.fillStyle = `rgba(255,226,180,${0.25 * Math.sin(k * Math.PI)})`;
    circle(ctx, m.x + Math.sin(k * 6 + m.p * 9) * 10, m.y - k * 30, 1.3);
  }
  // the deeper (further east), the darker
  const dk = Math.min(1, Math.max(0, (camX + viewW / 2 - LONG.x0) / 1800));
  if (dk > 0) {
    ctx.fillStyle = `rgba(6,4,2,${0.3 * dk})`;
    ctx.fillRect(L, 0, R - L, H);
  }
  ctx.restore();
}

// Roots hanging in front of everything (drawn over the slimes, so the barrow closes round you)
export function drawBarrowsFront(ctx, camX, viewW, time) {
  const L = camX - 40, R = camX + viewW + 40;
  for (const rt of roots) if (rt.front && visible(rt.x - 10, rt.x + 10, L, R)) drawRoot(ctx, rt, time, true);
}

function drawWall(ctx, L, R) {
  ctx.fillStyle = PEAT_D; // the peat behind everything
  ctx.fillRect(L, 80, R - L, GROUND - 80);
  for (const s of stones) { // dry-stone courses
    if (!visible(s.x, s.x + s.w, L, R)) continue;
    ctx.fillStyle = s.s < 0.33 ? STONE : s.s < 0.66 ? '#46423c' : '#524c44';
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.w, s.h, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,210,0.06)';
    ctx.fillRect(s.x + 4, s.y + 2, s.w - 8, 3);
  }
  if (visible(HALL.x0 - 100, HALL.x1, L, R)) { // the Peat Hall: cut peat, spade marks in rows
    const a = Math.max(L, HALL.x0 - 40), b = Math.min(R, BARROWS_W);
    ctx.fillStyle = PEAT;
    ctx.fillRect(a, 90, b - a, GROUND - 90);
    ctx.strokeStyle = PEAT_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = 120; y < GROUND; y += 30) {
      ctx.moveTo(a, y);
      ctx.lineTo(b, y);
      for (let x = Math.floor(a / 60) * 60 + (y % 60 ? 30 : 0); x < b; x += 60) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y + 30);
      }
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(90,70,50,0.25)';
    for (let x = Math.floor(a / 60) * 60; x < b; x += 60) for (let y = 126; y < GROUND; y += 60) ctx.fillRect(x + 8, y, 30, 4);
  }
}

// The Lintel Steps: the passage down from the Grove, wide wet steps under a lintel, a little green daylight from above
function drawSteps(ctx, time) {
  radialGlow(ctx, 60, 120, 260, 200, '170,200,150', 0.35, 0.8, 0.3, 0.3);
  ctx.fillStyle = STONE_D;
  ctx.fillRect(0, 70, 30, GROUND - 70);
  ctx.fillStyle = '#6a6862'; // the lintel stone, a lantern cut in it
  ctx.fillRect(-10, 64, 200, 24);
  ctx.fillStyle = 'rgba(46,42,58,0.55)';
  ctx.fillRect(84, 68, 10, 14);
  for (let i = 0; i < 7; i++) { // the steps, coming down from the left
    const x = 10 + i * 34, y = GROUND - 150 + i * 22;
    ctx.fillStyle = i % 2 ? '#3e3a34' : '#46423c';
    ctx.fillRect(x, y, 70, GROUND - y);
    ctx.fillStyle = 'rgba(200,214,190,0.18)'; // wet
    ctx.fillRect(x, y, 70, 2);
    ctx.fillStyle = 'rgba(110,138,78,0.4)';
    ellipse(ctx, x + 20, y + 3, 8, 2);
  }
}

// a burial niche in the wall: a round-headed recess, a lantern in it, a name tag on a string (some gone dark)
function drawNiche(ctx, n, time) {
  const { x, y } = n;
  ctx.fillStyle = n.peat ? '#0e0a06' : '#100c08';
  ctx.beginPath();
  ctx.moveTo(x - 20, y + 22);
  ctx.lineTo(x - 20, y - 8);
  ctx.arc(x, y - 8, 20, Math.PI, 0);
  ctx.lineTo(x + 20, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = n.peat ? PEAT_L : STONE_L; // the sill
  ctx.fillRect(x - 24, y + 20, 48, 5);
  const fl = n.lit ? 0.75 + 0.25 * Math.sin(time * 3 + n.p) : 0;
  if (n.lit) {
    ctx.fillStyle = `rgba(${LAMP},${0.12 * fl})`;
    circle(ctx, x, y + 6, 26);
  }
  ctx.fillStyle = n.lit ? `rgba(255,226,168,${0.6 + 0.3 * fl})` : '#4a4252';
  ctx.fillRect(x - 4, y + 4, 8, 12);
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 4.5, y + 3.5, 9, 13);
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 3.5);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 5, y + 3.5);
  ctx.stroke();
  ctx.fillStyle = '#d8ccb0'; // the tag
  ctx.fillRect(x + 6, y + 12 + Math.sin(time * 0.9 + n.p) * 0.8, 4, 6);
  ctx.strokeStyle = 'rgba(200,190,160,0.4)'; // a name cut over it, worn
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 22);
  ctx.lineTo(x + 9, y - 22);
  ctx.moveTo(x - 6, y - 18);
  ctx.lineTo(x + 6, y - 18);
  ctx.stroke();
}

// a standing kerb stone along the Long Barrow's wall
function drawKerb(ctx, k) {
  ctx.save();
  ctx.translate(k.x + k.w / 2, GROUND);
  ctx.rotate(k.lean);
  ctx.fillStyle = '#5a5650';
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-k.w / 2, 2);
  ctx.lineTo(-k.w / 2 + 3, -k.h);
  ctx.quadraticCurveTo(0, -k.h - 10, k.w / 2 - 3, -k.h);
  ctx.lineTo(k.w / 2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,190,160,0.25)'; // a cup-and-ring mark
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, -k.h * 0.6, 6, 0, TAU);
  ctx.moveTo(4, -k.h * 0.6);
  ctx.arc(0, -k.h * 0.6, 2, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(150,150,130,0.35)'; // the silt line on it too
  ctx.fillRect(-k.w / 2, -(GROUND - SILT_Y), k.w, 3);
  ctx.restore();
}

// The Sleeper's bed in the Peat Hall floor: a long hollow scooped in the peat, grave goods round its rim, a ring of
// small lanterns somebody carried down here long ago (drawing only: the Sleeper itself is a field boss)
function drawSleeperBed(ctx, time) {
  const x0 = HALL.x0 + 300, x1 = HALL.x1 - 300, mid = (x0 + x1) / 2;
  ctx.fillStyle = 'rgba(10,6,4,0.6)';
  ctx.beginPath();
  ctx.ellipse(mid, GROUND + 4, (x1 - x0) / 2, 16, 0, Math.PI, 0);
  ctx.fill();
  for (let i = 0; i < 6; i++) { // little lanterns round it on the floor
    const x = x0 + 40 + (i * (x1 - x0 - 80)) / 5;
    const fl = 0.75 + 0.25 * Math.sin(time * 2.4 + i);
    ctx.fillStyle = `rgba(${LAMP},${0.1 * fl})`;
    circle(ctx, x, GROUND - 8, 22);
    ctx.fillStyle = `rgba(255,226,168,${0.6 + 0.3 * fl})`;
    ctx.fillRect(x - 3, GROUND - 14, 6, 9);
    ctx.strokeStyle = '#1e1a1e';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - 3.5, GROUND - 14.5, 7, 10);
  }
  ctx.fillStyle = '#8a6a3a'; // bronze things in the peat
  for (const [dx, w] of [[-260, 14], [-120, 8], [90, 12], [240, 9]]) ellipse(ctx, mid + dx, GROUND - 2, w, 3);
}

// a hanging root (front ones darker, over the slimes)
function drawRoot(ctx, rt, time, front = false) {
  const y0 = ROOF_Y(rt.x), sw = Math.sin(time * 0.4 + rt.p) * 2, len = front ? rt.len * 0.8 : rt.len;
  ctx.strokeStyle = front ? 'rgba(20,14,8,0.85)' : 'rgba(70,54,38,0.75)';
  ctx.lineWidth = front ? rt.w + 1 : rt.w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rt.x, y0 - 4);
  ctx.bezierCurveTo(rt.x + 6 + sw, y0 + len * 0.3, rt.x - 6 + sw, y0 + len * 0.7, rt.x + sw * 1.5, y0 + len);
  ctx.stroke();
}

// the roof: turf and packed stone, its lower edge sagging, a few big roots coming through it
function drawRoof(ctx, L, R) {
  ctx.fillStyle = '#0c0906';
  ctx.beginPath();
  ctx.moveTo(L, 0);
  for (let x = L; x <= R; x += 20) ctx.lineTo(x, ROOF_Y(x));
  ctx.lineTo(R, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a2018';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = L; x <= R; x += 20) (x === L ? ctx.moveTo : ctx.lineTo).call(ctx, x, ROOF_Y(x));
  ctx.stroke();
}

// the floor: old stone flags at the west, going to peat in the Peat Hall; puddles left by the water, lit by the lamps
function drawFloor(ctx, a, b, time) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#2a241e'], [1, '#100c08']]);
  ctx.fillRect(a, GROUND, b - a, H - GROUND);
  if (a < HALL.x0) {
    ctx.strokeStyle = 'rgba(10,8,6,0.6)'; // the flags' joints
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = Math.floor(a / 70) * 70; x < Math.min(b, HALL.x0); x += 70) {
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x - 16, H);
    }
    ctx.moveTo(a, GROUND + 26);
    ctx.lineTo(Math.min(b, HALL.x0), GROUND + 26);
    ctx.stroke();
  }
  if (b > HALL.x0) {
    ctx.fillStyle = PEAT;
    ctx.fillRect(Math.max(a, HALL.x0), GROUND, b - Math.max(a, HALL.x0), H - GROUND);
  }
  ctx.fillStyle = 'rgba(180,170,140,0.22)'; // the floor's edge, a little wet
  ctx.fillRect(a, GROUND, b - a, 2);
  for (const p of puddles) {
    if (!visible(p.x - p.w, p.x + p.w, a, b)) continue;
    ctx.fillStyle = 'rgba(20,24,22,0.8)';
    ellipse(ctx, p.x, GROUND + 8, p.w, 5);
    ctx.fillStyle = `rgba(${LAMP},${0.12 + 0.05 * Math.sin(time * 1.5 + p.x)})`; // a lamp shining in it
    ellipse(ctx, p.x + p.w * 0.2, GROUND + 8, p.w * 0.3, 1.6);
  }
}

// a fallen capstone (a platform): a great flat slab across two uprights
function drawCapstone(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#3e3a34';
  ctx.fillRect(x + 14, y + 10, 22, GROUND - y - 10);
  ctx.fillRect(x + w - 36, y + 10, 22, GROUND - y - 10);
  ctx.fillStyle = '#5a5650';
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 14);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w, y - 2);
  ctx.lineTo(x + w + 8, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,210,0.1)';
  ctx.fillRect(x + 4, y + 1, w - 8, 3);
  ctx.fillStyle = 'rgba(110,138,78,0.45)';
  ellipse(ctx, x + w * 0.3, y + 10, 12, 3);
}

// a burial shelf out of the wall (a platform), a lantern on its end
function drawShelf(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#4e4a44';
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 10, y + 14);
  ctx.lineTo(x + 10, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2e2a26'; // its brackets
  ctx.fillRect(x + 16, y + 14, 10, 24);
  ctx.fillRect(x + w - 26, y + 14, 10, 24);
  const fl = 0.75 + 0.25 * Math.sin(time * 3 + x);
  ctx.fillStyle = `rgba(${LAMP},${0.14 * fl})`;
  circle(ctx, x + w - 22, y - 10, 26);
  ctx.fillStyle = `rgba(255,226,168,${0.6 + 0.3 * fl})`;
  ctx.fillRect(x + w - 26, y - 16, 8, 12);
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x + w - 26.5, y - 16.5, 9, 13);
  ctx.fillStyle = '#d8ccb0';
  ctx.fillRect(x + w - 16, y - 8, 4, 6);
}

// a great root across the Peat Hall (a platform), flat along its top
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
  ctx.strokeStyle = 'rgba(70,54,38,0.8)'; // rootlets off it
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < w / 18; i++) {
    const rx = x + 10 + i * 18;
    ctx.moveTo(rx, y + 12);
    ctx.lineTo(rx + 3, y + 30 + (i % 3) * 10);
  }
  ctx.stroke();
}

// The nameless niche: high in the Long Barrow's wall, a niche like all the others but with no name cut over it, and in
// it a lantern with no tag on it, lit and trimmed. Nobody in Wickmere will say who lights it
function drawNameless(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = '#0a0806';
  ctx.beginPath();
  ctx.moveTo(cx - 34, y);
  ctx.lineTo(cx - 34, y - 46);
  ctx.arc(cx, y - 46, 34, Math.PI, 0);
  ctx.lineTo(cx + 34, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_L; // the sill (the platform)
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 3, w + 8, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#6a6660'; // the blank lintel over it: smooth, never cut
  ctx.fillRect(cx - 30, y - 98, 60, 10);
  radialGlow(ctx, cx, y - 30, 70, 60, LAMP, 0.45 + 0.08 * Math.sin(time * 2.2), 0.85, 0.3, 0.3);
  ctx.fillStyle = `rgba(255,232,180,${0.85 + 0.1 * Math.sin(time * 2.2)})`;
  ctx.fillRect(cx - 6, y - 34, 12, 18);
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(cx - 6.5, y - 34.5, 13, 19);
  ctx.beginPath();
  ctx.moveTo(cx - 8, y - 34.5);
  ctx.lineTo(cx, y - 40);
  ctx.lineTo(cx + 8, y - 34.5);
  ctx.moveTo(cx, y - 40);
  ctx.lineTo(cx, y - 44);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,190,160,0.6)'; // a string, and no tag on it
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + 6, y - 24);
  ctx.lineTo(cx + 10, y - 14 + Math.sin(time * 0.8) * 1.2);
  ctx.stroke();
}

function drawZoneMark(ctx, x, z) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = '#5a5650';
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -24);
  ctx.quadraticCurveTo(0, -36, tw / 2, -24);
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

// The way back up to the Grove
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
  ctx.moveTo(64, -12);
  ctx.lineTo(-58, -12);
  ctx.lineTo(-70, 0);
  ctx.lineTo(-58, 12);
  ctx.lineTo(64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Up to the Grove', -2, 1, 11, '#5b4a6b');
  ctx.restore();
}
