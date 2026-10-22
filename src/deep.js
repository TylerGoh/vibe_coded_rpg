// Docs: docs/places/deep.md
// The Mycelium Deep (room MYCELIUM, data in src/shared/rpg.js): the great cave under Mushroom Grove, down the
// hollow stump. West to east: the root stair up to the Grove (a shaft of daylight), Forager Truffle's camp
// under a giant mushroom cap, the Listening Stone (src/ruins.js), then Puffcap Hollow, the Thread Caverns
// and the Knotted Halls, with the Knotmole's burrow (src/dens-deep.js draws its mouth) and the crack down
// into Glowroot Hollow (src/branch-gates.js) at the far end. The glowing threads seen in the Grove above
// are roots as thick as trunks down here; their glow drifts west along them (toward the sea), only a
// trickle of it past the Knotted Halls, where it bunches up at the Knotmole's knots. Underground: no sky,
// a plum-dark cave lit by the threads and little glowing mushrooms. Platforms: giant mushroom caps on
// stalks, root bridges, rock shelves, and Truffle's tent.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { MYCELIUM_W, MYCELIUM_EXIT_X, MYCELIUM_ZONES, MYCELIUM_PLATFORMS, FIELD_GROUND, TRUFFLE_X } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const INK = '#5b4a6b';
const HALLS_X = MYCELIUM_ZONES[3].x0; // where the knots start
const CAMP_X = TRUFFLE_X + 135; // the middle of Truffle's tent (MYCELIUM_PLATFORMS[0])
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// A soft round glow (this area's falloff; drawn by src/glow.js)
export function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3); // src/glow.js
}

// ——— seeded scenery ———
// The great threads: each a wavy band across the back wall. y(x) = y0 + a·sin(x·f + p) + b·sin(x·g + q)
const THREADS = (() => {
  const r = mulberry32(2801);
  return Array.from({ length: 5 }, (_, i) => ({
    y0: 120 + i * 52 + r() * 20, a: 18 + r() * 26, f: 0.002 + r() * 0.002, p: r() * TAU, b: 8 + r() * 10, g: 0.007 + r() * 0.005, q: r() * TAU,
    w: 9 + r() * 9, v: 40 + r() * 30, gap: 260 + r() * 200,
  }));
})();
const threadY = (t, x) => t.y0 + t.a * Math.sin(x * t.f + t.p) + t.b * Math.sin(x * t.g + t.q);
// where the Knotmole's knots sit on the threads (all in the Knotted Halls)
const KNOTS = (() => {
  const r = mulberry32(2803);
  const out = [];
  for (let x = HALLS_X + 120; x < MYCELIUM_W - 200; x += 180 + r() * 160) out.push({ x, t: Math.floor(r() * THREADS.length), s: 0.8 + r() * 0.6, p: r() * TAU });
  return out;
})();
const farRocks = [0.3, 0.55].map((f, j) => {
  const r = mulberry32(2810 + j);
  return { f, bumps: Array.from({ length: 12 }, (_, i) => ({ x: i * 190 + r() * 90, w: 120 + r() * 150, h: 90 + r() * 110 + j * 30 })) };
});
const stalactites = (() => {
  const r = mulberry32(2821);
  const out = [];
  for (let x = 20; x < MYCELIUM_W; x += 40 + r() * 90) out.push({ x, w: 14 + r() * 26, len: 24 + r() * 60, drip: r() < 0.3, p: r() });
  return out;
})();
const hangRoots = (() => {
  const r = mulberry32(2823);
  const out = [];
  for (let x = 60; x < MYCELIUM_W; x += 70 + r() * 150) out.push({ x, len: 50 + r() * 110, sway: r() * TAU, w: 2 + r() * 3, glowTip: r() < 0.4 });
  return out;
})();
const shrooms = (() => {
  const r = mulberry32(2831);
  const out = [];
  for (let x = 30; x < MYCELIUM_W - 20; x += 22 + r() * 70) {
    if (r() < 0.35) continue;
    const puffy = x > 900 && x < 2400;
    out.push({ x, h: 6 + r() * (puffy ? 16 : 10), s: 0.6 + r() * (puffy ? 0.9 : 0.6), c: ['#ffb3d9', '#b3f0e0', '#d6c2ff', '#ffe0a8'][Math.floor(r() * 4)], p: r() * TAU, glow: r() < 0.5 });
  }
  return out;
})();
const motes = (() => {
  const r = mulberry32(2837);
  return Array.from({ length: 34 }, () => ({ x: r() * W, y: 80 + r() * 360, v: 6 + r() * 10, p: r() * TAU, s: 1 + r() * 1.8, c: r() < 0.5 ? '200,255,235' : '255,200,240' }));
})();
const pebbles = (() => {
  const r = mulberry32(2841);
  const out = [];
  for (let x = 10; x < MYCELIUM_W; x += 30 + r() * 60) out.push({ x, dy: 10 + r() * 70, s: 2 + r() * 5, c: r() < 0.5 ? '#6c5a7a' : '#5e4e6c' });
  return out;
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawDeep(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawBackWall(ctx, camX, time);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  drawThreads(ctx, Math.max(0, L), Math.min(MYCELIUM_W, R), time);
  drawCeiling(ctx, Math.max(0, L), Math.min(MYCELIUM_W, R), time);
  if (visible(-40, 420, L, R)) drawRootStair(ctx, time);
  for (const p of MYCELIUM_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'cap') drawCap(ctx, p, time);
    else if (p.kind === 'root') drawRootBridge(ctx, p, time);
    else if (p.kind === 'shelf') drawShelf(ctx, p);
  }
  if (visible(CAMP_X - 220, CAMP_X + 200, L, R)) drawCamp(ctx, time);
  const shelf = MYCELIUM_PLATFORMS.at(-1);
  if (visible(shelf.x - 40, shelf.x + shelf.w + 40, L, R)) drawGlowShelf(ctx, shelf, time);
  drawFloor(ctx, Math.max(0, L), Math.min(MYCELIUM_W, R), time);
  MYCELIUM_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(MYCELIUM_EXIT_X - 60, MYCELIUM_EXIT_X + 150, L, R)) drawExitSign(ctx, MYCELIUM_EXIT_X + 80, time);
  drawMotes(ctx, camX, time);
}

// The far cave: a dim plum gradient, two layers of rock humps sliding slower than the floor
function drawBackWall(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#1f1830');
  g.addColorStop(0.55, '#33284a');
  g.addColorStop(1, '#4b3b62');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // a soft glow rising out of the east, where the threads come from
  const k = Math.min(1, Math.max(0, (camX - 1200) / 3000));
  glow(ctx, W * 1.05, GROUND - 160, 520, 300, '140,230,210', 0.12 + 0.18 * k);
  farRocks.forEach(({ f, bumps }, j) => {
    ctx.fillStyle = j ? '#3d3055' : '#30263f';
    const span = 190 * 12, off = -((camX * f) % span);
    for (const rep of [0, span]) {
      ctx.beginPath();
      ctx.moveTo(off + rep - 50, GROUND);
      for (const b of bumps) {
        const x = off + rep + b.x;
        ctx.lineTo(x - b.w / 2, GROUND - 20);
        ctx.quadraticCurveTo(x - b.w * 0.3, GROUND - b.h, x, GROUND - b.h * 1.05);
        ctx.quadraticCurveTo(x + b.w * 0.3, GROUND - b.h, x + b.w / 2, GROUND - 20);
      }
      ctx.lineTo(off + rep + span + 50, GROUND);
      ctx.closePath();
      ctx.fill();
    }
  });
  void time;
}

// The great glowing threads across the back wall, with glow drifting west along them
function drawThreads(ctx, L, R, time) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const [i, t] of THREADS.entries()) {
    const path = () => {
      ctx.beginPath();
      for (let x = L - (L % 16); x <= R + 16; x += 16) (x === L - (L % 16) ? ctx.moveTo(x, threadY(t, x)) : ctx.lineTo(x, threadY(t, x)));
    };
    path();
    ctx.strokeStyle = 'rgba(150,240,215,0.12)';
    ctx.lineWidth = t.w + 14;
    ctx.stroke();
    ctx.strokeStyle = i % 2 ? '#3a5e66' : '#35585e';
    ctx.lineWidth = t.w;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(170,250,225,0.45)';
    ctx.lineWidth = Math.max(2, t.w * 0.25);
    ctx.stroke();
    // the drifting glow: west of the knots only a trickle gets through (dimmer, further apart)
    const n = Math.ceil((MYCELIUM_W + 200) / t.gap), span = n * t.gap;
    for (let k = 0; k < n; k++) {
      const px = (((k * t.gap - time * t.v + i * 97) % span) + span) % span - 100;
      if (px < L - 40 || px > R + 40) continue;
      const a = px < HALLS_X ? (k % 3 ? 0 : 0.6) : 0.9;
      if (!a) continue;
      const py = threadY(t, px);
      glow(ctx, px, py, 26, 14, '190,255,230', a);
      ctx.fillStyle = `rgba(235,255,248,${a})`;
      circle(ctx, px, py, t.w * 0.3);
    }
  }
  // the Knotmole's knots: the threads bunched and tied, the glow pooling bright in them
  for (const k of KNOTS) {
    if (!visible(k.x - 60, k.x + 60, L, R)) continue;
    const t = THREADS[k.t], y = threadY(t, k.x), s = k.s, pulse = 0.7 + 0.3 * Math.sin(time * 1.6 + k.p);
    glow(ctx, k.x, y, 70 * s, 50 * s, '170,255,220', 0.55 * pulse);
    ctx.beginPath();
    for (let j = 0; j <= 60; j++) {
      const a = (j / 60) * TAU, r = 7.5 * s;
      const px = k.x + (Math.sin(a) + 2 * Math.sin(2 * a)) * r, py = y + (Math.cos(a) - 2 * Math.cos(2 * a)) * r * 0.75;
      j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2e4c52';
    ctx.lineWidth = t.w * 0.7;
    ctx.stroke();
    ctx.strokeStyle = `rgba(200,255,235,${0.75 * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

// The cave roof: a dark band, stalactites (a few dripping) and roots dangling down from the Grove above
function drawCeiling(ctx, L, R, time) {
  ctx.fillStyle = '#1b1426';
  ctx.beginPath();
  ctx.moveTo(L - 20, 0);
  for (let x = L - (L % 40) - 40; x <= R + 40; x += 40) ctx.lineTo(x, 22 + Math.sin(x * 0.013) * 8 + Math.sin(x * 0.041) * 4);
  ctx.lineTo(R + 20, 0);
  ctx.closePath();
  ctx.fill();
  for (const s of stalactites) {
    if (s.x < L - 30 || s.x > R + 30) continue;
    const top = 18 + Math.sin(s.x * 0.013) * 8;
    ctx.fillStyle = '#251c33';
    ctx.beginPath();
    ctx.moveTo(s.x - s.w / 2, top);
    ctx.quadraticCurveTo(s.x - s.w * 0.1, top + s.len * 0.7, s.x, top + s.len);
    ctx.quadraticCurveTo(s.x + s.w * 0.1, top + s.len * 0.7, s.x + s.w / 2, top);
    ctx.fill();
    if (s.drip) {
      const k = (time * 0.35 + s.p) % 1;
      ctx.fillStyle = `rgba(190,240,230,${0.7 * (1 - k)})`;
      circle(ctx, s.x, top + s.len + k * (GROUND - top - s.len - 10), 1.6);
    }
  }
  ctx.lineCap = 'round';
  for (const h of hangRoots) {
    if (h.x < L - 30 || h.x > R + 30) continue;
    const sw = Math.sin(time * 0.8 + h.sway) * 5;
    ctx.strokeStyle = '#5a4434';
    ctx.lineWidth = h.w;
    ctx.beginPath();
    ctx.moveTo(h.x, 10);
    ctx.quadraticCurveTo(h.x + sw * 0.5 + 6, 10 + h.len * 0.5, h.x + sw, 10 + h.len);
    ctx.stroke();
    if (h.glowTip) {
      glow(ctx, h.x + sw, 12 + h.len, 12, 12, '190,255,230', 0.7);
      ctx.fillStyle = '#e6fff6';
      circle(ctx, h.x + sw, 12 + h.len, 2.2);
    }
  }
}

// The way back up: roots twisted into a rough stair climbing to a hole of daylight
function drawRootStair(ctx, time) {
  const x = MYCELIUM_EXIT_X;
  // daylight falling down the shaft
  ctx.save();
  const beam = ctx.createLinearGradient(0, 0, 0, GROUND);
  beam.addColorStop(0, 'rgba(255,244,205,0.55)');
  beam.addColorStop(1, 'rgba(255,244,205,0.04)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(x - 30, 0);
  ctx.lineTo(x + 50, 0);
  ctx.lineTo(x + 170, GROUND);
  ctx.lineTo(x - 70, GROUND);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const k = (time * 0.05 + i / 8) % 1;
    ctx.fillStyle = `rgba(255,248,220,${0.7 * Math.sin(k * Math.PI)})`;
    circle(ctx, x - 20 + i * 18 + Math.sin(time * 0.7 + i) * 8, 40 + k * 360, 1.6);
  }
  ctx.restore();
  // the stair: big roots winding up, with knobbly steps
  ctx.strokeStyle = '#6e5038';
  ctx.lineCap = 'round';
  for (const [w, dx, ph] of [[16, -24, 0], [11, 18, 1.3], [8, -4, 2.2]]) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x + dx, GROUND + 4);
    for (let y = GROUND; y > -10; y -= 30) ctx.lineTo(x + dx + Math.sin(y * 0.03 + ph) * 22, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6646';
  for (let y = GROUND - 40; y > 20; y -= 46) ellipse(ctx, x + Math.sin(y * 0.03) * 20, y, 26, 6, Math.sin(y) * 0.2);
  ctx.fillStyle = '#86c46e'; // grass hanging over the rim of the stump, up top
  for (let i = 0; i < 6; i++) ellipse(ctx, x - 30 + i * 14, 4, 8, 5);
}

// A giant mushroom on a pale stalk; its cap is the platform
function drawCap(ctx, p, time) {
  const cx = p.x + p.w / 2, top = p.y, r = p.w / 2;
  const hue = ['#c9a6e6', '#f0a8c8', '#9fd8c8'][Math.floor(p.x / 700) % 3];
  ctx.fillStyle = 'rgba(20,10,30,0.25)';
  ellipse(ctx, cx, GROUND + 2, r * 0.5, 6);
  const sg = ctx.createLinearGradient(cx - 16, 0, cx + 16, 0);
  sg.addColorStop(0, '#d8cbb8');
  sg.addColorStop(0.5, '#f2e8d6');
  sg.addColorStop(1, '#cbbda8');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(cx - 13, top + 10);
  ctx.quadraticCurveTo(cx - 20, (top + GROUND) / 2, cx - 18, GROUND + 2);
  ctx.lineTo(cx + 18, GROUND + 2);
  ctx.quadraticCurveTo(cx + 20, (top + GROUND) / 2, cx + 13, top + 10);
  ctx.closePath();
  ctx.fill();
  // gills under the cap
  ctx.fillStyle = '#a88ab0';
  ellipse(ctx, cx, top + 12, r * 0.92, 9);
  ctx.strokeStyle = 'rgba(80,50,90,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -6; i <= 6; i++) {
    ctx.moveTo(cx, top + 14);
    ctx.lineTo(cx + i * r * 0.14, top + 8);
  }
  ctx.stroke();
  // the cap
  glow(ctx, cx, top - 6, r * 1.3, 40, '230,180,255', 0.25 + 0.08 * Math.sin(time * 1.3 + p.x));
  ctx.fillStyle = hue;
  ctx.strokeStyle = 'rgba(70,40,80,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x - 4, top + 10);
  ctx.quadraticCurveTo(p.x - 2, top - 24, cx, top - 28);
  ctx.quadraticCurveTo(p.x + p.w + 2, top - 24, p.x + p.w + 4, top + 10);
  ctx.quadraticCurveTo(cx, top + 4, p.x - 4, top + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; // spots
  for (const [fx, fy, s] of [[-0.55, -0.1, 7], [-0.15, -0.6, 9], [0.3, -0.35, 6], [0.62, 0, 5]]) ellipse(ctx, cx + fx * r, top + fy * 26, s * (r / 90), s * 0.7 * (r / 90));
}

// A root grown across between two banks; its top is the platform
function drawRootBridge(ctx, p, time) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#4e3a2c';
  ctx.lineCap = 'round';
  // the ends dive into the floor
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND + 6);
  ctx.quadraticCurveTo(x - 10, y + 10, x + 10, y + 8);
  ctx.lineTo(x + w - 10, y + 8);
  ctx.quadraticCurveTo(x + w + 10, y + 10, x + w + 30, GROUND + 6);
  ctx.stroke();
  ctx.strokeStyle = '#6e5440';
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,200,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 4);
  ctx.lineTo(x + w - 6, y + 4);
  ctx.stroke();
  // a thin glowing thread wound round it, and moss on top
  ctx.strokeStyle = `rgba(170,250,225,${0.55 + 0.2 * Math.sin(time * 2 + x)})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k <= w; k += 4) ctx.lineTo(x + k, y + 8 + Math.sin(k * 0.12) * 6);
  ctx.stroke();
  ctx.fillStyle = '#7c9a6a';
  for (let k = 12; k < w - 8; k += 22) ellipse(ctx, x + k, y + 1, 9, 3.5);
}

// A rock shelf on a stubby pillar
function drawShelf(ctx, p) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = '#4a3c5c';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, y + 18);
  ctx.lineTo(cx - w * 0.3, GROUND + 4);
  ctx.lineTo(cx + w * 0.28, GROUND + 4);
  ctx.lineTo(cx + w * 0.2, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5e4e72';
  ctx.strokeStyle = '#2e2440';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 16, y + 24);
  ctx.quadraticCurveTo(cx, y + 34, x + 16, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a6a8e';
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#7c9a6a';
  for (let k = 14; k < w - 10; k += 30) ellipse(ctx, x + k, y - 3, 10, 3);
}

// Forager Truffle's camp: a giant mushroom cap pitched as a tent (its top is a platform), a lantern on a
// pole, her basket of finds, a pot over a little fire and mushrooms drying on a string
function drawCamp(ctx, time) {
  const p = MYCELIUM_PLATFORMS[0], cx = p.x + p.w / 2, top = p.y;
  // the tent: a broad cap on a short fat stalk, with a door flap
  ctx.fillStyle = '#e8dcc6';
  ctx.beginPath();
  ctx.moveTo(cx - 52, top + 12);
  ctx.lineTo(cx - 60, GROUND + 2);
  ctx.lineTo(cx + 60, GROUND + 2);
  ctx.lineTo(cx + 52, top + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6b4a5a'; // the doorway, with lamplight inside
  ctx.beginPath();
  ctx.moveTo(cx - 20, GROUND + 2);
  ctx.quadraticCurveTo(cx - 22, GROUND - 60, cx, GROUND - 66);
  ctx.quadraticCurveTo(cx + 22, GROUND - 60, cx + 20, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  glow(ctx, cx, GROUND - 26, 30, 36, '255,210,150', 0.6 + 0.1 * Math.sin(time * 3));
  ctx.fillStyle = '#d9a8bf'; // the flap, tied back
  ctx.beginPath();
  ctx.moveTo(cx + 20, GROUND - 62);
  ctx.quadraticCurveTo(cx + 34, GROUND - 30, cx + 26, GROUND + 2);
  ctx.lineTo(cx + 40, GROUND + 2);
  ctx.quadraticCurveTo(cx + 40, GROUND - 40, cx + 22, GROUND - 66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e88aaa';
  ctx.strokeStyle = 'rgba(90,40,70,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x - 8, top + 14);
  ctx.quadraticCurveTo(p.x - 4, top - 30, cx, top - 34);
  ctx.quadraticCurveTo(p.x + p.w + 4, top - 30, p.x + p.w + 8, top + 14);
  ctx.quadraticCurveTo(cx, top + 6, p.x - 8, top + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  for (const [fx, fy, s] of [[-50, -4, 9], [-14, -24, 11], [26, -14, 8], [54, 2, 6]]) ellipse(ctx, cx + fx, top + fy, s, s * 0.7);
  // mushrooms drying on a string from the tent to the lantern pole
  const poleX = cx - 120;
  ctx.strokeStyle = 'rgba(230,210,180,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(poleX, GROUND - 92);
  ctx.quadraticCurveTo((poleX + cx - 52) / 2, GROUND - 70, cx - 52, GROUND - 86);
  ctx.stroke();
  for (let i = 1; i < 6; i++) {
    const k = i / 6, sx = poleX + (cx - 52 - poleX) * k, sy = GROUND - 92 + Math.sin(k * Math.PI) * 18 - k * -6 + Math.sin(time * 1.5 + i) * 1.2;
    ctx.fillStyle = ['#c8a07a', '#e0b8c8', '#b8a0d0'][i % 3];
    ctx.beginPath();
    ctx.arc(sx, sy + 6, 5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#efe4d0';
    ctx.fillRect(sx - 1, sy + 6, 2, 5);
  }
  // the lantern pole: a glowing mushroom in a little cage
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(poleX - 2.5, GROUND - 100, 5, 100);
  const lp = 0.75 + 0.25 * Math.sin(time * 2.2);
  glow(ctx, poleX, GROUND - 106, 50, 46, '190,255,230', lp);
  ctx.fillStyle = '#b3f0e0';
  ctx.beginPath();
  ctx.arc(poleX, GROUND - 104, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#efe4d0';
  ctx.fillRect(poleX - 1.5, GROUND - 104, 3, 6);
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(poleX - 10, GROUND - 116, 20, 20, 4);
  ctx.stroke();
  // the cookfire and its pot
  const fx = cx + 92;
  ctx.fillStyle = '#5a4a5e';
  for (let i = -2; i <= 2; i++) ellipse(ctx, fx + i * 8, GROUND - 2, 5, 3.5);
  const fl = Math.sin(time * 14) * 2;
  glow(ctx, fx, GROUND - 12, 30, 22, '255,180,110', 0.7);
  ctx.fillStyle = '#ffb36a';
  ctx.beginPath();
  ctx.moveTo(fx - 8, GROUND - 4);
  ctx.quadraticCurveTo(fx - 4, GROUND - 22 + fl, fx, GROUND - 18);
  ctx.quadraticCurveTo(fx + 4, GROUND - 24 - fl, fx + 8, GROUND - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a4058';
  ctx.beginPath();
  ctx.roundRect(fx - 14, GROUND - 40, 28, 18, [3, 3, 9, 9]);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.6 + i / 3) % 1;
    ctx.fillStyle = `rgba(240,235,250,${0.4 * (1 - k)})`;
    circle(ctx, fx + Math.sin(time + i * 2) * 5, GROUND - 44 - k * 40, 4 + k * 6);
  }
  // her basket of finds
  const bx = cx - 76;
  ctx.fillStyle = '#d8b07a';
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx - 16, GROUND - 22, 32, 22, [3, 3, 8, 8]);
  ctx.fill();
  ctx.stroke();
  for (const [dx, c] of [[-8, '#e0b8c8'], [0, '#c8a07a'], [8, '#b3f0e0']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(bx + dx, GROUND - 22, 6, Math.PI, 0);
    ctx.fill();
  }
}

// The Glow Shelf: a lone cap high over the Thread Caverns. Someone left an old lantern up here, and the
// stalk has a little gear carved into it, worn almost smooth
function drawGlowShelf(ctx, p, time) {
  const cx = p.x + p.w / 2;
  glow(ctx, cx, p.y - 20, 90, 60, '255,230,170', 0.25 + 0.1 * Math.sin(time * 1.1));
  // the lantern: brass gone green, a soft light still in it
  const lx = cx + 24, ly = p.y - 4;
  ctx.fillStyle = '#7a8a6a';
  ctx.beginPath();
  ctx.roundRect(lx - 7, ly - 20, 14, 18, 3);
  ctx.fill();
  glow(ctx, lx, ly - 11, 18, 18, '255,220,150', 0.8 + 0.2 * Math.sin(time * 3.3));
  ctx.fillStyle = '#ffe6b0';
  ellipse(ctx, lx, ly - 11, 3.5, 5);
  ctx.strokeStyle = '#5a6a4a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(lx, ly - 21, 5, Math.PI, 0);
  ctx.stroke();
  // a carved gear on the stalk
  ctx.strokeStyle = 'rgba(110,90,80,0.7)';
  ctx.lineWidth = 1.5;
  const gx = cx, gy = p.y + 46;
  ctx.beginPath();
  ctx.arc(gx, gy, 7, 0, TAU);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.moveTo(gx + Math.cos(a) * 7, gy + Math.sin(a) * 7);
    ctx.lineTo(gx + Math.cos(a) * 10, gy + Math.sin(a) * 10);
  }
  ctx.stroke();
}

// The floor: dark loam with moss, pebbles and little glowing mushrooms
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = '#463852';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#5b4a6a';
  ctx.fillRect(L, GROUND, R - L, 10);
  ctx.fillStyle = '#6f8a62';
  for (let x = L - (L % 34); x < R; x += 34) ellipse(ctx, x + 12, GROUND + 1, 16, 4);
  for (const p of pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.fillStyle = p.c;
    ellipse(ctx, p.x, GROUND + p.dy, p.s, p.s * 0.6);
  }
  for (const m of shrooms) {
    if (m.x < L - 20 || m.x > R + 20) continue;
    const s = m.s, bob = Math.sin(time * 1.2 + m.p) * 0.6;
    if (m.glow) glow(ctx, m.x, GROUND - m.h - 2, 16 * s, 12 * s, m.c === '#b3f0e0' ? '160,255,225' : '255,190,235', 0.35 + 0.15 * Math.sin(time * 2 + m.p));
    ctx.fillStyle = '#efe4d0';
    ctx.fillRect(m.x - 1.5 * s, GROUND - m.h, 3 * s, m.h + 2);
    ctx.fillStyle = m.c;
    ctx.beginPath();
    ctx.ellipse(m.x, GROUND - m.h + bob, 7 * s, 5 * s, 0, Math.PI, 0);
    ctx.fill();
  }
}

function drawZoneSign(ctx, x, z, i, time) {
  const board = ['#8a7ab0', '#6aa8a0', '#a07ab0'][i - 1] ?? '#8a7ab0', edge = ['#5a4a80', '#3e7870', '#6a4a80'][i - 1] ?? '#5a4a80';
  ctx.fillStyle = '#7a5a40';
  ctx.beginPath();
  ctx.roundRect(x - 4, GROUND - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(120, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = board;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#ffffff');
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, edge);
  // a tiny glowing mushroom growing on the board
  glow(ctx, tw / 2 - 16, -26, 12, 10, '160,255,225', 0.6);
  ctx.fillStyle = '#b3f0e0';
  ctx.beginPath();
  ctx.arc(tw / 2 - 16, -24, 6, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

// The way back up to the Grove
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(x - 3, GROUND - 92, 6, 92);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, -12);
  ctx.lineTo(-50, -12);
  ctx.lineTo(-62, 0);
  ctx.lineTo(-50, 12);
  ctx.lineTo(56, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Up to the Grove', -2, 1, 11, INK);
  ctx.restore();
}

// Glowing specks drifting in the dark (screen space, so they're everywhere you look)
function drawMotes(ctx, camX, time) {
  ctx.save();
  for (const m of motes) {
    const x = camX + ((m.x - camX * 0.2 + Math.sin(time * 0.3 + m.p) * 30) % W + W) % W;
    const y = m.y - ((time * m.v) % 380);
    const yy = y < 60 ? y + 380 : y;
    ctx.fillStyle = `rgba(${m.c},${0.35 + 0.35 * Math.sin(time * 2 + m.p)})`;
    circle(ctx, x, yy, m.s);
  }
  ctx.restore();
}
