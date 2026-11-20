// Docs: docs/places/carapace.md, docs/combat/bosses.md
// Old Carapace's den, the Long Road (atlas Phase 9 A5 (c), theme 'shell'): his back, with the empty caravan town of his people
// on it (striped tents with their flaps tied back, the dry well in its ring of stone, lanterns gone out on poles), the shell's
// plates under the floor and its rim going down at either end, the desert going by far below (it scrolls west as he walks,
// and stops when the town drinks), the sky going from afternoon to dusk to the storm's red with the phases; and his head
// and neck at the east end (BOSS_ART: the boss mob's x), out past the front of the shell, looking ahead, turning back to
// look at you. Poses are eased numbers (POSES) set from the 'final' message (setShellLook, src/carapace.js). His ultimates
// are the shared ones: The Long Road (`wave`: ULT_LOOKS, the road coming over his back as a wall of dust and stones) and
// Earthshaker (`nova`). Freed (look.freedAt): he lies down; the town settles, the flaps fall closed, the dust stops.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT import
// dens.js. Also here: the mini Old Carapace (drawCarapacePet, the Pet Shop: src/furniture.js).
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { WELL_X, CARAPACE_PLATFORMS } from './shared/carapace.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
export const SAND_RGB = '232,190,130';
const HIDE = '#a88466', HIDE_D = '#6a4e3a', HIDE_L = '#c8a888';
const PLATE = '#8a6a4a', PLATE_D = '#4e3a2a', PLATE_L = '#b8946c';
const STRIPES = ['#c8583a', '#3e5a9a', '#d8a84a', '#6a8a5a'];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
export function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35); // src/glow.js
}
function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
const ease = (k) => k * k * (3 - 2 * k);

// ——— his look: eased numbers between poses ———
// lift: the head up · back: turned to look back along the shell (west) · tuck: drawn into the shell · low: lowered · eye: open
const POSES = {
  walk: { lift: 0.45, back: 0, tuck: 0, low: 0, eye: 1 },
  look: { lift: 0.55, back: 1, tuck: 0, low: 0, eye: 1 },
  snap: { lift: 1, back: 1, tuck: 0, low: 0, eye: 1 },
  bite: { lift: 0.1, back: 1, tuck: 0, low: 0.8, eye: 1 },
  stamp: { lift: 0.9, back: 0, tuck: 0, low: 0, eye: 0.6 },
  drawn: { lift: 0, back: 0, tuck: 1, low: 0, eye: 0.4 },
  dust: { lift: 0.4, back: 0, tuck: 0.3, low: 0, eye: 0.7 },
  rest: { lift: 0, back: 0, tuck: 0, low: 1, eye: 0.3 },
  drink: { lift: 0, back: 0, tuck: 0, low: 0.7, eye: 0 },
  stag: { lift: 0.3, back: 0.3, tuck: 0, low: 0.3, eye: 0.5 },
  haul: { lift: 1, back: 0, tuck: 0, low: 0, eye: 1 },
  rear: { lift: 1, back: 0, tuck: 0, low: 0, eye: 1 },
  trample: { lift: 0.8, back: 0, tuck: 0, low: 0, eye: 1 },
  freed: { lift: 0, back: 0, tuck: 0, low: 1, eye: 0 },
};
let look = { po: 'walk', ph: 0, enr: false, sp: 0, slaked: false, p: { ...POSES.walk }, scroll: 0, freedAt: -1e9, lastT: null };
export function setShellLook(o) {
  look = { ...look, ...o };
}
export const shellLook = () => look;
function stepLook(time) {
  const dt = look.lastT == null ? 0 : clamp(time - look.lastT, 0, 0.1);
  look.lastT = time;
  const want = POSES[look.po] ?? POSES.walk, k = Math.min(1, dt * 3.5);
  for (const key of Object.keys(want)) look.p[key] += (want[key] - look.p[key]) * k;
  const freed = time - look.freedAt < BOSS_RESPAWN_MS / 1000;
  if (!look.slaked && !freed) look.scroll += dt * (60 + look.ph * 18 + (look.enr ? 30 : 0)); // (the desert going by below)
  return freed;
}

// ——— the den ———
const R0 = mulberry32(9851);
const DUNES = Array.from({ length: 12 }, (_, i) => ({ x: i * 340 + R0() * 120, w: 260 + R0() * 200, h: 30 + R0() * 40 }));
const PLATES = (() => {
  const out = [];
  for (let x = -40; x < DEN_W + 80; x += 120) out.push({ x: x + (out.length % 2) * 40, w: 110 + R0() * 20 });
  return out;
})();
const TENTS = [{ x: 190, w: 200, h: 110, c: 0 }, { x: 395, w: 150, h: 204, c: 1 }, { x: 940, w: 200, h: 110, c: 2 }, { x: 1115, w: 150, h: 204, c: 3 }];
const POLES = [80, 520, 780, 1260];
const MOTES = Array.from({ length: 40 }, () => ({ x: R0() * DEN_W, y: 40 + R0() * 380, v: 20 + R0() * 40, s: 1 + R0() * 1.5 }));
const SKY = [ // (by phase: afternoon, late afternoon, dusk, the storm; freed: a still dusk)
  [[0, '#3a6aa8'], [0.5, '#9ab8d0'], [1, '#f0d8a8']],
  [[0, '#3a5a98'], [0.5, '#c8a890'], [1, '#f4c890']],
  [[0, '#2a2e62'], [0.45, '#a8627a'], [1, '#f49a5a']],
  [[0, '#3a0e0a'], [0.5, '#8a2e1e'], [1, '#d8704a']],
];
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

function drawDenShell(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  const freed = stepLook(time);
  const ph = freed ? 2 : clamp(look.ph, 0, 3), bob = freed || look.slaked ? 0 : Math.sin(look.sp * TAU * 2) * 2.5;
  ctx.save();
  // the sky by phase, and the sun going down in it
  ctx.fillStyle = vgrad(ctx, `sky-shell-${ph}`, 0, GROUND, SKY[ph]);
  ctx.fillRect(L, 0, R - L, H);
  const sunY = [70, 120, 210, 180][ph];
  glow(ctx, DEN_W * 0.25, sunY, 170, 110, ph === 3 ? '255,120,80' : '255,236,190', ph === 3 ? 0.3 : 0.45);
  ctx.fillStyle = ph === 3 ? 'rgba(255,170,130,0.55)' : 'rgba(255,248,226,0.9)';
  circle(ctx, DEN_W * 0.25, sunY, ph >= 2 ? 26 : 18);
  if (freed) { // (the first stars, freed)
    ctx.fillStyle = 'rgba(255,255,240,0.8)';
    for (let i = 0; i < 14; i++) circle(ctx, ((i * 197) % DEN_W), 20 + ((i * 53) % 120), 1.2);
  }
  if (ph === 3) { // the storm ahead, east: a red wall over the horizon he's walking into
    const g = ctx.createLinearGradient(DEN_W * 0.4, 0, DEN_W + 80, 0);
    g.addColorStop(0, 'rgba(150,56,36,0)');
    g.addColorStop(1, 'rgba(150,56,36,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(L, 0, R - L, GROUND);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(${i % 2 ? '200,96,62' : '120,40,26'},0.35)`;
      ellipse(ctx, DEN_W - 160 + Math.sin(time * 0.6 + i) * 60, 60 + i * 34, 220, 20);
    }
  }
  // the desert far below, going by west as he walks
  const hz = 300;
  ctx.fillStyle = ph === 3 ? '#b87048' : '#e0b478';
  ctx.fillRect(L, hz, R - L, GROUND - hz);
  for (const d of DUNES) {
    const x = ((((d.x - look.scroll * 0.6) % 4080) + 4080) % 4080) - 300;
    if (!visible(x - d.w, x + d.w, L, R)) continue;
    ctx.fillStyle = ph === 3 ? '#c8805a' : '#ecc68a';
    ctx.beginPath();
    ctx.moveTo(x - d.w / 2, hz + 40);
    ctx.quadraticCurveTo(x - d.w * 0.1, hz + 40 - d.h, x + d.w / 2, hz + 40);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,240,210,0.25)'; // heat shimmer
  ctx.fillRect(L, hz + 2, R - L, 3);
  // the town on his back (bobbing a little with every step; still once freed)
  ctx.save();
  ctx.translate(0, bob);
  for (const x of POLES) if (visible(x - 20, x + 20, L, R)) drawPole(ctx, x, time, freed);
  for (const tn of TENTS) if (visible(tn.x - tn.w, tn.x + tn.w, L, R)) drawTent(ctx, tn, time, freed);
  if (visible(WELL_X - 120, WELL_X + 120, L, R)) drawWell(ctx);
  ctx.restore();
  // the shell: the floor is his back, its great plates going down into the dark under it, the rim curving down at each end
  ctx.fillStyle = vgrad(ctx, 'floor-shell', GROUND, H, [[0, PLATE_L], [0.4, PLATE], [1, PLATE_D]]);
  ctx.fillRect(L, GROUND - 2, R - L, H - GROUND + 10);
  ctx.strokeStyle = 'rgba(78,58,42,0.6)';
  ctx.lineWidth = 2;
  for (const p of PLATES) {
    if (!visible(p.x, p.x + p.w, L, R)) continue;
    ctx.beginPath();
    ctx.roundRect(p.x, GROUND + 6, p.w, 60, 14);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,170,130,0.25)'; // its growth rings
    ellipse(ctx, p.x + p.w / 2, GROUND + 36, p.w * 0.3, 14);
  }
  ctx.fillStyle = 'rgba(232,200,150,0.7)'; // the dust of the road in every crease
  ctx.fillRect(L, GROUND - 4, R - L, 5);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Long Road', 750, time);
  CARAPACE_PLATFORMS.forEach((p) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p, freed));
  if (!freed) { // dust blowing along the shell, the way he walks
    for (const m of MOTES) {
      const x = ((((m.x - time * m.v) % DEN_W) + DEN_W) % DEN_W);
      if (!visible(x - 4, x + 4, L, R)) continue;
      ctx.fillStyle = `rgba(${SAND_RGB},0.45)`;
      circle(ctx, x, m.y + Math.sin(time + m.x) * 6, m.s);
    }
  }
  ctx.restore();
}
// a lantern on a pole, gone out, a striped rag tied under it
function drawPole(ctx, x, time, freed) {
  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, GROUND);
  ctx.lineTo(x, GROUND - 170);
  ctx.lineTo(x + 18, GROUND - 170);
  ctx.stroke();
  ctx.fillStyle = '#6a5a4a';
  ctx.fillRect(x + 12, GROUND - 168, 12, 16);
  ctx.fillStyle = freed ? '#8a6a4a' : '#c8583a';
  ctx.beginPath();
  ctx.moveTo(x, GROUND - 150);
  ctx.quadraticCurveTo(x - 14 + (freed ? 0 : Math.sin(time * 3 + x) * 4), GROUND - 140, x - 18, GROUND - 124);
  ctx.lineTo(x, GROUND - 132);
  ctx.closePath();
  ctx.fill();
}
// a striped tent, its flap tied back on the dark inside (fallen closed, once freed)
function drawTent(ctx, tn, time, freed) {
  const { x, w, h, c } = tn, b = GROUND;
  ctx.fillStyle = '#e8d4b0';
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, b);
  ctx.lineTo(x - w * 0.42, b - h * 0.72);
  ctx.quadraticCurveTo(x, b - h - 8, x + w * 0.42, b - h * 0.72);
  ctx.lineTo(x + w / 2, b);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = STRIPES[c];
  for (let k = -3; k <= 3; k++) ctx.fillRect(x + k * w * 0.14 - w * 0.035, b - h - 10, w * 0.07, h + 12);
  ctx.restore();
  ctx.fillStyle = freed ? 'rgba(200,170,130,0.95)' : '#2a1a10'; // the door: dark and open, or its flap fallen to
  ctx.beginPath();
  ctx.moveTo(x - w * 0.12, b);
  ctx.lineTo(x, b - h * 0.5);
  ctx.lineTo(x + w * 0.12, b);
  ctx.closePath();
  ctx.fill();
  if (!freed) {
    ctx.fillStyle = 'rgba(232,212,176,0.95)'; // the flap tied back
    ctx.beginPath();
    ctx.moveTo(x, b - h * 0.5);
    ctx.quadraticCurveTo(x + w * 0.2, b - h * 0.3, x + w * 0.22, b - 6);
    ctx.lineTo(x + w * 0.12, b);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#5a3a24'; // the guy-ropes
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.42, b - h * 0.72);
  ctx.lineTo(x - w * 0.62, b);
  ctx.moveTo(x + w * 0.42, b - h * 0.72);
  ctx.lineTo(x + w * 0.62, b);
  ctx.stroke();
}
// the town's well, dry an age: a ring of dressed stone, its windlass frame over it (a ledge), the rope long gone
function drawWell(ctx) {
  const x = WELL_X, b = GROUND;
  ctx.fillStyle = '#b89a76';
  ctx.strokeStyle = '#6a4e3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 56, b - 40, 112, 42, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(106,78,58,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = -36; k < 56; k += 24) {
    ctx.moveTo(x + k, b - 40);
    ctx.lineTo(x + k, b);
  }
  ctx.moveTo(x - 56, b - 20);
  ctx.lineTo(x + 56, b - 20);
  ctx.stroke();
  ctx.fillStyle = '#2a1a10';
  ellipse(ctx, x, b - 40, 46, 8);
  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 50, b - 40);
  ctx.lineTo(x - 44, b - 216);
  ctx.moveTo(x + 50, b - 40);
  ctx.lineTo(x + 44, b - 216);
  ctx.stroke();
}
// The ledges: tent ridges and awnings, and the windlass's beam over the well
function drawLedge(ctx, p, freed) {
  const { x, y, w, kind } = p;
  if (kind === 'windlass') {
    ctx.fillStyle = '#7a5a3a';
    ctx.strokeStyle = '#4a2e1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 4, w + 12, 12, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5a3a24';
    circle(ctx, x + w / 2, y + 2, 8);
    return;
  }
  ctx.fillStyle = kind === 'roof' ? '#c8a878' : '#d8c09a';
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,200,150,0.6)';
  ellipse(ctx, x + w * 0.3, y - 3, w * 0.18, 2.4);
}
function drawExit(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '255,236,200', 0.3);
  ctx.fillStyle = PLATE_L; // the shell's rim going down, scales stepped like a stair (the way back down his hind leg)
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.roundRect(x - 40 + i * 4, b - 12 - i * 18, 70 - i * 6, 14, 6);
    ctx.fill();
  }
  text(ctx, 'DOWN', x, b - 150, 13, '#3a2a1a');
}
// The name, on a caravan's painted board tied between two tent poles
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 96);
  ctx.rotate(Math.sin(time * 0.5) * 0.012);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 16, tw / 2 - 16]) {
    ctx.moveTo(sx, -40);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = '#d8b88a';
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(62,90,154,0.7)';
  ctx.fillRect(-tw / 2 + 6, 14, tw - 12, 5);
  text(ctx, name, 0, 1, 18, '#3a2210');
  ctx.restore();
}
export const DEN_ART = { shell: drawDenShell };

// ——— Old Carapace (ctx, w, h, st) => sil, origin at his body's foot on the floor (the head's x), +x = facing (east) ———
// The front of the shell ends behind him (its rim at -w*0.7); out of it comes his neck, long and thick and creased, rising
// and curving forward to the head: old, kind, very tired eyes, a beak worn smooth, dust in every crease. Poses (look.p):
// lifted, turned back along the shell, drawn in, lowered. st.still: freed, lying with his head down on the sand.
function drawOldCarapace(ctx, w, h, st) {
  const { t, seed, enr, warn, dying } = st;
  const live = dying < 0.02 && !st.still;
  const p = st.still ? POSES.freed : look.p;
  const lift = p.lift + (warn ? 0.2 : 0), back = p.back, tuck = p.tuck, low = p.low;
  const breathe = live ? Math.sin(t * 1.4 + seed) * 3 : 0;
  // the neck's root (at the shell's edge, behind) and the head
  const rx = -w * 0.62, ry = -h * 0.2;
  const reach = 1 - tuck * 0.75;
  let hx = rx + (w * 0.86 - back * w * 0.9) * reach, hy = ry - (h * (0.3 + 0.42 * lift) - low * h * 0.36) * reach + breathe;
  if (st.still) [hx, hy] = [w * 0.2, -26];
  const face = back > 0.5 ? -1 : 1; // (which way the head looks)
  const sil = () => {
    ctx.beginPath();
    ctx.ellipse(hx, hy, w * 0.2, h * 0.11, 0, 0, TAU);
    ctx.moveTo(rx, ry);
    ctx.lineTo(hx, hy);
  };
  ctx.save();
  // the shell's front rim behind him, and its scutes, going down to the sand
  ctx.fillStyle = PLATE;
  ctx.strokeStyle = PLATE_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 1.1, 4);
  ctx.quadraticCurveTo(-w * 0.9, -h * 0.5, -w * 0.5, -h * 0.28);
  ctx.quadraticCurveTo(-w * 0.36, -h * 0.12, -w * 0.32, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,200,150,0.5)';
  ellipse(ctx, -w * 0.62, -h * 0.2, w * 0.12, h * 0.05);
  // the neck: thick, creased, curving up and forward to the head
  const neckW = h * 0.22 * (1 - tuck * 0.3);
  const cx = (rx + hx) / 2 + (back > 0.5 ? w * 0.2 : -w * 0.1), cy = Math.min(ry, hy) - h * 0.12 * (1 - low);
  const neckPath = (off) => {
    ctx.beginPath();
    ctx.moveTo(rx, ry + off);
    ctx.quadraticCurveTo(cx, cy + off, hx, hy + off * 0.6);
  };
  ctx.lineCap = 'round';
  ctx.strokeStyle = HIDE_D;
  ctx.lineWidth = neckW + 6;
  neckPath(0);
  ctx.stroke();
  ctx.strokeStyle = enr ? mix(HIDE, '#ff6a4a', 0.2) : HIDE;
  ctx.lineWidth = neckW;
  neckPath(0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,210,180,0.45)'; // its pale throat
  ctx.lineWidth = neckW * 0.35;
  neckPath(neckW * 0.25);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(78,58,42,0.45)'; // creases across it
  ctx.lineWidth = 1.6;
  for (let i = 1; i < 6; i++) {
    const k = i / 6, x = (1 - k) * (1 - k) * rx + 2 * (1 - k) * k * cx + k * k * hx, y = (1 - k) * (1 - k) * ry + 2 * (1 - k) * k * cy + k * k * hy;
    ctx.beginPath();
    ctx.arc(x, y, neckW * 0.42, -0.6 + Math.PI / 2, 0.6 + Math.PI / 2);
    ctx.stroke();
  }
  // the head: a long rounded wedge, beak at the front
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(face, 1);
  ctx.rotate(-0.1 + low * 0.35 - lift * 0.1);
  const g = ctx.createLinearGradient(0, -h * 0.12, 0, h * 0.1);
  g.addColorStop(0, HIDE_L);
  g.addColorStop(1, HIDE);
  ctx.fillStyle = g;
  ctx.strokeStyle = HIDE_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -h * 0.07);
  ctx.quadraticCurveTo(w * 0.06, -h * 0.13, w * 0.2, -h * 0.03);
  ctx.quadraticCurveTo(w * 0.24, h * 0.03, w * 0.16, h * 0.06);
  ctx.quadraticCurveTo(-w * 0.04, h * 0.1, -w * 0.16, h * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = HIDE_D; // the beak's line, worn smooth
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, h * 0.03);
  ctx.quadraticCurveTo(w * 0.14, h * 0.02, w * 0.21, -h * 0.01);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,200,150,0.6)'; // dust in the creases
  ellipse(ctx, -w * 0.04, -h * 0.08, w * 0.06, h * 0.015);
  // the eye: old and kind, heavy-lidded; shut, freed or drinking
  const ex = w * 0.07, ey = -h * 0.04, open = clamp(p.eye, 0, 1);
  ctx.fillStyle = HIDE_D;
  ellipse(ctx, ex, ey, 9, 7);
  if (open > 0.15 && live) {
    ctx.fillStyle = enr ? '#7a1e10' : '#2a1a10';
    ellipse(ctx, ex + 1, ey + 1, 5.4, 5 * open);
    ctx.fillStyle = 'rgba(255,240,210,0.85)';
    circle(ctx, ex + 2.6, ey - 0.6, 1.4);
  }
  ctx.strokeStyle = HIDE_D; // the lid
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(ex, ey + 1, 8, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  if (!open || !live) {
    ctx.beginPath();
    ctx.moveTo(ex - 7, ey + 1);
    ctx.quadraticCurveTo(ex, ey + 5, ex + 7, ey + 1);
    ctx.stroke();
  }
  ctx.restore();
  if (warn && live) glow(ctx, hx, hy, 60, 50, '255,200,150', 0.3);
  ctx.restore();
  return sil;
}
export const BOSS_ART = { old_carapace: drawOldCarapace };
export { drawOldCarapace };

// ——— The Long Road: the `wave` ult drawn as the road itself coming over his back, a wall of dust and stones (jump it, or a
// roof) ———
const SHELL_ULT = {
  waveWarn(ctx, e, k) {
    const { x0, dir } = e, y = GROUND;
    const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
    ctx.fillStyle = `rgba(${SAND_RGB},${0.08 + 0.14 * pulse})`; // the lane it will sweep
    ctx.fillRect(-20, y - 140, DEN_W + 40, 142);
    const ht = 150 * ease(k); // the dust rising off the road where it comes from
    const g = ctx.createLinearGradient(0, y - ht, 0, y);
    g.addColorStop(0, 'rgba(232,190,130,0.15)');
    g.addColorStop(1, 'rgba(184,130,84,0.85)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - dir * 90, y);
    ctx.quadraticCurveTo(x0 - dir * 60, y - ht, x0 + dir * 10, y - ht * 0.9);
    ctx.lineTo(x0 + dir * 30, y);
    ctx.closePath();
    ctx.fill();
  },
  waveGo(ctx, e) {
    const x = e.x0 + e.dir * e.speed * e.t, top = GROUND - 138;
    const g = ctx.createLinearGradient(x - e.dir * 120, 0, x, 0);
    g.addColorStop(0, 'rgba(184,130,84,0)');
    g.addColorStop(1, 'rgba(184,130,84,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - e.dir * 120, GROUND);
    ctx.lineTo(x - e.dir * 120, top + 10);
    ctx.quadraticCurveTo(x - e.dir * 30, top - 12, x + e.dir * 10, top + 22);
    ctx.quadraticCurveTo(x + e.dir * 22, GROUND - 60, x + e.dir * 8, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a6a4a'; // stones tumbling in it
    for (let i = 0; i < 6; i++) {
      const a = e.t * 7 + i * 1.1;
      ctx.save();
      ctx.translate(x - e.dir * (16 + i * 16), top + 26 + i * 18 + Math.sin(a) * 6);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.roundRect(-6, -5, 12, 10, 3);
      ctx.fill();
      ctx.restore();
    }
  },
};
export const ULT_LOOKS = { shell: SHELL_ULT };

// ——— the mini Old Carapace (the Pet Shop): a tortoise with a tiny town on his back, walking very slowly, always ———
export function drawCarapacePet(ctx, x, y, facing, walking, time, seed) {
  const step = walking ? Math.sin(time * 2.4 + seed) : Math.sin(time * 0.6 + seed) * 0.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = 'rgba(60,40,30,0.25)';
  ellipse(ctx, 0, 0, 32, 4);
  ctx.fillStyle = HIDE;
  for (const [lx, ph] of [[-18, 1], [-6, -1], [8, 1], [20, -1]]) {
    ctx.beginPath();
    ctx.roundRect(lx - 3 + step * ph * 1.5, -10, 6, 10, 3);
    ctx.fill();
  }
  ctx.beginPath(); // his head out ahead
  ctx.ellipse(32, -12 + step, 8, 5, 0.1, 0, TAU);
  ctx.fill();
  ctx.fillRect(22, -14, 10, 6);
  ctx.fillStyle = '#2a1a10';
  circle(ctx, 35, -13 + step, 1.2);
  const g = ctx.createLinearGradient(0, -34, 0, -8);
  g.addColorStop(0, PLATE_L);
  g.addColorStop(1, PLATE_D);
  ctx.fillStyle = g; // the shell
  ctx.beginPath();
  ctx.moveTo(-28, -8);
  ctx.quadraticCurveTo(-26, -34, 0, -36);
  ctx.quadraticCurveTo(26, -34, 28, -8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(78,58,42,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-10, -20, 7, 5, 0, 0, TAU);
  ctx.ellipse(8, -22, 7, 5, 0, 0, TAU);
  ctx.stroke();
  for (const [tx, c] of [[-12, 0], [0, 1], [12, 2]]) { // the tiny town: three striped tents
    ctx.fillStyle = STRIPES[c];
    ctx.beginPath();
    ctx.moveTo(tx - 5, -33 + Math.abs(tx) * 0.12);
    ctx.lineTo(tx, -42 + Math.abs(tx) * 0.12);
    ctx.lineTo(tx + 5, -33 + Math.abs(tx) * 0.12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
