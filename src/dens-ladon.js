// Docs: docs/places/ladon.md, docs/combat/bosses.md
// The Root of the Road (room 49, theme 'hydra'): Ladon's den at the end of the Sunken Road, and Ladon itself, the
// Briar Hydra (FB1 (c), story/fb1-plan.md). The old Keeper road runs along the floor, its paving pushed up by roots
// and lit by glowing seed pods; root arches for ledges; the necks are the roof and the walls; the body, a great root
// knot, fills the back wall. The road goes on west into the dark (art only: a quiet hint, Tier 1). dens.js imports
// this file (DEN_ART / BOSS_ART / FX2), so it must NOT import dens.js. The heads, necks, stumps and coils are drawn
// by src/ladon.js with the helpers exported here. The den's static layer and the body's knot are baked at the screen's
// resolution and copied (docs/performance.md); everything that moves is drawn live.
import { H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { DEN_EXIT_X, MOBS } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR, LADON_PLATFORMS, LADON_HIGH } from './shared/final.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIN_FLOOR;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
export const BRIAR = '#22301e', BRIAR_M = '#34482c', BRIAR_L = '#4e6a3e', THORN = '#e4dcc4', ROSE = '#fbf6f0', GREEN = '170,230,120', WHITE = '246,250,240';
const ROAD = '#5e5664', ROAD_L = '#7a7282', ROAD_D = '#443e4c';
// what the den shows of the fight (set by src/ladon.js from the 'final' message): the enrage turns the petals to thorns
const look = { enr: false, ph: 0 };
export function setLadonLook(o) {
  Object.assign(look, o);
}

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
export function glow(ctx, x, y, rx, ry, rgb, a = 1) {
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

// ——— a briar cane / neck: a thick curve with thorns along it (x0,y0) → (x1,y1) bent through (cx,cy) ———
export function cane(ctx, x0, y0, cx, cy, x1, y1, w, seed = 0, thorns = true) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = BRIAR;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = BRIAR_M;
  ctx.lineWidth = w * 0.62;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110,150,90,0.45)';
  ctx.lineWidth = Math.max(1.5, w * 0.16);
  ctx.beginPath();
  ctx.moveTo(x0, y0 - w * 0.2);
  ctx.quadraticCurveTo(cx, cy - w * 0.2, x1, y1 - w * 0.2);
  ctx.stroke();
  if (!thorns) return;
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / (w * 1.4)));
  ctx.fillStyle = THORN;
  for (let i = 1; i < n; i++) {
    const u = i / n, a = 1 - u;
    const px = a * a * x0 + 2 * a * u * cx + u * u * x1, py = a * a * y0 + 2 * a * u * cy + u * u * y1;
    const tx = 2 * a * (cx - x0) + 2 * u * (x1 - cx), ty = 2 * a * (cy - y0) + 2 * u * (y1 - cy), tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl, side = (i + seed) % 2 ? 1 : -1, len = w * 0.55;
    const bx = px + nx * side * w * 0.42, by = py + ny * side * w * 0.42;
    ctx.beginPath();
    ctx.moveTo(bx - (tx / tl) * w * 0.18, by - (ty / tl) * w * 0.18);
    ctx.lineTo(bx + nx * side * len + (tx / tl) * w * 0.15, by + ny * side * len + (ty / tl) * w * 0.15);
    ctx.lineTo(bx + (tx / tl) * w * 0.18, by + (ty / tl) * w * 0.18);
    ctx.fill();
  }
}

// a white rose (r: its size; open 0–1)
export function rose(ctx, x, y, r, open = 1, a = 1, petals = ROSE) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = BRIAR_L;
  ellipse(ctx, x - r * 0.9, y + r * 0.4, r * 0.7, r * 0.3);
  ctx.fillStyle = petals;
  for (let i = 0; i < 5; i++) {
    const g = (i * TAU) / 5 + 0.3;
    circle(ctx, x + Math.cos(g) * r * 0.5 * open, y + Math.sin(g) * r * 0.5 * open, r * (0.45 + 0.15 * open));
  }
  ctx.fillStyle = 'rgba(220,206,196,0.9)';
  circle(ctx, x, y, r * 0.32);
  ctx.fillStyle = 'rgba(236,222,150,0.9)';
  circle(ctx, x, y, r * 0.14);
  ctx.restore();
}

// ——— the den ———
const rnd = mulberry32(4901);
const stones = [];
for (let x = 0; x < FIN_W; ) {
  const w = 46 + rnd() * 40;
  stones.push({ x, w, tilt: (rnd() - 0.5) * 0.14, lift: rnd() < 0.25 ? 3 + rnd() * 6 : 0, c: ['#5e5664', '#665e6c', '#585060'][Math.floor(rnd() * 3)] });
  x += w;
}
const pods = Array.from({ length: 11 }, (_, i) => ({ x: 70 + i * 136 + rnd() * 40, y: 40 + rnd() * 90, len: 20 + rnd() * 50, s: 0.8 + rnd() * 0.5 }));
const wallRoses = Array.from({ length: 26 }, () => ({ x: rnd() * FIN_W, y: 150 + rnd() * 230, r: 6 + rnd() * 5, ph: rnd() * TAU }));
const petals = Array.from({ length: 30 }, () => ({ x: rnd() * FIN_W, sp: 16 + rnd() * 22, ph: rnd() * TAU, s: 0.7 + rnd() * 0.6 }));
const roof = Array.from({ length: 9 }, (_, i) => ({ x0: -80 + i * 190, y0: -20 + rnd() * 30, cx: i * 190 + 60 + rnd() * 60, cy: 40 + rnd() * 50, x1: i * 190 + 200 + rnd() * 80, y1: -10 + rnd() * 30, w: 22 + rnd() * 12 }));
// pairs of white eyes in the dark behind the back wall's canes, opening and closing out of time (you never see all of it)
const darkEyes = Array.from({ length: 9 }, (_, i) => ({ x: 60 + i * 170 + rnd() * 80, y: 110 + rnd() * 200, s: 0.45 + rnd() * 0.4, ph: rnd() * 40, per: 7 + rnd() * 6 }));

// The den's static layer (the back wall, roof, side necks, the road, the arches, the way out) is baked once at the
// screen's resolution and copied 1:1 each frame (docs/performance.md: bake static scenery); only the pods, the eyes in
// the dark and the petals are drawn live. Rebuilt when the resolution changes or it enrages (the roses wither).
const BX0 = -60, BX1 = FIN_W + 60;
let bake = null; // { res, enr, c }
function denLayer(res, enr) {
  if (bake && bake.res === res && bake.enr === enr) return bake.c;
  const c = bake?.c ?? document.createElement('canvas');
  c.width = Math.ceil((BX1 - BX0) * res);
  c.height = Math.ceil(H * res);
  const g = c.getContext('2d');
  g.setTransform(res, 0, 0, res, -BX0 * res, 0);
  drawDenStatic(g, enr);
  bake = { res, enr, c };
  return c;
}
function drawDenStatic(ctx, enr) {
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-hydra', 0, GROUND + 10, [[0, '#0e0c12'], [0.45, '#1c1a22'], [1, '#2a2a26']]);
  ctx.fillRect(BX0, 0, BX1 - BX0, H);
  // the road going on west into the dark (art only): a darker mouth past the way out
  const g = ctx.createLinearGradient(0, 0, 340, 0);
  g.addColorStop(0, 'rgba(4,3,6,0.95)');
  g.addColorStop(1, 'rgba(4,3,6,0)');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, 0, 340 - BX0, GROUND);
  // the back wall: canes upon canes, with white roses in them (withered once it's enraged)
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 7; i++) {
    const x0 = i * 240 - 100;
    cane(ctx, x0, GROUND - 40 - (i % 3) * 30, x0 + 160, 120 + (i % 2) * 60, x0 + 330, GROUND - 70, 14, i, false);
  }
  ctx.globalAlpha = 1;
  for (const r of wallRoses) rose(ctx, r.x, r.y, r.r, enr ? 0.4 : 0.9, 0.75, enr ? '#b8a8a4' : ROSE);
  // the roof: the necks, thick as trunks
  for (const c of roof) cane(ctx, c.x0, c.y0, c.cx, c.cy, c.x1, c.y1, c.w, Math.round(c.x0));
  // the side walls: necks coming down out of the dark at both ends
  cane(ctx, -30, -20, 60, 200, -20, GROUND, 40, 1);
  cane(ctx, FIN_W + 30, -20, FIN_W - 60, 200, FIN_W + 20, GROUND, 40, 2);
  // the floor: the old Keeper road, its stones pushed up by roots, an old root running along its edge
  ctx.fillStyle = ROAD_D;
  ctx.fillRect(BX0, GROUND, BX1 - BX0, H - GROUND + 10);
  for (const s of stones) {
    ctx.save();
    ctx.translate(s.x + s.w / 2, GROUND + 6 - s.lift);
    ctx.rotate(s.tilt);
    ctx.fillStyle = s.c;
    ctx.beginPath();
    ctx.roundRect(-s.w / 2 + 2, -6, s.w - 4, 14, 3);
    ctx.fill();
    ctx.fillStyle = ROAD_L;
    ctx.fillRect(-s.w / 2 + 5, -5, s.w - 10, 2);
    ctx.restore();
  }
  cane(ctx, BX0, GROUND + 22, FIN_W / 2, GROUND + 14, BX1, GROUND + 24, 10, 0, false);
  drawExit(ctx);
  LADON_PLATFORMS.forEach((p, i) => p.kind !== 'high' && drawArch(ctx, p, i)); // (the high one: drawHighArch, in front of the body)
  ctx.restore();
}
// the high arch in the middle, drawn in front of Ladon's body (src/ladon.js) so the Strangle's safe place is always in sight
export function drawHighArch(ctx) {
  drawArch(ctx, LADON_PLATFORMS[LADON_HIGH], LADON_HIGH);
}

function drawDenHydra(ctx, camX, viewW, time) {
  const L = camX - 80, R = camX + viewW + 80, enr = look.enr;
  const m = ctx.getTransform(), res = Math.round(Math.hypot(m.a, m.b) * 1000) / 1000;
  if (Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.a - m.d) < 1e-6 && res > 0) {
    // the baked layer, copied 1:1 (whole device pixels, no filtering)
    const img = denLayer(res, enr);
    const sx = clamp(Math.floor((L - BX0) * res), 0, img.width - 1), sw = Math.min(img.width - sx, Math.ceil((R - L) * res));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, 0, sw, img.height, Math.round(m.e + BX0 * res) + sx, Math.round(m.f), sw, img.height);
    ctx.restore();
  } else drawDenStatic(ctx, enr);
  ctx.save();
  // the way out's faint green light
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) glow(ctx, DEN_EXIT_X, GROUND - 60, 80, 70, '190,255,150', 0.12 + 0.05 * Math.sin(time * 2));
  // eyes in the dark behind the canes, opening and closing out of time
  for (const e of darkEyes) {
    if (!visible(e.x - 30, e.x + 30, L, R)) continue;
    const k = (time + e.ph) % e.per, open = k < 2.4 ? Math.sin((k / 2.4) * Math.PI) : 0;
    if (open > 0.02) drawEyes(ctx, e.x, e.y, Math.min(1, open * 1.6), e.s, time, enr);
  }
  // the seed pods hanging off the roof
  for (const p of pods) {
    if (!visible(p.x - 30, p.x + 30, L, R)) continue;
    const sway = Math.sin(time * 1.2 + p.x) * 3, py = p.y + p.len;
    ctx.strokeStyle = BRIAR_M;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + sway, py);
    ctx.stroke();
    glow(ctx, p.x + sway, py + 8, 46 * p.s, 46 * p.s, enr ? '255,170,140' : '190,255,150', 0.35 + 0.08 * Math.sin(time * 2 + p.x));
    ctx.fillStyle = enr ? '#f0c8a8' : '#c8f0a0';
    ellipse(ctx, p.x + sway, py + 8, 7 * p.s, 10 * p.s);
    ctx.fillStyle = '#fbffe8';
    ellipse(ctx, p.x + sway - 2, py + 5, 2.5 * p.s, 3.5 * p.s);
  }
  // petals drifting down (thorns once it's enraged)
  for (const p of petals) {
    const y = ((time * p.sp * (enr ? 1.6 : 1) + p.ph * 60) % (GROUND + 40)) - 20, x = p.x + Math.sin(time * 0.9 + p.ph) * 16;
    if (!visible(x - 6, x + 6, L, R)) continue;
    if (enr) {
      ctx.fillStyle = 'rgba(70,40,40,0.9)';
      ctx.beginPath();
      ctx.moveTo(x, y - 6 * p.s);
      ctx.lineTo(x + 2.5 * p.s, y + 3 * p.s);
      ctx.lineTo(x - 2.5 * p.s, y + 3 * p.s);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(250,244,240,0.75)';
      ellipse(ctx, x, y, 3 * p.s, 2 * p.s);
    }
  }
  ctx.restore();
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  ctx.fillStyle = '#060508';
  ctx.beginPath();
  ctx.moveTo(x - 40, b + 2);
  ctx.lineTo(x - 40, b - 80);
  ctx.arc(x, b - 80, 40, Math.PI, 0);
  ctx.lineTo(x + 40, b + 2);
  ctx.closePath();
  ctx.fill();
  cane(ctx, x - 52, b + 4, x - 70, b - 120, x + 10, b - 132, 14, 3);
  cane(ctx, x + 52, b + 4, x + 70, b - 110, x - 10, b - 130, 12, 4);
  text(ctx, 'OUT', x, b - 160, 13, '#e8f0dc');
}

// the ledges: root arches (the high one in the middle is thicker, a knot of old root)
function drawArch(ctx, p, i) {
  const { x, y, w } = p, high = p.kind === 'high';
  cane(ctx, x + 6, GROUND + 4, x - 10, y + 40, x + w * 0.35, y + 6, high ? 18 : 14, i, false);
  cane(ctx, x + w - 6, GROUND + 4, x + w + 10, y + 40, x + w * 0.65, y + 6, high ? 18 : 14, i + 1, false);
  ctx.fillStyle = '#4a3a2c';
  ctx.strokeStyle = '#2a2018';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 16, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a5440';
  ctx.fillRect(x + 6, y - 1, w - 12, 3);
  ctx.fillStyle = 'rgba(122,160,94,0.85)';
  ellipse(ctx, x + w * (0.3 + (i % 2) * 0.4), y - 4, 14, 3.5);
  if (high) rose(ctx, x + w / 2, y - 6, 6, 0.9, 0.9);
}

export const DEN_ART = { hydra: drawDenHydra };

// ——— Ladon's body: the great root knot at the back wall (feet at 0, 0; w × h), the necks going up out of it into the
// roof, a thorn-toothed hollow in the middle with the green of its throats deep inside. The knot itself is baked
// (BODY_*) and copied; the hearts' glows, the hollow and the buds' eyes are live ———
const BODY_L = -300, BODY_T = -470, BODY_R = 300, BODY_B = 14;
const bodyBake = { res: 0, c: null };
const knotRnd = mulberry32(7741);
const knotCanes = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI + knotRnd() * 0.2, b: knotRnd(), c: knotRnd(), w: 14 + knotRnd() * 14 }));
const buds = [[-128, -118], [112, -96], [-62, -214], [70, -232], [-160, -60], [150, -170], [10, -262]];
function drawKnot(ctx, w, h) {
  // the necks out of it: up into the dark of the roof (behind the knot)
  ctx.globalAlpha = 0.9;
  for (const [x0, cx, x1, wd] of [[-90, -150, -230, 44], [-40, -60, -60, 50], [40, 70, 90, 46], [100, 170, 250, 40], [0, 10, 0, 56]]) cane(ctx, x0, -h * 0.55, cx, -h * 1.05, x1, -h * 1.58, wd, Math.abs(x0));
  ctx.globalAlpha = 1;
  // the mass
  ctx.fillStyle = '#0e140c';
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.42, w * 0.52, h * 0.45, 0, 0, TAU);
  ctx.fill();
  // canes twisted round each other into a mound, back to front
  for (const k of knotCanes) {
    const r = w * (0.36 + k.b * 0.16), x0 = -Math.cos(k.a) * r, y0 = -h * (0.04 + k.c * 0.14) - Math.sin(k.a) * h * 0.12;
    const x1 = Math.cos(k.a + 0.9) * r * 0.85, y1 = -h * (0.2 + k.b * 0.55);
    cane(ctx, x0, y0, (x0 + x1) * 0.2 + (k.c - 0.5) * w * 0.4, -h * (0.55 + 0.35 * k.b), x1, y1, k.w, Math.round(k.a * 10));
  }
  // the hollow where the necks meet: a dark mouth ringed with thorn teeth pointing in
  ctx.fillStyle = '#050704';
  ellipse(ctx, 0, -h * 0.5, w * 0.16, h * 0.14);
  ctx.fillStyle = THORN;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, ex = Math.cos(a) * w * 0.16, ey = -h * 0.5 + Math.sin(a) * h * 0.14;
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a + 1.6) * 5, ey + Math.sin(a + 1.6) * 5);
    ctx.lineTo(ex - Math.cos(a) * 15, ey - Math.sin(a) * 13);
    ctx.lineTo(ex + Math.cos(a - 1.6) * 5, ey + Math.sin(a - 1.6) * 5);
    ctx.fill();
  }
  // roots into the road, and leaves caught in it
  for (const sd of [-1, 1]) {
    cane(ctx, sd * w * 0.3, -h * 0.1, sd * w * 0.55, -h * 0.02, sd * w * 0.72, 4, 20, sd > 0 ? 3 : 4, false);
    cane(ctx, sd * w * 0.18, -h * 0.05, sd * w * 0.3, 2, sd * w * 0.44, 8, 12, 5, false);
  }
  ctx.fillStyle = '#3e5a30';
  for (const [x, y, a] of [[-110, -200, 0.6], [120, -150, -0.4], [-40, -270, 0.2], [60, -60, -0.8], [-150, -120, 1.1]]) ellipse(ctx, x, y, 14, 5, a);
  // closed buds: they open as eyes (live)
  for (const [x, y] of buds) {
    ctx.fillStyle = BRIAR_L;
    ellipse(ctx, x, y, 7, 5);
  }
}
function drawLadonBody(ctx, w, h, st, m) {
  const { t, enr, dying } = st, spec = MOBS.ladon, glowRgb = enr ? '255,110,90' : GREEN;
  const tr = ctx.getTransform(), res = Math.round(Math.abs(tr.a) * 1000) / 1000, flat = Math.abs(tr.b) < 1e-6 && Math.abs(tr.c) < 1e-6 && Math.abs(Math.abs(tr.a) - tr.d) < 1e-6;
  if (bodyBake.res !== res) {
    const c = bodyBake.c ?? document.createElement('canvas');
    c.width = Math.ceil((BODY_R - BODY_L) * res);
    c.height = Math.ceil((BODY_B - BODY_T) * res);
    const g = c.getContext('2d');
    g.setTransform(res, 0, 0, res, -BODY_L * res, -BODY_T * res);
    drawKnot(g, spec.w, spec.h);
    Object.assign(bodyBake, { res, c });
  }
  glow(ctx, 0, -h * 0.45, w * 0.75, h * 0.62, glowRgb, 0.16 + 0.05 * Math.sin(t * 2.2));
  const img = bodyBake.c;
  if (flat && Math.abs(w - spec.w) < 0.5 && Math.abs(h - spec.h) < 0.5) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(tr.e + BODY_L * res), Math.round(tr.f + BODY_T * res));
    ctx.restore();
  } else ctx.drawImage(img, BODY_L * (w / spec.w), BODY_T * (h / spec.h), (BODY_R - BODY_L) * (w / spec.w), (BODY_B - BODY_T) * (h / spec.h)); // (squashed by a hit or its death)
  // the hearts: several, beating out of time, deep in the knot; the throats' green in the hollow
  if (dying < 0.5) {
    const sx = w / spec.w, sy = h / spec.h;
    for (const [hx, hy, f, ph] of [[-70, -150, 2.2, 0], [80, -190, 2.9, 1.3], [10, -95, 1.7, 2.1]]) {
      const beat = Math.pow(Math.max(0, Math.sin(t * f + ph)), 6);
      glow(ctx, hx * sx, hy * sy, 34 * sx, 30 * sy, glowRgb, 0.12 + 0.4 * beat);
    }
    glow(ctx, 0, -h * 0.5, w * 0.2, h * 0.16, glowRgb, 0.45 + 0.2 * Math.sin(t * 2.2));
    ctx.fillStyle = enr ? 'rgba(255,170,140,0.55)' : 'rgba(214,255,170,0.5)';
    ellipse(ctx, 0, -h * 0.47, w * 0.05, h * 0.035);
    // the buds open now and then: small white eyes all over it
    buds.forEach(([bx, by], i) => {
      const k = (t * 0.6 + i * 1.7) % 6, open = k < 1.6 ? Math.sin((k / 1.6) * Math.PI) : 0;
      if (open > 0.05) {
        glow(ctx, bx * sx, by * sy, 12, 10, enr ? '255,150,130' : WHITE, 0.5 * open);
        ctx.fillStyle = enr ? '#ffe2da' : '#ffffff';
        ellipse(ctx, bx * sx, by * sy, 4.2, 3 * open);
      }
    });
  }
  return () => ctx.ellipse(0, -h * 0.42, w * 0.5, h * 0.44, 0, 0, TAU);
}
export const BOSS_ART = { ladon: drawLadonBody };

// ——— a head: a long dragon skull of woven thorn, a jaw of thorn teeth, leaf frills, a white rose for an eye that glows
// (snout toward ang). lit: the eye (0–1; the acting head's lights first); throat: its glowing throat (a Coil); jaw: how
// far the jaw hangs open; hurt: the flash of a hit; shut: the eye closed (freed); s: its size ———
const skullPath = (ctx, L, W) => {
  ctx.beginPath();
  ctx.moveTo(-L * 0.48, -W * 0.62);
  ctx.quadraticCurveTo(-L * 0.12, -W * 1.12, L * 0.24, -W * 0.72);
  ctx.quadraticCurveTo(L * 0.58, -W * 0.5, L * 0.8, -W * 0.12);
  ctx.quadraticCurveTo(L * 0.86, W * 0.06, L * 0.76, W * 0.2);
  ctx.lineTo(-L * 0.18, W * 0.34);
  ctx.quadraticCurveTo(-L * 0.52, W * 0.42, -L * 0.6, W * 0.05);
  ctx.quadraticCurveTo(-L * 0.62, -W * 0.36, -L * 0.48, -W * 0.62);
  ctx.closePath();
};
export function drawHead(ctx, x, y, ang, s, lit, t, { throat = 0, first = false, enr = false, hurt = 0, jaw = 0, shut = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const L = 66 * s, W = 26 * s, eyeRgb = enr ? '255,140,120' : WHITE;
  if (lit > 0.05) glow(ctx, L * 0.15, 0, L * 1.05, W * 1.9, eyeRgb, 0.22 * lit);
  // leaf frills fanned out behind the skull (two greens), and thorns down the back of the neck
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i - 2.5) * 0.36, wob = Math.sin(t * 2 + i) * 0.05;
    ctx.fillStyle = i % 2 ? '#2e4a24' : '#46683a';
    ctx.beginPath();
    ctx.ellipse(-L * 0.42 + Math.cos(a) * W * 0.62, Math.sin(a) * W * 0.95, W * 0.72, W * 0.24, a + wob, 0, TAU);
    ctx.fill();
  }
  // the lower jaw (hangs open by `jaw`), teeth up; the mouth's inside lit by the throat
  const open = clamp(jaw, 0, 1) * 0.5;
  if (open > 0.02) {
    ctx.fillStyle = '#140c0c';
    ctx.beginPath();
    ctx.moveTo(-L * 0.2, W * 0.3);
    ctx.lineTo(L * 0.78, W * 0.2);
    ctx.lineTo(L * 0.7, W * 0.2 + Math.sin(open) * L * 0.9);
    ctx.closePath();
    ctx.fill();
    if (throat > 0.01 || lit > 0.5) glow(ctx, L * 0.1, W * 0.5 + open * W, L * 0.45, W * 0.7, enr ? '255,120,90' : '190,255,140', 0.6 * Math.max(throat, lit * 0.5));
  }
  ctx.save();
  ctx.translate(-L * 0.2, W * 0.3);
  ctx.rotate(open);
  ctx.fillStyle = BRIAR_M;
  ctx.beginPath();
  ctx.moveTo(-L * 0.08, -W * 0.1);
  ctx.lineTo(L * 0.92, -W * 0.06);
  ctx.quadraticCurveTo(L * 0.94, W * 0.12, L * 0.8, W * 0.2);
  ctx.quadraticCurveTo(L * 0.3, W * 0.44, -L * 0.1, W * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = THORN;
  for (let i = 0; i < 6; i++) {
    const px = L * (0.12 + i * 0.13);
    ctx.beginPath();
    ctx.moveTo(px - 3.2 * s, -W * 0.04);
    ctx.lineTo(px + 1 * s, -W * 0.42);
    ctx.lineTo(px + 3.2 * s, -W * 0.04);
    ctx.fill();
  }
  ctx.restore();
  // the skull: woven canes, a pale rim of light along it so it reads against the dark
  ctx.fillStyle = BRIAR;
  skullPath(ctx, L, W);
  ctx.fill();
  ctx.strokeStyle = enr ? 'rgba(220,150,130,0.5)' : 'rgba(160,206,128,0.5)';
  ctx.lineWidth = 1.8 * s;
  ctx.stroke();
  ctx.strokeStyle = BRIAR_L;
  ctx.lineWidth = 2.2 * s;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-L * 0.46, -W * (0.42 - i * 0.34));
    ctx.quadraticCurveTo(L * 0.1, -W * (0.82 - i * 0.42), L * 0.74, -W * (0.12 - i * 0.12));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(20,28,16,0.9)';
  ctx.lineWidth = 1.4 * s;
  for (let i = 0; i < 5; i++) {
    const px = -L * 0.3 + i * L * 0.2;
    ctx.beginPath();
    ctx.moveTo(px, -W * 0.7 + i * W * 0.1);
    ctx.lineTo(px + L * 0.07, W * 0.25);
    ctx.stroke();
  }
  // brow thorns, a nostril, the upper teeth
  ctx.fillStyle = THORN;
  for (let i = 0; i < 3; i++) {
    const px = -L * 0.32 + i * L * 0.2, py = -W * (0.85 - i * 0.06);
    ctx.beginPath();
    ctx.moveTo(px - 3 * s, py + 2 * s);
    ctx.lineTo(px - 7 * s, py - 7 * s);
    ctx.lineTo(px + 3 * s, py);
    ctx.fill();
  }
  for (let i = 0; i < 6; i++) {
    const px = L * (0.0 + i * 0.13), py = W * (0.32 - i * 0.024);
    ctx.beginPath();
    ctx.moveTo(px - 3 * s, py - 2);
    ctx.lineTo(px + 0.5 * s, py + W * 0.34);
    ctx.lineTo(px + 3 * s, py - 2);
    ctx.fill();
  }
  ctx.fillStyle = '#060805';
  ellipse(ctx, L * 0.68, -W * 0.16, 3.2 * s, 1.4 * s, -0.3);
  if (hurt > 0.01) {
    ctx.fillStyle = `rgba(255,236,232,${0.65 * hurt})`;
    skullPath(ctx, L, W);
    ctx.fill();
  }
  // the throat's green glow, a sac under the jaw (a Coil turns it toward you)
  if (throat > 0.01) {
    glow(ctx, -L * 0.12, W * 0.85, L * 0.5, W * 0.75, '190,255,140', 0.85 * throat);
    ctx.fillStyle = `rgba(214,255,170,${0.9 * throat})`;
    ellipse(ctx, -L * 0.12, W * 0.72, L * 0.24, W * 0.26);
    ctx.fillStyle = `rgba(250,255,236,${0.8 * throat})`;
    ellipse(ctx, -L * 0.15, W * 0.68, L * 0.1, W * 0.1);
  }
  // the eye: a white rose, glowing (or closed)
  const ex = L * 0.1, ey = -W * 0.4;
  if (shut) {
    ctx.strokeStyle = '#d8d0c4';
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ex, ey - 2 * s, 6 * s, 0.4, Math.PI - 0.4);
    ctx.stroke();
  } else {
    glow(ctx, ex, ey, 15 * s, 15 * s, eyeRgb, 0.25 + 0.65 * lit);
    rose(ctx, ex, ey, 7 * s, 0.7 + 0.3 * lit, 1, lit > 0.5 ? '#ffffff' : ROSE);
  }
  if (first) {
    // the crown of thorns and the shard, gold-white, in its brow
    for (let i = 0; i < 7; i++) {
      const px = -L * 0.4 + i * L * 0.11, tall = W * (0.55 + (i % 2) * 0.35 + (i === 3 ? 0.3 : 0));
      ctx.fillStyle = i % 2 ? '#cfc6b0' : THORN;
      ctx.beginPath();
      ctx.moveTo(px - 4 * s, -W * 0.82);
      ctx.lineTo(px + 1 * s, -W * 0.82 - tall);
      ctx.lineTo(px + 5 * s, -W * 0.8);
      ctx.fill();
    }
    const sx = -L * 0.12, sy = -W * 0.7;
    glow(ctx, sx, sy, 24 * s, 24 * s, '255,236,170', 0.7 + 0.2 * Math.sin(t * 3));
    ctx.fillStyle = '#fff3c8';
    ctx.beginPath();
    ctx.moveTo(sx, sy - W * 0.3);
    ctx.lineTo(sx + 6 * s, sy);
    ctx.lineTo(sx, sy + W * 0.24);
    ctx.lineTo(sx - 6 * s, sy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, sx - 1.5 * s, sy - 4 * s, 1.6 * s, 3 * s);
  }
  ctx.restore();
}

// a pair of white eyes in the dark (the first head, before it comes out; the den's back wall; a tell)
export function drawEyes(ctx, x, y, open, s, t, enr = false, shard = false) {
  if (open <= 0.02) return;
  if (shard) glow(ctx, x, y - 26 * s, 16 * s, 16 * s, '255,236,170', 0.25 + 0.1 * Math.sin(t * 3));
  for (const dx of [-14 * s, 14 * s]) {
    glow(ctx, x + dx, y, 22 * s, 16 * s, enr ? '255,140,120' : WHITE, 0.45 * open);
    ctx.fillStyle = enr ? '#ffe2da' : '#ffffff';
    ellipse(ctx, x + dx, y, 7 * s, 4.5 * s * open);
  }
}

const STUMP_S = 1.4; // (a stump's size against a neck's)
// a cut neck's stump (snout direction ang): 'stump' raw, the cut end weeping sap, swelling as it grows back (grow 0–1:
// it bulges, splits down the middle and two new heads push out of the split); 'sealed': charred black, embers in its
// cracks, smoke off it
export function drawStump(ctx, x, y, ang, st, grow, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(STUMP_S, STUMP_S);
  if (st === 'sealed') {
    const r = 20;
    ctx.fillStyle = '#1a1412';
    ellipse(ctx, 0, 0, 13, r + 2);
    ctx.fillStyle = '#2c221c';
    ellipse(ctx, 3, 0, 9, r * 0.82);
    glow(ctx, 4, 0, 22, r + 6, '255,140,70', 0.28 + 0.12 * Math.sin(t * 3));
    ctx.strokeStyle = `rgba(255,${150 + Math.round(50 * Math.sin(t * 4))},80,0.9)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(3, -r * 0.7);
    ctx.lineTo(6, -r * 0.2);
    ctx.lineTo(2, r * 0.1);
    ctx.lineTo(7, r * 0.6);
    ctx.moveTo(6, -r * 0.2);
    ctx.lineTo(10, -r * 0.05);
    ctx.stroke();
    ctx.restore();
    // embers and smoke rising (straight up, whatever way the stump points)
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.7 + i * 0.25) % 1;
      ctx.fillStyle = `rgba(255,${170 + i * 15},90,${0.8 * (1 - k)})`;
      circle(ctx, x + Math.sin(t * 3 + i * 2) * 6 + (i - 1.5) * 4, y - 10 - k * 40, 1.6);
      ctx.fillStyle = `rgba(60,56,54,${0.25 * (1 - k)})`;
      circle(ctx, x + (i - 1.5) * 6 + Math.sin(t + i) * 8, y - 16 - k * 60, 5 + k * 8);
    }
    return;
  }
  const bulge = grow * grow, r = 18 + bulge * 12, pulse = grow > 0.05 ? 0.5 + 0.5 * Math.sin(t * (4 + grow * 12)) : 0;
  // the neck's end swelling
  if (grow > 0.05) glow(ctx, 6, 0, 30 + 20 * grow, 30 + 20 * grow, GREEN, (0.35 + 0.25 * pulse) * grow);
  ctx.fillStyle = BRIAR;
  ellipse(ctx, -6, 0, 14 + bulge * 10 + pulse * grow * 2, r + 3);
  // the raw cut: pale green, rings of the wood, sap
  ctx.fillStyle = '#7aa05e';
  ellipse(ctx, 0, 0, 9 + bulge * 5, r);
  ctx.fillStyle = '#b8e090';
  ellipse(ctx, 2, 0, 6 + bulge * 3, r * 0.74);
  ctx.strokeStyle = 'rgba(90,130,70,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(2, 0, 3 + bulge * 2, r * 0.42, 0, 0, TAU);
  ctx.stroke();
  if (grow > 0.25) {
    // it splits down the middle, and two buds (new heads, their eyes still shut) push out of the split
    const k = (grow - 0.25) / 0.75;
    ctx.strokeStyle = '#0c120a';
    ctx.lineWidth = 2 + k * 3;
    ctx.beginPath();
    ctx.moveTo(2, -r * 0.9);
    ctx.quadraticCurveTo(6, 0, 2, r * 0.9);
    ctx.stroke();
    for (const sd of [-1, 1]) {
      const bx = 8 + k * 18, by = sd * r * (0.3 + 0.25 * k);
      ctx.fillStyle = BRIAR_M;
      ctx.beginPath();
      ctx.ellipse(bx, by, 6 + k * 8, 4 + k * 5, sd * 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = THORN;
      ctx.beginPath();
      ctx.moveTo(bx + 4 + k * 8, by - 2);
      ctx.lineTo(bx + 9 + k * 12, by + sd * 2);
      ctx.lineTo(bx + 4 + k * 8, by + 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(240,250,236,0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx + 1, by - 1, 2 + k * 2, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
  }
  ctx.restore();
  // sap dripping off the raw cut (straight down)
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.8 + i * 0.5) % 1;
    ctx.fillStyle = `rgba(190,240,150,${0.85 * (1 - k)})`;
    ellipse(ctx, x + (i ? 4 : -3), y + 14 + k * 30, 1.8, 2.8);
  }
}

// a head's ring (like a weak point's): its fill so far
export function drawRing(ctx, x, y, r, fill, t, hot = false) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(20,24,18,0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, r + 8, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = hot ? '#d8ffb0' : '#fff2c8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r + 8, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(fill, 0, 1));
  ctx.stroke();
  ctx.restore();
}

// the phase 3 coils: a wall of necks from one end (side -1 west, 1 east) reaching cw px in; its edge, where it hurts,
// is a row of thorns pointing at you and a warm line that pulses
export function drawCoilWall(ctx, side, cw, t, enr, surge = 0) {
  if (cw < 4) return;
  const edge = side < 0 ? cw : FIN_W - cw, x0 = side < 0 ? -60 : FIN_W + 60, mid = (x0 + edge) / 2;
  ctx.save();
  const g = ctx.createLinearGradient(x0, 0, edge, 0);
  g.addColorStop(0, 'rgba(6,9,5,0.96)');
  g.addColorStop(1, 'rgba(16,24,12,0.82)');
  ctx.fillStyle = g;
  ctx.fillRect(Math.min(x0, edge), 0, Math.abs(edge - x0), GROUND + 30);
  // necks coiled one over another, writhing, bulging toward the middle
  for (let i = 0; i < 8; i++) {
    const y = 24 + i * 58, wob = Math.sin(t * (1.6 + surge * 3) + i * 1.3) * (10 + surge * 8);
    cane(ctx, x0, y - 24, mid + wob, y + 30, edge - side * 10 + wob * 0.3, y + 4, 26 + (i % 3) * 7, i);
  }
  // eyes in the coils
  for (let i = 0; i < 3; i++) {
    const ey = 110 + i * 120 + Math.sin(t + i) * 8, ex = edge - side * (36 + (i % 2) * 30);
    const k = (t * 0.5 + i * 0.9) % 3, open = k < 1.8 ? Math.min(1, Math.sin((k / 1.8) * Math.PI) * 1.5) : 0;
    if (open > 0.05) {
      glow(ctx, ex, ey, 18, 12, enr ? '255,150,130' : WHITE, 0.5 * open);
      ctx.fillStyle = enr ? '#ffe2da' : '#ffffff';
      ellipse(ctx, ex, ey, 6, 3.6 * open);
    }
  }
  // the edge: thorns pointing in, all the way down, and a pulsing warm line
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  glow(ctx, edge, GROUND - 200, 40, 270, enr ? '255,90,70' : '255,110,100', 0.22 + 0.12 * pulse);
  ctx.strokeStyle = `rgba(255,${enr ? 100 : 130},${enr ? 90 : 120},${0.5 + 0.35 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = 0; y <= GROUND + 10; y += 18) {
    const x = edge + Math.sin(y * 0.05 + t * 3) * 4;
    if (y) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#f4dcd2';
  for (let y = 14; y < GROUND; y += 26) {
    const x = edge + Math.sin(y * 0.05 + t * 3) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x - side * 14, y + 1);
    ctx.lineTo(x, y + 6);
    ctx.fill();
  }
  ctx.restore();
}

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
const HH_STEP = 60;
// Hundred Heads: every neck rises out of the floor at once, but for the gaps, which are marked
function headsWarn(ctx, e, k) {
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  const gaps = e.gaps ?? [];
  const safe = (x) => gaps.some(([a, b]) => x >= a - 10 && x <= b + 10);
  for (let x = 30; x < FIN_W; x += HH_STEP) {
    if (safe(x)) continue;
    // the floor cracks, a red wash over where they'll come up, and the heads already pushing through
    ctx.fillStyle = `rgba(255,90,100,${0.08 + 0.1 * pulse})`;
    ctx.fillRect(x - 28, GROUND - 320, 56, 320);
    const rise = clamp(k * 1.3, 0, 1) * (40 + ((x * 7) % 46));
    cane(ctx, x, GROUND + 14, x + 6, GROUND - rise * 0.5, x - 2, GROUND - rise, 16, x, true);
    if (rise > 10) {
      ctx.fillStyle = BRIAR;
      ellipse(ctx, x - 2, GROUND - rise - 4, 11, 8);
      const open = clamp(k * 2 - 0.4, 0, 1);
      glow(ctx, x - 2, GROUND - rise - 6, 12, 10, WHITE, 0.5 * open);
      ctx.fillStyle = '#ffffff';
      ellipse(ctx, x - 2, GROUND - rise - 6, 3.4, 2.4 * open + 0.1);
    }
    ctx.strokeStyle = `rgba(30,22,20,0.9)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 18, GROUND + 4);
    ctx.lineTo(x - 6, GROUND - 1);
    ctx.lineTo(x + 4, GROUND + 5);
    ctx.lineTo(x + 18, GROUND);
    ctx.stroke();
  }
  for (const [a, b] of gaps) {
    glow(ctx, (a + b) / 2, GROUND - 20, (b - a) * 0.75, 60, '140,255,190', 0.55 + 0.2 * pulse);
    ctx.fillStyle = 'rgba(140,255,190,0.08)';
    ctx.fillRect(a, GROUND - 300, b - a, 300);
    ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(a, GROUND - 300, b - a, 300);
    ctx.setLineDash([]);
    safeTag(ctx, (a + b) / 2, GROUND - 160, e.t);
  }
}
function headsHit(ctx, e, k) {
  const gaps = e.gaps ?? [];
  const safe = (x) => gaps.some(([a, b]) => x >= a - 10 && x <= b + 10);
  const up = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
  for (let x = 30; x < FIN_W; x += HH_STEP) {
    if (safe(x)) continue;
    const top = GROUND - up * (250 + ((x * 13) % 90)), sw = Math.sin(x * 0.7) * 16;
    cane(ctx, x, GROUND + 20, x + 10 + sw, (GROUND + top) / 2, x + sw * 0.5, top, 24, x, true);
    drawHead(ctx, x + sw * 0.5, top, -Math.PI / 2 + Math.sin(x) * 0.25, 0.62, 1, e.t, { jaw: 0.8 + 0.2 * Math.sin(e.t * 20 + x), enr: look.enr });
  }
  for (const [a, b] of gaps) glow(ctx, (a + b) / 2, GROUND - 20, (b - a) * 0.6, 50, '140,255,190', 0.4 * up);
}
// Strangle: the coils surge in from both sides and over the floor and the low arches; only the high arch holds
function strangleWarn(ctx, e, k) {
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k)), hi = LADON_PLATFORMS[LADON_HIGH];
  ctx.fillStyle = `rgba(255,90,100,${0.07 + 0.09 * pulse})`;
  ctx.fillRect(0, hi.y + 30, FIN_W, GROUND - hi.y - 20);
  for (const side of [-1, 1]) drawCoilWall(ctx, side, 80 + k * 200 + pulse * 12, e.t, look.enr, k);
  // the floor heaves: canes rolling under the paving
  for (let i = 0; i < 3; i++) {
    const y = GROUND + 8 - i * 10 * k - Math.sin(e.t * 6 + i) * 3;
    ctx.globalAlpha = 0.5 + 0.4 * k;
    cane(ctx, 0, y, FIN_W / 2, y - 12 * k, FIN_W, y, 16 + i * 4, i, true);
    ctx.globalAlpha = 1;
  }
  // the high arch: lit, and marked
  const cx = hi.x + hi.w / 2;
  ctx.fillStyle = 'rgba(140,255,190,0.12)';
  ctx.fillRect(hi.x - 8, hi.y - 120, hi.w + 16, 140);
  glow(ctx, cx, hi.y - 20, hi.w * 0.8, 70, '120,240,160', 0.55 + 0.2 * pulse);
  ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(hi.x - 8, hi.y - 8, hi.w + 16, 34, 12);
  ctx.stroke();
  safeTag(ctx, cx, hi.y - 36, e.t);
  // arrows pointing up at it from the floor
  ctx.fillStyle = `rgba(150,255,180,${0.5 + 0.4 * pulse})`;
  for (const dx of [-60, 60]) {
    const ay = hi.y + 70 - Math.abs(Math.sin(e.t * 5)) * 8;
    ctx.beginPath();
    ctx.moveTo(cx + dx, ay - 14);
    ctx.lineTo(cx + dx + 10, ay);
    ctx.lineTo(cx + dx - 10, ay);
    ctx.fill();
  }
}
function strangleHit(ctx, e, k) {
  const up = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7, hi = LADON_PLATFORMS[LADON_HIGH];
  for (const side of [-1, 1]) drawCoilWall(ctx, side, 300 * up, e.t, look.enr, 1);
  const top = hi.y + 26; // (up to just under the high arch)
  for (let i = 0; i < 8; i++) {
    const y = GROUND + 10 - i * ((GROUND - top) / 8) * up;
    cane(ctx, -40, y, FIN_W / 2, y - 26 * up - (i % 2) * 18, FIN_W + 40, y, 30, i, true);
  }
}
export const FX2 = {
  headsWarn: { dur: 4, draw: headsWarn },
  headsHit: { dur: 1.3, draw: headsHit },
  strangleWarn: { dur: 4, draw: strangleWarn },
  strangleHit: { dur: 1.3, draw: strangleHit },
};
