// Docs: docs/combat/bosses.md, docs/places/stillmere.md
// The Still Mere's boss den (the Eel Pit, atlas Phase 8 L2), its way in at the Gullet (a ring of old eel-trap stakes
// round a round patch of black water that turns slowly, a glow far down, and now and then a great dark back curving
// through it), and Old Gullet himself: an eel older than Wickmere, as long as a street, who swallows every lantern that
// sinks and glows from the inside with all of them. The plan: story/phase8-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT
// import dens.js: the few helpers it needs are copied below. The shared boss effects take his theme ('gullet': FXPAL in
// dens.js); The Undertow is the shared `wave` ult drawn with the Tidemother's water (dens.js waterMass). His freeing
// (drawGulletFreed, run from the den's bossDie): he opens his jaws and the lights go up out of him, out of the pit.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';
import { drawLantern } from './stillmere-art.js';

const GROUND = FIELD_GROUND;
export const GULLET_FREED_S = 7; // how long the freeing plays (the den's bossDie lasts this long)
const STONE = '#3e3a48', STONE_D = '#24202c', STONE_L = '#5a5468';
const EEL = '#2a2832', EEL_D = '#16141c', EEL_L = '#4a4656', INKC = '#2e2a3a';
const LAMP = '255,214,150';
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

// Freed: lights go on rising out of the water for a while after (set from drawGulletFreed)
let freedPending = false, freedAt = -1e9;

// ——— the den: inside the old eel pit, a great round well of stacked stone the fen folk dug long ago to trap eels, its
// walls going up out of sight into mist, lamps on iron hooks round them; black water over the floor, and down under it,
// faint, the lanterns that sank and haven't been swallowed yet ———
const stones = (() => { // the wall's courses
  const r = mulberry32(7801);
  const out = [];
  for (let y = 20; y < GROUND; y += 26) for (let x = -40 - r() * 40; x < DEN_W + 60; x += 60 + r() * 50) out.push({ x, y, w: 50 + r() * 40, s: r() });
  return out;
})();
const hooks = [140, 420, 700, 1080, 1360]; // lamps on iron hooks round the wall
const sunk = (() => { // lanterns lying under the water, glowing faintly
  const r = mulberry32(7811);
  return Array.from({ length: 22 }, () => ({ x: r() * DEN_W, y: GROUND + 20 + r() * 60, s: 0.5 + r() * 0.28, p: r() * TAU, a: (r() - 0.5) * 1.2 }));
})();
const motes = (() => {
  const r = mulberry32(7821);
  return Array.from({ length: 24 }, () => ({ x: r() * DEN_W, y: 80 + r() * 300, p: r() * TAU, s: 0.6 + r() * 0.6 }));
})();

function drawDenGullet(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freedT = time - freedAt, freed = freedT < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // the wall of the pit, stone going up into the mist
  ctx.fillStyle = vgrad(ctx, 'bg-gullet', 0, GROUND, [[0, '#9a90b0'], [0.18, '#4a4458'], [0.6, '#2a2634'], [1, '#1a1822']]);
  ctx.fillRect(L, 0, R - L, H);
  for (const s of stones) {
    if (!visible(s.x, s.x + s.w, L, R)) continue;
    const fade = clamp((s.y - 20) / 200, 0.15, 1);
    ctx.fillStyle = `rgba(${s.s < 0.5 ? '62,58,72' : '74,70,86'},${0.75 * fade})`;
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.w, 22, 7);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(214,212,226,0.22)'; // the mist hanging in the top of the pit
  for (let i = 0; i < 6; i++) ellipse(ctx, 120 + i * 260 + Math.sin(time * 0.2 + i) * 40, 50 + (i % 2) * 20, 200, 30);
  ctx.fillStyle = 'rgba(110,138,78,0.4)'; // a weed line where the water stood higher
  ctx.fillRect(L, GROUND - 120, R - L, 6);
  for (const x of hooks) if (visible(x - 40, x + 40, L, R)) drawHook(ctx, x, time);
  // the water over the floor, black, a sheen on top, the sunk lanterns under it
  ctx.fillStyle = vgrad(ctx, 'floor-gullet', GROUND, H, [[0, '#2a2638'], [0.3, '#16141e'], [1, '#0a0910']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  for (const s of sunk) {
    if (!visible(s.x - 20, s.x + 20, L, R)) continue;
    ctx.save();
    ctx.globalAlpha *= 0.35 + 0.15 * Math.sin(time * 0.7 + s.p);
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    drawLantern(ctx, 0, 0, s.s, freed ? 0.2 : 0.7, time);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(214,204,232,0.22)';
  ctx.beginPath();
  ctx.moveTo(L, GROUND - 2);
  for (let x = Math.floor(L / 24) * 24; x <= R + 24; x += 24) ctx.lineTo(x, GROUND - 2 + Math.sin(x * 0.03 + time) * 0.8);
  ctx.lineTo(R, GROUND + 1);
  ctx.lineTo(L, GROUND + 1);
  ctx.closePath();
  ctx.fill();
  for (const mo of motes) { // mist motes
    if (!visible(mo.x - 10, mo.x + 10, L, R)) continue;
    const y = mo.y + Math.sin(time * 0.5 * mo.s + mo.p) * 12, x = mo.x + Math.sin(time * 0.3 + mo.p) * 20;
    ctx.fillStyle = `rgba(232,228,244,${0.25 + 0.2 * Math.sin(time + mo.p)})`;
    circle(ctx, x, y, 1.5);
  }
  if (freed) drawRisingLights(ctx, L, R, time, freedT); // (after a freeing: the last of them still going up)
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Eel Pit', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: a boss's moving arena, src/challenge.js)
  ctx.restore();
}

// a lamp on an iron hook in the pit wall
function drawHook(ctx, x, time) {
  const y = GROUND - 210;
  ctx.strokeStyle = '#1a1820';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 10);
  ctx.lineTo(x, y - 10);
  ctx.quadraticCurveTo(x + 8, y - 10, x + 6, y);
  ctx.stroke();
  drawLantern(ctx, x + 6, y + 12, 1.4, 1, time);
}

// a few lights still going up out of the water after he let them go, slowly, swaying
function drawRisingLights(ctx, L, R, time, ft) {
  for (let i = 0; i < 14; i++) {
    const period = 9 + (i % 4) * 2;
    const k = ((ft * 0.6 + i * 1.7) % period) / period;
    const x = 100 + ((i * 397) % (DEN_W - 200)) + Math.sin(time * 0.8 + i) * 18;
    if (!visible(x - 20, x + 20, L, R)) continue;
    ctx.save();
    ctx.globalAlpha *= Math.sin(k * Math.PI) * 0.9;
    drawLantern(ctx, x, GROUND - k * (GROUND + 40), 0.9, 1, time);
    ctx.restore();
  }
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 80, 100, 110, '214,212,226', 0.3);
  ctx.strokeStyle = '#4a4058'; // a ladder of stakes up the wall, back up to the mere
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 24, b + 2);
  ctx.lineTo(x - 20, b - 170);
  ctx.moveTo(x + 24, b + 2);
  ctx.lineTo(x + 20, b - 170);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let y = b - 20; y > b - 170; y -= 24) {
    ctx.moveTo(x - 23, y);
    ctx.lineTo(x + 23, y);
  }
  ctx.stroke();
  text(ctx, 'OUT', x, b - 192, 13, '#f0eef8');
}

// The name, painted on a punt's old transom board hung from the wall on two ropes
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 70);
  ctx.rotate(Math.sin(time * 0.5) * 0.012);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = 'rgba(168,154,120,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -70);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = '#4a4058';
  ctx.strokeStyle = '#24202c';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 10);
  ctx.fill();
  ctx.stroke();
  drawLantern(ctx, tw / 2 - 14, -26, 0.9, 1, time);
  text(ctx, name, 0, 3, 18, '#f0e8d4');
  ctx.restore();
}

// The ledges: old stone courses jutting out of the pit wall, wet, a wicker eel trap or two hung under
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x + w, y - 4);
  ctx.lineTo(x + w - 8, y + 16);
  ctx.quadraticCurveTo(x + w / 2, y + 28, x + 8, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.beginPath();
  ctx.roundRect(x, y - 5, w, 7, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(110,138,78,0.6)';
  for (let k = 0; k < 4; k++) ellipse(ctx, x + 16 + (k * (w - 32)) / 3, y - 4, 7, 2);
  ctx.fillStyle = '#7a6a4a'; // an eel trap
  ctx.beginPath();
  ctx.moveTo(x + w * 0.7 - 6, y + 18);
  ctx.lineTo(x + w * 0.7 + 6, y + 18);
  ctx.lineTo(x + w * 0.7 + 1, y + 44);
  ctx.lineTo(x + w * 0.7 - 1, y + 44);
  ctx.closePath();
  ctx.fill();
}

export const DEN_ART = { gullet: drawDenGullet };

// ——— the way in at the Still Mere's Gullet (feet at groundY) ———
// A ring of old eel-trap stakes standing round a round patch of black water; the water turns slowly; far down, a glow;
// now and then a great dark back curves up through it and sinks. A ladder of stakes goes down at the near side.
function drawEntranceGullet(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  glow(ctx, x, b + 10, 120, 40, LAMP, 0.22 + 0.06 * Math.sin(time * 0.8));
  ctx.fillStyle = 'rgba(8,6,14,0.75)'; // the pit's mouth, under the surface
  ctx.beginPath();
  ctx.ellipse(x, b + 6, 96, 12, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(214,204,232,0.3)'; // the slow turn
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const a = time * 0.4 + i * 2.1;
    ctx.beginPath();
    ctx.ellipse(x, b + 6, 30 + i * 26, 4 + i * 3, 0, a, a + 2.4);
    ctx.stroke();
  }
  // the back, now and then
  const k = clamp(Math.sin(time * 0.3) * 2.2 - 1.2, 0, 1);
  if (k > 0) {
    ctx.fillStyle = EEL;
    ctx.beginPath();
    ctx.moveTo(x - 70, b + 4);
    ctx.quadraticCurveTo(x - 10, b - 34 * k, x + 60, b + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = EEL_L;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 40, b - 10 * k);
    ctx.quadraticCurveTo(x - 10, b - 40 * k, x + 30, b - 14 * k);
    ctx.stroke();
    ctx.fillStyle = `rgba(${LAMP},${0.25 * k})`; // lights showing through his skin
    for (const dx of [-30, -6, 18]) ellipse(ctx, x + dx, b - 10 * k, 4, 3);
  }
  // the stakes, in a ring (the far ones shorter)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3, sx = x + Math.cos(a) * 110, far = Math.sin(a) < 0;
    const hh = far ? 40 + (i % 3) * 10 : 70 + (i % 3) * 16;
    ctx.fillStyle = far ? '#3a3446' : '#4a4058';
    ctx.fillRect(sx - 4, b - hh, 8, hh + 4);
    ctx.fillStyle = '#5e5470';
    ctx.fillRect(sx - 5, b - hh - 3, 10, 4);
    if (i === 2 || i === 6) drawLantern(ctx, sx + 8, b - hh + 10, 0.9, 1, time); // two lamps hung on the stakes
  }
  ctx.strokeStyle = '#4a4058'; // the ladder of stakes going down
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 16, b - 24);
  ctx.lineTo(x - 12, b + 14);
  ctx.moveTo(x + 16, b - 24);
  ctx.lineTo(x + 12, b + 14);
  for (let y = b - 18; y < b + 14; y += 9) {
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x + 15, y);
  }
  ctx.stroke();
  ctx.restore();
}
export const ENTRANCE_ART = { gullet: drawEntranceGullet };

// ——— Old Gullet (ctx, w, h, st) => sil, origin under his head on the floor, +x = facing ———
// An eel as thick as a cart and as long as a street: his body comes up out of the water behind him in a great black arch
// and down again to a blunt, heavy head held low over the floor, the jaw hanging a little, a small pale eye. His skin is
// dark but thin, and the swallowed lanterns glow through it from inside, dozens of them, warm; the shard glints among
// them in his belly (where `weak` puts the weak point). m.warn: the jaw drops wide (he's about to come for you);
// charging: the head down and forward, the arch flattening.
function drawOldGullet(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const sw = live ? Math.sin(t * 1.2 + seed) : 0;
  const low = charging ? 0.6 : 1;
  const hx = w * 0.22, hy = -h * 0.42 * low; // the head
  const arch = () => {
    ctx.moveTo(-w * 0.62, 6);
    ctx.bezierCurveTo(-w * 0.62, -h * 1.0 * low, -w * 0.08, -h * (1.02 + sw * 0.03) * low, hx - w * 0.06, hy - h * 0.2);
    ctx.quadraticCurveTo(hx + w * 0.22, hy - h * 0.18, hx + w * 0.3, hy + h * 0.02);
    ctx.quadraticCurveTo(hx + w * 0.22, hy + h * 0.2, hx - w * 0.04, hy + h * 0.2);
    ctx.bezierCurveTo(-w * 0.12, hy + h * 0.24, -w * 0.3, -h * 0.66 * low, -w * 0.36, 6);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    arch();
  };
  const skin = rageCol(EEL, enr, 0.2), skinD = rageCol(EEL_D, enr, 0.2);
  ctx.save();
  // the water ring where he comes up
  ctx.strokeStyle = 'rgba(214,204,232,0.35)';
  ctx.lineWidth = 1.5;
  const k = (t * 0.5 + seed) % 1;
  ctx.beginPath();
  ctx.ellipse(-w * 0.49, 4, 40 + k * 40, 5 + k * 4, 0, 0, TAU);
  ctx.stroke();
  // the body
  ctx.fillStyle = skin;
  ctx.strokeStyle = skinD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  arch();
  ctx.fill();
  ctx.stroke();
  // the lights inside, through the skin (clipped to him)
  ctx.save();
  ctx.beginPath();
  arch();
  ctx.clip();
  const lit = live ? 1 : 0.35;
  glow(ctx, -w * 0.2, -h * 0.5 * low, w * 0.5, h * 0.4, LAMP, 0.35 * lit);
  const r = mulberry32(7831);
  for (let i = 0; i < 16; i++) {
    const u = r(), v = r();
    const lx = -w * 0.5 + u * w * 0.62, ly = -h * (0.15 + v * 0.75) * low;
    ctx.fillStyle = `rgba(255,226,168,${(0.3 + 0.25 * Math.sin(t * 1.5 + i)) * lit})`;
    ctx.fillRect(lx - 3, ly - 4, 6, 8);
  }
  ctx.restore();
  ctx.strokeStyle = EEL_L; // the dorsal fin along the arch
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.58, -h * 0.4 * low);
  ctx.bezierCurveTo(-w * 0.56, -h * 1.08 * low, -w * 0.1, -h * 1.1 * low, hx - w * 0.12, hy - h * 0.24);
  ctx.stroke();
  // the jaw: hangs a little; drops wide on the warn
  const gape = warn ? 0.22 : charging ? 0.14 : 0.05 + 0.02 * sw;
  ctx.fillStyle = '#c8c0d8';
  ctx.beginPath();
  ctx.moveTo(hx + w * 0.3, hy + h * 0.02);
  ctx.quadraticCurveTo(hx + w * 0.14, hy + h * (0.1 + gape), hx - w * 0.04, hy + h * 0.16);
  ctx.lineTo(hx - w * 0.04, hy + h * 0.2);
  ctx.quadraticCurveTo(hx + w * 0.18, hy + h * (0.16 + gape), hx + w * 0.3, hy + h * (0.04 + gape));
  ctx.closePath();
  ctx.fill();
  if (gape > 0.1) { // inside the mouth: the glow of everything he's kept
    ctx.fillStyle = `rgba(${LAMP},0.55)`;
    ctx.beginPath();
    ctx.ellipse(hx + w * 0.14, hy + h * (0.06 + gape * 0.6), w * 0.1, h * gape * 0.4, 0, 0, TAU);
    ctx.fill();
  }
  // the eye: small, pale, old
  const ex = hx + w * 0.14, ey = hy - h * 0.06;
  if (live) {
    ctx.fillStyle = '#e8dca0';
    circle(ctx, ex, ey, 6);
    ctx.fillStyle = INKC;
    circle(ctx, ex + 1.4, ey, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circle(ctx, ex - 1.6, ey - 2, 1.4);
  } else {
    ctx.strokeStyle = '#e8dca0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey - 4); ctx.lineTo(ex + 4, ey + 4);
    ctx.moveTo(ex + 4, ey - 4); ctx.lineTo(ex - 4, ey + 4);
    ctx.stroke();
  }
  // whisker-barbels
  ctx.strokeStyle = skinD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx + w * 0.26, hy + h * 0.02);
  ctx.quadraticCurveTo(hx + w * 0.34, hy + h * 0.12 + sw * 3, hx + w * 0.3, hy + h * 0.24);
  ctx.stroke();
  // the shard (every great beast carries one), among the lights in his belly
  const shx = w * 0.04, shy = -h * 0.34; // (MOBS.old_gullet.weak)
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, shx, shy, 22, 18, '255,236,190', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#fff4d8' : '#b8b0a0';
  ctx.strokeStyle = '#a88a50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shx - 1, shy - 10);
  ctx.lineTo(shx + 7, shy - 1);
  ctx.lineTo(shx + 1, shy + 7);
  ctx.lineTo(shx - 6, shy - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return sil;
}
export const BOSS_ART = { old_gullet: drawOldGullet };
export const ULT_LOOKS = {}; // (The Undertow is the shared `wave` ult with the Tidemother's water: dens.js)

// ——— freed: he opens his jaws and lets them go; the lights rise out of him and out of the pit, slowly, swaying, every
// one of them (the den's bossDie, GULLET_FREED_S long) ———
export function drawGulletFreed(ctx, e) {
  const tt = e.t;
  if (tt > 2) freedPending = true;
  const x0 = (e.x ?? 750) + 40, y0 = GROUND - 70;
  for (let i = 0; i < 36; i++) {
    const start = 0.5 + (i % 12) * 0.35 + Math.floor(i / 12) * 0.12;
    const j = clamp((tt - start) / 4.5, 0, 1);
    if (j <= 0 || j >= 1) continue;
    const spread = ((i * 53) % 37 - 18) * 14;
    const x = x0 + spread * j + Math.sin(tt * 1.4 + i) * 10 * j, y = y0 - j * (GROUND + 60) * (0.7 + (i % 5) * 0.08);
    ctx.save();
    ctx.globalAlpha *= Math.min(1, j * 6) * (1 - Math.max(0, j - 0.8) * 5);
    drawLantern(ctx, x, y, 0.8 + (i % 3) * 0.2, 1, tt);
    ctx.restore();
  }
}
