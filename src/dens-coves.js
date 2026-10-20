// Docs: docs/combat/bosses.md, docs/places/coves.md
// Saltspray Coves' boss den (The Tidemother's Hoard), its sea-cave mouth in the Coves, and the Tidemother
// herself: a great hermit crab whose shell is crusted with everything the sea ever washed in. Her story:
// story/characters/bosses.md. dens.js imports this file and dispatches to it (same contracts as its own
// dens and bosses), so this file must NOT import dens.js: the few helpers it needs are copied below. The
// shared boss effects take her theme ('tide': FXPAL in dens.js), and her Riptide is dens.js's waterMass.
import { H, TAU, mulberry32, circle, ellipse, mix } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND } from './shared/rpg.js';

const GROUND = FIELD_GROUND;
const THRONE_X = DEN_W - 105;
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
const glowCache = new WeakMap();
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  if (a <= 0.01 || rx <= 0 || ry <= 0) return;
  let c = glowCache.get(ctx);
  if (!c) glowCache.set(ctx, (c = {}));
  let g = c[rgb];
  if (!g) {
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${rgb},0.9)`);
    g.addColorStop(0.35, `rgba(${rgb},0.35)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c[rgb] = g;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  ctx.globalAlpha *= a;
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
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

// ——— the hoard: little things the sea gave her, scattered everywhere ———
const TRINKETS = ['shell', 'bottle', 'button', 'cap', 'star', 'spoon'];
function trinket(ctx, kind, x, y, s, rot, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  if (kind === 'shell') {
    ctx.fillStyle = c ?? '#ffd6c9';
    ctx.strokeStyle = '#d8a898';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.quadraticCurveTo(0, -11, 8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(0, 4);
      ctx.lineTo(i * 4, -5);
    }
    ctx.stroke();
  } else if (kind === 'bottle') {
    ctx.fillStyle = c ?? 'rgba(143,224,200,0.85)';
    ctx.beginPath();
    ctx.roundRect(-5, -6, 10, 16, 4);
    ctx.fill();
    ctx.fillRect(-2, -12, 4, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-3, -3, 1.6, 9);
  } else if (kind === 'button') {
    ctx.fillStyle = c ?? '#ff8f8f';
    circle(ctx, 0, 0, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (const [bx, by] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) circle(ctx, bx, by, 0.9);
  } else if (kind === 'cap') {
    ctx.fillStyle = c ?? '#ffd66a';
    circle(ctx, 0, 0, 6);
    ctx.strokeStyle = '#c9a64a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
    }
    ctx.stroke();
  } else if (kind === 'star') {
    ctx.fillStyle = c ?? '#ffb08a';
    for (let i = 0; i < 5; i++) ellipse(ctx, Math.cos((i / 5) * TAU - Math.PI / 2) * 4, Math.sin((i / 5) * TAU - Math.PI / 2) * 4, 4, 1.8, (i / 5) * TAU - Math.PI / 2);
  } else {
    ctx.fillStyle = c ?? '#d8dce8';
    ellipse(ctx, 0, -6, 3.5, 5);
    ctx.fillRect(-1, -2, 2, 12);
  }
  ctx.restore();
}
const COLORS = ['#ffd6c9', '#fff1e0', '#ff8f8f', '#ffd66a', '#8fd0ff', '#9fe0d8', '#c9b6ff', '#ffb08a'];
const floorHoard = (() => {
  const r = mulberry32(911);
  return Array.from({ length: 70 }, () => ({ x: 120 + r() * (DEN_W - 200), y: GROUND - 2 + r() * 40, k: TRINKETS[Math.floor(r() * TRINKETS.length)], s: 0.8 + r() * 0.6, rot: r() * TAU, c: COLORS[Math.floor(r() * COLORS.length)] }));
})();
const drips = (() => {
  const r = mulberry32(913);
  return Array.from({ length: 12 }, () => ({ x: r() * DEN_W, p: r(), v: 0.4 + r() * 0.5 }));
})();
const stalactites = (() => {
  const r = mulberry32(917);
  return Array.from({ length: 22 }, (_, i) => ({ x: i * 72 + r() * 40, len: 30 + r() * 70, w: 14 + r() * 16 }));
})();

// The den: a sea grotto, its pool gone still and stale, heaped with her hoard
function drawDenTide(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-tide', 0, GROUND + 10, [[0, '#0e2a36'], [0.45, '#1e4a58'], [0.85, '#3e7a80'], [1, '#6aa8a0']]);
  ctx.fillRect(L, 0, R - L, H);
  // light coming in through a crack in the roof, and the back wall's wet sheen
  glow(ctx, 760, 120, 240, 180, '170,235,240', 0.25);
  ctx.fillStyle = 'rgba(170,235,240,0.08)';
  ctx.beginPath();
  ctx.moveTo(700, 0);
  ctx.lineTo(820, 0);
  ctx.lineTo(900, GROUND);
  ctx.lineTo(620, GROUND);
  ctx.closePath();
  ctx.fill();
  // stalactites dripping
  ctx.fillStyle = '#163844';
  for (const s of stalactites) {
    if (!visible(s.x - 20, s.x + 20, L, R)) continue;
    ctx.beginPath();
    ctx.moveTo(s.x - s.w / 2, 0);
    ctx.quadraticCurveTo(s.x, s.len * 0.6, s.x, s.len);
    ctx.quadraticCurveTo(s.x, s.len * 0.6, s.x + s.w / 2, 0);
    ctx.fill();
  }
  for (const d of drips) {
    const k = (time * d.v + d.p) % 1;
    ctx.fillStyle = `rgba(190,240,250,${0.7 * (1 - k)})`;
    circle(ctx, d.x, 40 + k * (GROUND - 60), 1.8);
  }
  // the stale pool along the back
  ctx.fillStyle = 'rgba(90,130,110,0.6)';
  ctx.fillRect(L, GROUND - 46, R - L, 46);
  ctx.fillStyle = 'rgba(140,170,120,0.5)'; // scum on it
  for (let x = Math.floor(L / 60) * 60; x < R; x += 60) ellipse(ctx, x + 20, GROUND - 44 + Math.sin(x) * 2, 26, 3);
  // the throne: a great heap of her hoard against the far wall
  if (visible(THRONE_X - 200, THRONE_X + 200, L, R)) drawHeap(ctx, THRONE_X, time);
  // the floor: wet sand with the hoard strewn over it
  ctx.fillStyle = '#c8b898';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#a89878';
  ctx.fillRect(L, GROUND + 44, R - L, H - GROUND);
  for (const t of floorHoard) if (t.x > L - 20 && t.x < R + 20) trinket(ctx, t.k, t.x, t.y, t.s, t.rot, t.c);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? "The Tidemother's Hoard", 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p, i, time));
  ctx.restore();
}

function drawHeap(ctx, x, time) {
  ctx.fillStyle = '#5a7a78';
  ctx.beginPath();
  ctx.moveTo(x - 190, GROUND + 4);
  ctx.quadraticCurveTo(x - 120, GROUND - 180, x + 10, GROUND - 210);
  ctx.quadraticCurveTo(x + 120, GROUND - 170, x + 140, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  const r = mulberry32(919);
  for (let i = 0; i < 60; i++) {
    const a = r(), up = r();
    const px = x - 170 + a * 300, py = GROUND - up * (190 - Math.abs(a - 0.6) * 220);
    if (py > GROUND) continue;
    trinket(ctx, TRINKETS[Math.floor(r() * TRINKETS.length)], px, py, 0.9 + r() * 0.8, r() * TAU, COLORS[Math.floor(r() * COLORS.length)]);
  }
  // a ship's wheel and an old net slung over the top
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x - 20, GROUND - 190, 22, 0, TAU);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.moveTo(x - 20, GROUND - 190);
    ctx.lineTo(x - 20 + Math.cos(a) * 30, GROUND - 190 + Math.sin(a) * 30);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,210,180,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    ctx.moveTo(x - 140 + k * 30, GROUND - 120 + k * 4);
    ctx.lineTo(x - 100 + k * 30, GROUND - 40);
  }
  ctx.stroke();
  glow(ctx, x + 30, GROUND - 100, 60, 40, '255,240,200', 0.15 + 0.08 * Math.sin(time * 2));
}

function drawExit(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '200,240,255', 0.4);
  ctx.fillStyle = '#9fd6e8';
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; // daylight and surf beyond
  for (let i = 0; i < 3; i++) ellipse(ctx, x - 20 + i * 20, b - 10 + Math.sin(time * 2 + i) * 2, 12, 3);
  ctx.strokeStyle = '#163844';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 140, 13, '#e8fbff');
}

function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 60);
  ctx.rotate(Math.sin(time * 0.8) * 0.02);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50), hh = 54;
  ctx.strokeStyle = 'rgba(220,210,180,0.7)'; // hung from the roof on old fishing line
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-tw / 2 + 12, -60);
  ctx.lineTo(-tw / 2 + 12, 0);
  ctx.moveTo(tw / 2 - 12, -60);
  ctx.lineTo(tw / 2 - 12, 0);
  ctx.stroke();
  ctx.fillStyle = '#2e7a84'; // a bit of old sail
  ctx.beginPath();
  ctx.moveTo(-tw / 2, 0);
  ctx.lineTo(tw / 2, 0);
  ctx.lineTo(tw / 2, hh);
  for (let i = 9; i >= 0; i--) ctx.lineTo(-tw / 2 + (tw * i) / 9, hh + (i % 2 ? 8 : 0));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd6c9';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, name, 0, hh / 2, 18, '#f0fbff');
  for (const sx of [-tw / 2 + 20, tw / 2 - 20]) trinket(ctx, 'shell', sx, 10, 1, 0, '#ffd6c9');
  ctx.restore();
}

// The ledges: rocky shelves heaped with bits of the hoard
function drawLedge(ctx, p, i, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#3e6a72';
  ctx.strokeStyle = '#163844';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 14, y + 26);
  ctx.quadraticCurveTo(x + w / 2, y + 40, x + 14, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7fb0a8';
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 8, 4);
  ctx.fill();
  const r = mulberry32(930 + i);
  for (let k = 0; k < 6; k++) trinket(ctx, TRINKETS[Math.floor(r() * TRINKETS.length)], x + 16 + r() * (w - 32), y - 4 - r() * 3, 0.8, r() * TAU, COLORS[Math.floor(r() * COLORS.length)]);
  ctx.fillStyle = 'rgba(90,150,110,0.7)'; // weed hanging off
  for (let wx = x + 20; wx < x + w - 10; wx += 36) ellipse(ctx, wx, y + 34, 3, 10, Math.sin(time * 1.3 + wx) * 0.2);
}

export const DEN_ART = { tide: drawDenTide };

// ——— the cave mouth in the Coves (feet at groundY) ———
function drawEntranceTide(ctx, x, groundY, time) {
  const den = Math.max(0, DENS.findIndex((d) => d.theme === 'tide'));
  const spec = MOBS[DENS[den]?.boss];
  const b = groundY, mw = 50, mtop = b - 116;
  ctx.save();
  // a hump of dark rock at the cliff's foot
  ctx.fillStyle = '#7a7482';
  ctx.beginPath();
  ctx.moveTo(x - 120, b + 4);
  ctx.bezierCurveTo(x - 116, b - 120, x - 60, b - 170, x, b - 172);
  ctx.bezierCurveTo(x + 60, b - 170, x + 116, b - 120, x + 120, b + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a8492';
  ellipse(ctx, x - 52, b - 120, 26, 40, -0.4);
  // the mouth, dark and wet inside
  ctx.fillStyle = '#163844';
  ctx.beginPath();
  ctx.moveTo(x - mw, b + 2);
  ctx.lineTo(x - mw, mtop + mw);
  ctx.arc(x, mtop + mw, mw, Math.PI, 0);
  ctx.lineTo(x + mw, b + 2);
  ctx.closePath();
  ctx.fill();
  glow(ctx, x, b - 50, 60, 50, '150,225,235', 0.25);
  // the hoard spilling out of it onto the sand
  const r = mulberry32(941);
  for (let i = 0; i < 18; i++) trinket(ctx, TRINKETS[Math.floor(r() * TRINKETS.length)], x - 70 + r() * 140, b - 2 + r() * 10, 0.8 + r() * 0.5, r() * TAU, COLORS[Math.floor(r() * COLORS.length)]);
  // two eyes on stalks peeking out of the dark
  const peek = Math.sin(time * 0.6) * 8, blink = (time % 4.1) < 0.14, ey = mtop + 58;
  ctx.strokeStyle = '#3e8c96';
  ctx.lineWidth = 3;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + peek + s * 6, ey + 34);
    ctx.lineTo(x + peek + s * 12, ey);
    ctx.stroke();
    glow(ctx, x + peek + s * 12, ey, 12, 10, '150,235,240', 0.6);
    ctx.fillStyle = '#d8fbff';
    ellipse(ctx, x + peek + s * 12, ey, 4.5, blink ? 0.8 : 5);
  }
  // the warning sign on a post (the way in to a boss)
  const sx = x + 122;
  ctx.fillStyle = '#2a5e66';
  ctx.beginPath();
  ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(sx, b - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.025 + 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(92, ctx.measureText(name).width + 24);
  ctx.fillStyle = '#4aa0a8';
  ctx.strokeStyle = '#2a5e66';
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
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#2a5e66');
  ctx.restore();
  ctx.restore();
}

export const ENTRANCE_ART = { tide: drawEntranceTide };

// ——— the Tidemother (ctx, w, h, st, m) => sil, origin at her feet, +x = facing ———
// A great hermit crab in a huge spiral shell crusted with her hoard; the Anchor shard glints in the shell
// (canon: every great beast carries one). Big claws (the front one held up), eyes on long stalks.
function drawTidemother(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const step = st.walking ? Math.sin(t * 6 + seed) : 0;
  const sx = -w * 0.12, sy = -h * 0.58, sr = h * 0.5; // the shell
  const shell = () => {
    ctx.moveTo(sx + sr * 1.1, sy + sr * 0.4);
    ctx.bezierCurveTo(sx + sr * 1.2, sy - sr * 1.1, sx - sr * 1.3, sy - sr * 1.1, sx - sr * 1.15, sy + sr * 0.5);
    ctx.quadraticCurveTo(sx - sr * 0.4, sy + sr * 1.05, sx + sr * 1.1, sy + sr * 0.4);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    shell();
    ctx.moveTo(w * 0.48, -h * 0.3);
    ctx.ellipse(w * 0.34, -h * 0.3, w * 0.16, h * 0.18, 0, 0, TAU);
  };
  // legs: three a side, scuttling
  ctx.strokeStyle = rageCol('#c8705a', enr, 0.2);
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  for (let i = 0; i < 3; i++) {
    const lx = -w * 0.1 + i * w * 0.14, k = step * (i % 2 ? 1 : -1) * 6;
    ctx.beginPath();
    ctx.moveTo(lx, -h * 0.22);
    ctx.lineTo(lx + 16, -h * 0.12 + k);
    ctx.lineTo(lx + 22, -2);
    ctx.stroke();
  }
  // the back claw, behind the body
  ctx.fillStyle = rageCol('#b8604c', enr, 0.2);
  ellipse(ctx, w * 0.2, -h * 0.5, w * 0.12, h * 0.1, -0.4);
  // the body poking out of the shell: soft orange, banded
  const bg = ctx.createLinearGradient(0, -h * 0.5, 0, 0);
  bg.addColorStop(0, rageCol('#ffb08a', enr, 0.25));
  bg.addColorStop(1, rageCol('#e0786a', enr, 0.25));
  ctx.fillStyle = bg;
  ctx.strokeStyle = '#8a3e3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.28, -h * 0.3, w * 0.2, h * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,62,58,0.5)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.arc(w * 0.28, -h * 0.3, w * (0.08 + k * 0.04), -0.8, 0.8);
    ctx.stroke();
  }
  // eyes on long stalks, wide and anxious
  ctx.strokeStyle = rageCol('#e0786a', enr, 0.2);
  ctx.lineWidth = 5;
  const look = warn ? 6 : Math.sin(t * 0.8 + seed) * 4;
  for (const [ex, ey] of [[w * 0.36 + look, -h * 0.82], [w * 0.5 + look, -h * 0.74]]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.36, -h * 0.42);
    ctx.quadraticCurveTo(w * 0.42, -h * 0.6, ex, ey);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    circle(ctx, ex, ey, 10);
    ctx.fillStyle = live ? '#163844' : '#8a3e3a';
    if (live) circle(ctx, ex + 2, ey + (warn ? -2 : 1), 5);
    else {
      ctx.strokeStyle = '#163844';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(ex - 5, ey - 5); ctx.lineTo(ex + 5, ey + 5);
      ctx.moveTo(ex + 5, ey - 5); ctx.lineTo(ex - 5, ey + 5);
      ctx.stroke();
      ctx.strokeStyle = rageCol('#e0786a', enr, 0.2);
      ctx.lineWidth = 5;
    }
  }
  // the shell: a great teal spiral, crusted with everything she's kept
  const g = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
  g.addColorStop(0, rageCol('#9fe0d8', enr, 0.15));
  g.addColorStop(1, rageCol('#3e8c96', enr, 0.15));
  ctx.fillStyle = g;
  ctx.strokeStyle = '#1e4a58';
  ctx.lineWidth = 4;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,74,88,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let a = 0; a < TAU * 1.8; a += 0.15) {
    const rr = sr * (0.95 - a / (TAU * 2.2));
    const px = sx + Math.cos(a + 2.4) * rr * 1.05, py = sy + Math.sin(a + 2.4) * rr * 0.85;
    a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  const r = mulberry32(951);
  for (let i = 0; i < 22; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 0.85;
    trinket(ctx, TRINKETS[Math.floor(r() * TRINKETS.length)], sx + Math.cos(a) * sr * d, sy + Math.sin(a) * sr * d * 0.8 - 6, 1.3 + r() * 0.6, r() * TAU, COLORS[Math.floor(r() * COLORS.length)]);
  }
  // the Anchor shard, wedged in the top of the shell, glinting
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, sx + sr * 0.2, sy - sr * 0.8, 30, 26, '255,240,180', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#fff3c0' : '#c8c0a8';
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + sr * 0.2, sy - sr * 1.08);
  ctx.lineTo(sx + sr * 0.32, sy - sr * 0.78);
  ctx.lineTo(sx + sr * 0.2, sy - sr * 0.64);
  ctx.lineTo(sx + sr * 0.08, sy - sr * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the big front claw, held up (open in the wind-up, thrust out in a charge)
  const cx = w * 0.5 + (charging ? 20 : 0), cy = -h * 0.42 + (warn ? -18 : 0), open = warn ? 0.6 : 0.2;
  ctx.fillStyle = rageCol('#ff9a7a', enr, 0.2);
  ctx.strokeStyle = '#8a3e3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.14, h * 0.15, -0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.08, cy - 10);
  ctx.quadraticCurveTo(cx + w * 0.22, cy - 26 - open * 24, cx + w * 0.24, cy - 8 - open * 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.1, cy + 4);
  ctx.quadraticCurveTo(cx + w * 0.22, cy + 12 + open * 10, cx + w * 0.22, cy - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  return sil;
}

export const BOSS_ART = { tidemother: drawTidemother };
