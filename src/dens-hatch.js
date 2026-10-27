// Docs: docs/combat/bosses.md, docs/places/coast.md
// The Smoking Coast's boss den (The Buried Clutch), its way in on the nesting sand at the Coast's far west end
// (a low hollow dug into the warm sand bank, steam seeping out), and the Hatchkeeper herself: a great black marine
// iguana, older than anyone, salt-crusted, a shard glinting under her crest. Her story: story/characters/bosses.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must
// NOT import dens.js: the few helpers it needs are copied below. The shared boss effects take her theme ('hatch':
// FXPAL in dens.js). Two looks of her own that dens.js hands over by theme: her Boiling Sand (the `spores` ult:
// HATCH_ULT, the sand boiling everywhere but the tide-wet patches) and her freeing (drawHatchFreed, run from the
// den's bossDie: the eggs crack and the little ones run down to the sea).
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND, SAFE_R, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const NEST_X = 780; // the clutch, buried in the middle of the cove
const SEA_X = DEN_W - 170; // where the sand runs down into the surf (the little ones run for it)
const EGGS = [-128, -96, -62, -30, 4, 36, 70, 102, 132].map((dx, i) => ({ dx, s: 0.85 + ((i * 37) % 10) / 30, tilt: ((i * 53) % 11 - 5) / 30 }));
export const HATCH_FREED_S = 9; // how long the freeing plays (the den's bossDie lasts this long)
const ROCK = '#2e2a32', ROCK_D = '#1a171e', ROCK_L = '#4a4450';
const SAND = '#2a2426', SAND_L = '#3e3436';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);
const ease = (k) => 1 - (1 - k) ** 3;

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
function safeTag(ctx, x, y, time, rgb) {
  const bounce = Math.abs(Math.sin(time * 5)) * 4;
  ctx.fillStyle = `rgba(${rgb},0.95)`;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 24, y - 11 - bounce, 48, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'SAFE', x, y - 0.5 - bounce, 12, '#163a4a');
}

// Freed: the den shows the broken shells until she's back (set from drawHatchFreed, read by the den's art)
let freedPending = false, freedAt = -1e9;

// ——— the den: a cove under the old sea cliff, black sand, the clutch buried in the middle, the surf at the far end ———
const columns = (() => {
  const r = mulberry32(5701);
  const out = [];
  for (let x = -40; x < 640; x += 26 + r() * 14) out.push({ x, w: 22 + r() * 12, top: 40 + r() * 90 });
  return out;
})();
const specks = (() => {
  const r = mulberry32(5711);
  return Array.from({ length: 160 }, () => ({ x: r() * DEN_W, y: GROUND + 4 + r() * 60, p: r() * TAU }));
})();
const wisps = (() => {
  const r = mulberry32(5721);
  return Array.from({ length: 10 }, () => ({ x: NEST_X - 160 + r() * 320, p: r(), s: 0.7 + r() * 0.6 }));
})();

function drawDenHatch(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const broken = time - freedAt < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // a low hazy sky, the island's smoke leaning over it
  ctx.fillStyle = vgrad(ctx, 'bg-hatch', 0, GROUND, [[0, '#4e4448'], [0.45, '#8a7470'], [0.8, '#c4a08a'], [1, '#d8b49a']]);
  ctx.fillRect(L, 0, R - L, H);
  ctx.fillStyle = 'rgba(60,52,56,0.35)';
  for (let i = 0; i < 6; i++) ellipse(ctx, 200 + i * 230 + Math.sin(time * 0.1 + i) * 20, 40 + (i % 3) * 18, 170, 34);
  // the open sea behind, grey-green, nothing on it
  ctx.fillStyle = vgrad(ctx, 'sea-hatch', GROUND - 170, GROUND, [[0, '#7a8a84'], [1, '#3e4e4c']]);
  ctx.fillRect(L, GROUND - 170, R - L, 170);
  ctx.strokeStyle = 'rgba(230,236,230,0.25)';
  ctx.lineWidth = 1.4;
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    const y = GROUND - 150 + ((x * 7) % 100);
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(time * 0.8 + x) * 6, y);
    ctx.lineTo(x + 40 + Math.sin(time * 0.8 + x) * 6, y);
    ctx.stroke();
  }
  // the old sea cliff along the west half: black basalt columns
  for (const c of columns) {
    if (!visible(c.x, c.x + c.w, L, R)) continue;
    const top = c.top + Math.max(0, c.x - 380) * 0.5;
    ctx.fillStyle = (Math.floor(c.x) % 2) ? ROCK : ROCK_L;
    ctx.strokeStyle = ROCK_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x, GROUND);
    ctx.lineTo(c.x, top + 6);
    ctx.lineTo(c.x + c.w * 0.5, top);
    ctx.lineTo(c.x + c.w, top + 6);
    ctx.lineTo(c.x + c.w, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the beach: black sand glittering with glass, warmer (redder) toward the nest
  ctx.fillStyle = vgrad(ctx, 'floor-hatch', GROUND, H, [[0, SAND_L], [0.3, SAND], [1, '#141012']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  for (const s of specks) {
    if (s.x < L || s.x > R) continue;
    const a = 0.25 + 0.25 * Math.sin(time * 2 + s.p);
    ctx.fillStyle = `rgba(170,220,232,${a})`;
    ctx.fillRect(s.x, s.y, 1.6, 1.6);
  }
  if (visible(SEA_X - 60, DEN_W + 40, L, R)) drawSurf(ctx, time);
  if (visible(NEST_X - 260, NEST_X + 260, L, R)) drawNest(ctx, time, broken);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Buried Clutch', 750, time);
  DEN_PLATFORMS.forEach((p) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p));
  ctx.restore();
}

// The far end: the sand running down into warm grey surf, foam coming up and going back
function drawSurf(ctx, time) {
  ctx.fillStyle = 'rgba(62,78,76,0.9)';
  ctx.beginPath();
  ctx.moveTo(SEA_X, GROUND + 2);
  ctx.quadraticCurveTo(SEA_X + 80, GROUND - 4, DEN_W + 40, GROUND - 6);
  ctx.lineTo(DEN_W + 40, H);
  ctx.lineTo(SEA_X + 60, H);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.18 + i / 3) % 1, x = SEA_X + 40 - Math.sin(k * Math.PI) * 50 + i * 40;
    ctx.strokeStyle = `rgba(240,240,232,${0.6 * Math.sin(k * Math.PI)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, GROUND + 6 + i * 10);
    ctx.quadraticCurveTo(x + 60, GROUND + 2 + i * 10, x + 140, GROUND + 8 + i * 10);
    ctx.stroke();
  }
}

// The clutch: a low mound of dark sand kept hot from below (red in its cracks), steam seeping up, the tops of the
// leathery eggs just showing. Freed: split shells lying open on the cooled sand.
function drawNest(ctx, time, broken) {
  const x = NEST_X;
  if (!broken) glow(ctx, x, GROUND, 230, 40, '255,120,70', 0.35 + 0.08 * Math.sin(time * 1.3));
  ctx.fillStyle = broken ? '#34302e' : '#3e2e2c';
  ctx.beginPath();
  ctx.moveTo(x - 200, GROUND + 3);
  ctx.quadraticCurveTo(x - 120, GROUND - 20, x, GROUND - 22);
  ctx.quadraticCurveTo(x + 120, GROUND - 20, x + 200, GROUND + 3);
  ctx.closePath();
  ctx.fill();
  if (!broken) {
    // red cracks in the crust
    ctx.strokeStyle = `rgba(255,120,60,${0.55 + 0.2 * Math.sin(time * 2)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const [a, b] of [[-170, -120], [-60, -10], [40, 90], [120, 170]]) {
      ctx.moveTo(x + a, GROUND - 2);
      ctx.lineTo(x + (a + b) / 2, GROUND - 10);
      ctx.lineTo(x + b, GROUND - 4);
    }
    ctx.stroke();
  }
  for (const e of EGGS) {
    const ex = x + e.dx, ey = GROUND - 12 - (1 - Math.abs(e.dx) / 160) * 8;
    if (broken) drawShell(ctx, ex, ey + 4, e.s, e.tilt);
    else {
      ctx.fillStyle = '#e8dcc4';
      ctx.strokeStyle = '#8a7a64';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 10 * e.s, 13 * e.s, e.tilt, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ellipse(ctx, ex - 3 * e.s, ey - 7 * e.s, 2.4 * e.s, 4 * e.s, e.tilt);
    }
  }
  if (broken) return;
  for (const w of wisps) {
    const k = (time * 0.2 * w.s + w.p) % 1;
    ctx.fillStyle = `rgba(240,234,230,${0.28 * Math.sin(k * Math.PI)})`;
    circle(ctx, w.x + Math.sin(k * 5 + w.p * 9) * 10, GROUND - 16 - k * 110, 6 + k * 14);
  }
}

// a split eggshell lying open on the sand
function drawShell(ctx, x, y, s, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  ctx.fillStyle = '#e8dcc4';
  ctx.strokeStyle = '#8a7a64';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.quadraticCurveTo(-10, -10, -5, -11);
  ctx.lineTo(-2, -6);
  ctx.lineTo(1, -12);
  ctx.lineTo(4, -6);
  ctx.lineTo(7, -11);
  ctx.quadraticCurveTo(11, -8, 11, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,40,36,0.35)';
  ellipse(ctx, 0, -2, 7, 3);
  ctx.restore();
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '255,220,190', 0.4);
  ctx.fillStyle = '#5e4e4a';
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(232,210,190,0.35)'; // daylight up the sand bank
  ellipse(ctx, x, b - 50, 26, 40);
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 44, b - 70);
  ctx.arc(x, b - 70, 44, Math.PI, 0);
  ctx.lineTo(x + 44, b + 2);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 140, 13, '#fff4ea');
}

// The name, burned into a driftwood plank hung from an iron chain
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 70);
  ctx.rotate(Math.sin(time * 0.6) * 0.015);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = '#6a6470';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-tw / 2 + 16, -70);
  ctx.lineTo(-tw / 2 + 16, -18);
  ctx.moveTo(tw / 2 - 16, -70);
  ctx.lineTo(tw / 2 - 16, -18);
  ctx.stroke();
  ctx.fillStyle = '#9a8a7a';
  ctx.strokeStyle = '#4a3e36';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 10);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(74,62,54,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-tw / 2 + 12, -8);
  ctx.lineTo(tw / 2 - 30, -10);
  ctx.moveTo(-tw / 2 + 40, 14);
  ctx.lineTo(tw / 2 - 12, 12);
  ctx.stroke();
  text(ctx, name, 0, 2, 18, '#2a1e1a');
  ctx.restore();
}

// The ledges: slabs of pillow lava wedged into the cliff, rounded the way the sea left them
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = ROCK;
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.quadraticCurveTo(x + w, y + 26, x + w * 0.6, y + 28);
  ctx.quadraticCurveTo(x + w * 0.2, y + 30, x, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ROCK_L;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(238,234,228,0.55)'; // salt where the spray dries
  for (let k = 0; k < 5; k++) ellipse(ctx, x + 18 + (k * (w - 36)) / 4, y + 1, 6, 1.6);
}

export const DEN_ART = { hatch: drawDenHatch };

// ——— the way in on the Coast's nesting sand (feet at groundY) ———
// A low hollow dug into the warm sand bank against the cliff, steam seeping out of it, an egg's top showing at its
// lip; now and then a black snout with a salt-white crust looks out and draws back.
function drawEntranceHatch(ctx, x, groundY, time) {
  const den = Math.max(0, DENS.findIndex((d) => d.theme === 'hatch'));
  const spec = MOBS[DENS[den]?.boss];
  const b = groundY;
  ctx.save();
  // the bank, and the hollow in it
  ctx.fillStyle = '#3a302e';
  ctx.beginPath();
  ctx.moveTo(x - 110, b + 2);
  ctx.quadraticCurveTo(x - 90, b - 96, x, b - 104);
  ctx.quadraticCurveTo(x + 90, b - 96, x + 110, b + 2);
  ctx.closePath();
  ctx.fill();
  glow(ctx, x, b - 30, 70, 50, '255,120,70', 0.35);
  ctx.fillStyle = '#140e10';
  ctx.beginPath();
  ctx.moveTo(x - 50, b + 2);
  ctx.quadraticCurveTo(x - 46, b - 62, x, b - 66);
  ctx.quadraticCurveTo(x + 46, b - 62, x + 50, b + 2);
  ctx.closePath();
  ctx.fill();
  // the snout, looking out every few seconds
  const cyc = (time % 8) / 8, out = cyc < 0.3 ? Math.sin((cyc / 0.3) * Math.PI) : 0;
  if (out > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 50, b - 70, 100, 72);
    ctx.clip();
    ctx.fillStyle = '#26222a';
    ellipse(ctx, x + 10 * out - 20, b - 26, 34, 18);
    ctx.fillStyle = '#e8e4dc';
    ellipse(ctx, x + 10 * out - 16, b - 40, 20, 6);
    ctx.fillStyle = '#e8a040';
    circle(ctx, x + 10 * out - 4, b - 30, 2.6);
    ctx.restore();
  }
  // an egg's top at the lip
  ctx.fillStyle = '#e8dcc4';
  ctx.strokeStyle = '#8a7a64';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x + 64, b - 2, 9, 12, 0.2, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.3 + i / 3) % 1;
    ctx.fillStyle = `rgba(240,234,230,${0.35 * Math.sin(k * Math.PI)})`;
    circle(ctx, x - 20 + i * 20 + Math.sin(k * 5 + i) * 6, b - 60 - k * 70, 6 + k * 12);
  }
  // the warning sign on a post (the way in to a boss): driftwood on an iron stake
  const sx = x + 150;
  ctx.fillStyle = '#4e4a56';
  ctx.beginPath();
  ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(sx, b - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.025 + 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(92, ctx.measureText(name).width + 24);
  ctx.fillStyle = '#8a7a6a';
  ctx.strokeStyle = '#3e322c';
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
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#3e322c');
  ctx.restore();
  ctx.restore();
}

export const ENTRANCE_ART = { hatch: drawEntranceHatch };

// ——— the Hatchkeeper (ctx, w, h, st) => sil, origin at her belly on the floor, +x = facing ———
// A great marine iguana, long and low and black, flank scales gone rust-red with age, a saw of spines down her
// neck and back, a blunt head crusted white with salt, small amber eyes; the long tail drags behind. The shard
// glints under her crest, over the neck (where `weak` puts the weak point). m.warn: she rears her head up and
// opens her mouth; charging: head down, legs going.
function drawHatchkeeper(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying, walking } = st;
  const live = dying < 0.02;
  const breathe = Math.sin(t * 1.4 + seed) * 0.02;
  const rear = warn ? -0.16 : charging ? 0.05 : breathe;
  const step = walking || charging ? Math.sin(t * (charging ? 16 : 7)) : 0;
  const by = -h * 0.3; // body centre line
  const body = () => {
    ctx.moveTo(-w * 0.3, -h * 0.06);
    ctx.bezierCurveTo(-w * 0.28, by - h * 0.34, w * 0.12, by - h * 0.4, w * 0.24, by - h * 0.2);
    ctx.quadraticCurveTo(w * 0.28, by + h * 0.04, w * 0.18, -h * 0.04);
    ctx.lineTo(-w * 0.2, -h * 0.03);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.02, -w * 0.3, -h * 0.06);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    body();
  };
  const dark = rageCol('#2a2630', enr, 0.18), mid = rageCol('#3a3440', enr, 0.18);
  ctx.save();
  // the tail: long, lying along the sand behind her, its tip flicking
  const flick = Math.sin(t * 1.8 + seed) * 6;
  ctx.fillStyle = dark;
  ctx.strokeStyle = '#141018';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, by - h * 0.14);
  ctx.quadraticCurveTo(-w * 0.4, -h * 0.12, -w * 0.5, -h * 0.05 + flick * 0.3);
  ctx.quadraticCurveTo(-w * 0.56, -h * 0.03 + flick, -w * 0.6, -h * 0.06 + flick);
  ctx.quadraticCurveTo(-w * 0.5, -h * 0.0, -w * 0.28, -h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // far legs (behind the body)
  const leg = (lx, ph, far) => {
    const sw = step * (ph ? 1 : -1) * 8;
    ctx.fillStyle = far ? '#1e1a22' : mid;
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(lx - 10, by + h * 0.06);
    ctx.quadraticCurveTo(lx - 18 + sw, -h * 0.12, lx - 14 + sw, -2);
    ctx.lineTo(lx + 8 + sw, -2);
    ctx.quadraticCurveTo(lx + 6, -h * 0.12, lx + 10, by + h * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // claws
    ctx.strokeStyle = '#c8c0b4';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(lx - 10 + sw + i * 7, -2);
      ctx.lineTo(lx - 6 + sw + i * 7, 1);
    }
    ctx.stroke();
  };
  leg(-w * 0.14, 1, true);
  leg(w * 0.12, 0, true);
  // body
  ctx.save();
  ctx.translate(w * 0.2, by);
  ctx.rotate(rear * 0.4);
  ctx.translate(-w * 0.2, -by);
  const g = ctx.createLinearGradient(0, by - h * 0.36, 0, 0);
  g.addColorStop(0, rageCol('#3e3844', enr, 0.2));
  g.addColorStop(0.6, dark);
  g.addColorStop(1, '#1a161e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#141018';
  ctx.lineWidth = 4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // rust-red patches along her flank, and scales
  const r = mulberry32(5741);
  ctx.fillStyle = 'rgba(150,64,48,0.45)';
  for (let i = 0; i < 9; i++) ellipse(ctx, -w * 0.2 + r() * w * 0.36, by - h * 0.1 + r() * h * 0.2, 6 + r() * 10, 3 + r() * 5, r() * 2);
  ctx.fillStyle = 'rgba(90,82,98,0.6)';
  for (let i = 0; i < 30; i++) circle(ctx, -w * 0.24 + r() * w * 0.44, by - h * 0.2 + r() * h * 0.3, 1.4 + r() * 1.6);
  // the crest: a saw of pale spines down her back
  ctx.fillStyle = '#8a8290';
  ctx.strokeStyle = '#2a2630';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 13; i++) {
    const k = i / 12, sx = -w * 0.24 + k * w * 0.44;
    const sy = by - h * 0.26 - Math.sin(k * Math.PI) * h * 0.12 + (k > 0.85 ? (k - 0.85) * h * 0.6 : 0);
    const hh = 8 + Math.sin(k * Math.PI) * 12;
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy + 4);
    ctx.lineTo(sx + 2, sy - hh);
    ctx.lineTo(sx + 6, sy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  // near legs
  leg(-w * 0.18, 0, false);
  leg(w * 0.08, 1, false);
  // the neck and head, raised when she warns
  ctx.save();
  ctx.translate(w * 0.2, by - h * 0.12);
  ctx.rotate(rear + (charging ? 0.1 : 0));
  ctx.fillStyle = mid;
  ctx.strokeStyle = '#141018';
  ctx.lineWidth = 3.5;
  ctx.beginPath(); // the head: blunt, heavy-jawed
  ctx.moveTo(-6, -h * 0.16);
  ctx.quadraticCurveTo(w * 0.1, -h * 0.26, w * 0.2, -h * 0.08);
  ctx.quadraticCurveTo(w * 0.22, h * 0.04, w * 0.16, h * 0.08);
  ctx.lineTo(0, h * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the jaw, dropping open as she warns
  if (warn && live) {
    ctx.fillStyle = '#7a2e34';
    ctx.beginPath();
    ctx.moveTo(w * 0.04, h * 0.06);
    ctx.lineTo(w * 0.17, h * 0.06);
    ctx.lineTo(w * 0.13, h * 0.16);
    ctx.lineTo(w * 0.03, h * 0.13);
    ctx.closePath();
    ctx.fill();
  }
  // the salt crust over her brow and snout (marine iguanas sneeze the salt out; on her it has built up for years)
  ctx.fillStyle = '#ece8e0';
  ctx.beginPath();
  ctx.moveTo(w * 0.02, -h * 0.17);
  ctx.quadraticCurveTo(w * 0.1, -h * 0.26, w * 0.19, -h * 0.1);
  ctx.quadraticCurveTo(w * 0.12, -h * 0.13, w * 0.02, -h * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,192,180,0.8)';
  for (const [sx, sy] of [[0.06, -0.17], [0.1, -0.2], [0.14, -0.16], [0.17, -0.12]]) circle(ctx, w * sx, h * sy, 2.2);
  // the eye
  const ex = w * 0.1, ey = -h * 0.08;
  if (live) {
    ctx.fillStyle = '#e8a040';
    circle(ctx, ex, ey, 5);
    ctx.fillStyle = '#1a1018';
    ellipse(ctx, ex + 0.5, ey, 1.6, 4);
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ex - 8, ey - 6 + (warn ? -2 : 1));
    ctx.lineTo(ex + 7, ey - 7 - (warn ? 2 : 0));
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#e8e4dc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ex - 5, ey);
    ctx.quadraticCurveTo(ex, ey + 3, ex + 5, ey);
    ctx.stroke();
  }
  // the neck spines, and the shard under them
  ctx.fillStyle = '#8a8290';
  ctx.strokeStyle = '#2a2630';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    const sx = -4 + i * 9, sy = -h * 0.17 - i * 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy + 3);
    ctx.lineTo(sx + 1, sy - 14 + i * 2);
    ctx.lineTo(sx + 5, sy + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  // the shard (canon: every great beast carries one), lodged under the crest at the root of her neck
  const shx = w * 0.3, shy = -h * 0.62; // (MOBS.hatchkeeper.weak)
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, shx, shy, 24, 20, '255,190,120', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#ffe0b0' : '#c8b8a8';
  ctx.strokeStyle = '#b8743a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shx - 2, shy - 10);
  ctx.lineTo(shx + 7, shy - 1);
  ctx.lineTo(shx + 2, shy + 7);
  ctx.lineTo(shx - 6, shy - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // a sneeze of salt now and then (what marine iguanas do)
  const pk = (t * 0.2 + seed) % 1;
  if (live && pk < 0.18) {
    const k = pk / 0.18, nx = w * 0.4, ny = by - h * 0.18;
    ctx.fillStyle = `rgba(240,236,228,${0.8 * (1 - k)})`;
    for (let i = 0; i < 6; i++) circle(ctx, nx + k * (20 + i * 8), ny - k * (10 + (i % 3) * 8) + k * k * 20, 2.2 - k);
  }
  ctx.restore();
  return sil;
}

export const BOSS_ART = { hatchkeeper: drawHatchkeeper };

// ——— Boiling Sand (her `spores` ult): the sand boils everywhere but the tide-wet patches (SAFE_R round each) ———
// dens.js runs these for theme 'hatch' in place of the spores fog. k: 0 → 1 over the warning / the hit.
function heatPath(ctx, safe) {
  ctx.beginPath();
  ctx.rect(-40, -10, DEN_W + 80, H + 20);
  for (const sx of safe) {
    ctx.moveTo(sx + SAFE_R + 12, GROUND - 40);
    ctx.ellipse(sx, GROUND - 40, SAFE_R + 12, 130, 0, 0, TAU);
  }
}
// a patch of tide-wet sand: dark and shining, a lip of foam round it, a little water lying in the middle
function wetPatches(ctx, safe, time, a) {
  for (const sx of safe) {
    ctx.globalAlpha = a;
    ctx.fillStyle = '#1e2a2c';
    ellipse(ctx, sx, GROUND + 4, SAFE_R, 16);
    ctx.fillStyle = 'rgba(120,170,176,0.55)';
    ellipse(ctx, sx + Math.sin(time * 1.5) * 6, GROUND + 3, SAFE_R * 0.55, 6);
    ctx.strokeStyle = `rgba(244,244,236,${0.7 + 0.3 * Math.sin(time * 5)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx, GROUND + 4, SAFE_R, 16, 0, 0, TAU);
    ctx.stroke();
    const g = ctx.createLinearGradient(0, GROUND - 160, 0, GROUND);
    g.addColorStop(0, 'rgba(150,210,220,0)');
    g.addColorStop(1, 'rgba(150,210,220,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - SAFE_R, GROUND - 160, SAFE_R * 2, 160);
    safeTag(ctx, sx, GROUND - 120, time, '140,220,236');
    ctx.globalAlpha = 1;
  }
}
function bubbles(ctx, e, a, big) {
  for (let i = 0; i < 60; i++) {
    const bx = (i * 173.3) % DEN_W, ph = (e.t * (1.4 + (i % 4) * 0.3) + i * 0.37) % 1;
    const r = (big ? 5 : 3) + (i % 3) * 2;
    ctx.fillStyle = `rgba(255,${150 + (i % 3) * 30},90,${a * (1 - ph)})`;
    circle(ctx, bx + Math.sin(i) * 10, GROUND + 2 - ph * (big ? 30 : 14), r * (0.5 + ph));
  }
}
const HATCH_ULT = {
  sporesWarn(ctx, e, k) {
    const a = ease(k);
    ctx.save();
    heatPath(ctx, e.safe);
    ctx.clip('evenodd');
    // the sand going red-hot from below, heat shimmer rising
    const g = ctx.createLinearGradient(0, GROUND - 160, 0, GROUND + 20);
    g.addColorStop(0, 'rgba(255,120,60,0)');
    g.addColorStop(1, `rgba(255,110,50,${0.15 + 0.45 * a})`);
    ctx.fillStyle = g;
    ctx.fillRect(-40, GROUND - 160, DEN_W + 80, 200);
    ctx.fillStyle = `rgba(255,96,40,${0.25 + 0.4 * a})`;
    ctx.fillRect(-40, GROUND, DEN_W + 80, 30);
    ctx.strokeStyle = `rgba(255,220,180,${0.12 + 0.2 * a})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const sx = (i * 67.7) % DEN_W, ph = (e.t * 0.8 + i * 0.21) % 1;
      ctx.beginPath();
      ctx.moveTo(sx, GROUND - ph * 140);
      ctx.quadraticCurveTo(sx + 8 * Math.sin(e.t * 6 + i), GROUND - ph * 140 - 20, sx, GROUND - ph * 140 - 40);
      ctx.stroke();
    }
    bubbles(ctx, e, 0.4 + 0.5 * a, false);
    ctx.restore();
    wetPatches(ctx, e.safe, e.t, Math.min(1, k * 4));
  },
  sporesHit(ctx, e, k) {
    const fade = 1 - k;
    ctx.save();
    heatPath(ctx, e.safe);
    ctx.clip('evenodd');
    if (k < 0.2) {
      ctx.fillStyle = `rgba(255,200,140,${0.6 * (1 - k / 0.2)})`;
      ctx.fillRect(-40, 0, DEN_W + 80, H);
    }
    ctx.fillStyle = `rgba(255,90,40,${0.5 * fade})`;
    ctx.fillRect(-40, GROUND - 40, DEN_W + 80, 80);
    bubbles(ctx, e, fade, true);
    // steam bursting up off the sand
    for (let i = 0; i < 26; i++) {
      const sx = (i * 59.3) % DEN_W, j = clamp(k * 1.3 - (i % 5) * 0.05, 0, 1);
      ctx.fillStyle = `rgba(244,238,232,${0.6 * (1 - j)})`;
      circle(ctx, sx, GROUND - 20 - j * 180, 14 + j * 30);
    }
    ctx.restore();
    wetPatches(ctx, e.safe, e.t, fade);
  },
};
export const ULT_LOOKS = { hatch: HATCH_ULT };

// ——— freed: the eggs crack and the little ones run down to the sea (the den's bossDie, HATCH_FREED_S long) ———
const runners = (() => {
  const r = mulberry32(5751);
  return EGGS.flatMap((egg, i) => [0, 1].map((j) => ({ x0: NEST_X + egg.dx + (j ? 6 : -6), at: 1.4 + i * 0.25 + j * 0.4 + r() * 0.3, v: 150 + r() * 70, hop: r() * TAU, s: 0.8 + r() * 0.35 })));
})();
function hatchling(ctx, x, y, s, t, hop) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const st = Math.sin(t * 22 + hop);
  ctx.strokeStyle = '#1a161e';
  ctx.lineWidth = 2;
  ctx.beginPath(); // legs going
  ctx.moveTo(-4, -3);
  ctx.lineTo(-6 + st * 3, 0);
  ctx.moveTo(4, -3);
  ctx.lineTo(6 - st * 3, 0);
  ctx.stroke();
  ctx.fillStyle = '#2e2a34';
  ctx.beginPath(); // tail
  ctx.moveTo(-6, -4);
  ctx.quadraticCurveTo(-14, -4 + st * 2, -18, -2);
  ctx.lineTo(-6, -2);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 0, -5, 8, 3.6);
  ellipse(ctx, 8, -7, 4, 3);
  ctx.fillStyle = '#e8a040';
  circle(ctx, 9, -8, 0.9);
  ctx.restore();
}
export function drawHatchFreed(ctx, e) {
  const tt = e.t;
  if (tt > 3.5) freedPending = true; // (every egg has cracked by now: the den keeps the shells till she's back)
  // the shells splitting, one by one, a tap and then a crack
  for (let i = 0; i < EGGS.length; i++) {
    const egg = EGGS[i], at = 0.6 + i * 0.25, x = NEST_X + egg.dx, y = GROUND - 8;
    if (tt < at) {
      if (tt > at - 0.4) {
        const shake = Math.sin(tt * 60) * 2;
        ctx.fillStyle = '#e8dcc4';
        ctx.strokeStyle = '#8a7a64';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(x + shake, y - 4, 10 * egg.s, 13 * egg.s, egg.tilt, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
      }
      continue;
    }
    drawShell(ctx, x, y + 2, egg.s, egg.tilt);
    const j = clamp((tt - at) / 0.5, 0, 1);
    if (j < 1) {
      ctx.fillStyle = `rgba(232,220,196,${1 - j})`;
      for (let p = 0; p < 4; p++) circle(ctx, x + (p - 1.5) * 8 * j, y - 14 - 20 * j + 30 * j * j, 2.4);
    }
  }
  // the little ones, running for the surf; a splash where each one goes in
  for (const r of runners) {
    const age = tt - r.at;
    if (age < 0) continue;
    const x = r.x0 + age * r.v;
    if (x < SEA_X + 60) hatchling(ctx, x, GROUND + 2 - Math.abs(Math.sin(age * 9 + r.hop)) * 3, r.s, tt, r.hop);
    else {
      const j = (x - SEA_X - 60) / r.v / 0.5;
      if (j < 1) {
        ctx.strokeStyle = `rgba(244,244,236,${0.8 * (1 - j)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(SEA_X + 60 + (r.x0 - NEST_X) * 0.2, GROUND + 6, 6 + 14 * j, 2 + 3 * j, 0, 0, TAU);
        ctx.stroke();
      }
    }
  }
}
