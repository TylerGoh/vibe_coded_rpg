// Docs: docs/combat/bosses.md, docs/places/deep.md
// The Mycelium Deep's boss den (The Knotted Burrow), its molehill mouth in the Knotted Halls, and the
// Knotmole herself: a huge old blind mole wrapped in a shawl of the threads she has tied in knots, the
// Anchor shard in her paw. Her story: story/characters/bosses.md. dens.js imports this file and dispatches
// to it (same contracts as its own dens and bosses), so this file must NOT import dens.js: the few helpers
// it needs are copied below. The shared boss effects take her theme ('knot': FXPAL in dens.js); her Root
// Quake is the shared `stomp` ultimate.
import { H, TAU, mulberry32, circle, ellipse, mix } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const NEST_X = DEN_W - 120;
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

// A knot of glowing thread (a trefoil, tied tight), the glow pooled round it
export function knot(ctx, x, y, s, time, p = 0) {
  const pulse = 0.7 + 0.3 * Math.sin(time * 1.7 + p);
  glow(ctx, x, y, 40 * s, 30 * s, '170,255,220', 0.5 * pulse);
  const path = () => {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * TAU, k = 5.2 * s;
      const px = x + (Math.sin(a) + 2 * Math.sin(2 * a)) * k, py = y + (Math.cos(a) - 2 * Math.cos(2 * a)) * k * 0.8;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  ctx.lineJoin = 'round';
  path();
  ctx.strokeStyle = '#2e4c52';
  ctx.lineWidth = 5 * s;
  ctx.stroke();
  ctx.strokeStyle = `rgba(200,255,235,${0.8 * pulse})`;
  ctx.lineWidth = Math.max(1.4, 1.8 * s);
  ctx.stroke();
}

const roots = (() => {
  const r = mulberry32(3001);
  const out = [];
  for (let x = 30; x < DEN_W; x += 60 + r() * 90) out.push({ x, len: 40 + r() * 120, w: 3 + r() * 5, sway: r() * TAU, knot: r() < 0.35 });
  return out;
})();
const knots = (() => {
  const r = mulberry32(3003);
  return Array.from({ length: 9 }, () => ({ x: 120 + r() * (DEN_W - 240), y: 90 + r() * 200, s: 0.7 + r() * 0.8, p: r() * TAU }));
})();
const clods = (() => {
  const r = mulberry32(3007);
  const out = [];
  for (let x = 10; x < DEN_W; x += 26 + r() * 50) out.push({ x, dy: 8 + r() * 60, s: 3 + r() * 6, c: r() < 0.5 ? '#6a5048' : '#5a4440' });
  return out;
})();

// ——— the den ———
function drawDenKnot(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-knot', 0, GROUND + 10, [[0, '#1e1626'], [0.5, '#33263a'], [1, '#4e3a48']]);
  ctx.fillRect(L, 0, R - L, H);
  // the burrow's earthen walls, bulging in
  ctx.fillStyle = '#2a1e2c';
  ctx.beginPath();
  ctx.moveTo(L, 0);
  for (let x = Math.floor(L / 50) * 50; x <= R + 50; x += 50) ctx.lineTo(x, 36 + Math.sin(x * 0.012) * 14 + Math.sin(x * 0.05) * 5);
  ctx.lineTo(R, 0);
  ctx.closePath();
  ctx.fill();
  // threads strung across the roof and tied in knots everywhere: the warmth she's kept
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = '#2e4c52';
    ctx.lineWidth = 7 - i;
    ctx.beginPath();
    for (let x = Math.floor(L / 20) * 20; x <= R + 20; x += 20) {
      const y = 100 + i * 50 + Math.sin(x * 0.006 + i * 2) * 30;
      x === Math.floor(L / 20) * 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(170,250,225,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (const k of knots) if (visible(k.x - 50, k.x + 50, L, R)) knot(ctx, k.x, k.y, k.s, time, k.p);
  for (const r of roots) {
    if (!visible(r.x - 30, r.x + 30, L, R)) continue;
    const sw = Math.sin(time * 0.7 + r.sway) * 4;
    ctx.strokeStyle = '#5a4434';
    ctx.lineWidth = r.w;
    ctx.beginPath();
    ctx.moveTo(r.x, 20);
    ctx.quadraticCurveTo(r.x + 8, 20 + r.len * 0.5, r.x + sw, 20 + r.len);
    ctx.stroke();
    if (r.knot) knot(ctx, r.x + sw, 20 + r.len, 0.45, time, r.sway);
  }
  if (visible(NEST_X - 200, NEST_X + 200, L, R)) drawNest(ctx, NEST_X, time);
  // the floor: packed earth, crumbs of soil, roots poking through
  ctx.fillStyle = '#4a3640';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#5e4650';
  ctx.fillRect(L, GROUND, R - L, 10);
  for (const c of clods) {
    if (c.x < L || c.x > R) continue;
    ctx.fillStyle = c.c;
    ellipse(ctx, c.x, GROUND + c.dy, c.s, c.s * 0.6);
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Knotted Burrow', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p, i, time));
  ctx.restore();
}

// Her nest: a great tangled ball of knotted thread against the far wall, glowing from inside
function drawNest(ctx, x, time) {
  const pulse = 0.75 + 0.25 * Math.sin(time * 1.2);
  glow(ctx, x, GROUND - 90, 200, 140, '170,255,220', 0.35 * pulse);
  ctx.fillStyle = '#2e2a38';
  ctx.beginPath();
  ctx.ellipse(x, GROUND - 70, 150, 90, 0, Math.PI, 0);
  ctx.lineTo(x + 150, GROUND + 2);
  ctx.lineTo(x - 150, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  const r = mulberry32(3011);
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const cx = x - 120 + r() * 240, cy = GROUND - 20 - r() * 120, rx = 20 + r() * 40, ry = 8 + r() * 16;
    if (cy < GROUND - 70 - Math.sqrt(Math.max(0, 1 - ((cx - x) / 150) ** 2)) * 90) continue;
    ctx.strokeStyle = i % 3 ? '#2e4c52' : '#3e6a70';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, r() * TAU, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = `rgba(170,250,225,${0.4 + 0.4 * pulse * r()})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  for (const [dx, dy, s] of [[-60, -60, 0.9], [30, -90, 1.1], [80, -40, 0.8]]) knot(ctx, x + dx, GROUND + dy, s, time, dx);
}

function drawExit(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '170,240,220', 0.4);
  ctx.fillStyle = '#4a7a78';
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,255,235,0.55)'; // the Deep's glow beyond
  for (let i = 0; i < 3; i++) ellipse(ctx, x - 18 + i * 18, b - 40 + Math.sin(time * 2 + i) * 3, 6, 4);
  ctx.strokeStyle = '#2a1e2c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 140, 13, '#e8fff6');
}

// The den's name, stitched on an old sack hung from the roots
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 60);
  ctx.rotate(Math.sin(time * 0.8) * 0.02);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50), hh = 54;
  ctx.strokeStyle = '#5a4434';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2 + 12, -60);
  ctx.lineTo(-tw / 2 + 12, 0);
  ctx.moveTo(tw / 2 - 12, -60);
  ctx.lineTo(tw / 2 - 12, 0);
  ctx.stroke();
  ctx.fillStyle = '#8a6a5a';
  ctx.beginPath();
  ctx.roundRect(-tw / 2, 0, tw, hh, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(170,250,225,0.8)'; // glowing stitches round the edge
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 6, 6, tw - 12, hh - 12, 4);
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, name, 0, hh / 2, 18, '#fff4e8');
  ctx.restore();
}

// The ledges: earthen shelves held up by roots, with a knot tied in each
function drawLedge(ctx, p, i, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#5a4248';
  ctx.strokeStyle = '#2a1e2c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 14, y + 26);
  ctx.quadraticCurveTo(x + w / 2, y + 40, x + 14, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a5e60';
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 8, 4);
  ctx.fill();
  ctx.strokeStyle = '#5a4434';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const k of [0.25, 0.75]) {
    ctx.beginPath();
    ctx.moveTo(x + w * k, y + 30);
    ctx.quadraticCurveTo(x + w * k + 10, y + 60, x + w * k - 4, y + 90);
    ctx.stroke();
  }
  knot(ctx, x + w * (0.3 + (i % 2) * 0.4), y + 18, 0.5, time, i);
}

export const DEN_ART = { knot: drawDenKnot };

// ——— the molehill mouth in the Knotted Halls (feet at groundY) ———
function drawEntranceKnot(ctx, x, groundY, time) {
  const den = DENS.find((d) => d.theme === 'knot');
  const spec = MOBS[den?.boss];
  const b = groundY, mw = 48, mtop = b - 104;
  ctx.save();
  // a great heap of dug-out earth
  ctx.fillStyle = '#5a4248';
  ctx.beginPath();
  ctx.moveTo(x - 130, b + 4);
  ctx.bezierCurveTo(x - 120, b - 110, x - 60, b - 158, x, b - 160);
  ctx.bezierCurveTo(x + 60, b - 158, x + 120, b - 110, x + 130, b + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6a5058';
  ellipse(ctx, x - 56, b - 112, 28, 36, -0.4);
  ctx.fillStyle = '#4a3640';
  for (const [dx, dy, s] of [[-90, -20, 8], [70, -40, 10], [100, -10, 7], [-40, -140, 6]]) ellipse(ctx, x + dx, b + dy, s, s * 0.7);
  // the threads, dragged in over the heap and down the hole, knotted on the way
  ctx.lineCap = 'round';
  for (const [sx, sy, c] of [[-170, -170, 0], [150, -190, 1], [-120, -60, 2]]) {
    ctx.strokeStyle = '#2e4c52';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + sx, b + sy);
    ctx.quadraticCurveTo(x + sx * 0.3, b - 150, x + (c - 1) * 14, b - 40);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(170,250,225,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  knot(ctx, x - 50, b - 128, 0.7, time, 1);
  knot(ctx, x + 46, b - 138, 0.6, time, 2);
  // the hole
  ctx.fillStyle = '#1e1626';
  ctx.beginPath();
  ctx.moveTo(x - mw, b + 2);
  ctx.lineTo(x - mw, mtop + mw);
  ctx.arc(x, mtop + mw, mw, Math.PI, 0);
  ctx.lineTo(x + mw, b + 2);
  ctx.closePath();
  ctx.fill();
  glow(ctx, x, b - 40, 56, 44, '170,250,225', 0.25);
  // a pink nose sniffing out of the dark now and then
  const sniff = Math.max(0, Math.sin(time * 0.7)) ** 2, twitch = Math.sin(time * 18) * 1.5 * sniff;
  if (sniff > 0.05) {
    ctx.fillStyle = '#7a6a78';
    ellipse(ctx, x + 6, mtop + 64 + 10 * (1 - sniff), 22 * sniff, 14 * sniff);
    ctx.fillStyle = '#ffa8c0';
    ellipse(ctx, x + 6 + twitch, mtop + 58 + 10 * (1 - sniff), 9 * sniff, 7 * sniff);
  }
  // the warning sign on a post (the way in to a boss)
  const sx = x + 132;
  ctx.fillStyle = '#5a4434';
  ctx.beginPath();
  ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(sx, b - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.025 + 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(92, ctx.measureText(name).width + 24);
  ctx.fillStyle = '#8a6a5a';
  ctx.strokeStyle = '#4a3428';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -16, tw, 52, 10);
  ctx.fill();
  ctx.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  ctx.fillStyle = mix('#e0565a', '#ff7a6a', pulse);
  ctx.strokeStyle = '#a83a44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-26, -27, 52, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'BOSS', 0, -16.5, 13, '#fffaf0');
  text(ctx, name, 0, 8, 13, '#fffaf0');
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-22, 18, 44, 14, 7);
  ctx.fill();
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#4a3428');
  ctx.restore();
  ctx.restore();
}

export const ENTRANCE_ART = { knot: drawEntranceKnot };

// ——— the Knotmole (ctx, w, h, st) => sil, origin at her feet, +x = facing ———
// A huge old mole, round as a haystack, dusty plum velvet fur gone grey at the muzzle, a big pink nose,
// her eyes shut tight (she's blind) behind little round dark spectacles, a shawl of knotted glowing thread
// over her shoulders, and two great pink digging paws; the Anchor shard glints in the front one.
function drawKnotmole(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const step = st.walking ? Math.sin(t * 6 + seed) : 0;
  const cx = -w * 0.04, cy = -h * 0.46, rx = w * 0.46, ry = h * 0.46;
  const sil = () => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.moveTo(w * 0.52, -h * 0.4);
    ctx.ellipse(w * 0.38, -h * 0.4, w * 0.14, h * 0.18, 0, 0, TAU);
  };
  // the back paw and stubby feet
  ctx.fillStyle = rageCol('#e89aa8', enr, 0.2);
  ellipse(ctx, -w * 0.26 - step * 4, -6, w * 0.12, 9);
  ellipse(ctx, w * 0.14 + step * 4, -6, w * 0.12, 9);
  // the body: velvet fur, darker on the back
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, rageCol('#6e5a78', enr, 0.2));
  g.addColorStop(1, rageCol('#9a86a2', enr, 0.2));
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3a2c44';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(58,44,68,0.35)'; // fur strokes
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (1.05 + i * 0.075), px = cx + Math.cos(a) * rx * 0.8, py = cy + Math.sin(a) * ry * 0.8;
    ctx.moveTo(px, py);
    ctx.lineTo(px - 6, py + 8);
  }
  ctx.stroke();
  // the shawl of knotted threads over her shoulders
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2e4c52';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.8, cy - ry * 0.3);
  ctx.quadraticCurveTo(cx, cy - ry * 0.05, cx + rx * 0.75, cy - ry * 0.5);
  ctx.moveTo(cx - rx * 0.7, cy - ry * 0.55);
  ctx.quadraticCurveTo(cx - rx * 0.1, cy - ry * 0.25, cx + rx * 0.55, cy - ry * 0.78);
  ctx.stroke();
  const pulse = 0.7 + 0.3 * Math.sin(t * 2);
  ctx.strokeStyle = `rgba(170,250,225,${live ? 0.75 * pulse : 0.25})`;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  for (const [kx, ky] of [[-0.45, -0.28], [0.05, -0.2], [0.42, -0.52], [-0.3, -0.5]]) {
    const x = cx + rx * kx, y = cy + ry * ky;
    if (live) glow(ctx, x, y, 22, 16, '170,255,220', 0.6 * pulse);
    ctx.strokeStyle = '#2e4c52';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 6, 0.6, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = `rgba(210,255,240,${live ? pulse : 0.3})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  // the muzzle, gone grey, and her big pink nose
  const mx = w * 0.36, my = -h * 0.42, sniff = live ? Math.sin(t * (warn ? 22 : 7)) * 1.6 : 0;
  ctx.fillStyle = rageCol('#b8aabc', enr, 0.15);
  ctx.strokeStyle = '#3a2c44';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(mx, my, w * 0.14, h * 0.18, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rageCol('#ff9ab8', enr, 0.15);
  ctx.strokeStyle = '#c06080';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(mx + w * 0.12 + sniff, my - 2, w * 0.06, h * 0.07, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c06080';
  circle(ctx, mx + w * 0.15 + sniff, my - 4, 2.2);
  circle(ctx, mx + w * 0.15 + sniff, my + 3, 2.2);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; // whiskers
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const k of [-1, 0, 1]) {
    ctx.moveTo(mx + w * 0.06, my + 6 + k * 4);
    ctx.lineTo(mx + w * 0.22, my + 4 + k * 9);
  }
  ctx.stroke();
  // little round dark spectacles over shut eyes
  const ey = cy - ry * 0.42;
  for (const ex of [w * 0.18, w * 0.3]) {
    ctx.fillStyle = 'rgba(40,30,50,0.85)';
    ctx.strokeStyle = '#c9a64a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, ey, 9, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = live ? 'rgba(255,255,255,0.4)' : '#ff8a8a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (live) ctx.arc(ex, ey + 1, 4, 0.2 * Math.PI, 0.8 * Math.PI);
    else {
      ctx.moveTo(ex - 4, ey - 4); ctx.lineTo(ex + 4, ey + 4);
      ctx.moveTo(ex + 4, ey - 4); ctx.lineTo(ex - 4, ey + 4);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.21, ey);
  ctx.lineTo(w * 0.27, ey);
  ctx.stroke();
  // the front digging paw (raised in the wind-up, shoved out in a charge), the shard glinting in it
  const px = w * 0.46 + (charging ? 22 : 0), py = -h * 0.2 + (warn ? -36 : 0);
  ctx.fillStyle = rageCol('#ffb0c0', enr, 0.2);
  ctx.strokeStyle = '#c06080';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(px, py, w * 0.11, h * 0.12, -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2e8e0'; // claws
  ctx.strokeStyle = '#a89890';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const a = -0.9 + i * 0.32, bx = px + Math.cos(a) * w * 0.1, by = py + Math.sin(a) * h * 0.11;
    ctx.beginPath();
    ctx.moveTo(bx - 3, by);
    ctx.quadraticCurveTo(bx + Math.cos(a) * 12, by + Math.sin(a) * 12 - 4, bx + Math.cos(a) * 16 + 4, by + Math.sin(a) * 14);
    ctx.lineTo(bx + 3, by + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, px - 4, py - 2, 26, 22, '255,240,180', live ? 0.6 * sh : 0.1);
  ctx.fillStyle = live ? '#fff3c0' : '#c8c0a8';
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px - 4, py - 14);
  ctx.lineTo(px + 4, py - 2);
  ctx.lineTo(px - 4, py + 8);
  ctx.lineTo(px - 11, py - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  return sil;
}

export const BOSS_ART = { knotmole: drawKnotmole };
