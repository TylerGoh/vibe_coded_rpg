// Docs: docs/combat/bosses.md, docs/places/spine.md
// Keeper's Spine's boss den (The Warden's Court), its ruined gatehouse at the end of the Keepers' road on the
// Spine, and the Root Warden itself: a Keeper guardian of grey stone, roots grown through every joint, one
// amber eye-stone, its blade planted before a sealed gate it has held for longer than anyone remembers, the
// Anchor shard lodged high in its back. Its story: story/characters/bosses.md. dens.js imports this file and
// dispatches to it (same contracts as its own dens and bosses), so this file must NOT import dens.js: the
// few helpers it needs are copied below. The shared boss effects take its theme ('warden': FXPAL in dens.js);
// its ultimate, Hold Fast, is the shared `lanes` ult drawn as roots (wardenRoot, used by dens.js).
import { H, TAU, mulberry32, circle, ellipse, mix } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const GATE_X = DEN_W - 130; // the sealed gate, in the court's far wall
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);
const AMBER = '255,205,120';
const STONE = '#a8a4b4', STONE_D = '#8a8698', STONE_L = '#c4c0d0', LINE = '#4e4a5e', ROOT = '#5a4030', ROOT_L = '#7a5a40', MOSS = '#7aa05e';

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
function gear(ctx, x, y, r, teeth, col, lw = 2) {
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3);
  }
  ctx.stroke();
}
// a thick root, from (x0, y0) bending to (x1, y1)
function root(ctx, x0, y0, cx, cy, x1, y1, w) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = ROOT;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = ROOT_L;
  ctx.lineWidth = Math.max(1, w * 0.3);
  ctx.beginPath();
  ctx.moveTo(x0, y0 - w * 0.2);
  ctx.quadraticCurveTo(cx, cy - w * 0.2, x1, y1 - w * 0.2);
  ctx.stroke();
}

// A root bursting up out of the floor at x to height hgt (Hold Fast; also used by dens.js), a few leaves on
// it, amber light in the crack where it came up
export function wardenRoot(ctx, x, floor, hgt, i, t) {
  if (hgt < 2) return;
  const lean = Math.sin(i * 2.3) * 0.25, w = 16 + (i % 3) * 4;
  glow(ctx, x, floor, w * 1.6, 12, AMBER, 0.6);
  ctx.fillStyle = '#3e3228';
  ellipse(ctx, x, floor + 2, w * 0.9, 5);
  ctx.save();
  ctx.translate(x, floor);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const tipX = lean * hgt + Math.sin(t * 3 + i) * 3;
  ctx.fillStyle = ROOT;
  ctx.strokeStyle = '#3e2a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 2);
  ctx.quadraticCurveTo(-w * 0.4 + tipX * 0.4, -hgt * 0.5, tipX - 2, -hgt);
  ctx.lineTo(tipX + 2, -hgt);
  ctx.quadraticCurveTo(w * 0.4 + tipX * 0.4, -hgt * 0.5, w / 2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = ROOT_L;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, 0);
  ctx.quadraticCurveTo(-w * 0.15 + tipX * 0.4, -hgt * 0.5, tipX - 1, -hgt * 0.92);
  ctx.stroke();
  if (hgt > 40) {
    ctx.fillStyle = '#7aa858';
    for (const k of [0.45, 0.75]) ellipse(ctx, tipX * k + (k > 0.5 ? 7 : -7), -hgt * k, 6, 3, k > 0.5 ? 0.5 : -0.5);
  }
  ctx.restore();
}

const flags = (() => {
  const r = mulberry32(5101);
  const out = [];
  for (let x = 0; x < DEN_W; x += 70 + r() * 40) out.push({ x, w: 60 + r() * 30, c: r() < 0.5 ? '#a49fb0' : '#9a96a8', crack: r() < 0.3, moss: r() < 0.4 });
  return out;
})();
const pillars = [180, 470, 860, 1180]; // the colonnade's broken pillars, behind
const clouds = (() => {
  const r = mulberry32(5103);
  return Array.from({ length: 6 }, () => ({ x: r() * DEN_W * 1.4, y: 40 + r() * 90, s: 0.6 + r() * 0.7, v: 8 + r() * 10 }));
})();

// ——— the den: the open court at the very top of the ridge, sky all round, broken pillars, flagstones heaved
// up by roots, and the sealed gate in the far wall ———
function drawDenWarden(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-warden', 0, GROUND + 10, [[0, '#8ea8d0'], [0.55, '#c8d4e6'], [1, '#efe6dc']]);
  ctx.fillRect(L, 0, R - L, H);
  // clouds blowing past, below and level with you
  for (const c of clouds) {
    const x = ((c.x + time * c.v) % (DEN_W * 1.4)) - DEN_W * 0.2;
    if (!visible(x - 120, x + 120, L, R)) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (const [dx, dy, r] of [[0, 0, 30], [-34, 8, 22], [36, 6, 24], [14, -14, 22]]) circle(ctx, x + dx * c.s, c.y + dy * c.s, r * c.s);
  }
  // the far sea, a long way down
  ctx.fillStyle = '#9cbcd8';
  ctx.fillRect(L, 300, R - L, 30);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(L, 300, R - L, 2);
  // the ridge's crest falling away behind the court walls
  ctx.fillStyle = '#9a96a8';
  ctx.beginPath();
  ctx.moveTo(L, 340);
  for (let x = Math.floor(L / 40) * 40; x <= R + 40; x += 40) ctx.lineTo(x, 300 + Math.sin(x * 0.004) * 16 + Math.sin(x * 0.017) * 6);
  ctx.lineTo(R, GROUND);
  ctx.lineTo(L, GROUND);
  ctx.closePath();
  ctx.fill();
  // the court's low back wall
  ctx.fillStyle = STONE_D;
  ctx.fillRect(L, 330, R - L, GROUND - 330);
  ctx.fillStyle = STONE;
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) {
    ctx.fillRect(x + 1, 334, 44, 20);
    ctx.fillRect(x + 24, 356, 44, 20);
  }
  ctx.fillStyle = 'rgba(122,160,94,0.8)';
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) ellipse(ctx, x + 30, 332, 26, 6);
  // broken pillars of the old colonnade
  for (const px of pillars) if (visible(px - 50, px + 50, L, R)) drawPillar(ctx, px, time);
  // the great roots: they come over the wall from the west (from the island's heart, far off) and run
  // across the court, all of them toward the Warden's post by the gate
  if (visible(0, DEN_W, L, R)) {
    root(ctx, -40, 336, 380, 300, 760, GROUND - 4, 16);
    root(ctx, 200, 344, 800, 330, GATE_X - 150, GROUND - 8, 12);
  }
  if (visible(GATE_X - 200, GATE_X + 200, L, R)) drawSealedGate(ctx, GATE_X, time);
  // the floor: flagstones, some heaved up by roots
  ctx.fillStyle = '#7e7a8e';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  for (const f of flags) {
    if (!visible(f.x, f.x + f.w, L, R)) continue;
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.roundRect(f.x + 2, GROUND, f.w - 4, 12, 3);
    ctx.fill();
    if (f.crack) {
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(f.x + f.w * 0.3, GROUND + 1);
      ctx.lineTo(f.x + f.w * 0.45, GROUND + 7);
      ctx.lineTo(f.x + f.w * 0.4, GROUND + 12);
      ctx.stroke();
    }
    if (f.moss) {
      ctx.fillStyle = MOSS;
      ellipse(ctx, f.x + f.w * 0.7, GROUND + 1, 8, 2.4);
    }
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? "The Warden's Court", 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p, i, time));
  ctx.restore();
}

function drawPillar(ctx, x, time) {
  const top = 200 + ((x * 7) % 60);
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 22, GROUND);
  ctx.lineTo(x - 20, top + 10);
  ctx.lineTo(x - 8, top);
  ctx.lineTo(x + 4, top + 14);
  ctx.lineTo(x + 20, top + 6);
  ctx.lineTo(x + 22, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(x - 16, top + 18, 8, GROUND - top - 22);
  ctx.strokeStyle = 'rgba(78,74,94,0.5)';
  ctx.lineWidth = 1.4;
  for (let y = top + 50; y < GROUND; y += 50) {
    ctx.beginPath();
    ctx.moveTo(x - 21, y);
    ctx.lineTo(x + 21, y);
    ctx.stroke();
  }
  gear(ctx, x, top + 80, 8, 10, 'rgba(78,74,94,0.6)', 1.6);
  ctx.fillStyle = MOSS;
  ellipse(ctx, x - 6, top + 4, 12, 5);
  // a root has climbed it
  root(ctx, x + 22, GROUND, x + 40, top + 120, x + 6, top + 30, 6);
}

// The sealed gate: a great round stone door in a stone frame, carved with a ring of little pictures (a wave,
// a leaf, a star, a flame, a feather, a key, a bell... and an hourglass, scratched out), a gear at its middle.
// It doesn't open. The roots have grown over it like a hand holding it shut.
function drawSealedGate(ctx, x, time) {
  const cy = GROUND - 150, r = 120;
  // the frame: two great posts and a lintel
  ctx.fillStyle = STONE_D;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - r - 40, cy - r - 50, (r + 40) * 2, r * 2 + 50 + (GROUND - cy - r), 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.roundRect(x - r - 56, cy - r - 70, (r + 56) * 2, 34, 6);
  ctx.fill();
  ctx.stroke();
  // the round door
  const g = ctx.createRadialGradient(x - 30, cy - 30, 10, x, cy, r);
  g.addColorStop(0, STONE_L);
  g.addColorStop(1, STONE_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, cy, r - 14, 0, TAU);
  ctx.stroke();
  // the ring of little pictures
  const pics = 8;
  for (let i = 0; i < pics; i++) {
    const a = -Math.PI / 2 + (i / pics) * TAU, px = x + Math.cos(a) * (r - 34), py = cy + Math.sin(a) * (r - 34);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (i === 0) { // a wave
      ctx.moveTo(px - 9, py + 2); ctx.quadraticCurveTo(px - 4, py - 6, px, py + 1); ctx.quadraticCurveTo(px + 5, py - 6, px + 9, py + 2);
    } else if (i === 1) { // a leaf
      ctx.ellipse(px, py, 8, 4, -0.6, 0, TAU); ctx.moveTo(px - 6, py + 4); ctx.lineTo(px + 6, py - 4);
    } else if (i === 2) { // a star
      for (let k = 0; k < 5; k++) { const aa = -Math.PI / 2 + (k * 4 * Math.PI) / 5; k ? ctx.lineTo(px + Math.cos(aa) * 8, py + Math.sin(aa) * 8) : ctx.moveTo(px + Math.cos(aa) * 8, py + Math.sin(aa) * 8); }
      ctx.closePath();
    } else if (i === 3) { // a flame
      ctx.moveTo(px, py - 9); ctx.quadraticCurveTo(px + 9, py + 2, px, py + 8); ctx.quadraticCurveTo(px - 9, py + 2, px, py - 9);
    } else if (i === 4) { // an hourglass, scratched over and over
      ctx.moveTo(px - 6, py - 8); ctx.lineTo(px + 6, py - 8); ctx.lineTo(px - 6, py + 8); ctx.lineTo(px + 6, py + 8); ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = '#3e3a4e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { ctx.moveTo(px - 10 + k * 2, py - 10); ctx.lineTo(px - 2 + k * 3, py + 10); }
    } else if (i === 5) { // a feather
      ctx.moveTo(px - 7, py + 7); ctx.quadraticCurveTo(px - 4, py - 6, px + 7, py - 8); ctx.quadraticCurveTo(px + 2, py + 2, px - 7, py + 7);
    } else if (i === 6) { // a key
      ctx.arc(px - 4, py, 4, 0, TAU); ctx.moveTo(px, py); ctx.lineTo(px + 9, py); ctx.lineTo(px + 9, py + 4);
    } else { // a bell
      ctx.moveTo(px - 7, py + 6); ctx.quadraticCurveTo(px - 7, py - 8, px, py - 8); ctx.quadraticCurveTo(px + 7, py - 8, px + 7, py + 6); ctx.closePath();
    }
    ctx.stroke();
  }
  gear(ctx, x, cy, 26, 14, LINE, 3);
  // a faint warm light seeps round the edge of the door, as if something on the other side is still lit
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.8);
  ctx.strokeStyle = `rgba(${AMBER},${0.25 + 0.2 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, cy, r + 2, Math.PI * 0.1, Math.PI * 0.6);
  ctx.stroke();
  // the roots, holding it shut like fingers
  root(ctx, x - 230, GROUND - 4, x - 170, cy - 40, x - 60, cy - r + 10, 16);
  root(ctx, x - 200, cy - 160, x - 120, cy - 60, x + 10, cy - 10, 12);
  root(ctx, x - 250, GROUND - 40, x - 60, cy + 120, x + 70, cy + 70, 14);
  ctx.fillStyle = MOSS;
  for (const [dx, dy] of [[-r + 10, -r + 40], [r - 40, -r + 20], [-30, r - 20]]) ellipse(ctx, x + dx, cy + dy, 14, 5);
}

function drawExit(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '255,240,210', 0.4);
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath(); // a stone arch back out to the road, the sky through it
  ctx.moveTo(x - 58, b + 2);
  ctx.lineTo(x - 58, b - 80);
  ctx.arc(x, b - 80, 58, Math.PI, 0);
  ctx.lineTo(x + 58, b + 2);
  ctx.lineTo(x + 40, b + 2);
  ctx.lineTo(x + 40, b - 80);
  ctx.arc(x, b - 80, 40, 0, Math.PI, true);
  ctx.lineTo(x - 40, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8d8ee';
  ctx.beginPath();
  ctx.moveTo(x - 40, b + 2);
  ctx.lineTo(x - 40, b - 80);
  ctx.arc(x, b - 80, 40, Math.PI, 0);
  ctx.lineTo(x + 40, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c48ad0'; // heather beyond, blowing
  for (let i = 0; i < 4; i++) circle(ctx, x - 26 + i * 17 + Math.sin(time * 3 + i) * 2, b - 8, 5);
  text(ctx, 'OUT', x, b - 160, 13, '#fffaf0');
}

// The den's name, cut into a fallen lintel propped on two stones
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 70);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(260, ctx.measureText(name).width + 60), hh = 50;
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, 0, tw, hh, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(-tw / 2 + 6, 5, tw - 12, 6);
  gear(ctx, -tw / 2 + 22, hh / 2, 7, 10, LINE, 1.6);
  gear(ctx, tw / 2 - 22, hh / 2, 7, 10, LINE, 1.6);
  text(ctx, name, 0, hh / 2 + 1, 18, '#3e3a4e');
  ctx.fillStyle = MOSS;
  ellipse(ctx, tw * 0.3, 1, 26, 6);
  ctx.restore();
}

// The ledges: broken stone lintels on the colonnade's stumps, roots holding them up
function drawLedge(ctx, p, i, time) {
  const { x, y, w } = p;
  for (const k of [0.2, 0.8]) {
    ctx.fillStyle = STONE_D;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + w * k - 12, y + 10, 24, GROUND - y - 10, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 18, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(x + 4, y - 1, w - 8, 4);
  gear(ctx, x + w / 2, y + 5, 4, 8, 'rgba(78,74,94,0.7)', 1.2);
  root(ctx, x + w * 0.8 + 12, GROUND, x + w + 20, y + 40, x + w * 0.6, y + 14, 6);
  ctx.fillStyle = MOSS;
  ellipse(ctx, x + w * (0.3 + (i % 2) * 0.4), y - 4, 16, 4);
}

export const DEN_ART = { warden: drawDenWarden };

// ——— the ruined gatehouse at the end of the Keepers' road on the Spine (feet at groundY) ———
function drawEntranceWarden(ctx, x, groundY, time) {
  const den = DENS.find((d) => d.theme === 'warden');
  const spec = MOBS[den?.boss];
  const b = groundY;
  ctx.save();
  // two great posts and a cracked lintel, the court's light beyond
  ctx.fillStyle = '#c8d8ee'; // through it: the open sky over the court, and the round gate far off
  ctx.fillRect(x - 46, b - 150, 92, 152);
  ctx.fillStyle = '#9a96a8';
  ctx.fillRect(x - 46, b - 40, 92, 42);
  ctx.fillStyle = STONE_D;
  ctx.beginPath();
  ctx.arc(x + 8, b - 52, 22, 0, TAU);
  ctx.fill();
  gear(ctx, x + 8, b - 52, 6, 10, LINE, 1.2);
  glow(ctx, x, b - 70, 70, 80, AMBER, 0.25);
  for (const s of [-1, 1]) {
    ctx.fillStyle = STONE;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + s * 70 - 24, b - 170, 48, 172, [8, 8, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = STONE_L;
    ctx.fillRect(x + s * 70 - 18, b - 160, 9, 150);
    gear(ctx, x + s * 70, b - 110, 9, 10, 'rgba(78,74,94,0.7)', 1.6);
  }
  ctx.fillStyle = STONE_D;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 104, b - 170);
  ctx.lineTo(x - 4, b - 176);
  ctx.lineTo(x + 6, b - 164);
  ctx.lineTo(x + 104, b - 168);
  ctx.lineTo(x + 104, b - 196);
  ctx.lineTo(x - 104, b - 200);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = LINE; // the crack
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, b - 176);
  ctx.lineTo(x - 8, b - 188);
  ctx.lineTo(x + 2, b - 199);
  ctx.stroke();
  // roots over the lintel and down the posts, going in
  root(ctx, x - 160, b - 210, x - 60, b - 240, x + 30, b - 190, 12);
  root(ctx, x + 30, b - 190, x + 90, b - 150, x + 52, b - 40, 9);
  ctx.fillStyle = MOSS;
  ellipse(ctx, x - 50, b - 202, 30, 7);
  ellipse(ctx, x + 70, b - 172, 16, 5);
  // the warning sign, carved in a slab propped beside it (the way in to a boss)
  const sx = x + 150;
  ctx.save();
  ctx.translate(sx, b - 64);
  ctx.rotate(0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(110, ctx.measureText(name).width + 24);
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -16, tw, 80, 10);
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
  text(ctx, name, 0, 8, 13, '#3e3a4e');
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-22, 18, 44, 14, 7);
  ctx.fill();
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#3e3a4e');
  ctx.restore();
  ctx.restore();
}

export const ENTRANCE_ART = { warden: drawEntranceWarden };

// ——— the Root Warden (ctx, w, h, st) => sil, origin at its feet, +x = facing ———
// A tall Keeper guardian of grey stone, broad-shouldered and heavy, with a squarish helm for a head and one
// round amber eye-stone in it. Roots have grown through every joint (out of its shoulders like antlers,
// round its arms and legs), moss and heather on its shoulders, a gear carved on its chest. It carries a
// great stone blade the roots have grown into, and the Anchor shard is lodged high in its back, glowing
// (built to be a weak point when S5 switches it on).
function drawRootWarden(ctx, w, h, st) {
  const { t, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const step = st.walking ? Math.sin(t * 4) : 0;
  const stone = rageCol(STONE, enr, 0.2), stoneD = rageCol(STONE_D, enr, 0.2), stoneL = rageCol(STONE_L, enr, 0.15);
  const lean = charging ? 0.12 : warn ? -0.06 : 0;
  // legs: stone pillars with roots twisted round them
  for (const [x, s] of [[-0.2, 1], [0.12, -1]]) {
    ctx.fillStyle = stoneD;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(w * x + step * s * 6, -h * 0.34, w * 0.18, h * 0.34 + 1, [6, 6, 10, 10]);
    ctx.fill();
    ctx.stroke();
    root(ctx, w * x + step * s * 6, -h * 0.05, w * (x + 0.2) + step * s * 6, -h * 0.18, w * x + step * s * 6 + 4, -h * 0.3, 5);
  }
  ctx.save();
  ctx.translate(0, -h * 0.34);
  ctx.rotate(lean);
  ctx.translate(0, h * 0.34);
  const top = -h * 0.92, bw = w * 0.36;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-bw * 0.75, -h * 0.32);
    ctx.bezierCurveTo(-bw * 1.05, top + h * 0.45, -bw * 1.35, top + h * 0.14, -bw * 0.75, top + h * 0.1);
    ctx.quadraticCurveTo(0, top + h * 0.02, bw * 0.75, top + h * 0.1);
    ctx.bezierCurveTo(bw * 1.35, top + h * 0.14, bw * 1.05, top + h * 0.45, bw * 0.75, -h * 0.32);
    ctx.quadraticCurveTo(0, -h * 0.28, -bw * 0.75, -h * 0.32);
    ctx.closePath();
  };
  // the shard, lodged high in its back (behind: -x), glowing through the roots
  const shx = -bw * 0.85, shy = top + h * 0.22, sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, shx, shy, 40, 36, '255,240,180', live ? 0.6 * sh : 0.1);
  ctx.fillStyle = live ? '#fff3c0' : '#c8c0a8';
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shx - 6, shy - 26);
  ctx.lineTo(shx + 6, shy - 4);
  ctx.lineTo(shx - 2, shy + 10);
  ctx.lineTo(shx - 16, shy - 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the far arm (holding the blade, planted in front of it or raised in the wind-up)
  const bx = bw * 1.15 + (charging ? 16 : 0), by = top + h * 0.45, raise = warn ? 1 : 0;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(raise ? -0.9 : 0.15);
  // the blade
  ctx.fillStyle = stoneL;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-9, -6);
  ctx.lineTo(-11, -h * 0.55);
  ctx.lineTo(-2, -h * 0.66);
  ctx.lineTo(9, -h * 0.56);
  ctx.lineTo(9, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(${AMBER},${live ? 0.5 + 0.4 * sh : 0.15})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(1, -14);
  ctx.lineTo(-2, -h * 0.25);
  ctx.lineTo(2, -h * 0.45);
  ctx.stroke();
  root(ctx, -10, -4, 14, -h * 0.25, -8, -h * 0.5, 4);
  ctx.fillStyle = stoneD;
  ctx.beginPath();
  ctx.roundRect(-20, -12, 40, 9, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ROOT; // the grip in a stone fist
  ctx.fillRect(-4, -4, 8, 22);
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.arc(0, 6, 14, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the body
  const g = ctx.createLinearGradient(-bw, 0, bw, 0);
  g.addColorStop(0, stoneL);
  g.addColorStop(1, stoneD);
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 4;
  body();
  ctx.fill();
  ctx.stroke();
  // the stone courses and cracks
  ctx.strokeStyle = 'rgba(78,74,94,0.5)';
  ctx.lineWidth = 2;
  for (const yy of [0.32, 0.5, 0.66]) {
    ctx.beginPath();
    ctx.moveTo(-bw * 0.95, top + h * yy);
    ctx.lineTo(bw * 0.95, top + h * yy);
    ctx.stroke();
  }
  gear(ctx, bw * 0.1, top + h * 0.4, 18, 12, live ? 'rgba(78,74,94,0.9)' : 'rgba(78,74,94,0.5)', 3);
  if (live) glow(ctx, bw * 0.1, top + h * 0.4, 16, 16, AMBER, 0.35 * sh);
  // roots grown through it: in at the hip, out of the shoulders like antlers
  root(ctx, -bw * 0.7, -h * 0.34, -bw * 0.2, top + h * 0.5, -bw * 0.6, top + h * 0.14, 9);
  root(ctx, -bw * 0.6, top + h * 0.14, -bw * 0.9, top - h * 0.02, -bw * 0.5, top - h * 0.12, 7);
  root(ctx, bw * 0.4, top + h * 0.14, bw * 0.9, top - h * 0.0, bw * 0.75, top - h * 0.1, 6);
  ctx.fillStyle = '#7aa858';
  for (const [x, y, a] of [[-bw * 0.5, top - h * 0.12, -0.5], [bw * 0.76, top - h * 0.1, 0.5], [-bw * 0.85, top - h * 0.02, -0.9]]) ellipse(ctx, x, y, 7, 3.6, a + Math.sin(t * 2 + x) * 0.1);
  // moss and heather on its shoulders
  ctx.fillStyle = MOSS;
  ellipse(ctx, -bw * 0.75, top + h * 0.15, bw * 0.35, 8);
  ellipse(ctx, bw * 0.75, top + h * 0.15, bw * 0.3, 7);
  ctx.fillStyle = '#c48ad0';
  for (let i = 0; i < 4; i++) circle(ctx, -bw * 0.9 + i * 8, top + h * 0.12, 2.2);
  // the head: a domed stone helm with a crest of roots and leaves, a slot for the eye
  const hx = bw * 0.12, hy = top + h * 0.04, hw = w * 0.2, hh = h * 0.15;
  ctx.strokeStyle = ROOT;
  ctx.lineCap = 'round';
  for (const [dx, a, len] of [[-0.5, -2.1, 0.13], [0, -1.6, 0.17], [0.5, -1.05, 0.12]]) {
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(hx + hw * dx, hy - hh * 0.9);
    ctx.quadraticCurveTo(hx + hw * dx + Math.cos(a) * h * len * 0.6 + 6, hy - hh * 0.9 + Math.sin(a) * h * len * 0.6, hx + hw * dx + Math.cos(a) * h * len, hy - hh * 0.9 + Math.sin(a) * h * len);
    ctx.stroke();
  }
  ctx.fillStyle = '#7aa858';
  for (const [dx, a, len] of [[-0.5, -2.1, 0.13], [0, -1.6, 0.17], [0.5, -1.05, 0.12]]) ellipse(ctx, hx + hw * dx + Math.cos(a) * h * len, hy - hh * 0.9 + Math.sin(a) * h * len, 7, 3.6, a + 1.57 + Math.sin(t * 2 + dx) * 0.15);
  ctx.fillStyle = stone;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(hx - hw, hy + hh * 0.3);
  ctx.lineTo(hx - hw, hy - hh * 0.2);
  ctx.bezierCurveTo(hx - hw, hy - hh * 1.2, hx + hw, hy - hh * 1.2, hx + hw, hy - hh * 0.2);
  ctx.lineTo(hx + hw, hy + hh * 0.3);
  ctx.quadraticCurveTo(hx, hy + hh * 0.5, hx - hw, hy + hh * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = stoneL;
  ellipse(ctx, hx - hw * 0.45, hy - hh * 0.55, hw * 0.25, hh * 0.15, -0.5);
  ctx.fillStyle = '#3e3a4e';
  ctx.beginPath();
  ctx.roundRect(hx - hw * 0.55, hy - hh * 0.12, hw * 1.4, hh * 0.32, 5);
  ctx.fill();
  const ex = hx + hw * 0.45, ey = hy + hh * 0.04;
  if (live) glow(ctx, ex, ey, warn ? 40 : 22, warn ? 30 : 16, AMBER, warn ? 0.95 : 0.6);
  ctx.fillStyle = live ? (warn ? '#fff4d0' : '#ffcf7a') : '#9a9488';
  circle(ctx, ex, ey, 6);
  if (!live) {
    ctx.strokeStyle = '#ff8a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 5, ey - 5); ctx.lineTo(ex + 5, ey + 5);
    ctx.moveTo(ex + 5, ey - 5); ctx.lineTo(ex - 5, ey + 5);
    ctx.stroke();
  }
  // the near arm, a great stone fist (the shield arm)
  ctx.fillStyle = stone;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-bw * 1.2, top + h * 0.22, bw * 0.4, h * 0.34, 10);
  ctx.fill();
  ctx.stroke();
  root(ctx, -bw * 1.2, top + h * 0.5, -bw * 0.7, top + h * 0.38, -bw * 1.0, top + h * 0.26, 5);
  ctx.beginPath();
  ctx.arc(-bw, top + h * 0.6, bw * 0.24, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return () => {
    ctx.save();
    ctx.translate(0, -h * 0.34);
    ctx.rotate(lean);
    ctx.translate(0, h * 0.34);
    body();
    ctx.roundRect(hx - hw, hy - hh * 0.9, hw * 2, hh * 1.3, hw * 0.6);
    ctx.restore();
  };
}

export const BOSS_ART = { root_warden: drawRootWarden };
