// Docs: docs/places/foundry.md, docs/places/underflues.md
// The Old Foundry (room FOUNDRY, a hard pocket; data in src/shared/rpg.js): where the forge folk cast the great
// gear-teeth, a cold hall deep in the mountain at the end of the Ashwood's old mine adit (FOUNDRY_GATE_X, the bricks
// taken out in E3b). Brick arches black with soot, iron girders and a gantry crane overhead with empty ladles on its
// chains, rails along the floor with carts left standing, slag heaps, stacks of cold moulds, casting pits cut in the
// floor. You come in at the EAST end, out of the adit, and go west, deeper and older: the Adit (no mobs), the Rail
// Yard, the Slag Heaps and the Casting Floor, where the biggest pit still glows: Old Crucible lives in it, round a
// half-cast tooth that was never finished. The tally board by the pit is drawn by src/ruins.js (a reading); the
// Pattern (last in FOUNDRY_PLATFORMS), up in the pattern loft over the Casting Floor, is the find.
// Emberdeep's register: iron, slag, brick, soot; dark, with a red glow only where something is still hot.
// E5 (b): hot grates in the floor over the old flues (HOT_GRATES, drawn from the server tick: drawGrate) warm, vent
// and cool on a cycle; the way down at the back of the big pit is drawn by src/branch-gates.js (OPEN.flue) and the
// stoker's ledger beside it by src/ruins.js.
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { FOUNDRY_W, FOUNDRY_EXIT_X, FOUNDRY_ZONES, FOUNDRY_PLATFORMS, FOUNDRY_PIT_X, FIELD_GROUND, HOT_GRATES, grateAt } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const ADIT_X = FOUNDRY_ZONES[3].x0;
const CAST_X1 = FOUNDRY_ZONES[0].x1;
const PAT = FOUNDRY_PLATFORMS.at(-1);
const PIT_W = 460; // the big pit, centred on FOUNDRY_PIT_X
const BRICK = '#4a2e2a', BRICK_D = '#2a1a18', BRICK_L = '#6a443c';
const IRON = '#5a5460', IRON_D = '#2e2a32', IRON_L = '#8a8490';
const SOOT = '#141012';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3); // src/glow.js
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
const ARCH_STEP = 560; // the hall's brick arches
// chains down from the crane rail, some with an empty ladle (a crucible bucket) on the hook
const chains = (() => {
  const r = mulberry32(6001);
  const out = [];
  for (let x = 260; x < ADIT_X - 120; x += 300 + r() * 260) out.push({ x, len: 90 + r() * 110, ladle: r() < 0.45, p: r() * TAU });
  return out;
})();
// slag heaps in the background (the ones you stand on are platforms)
const heaps = (() => {
  const r = mulberry32(6011);
  const out = [];
  for (let x = CAST_X1 + 80; x < FOUNDRY_ZONES[1].x1; x += 220 + r() * 200) out.push({ x, w: 90 + r() * 90, h: 40 + r() * 50 });
  return out;
})();
// stacks of cold moulds: iron flasks of rammed sand, the tooth's shape pressed in the top one
const moulds = (() => {
  const r = mulberry32(6021);
  const out = [];
  for (let x = 1800; x < ADIT_X - 200; x += 420 + r() * 380) {
    if (FOUNDRY_PLATFORMS.some((p) => x > p.x - 60 && x < p.x + p.w + 60)) continue;
    out.push({ x, n: 1 + Math.floor(r() * 3), w: 64 + r() * 20 });
  }
  return out;
})();
// small cold pits cut in the floor (the big one is Old Crucible's)
const pits = [{ x: 2140, w: 150 }, { x: 2820, w: 130 }, { x: 3620, w: 120 }];
// soot flakes coming down, sparks up off the big pit
const flakes = (() => {
  const r = mulberry32(6031);
  return Array.from({ length: 50 }, () => ({ x: r() * FOUNDRY_W, p: r(), v: 0.02 + r() * 0.04, d: r() * TAU }));
})();
const sparks = (() => {
  const r = mulberry32(6041);
  return Array.from({ length: 22 }, () => ({ x: FOUNDRY_PIT_X + (r() - 0.5) * PIT_W * 0.9, p: r(), v: 0.25 + r() * 0.35 }));
})();

// Everything behind the slimes. camX is the left edge of the view; tick: the server tick (null offline), for the grates
export function drawFoundry(ctx, camX, viewW, time, tick = null) {
  const L = camX - 160, R = camX + viewW + 160;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#0a0809'], [0.45, '#1a1314'], [1, '#2c2020']]);
  ctx.fillRect(L, 0, R - L, H);
  drawArches(ctx, L, R);
  if (visible(FOUNDRY_PIT_X - PIT_W, FOUNDRY_PIT_X + PIT_W, L, R)) glow(ctx, FOUNDRY_PIT_X, GROUND - 40, PIT_W * 0.9, 220, '255,110,50', 0.28 + 0.04 * Math.sin(time * 0.9));
  drawRoof(ctx, L, R, time);
  for (const h of heaps) if (visible(h.x - h.w, h.x + h.w, L, R)) drawHeapBack(ctx, h);
  for (const m of moulds) if (visible(m.x - 60, m.x + 60, L, R)) drawMoulds(ctx, m);
  if (visible(FOUNDRY_PIT_X - PIT_W, FOUNDRY_PIT_X + PIT_W, L, R)) drawTooth(ctx, time);
  for (const p of FOUNDRY_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'gantry') drawGantry(ctx, p);
    else if (p.kind === 'heap') drawHeap(ctx, p);
    else if (p.kind === 'cart') drawCart(ctx, p);
  }
  if (visible(PAT.x - 120, PAT.x + PAT.w + 120, L, R)) drawPatternLoft(ctx, PAT, time);
  if (visible(ADIT_X - 200, FOUNDRY_W, L, R)) drawAdit(ctx, time);
  drawFloor(ctx, Math.max(0, L), Math.min(FOUNDRY_W, R), time);
  if (tick !== null) HOT_GRATES.forEach((g, i) => visible(g.x - g.w, g.x + g.w, L, R) && drawGrate(ctx, g, grateAt(i, Math.floor(tick)), time));
  FOUNDRY_ZONES.forEach((z) => {
    if (!z.lvl) return;
    const sx = z.x1 - 90; // (each zone's sign at its east edge: you walk in from the east)
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z);
  });
  if (visible(FOUNDRY_EXIT_X - 300, FOUNDRY_EXIT_X, L, R)) drawExitSign(ctx, FOUNDRY_EXIT_X - 120, time);
  // soot coming down everywhere; sparks going up off the big pit
  for (const f of flakes) {
    if (f.x < L || f.x > R) continue;
    const k = (time * f.v + f.p) % 1;
    ctx.fillStyle = `rgba(40,32,34,${0.6 * Math.sin(k * Math.PI)})`;
    circle(ctx, f.x + Math.sin(k * 6 + f.d) * 10, 90 + k * (GROUND - 90), 1.6);
  }
  if (visible(FOUNDRY_PIT_X - PIT_W, FOUNDRY_PIT_X + PIT_W, L, R)) {
    for (const s of sparks) {
      const k = (time * s.v + s.p) % 1;
      ctx.fillStyle = `rgba(255,${170 - k * 80},80,${0.8 * (1 - k)})`;
      circle(ctx, s.x + Math.sin(k * 9 + s.p * 7) * 6, GROUND + 10 - k * 170, 1.4);
    }
  }
  ctx.restore();
}

// The back wall: great brick arches, soot-black at the top, each one a dark bay
function drawArches(ctx, L, R) {
  const top = 120;
  ctx.fillStyle = BRICK_D;
  ctx.fillRect(L, top - 30, R - L, GROUND - top + 30);
  for (let ax = Math.floor(L / ARCH_STEP) * ARCH_STEP; ax < R + ARCH_STEP; ax += ARCH_STEP) {
    if (ax > ADIT_X - 60) break; // (the adit's rock)
    const cx = ax + ARCH_STEP / 2, hw = ARCH_STEP / 2 - 46;
    // the pier between bays
    ctx.fillStyle = BRICK;
    ctx.fillRect(ax - 46, top - 20, 92, GROUND - top + 20);
    ctx.strokeStyle = 'rgba(20,12,12,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = top - 14; y < GROUND; y += 12) {
      ctx.moveTo(ax - 46, y);
      ctx.lineTo(ax + 46, y);
      for (let x = ax - 46 + ((y / 12) % 2 ? 12 : 0); x < ax + 46; x += 24) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 12);
      }
    }
    ctx.stroke();
    // the bay: dark inside an arch of brick
    ctx.fillStyle = '#120c0d';
    ctx.beginPath();
    ctx.moveTo(cx - hw, GROUND);
    ctx.lineTo(cx - hw, top + 110);
    ctx.quadraticCurveTo(cx - hw, top + 20, cx, top + 16);
    ctx.quadraticCurveTo(cx + hw, top + 20, cx + hw, top + 110);
    ctx.lineTo(cx + hw, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = BRICK_L;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - hw, GROUND - 40);
    ctx.lineTo(cx - hw, top + 110);
    ctx.quadraticCurveTo(cx - hw, top + 20, cx, top + 16);
    ctx.quadraticCurveTo(cx + hw, top + 20, cx + hw, top + 110);
    ctx.lineTo(cx + hw, GROUND - 40);
    ctx.stroke();
    // soot up the top of the arch
    ctx.fillStyle = 'rgba(10,6,6,0.45)';
    ctx.fillRect(ax - 46, top - 20, ARCH_STEP, 60);
  }
}

// The roof: iron trusses, the gantry crane's rail, chains down with hooks and empty ladles
function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = SOOT;
  ctx.fillRect(L, 0, R - L, 62);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(L, 58, R - L, 10); // the bottom chord
  ctx.fillRect(L, 84, Math.min(R, ADIT_X) - L, 8); // the crane rail
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = Math.floor(L / 140) * 140; x < R; x += 140) {
    ctx.moveTo(x, 62);
    ctx.lineTo(x + 70, 8);
    ctx.lineTo(x + 140, 62);
  }
  ctx.stroke();
  ctx.fillStyle = IRON_L; // rivets on the rail
  for (let x = Math.floor(L / 40) * 40; x < Math.min(R, ADIT_X); x += 40) circle(ctx, x, 88, 1.3);
  for (const c of chains) {
    if (!visible(c.x - 30, c.x + 30, L, R)) continue;
    const sway = Math.sin(time * 0.6 + c.p) * 3, y1 = 92 + c.len;
    ctx.strokeStyle = '#6a646e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(c.x, 92);
    ctx.lineTo(c.x + sway, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    if (c.ladle) {
      // an empty ladle: a tipped iron bucket on a bail
      ctx.save();
      ctx.translate(c.x + sway, y1);
      ctx.strokeStyle = IRON_L;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 14, 16, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.fillStyle = IRON;
      ctx.strokeStyle = IRON_D;
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(16, 10);
      ctx.lineTo(12, 36);
      ctx.lineTo(-12, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a2a26'; // the old metal dried in its lip
      ctx.fillRect(-16, 9, 32, 4);
      ctx.restore();
    } else {
      ctx.strokeStyle = IRON_L;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x + sway + 5, y1 + 6, 6, Math.PI, Math.PI * 0.2, true);
      ctx.stroke();
    }
  }
}

function drawHeapBack(ctx, h) {
  ctx.fillStyle = '#1e181a';
  ctx.beginPath();
  ctx.moveTo(h.x - h.w, GROUND + 2);
  ctx.quadraticCurveTo(h.x - h.w * 0.3, GROUND - h.h * 1.2, h.x, GROUND - h.h);
  ctx.quadraticCurveTo(h.x + h.w * 0.4, GROUND - h.h * 1.1, h.x + h.w, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(160,170,200,0.18)'; // glassy glints
  for (let i = 0; i < 4; i++) ellipse(ctx, h.x - h.w * 0.5 + i * h.w * 0.32, GROUND - h.h * (0.3 + (i % 2) * 0.3), 4, 1.5, -0.4);
}

// A slag heap you can stand on: black, glassy, a flat top where the barrows tipped
function drawHeap(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#262022';
  ctx.strokeStyle = '#0e0a0c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 50, GROUND + 2);
  ctx.quadraticCurveTo(x - 10, y + 10, x, y);
  ctx.lineTo(x + w, y);
  ctx.quadraticCurveTo(x + w + 10, y + 10, x + w + 50, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a3236';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 3, w + 8, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(170,180,210,0.3)';
  for (const k of [0.15, 0.45, 0.8]) ellipse(ctx, x + w * k, y + 30 + k * 20, 5, 2, -0.3);
  ctx.fillStyle = 'rgba(255,120,60,0.35)'; // a seam still a little warm
  ellipse(ctx, x + w * 0.62, y + 54, 7, 2);
}

// A girder of the gantry: a riveted iron I-beam on two chains
function drawGantry(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#6a646e';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  for (const cx of [x + 16, x + w - 16]) {
    ctx.moveTo(cx, 92);
    ctx.lineTo(cx, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = IRON;
  ctx.fillRect(x - 6, y - 2, w + 12, 6);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(x, y + 4, w, 10);
  ctx.fillStyle = IRON;
  ctx.fillRect(x - 6, y + 14, w + 12, 5);
  ctx.fillStyle = IRON_L;
  for (let rx = x + 6; rx < x + w; rx += 18) {
    circle(ctx, rx, y + 1, 1.2);
    circle(ctx, rx, y + 16, 1.2);
  }
  ctx.fillStyle = 'rgba(120,60,40,0.35)'; // rust streaks
  for (const k of [0.2, 0.55, 0.85]) ctx.fillRect(x + w * k, y + 4, 3, 14);
}

// An ore cart left standing on the rails, its tub full of cold slag: the top is the platform
function drawCart(ctx, p) {
  const { x, y, w } = p;
  const cx = x + w / 2;
  // the trestle it stands on (the rails run over a raised bed here)
  ctx.fillStyle = '#3a2a24';
  for (const lx of [x + 20, x + w - 30]) ctx.fillRect(lx, y + 60, 10, GROUND - y - 60);
  ctx.fillRect(x, y + 56, w, 8);
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 14, y + 44);
  ctx.lineTo(x + 14, y + 44);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 6, w - 8, 3);
  ctx.fillStyle = '#262022'; // the cold slag heaped in the tub
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 8, 4);
  ctx.fill();
  ctx.fillStyle = IRON;
  for (const wx of [x + 34, x + w - 34]) {
    circle(ctx, wx, y + 50, 10);
    ctx.fillStyle = IRON_D;
    circle(ctx, wx, y + 50, 4);
    ctx.fillStyle = IRON;
  }
  ctx.fillStyle = IRON_L;
  ctx.fillRect(cx - 3, y + 18, 6, 6);
}

// Stacks of cold moulds: iron flasks of black rammed sand, the top one open with a gear-tooth's shape pressed in it
function drawMoulds(ctx, m) {
  for (let i = 0; i < m.n; i++) {
    const y = GROUND - (i + 1) * 26, w = m.w - i * 4;
    ctx.fillStyle = IRON_D;
    ctx.fillRect(m.x - w / 2, y, w, 26);
    ctx.fillStyle = IRON;
    ctx.fillRect(m.x - w / 2 - 4, y, 8, 26);
    ctx.fillRect(m.x + w / 2 - 4, y, 8, 26);
    ctx.fillStyle = '#2a2224';
    ctx.fillRect(m.x - w / 2 + 4, y + 2, w - 8, 4);
  }
  // the tooth's print in the top one
  const ty = GROUND - m.n * 26 + 3;
  ctx.fillStyle = '#0e0a0c';
  ctx.beginPath();
  ctx.moveTo(m.x - 12, ty + 2);
  ctx.lineTo(m.x - 6, ty - 0.5);
  ctx.lineTo(m.x + 6, ty - 0.5);
  ctx.lineTo(m.x + 12, ty + 2);
  ctx.closePath();
  ctx.fill();
}

// The half-cast tooth in the biggest pit: a great iron gear-tooth standing up out of its mould, rough from the
// sand, its top never poured (the iron stops in a ragged line and the mould's empty shape goes on above it in sand)
function drawTooth(ctx, time) {
  const cx = FOUNDRY_PIT_X, base = GROUND + 10, tw = 180, th = 230;
  // the mould round it, broken open on this side
  ctx.fillStyle = '#2a2224';
  ctx.beginPath();
  ctx.moveTo(cx - tw * 0.85, base);
  ctx.lineTo(cx - tw * 0.85, base - th * 0.6);
  ctx.lineTo(cx - tw * 0.6, base - th * 0.6);
  ctx.lineTo(cx - tw * 0.6, base);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + tw * 0.85, base);
  ctx.lineTo(cx + tw * 0.85, base - th * 0.42);
  ctx.lineTo(cx + tw * 0.62, base - th * 0.5);
  ctx.lineTo(cx + tw * 0.6, base);
  ctx.closePath();
  ctx.fill();
  // the tooth's whole shape, the empty part: a dashed outline in the sand above where the iron stopped
  const shape = () => {
    ctx.moveTo(cx - tw / 2, base);
    ctx.lineTo(cx - tw * 0.32, base - th);
    ctx.lineTo(cx + tw * 0.32, base - th);
    ctx.lineTo(cx + tw / 2, base);
    ctx.closePath();
  };
  ctx.strokeStyle = 'rgba(150,130,120,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  shape();
  ctx.stroke();
  ctx.setLineDash([]);
  // the iron that was poured: the bottom part, its top ragged
  ctx.save();
  ctx.beginPath();
  shape();
  ctx.clip();
  ctx.fillStyle = '#4a4450';
  ctx.beginPath();
  ctx.moveTo(cx - tw, base + 4);
  const cut = base - th * 0.56;
  for (let k = 0; k <= 12; k++) ctx.lineTo(cx - tw / 2 + (tw * k) / 12, cut + Math.sin(k * 2.3) * 8 + (k % 3) * 3);
  ctx.lineTo(cx + tw, base + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(30,26,30,0.5)'; // sand-rough
  const r = mulberry32(6051);
  for (let i = 0; i < 50; i++) circle(ctx, cx - tw / 2 + r() * tw, cut + 10 + r() * th * 0.55, 1 + r() * 1.5);
  ctx.fillStyle = 'rgba(160,150,170,0.25)'; // a sheen down one face
  ctx.fillRect(cx - tw * 0.3, cut + 14, 10, th * 0.5);
  ctx.restore();
  // the heat at its foot, where the pit is kept hot
  ctx.fillStyle = `rgba(255,120,50,${0.25 + 0.06 * Math.sin(time * 1.5)})`;
  ellipse(ctx, cx, base - 4, tw * 0.7, 10);
}

// The pattern loft: a timber platform high over the Casting Floor, where the pattern-makers kept their wooden models.
// On it, the Pattern: the wooden master of the tooth, pale varnished pine, every mould here was pressed from it, with
// the old smith's mark burnt into its face (a hammer over a flame). A rack of chisels; shavings, long dry.
function drawPatternLoft(ctx, p, time) {
  const { x, y, w } = p;
  // posts and braces up from the gantry below
  ctx.fillStyle = '#5a4434';
  ctx.fillRect(x + 6, y, 8, 98);
  ctx.fillRect(x + w - 14, y, 8, 98);
  ctx.strokeStyle = '#4a3828';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 70);
  ctx.lineTo(x + w - 10, y + 10);
  ctx.stroke();
  // the floor boards
  ctx.fillStyle = '#7a5e44';
  ctx.strokeStyle = '#3e2e22';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, w + 12, 10, 2);
  ctx.fill();
  ctx.stroke();
  for (let bx = x; bx < x + w; bx += 20) ctx.strokeRect(bx, y - 4, 20, 10);
  // the Pattern: a big wooden tooth leaning on a rail, the mark burnt in
  const px = x + w * 0.42, by = y - 4;
  glow(ctx, px, by - 30, 70, 46, '255,220,170', 0.16 + 0.03 * Math.sin(time * 0.8));
  ctx.save();
  ctx.translate(px, by);
  ctx.rotate(-0.08);
  ctx.fillStyle = '#d8b484';
  ctx.strokeStyle = '#8a6440';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(-16, -62);
  ctx.lineTo(16, -62);
  ctx.lineTo(26, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(140,100,60,0.5)'; // the grain
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const gx of [-12, -4, 6, 14]) {
    ctx.moveTo(gx * 1.3, -2);
    ctx.quadraticCurveTo(gx + 3, -30, gx * 0.7, -60);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,250,230,0.35)'; // varnish shine
  ctx.fillRect(-14, -56, 4, 44);
  // the mark: a hammer over a flame, burnt dark
  ctx.fillStyle = '#3a2418';
  ctx.beginPath(); // the flame
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(-8, -24, -2, -34);
  ctx.quadraticCurveTo(0, -28, 3, -30);
  ctx.quadraticCurveTo(8, -24, 0, -16);
  ctx.fill();
  ctx.fillRect(-1.2, -50, 2.4, 14); // the hammer's handle
  ctx.fillRect(-7, -52, 14, 5); // its head
  ctx.restore();
  // the chisel rack on the post, shavings on the boards
  ctx.fillStyle = '#4a3828';
  ctx.fillRect(x + w - 22, y - 40, 14, 4);
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(x + w - 20 + i * 3.5, y - 38);
    ctx.lineTo(x + w - 20 + i * 3.5, y - 24);
  }
  ctx.stroke();
  ctx.strokeStyle = '#e8cfa0';
  ctx.lineWidth = 1.2;
  for (const [sx, sr] of [[x + 14, 4], [x + 24, 3], [x + w - 34, 3.5]]) {
    ctx.beginPath();
    ctx.arc(sx, y - 6, sr, Math.PI, TAU * 0.9);
    ctx.stroke();
  }
}

// The Adit (no mobs): the mine tunnel you came down, rough rock and timber props, the rail coming in, daylight from
// the Ashwood far up at its east end
function drawAdit(ctx, time) {
  ctx.fillStyle = '#1e1a1e';
  ctx.fillRect(ADIT_X - 60, 0, FOUNDRY_W - ADIT_X + 60, GROUND);
  // the rock face where the hall ends and the tunnel starts
  ctx.fillStyle = '#2e282e';
  ctx.beginPath();
  ctx.moveTo(ADIT_X - 60, 0);
  ctx.lineTo(ADIT_X + 40, 0);
  ctx.quadraticCurveTo(ADIT_X + 10, 200, ADIT_X + 50, GROUND);
  ctx.lineTo(ADIT_X - 60, GROUND);
  ctx.closePath();
  ctx.fill();
  // the tunnel's roof, low
  ctx.fillStyle = '#141014';
  ctx.beginPath();
  ctx.moveTo(ADIT_X, 0);
  ctx.lineTo(FOUNDRY_W, 0);
  ctx.lineTo(FOUNDRY_W, 250);
  for (let x = FOUNDRY_W; x > ADIT_X; x -= 60) ctx.lineTo(x, 240 + Math.sin(x / 70) * 14);
  ctx.closePath();
  ctx.fill();
  // timber props
  for (let x = ADIT_X + 120; x < FOUNDRY_W - 60; x += 150) {
    ctx.fillStyle = '#4a3a30';
    ctx.fillRect(x - 5, 250, 10, GROUND - 250);
    ctx.fillRect(x - 40, 244, 80, 10);
  }
  // daylight from the way up, and the lamp hung on the last prop
  glow(ctx, FOUNDRY_W - 40, GROUND - 120, 220, 180, '255,236,210', 0.3);
  const lx = FOUNDRY_W - 330;
  glow(ctx, lx, 280, 60, 50, '255,200,120', 0.35 + 0.05 * Math.sin(time * 3.1));
  ctx.fillStyle = '#3a3034';
  ctx.beginPath();
  ctx.roundRect(lx - 5, 266, 10, 13, 2);
  ctx.fill();
  ctx.fillStyle = '#ffd890';
  ctx.beginPath();
  ctx.roundRect(lx - 3, 269, 6, 7, 1.5);
  ctx.fill();
}

function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#3e3436'], [0.25, '#262022'], [1, '#0e0a0c']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(150,130,120,0.2)';
  ctx.fillRect(L, GROUND - 1, R - L, 3);
  // the rails, running the length of the hall
  ctx.fillStyle = '#3a2a24';
  for (let x = Math.floor(L / 26) * 26; x < R; x += 26) ctx.fillRect(x, GROUND + 14, 14, 5);
  ctx.fillStyle = '#6a646e';
  ctx.fillRect(L, GROUND + 12, R - L, 2.5);
  ctx.fillRect(L, GROUND + 20, R - L, 2.5);
  // the small cold pits
  for (const p of pits) {
    if (!visible(p.x - p.w, p.x + p.w, L, R)) continue;
    ctx.fillStyle = '#0c0809';
    ctx.fillRect(p.x - p.w / 2, GROUND + 26, p.w, 40);
    ctx.fillStyle = BRICK;
    ctx.fillRect(p.x - p.w / 2 - 6, GROUND + 24, p.w + 12, 4);
  }
  // the big pit: brick-lined, glowing at the bottom
  if (visible(FOUNDRY_PIT_X - PIT_W, FOUNDRY_PIT_X + PIT_W, L, R)) {
    const x0 = FOUNDRY_PIT_X - PIT_W / 2;
    ctx.fillStyle = '#120808';
    ctx.fillRect(x0, GROUND + 26, PIT_W, H - GROUND - 26);
    ctx.fillStyle = `rgba(255,${110 + 20 * Math.sin(time * 1.2)},40,0.75)`;
    ctx.fillRect(x0 + 10, H - 22, PIT_W - 20, 22);
    glow(ctx, FOUNDRY_PIT_X, H - 10, PIT_W * 0.6, 50, '255,140,60', 0.5);
    ctx.fillStyle = BRICK_L;
    ctx.fillRect(x0 - 8, GROUND + 22, PIT_W + 16, 6);
  }
}

// A hot grate (HOT_GRATES, E5 (b)): an iron grate set in the floor over one of the old flues. Cold it's dull iron over
// black; as it warms (k) the bars glow from dull red to orange; venting, heat roars up out of it in a shimmering
// column with sparks (and hurts whoever stands on it: the server decides)
function drawGrate(ctx, g, st, time) {
  const x0 = g.x - g.w / 2, k = st.k;
  ctx.fillStyle = '#080506';
  ctx.fillRect(x0, GROUND - 1, g.w, 10);
  if (k > 0.02) {
    ctx.fillStyle = `rgba(255,${90 + 80 * k},40,${0.25 + 0.6 * k})`;
    ctx.fillRect(x0 + 3, GROUND + 2, g.w - 6, 6);
  }
  // the bars
  const r = Math.round(70 + 185 * k), gg = Math.round(66 + 70 * k * k), b = Math.round(72 - 40 * k);
  ctx.fillStyle = `rgb(${r},${gg},${b})`;
  for (let x = x0 + 4; x < x0 + g.w - 2; x += 9) ctx.fillRect(x, GROUND - 1, 3.5, 9);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(x0 - 4, GROUND - 2, g.w + 8, 3);
  ctx.fillRect(x0 - 4, GROUND + 8, g.w + 8, 2);
  if (k > 0.3) glow(ctx, g.x, GROUND - 6, g.w * 0.75, 30 + 40 * k, '255,120,50', 0.25 * k);
  if (!st.vent) return;
  // venting: a column of heat roaring up, shimmering, with sparks in it
  glow(ctx, g.x, GROUND - 70, g.w * 0.7, 110, '255,140,60', 0.22 + 0.06 * Math.sin(time * 9));
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const p = (time * 1.4 + i / 6) % 1, x = x0 + 10 + ((i * 37) % (g.w - 20));
    ctx.strokeStyle = `rgba(255,200,140,${0.35 * (1 - p)})`;
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 4 - p * 120);
    ctx.quadraticCurveTo(x + Math.sin(time * 7 + i) * 6, GROUND - 18 - p * 120, x, GROUND - 32 - p * 120);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,${200 - p * 90},90,${0.9 * (1 - p)})`;
    circle(ctx, x + Math.sin(p * 8 + i) * 8, GROUND - 6 - p * 150, 1.5);
  }
}

// The zones' markers: an iron plate bolted to a post, the name stamped in, a red level chip (a hard pocket)
function drawZoneMark(ctx, x, z) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = '#3a3034';
  ctx.fillRect(-4, 20, 8, 42);
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -26, tw, 50, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  for (const [bx, by] of [[-tw / 2 + 7, -19], [tw / 2 - 7, -19], [-tw / 2 + 7, 17], [tw / 2 - 7, 17]]) circle(ctx, bx, by, 2);
  text(ctx, z.name, 0, -9, 15, '#f2e6d8');
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.roundRect(-32, 4, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, '#fffaf0');
  ctx.restore();
}

// The way back out to the Ashwood
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#6e5240';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-64, -12);
  ctx.lineTo(58, -12);
  ctx.lineTo(70, 0);
  ctx.lineTo(58, 12);
  ctx.lineTo(-64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Out to the Ashwood', 2, 1, 11, '#5b4a6b');
  ctx.restore();
}
