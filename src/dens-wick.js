// Docs: docs/places/wickmother.md, docs/performance.md
// The Hall of Lamps (room 84, theme 'lamps'): the Wickmother's den at the top of the Lamp Road (L5 (c), story/l5-plan.md),
// and the Wickmother herself; the hall lanterns on their strings, the silk walls, phase 4's dark and her two ultimates'
// effects. Inside the great hollow willow: walls of grey ribbed inner bark going up out of sight, roots for shelves and
// ledges, a floor of packed peat with black water standing in the hollows, thousands of small lanterns hung from the ribs
// each with its tag, the Crown of Lamps hanging from the middle of the roof, and far up a hole where the trunk broke, a
// little real night sky. dens.js imports this file (DEN_ART, BOSS_ART, FX2), so it must NOT import it. The den's static
// layer is baked (as the other final dens'); the dark is one low-resolution layer, rebuilt only when its light moves.
// Her art eases a handful of numbers between poses (POSE) so she moves between them instead of swapping.
import { H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { DEN_EXIT_X } from './shared/rpg.js';
import { FIN_W, FIN_FLOOR } from './shared/final.js';
import { HALL_PLATFORMS, HALL_LAMPS, LIGHT_R, MOTHER_LIGHT_R, WM_MID, HIGH_W, HIGH_E } from './shared/wickmother.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIN_FLOOR;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
export const LAMPLIGHT = '255,214,150', SILK = '236,228,244';
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
const smooth = (k) => k * k * (3 - 2 * k);

// ——— what the client says she's doing (src/wickmother.js), eased for the art ———
// lift: her thorax's height (share of h) · open: her wings (0 folded down round the Crown, 1 spread wide) · lie: lying on
// the floor (her body tipped forward) · reach: a wing tip held out (Kindle) · shard: the light in her thorax · wrap: silk
// over her (the Cocoon) · fold: wings folded tight (the armour) · small: freed, an ordinary moth's size
const POSES = {
  crown: { lift: 0.64, open: 0.12, lie: 0, reach: 0, shard: 0.2, wrap: 0, fold: 0 },
  ribs: { lift: 0.7, open: 0.3, lie: 0, reach: 0, shard: 0.2, wrap: 0, fold: 0 },
  rise: { lift: 0.8, open: 0.55, lie: 0, reach: 0, shard: 0.3, wrap: 0, fold: 0 },
  stoop: { lift: 0.4, open: 0.2, lie: 0.6, reach: 0, shard: 0.3, wrap: 0, fold: 0 },
  spread: { lift: 0.16, open: 1, lie: 1, reach: 0, shard: 0.35, wrap: 0, fold: 0 },
  climb: { lift: 0.5, open: 0.5, lie: 0.3, reach: 0, shard: 0.25, wrap: 0, fold: 0 },
  kindle: { lift: 0.62, open: 0.5, lie: 0, reach: 1, shard: 0.4, wrap: 0, fold: 0 },
  hush: { lift: 0.66, open: 0.85, lie: 0, reach: 0, shard: 0.35, wrap: 0, fold: 0 },
  fold: { lift: 0.62, open: 0, lie: 0, reach: 0, shard: 0.15, wrap: 0, fold: 1 },
  cocoon: { lift: 0.62, open: 0.05, lie: 0, reach: 0, shard: 0.15, wrap: 1, fold: 0.6 },
  line: { lift: 0.68, open: 0.6, lie: 0, reach: 0.5, shard: 0.3, wrap: 0, fold: 0 },
  rain: { lift: 0.72, open: 0.7, lie: 0, reach: 0, shard: 0.3, wrap: 0, fold: 0 },
  open: { lift: 0.66, open: 1, lie: 0, reach: 0, shard: 0.8, wrap: 0, fold: 0 },
  pull: { lift: 0.66, open: 0.75, lie: 0, reach: 0.8, shard: 0.5, wrap: 0, fold: 0 },
  draw: { lift: 0.52, open: 1, lie: 0, reach: 0, shard: 1, wrap: 0, fold: 0 },
  stag: { lift: 0.3, open: 0.65, lie: 0.7, reach: 0, shard: 0.1, wrap: 0, fold: 0 },
  walk: { lift: 0.4, open: 0.7, lie: 0.35, reach: 0, shard: 0.6, wrap: 0, fold: 0 },
  freed: { lift: 0.4, open: 0, lie: 0, reach: 0, shard: 0.1, wrap: 0, fold: 1 },
};
let look = { po: 'crown', ph: 0, enr: false, lamps: HALL_LAMPS.map(() => 'l'), bx: WM_MID, p: { ...POSES.crown }, t: 0, freedAt: -1 };
export function setWickLook(o) {
  if (o.po === 'freed' && look.po !== 'freed') look.freedAt = look.t;
  Object.assign(look, o);
}
export const wickLook = () => look;
export function stepWickLook(dt, t, bx) {
  look.t = t;
  if (bx != null) look.bx = bx;
  const want = POSES[look.po] ?? POSES.crown, k = Math.min(1, dt * (look.po === 'stoop' ? 7 : 3.5));
  for (const key of Object.keys(want)) look.p[key] = lerp(look.p[key] ?? want[key], want[key], k);
}

// ——— the den's static layer (baked) ———
const BX0 = -60, BX1 = FIN_W + 60;
const r0 = mulberry32(8484);
const RIBS = Array.from({ length: 34 }, (_, i) => ({ x: BX0 + (i + r0() * 0.6) * ((BX1 - BX0) / 34), w: 10 + r0() * 16, a: 0.25 + r0() * 0.35 }));
const SMALL = Array.from({ length: 240 }, () => {
  const x = BX0 + r0() * (BX1 - BX0), depth = r0();
  return { x, y: 40 + depth * 300 + r0() * 40, s: 0.5 + depth * 0.7, warm: r0() < 0.8, a: 0.35 + depth * 0.5, str: 10 + r0() * 50 };
});
const HOLLOWS = [[230, 30], [560, 46], [820, 34], [1080, 40], [1330, 28]];
const MOTES = Array.from({ length: 50 }, () => ({ x: r0() * FIN_W, y: r0() * GROUND, v: 8 + r0() * 14, s: 0.8 + r0() * 1.2, ph: r0() * TAU }));
const CROWN = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * TAU, ring = i % 2 ? 0.6 : 1;
  return { dx: Math.cos(a) * 52 * ring, dy: Math.sin(a) * 30 * ring + (i % 3) * 8, s: 0.75 + ((i * 7) % 5) * 0.08 };
});
const CROWN_Y = 150; // (the Crown's middle: she wraps round it in phase 1)

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
  const r = mulberry32(9191); // (its own stream: a rebake draws the same den)
  ctx.save();
  let g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#0b0710');
  g.addColorStop(0.5, '#1c1422');
  g.addColorStop(1, '#2a1e26');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, 0, BX1 - BX0, GROUND + 4);
  // the hole far up where the trunk broke: a little real night sky
  ctx.fillStyle = '#121a34';
  ellipse(ctx, WM_MID, 6, 96, 30);
  ctx.fillStyle = 'rgba(220,230,255,0.85)';
  for (let i = 0; i < 9; i++) circle(ctx, WM_MID - 70 + r() * 140, 2 + r() * 22, 0.8 + r() * 0.8);
  glow(ctx, WM_MID, 20, 160, 70, '150,170,230', 0.12);
  // the inner bark: grey ribs going up out of sight, leaning in toward the hole
  ctx.lineCap = 'round';
  for (const rb of RIBS) {
    const top = WM_MID + (rb.x - WM_MID) * 0.55;
    ctx.strokeStyle = `rgba(92,84,106,${rb.a})`;
    ctx.lineWidth = rb.w;
    ctx.beginPath();
    ctx.moveTo(rb.x, GROUND);
    ctx.quadraticCurveTo(rb.x + (top - rb.x) * 0.15, GROUND * 0.45, top, -10);
    ctx.stroke();
    ctx.strokeStyle = `rgba(150,140,164,${rb.a * 0.45})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rb.x - rb.w * 0.3, GROUND);
    ctx.quadraticCurveTo(rb.x - rb.w * 0.3 + (top - rb.x) * 0.15, GROUND * 0.45, top - rb.w * 0.2, -10);
    ctx.stroke();
  }
  // thousands of lanterns, every one lit, hung from the ribs on strings, each with its tag (the far ones small and dim)
  for (const l of SMALL) {
    ctx.strokeStyle = `rgba(200,190,170,${0.18 * l.a})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - l.str);
    ctx.lineTo(l.x, l.y - 4 * l.s);
    ctx.stroke();
    glow(ctx, l.x, l.y, 12 * l.s, 12 * l.s, l.warm ? LAMPLIGHT : '214,196,255', 0.35 * l.a);
    ctx.fillStyle = l.warm ? `rgba(255,226,170,${l.a})` : `rgba(226,214,255,${l.a})`;
    ctx.fillRect(l.x - 2 * l.s, l.y - 3 * l.s, 4 * l.s, 6 * l.s);
    ctx.fillStyle = `rgba(232,220,192,${0.5 * l.a})`;
    ctx.fillRect(l.x - 1.2 * l.s, l.y + 4 * l.s, 2.4 * l.s, 3.4 * l.s);
  }
  // the side walls, darker, the roots thick at their feet
  for (const side of [-1, 1]) {
    const x = side < 0 ? BX0 : BX1, gg = ctx.createLinearGradient(x, 0, x - side * 200, 0);
    gg.addColorStop(0, 'rgba(6,4,8,0.95)');
    gg.addColorStop(1, 'rgba(6,4,8,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(side < 0 ? BX0 : FIN_W - 140, 0, 200, GROUND);
  }
  // the floor: packed peat, black water standing in the hollows with lamplight in it
  g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, '#2e2220');
  g.addColorStop(1, '#160e0e');
  ctx.fillStyle = g;
  ctx.fillRect(BX0, GROUND, BX1 - BX0, H - GROUND + 10);
  ctx.fillStyle = 'rgba(190,160,130,0.25)';
  ctx.fillRect(BX0, GROUND, BX1 - BX0, 2);
  for (const [hx, hw] of HOLLOWS) {
    ctx.fillStyle = '#07060c';
    ellipse(ctx, hx, GROUND + 22, hw * 1.6, 7);
    ctx.fillStyle = 'rgba(255,214,150,0.35)';
    for (let i = 0; i < 3; i++) ellipse(ctx, hx - hw + r() * hw * 2, GROUND + 21 + r() * 3, 3 + r() * 4, 1);
  }
  ctx.strokeStyle = 'rgba(110,84,70,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 22; i++) {
    const x = r() * FIN_W, y = GROUND + 34 + r() * 50, l = 40 + r() * 100;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + l, y + (r() - 0.5) * 6);
    ctx.stroke();
  }
  // the Lamp Road coming in through the roots at the west end (the way out)
  ctx.fillStyle = '#060408';
  ctx.beginPath();
  ctx.moveTo(DEN_EXIT_X - 44, GROUND + 2);
  ctx.lineTo(DEN_EXIT_X - 44, GROUND - 96);
  ctx.quadraticCurveTo(DEN_EXIT_X, GROUND - 150, DEN_EXIT_X + 44, GROUND - 96);
  ctx.lineTo(DEN_EXIT_X + 44, GROUND + 2);
  ctx.fill();
  glow(ctx, DEN_EXIT_X, GROUND - 40, 40, 60, LAMPLIGHT, 0.25);
  ctx.strokeStyle = '#3a2c26';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(DEN_EXIT_X - 52, GROUND);
  ctx.quadraticCurveTo(DEN_EXIT_X - 52, GROUND - 150, DEN_EXIT_X, GROUND - 158);
  ctx.quadraticCurveTo(DEN_EXIT_X + 52, GROUND - 150, DEN_EXIT_X + 52, GROUND);
  ctx.stroke();
  text(ctx, 'OUT', DEN_EXIT_X, GROUND - 176, 13, '#f4e8dc');
  // the roots: the shelves and ledges
  HALL_PLATFORMS.forEach((p, i) => drawRootLedge(ctx, p, i, r));
  ctx.restore();
}
// a root shelf or ledge: a gnarled willow root grown out of the bark, its top flat enough to stand on
function drawRootLedge(ctx, p, i, r) {
  const y = p.y, x0 = p.x, x1 = p.x + p.w, wall = x0 < FIN_W / 2 ? -1 : 1, wx = wall < 0 ? Math.min(x0, 0) - 20 : Math.max(x1, FIN_W) + 20;
  ctx.fillStyle = '#3a2e2c';
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.quadraticCurveTo(x1 + 8, y + 10, x1 - 6, y + 20);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + 34, x0 + 6, y + 20);
  ctx.quadraticCurveTo(x0 - 8, y + 10, x0, y);
  ctx.fill();
  // the root's run back into the wall it grows from
  ctx.strokeStyle = '#2e2422';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(wall < 0 ? x0 + 10 : x1 - 10, y + 12);
  ctx.quadraticCurveTo((wall < 0 ? x0 : x1) + wall * 40, y + 60, wx, y + 90 + i * 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(170,140,120,0.45)';
  ctx.fillRect(x0 + 4, y, p.w - 8, 2.5);
  ctx.strokeStyle = 'rgba(20,14,12,0.6)';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) {
    const sx = x0 + 10 + r() * (p.w - 20);
    ctx.beginPath();
    ctx.moveTo(sx, y + 6);
    ctx.quadraticCurveTo(sx + 6, y + 14, sx + 2, y + 22);
    ctx.stroke();
  }
}
function drawDenLamps(ctx, camX, viewW, time) {
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
  // the Crown of Lamps, from the middle of the roof (dark in phase 4 and once she's freed: their light went with hers)
  if (visible(WM_MID - 120, WM_MID + 120, L, R)) drawCrown(ctx, time);
  // wing-dust sifting down, silver in the lamplight
  ctx.fillStyle = 'rgba(226,222,240,0.55)';
  for (const d of MOTES) {
    const y = (d.y + time * d.v) % GROUND, x = d.x + Math.sin(time * 0.5 + d.ph) * 14;
    if (visible(x - 2, x + 2, L, R)) circle(ctx, x, y, d.s);
  }
  // freed: she sleeps under the Crown, small, a little light still in her
  if (look.po === 'freed' && look.freedAt >= 0 && visible(WM_MID - 60, WM_MID + 60, L, R)) {
    const a = clamp((look.t - look.freedAt - 5) / 2, 0, 1);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(WM_MID + 10, CROWN_Y + 74);
      drawSmallMoth(ctx, look.t, 1);
      ctx.restore();
    }
  }
}
function drawCrown(ctx, t) {
  const dark = look.ph >= 3 || look.po === 'freed', lit = dark ? 0.08 : 1;
  ctx.strokeStyle = 'rgba(200,190,170,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const dx of [-30, -10, 10, 30]) {
    ctx.moveTo(WM_MID + dx * 2.5, -10);
    ctx.lineTo(WM_MID + dx, CROWN_Y - 30);
  }
  ctx.stroke();
  if (!dark) glow(ctx, WM_MID, CROWN_Y, 150, 100, LAMPLIGHT, 0.35);
  for (const c of CROWN) {
    const x = WM_MID + c.dx, y = CROWN_Y + c.dy, s = c.s, sw = Math.sin(t * 1.1 + c.dx) * 1.2;
    ctx.fillStyle = '#2a2230';
    ctx.fillRect(x - 6 * s + sw, y - 8 * s, 12 * s, 16 * s);
    ctx.fillStyle = dark ? 'rgba(70,64,90,0.9)' : `rgba(255,${Math.round(210 + 30 * Math.sin(t * 7 + c.dx))},150,0.95)`;
    ctx.fillRect(x - 4 * s + sw, y - 6 * s, 8 * s, 12 * s);
    if (!dark) glow(ctx, x + sw, y, 14 * s, 14 * s, LAMPLIGHT, 0.4 * lit);
  }
}
export const DEN_ART = { lamps: drawDenLamps };

// ——— the hall lanterns: big lanterns of iron and paper on long strings from the ribs, each with a tag ———
// light: 0..1 as drawn (eased); st: 'l' | 'o' | 'p'; hurt: a ring's flash; kd: 0..1 her wing tip kindling it
export function drawHallLamp(ctx, i, light, st, t, hurt = 0, kd = 0) {
  const L = HALL_LAMPS[i], x = L.x + Math.sin(t * 0.7 + i) * 2, y = L.y;
  const party = st === 'p', rgb = party ? '255,240,214' : LAMPLIGHT;
  ctx.strokeStyle = 'rgba(210,198,176,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(L.x + (WM_MID - L.x) * 0.15, -10);
  ctx.quadraticCurveTo(L.x + (WM_MID - L.x) * 0.05, y * 0.5, x, y - 26);
  ctx.stroke();
  if (light > 0.02) {
    glow(ctx, x, GROUND - 4, LIGHT_R * 0.8, 22, rgb, 0.28 * light); // (its pool on the floor)
    glow(ctx, x, y, LIGHT_R * 0.65, 90, rgb, 0.2 * light);
    glow(ctx, x, y, 40, 40, rgb, 0.65 * light);
  }
  if (kd > 0) glow(ctx, x, y + 4, 10 + 26 * kd, 10 + 26 * kd, '255,170,90', 0.6 * kd);
  // the cap and the frame
  ctx.fillStyle = '#2a2230';
  ctx.strokeStyle = '#120c16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 15, y - 15);
  ctx.lineTo(x, y - 26);
  ctx.lineTo(x + 15, y - 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the paper sides
  ctx.fillStyle = light > 0.02 ? `rgba(255,${party ? 244 : Math.round(206 + 30 * Math.sin(t * 8 + i))},${party ? 220 : 150},${0.45 + 0.55 * light})` : 'rgba(46,40,60,0.95)';
  ctx.beginPath();
  ctx.roundRect(x - 12, y - 15, 24, 30, 5);
  ctx.fill();
  ctx.stroke();
  if (light > 0.02) {
    ctx.fillStyle = '#fff8e4';
    ellipse(ctx, x, y + 2, 3, 6 * (1 + 0.15 * Math.sin(t * 13 + i)));
  } else {
    ctx.strokeStyle = 'rgba(180,170,200,0.5)'; // (a cold wick)
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y - 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#1a1220';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const dx of [-5, 5]) {
    ctx.moveTo(x + dx, y - 15);
    ctx.lineTo(x + dx, y + 15);
  }
  ctx.stroke();
  ctx.fillStyle = '#3a3040';
  ctx.beginPath();
  ctx.roundRect(x - 14, y + 13, 28, 5, 2);
  ctx.fill();
  // its tag on a string, turning, a name scrawled on it (never readable)
  if (st !== 'o' || light > 0.3) {
    const ta = Math.sin(t * 0.9 + i * 1.7) * 0.6, tw = 10 * Math.cos(ta) + 0.5;
    ctx.strokeStyle = 'rgba(210,200,180,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x, y + 28);
    ctx.stroke();
    ctx.fillStyle = '#eadcc0';
    ctx.fillRect(x - tw / 2, y + 28, tw, 13);
    ctx.strokeStyle = 'rgba(70,52,40,0.7)';
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.3, y + 33);
    ctx.lineTo(x + tw * 0.3, y + 32);
    ctx.moveTo(x - tw * 0.25, y + 37);
    ctx.lineTo(x + tw * 0.2, y + 37.5);
    ctx.stroke();
  }
  if (hurt > 0.01) glow(ctx, x, y, 30, 30, '255,255,255', 0.6 * hurt);
}

// ——— phase 3: the silk walls, closing in from both ends (they hurt to stand in: the server's) ———
export function drawSilkWalls(ctx, sw, t) {
  for (const side of [-1, 1]) {
    const edge = side < 0 ? sw : FIN_W - sw, x0 = side < 0 ? -40 : edge, x1 = side < 0 ? edge : FIN_W + 40;
    const g = ctx.createLinearGradient(side < 0 ? x1 : x0, 0, side < 0 ? x1 - side * -120 : x0 + 120, 0);
    g.addColorStop(0, 'rgba(236,228,244,0.78)');
    g.addColorStop(1, 'rgba(214,204,230,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(side < 0 ? x0 : x1, 0);
    for (let y = 0; y <= GROUND + 8; y += 20) ctx.lineTo(edge + side * -1 * (Math.sin(y * 0.03 + t * 1.3) * 10 + Math.sin(y * 0.11 - t) * 4), y);
    ctx.lineTo(side < 0 ? x0 : x1, GROUND + 8);
    ctx.closePath();
    ctx.fill();
    // strands across it, and a red warmth at its edge (it hurts)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const y = (i * 29 + t * 6) % GROUND;
      ctx.moveTo(side < 0 ? 0 : FIN_W, y);
      ctx.quadraticCurveTo((edge + (side < 0 ? 0 : FIN_W)) / 2, y + 20, edge, y + 8);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,120,130,${0.35 + 0.2 * Math.sin(t * 5)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(edge, 0);
    ctx.lineTo(edge, GROUND);
    ctx.stroke();
  }
}

// ——— phase 4: the dark (one low-resolution layer, rebuilt only when its light moves) ———
const DARK_RES = 0.25;
let dark = null; // { key, c }
export function drawWickDark(ctx, bx, lamps, level, t) {
  const key = `${Math.round(bx / 8)}|${lamps.join('')}|${Math.round(level * 20)}`;
  if (!dark || dark.key !== key) {
    const c = dark?.c ?? document.createElement('canvas');
    c.width = Math.ceil((FIN_W + 200) * DARK_RES);
    c.height = Math.ceil(H * DARK_RES);
    const g = c.getContext('2d');
    g.setTransform(DARK_RES, 0, 0, DARK_RES, 100 * DARK_RES, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(-100, 0, FIN_W + 200, H);
    g.fillStyle = `rgba(4,2,8,${level})`;
    g.fillRect(-100, 0, FIN_W + 200, H);
    g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, rx, ry, a) => {
      g.save();
      g.translate(x, y);
      g.scale(rx, ry);
      const gr = g.createRadialGradient(0, 0, 0.55, 0, 0, 1);
      gr.addColorStop(0, `rgba(0,0,0,${a})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, 1, 0, TAU);
      g.fill();
      g.restore();
    };
    hole(bx, GROUND - 160, MOTHER_LIGHT_R + 30, 330, 1); // (her own light)
    HALL_LAMPS.forEach((L, i) => lamps[i] === 'p' && hole(L.x, L.y + 10, LIGHT_R + 30, 280, 1));
    dark = { key, c };
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(dark.c, -100, 0, FIN_W + 200, H);
  ctx.restore();
}

// ——— the Wickmother ———
// (ctx, w, h, st, m): feet at the origin (the floor), facing +x; her pose from `look`. A moth as big as a boathouse,
// grey-violet and furred, wrapped round the Crown of Lamps: a furred thorax with the shard in it like a flame behind glass,
// a long soft abdomen, a head with huge soft black eyes (a light moving in them) and feathered antennae, six legs holding
// lanterns, and four great wings patterned with eye spots that look like lanterns seen through fog. Wing-dust sifts off
// her all the time. The shard sits on MOBS.wickmother.weak's spot in the draw pose (w × 0.02, -h × 0.52): move one, move
// the other.
const FUR = '#9a8ea8', FUR_D = '#6a5e78', FUR_L = '#cec4da', WING = '#8a7e98', WING_D = '#5a4e6a', INK = '#1e1626';
function drawWickmother(ctx, w, h, st) {
  const P = look.p, t = st.t, dying = st.dying ?? 0;
  const beat = Math.sin(t * (look.po === 'hush' ? 3 : 1.1)) * (look.po === 'hush' ? 0.22 : 0.06);
  const open = clamp(P.open + beat * (1 - P.fold), 0, 1.15), lie = P.lie;
  const T = { x: w * 0.02 + lie * w * 0.08, y: -h * P.lift }; // the thorax
  const axis = lerp(-Math.PI / 2, -0.25, lie); // the body's way, head end (straight up when she hangs; forward when she lies)
  const ax = Math.cos(axis), ay = Math.sin(axis);
  const S = h / 320;
  // the wings: back pair then front pair. Folded, they hang down round her like a cloak to the floor; open, they spread up
  // and out wide either side
  const wing = (side, back) => {
    const sp = open * (back ? 0.9 : 1), span = (back ? 0.85 : 1) * h * (0.55 + 0.25 * sp);
    const base = lerp(Math.PI / 2 + side * 0.25, -Math.PI / 2 + side * (1.25 - 0.25 * P.fold), sp) + side * P.reach * 0.25;
    const tipA = base + side * (back ? 0.35 : 0.1), tip = { x: T.x + Math.cos(tipA) * span * (side < 0 ? 1 : 1), y: T.y + Math.sin(tipA) * span };
    const lead = { x: T.x + Math.cos(base - side * 0.3) * span * 0.6, y: T.y + Math.sin(base - side * 0.3) * span * 0.6 };
    const trail = { x: T.x + Math.cos(base + side * 0.55) * span * 0.75, y: T.y + Math.sin(base + side * 0.55) * span * 0.75 };
    // keep a hanging wing above the floor
    for (const p of [tip, lead, trail]) p.y = Math.min(p.y, -4);
    ctx.fillStyle = back ? WING_D : WING;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5 * S;
    ctx.beginPath();
    ctx.moveTo(T.x, T.y);
    ctx.quadraticCurveTo(lead.x, lead.y, tip.x, tip.y);
    ctx.quadraticCurveTo(trail.x + (tip.x - trail.x) * 0.2, trail.y + 30 * S, trail.x, trail.y);
    ctx.quadraticCurveTo((trail.x + T.x) / 2, (trail.y + T.y) / 2 + 20 * S, T.x, T.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // veins
    ctx.strokeStyle = 'rgba(40,30,52,0.45)';
    ctx.lineWidth = 1.4 * S;
    ctx.beginPath();
    for (const f of [0.35, 0.6, 0.85]) {
      ctx.moveTo(T.x, T.y);
      ctx.lineTo(lerp(trail.x, tip.x, f), lerp(trail.y, tip.y, f));
    }
    ctx.stroke();
    // the eye spot: rings like a lantern seen through fog, catching the light the more she opens
    const E = { x: lerp(T.x, lerp(trail.x, tip.x, 0.55), 0.62), y: lerp(T.y, lerp(trail.y, tip.y, 0.55), 0.62) }, er = (back ? 22 : 30) * S;
    if (!back || open > 0.4) {
      const shine = 0.3 + 0.7 * clamp(open, 0, 1);
      glow(ctx, E.x, E.y, er * 2, er * 2, LAMPLIGHT, 0.25 * shine);
      ctx.fillStyle = '#3a3048';
      circle(ctx, E.x, E.y, er);
      ctx.fillStyle = `rgba(214,190,150,${0.9})`;
      circle(ctx, E.x, E.y, er * 0.72);
      ctx.fillStyle = '#2a2034';
      circle(ctx, E.x, E.y, er * 0.48);
      ctx.fillStyle = `rgba(255,226,170,${0.5 + 0.5 * shine})`;
      circle(ctx, E.x + er * 0.12, E.y - er * 0.12, er * 0.24);
    }
    // the fringe of fur along its edge
    ctx.fillStyle = 'rgba(206,196,218,0.35)';
    for (let k = 0.15; k < 1; k += 0.14) circle(ctx, lerp(trail.x, tip.x, k), lerp(trail.y, tip.y, k), 4 * S);
  };
  wing(-1, true);
  wing(1, true);
  // the abdomen, long and soft, hanging behind the thorax (segmented, furred)
  const abdLen = h * 0.36 * (1 - 0.4 * P.fold * (look.po === 'freed' ? 1 : 0));
  for (let i = 5; i >= 0; i--) {
    const k = (i + 1) / 6, cx = T.x - ax * abdLen * k, cy = T.y - ay * abdLen * k, rr = h * (0.095 - 0.01 * i) * (1 + 0.04 * Math.sin(t * 1.6 + i));
    ctx.fillStyle = i % 2 ? FUR_D : FUR;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rr, rr * 0.86, axis, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // the legs: six, three seen, each holding a little lantern out
  for (let j = 0; j < 3; j++) {
    const hip = { x: T.x + ax * (j - 1) * 14 * S, y: T.y + ay * (j - 1) * 14 * S + 10 * S };
    const knee = { x: hip.x + (24 + j * 8) * S, y: hip.y + 30 * S - lie * 20 * S };
    const foot = { x: knee.x + (6 - j * 6) * S, y: Math.min(-6, knee.y + 34 * S) };
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5 * S;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(knee.x, knee.y);
    ctx.lineTo(foot.x, foot.y);
    ctx.stroke();
    if (look.po !== 'freed') {
      const lit = look.ph < 3;
      if (lit) glow(ctx, foot.x, foot.y + 8 * S, 16 * S, 16 * S, LAMPLIGHT, 0.5);
      ctx.fillStyle = '#2a2230';
      ctx.fillRect(foot.x - 5 * S, foot.y + 1 * S, 10 * S, 13 * S);
      ctx.fillStyle = lit ? '#ffe2a8' : '#4a4460';
      ctx.fillRect(foot.x - 3 * S, foot.y + 3 * S, 6 * S, 9 * S);
    }
  }
  // the thorax: a furred ruff, the shard glowing in it like a flame behind glass
  ctx.fillStyle = FUR;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5 * S;
  ctx.beginPath();
  ctx.ellipse(T.x, T.y, h * 0.12, h * 0.135, axis + Math.PI / 2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = FUR_L;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    circle(ctx, T.x + Math.cos(a) * h * 0.11, T.y + Math.sin(a) * h * 0.12, 9 * S);
  }
  const sh = P.shard * (1 - dying);
  glow(ctx, T.x, T.y, (26 + 40 * sh) * S, (26 + 40 * sh) * S, '255,236,190', 0.3 + 0.6 * sh);
  ctx.fillStyle = `rgba(255,250,232,${0.6 + 0.4 * sh})`;
  ctx.beginPath();
  ctx.moveTo(T.x, T.y - 14 * S);
  ctx.lineTo(T.x + 7 * S, T.y);
  ctx.lineTo(T.x, T.y + 12 * S);
  ctx.lineTo(T.x - 7 * S, T.y);
  ctx.closePath();
  ctx.fill();
  // the head, up the axis from the thorax: huge soft black eyes with a light moving in them, feathered antennae
  const Hd = { x: T.x + ax * h * 0.16, y: T.y + ay * h * 0.16 };
  ctx.fillStyle = FUR_D;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2 * S;
  circle(ctx, Hd.x, Hd.y, h * 0.075);
  ctx.stroke();
  for (const s of [-1, 1]) { // the antennae: long feathered fronds
    const base = { x: Hd.x + ax * h * 0.05 + s * 8 * S, y: Hd.y + ay * h * 0.05 }, a = axis + s * 0.5;
    const tip = { x: base.x + Math.cos(a) * h * 0.24, y: base.y + Math.sin(a) * h * 0.24 };
    ctx.strokeStyle = FUR_L;
    ctx.lineWidth = 2.5 * S;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.quadraticCurveTo(base.x + Math.cos(a - s * 0.3) * h * 0.14, base.y + Math.sin(a - s * 0.3) * h * 0.14, tip.x, tip.y);
    ctx.stroke();
    ctx.lineWidth = 1.2 * S;
    ctx.beginPath();
    for (let k = 0.2; k < 1; k += 0.1) {
      const px = lerp(base.x, tip.x, k), py = lerp(base.y, tip.y, k), nl = (1 - Math.abs(k - 0.55)) * 14 * S;
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a + 1.3) * nl, py + Math.sin(a + 1.3) * nl);
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a - 1.3) * nl, py + Math.sin(a - 1.3) * nl);
    }
    ctx.stroke();
  }
  const eye = { x: Hd.x + 14 * S, y: Hd.y + 2 * S }, er = h * 0.05;
  ctx.fillStyle = '#0a0610';
  circle(ctx, eye.x, eye.y, er);
  const lx = Math.sin(t * 0.7) * er * 0.4, ly = Math.cos(t * 0.5) * er * 0.3;
  glow(ctx, eye.x + lx, eye.y + ly, er * 0.8, er * 0.8, LAMPLIGHT, 0.5 * (1 - dying));
  ctx.fillStyle = `rgba(255,236,190,${0.85 * (1 - dying)})`;
  circle(ctx, eye.x + lx, eye.y + ly, er * 0.2);
  // the front wings over the body
  wing(-1, false);
  wing(1, false);
  // the Cocoon: silk wrapped round her
  if (P.wrap > 0.02) {
    ctx.strokeStyle = `rgba(240,232,250,${0.75 * P.wrap})`;
    ctx.lineWidth = 3 * S;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const y = T.y - h * 0.3 + i * h * 0.05;
      ctx.moveTo(T.x - w * 0.42, y + Math.sin(i + t) * 4);
      ctx.quadraticCurveTo(T.x, y + 18 * S, T.x + w * 0.42, y - 6 * S);
    }
    ctx.stroke();
  }
  // wing-dust coming off her
  ctx.fillStyle = 'rgba(232,228,246,0.6)';
  for (let i = 0; i < 12; i++) {
    const k = ((t * 0.25 + i * 0.083) % 1), x = T.x + Math.sin(i * 2.3) * w * 0.5, y = T.y + k * (-T.y);
    circle(ctx, x, y, 1.4 * S);
  }
  // her outline for the warn / hurt flash: a soft ellipse round her body and folded wings
  return () => ctx.ellipse(T.x, T.y + h * 0.1, w * 0.45 + open * w * 0.2, h * 0.32, 0, 0, TAU);
}
// freed: an ordinary moth's size, asleep, wings folded, a little light still in her (and the pet, scaled)
export function drawSmallMoth(ctx, t, s = 1) {
  const b = Math.sin(t * 1.3) * 0.08;
  glow(ctx, 0, -2 * s, 18 * s, 18 * s, LAMPLIGHT, 0.35);
  ctx.fillStyle = WING;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -6 * s);
    ctx.quadraticCurveTo(side * 16 * s * (1 + b), -14 * s, side * 14 * s, 6 * s);
    ctx.quadraticCurveTo(side * 6 * s, 8 * s, 0, 4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(214,190,150,0.9)';
    circle(ctx, side * 9 * s, -2 * s, 2.6 * s);
    ctx.fillStyle = WING;
  }
  ctx.fillStyle = FUR;
  ellipse(ctx, 0, -2 * s, 4 * s, 8 * s);
  ctx.fillStyle = 'rgba(255,240,200,0.9)';
  circle(ctx, 0, -3 * s, 1.6 * s);
  ctx.strokeStyle = FUR_L;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1 * s, -9 * s);
  ctx.quadraticCurveTo(-6 * s, -16 * s, -8 * s, -18 * s);
  ctx.moveTo(1 * s, -9 * s);
  ctx.quadraticCurveTo(6 * s, -16 * s, 8 * s, -18 * s);
  ctx.stroke();
}
export const BOSS_ART = { wickmother: drawWickmother };

// ——— her ultimates (FX2: dens.js spawns `${kind}Warn` / `${kind}Hit`) ———
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
// each lantern's strip of floor: from halfway to the one before it to halfway to the one after
const STRIPS = HALL_LAMPS.map((L, i) => [i ? (HALL_LAMPS[i - 1].x + L.x) / 2 : 0, i < HALL_LAMPS.length - 1 ? (HALL_LAMPS[i + 1].x + L.x) / 2 : FIN_W]);
// which strips All Souls' Night spares, as the wind-up sees it now (the server judges it at the hit: u.safe)
function soulsSafe(e) {
  if (e.safe) return e.safe;
  return HALL_LAMPS.map((L, i) => i).filter((i) => (look.lamps[i] === 'o' || (e.dark ?? []).includes(i)) && !(look.ph >= 3 && Math.abs(HALL_LAMPS[i].x - look.bx) < MOTHER_LIGHT_R));
}
// All Souls' Night: she opens her wings and every lit lantern's light swells toward her; the strips under them redden,
// the dark ones (green) are safe
function soulsWarn(ctx, e, k) {
  const safe = soulsSafe(e), pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  STRIPS.forEach(([a, b], i) => {
    const L = HALL_LAMPS[i];
    if (safe.includes(i)) {
      glow(ctx, (a + b) / 2, GROUND - 40, (b - a) * 0.6, 60, '140,255,190', 0.35 + 0.2 * pulse);
      ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(a + 4, GROUND - 260, b - a - 8, 260);
      ctx.setLineDash([]);
      safeTag(ctx, (a + b) / 2, GROUND - 150, e.t);
    } else {
      ctx.fillStyle = `rgba(255,150,110,${0.06 + 0.12 * k + 0.06 * pulse})`;
      ctx.fillRect(a, 0, b - a, GROUND);
      glow(ctx, L.x, L.y, 40 + 80 * k, 40 + 80 * k, LAMPLIGHT, 0.3 + 0.4 * k);
    }
  });
}
function soulsHit(ctx, e, k) {
  const safe = soulsSafe(e), up = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
  STRIPS.forEach(([a, b], i) => {
    if (safe.includes(i)) return;
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, `rgba(255,240,200,${0.1 * up})`);
    g.addColorStop(1, `rgba(255,214,150,${0.75 * up})`);
    ctx.fillStyle = g;
    ctx.fillRect(a, 0, b - a, GROUND + 4);
  });
}
// The Long Night: the silk at the far end bulges as she gathers every strand; the high root ledge at the end it rolls to
// (green) is the only shelter. The wave itself is drawn by src/wickmother.js as its front passes
function nightLedge(dir) {
  return HALL_PLATFORMS[dir > 0 ? HIGH_E : HIGH_W];
}
function nightWarn(ctx, e, k) {
  const dir = e.dir ?? 1, x0 = dir > 0 ? 0 : FIN_W, pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  const g = ctx.createLinearGradient(x0, 0, x0 + dir * 260 * (0.4 + k), 0);
  g.addColorStop(0, `rgba(236,228,244,${0.3 + 0.4 * k})`);
  g.addColorStop(1, 'rgba(236,228,244,0)');
  ctx.fillStyle = g;
  ctx.fillRect(dir > 0 ? 0 : FIN_W - 260 * (0.4 + k), 0, 260 * (0.4 + k), GROUND);
  ctx.fillStyle = `rgba(240,234,250,${0.4 + 0.3 * pulse})`;
  for (let x = 120; x < FIN_W; x += 260) {
    ctx.beginPath();
    ctx.moveTo(x - dir * 14, 70);
    ctx.lineTo(x + dir * 14, 82);
    ctx.lineTo(x - dir * 14, 94);
    ctx.lineTo(x - dir * 6, 82);
    ctx.fill();
  }
  const p = nightLedge(dir);
  glow(ctx, p.x + p.w / 2, p.y - 30, p.w, 60, '140,255,190', 0.5 + 0.2 * pulse);
  ctx.strokeStyle = `rgba(150,255,180,${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(p.x, p.y - 110, p.w, 110);
  ctx.setLineDash([]);
  safeTag(ctx, p.x + p.w / 2, p.y - 130, e.t);
}
function nightHit(ctx, e, k) {
  const flash = k < 0.08 ? k / 0.08 : clamp(1 - (k - 0.08) / 0.25, 0, 1);
  if (flash > 0.01) {
    ctx.fillStyle = `rgba(240,234,250,${0.18 * flash})`;
    ctx.fillRect(0, 0, FIN_W, GROUND + 4);
  }
  const p = nightLedge(e.dir ?? 1);
  glow(ctx, p.x + p.w / 2, p.y - 30, p.w, 50, '140,255,190', 0.4 * (1 - k));
}
export const FX2 = {
  soulsWarn: { dur: 4, draw: soulsWarn },
  soulsHit: { dur: 1.3, draw: soulsHit },
  nightWarn: { dur: 4, draw: nightWarn },
  nightHit: { dur: 1.2, draw: nightHit },
};
