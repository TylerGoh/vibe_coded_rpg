// Docs: docs/places/fenrir.md, docs/performance.md
// The Wolf's Hold (room 52, theme 'wolf'): Fenrir's den at the foot of the Long Stair (FB2 (c), story/fb2-plan.md, where
// it's called the Glacier's Bed), and Fenrir itself, the Bound Wolf; Skoll and Hati; its two ultimates' effects; the
// dark, the lanterns, the fetters and the anchors' cracks. The bottom of the glacier: black-blue ice with things older
// than the hamlet frozen in it, the wolf's old claw marks in the back wall, a floor of bare rock scraped smooth, low ice
// ledges and one high one, two Keeper anchor stones in each side wall and six Keeper lamp posts with the cutters'
// lanterns on them, the stone hand at its paws. dens.js and field.js import this file (DEN_ART, BOSS_ART, FX2, SON_ART),
// so it must NOT import them. The den's static layer is baked (as Ladon's); the dark is one low-resolution layer, rebuilt
// only when a lantern changes (docs/performance.md). FB2 (c) piece 2 (c2): the wolf is a skeleton (hips, shoulders,
// jointed legs, neck, head) eased between poses, so every pose is the same animal.
import { H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { DEN_EXIT_X } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR } from './shared/final.js';
import { FENRIR_PLATFORMS, ANCHORS, LANTERN_X, LANTERN_Y, LIGHT_R, LEE_FLOOR, LEE_LEDGE, FEN_MID } from './shared/fenrir.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIN_FLOOR;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
export const ICE = '150,200,255', FROST = '230,244,255', FETTER = '226,236,255';
export function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35);
}
function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
const lerp = (a, b, k) => a + (b - a) * k;
const P2 = (x, y) => ({ x, y });
const mixP = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
// a smooth curve through pts (Catmull-Rom as Béziers), closed by default
function spline(ctx, pts, closed = true) {
  const n = pts.length, at = (i) => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
  }
  if (closed) ctx.closePath();
}
// a soft scalloped blob of fur (a ruff, a cheek): an ellipse whose rim waves in and out, rimed tips on the bumps
function fluff(ctx, cx, cy, rx, ry, rot, n, col, ink, rime = 0, seed = 0) {
  const pts = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU, k = i % 2 ? 0.84 : 1.06 + 0.07 * Math.sin(i * 7.3 + seed);
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push(P2(cx + x * c - y * s, cy + x * s + y * c));
  }
  ctx.beginPath();
  spline(ctx, pts);
  ctx.fillStyle = col;
  ctx.fill();
  if (ink) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (rime > 0) {
    ctx.fillStyle = `rgba(246,251,255,${rime})`;
    for (let i = 0; i < pts.length; i += 2) circle(ctx, pts[i].x, pts[i].y, 2.2);
  }
  return pts;
}
// a leg: joint to joint, each bone its own width, outlined (all the ink first, then the fur, so joints don't seam)
function limb(ctx, pts, ws, col, ink) {
  ctx.lineCap = 'round';
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass ? col : ink;
    for (let i = 0; i < pts.length - 1; i++) {
      ctx.lineWidth = ws[i] + (pass ? 0 : 4);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }
  }
}
// a paw: a round foot pointing `dir`, two toe creases, claws out when it strikes
function drawPaw(ctx, p, dir, s, col, ink, claws = 0) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(dir);
  if (claws > 0.05) {
    ctx.fillStyle = `rgba(236,244,255,${claws})`;
    for (const dy of [-0.35, 0, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(s * 1.05, s * (dy - 0.12));
      ctx.lineTo(s * (1.55 + 0.1 * claws), s * (dy + 0.12));
      ctx.lineTo(s * 1.05, s * (dy + 0.14));
      ctx.fill();
    }
  }
  ctx.fillStyle = col;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(s * 0.35, -s * 0.05, s * 0.95, s * 0.58, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(26,32,48,0.5)';
  ctx.lineWidth = 1.4;
  for (const k of [0.62, 0.95]) {
    ctx.beginPath();
    ctx.moveTo(s * k, -s * 0.5);
    ctx.lineTo(s * (k + 0.06), s * 0.05);
    ctx.stroke();
  }
  ctx.restore();
}

// ——— what the art shows of the fight (set by src/fenrir.js from the 'final' message) ———
// po: its pose; p: the drawn pose's numbers, eased toward the pose's each frame (stepFenrirLook); eye: where its eyes
// were drawn last frame, in device pixels (src/fenrir.js draws them again over the dark)
const POSES = {
  // lift: body up (px), tilt: body (rad, up at the front), head: neck angle (rad, up), jaw 0–1, fore: forelegs forward,
  // crouch 0–1, rear 0–1, eyes 0–1 (open), lie 0–1, rest: head down on its paws, snow: a drift on its back, paw: the near
  // forepaw raised to strike, brace: hauled back against a fetter, ear: flattened, tongue: panting, tail: −1 low .. 1 up
  lie: { lift: 0, tilt: 0, head: 0, jaw: 0, fore: 0, crouch: 0, rear: 0, eyes: 0.35, lie: 1, rest: 0.8, snow: 1, paw: 0, brace: 0, ear: 0.3, tongue: 0, tail: -1 },
  stand: { lift: 0, tilt: 0, head: 0.1, jaw: 0.08, fore: 0, crouch: 0, rear: 0, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0, tongue: 0, tail: -0.4 },
  crouch: { lift: 0, tilt: -0.06, head: -0.2, jaw: 0.35, fore: 0.1, crouch: 1, rear: 0, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0.8, tongue: 0, tail: -0.7 },
  lunge: { lift: 34, tilt: 0.05, head: 0, jaw: 0.95, fore: 0.9, crouch: 0, rear: 0, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 1, tongue: 0, tail: 0.3 },
  pant: { lift: 0, tilt: -0.04, head: -0.3, jaw: 0.5, fore: 0.15, crouch: 0.3, rear: 0, eyes: 0.8, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0.2, tongue: 1, tail: -0.6 },
  claw: { lift: 0, tilt: 0.06, head: 0, jaw: 0.45, fore: 0.2, crouch: 0.2, rear: 0, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 1, brace: 0, ear: 0.8, tongue: 0, tail: -0.2 },
  strain: { lift: 0, tilt: -0.08, head: -0.05, jaw: 0.6, fore: 0.6, crouch: 0.3, rear: 0, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 0, brace: 1, ear: 1, tongue: 0, tail: -0.8 },
  howl: { lift: 0, tilt: 0.1, head: 1.2, jaw: 0.85, fore: -0.1, crouch: 0, rear: 0, eyes: 0.5, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0, tongue: 0, tail: 0 },
  breath: { lift: 0, tilt: -0.04, head: -0.12, jaw: 1, fore: 0.2, crouch: 0.3, rear: 0, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0.8, tongue: 0, tail: -0.4 },
  rear: { lift: 0, tilt: 0, head: 0.35, jaw: 0.55, fore: 0, crouch: 0, rear: 1, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0.5, tongue: 0, tail: 0.2 },
  stag: { lift: 0, tilt: -0.08, head: -0.5, jaw: 0.25, fore: 0.1, crouch: 0.5, rear: 0, eyes: 0.4, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0.9, tongue: 0.4, tail: -1 },
  ult: { lift: 0, tilt: 0.1, head: 0.9, jaw: 1, fore: 0, crouch: 0.1, rear: 0, eyes: 1, lie: 0, rest: 0, snow: 0, paw: 0, brace: 0, ear: 0.2, tongue: 0, tail: 0.4 },
  freed: { lift: 0, tilt: 0, head: 0, jaw: 0, fore: 0, crouch: 0, rear: 0, eyes: 0, lie: 1, rest: 1, snow: 0, paw: 0, brace: 0, ear: 0.3, tongue: 0, tail: -1 },
};
const look = { po: 'lie', enr: false, ph: 0, p: { ...POSES.lie }, eye: null, eyeS: 1, head: null };
export function setFenrirLook(o) {
  Object.assign(look, o);
}
export const fenrirLook = () => look;
export function stepFenrirLook(dt) {
  const to = POSES[look.po] ?? POSES.stand, k = Math.min(1, dt * (look.po === 'lunge' || look.po === 'claw' ? 14 : look.po === 'lie' || look.po === 'freed' ? 1.4 : 6));
  for (const key in to) look.p[key] += (to[key] - look.p[key]) * k;
}

// ——— the den ———
const rnd = mulberry32(5252);
const strata = Array.from({ length: 14 }, (_, i) => ({ y: 40 + i * 28 + rnd() * 10, a: 0.05 + rnd() * 0.06, w: 1 + rnd() * 3 }));
const frozen = [
  { kind: 'ribs', x: 300, y: 210, s: 1.1 },
  { kind: 'tree', x: 560, y: 150, s: 1 },
  { kind: 'post', x: 1000, y: 190, s: 1 },
  { kind: 'ribs', x: 1240, y: 150, s: 0.8 },
  { kind: 'tree', x: 1360, y: 230, s: 0.7 },
  { kind: 'antler', x: 190, y: 120, s: 0.9 },
];
const coldGlows = Array.from({ length: 8 }, () => ({ x: rnd() * FIN_W, y: 60 + rnd() * 280, r: 40 + rnd() * 60 }));
const motes = Array.from({ length: 26 }, () => ({ x: rnd() * FIN_W, y: rnd() * GROUND, s: 0.6 + rnd() * 1.2, v: 6 + rnd() * 10, ph: rnd() * 10 }));
// the wolf's old claw marks, gouged into the back wall round the middle: four long rakes at a time
const rakes = [{ x: 560, y: 120, a: 0.5, l: 150 }, { x: 905, y: 140, a: -0.45, l: 170 }, { x: 760, y: 70, a: 0.15, l: 120 }];
const GLYPHS = ['paw', 'roots', 'breath', 'beard']; // (each anchor's carving: one of the fetter's impossible things)

const BX0 = -60, BX1 = FIN_W + 60;
let bake = null;
function denLayer(res) {
  if (bake && bake.res === res) return bake.c;
  const c = bake?.c ?? document.createElement('canvas');
  c.width = Math.ceil((BX1 - BX0) * res);
  c.height = Math.ceil(H * res);
  const g = c.getContext('2d');
  g.setTransform(res, 0, 0, res, -BX0 * res, 0);
  drawDenStatic(g);
  bake = { res, c };
  return c;
}
function drawDenStatic(ctx) {
  const r = mulberry32(5253); // (its own stream: a rebake draws the same den)
  ctx.save();
  let g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#02040b');
  g.addColorStop(0.55, '#081328');
  g.addColorStop(1, '#10223e');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, 0, BX1 - BX0, GROUND + 4);
  // the old ice, layered like the pages of a book, faint cold glows deep inside it
  for (const s of strata) {
    ctx.strokeStyle = `rgba(${ICE},${s.a})`;
    ctx.lineWidth = s.w;
    ctx.beginPath();
    ctx.moveTo(BX0, s.y);
    for (let x = BX0; x <= BX1; x += 100) ctx.lineTo(x, s.y + Math.sin(x * 0.006 + s.y) * 8);
    ctx.stroke();
  }
  for (const c of coldGlows) glow(ctx, c.x, c.y, c.r, c.r * 0.7, ICE, 0.12);
  // things frozen in it, older than the hamlet: silhouettes only
  ctx.fillStyle = 'rgba(2,6,16,0.55)';
  ctx.strokeStyle = 'rgba(2,6,16,0.55)';
  for (const f of frozen) drawFrozen(ctx, f);
  // its claw marks in the wall: deep dark grooves with a pale scraped lip
  ctx.lineCap = 'round';
  for (const k of rakes) {
    for (let i = 0; i < 4; i++) {
      const ox = Math.cos(k.a) * 0 - Math.sin(k.a) * (i - 1.5) * 16, oy = Math.sin(k.a) * 0 + Math.cos(k.a) * (i - 1.5) * 16;
      const x0 = k.x + ox, y0 = k.y + oy, l = k.l * (i === 0 || i === 3 ? 0.8 : 1);
      const x1 = x0 + Math.cos(k.a + Math.PI / 2) * l, y1 = y0 + Math.sin(k.a + Math.PI / 2) * l;
      ctx.strokeStyle = 'rgba(160,200,240,0.16)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x0 + 2, y0 - 2);
      ctx.lineTo(x1 + 2, y1 - 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(1,3,10,0.75)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }
  // the side walls, darker
  for (const side of [-1, 1]) {
    const x = side < 0 ? BX0 : BX1, gg = ctx.createLinearGradient(x, 0, x - side * 160, 0);
    gg.addColorStop(0, 'rgba(1,2,6,0.95)');
    gg.addColorStop(1, 'rgba(1,2,6,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(side < 0 ? BX0 : FIN_W - 100, 0, 160, GROUND);
  }
  // the floor: bare rock scraped smooth, long scratches along it, deepest round the middle where it paces
  g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, '#2a3446');
  g.addColorStop(1, '#141a26');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, GROUND, BX1 - BX0, H - GROUND + 10);
  ctx.fillStyle = 'rgba(190,214,240,0.35)';
  ctx.fillRect(BX0, GROUND, BX1 - BX0, 2);
  ctx.strokeStyle = 'rgba(150,180,220,0.18)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) {
    const mid = i < 10, x = mid ? FEN_MID - 300 + r() * 500 : r() * FIN_W, y = GROUND + 10 + r() * 60, l = 60 + r() * 140;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + l, y + (r() - 0.5) * 6);
    ctx.stroke();
  }
  // the Long Stair's last steps, coming down into the west wall (the way out)
  ctx.fillStyle = '#0c1424';
  for (let i = 0; i < 5; i++) ctx.fillRect(DEN_EXIT_X - 70 + i * 12, GROUND - 120 + i * 24, 70, 24);
  ctx.fillStyle = '#01030a';
  ctx.beginPath();
  ctx.moveTo(DEN_EXIT_X - 42, GROUND + 2);
  ctx.lineTo(DEN_EXIT_X - 42, GROUND - 90);
  ctx.quadraticCurveTo(DEN_EXIT_X, GROUND - 140, DEN_EXIT_X + 42, GROUND - 90);
  ctx.lineTo(DEN_EXIT_X + 42, GROUND + 2);
  ctx.fill();
  text(ctx, 'OUT', DEN_EXIT_X, GROUND - 160, 13, '#dcecff');
  // the lamp posts (the lanterns and their light are live: src/fenrir.js)
  for (const x of LANTERN_X) drawPost(ctx, x);
  // the anchor stones
  ANCHORS.forEach((a, i) => drawAnchorStone(ctx, a, i));
  // the stone hand at its paws: the Keepers' pledge, palm up
  drawHand(ctx, FEN_MID + 190, GROUND);
  FENRIR_PLATFORMS.forEach((p) => drawLedge(ctx, p));
  ctx.restore();
}
function drawFrozen(ctx, f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.s, f.s);
  ctx.lineCap = 'round';
  if (f.kind === 'ribs') {
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-90, 0);
    ctx.lineTo(90, -10);
    ctx.stroke();
    ctx.lineWidth = 6;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(-80 + i * 26, -2);
      ctx.quadraticCurveTo(-70 + i * 26, 50, -95 + i * 26, 90);
      ctx.stroke();
    }
  } else if (f.kind === 'tree') {
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 120);
    ctx.lineTo(10, -40);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (const [a, l] of [[-0.6, 60], [0.5, 70], [-0.3, 40], [0.8, 45]]) {
      ctx.beginPath();
      ctx.moveTo(6, 0 - l * 0.3);
      ctx.lineTo(6 + Math.sin(a) * l, -l * 0.3 - Math.cos(a) * l);
      ctx.stroke();
    }
  } else if (f.kind === 'post') {
    ctx.fillRect(-8, -40, 16, 150);
    ctx.fillRect(-8, -40, 40, 10);
    ctx.fillRect(26, -30, 6, 20);
  } else if (f.kind === 'antler') {
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.quadraticCurveTo(-10, 0, -60, -30);
    ctx.moveTo(-20, 20);
    ctx.lineTo(-50, 10);
    ctx.moveTo(-35, -8);
    ctx.lineTo(-40, -50);
    ctx.stroke();
  }
  ctx.restore();
}
// a Keeper lamp post: grey stone, a carved band, an arm with a hook (the lantern hangs at LANTERN_Y: drawLantern)
function drawPost(ctx, x) {
  const top = LANTERN_Y - 52;
  ctx.fillStyle = '#3a4252';
  ctx.strokeStyle = '#121620';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND + 2);
  ctx.lineTo(x - 27, top + 4);
  ctx.lineTo(x - 15, top + 4);
  ctx.lineTo(x - 12, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,220,255,0.1)';
  ctx.fillRect(x - 26, top + 8, 3, GROUND - top - 12);
  ctx.fillStyle = '#4e5868';
  ctx.beginPath();
  ctx.roundRect(x - 33, GROUND - 14, 24, 14, 3);
  ctx.fill();
  ctx.stroke();
  for (const y of [top + 30, GROUND - 40]) {
    ctx.strokeStyle = 'rgba(150,180,220,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 27, y);
    ctx.lineTo(x - 15, y);
    ctx.moveTo(x - 27, y + 4);
    ctx.lineTo(x - 15, y + 4);
    ctx.stroke();
  }
  // the arm, a cap, the hook
  ctx.fillStyle = '#3a4252';
  ctx.strokeStyle = '#121620';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 28, top, 32, 7, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4e5868';
  ctx.beginPath();
  ctx.roundRect(x - 32, top - 7, 20, 9, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#1a1e28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, top + 7);
  ctx.lineTo(x, LANTERN_Y - 24);
  ctx.stroke();
}
// an anchor: a Keeper stone, a standing stone on the floor (even) or one set in the wall (odd), its carving faint until it
// glows (src/fenrir.js), a stone ring the fetter runs from
const anchorBox = (a, i) => {
  const low = i % 2 === 0, w = low ? 60 : 56, h = low ? 118 : 66;
  return { low, w, h, x: a.x - w / 2, y: low ? GROUND - h : a.y - h / 2 };
};
function drawAnchorStone(ctx, a, i) {
  const { low, w, h, x, y } = anchorBox(a, i);
  if (!low) {
    // set in the wall: a dark socket round it
    ctx.fillStyle = 'rgba(1,3,8,0.85)';
    ctx.beginPath();
    ctx.roundRect(x - 7, y - 7, w + 14, h + 14, 10);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#5a6274');
  g.addColorStop(1, '#3a4050');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#141820';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, low ? [20, 20, 4, 4] : 9);
  ctx.fill();
  ctx.stroke();
  // a carved border, the Keepers' frame
  ctx.strokeStyle = 'rgba(170,196,230,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 7, y + 8, w - 14, h - 16, low ? [14, 14, 3, 3] : 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,220,255,0.14)';
  ctx.fillRect(x + 4, y + 8, 4, h - 16);
  // the stone ring the fetter is tied to (on the face toward the middle)
  const rx = a.x + (a.x < FEN_MID ? w / 2 - 6 : -w / 2 + 6), ry = low ? y + 18 : a.y;
  ctx.strokeStyle = '#2a2e3a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(rx, ry, 8, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,196,230,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(rx, ry, 8, Math.PI, Math.PI * 1.6);
  ctx.stroke();
  // rime at its foot, frost on its top
  ctx.fillStyle = 'rgba(220,236,255,0.55)';
  if (low) ellipse(ctx, a.x, GROUND - 2, w * 0.62, 6);
  ellipse(ctx, a.x - 4, y + 3, w * 0.36, 4);
  drawGlyph(ctx, GLYPHS[i], a.x, a.y, 'rgba(160,190,230,0.45)', 1);
}
export function drawGlyph(ctx, kind, x, y, color, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'paw') { // (the sound of a cat's footfall: a pad, four toes and the rings of the sound going out)
    ellipse(ctx, 0, 6, 8, 6);
    for (const [dx, dy] of [[-9, -5], [-3, -10], [3, -10], [9, -5]]) {
      ellipse(ctx, dx, dy, 3, 3.5);
    }
    ctx.lineWidth = 1.5;
    for (const r of [17, 22]) {
      ctx.beginPath();
      ctx.arc(0, 2, r, -2.6, -0.55);
      ctx.stroke();
    }
  } else if (kind === 'roots') { // (the roots of a mountain: a peak, its roots spreading under it)
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(-3, -16);
    ctx.lineTo(1, -10);
    ctx.lineTo(5, -14);
    ctx.lineTo(13, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-9, 15);
    ctx.moveTo(0, 7);
    ctx.lineTo(8, 15);
    ctx.moveTo(-6, 0);
    ctx.lineTo(-12, 9);
    ctx.moveTo(6, 0);
    ctx.lineTo(12, 8);
    ctx.stroke();
  } else if (kind === 'breath') { // (the breath of a fish)
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.quadraticCurveTo(-2, 0, -12, -8);
    ctx.quadraticCurveTo(4, -2, 8, 8);
    ctx.stroke();
    for (const [dx, dy, r] of [[8, -6, 3], [12, -13, 2]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, TAU);
      ctx.stroke();
    }
  } else { // (the beard of a woman: a fall of lines)
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -12);
      ctx.quadraticCurveTo(i * 6 + 3, 0, i * 4, 14);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// an anchor straining (src/fenrir.js, while its ring is open): k 0–1 how far gone. A crack runs up the stone, branching,
// light leaking out of it, chips dropping off
export function drawAnchorCrack(ctx, i, k, t) {
  const a = ANCHORS[i], { w, h, x, y } = anchorBox(a, i), r = mulberry32(77 + i * 13);
  const pts = [P2(a.x + (r() - 0.5) * 8, y + h - 2)], n = 7;
  for (let j = 1; j <= n; j++) pts.push(P2(a.x + (r() - 0.5) * w * 0.5, y + h - 2 - (h - 4) * (j / n)));
  const m = Math.max(1, Math.round(n * clamp(k, 0, 1)));
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const crack = (lw, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let j = 1; j <= m; j++) ctx.lineTo(pts[j].x, pts[j].y);
    // branches off it
    for (let j = 2; j <= m; j += 2) {
      const s = j % 4 ? 1 : -1;
      ctx.moveTo(pts[j].x, pts[j].y);
      ctx.lineTo(pts[j].x + s * w * 0.28, pts[j].y - h * 0.08);
    }
    ctx.stroke();
  };
  crack(5 + 3 * k, `rgba(255,236,210,${0.25 + 0.35 * k + 0.15 * Math.sin(t * 12)})`); // (the light leaking out)
  crack(2.2, 'rgba(8,10,18,0.95)');
  // chips falling off it
  ctx.fillStyle = 'rgba(120,130,150,0.9)';
  for (let j = 0; j < 3; j++) {
    const ph = (t * 1.3 + j / 3) % 1, px = a.x + (j - 1) * w * 0.3;
    if (k > 0.3) ctx.fillRect(px, y + h * 0.3 + ph * (GROUND - y - h * 0.3), 3, 3);
  }
  ctx.restore();
}
// an anchor gone for good (a phase's snap): split down the middle, a dark gap, a slab of it fallen at its foot
export function drawAnchorSplit(ctx, i) {
  const a = ANCHORS[i], { low, w, h, x, y } = anchorBox(a, i);
  ctx.save();
  ctx.fillStyle = 'rgba(2,4,10,0.95)';
  ctx.beginPath();
  ctx.moveTo(a.x - 3, y - 2);
  for (let j = 1; j <= 5; j++) ctx.lineTo(a.x + (j % 2 ? 6 : -4), y + (h * j) / 5);
  for (let j = 5; j >= 0; j--) ctx.lineTo(a.x + (j % 2 ? 12 : 3), y + (h * j) / 5);
  ctx.closePath();
  ctx.fill();
  // the carving dead (a dark scar over it) and the slab
  ctx.strokeStyle = 'rgba(2,4,10,0.6)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(a.x - 14, a.y - 12);
  ctx.lineTo(a.x + 14, a.y + 12);
  ctx.stroke();
  const fy = low ? GROUND : y + h + 4;
  ctx.fillStyle = '#3e4454';
  ctx.strokeStyle = '#141820';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x + 2, fy);
  ctx.lineTo(a.x + 10, fy - 14);
  ctx.lineTo(a.x + 30, fy - 10);
  ctx.lineTo(a.x + 34, fy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawHand(ctx, x, y) {
  ctx.fillStyle = '#525a68';
  ctx.strokeStyle = '#1a1e28';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, y - 10, 36, 14, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(x - 30 + i * 15, y - 30 - (i === 1 || i === 2 ? 6 : 0), 11, 26, 5);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(x + 30, y - 22, 12, 18, 5);
  ctx.fill();
  ctx.stroke();
  // frost in its palm
  ctx.fillStyle = 'rgba(220,236,255,0.5)';
  ellipse(ctx, x - 4, y - 14, 18, 4);
}
function drawLedge(ctx, p) {
  const high = p.kind === 'high';
  ctx.fillStyle = 'rgba(140,190,240,0.85)';
  ctx.strokeStyle = '#0c1a30';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(p.x - 4, p.y - 4, p.w + 8, high ? 20 : 16, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,250,255,0.9)';
  ctx.fillRect(p.x + 6, p.y - 2, p.w - 12, 3);
  // icicles under it
  ctx.fillStyle = 'rgba(180,220,255,0.75)';
  for (let x = p.x + 8; x < p.x + p.w - 6; x += 14) {
    const l = 8 + ((x * 7) % 14);
    ctx.beginPath();
    ctx.moveTo(x - 4, p.y + 10);
    ctx.lineTo(x, p.y + 10 + l);
    ctx.lineTo(x + 4, p.y + 10);
    ctx.fill();
  }
}
function drawDenWolf(ctx, camX, viewW, time) {
  const L = camX - 80, R = camX + viewW + 80;
  const m = ctx.getTransform(), res = Math.round(Math.hypot(m.a, m.b) * 1000) / 1000;
  if (Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.a - m.d) < 1e-6 && res > 0) {
    const img = denLayer(res);
    const sx = clamp(Math.floor((L - BX0) * res), 0, img.width - 1), sw = Math.min(img.width - sx, Math.ceil((R - L) * res));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, 0, sw, img.height, Math.round(m.e + BX0 * res) + sx, Math.round(m.f), sw, img.height);
    ctx.restore();
  } else drawDenStatic(ctx);
  // ice dust drifting down
  ctx.fillStyle = 'rgba(220,236,255,0.5)';
  for (const d of motes) {
    const y = (d.y + time * d.v) % GROUND, x = d.x + Math.sin(time * 0.4 + d.ph) * 10;
    if (visible(x - 2, x + 2, L, R)) circle(ctx, x, y, d.s);
  }
}
export const DEN_ART = { wolf: drawDenWolf };

// ——— Fenrir ———
// (ctx, w, h, st, m): feet at the origin, facing +x; its pose from `look`. A wolf the size of the den's back wall,
// grey-white fur gone to rime at the tips, black lips, pale eyes in a dark mask under a heavy brow, a heavy Keeper
// collar of dark stone with the shard in its lock, its breath smoking (src/fenrir.js, over the dark). A skeleton (hip H,
// shoulder S, the body's axis between them, jointed legs, the neck and head) eased between the poses, so lying, standing,
// lunging, rearing and howling are one animal. The rear pose lifts the collar's shard to the weak point (MOBS.fenrir.weak).
const FUR = '#c3cdd9', FUR_D = '#8a96a6', FUR_L = '#eef4fa', FUR_FAR = '#76818f', SADDLE = '#a4b0be', INK = '#161c2a', LIP = '#0c1018';
function drawFenrir(ctx, w, h, st) {
  const P = look.p, t = st.t, dying = st.dying ?? 0;
  const lie = clamp(P.lie, 0, 1), rear = clamp(P.rear, 0, 1), brace = clamp(P.brace, 0, 1), crouch = clamp(P.crouch, 0, 1), raise = clamp(P.paw, 0, 1);
  const pant = clamp(P.tongue, 0, 1), breathe = Math.sin(t * lerp(1.6, 7, pant)) * (lie > 0.5 ? 2.5 : 2);
  const walk = st.walking && lie < 0.3 && rear < 0.3 ? t * 7 : null;
  const frame = () => {
    ctx.translate(0, -P.lift);
    ctx.translate(-w * 0.25, 0);
    ctx.rotate(-P.tilt * 0.5);
    ctx.translate(w * 0.25, 0);
  };
  ctx.save();
  frame();
  // the skeleton: hip and shoulder for this pose
  let Hp = P2(-0.24 * w - 0.05 * w * brace, -0.56 * h + 0.1 * h * crouch + 0.12 * h * brace);
  let S = P2(0.2 * w - 0.04 * w * brace + 0.02 * w * crouch, -0.6 * h + 0.15 * h * crouch + 0.06 * h * brace + 0.03 * h * raise);
  Hp = mixP(mixP(Hp, P2(-0.25 * w, -0.24 * h), lie), P2(-0.2 * w, -0.36 * h), rear);
  S = mixP(mixP(S, P2(0.14 * w, -0.27 * h), lie), P2(0.13 * w, -0.64 * h), rear);
  S.y += breathe * 0.5;
  const ax = S.x - Hp.x, ay = S.y - Hp.y, L = Math.hypot(ax, ay), ux = ax / L, uy = ay / L;
  const B = (a, b) => P2(Hp.x + ux * a - uy * b, Hp.y + uy * a + ux * b); // (a along the body from the hip, b across it: + is its belly)
  const torso = [
    B(-0.12 * w, 0.03 * h), B(-0.05 * w, -0.12 * h), B(L * 0.5, -0.12 * h - 0.02 * h * crouch), B(L - 0.02 * w, -0.19 * h - 0.05 * h * crouch), B(L + 0.09 * w, -0.15 * h),
    B(L + 0.15 * w, 0.03 * h), B(L + 0.06 * w, 0.2 * h), B(L * 0.45, 0.13 * h), B(0.03 * w, 0.17 * h), B(-0.1 * w, 0.13 * h),
  ];
  const torsoTop = (k) => { // (a point on its back: k 0 the croup .. 1 the withers)
    const a = lerp(-0.05 * w, L - 0.02 * w, k), b = lerp(-0.12 * h, -0.19 * h - 0.05 * h * crouch, k * k) - Math.sin(k * Math.PI) * 0.015 * h;
    return B(a, b);
  };
  const sw = (ph) => (walk == null ? 0 : Math.sin(walk + ph)), up = (ph) => (walk == null ? 0 : Math.max(0, Math.cos(walk + ph)) * 8);
  const hind = (dx, ph) => {
    const hip = B(0, 0.05 * h), pw = P2(Hp.x - 0.01 * w - 0.07 * w * brace + dx + sw(ph) * 0.06 * w, -up(ph));
    hip.x += dx * 0.5;
    const stand = [hip, P2(Hp.x + (0.09 + 0.03 * crouch) * w + dx, lerp(hip.y, pw.y, 0.45)), P2(Hp.x - 0.05 * w - 0.04 * w * brace + dx + sw(ph) * 0.03 * w, lerp(hip.y, pw.y, 0.8)), pw];
    const lying = [hip, P2(Hp.x + 0.13 * w + dx, -0.1 * h), P2(Hp.x - 0.07 * w + dx, -0.05 * h), P2(Hp.x + 0.05 * w + dx, -0.025 * h)];
    return stand.map((p, i) => mixP(p, lying[i], lie));
  };
  const fore = (dx, ph, near) => {
    const top = B(L + 0.02 * w, 0.1 * h), reach = P.fore * 0.12 * w + brace * 0.06 * w;
    top.x += dx * 0.5;
    const pw = P2(S.x + 0.08 * w + reach + dx + sw(ph) * 0.06 * w, -up(ph));
    let pts = [top, P2(S.x + 0.04 * w + reach * 0.3 + dx, lerp(top.y, 0, 0.5)), P2(S.x + 0.06 * w + reach * 0.8 + dx + sw(ph) * 0.04 * w, -0.09 * h - up(ph)), pw];
    const raised = [top, P2(S.x + 0.12 * w, S.y + 0.24 * h), P2(S.x + 0.24 * w, S.y + 0.2 * h), P2(S.x + 0.32 * w, S.y + 0.24 * h)];
    const tucked = [top, P2(S.x + 0.1 * w + dx, S.y + 0.2 * h), P2(S.x + 0.17 * w + dx, S.y + 0.3 * h), P2(S.x + 0.22 * w + dx, S.y + 0.26 * h)];
    const lying = [top, P2(S.x + 0.06 * w + dx, -0.05 * h), P2(S.x + 0.22 * w + dx, -0.045 * h), P2(S.x + 0.31 * w + dx, -0.03 * h)];
    if (near) pts = pts.map((p, i) => mixP(p, raised[i], raise));
    return pts.map((p, i) => mixP(mixP(p, lying[i], lie), tucked[i], rear));
  };
  const LEG = [0.1 * w, 0.07 * w, 0.055 * w], PAW = 0.048 * w;
  const pawDir = (near) => (near ? raise * 0.5 : 0) + rear * 0.9;
  const claws = clamp(Math.max(raise, P.fore > 0.5 && P.lift > 5 ? 1 : 0, rear), 0, 1);
  // the far legs, in shadow
  const hf = hind(0.06 * w, Math.PI), ff = fore(-0.07 * w, 0, false);
  limb(ctx, hf, LEG, FUR_FAR, INK);
  drawPaw(ctx, hf[3], 0, PAW, FUR_FAR, INK);
  limb(ctx, ff, LEG, FUR_FAR, INK);
  drawPaw(ctx, ff[3], pawDir(false), PAW, FUR_FAR, INK, claws * 0.8);
  // the tail: a heavy brush, low when it stalks, curled round its feet when it lies
  const tb = B(-0.1 * w, -0.06 * h), tl = (clamp(P.tail, -1, 1) + 1) / 2, sway = Math.sin(t * (1 + 3 * pant)) * 6;
  const tip = mixP(P2(tb.x - 0.22 * w, tb.y + lerp(0.36 * h, -0.14 * h, tl) + sway), P2(Hp.x + 0.12 * w, -0.035 * h), lie * 0.9);
  const tc = mixP(P2(tb.x - 0.17 * w, tb.y + 0.04 * h), P2(Hp.x - 0.2 * w, -0.06 * h), lie);
  ctx.lineCap = 'round';
  for (const [lw, col] of [[0.17 * h + 4, INK], [0.17 * h, SADDLE]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(tb.x, tb.y);
    ctx.quadraticCurveTo(tc.x, tc.y, tip.x, tip.y);
    ctx.stroke();
  }
  ctx.strokeStyle = FUR_L; // (its tip gone to rime)
  ctx.lineWidth = 0.13 * h;
  ctx.beginPath();
  ctx.moveTo(lerp(tc.x, tip.x, 0.55), lerp(tc.y, tip.y, 0.55));
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  // the body: a grey saddle over a pale belly
  const g = ctx.createLinearGradient(0, Math.min(Hp.y, S.y) - 0.2 * h, 0, Math.max(Hp.y, S.y) + 0.2 * h);
  g.addColorStop(0, SADDLE);
  g.addColorStop(0.55, FUR);
  g.addColorStop(1, FUR_L);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  spline(ctx, torso);
  ctx.fill();
  ctx.stroke();
  // hackles: rime-tipped fur standing up along its back, higher when it's about to go
  ctx.fillStyle = 'rgba(238,246,252,0.9)';
  for (let i = 0; i < 16; i++) {
    const k = 0.3 + (i / 15) * 0.75, top = torsoTop(k), hk = (3 + 5 * k) * (1 + crouch + brace * 0.6) + (i % 2) * 2;
    ctx.beginPath();
    ctx.moveTo(top.x - 4, top.y + 3);
    ctx.quadraticCurveTo(top.x - 4, top.y - hk * 0.6, top.x - 7, top.y - hk);
    ctx.quadraticCurveTo(top.x + 1, top.y - hk * 0.4, top.x + 4, top.y + 3);
    ctx.fill();
  }
  // the near legs: a haunch over the hind leg, the shoulder over the foreleg
  const hn = hind(0, 0), fn = fore(0, Math.PI, true);
  limb(ctx, hn.slice(1), LEG.slice(1), FUR, INK);
  drawPaw(ctx, hn[3], 0, PAW, FUR_L, INK);
  const hc = B(0.01 * w, 0.02 * h), ba = Math.atan2(uy, ux);
  ctx.strokeStyle = 'rgba(22,28,42,0.45)'; // (the line of its thigh, and its shoulder)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(hc.x, hc.y, 0.11 * w, 0.15 * h, ba + 0.3, -0.2, 1.6);
  ctx.stroke();
  const sc = B(L - 0.01 * w, 0.0);
  ctx.beginPath();
  ctx.ellipse(sc.x, sc.y, 0.08 * w, 0.14 * h, ba - 0.2, -0.9, 0.9);
  ctx.stroke();
  limb(ctx, fn, LEG, FUR, INK);
  drawPaw(ctx, fn[3], pawDir(true), PAW, FUR_L, INK, claws);
  // a drift on its back while it lies still (a snowdrift with eyes): it slides off as it gets up
  const snow = clamp(P.snow, 0, 1);
  if (snow > 0.02) {
    ctx.fillStyle = `rgba(240,247,255,${0.95 * snow})`;
    for (const [k, rx, ry] of [[0.05, 0.1, 0.06], [0.35, 0.12, 0.08], [0.62, 0.09, 0.05], [0.85, 0.1, 0.07]]) {
      const p = torsoTop(k);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 2, rx * w, ry * h, 0, Math.PI, TAU);
      ctx.fill();
    }
  }
  // the neck, its ruff, the collar, the head
  const N0 = B(L + 0.05 * w, -0.08 * h), rest = clamp(P.rest, 0, 1);
  const nd = -0.55 - P.head * 0.75, nl = 0.24 * h;
  const HC = mixP(P2(N0.x + Math.cos(nd) * nl, N0.y + Math.sin(nd) * nl), P2(S.x + 0.21 * w, -0.115 * h), rest);
  const ma = lerp(0.2 - P.head * 1.05, 0.06, rest), hr = 0.155 * h;
  for (const [lw, col] of [[0.27 * h + 4, INK], [0.27 * h, FUR]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(N0.x - 0.04 * w, N0.y + 0.06 * h);
    ctx.lineTo(HC.x, HC.y);
    ctx.stroke();
  }
  const dx = HC.x - N0.x, dy = HC.y - N0.y, dl = Math.hypot(dx, dy) || 1, d = P2(dx / dl, dy / dl), n = P2(-d.y, d.x);
  const RC = mixP(N0, HC, 0.3);
  fluff(ctx, RC.x, RC.y, 0.15 * h, 0.2 * h, Math.atan2(d.y, d.x), 9, FUR_L, 'rgba(22,28,42,0.7)', 0.9, 3);
  // the Keeper collar: dark stone blocks round its neck, the lock at its throat with the shard in it
  const CC = mixP(N0, HC, 0.5);
  ctx.save();
  ctx.translate(CC.x, CC.y);
  ctx.rotate(Math.atan2(n.y, n.x));
  ctx.fillStyle = '#2a2e38';
  ctx.strokeStyle = '#07090e';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 1; i++) {
    ctx.beginPath();
    ctx.roundRect(i * 0.085 * h - 0.003 * h, -0.055 * h, 0.08 * h, 0.11 * h, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(160,190,230,0.4)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-0.17 * h, -0.025 * h);
  ctx.lineTo(0.16 * h, -0.025 * h);
  ctx.moveTo(-0.17 * h, 0.025 * h);
  ctx.lineTo(0.16 * h, 0.025 * h);
  ctx.stroke();
  ctx.fillStyle = '#3a404c';
  ctx.beginPath();
  ctx.roundRect(0.12 * h, -0.07 * h, 0.08 * h, 0.14 * h, 5);
  ctx.fill();
  ctx.strokeStyle = '#07090e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const sh = P2(CC.x + n.x * 0.16 * h, CC.y + n.y * 0.16 * h);
  look.collar = ctx.getTransform().transformPoint(new DOMPoint(CC.x, CC.y)); // (where the fetters run to: src/fenrir.js)
  glow(ctx, sh.x, sh.y, 22 + rear * 14, 22 + rear * 14, '255,236,180', 0.45 + 0.2 * Math.sin(t * 3) + rear * 0.4);
  ctx.fillStyle = '#fff2c8';
  ctx.beginPath();
  ctx.moveTo(sh.x, sh.y - 8);
  ctx.lineTo(sh.x + 5, sh.y);
  ctx.lineTo(sh.x, sh.y + 8);
  ctx.lineTo(sh.x - 5, sh.y);
  ctx.closePath();
  ctx.fill();
  // the head
  ctx.save();
  ctx.translate(HC.x, HC.y);
  ctx.rotate(ma);
  drawWolfHead(ctx, hr, P, t, dying, snow);
  ctx.restore();
  ctx.restore();
  return () => {
    ctx.save();
    frame();
    spline(ctx, torso);
    ctx.moveTo(HC.x + hr * 1.3, HC.y);
    ctx.arc(HC.x, HC.y, hr * 1.3, 0, TAU);
    ctx.restore();
  };
}
// The head, in its own frame: the skull's middle at the origin, the muzzle along +x, hr its size
function drawWolfHead(ctx, hr, P, t, dying, snow) {
  const jaw = clamp(P.jaw, 0, 1) * 0.62, ear = clamp(P.ear, 0, 1), open = clamp(P.eyes, 0, 1), snarl = clamp(P.jaw * 1.4 - 0.2, 0, 1);
  const X = (v) => v * hr;
  // the cheek ruff behind it
  fluff(ctx, X(-0.45), X(0.2), X(0.95), X(1.0), 0.2, 8, FUR, INK, 0.8, 9);
  // ears: tall and pointed, laid back when it means it
  for (const [ex, ey, col] of [[-0.55, -0.62, FUR_D], [-0.15, -0.78, FUR]]) {
    ctx.save();
    ctx.translate(X(ex), X(ey));
    ctx.rotate(-0.15 - ear * 0.95);
    ctx.fillStyle = col;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(-0.3), X(0.1));
    ctx.quadraticCurveTo(X(-0.25), X(-0.6), X(0.02), X(-0.98));
    ctx.quadraticCurveTo(X(0.28), X(-0.5), X(0.34), X(0.08));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(40,46,60,0.7)';
    ctx.beginPath();
    ctx.moveTo(X(-0.14), X(0.02));
    ctx.quadraticCurveTo(X(-0.1), X(-0.45), X(0.02), X(-0.72));
    ctx.quadraticCurveTo(X(0.16), X(-0.4), X(0.18), X(0.02));
    ctx.fill();
    ctx.restore();
  }
  // inside its mouth (dark), then the lower jaw swinging open about its hinge
  const hinge = P2(X(0.35), X(0.4)), tipA = jaw, jx = hinge.x + Math.cos(tipA) * X(1.75), jy = hinge.y + Math.sin(tipA) * X(1.75);
  if (jaw > 0.04) {
    ctx.fillStyle = '#2a1018';
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y);
    ctx.lineTo(X(2.05), X(0.42));
    ctx.lineTo(jx, jy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.save();
  ctx.translate(hinge.x, hinge.y);
  ctx.rotate(tipA);
  ctx.fillStyle = FUR_D;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(X(-0.15), X(-0.05));
  ctx.quadraticCurveTo(X(0.9), X(-0.04), X(1.72), X(0));
  ctx.quadraticCurveTo(X(1.82), X(0.2), X(1.55), X(0.3));
  ctx.quadraticCurveTo(X(0.7), X(0.45), X(-0.05), X(0.35));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LIP;
  ctx.fillRect(X(0.2), X(-0.06), X(1.45), X(0.07));
  if (jaw > 0.06) { // (teeth along it, a lower fang)
    ctx.fillStyle = '#f2f7ff';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(X(0.55 + i * 0.2), X(-0.04));
      ctx.lineTo(X(0.62 + i * 0.2), X(-0.17));
      ctx.lineTo(X(0.69 + i * 0.2), X(-0.04));
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(X(1.38), X(-0.03));
    ctx.lineTo(X(1.47), X(-0.36));
    ctx.lineTo(X(1.56), X(-0.03));
    ctx.fill();
  }
  if (P.tongue > 0.05) { // (panting: the tongue lolls out over its lower teeth)
    const k = clamp(P.tongue, 0, 1), wob = Math.sin(t * 7) * X(0.05);
    ctx.fillStyle = '#c2667a';
    ctx.strokeStyle = '#4a1a26';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(0.9), X(-0.05));
    ctx.quadraticCurveTo(X(1.6), X(0.0), X(1.7) + wob, X(0.1 + 0.55 * k));
    ctx.quadraticCurveTo(X(1.45), X(0.2 + 0.5 * k) + wob, X(1.2), X(0.12));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  // skull and muzzle
  ctx.fillStyle = FUR;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(X(-0.85), X(0.55));
  ctx.bezierCurveTo(X(-1.0), X(-0.4), X(-0.55), X(-0.95), X(0.1), X(-0.88));
  ctx.quadraticCurveTo(X(0.55), X(-0.85), X(0.82), X(-0.5));
  ctx.quadraticCurveTo(X(1.4), X(-0.42 + 0.06 * snarl), X(2.05), X(-0.22));
  ctx.quadraticCurveTo(X(2.4), X(-0.18), X(2.38), X(0.12));
  ctx.quadraticCurveTo(X(2.3), X(0.44), X(1.95), X(0.43));
  ctx.lineTo(X(0.55), X(0.5));
  ctx.quadraticCurveTo(X(0.1), X(0.82), X(-0.35), X(0.78));
  ctx.quadraticCurveTo(X(-0.75), X(0.75), X(-0.85), X(0.55));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // pale fur on its muzzle and cheek, rime on its brow
  ctx.fillStyle = FUR_L;
  ellipse(ctx, X(1.3), X(0.25), X(0.75), X(0.17), -0.04);
  ellipse(ctx, X(0.05), X(0.5), X(0.45), X(0.22), 0.2);
  if (snow > 0.02) {
    ctx.fillStyle = `rgba(240,247,255,${0.95 * snow})`;
    ellipse(ctx, X(-0.2), X(-0.84), X(0.5), X(0.13));
  }
  // the upper fang, a little of it showing even shut; the snarl's creases when it bares them
  ctx.fillStyle = '#f2f7ff';
  ctx.strokeStyle = 'rgba(22,28,42,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(1.5), X(0.43));
  ctx.lineTo(X(1.6), X(0.6 + 0.25 * snarl));
  ctx.lineTo(X(1.72), X(0.43));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (jaw > 0.06) for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(X(0.8 + i * 0.22), X(0.46));
    ctx.lineTo(X(0.87 + i * 0.22), X(0.6));
    ctx.lineTo(X(0.94 + i * 0.22), X(0.46));
    ctx.fill();
  }
  if (snarl > 0.05) {
    ctx.strokeStyle = `rgba(22,28,42,${0.6 * snarl})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(X(1.0 + i * 0.2), X(-0.42 + i * 0.03));
      ctx.quadraticCurveTo(X(1.08 + i * 0.2), X(-0.3), X(1.02 + i * 0.2), X(-0.22 + i * 0.02));
      ctx.stroke();
    }
  }
  // black lips and nose
  ctx.strokeStyle = LIP;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X(0.5), X(0.5));
  ctx.quadraticCurveTo(X(1.2), X(0.5), X(2.0), X(0.42));
  ctx.stroke();
  ctx.fillStyle = LIP;
  ellipse(ctx, X(2.24), X(-0.04), X(0.2), X(0.15));
  ctx.fillStyle = 'rgba(200,214,240,0.5)';
  ellipse(ctx, X(2.18), X(-0.1), X(0.07), X(0.04));
  // the eye: a dark mask, a heavy brow slanting down at it, the eye pale and pupil-less
  const E = P2(X(0.48), X(-0.3));
  ctx.fillStyle = 'rgba(36,44,62,0.7)';
  ellipse(ctx, E.x, E.y, X(0.36), X(0.21), 0.15);
  if (open > 0.08) {
    glow(ctx, E.x, E.y, X(0.4), X(0.3), '220,240,255', 0.5 * open);
    ctx.fillStyle = '#eef9ff';
    ctx.beginPath();
    ctx.moveTo(E.x - X(0.25), E.y - X(0.06));
    ctx.quadraticCurveTo(E.x - X(0.02), E.y - X(0.2) * open, E.x + X(0.25), E.y + X(0.03));
    ctx.quadraticCurveTo(E.x, E.y + X(0.12) * open, E.x - X(0.25), E.y - X(0.06));
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(12,16,24,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(E.x - X(0.2), E.y + X(0.02));
    ctx.quadraticCurveTo(E.x, E.y + X(0.08), E.x + X(0.2), E.y - X(0.02));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(16,20,30,0.85)';
  ctx.lineWidth = X(0.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(E.x - X(0.3), E.y - X(0.33));
  ctx.quadraticCurveTo(E.x, E.y - X(0.3), E.x + X(0.32), E.y - X(0.13 - 0.06 * snarl));
  ctx.stroke();
  // the last fetter, held in its teeth (phase 4): its frayed end hangs out of its jaws, shining
  if (look.ph >= 3 && dying < 0.5) {
    const M = P2(X(1.55), X(0.45));
    glow(ctx, M.x, M.y, X(0.6), X(0.5), FETTER, 0.55 + 0.2 * Math.sin(t * 5));
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const sw = Math.sin(t * 2.4 + i * 1.3) * X(0.08);
      ctx.strokeStyle = `rgba(${FETTER},${0.95 - i * 0.12})`;
      ctx.lineWidth = i ? 1.2 : 3;
      ctx.beginPath();
      ctx.moveTo(M.x, M.y);
      ctx.quadraticCurveTo(M.x - X(0.2 + i * 0.1), M.y + X(0.5), M.x - X(0.45 + i * 0.12) + sw, M.y + X(0.85 + i * 0.1));
      ctx.stroke();
    }
  }
  const T = ctx.getTransform();
  look.eye = T.transformPoint(new DOMPoint(E.x, E.y));
  look.muzzle = T.transformPoint(new DOMPoint(X(1.55), X(0.45)));
  look.eyeS = Math.hypot(T.a, T.b) * hr;
}
export const BOSS_ART = { fenrir: drawFenrir };

// ——— Skoll and Hati: two shadow wolves, made of the dark itself (smoke wisps trailing off them) ———
// Skoll, who hunts the sun: long and lean, a flaring mane like a dark corona with a gold rim, sun-gold slit eyes, sparks
// off its tail. Hati, who hunts the moon: heavier and rounder, a pale crescent on its brow, round moon-white eyes, a
// silver rim and mist trailing off it. (ctx, w, h, t, seed, m, dying) like any mob's art; returns the hit flash's outline.
const SONS = {
  skoll: { eye: '255,206,110', rim: '255,190,90', len: 1.18, deep: 0.2, mane: 1, crescent: false, trail: '255,170,70', slit: true },
  hati: { eye: '232,242,255', rim: '200,220,255', len: 0.98, deep: 0.27, mane: 0.4, crescent: true, trail: '170,190,230', slit: false },
};
function son(kind) {
  const o = SONS[kind];
  return (ctx, w, h, t, seed, m, dying) => {
    const live = dying < 0.05, run = (!!m.charging || !!m.walking) && live, warn = !!m.warn && live;
    const gait = run ? t * (m.charging ? 20 : 12) + seed : 0, crouch = warn ? h * 0.08 : 0;
    const cy = -h * 0.56 + crouch, bx = w * 0.4 * o.len, by = h * o.deep, SH = '#06080e', SH2 = '#121828';
    ctx.save();
    // the shadow it's made of, hanging round it, and smoke streaming off behind
    glow(ctx, 0, cy, bx * 1.5, by * 2.6, '0,0,6', 0.55);
    for (let i = 0; i < 7; i++) {
      const ph = (t * (run ? 1.6 : 0.6) + i / 7) % 1, sx = -bx * (0.6 + ph * 1.4), sy = cy - by * 0.6 + Math.sin(i * 2.3 + t * 2) * by * 0.8 - ph * 14;
      ctx.fillStyle = `rgba(6,8,16,${0.55 * (1 - ph)})`;
      circle(ctx, sx, sy, 6 + ph * 10);
    }
    // legs (thin, jointed, a little ragged)
    const legs = [[-0.3, 0, 1], [0.27, Math.PI, 1], [-0.24, Math.PI, 0], [0.33, 0, 0]];
    for (const [lx, ph, far] of legs) {
      const s = Math.sin(gait + ph) * (gait ? 0.5 : 0), lift = gait ? Math.max(0, Math.cos(gait + ph)) * 6 : 0;
      const top = P2(w * lx, cy + by * 0.3), knee = P2(w * lx + Math.sin(s) * h * 0.14 + (lx < 0 ? w * 0.04 : 0), cy + by * 0.3 + h * 0.22), foot = P2(w * lx + Math.sin(s) * h * 0.3, -lift);
      limb(ctx, [top, knee, foot], [w * 0.075, w * 0.05], far ? '#03040a' : SH, '#000000');
    }
    // tail: a ragged plume
    ctx.strokeStyle = SH;
    ctx.lineCap = 'round';
    ctx.lineWidth = h * 0.16;
    ctx.beginPath();
    ctx.moveTo(-bx * 0.8, cy - by * 0.2);
    ctx.quadraticCurveTo(-bx * 1.25, cy - (run ? by * 0.5 : -by * 0.5), -bx * 1.55, cy + (run ? -by * 0.6 : by * 1.1) + Math.sin(t * 3 + seed) * 4);
    ctx.stroke();
    // the body
    const body = () => ctx.ellipse(0, cy, bx, by, 0, 0, TAU);
    ctx.fillStyle = SH;
    ctx.beginPath();
    body();
    ctx.fill();
    // rim light along its back (the stolen light it's after)
    ctx.strokeStyle = `rgba(${o.rim},0.55)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, cy, bx, by, 0, Math.PI * 1.08, Math.PI * 1.9);
    ctx.stroke();
    // Skoll's corona of a mane, Hati's short ruff
    const hx = bx * 0.92, hy = cy - by * 0.7 + crouch * 0.5, hr = h * (kind === 'hati' ? 0.25 : 0.22);
    fluff(ctx, hx - hr * 0.55, hy + hr * 0.25, hr * (1 + 0.35 * o.mane), hr * (1.1 + 0.35 * o.mane), 0.3, 6 + Math.round(o.mane * 3), SH2, o.mane > 0.5 ? `rgba(${o.rim},${0.4 + 0.15 * Math.sin(t * 5)})` : null, 0, seed * 7);
    // the head: Skoll's long and narrow, Hati's short and broad
    const ml = kind === 'hati' ? 1.75 : 2.3;
    ctx.fillStyle = SH;
    ctx.beginPath();
    ctx.moveTo(hx - hr, hy + hr * 0.7);
    ctx.quadraticCurveTo(hx - hr * 0.7, hy - hr * 1.05, hx + hr * 0.35, hy - hr * 0.7);
    ctx.quadraticCurveTo(hx + hr * (ml - 0.2), hy - hr * 0.3, hx + hr * ml, hy + hr * 0.2);
    ctx.quadraticCurveTo(hx + hr * (ml - 0.9), hy + hr * 0.85, hx - hr * 0.2, hy + hr * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${o.rim},0.4)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (const d of [0, 1]) { // (ears up, pinned back when it runs)
      ctx.save();
      ctx.translate(hx - hr * 0.25 + d * hr * 0.45, hy - hr * 0.72);
      ctx.rotate(run ? -0.9 : warn ? -0.5 : -0.1);
      ctx.fillStyle = d ? SH : '#020306';
      ctx.beginPath();
      ctx.moveTo(-hr * 0.3, 0);
      ctx.lineTo(-hr * 0.02, -hr * 0.95);
      ctx.lineTo(hr * 0.3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (warn || m.charging) { // (bared teeth)
      ctx.fillStyle = '#e8f0ff';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + hr * (ml - 1.1 + i * 0.28), hy + hr * 0.5);
        ctx.lineTo(hx + hr * (ml - 1.0 + i * 0.28), hy + hr * 0.78);
        ctx.lineTo(hx + hr * (ml - 0.9 + i * 0.28), hy + hr * 0.5);
        ctx.fill();
      }
    }
    if (o.crescent) { // (Hati: a pale crescent on its brow)
      ctx.fillStyle = 'rgba(226,236,255,0.85)';
      ctx.beginPath();
      ctx.arc(hx - hr * 0.05, hy - hr * 0.42, hr * 0.26, 0, TAU);
      ctx.fill();
      ctx.fillStyle = SH;
      ctx.beginPath();
      ctx.arc(hx + hr * 0.05, hy - hr * 0.5, hr * 0.22, 0, TAU);
      ctx.fill();
    }
    // the eyes, and their light streaking back when it runs
    const ex = hx + hr * 0.7, ey = hy - hr * 0.12;
    if (live) {
      glow(ctx, ex, ey, hr * 0.9, hr * 0.7, o.eye, 0.75);
      if (run) {
        ctx.strokeStyle = `rgba(${o.eye},0.45)`;
        ctx.lineWidth = hr * 0.14;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hr * 2.2, ey - hr * 0.1);
        ctx.stroke();
      }
      ctx.fillStyle = `rgb(${o.eye})`;
      if (o.slit) {
        ctx.beginPath();
        ctx.moveTo(ex - hr * 0.24, ey + hr * 0.04);
        ctx.quadraticCurveTo(ex, ey - hr * 0.16, ex + hr * 0.24, ey - hr * 0.06);
        ctx.quadraticCurveTo(ex, ey + hr * 0.08, ex - hr * 0.24, ey + hr * 0.04);
        ctx.fill();
      } else circle(ctx, ex, ey, hr * 0.15);
    }
    // Skoll's sparks off its tail, Hati's mist
    for (let i = 0; i < 5; i++) {
      const ph = (t * 1.1 + i / 5 + seed) % 1;
      ctx.fillStyle = `rgba(${o.trail},${(o.slit ? 0.8 : 0.35) * (1 - ph)})`;
      circle(ctx, -bx * 1.5 - ph * 30, cy + Math.sin(i * 3 + t) * 10 - ph * 16, o.slit ? 2 : 6 + ph * 6);
    }
    ctx.restore();
    return () => {
      ctx.beginPath();
      body();
      ctx.moveTo(hx + hr * 1.6, hy);
      ctx.ellipse(hx + hr * 0.6, hy, hr * 1.4, hr, 0, 0, TAU);
    };
  };
}
export const SON_ART = { skoll: son('skoll'), hati: son('hati') };

// ——— the dark (one low-resolution layer, rebuilt only when the light changes) ———
const DARK_RES = 0.25;
let dark = null; // { key, c }
export function drawDark(ctx, light, level) {
  const key = light.map((v) => Math.round(v * 10)).join('') + Math.round(level * 20);
  if (!dark || dark.key !== key) {
    const c = dark?.c ?? document.createElement('canvas');
    c.width = Math.ceil((FIN_W + 200) * DARK_RES);
    c.height = Math.ceil(H * DARK_RES);
    const g = c.getContext('2d');
    g.setTransform(DARK_RES, 0, 0, DARK_RES, 100 * DARK_RES, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(-100, 0, FIN_W + 200, H);
    g.fillStyle = `rgba(2,4,12,${level})`;
    g.fillRect(-100, 0, FIN_W + 200, H);
    g.globalCompositeOperation = 'destination-out';
    LANTERN_X.forEach((x, i) => {
      if (light[i] <= 0.02) return;
      g.save();
      g.translate(x, LANTERN_Y - 20);
      g.scale(LIGHT_R + 30, 300);
      const gr = g.createRadialGradient(0, 0, 0.55, 0, 0, 1);
      gr.addColorStop(0, `rgba(0,0,0,${light[i]})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, 1, 0, TAU);
      g.fill();
      g.restore();
    });
    dark = { key, c };
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(dark.c, -100, 0, FIN_W + 200, H);
  ctx.restore();
}

// a lantern on its hook: a cutters' lamp in a Keeper cage (a peaked cap, three bars, glass). Lit: a flame, its glow and
// a warm pool on the floor; dark: cold iron, frost on the glass; relighting (fill): an ember growing
export function drawLantern(ctx, x, lit, fill, t, hurt = 0) {
  const y = LANTERN_Y;
  if (lit > 0.02) {
    glow(ctx, x, GROUND - 4, LIGHT_R * 0.75, 22, '255,200,130', 0.3 * lit); // (its pool on the floor)
    glow(ctx, x, y + 10, LIGHT_R * 0.7, 80, '255,214,150', 0.18 * lit);
    glow(ctx, x, y, 34, 34, '255,220,160', 0.7 * lit);
  }
  ctx.strokeStyle = '#0c0e14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 21, 3.5, 0, TAU); // (its ring on the hook)
  ctx.stroke();
  ctx.fillStyle = '#2a2f3a';
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 12);
  ctx.lineTo(x, y - 20);
  ctx.lineTo(x + 13, y - 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the glass
  ctx.fillStyle = lit > 0.02 ? `rgba(255,${Math.round(200 + 40 * Math.sin(t * 9 + x))},140,${0.4 + 0.6 * lit})` : fill > 0 ? `rgba(255,150,80,${0.25 + 0.6 * fill})` : 'rgba(20,30,48,0.95)';
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 12, 18, 22, 3);
  ctx.fill();
  if (lit > 0.02) {
    ctx.fillStyle = '#fff6dc';
    const f = 1 + 0.15 * Math.sin(t * 13 + x);
    ellipse(ctx, x, y, 2.8, 5.5 * f);
  } else if (fill > 0) {
    glow(ctx, x, y + 4, 8 + 6 * fill, 8 + 6 * fill, '255,150,80', 0.5 * fill);
    ctx.fillStyle = `rgba(255,190,110,${0.5 + 0.5 * fill})`;
    circle(ctx, x, y + 4, 1.5 + 2.5 * fill);
  } else {
    ctx.fillStyle = 'rgba(210,230,255,0.45)'; // (frost on the cold glass)
    for (const [dx, dy] of [[-5, -7], [4, -4], [-2, 3], [5, 5]]) circle(ctx, x + dx, y + dy, 1.4);
  }
  // the cage: its bars and its base
  ctx.strokeStyle = '#1a1e28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 12, 18, 22, 3);
  for (const dx of [-3, 3]) {
    ctx.moveTo(x + dx, y - 12);
    ctx.lineTo(x + dx, y + 10);
  }
  ctx.stroke();
  ctx.fillStyle = '#3a404c';
  ctx.beginPath();
  ctx.roundRect(x - 11, y + 9, 22, 5, 2);
  ctx.fill();
  if (hurt > 0.01) glow(ctx, x, y, 26, 26, '255,255,255', 0.6 * hurt);
}

// a fetter: a ribbon of pale light, thin as silk, from an anchor to its collar. It twists as it runs (its width swells
// and pinches) and a shimmer travels along it; taut (straining) it runs hot and straight
export function drawFetter(ctx, x0, y0, x1, y1, t, taut = 0, a = 1) {
  const sag = (1 - taut) * 50, mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag, N = 22;
  const rgb = taut > 0.5 ? '255,232,214' : FETTER;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${rgb},${0.12 + 0.1 * taut})`;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.stroke();
  // the ribbon itself
  const pt = (k) => {
    const u = 1 - k;
    return P2(u * u * x0 + 2 * u * k * mx + k * k * x1, u * u * y0 + 2 * u * k * my + k * k * y1);
  };
  const side = [], back = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N, p = pt(k), q = pt(Math.min(1, k + 0.01)), r = pt(Math.max(0, k - 0.01));
    const tx = q.x - r.x, ty = q.y - r.y, tl = Math.hypot(tx, ty) || 1, wd = 0.5 + 2.6 * Math.abs(Math.cos(k * 9 + t * 1.4 + x0 * 0.01));
    side.push(P2(p.x - (ty / tl) * wd, p.y + (tx / tl) * wd));
    back.push(P2(p.x + (ty / tl) * wd, p.y - (tx / tl) * wd));
  }
  ctx.fillStyle = `rgba(${rgb},${0.7 + 0.15 * Math.sin(t * 3 + x0)})`;
  ctx.beginPath();
  ctx.moveTo(side[0].x, side[0].y);
  for (const p of side) ctx.lineTo(p.x, p.y);
  for (let i = back.length - 1; i >= 0; i--) ctx.lineTo(back[i].x, back[i].y);
  ctx.closePath();
  ctx.fill();
  // a shimmer running along it, toward the wolf
  const s = (t * 0.35 + x0 * 0.001) % 1, sp = pt(s);
  glow(ctx, sp.x, sp.y, 12, 12, '255,255,255', 0.7);
  ctx.restore();
}

// the reach's end: a line of frost on the floor (and a faint wall of cold over it)
export function drawFrostLine(ctx, x, t, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND);
  g.addColorStop(0, `rgba(${FROST},0)`);
  g.addColorStop(1, `rgba(${FROST},0.16)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - 6, GROUND - 120, 12, 120);
  ctx.strokeStyle = `rgba(${FROST},${0.7 + 0.2 * Math.sin(t * 2 + x)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = -4; i <= 4; i++) {
    const yy = GROUND + 2 + (i % 2 ? -4 : 0);
    if (i === -4) ctx.moveTo(x + i * 6, yy);
    else ctx.lineTo(x + i * 6, yy);
  }
  ctx.stroke();
  // frost crystals along it
  ctx.fillStyle = `rgba(${FROST},0.85)`;
  for (let i = 0; i < 4; i++) {
    const yy = GROUND - 6 - i * 9;
    ctx.beginPath();
    ctx.moveTo(x - 3, yy);
    ctx.lineTo(x, yy - 7);
    ctx.lineTo(x + 3, yy);
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
function fang(ctx, x, h, w = 14) {
  ctx.fillStyle = 'rgba(214,236,255,0.95)';
  ctx.strokeStyle = 'rgba(30,60,110,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, GROUND + 2);
  ctx.lineTo(x + Math.sin(x) * 3, GROUND - h);
  ctx.lineTo(x + w / 2, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
// Swallow the Light: the flames bend toward its mouth; all but two pools (green) will go dark, fangs pushing up in the dark
function swallowWarn(ctx, e, k) {
  const keep = e.keep ?? [], pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  const safe = (x) => keep.some((i) => Math.abs(x - LANTERN_X[i]) < LIGHT_R);
  for (let x = 20; x < FIN_W; x += 40) {
    if (safe(x)) continue;
    ctx.fillStyle = `rgba(255,90,110,${0.06 + 0.08 * pulse})`;
    ctx.fillRect(x - 20, GROUND - 200, 40, 200);
    const rise = clamp(k * 1.4 - 0.2, 0, 1) * (10 + ((x * 7) % 16));
    if (rise > 1) fang(ctx, x, rise, 10);
  }
  // the flames streaming toward its mouth
  LANTERN_X.forEach((lx, i) => {
    if (keep.includes(i)) return;
    ctx.strokeStyle = `rgba(255,214,150,${0.25 + 0.3 * k})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -e.t * 80;
    ctx.beginPath();
    ctx.moveTo(lx, LANTERN_Y);
    ctx.quadraticCurveTo((lx + e.x) / 2, LANTERN_Y - 160, e.x, GROUND - 200);
    ctx.stroke();
    ctx.setLineDash([]);
  });
  for (const i of keep) {
    const x = LANTERN_X[i];
    glow(ctx, x, GROUND - 40, LIGHT_R, 70, '140,255,190', 0.5 + 0.2 * pulse);
    ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(x - LIGHT_R, GROUND - 260, LIGHT_R * 2, 260);
    ctx.setLineDash([]);
    safeTag(ctx, x, GROUND - 150, e.t);
  }
}
function swallowHit(ctx, e, k) {
  const keep = e.keep ?? [], up = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
  const safe = (x) => keep.some((i) => Math.abs(x - LANTERN_X[i]) < LIGHT_R);
  for (let x = 14; x < FIN_W; x += 28) if (!safe(x)) fang(ctx, x, up * (90 + ((x * 13) % 70)), 18);
}
// Fimbulwinter: the snow starts streaming the way the wind will blow; the lee strips at the far end (green) are the only
// shelter. Kept readable (c1's screenshots came out washed pale): no full-screen fill in the warning, only a cold haze
// rising off the windward end, thin streaks of snow, and on the hit a short low flash and the gale itself
function leeStrips(dir) {
  const p = FENRIR_PLATFORMS[dir > 0 ? 3 : 0];
  return dir > 0
    ? [[FIN_W - LEE_FLOOR, FIN_W, GROUND], [p.x + p.w - LEE_LEDGE, p.x + p.w, p.y]]
    : [[0, LEE_FLOOR, GROUND], [p.x, p.x + LEE_LEDGE, p.y]];
}
function snow(ctx, e, n, a) {
  const dir = e.dir ?? 1;
  ctx.strokeStyle = `rgba(240,248,255,${a})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const s = (i * 97.13) % 1, y = (i * 53.7) % (GROUND - 20) + 10, sp = 500 + s * 400;
    const run = ((e.t * sp + i * 131) % (FIN_W + 200)) - 100, x = dir > 0 ? run : FIN_W - run;
    ctx.moveTo(x, y);
    ctx.lineTo(x - dir * (16 + s * 20), y - 3);
  }
  ctx.stroke();
}
function windHaze(ctx, dir, a) {
  const x0 = dir > 0 ? 0 : FIN_W, g = ctx.createLinearGradient(x0, 0, x0 + dir * FIN_W * 0.55, 0);
  g.addColorStop(0, `rgba(220,236,255,${a})`);
  g.addColorStop(1, 'rgba(220,236,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(dir > 0 ? 0 : FIN_W * 0.45, 0, FIN_W * 0.55, GROUND);
}
function fimbulWarn(ctx, e, k) {
  const dir = e.dir ?? 1, pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  windHaze(ctx, dir, 0.05 + 0.13 * k);
  snow(ctx, e, Math.round(30 + 70 * k), 0.3 + 0.25 * k);
  // the wind's way: chevrons along the top
  ctx.fillStyle = `rgba(240,248,255,${0.4 + 0.3 * pulse})`;
  for (let x = 120; x < FIN_W; x += 260) {
    ctx.beginPath();
    ctx.moveTo(x - dir * 14, 70);
    ctx.lineTo(x + dir * 14, 82);
    ctx.lineTo(x - dir * 14, 94);
    ctx.lineTo(x - dir * 6, 82);
    ctx.fill();
  }
  for (const [a, b, y] of leeStrips(dir)) {
    glow(ctx, (a + b) / 2, y - 30, (b - a) * 0.9, 60, '140,255,190', 0.5 + 0.2 * pulse);
    ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(a, y - 120, b - a, 120);
    ctx.setLineDash([]);
    safeTag(ctx, (a + b) / 2, y - 140, e.t);
  }
}
function fimbulHit(ctx, e, k) {
  const dir = e.dir ?? 1, flash = k < 0.08 ? k / 0.08 : clamp(1 - (k - 0.08) / 0.25, 0, 1), up = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
  if (flash > 0.01) {
    ctx.fillStyle = `rgba(236,246,255,${0.2 * flash})`;
    ctx.fillRect(0, 0, FIN_W, GROUND + 4);
  }
  windHaze(ctx, dir, 0.22 * up);
  snow(ctx, e, 160, 0.7 * up);
  for (const [a, b, y] of leeStrips(dir)) glow(ctx, (a + b) / 2, y - 30, b - a, 50, '140,255,190', 0.4 * up);
}
export const FX2 = {
  swallowWarn: { dur: 4, draw: swallowWarn },
  swallowHit: { dur: 1.3, draw: swallowHit },
  fimbulWarn: { dur: 4, draw: fimbulWarn },
  fimbulHit: { dur: 1.5, draw: fimbulHit },
};
