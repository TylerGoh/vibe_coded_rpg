// Docs: docs/combat/bosses.md, docs/places/stormroad.md
// The Storm Road's party den (the Storm's Eye, atlas Phase 9 A4), its way in at the road's east end (the Red Wall's front,
// a storm standing from the sand to the sky, the road's marker stones going on into it, a parting in the churn where the
// road goes in), and the Red Wall itself: the storm's heart, a towering column of red sand with two dark hollows for eyes,
// the caravan it swallowed an age ago going round and round it, tents and packs and lanterns and the shapes of pack-beasts,
// and the shard in its heart. Holding on: the caravan it took. The plan: story/phase9-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT import
// dens.js: the few helpers it needs are copied below. The shared boss effects take its theme ('storm': FXPAL in dens.js).
// Its ultimate, The Wall Comes On, is the shared `wave` ult drawn as the storm's front rolling the length of the den
// (ULT_LOOKS: jump it or get up on a ledge). Its freeing (drawStormFreed, run from the den's bossDie): the wind drops, the
// caravan's things come down out of the air onto the sand, and the red thins to a blue sky.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';

const GROUND = FIELD_GROUND;
export const STORM_FREED_S = 8; // how long the freeing plays (the den's bossDie lasts this long)
const SAND = '#c8603e', SAND_D = '#7a2e1c', SAND_L = '#e8946a';
const STONE = '#b8684a', STONE_D = '#6a3424', STONE_L = '#d88e66';
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
function ease(k) {
  return k * k * (3 - 2 * k);
}
// one of the caravan's things, going round: a tent, a pack, a lantern, a pack-beast's shape, a scrap of striped cloth
function thing(ctx, kind, x, y, s, rot, a = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.globalAlpha *= a;
  if (kind === 0) { // a tent
    ctx.fillStyle = '#a84a30';
    ctx.beginPath();
    ctx.moveTo(-18, 10);
    ctx.lineTo(0, -14);
    ctx.lineTo(18, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(232,180,110,0.8)';
    ctx.fillRect(-8, -2, 16, 3);
  } else if (kind === 1) { // a pack, strapped
    ctx.fillStyle = '#6a4024';
    ctx.beginPath();
    ctx.roundRect(-12, -8, 24, 16, 5);
    ctx.fill();
    ctx.fillStyle = '#d8a84a';
    ctx.fillRect(-12, -2, 24, 3);
  } else if (kind === 2) { // a lantern, still lit
    ctx.fillStyle = 'rgba(255,184,74,0.4)';
    circle(ctx, 0, 0, 12);
    ctx.fillStyle = '#e8a040';
    ctx.fillRect(-4, -6, 8, 11);
  } else if (kind === 3) { // a pack-beast's shape, a lizard with its pack on
    ctx.fillStyle = 'rgba(90,40,24,0.75)';
    ellipse(ctx, 0, 0, 20, 8);
    ellipse(ctx, 18, -4, 7, 5);
    ctx.fillRect(-26, -2, 10, 3);
    ctx.fillStyle = 'rgba(106,64,36,0.8)';
    ctx.beginPath();
    ctx.roundRect(-8, -14, 16, 8, 3);
    ctx.fill();
  } else { // a scrap of striped cloth
    ctx.fillStyle = '#c8583a';
    ctx.fillRect(-14, -5, 28, 10);
    ctx.fillStyle = '#e8aa5a';
    ctx.fillRect(-14, -1, 28, 3);
  }
  ctx.restore();
}

// Freed: the wind has dropped and the caravan's things lie on the sand, until it's back
let freedPending = false, freedAt = -1e9;

// ——— the den: the storm's eye, a calm well of hot red air ringed by the storm's wall going round from the sand to the sky,
// a disc of dim sun straight overhead; the old road's stones under the drifts; the caravan going round in the wall, tents and
// packs and lanterns and pack-beasts; the ledges are wagons the storm set down on marker stones ———
const ORBIT = (() => {
  const r = mulberry32(9811);
  return Array.from({ length: 26 }, (_, i) => ({ k: i % 5, y: 60 + r() * 300, ph: r() * TAU, v: 0.15 + r() * 0.2, s: 0.8 + r() * 0.9 }));
})();
const DRIFTS = (() => {
  const r = mulberry32(9813);
  return Array.from({ length: 40 }, () => ({ x: r() * DEN_W, y: GROUND + 10 + r() * 70, w: 30 + r() * 50 }));
})();
const LANDED = (() => { // where the things come down, freed
  const r = mulberry32(9817);
  return Array.from({ length: 14 }, (_, i) => ({ k: i % 5, x: 80 + i * 100 + r() * 50, rot: (r() - 0.5) * 0.6, s: 0.9 + r() * 0.5 }));
})();

function drawDenStorm(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freed = time - freedAt < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // the eye's sky, red and close, a dull sun straight overhead (blue and open once freed)
  ctx.fillStyle = freed
    ? vgrad(ctx, 'bg-storm-f', 0, GROUND, [[0, '#3a78c0'], [0.5, '#a8c8e0'], [1, '#e8c8a0']])
    : vgrad(ctx, 'bg-storm', 0, GROUND, [[0, '#5a1e16'], [0.4, '#a8462e'], [1, '#d8865a']]);
  ctx.fillRect(L, 0, R - L, H);
  ctx.fillStyle = freed ? 'rgba(255,252,236,0.9)' : 'rgba(255,214,170,0.45)';
  circle(ctx, DEN_W / 2, 46, freed ? 18 : 24);
  glow(ctx, DEN_W / 2, 46, 160, 90, freed ? '255,250,226' : '255,170,120', freed ? 0.4 : 0.3);
  if (!freed) {
    // the storm's wall going round, far back: rolls of red sand
    for (let i = 0; i < 14; i++) {
      const y = 40 + i * 26, ph = time * (0.25 + (i % 3) * 0.08) + i;
      for (let j = 0; j < 5; j++) {
        const x = ((j * 380 + time * (40 + i * 6) + i * 90) % (DEN_W + 400)) - 200;
        if (!visible(x - 160, x + 160, L, R)) continue;
        ctx.fillStyle = `rgba(${(i + j) % 2 ? '200,96,62' : '150,56,36'},0.35)`;
        ellipse(ctx, x, y + Math.sin(ph + j) * 8, 150, 16);
      }
    }
    // the caravan going round in it, little and dim far back
    for (const o of ORBIT) {
      const x = (((o.ph / TAU) * (DEN_W + 300) + time * 60 * o.v * 2) % (DEN_W + 300)) - 150;
      if (!visible(x - 30, x + 30, L, R)) continue;
      thing(ctx, o.k, x, o.y + Math.sin(time * o.v * 3 + o.ph) * 14, o.s * 0.8, time * o.v * 2 + o.ph, 0.55);
    }
  } else {
    ctx.fillStyle = '#e8b07a'; // the dunes all round, still
    for (let x = -100; x < DEN_W + 200; x += 260) if (visible(x - 200, x + 200, L, R)) ellipse(ctx, x, GROUND - 40, 200, 70);
  }
  // the floor: red sand drifted over the old road's stones
  ctx.fillStyle = vgrad(ctx, 'floor-storm', GROUND, H, [[0, '#e0a470'], [0.4, '#b8704a'], [1, '#7a3e26']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#eab27c';
  ctx.fillRect(L, GROUND - 4, R - L, 6);
  ctx.fillStyle = 'rgba(200,160,120,0.5)'; // the road's stones under it
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) if ((x / 46) % 5 !== 2) ctx.fillRect(x + 3, GROUND + 8, 40, 8);
  ctx.strokeStyle = 'rgba(150,72,46,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const d of DRIFTS) {
    if (!visible(d.x, d.x + d.w, L, R)) continue;
    ctx.moveTo(d.x, d.y);
    ctx.quadraticCurveTo(d.x + d.w / 2, d.y - 3, d.x + d.w, d.y);
  }
  ctx.stroke();
  if (freed) for (const t of LANDED) if (visible(t.x - 30, t.x + 30, L, R)) thing(ctx, t.k, t.x, GROUND - 6, t.s, t.rot);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, time, freed);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? "The Storm's Eye", 750, time, freed);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: a boss's moving arena, src/challenge.js)
  if (!freed) { // grit blowing across the whole eye, low
    ctx.strokeStyle = 'rgba(255,200,150,0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const y = 120 + ((i * 83) % 320), k = (time * (0.4 + (i % 4) * 0.12) + i * 0.31) % 1;
      const x = L + k * (R - L);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 34, y - 2);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawExit(ctx, time, freed) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '255,236,200', 0.35);
  ctx.fillStyle = freed ? 'rgba(232,200,150,0.5)' : 'rgba(255,214,170,0.35)'; // the way back out through the wall, a paler streak
  ctx.beginPath();
  ctx.moveTo(x - 40, b + 2);
  ctx.quadraticCurveTo(x - 50, b - 80, x - 20, b - 150);
  ctx.lineTo(x + 20, b - 150);
  ctx.quadraticCurveTo(x + 50, b - 80, x + 40, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE; // a marker stone at the way out
  ctx.beginPath();
  ctx.roundRect(x + 32, b - 44, 14, 46, [6, 6, 1, 1]);
  ctx.fill();
  ctx.fillStyle = 'rgba(62,90,154,0.6)';
  ctx.fillRect(x + 32, b - 34, 14, 3);
  text(ctx, 'OUT', x, b - 170, 13, freed ? '#4a2a1a' : '#fff0e0');
}

// The name, on a caravan's painted board caught on a pole the storm drove into the sand, a striped rag tied to it
function drawBanner(ctx, name, x, time, freed) {
  ctx.save();
  ctx.translate(x, 96);
  ctx.rotate(freed ? 0.02 : Math.sin(time * 1.3) * 0.03);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = '#4a2c1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(0, -20);
  ctx.stroke();
  ctx.fillStyle = '#c89a6a';
  ctx.strokeStyle = '#6a3a22';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,88,58,0.8)'; // a stripe of caravan paint along it
  ctx.fillRect(-tw / 2 + 6, 14, tw - 12, 5);
  text(ctx, name, 0, 1, 18, '#3a1e12');
  ctx.fillStyle = '#c8583a'; // a rag on the pole
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.quadraticCurveTo(16 + (freed ? 0 : Math.sin(time * 6) * 4), -60, 24, -50);
  ctx.lineTo(2, -48);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The ledges: wagon beds the storm set down across pairs of marker stones
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  for (const bx of [x + 18, x + w - 34]) {
    ctx.beginPath();
    ctx.roundRect(bx, y + 6, 16, GROUND - y - 4, [6, 6, 1, 1]);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#8a5a3a';
  ctx.strokeStyle = '#4a2c1a';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 14, 3);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(74,44,26,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 20; k < w; k += 22) {
    ctx.moveTo(x + k, y - 3);
    ctx.lineTo(x + k, y + 9);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(234,178,124,0.8)'; // sand drifted on it
  ellipse(ctx, x + w * 0.3, y - 3, w * 0.18, 3);
}

export const DEN_ART = { storm: drawDenStorm };

// ——— the way in at the Storm Road's east end (feet at groundY) ———
// The Red Wall's front, close: a storm standing from the sand to the sky, the road's last marker stones going into it, and a
// parting in the churn where the road goes in, sand pulling in toward it along the ground; now and then a shape goes by
// deep inside (a tent turning over, a pack-beast)
function drawEntranceStorm(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  ctx.fillStyle = 'rgba(120,40,26,0.85)'; // the parting, darker, going in
  ctx.beginPath();
  ctx.moveTo(x - 56, b);
  ctx.quadraticCurveTo(x - 70, b - 100, x - 30, b - 190);
  ctx.quadraticCurveTo(x, b - 210, x + 30, b - 190);
  ctx.quadraticCurveTo(x + 70, b - 100, x + 56, b);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  const k = (time * 0.12) % 1; // a shape going by inside
  if (k < 0.4) thing(ctx, Math.floor(time * 0.12) % 5, x - 60 + (k / 0.4) * 120, b - 110 + Math.sin(k * 9) * 20, 1.2, k * 6, 0.5);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,200,150,0.5)'; // sand pulling in along the ground toward it
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const kk = (time * 0.8 + i * 0.13) % 1, side = i % 2 ? 1 : -1;
    const sx = x + side * (160 - kk * 120);
    ctx.moveTo(sx, b - 4 - (i % 3) * 6);
    ctx.lineTo(sx - side * 22, b - 4 - (i % 3) * 6);
  }
  ctx.stroke();
  ctx.fillStyle = STONE; // the last marker stones, going in
  for (const [dx, h, a] of [[-120, 40, 1], [-84, 34, 0.8], [-50, 28, 0.5]]) {
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.roundRect(x + dx - 7, b - h, 14, h, [6, 6, 1, 1]);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
export const ENTRANCE_ART = { storm: drawEntranceStorm };

// ——— the Red Wall (ctx, w, h, st) => sil, origin at its foot on the floor, +x = facing ———
// A towering column of red sand narrowing to a skirt of dust at its foot, wider at the shoulders, bands of sand going round
// it; two dark hollows for eyes and a long dark mouth; two arms of streaming sand; the caravan it took going round it (in
// front on one half of the turn, behind on the other); the shard in its heart (the weak point, in front), a hot glow round
// it. m.warn: it draws itself up and in, spinning faster, the arms up; charging: it leans in, the dust streaming back.
// st.still: freed, it sinks down into a heap of sand.
function drawRedWall(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02 && !st.still;
  const spin = t * (1.4 + (warn ? 2 : 0) + (charging ? 1 : 0)) + seed;
  const lean = charging ? 0.16 : warn ? -0.04 : Math.sin(t * 0.6 + seed) * 0.03;
  const draw = warn ? 0.9 : 1; // drawn in on a warning
  const sink = st.still ? 0.4 : 1;
  const half = (y) => w * draw * (0.16 + 0.34 * Math.sin(Math.min(1, y / (h * 0.86)) * Math.PI * 0.62)); // width at height y
  const cx = (y) => lean * y;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-half(0), 0);
    for (let y = 0; y <= h * sink; y += h / 10) ctx.lineTo(cx(y) - half(y), -y);
    ctx.quadraticCurveTo(cx(h * sink), -h * sink - h * 0.08, cx(h * sink) + half(h * sink), -h * sink);
    for (let y = h * sink; y >= 0; y -= h / 10) ctx.lineTo(cx(y) + half(y), -y);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(90,30,20,0.25)';
  ellipse(ctx, 0, 0, w * 0.55, 9);
  // the caravan going round behind it
  const ring = (front) => {
    for (let i = 0; i < 7; i++) {
      const a = spin * 0.6 + i * (TAU / 7), y = h * sink * (0.2 + (i % 4) * 0.2), s = Math.sin(a);
      if ((s > 0) !== front) continue;
      const x = cx(y) + Math.cos(a) * (half(y) + 26);
      thing(ctx, i % 5, x, -y + s * 8, 0.9 + (i % 3) * 0.2, a, front ? 1 : 0.45);
    }
  };
  ring(false);
  // the arms: two long streams of sand reaching out, up on a warning
  ctx.strokeStyle = rageCol(SAND, enr, 0.2);
  ctx.lineCap = 'round';
  for (const s of [1, -1]) {
    const ay = -h * sink * 0.6, up = warn ? -h * 0.3 : charging ? -h * 0.05 : Math.sin(t * 1.2 + s) * 10;
    ctx.lineWidth = 22;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(cx(h * 0.6) + s * half(h * 0.6) * 0.7, ay);
    ctx.quadraticCurveTo(cx(h * 0.6) + s * (half(h * 0.6) + 50), ay + 10 + up * 0.5, cx(h * 0.6) + s * (half(h * 0.6) + 80), ay + 40 + up);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // the column
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, rageCol(SAND_L, enr, 0.2));
  g.addColorStop(0.5, rageCol(SAND, enr, 0.2));
  g.addColorStop(1, SAND_D);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  for (let i = 0; i < 14; i++) { // the bands of sand going round
    const y = (i + 0.5) * (h * sink / 14), ph = spin * (1 + i * 0.04);
    ctx.strokeStyle = `rgba(${i % 2 ? '248,180,130' : '120,40,26'},0.45)`;
    ctx.lineWidth = 4 + (i % 3) * 2;
    ctx.beginPath();
    ctx.ellipse(cx(y), -y, half(y), 6 + y * 0.02, 0, ph % TAU, (ph % TAU) + Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  // the shard in its heart, a hot glow round it (the weak point)
  const sx = w * 0.08 + cx(h * 0.46), sy = -h * 0.46 * sink;
  if (live) glow(ctx, sx, sy, 44, 44, '255,200,150', 0.4 + 0.25 * Math.sin(t * 3));
  ctx.fillStyle = '#e8f6ff';
  ctx.strokeStyle = '#6a9ac8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 13);
  ctx.lineTo(sx + 8, sy);
  ctx.lineTo(sx, sy + 10);
  ctx.lineTo(sx - 7, sy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the face: two dark hollows and a long dark mouth, high up
  const fy = -h * sink * 0.78, fx = cx(h * 0.78) + w * 0.06;
  ctx.fillStyle = live ? (enr ? '#3a0806' : '#3a120c') : 'rgba(90,40,26,0.6)';
  ellipse(ctx, fx - w * 0.09, fy, w * 0.04, warn ? h * 0.025 : h * 0.04);
  ellipse(ctx, fx + w * 0.09, fy, w * 0.04, warn ? h * 0.025 : h * 0.04);
  ctx.beginPath();
  ctx.ellipse(fx, fy + h * 0.08, w * (warn ? 0.1 : 0.06), h * (warn ? 0.05 : 0.02), 0, 0, TAU);
  ctx.fill();
  if (live && enr) {
    ctx.fillStyle = 'rgba(255,120,80,0.8)';
    circle(ctx, fx - w * 0.09, fy, 2.4);
    circle(ctx, fx + w * 0.09, fy, 2.4);
  }
  ring(true);
  if (charging) { // dust streaming back
    ctx.fillStyle = 'rgba(232,160,110,0.55)';
    for (let i = 0; i < 7; i++) ellipse(ctx, -w * 0.5 - i * 18, -10 - (i % 3) * 30, 24 - i * 2, 9 - i);
  }
  ctx.restore();
  return body;
}
export const BOSS_ART = { red_wall: drawRedWall };

// ——— The Wall Comes On: the `wave` ult drawn as the storm's front rolling the length of the den (jump it, or get up on a
// ledge) ———
const STORM_ULT = {
  waveWarn(ctx, e, k) {
    const { x0, dir } = e, y = GROUND;
    const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
    ctx.fillStyle = `rgba(200,96,62,${0.08 + 0.14 * pulse})`; // the lane it will sweep, darkening
    ctx.fillRect(-20, y - 140, DEN_W + 40, 142);
    // the front gathering behind the boss, a wall of red rising off the sand
    const ht = 150 * ease(k);
    const g = ctx.createLinearGradient(0, y - ht, 0, y);
    g.addColorStop(0, 'rgba(232,150,100,0.2)');
    g.addColorStop(1, 'rgba(150,56,36,0.85)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - dir * 80, y);
    ctx.quadraticCurveTo(x0 - dir * 60, y - ht, x0 + dir * 10, y - ht * 0.9);
    ctx.lineTo(x0 + dir * 30, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255,200,150,${0.3 + 0.4 * k})`; // sand pulled back toward it along the floor
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const kk = (e.t * 1.4 + i * 0.13) % 1, xx = x0 + dir * (40 + (1 - kk) * 300);
      ctx.moveTo(xx, y - 4 - (i % 3) * 8);
      ctx.lineTo(xx - dir * 24, y - 4 - (i % 3) * 8);
    }
    ctx.stroke();
  },
  waveGo(ctx, e) {
    const x = e.x0 + e.dir * e.speed * e.t, top = GROUND - 140;
    const g = ctx.createLinearGradient(x - e.dir * 120, 0, x, 0);
    g.addColorStop(0, 'rgba(150,56,36,0)');
    g.addColorStop(1, 'rgba(150,56,36,0.9)');
    ctx.fillStyle = g; // the front, a rolling wall of red sand
    ctx.beginPath();
    ctx.moveTo(x - e.dir * 120, GROUND);
    ctx.lineTo(x - e.dir * 120, top + 10);
    ctx.quadraticCurveTo(x - e.dir * 30, top - 14, x + e.dir * 10, top + 20);
    ctx.quadraticCurveTo(x + e.dir * 24, GROUND - 60, x + e.dir * 8, GROUND);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 5; i++) { // its churn, rolling over
      const a = e.t * 6 + i * 1.3;
      ctx.fillStyle = `rgba(${i % 2 ? '232,150,100' : '170,70,46'},0.6)`;
      ellipse(ctx, x - e.dir * (20 + i * 18), top + 20 + i * 22 + Math.sin(a) * 6, 34, 14);
    }
    for (let i = 0; i < 3; i++) thing(ctx, i, x - e.dir * (40 + i * 30), top + 30 + i * 30, 0.9, e.t * 4 + i, 0.8); // the caravan's things in it
  },
};
export const ULT_LOOKS = { storm: STORM_ULT };

// ——— freed: the wind drops; the caravan's things come down out of the air onto the sand; the red thins to a blue sky (the
// den's bossDie, STORM_FREED_S long) ———
const FALL = (() => {
  const r = mulberry32(9819);
  return Array.from({ length: 12 }, (_, i) => ({ k: i % 5, x: 100 + r() * 1300, d: r() * 2.4, v: 0.6 + r() * 0.5, spin: (r() - 0.5) * 4 }));
})();
export function drawStormFreed(ctx, e) {
  const tt = e.t;
  if (tt > 2.5) freedPending = true;
  ctx.save();
  const a = 1 - clamp((tt - STORM_FREED_S + 1.4) / 1.4, 0, 1);
  ctx.fillStyle = `rgba(200,96,62,${0.35 * (1 - clamp(tt / 3, 0, 1)) * a})`; // the red thinning
  ctx.fillRect(-20, 0, DEN_W + 40, GROUND);
  for (const f of FALL) { // things coming down, slower and slower, onto the sand
    const k = clamp((tt - f.d) / (3 / f.v), 0, 1);
    if (k <= 0) continue;
    const y = 60 + (GROUND - 66) * ease(k);
    thing(ctx, f.k, f.x + Math.sin(tt * 1.2 + f.d) * 20 * (1 - k), y, 1.1, f.spin * (1 - k) * tt, a);
  }
  ctx.restore();
}
