// Docs: docs/places/fenrir.md, docs/performance.md
// The Wolf's Hold (room 52, theme 'wolf'): Fenrir's den at the foot of the Long Stair (FB2 (c), story/fb2-plan.md, where
// it's called the Glacier's Bed), and Fenrir itself, the Bound Wolf; Skoll and Hati; its two ultimates' effects; the
// dark. The bottom of the glacier: black-blue ice with things older than the hamlet frozen in it, a floor of bare rock
// scraped smooth, low ice ledges and one high one, two Keeper anchor stones in each side wall and six Keeper lamp posts
// with the cutters' lanterns on them, the stone hand at its paws. dens.js and field.js import this file (DEN_ART,
// BOSS_ART, FX2, SON_ART), so it must NOT import them. The den's static layer is baked (as Ladon's); the dark is one
// low-resolution layer, rebuilt only when a lantern changes (docs/performance.md). Clear and readable, not final:
// FB2 (c) piece 2 polishes it.
import { H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { DEN_EXIT_X } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR } from './shared/final.js';
import { FENRIR_PLATFORMS, ANCHORS, LANTERN_X, LANTERN_Y, LIGHT_R, LEE_FLOOR, LEE_LEDGE, FEN_MID } from './shared/fenrir.js';
import { glow as radialGlow } from './glow.js';
import { wolf } from './oldice-art.js';

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

// ——— what the art shows of the fight (set by src/fenrir.js from the 'final' message) ———
// po: its pose; p: the drawn pose's numbers, eased toward the pose's each frame (stepFenrirLook); eye: where its eyes
// were drawn last frame, in device pixels (src/fenrir.js draws them again over the dark)
const POSES = {
  // lift: body up (px), tilt: body (rad, up at the front), head: neck angle (rad, up), jaw 0–1, fore: forelegs forward,
  // crouch 0–1, rear 0–1, eyes 0–1 (open), lie 0–1
  lie: { lift: 0, tilt: 0, head: -0.15, jaw: 0, fore: 0.6, crouch: 0, rear: 0, eyes: 0.35, lie: 1 },
  stand: { lift: 0, tilt: 0, head: 0.15, jaw: 0.08, fore: 0, crouch: 0, rear: 0, eyes: 1, lie: 0 },
  crouch: { lift: 0, tilt: -0.06, head: -0.05, jaw: 0.35, fore: 0.1, crouch: 1, rear: 0, eyes: 1, lie: 0 },
  lunge: { lift: 34, tilt: 0.05, head: 0, jaw: 0.9, fore: 0.9, crouch: 0, rear: 0, eyes: 1, lie: 0 },
  pant: { lift: 0, tilt: -0.04, head: -0.25, jaw: 0.45, fore: 0.15, crouch: 0.3, rear: 0, eyes: 0.8, lie: 0 },
  claw: { lift: 0, tilt: 0.06, head: 0.05, jaw: 0.4, fore: 1, crouch: 0.2, rear: 0, eyes: 1, lie: 0 },
  strain: { lift: 0, tilt: -0.1, head: 0.1, jaw: 0.55, fore: 0.7, crouch: 0.6, rear: 0, eyes: 1, lie: 0 },
  howl: { lift: 0, tilt: 0.12, head: 1.1, jaw: 0.85, fore: -0.1, crouch: 0, rear: 0, eyes: 0.6, lie: 0 },
  breath: { lift: 0, tilt: -0.04, head: -0.12, jaw: 1, fore: 0.2, crouch: 0.3, rear: 0, eyes: 1, lie: 0 },
  rear: { lift: 0, tilt: 0, head: 0.35, jaw: 0.5, fore: 0.4, crouch: 0, rear: 1, eyes: 1, lie: 0 },
  stag: { lift: 0, tilt: -0.08, head: -0.5, jaw: 0.25, fore: 0.1, crouch: 0.5, rear: 0, eyes: 0.4, lie: 0 },
  ult: { lift: 0, tilt: 0.1, head: 0.85, jaw: 1, fore: 0, crouch: 0.1, rear: 0, eyes: 1, lie: 0 },
  freed: { lift: 0, tilt: 0, head: -0.18, jaw: 0, fore: 0.6, crouch: 0, rear: 0, eyes: 0, lie: 1 },
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
  // the side walls, darker
  for (const side of [-1, 1]) {
    const x = side < 0 ? BX0 : BX1, gg = ctx.createLinearGradient(x, 0, x - side * 160, 0);
    gg.addColorStop(0, 'rgba(1,2,6,0.95)');
    gg.addColorStop(1, 'rgba(1,2,6,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(side < 0 ? BX0 : FIN_W - 100, 0, 160, GROUND);
  }
  // the floor: bare rock scraped smooth, long scratches along it
  g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, '#2a3446');
  g.addColorStop(1, '#141a26');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, GROUND, BX1 - BX0, H - GROUND + 10);
  ctx.fillStyle = 'rgba(190,214,240,0.35)';
  ctx.fillRect(BX0, GROUND, BX1 - BX0, 2);
  ctx.strokeStyle = 'rgba(150,180,220,0.18)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    const x = rnd() * FIN_W, y = GROUND + 10 + rnd() * 60, l = 60 + rnd() * 140;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + l, y + (rnd() - 0.5) * 6);
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
function drawPost(ctx, x) {
  ctx.fillStyle = '#3a4252';
  ctx.strokeStyle = '#151a24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 26, LANTERN_Y - 48, 10, GROUND - LANTERN_Y + 48, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(x - 26, LANTERN_Y - 48, 30, 7); // (the arm)
  ctx.fillStyle = '#4e5868';
  ctx.fillRect(x - 30, LANTERN_Y - 54, 18, 8); // (its stone cap)
  ctx.strokeStyle = '#1a1e28';
  ctx.beginPath();
  ctx.moveTo(x, LANTERN_Y - 41);
  ctx.lineTo(x, LANTERN_Y - 14);
  ctx.stroke();
}
function drawAnchorStone(ctx, a, i) {
  const low = i % 2 === 0, w = low ? 58 : 54, h = low ? 116 : 64, x = a.x - w / 2, y = low ? GROUND - h : a.y - h / 2;
  ctx.fillStyle = '#4a5060';
  ctx.strokeStyle = '#1a1e28';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, low ? [16, 16, 4, 4] : 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,220,255,0.12)';
  ctx.fillRect(x + 6, y + 6, 6, h - 12);
  // the carving, faint until it glows (src/fenrir.js)
  drawGlyph(ctx, GLYPHS[i], a.x, a.y, 'rgba(160,190,230,0.45)', 1);
  if (!low) {
    // set in the wall: a dark socket round it
    ctx.strokeStyle = 'rgba(1,3,8,0.8)';
    ctx.lineWidth = 6;
    ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
  }
}
export function drawGlyph(ctx, kind, x, y, color, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  if (kind === 'paw') { // (the sound of a cat's footfall)
    ellipse(ctx, 0, 6, 8, 6);
    for (const [dx, dy] of [[-9, -5], [-3, -10], [3, -10], [9, -5]]) ellipse(ctx, dx, dy, 3, 3.5);
  } else if (kind === 'roots') { // (the roots of a mountain)
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(0, -14);
    ctx.lineTo(12, -6);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 14);
    ctx.moveTo(0, 4);
    ctx.lineTo(8, 14);
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
// grey-white fur gone to rime at the tips, black lips, pale eyes, a heavy Keeper collar of dark stone with the shard in
// its lock, its breath smoking.
const FUR = '#c8d2dc', FUR_D = '#8e9aa8', FUR_L = '#eef4fa', INK = '#1a2030', LIP = '#10141c';
function drawFenrir(ctx, w, h, st, m) {
  const P = look.p, t = st.t, dying = st.dying ?? 0;
  const breathe = Math.sin(t * 1.6) * (P.lie > 0.5 ? 3 : 2);
  ctx.save();
  // rearing: the whole wolf tips up about its hind feet
  const pivotX = -w * 0.28;
  ctx.translate(pivotX, 0);
  ctx.rotate(-P.rear * 0.95 + P.tilt * 0.4);
  ctx.translate(-pivotX, 0);
  ctx.translate(0, -P.lift);
  const lie = P.lie, cy = -h * (0.5 - lie * 0.28) + P.crouch * h * 0.1 + breathe * 0.4;
  const bx = w * 0.36, by = h * (0.21 - lie * 0.03);
  // tail: a heavy brush, low behind
  ctx.strokeStyle = FUR_D;
  ctx.lineCap = 'round';
  ctx.lineWidth = h * 0.13;
  ctx.beginPath();
  ctx.moveTo(-bx * 0.85, cy);
  ctx.quadraticCurveTo(-bx * 1.35, cy + by * 0.6, -bx * 1.45 + Math.sin(t * 0.8) * 6, cy + by * (1.4 - lie * 0.8));
  ctx.stroke();
  // the far legs (darker), then the body, then the near legs
  const leg = (x, front, far) => {
    const sw = (front ? P.fore : 0) * 0.9, kneeY = cy + by * 0.6, foot = front && P.fore > 0.5 && P.rear < 0.5 ? -P.fore * 20 : 0;
    ctx.strokeStyle = far ? FUR_D : FUR;
    ctx.lineWidth = w * 0.075;
    ctx.beginPath();
    if (lie > 0.5) { // (folded: forepaws out in front, hind legs tucked)
      ctx.moveTo(x, cy + by * 0.3);
      ctx.lineTo(x + (front ? w * 0.22 : w * 0.08), -6);
    } else {
      ctx.moveTo(x, kneeY - by * 0.6);
      ctx.lineTo(x + Math.sin(sw) * h * 0.18, kneeY + (0 - kneeY) * 0.5);
      ctx.lineTo(x + Math.sin(sw) * h * 0.4, foot - 4);
    }
    ctx.stroke();
    ctx.fillStyle = far ? FUR_D : FUR_L;
    const px = lie > 0.5 ? x + (front ? w * 0.26 : w * 0.11) : x + Math.sin(sw) * h * 0.4 + 6;
    ellipse(ctx, px, (lie > 0.5 ? -6 : foot - 4), w * 0.05, h * 0.035);
  };
  leg(-w * 0.2, false, true);
  leg(w * 0.24, true, true);
  // body: haunch, barrel, deep chest
  const g = ctx.createLinearGradient(0, cy - by * 1.2, 0, cy + by);
  g.addColorStop(0, FUR_L);
  g.addColorStop(1, FUR_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  const body = () => {
    ctx.ellipse(-w * 0.2, cy - by * 0.05, w * 0.17, by * 1.08, 0, 0, TAU);
    ctx.moveTo(w * 0.25 + w * 0.2, cy);
    ctx.ellipse(w * 0.05, cy, bx * 0.9, by, 0, 0, TAU);
    ctx.moveTo(w * 0.42, cy);
    ctx.ellipse(w * 0.22, cy + by * 0.1, w * 0.2, by * 1.2, 0, 0, TAU);
  };
  ctx.beginPath();
  body();
  ctx.fill();
  // the rime along its back (hackles up when it's about to go)
  ctx.fillStyle = 'rgba(244,250,255,0.95)';
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI * 0.86 + i * 0.07, rx = w * 0.05 + Math.cos(a) * bx * 0.92, ry = cy + Math.sin(a) * by * 1.02, up = 6 + P.crouch * 8 + (i % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(rx - 4, ry + 3);
    ctx.lineTo(rx + Math.cos(a) * 2, ry - up);
    ctx.lineTo(rx + 5, ry + 3);
    ctx.fill();
  }
  leg(-w * 0.26, false, false);
  leg(w * 0.18, true, false);
  // the neck, the collar, the head
  const nx = w * 0.3, ny = cy - by * 0.55, hl = h * 0.32, ha = -P.head - (lie > 0.5 ? -0.2 : 0);
  const hx = nx + Math.cos(ha) * hl, hy = ny + Math.sin(ha) * hl + (lie > 0.5 ? by * 0.9 : 0);
  ctx.strokeStyle = FUR;
  ctx.lineWidth = h * 0.2;
  ctx.beginPath();
  ctx.moveTo(nx - w * 0.05, ny + by * 0.3);
  ctx.lineTo(hx - Math.cos(ha) * h * 0.06, hy - Math.sin(ha) * h * 0.06);
  ctx.stroke();
  // the Keeper collar: dark stone, the shard glowing in its lock
  const cx = nx + Math.cos(ha) * hl * 0.25, cyy = ny + Math.sin(ha) * hl * 0.25 + (lie > 0.5 ? by * 0.3 : 0);
  ctx.save();
  ctx.translate(cx, cyy);
  ctx.rotate(ha + Math.PI / 2);
  ctx.fillStyle = '#2a2e38';
  ctx.strokeStyle = '#0a0c12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-h * 0.13, -h * 0.05, h * 0.26, h * 0.1, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  const sx = cx + Math.cos(ha + Math.PI / 2) * h * 0.1, sy = cyy + Math.sin(ha + Math.PI / 2) * h * 0.1;
  look.collar = ctx.getTransform().transformPoint(new DOMPoint(cx, cyy)); // (where the fetters run to: src/fenrir.js)
  glow(ctx, sx, sy, 22, 22, '255,236,180', 0.45 + 0.25 * Math.sin(t * 3) + P.rear * 0.3);
  ctx.fillStyle = '#fff2c8';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 8);
  ctx.lineTo(sx + 5, sy);
  ctx.lineTo(sx, sy + 8);
  ctx.lineTo(sx - 5, sy);
  ctx.closePath();
  ctx.fill();
  // head: a broad skull, a long muzzle, the jaw opening below it
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ha);
  const hr = h * 0.15, jaw = P.jaw * 0.55;
  ctx.fillStyle = FUR;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  // lower jaw
  ctx.save();
  ctx.translate(hr * 0.2, hr * 0.35);
  ctx.rotate(jaw);
  ctx.fillStyle = FUR_D;
  ctx.beginPath();
  ctx.moveTo(0, -hr * 0.15);
  ctx.quadraticCurveTo(hr * 1.4, -hr * 0.05, hr * 2.1, hr * 0.05);
  ctx.quadraticCurveTo(hr * 1.2, hr * 0.5, 0, hr * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (jaw > 0.1) { // (teeth)
    ctx.fillStyle = '#f6faff';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(hr * (0.8 + i * 0.32), -hr * 0.05);
      ctx.lineTo(hr * (0.9 + i * 0.32), -hr * 0.32);
      ctx.lineTo(hr * (1.0 + i * 0.32), -hr * 0.05);
      ctx.fill();
    }
  }
  ctx.restore();
  // the inside of its mouth
  if (jaw > 0.1) {
    ctx.fillStyle = '#3a1820';
    ctx.beginPath();
    ctx.moveTo(hr * 0.3, hr * 0.3);
    ctx.lineTo(hr * 2.1, hr * 0.35);
    ctx.lineTo(hr * 0.3 + Math.cos(jaw) * hr * 1.8, hr * 0.35 + Math.sin(jaw) * hr * 1.8);
    ctx.closePath();
    ctx.fill();
  }
  // skull and muzzle
  ctx.fillStyle = FUR;
  ctx.beginPath();
  ctx.moveTo(-hr * 0.9, hr * 0.5);
  ctx.quadraticCurveTo(-hr * 1.0, -hr * 0.95, hr * 0.3, -hr * 0.85);
  ctx.quadraticCurveTo(hr * 1.6, -hr * 0.55, hr * 2.3, hr * 0.05);
  ctx.quadraticCurveTo(hr * 2.35, hr * 0.38, hr * 2.0, hr * 0.42);
  ctx.quadraticCurveTo(hr * 0.8, hr * 0.5, -hr * 0.9, hr * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LIP;
  ellipse(ctx, hr * 2.22, hr * 0.06, hr * 0.18, hr * 0.14);
  ctx.strokeStyle = LIP;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hr * 0.6, hr * 0.38);
  ctx.lineTo(hr * 2.0, hr * 0.38);
  ctx.stroke();
  // ears, back when it strains or lunges
  const ear = -0.15 - P.crouch * 0.5 - (P.jaw > 0.8 ? 0.3 : 0);
  for (const d of [0, 1]) {
    ctx.save();
    ctx.translate(-hr * 0.35 + d * hr * 0.45, -hr * 0.75);
    ctx.rotate(ear);
    ctx.fillStyle = d ? FUR : FUR_D;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-hr * 0.32, 0);
    ctx.lineTo(-hr * 0.1, -hr * 0.85);
    ctx.lineTo(hr * 0.3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // the last fetter, held in its teeth (phase 4): a frayed ribbon of light from the corner of its mouth
  if (look.ph >= 3 && dying < 0.5) {
    ctx.strokeStyle = `rgba(${FETTER},0.95)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hr * 1.2, hr * 0.32);
    ctx.quadraticCurveTo(hr * 0.4, hr * 1.4, -hr * 0.5, hr * 1.1);
    ctx.stroke();
  }
  // its eyes: pale, no pupils (drawn again over the dark by src/fenrir.js, from where they are now)
  const ex = hr * 0.75, ey = -hr * 0.3, open = clamp(P.eyes, 0, 1);
  ctx.fillStyle = '#e8f6ff';
  ctx.beginPath();
  ctx.ellipse(ex, ey, hr * 0.17, hr * 0.12 * open + 0.6, 0.15, 0, TAU);
  ctx.fill();
  const M = ctx.getTransform();
  look.eye = M.transformPoint(new DOMPoint(ex, ey));
  look.muzzle = M.transformPoint(new DOMPoint(hr * 2.3, hr * 0.2));
  look.eyeS = Math.hypot(M.a, M.b) * hr;
  ctx.restore();
  ctx.restore();
  return () => {
    ctx.ellipse(0, cy, w * 0.45, by * 1.3, 0, 0, TAU);
  };
}
export const BOSS_ART = { fenrir: drawFenrir };

// Skoll and Hati: big shadow wolves (the black-ice wolf's shape, darker, bigger), Skoll's eyes sun-gold, Hati's moon-white
function son(eye) {
  return (ctx, w, h, t, seed, m, dying) => {
    const r = wolf(ctx, w, h, t, seed, m, dying, { fur: '#06080e', top: '#161c2a', leg: '#04060a', ink: '#000000', glow: 0.9 });
    glow(ctx, r.hx + r.hr * 0.75, r.hy - r.hr * 0.15, r.hr * 0.9, r.hr * 0.7, eye, 0.7);
    ctx.fillStyle = `rgb(${eye})`;
    ellipse(ctx, r.hx + r.hr * 0.75, r.hy - r.hr * 0.15, r.hr * 0.2, r.hr * 0.12);
    return () => {
      ctx.beginPath();
      r.body();
      ctx.ellipse(r.hx + r.hr, r.hy, r.hr * 1.4, r.hr, 0, 0, TAU);
    };
  };
}
export const SON_ART = { skoll: son('255,206,110'), hati: son('230,240,255') };

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

// a lantern on its hook: lit (a flame and its warm pool), dark (cold iron), relighting (fill: an ember growing)
export function drawLantern(ctx, x, lit, fill, t, hurt = 0) {
  const y = LANTERN_Y;
  if (lit > 0.02) {
    glow(ctx, x, y + 10, LIGHT_R * 0.9, 90, '255,214,150', 0.22 * lit);
    glow(ctx, x, y, 34, 34, '255,220,160', 0.7 * lit);
  }
  ctx.fillStyle = '#2a2f3a';
  ctx.strokeStyle = '#0c0e14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 14, 20, 26, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = lit > 0.02 ? `rgba(255,${Math.round(200 + 40 * Math.sin(t * 9 + x))},140,${0.4 + 0.6 * lit})` : fill > 0 ? `rgba(255,150,80,${0.25 + 0.6 * fill})` : 'rgba(20,30,48,0.95)';
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 10, 12, 18, 3);
  ctx.fill();
  if (lit > 0.02) {
    ctx.fillStyle = '#fff6dc';
    const f = 1 + 0.15 * Math.sin(t * 13 + x);
    ellipse(ctx, x, y - 1, 2.6, 5 * f);
  }
  if (hurt > 0.01) glow(ctx, x, y, 26, 26, '255,255,255', 0.6 * hurt);
  ctx.fillStyle = '#3a404c';
  ctx.fillRect(x - 12, y - 17, 24, 4);
}

// a fetter: a ribbon of pale light, thin as silk, from an anchor to its collar (taut: straining, it glows hot)
export function drawFetter(ctx, x0, y0, x1, y1, t, taut = 0, a = 1) {
  const sag = (1 - taut) * 50, mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${taut > 0.5 ? '255,226,200' : FETTER},${0.18 + 0.12 * taut})`;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = `rgba(${taut > 0.5 ? '255,236,220' : FETTER},${0.75 + 0.2 * Math.sin(t * 3 + x0)})`;
  ctx.lineWidth = 2.2;
  ctx.stroke();
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
// Fimbulwinter: the snow starts streaming the way the wind will blow; the lee strips at the far end (green) are the only shelter
function leeStrips(dir) {
  const p = FENRIR_PLATFORMS[dir > 0 ? 3 : 0];
  return dir > 0
    ? [[FIN_W - LEE_FLOOR, FIN_W, GROUND], [p.x + p.w - LEE_LEDGE, p.x + p.w, p.y]]
    : [[0, LEE_FLOOR, GROUND], [p.x, p.x + LEE_LEDGE, p.y]];
}
function snow(ctx, e, k, n, a) {
  const dir = e.dir ?? 1;
  ctx.strokeStyle = `rgba(240,248,255,${a})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const s = (i * 97.13) % 1, y = (i * 53.7) % (GROUND - 20) + 10, sp = 500 + s * 400;
    const run = ((e.t * sp + i * 131) % (FIN_W + 200)) - 100, x = dir > 0 ? run : FIN_W - run;
    ctx.moveTo(x, y);
    ctx.lineTo(x - dir * (16 + s * 20), y - 3);
  }
  ctx.stroke();
}
function fimbulWarn(ctx, e, k) {
  const dir = e.dir ?? 1, pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  ctx.fillStyle = `rgba(220,236,255,${0.04 + 0.1 * k})`;
  ctx.fillRect(0, 0, FIN_W, GROUND);
  snow(ctx, e, k, Math.round(30 + 90 * k), 0.35 + 0.3 * k);
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
  const up = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
  ctx.fillStyle = `rgba(236,246,255,${0.45 * up})`;
  ctx.fillRect(0, 0, FIN_W, GROUND + 4);
  snow(ctx, e, k, 200, 0.8 * up);
  for (const [a, b, y] of leeStrips(e.dir ?? 1)) glow(ctx, (a + b) / 2, y - 30, (b - a), 50, '140,255,190', 0.4 * up);
}
export const FX2 = {
  swallowWarn: { dur: 4, draw: swallowWarn },
  swallowHit: { dur: 1.3, draw: swallowHit },
  fimbulWarn: { dur: 4, draw: fimbulWarn },
  fimbulHit: { dur: 1.5, draw: fimbulHit },
};
