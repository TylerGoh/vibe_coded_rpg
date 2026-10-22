// Docs: docs/combat/bosses.md, docs/places/skerries.md
// The Whale Skerries' boss den (The Breathing Hole), its way in at the Floe Edge (a hole kept open in the pack
// ice, a tusk coming up out of the black water now and then), and the Old Narwhal herself: the last of her
// pod, grey and white with age, a long spiral tusk with the shard lodged at its root. Her story:
// story/characters/bosses.md. dens.js imports this file and dispatches to it (same contracts as its own dens
// and bosses), so this file must NOT import dens.js: the few helpers it needs are copied below. The shared
// boss effects take her theme ('floe': FXPAL in dens.js); her Close the Floes is the `lanes` ult, drawn as
// ice coming down.
import { H, TAU, mulberry32, circle, ellipse, mix } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const HOLE_X = DEN_W - 240; // the breathing hole itself, at the far end
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

// ——— the den: a long low hollow under the pack ice, lit blue through the roof, black water at the back ———
const roofBlocks = (() => {
  const r = mulberry32(3801);
  const out = [];
  for (let x = -40; x < DEN_W + 40; x += 50 + r() * 60) out.push({ x, w: 60 + r() * 70, d: 30 + r() * 50 });
  return out;
})();
const shafts = (() => {
  const r = mulberry32(3811);
  return Array.from({ length: 6 }, () => ({ x: 120 + r() * (DEN_W - 240), w: 40 + r() * 50, p: r() * TAU }));
})();
const fishes = (() => {
  const r = mulberry32(3821);
  return Array.from({ length: 18 }, () => ({ y: GROUND - 120 + r() * 70, v: 20 + r() * 30, p: r(), s: 0.6 + r() * 0.6 }));
})();

function drawDenFloe(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-floe', 0, GROUND + 10, [[0, '#a8d4ec'], [0.25, '#4e86b0'], [0.7, '#1e3e5a'], [1, '#14283c']]);
  ctx.fillRect(L, 0, R - L, H);
  // light coming down through the ice
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of shafts) {
    if (!visible(s.x - 120, s.x + 160, L, R)) continue;
    const a = 0.06 + 0.03 * Math.sin(time * 0.7 + s.p);
    ctx.fillStyle = `rgba(190,230,255,${a})`;
    ctx.beginPath();
    ctx.moveTo(s.x, 30);
    ctx.lineTo(s.x + s.w, 30);
    ctx.lineTo(s.x + s.w * 1.8 + 40, GROUND);
    ctx.lineTo(s.x + 40, GROUND);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // the black water along the back, fish penned in it, circling
  ctx.fillStyle = 'rgba(10,22,34,0.85)';
  ctx.fillRect(L, GROUND - 150, R - L, 150);
  ctx.fillStyle = 'rgba(150,200,230,0.18)';
  for (let x = Math.floor(L / 80) * 80; x < R; x += 80) ellipse(ctx, x + 30 + Math.sin(time + x) * 6, GROUND - 150, 28, 2);
  for (const f of fishes) {
    const x = ((f.p * DEN_W + time * f.v) % (DEN_W + 200)) - 100;
    if (x < L || x > R) continue;
    ctx.fillStyle = 'rgba(160,200,220,0.4)';
    ellipse(ctx, x, f.y + Math.sin(time * 2 + f.p * 9) * 4, 9 * f.s, 3 * f.s);
    ctx.beginPath();
    ctx.moveTo(x - 8 * f.s, f.y);
    ctx.lineTo(x - 14 * f.s, f.y - 4 * f.s);
    ctx.lineTo(x - 14 * f.s, f.y + 4 * f.s);
    ctx.closePath();
    ctx.fill();
  }
  // the roof: the pack's underside, jagged blocks of blue-white ice
  for (const b of roofBlocks) {
    if (!visible(b.x, b.x + b.w, L, R)) continue;
    ctx.fillStyle = '#d4ecf8';
    ctx.strokeStyle = '#4e86b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, 0);
    ctx.lineTo(b.x + b.w, 0);
    ctx.lineTo(b.x + b.w * 0.8, b.d);
    ctx.lineTo(b.x + b.w * 0.35, b.d + 14);
    ctx.lineTo(b.x + 6, b.d * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the breathing hole at the far end: a shaft of daylight down through the ice onto open water
  if (visible(HOLE_X - 200, HOLE_X + 200, L, R)) drawHole(ctx, time);
  // the floor: thick old sea ice, scratched by her tusk
  ctx.fillStyle = vgrad(ctx, 'floe-floor', GROUND, H, [[0, '#e4f2fa'], [0.2, '#a8cce4'], [1, '#4e7a9a']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.strokeStyle = 'rgba(78,134,176,0.5)';
  ctx.lineWidth = 1.6;
  for (let x = Math.floor(L / 110) * 110; x < R; x += 110) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND + 8);
    ctx.lineTo(x + 70, GROUND + 14);
    ctx.moveTo(x + 20, GROUND + 22);
    ctx.lineTo(x + 90, GROUND + 26);
    ctx.stroke();
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Breathing Hole', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p, i, time));
  ctx.restore();
}

function drawHole(ctx, time) {
  const x = HOLE_X;
  glow(ctx, x, GROUND - 200, 160, 220, '230,245,255', 0.4);
  ctx.fillStyle = 'rgba(230,245,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(x - 50, 0);
  ctx.lineTo(x + 50, 0);
  ctx.lineTo(x + 110, GROUND - 10);
  ctx.lineTo(x - 110, GROUND - 10);
  ctx.closePath();
  ctx.fill();
  // the open water under it, rippling
  ctx.fillStyle = '#1e3e5a';
  ellipse(ctx, x, GROUND - 8, 120, 12);
  ctx.strokeStyle = 'rgba(200,235,255,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.4 + i / 3) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.ellipse(x, GROUND - 8, 30 + k * 90, 3 + k * 8, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawExit(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '230,240,250', 0.45);
  ctx.fillStyle = '#d4e4ee';
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) ellipse(ctx, x - 20 + i * 20, b - 10, 12, 3);
  ctx.strokeStyle = '#4e86b0';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 140, 13, '#f0f8ff');
}

// The name, scratched into a hanging slab of ice, an old fishing float tied at each end
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 70);
  ctx.rotate(Math.sin(time * 0.6) * 0.015);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50), hh = 50;
  ctx.fillStyle = 'rgba(214,236,248,0.92)';
  ctx.strokeStyle = '#4e86b0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -40);
  ctx.lineTo(tw / 2, -40);
  ctx.lineTo(tw / 2 - 8, hh);
  for (let i = 9; i >= 0; i--) ctx.lineTo(-tw / 2 + 8 + ((tw - 16) * i) / 9, hh + (i % 2 ? 10 : 0));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, name, 0, hh / 2 - 6, 18, '#1e3e5a');
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.fillStyle = '#d0485a';
    circle(ctx, sx, hh + 18, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 7, hh + 17, 14, 2);
  }
  ctx.restore();
}

// The ledges: floes jammed up against the roof's ridges
function drawLedge(ctx, p, i, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#a8cce4';
  ctx.strokeStyle = '#4e86b0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 12, y + 24);
  ctx.lineTo(x + 10, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4f8fc';
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(214,236,248,0.9)';
  for (let k = 0; k < 4; k++) {
    const ix = x + 20 + (k * (w - 40)) / 3;
    ctx.beginPath();
    ctx.moveTo(ix - 3, y + 24);
    ctx.lineTo(ix + 3, y + 24);
    ctx.lineTo(ix, y + 36 + (k % 2) * 8);
    ctx.closePath();
    ctx.fill();
  }
}

export const DEN_ART = { floe: drawDenFloe };

// ——— the way in at the Floe Edge (feet at groundY) ———
// A hole kept open in the pack ice: black water inside a ring of broken, heaped-up floes. Now and then her tusk
// rises out of it, turns, and sinks back.
function drawEntranceFloe(ctx, x, groundY, time) {
  const den = Math.max(0, DENS.findIndex((d) => d.theme === 'floe'));
  const spec = MOBS[DENS[den]?.boss];
  const b = groundY;
  ctx.save();
  // the heaped floes round the hole
  const r = mulberry32(3831);
  for (let i = 0; i < 9; i++) {
    const bx = x - 120 + i * 30 + r() * 10, top = b - 30 - r() * 50, w = 30 + r() * 20;
    ctx.fillStyle = i % 2 ? '#cfe6f4' : '#b8d8ec';
    ctx.strokeStyle = '#4e86b0';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bx, b + 2);
    ctx.lineTo(bx + 4, top + 8);
    ctx.lineTo(bx + w * 0.5, top);
    ctx.lineTo(bx + w, b + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the hole: black water, its edge a lip of fresh grey ice
  ctx.fillStyle = '#0e1e2c';
  ellipse(ctx, x, b - 4, 70, 14);
  ctx.strokeStyle = 'rgba(200,230,250,0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, b - 4, 70, 14, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,235,255,0.35)';
  ctx.lineWidth = 1.5;
  const k = (time * 0.5) % 1;
  ctx.beginPath();
  ctx.ellipse(x, b - 4, 20 + k * 40, 3 + k * 8, 0, 0, TAU);
  ctx.stroke();
  // the tusk, rising out of the water every few seconds
  const cyc = (time % 7) / 7, up = cyc < 0.35 ? Math.sin((cyc / 0.35) * Math.PI) : 0;
  if (up > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 80, b - 220, 160, 216);
    ctx.clip();
    ctx.translate(x + 6, b - 6);
    ctx.rotate(-0.15 + Math.sin(time * 1.4) * 0.05);
    ctx.fillStyle = '#f4ecd8';
    ctx.strokeStyle = '#8a7a5a';
    ctx.lineWidth = 1.6;
    const len = 150 * up;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(0, -len);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const y = -(len * i) / 8, hw = 6 * (1 - i / 8);
      ctx.moveTo(-hw, y);
      ctx.lineTo(hw, y - 6);
    }
    ctx.stroke();
    ctx.restore();
  }
  // the warning sign on a post (the way in to a boss)
  const sx = x + 130;
  ctx.fillStyle = '#4e86b0';
  ctx.beginPath();
  ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(sx, b - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.025 + 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(92, ctx.measureText(name).width + 24);
  ctx.fillStyle = '#6aa0c8';
  ctx.strokeStyle = '#2e5a7e';
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
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#2e5a7e');
  ctx.restore();
  ctx.restore();
}

export const ENTRANCE_ART = { floe: drawEntranceFloe };

// ——— the Old Narwhal (ctx, w, h, st, m) => sil, origin at her belly on the floor, +x = facing ———
// A great narwhal, mottled grey going white with age, flukes lifted behind her, little flippers, small sad
// eyes, and the long spiral tusk out in front; the shard (canon: every great beast carries one) is lodged at
// the root of her tusk, glinting. m.warn: she rears her head up; charging: tusk levelled, leaning in.
function drawOldNarwhal(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const sway = Math.sin(t * 1.6 + seed) * 0.04;
  const rear = warn ? -0.18 : charging ? 0.04 : sway;
  const bx = -w * 0.06, by = -h * 0.42; // body centre
  const body = () => {
    ctx.moveTo(-w * 0.44, by + h * 0.02);
    ctx.bezierCurveTo(-w * 0.4, by - h * 0.44, w * 0.2, by - h * 0.5, w * 0.36, by - h * 0.18);
    ctx.bezierCurveTo(w * 0.44, by + h * 0.04, w * 0.34, -2, w * 0.1, -2);
    ctx.lineTo(-w * 0.3, -2);
    ctx.quadraticCurveTo(-w * 0.44, by + h * 0.3, -w * 0.44, by + h * 0.02);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    body();
  };
  ctx.save();
  ctx.translate(w * 0.1, by);
  ctx.rotate(rear);
  ctx.translate(-w * 0.1, -by);
  // the flukes, raised behind her, slowly beating
  const fl = Math.sin(t * 2 + seed) * 0.2;
  ctx.save();
  ctx.translate(-w * 0.42, by - h * 0.02);
  ctx.rotate(-0.5 + fl);
  ctx.fillStyle = rageCol('#7a8a98', enr, 0.2);
  ctx.strokeStyle = '#2e3e50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-w * 0.14, -h * 0.36, -w * 0.2, -h * 0.44);
  ctx.quadraticCurveTo(-w * 0.1, -h * 0.26, -w * 0.02, -h * 0.26);
  ctx.quadraticCurveTo(w * 0.02, -h * 0.4, w * 0.08, -h * 0.46);
  ctx.quadraticCurveTo(w * 0.06, -h * 0.2, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the body: grey on top, mottled, paling to white underneath
  const g = ctx.createLinearGradient(0, by - h * 0.5, 0, 0);
  g.addColorStop(0, rageCol('#8a9aa8', enr, 0.2));
  g.addColorStop(0.55, rageCol('#c4ccd4', enr, 0.15));
  g.addColorStop(1, rageCol('#f2f4f6', enr, 0.1));
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e3e50';
  ctx.lineWidth = 4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // mottling
  const r = mulberry32(3841);
  ctx.fillStyle = 'rgba(70,86,104,0.45)';
  for (let i = 0; i < 26; i++) {
    const mx = -w * 0.36 + r() * w * 0.66, my = by - h * 0.36 + r() * h * 0.26;
    ellipse(ctx, mx, my, 3 + r() * 6, 2 + r() * 3, r() * 3);
  }
  // old scars along her side
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  for (const [x0, y0, x1, y1] of [[-0.2, -0.2, -0.06, -0.24], [0.02, -0.12, 0.14, -0.16], [-0.3, -0.06, -0.22, -0.1]]) {
    ctx.beginPath();
    ctx.moveTo(w * x0, by + h * y0);
    ctx.lineTo(w * x1, by + h * y1);
    ctx.stroke();
  }
  // the flipper
  ctx.fillStyle = rageCol('#7a8a98', enr, 0.2);
  ctx.strokeStyle = '#2e3e50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.12, by + h * 0.24, w * 0.08, h * 0.06, 0.6 + Math.sin(t * 2.4) * 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // the eye: small, dark and sad
  const ex = w * 0.26, ey = by - h * 0.12;
  if (live) {
    ctx.fillStyle = '#1e2a38';
    ellipse(ctx, ex, ey, 6, warn ? 7 : 5);
    ctx.fillStyle = '#ffffff';
    circle(ctx, ex + 2, ey - 2, 1.8);
    ctx.strokeStyle = '#2e3e50';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ex - 8, ey - 9 + (warn ? -2 : 2));
    ctx.lineTo(ex + 7, ey - 8 - (warn ? 3 : 0));
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#1e2a38';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ex - 5, ey - 5); ctx.lineTo(ex + 5, ey + 5);
    ctx.moveTo(ex + 5, ey - 5); ctx.lineTo(ex - 5, ey + 5);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(46,62,80,0.5)'; // the mouth line
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.38, by - h * 0.02);
  ctx.quadraticCurveTo(w * 0.32, by + h * 0.04, w * 0.24, by + h * 0.02);
  ctx.stroke();
  // the tusk: long, straight, spiralled, out from her upper lip
  const tx = w * 0.38, ty = by - h * 0.12, len = w * 0.7 + (charging ? 16 : 0);
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(warn ? -0.3 : -0.06);
  const tg = ctx.createLinearGradient(0, -6, 0, 6);
  tg.addColorStop(0, '#fffaf0');
  tg.addColorStop(1, '#d8cbb0');
  ctx.fillStyle = tg;
  ctx.strokeStyle = '#7a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(len, 0);
  ctx.lineTo(0, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,106,74,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 1; i < 14; i++) {
    const x = (len * i) / 14, hw = 7 * (1 - i / 14);
    ctx.moveTo(x - 4, -hw);
    ctx.lineTo(x + 4, hw);
  }
  ctx.stroke();
  if (live) {
    ctx.fillStyle = 'rgba(214,236,250,0.9)'; // frost on the tip
    ellipse(ctx, len * 0.9, 0, 10, 2.4);
  }
  // the shard, lodged at the root of the tusk
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, 6, -2, 26, 22, '255,240,180', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#fff3c0' : '#c8c0a8';
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, -12);
  ctx.lineTo(12, -2);
  ctx.lineTo(6, 6);
  ctx.lineTo(-2, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // breath: a puff of cold mist from her blowhole now and then
  const pk = (t * 0.25 + seed) % 1;
  if (live && pk < 0.3) {
    const k = pk / 0.3;
    ctx.fillStyle = `rgba(240,248,255,${0.6 * (1 - k)})`;
    circle(ctx, w * 0.06, by - h * 0.46 - k * 40, 8 + k * 16);
    circle(ctx, w * 0.12, by - h * 0.44 - k * 30, 6 + k * 10);
  }
  ctx.restore();
  return sil;
}

export const BOSS_ART = { old_narwhal: drawOldNarwhal };
