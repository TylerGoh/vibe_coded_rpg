// Docs: docs/places/grotto.md
// The Narwhal Grotto (room GROTTO, a hard pocket; data in src/shared/rpg.js): a sea cave of green ice in the
// cliff at the Whale Skerries' far end. You come in at the WEST end, out of daylight, and go east into the
// cliff: the Grotto Mouth (no mobs; grey daylight and the sea behind you), the Green Halls (walls of old green
// sea ice with light moving in them, still pools along the floor) and the Tusk Hall, where the Old Narwhal's
// pod shed their tusks for longer than anyone knows and the ice kept them: hundreds of spiral tusks frozen
// into the back wall, all pointing the same way, out to sea. Up among them (the nook, last in
// GROTTO_PLATFORMS) one very small tusk lies on its own: the hidden spot.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { GROTTO_W, GROTTO_EXIT_X, GROTTO_ZONES, GROTTO_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const TUSK_X = GROTTO_ZONES[2].x0;
const NOOK = GROTTO_PLATFORMS.at(-1);
const ICE = '#5ab8a0', ICE_D = '#2a6a64', ICE_L = '#a8ecd8', ICE_LINE = '#1a4a48';
const IVORY = '#f4ecd8', IVORY_L = '#8a7a5a';
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
const roofIcicles = (() => {
  const r = mulberry32(3901);
  return Array.from({ length: 120 }, () => ({ x: r() * GROTTO_W, len: 20 + r() * 70, w: 6 + r() * 14 }));
})();
const veins = (() => {
  const r = mulberry32(3911);
  return Array.from({ length: 50 }, () => ({ x: r() * GROTTO_W, y: 80 + r() * 260, len: 60 + r() * 160, a: (r() - 0.5) * 0.8, p: r() * TAU }));
})();
const pools = (() => {
  const r = mulberry32(3921);
  const out = [];
  for (let x = 700; x < GROTTO_W - 100; x += 300 + r() * 300) out.push({ x, w: 60 + r() * 90 });
  return out;
})();
const bubbles = (() => {
  const r = mulberry32(3931);
  return Array.from({ length: 40 }, () => ({ x: r() * GROTTO_W, y: 60 + r() * 330, p: r(), v: 0.04 + r() * 0.06 }));
})();
// the pod's tusks in the Tusk Hall's back wall: rows of them, frozen in, all pointing west (out to sea)
const tusks = (() => {
  const r = mulberry32(3941);
  const out = [];
  for (let x = TUSK_X + 80; x < GROTTO_W - 40; x += 70 + r() * 40) for (let row = 0; row < 4; row++) out.push({ x: x + row * 20 + r() * 16, y: 100 + row * 62 + r() * 20, len: 70 + r() * 70, a: Math.PI + (r() - 0.5) * 0.16, s: 1 + r() * 0.6 });
  return out;
})();
const drips = (() => {
  const r = mulberry32(3951);
  return Array.from({ length: 30 }, () => ({ x: r() * GROTTO_W, v: 0.3 + r() * 0.5, p: r() }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawGrotto(ctx, camX, viewW, time) {
  const L = camX - 160, R = camX + viewW + 160;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#0e2a2c'], [0.5, '#1a4a46'], [1, '#2e6a60']]);
  ctx.fillRect(L, 0, R - L, H);
  // far wall: green ice with light moving through it
  drawBackWall(ctx, L, R, time);
  if (visible(TUSK_X - 100, GROTTO_W, L, R)) drawTusks(ctx, L, R, time);
  for (const p of GROTTO_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'shelf') drawShelf(ctx, p, time);
  }
  if (visible(NOOK.x - 60, NOOK.x + NOOK.w + 60, L, R)) drawNook(ctx, NOOK, time);
  drawRoof(ctx, L, R, time);
  if (visible(-60, 520, L, R)) drawMouth(ctx, time);
  drawFloor(ctx, Math.max(0, L), Math.min(GROTTO_W, R), time);
  GROTTO_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 80;
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z, i, time);
  });
  if (visible(GROTTO_EXIT_X, GROTTO_EXIT_X + 260, L, R)) drawExitSign(ctx, GROTTO_EXIT_X + 110, time);
  // bubbles of light drifting up through the ice
  for (const b of bubbles) {
    if (b.x < L || b.x > R) continue;
    const k = (time * b.v + b.p) % 1;
    ctx.fillStyle = `rgba(190,255,230,${0.5 * Math.sin(k * Math.PI)})`;
    circle(ctx, b.x + Math.sin(k * 8 + b.p * 9) * 6, b.y - k * 80, 2);
  }
  ctx.restore();
}

function drawBackWall(ctx, L, R, time) {
  // the wall: big faceted slabs of green ice
  const x0 = Math.floor(L / 180) * 180;
  ctx.save();
  for (let x = x0; x < R + 200; x += 180) {
    const r = mulberry32(Math.round(x) + 7), i = Math.round(x / 180);
    const top = 40 + r() * 60, bot = GROUND - 10;
    ctx.fillStyle = i % 2 ? '#1e5a52' : '#246458';
    ctx.beginPath();
    ctx.moveTo(x, top + 20);
    ctx.lineTo(x + 90 + r() * 40, top);
    ctx.lineTo(x + 200, top + 30);
    ctx.lineTo(x + 210, bot);
    ctx.lineTo(x - 10, bot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(168,236,216,0.08)';
    ctx.fillRect(x + 20, top + 30, 30, bot - top - 40);
  }
  ctx.restore();
  // veins of light moving in the ice
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const v of veins) {
    if (!visible(v.x - v.len, v.x + v.len, L, R)) continue;
    const a = 0.08 + 0.08 * Math.sin(time * 0.9 + v.p);
    ctx.strokeStyle = `rgba(150,255,210,${a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.quadraticCurveTo(v.x + v.len * 0.5, v.y + v.len * v.a * 0.3 + Math.sin(time + v.p) * 6, v.x + v.len, v.y + v.len * v.a);
    ctx.stroke();
  }
  ctx.restore();
}

// The Tusk Hall's back wall: the pod's shed tusks frozen into clear green ice, all pointing out to sea
function drawTusks(ctx, L, R, time) {
  ctx.fillStyle = 'rgba(168,236,216,0.12)';
  ctx.fillRect(Math.max(L, TUSK_X), 60, R - Math.max(L, TUSK_X), GROUND - 70);
  for (const t of tusks) {
    if (!visible(t.x - t.len, t.x + 20, L, R)) continue;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.a);
    ctx.globalAlpha = 0.55 + 0.25 * t.s;
    ctx.fillStyle = IVORY;
    ctx.strokeStyle = IVORY_L;
    ctx.lineWidth = 1.2;
    const w = 5 * t.s;
    ctx.beginPath();
    ctx.moveTo(0, -w);
    ctx.lineTo(t.len, 0);
    ctx.lineTo(0, w);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let k = 1; k < 6; k++) {
      const x = (t.len * k) / 6, hw = w * (1 - k / 6);
      ctx.moveTo(x, -hw);
      ctx.lineTo(x + 6, hw);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  glow(ctx, (TUSK_X + GROTTO_W) / 2, 200, 500, 180, '200,255,230', 0.12 + 0.04 * Math.sin(time * 0.6));
}

// A shelf of old green ice sticking out of the wall (a platform), icicles under it
function drawShelf(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = ICE_D;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + w + 6, y);
  ctx.lineTo(x + w - 10, y + 24);
  ctx.quadraticCurveTo(x + w / 2, y + 36, x + 10, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 5, w + 12, 10, 5);
  ctx.fill();
  ctx.fillStyle = ICE_L;
  ctx.fillRect(x + 6, y - 3, w * 0.3, 2);
  ctx.fillStyle = 'rgba(168,236,216,0.85)';
  for (let i = 0; i < 5; i++) {
    const ix = x + 16 + (i * (w - 32)) / 4, len = 10 + ((i * 7) % 5) * 4;
    ctx.beginPath();
    ctx.moveTo(ix - 3, y + 22);
    ctx.lineTo(ix + 3, y + 22);
    ctx.lineTo(ix, y + 22 + len);
    ctx.closePath();
    ctx.fill();
  }
}

// The nook up among the tusks (the hidden spot): a little ledge, and on it, set apart from all the others, one
// very small tusk, a calf's, with a ring of pebbles round it that someone placed
function drawNook(ctx, p, time) {
  const { x, y, w } = p;
  drawShelf(ctx, p, time);
  const cx = x + w * 0.55;
  glow(ctx, cx, y - 8, 40, 24, '220,255,240', 0.3 + 0.1 * Math.sin(time * 1.5));
  ctx.fillStyle = '#8a9a94';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    ellipse(ctx, cx + Math.cos(a) * 18, y - 3 + Math.sin(a) * 3, 2.6, 1.8);
  }
  ctx.fillStyle = IVORY;
  ctx.strokeStyle = IVORY_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 12, y - 4);
  ctx.lineTo(cx - 14, y - 6);
  ctx.lineTo(cx + 12, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// The roof: icicles of green ice, drips falling from them
function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = '#0a2224';
  ctx.fillRect(L, 0, R - L, 26);
  for (const ic of roofIcicles) {
    if (!visible(ic.x - ic.w, ic.x + ic.w, L, R)) continue;
    ctx.fillStyle = 'rgba(90,184,160,0.9)';
    ctx.beginPath();
    ctx.moveTo(ic.x - ic.w / 2, 20);
    ctx.lineTo(ic.x + ic.w / 2, 20);
    ctx.lineTo(ic.x, 20 + ic.len);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(200,255,235,0.5)';
    ctx.fillRect(ic.x - ic.w * 0.25, 22, 2, ic.len * 0.5);
  }
  for (const d of drips) {
    if (d.x < L || d.x > R) continue;
    const k = (time * d.v + d.p) % 1;
    ctx.fillStyle = `rgba(200,255,235,${0.7 * (1 - k)})`;
    circle(ctx, d.x, 60 + k * (GROUND - 80), 1.8);
  }
}

// The mouth at the west end: grey daylight, the sea and a skerry beyond
function drawMouth(ctx, time) {
  const x = 70, b = GROUND;
  glow(ctx, x + 40, b - 120, 260, 200, '230,240,245', 0.35);
  ctx.fillStyle = vgrad(ctx, 'day', 80, b, [[0, '#b4bccc'], [0.7, '#e2e2e6'], [1, '#8a9aa6']]);
  ctx.beginPath();
  ctx.moveTo(-60, b + 2);
  ctx.lineTo(-60, 150);
  ctx.quadraticCurveTo(60, 70, 190, 170);
  ctx.quadraticCurveTo(220, 300, 200, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5e7480';
  ctx.fillRect(-60, b - 60, 255, 60);
  ctx.fillStyle = '#3a3e4c';
  ellipse(ctx, 40, b - 60, 50, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 4; i++) ellipse(ctx, -20 + i * 50 + Math.sin(time + i) * 4, b - 40 + i * 8, 20, 2);
  // the cave's lip, dark ice, round the opening
  ctx.strokeStyle = '#0e2a2c';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(-60, 140);
  ctx.quadraticCurveTo(60, 58, 196, 166);
  ctx.quadraticCurveTo(228, 300, 208, b + 4);
  ctx.stroke();
}

// The floor: green sea ice, glassy, with still dark pools along it and cracks
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#7ad0b8'], [0.25, '#3e9480'], [1, '#14403a']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(220,255,240,0.6)';
  ctx.fillRect(L, GROUND - 1, R - L, 4);
  for (const p of pools) {
    if (!visible(p.x - p.w, p.x + p.w, L, R)) continue;
    ctx.fillStyle = '#0e2a2c';
    ellipse(ctx, p.x, GROUND + 22, p.w / 2, 7);
    ctx.fillStyle = `rgba(150,255,210,${0.2 + 0.1 * Math.sin(time * 1.4 + p.x)})`;
    ellipse(ctx, p.x - p.w * 0.15, GROUND + 20, p.w * 0.25, 2);
  }
  ctx.strokeStyle = 'rgba(14,42,44,0.5)';
  ctx.lineWidth = 1.5;
  for (let x = Math.floor(L / 150) * 150; x < R; x += 150) {
    ctx.beginPath();
    ctx.moveTo(x + 40, GROUND + 10);
    ctx.lineTo(x + 60, GROUND + 34);
    ctx.lineTo(x + 52, GROUND + 70);
    ctx.stroke();
  }
}

// The zones' markers: a slab of ice with the name scratched in, a level chip (a hard pocket: the chip is red)
function drawZoneMark(ctx, x, z, i, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = 'rgba(168,236,216,0.85)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -24);
  ctx.lineTo(tw / 2, -28);
  ctx.lineTo(tw / 2 + 6, 60);
  ctx.lineTo(-tw / 2 - 4, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#0e2a2c');
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.roundRect(-32, 4, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, '#fffaf0');
  ctx.restore();
}

// The way back out to the Skerries
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
  ctx.moveTo(64, -12);
  ctx.lineTo(-58, -12);
  ctx.lineTo(-70, 0);
  ctx.lineTo(-58, 12);
  ctx.lineTo(64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Out to the Skerries', -2, 1, 11, '#5b4a6b');
  ctx.restore();
}
